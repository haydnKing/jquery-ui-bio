/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global Raphael:false */
(function($, undefined) {

var baseC   = 'bio-sequence-overview ui-widget';

var small_tick = 3,
    separation = 5,
    click_range = 3,
    names = ['bp', 'kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Yb'];

$.widget("bio.overview", {
    options: {
        featureStore: null,
        colorScheme: {},
        seq_length: 0
    },
    _create: function(){
        this.el = $(this.element[0])
            .addClass(baseC);
        var pad = $('<div>').appendTo(this.el);

        this.paper = new Raphael(pad.get(0), pad.width(), pad.height());
        this.scale = this.paper.set();

        this._get_size();

        this._draw_centerline();

        this._get_heights();
        console.log('_feat_height = '+this._feat_height);
        this._progressive_draw();
    },
    _init: function(){
    },
    _get_size: function(){
        this.w = $(this.paper).prop('width');
        this.h = $(this.paper).prop('height');
        this.w2 = this.w/2.0;
        this.h2 = this.h/2.0;
    },
/*    _eneable_tooltip: function(){
        var self = this,
            o = this.options;

        $(this.paper).tooltip({
            title: "Select a Fragment",
            content: function(ev){
                var pos = self._loc_from_ev(ev),
                    dp = math.round(o.seq_length * click_range / self.w);



            },
        });
    },*/
    _get_heights: function() {
        var i = 0,
            fwd = 0,
            rev = 0,
            fs = this.options.featureStore,
            type;

        for(i in fs.stacks.fwd){
            fwd += fs.stacks.fwd[i];
        }
        for(i in fs.stacks.rev){
            rev += fs.stacks.rev[i];
        }

        this._direction_height = this.h2 - separation;
        this._feat_height = Math.min(this._direction_height / fwd, 
                                     this._direction_height / rev);
        
        fwd = 0;
        rev = 0;
        this.stacks = {'fwd': {}, 'rev': {}};
        for(i = 0; i < fs.types.length; i+=1) {
            type = fs.types[i];
            this.stacks.fwd[type] = fwd;
            this.stacks.rev[type] = rev;
            fwd += fs.stacks.fwd[type] * this._feat_height;
            rev += fs.stacks.rev[type] * this._feat_height;
        }
    },
    _progressive_draw: function(i) {
        var self = this;        
        if(i==null){
            setTimeout(function(){
                self._progressive_draw(0);
            }, 100);
            return;
        }
        var fs = this.options.featureStore;
        if(i >= fs.types.length){
            this._trigger('completed');
            return;
        }
        this._draw_features(fs.getFeaturesByType(fs.types[i]));
        this._trigger('progress', null, {
                'done': i, 
                'total': fs.types.length
            });
        setTimeout(function(){
            self._progressive_draw(i+1);
        }, 100);
    },
    _draw_features: function(feats) {
        var feat, i, h, type,
            scale = this.w / this.options.seq_length,
            fs = this.options.featureStore,
            cs = this.options.colorScheme;
        feats = feats || fs.features;

        for(i = 0; i < feats.length; i++) {
            feat = feats[i];
            type = feat.type.toLowerCase();
            h = (feat.strand() >= 0) ? 
                this.h2 - separation - this.stacks.fwd[type] - 
                    this._feat_height * (0.5 + feat.track) :
                this.h2 + separation + this.stacks.rev[type] + 
                    this._feat_height * (0.5 + feat.track);
         
            this.paper.path('M'+scale*feat.location.start+','+h+
                            'L'+scale*feat.location.end+','+h)
                .attr({
                    'stroke-width': 0.8*this._feat_height,
                    stroke: cs[type]
                });
            //console.log('stroke = cs['+type+'] = '+cs[type]);
        }
    },
    _draw_centerline: function() {
        if(this.scale != null){
            this.scale.remove();
        }
        this.scale = this.scale || this.paper.set();
        this.scale_color = this.el.css('color');
        
        var path = 
            'M0,'+(this.h2-separation)+'L'+this.w+','+(this.h2-separation)+
            'M0,'+(this.h2+separation)+'L'+this.w+','+(this.h2+separation);
        this.scale.push(
            this.paper.path(path)
                .attr({'stroke-width': 1, 'stroke': this.scale_color}));

        this._set_scale();
    },
    _set_scale: function(len) {
        len = len || this.options.seq_length;
        
        var eng = Math.floor(Math.LOG10E * Math.log(len) / 3);
        if(eng < 1) {
            eng = 1;
        }

        this._scale_bp = Math.pow(10, (3 * eng) - 1);
        this._scale_px = this.w * (this._scale_bp / len);

        var t = [this.h2 - small_tick, this.h2 + small_tick];

        var path = '',
            x,
            _x = 0;

        for(x = 0; x <= this.w / this._scale_px; x += 1){
            if(x%10 === 0) {
                continue;
            } 
            _x = x * this._scale_px;
            path += 'M'+_x+','+t[0]+'L'+_x+','+t[1];
        }
        this.scale.push(
            this.paper.path(path)
                .attr({'stroke-width': 1, 'stroke': this.scale_color}));


        var size = 1.6*separation,
            y = this.h2; //big[1] + 0.5 * size + 1;
        this.scale.push(this.paper.text(0, y, '0bp')
                        .attr({
                            'text-anchor': 'start',
                            'font-size': size
                       }));
        var name = names[eng];
        for(x = 10; x <= this.w / this._scale_px; x += 10){
            _x = x * this._scale_px;
            this.scale.push(
                this.paper.text(_x, y, (x/10) + name)
                    .attr({'font-size': size}));
        }

    },
    _loc_from_ev: function(ev){
        var loc = $(this.paper).offset(),
            ret;
        ret.x = ev.pageX - loc.left;
        ret.y = ev.pageY - loc.top;
        ret.dir = (ret.x > this.h2) ? 'rev' : 'fwd';
        var elev = ret.dir === 'fwd' ? 
            this.h2 - separation - ret.y :
            ret.y - (this.h2 + separation);
        ret.type = this.types[this.types.length-1];
        for(var i = 1; i < this.types.length; i++){
            if(elev < this.stack[ret.dir][this.types[i]]){
                ret.type = this.types[i];
                break;
            }
        }
        ret.pos = Math.round(this.options.seq_length * ret.y / this.w);
        return ret;
    }
});

}(jQuery));
