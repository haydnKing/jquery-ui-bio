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
        title: undefined,
        help: undefined,
        text: {
            defaultTitle: 'Fragment Selector',
            defaultHelp: 'Drag and drop fragments to select them',
            filter: 'filter',
            loading: 'Loading fragments...',
            error: 'Error',
            none_loaded: 'No fragments are loaded',
            none_matching: 'No fragments match the filter',
            showing_all: 'Showing %total %fragment',
            showing_filter: 'Showing %filter of %total %fragment',
            fragment: 'fragment',
            fragments: 'fragments'
        },
        defaultHelper: 'clone',
        height: 400,
        src: undefined
    },
    _create: function() {
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseClasses);

        o.title = o.title || o.text.defaultTitle;
        o.help = o.help || o.text.defaultHelp;
        this.timeout = null;

        var header = this.header = $('<div>').addClass('ui-widget-header').appendTo(el);
        var panel = this.panel = $('<div>').addClass(panelClasses).appendTo(el);
        var base = $('<div>').addClass(bottomClasses).appendTo(el);
        
        $('<span>').addClass('title').text(o.title).appendTo(header);
        var h = $('<span>').appendTo(header).help({
            helphtml: o.help
        });

        var searchbar = $('<div>').addClass('searchbar').appendTo(panel);
        
        this.search = $('<div>')
            .search({
                text: {search: 'filter'},
                change: function(){
                    self.filter(self.search.search('value'));
                }
            })
            .appendTo(searchbar);
        
        this.list = $('<div>').addClass('list ui-state-default')
            .appendTo(panel);
        var s = $('<div>').addClass('ui-state-default statusbar')
            .appendTo(panel);
        this.status_icon = $('<span>').addClass('ui-icon').appendTo(s);
        this.status_text = $('<p>').appendTo(s);

        //copy any initial fragments
        var ul = el.find('ul');
        if(ul.length === 1){
            ul.detach().appendTo(this.list);
        }
        else{
            ul = $('<ul>').appendTo(this.list);
        }

        ul.sortable({
            connectWith: '.bio-panel ul',
            start: function(ev, ui) {
                $(this).find(':bio-fragment').fragment('disable');
            },
            stop: function(ev, ui) {
                $(this).find(':bio-fragment').fragment('enable');
            },
            receive: function(ev, ui) {
                var n = $(ui.item).find(':bio-fragment').fragment('option', 'name');
                self.setStatus('Added fragment "'+n+'"');
            },  
            remove: function(ev, ui) {
                var n = $(ui.item).find(':bio-fragment').fragment('option', 'name');
                self.setStatus('Removed fragment "'+n+'"');
            }
        });

        if(o.src != null) {
            if(typeof(o.src) === 'string') {
                //prepare for animations
                this.list.css('overflow', 'hidden');
                ul.css('margin-top', this.list.height() + 'px');
                //interpret as an url to load from
                this.setStatus(o.text.loading, 'ui-icon-loading');
                $.ajax({
                    'url': o.src,
                    'dataType': 'json',
                    'success': function(data) {
                        //copy into the DOM
                        for(var i = 0; i < data.length; i++) {
                            var f = data[i];
                            $('<li>').append($('<div>').attr({
                                name: f.name,
                                length: f.length,
                                desc: f.desc,
                                href: f.url
                            })).appendTo(ul);
                        }
                        //and initialise them
                        ul.find('li').each(function() {
                            var w = $(this).width();
                            $(this).children().fragment({
                                    width: w
                                });
                        });
                        self.setStatus();
                        ul.animate({
                            'margin-top': '0px'
                        }, 'fast', function() {
                            self.list.css('overflow-y', 'auto');
                        });

                    },
                    'error': function(jqXHR, textStatus, errorThrown) {
                        self.setStatus(String(errorThrown),'ui-icon-alert');
                    }
                });
            }
            else {
                this.setStatus();
            }
        }

        this._set_height();

        if(el.hasClass('ui-corner-all')){
            header.addClass('ui-corner-top');
            this.search.addClass('ui-corner-all');
            base.addClass('ui-corner-bottom');
            h.addClass('ui-corner-all');
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

