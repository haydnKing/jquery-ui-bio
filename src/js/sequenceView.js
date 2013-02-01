/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global next_color:false,bio:false,Raphael:false */
(function($, undefined) {

var baseClasses = 'bio-sequence-view ui-widget',
    metaClass = 'bio-meta',
    nameClass = 'bio-name',
    descClass = 'bio-desc',
    overviewClass = 'bio-overview',
    spacerClass = 'bio-spacer',
    zoomClass = 'bio-zoomview',
    leftClass = 'bio-slideleft',
    rightClass = 'bio-slideright',
    loadpanelC = 'load-panel';

var names = ['B', 'kB', 'MB', 'GB', 'PB'];

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
        /*
         * sequence source of features
         *  - function(cb, from, to)
         *      call cb with the returned sequence
         */
        sequence: null,
        text: {
            defaultTitle: 'Sequence View',
            defaultHelp: 'Drag to scroll around in the fragment',
            defaultStatus: 'No fragment loaded',
            metaError: 'Error fetching metadata: %(message)',
            featureError: 'Error fetching features: %(message)',
            download_status: 'Downloading Features: %(loaded) of %(total)',
            process_status: 'Processing Features: %(loaded) of %(total)',
            download_start: 'Downloading Features...',
            loading_graphics: 'Loading Graphics...',
            load_complete: 'Loading Complete'
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

        this.el.on('metadata.error', function(ev, data){
            self.setStatus(o.text.metaError, data, 'error');
        });

        bio.read_data(function(data){
            self._update_meta(data);
            self.loader.sequenceLoader('start', self.meta.length);
        }, o.metadata, o.post_data, this.el, 'metadata');
    },
    _update_meta: function(data) {
        this.name.text(data.name);
        this.desc.text(data.description);
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
            .on('sequenceloaderdownload', function(ev, data) {
                self.setStatus(t.download_status, {
                    loaded: self._readable(data.loaded),
                    total: self._readable(data.total)
                }, 'loading');
            })
            .on('sequenceloaderprocess', function(ev, data) {
                self.setStatus(t.process_status, data, 'loading');
            })
            .on('sequenceloaderstart', function(ev) {
                self.setStatus(t.download_start, 'loading');
            }) 
            .on('sequenceloadercompleted', function(ev) {
                self.setStatus(t.loading_graphics, 'loading');
                self._load_graphics(self.loader.sequenceLoader('featureStore'));
            });
    },
    _load_graphics: function(fs){
        this.fs = fs;
        this._hide_loader();
        this._show_seqview();

        var self = this,
            t = this.options.text,
            l = 0;
        var completed = function(){
            l = l+1;
            if(l===2){
                self.setStatus(t.load_complete);
            }
        };

        setTimeout( function() {
            self.overview.overview({
                featureStore: fs,
                colorScheme: self._get_color_scheme(fs.types),
                seq_length: self.meta.length,
                completed: completed,
                clicked: function(ev, loc){
                    self.zoomview.sequence('center', loc.pos);
                }
            });
            self.zoomview.sequence({
                featureStore: fs,
                colorScheme: self._get_color_scheme(fs.types),
                tile_length: 1024,
                seq_length: self.meta.length,
                sequence: self.options.sequence,
                completed: completed,
                moved: function(ev, data) {
                    self.overview.overview('setHighlight',
                                           data.start, data.width);
                }
            });
        }, 50);
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
    },
    _get_color_scheme: function(types)
    {
        if(this.colorscheme == null){
            this.colorscheme = {};
            var step = 360 / types.length;
            for(var i = 0; i < types.length; i++){
                this.colorscheme[types[i].toLowerCase()] = 
                    Raphael.hsl(i*step,50,50);
            }
        }
        return this.colorscheme;
    },
    _readable: function(bytes) {
        var i = 0;
        for(;i < names.length; i++)
        {
            if((bytes / Math.pow(1024.0, i+1)) < 1.0) {
                break;
            }
        }

        return (parseFloat(bytes) / Math.pow(1024.0, i)).toFixed(2) + 
            ' ' + names[i];
    }
});

}(jQuery));

