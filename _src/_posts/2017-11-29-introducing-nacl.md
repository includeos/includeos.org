---
layout: post
title:  Introducing NaCl
author: annika
date:   2017-11-29 10:00:42 +0200
categories: [feature]
hero: /assets/img/posts/squirrel-493790_640.jpg
author-image: /assets/img/authors/annika.jpg
summary: "NaCl is a configuration language for IncludeOS that allows you to express firewall rules in an easy and efficient manner."
---

IncludeOS now has a routing firewall built into it. It is, like everything else we do, implemented in C++. Initially, we thought we would write firewall and routing rules in C++. Writing code isn’t ideal however, as people aren’t interested in programming C++ just to open a port or allow a new host access to the network. We needed a level of abstraction to provide some ease of use to our product. So, how do you define a new language for configuring a unikernel firewall?

A fundamental characteristic of unikernels is the lack of distinction between code and configuration at runtime. If you have a running instance and you want to reconfigure it, you’ll need to rebuild the image. It may sound cumbersome, but in reality, it isn't. The update process provided by [LiveUpdate] means you can change, build and deploy a change in a matter of seconds.

In every sophisticated piece of software, there is a base pattern, a way of solving challenges that feel native to the software. When adding a new component, you should strive to create something that feels native to the rest of the system. You should adhere to the character of the software. For Unikernels, this base pattern is that everything is code. And as such, we should try to express everything, even the configuration, as code.

There is a performance motivation for expressing configuration through code, in addition to usability aspect. You get to run the source through the compiler and the linker. Modern compilers/linkers are amazing pieces of software, and many skilled people have spent tens of thousands of hours working on them and optimizing them. If we can leverage this, we should. 

Back to firewalls. We started looking at various firewall implementations. Overall it seems they ingest rules and then create linked lists in memory. Then, when a packet comes along, it's passed through these chains of rules and evaluated. Each rule can have an action associated with it, and if the rule evaluates to true, it is executed. It’s a classic state machine, and we can likely create something faster and more flexible.

![Traditional firewall process]({{site-url}}/assets/img/posts/firewall-trans.png)

So, instead of looking to FreeBSD or Linux and try to mimic their firewall code, we decided to use a transpiler. We let the user define the firewall in an accessible, high-level language, and then we’ll take this code, transpile it to C++, compile the resulting C++ and link it into the binary. This technique has been shown to be successful in how [Varnish Cache] handles its configuration language, [VCL].

We've named the resulting language NaCl, Not a Configuration language, and to use this configuration language together with IncludeOS, all you have to do is add a `nacl.txt` file to your service. For example, to add an interface to your service, you can write this, in `nacl.txt`:

```
Iface eth0 {
    index: 0,
    address: 10.0.0.45,
    netmask: 255.255.255.0,
    gateway: 10.0.0.1,
    dns: 8.8.8.8
}
```

When you build the service, this is transpiled into C++ for you, and is handled as if you wrote the C++ code at the beginning of your service.cpp file’s `Service::start` method:

```cpp
auto& eth0 = Inet4::stack<0>();
eth0.network_config(IP4::addr{10,0,0,45}, IP4::addr{255,255,255,0}, IP4::addr{10,0,0,1}, IP4::addr{8,8,8,8});
```

Each interface in IncludeOS has a prerouting, input, output and postrouting chain. These are chains of functions (delegates) that packets are traveling through on their way to and from your interface. You can add your filters to these chains, create a firewall, and add NAT rules. 

Incoming packets first travel through the prerouting chain. If a packet survives the chain, meaning it is not dropped in any of the chain’s functions, it travels on through the input chain. Outgoing packets first travel through the output chain, and then on through the postrouting chain and out towards their destinations. If your application is a router and you've defined a gateway,  there'll be a forward chain handling routed packets, but I won't go into details about this now. You can take a look at the documentation and examples in the [NaCl repository](https://github.com/includeos/NaCl) if you want to find out more about packet forwarding and other possibilities in NaCl.

To create your own Filter in NaCl and add this to the prerouting chain of the previously defined Iface eth0, you can write:

```
Filter::IP my_filter {
    if (ip.daddr == 10.0.0.45) {
        accept
    }
    drop
}

eth0.prerouting: my_filter
```

NaCl has been created using [ANTLR], a parser generator that takes a language grammar as input and produces a parser that can recognize text written in that language and from that build and walk parse trees. I've built the NaCl transpiler on top of the output from ANTLR.

In the NaCl grammar we have defined a function, meaning an element that has the following structure:

