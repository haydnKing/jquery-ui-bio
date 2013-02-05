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
         *      + function(event): returns jquery object
         *      + string text
         *      + array of items for a drop-down select. Item props
         *          - title: the title
         *          - [sub]: optional subtitle
         *          - [iconClass]: optional css class to apply to the icon
         *              e.g. ui-icon-close etc.
         *          - [iconCSS]: optional map of CSS attributes to apply to the
         *              icon        
         *      + jquery object
         */
        content: null,
        /* title: optional title for the tooltip, shown in bold at the top
         *  function(evt) | $-object | string
         */
        title: null,
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
        this._enabled = true;
        this._timeout = null;
        this._hidefn = function(){
            self.hide();
        };
    },
    _init: function(){
        this._bind_events();
    },
    show: function() {
        if(!this._enabled || (this._trigger('beforeShow') === false)) {
            return;
        }
        if(this._visible){
            this.hide();
        }
        this._create_tip();
        if(!this._set_content()){
            this._tooltip.remove();
            this._tooltip = null;
            return;
        }
        this._set_size();
        this._set_location();
        this._set_color();

        var self = this;
        this._tooltip.fadeTo(this.options.fadeIn, 1.0, function(){
            self._trigger('show');
        });
        this._visible = true;
        //hide if there's another click anywhere
        $(document).one('click', function(){
            $(document).on('click', self._hidefn);
        });
    },
    hide: function() {
        $(document).off('click', this._hidefn);
        if(!this._visible || (this._trigger('beforeHide') === false)){
            return;
        }
        var self = this;
        var tt = self._tooltip;
        this._tooltip.fadeOut(this.options.fadeOut, function(){
            tt.remove();
            self._trigger('hide');
        });
        this._visible = false;
        self._tooltip = null;
    },
    enable: function() {
        this._enabled = true;
    },
    disable: function() {
        this._enabled = false;
        this.hide();
    },
    updateContent: function(c) {
        this._set_content(c, true);
    },
    option: function(k, v){
        if(v === null){
            return this.options[k];
        }
        this.options[k] = v;
        return this.el;
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
        if(!this._enabled) {return;}
        this._evt = evt;
        var self = this;
        if(!this._visible && this.options.hover > 0){
            this._clear_timeout();
            this._set_timeout(this.options.hover, function() {self.show();});
        }
    },
    _mouseleave: function(evt) {
        if(!this._enabled) {return;}
        this._evt = evt;
        var self = this;
        if(this.options.autoClose){
            this._set_timeout(close_wait, function() {self.hide();});
        }
    },
    _mouseenter: function(evt) {
        if(!this._enabled) {return;}
        this._evt = evt;
        this._clear_timeout();
    },
    _mouseclick: function(evt) {
        if(!this._enabled) {return;}
        this._evt = evt;
        if(this.options.click){
            this.show();
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
            .click(function(e) {e.stopPropagation();})//don't close
            .append($('<div>').addClass(innerC))
            .appendTo($('body'));
    },
    _set_content: function(c, anim) {
        c = c || this.options.content;
        anim = anim || false;
        var t, i, self = this;

        if($.isFunction(c)){
            c = c(this._evt);
        }

        if(c === false){
            return false;
        }

        if(this.el.attr(attr) != null){
            c = this._get_title()
                    .add($('<p>')
                        .text(this.el.attr(attr))
                        .addClass(textC));
        }
        else if(typeof(c) === "string"){
            c = this._get_title()
                    .add($('<p>')
                        .text(c)
                        .addClass(textC));
        }
        else if(Array.isArray(c)) {
            t = $();
            for(i = 0; i < c.length; i++) {
                t = t.add(this._make_item(c[i], i));
            } 
            c = this._get_title() 
                .add($('<div>').append(t));
        }
        else if(c instanceof $){
            c = this._get_title().add(c);
        }
        else {
            throw("No content specified");
        }
        if(!anim){
            //apply the content 
            this._tooltip.children('div')
                .empty()
                .append(c);
        }
        else {
            //fix the height
            this._tooltip.height(this._tooltip.height());
            //apply the content 
            this._tooltip.children('div')
                .empty()
                .append(c);
            //animate to new height
            this._tooltip.animate({
                height: this._tooltip.children('div').height()
            }, 'fast', function() {
                //unset the height
                self._tooltip.css('height', '');
                //set the size and location (may have been messed up by the
                //anim
                self._set_size();
                self._set_location();
            });
        }

        return true;
    },
    _get_title: function() {
        var t = this.options.title;
        if($.isFunction(t)) {
            t = t(this._evt);
        }
        if(t == null || t === '') {
            return $();
        }
        else if(typeof(t) === 'string') {
            return $('<div>')
                    .addClass('tooltip-title')
                    .append($('<span>')
                        .text(t));
        }
        else {
            throw("Unknown title type");
        }
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
        if($.isFunction(c)){
            c = c(this._evt);
        }
        if(c === "default"){
            //if the border color has been set
            if(this.el.css('border-color').length > 0){
                //don't override it
                return;
            }
            c = def_border;
        }
        else if(c === "parent"){
            c = this.el.css('border-color');
        }
        this._tooltip.css('border-color', c); 
    },
    _make_item: function(data, index) {
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
                self._trigger('selected', evt, {
                    index:index, 
                    tooltip: self.el,
                    item: item,
                    data: data
                });
            });
        return item;
    }
});
        
}(jQuery));
