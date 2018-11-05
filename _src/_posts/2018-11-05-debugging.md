---
layout: post
title:  "Developing and debugging IncludeOS applications"
author: alfred
date:   2018-11-05 07:43:42 +0200
categories: [development,debugging,profiling]
hero: /assets/img/posts/aphids.jpg
author-image: /assets/img/authors/alfred.jpg
summary: "How do we develop, debug and profile IncludeOS applications?"
---

# Developing and debugging IncludeOS applications

One of the criticisms raised against Unikernels is that they are hard to debug. Since a running unikernel application doesn’t have a general purpose OS beneath it how can you invoke gdb? There is no shell, remember? Not having a shell is one of the main benefits behind Unikernels. The flip side is that it makes developing and debugging different from what you’re used to. Not impossible, not even hard, but different.

Well, we have spent the last years developing both IncludeOS itself as well as numerous applications we’ve spent endless hours debugging. So we have some experience with it and I thought we should spend some time explaining how we do it.

## Running IncludeOS applications under Linux

Did you know that you can compile IncludeOS applications under Linux? IncludeOS, being a library operating system, supports using Linux as the backend. You’ll be using the IncludeOS networking stack, but instead of using the IncludeOS networking drivers IncludeOS would get it’s packets from a TAP device.

The nice thing with running IncludeOS like this is that you have every Linux debugging and profiling tool is available to you. In order to build for the Linux target you’ll need to include the cmake script ```$INCLUDEOS_PREFIX/includeos/linux.service.cmake``` in the bottom of your build file. In the IncludeOS git repo there are tests that can be found under ```test/linux``` where we do some rudimentary testing of the functionality. In ```$INCLUDEOS_PREFIX/bin```, which should be in your path there is a helper script called lxp-run, which will build and execute your program. It needs you to set the enviroment variable ```$INCLUDEOS_SRC``` to your source folder. In addition the folder ```$INCLUDEOS_SRC/linux/build``` needs to be created. On the first invocation lxp-run will build IncludeOS for Linux.

When building the resulting ELF binary will be placed inside the build folder of your project, named according to the CMake configuration. You execute it as with any other statically linked binary on Linux.

There are a few caveats. [LiveUpdate] doesn’t work under Linux as memory is managed quite differently inside a Linux application. Also, the networking is using a TAP device and we’ve yet to add support for more than one device.

Perhaps the bug doesn’t show up when running under Linux. The networking and memory are managed differently and perhaps the timing is off so your bug is masked - then what do you do?


![Bugs]({{site-url}}/assets/img/posts/fly.jpg){:style="float: right;margin-right: 7px;margin-top: 7px;"}

## Debugging IncludeOS virtual machine with gdb

Debugging binaries running in virtual machines has been done for a long time. It works just like other types of remote debugging, such as on an embedded device or on a remote server, by having the program host communicate over some networking protocol instead of trapping directly to the debugger process whenever you hit a breakpoint. gdb is one example of a debugger that can do this, and once you have it set up debugging a running IncludeOS service inside a virtual machine is exactly like debugging any other program. You'll be able to single-step through your code, inspect the value of local variables, inspect stack frames and registers (or modify them) and everything else as you go, with GUI assistance if you prefer.

### Short version, Linux only

You’ll need ```#include <debug>``` in the source file where you want debugging to start. Then add GDB_ENTRY inside a function, such as at the beginning of Service::start or main. This is needed because IncludeOS on the x86_pc platform has a some 32-bit assembly code right at the beginning of the otherwise 64-bit ELF binary, which will confuse gdb if it stops before fully entering 64-bit long mode. (There are probably nicer ways around this hack - please share if you know them)
Build your service with the debug option enabled in cmake - or otherwise make sure you compile with -g. If you also want to debug IncludeOS source code, you need to build and install IncludeOS with the debug cmake option enabled as well.

    $ boot -d .  # in your IncludeOS service directory (e.g. where your CmakeLists.txt is)
    gdb build/my_binary
    (gdb) target remote localhost:1234

You should now see something like this:

	(gdb) target remote localhost:1234
	Remote debugging using localhost:1234
	0x0000000000201bc6 in Service::start ()
    	at /home/alfred/IncludeOS/examples/demo_service/service.cpp:132
	132      GDB_ENTRY;
	(gdb) break my_funcion
	(gdb) ...
	(gdb) set $eax=1
	(gdb) c
	Continuing.

The service will now run until it hits any of the breakpoints set in gdb

## Details
### Compiling with the debug option

I recommend installing ccmake, which gives you a terminal friendly GUI for enabling cmake options. To build IncludeOS itself with debug options enabled after having installed using install.sh, go to your/IncludeOS/build_x86_64/ and do ccmake ... Type c if Togggle debug, then type g to generate and q to quit. Now e.g. make -j24 install will recompile and install using the same build parameters as before.

Enabling debugging for IncludeOS is necessary if you want to single-step through IncludeOS source code, but is otherwise optional. What you have to do in order to allow gdb to understand your binary is to compile your actual service with the debug option.

### Why do I have to modify source code?

This is really only because of the multiboot specification and it's only the case if you boot 64-bit IncludeOS binaries. Multiboot is explicitly targeted towards 32-bit and when booting with a multiboot bootloader such as GRUB or directly with qemu -kernel my_includeos, it specifies that the machine will be in 32-bit protected mode. For this reason we have a small 32-bit code snippet in our 64-bit ELF binaries that handles the transition into 64-bit long mode. This throws GDB off balance. Usually when setting up qemu with a GDB server you'd specify both the -s flag (server) and the -S-flag (stop), where the latter would cause qemu to prevent executing code until a debugger connects to the debugging port. But since GDB gets confused if you switch from 32- to 64- bit after debugging has started, we need to start debugging only after the transition to 64-bit is complete.

### Why doesn't it work on Mac?

An IncludeOS service is an ELF binary, whereas the gdb that ships with e.g. homebrew is built for Mach-O binaries. Since recent Macs use x86 processors the CPU can run the IncludeOS code just fine, but the debugger that ships for mac just isn't configured to debug ELF binaries. You could probably build gdb from source, for Mac, but still target it to debug ELF binaries- or use the LLVM alternative lldb. If you'd like to have a go at this please do so and share your findings. We'd happily accept PR's that helped simplify debugging on mac or windows.

### The GDB_ENTRY macro

It's really just a for-loop that waits for the eax register to be something else than 0. It could be anything, really, we just need some way of stopping from the inside (since we can't use -S) so that GDB is able to take control.

### Using the a gdb script

There's a simple gdb script in ```IncludeOS/etc/debug/service.gdb``` that can be useful if you want to use the GDB_ENTRY macro.

## Experts please chime in

If you know how debuggers actually work under the hood and have ideas for how we could simplify the process or make it work on other platforms, please tell us! PR's are the best form of feedback, but concrete information in the form of comments are most welcome. You can join our [Slack] if you prefer.

[LiveUpdate]: /blog/2017/liveupdate.html
[Slack]: https://goo.gl/NXBVsc
