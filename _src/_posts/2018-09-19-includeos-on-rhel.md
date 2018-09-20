---
layout: post
title: Getting IncludeOS up and running on RHEL
author: taiyeba
date:   2018-09-19 0:08:00 +0200
categories: [platforms, rhel, centos]
hero: /assets/img/posts/Redhat-logo.jpg
author-image: /assets/img/authors/taiyeba.jpg
summary: "Getting IncludeOS up and Running on RHEL 7"
---

Let’s talk about getting IncludeOS up and running on RHEL systems. Currently IncludeOS builds quite smoothly on Debian, Ubuntu and MacOS. However there has been some challenges in building IncludeOS on RHEL. Basically as Per mentions after several attempts, there are quite a  few dependencies that are hard to resolve on RHEL as opposed to other systems. But let’s admit, nothing is impossible and we as a team are looking into making it simpler in the future.

At the moment our solution for RHEL 7 is to deploy the whole build environment into a Docker container and use it to build IncludeOS as an image. We have done it for our commercial customers as it makes it possible to run on any platforms that support docker (not tested on Docker for Windows).

## A Simple C++ program

Our goal will be to compile and boot _**a simple C++ program**_:

```
 #include <os>

int main() {
 printf("Finding IncludeOS on RHEL \n");
}

```

Let’s start of by creating a folder for your service:

```bash
mkdir my-awesome-service
cd my-awesome-service
vi service.cpp
```

Copy the above C++ program into the file and save it.

Now before you can compile this little service with includeOS on Docker, let’s ensure you have the necessary dependencies.

## What you will need?

Firstly we will need docker and it’ dependencies before we can get started with IncludeOS.

### Docker

