---
layout: post
title:  Bjarne Stroustrup on IncludeOS
author: perbu
date:   2018-09-19 06:00:42 +0200
categories: [guest post]
hero: /assets/img/posts/bjarne_port.jpg
author-image: /assets/img/authors/perbu.jpg
summary: "Bjarne Stroustrup explains why he thinks IncludeOS makes sense."
---

For the last year or so we've been working with [Bjarne Stroustrup] in his role as an advisor to IncludeOS. Most of this discussion has been rather technical and detail-oriented and perhaps of not much interest unless you're one of the people who read our commit-logs. 

I have my own reasons for being a big fan of IncludeOS, but I was curious to hear what appeal Bjarne saw in the project.  So I asked and I got an answer and I got his permission to share it.

## Why do I find IncludeOS interesting?
I have been interested in unikernels and other ways of tailoring an OS to specific needs for many years. Modern OSs are just so huge and still steadily growing as they try to be everything to everybody. Their behavior in real use can be very hard to understand. 

I accidentally bumped into includeOS two years ago when I saw the abstract for [Alfred Bratterud's CppCon'16 talk](https://www.youtube.com/watch?v=t4etEwG2_LY). Obviously, I had to go and listen. I liked what I heard: a practical, pragmatic approach aiming at solving real-world problems of reasonable complexity. That it was all C++ was of course a benefit. That it was good modern C++ really close to the hardware was event better. It offers maintainability in addition to performance and predictable latency. 

Before C++, I was doing systems work, rather than programming language research. In a way, includeOS is going back to the roots of C++ and the kind of problems for which I started to build C++. I have been in the computer industry for a long time, so I tend to worry about projects: are they ambitious enough to be worth doing? Are the initial aims realistic enough so that they can possibly be met give a reasonable amount of effort and likely resources? That seemed to be the case for includeOS then and still appears to be so. I hope the best for them. 

For performance, for reliability, and security we need something smaller than a conventional OS for many applications. An appropriately configured includeOS plus a suitable application can fit on hardware that couldn't even hold an OS kernel. A suitably configured includeOS can deliver predictable performance. An includeOS offers a far smaller attack surface than a full-featured OS. IncludeOS is not meant to be everything to everybody; that's its strength. It just may be ideal for enough hard and important tasks to be a breakthrough.

[Bjarne Stroustrup]: https://en.wikipedia.org/wiki/Bjarne_Stroustrup
