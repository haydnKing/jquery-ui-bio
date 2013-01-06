/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global next_color:false */
(function($, undefined) {

var iconStyle = 'bio-help ui-widget',
    tooltipStyle = 'bio-help-tip',
    cornerStyle = 'ui-corner-all';

$.widget("bio.help", {
    options: {
        helphtml: 'Some Help',
        open: undefined,
        close: undefined,
        width: null
    },
    _init: function() {
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(iconStyle),
            tip = $('<div>').addClass(tooltipStyle);
        
        if(el.hasClass('ui-corner-all')){
            tip.addClass('ui-corner-all');
        }

        this.help = $('<p>').html(o.helphtml).appendTo(tip);
        this.el.tooltip({
            content: tip,
            width: this.options.width || 250
        });

    },
    _create: function() {
    },
    setHelp: function(help){
        this.options.helphtml(help);
        this.help.html(help);
    }
});

}(jQuery));
