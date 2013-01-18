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
        featureStore: null,
        text: {
            noCanvas: "Sorry, your browser does not support HTML5 canvas.\n"+
                "Please upgrade your browser to use this widget"
        }
    },
    _create: function(){
        this.el = $(this.element[0])
            .addClass(baseC);
        var o = this.options;

        o.tick_color = o.tick_color || this.el.css('color');
        o.back_color = o.back_color || this.el.css('background-color');

        this._init_position();
        this._create_canvas();
        this._calc_sizes();

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

        this.canvas.width(this.w);
        this.canvas.height(this.h);
    },
    _init_position: function(){
        this.pos = 0;
        this.offset = 0;
        this.bw = Math.floor(this.w / base_width);
    },
    _create_canvas: function(){
        this.canvas = $('<canvas>')
            .append($('<div>')
                .append($('<p>').text(this.options.text.noCanvas)))
            .appendTo(this.el);
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

