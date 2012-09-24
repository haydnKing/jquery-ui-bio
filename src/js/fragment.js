/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
(function($, undefined) {

var baseClasses = 'bio-fragment ui-widget ui-state-default',
    hoverClasses = 'ui-state-hover ui-state-active',
    disabledClasses = 'ui-state-disabled',
    infoClasses = 'ui-corner-all';

$.widget("bio.fragment", $.ui.draggable, {
    options: {
        name: 'Unnamed Fragment',
        description: 'No Description',
        length: 0,
        url: undefined,
        color: undefined,
        text: {
            goto_page: 'Goto Page'
        }
    },
    _create: function() {
        var o = this.options,
            self = this;
        var el = this.el = $(this.element[0])
            .addClass(baseClasses);
        this.name = $("<p>")
            .text(o.name)
            .appendTo(el);
        this.info = $("<div>")
            .hide()
            .addClass(infoClasses)
            .appendTo(el)
            .mousedown(function(ev){
                //stop the fragment from being dragged
                ev.stopPropagation();
            });
        this.refreshInfo();            
        
        if(o.color != null) {
            el.css({
                'background-color':this.options.color,
                'border-color':this.options.color
            });
        }

        if(o.helper === 'clone'){
            o.helper = function(){
                return $('<div>')
                    .addClass(baseClasses)
                    .append($("<p>").text(o.name));
            };
        }

        el.draggable(o).on('dragstart', function(){
            self.info.tooltip('disable');
        }).on('dragstop', function(){
            self.info.tooltip('enable');
        });
        this.info.tooltip({
            'mouseTarget': this.el
        });
    },
    _init: function() {
    },
    option: function(name, value)
    {
        var o = this.option;

        if(value == null) {
            return o[name] || this.$el.draggable(name);
        }
        o[name] = value;
        switch(name)
        {
            case 'name':
                this.name.text(value);
                break;
            case 'description':
            case 'length':
            case 'url':
                this.refreshInfo();
                break;
            case 'color':
                this.el.css({
                    'background-color':this.options.color,
                    'border-color':this.options.color
                });
                break;
            case 'draggable':
                this.el.draggable( (value) ? 'enable' : 'disable');
                break;
            default:
                this.el.draggable(name, value);
        }
        return this;
    },
    refreshInfo: function()
    {
        var o = this.options;
        this.info.html('');
        $('<div><p class="bio-length">'+ o.length + '</p></div>')
            .appendTo(this.info);
        $('<div><p>'+ o.description + '</p></div>')
            .appendTo(this.info);
        if(o.url != null){
            $('<div><a href=' + o.url + '>'+o.text.goto_page+'</a></div>').
                appendTo(this.info);
        }
    }
}); 

}(jQuery));
