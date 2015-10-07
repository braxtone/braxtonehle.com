---
title: "Add syntax coloring to nano"
author: behle
layout: post
categories:
  - IT
tags:
  - customizing
  - Linux
  - nano
---
Go from this: ![Boring, default settings][1]  
To this!: ![New Hotness][2]

I thought I might share a link with you all about how to add syntax highlighting while editing different file types in nano. This feature has been implemented in virtually every GUI based text editor besides Notepad and TextEdit.

The basic idea is to tweak your nano settings(located in /etc/nanorc) and add regular expressions that detect when, for instance, a person types a string or declares a variable. You could do this by hand, but I found a great wiki that has these premade and ready for tweaking to suit your preference. [Syntax Highlighting][3]

As of yet, they have profiles put together for PHP, Java, HTML, and many more. Check it out, it makes it much easier to locate and fix the code that you swore you wrote perfectly the first time.

 [1]: images/phpBland.jpg
 [2]: images/phpColor.jpg
 [3]: http://wiki.linuxhelp.net/index.php/Nano_Syntax_Highlighting
