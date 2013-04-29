// youtube embed iframe video size is 854 x 510 and 640 x 390
var qv = function() {
    var html = '<div id="qv"><iframe id="qv-iframe" width="0" height="0" src="" frameborder="0" allowfullscreen=""></iframe><div id="qv-side"><div id="qv-bar"><h2 id="qv-title">Quickview</h2><a id="qv-size-toggle">exp</a></div><div id="qv-info"></div><div id="qv-comments"></div></div></div>';

    // references to DOM elements
    var body = $('body');
    var qv_node;
    var iframe; // iframe node itself
    var qv_side;
    var qv_bar;
    var qv_size_toggle;
    var qv_info;
    var qv_comments;

    var video_id;
    var shown_id = null;
    var shown = false;
    var is_big;

    function do_everything() {
        init_qv_node();
        thumbnail_links = get_all_thumbnail_links();
        add_event_listener_to_all_thumbnail_links(thumbnail_links);
        add_window_event_listeners();
        watch_for_new_page_load();
    }

    function init_qv_node() {
        body.append(html);
        qv_node = body.find('#qv');
        iframe = qv_node.find('iframe');
        qv_side = qv_node.find('#qv-side');
        qv_bar = qv_side.find('#qv-bar');
        qv_size_toggle = qv_bar.find('#qv-size-toggle');
        qv_info = qv_side.find('#qv-info');
        qv_comments = qv_side.find('#qv-comments');
    }

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
            add_event_listener_to_video_link($(this));
        });
    }

    function add_event_listener_to_video_link(video_link) {
        video_link.hoverIntent(function(e) {
            // need to pass a reference to object hovered over
            do_this_when_event_triggered($(this));
        }, function(e) {return;});
    }

    function do_this_when_event_triggered(video_link) {
        video_id = get_video_id_from(video_link);
        reset();
        set_attributes();
        assemble_qv();
    }

    // example url: https://www.youtube.com/watch?v=MCaw6fv8ZxA 
    // regex to use: [^\=]+$
    function get_video_id_from(video_link) {
        var url = video_link.attr('href');
        return url.match(/[^\=]+$/g)[0];
    }

    function reset() {
        //if (qv_iframe) qv_iframe.empty();
        reset_iframe();
        shown = false;
        shown_id = null;
        is_big = true;
        qv_node.attr('class', '');
    }

    function reset_iframe() {
        iframe.attr('width', '0px')
            .attr('height', '0px')
            .attr('src', '');
    }

    function set_attributes() {
        shown = true;
        shown_id = video_id;
        is_big = true;
    }

    function assemble_qv() {
        qv_node.attr('class', 'large');
        init_iframe();
        init_qv_bar();
        init_qv_comments();
        //append_qv_info_to_qv();
    }

    function init_iframe() {
        iframe.attr('src', form_iframe_embed_url(video_id));
        expand_iframe();
    }

    function form_iframe_embed_url(video_id) {
        return 'http://www.youtube.com/embed/'+video_id+'?autoplay=1';
    }

    function init_qv_bar() {
        set_size_toggle();
        make_qv_bar_draggable();
    }

    function make_qv_bar_draggable() {
        $("#qv").draggable({
            handle: "#qv-bar",
        containment:"document", 
        cursor: "crosshair",
        delay: 100,
        });
    }

    function set_size_toggle() {
        qv_size_toggle.click(expand_or_contract);
    }

    function expand_or_contract(click_event) {
        if (is_big) {
            contract_iframe();
            qv_node.attr('class', 'small');
            $(this).attr('class', 'expand');
            is_big = false;
        } else {
            expand_iframe();
            qv_node.attr('class', 'large');
            $(this).attr('class', 'contract');
            is_big = true;
        }
    }

    function expand_iframe() {
        iframe.attr('width', '854px')
            .attr('height', '510px');
    }

    function contract_iframe() {
        iframe.attr('width', '640px')
            .attr('height', '390px');
    }

    function append_qv_info_to_qv() {
        qv_info = make_qv_info();
        get_and_add_qv_info_from_api();
    }

    function make_qv_info() {
        qv_info = '<div class="qv-info"></div>';
        qv_node.append(qv_info);
        return qv_node.find('.qv-info');
    }

    function get_and_add_qv_info_from_api() {
        $.get(get_api_url_for_qv_info(video_id), add_qv_info);
    }

    function get_api_url_for_qv_info(video_id) {
        //'https://www.googleapis.com/youtube/v3/videos
        return 'https://gdata.youtube.com/feeds/api/videos/' +
            video_id + '?v=2';
    }

    function add_qv_info(api_data) {
        var entry = $('entry', api_data);
        var description = entry.find('media\\:description').text();
        console.log(description);
    }

    function init_qv_comments() {
        get_and_add_comments_from_api(video_id);
    }

    function get_and_add_comments_from_api(video_id) {
        $.get(get_api_url_for_comments(video_id), add_comments);
    }

    function get_api_url_for_comments(video_id) {
        return 'https://gdata.youtube.com/feeds/api/videos/' +
            video_id + '/comments'
    }

    function add_comments(api_data) {
        $('entry', api_data).each(function() {
            qv_comments.append(form_nice_comment($(this)));
        });
    }

    function form_nice_comment(entry) {
        var author = entry.find('author').find('name').text();
        var date = entry.find('published').text();
        var content = entry.find('content').text();

        var comment = '<div class="qv-comment">' +
            '<span class="qv-author">' + author + '</span>' +
            '<span class="qv-date">' + form_nice_date(date) + '</span>' +
            '<p class="qv-content">' + content + '</p>' +
            '</div>';
        return comment;
    }

    // date is in the format yyyy-mm-ddThh:mm:ss.000Z
    function form_nice_date(date) {
        return date.slice(5,10) + " " + date.slice(11,16);
    }

    function add_window_event_listeners() {
        $(document).click(clears_qv_on_click)
            $(document).keypress(clears_qv_on_keypress);
    }

    function clears_qv_on_click(click_event) {
        if (click_is_not_in_qv(click_event)) {
            reset();
        }
    }

    function click_is_not_in_qv(click_event) {
        return click_event.target.className.indexOf('qv') == -1 &&
            click_event.target.id.indexOf('qv') == -1;
    }

    function clears_qv_on_keypress(keypress_event) {
        reset();
    }

    function watch_for_new_page_load() {
        $('.feed-container').on('DOMNodeInserted DOMNodeRemoved',
                do_this_when_new_page_loads);
    }

    function do_this_when_new_page_loads() {
        var thumbnail_links = get_all_thumbnail_links();
        add_event_listener_to_all_thumbnail_links(thumbnail_links);
    }

    do_everything();

}();
