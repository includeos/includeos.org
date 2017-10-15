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

A defining characteristic of Unikernels is that they are immutable. In order to change a running unikernel you’ll need to build a new image and replace the image of the running server. A reboot is likely needed. Even though this is fairly quick it certainly isn't ideal.

Liveupdate in IncludeOS changes this. The application can now update itself without any noticeable downtime. It sounds too good to be true, but bear with me and I’ll explain how it works. It's not really that complex. It is more a consequence of the fundamentally different architecture of unikernels.

In this example I’ll use our orchestration platform, IncludeOS Mothership, as an example. However, updates don’t need to happen this way. You’re free to use any other way to upgrade.

When the application boots up it establishes a connection the Mothership - we call this an “uplink”. This connection serves several purposes. Logs, metrics and other relevant data are also collected over this connection. In addition this connection is used to update the running instance through Liveupdate. You don't really need uplink to use Liveupdate as we'll see later.

![Liveupdate process]({{site-url}}/assets/img/posts/liveupdate.gif)

## How an upgrade happens
When the Mothership decides an instance needs an update it will push down a new image over the uplink. IncludeOS will store this in memory. Once the new image is in place a callback in the application is called which serializes the state of the application. Since there is no kernel/application split the application can serialize everything, including open sockets, file descriptors, etc. The application sees everything that happens inside the virtual machine. This opens a lot of interesting opportunities, but we’ll get to those in other blogposts.

Once state is stored we just boot the new application. Likely it’ll be take just a few milliseconds. Once the new application is booted up IncludeOS will issue a callback with a reference to where the previous state was stored. The application now deserializes this state and will resume execution. 

We might lose a packet or two during the store/boot/restore-state so a TCP connection or two might stutter a bit. From the time we serialize the state of our application to we deserialize it the application is effectively down, interrupts are ignored. Just how long this period is depends on the application and the platform it is running on. If you have hundreds of megabytes of state it'll take time to jot all this down. If you have a load balancer with a just a few thousand connections running through it it'll be lightning fast. 

We’ve had this working since January. It's been applied to a number of applications. We've done a web server, IRCd server, load balancer and a few others. It is perfect for transaction oriented workloads like HTTP. 

## Booting other operating systems with Liveupdate

In practice there are few limitations on what sort of code we can execute. This could be used to execute other unikernels. It could even be used to boot Linux or Windows. So, if you ever wanted to build a HTTP-based bootloader, IncludeOS might be able to help you realize that. Just don’t try to pin the idea on us if you run into security issues.

![Liveupdate process]({{site-url}}/assets/img/posts/liveupdate-terminal.gif)


## Testing live update

In the latest release, [IncludeOS 0.11], you can easily test this. In the [examples folder] there is a an [example]. Here you can boot up an IncludeOS instance that will listen on a TCP port. The accompanying shell script will take the binary from the build folder and feed it to the existing instance, forcing an update. Please note that there is no security mechanisms in place here and you should under no circumstance rely on such a primitive mechanism in a production environment. The example is simplistic on purpose to show what the minimal implementation looks like.


