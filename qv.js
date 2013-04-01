var qv = function() {
    var p1 = '<div class="quickview"><iframe width="560" height="315" src="http://www.youtube.com/embed/';
    var p2= '?autoplay=1" frameborder="0" allowfullscreen=""></iframe></div>';
    var shown = false;
    var shown_id = null;

    function clear_all() {
        $(".quickview").css("display", "none");
        $(".quickview").remove();
        shown = false;
    }

    function get_good_y(mouse_y) {
        // display videos right at the top if the mouse is at
        // the bottom of the screen
        // if not, display videos just below the mouse
        var screen_y = screen.height;
        if (mouse_y <= screen.height/2) return mouse_y;
        else return 0;
    }

    function get_good_x() {
        // center the youtube iframe
        return (document.width - 560) / 2;
    }

    $(document).click(function() {
        clear_all();
    }).keypress(function() {
        clear_all();
    });

    $('.feed-item-content-wrapper').each(function(index){
        var itemid = $(this).attr("data-context-item-id");
        $(this).find('a.feed-video-title').mouseover(function(e) {
            if (shown == false || shown_id != itemid) {
                clear_all();
                $(this).append(p1 + itemid + p2);
                $(this).children(".quickview").css("display", "block")
            .css("left", get_good_x())
            .css("top", get_good_y(e.screenY));
        shown = true;
        shown_id = itemid;
            }
        });
    });
}();
