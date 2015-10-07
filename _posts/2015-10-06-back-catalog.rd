---
layout: post
title:  "Back Catalog"
date:   2015-10-06 22:38:42
categories: nerdery security state_of_the_blog
---
I was going through the backups I had on an old NAS that I thought had long since died and discovered that it had intact copies of my old Wordpress blog. With some fiddling I was able to get the site restored, and then exported out in the Jekyll format I'm using today.
<br><br>

I made some minor updates, but for better or worse, left the posts intact. It was fun going back through the old posts and seeing where I was, and how some of the topics hadn't really changed.  
<br><br>

Anyway, you can check them out here:
<br><br>

<ul class="listing">
{% for post in site.posts %}
{% capture year %}{{post.date | date: "%Y"}}{% endcapture %}
{% if year <= "2010" %}
<li>{{ post.date | date: "%Y-%m-%d" }} - <a href="{{ post.url }}">{{ post.title }}</a></li>
{% endif %}
{% endfor %}
</ul>

