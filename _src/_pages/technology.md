---
layout: static-page
title: IncludeOS Technology
class: page
permalink: /technology.html
summary: "An overview of IncludeOS and its potential uses."
---

```c++
// Minimal, bootable IncludeOS application
#include <os>

int main() {
    printf("IncludeOS successfully booted.")
}

```

# Overview

IncludeOS is an operating system written as a library. When building an application, the build system includes the code that would typically reside in your operating system into the application itself. When it is done building a bootloader is added. So, after a successful build, you now have a standalone application that boots without an operating system. The application is now capable of driving the hardware, it has an IP stack and manages its memory.

Unlike more traditional operating systems IncludeOS is meant for _single task computers_. There is only a single application running. For multiple security domains, we require multiple machines, and we leave the separation task to the hypervisor.

We've created IncludeOS in modern C++. So IncludeOS can compile C and C++ applications natively. Currently, these are the only programming languages supported. We'll add support for other language runtimes in 2019.

Natively, IncludeOS is event-driven. The OS can emulate traditional blocking calls, but the preferred way to interact with the OS is through its event framework. Node.js inspired our event model and provides similar abstractions.

IncludeOS can take advantage of multiple CPUs and threads can be used to distribute workload onto multiple CPU cores.

IncludeOS maintains limited source-code compatibility with Linux. So libraries that compile on Linux should compile on IncludeOS as well. An application needs some work to run on Linux. The initialization part of a Linux application is typically Unix-specific and likely needs to be altered. 

We implemented the Linux compatibility through the use of the [Musl] library.

# What problem are we trying to solve?

![Security]({{site-url}}/assets/img/chain.jpg){: .align-right}

## Security

The problem with the modern operating system is the way they are built and run. They can be re-configured at any time. If an attacker can gain access to a Linux-based system, there are few limits to what the attacker can do. The attacker can install new software, modify existing software, alter the networking or extract information from the system.  An IncludeOS instance, on the other hand, is fully defined when built. The image cannot be modified while running. It is _immutable_.

In addition to being immutable, the attack surface of an IncludeOS application is reduced dramatically compared to running on a general purpose operating system. Unused code gets stripped out by the linker.  So, if you don't use the IP stack, the application won't have one.  On a platform like IncludeOS, you don't have to spend time locking down the operating system before deployment.

So, you might ask, if the application is immutable, how does one update the application remotely? IncludeOS has a nifty feature called [LiveUpdate] which allows you to remotely download a new image onto a computer and execute it. It even allows for a "hot update," without downtime. If you are specifically interested in this, please read our blog post on [LiveUpdate].

## Image- and memory size

The images produced by the build system are quite small and require little memory. On the X86-64 architecture, we typically see applications being around 2-3 megabytes in size.  We're also quite frugal with memory, and we can boot on systems with just 4-5 megabytes of memory.

## Performance

IncludeOS can outperform a general purpose operating system due to two different factors. One is the lack of context switches. Performance suffers as Linux switches in and out of kernel space. With only a single task running there are no context switches.

An IncludeOS system is compiled and optimized as a whole. The optimizers, both in the compiler and linker stages, see more of what the whole system is doing and has the potential to optimize further. 

## Real-time characteristics

There is no process preemption in IncludeOS. The operating system is pretty static in its behavior, so as long as the machine itself is predictable, the latency and jitter are predictable as well. So on bare metal hardware, IncludeOS can be considered a real-time operating system.

## Developing and debugging IncludeOS

Since your application is the only thing that is running on the machine profiling and debugging is different compared to on a traditional operating system.

However, IncludeOS does support compiling and running its applications on Linux. As we’ve mentioned its a library operating system and this allows us to compile your IncludeOS application as a regular Linux application, granting you full access to all the debuggers and profilers available on Linux.

IncludeOS has a [built in profiler](/blog/2016/non-intrusive-real-time-stack-sampling-in-includeos.html) that can sample the stack at given intervals. 

Once running in a supported virtual machine, you can still debug the application if you have access to the built-in debugger in Qemu/KVM.

On bare metal hardware like the Raspberry Pi, we expect to provide JTAG-style debugging.

# Applications

So how can this be applied? How can this be useful?

## Virtual Networking Appliances

We've successfully deployed IncludeOS as firewall- and load balancingers. The modular IP stack and flexible configuration language, [NaCl], allows for small, fast and secure virtual appliances that can help secure your virtualized network.

[Performance, compared to Linux, is excellent](/blog/2018/performance.html). Specifically, we performance being very well kept us as the number of firewall rules increase as the compiler does an excellent job at optimizing the ruleset.

![Raspberry Pi]({{site-url}}/assets/img/raspberry-device.jpg){: .align-right}

## IoT devices

For IoT devices security is paramount. These devices might spend years in foreign networks without the luxury of firewalls and intrusion detection systems protecting them from attacks. As the OS itself isn't run-time reconfigurable attacks against these devices are very hard to pull off.

