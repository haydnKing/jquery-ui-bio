/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global next_color:false Dajaxice:false Raphael:false*/
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
            defaultName: '',
            defaultDesc: '',
            defaultStatus: 'Loading...',
            loading: 'Loading {loaded} of {total}',
            loaded: 'Loaded fragment \'{name}\'',
            sizes: ['B', 'kB', 'MB', 'GB'] 
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
            .text(o.text.defaultName)
            .appendTo(m);
        this.desc = $('<p>')
            .addClass(descClass)
            .text(o.text.defaultDesc)
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
        this.progress_bar = $('<div>').progressbar({'value':0, 'max':100})
            .appendTo(zv);


        //Events
        this.right_arrow.add(this.left_arrow).mouseenter(function(){
            $(this).addClass('ui-state-hover');
        }).mouseleave(function() {
            $(this).removeClass('ui-state-hover');
        });

        var xhr = Dajaxice.call('ui_bio_demos.getMetadata', 'POST',
        function(data){
            self._onComplete(data);
        });
        xhr.onprogress = function(e){
            self._onProgress(e.loaded,xhr.getResponseHeader('Content-Length'));
        };
    
    },
    _init: function() {
        this._super();
        this.setStatus(this.options.text.defaultStatus);
    },
    _onProgress: function(loaded, total) {
        var pc = 100.0 * (loaded / total);
        this.progress_bar.progressbar('value', pc);
        var m = this.options.text.loading
            .replace('{loaded}', this._fmtsize(loaded))
            .replace('{total}', this._fmtsize(total));
        this.setStatus(m);
    },
    _onComplete: function(data) {
        var self = this;

        this.setStatus(this.options.text.loaded.replace('{name}', data.name));
        this.name.text(data.name);
        this.desc.text(data.description);
        this.progress_bar.fadeOut(250, function(){
            self._draw_overview();});
        this.meta = data;

    },
    _fmtsize: function(size){
        var i = 0;
        var s = this.options.text.sizes;
        while((size > 1024) && (i < s.length)){
            size = size / 1024.0;
            i = i+1;
        }
        if(i > 0){
            return size.toFixed(1) + s[i];
        }
        return size.toFixed(0) + s[i];

    },
    _draw_overview: function() {
        var w = this.overview.width(),
            h = this.overview.height(),
            pad = 0.05 * w,
            i = 0, j = 0, k = 0,
            feats = [],
            f, done, l;
        var paper = this.opaper = Raphael(this.overview.get(0), w, h);
        this.ow = w;
        this.oh = h;

        paper.path('M'+pad+','+(h/2)+' L'+(w-pad)+','+(h/2))
            .attr({'fill': '#ddd', 'width':'1px'});

        for(i=0; i < this.meta.features.length; i++){
            f = this.meta.features[i];
            feats.push({'feat':f, 'len': Math.abs(f.end-f.start)});
        }
        //sort in decreasing order of length
        feats.sort(function(a,b){return b.len-a.len;});

        var strands = {'fwd': [[]], 'rev': [[]]},
            s;

        var fits; 

        var lanes = this.lanes = {'fwd': [], 'rev':[]};

        for(i=0; i < feats.length; i++){
            f = feats[i].feat;
            done =false;
            s = (f.strand >= 0) ? lanes.fwd : lanes.rev;
            for(j=0; j< s.length; j++){
                l = s[j];
                k = 0;
                fits = true;
                var b;
                for( ; k < l.length; k++){
                    b = l[k];
                    if(((f.start < b.start) && (f.end > b.start)) ||
                        ((f.start < b.end) && (f.end > b.end)) ||
                        ((f.start > b.start) && (f.end < b.end))){
                        fits = false;
                        break;
                    }
                }
                
                if(fits){
                    s[j].push(f);
                    done=true;
                    break;
                }
            }

            if(!done){
                //add a new lane
                s.push([f]);
            }
        }

        var gap = Math.min(h / (2 * (lanes.fwd.length+1)), 
                           h / (2 * (lanes.rev.length+1)));
        var width = w - 2*pad;
        
        var fh,fa,fb;

        this._draw_lanes();
    },
    _draw_lanes: function(dir, i) {
        i = i || 0;
        dir = dir || 'fwd';

        console.log('_draw_lanes(\''+dir+'\', '+i+')');

        //should we stop?
        if(i >= this.lanes[dir].length){
            if(dir === 'fwd'){
                this._draw_lanes('rev', 0);
            }
            return;
        }

        this._draw_lane(dir, i);

        var self = this;
        setTimeout(function(){
            self._draw_lanes(dir, i+1);
        }, 50);

    },
    _draw_lane: function(direction, num){
        var gap = Math.min(this.oh / (2 * (this.lanes.fwd.length+1)), 
                           this.oh / (2 * (this.lanes.rev.length+1)));
        if(direction === 'rev'){
            gap = -gap;
        }
        var i, j, l, f, fh, fa, fb;
        var pad = 0.05 * this.ow,
            width = this.ow - 2 * pad;

        l = this.lanes[direction][num];
        fh = this.oh/2 - (num+1)*gap;
        for(j=0; j < l.length; j++){
            f = l[j];
            fa = width * (f.start / this.meta.length) + pad;
            fb = width * (f.end   / this.meta.length) + pad;                
            this.opaper.path('M'+fa+','+fh+'L'+fb+','+fh);
        }
    }
});

}(jQuery));

