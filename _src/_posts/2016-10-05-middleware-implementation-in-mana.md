---
layout: post
title:  "Middleware implementation in Mana"
author: andreas
date:   2016-10-05 15:49:42 +0200
categories: [mana, middleware]
hero: /assets/img/posts/squirrel-mana.jpg
summary: "Mana is a C++ web application framework built for IncludeOS. In this post I will explain the concept *middleware*; what it is used for, how we have implemented it and other parts related to it."
---
[Mana](https://github.com/includeos/mana) is a C++ web application framework built for [IncludeOS](https://github.com/hioa-cs/IncludeOS). In this post I will explain the concept *middleware*; what it is used for, how we have implemented it and other parts related to it.

The point of a middleware is to make the server modular by spreading out the responsibilities over many smaller modules. This makes the server very customizable and also opens the opportunity for other developers to easily customize and create their own functionality, which also easily can be shared. The inspiration for this, among other things in the framework, is from [express.js](https://expressjs.com/).

Here's a simplifed cutout of the middleware stack that can be found in our web server [Acorn](https://github.com/includeos/acorn):

![Middleware stack]({{site-url}}/media/mana-middleware.png)

For every incoming HTTP `Request` there will be created and sent one matching HTTP `Response` (1:1). They will get passed down together through some predefined rules (the middleware stack) before they finally get processed by the router.

Middleware makes it possible to reduce repeated code in routes by:

* Modifying the Request and/or the Response.
* Executing specific tasks (e.g. log every response).
* Preemptively sending a Response, and by that exit the cycle early.


## Create and use middleware

A middleware is defined by the simple interface [Middleware](https://github.com/includeos/mana/blob/master/include/mana/middleware.hpp):

```cpp
using Callback = delegate<void(Request_ptr, Response_ptr, Next)>;

class Middleware {
public:
  virtual Callback handler() = 0;

  virtual void on_mount(const std::string& path)
  { mountpath_ = path; }

  virtual ~Middleware() {}

protected:
  std::string mountpath_;
};
```

The only thing required by a middleware is that it:

* Returns a `Callback`; a delegate on how to process a Request-Response pair.
* Inherits the interface so that it can be stored and kept alive by the server using it.

Adding a middleware to the server is just two line of codes:

```cpp
std::shared_ptr<Middleware> parsley = std::make_shared<Parsley>();
server.use(parsley);
```

It is also possible to manage the life-time of the middleware yourself, or if the task has no state, by just using a lambda:

```cpp
server.use([] (auto req, auto res, auto next) {
  log(req); // Log the Request to somewhere
  (*next)();
});
```

## Next: Iterate the middleware stack (async)

Since some of the middleware instructions can be async (i.e I/O operations; retrieve file from disk) it is not possible to iterate over the middlewares in a simple for loop. That's why the middleware itself need to tell when it's done, by calling the next middleware in the stack.

To avoid having the middleware know about the next in line, and to take account for parameters to be sent to the next one, the callable function `next` is injected.

```cpp
using next_t = delegate<void()>;
using Next = std::shared_ptr<next_t>;
```

When a middleware is done processing it simply calls `(*next)();`. By not calling next, the iteration will end and the `next` function will go out of scope. This is what we want when a middleware ended with sending a response, and by that, ending the whole cycle.
When there is no more middleware remaining, `next` will continue to the router.

This is how this is done:

```cpp
void Server::process(Request_ptr req, Response_ptr res) {
  auto it_ptr = std::make_shared<MiddlewareStack::iterator>(middleware_.begin());
  auto next = std::make_shared<next_t>();
  auto weak_next = std::weak_ptr<next_t>(next);

  // setup Next callback
  *next = [this, it_ptr, weak_next, req, res]
  {
```

`next` is setup by creating a shared delegate, which captures an iterator to the first middleware in the stack.

The request and response is also captured - to be passed in when calling the middleware function, and also for setting up the next callback.

At last `next` itself is also captured, this as a `weak_ptr` to avoid self-referencing (been there, done that..).

```cpp
    auto& it = *it_ptr;

    // skip those who do not match
    while(it != middleware_.end() and !path_starts_with(req->uri().path(), it->path))
      it++;
```

We start by checking if the middleware matches the path in the request, skipping those who do not match.
The path on which a middleware is applied is set in the server when assigning it a middleware, and by default this is set to root (`/` - which makes it apply to every incoming request).

```cpp
    if(it != middleware_.end()) {
      // dereference the function
      auto& func = it->callback;
      // advance the iterator for the next next call
      it++;
      auto next = weak_next.lock(); // this should be safe since we're inside next
      // execute the function
      func(req, res, next);
    }
```

If we haven't reached the end, the middleware function is retrieved from the iterator.

Before calling the function, we increment the iterator so the next one calling `next` will get the next middleware's function.

We then create a `shared_ptr` to the current function of the weak copy, to finally call the middleware function with the captured `Request`, `Response` and `Next`.

```cpp
    // no more middleware, proceed with route processing
    else {
      process_route(req, res);
    }
```

If the end is reached, we let the router take over.

```cpp
  };
  // get the party started..
  (*next)();
}
```

At last the next function is called to start the chain going. The full code in the function can be seen [here](https://gist.github.com/AndreasAakesson/5823788da967616d54b3de6384fba949).

## Attributes: Extend a request with arbitrary data

What also makes middleware powerful is the possibility to "extend" the Request with additional data. This data can later be retrieved, changed and processed by other middleware and/or routes further down the stack. For this we have the interface [Attribute](https://github.com/includeos/mana/blob/master/include/mana/attribute.hpp):

```cpp
using AttrType = size_t;

class Attribute {

public:
  template <typename A>
  static AttrType type();

  virtual ~Attribute() {}

private:
  static AttrType next_attr_type() {
    static AttrType counter;
    return ++counter;
  }
};
```

This enables the Attribute to be stored on the Request (`std::map<AttrType, std::shared_ptr<Attribute>>`) and also to "register" every attribute type with a unique id (with the help of `::type()`) by using static reflection.

```cpp
template <typename A>
AttrType Attribute::type() {
  static_assert(std::is_base_of<Attribute, A>::value, "A is not an Attribute");
  static AttrType id = Attribute::next_attr_type();
  return id;
}
```

Every first time `Attribute::type()` is called with a new template parameter it will (static) assert that the class is an actual Attribute, and also increment the id counter, making the next new attribute have a different number.

The call to `type()`, and by that the registration of the attribute, is something the user doesn't have to care about - it is made by the [Request](https://github.com/includeos/mana/blob/master/include/mana/request.hpp) when either an attribute is set or retrieved:

```cpp
template<typename A>
void Request::set_attribute(std::shared_ptr<A> attr) {
  attributes_.insert({Attribute::type<A>(), attr});
}

template<typename A>
std::shared_ptr<A> Request::get_attribute() {
  auto it = attributes_.find(Attribute::type<A>());
  if(it != attributes_.end())
    return std::static_pointer_cast<A>(it->second);
  return nullptr;
}
```

## Example: Support JSON data

An example on handling JSON data to summarize some of the things mentioned in this post (we already have [a module](https://github.com/includeos/json) for this).

A JSON Attribute, using an underlying `rapidjson::Document`:

```cpp
// A JSON attribute, using some kind of underlying Document
class Json : public mana::Attribute {
public:
  const Document& doc() const
  { return doc_; }

private:
  Document doc_;
};
```

A middleware that parses JSON and puts it on the request:

```cpp
class JsonParser : public mana::Middleware {
public:  
  virtual mana::Callback handler() override
  { return {this, &JsonParser::process}; }

  void process(mana::Request_ptr req, mana::Response_ptr, mana::Next) {
  	if(has_json(*req)) {
  	  if(auto json_attr = parse(req->body()))
  	  	req->set_attribute(json_attr);
  	}
  	(*next)();
  }

private:
  // Check HTTP Headers for Content-Type etc.
  bool has_json(mana::Request& req) const;
  // Parse a string to a Document, return a nullptr if fails
  std::shared_ptr<Json> parse(const std::string& json) const;
};
```

Our service.cpp:

```cpp
std::shared_ptr<Middleware> parser = std::make_shared<JsonParser>();
server.use(parser);

// POST /users
router.on_post("/users", [] (auto req, auto res) {
  if(auto json = req->get_attribute<Json>()) {
    // Create user with posted JSON data ...
  }
});
```

Check out [Acorn](https://github.com/includeos/acorn) for a simple web server utilizing more of these modules, and
[Mana](https://github.com/includeos/mana) to see more in detail how these things are implemented. Also check out [our GitHub organization](https://github.com/includeos) for other IncludeOS projects.
