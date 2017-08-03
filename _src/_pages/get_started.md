---
layout: static-page
title: Get Started
class: get-started
permalink: /get-started.html
summary: "Installing and compiling IncludeOS."
---

Installing IncludeOS on a Mac or Linux computer is relativly straight forward. It does require a few libraries and a compiler. Once installed you can build and launch IncludeOS application locally.


### Set custom location and compiler

By default the project is installed to /usr/local/includeos.

However, it is recommended to choose a custom location as well as select the compiler we want clang to find.

To do this we can edit ~/.bashrc (in the home folder), adding these lines at the end of the file:

```bash
    export CC=/usr/bin/clang-3.8
    export CXX=/usr/bin/clang++-3.8
    export INCLUDEOS_PREFIX=<HOME FOLDER>/includeos
    export PATH=$PATH:$INCLUDEOS_PREFIX/bin
```

This will also crucially make the boot program visible globally, so that you can simply run ```boot <myservice>``` inside any service folder.

### Install libraries

**NOTE:** The script will install packages and create a network bridge.

```bash
    $ git clone https://github.com/hioa-cs/IncludeOS
    $ cd IncludeOS
    $ ./install.sh
```

**The script will:**

* Install the required dependencies: `curl make clang-3.8 nasm bridge-utils qemu`.
* Create a network bridge called `bridge43`, for tap-networking.
* Build IncludeOS with CMake:
  * Download the latest binary release bundle from github together with the required git submodules.
  * Unzip the bundle to the current build directory.
  * Build several tools used with IncludeOS, including vmbuilder, which turns your service into a bootable image.
  * Install everything in `$INCLUDEOS_PREFIX/includeos` (defaults to `/usr/local`).

Configuration of your IncludeOS installation can be done inside `build/` with `ccmake ..`.

### Testing the installation

A successful setup enables you to build and run a virtual machine. Running:

```bash
    $ ./test.sh
```

will build and run [this example service](./examples/demo_service/service.cpp).

More information is [available on the wiki](https://github.com/hioa-cs/IncludeOS/wiki/Testing-the-example-service).

### Writing your first service

1. Copy the [./seed/service](./seed/service) directory to a convenient location like `~/your_service`. Then, just start implementing the `Service::start` function in the `Service` class, located in [your_service/service.cpp](./seed/service/service.cpp) (very simple example provided). This function will be called once the OS is up and running.
2. Update the [CMakeLists.txt](./seed/service/CMakeLists.txt) to specify the name of your project, enable any needed drivers or plugins, etc.

**Example:**

```bash
    $ cp -r seed/service ~/my_service
    $ cd ~/my_service
    $ emacs service.cpp
    ... add your code
    $ mkdir build && cd build
    $ cmake ..
    $ make
    $ boot my_service
```

Take a look at the [examples](./examples) and the [tests](./test). These all started out as copies of the same seed.
