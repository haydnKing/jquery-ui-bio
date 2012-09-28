/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global next_color:false */
(function($, undefined) {

var baseClasses = 'bio-fragment-select ui-widget',
    panelClasses= 'bio-panel ui-widget ui-state-default',
    bottomClasses='bio-bottom ui-widget ui-widget-header';

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
            none_found: 'No fragments found'
        },
        defaultHelper: 'clone',
        height: 400
    },
    _create: function() {
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseClasses);

        this.timeout = null;

        var header  = this.header = $('<div>').addClass('ui-widget-header').appendTo(el);
        this.search = $('<div>')
            .search({
                text: {search: 'filter'},
                change: function(){
                    self.filter(self.search.search('value'));
                }
            })
            .appendTo(header);
        

        var panel = this.panel = $('<div>').addClass(panelClasses).appendTo(el);
        var base = $('<div>').addClass(bottomClasses).appendTo(el);

        //copy any initial fragments
        var list = el.find('ul');
        if(list.length === 1){
            list.detach().appendTo(panel);
        }
        else{
            list = $('ul').appendTo(panel);
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

        self._set_height();

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
    },
    showAll: function(){
        this.el.find(':bio-fragment').show();
    },
    _set_height: function(){
        this.panel.outerHeight(this.options.height - this.header.outerHeight());
    }
});

}(jQuery));

