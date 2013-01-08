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
    spacerClass = 'bio-spacer',
    zoomClass = 'bio-zoomview',
    arrowClass = 'bio-slidearrow ui-widget-header',
    leftClass = 'bio-slideleft',
    rightClass = 'bio-slideright',
    loadpanelC = 'load-panel';

$.widget("bio.sequenceView", $.bio.panel, {
    options: {
        title: undefined,
        help: undefined,
        text: {
            defaultTitle: 'Sequence View',
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

        this._build_elements(); 

        this._show_meta();
        this._show_loader();

    },
    _init: function() {
        this._super();
        this.setStatus(this.options.text.defaultStatus);
    },
    _build_elements: function() {
        
        // --------------------------------------------------------------
        // Make metadata
        // --------------------------------------------------------------

        var m = this.metadata = this._panel_item()
            .addClass(metaClass);

        this.name = $('<p>')
            .addClass(nameClass)
            .text('Fragment Name')
            .appendTo(m);
        this.desc = $('<p>')
            .addClass(descClass)
            .text('Fragment Description')
            .appendTo(m);
        
        // --------------------------------------------------------------
        // Make seqview
        // --------------------------------------------------------------

        this.seqview = $('<div>');

        this.overview = this._panel_item()
            .addClass(overviewClass)
            .appendTo(this.seqview);

        this.spacer = this._panel_item()
            .addClass(spacerClass)
            .appendTo(this.seqview);

        var zv = this.zoomview = this._panel_item()
            .addClass(zoomClass)
            .appendTo(this.seqview);

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
        
        // --------------------------------------------------------------
        // Make sequenceLoader
        // --------------------------------------------------------------
        
        this.loader = $('<div>').sequenceLoader();
        this.loaderpanel = this._panel_item()
            .addClass(loadpanelC)
            .append(this.loader);
    },
    _show_meta: function() {
        this.panel.append(this.metadata);
    },
    _show_loader: function() {
        this.panel.append(this.loaderpanel);
        this.stretch_factors = {
            'loaderpanel': 1
        };
        this._refresh();
    },
    _hide_loader: function() {
        this.loaderpanel.remove();
    },
    _show_seqview: function() {
        //set the stretch_factors
        this.stretch_factors = {
            'zoomview': 5,
            'spacer': 1,
            'overview': 2
        };
        this.panel.append(this.seqview);
        this._refresh();
    }
});

}(jQuery));

