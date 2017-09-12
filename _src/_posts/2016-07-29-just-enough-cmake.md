---
layout: post
title:  "Just enough CMake"
author: ingve
date:   2016-07-29 15:43:42 +0200
categories: [cmake, build]
author-image: /assets/img/authors/ingve.jpg
hero: /assets/img/posts/yellow/foliage-78767_640.jpg
---
Diving into a new and unknown code base can be a bit unsettling. Getting a high-level overview of the overall structure and architecture of the code base is vital if you want to be productive as soon as possible.

IncludeOS unikernels (aka. "services") are built from a collection of normal C++ source and header files, and the build process is controlled by a Makefile.

Almost all modern editors and IDEs have some built-in facilities or plugins for intelligently navigating through a set of source files. However, one very popular C++ IDE, CLion from JetBrains, [does not yet support Makefile projects](https://youtrack.jetbrains.com/issue/CPP-494). Instead, CLion uses CMake files as its project file format.

Fortunately, you do not need a lot of CMake to be able to use CLion with IncludeOS.

Here is a minimal `CMakeLists.txt` for IncludeOS unikernels:

```cmake
cmake_minimum_required(VERSION 3.2.2)
project(my_includeos_service)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}
        -target i686-elf
        -mstackrealign -fstack-protector-all
        -msse3 -O2 -Wall -Wextra -m32 -std=c++14
        -D_LIBCPP_HAS_NO_THREADS=1 -D_GNU_SOURCE")
set(INCLUDEOS_INSTALL $ENV{HOME}/IncludeOS_Install)
set(SOURCE_FILES service.cpp)

include_directories(${INCLUDEOS_INSTALL}/libcxx/include
        ${INCLUDEOS_INSTALL}/api/sys
        ${INCLUDEOS_INSTALL}/newlib/include
        ${INCLUDEOS_INSTALL}/api
        ${INCLUDEOS_INSTALL}/mod/GSL/include)
add_library(service OBJECT ${SOURCE_FILES})

add_custom_target(BUILD_IMAGE ALL
        DEPENDS service)

add_custom_command(TARGET BUILD_IMAGE
        POST_BUILD
        WORKING_DIRECTORY ${PROJECT_SOURCE_DIR}
        COMMAND LD_INC=${INCLUDEOS_INSTALL}/bin/ld make)
```
(The IncludeOS build system uses a standard Makefile to link the code in your service with any OS functions it might need, and create a bootable image. Using CLion's support for the CMake `add_custom_command` and `add_custom_target` commands, we are able to re-use the Makefile's existing functionality for this part of the build sequence.)

If your unikernel consists of more C++ files than just the default `service.cpp`, just add them to `SOURCE_FILES` as you normally would.

Now, all the normal CLion [navigation and search features](https://blog.jetbrains.com/clion/2015/03/search-and-navigation-in-clion/) will be available from within the IDE.

![CLion navigation]({{site-url}}/assets/img/posts/just-enough-cmake-navigation.png)

Once you provide CLion with this little CMake snippet, you also get clickable error messages that take you directly to the offending lines in your source files.

![CLion errors]({{site-url}}/assets/img/posts/just-enough-cmake-errors.png)
