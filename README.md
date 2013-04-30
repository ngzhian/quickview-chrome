Quickview
=========

Watch videos without leaving your YouTube subscriptions feed page, and possibly without ever clicking.

##What?
<a href="https://raw.github.com/ngzhian/quickview/master/ss_1.png" target="_blank"><img width="45%" src="https://raw.github.com/ngzhian/quickview/master/ss_1.png" alt="A sreenshot" style="max-width:100%;"></a>
<a href="https://raw.github.com/ngzhian/quickview/master/ss_2.png" target="_blank"><img width="45%" src="https://raw.github.com/ngzhian/quickview/master/ss_2.png" alt="A sreenshot" style="max-width:100%;"></a>

A div with an embedded iframe shows up when you mouse over the thumbnail of the video.
Comments are loaded beside the video.
Click outside of the video or press any key to end the video.

This behavior works for thumbnails in your feed, as well as thumbnails at the side of a video page.

##Why?
What's better than a nice subscriptions feed page that you can scroll forever?

A page where you can scroll forever AND watch videos.

##How?
This is a Chrome/Chromium extension, uses jQuery to do some simple attribute extraction,
DOM manipulation, mouse events. Uses iframe to embed video.

You can now get this at the [Chrome Web Store](https://chrome.google.com/webstore/detail/quickview-for-youtube/dadcnockbecggaefjepcmhikaejknmlg)!

Alternatively, `git clone https://github.com/ngzhian/quickview.git`,
then go to `chrome://extensions` and turn on Developer mode.
Finally just click the "Load unpacked extension..." button and browse
to where you cloned the repository. Hopefully everything works fine!

##Who?
Hi, people call me Zhi An, but you can call me Tonight,
and I made this because I like to watch YouTube videos and I don't like to click that much.

##TODO
- ~~Paginate comments~~ Using version 2 of the YouTube Data API, so I can now get all the comments at once!

##Bugs.
Take a look at ss_2.png above, the page's video is lies above the Quickview comments section, but below the iframe video. I have no idea why.

##License
<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US"><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-nc-sa/3.0/88x31.png" /></a><br /><span xmlns:dct="http://purl.org/dc/terms/" property="dct:title">Quickview</span> by <a xmlns:cc="http://creativecommons.org/ns#" href="https://github.com/ngzhian/" property="cc:attributionName" rel="cc:attributionURL">Ng Zhi An</a> is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US">Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License</a>.
