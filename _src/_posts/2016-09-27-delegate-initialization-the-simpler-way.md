---
layout: post
title:  "Delegate initialization - the simpler way"
author: andreas
date:   2016-09-27 14:50:42 +0200
categories: [c++, delegates]
summary: "In the IncludeOS presentation at CppCon 2016 an example of a delegate initialization can be seen. With a lot of delegates this can quick get kinda messy. Since then we found a simpler way to initialize our delegates."
author-image: /assets/img/authors/andreas.jpg
---
In the [IncludeOS presentation at CppCon 2016](http://www.slideshare.net/IncludeOS/include-ltos-from-bootloader-to-rest-api-with-the-new-c) an example of a delegate initialization can be seen ([on page 32](http://www.slideshare.net/IncludeOS/include-ltos-from-bootloader-to-rest-api-with-the-new-c/32)). With a lot of delegates this can quick get kinda messy. Since then we found a simpler way to initialize our delegates.

> Instantiate a member function pointer (delegate) with a return value of void which takes no arguments, where the member is of type "Foo" and the function is named "bar", and the object its pointing to is "foobar"
>

```cpp
auto del(delegate<void()>::from<Foo,&Foo::bar>(foobar));
```

Very verbose, but also very tedious to write. So after the presentation it hit me, *"Why can't we deduce the class type from the object passed as argument? Let's make a helper function!"*

So I gave it a desperate try:

```cpp
template <typename Signature, typename T, typename MemberFn>
auto make_delegate(T obj, MemberFn* fn) {
  return Signature::template from<T, fn>(obj);
}
```

Which wouldn't compile.

```
error: no matching function for call to 'make_delegate'
  auto test = make_delegate<void()>(foobar, &Foo::bar);
              ^~~~~~~~~~~~~~~~~~~~~
note: candidate template ignored: could not match 'MemberFn *' against 'void (Foo::*)()'
auto make_delegate(T obj, MemberFn* fn) {
```
Arghhh... I once made a template argument earlier with a trick to get the `void()`, but couldn't recall how. This was when I had no experience at all with templates, and was [playing around with templates and function pointers](https://github.com/AndreasAakesson/delegate/blob/master/delegate.cpp) to try to understand how it worked.

So I decided to go to `delegate.hpp` to look for clues. The only time I ever looked into this file was when I joined the project, and before ever touching template arguments - at that time I understood nothing.

This time I found the following:

```cpp
template <class C>
delegate(C& object, R (C::* const method_ptr)(A...))
{
  *this = from(object, method_ptr);
}
```

Yes, we can just use the *constructor* - it's been under our nose the whole time.

As seen above, the only two arguments that need to be specialized is the return value `R` and the function arguments `A...` as seen in the class declaration `class delegate<R(A...)>` - the rest can be deduced when passing the object `C` into the constructor. Then, inside the constructor, the factory function `from` we've been using the whole time is used to instantiate the delegate.

Less writing and cleaner code.

```cpp
auto tedious = delegate<void()>::from<Foo, &Foo::bar>(foo);

auto simple = delegate<void()>(foo, &Foo::bar);

delegate<void()> also_simple {foo, &Foo::bar};
```

And btw, to get the sweet looking signature syntax `return value (function arguments)` I was looking for, the following is used:

```cpp
template <typename T> class delegate;

template <typename R, typename ...A>
class delegate<R(A...)> {};
```
