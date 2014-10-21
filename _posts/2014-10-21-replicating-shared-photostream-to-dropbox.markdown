---
layout: post
title:  "Replicating A Shared Photo Steam to Dropbox"
date:   2014-10-21 07:40:31
categories: nerdery deep-dive how-to
---

This is an adventure I went on to share the photos in my Shared PhotoSteam synced via iCloud to Dropbox so some of my family members who aren’t fortunate enough to bask in the glory of Jobsian utopia (read Android users) can still bask in the glow of my adorable daughter.

Part 1: The Obvious
===================
Anyone starting down this journey will no doubt find themselves googling for and finding some great articles like 

* [Sync your iOS Photo Stream with Flickr, Dropbox or anything else](http://www.cultofmac.com/278632/sync-ios-photo-stream-withn-flickr-dropbox-anything-else/) or 
* [Automatically Sync Photo Stream to Dropbox](http://justcurious.is/2013/sync-ios-PhotoStream-to-dropbox/) 

which will inevitably point you towards useful tools like 

* [PhotoStream2Folder](http://www.petits-suisses.ch/Photo Stream2Folder/index.php)
* [Hazel](http://www.noodlesoft.com/hazel.php). 
* or even [custom bash scripts](https://gist.github.com/mkleucker/6055702).

Those are all well and good and will have you either indirectly or directly poking at the `~/Library/Application Support/iLifeAssetManagement/assets/sub` folder. If your goal is purely to rip out all of the images from your Photo Stream and shove them into another folder/disk/cloud storage location, then read no further. If you're looking to replicate _specific_ Shared Photo Streams, then read on intrepid Interneter.

Part 2: Two steps forward, one step back..
==========================================

So back to that weird folder. If you go take a look at it, you'll see that there are a bunch of long, randomly generated folder names that look a lot like [UUIDs](http://en.wikipedia.org/wiki/Universally_unique_identifier). Case in point:
{% highlight bash %}
$ ls ~/Library/Application\ Support/iLifeAssetManagement/assets/sub/ | head -5
0101da2e4b5c0cbb04cb629f450a74e92da655b1ef
010330a1dc5cb15f4ae350fbcbba4c9e9c64fcd754
010350cb5ff5423c25ac772e3dad355a1a46a1a259
0103e9abfafdc7cde42a11080c6474b70184017ae3
01113fc2c3b9a1685bd799d522c315fc9b26fae7b0
{% endhighlight %}

In checking out how many of these folders there were:
{% highlight bash %}
$ ls ~/Library/Application\ Support/iLifeAssetManagement/assets/sub/ | wc -l
     155
{% endhighlight %}

I noticed something interesting. The number of folders is the same as the number of images that iPhoto told me I had:

<img src="/images/posts/photostream_replication/photo_stream_image_count.png"/>

It matches! We might be on to something... Still nothing about where the _Shared_ Photo Stream pictures live, but definitely closer.

Part 3: There's data in them thar hills!
========================================

Now if I'm a developer and I've got a bunch of randomly generated unique IDs flying around, I'm going to store them somewhere so that my application can reference them sanely. Most cases that's going to be in a SQLite database because they're a fast and light (no SQL server required) way to store structured data to disk. Let's see what we can find:
{% highlight bash %}
$ cd ~/Library/Application\ Support/iLifeAssetManagement/
$ find ./ -name \*.db
.//ILifeAssetManagement.db
{% endhighlight %}

[Bingo!](https://www.youtube.com/watch?v=UMRo5XCKddQ)

Let's crack that open and see what's in there
{% highlight bash %}
$ sqlite3 ILifeAssetManagement.db .tables

AMAsset           AMAssetsToImport  AMUploadTask      AdminDataEntity
{% endhighlight %}

nothing too obvious, let's grap some random data from an interesting looking table (pre-filtered to protect random data of mine that may be sensitive):
{% highlight bash %}
$ sqlite3 -header -csv ILifeAssetManagement.db "select uuid, filename from AMAsset limit 5;"

uuid,filename
012cb5246303ae259eb324f66de94d33606cfd3ab6,IMG_1963.JPG
01fe04a0f4f0f75d46afccf5a00518707a439e024a,IMG_1957.JPG
01f0be3aa5a8b90b9fd582a3e3e07747f865cb1037,IMG_1956.JPG
019e24d6a91dd83e3cff5e959fee200efbfe23640b,IMG_1955.JPG
015a0fde068d3062572fb9391d6fa32cae585e0744,IMG_1926.JPG
{% endhighlight %}

Definitely some interesting things there. If you check on your own system, you can verify that there are indeed files like `~/Library/Application\ Support/iLifeAssetManagement/assets/sub/012cb5246303ae259eb324f66de94d33606cfd3ab6/IMG_1963.JPG` in that sub folder. Not necessarily helpful to our end goal, but it's interesting data and it will provide clues for how we can get the pictures we do care about.

Part 4: A chance discovery
==========================
While tab-completing to hop in and out of the `sub` folder, I couldn't help but notice tripping over the `sub-shared` folder. Given that _shared_ streams are the name of the game, this looks very promising. 

{% highlight bash %}
$ cd ~/Library/Application\ Support/iLifeAssetManagement/assets/sub-shared/
$ ls | head -5
016CF733-783E-4E77-868E-7781899E320D
01B037B0-2895-4F73-B228-B3E8AB4AEB10
01EB9EA8-AA28-49C6-A24C-A0CC73EEC917
01FC4414-BC97-4EE9-A49F-A00C292E0E0D
021A0E74-1CB3-48FE-A24F-CF094C9313E4
{% endhighlight %}

Hooray, more UUIDs...

Let's try that directory count trick again. I know that I happen to have two shared Photo Streams on iCloud account, and, via iPhoto, I know that one has 233 pictures and the other has 169.
{% highlight bash %}
$ ls ~/Library/Application\ Support/iLifeAssetManagement/assets/sub-shared/ | wc -l
     402
{% endhighlight %}

The good news is that this is the right place to be poking around (233 + 169 = 402), the bad news is that Apple has decided to dump all of the pictures from all of the shared Photo Streams into a single folder, identified only by UUID. To get to the end of this, we're going to have to find some datasource that helps us separate the two.

Since I know from my previous digging that there's a SQLite database tracking the UUIDs and image names, there's probably a similar source for the shared pictures. At this point, I got a bit lazy and just decided to grep the whole App Support folder for a couple of the UUIDs that I knew about and see what turns up.

{% highlight bash %}
$ cd ~/Library/Application\ Support/iLifeAssetManagement/
$ fgrep -R '016CF733-783E-4E77-868E-7781899E320D' ./
Binary file ./state/albumshare/1431844669+11256150207431692312/Model.sqlite matches
Binary file ./state/albumshare/1431844669+11256150207431692312/PersonID.sqlite matches
$ fgrep -R '01B037B0-2895-4F73-B228-B3E8AB4AEB10' ./
Binary file ./state/albumshare/1431844669+11256150207431692312/Model.sqlite matches
Binary file ./state/albumshare/1431844669+11256150207431692312/PersonID.sqlite matches
$ fgrep -R '01EB9EA8-AA28-49C6-A24C-A0CC73EEC917' ./
Binary file ./state/albumshare/1431844669+11256150207431692312/Model.sqlite matches
Binary file ./state/albumshare/1431844669+11256150207431692312/PersonID.sqlite matches
{% endhighlight %}

`Model.sqlite` and `PersonID.sqlite` keep coming up, very interesting...

It turns out that `Model.sqlite` is where the party is, there's a table in it called Albums which correlates the human friendly name to a UUID used elsewhere in the database. The particular table of interest is AssetCollections which maps the Album's UUID to the indiviual asset (image) locations. A simple join will tell me which UUIDs are associated with which album so I can extract the ones I care about out of `~/Library/Application\ Support/iLifeAssetManagement/assets/sub-shared/`.


Part 5: Tying it all together
=============================
Now we know where the images are stored, how to differentiate the ones we want, and where they're headed (Dropbox). Let's ~~write a quick bash script to put this all together~~ spend 4 hours writing a Ruby class and script to automate this.

There's a few minor twists and turns, but the overall process isn't different than what I described. The script I wrote does all of the above and saves the images into a folder named after the Share Photo Stream in the destination folder specified.

The code is free and up for grabs on my Github page at [https://github.com/braxtone/shared-photo-stream-backupper](https://github.com/braxtone/shared-photo-stream-backupper). Please take a look and fork it, I'd love to see what other people build on top of it.

As a quick reference, here's the help text:
{% highlight bash %}
$ ./photo_stream_backup.rb -h
Usage: photo_stream_backup.rb [options]
    -s, --streams X,Y,Z              The name of one or more streams that will be backed up, use "all" to back all of them up
    -d, --destination DEST           The destination folder for the images found, ie ~/Dropbox, etc
    -v, --[no-]verbose               Run verbosely
    -h, --help                       Display this screen
{% endhighlight %}

and here's what an example run looks like:
{% highlight bash %}
$ ./photo_stream_backup.rb -s all -d '~/icloud_test'
Backing up stream 'Wife and Life'
Backing up 169 images...
Backing up stream 'Family pics'
Backing up 239 images...
{% endhighlight %}

I'll leave automating this as an exercise for the reader, save to say that things like [automated folder watching](http://www.maclife.com/article/howtos/how_use_folder_actions_automator) is probably the easiest way forward and will be more deterministic than a cron job.

Have fun!
