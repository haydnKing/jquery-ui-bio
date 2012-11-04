/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global next_color:false */
(function($, undefined) {

var panelClasses  = 'bio-panel ui-widget-content ui-state-default',
    footerClasses = 'bio-footer ui-widget ui-widget-header',
    defaultIcon   = 'ui-icon-circle-triangle-e';

$.widget("bio.panel", {
    options: {
        title: undefined,
        help: undefined,
        baseClasses: 'ui-widget',
        text: {
            defaultTitle: 'Bio Panel',
            defaultHelp: '',
            defaultStatus: 'Ready'
        },
        height: 400,
        showStatus: true
    },
    _create: function() {
        console.log('bio.panel._create');
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(o.baseClasses);

        o.title = o.title || o.text.defaultTitle;
        o.help = o.help || o.text.defaultHelp;
        o.color = o.color || next_color();


        var head = this.head = $('<div>').addClass('ui-widget-header').appendTo(el);
        var panel = this.panel = $('<div>').addClass(panelClasses).appendTo(el);
        var foot = this.foot = $('<div>').addClass(footerClasses).appendTo(el);
        
        this.title = $('<span>').addClass('title').text(o.title).appendTo(head);
        var h = this.help = $('<span>').appendTo(head).help({
            helphtml: o.help
        });

        var s = this.status_bar = $('<div>').addClass('ui-state-default statusbar')
            .appendTo(panel);
        this.status_icon = $('<span>').addClass('ui-icon').appendTo(s);
        this.status_text = $('<p>').appendTo(s);
        if(!o.showStatus){
            s.hide();
        }

        this._set_height();

        if(el.hasClass('ui-corner-all')){
            head.addClass('ui-corner-top');
            foot.addClass('ui-corner-bottom');
            h.addClass('ui-corner-all');
        }
    },
    option: function(key, value) {
        if(value == null){
            return this.options[key];
        }
        switch(key){
            case 'title':
                this.head.find('span').text(value);
                break;
            case 'help':
                this.help('setHelp', value);
                break;
            case 'height':
                this._set_height(value);
                break;
        }
        this.options[key] = value;
    },
    setStatus: function(text, icon) {
        this.status_icon.attr('class', 'ui-icon ' + (icon || defaultIcon));
        this.status_text.text(text || this.options.text.defaultStatus);
    },
    _set_height: function(){
        var others = 0;
        this.panel.siblings().each(function() {
            others += $(this).outerHeight();
        });
        var h = this.options.height - others;
        this.panel.outerHeight(h);
    }
});

}(jQuery));

