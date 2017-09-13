---
layout: post
title:  "IncludeOS on Solo5 and ukvm"
author: alfred
date:   2017-08-29 09:00:42 +0200
categories: blog
author-image: /assets/img/authors/alfred.jpg
hero: /assets/img/posts/blue/blueberries-2270379_640.jpg

---


_Thanks to [Ricardo Koller] at IBM Research, IncludeOS now runs on [ukvm], possibly the tiniest hypervisor in existence._

Originally developed by [Dan Williams], also from IBM, with major contributions by Martin "[Mato]" Lucina at Docker and Ricardo Koller, [ukvm] is one of two backends currently supported by the [Solo5] unikernel interface, the other being the [virtio] backend used for e.g. getting MirageOS to run on [kvm]. 

My real introduction to ukvm was during Docker Distributed systems summit in Berlin last fall. I was well aware of the project before then, via Dan Williams paper and from conversations with Amir and Anil from Docker, but I needed some hands on to really get the point. Getting Mato to guide me through the interface and show med some examples did the trick. Instead of an async non blocking DMA solution like we get with virtio, where virtio uses interrupts fired from virtual PCI devices to signal e.g. network packets being received or other I/O events, ukvm bakes it all into a single blocking function call - [ukvm_poll(int ns)]. The function will block until an I/O event happened- or the provided number of nanoseconds passed. 

After discussing this with [Alf] we looked at our x86 PC platform code and sighed; all that just to get timers and events.

While I immediately realized we’ll need some kind of async DMA interface to get great networking performance with ukvm I also knew we had to add support for this slim, minimal beauty in IncludeOS. Being designed for virtualization and with an explicit goal of being a zero overhead operating system, the simplifications you get inside a VM when you remove the old device model is exactly the kind of technology we want to support. At that point we were in the middle of transitioning to x86_64 and I decided to also reorganize our project to support not only multiple architectures but also multiple platforms, within the same architecture. As we were finishing this work I got my favourite kind of email; someone just did something really cool with IncludeOS. The email was from Dan Williams and Ricardo Koller, including these screenshots showing IncludeOS and our demo appliance [Acorn] running on Solo5.

![ukvm boot]({{site-url}}/media/ukvm-screenshot-1.png)

Boot time reduced from ~300ms to ~11 ms.

![ukvm boot 2]({{site-url}}/media/ukvm-screenshot-2.png)

Solo5 device driver registered - here as a mock PCI device, later changed to remove any PCI reference.

## From fast to instant

The last time I’d measured the boot time of IncludeOS I’d gotten it down to around 300ms. While this is fast, it’s far from what you’d get with MirageOS running on Xen. I had however also noticed that almost all the booting time for IncludeOS on kvm was spent starting Qemu - which kind of makes sense - it essentially has to emulate the whole PC, run a virtual BIOS and set up all the virtual hardware required to emulate a full blown PC. Needless to say this was a little frustrating making the Solo5 numbers from Dan and Ricardo very welcome. 

Solo5 boots faster. So what? First of all, shaving 250 ms. off of the boot time takes it from being fast to being instant. 300 ms. will seem very fast, but you'll notice. Your brain simply can’t notice an 11ms. event taking place. It would be like trying to notice a single frame in a 100 fps game, which is almost 10 times faster than the classical 24fps from old movies. Secondly, interesting projects like the Jitsu DNS server shows that this kind of fast can be leveraged in very useful ways - it means you actually have time to postpone booting a web server until the DNS request for a web site comes in, like an early warning. We could try with 300 ms., and we might get away with it, but you'd notice the lag.

For IBM Research, due to the fast boot times of ukvm services, Solo5 is currently being explored as a framework for [serverless computing]. Instead of having functions run as a process inside a docker container, which again often runs inside a virtual machine, you can now have a function run directly inside a virtual machine, with none of the overhead of classical PC virtualization. 

## A new generation of hypervisors

Another hypervisor project we’ve been excited about is [Bareflank], an emerging C++ hypervisor framework with focus on minimal trusted codebase and security. After meeting [Rian Quinn] at [CppCon] last year and hearing his talk we immediately connected, having dealt with many of the same issues with tooling and standard libraries in order to get full C++ support into a standalone elf binary. As a hypervisor [Bareflank] is taking a more radical approach than ukvm in the sense that they’re throwing all of [kvm] on the boat and reimplementing the virtualization hardware interface from scratch, for both Windows and Linux. What’s similar about the two projects is that contrary to classical paravirtualization interfaces such as [Xen], they both start out with the premise that hardware virtualization is the correct basic mechanism for isolating services, but except for that the interface between hypervisor and guest is completely up for debate.

