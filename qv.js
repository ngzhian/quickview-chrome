"use strict";
/*eslint eqeqeq:0, curly: 2*/

// stuff related to controlling the embedded iframe
// https://developers.google.com/youtube/iframe_api_reference
var player;
// this needs to live here because the lib that we loads relies on
// this method existing in the scope
function onYouTubeIframeAPIReady() {
  player = new YT.Player('qv-iframe', {
    events: {
      'onReady': onPlayerReady,
    }
  });
}

// when the player is ready we set the playbackRate to user's preference
function onPlayerReady(event) {
  chrome.storage.sync.get({
    playbackRate: '1'
  }, function(items) {
    player.setPlaybackRate(items.playbackRate);
  })
}

// Simple object to help manage getting URLs to make API calls to YouTube
var QuickViewYT = (function() {
  var API_KEY = 'AIzaSyAJgu87-5TWOeMtKHOnaiJXIhQtUlQSlRw';
  var YT_BASE_URL = 'https://www.googleapis.com/youtube/v3/';
  var VIDEO_URL = YT_BASE_URL + 'videos?id=';
  var VIDEO_PARTS = '&part=snippet,statistics';
  var COMMENTS_URL = YT_BASE_URL + 'commentThreads?videoId=';
  var COMMENTS_PARTS = '&part=id,replies,snippet';
  var COMMENTS_TEXTFORMAT = '&textFormat=plainText';
  var EMBED_URL = 'https://www.youtube.com/embed/';
  var EMBED_QUERY = '?autoplay=1&enablejsapi=1';

  // example url: https://www.youtube.com/watch?v=MCaw6fv8ZxA
  // regex to use: v(\=|\/)(\w*)
  // the result will be 'v=MCaw6fv8ZxA'
  function video_id_from_link(video_link) {
    var url = video_link.href;
    return url.match(/v(\=|\/)([^=&\/]+)/)[0].substring(2);
  }

  function video_url(video_id) {
    return VIDEO_URL + video_id + '&key=' + API_KEY + VIDEO_PARTS;
  }

  function comments_url(video_id, pageToken) {
    var url = COMMENTS_URL + video_id + '&key=' + API_KEY + COMMENTS_PARTS + COMMENTS_TEXTFORMAT;
    if (pageToken) { url += '&pageToken=' + pageToken; }
    return url;
  }

  function embed_url(video_id) {
    return `${EMBED_URL}${video_id}${EMBED_QUERY}`;
  }

  return {
    video_url: video_url,
    comments_url: comments_url,
    embed_url: embed_url,
    video_id_from_link: video_id_from_link
  }
}());

const YT_LIKE_BUTTON_CLASS_LIST = 'yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon no-icon-markup like-button-renderer-like-button like-button-renderer-like-button-unclicked  yt-uix-post-anchor yt-uix-tooltip'
const YT_DISLIKE_BUTTON_CLASS_LIST = 'yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon no-icon-markup like-button-renderer-dislike-button like-button-renderer-dislike-button-unclicked  yt-uix-post-anchor yt-uix-tooltip'

