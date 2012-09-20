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
    disabledClasses = 'ui-state-disabled';

$.widget("bio.jFragment", $.ui.draggable, {
    options: {
        name: 'Unnamed Fragment',
        description: '',
        length: 0,
        url: undefined,
        color: undefined
    },
    _create: function() {
        var o = this.options;
        var el = this.el = $(this.element[0])
            .addClass(baseClasses);
        this.name = $("<p>")
            .addClass('bio-fragment-name')
            .text(o.name)
            .appendTo(el);
        
        if(o.color != null) {
            el.css({
                'background-color':this.options.color,
                'border-color':this.options.color
            });
        }

        el.draggable(o);
    },
    option: function(name, value)
    {
        if(value == null) {
            return this.options[name] || this.$el.draggable(name);
        }
        switch(name)
        {
            case 'name':
                this.name.text(value);
                break;
            case 'description':
                break;
            case 'length':
                break;
            case 'url':
                break;
            case 'color':
                this.el.css({
                    'background-color':this.options.color,
                    'border-color':this.options.color
                });
                break;
            case 'draggable':
                break;
            default:
                this.el.draggable(name, value);
        }
        this.options[name] = value;
        return this;
    }
}); 

}());
