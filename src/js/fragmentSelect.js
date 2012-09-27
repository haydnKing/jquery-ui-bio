/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global next_color:false */
(function($, undefined) {

var baseClasses = 'bio-fragment-list ui-widget ui-state-default';

$.widget("bio.fragmentSelect", {
    options: {
        text: {
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

        var filter = $('<div>').addClass('bio-filter ui-widget-header').appendTo(el);
        this.input = $('<input type="text">').appendTo(filter);
        $('<div>').addClass('ui-icon ui-icon-search').appendTo(filter);

        var panel = $('<div>').addClass('bio-panel').appendTo(el);

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


    }
});

}(jQuery));