In the summer of 2018 Horizon 2020 awarded the IncludeOS project funds to port IncludeOS to the ARM architecture. During 2019 we expect IncludeOS to boot on the Raspberry Pi M3 B+. Our goal is to provide your IoT project with a secure and real-time capable operating system on CPU platforms.

The blog post announcing the port to ARM is available [here](https://www.includeos.org/blog/2018/port-to-arm.html).

## Serverless platforms - FaaS

The rise of serverless platforms presents an exciting opportunity for IncludeOS. Putting the application code into IncludeOS can provide a dramatically shorter response time when coming from a “cold” situation. The ["Unikernels as processes"](https://dl.acm.org/citation.cfm?id=3267845) article referenced below shows how Unikernels could be used to implement a FaaS architecture. FaaS applications are predefined ahead of execution, so there is a natural fit between FaaS and IncludeOS. Support for Node.js would be needed, and we expect Node support to arrive in 2019.

# How about Containers?

While there might be some workload that currently runs on containers that could be moved to IncludeOS the differences between a container platform like Docker and IncludeOS are just too big. Containers are very, very generic and IncludeOS is, by design, very specific. So we don't expect IncludeOS to kill off Docker anytime soon.

# Further reading

## Research on IncludeOS

* Bratterud et al. ["IncludeOS: A minimal, resource efficient unikernel for cloud services."](https://folk.uio.no/paalee/publications/2015-cloudcom.pdf) Cloud Computing Technology and Science (CloudCom), 2015 IEEE 7th International Conference on. IEEE, 2015.
The initial paper outlining the idea and architecture behind IncludeOS. The paper was [reviewed](https://blog.acolyer.org/2016/02/22/includeos/) on [the morning paper].

* Pasquier, Eyers, Bacon ["PHP2Uni: Building Unikernels Using Scripting Language Transpilation"](https://scholar.harvard.edu/files/tfjmp/files/2017ic2ephp2uni.pdf). The paper outlines a toolchain to transpile and compile the scripting language PHP to a Unikernel application and discusses this concept. 

* Bratterud, Happe, and Anderson Keith Duncan. ["Enhancing Cloud Security and Privacy: The Unikernel Solution."](http://aura.abdn.ac.uk/bitstream/handle/2164/8524/AAB02.pdf?sequence=1) Eighth International Conference on Cloud Computing, GRIDs, and Virtualization, 19 February 2017-23 February 2017, Athens, Greece. Curran Associates, 2017. 

* Happe, Duncan, Bratterud. ["Unikernels for Cloud Architectures: How Single Responsibility can Reduce Complexity, Thus Improving Enterprise Cloud Security."](https://www.researchgate.net/publication/316588898_Unikernels_for_Cloud_Architectures_How_Single_Responsibility_can_Reduce_Complexity_Thus_Improving_Enterprise_Cloud_Security) Proceedings of the 2nd International Conference on Complexity, Future Information Systems and Risk. SciTePress, 2017.

* Williams, Koller, Lucina, Prakash. ["Unikernels as Processes"](https://dl.acm.org/citation.cfm?id=3267845). The paper discusses using Unikernels to create completely static, self-contained binaries and running them as Linux processes using the jailing mechanism provided by seccomp. This is of particular interest when looking at Unikernels as a way to realize a fast and secure platform for FaaS.

* Tambs, [Unikernel Firewall Performance Evaluation: IncludeOS vs. Linux](https://www.duo.uio.no/handle/10852/63891), Tambs makes a comparison of Linux-based firewalls with IncludeOS based firewalls. It showcases the concept behind [NaCl] pretty well.


## Other content discussing IncludeOS
* [My first look at unikernels on Vsphere](http://cormachogan.com/2017/06/20/first-look-unikernels-vsphere/). Cormac Hogan, Chief Technologist in VMware. 
* [LWN: IncludeOS: a unikernel for C++ applications](https://lwn.net/Articles/728682/), Nur Hussein writes about his experiments with IncludeOS on Linux Weekly News. 



## Videos and presentations

* Alfred Bratteruds first presentation of IncludeOS at Cppcon 2016 - [#include ＜os＞: from bootloader to REST API with the new C++](https://www.youtube.com/watch?v=t4etEwG2_LY)
* Alfred Bratteruds presentation at Cppcon 2017, [Deconstructing the OS: The Devil is in the side effects](https://www.youtube.com/watch?v=h7D88U-5pKc)
* Per Buer, [Running C++ applications without an operating system](https://www.youtube.com/watch?v=cQPrtTsM7Zg), a general introduction to IncludeOS for C++ developers delivered on NDC Techtown in 2018.
* Jason Turner shows off his work on [retro graphics with IncludeOS](https://www.youtube.com/watch?v=HB__A7-tu2U) rendering Mandelbrot graphics.


If you would like to have your research or video mentioned here, please reach out to us.


[Musl]: https://www.musl-libc.org/
[LiveUpdate]: /blog/2017/liveupdate.html
[NaCl]: /blog/2017/introducing-nacl.html

