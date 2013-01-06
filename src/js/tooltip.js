/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Haydn King & Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
(function($, undefined) {

    var outerC  = "tooltip ui-widget ui-widget-content ui-corner-all",
        leftC   = "tooltip-left",
        rightC  = "tooltip-right",
        topC    = "tooltip-top",
        bottomC = "tooltip-bottom",
        innerC  = "ui-widget-content",
        textC   = "stringContent",
        attr    = "tip",
        close_wait = 150,
        def_border = "black";

$.widget("bio.tooltip", {
    options: {
        hover: 250, //Delay to wait after the mouse hovers. 0 = don't open
        click: false, //Whether to open on-click
        holdOpen: true, //whether to hold open when the mouse enters the tip
        autoClose: true, //whether to close automatically when the mouse leaves
        /* content: widget tests for these things in order and accepts the
         * first one it finds
         *  - 'tip' property on DOM element
         *  - content option
         *      + string text
         *      + jquery object
         *      + function(event): returns jquery object
         */
        content: null,
        extraClasses: null, //any extra CSS classes for the tooltip
        width: 100, //integer in px, or string 'x%' of target element
        color: 'default', // border color: 
        //                 'default'|'parent'|'css string'|function
        location: 'center', //popup location: 'center'|'mouse'
        direction: 'auto', //'auto'|'n'|'s'|'e'|'w'|function
        fadeIn: 0, //length to animate appearence
        fadeOut: 100 //length to animate disappear
    },
    _create: function() {
        var el = this.el = $(this.element[0]);
        var o = this.options,
            self = this;

        this._tooltip = null;

        //the last mouse event
        this._evt = null;

        this._visible = false;
        this._timeout = null;
    },
    _init: function(){
        this._bind_events();
    },
    show: function() {
        if(this._visible){
            this.hide();
        }
        this._create_tip();
        this._set_content();
        this._set_size();
        this._set_location();
        this._set_color();

        this._tooltip.fadeTo(this.options.fadeIn, 1.0);
        this._visible = true;
    },
    hide: function() {
        if(!this._visible){
            return;
        }
        var self = this;
        var tt = self._tooltip;
        this._tooltip.fadeOut(this.options.fadeOut, function(){
            tt.remove();
        });
        this._visible = false;
        self._tooltip = null;
    },
    _bind_events: function() {
        var self = this;
        this.el
            .mousemove(function(e) {self._mousemove(e);})
            .mouseleave(function(e) {self._mouseleave(e);})
            .mouseenter(function(e) {self._mouseenter(e);})
            .click(function(e) {self._mouseclick(e);});
    },
    _mousemove: function(evt) {
        this._evt = evt;
        var self = this;
        if(!this._visible && this.options.hover > 0){
            this._clear_timeout();
            this._set_timeout(this.options.hover, function() {self.show();});
        }
    },
    _mouseleave: function(evt) {
        this._evt = evt;
        var self = this;
        if(this.options.autoClose){
            this._set_timeout(close_wait, function() {self.hide();});
        }
    },
    _mouseenter: function(evt) {
        this._evt = evt;
        this._clear_timeout();
    },
    _mouseclick: function(evt) {
        this._evt = evt;
        if(this.options.click){
            this.open();
        }
    },
    _clear_timeout: function() {
        if(typeof(this._timeout) === 'number'){
            clearTimeout(this._timeout);
            this._timeout = null;
        }
    },
    _set_timeout: function(time, fn) {
        this._clear_timeout();
        this._timeout = setTimeout(function(){
            this._timout = null;
            fn();
        }, time);
    },
    _create_tip: function() {
        var self = this;
        this._tooltip = $('<div>')
            .addClass(outerC + ' ' + (this.options.extraClasses || ''))
            .fadeTo(0,0)
            .mouseenter(function(e) {self._mouseenter(e);})
            .mouseleave(function(e) {self._mouseleave(e);})
            .append($('<div>').addClass(innerC))
            .appendTo($('body'));
    },
    _set_content: function() {
        var c = this.options.content;

        if($.isFunction(c)){
            c = c(this._evt);
        }

        if(this.el.attr(attr) != null){
            c = $('<p>')
                .text(this.el.attr(attr))
                .addClass(textC);
        }
        else if(typeof(c) === "string"){
            c = $('<p>')
                .text(c)
                .addClass(textC);
        }
        else if(Array.isArray(c)){
            var t = c;
            c = $();
            for(var i = 0; i < t.length; i++){
                c = c.add(this._make_item(t[i]));
            }             
        }
        else if(!(c instanceof $)){
            throw("No content specified");
        }
        //apply the content 
        this._tooltip.children('div')
            .empty()
            .append(c);
    },
    _set_size: function() {
        var w = this.options.width,
            width;
        //if the width is a string percentage, then we mean percentage of the
        //el, not of the body!
        if(typeof(w) === 'string') {
            if(/%$/.test(w)){
                var pc = parseFloat(w.match("([0-9.]+)%")[1]);
                w = this.el.width() * pc / 100.0;
            }
        }
        
        this._tooltip.width(w);
        //update the outer height
        //this._tooltip.height(this._tooltip.children('div').height());
    },
    _set_location: function() {
        var l = this.options.location,
            d = this.options.direction,
            pos, view, scroll, size, margins;
        if(l === 'center'){
            pos = this.el.offset();
            pos.left += this.el.width() / 2.0;
            pos.top += this.el.height() / 2.0;
        }
        else if(l === 'mouse'){
            pos = {top:this._evt.pageY, left: this._evt.pageX};
        }
        else {
            throw('Invalid location \''+ l + '\'');
        }

        
        if(d === 'auto'){
            view = {
                width: $(window).width(), 
                height: $(window).height()
            };
            scroll = {
                top: $(document).scrollTop(), 
                left: $(document).scrollLeft()
            };
            size = {
                width: this._tooltip.outerWidth(true), 
                height: this._tooltip.outerHeight(true)
            };
            margins = {
                top: pos.top - scroll.top,
                left: pos.left - scroll.left,
                bottom: scroll.top + view.height - pos.top,
                right: scroll.left + view.width - pos.left
            };

            //test for South
            if(      (margins.bottom >= size.height) &&
                     (margins.left >= size.width / 2.0) &&
                     (margins.right >= size.width / 2.0)) {
                d = 's';
            }
            //test for North
            else if( (margins.top >= size.height) &&
                     (margins.left >= size.width / 2.0) &&
                     (margins.right >= size.width / 2.0)) {
                d = 'n';
            }
            //test for East
            else if( (margins.right >= size.width) &&
                     (margins.top >= size.height / 2.0) &&
                     (margins.bottom >= size.height / 2.0)){
                d = 'e';
            }
            //test for West
            else if( (margins.left >= size.width) &&
                     (margins.top >= size.height / 2.0) &&
                     (margins.bottom >= size.height / 2.0)){
                d = 'w';
            }
            else {
                //either we're in a corner, or the viewport is too small
                //go towars the largest side
                if(margins.right >= margins.left) {
                    d = 'e';
                }
                else {
                    d = 'w';
                }
            }
        }

        if($.isFunction(d)){
            d = d(this._evt);
        }

        var t = this._tooltip;
        if(d === 'n'){
            t.addClass(topC);
            pos.left -= size.width / 2.0;
            pos.top -= size.height;
        }
        else if(d === 's'){
            t.addClass(bottomC);
            pos.left -= size.width / 2.0;
        }
        else if(d === 'e'){
            t.addClass(rightC);
            pos.top -= size.height / 2.0;
        }
        else if(d === 'w'){
            t.addClass(leftC);
            pos.left -= size.width;
            pos.top -= size.height / 2.0;
        }
        else {
            throw('Unknown direction \''+d+'\'');
        }
        t.css(pos);
    },
    _set_color: function() {
        var c = this.options.color;
        if(c === "default"){
            //if the border color has been set
            if(this.el.css('border-color').length > 0){
                //don't override it
                return;
            }
            console.log('Applying a default border as none set');
            c = def_border;
        }
        else if(c === "parent"){
            c = this.el.css('border-color');
        }
        this._tooltip.css('border-color', c); 
    },
    _make_item: function(data) {
        var self = this;
        var icon = $('<span>');
        if(data.icon != null && data.icon !== ''){
            icon.addClass('ui-icon ' + data.iconClass || '');
        }
        else{
            icon.css(data.iconCSS || {})
                .addClass('ui-corner-all');
        }

        var item = $('<div>')
            .addClass('tooltip-item ui-widget-content ui-state-default')
            .append( $('<div>')
                .addClass('tooltip-icon')
                .append(icon)
                   )
            .append( $('<div>')
                .addClass('tooltip-desc')
                .append( $('<span>').text(data.title))
                .append( $('<p>').text(data.sub || ''))
                   )
            .mouseenter(function(evt) {
                item.addClass('ui-state-hover');
            })
            .mouseleave(function(evt) {
                item.removeClass('ui-state-hover');
            })
            .mousedown(function(evt) {
                item.addClass('ui-state-active');
            })
            .mouseup(function(evt) {
                item.removeClass('ui-state-active');
            })
            .click(function(evt) {
                if($.isFunction(data.click)){
                    data.click(evt, self);
                }
            });
        return item;
    }
});
        
}(jQuery));
