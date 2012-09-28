/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
(function($, undefined) {

var baseClasses    = 'bio-search ui-widget',
    defaultClasses = 'ui-state-default',
    hoverClasses   = 'ui-state-hover',
    focusClasses   = 'ui-state-highlight';

$.widget("bio.search", {
    options: {
        text: {
            search: 'search'
        },
        // events
        change: undefined 
    },
    _create: function() {
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseClasses);

        this.timeout = null;

        el.addClass(baseClasses).addClass(defaultClasses);
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
                    self.el
                        .removeClass(defaultClasses)
                        .removeClass(hoverClasses)
                        .addClass(focusClasses);
                },
                'blur': function(){
                    if(!$(this).val()){ 
                        self.search_hint.show();
                        self.search_clear.hide();
                    }
                    self.el
                        .removeClass(focusClasses)
                        .addClass(defaultClasses);
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
                        self._trigger('change', v);
                    }, 500);
                }
            });
        this.el.on({
            'click': function() {
                self.input.focus();
            },
            'mouseenter': function() {
                if(self.el.hasClass(defaultClasses)){
                    self.el
                        .removeClass(defaultClasses)
                        .addClass(hoverClasses);
                }
            },
            'mouseleave': function() {
                if(self.el.hasClass(hoverClasses)){
                    self.el
                        .removeClass(hoverClasses)
                        .addClass(defaultClasses);
                }
            }
                    
        });
        this.search_clear.on('click', function(){
            self.input.val('');
            self.search_clear.hide();
            self._trigger('change');
        });
    },
    value: function(v) {
        if(v!=null){
            this.input.val(v);
            this._trigger('change');
            return;
        }
        return this.input.val();
    }
});

}(jQuery));

