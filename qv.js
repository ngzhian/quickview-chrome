// youtube embed iframe video size is 854 x 510 and 560 x 315
var qv = function() {
    var shown = false;
    var shown_id = null;
    var qv_div;
    var qv_info_div;
    var comments_div;
    var video_id;
    var link_node;
    var video_links;
    var iframe;
    var expanded;
    var body = $('body');

    function do_everything() {
        qv_div = init_qv_div();
        video_links = get_all_video_links();
        add_event_listener_to_all_video_links(video_links);
        add_window_event_listeners();
        watch_for_new_page_load();
    }

    function init_qv_div() {
        body.append('<div id="qv"></div>');
        return body.find('#qv');
    }

    function get_all_video_links() {
        // video links have href="/watch?v=[0-0a-zA-Z=]+"
        return $('a[href*="watch?v="]');
    }

    function add_event_listener_to_all_video_links(video_links) {
        video_links.each(function(index) {
            add_event_listener_to_video_link($(this));
        });
    }

    function add_event_listener_to_video_link(video_link) {
        video_link.hoverIntent(function(e) {
            // need to pass a reference to object hovered over
            do_this_when_event_triggered($(this));
        }, null);
    }

    function do_this_when_event_triggered(video_link) {
        video_id = get_video_id_from(video_link);

        if (got_valid_video_id(video_id) && is_new_video_link(video_id)) {
            reset_qv();
            set_attributes();
            assemble_qv();
        }
    }

    function got_valid_video_id(id) {
        return video_id.length !== null && video_id.length > 1 ;
    }

    function get_video_id_from(video_link) {
        // TODO this isn't foolproof, use regex instead
        return video_link.attr('href').substring(9);
    }

    function is_new_video_link(video_id) {
        return (shown == false || shown_id != video_id);
    }

    function reset_qv() {
        qv_div.empty();
        shown = false;
        shown_id = null;
        iframe = null;
        expanded = true;
        qv_div.attr('class', '');
    }

    function set_attributes() {
        shown = true;
        shown_id = video_id;
        expanded = true;
    }

    function assemble_qv() {
        qv_div.attr('class', 'large');
        assemble_iframe();
        assemble_qv_bar();
        //append_qv_info_to_qv();
        assemble_qv_comments();
    }

    function assemble_iframe() {
        iframe = init_iframe();
    }

    function init_iframe() {
        iframe = form_iframe_tag(video_id); 
        qv_div.append(iframe);
        return qv_div.find($('iframe'));
    }

    function form_iframe_tag(video_id) {
        return '<iframe id="qv-iframe" class="large" width="854" height="510"' + 
            ' src="http://www.youtube.com/embed/' + video_id +
            '?autoplay=1" frameborder="0" allowfullscreen=""></iframe>';
    }

    function assemble_qv_bar() {
        qv_bar = init_qv_bar();
        make_qv_bar_draggable();
        add_expand_behaviour_to_qv_bar();
    }

    function init_qv_bar() {
        qv_div.append('<div id="qv-bar">' +
                '<h2 id="qv-bar-title">Quickview</h2>' + 
                '<a id="qv-bar-toggle-size">expand</a>' +
                '</div>');
        return qv_div.find('.qv-bar');
    }

    function make_qv_bar_draggable() {
        $("#qv").draggable({
            handle: "#qv-bar",
            containment:"document", 
            cursor: "crosshair",
            delay: 100,
        });
    }

    function add_expand_behaviour_to_qv_bar(qv_bar) {
        $('a#qv-bar-toggle-size').click(expand_or_contract);
    }

    function expand_or_contract(click_event) {
        if (expanded) {
            contract_iframe();
            qv_div.attr('class', 'small');
            expanded = false;
        } else {
            expand_iframe();
            qv_div.attr('class', 'large');
            expanded = true;
        }
    }

    function expand_iframe() {
        iframe.animate({ width: "854px" }).animate({ height: "510px" });
    }

    function contract_iframe() {
        iframe.animate({ width: "510px" }).animate({ height: "315px" });
    }

    function append_qv_info_to_qv() {
        qv_info_div = make_qv_info_div();
        get_and_add_qv_info_from_api();
    }

    function make_qv_info_div() {
        qv_info_div = '<div class="qv-info"></div>';
        qv_div.append(qv_info_div);
        return qv_div.find('.qv-info');
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

    function assemble_qv_comments() {
        comments_div = init_comments_div();
        get_and_add_comments_from_api(video_id);
    }

    function init_comments_div() {
        comments_div = '<div id="qv-comments"></div>';
        qv_div.append(comments_div);
        return qv_div.find('#qv-comments');
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
            comments_div.append(form_nice_comment($(this)));
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
            reset_qv();
        }
    }

    function click_is_not_in_qv(click_event) {
        return click_event.target.className.indexOf('qv') == -1 &&
            click_event.target.id.indexOf('qv') == -1;
    }

    function clears_qv_on_keypress(keypress_event) {
        reset_qv();
    }

    function watch_for_new_page_load() {
        $('.feed-container').on('DOMNodeInserted DOMNodeRemoved',
                do_this_when_new_page_loads);
    }

    function do_this_when_new_page_loads() {
        video_links = get_all_video_links();
        add_event_listener_to_all_video_links(video_links);
    }

    do_everything();

}();
