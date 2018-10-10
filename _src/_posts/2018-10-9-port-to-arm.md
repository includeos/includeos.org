---
layout: post
title: We're porting IncludeOS to ARM64
author: perbu
date:   2018-10-09 06:00:42 +0200
categories: [arm, hardware]
hero: /assets/img/posts/raspberry-2635886_1920.jpg
author-image: /assets/img/authors/perbu.jpg
summary: "Linux is unsuited for embedded development. We're porting IncludeOS to ARM."
---

One of the apparent trends we see in the world today is the increasing use of Linux as an embedded operating system. As just about everyone and their dog is starting to ship IoT devices a familiar operating system help accelerate development. So there are lots of Linux systems being shipped.

Here are a handful of reasons we believe Linux is far less than perfect for embedded use.

## Attack surface

Linux has impressive hardware and software support. It supports just about any protocol and any peripheral. It is all dynamic so anything at any time can connect to a Linux system. The result is a massive amount of code and following this a considerable number of potential bugs that could lead to compromise.

With IncludeOS however, the linker strips the binaries of any unused code when the image is built. Unless your application invokes that code, it can't enter the image. So the amount of code you ship with IncludeOS on your device is just a small fraction of what it would be with Linux.

## A Linux system can modify itself

Linux, due to it's Unix heritage, isn't suited to power a single task appliance. It's meant to power a malleable, flexible computing system where each computer can be reconfigured at any time, to do any task. This core characteristic is what makes Linux systems, and specifically, Linux-systems deployed outside of a strictly managed network, such attractive targets.  This is Linux's Achilles heel and the underlying reason why hardly a week goes by without reading about thousands of IoT devices being compromised.

When you deploy a device in the field, unless the device specifically needs to have user-installable software, as we see on a TV or a phone, you don't want the user to add arbitrary new code to the system. This code, can, in any way imaginable, alter the system. A Linux system connected to your wifi could, once compromised, sniff your network traffic, attack your computers, mine crypto, serve as a spambot or something worse.

IncludeOS has no user or administrator concept. The OS doesn't have any functionality to modify itself. You can remotely replace the whole image (see [LiveUpdate]), but not without passing a series of checks to make sure the update is authorized. 

The result will be systems that are far less attractive targets. 

## Linux is slow and unpredictable.

Linux isn't built for real-time applications. It's built to distribute a limited set of computing resources fairly between competing users and processes. Responding in microseconds to external impulses isn't a thing Linux does well. And often, responding in just a few microseconds, is essential in embedded systems. 

IncludeOS doesn't support process scheduling. So, when we are in our event loop, the moment an interrupt arrives, we can respond to it immediately. We know we can provide a system that provides very strong real-time capabilities. We can also provide stronger guarantees that invoking the OS will be predictable. 

## Fine. Linux isn't ideal. What are we going to do about it?

We're going to port IncludeOS to ARM. More specifically, we'll be supporting a few ARM64-based SoCs and gradually expand our support. We're starting in January 2019. The first effort is making sure that all our libraries can be compiled and run on ARM64. We'll be making sure that you can build and run your application on Linux on ARM64.


![Raspberry Pi 3 Model b+](/assets/img/posts/device-3438525_1280.jpg)

Then we'll start working on actually booting on ARM. The first target and our reference platform is the Raspberry Pi 3 Model B+. This is a 1.6Ghz, quad-core, 64 bit SoC with a Mali GPU, Ethernet, Wifi, Bluetooth and a host of GPIO pins. The price point is low, it is available all over the world and it is the default prototyping platform for Cortex-A development. I've been told the boot process is "interesting", but far from impossible to support.

Once we boot on the Raspberry, we'll start adding support for the buses and peripherals it has. The peripherals are connected through the SDIO and the USB busses. So a solid USB implementation will have to go into IncludeOS, something we haven't needed until now.

This will likely keep us busy for quite some time. We'll continue to work on our Network Function Support and we have a few features lined up for development in 2019.

## What is the use-case?

A good example of what we think is fitting is a gateway. Typically, in an IoT archtecture there are sensors and actuators distributed around your house, office or factory. These are connected to a cloud backend through some sort of gateway. These gateways should be able to run IncludeOS with a little effort. 

In general I think we can define the use-case to everything that currently runs Linux, with the exception of those devices that run a multitude of processes. If your system looks like a minaturized Linux server, IncludeOS isn't the answer. At some point, it might be possible to partition ARM-based systems into several logical systems and then IncludeOS could potentially run on one or more of these partitions.


## What about RISC-V?

One of the outcomes of us supporting ARM is the creation of a hardware abstraction layer (HAL). Everything that isn't cross-platform will be put into the HAL and this will make it easiser to support other archtectures down the line.

## Who are supporting this effort?

Most of this work will be paid for by the Horizon 2020 program. In addition, we're raising private capital to finance the effort. 

## When can I try this?

Our goal is that we should be able to provide basic support for the Raspberry Pi 3 Mobel b+ around the summer of 2019.

## Are you interested in using, piloting, testing or helping bring IncludeOS to your favorite ARM64 SoC?

I'm perbu@includeos.org. I'm interested to hear what you think.

*Edited 2018-10-10, turns out the Raspberry Pi 3 Model b+ doesn't have a PCI bus internally. Huh.*

[musl libc]: https://www.musl-libc.org/
[LiveUpdate]: /blog/2017/liveupdate.html