var QuickView = (function() {
  const html = `
    <div id="qv">
      <iframe id="qv-iframe" width="0" height="0" src="" frameborder="0" allowfullscreen=""></iframe>
      <div id="qv-side">
        <div id="qv-bar">
          <h2 id="qv-qv"><a href="#">Quickview</a></h2>
          <a id="qv-size-toggle"></a>
        </div>
        <div id="qv-info" class="yt-card yt-card-has-padding">
          <h1 id="qv-title"></h1>
          <div id="qv-statistics">
            <span id="qv-view-count" class="watch-view-count"></span> views
            <span id="qv-like-count" class="${YT_LIKE_BUTTON_CLASS_LIST}"></span>
            <span id="qv-dislike-count" class="${YT_DISLIKE_BUTTON_CLASS_LIST}"></span>
            <div id="qv-desc"></div>
          </div>
        <div class="">
          <div id="qv-comments" class="comments"></div>
        </div>
      </div>
    </div>`;

  var body = $('body').append(html);
  // references to DOM elements
  var qv = body.find('#qv');
  var qv_side = qv.find('#qv-side');
  var qv_info = qv.find('#qv-info')[0];
  var qv_title = qv_side.find('#qv-title');
  var qv_desc = qv_side.find('#qv-desc');
  var qv_view_count = qv_side.find('#qv-view-count');
  var qv_like_count = qv_side.find('#qv-like-count');
  var qv_dislike_count = qv_side.find('#qv-dislike-count');
  var iframe = qv.find('iframe'); // iframe node itself
  var qv_bar = qv_side.find('#qv-bar');
  var qv_size_toggle = qv_bar.find('#qv-size-toggle');
  var qv_comments = qv_side.find('#qv-comments');
  // attributes needed for functions
  var video_id = null;
  var showing_id = null;
  var is_big = true;

  // not used yet, we can't call this from the content script,
  // need a background script to handle message passing
  function openOptionsPage() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  }

  function init() {
    add_window_event_listeners();
    qv_size_toggle.click(expand_or_contract);
    // qv_options_link.click(openOptionsPage);
    make_qv_bar_draggable();
  }

  function add_window_event_listeners() {
    var doc = $(document);
    doc.click(e => {
      if (QuickView.contains_element(e.target)) { return; }
      QuickView.reset_all();
    })
    doc.keypress(QuickView.reset_all);
  }

  function make_qv_bar_draggable() {
    qv.draggable({
      handle: "#qv-bar",
      containment: "document"
    });
  }

  function expand_or_contract(click_event) {
    var _ = is_big ? contract() : expand();
    is_big = !is_big;
  }

  /* Functions that deal with sizing */

  function contract() {
    contract_iframe();
    setTimeout(() => qv.attr('class', 'small'), 400);
  }
  function expand() {
    qv.attr('class', 'large');
    setTimeout(expand_iframe, 800);
  }

  /* iframe related */
  function expand_iframe() { set_iframe_size(854, 510); }
  function contract_iframe() { set_iframe_size(640, 390); }
  function reset_iframe() {
    set_iframe_size(0, 0);
    iframe.attr('src', '');
  }
  function set_iframe_size(width, height) {
    iframe.attr({width: `${width}px`, height: `${height}px`});
  }

  /* reset QuickView */
  function reset_qv_info() {
    qv_title.empty();
    qv_desc.empty();
  }

  function reset_qv() {
    qv.attr('class', '');
    qv.attr('style', '');
  }

  function reset_attributes() {
    showing_id = null;
    is_big = true;
  }

  function reset_qv_comments() {
    qv_comments.empty();
  }

  function reset_all() {
    reset_iframe();
    reset_qv_comments();
    reset_qv();
    reset_attributes();
  }

  function set_comments(comments) {
    reset_qv_comments();
    qv_comments.append(comments.map(Formatter.format_comment))
  }

  function add_load_more() {
    qv_comments.append('<div class="paginator">load more</div>');
    return qv_comments.find('.paginator');
  }

  function is_showing(video_id) { return showing_id === video_id; }

  function show_video(video_id) {
    if (is_showing(null)) { expand() };
    iframe.attr('src', QuickViewYT.embed_url(video_id));
    showing_id = video_id;
  }

  function set_info(title, desc) {
    reset_qv_info();
    qv_title.text(title);
    qv_desc.append(desc.replace(/\n/g, '<br>'));
    truncate_div_with_long_text(qv_desc);
  }

  function set_statistics(view_count, like_count, dislike_count) {
    qv_view_count.text(view_count)
    qv_like_count.text(like_count)
    qv_dislike_count.text(dislike_count)
  }

  function contains_element(el) {
    return jQuery.contains(qv[0], el);
  }

  return {
    init,
    reset_qv_comments,
    reset_all,
    set_comments,
    add_load_more,
    is_showing,
    show_video,
    set_info,
    set_statistics,
    contains_element,
  }
})();

