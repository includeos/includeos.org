---
layout: post
title:  "Non-intrusive real time stack sampling in IncludeOS"
author: alf
date:   2016-08-16 07:43:42 +0200
categories: [profiling]
hero: /assets/img/posts/2000px-Data_stack.svg.png
author-image: /assets/img/authors/alf.jpg
summary: "By inserting a stack gathering call into the Programmable Interval Timer, we can regularly gather stack samples without bias. The gathering will happen at the frequency of the PIT, while the PIT handler itself will only schedule timers that are expired. This gives us an easy and non-intrusive way of profiling IncludeOS Applications."
---
Mike Dunlavey writes an interesting [post on StackOverflow](http://stackoverflow.com/questions/375913/what-can-i-use-to-profile-c-code-in-linux/378024#378024) on Stack Sampling.

Thinking about it for a while, it seemed like it was possible to do, given that we had backtrace. After implementing that by reading ELF sections, I proved by attaching a call that did not modify heap (no-heap) that I could read the return value of the current stack frame. While the return address can be used to reveal which function we came from, we cannot do any sorting by function entry address at this point since we want to do very little. We only register the return address and leave back to the interrupt handler.

### Parasite Interrupt handler

By inserting a stack gathering call into the Programmable Interval Timer, we can regularly gather stack samples without bias. The gathering will happen at the frequency of the PIT, while the PIT handler itself will only schedule timers that are expired.

```nasm
parasite_interrupt_handler:
  cli
  pusha
  call profiler_stack_sampler
  call register_interrupt
  call DWORD [current_eoi_mechanism]
  popa
  sti
  iret
```

### Gathering results

Due to not using heap, we must store entries on a fixed-vector. Also, we cannot synchronize due to using cooperative multitasking, and even if we could, we would still want to use a lockless (ideally wait-free) solution. Well, one possible solution is simply: We have a sampling part, and a gathering part. Each part takes turns doing sampling or gathering. With a sufficiently large fixed-vector we can sample many times before having to gather results. The gathering is done in an asynchronous timer callback that is run at a time when we are free to use the heap again. At that point we can insert our result into a map of return addresses and number of samples.

When printing the output, we take the map and sort it by number samples and display the top 12 results as shown here:

```sh
Conns/sec 2828.400000
*** Listing 12 samples ***
[0x215c20 + 000] 152473 times: VirtioNet::transmit(std::__1::shared_ptr<net::Packet>)
[0x20a160 + 000] 121812 times: gettimeofday
[0x20b970 + 000] 47209 times: _ZN8delegateIFvNSt3__16chrono8durationIxNS0_5ratioILx1ELx1000000EEEEEEE12functor_stubIZN2OS5startEjjE3$_0EENS0_9enable_ifIXntoocvNS7_14is_member_pairIT_EEilEcvNS7_20is_const_member_pairISD_EEilEEvE4typeEPvOS5_
[0x2a0dd4 + 000] 22434 times: std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >::__grow_by_and_replace(unsigned int, unsigned int, unsigned int, unsigned int, unsigned int, unsigned int, char const*)
[0x215e90 + 000] 18860 times: VirtioNet::service_queues()
[0x2a0c70 + 000] 16464 times: std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >::append(char const*, unsigned int)
[0x202e70 + 000] 15928 times: Client::send_from(std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> > const&, unsigned short, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> > const&)
[0xc3f000ff + 000] 15586 times: 0xc3f000ff
[0x219340 + 000] 12716 times: net::TCP::transmit(std::__1::shared_ptr<net::tcp::Packet>)
[0x20a3f0 + 000] 10962 times: OS::default_rsprint(char const*, unsigned int)
[0x2158e0 + 000] 10406 times: VirtioNet::recv_packet(unsigned char*, unsigned short)
[0x2a3348 + 000] 9603 times: std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >::__init(char const*, unsigned int, unsigned int)
[0x2808f0 + 000] 9488 times: void delegate<void (std::__1::shared_ptr<net::Packet>)>::method_stub<net::Arp, &(net::Arp::transmit(std::__1::shared_ptr<net::Packet>))>(void*, std::__1::shared_ptr<net::Packet>&&)
*** ---------------------- ***
Conns/sec 2864.000000
*** Listing 12 samples ***
[0x215c20 + 000] 152744 times: VirtioNet::transmit(std::__1::shared_ptr<net::Packet>)
[0x20a160 + 000] 122068 times: gettimeofday
[0x20b970 + 000] 47311 times: _ZN8delegateIFvNSt3__16chrono8durationIxNS0_5ratioILx1ELx1000000EEEEEEE12functor_stubIZN2OS5startEjjE3$_0EENS0_9enable_ifIXntoocvNS7_14is_member_pairIT_EEilEcvNS7_20is_const_member_pairISD_EEilEEvE4typeEPvOS5_
[0x2a0dd4 + 000] 22468 times: std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >::__grow_by_and_replace(unsigned int, unsigned int, unsigned int, unsigned int, unsigned int, unsigned int, char const*)
[0x215e90 + 000] 18891 times: VirtioNet::service_queues()
[0x2a0c70 + 000] 16484 times: std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >::append(char const*, unsigned int)
[0x202e70 + 000] 15954 times: Client::send_from(std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> > const&, unsigned short, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> > const&)
[0xc3f000ff + 000] 15610 times: 0xc3f000ff
[0x219340 + 000] 12741 times: net::TCP::transmit(std::__1::shared_ptr<net::tcp::Packet>)
[0x20a3f0 + 000] 10985 times: OS::default_rsprint(char const*, unsigned int)
[0x2158e0 + 000] 10428 times: VirtioNet::recv_packet(unsigned char*, unsigned short)
[0x2a3348 + 000] 9621 times: std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >::__init(char const*, unsigned int, unsigned int)
[0x2808f0 + 000] 9509 times: void delegate<void (std::__1::shared_ptr<net::Packet>)>::method_stub<net::Arp, &(net::Arp::transmit(std::__1::shared_ptr<net::Packet>))>(void*, std::__1::shared_ptr<net::Packet>&&)
*** ---------------------- ***
Conns/sec 2792.200000
*** Listing 12 samples ***
[0x215c20 + 000] 153025 times: VirtioNet::transmit(std::__1::shared_ptr<net::Packet>)
[0x20a160 + 000] 122355 times: gettimeofday
[0x20b970 + 000] 47410 times: _ZN8delegateIFvNSt3__16chrono8durationIxNS0_5ratioILx1ELx1000000EEEEEEE12functor_stubIZN2OS5startEjjE3$_0EENS0_9enable_ifIXntoocvNS7_14is_member_pairIT_EEilEcvNS7_20is_const_member_pairISD_EEilEEvE4typeEPvOS5_
[0x2a0dd4 + 000] 22505 times: std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >::__grow_by_and_replace(unsigned int, unsigned int, unsigned int, unsigned int, unsigned int, unsigned int, char const*)
[0x215e90 + 000] 18927 times: VirtioNet::service_queues()
[0x2a0c70 + 000] 16509 times: std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >::append(char const*, unsigned int)
[0x202e70 + 000] 15977 times: Client::send_from(std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> > const&, unsigned short, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> > const&)
[0xc3f000ff + 000] 15642 times: 0xc3f000ff
[0x219340 + 000] 12771 times: net::TCP::transmit(std::__1::shared_ptr<net::tcp::Packet>)
[0x20a3f0 + 000] 11004 times: OS::default_rsprint(char const*, unsigned int)
[0x2158e0 + 000] 10440 times: VirtioNet::recv_packet(unsigned char*, unsigned short)
[0x2a3348 + 000] 9637 times: std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >::__init(char const*, unsigned int, unsigned int)
[0x2808f0 + 000] 9532 times: void delegate<void (std::__1::shared_ptr<net::Packet>)>::method_stub<net::Arp, &(net::Arp::transmit(std::__1::shared_ptr<net::Packet>))>(void*, std::__1::shared_ptr<net::Packet>&&)
*** ---------------------- ***
```
In this case it is stack sampling for a tiny IRC server that is being "bombarded" by ~2800 clients per second (all of which enter a channel and say something before quitting gracefully). The output shows that our VirtioNet implementation is using up most of the time, and our `gettimeofday` function is second. It turns out that kicking the virtio queue for each packet is very time consuming, and for `gettimeofday` we query CMOS which is extremely slow, especially inside a VM.

Resolving function names (lookup and demangle) is done without using heap, due to requirements for our backtrace functionality. We don't want to allocate memory when the reason we are printing the backtrace is that we just ran out, for example. It turns out using stack-allocated buffers are quite fast, and it is one of the reasons the stack sampling mechanisms don't show up in the sample results anymore!

### Conclusion

Profiling in a unikernel environment is easy and precise. There are still limitations, like the inability to see branch mispredictions and the inherent difficulty of attributing bottlenecks to the VM or to the Virtual Machine Manager (or if the VM is interacting with the VMM in suboptimal ways), but stack sampling is already giving us useful performance feedback.
