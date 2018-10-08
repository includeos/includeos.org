---
layout: post
title: We're porting IncludeOS to ARM64
author: perbu
date:   2018-09-18 06:00:42 +0200
categories: [arm, hardware]
hero: /assets/img/posts/12321.jpg
author-image: /assets/img/authors/perbu.jpg
summary: "Linux is unsuited for embedded development. We're porting IncludeOS to ARM."
---

One of the apparent trends we see in the world today is the increasing use of Linux as an embedded operating system. As just about everyone and their dog is starting to ship IoT devices a familiar operating systems help accelerate development.

It is our opinion that Linux isn't suited for embedded use. There are quite a few problems with it. Here are a handful of reasons we believe Linux is far less than perfect for embedded use.

## Attack surface

Linux has impressive hardware and software support. It supports just about any protocol and any peripheral. It is all dynamic so anything at any time can connect to a Linux system. The result is a massive amount of code and following this a considerable number of potential bugs that could lead to compromise.

With IncludeOS however, the linker strips the binaries of any unused code when the image is built. Unless your application invokes that code, it can't enter the image. Compared to Linux you won't have to spend time locking down the image.

## Reconfigurability. 

Linux, due to it's Unix heritage, isn't suited to power a single task appliance. It's meant to power a malleable, flexible computing system where each computer can be reconfigured at any time, to do any task. This core characteristic is what makes Linux systems, and specifically, Linux-systems deployed outside of a strictly managed network, such attractive target.  This is, in my opinion, Linux's Achilles heel and the underlying reason why hardly a week goes by without reading about thousands of IoT devices being compromised.

When you deploy a device in the field, unless the device specifically needs to have user-installable software, as we see on a TV or a phone, you don't want the user to add arbitrary new code to the system. This code, can, in any way imaginable, alter the system. A Linux system connected to your wifi could, once compromised, sniff your network traffic, attack your computers, mine crypto, serve as a spambot or something worse.

IncludeOS has no user or administrator concept. The OS doesn't have any functionality to alter itself. The image can replace itself using [LiveUpdate]. However, this is the only way to do so and that path is strictly guarded and an update will not be allowed unless it comes from a trusted source and passes strict cryptographic checks. So we're confident that we can create an update process that is secure.

## Linux is slow and unpredictable.

Linux isn't built for real-time applications. It's built to distribute a limited set of computing resources fairly between competing users and processes. It is supposed to handle and an overcommitment of resources in a graceful manner.

Responding in microseconds to external impulses isn't a thing Linux does well. And often, responding in just a few microseconds, is essential when dealing with embedded systems. 

IncludeOS doesn't support process scheduling. So, when we are in our superloop, the moment an interrupt arrives, we can respond to it immediately. So we know we can provide a system that provides very strong real-time capabilities. We can also provide stronger guarantees that invoking the OS will predictable. 

## Fine. Linux isn't ideal. What are we going to do about it?

We're going to port IncludeOS to ARM. More specifically, we'll be supporting a few ARM64-based SoCs and gradually expand our support. We're starting in January 2019. The first effort is making sure that all our libraries can be compiled on ARM64. We'll be making sure that you can build and run your application on Linux on ARM64.

Then we'll start working on actually booting on ARM. The first target and our reference platform is the Raspberry Pi 3 Model B+. This is a 1.6Ghz, quad-core, 64 bit SoC with a Mali GPU, Ethernet, Wifi, Bluetooth and a host of GPIO pins. The price point is low, it is available all over the world and it is the default prototyping platform for Cortex-A development. I've been told the boot process is "interesting", but far from impossible to support.

Once we boot on the Raspberry, we'll start adding support for the buses and peripherals it has. Our old friend the PCI bus is there and shouldn't cause too much trouble, but quite a bit of the hardware, including the Wifi chip, is connected through the USB Host Controller. So USB support will have to go into IncludeOS.

This will likely keep us busy for quite some time. We'll continue to work on our Network Function Support and we have a few features lined up development in 2019.

## What is the use-case?

IncludeOS on ARM will be suited to power devices that run a single application in a single address space. It is not meant to run several applications. At least not currently. At some point, it might be possible to partition ARM-based systems into several logical systems and then IncludeOS could potentially run on one or more of these partitions. 

## Why ARM64 - why not ARM32

We get our Linux compatibility from [musl libc]. Because of the way the musl library is structured it is simple for us to replace the system calls when musl is invoking the OS with function calls. On ARM64 this only happens in a few places but for ARM32 this happens all over the library. So a ARM32 port isn't out of the question but it'll be quite a bit of work and is likely very hard for us to do without close cooperation with the musl team.


## Who are supporting this effort?

Most of this work will be paid for by the Horizon 2020 program. In addition, we're raising private capital to finance the effort. 

## When can I try this?

Our goal is that we should be able to provide basic support for the Raspberry Pi 3 Mobel b+ around the summer of 2019.

## Are you interested in using, piloting, testing or helping bring IncludeOS to your favorite ARM64 SoC?

I'm perbu@includeos.org. I'm interested to hear what you think.

[musl libc]: https://www.musl-libc.org/
[LiveUpdate]: /blog/2017/liveupdate.html

[musl libc]: https://www.musl-libc.org/
[LiveUpdate]: /blog/2017/liveupdate.html

