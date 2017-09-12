---
layout: post
title:  "IncludeOS on VMware/ESXi/vSphere"
author: perbu
date:   2017-06-23 09:00:42 +0200
categories: [esxi, vmware, platforms]
author-image: /assets/img/authors/perbu.jpg
hero: /assets/img/posts/yellow/flower-234982_640.jpg
summary: "IncludeOS has, since its inception, supported the paravirtualized drivers for virtio-net. Our deployment platforms where the ones that support virtio. KVM/Qemu, Virtualbox, Openstack and the Google Compute Engine.  We’ve now expanded our support adding ESXi to our list of supported platforms. ESXi is the hypervisor powering all of VMware's enterprise products. Here is how this support came about."
---

![Vmware Logo]({{site-url}}/media/vmware-logo-500px.png){:style="float: right;margin-right: 7px;margin-top: 7px;"}

IncludeOS has, since its inception, supported the paravirtualized drivers for virtio-net. Our deployment platforms where the ones that support virtio. KVM/Qemu, Virtualbox, Openstack and the Google Compute Engine.  We’ve now expanded our support adding ESXi to our list of supported platforms. [ESXi](https://www.vmware.com/products/vsphere-hypervisor.html) is the hypervisor powering all of VMware's enterprise products. Here is how this support came about.

One of our industrial partners, [Basefarm](http://www.basefarm.com), had an experimental [Openstack](https://www.openstack.org) platform and they gave us a whole lot of virtual servers. We moved our build and test systems into Openstack and things were working well. We expanded our partnership by working on what we internally refer to as Piranha - a load balancing product.

Earlier this year Basefarm decided to retire their Openstack installation. I’m not certain what the reasons for this was, but they have at least two other virtual platforms in production and I’m guessing they would prefer avoiding further complexity. This presented two problems for us. 1) where are we going to host our test and QA environment? And 2) what will happen to our Piranha?

Piranha will get a proper introduction in a later post, but the short and sweet of it is that we’re building a load balancing and firewalling platform on top of IncludeOS. Turns out load balancing and firewalling is an perfect task for a performant unikernel.

[Redpill-Linpro](https://www.redpill-linpro.com), an open source-oriented hosting company, stepped forward and made some room in their openstack environment so we were able to move our internal infrastructure there rather quickly. Kudos to them for helping us out.

We were still forced to do something to get our load balancing project further along. Our goal is to have our load balancer in production before the end of the year. As most of Basefarms production systems run on VMware that became our next target. Since IncludeOS runs directly on x86 hardware and we had rudimentary IDE support (port IO, residing in src/hw/ide.cpp)  it was already booting just fine - all we were really missing was a networking driver.  Alf solved this by locking himself in his cave for a week emerging with a fully functional VMXNET3 driver for IncludeOS (src/drivers/vmnet3*).

So, we’re now in the position where IncludeOS boots and runs on ESXi and all the products that are capable of offering vmxnet3 paravirtualized drivers. This includes VSphere which is the core hypervisor platform Basefarm uses for their virtual servers as well as vcloud, the VMware cloud offering.

This means that you can now compile your IncludeOS image and deploy it on VMware as well as kvm/qemu. No changes are needed to your application's source; simply add vmxnet3 to the list of drivers in your CMakeList. The IP stack will see this as just another NIC and configuration is as before. If you don’t mind adding a few Kb to your binaries you can simply link all network drivers into the image making it  “universal”.

In May we demonstrated our load balancer platform for the [Oslo VMware User Group](http://www.vmnug.no). In attendance was VMware's chief technologist [Cormac Hogan](http://cormachogan.com). He summarised the presentation in a blog post [My first look at unikernels on VSphere](http://cormachogan.com/2017/06/20/first-look-unikernels-vsphere/).

If you think this might be relevant to you, feel free to reach out to me on [twitter](https://www.twitter.com/perbu) or our [Gitter chat](https://gitter.im/hioa-cs/IncludeOS) or in any other way. I'm easy to find.
