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
            loaded: 'Loaded %(total) %(fragment)',
            error: 'Error',
            none_loaded: 'No fragments are loaded',
            none_matching: 'No fragments match the filter',
            showing_all: 'Showing %(total) %(fragment)',
            showing_filter: 'Showing %(filter) of %(total) %(fragment)',
            add_fragment: 'Added fragment \'%(name)\'',
            remove_fragment: 'Removed fragment \'%(name)\'',
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
                self.setStatus( o.text.add_fragment, {
                    name: f.fragment('option', 'name')
                }, 'add');
            },  
            remove: function(ev, ui) {
                var f = ui.item.find(':bio-fragment');
                self.setStatus( o.text.remove_fragment, {
                    name: f.fragment('option', 'name')
                }, 'remove');
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
            self.setStatus( o.text.loaded, {
                total: data.length,
                fragment: data.length === 1 ? o.text.fragment:o.text.fragments
            }, 'ok');
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
                this.setStatus( o.text.loading, 'loading');
                $.ajax({
                    'url': o.src,
                    'dataType': 'json',
                    'success': success,
                    'error': function(jqXHR, textStatus, errorThrown) {
                        self.setStatus( String(errorThrown),
                                              'error');
                    }
                });
            }
            else if($.isFunction(o.src)){
                try{
                    o.src(success, function(){
                        self.setStatus( o.text.cberror, 'error');
                    });
                }
                catch(e){
                    self.setStatus( e.message, 'error');
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
            state = '',
            t = this.options.text;
        
        if(hidden > 0 && shown > 0) {
            text = t.showing_filter;
            state = 'info';
        }           
        else if(hidden === 0 && shown === 0) {
            text = t.none_loaded;
            state = 'warning';
        }
        else if(hidden > 0 && shown === 0) {
            text = t.none_matching;
            state = 'warning';
        }
        else if(hidden === 0) {
            text = t.showing_all;
            state = 'default';
        }

        this.setStatus( text, {
            filter: shown,
            total: shown+hidden,
            fragment: (shown+hidden) === 1 ? t.fragment : t.fragments
        }, state);
    }
});

}(jQuery));

