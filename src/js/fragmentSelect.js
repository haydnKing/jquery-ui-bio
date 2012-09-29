/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global next_color:false */
(function($, undefined) {

var baseClasses   = 'bio-fragment-select ui-widget',
    panelClasses  = 'bio-panel ui-widget-content ui-state-default',
    bottomClasses = 'bio-bottom ui-widget ui-widget-header',
    defaultIcon   = 'ui-icon-carat-1-e';

var test_frag = function(f, filter){
    return filter.test(f.fragment('option','name')) || 
        filter.test(f.fragment('option','desc'));
};

$.widget("bio.fragmentSelect", {
    options: {
        text: {
            title: 'Fragment Selector',
            filter: 'filter',
            loading: 'Loading fragments...',
            none_loaded: 'No fragments are loaded',
            none_matching: 'No fragments match the filter',
            showing_all: 'Showing %total %fragment',
            showing_filter: 'Showing %filter of %total %fragment',
            fragment: 'fragment',
            fragments: 'fragments'
        },
        defaultHelper: 'clone',
        height: 400
    },
    _create: function() {
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseClasses);

        this.timeout = null;

        var header = this.header = $('<div>').addClass('ui-widget-header').appendTo(el);
        var panel = this.panel = $('<div>').addClass(panelClasses).appendTo(el);
        var base = $('<div>').addClass(bottomClasses).appendTo(el);
        
        $('<span>').addClass('title').text(o.text.title).appendTo(header);
        $('<span>').addClass('help').appendTo(header);

        var searchbar = $('<div>').addClass('searchbar').appendTo(panel);
        
        this.search = $('<div>')
            .search({
                text: {search: 'filter'},
                change: function(){
                    self.filter(self.search.search('value'));
                }
            })
            .appendTo(searchbar);
        
        this.list = $('<div>').addClass('list ui-state-default').appendTo(panel);
        var s = $('<div>').addClass('ui-state-default statusbar')
            .appendTo(panel);
        this.status_icon = $('<span>').addClass('ui-icon').appendTo(s);
        this.status_text = $('<p>').appendTo(s);

        //copy any initial fragments
        var list = el.find('ul');
        if(list.length === 1){
            list.detach().appendTo(this.list);
        }
        else{
            list = $('ul').appendTo(this.list);
        }

        //and initialise them
        list.find('li').each(function() {
            $(this).addClass('ui-state-default')
                .children().fragment({helper: o.defaultHelper});
        });

        //interaction clues
        list.on({
            'mouseenter': function(){
                $(this).addClass('ui-state-hover');
            },
            'mouseleave dragstop': function(){
                $(this).removeClass('ui-state-hover');
            }
        }, 'ul > li');

        this.setStatus();
        this._set_height();

        if(el.hasClass('ui-corner-all')){
            header.addClass('ui-corner-top');
            this.search.addClass('ui-corner-all');
            base.addClass('ui-corner-bottom');
        }
    },
    filter: function(str){
        var reg = new RegExp(str, 'i');
        this.el.find(':bio-fragment').each( function(){
            var f = $(this);
            if(test_frag(f, reg)){
                f.parent().show();
            }
            else{
                f.parent().hide();
            }
        });
        this.setStatus();
    },
    showAll: function(){
        this.el.find(':bio-fragment').show();
    },
    setStatus: function(text, icon) {
        var tot = this.list.find(':bio-fragment').length;
        var fil = this.list.find(':bio-fragment:visible').length;
        if(text == null){
            var t = this.options.text;
            if(tot === 0 && fil === 0) {
                text = t.none_loaded;
                icon = 'ui-icon-alert';
            }
            else if(tot > 0 && fil === 0) {
                text = t.none_matching;
                icon = 'ui-icon-alert';
            }
            else if(tot === fil) {text = t.showing_all;}
            else {text = t.showing_filter;}
        }
        this.status_icon.attr('class', 'ui-icon ' + (icon || defaultIcon));
        this.status_text.text( this._get_text(text, fil, tot));
    },
    _set_height: function(){
        var others = 0;
        this.panel.siblings().add(this.list.siblings()).each(function() {
            others += $(this).outerHeight();
        });
        this.list.outerHeight(this.options.height - others);
    },
    _get_text: function(str, filter, total){
        var t = this.options.text;
        return str
            .replace('%filter', filter)
            .replace('%total', total)
            .replace('%fragment', (total === 1)? t.fragment : t.fragments);
    }
});

}(jQuery));

