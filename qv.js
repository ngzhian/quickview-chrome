// Simple object to help manage getting URLs to make API calls to YouTube
var YT = (function() {
  var API_KEY = 'AIzaSyAJgu87-5TWOeMtKHOnaiJXIhQtUlQSlRw';
  var YT_BASE_URL = 'https://www.googleapis.com/youtube/v3/';
  var VIDEO_URL = YT_BASE_URL + 'videos?id=';
  var VIDEO_PARTS = '&part=snippet,statistics';
  var COMMENTS_URL = YT_BASE_URL + 'commentThreads?videoId=';
  var COMMENTS_PARTS = '&part=id,replies,snippet';
  var EMBED_URL = 'https://www.youtube.com/embed/';
  var EMBED_QUERY = '?autoplay=1';

  function video_url(video_id) {
    return VIDEO_URL + video_id + '&key=' + API_KEY + VIDEO_PARTS;
  }

  function comments_url(video_id, pageToken) {
    var url = COMMENTS_URL + video_id + '&key=' + API_KEY + COMMENTS_PARTS;
    if (pageToken) { url += '&pageToken=' + pageToken; }
    return url
  }

  function embed_url(video_id) {
    return `${EMBED_URL}${video_id}${EMBED_QUERY}`;
  }

  return {
    video_url: video_url,
    comments_url: comments_url,
    embed_url: embed_url
  }
}());

