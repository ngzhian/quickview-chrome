var qv = function() {
    var shown = false;
    var shown_id = null;

    /* creates a quickview div and adds it as a sibling of the
     * element (h4) which was hovered.
     * @element: element that user hovered over to trigger quickview
     * @v_id: id of video
     */
    var make_qv = function(element, v_id) {
        element.after('<div class="qv draggable"></div>');
        var qv = element.next('.qv');

        qv.append('<iframe width="560" height="315"' + 
                  ' src="http://www.youtube.com/embed/' + v_id +
        '?autoplay=1" frameborder="0" allowfullscreen=""></iframe>');

        // adds title bar which allows dragging and configure options
        qv.append('<div class="qv-bar">' +
                  '<h2 class="qv-bar-title">Quickview</h2>' + 
                  '<a class="qv-bar-expand">expand</a>' +
                  '</div>');
        $(".draggable").draggable({
            handle: ".qv-bar",
            containment:"document", 
            cursor: "crosshair",
            delay: 100,
        });

        $('a.qv-bar-expand').click(function(e) {
            if ($(this).text() == 'expand') {
                $('.qv').css('height', '510').css('width', '92%');
                $('.qv iframe').attr('width', '854').attr('height', '510');
                $(this).text('restore');
            } else if ($(this).text() == 'restore') {
                $('.qv').css('height', '315').css('width', '70%');
                $('.qv iframe').attr('width', '560').attr('height', '315');
                $(this).text('expand');
            }
        });

        // show the video
        qv.css("display", "block");

        // adds comments async
        $.get(
            'https://gdata.youtube.com/feeds/api/videos/'  + v_id + '/comments',
            function(data) {
                var comments = '<div class="qv-comments">';
                $('entry', data).each(function() {
                    comments += form_nice_comment($(this))
                });
                comments += '</div>';
                qv.append(comments);
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

            return qv;
    }

    function get_good_y(mouse_y) {
        // display videos right at the top if the mouse is at
        // the bottom of the screen
        // if not, display videos just below the mouse
        var screen_y = screen.height;
        if (mouse_y <= screen.height/2) return mouse_y;
        else return 0;
    }

    function clear_all() {
        $(".qv").css("display", "none");
        $(".qv").remove();
        shown = false;
    }

    function attach_events_for_each_video() {
        $('.feed-item-content-wrapper').each(function(index){
            var itemid = $(this).attr("data-context-item-id");
            $(this).find('a.feed-video-title').hoverIntent(function(e) {
                if (shown == false || shown_id != itemid) {
                    clear_all();
                    make_qv($(this).parent(), itemid)
                    .css("top", get_good_y(e.screenY));
                    shown = true;
                    shown_id = itemid;
                }
            });
        });
    }

    function reattach_events_on_feed_load() {
        $('.feed-container').on('DOMNodeInserted DOMNodeRemoved', function() {
            attach_events_for_each_video();
        });
    }

    function attach_clear_events() {
        $(document).click( function(e) {
            // click to clear only works when click is not on qv node
            if (e.target.className.indexOf("qv") == -1) {
                clear_all();
            }
        }).keypress(function() {
            clear_all();
        });
    }

    var init = function() {
        attach_events_for_each_video();
        reattach_events_on_feed_load();
        attach_clear_events();
    }();

}();
