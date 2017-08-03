---
layout: post
title:  "Docker Images for IncludeOS"
author: ingve
date:   2017-03-28 12:00:42 +0200
categories: [docker, build]
hero: /assets/img/posts/docker-logo.png
author-image: /assets/img/authors/ingve.jpg
summary: "We have for anyone who wants to try out building IncludeOS unikernels without having to install the development environment locally on their machines."

---
We have [uploaded Docker images](https://github.com/includeos/includeos-docker-images) for anyone who wants to try out building IncludeOS unikernels without having to install the development environment locally on their machines.

(The Docker images are relatively thin wrappers around existing build tools/scripts, so the Docker containers are currently not optimized for size.)

## Building the images

```shell_session
$ docker build -t includeos/includeos-common:0.10.0.1 -f Dockerfile.common .
$ docker build -t includeos/includeos-build:0.10.0.1 -f Dockerfile.build .
$ docker build -t includeos/includeos-qemu:0.10.0.1 -f Dockerfile.qemu .
$ docker build -t includeos/includeos-grubify:0.10.0.1 -f Dockerfile.grubify .
```

This will build a collection of useful Docker images:

```shell_session
$ docker images
REPOSITORY                    TAG                 IMAGE ID            CREATED
includeos/includeos-grubify   0.10.0.1            3e271b4f5370        4 seconds ago
includeos/includeos-qemu      0.10.0.1            18fb0af69f0f        30 seconds ago
includeos/includeos-build     0.10.0.1            a82734f06501        40 seconds ago
includeos/includeos-common    0.10.0.1            b5461fc5a821        48 seconds ago
ubuntu                        xenial              0ef2e08ed3fa        4 weeks ago
```

## Using the Docker image to build your service

If you have -- or are developing -- an IncludeOS service that you want to build in a Docker container, you can just go to the directory where you keep the service's code, create and cd into a `build` directory, and run the Docker container like this:

```shell_session
$ cd <my-super-cool-service>
$ mkdir build && cd build
$ docker run --rm -v $(dirname $PWD):/service includeos/includeos-build:0.10.0.1
```

This will perform all the usual build steps, and generate finished IncludeOS images. If you need to make changes or fix bugs, just re-run the `docker run` command.

## Running a sanity test of your service image

If you do not have a hypervisor installed, you can run a very basic sanity test of your service by executing it inside QEMU in a Docker container:

```shell_session
$ docker run --rm -v $(PWD):/service/build includeos/includeos-qemu:0.10.0.1 <image_name>
```

(If the service is not designed to exit on its own, the container must be stopped with `docker stop`.)

## Adding a GRUB bootloader to your service

On macOS, the `boot -g` option to add a GRUB bootloader is not available. Instead, you can use the `includeos-grubify` Docker image. Build your service, followed by:

```shell_session
$ docker run --rm --privileged -v $(dirname $PWD):/service includeos/includeos-grubify:0.10.0.1 /service/build/<image_name>
```

We are *very* interested in finding out that kind of workflows users would like to use Docker images for, so if you are doing something in the Docker/unikernel space, please get in touch, either here, in the [IncludeOS issue tracker](https://github.com/hioa-cs/IncludeOS/issues) or on our [Gitter chat](https://gitter.im/hioa-cs/IncludeOS)!