// youtube embed iframe video size is 854 x 510 and 640 x 390
var quickview = function() {
    /* Function that initializes stuff */
    function initialize() {
        QuickView.init();
        getConfiguredHoverTime((hoverTime) => {
            linkThumbnails('body', hoverTime);
        })
    }

    function getConfiguredHoverTime(callback) {
        chrome.storage.sync.get({
            hoverTime: '370'
        }, function(items) {
            callback(parseInt(items.hoverTime, 10))
        })
    }

    function linkThumbnails(node, hoverTime) {
        var links = get_all_thumbnail_links(node);
        links.forEach(l => addHoverIntent(l, hoverTime));
    }

    /* Functions to do with retrieving links and adding
     * event listeners */

    function get_all_thumbnail_links(scope) {
      // video links have href="/watch?v=[0-0a-zA-Z=]+"
      scope = scope || 'body';
      var links = $(scope).find('a[href*="watch?v="]');
      var hasThumbnail = (node) => $(node).find('img').length != 0;
      return jQuery.grep(links, hasThumbnail);
    }

    function addHoverIntent(link, hoverTime = 370) {
      $(link).parent('ytd-thumbnail').hoverIntent({
        over: () => show_qv(link),
        out: jQuery.noop,
        interval: hoverTime,
      });
    }

    /* Functions that makes the video player work */

    // Takes a <a> tag with href to a YouTube url and pops up qv
    function show_qv(video_link) {
      console.log('showing qv')
      var video_id = QuickViewYT.video_id_from_link(video_link);
      if (QuickView.is_showing(video_id)) { return; }

      QuickView.show_video(video_id);
      $.get(QuickViewYT.video_url(video_id)).done(add_info);
      // handle 403
      QuickView.reset_qv_comments()
      $.get(QuickViewYT.comments_url(video_id)).done(add_comments);
    }

    function add_info(data) {
      var snippet = data.items[0].snippet;
      QuickView.set_info(snippet.title, snippet.description);
      add_qv_yt(data)
      // add_qv_meta(data)
    }

    function add_qv_yt(data) {
      const info = QuickView.qv_info;

      const snippet = data.items[0].snippet;
      const stats = data.items[0].statistics;
      QuickView.set_statistics(stats.viewCount, stats.likeCount, stats.dislikeCount);
      return;

      let viewCount = info.querySelector('#count')
      viewCount.innerHTML = `<yt-view-count-renderer></yt-view-count-renderer>`
      viewCount.querySelector('.view-count').textContent = `${stats.viewCount} views`

      info.querySelector('h1').textContent = snippet.title
      const menuCont = info.querySelector('#menu-container')
      if (menuCont) { menuCont.remove() }
    }

    function add_qv_meta(data) {
      const meta = QuickView.qv_meta
      const snippet = data.items[0].snippet

      meta.querySelector('#description').textContent = snippet.description
      // meta.querySelector('.less-button').textContent = 'SHOW LESS'
      // meta.querySelector('.more-button').textContent = 'SHOW MORE'
      // meta.querySelector('.description').style.margin = 0

      // remove first, might implement this next time
      const topRow = meta.querySelector('#top-row')
      if (topRow) { topRow.remove() }
    }

    function add_comments(api_data) {
      QuickView.set_comments(api_data.items);
      add_load_more_button(api_data)
    }

    function add_load_more_button(data) {
      if (!data.nextPageToken) { return; }
      var url = QuickViewYT.comments_url(
        data.items[0].snippet.videoId, data.nextPageToken);
      var qv_load_more = QuickView.add_load_more();
      qv_load_more.click(function(e) {
        qv_load_more.css('display', 'none');
        $.get(url, add_comments);
      });
    }

    /* Functions that maintains quickview behavior
     * e.g. when new thumbnails or page loads */

    function watch_for_new_thumbnails() {
      var observer = new MutationObserver(function(mutations) {
        mutations.filter(m => m.type === 'childList')
                 .map(m => m.addedNodes)
                 .reduce((p, n) => p.concat(n), [])
                 .forEach(linkThumbnails)
      });
      var config = { attributes: true, childList: true, characterData: true };
      var _observe = (_, v) => observer.observe(v, config);

      $('ytd-shelf-renderer').each(_observe);
      $('.channels-browse-content-grid').each(_observe);
      $('.section-list').each(_observe);
      $('#watch-more-related').each(_observe);
    }

    initialize();
    watch_for_new_thumbnails();
}();

