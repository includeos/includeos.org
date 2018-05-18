---
layout: static-page
title: Get Started
class: get-started
permalink: /get-started.html
summary: "Installing and compiling IncludeOS."
---

Installing IncludeOS on a Mac or Linux computer is relatively straightforward. It does require a few libraries and a compiler. Once installed you can build and launch IncludeOS applications locally.

### Set custom location and compiler

By default the project is installed to /usr/local/includeos.

However, it is recommended to choose a custom location as well as select the compiler we want clang to find. In this document we assume you install IncludeOS in your home directory, in the folder ~/includeos.

To do this we can edit ~/.bash_profile (mac os) or ~/.bashrc (linux), adding these lines at the end of the file:

```
    export INCLUDEOS_PREFIX=~/includeos/
    export PATH=$PATH:$INCLUDEOS_PREFIX/bin
```

This will also crucially make the boot program visible globally, so that you can simply run ```boot <myservice>``` inside any service folder.

### Install libraries

If you want to install IncludeOS on Mac OS you'll need a working installation of [Homebrew](https://brew.sh/) so the install script can install its dependencies.

**NOTE:** The script will install packages.

```
    $ git clone "https://github.com/hioa-cs/IncludeOS"
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

A successful setup enables you to build and run a virtual machine. There are a few demonstration services in the source folder. If you look in the `examples/` folder you see these. If you enter `demo_service` and type `boot --create-bridge .` this script will build the service and boot it using [qemu](https://www.qemu.org/).

```
    $ cd examples/demo_service
    $ boot --create-bridge .
```

will build and run [this example service](./examples/demo_service/service.cpp). You can visit the service on [http://10.0.0.42/](http://10.0.0.42/).

More information is [available on the wiki](https://github.com/hioa-cs/IncludeOS/wiki/Testing-the-example-service).

### Writing your first service

1. Copy the [./seed/service](./seed/service) directory to a convenient location like `~/your_service`. Then, just start implementing the `Service::start` function in the `Service` class, located in [your_service/service.cpp](./seed/service/service.cpp) (very simple example provided). This function will be called once the OS is up and running.
2. Update the [CMakeLists.txt](./seed/service/CMakeLists.txt) to specify the name of your project, enable any needed drivers or plugins, etc.

**Example:**

```
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
