---
layout: post
title:  "Popek-Goldberg machines considered harmful"
author: perbu
date:   2017-07-03 09:00:42 +0200
hero: /assets/img/posts/ibm-370.jpg
categories: [popek-goldberg, virtual machines, ukvm]
author-image: /assets/img/authors/perbu.jpg
summary: "Modern virtual machines are based on a '74 theorem made by Popek and Goldberg. It outlines how virtual machines should be equivalent to physical machines, something that makes transitioning to virtual machines easier. Today this equivalence is harmful as it ads a lot of complexity to our virtual machines. If we discard equivalence virtual machines can be made a lot simpler."
---

Modern virtual machines are based on a ‘74 [Paper](http://dl.acm.org/citation.cfm?id=361073) by [Gerald J. Popek](https://en.wikipedia.org/wiki/Gerald_J._Popek) and [Robert P. Goldberg](https://en.wikipedia.org/wiki/Robert_P._Goldberg). It provides the theoretical framework for how virtual machines should behave in order to be efficient and secure. It’s a brilliant paper as it outlines how to take something that sounds relatively abstract and complex and turns it into something very concrete. In order to have proper virtual machines you only need some silicon support and some software and this paper outlines how they should function.
 
Basically the paper puts forward three requirements for a platform to be an efficient, isolated duplicate of a real machine;
 
1) Equivalence / Fidelity
: A virtual machine running under a virtual machine monitor (VMM) should exhibit behavior essentially identical to running directly on a machine.

2) Resource control / Safety
: The VMM must be in complete control of the virtualized resources.

3) Efficiency / Performance
: Most of the code running in the virtual machine must run without VMM intervention. In essence performance in the virtual machine must be equivalent to running on physical hardware.
 
Requirement 3) means there can be no emulation of the CPU itself. You’ll need to run the VM on the actual CPU and relying on its ability to trap privileged instructions when needed. 
 
Requirement 2) assures a reasonable level of isolation. The VM cannot address memory outside what it’s been allocated. 
 
And requirement 1) - equivalence. This requirement makes sure the virtualized hardware provides the same interface as physical hardware would. This means that the VMs of today have PCI buses filled with virtual PCI cards that can provide the exact same interface (port io, DMA) as physical machines do. The are initiated in real mode and boot through the same legacy mechanisms as the original PC did. This allows the world to transition from physical to virtual machines. It allows operating system vendors to rely on the abstractions provided by the Virtual Machine Monitor (VMM) to maintain a single installation target. The same installation media can be used to install both virtual and physical hosts.

![IBM System/370]({{site-url}}/assets/img/posts/ibm-370.jpg){:style="float: right;margin-right: 7px;margin-top: 7px;"}
The IBM System/370 was the first commercially available machine adhering the Popek-Goldberg virtualization requirements. 


## Why we don't need equivalence

I have a problem with the Equivalence requirement. It requires a lot of complexity. Why would we have the need to emulate a complete PC in a virtual machine deployed in the cloud? We don’t need BIOS, sound cards, floppy drives, GPUs or bluetooth hardware if what we’re building are web services. We don’t even need a PCI bus.
 
We basically need console-, network- and block interfaces. Everything else should go. As the 2015 [VENOM attack](http://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2015-3456) showed there is risk in having support for legacy hardware. If you unfamiliar with the VENOM attack it used a flaw in the virtual floppy hardware to break out of the virtual machines. It made the hardware virtualization provided by modern CPUs irrelevant by attacking the emulated machine itself.
 
Booting virtual machines doesn’t need to happen through initializing the CPU in real mode (16 bit). The VMM and the hypervisor can setup the VM for us and just start executing it. We can shave off several seconds of the boot process if we do. We don’t need to emulate a PCI bus in order to have networking or disk access. We just need a simple shared memory buffer along with some signaling capabilities (interrupts).  Removing the RS232 emulation from our virtual consoles will also significantly affect boot performance. With RS232 we’re writing one byte at a time to the serial port. It is the most inefficient way to interact with hardware on a computer. It actually delays the boot noticeably.

## Introducing the Unikernel monitor
 
What does a stack based on these principles look like? It would be simpler, faster and much more secure. For IncludeOS this is becoming a reality as [Ricardo Koller](https://github.com/ricarkol) and [Dan Williams](https://github.com/djwillia), two researchers from IBM in New York  have ported IncludeOS to the [Solo5](https://github.com/Solo5/solo5) platform. Solo5  gives the unikernel its networking-, block- and console devices. It's rather generic and was orginally written for the [MirageOS](https://mirage.io) Unikernel.

The VMM Qemu is in this setup replaced with [ukvm](https://github.com/Solo5/solo5/tree/master/ukvm) - the Unikernel Monitor. Linux/KVM is the still the hypervisor, facilitating scheduling and memory management of the virtual machines.

With this code we’re able to setup a VM, execute it and close it down again within 5ms. That is pretty fast. It’s fast enough that it to some extent can change how we treat virtual machines.
 
It allows you to do virtual machines on demand. An incoming HTTP request can spin up a new VM and process it without adding too much latency. If there is no traffic for that endpoint during the next ten seconds it can be shut down again.

## Retaining support for physical hosts

IncludeOS will retain full support for traditional virtual machines that are Popek-Goldberg compliant. It’ll take a few years before ukvm gets significant adoption and in the mean time all the virtual machine platforms will emulate PCs. Besides, we might be booting on physical hardware at some point.

For virtual machines however. I hope we can move away from all the legacy we’re currently dragging along. For Linux it might not be as noticeable as Linux is pretty heavy. But for Unikernels, this would open up whole new use cases for us. Virtual machines are different from physical machines. It is time software took that into account in the way we architect our infrastructure. 
