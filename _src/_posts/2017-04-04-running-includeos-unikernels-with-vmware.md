---
layout: post
title:  "Running IncludeOS Unikernels with VMware"
author: ingve
author-image: /assets/img/authors/ingve.jpg
date:   2017-04-04 12:00:42 +0200
categories: [vmware]
hero: /assets/img/posts/vmware-logo-500px.png
summary: "The dev branch now works on various VMware platforms - including networking."

---
Up until now, IncludeOS has been officially tested on Linux KVM (using QEMU for local testing and OpenStack in the cloud) and VirtualBox. It has in fact also been possible to run IncludeOS services on VMware, but with one very important limitation: no networking.

If you have been following the IncludeOS `dev` branch, you will have noticed that quite a few VMWare-related items have been popping up lately. Chief among them is the `vmxnet3` driver, which enables networking on VMWare for IncludeOS unikernels.

To run services on VMWare, usually only a single, very simple change is required: In the service's `CMakeLists.txt` file, in the `DRIVERS` section, remove the `virtionet` driver and add `vmxnet3` instead. That's pretty much it, just rebuild, and you're good to go!

```cmake
cmake_minimum_required(VERSION 2.8.9)

project (demo_service)

# Human-readable name of your service
set(SERVICE_NAME "IncludeOS minimal example")

# Name of your service binary
set(BINARY       "IncludeOS_example")

# Source files to be linked with OS library parts to form bootable image
set(SOURCES
  service.cpp # ...add more here
  )

set(DRIVERS
  #virtionet   # Virtio networking
  vmxnet3
  )

# include service build script
include($ENV{INCLUDEOS_PREFIX}/includeos/service.cmake)
```

To run your services on VMWare, we've provided a simple convenience script, somewhat unimaginatively named `vmware`. Unlike the `boot` program that can both build *and* run services in QEMU, create network bridges, append GRUB bootloaders, etc, the `vmware` script is only able to *run* IncludeOS services.

If you type `vmware --help` you will be provided with instructions about how to run your service. Normally, you just type `vmware <name-of-your-service>` to start an instance, and the service's serial output will be visible in your console.

![vmware-animation]({{site-url}}/assets/img/posts/vmware.gif)

When you're done, press `Ctrl-C` to stop the IncludeOS instance.

If you want to run multiple instances of your service (for example, to test networking communications between IncludeOS instances), you can add the `-n` parameter to specify the number of instances you want to launch.

By default, the script just uses `tail -f` which interleaves output from the various instances, but feel free to substitute your preferred tail variant if you need more control of the output/layout, like in the multitail example shown here:

![vmware-4-instances]({{site-url}}/assets/img/posts/vmware.png)

If you are using IncludeOS and VMWare, do not hesitate to get in touch, either here, in the [IncludeOS issue tracker](https://github.com/hioa-cs/IncludeOS/issues) or on our [Gitter chat](https://gitter.im/hioa-cs/IncludeOS)!