// youtube embed iframe video size is 854 x 510 and 640 x 390
var quickview = function() {
    var qv_url = '#';
    var html = '<div id="qv">' +
        '<iframe id="qv-iframe" width="0" height="0" src="" frameborder="0" allowfullscreen=""></iframe>' +
        '<div id="qv-side">' +
        '<div id="qv-bar">' +
        '<h2 id="qv-qv"><a href="' + qv_url + '">Quickview</a></h2>' +
        '<a id="qv-size-toggle" class="contract"></a>' +
        '</div>' +
        '<div id="qv-info" class="yt-card yt-card-has-padding">' +
        '<h1 id="qv-title">' +
        '</h1>' +
        '<div id="qv-desc">' +
        '</div>' +
        '</div>' +
        '<div class="yt-card yt-card-has-padding">' +
        '<div id="qv-comments" class="comments"></div>' +
        '</div>' +
        '</div></div>';


    var body = $('body'),
        // references to DOM elements
        qv,
        iframe, // iframe node itself
        qv_side,
        qv_bar,
        qv_size_toggle,
        qv_info,
        qv_title,
        qv_desc,
        qv_comments,
        // attributes needed for functions
        video_id = null,
        shown_id = null,
        is_big = true;

    /* Function that initializes stuff */
    function initialize() {
        init_dom();
        set_qv_bar_behavior();
        add_window_event_listeners();
    }

    function init_dom() {
        body.append(html);
        qv = body.find('#qv');
        iframe = qv.find('iframe');
        qv_side = qv.find('#qv-side');
        qv_bar = qv_side.find('#qv-bar');
        qv_size_toggle = qv_bar.find('#qv-size-toggle');
        qv_info = qv_side.find('#qv-info');
        qv_title = qv_side.find('#qv-title');
        qv_desc = qv_side.find('#qv-desc');
        qv_comments = qv_side.find('#qv-comments');
    }

    function set_qv_bar_behavior() {
        set_size_toggle();
        make_qv_bar_draggable();
    }

    function set_size_toggle() {
        qv_size_toggle.click(expand_or_contract);
    }

    function expand_or_contract(click_event) {
        if (is_big) {
            contract();
        } else {
            expand();
        }
        is_big = !is_big;
    }

    /* Functions that deal with sizing */

    function contract() {
        contract_iframe();
        setTimeout(contract_qv, 400);
        qv_size_toggle.attr('class', 'expand');
    }

    function expand() {
        expand_qv();
        setTimeout(expand_iframe, 800);
        qv_size_toggle.attr('class', 'contract');
    }

    function expand_qv() {
        qv.attr('class', 'large');
    }

    function contract_qv() {
        qv.attr('class', 'small');
    }

    function expand_iframe() {
        set_iframe_size(854, 510);
    }

    function contract_iframe() {
        set_iframe_size(640, 390);
    }

    function make_qv_bar_draggable() {
        qv.draggable( {
            handle: "#qv-bar",
        containment: "document"
        } );
    }

    /* Functions to do with retrieving links and adding
     * event listeners */

    function get_all_thumbnail_links() {
        // video links have href="/watch?v=[0-0a-zA-Z=]+"
        var links = $('a[href*="watch?v="]');
        var thumbnails;
        return jQuery.grep(links, function(node, i){
            // filters out nodes without a <img> has a child node
            // i.e. non-thumbnail links
            thumbnails = $(node).find('img');
            return thumbnails.length != 0;
        });
    }

    function add_event_listener_to_all_thumbnail_links(links) {
        jQuery.each(links, function(index) {
            add_event_listener_to_thumbnail_link($(this));
        });
    }

    function add_event_listener_to_thumbnail_link(link) {
        link.find('img').hoverIntent({
            over: function() {show_qv(link);},
            out: jQuery.noop,
            interval: 370,
        });
    }


    /* Functions that makes the video player work */

    // Takes a <a> tag with href to a YouTube url and pops up qv
    function show_qv(video_link) {
        video_id = get_video_id_from(video_link);

        update_sizes();
        update_iframe(video_id);
        update_qv_info(video_id);
        update_qv_comments(video_id);
        update_attributes(video_id);
    }

    // example url: https://www.youtube.com/watch?v=MCaw6fv8ZxA
    // regex to use: v(\=|\/)(\w*)
    // the result will be 'v=MCaw6fv8ZxA'
    function get_video_id_from(video_link) {
        var url = video_link.attr('href');
        return url.match(/v(\=|\/)([^=&\/]+)/)[0].substring(2);
    }

    function update_sizes() {
        if (shown_id === null) {
            qv.attr('class', 'large');
        }
    }

    function update_attributes(id) {
        shown = true;
        shown_id = id;
        is_big = true;
    }

    function update_iframe(id) {
        if (shown_id === null) {
            setTimeout(expand_iframe, 800);
        }
        if (shown_id != id) {
            update_iframe_src(YT.embed_url(id));
        }
    }

    function update_iframe_src(url) {
        iframe.attr('src', url);
    }

    function update_qv_info(video_id) {
      if (video_id === shown_id) return;
      reset_qv_info();
      $.get(YT.video_url(video_id)).done(add_info);
    }

    function reset_qv_info() {
        qv_title.empty();
        qv_desc.empty();
    }

    function get_description(json_response) {
      obj = json_response;
      return obj.items[0].snippet.description;
    }

    function add_info(data) {
      var desc = data.items[0].snippet.description;
      var desc = get_description(data);
      var title = data.items[0].snippet.title;
      qv_title.text(title);
      qv_desc.append(desc.replace(/\n/g, '<br>'));
      truncate_div_with_long_text(qv_desc);
    }

    function update_qv_comments(video_id) {
      if (video_id === shown_id) return;
      reset_qv_comments();
      $.get(YT.comments_url(video_id)).done(add_comments);
    }

    function reset_qv_comments() {
        qv_comments.empty();
    }

    function add_comments(api_data) {
      $.each(api_data.items, function(i, item) {
        qv_comments.append(form_nice_comment(item));
      });
      add_load_more_button(api_data)
    }

    function add_load_more_button(data) {
      if (!data.nextPageToken) return;
      var url = YT.comments_url(
        data.items[0].snippet.videoId, data.nextPageToken);
      qv_comments.append('<div class="paginator">load more</div>');
      qv_load_more = qv_comments.find('.paginator');
      qv_load_more.click(function(e) {
        qv_load_more.css('display', 'none');
        $.get(url, add_comments);
      });
    }

    function form_nice_comment(entry) {
      var snippet = entry.snippet.topLevelComment.snippet;
      var author = snippet.authorDisplayName;
      var author_url = snippet.authorChannelUrl || snippet.authorGoogleplusProfileUrl;
      var date = snippet.updatedAt;
      var content = snippet.textDisplay;
      var imgUrl = snippet.authorProfileImageUrl;
      var comment = '<div class="comment-entry">' +
          '<div class="comment-item">' +
          '<a href="' + author_url + '" target="_blank" class="g-hovercard">' +
          '<img class="user-photo" src="' + imgUrl + '" width="48">' +
          '</a>' +
          '<div class="content">' +
          '<div class="comment-header">' +
          '<a href="' + author_url + '" class="user-name g-hovercard" target="_blank">' + author + '</a>' +
          '<span class="spacer"></span>' +
          '<span class="time">' + form_nice_date(date) + '</span>' +
          '</div>' +
          '<div class="comment-text">' +
          '<div class="comment-text-content">' +
          content +
          '</div>' +
          '</div>' +
          '<div class="comment-footer">' +
          '</div>' +
          '</div>' +
          '</div>' +
          '</div>';
      return comment;
    }

    // date is in the format yyyy-mm-ddThh:mm:ss.000Z
    function form_nice_date(date) {
        return date.slice(5,10) + " " + date.slice(11,16);
    }

    /* Functions that maintains quickview behavior
     * e.g. when new thumbnails or page loads */

    function add_window_event_listeners() {
        $(document).click(clears_qv_on_click)
            .keypress(clears_qv_on_keypress);
    }

    function clears_qv_on_click(click_event) {
        if (click_is_not_in_qv(click_event)) {
            reset_all();
        }
    }

    function click_is_not_in_qv(click_event) {
        return !jQuery.contains($('#qv')[0], click_event.target);
    }

    function clears_qv_on_keypress(keypress_event) {
        reset_all();
    }

    function reset_all() {
        reset_iframe();
        reset_qv_comments();
        reset_qv();
        reset_attributes();
    }

    function reset_iframe() {
        set_iframe_size(0, 0);
        update_iframe_src('');
    }

    function set_iframe_size(width, height) {
        iframe.attr('width', width + 'px')
            .attr('height', height + 'px');
    }

    function reset_qv() {
        qv.attr('class', '');
        qv.attr('style', '');
    }

    function reset_attributes() {
        shown = false;
        shown_id = null;
        is_big = true;
    }

    function watch_for_new_thumbnails() {
        watch_for_new_page_load();
        watch_for_load_more_at_channel_page();
        watch_for_watch_more_related_at_video_page();
    }

    function watch_for_load_more_at_channel_page() {
        $('.feed-list-container').on('DOMNodeInserted DOMNodeRemoved',
                get_to_work);
    }

    function watch_for_watch_more_related_at_video_page() {
        $('#watch-more-related').on('DOMNodeInserted DOMNodeRemoved',
                get_to_work);
    }

    // Need to manually keep track of number of child nodes to prevent
    // a bug where it keeps calling get_to_work()
    function watch_for_new_page_load() {
        var feed_container = $('.feed-container');
        var num_feed_page = feed_container.find('.feed-page').length;
        $('.feed-container').on('DOMNodeInserted DOMNodeRemoved',
                function() {
                    var new_num_feed_page = feed_container.find('.feed-page').length;
                    if (new_num_feed_page > num_feed_page) {
                        get_to_work();
                    }
                    num_feed_page = new_num_feed_page;
                });
    }

    function get_to_work() {
        links = get_all_thumbnail_links();
        add_event_listener_to_all_thumbnail_links(links);
    }

    /* Helper functions */

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

    initialize();
    get_to_work();
    watch_for_new_thumbnails();
}();
