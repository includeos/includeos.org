---
layout: post
title:  "Routing paths in IncludeOS - from JavaScript to C++"
author: annika
date:   2016-10-28 08:30:42 +0200
categories: blog
author-image: /assets/img/authors/annika.jpg
hero: /assets/img/posts/paths.jpg
summary: "In this post I will present how this routing in Mana and IncludeOS works and how you can create your own routes by taking advantage of this library's possibilities."
---
When creating a web application you need to be able to guide your users to the different content on your site. This is done by specifying different routes for your application, f.ex. ```/users```. In [Mana](https://github.com/includeos/mana), the C++ web application framework built for [IncludeOS](https://github.com/hioa-cs/IncludeOS), you can specify these routes as strings, string patterns or regular expressions with help from the library [path_to_regex](https://github.com/includeos/path_to_regex). In this post I will present how this works and how you can create your own routes by taking advantage of this library's possibilities.

Path_to_regex is a port of the most essential functionality in the JavaScript library [pillarjs/path-to-regexp](https://github.com/pillarjs/path-to-regexp). This is the library that [Express](https://expressjs.com), a web framework for [Node.js](https://nodejs.org/en/), uses for matching routes with specific paths. A route can, for example, be ```/users/:id```, where ```:id``` is a so-called named parameter and can be substituted with any given string. A matching path for this route could then be ```/users/2``` or ```/users/elton```. The library creates a regex based on the given route that the developer has specified, and matches this regex with the incoming paths to the website.

Path_to_regex is used by the [Router](https://github.com/includeos/mana/blob/master/include/mana/router.hpp) through the [Route](https://github.com/includeos/mana/blob/master/include/mana/route.hpp) struct, so in your service.cpp file you can define a route by writing:

```cpp
Router router;

// GET /users/:id(\\d+)
router.on_get("/users/:id(\\d+)", [](auto req, auto res) {
  auto id = req->params().get("id");

  // Do actions according to "id"
  if(id == "42")
    // ...

  res->send(true);
});

server.set_routes(router);
```
And the equivalent example in Express.js:

```js
var router = express.Router();

// GET /users/:id(\\d+)
router.get("/users/:id(\\d+)", function(req, res) {
  var id = req.params.id;

  // Do actions according to "id"
  if(id == "42")
    // ...

  res.send();
});
```

Here a regex is included in the route, ```(\\d+)```, which specifies that the id-parameter must consist of one or more digits. Another route could be ```/Feb(ruary)?```, where matching paths are ```/Feb``` and ```/February``` since the ```?``` means zero or one of the character or group before it. The regex is also case insensitive by default, so it will f.ex. also match ```/FEB```. At this time Mana's Router uses this default setting for path_to_regex, but the library has support for taking a few options, among them a bool "sensitive"-option.

To give you a taste of what possibilities lie in the library, a somewhat more complex route example is ```/numbers/:username([a-z]+)/.*phone$/```. The resulting regex will match the paths ```/numbers/elton/personal-phone``` and ```/numbers/samantha/work-phone```, but not ```/numbers/samantha/personal-phone-number```. For more route-examples and information about the library, take a look at path_to_regex's [README](https://github.com/includeos/path_to_regex/blob/master/README.md).

## The implementation
The path2regex namespace contains only a handful of functions. They are all basically independent of each other, but a natural entrypoint, and the function the Route struct calls in its constructor, is

```cpp
std::regex path_to_regex(const std::string& path, Keys& keys, const Options& options = Options{});
```
The keys parameter is an empty vector that will be populated with the path's named parameters, while the function itself returns the resulting regex. To accomplish this, the function calls the other functions in the namespace to: parse the string, fill the keys-vector with the named parameters, and construct the regex:

```cpp
std::regex path_to_regex(const std::string& path, Keys& keys, const Options& options) {
  Tokens all_tokens = parse(path);
  tokens_to_keys(all_tokens, keys); // fill keys with relevant tokens
  return tokens_to_regex(all_tokens, options);
}
```

In Mana's Router the incoming paths are matched with the registered routes (or actually the routes' regexes, returned from calls to the path_to_regex-function). Then if a match is found, the matching route's keys are mapped together with the corresponding path's values for these keys:

```cpp
inline Router::ParsedRoute Router::match(http::Method method, const std::string& path) {
  auto routes = route_table_[method];

  if (routes.empty()) {
    throw Router_error("No routes for method " + http::method::str(method));
  }

  for (auto& route : routes) {
    if (std::regex_match(path, route.expr)) {
      ++route.hits;

      // Set the pairs in params:
      Params params;
      std::smatch res;

      for (std::sregex_iterator i = std::sregex_iterator{path.begin(), path.end(), route.expr};
        i != std::sregex_iterator{}; ++i) { res = *i; }

      // First parameter/value is in res[1], second in res[2], and so on
      for (size_t i = 0; i < route.keys.size(); i++)
        params.insert(route.keys[i].name, res[i + 1]);

      ParsedRoute parsed_route;
      parsed_route.job = route.end_point;
      parsed_route.parsed_values = params;

      return parsed_route;
    }
  }

  throw Router_error("No matching route for " + http::method::str(method) + " " + path);
}
```

Params, which contains a map, is in turn added to the [Request](https://github.com/includeos/mana/blob/master/include/mana/request.hpp) so that the keys' values are available to the developer through ```auto value = req->params().get("key")```.

For a look at how you can create your own web application, check out [Acorn](https://github.com/includeos/acorn), our example web server appliance. Or if you're after a simpler example, take a look at [this example](https://github.com/includeos/mana/tree/master/examples/simple) in Mana.
