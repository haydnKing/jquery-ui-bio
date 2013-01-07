/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
(function($, undefined) {

var baseC    = 'bio-search ui-widget',
    defaultC = 'ui-state-default',
    hoverC   = 'ui-state-hover',
    focusC   = 'ui-state-focus',
    noneC    = 'ui-state-error';

$.widget("bio.search", {
    options: {
        text: {
            search: 'search'
        },
        items: $(), //the DOM items to be filtered
        filterFunc: function(regexp, item) {return true;}, //the function to 
            //filter the items with, return true if the item is selected
        
        beforeFilter: undefined,
        filter: undefined,
        pause: 150, //how long to wait before filtering
        anim: 0 //length of time to animate - default 0
    },
    _create: function() {
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseC);

        this.timeout = null;

        el.addClass(baseC).addClass(defaultC);
        this.input = $('<input type="text">')
            .appendTo($('<div>').appendTo(el));
        this.search_hint = $('<div>')
            .addClass('hint')
            .text(o.text.search)
            .appendTo(el);
        $('<span>').addClass('ui-icon ui-icon-search').appendTo(el);
        this.search_clear = $('<span>').addClass('ui-icon ui-icon-close')
            .hide()
            .appendTo(el);
            
    },
    _init: function(){
        var self = this,
            o = this.options;
        this.input.on({
                'focus': function(){
                    self.search_hint.hide();
                    self.el.addClass(focusC);
                },
                'blur': function(){
                    if(!$(this).val()){ 
                        self.search_hint.show();
                        self.search_clear.hide();
                    }
                    self.el.removeClass(focusC);
                },
                'keyup': function(){
                    var v = self.input.val();
                    if(v){
                        self.search_clear.show();
                    } else{
                        self.search_clear.hide();
                    }
                    if(self.timeout)
                    {
                        clearTimeout(self.timeout);
                    }
                    self.timeout = setTimeout(function() {
                        self.timeout = null;
                        self._filter();
                    }, o.pause);
                }
            });
        this.el.on({
            'click': function() {
                self.input.focus();
            },
            'mouseenter': function() {
                self.el.addClass(hoverC);
            },
            'mouseleave': function() {
                self.el.removeClass(hoverC);
            }
                    
        });
        this.search_clear.on('click', function(){
            self.input.val('');
            self.search_clear.hide();
            self._filter();
        });
    },
    value: function(v) {
        if(v!=null){
            this.input.val(v);
            this._filter();
            return;
        }
        return this.input.val();
    },
    _filter: function() {
        if(this._trigger('beforeFilter') !== true){
            return;
        }
        var f = this.options.filterFunc,
            reg = new RegExp(this.input.val(), 'i'),
            i = this.options.items,
            show = $(),
            hide = $();

        if(!$.isFunction(f)){
            throw('search.options.filterFunc is not callable');
        }
        if($.isFunction(i)){
            i = i();
        }

        i.each(function() {
            if(f(reg, $(this))){
                show = show.add($(this));
            }
            else {
                hide = hide.add($(this));
            }
        });

        show.filter(':hidden').slideDown(this.options.anim);
        hide.filter(':visible').slideUp(this.options.anim);

        if(show.length === 0 && hide.length > 0) {
            this.el.addClass(noneC);
        }
        else {
            this.el.removeClass(noneC);
        }

        this._trigger('filter', null, {
            search: this.el,
            hide: hide,
            show: show
        });
    }
});

}(jQuery));

