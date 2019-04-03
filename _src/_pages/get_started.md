---
layout: static-page
title: Get Started
class: get-started
permalink: /get-started.html
summary: "Installing and compiling IncludeOS."
---

Installing IncludeOS on a Mac or Linux computer is relatively straightforward. It does require a few libraries and a compiler. Once installed you can build and launch IncludeOS applications locally.

### Get dependencies

Dependencies required for building IncludeOS services:
* [Conan package manager](https://docs.conan.io/en/latest/installation.html)
* CMake
* Clang, or alternatively GCC on Linux

### Build and Run IncludeOS

Let's start with our [hello world demo service](https://github.com/includeos/hello_world) as a starting point for developing IncludeOS services. Once all the dependencies are built, choose an appropriate
[profile](https://github.com/includeos/conan_config/tree/master/profiles) based your build system.

> NOTE: Use `activate.sh` to activate necessary service requirements and `deactivate.sh` to return to previous environment settings.

```
  $ git clone https://github.com/includeos/hello_world.git
  $ mkdir hello_world_build
  $ cd hello_world_build
  $ conan install <path-to-hello-world>/hello_world -pr <your_conan_profile>
  $ source ./activate.sh
  $ cmake ../hello_world
  $ cmake --build .
  $ boot hello
```
This will also crucially make the boot program visible globally, so that you can simply run `boot <myservice>` inside any service folder.

### Special Requirement for MacOS

If you want to install IncludeOS on Mac OS you'll need a working installation of [Homebrew](https://brew.sh/) so that one can install the required dependencies stated above.

We are also working on developing a [homebrew formula](https://github.com/includeos/homebrew-includeos) which is currently experimental but feel free to try it out.



### Building and Starting a demo service

1. Build a service

To build the demo service, create a `build` folder inside the `demo_service` folder install with the profile you would like to use.

```
  $ cd demo_service
  $ mkdir build
  $ cd build
  $ conan install .. -pr <name-of-profile>
```

Installing with the chosen profile, fetches the profile configurations and Installs
the requirements in the `conanfile.txt`. If the required packages are not in the
local conan cache they are downloaded and installed. If all the packages required
are already in the local conan cache then it moves on to apply build requirements
and generates the required virtualenv scripts and cmake information.

Next to build the service do:

```
  $ cmake ..
  $ cmake --build .

```
Doing `cmake` configures and generates the build files and they are written to
the build folder. Then doing `cmake --build .` builds the target service. You
should see the last line as:

```
  [100%] Built target demo
```
`demo` is the name of this service for the demo_service. That's the name you will
use when starting the service. Do `ls` to see all the files created. There is also
an executable file named `demo` which is now the service you will start.

2. Start a service

Now that you have all your build requirements ready, you can start the service. To start a service a good practice is to always activate the service
requirements;

```
  $ source activate.sh
```

Now you can boot the demo service with `boot <service-name>`. This will build and run [this example service](https://github.com/includeos/demo-examples/blob/master/demo_service/service.cpp). You can visit the service on [http://10.0.0.42/](http://10.0.0.42/).

```
  $ boot demo
```

This should start your demo service and display a message like the following:

```
  ================================================================================
  IncludeOS  (x86_64 / 64-bit)
  +--> Running [ IncludeOS Demo Service ]
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Service started
  Made device_ptr, adding to machine
    [ Network ] Creating stack for VirtioNet on eth0 (MTU=1500)
       [ Inet ] Bringing up eth0 on CPU 0
  *** Basic demo service started ***
```

To build more examples follow the [README](https://github.com/includeos/demo-examples/blob/master/README.md) in the demo-examples repository.

### Writing your first service

To start writing your first service,
- Copy the [demo_service/service.cpp](https://github.com/includeos/demo-examples/blob/master/demo_service/service.cpp) example.
- Then start implementing the `Service::start` function in the `Service` class, located in `<your-service-name>/service.cpp` (very simple example provided). This function will be called once the OS is up and running.
- Update the `CMakeLists.txt` to specify the name of your project, enable any needed drivers or plugins, etc.
- Update the `conanfile.txt` to specify any build requirements and generators.

You should then be able to run your service in the same way as the [demo_service](https://github.com/includeos/demo-examples/tree/master/demo_service).

To add a new service to our demo examples, make a PR to our [demo-examples](https://github.com/includeos/demo-examples) repo. Make sure to
add a README in your example folder with description of your service.


> **Note:** Remember to deactivate your service environment after your work with:

```
  $ source deactivate.sh
```

Take a look at the examples and tests in the [`tests`](https://github.com/includeos/IncludeOS/tree/dev/test) in the test directory. These all started out as copies of the same seed.

If you have any questions or need help, join our [Slack channel](https://goo.gl/NXBVsc).
