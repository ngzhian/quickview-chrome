var qv = function() {
    var shown = false;
    var shown_id = null;
    var qv_div;
    var video_id;
    var base_node;
    var link_node;
    var video_links;
    var iframe;
    var expanded;

    function do_everything() {
        video_links = get_all_video_links();
        add_event_listener_to_all_video_links(video_links);
        add_event_listener_to_clear_qv();
        watch_for_new_page_load();
    }

    function get_all_video_links() {
        // video links have href="/watch?v=[0-0a-zA-Z=]+"
        return $('a[href*="watch"]');
    }

    function add_event_listener_to_all_video_links(video_links) {
        video_links.each(function(index) {
            add_event_listener_to_video_link($(this));
        });
    }

    function add_event_listener_to_video_link(video_link) {
        video_link.hoverIntent(function(e) {
            // need to pass a reference to object hovered over
            link_node = $(this);
            do_this_when_event_triggered();
        });
    }

    function do_this_when_event_triggered() {
        base_node = get_base_node();
        video_id = get_video_id(base_node);
        if (is_new_video_link(video_id)) {
            remove_current_qv();
            show_qv_div(base_node, video_id);
        }
    }

    function get_base_node() {
        var node = link_node;
        while (node_is_not_body(node) && 
                node_has_no_data_attribute(node)) {
                    node = node.parent();
                }
        return node;
    }

    function node_is_not_body(node) {
        return node.is('body') !== true;
    }

    function node_has_no_data_attribute(node) {
        return node.attr('data-context-item-id') === undefined;
    }

    function get_video_id(node_with_info) {
        return node_with_info.attr('data-context-item-id');
    }

    function is_new_video_link(video_id) {
        return (shown == false || shown_id != video_id);
    }

    function remove_current_qv() {
        $(".qv").css("display", "none");
        $(".qv").remove();
        shown = false;
        shown_id = null;
        qv_div = null;
        iframe = null;
        expanded = true;
    }

    function show_qv_div(base_node, video_id) {
        if (should_make_new_qv_div()) {
            set_attributes();
            make_qv_div();
            animate_qv_to_large();
            append_large_iframe_video_to_qv();
            append_qv_bar_to_qv();
            append_comments_to_qv();
        }
    }

    function should_make_new_qv_div () {
        return (shown == false || shown_id != video_id);
    }

    function set_attributes() {
        shown = true;
        shown_id = video_id;
        expanded = true;
    }

    function make_qv_div() {
        base_node.after('<div class="qv"></div>');
        qv_div = base_node.next($('.qv'));
    }

    function animate_qv_to_large() {
        qv_div.animate({
            width: 854 + 250 + "px",
            height: "510px"
        });
    }

    function animate_qv_to_small() {
        qv_div.animate({
            width: 560 + 250 + "px",
            height: "315px"
        });
    }

    function animate_iframe_to_large() {
        iframe.animate({
            width: "854px",
            height: "510px"
        });
    }

    function animate_iframe_to_small() {
        iframe.animate({
            width: "560px",
            height: "315px"
        });
    }

    function append_large_iframe_video_to_qv() {
        iframe = '<iframe width="854" height="510"' + 
                ' src="http://www.youtube.com/embed/' + video_id +
                '?autoplay=1" frameborder="0" allowfullscreen=""></iframe>';
        qv_div.append(iframe);
        iframe = qv_div.find($('iframe'));
    }

    function append_qv_bar_to_qv() {
        var qv_bar = make_qv_bar();
        make_qv_bar_draggable(qv_bar);
        add_expand_behaviour_to_qv_bar(qv_bar);
    }

    function make_qv_bar() {
        qv_div.append('<div class="qv-bar">' +
                '<h2 class="qv-bar-title">Quickview</h2>' + 
                '<a class="qv-bar-toggle-size">expand</a>' +
                '</div>');
        qv_bar = qv_div.find('.qv-bar');
        return qv_bar;
    }

    function make_qv_bar_draggable() {
        $(".qv").draggable({
            handle: ".qv-bar",
            containment:"document", 
            cursor: "crosshair",
            delay: 100,
        });
    }

    function add_expand_behaviour_to_qv_bar(qv_bar) {
        $('a.qv-bar-toggle-size').click(expand_or_contract);
    }

    function expand_or_contract(click_event) {
        if (expanded) {
            contract_qv_and_iframe();
            expanded = false;
        } else {
            expand_qv_and_iframe();
            expanded = true;
        }
    }

    function expand_qv_and_iframe() {
        animate_iframe_to_large();
        animate_qv_to_large();
    }

    function contract_qv_and_iframe() {
        animate_iframe_to_small();
        animate_qv_to_small();
    }

    function append_comments_to_qv() {
        $.get(
                'https://gdata.youtube.com/feeds/api/videos/'  + video_id + '/comments',
                function(data) {
                    var comments = '<div class="qv-comments">';
                    $('entry', data).each(function() {
                        comments += form_nice_comment($(this))
                    });
                    comments += '</div>';
                    qv_div.append(comments);
                });

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

        /* @date is in the format yyyy-mm-ddThh:mm:ss.000Z
        */
        function form_nice_date(date) {
            return date.slice(5,10) + " " + date.slice(11,16);
        }
    }

    function add_event_listener_to_clear_qv() {
        $(document).click(clears_qv_on_click)
        $(document).keypress(clears_qv_on_keypress);
    }

    function clears_qv_on_click(click_event) {
        if (click_is_not_in_qv(click_event)) {
            remove_current_qv();
        }
    }

    function click_is_not_in_qv(click_event) {
        return click_event.target.className.indexOf('qv') == -1;
    }

    function clears_qv_on_keypress(keypress_event) {
        remove_current_qv();
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