To install docker, follow the [official docker guide](https://docs.docker.com/install/linux/docker-ce/centos/)

* Start by adding the docker repo to your package manager:

```bash
sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
```

* Let’s get the prerequisites needed by Docker:

```bash
sudo yum install -y yum-utils \
  device-mapper-persistent-data \
  lvm2
```

* Now you can install Docker CE with:

`sudo yum install docker-ce`

* After the installation, make sure to add a docker user to the docker user group. In the command below, the centos user is added to the docker group.

`sudo usermod -aG docker centos`

### QEMU

In this demonstration we plan to use QEMU as the hypervisor, therefore you will need to install QEMU as well.

**Note:** It might be possible to use Qemu from Redhat, but we've had better luck with Qemu from EPEL (the Fedora backport to RHEL).

* So to add the EPEL repo:

```bash
sudo rpm -ivh http://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
```

* Installing QEMU:

```bash
sudo yum install qemu-system-x86
```

## Getting started with 3 Steps to IncludeOS

Now that you have all the dependencies in place, there is one more thing that needs to be done before we can starting building, Adding a `CMakeLists.txt` file into your service folder which will configure the build system. You can use the template provided here without any modification: [CmakeLists.txt](https://github.com/hioa-cs/IncludeOS/blob/master/seed/service/CMakeLists.txt).

* Create a new file named CmakeLists.txt in your service folder, and paste the template provided above.

Now you are ready to start a Docker container. You can view a list of the IncludeOS docker image tags here:
[Docker Images](https://hub.docker.com/r/includeos/build/tags/).


* Donwload and Run the right IncludeOS Docker Image

For this demonstration we will build the latest tag we have, `dev-v0.12.1-rc.7.1`.
Now one can run the following command from the service directory:

```bash
docker run --user $(id -u):$(id -g) --rm -v $PWD:/service includeos/build:dev-v0.12.1-rc.7.1
```

This command will download the tagged image contents from Docker hub and build the image locally.
If the image download was successful you will see the following line:

```shell_session
Status: Downloaded newer image for includeos/build:dev-v0.12.1-rc.7.1
```

Following a successful built, you will also see the following message:

```shell_session
[100%] Built target service
```

Once the build is complete there are a number of things of interest.
You can do `docker images` to see a new docker image:

```shell_session
REPOSITORY          TAG                  IMAGE ID            CREATED             SIZE
includeos/build     dev-v0.12.1-rc.7.1   a231307607da        2 days ago          1.52GB

```

Also of interest is the new `build` folder now present in your service directory. Inside the build folder, you will find two files you will want to inspect. One is called `"seed"` (name from the Cmake template) and one is called `chainloader` (The 32 bit chainloader is called "chainloader").

Due to the presence of a bug in Qemu, In this use case one needs to load a 32 bit kernel and use it to chainload our 64 bit application. As you have already noted that we installed QEMU for 32 bit earlier.

Now we are ready to run the brand new OS we've created. You can execute the following command from inside the build folder:

`qemu-system-x86_64 -kernel chainloader -initrd seed -m 512 -nographic`

This should start the awesome service you created. This works by starting the brand new OS you started and compiles your c++ code. Your running service should look something like this:

```shell_session
[centos@includeos-centos my-awesome-code]$ cd build/
[centos@includeos-centos build]$ sudo qemu-system-x86_64 -kernel chainloader -initrd seed -m 512 -nographic

(process:26765): GLib-WARNING **: gmem.c:483: custom memory allocation vtable not supported
SeaBIOS (version 1.11.0-2.el7)


iPXE (http://ipxe.org) 00:03.0 C980 PCI2.10 PnP PMM+1FF95620+1FEF5620 C980



Booting from ROM..* Brk initialized. Begin: 0x611000, end 0x611000, MAX 0x100000
* mmap initialized. Begin: 0x711000, end: 0x1fffd000
     [ Kernel ] Booted with multiboot
                * Boot flags: 0x4f
                * Valid memory (523895 Kib):
                  0x00000000 - 0x0009fbff (639 Kib)
                  0x00100000 - 0x1fffdfff (523256 Kib)

                * Booted with parameters @ 0x302015: chainloader
                * Multiboot provided memory map  (6 entries @ 0x9000)
                  0x0000000000 - 0x000009fbff FREE (639 Kb.)
                  0x000009fc00 - 0x000009ffff RESERVED (1 Kb.)
                  0x00000f0000 - 0x00000fffff RESERVED (64 Kb.)
                  0x0000100000 - 0x001fffdfff FREE (523256 Kb.)
                  0x001fffe000 - 0x001fffffff RESERVED (8 Kb.)
                  0x00fffc0000 - 0x00ffffffff RESERVED (256 Kb.)

     [ Kernel ] OS loaded with 1 modules
                * seed @ 0x303000 - 0x5c67b8, size: 2897848b
* Brk initialized. Begin: 0x46d000, end 0x46d000, MAX 0x100000
* mmap initialized. Begin: 0x56d000, end: 0x1fffd000
================================================================================
 IncludeOS v0.12.1-rc.7 (x86_64 / 64-bit)
 +--> Running [ IncludeOS seed ]
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	Congratulations!
 	You are now running IncludeOS !
       [ main ] returned with status 0

```

Below is a screenshot:

![Includeos_centos]({{site-url}}/assets/img/posts/includeos_centos.png)

To abort it type `Ctrl-A` and then `c`. This will take you to qemu’s command line. Next type `q` to quit.

```shell_session
QEMU 2.0.0 monitor - type 'help' for more information
(qemu) q
```

*NOTE:* In case you are still fanatically hitting 'escape' but still stuck on the screen, open another terminal to your host and kill the process.

To find and kill the qemu process:

`ps aux | grep qemu`

`kill <PROCESS-ID> `

If this went well for you and you want to use docker to run IncludeOS on Mac, Ubuntu or Debian, you can follow the quide here [Docker images for IncludeOS](http://www.includeos.org/blog/2017/docker-containers-for-includeos.html).

**_Perhaps we should try it on Docker on Windows as well? Let us know if you have tried it!_**

We are always *very* interested in hearing about your IncludeOS use cases. Thus if you are experimenting with IncludeOS on a new platform or anything within the specs of unikernels and/or unikernels on dockers, get in touch with us at [Gitter chat](https://gitter.im/hioa-cs/IncludeOS) or let us know through [IncludeOS issue tracker](https://github.com/hioa-cs/IncludeOS/issues)
