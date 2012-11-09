/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global next_color:false */
(function($, undefined) {

var baseClasses = 'bio-sequence-view ui-widget',
    metaClass = 'bio-meta',
    nameClass = 'bio-name',
    descClass = 'bio-desc',
    overviewClass = 'bio-overview',
    viewClass = 'bio-view',
    spacerClass = 'bio-spacer',
    zoomClass = 'bio-zoomview',
    arrowClass = 'bio-slidearrow ui-widget-header',
    leftClass = 'bio-slideleft',
    rightClass = 'bio-slideright';

$.widget("bio.sequenceView", $.bio.panel, {
    options: {
        title: undefined,
        help: undefined,
        text: {
            defaultTitle: 'Fragment View',
            defaultHelp: 'Drag to scroll around in the fragment',
            defaultStatus: 'No fragment loaded'
        },
        height: 400
    },
    _create: function() {
        this._super();
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseClasses);

        //set the stretch_factors
        this.stretch_factors = {
            'zoomview': 5,
            'spacer': 1,
            'overview': 2
        };

        var m = this.metadata = $('<div>')
            .addClass(metaClass)
            .appendTo(this.panel);

        this.name = $('<p>')
            .addClass(nameClass)
            .text('Fragment Name')
            .appendTo(m);
        this.desc = $('<p>')
            .addClass(descClass)
            .text('Fragment Description')
            .appendTo(m);

        this.overview = $('<div>')
            .addClass(overviewClass)
            .appendTo(this.panel);
        this.viewpane = $('<div>')
            .addClass(viewClass)
            .appendTo(this.overview);

        this.spacer = $('<div>')
            .addClass(spacerClass)
            .appendTo(this.panel);

        var zv = this.zoomview = $('<div>')
            .addClass(zoomClass)
            .appendTo(this.panel);

        this.right_arrow = $('<div>')
            .addClass(arrowClass + ' ' + rightClass)
            .append($('<span>')
                .addClass('ui-icon ui-icon-triangle-1-e'))
            .appendTo(zv);
        this.left_arrow = $('<div>')
            .addClass(arrowClass + ' ' + leftClass)
            .append($('<span>')
                .addClass('ui-icon ui-icon-triangle-1-w'))
            .appendTo(zv);


        //Events
        this.right_arrow.add(this.left_arrow).mouseenter(function(){
            $(this).addClass('ui-state-hover');
        }).mouseleave(function() {
            $(this).removeClass('ui-state-hover');
        });
    },
    _init: function() {
        this._super();
        this.setStatus(this.options.text.defaultStatus);
    }
});

}(jQuery));

