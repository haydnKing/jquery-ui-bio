/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global next_color:false,bio:false,Raphael:false */
(function($, undefined) {

var baseC = 'bio-sequence ui-widget';

var sep = 10,
    tick = 3,
    tick_text = 6,
    base_width = 5,
    marker_height = 10;

$.widget("bio.sequence", $.ui.mouse, { 
    options: {
        tile_length: 1024,
        tick_color: null,
        featureStore: null
    },
    _create: function(){
        this.el = $(this.element[0])
            .addClass(baseC);
        var o = this.options;

        o.tick_color = o.tick_color || this.el.css('color');
        o.back_color = o.back_color || this.el.css('background-color');

        this._calc_sizes();
        this._init_position();
        this._make_paper();
        this._init_markers();
        this._trigger('completed');

        this._mouseInit();
    },
    _init: function(){
    },
    _destroy: function(){
        this._mouseDestroy();
    },
    _calc_sizes: function(){
        var o = this.options;
        //measure
        this.h = this.el.height();
        this.h2 = this.h / 2;
        this.w = this.el.width();
        this.w2 = this.w / 2;
    },
    _init_position: function(){
        this.pos = 0;
        this.offset = 0;
        this.bw = Math.floor(this.w / base_width);
    },
    _make_paper: function(tile_num){
        var o = this.options,
            d = $('<div>')
                .height(this.h)
                .width(this.w);
        this.paper = Raphael(d.get(0), this.w, this.h); 
        this.el.append(d);

        this.paper.rect(-1, this.h2-sep, this.w+2, 2*sep)
            .attr({
                stroke: o.tick_color,
                fill: o.back_color
            })
            .toFront();
    },
    _redraw: function() {
        this._update_markers();
    },
    _update_markers: function(){
        var pos = 10 * Math.ceil(this.pos/10),
            off = (pos - this.pos) * base_width,
            i = 0,
            step = 10 * base_width;

        this.markers.attr({x: off});
        this.markertext.forEach(function(e){
            e.attr({x: off+i*step, text: 10*i+pos});
            i += 1;
        });
    },
    _init_markers: function(){
        var i,x,y,path,
            o = this.options;

        this.markertext = this.paper.set();

        y = [this.h2-sep-tick, this.h2+sep+tick];
        path = '';
        for(i = 10 * Math.ceil(this.pos/10); i < this.pos+this.bw; i+=10){
            x = (0.5+i-this.pos) * base_width;
            path = path + 'M'+x+','+y[0]+'L'+x+','+y[1];
            this.markertext.push(
                this.paper.text(x, y[1]+tick_text+1, String(i))
                    .attr({
                        color: o.tick_color,
                        'font-height': tick_text
                    }));
        }
        this.markers = this.paper.path(path)
                .attr({
                    stroke: o.tick_color
                })
                .toBack();
    },
    _mouseStart: function(ev){
        this.mouse = {x: ev.pageX, y: ev.pageY};
        console.log('mouseStart');
    },
    _mouseStop: function(ev){
        console.log('mouseStop');
    },
    _mouseDrag: function(ev){
        var _mouse = {x: ev.pageX, y: ev.pageY},
            fs = this.options.featureStore,
            dx = _mouse.x - this.mouse.x,
            dy = _mouse.y - this.mouse.y,
            pos = this.pos * base_width + this.offset - dx;

        this.pos = Math.floor(pos / base_width);
        this.offset = pos - this.pos * base_width;
        if(this.pos > fs.seq_length - this.bw){
            this.pos = fs.seq_length - this.bw;
            this.offset = 0;
        }
        else if(this.pos < 0){
            this.pos = 0;
            this.offset = 0;
        }

        this.mouse = _mouse;
        this._redraw();

        console.log('mouseDrag('+this.pos+'bp + '+this.offset+'px)');
    }
});

}(jQuery));

