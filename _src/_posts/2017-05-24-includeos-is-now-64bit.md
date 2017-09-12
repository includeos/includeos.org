---
layout: post
title:  "IncludeOS is now 64 bit"
author: perbu
date:   2017-05-24 14:30:42 +0200
categories: [64 bit, includeos, architectures]
hero: /assets/img/posts/yellow/macro-191090_640.jpg
author-image: /assets/img/authors/perbu.jpg
summary: "For historical reasons IncludeOS started out as 32 bit. However, as
the world is leaving behind 32 bit code as legacy, we’ve always known
that 64 bit support would be inevitable."

---

For historical reasons IncludeOS started out as 32 bit. However, as
the world is leaving behind 32 bit code as legacy, we’ve always known
that 64 bit support would be inevitable.

![Intel Haswell CPUs]({{site-url}}/assets/img/posts/haswell.jpg){:style="float: right;margin-right: 7px;margin-top: 7px;"}

So, for the last couple of months we’ve been working to port IncludeOS
to x86-64. We’re retaining support for 32 bit though, and we decided
to use this transition as an opportunity to adapt our build system for
multiple architectures. So, from this moment on we’re essentially
multiplatform. At some later point in time we might add other
platforms as well. Given the time taken to transition from these two
relatively similar platforms we might wait a bit before adding support
for more hardware platforms.

In addition to making sure the codebase was free of assumptions of a
32 bit machine most of the work was the changes in the way 64 bit
instances boot. The page tables and the rest of the memory layout for
a 64 bit machine is different. In addition the calling conventions are
slightly different with 64 bit code having this weird optimization
called the red zone. The red zone is the 128 bytes above the stack
pointer where functions can write temporary data. This led to random
stack corruption and took a few frustrating weeks to figure out.


So, what is different with 64 bit?

Booting 64 bit IncludeOS instances with Qemu is different.  For some
reason Qemu doesn’t support booting images without a bootloader (using
the -kernel option) on 64 bit machines. We could have solved this by
adding grub to the image but 1) grub isn’t typically available on macs
and 2) grub is huge, slow and complex. Booting qemu with the -kernel
option is quick and simple.

So, in order to boot we have a minimal 32 bit includeos instance that
just chainloads the 64 bit image you’ve built. So building on 64 bits
takes longer as we need to build both includeos itself and the tiny
includeos instance that acts as the chainloader. Sounds like a lot of
work? The chainloader is only x lines of code and adds a few
milliseconds to the boot time. Also, you only need it for booting with
qemu locally. For GCE, openstack etc. you can use GRUB, which will
happily load your 64-bit binary.

For the average (!) IncludeOS user this shouldn’t change much. You
just update your IncludeOS installation and recompile. You can finally
have your instances handle more than 4GB of memory. Yay!

We do expect some performance improvements on 64 bit. If you have any
experiences here we’ll love to hear about it in the comments below.
