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

var test_frag = function(f, filter){
    var r = filter.test(f.fragment('option','name')) || 
        filter.test(f.fragment('option','desc'));
    console.log('test_frag(f,' + filter + ') -> ' + r);
    return r;
};

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

        this.timeout = null;

        var header  = this.header = $('<div>').addClass('ui-widget-header').appendTo(el);
        var filter = $('<div>')
            .addClass('bio-filter ui-state-default ui-corner-all')
            .appendTo(header);
        this.input = $('<input type="text">')
            .appendTo($('<div>').appendTo(filter))
            .on({
                'focus': function(){self.filter_hint.hide();},
                'blur': function(){
                    if(!$(this).val()){ 
                        self.filter_hint.show();
                        self.filter_clear.hide();
                    }
                },
                'keyup': function(){
                    var v = self.input.val();
                    if(v){
                        self.filter_clear.show();
                    } else{
                        self.filter_clear.hide();
                    }
                    if(self.timeout)
                    {
                        clearTimeout(self.timeout);
                    }
                    self.timeout = setTimeout(function() {
                        self.timeout = null;
                        self.filter(v);
                    }, 500);
                }
            });
        this.filter_hint = $('<div>')
            .addClass('hint')
            .text(o.text.filter)
            .appendTo(filter)
            .on('click', function() {self.input.focus();});
        $('<span>').addClass('ui-icon ui-icon-search').appendTo(filter);
        this.filter_clear = $('<span>').addClass('ui-icon ui-icon-close')
            .hide()
            .appendTo(filter)
            .on('click', function(){
               
            });

        var panel = this.panel = $('<div>').addClass('bio-panel').appendTo(el);

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
    },
    filter: function(str){
        console.log('str = '+str);
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