Working with these projects I’ve learned to disconnect the isolation mechanism from the device model. While hardware virtualization is now the de-facto standard for isolation, forcing the VM to be fully self contained, very much in line with [Popek Goldberg] (review [here](https://blog.acolyer.org/2016/02/19/formal-requirements-for-virtualizable-third-generation-architectures/)) , you don’t need either the BIOS, the ACPI, PCI, or the classical interrupt model in order to utilize the isolation. Essentially we’re dropping the [Popek Goldberg Identity requirement] and keeping the rest. According to our CEO Per Buer [Popek Goldberg is now considered harmful] :-)

That being said, we were really happy having gone through all the hoops of supporting a full PC architecture when a large company asked us about booting and running IncludeOS on physical machines - due to some rather extreme requirements for low latency. I hadn’t tried booting a kernel I’d made for at least a couple of years, but thanks to the identity requirement everything worked as expected when I gave it a go and ran the IncludeOS SMP test on my home PC last week.

![IncludeOS on bare metal]({{site-url}}/media/baremetal.jpg)


## Truly immutable virtual machines

While instant boot time is an awesome feature, another maybe even more impactful feature of Solo5,  and eventually Bareflank when they get IncludeOS support, is that they enable memory protection of the loaded ELF binary from within security ring -1, before starting the binary. Essentially they’ll do what a normal program loader would do - look at each part of the ELF and set the protection level according to the flags for each section. This way .rodata becomes truly read-only, the .text segment executable and not mutable and the best part - the rest of memory can be marked non-executable by setting the nx-bit. This means that you can now boot virtual machines with [W^X] enforced by hardware, from below the guest. In particular you can provide guarantees that executable code can’t be located in mutable memory, such as malicious code uploaded over the network and stored on the heap. You can guarantee that an attack towards the VM won’t be able to change those protection settings as they were controlled by a protection level below the running guest.

## The optimal OS interface 

It’s not obvious that an operating system can be designed to work seamlessly on top of both a classical PCI based device model and this new breed of hypervisor. IncludeOS currently runs on both Solo5 and x86 PC hardware, two radically different platforms. We’ll be working hard to keep adding new features while keeping support for both, and to structure our project to be easily adaptable to new ones as well. 

I’ll discuss this in more detail in the upcoming [CppCon] talk [Deconstructing the OS]: The devil’s in the side effects. In the meantime, try booting IncludeOS on Solo5 - you won’t see it until it’s already happened.

[ukvm]: https://www.usenix.org/system/files/conference/hotcloud16/hotcloud16_williams.pdf
[solo5]: https://github.com/Solo5/solo5
[Popek Goldberg Identity requirement]: https://en.wikipedia.org/wiki/Popek_and_Goldberg_virtualization_requirements
[kvm]: https://en.wikipedia.org/wiki/Kernel-based_Virtual_Machine
[virtio]: https://wiki.libvirt.org/page/Virtio
[Dan Williams]: http://researcher.ibm.com/researcher/view.php?person=us-djwillia
[Ricardo Koller]: http://researcher.ibm.com/researcher/view.php?person=us-kollerr
[Mato]: https://github.com/mato
[Alf]: https://github.com/fwsGonzo
[MirageOS]: https://mirage.io/
[Bareflank]: https://github.com/Bareflank/hypervisor
[Popek Goldberg is now considered harmful]: http://blog.includeos.org/2017/06/23/popek-goldberg-machines-considered-harmful
[Deconstructing the OS]: https://cppcon2017.sched.com/event/BgtN/deconstructing-the-os-the-devils-in-the-side-effects
[CppCon]: https://cppcon.org/
[Xen]: https://www.xenproject.org/
[Popek Goldberg]: http://dl.acm.org/citation.cfm?id=361073
[W^X]: https://en.wikipedia.org/wiki/W%5EX
[acorn]: https://github.com/includeos/acorn
[ukvm_poll(int ns)]: https://github.com/Solo5/solo5/blob/master/kernel/ukvm/poll.c#L23
[serverless computing]: https://en.wikipedia.org/wiki/Serverless_computing