function truncate_div_with_long_text(jQuery_div) {
    // splits the div in to 3 parts, summary, details and toggle
    var html = jQuery_div[0].innerHTML;
    var text = jQuery_div.text(),
        threshold = 350, // characters
        split_point = 300, // characters
        html,
        truncate_toggle,
        details;
    if (html.length > threshold) {
        html = [
            '<span class="summary">',
            html.substring(0, split_point),
            '</span>',
            '<span class="details hidden">',
            html.substring(split_point),
            '</span>',
            '<div class="truncate-button">',
            '<a class="truncate hidden"></a>',
            '</div>'
            ].join('');
        jQuery_div.html(html);
        truncate_toggle = jQuery_div.find('a.truncate'),
        truncate_toggle.click(function(e) {
            details = truncate_toggle.parent().siblings('span.details');
            details.toggleClass('hidden');
            truncate_toggle.toggleClass('hidden');
        });
    }
}

var Formatter = (function() {
  function format_comment(entry) {
    var s = entry.snippet.topLevelComment.snippet;
    var author_url = s.authorChannelUrl || s.authorGoogleplusProfileUrl;

    // return `<div class="comment-entry">
    //        <div class="comment-item">
    //          <a href="${author_url}" target="_blank" class="g-hovercard">
    //            <img class="user-photo" src="${s.authorProfileImageUrl}" width="48">
    //          </a>
    //          <div class="content">
    //            <div class="comment-header">
    //              <a href="${author_url}" class="user-name g-hovercard" target="_blank">${s.authorDisplayName}</a>
    //              <span class="spacer"></span>
    //              <span class="time">${form_nice_date(s.updatedAt)}</span>
    //            </div>
    //            <div class="comment-text">
    //              <div class="comment-text-content">${s.textDisplay}</div>
    //              </div>
    //              <div class="comment-footer">
    //              </div>
    //            </div>
    //          </div>
    //        </div>`;

    let ytdCommentRenderer = document.createElement('ytd-comment-thread-renderer')
    let img = ytdCommentRenderer.querySelector('#author-thumbnail img')
    img.setAttribute('alt', s.authorDisplayName)
    img.setAttribute('src', s.authorProfileImageUrl)

    let authorName = ytdCommentRenderer.querySelector('#author-text')
    authorName.setAttribute('href', author_url)
    authorName.querySelector('span').textContent = s.authorDisplayName

    ytdCommentRenderer.querySelector('#content-text').textContent = s.textDisplay
    let niceDate = form_nice_date(s.updatedAt)
    let pubTime = ytdCommentRenderer.querySelector('#published-time-text');
    let pubTimeA = document.createElement('a');
    pubTimeA.textContent = niceDate;
    pubTime.append(pubTimeA);

    // this is probably for offensive comments
    ytdCommentRenderer.querySelector('#body-inappropriate-reply').hidden = true;
    // not sure what this is
    ytdCommentRenderer.querySelector('#header-badge').hidden = true;
    return ytdCommentRenderer;
  }

  // date is in the format yyyy-mm-ddThh:mm:ss.000Z
  function form_nice_date(date) {
    return date.slice(5,10) + " " + date.slice(11,16);
  }

  return {
    format_comment
  };
}());
