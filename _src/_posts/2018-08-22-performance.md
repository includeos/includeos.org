---
layout: post
title:  IncludeOS firewall performance
author: tobias
date:   2018-09-18 06:00:42 +0200
categories: [performance, guest post]
hero: /assets/img/posts/cheetah-425468_640.jpg
author-image: /assets/img/authors/tobias.jpg
summary: "A performance analysis of IncludeOS' firewalling capabilites"
---

IncludeOS is a novel operating system. As opposed to the traditional way of having applications interact with the operating system through system calls the application itself gets operating system functionality made available to it as function calls. So, one could say that there is no longer an operating system running beneath the application. The application *is* the operating system.

For my master [thesis] in Network and System Administration I was interested in looking into the network and firewall performance characteristics of Unikernels (IncludeOS) compared to Linux. Linux has for the last ten years or so become the dominant operating system on the internet. As such, Linux has become the benchmark for new operating systems to be compared with. 

## Choosing a platform for comparison.

IncludeOS can run on a multitude of X86 platforms, but for now the only current production deployments are running on VMware’s vSphere platform. vSphere is VMware's commercial hypervisor and management platform, with ESXi being the actual hypervisor. ESXi is free to use and has the same performance characteristics as the full vSphere suite, hence it was the obvious choice for the test system.

OsloMet provided a physical server for the test bench. The server is a Dell PowerEdge R630  with two E5-2698 20-core HT-enabled CPUs and 128 gigabytes of memory - more than enough to set up and run the necessary test network.

ESXi provides virtual networking support using VMware's vSwitch fabric, making it reasonably easy to set up a flexible testing network. The network was set up to allow routing of packets from one network to another through a specific VM based on different network addresses - initially one VM containing Ubuntu Server (Fw1) and one VM containing IncludeOS (Fw2). 


The main thing we wanted to test was differences in pure firewall performance.  The idea was to check performance at given rule set sizes, i.e. on 100, 200, 300 etc. rules, up to a max value. The firewalls were set up so that all rules would have to be checked for matches before the packets went through. 

In a realistic firewall deployment the firewall will typically have some initial rules that will match most of the packets. Most firewalls run with connection tracking enabled and in these installations the first rule is usually a rule that checks if the packet belongs to one of the established connections and when this rule is hit, no more processing is done on the packet. However, since this is supposed to be a test on the actual processing of firewalls rules, the firewall was set up to run through every rule for each packet. 

To highlight IncludeOS ability to run smoothly on a minimum of resources, the IncludeOS VM was given only 1 vCPU and 128 MB RAM, while the much heavier Ubuntu Server VM was given 4 vCPUs and 8 GB of RAM, which should be more than enough to run our experiments. 

Iperf was chosen as the test tool, and for each 100th rule, 30 iperf TCP tests of 30 seconds each were run on the firewall (complying with RFC 3511). The testing was scripted to eliminate variances, and included a two-second pause between each of the 30 tests. Hping3 was used after each change in firewall configuration to verify that the firewalls were actually blocking the intended traffic. 

## Baseline tests
Starting out without any firewall filter (routing only), these are the results:
![Baseline performance levels]({{site-url}}/assets/img/posts/tobias/Fig4.3_Baseline_iperf.png)


Looking at the data from the baseline tests, with Fw1 and Fw2 acting as nothing more than forwarding routers, we can see that the IncludeOS VM outperforms the Linux VMs by quite a big margin. Achieving an average throughput of 9.29 Gbps, IncludeOS was 10.4 percent faster  than Ubuntu Server (8.41 Gbps) and 9 percent faster than AlpineLinux (8.52 Gbps).


## TCP dport filtering
These tests were run with the firewalls containing only TCP dport rules, filtering packets based on TCP destination ports. The Rule sets consisted of up to 5000 rules of the same rule type, but with different TCP dports. The results can be seen in the following graph.

![TCP destination port filtering]({{site-url}}/assets/img/posts/tobias/Fig4.9_TCP-dport.png)

Looking at the graph, we can see that Ubuntu Server using iptables manages a throughput of about 3 Gbps when having to run packets through all 5000 rules. That is about a third of the original throughput of 8.41 Gbps. IncludeOS on the other hand didn’t seem to break a sweat, ending up on just below 9 Gbps, down from 9.29 Gbps.


## Source address filtering
A more realistic scenario is probably to filter incoming packets based on their source addresses, since having large blacklists of blocked IPs is pretty common. 

![Source address filtering]({{site-url}}/assets/img/posts/tobias/Fig4.5_saddr-filtering_bigtext.png)

Looking at the line representing Ubuntu Server, we can see a close to linear decrease in throughput as the number of iptables rules increases. With 5000 source address rules, throughput is down 49,5 percent, from 8.41 Gbps with no rules to 4.24 Gbps. 

IncludeOS on the other hand shows practically no decrease in throughput, pushing the same 9+ Gbps all the way to 5000 rules. 


## Ipset and nftables
While iptables is by far the most common tool for implementing firewalls in Linux environments, ipset is also widely used together with iptables when handling large rule sets. Ipset uses hash tables for quickly looking up IP, network or MAC addresses, ports, interfaces or combinations of these. Nftables may be the technology to eventually take over for iptables (though BPF is also starting to show great potential). The nft command line tool compiles a ruleset into VM bytecode. In addition, using maps and concatenations and with a smaller kernel codebase, nftables should perform a lot better than iptables - at least for large rule sets. 

Testing ipset and nftables gave us the following results
![Source address filtering]({{site-url}}/assets/img/posts/tobias/Fig4.7_TCP-dport-bigtext.png)

As we can see from the graph, ipset and nftables performs on another level compared to iptables when the rule sets starts to grow - not showing any decrease in throughput even with 5000 TCP dport rules. 


## Analysis

It is clear that IncludeOS has a performance benefit as opposed to Linux for firewall rules processing. Since IncludeOS is able to transpile the rules to C++ code which is then turned into binary code the resulting code is compact and performant. As the CPU gets a binary stream of instructions specifically crafted to its architecture performance is very good, likely due to two factors. One is that the CPU gets to utilize the CPU caches in an optimal way and the second is that IncludeOS is able to take shortcuts when processing packets. When a packet is processed the system already knows that this packet doesn’t need to go through the whole IP stack, but can bypass most of the code as the packet isn’t meant to be terminated at the local IncludeOS instance.

Similar behaviour can be observed in Linux as well. As the Linux kernels moves from the Netfilter processing engine to NFtables which employs a JIT engine that creates a binary stream of instructions a huge performance benefit can be had. The eBPF framework that is currently seeping into all parts of the Linux kernel is taking this even further, allowing the Linux kernel to bypass a lot of the IP stack when it isn’t needed. This performance does come at a cost of increased complexity, however.

## A note about performance

The IncludeOS developers tell me that there has been little effort put into performance. All the performance benefits we’ve seen to date have been due the macro architecture of IncludeOS. So there is likely that performance could be elevated further with relatively little efforts. In addition to changes made to the source code there are also optimizations that could be made on the compiler og linked stages. Link time optimization, LTO, can by itself increase performance further, when enabled. I don’t wish to speculate to what extent this will increase performance however, further measurements will need to be conducted when LTO is in place.

## Conclusion

IncludeOS shows great promise. It is likely that the performance we’ve seen in firewall performance can be translated into similar performance benefits for other, more complex tasks containing multiple rules with Web Application Firewalling being the obvious example.


Note. You can download Tobias' Master [thesis].    

[thesis]: https://www.duo.uio.no/handle/10852/63891?show=full

