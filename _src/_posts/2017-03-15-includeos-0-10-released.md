---
layout: post
title:  "IncludeOS 0.10 Released"
author: ingve
date:   2017-01-15 08:00:42 +0200
categories: [includeos, release]
hero: /assets/img/posts/yellow/sun-flower-491173_640.jpg
author-image: /assets/img/authors/ingve.jpg
summary: "We are proud to announce the release of IncludeOS version 0.10. Highlights from this release include partial POSIX support, a user-friendly `boot` tool to easily build and run IncludeOS services, and a revamped cross-platform build system based on CMake."

---
We are proud to announce the release of [IncludeOS version 0.10](https://github.com/hioa-cs/IncludeOS/releases/tag/v0.10.0). Highlights from this release include partial POSIX support, a user-friendly `boot` tool to easily build and run IncludeOS services, and a revamped cross-platform build system based on CMake.

A number of exciting new features have been added: HTTP 1.1 client/server library support, a Virtual File System (VFS), a system RNG, etc. Of course a lot of bug fixes and performance improvements are also provided, and test coverage is steadily increasing. The IncludeOS project now uses a monorepo, so the [Mana Web Application framework](https://github.com/hioa-cs/IncludeOS/tree/master/lib/mana) and the [Acorn Web Appliance service](https://github.com/hioa-cs/IncludeOS/blob/master/examples/acorn) are now included in the main IncludeOS repo.

We have also added several useful utility classes, like CRC32 checksumming, URI manipulation, TAR/gzip support, a fixed queue, even better C++ delegates, etc.

## POSIX support

Many POSIX programs and utilities can now be ported to IncludeOS. A significant subset of POSIX functionality is already implemented (blocking sockets, read-only file system access, syslog logging, opening/reading tar/tar.gz files, etc.).

## Boot

To make building and running IncludeOS services as simple as possible, you can use the new `boot` command line tool. A number of useful options are provided, but if you just want to run your IncludeOS service, simply type `boot` followed by the name of your service binary and press enter to fire up a VM with your service. When you are done, press `Ctrl-C` to stop the service and shut down the VM -- no need to memorize obscure QEMU keyboard command sequences! :)

![boot animation]({{site-url}}/assets/img/posts/boot.gif)

```shell_session
$ boot -h
usage: boot [-h] [-c] [-b] [-v] [--create-bridge] [-g] [-j PATH]
            vm_location [vmargs [vmargs ...]]

IncludeOS vmrunner. Builds and runs an IncludeOS service

positional arguments:
  vm_location           Location of the IncludeOS service binary, image or
                        source
  vmargs                Arguments to pass on to the VM start / main

optional arguments:
  -h, --help            show this help message and exit
  -c, --clean           Clean previous build before building
  -b, --build           Only build the service, don't start it in a VM
  -v, --verbose         Verbose output when building
  --create-bridge       Create bridge43, used in local testing when TAP
                        devices are supported
  -g, --grub            Create image with GRUB bootloader that will boot
                        provided binary
  -j PATH, --config PATH
                        Location of VM config file - JSON validated against a
                        schema
```

## Build system

We now use the cross-platform CMake build system to build IncludeOS and IncludeOS services. To build your own IncludeOS service, all you need is a short `CMakeLists.txt` file where you add your own C/C++ source files and list any IncludeOS drivers that you want included with your service:

```cmake
cmake_minimum_required(VERSION 2.8.9)

# IncludeOS install location
if (NOT DEFINED ENV{INCLUDEOS_PREFIX})
  set(ENV{INCLUDEOS_PREFIX} /usr/local)
endif()

set(CMAKE_TOOLCHAIN_FILE
  $ENV{INCLUDEOS_PREFIX}/includeos/i686-elf-toolchain.cmake)

project (rng_test)

# Human-readable name of your service
set(SERVICE_NAME "RNG Test Service")

# Name of your service binary
set(BINARY "rng_test")

# Maximum memory can be hard-coded into the binary
set(MAX_MEM 128)

# Source files to be linked with OS library parts to form bootable image
set(SOURCES
  service.cpp # ...add more here
)

set(DRIVERS
  silent_start
)

# include service build script
include($ENV{INCLUDEOS_PREFIX}/includeos/service.cmake)
```

## More information

We wish to thank our budding community of users and contributors -- thank you *so much* for trying IncludeOS, posting issues and making pull requests! Full [release notes](https://github.com/hioa-cs/IncludeOS/releases/tag/v0.10.0) are available on GitHub.

If you want to get involved, give IncludeOS 0.10 a try! If you need any help or would like to provide any feedback, we would love it if you come chat with us in our public [Gitter chat](https://gitter.im/hioa-cs/IncludeOS) or get in touch with us on [GitHub](https://github.com/hioa-cs/IncludeOS/).
