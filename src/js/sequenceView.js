/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global next_color:false,bio:false */
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
        //The post_data to send when fetching metadata, features or sequence
        post_data: null,
        /* metadata: source of metadata 
         *  - url: url from which to GET JSON data
         *  - function(cb, data) -> XHR: function to call to return data
         *  - object: {
         *      name: 'fragment name',
         *      description: 'fragment desc',
         *      length: len(fragment.seq)
         *      }
         */
        metadata: null,
        /* features: source of features 
         *  - url: url from which to GET JSON data
         *  - function(cb, post_data) -> XHR: function to call to return data
         */
        features: null,
        text: {
            defaultTitle: 'Sequence View',
            defaultHelp: 'Drag to scroll around in the fragment',
            defaultStatus: 'No fragment loaded',
            metaError: 'Error fetching metadata: %(message)',
            featureError: 'Error fetching features: %(message)',
            loading_status: '%(state) Features: %(loaded) of %(total)',
            download_start: 'Downloading Features...'
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
        var self = this,
            o = this.options;
        this.loader.sequenceLoader('start');

        this.el.on('metadata.error', function(ev, data){
            self.setStatus(o.text.metaError, data, 'error');
        });

        bio.read_data(function(data){
            self._update_meta(data);
        }, o.metadata, o.post_data, this.el, 'metadata');
    },
    _update_meta: function(data) {
        this.name.text(data.name);
        this.desc.text(data.description);
        this.length = data.length;
        this.meta = data;
        this._refresh();
    },
    _build_elements: function() {
        
        // --------------------------------------------------------------
        // Make metadata
        // --------------------------------------------------------------

        var m = this.metadata = this._panel_item()
            .addClass(metaClass);

        this.name = $('<p>')
            .addClass(nameClass)
            .text('')
            .appendTo(m);
        this.desc = $('<p>')
            .addClass(descClass)
            .text('')
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
        
        this.loader = $('<div>').sequenceLoader({
            features: this.options.features,
            post_data: this.options.post_data
        });
        this.loaderpanel = this._panel_item()
            .addClass(loadpanelC)
            .append(this.loader);
    },
    _show_meta: function() {
        this.panel.append(this.metadata);
    },
    _show_loader: function() {
        var t = this.options.text,
            self = this;
        this.panel.append(this.loaderpanel);
        this.stretch_factors = {
            'loaderpanel': 1
        };
        this._refresh();
        this.loader
            .on('sequenceloadererror', function(ev, data) {
                self.setStatus(t.featureError, data, 'error');
            })
            .on('sequenceloaderupdate', function(ev, data) {
                self.setStatus(t.loading_status, data, 'loading');
            })
            .on('sequenceloaderstart', function(ev) {
                console.log('caught sequenceloaderstart');
                console.log('self.setStatus('+t.download_start+', \'loading\');');
                self.setStatus(t.download_start, 'loading');
            });
    },
    _hide_loader: function() {
        this.loaderpanel.remove();
        this.loader.off();
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

