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
    defaultIcon   = 'ui-icon-circle-triangle-e';

var test_frag = function(filter, f){
    f = f.children(':bio-fragment');
    return filter.test(f.fragment('option','name')) || 
        filter.test(f.fragment('option','desc'));
};

$.widget("bio.fragmentSelect", $.bio.panel, {
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
            fragments: 'fragments',
            cberror: 'An error occurred'
        },
        defaultHelper: 'clone',
        height: 400,
        src: undefined, //string URL or f(cb, error_cb)
        color: null
    },
    _create: function() {
        this._super();
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseClasses);

        this.stretch_factors = {'ul': 1};

        this.timeout = null;

        var searchbar = self._panel_item()
            .addClass('searchbar')
            .appendTo(this.panel);
        
        this.search = $('<div>')
            .search({
                text: {search: 'filter'},
                filter: function(ev, data){
                    self.filterStatus(data.show.length, data.hide.length);
                },
                filterFunc: test_frag,
                items: function() {
                    return self.list.find(':bio-fragment').parent();
                },
                anim: 200
            })
            .appendTo(searchbar);
        
        this.list = this._panel_item()
            .addClass('list')
            .appendTo(this.panel);

        //copy any initial fragments
        var ul = this.ul = el.find('ul');
        if(ul.length === 1){
            ul.detach().appendTo(this.list);
        }
        else{
            ul = this.ul = $('<ul>').appendTo(this.list);
        }

        ul.sortable({
            placeholder: 'ui-widget-content bio-fragment-placeholder',
            connectWith: '.bio-panel ul',
            start: function(ev, ui) {
                ui.item.find(':bio-fragment').fragment('disable');
            },
            stop: function(ev, ui) {
                ui.item.find(':bio-fragment').fragment('enable');
            },
            receive: function(ev, ui) {
                var f = ui.item.find(':bio-fragment');
                f.fragment('option', 'color', o.color);
                self.setStatus('Added fragment "'+f.fragment('option','name')+'"',
                              'ui-icon-circle-plus');
            },  
            remove: function(ev, ui) {
                var f = ui.item.find(':bio-fragment');
                self.setStatus('Removed fragment "'+f.fragment('option','name')+'"',
                              'ui-icon-circle-minus');
            },
            helper: function(ev, item) {
                return $(item)
                    .find(':bio-fragment')
                    .clone()
                    .appendTo($('body'));
            }
        });

        var success = function(data) {
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
                        color: o.color,
                        width: w
                    });
            });
            self.setStatus();
            ul.animate({
                'margin-top': 0
            }, 'fast', function() {
                self.list.css('overflow', '');
                ul.css('margin-top', '');
            });

        };


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
                    'success': success,
                    'error': function(jqXHR, textStatus, errorThrown) {
                        self.setStatus(String(errorThrown),'ui-icon-alert');
                    }
                });
            }
            else if($.isFunction(o.src)){
                try{
                    o.src(success, function(){
                        self.setStatus(o.text.cberror, 'ui-icon-alert');
                    });
                }
                catch(e){
                    self.setStatus(e.message, 'ui-icon-alert');
                }
            }
            else {
                throw("options.src must be a string URL or a function");
            }
        }

        if(el.hasClass('ui-corner-all')){
            this.search.addClass('ui-corner-all');
        }
    },
    showAll: function(){
        this.el.find(':bio-fragment').show();
    },
    filterStatus: function(shown, hidden){
        var text,
            icon = null,
            t = this.options.text;
        
        if(hidden > 0 && shown > 0) {
            text = t.showing_filter;
            icon = defaultIcon;
        }           
        else if(hidden === 0 && shown === 0) {
            text = t.none_loaded;
            icon = 'ui-icon-alert';
        }
        else if(hidden > 0 && shown === 0) {
            text = t.none_matching;
            icon = 'ui-icon-alert';
        }
        else if(hidden === 0) {text = t.showing_all;}

        this.setStatus(this._get_text(text, shown+hidden, shown), icon);
    },
    setStatus: function(text, icon) {
        var tot = this.list.find(':bio-fragment').length,
            t = this.options.text;

        if(text == null){
            if(tot === 0) {
                text = t.none_loaded;
                icon = 'ui-icon-alert';
            }
            else {text = t.showing_all;}
        }
        this.status_icon.attr('class', 'ui-icon ' + (icon || defaultIcon));
        this.status_text.text( this._get_text(text, tot));
    },
    _get_text: function(str, total, filter){
        var t = this.options.text;
        filter = filter || 0;
        return str
            .replace('%filter', filter)
            .replace('%total', total)
            .replace('%fragment', (total === 1)? t.fragment : t.fragments);
    }
});

}(jQuery));

