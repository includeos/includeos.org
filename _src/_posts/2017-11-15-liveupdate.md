---
layout: post
title:  Introducing Liveupdate
author: perbu
date:   2017-10-15 10:00:42 +0200
categories: [feature]
hero: /assets/img/posts/very-fluffy-squirrel.jpg
author-image: /assets/img/authors/perbu.jpg
summary: "Live update allows you to upgrade IncludeOS applications without downtime"
---

A defining characteristic of unikernels is that they are immutable. To change a running unikernel, you’ll need to build a new image and replace the image of the running server. A reboot is likely required. Even though this is relatively quick, it indeed isn't ideal.

LiveUpdate in IncludeOS changes this. The application can now update itself without any noticeable downtime.  In this example, I’ll use our orchestration platform, IncludeOS Mothership, as an example. However, updates don’t need to happen this way. You’re free to use any other way to upgrade.

When the application boots up it establishes a connection the Mothership - we call this an “uplink”. This link serves several purposes. Logs, metrics and other relevant data are collected over this connection. Also, this connection is used to update the running instance through LiveUpdate. 

![Liveupdate process]({{site-url}}/assets/img/posts/liveupdate.gif)

## How an upgrade happens
When the Mothership decides an instance needs an update it will push down a new image over the uplink. IncludeOS will store this in memory. Once the new image is in place a callback in the application is called which serializes the state of the application. Since there is no kernel/application split the application can serialize everything, including open sockets, file descriptors, etc. The application sees everything that happens inside the virtual machine. There are numerous exciting opportunities from having everything run in a single context, but we’ll get to those in other blog posts.

Once the state is stored we just boot the new application. Likely it’ll take only a few milliseconds. Once the new application is booted up IncludeOS will issue a callback with a reference to where the previous state was stored. The application now deserializes this state and will resume execution. 

We might lose a packet or two during the store/boot/restore-state so a TCP connection or two might stutter a bit. From the time we serialize the state of our application to we deserialize it the application is effectively down, interrupts are ignored. Just how long this period depends on the application and the platform it is running on. If you have hundreds of megabytes of state, it'll take time to jot all this down. If you have a load balancer with a just a few thousand connections running through it'll be lightning fast. 

We’ve had this working since January. It's been applied to a number of applications. We've done a web server, IRCd server, load balancer and a few others. It is perfect for transaction-oriented workloads like HTTP. 

## Booting other operating systems with LiveUpdate

In practice, there are few limitations on what sort of code we can execute using LiveUpdate. It could be used to execute other unikernels. It could even be used to boot Linux or Windows. So, if you ever wanted to build an HTTP-based bootloader, IncludeOS might be able to help you realize that. Just don’t try to pin the idea on us if you run into security issues.

![Liveupdate process]({{site-url}}/assets/img/posts/liveupdate-terminal.gif)


## Testing live update

In the latest release, [IncludeOS 0.11], you can easily test this. In the [examples folder] there is a [example]. Here you can boot up an IncludeOS instance that will listen on a TCP port. The accompanying shell script will take the binary from the build folder and feed it to the existing instance, forcing an update. Please note that there are no security mechanisms in place here and you should under no circumstance rely on such a primitive mechanism in a production environment. The example is simplistic on purpose to show what the minimal implementation is like.

LiveUpdate is not really that complex. It is more a consequence of the fundamentally different architecture of unikernels. A unikernel is _one_ entity as opposed to your traditional application that resides on top of the kernel/application split.

[IncludeOS 0.11]: /blog/2017/includeos-0.11-released.html
[example]: https://github.com/hioa-cs/IncludeOS/tree/v0.11.0/examples/LiveUpdate
[examples folder]: https://github.com/hioa-cs/IncludeOS/tree/v0.11.0/examples/
