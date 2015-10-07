---
title: "Testing New Webservers Before They Go Live"
author: behle
layout: post
categories:
  - IT
tags:
  - DNS
  - how_stuff_works
  - Linux
  - networking
  - sysadmin
---
I had a situation the other day in which I needed to take down a web server for maintenance and didn't want the site's visitors to experience any downtime on the site as that would look unprofessional and amateurish. I chose to temporarily host the site on another server while I made my repairs, but I wanted to test to make sure that my temporary server could handle traffic for the site before I submitted the DNS change which typically take a few hours to change over(meaning if I screwed something up, the site would be down for the few hours it would take for DNS to change back, no good). Normally I would have just hit up the temp server's IP address and tested it out, but this server was hosting a few different websites, so the IP would have just defaulted to the primary site on the server which is cool, but not so useful.

As I was thinking of a way to test out my temp server, I remembered a prank I used to play on my friends back in the day using the *hosts* file. The hosts file, for those of you with social lives, is the first thing your computer checks when it is trying to find the IP address for a site you are trying to get to. For instance, if you type "google.com" in a browser, you computer first checks the hosts file to see if it knows what Google's IP is, then if it doesn't find it there, it asks your router who, if it doesn't know, passes it on to your ISP and so on and so forth. It looks something like this, where it would consult the hosts file just before heading off to the Internet.

<div style="width: 510px" class="wp-caption aligncenter">
  <img title="DNS Illustrated" src="http://unixwiz.net/images/typical-dns-resolution-67.gif" alt="From http://unixwiz.net/ an excellent site" width="500" height="478" />
  
  <p class="wp-caption-text">
    From http://unixwiz.net
  </p>
</div>

It works by using two columns, the left one is the IP address and the right one is address of the server. So, completely hypothetically of course, if you wanted to trick your friend who was headed to Google into going to a site that was a little more <a href="http://webhamster.com" target="_blank">festive</a>(SFW). You could add a line to the hosts file that looks like:

<pre>216.152.64.157 google.com
216.152.64.157 www.google.com</pre>

which will redirect them to dancing rodents instead of their search engine.

The hosts file is located in C:\WINDOWS\system32\drivers\etc\hosts on Windows machines and in /etc/hosts on Mac/Linux systems.

What I ended up doing was adding an entry the mapped the name of my site to the IP address of the temp server so I could trick my computer into testing out the new server it as if it was supporting the real site without all the messiness/unemployment that goes along with having a downed website

The cool(a relative term) part about this technique is that it lets you have one test server that can answer to as many sites as you have that are worth testing. You simply add a line to your hosts file and go.