```
<type>::<subtype> <name> { <body> }
```

By comparing this to the Filter example above, we can see that a Filter is a type of function, where the subtype is IP, the name is my_filter and the body consists of an if-statement and a default verdict drop. The function, in other words, handles IP packets and only accepts packets with destination address 10.0.0.45.

As of now, the types of functions that exist in NaCl are Filter and Nat, where Nat functions can source NAT or destination NAT packets, while Filter functions can drop or accept packets. The body of a NaCl function can contain if- and else-statements, inner functions, and actions. Each statement has to result in an action, where possible actions as of now are; `accept`, `drop`, names of other functions, `log`, `snat` and `dnat`.

Possible function subtypes are IP, ICMP, TCP and UDP. Possible packet properties that can be inspected are ct (connection tracking), ip, icmp, tcp and udp properties (f.ex. icmp.type, udp.checksum, tcp.sport). The subtype implicates restrictions, however: While all functions can inspect the ct and ip properties of a packet, a function of subtype ICMP can only inspect icmp properties, a function of subtype TCP can only inspect tcp properties, and a function of subtype UDP can only inspect udp properties. This is logical because a packet cannot both be an ICMP and a TCP packet, but all packets are IP packets. NaCl has been implemented in this way to facilitate a closer one-to-one relationship between the NaCl configuration and the transpiled C++ code. In IncludeOS, written in C++, you have to cast an IP packet to a TCP packet to have access to the TCP properties of the packet, and you can only do this if the packet’s protocol is TCP. By structuring the NaCl functions by subtype, there is a one-to-one relationship between the NaCl configuration and the transpiled C++ code, and this makes the transpilation less error prone.

To only accept TCP packets going to the previously defined interface eth0 on port 80 (HTTP), and to instantly accept packets where the connection state is "established," use the following code:

```
Filter::IP my_filter {
    log(“Incoming packet from ”, ip.saddr, ” going to ”, ip.daddr, “\n”)

    if (ct.state == established) {
        log(“Connection tracking state == established: Accepting\n”)
        accept
    }

    Filter::TCP {
        log(“This is a TCP packet\n”)
        if (ip.daddr == eth0.address and tcp.dport == 80) {
            log(“Accepting TCP packet with destination address ”, ip.daddr, “ and destination port ”, tcp.dport, “\n”)
            accept
		    }
    }
    log(“Default verdict: Dropping packet\n”)
    drop
}
```

In addition to functions, the NaCl grammar also specifies initializers and typed_initializers. Iface is a type of typed_initializer and is identified by having the following structure:

```
<type> <name> <value>
```

For a typed_initializer like `Iface`, the value is usually an object (starts and ends with curly brackets and contains key-value pairs), and the properties are predefined.

We have however also defined (untyped) initializers in the NaCl grammar, that enables you to define constants that you can use in your NaCl configuration. An initializer element has the following structure:

```
<name>: <value>
```

You can for example create a constant named `my_port` that represents the value 4040:

```
my_port: 4040
```

You can also create a list of ports that you want to accept traffic to and a list of addresses you want to accept traffic from in a Filter:

```
my_ports: [
    80,
	1010-1030,
	my_port
]

my_addrs [
    eth0.gateway,
	10.0.0.50-10.0.0.60,
	140.10.20.0/24
]
```

And then create a TCP Filter that contains this rule:

```
Filter::TCP my_tcp_filter {
    if (ip.saddr in my_addrs and tcp.dport in my_ports) {
        accept
	}
}
```

This TCP Filter can then be invoked from your IP Filter:

```
Filter::IP my_filter {
    log(“Incoming packet from ”, ip.saddr, ” going to ”, ip.daddr, “\n”)

    if (ct.state == established) {
        log(“Connection tracking state == established: Accepting\n”)
        accept
	}

    my_tcp_filter()
    log(“Default verdict: Dropping packet\n”)
	drop
}
```

It turns out this works very well. The resulting code is fast and flexible, and we've been able to do sophisticated packet mangling while routing packets. We'll follow up with another post detailing more the concrete use-case.

NaCl can have implications for more than just our firewall. Other infrastructure components could definitively use a configuration language that allows you to express configuration logically. If we were to implement a load balancer using NaCl it would be very, very powerful.


[ANTLR]: http://www.antlr.org/
[LiveUpdate]: /blog/2017/liveupdate.html
[Varnish Cache]: http://www.varnish-cache.org/
[VCL]: https://www.varnish-software.com/glossary/what-is-vcl/
