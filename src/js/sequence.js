/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global next_color:false,bio:false,createjs:false */
(function($, undefined) {

var baseC = 'bio-sequence ui-widget',
    labelC = 'label';

var sep = 10,
    tick = 3,
    tick_text = 6,
    base_width = 5,
    marker_height = 10;

/*
 * Override createjs.DisplayObject with axis
 */

var Axis = function(sequence, color){
    console.log('call Axis.initialize');
    this.initialize(sequence, color);
};
var p = Axis.prototype = new createjs.DisplayObject();

p.color = 'rgb(50,50,50)';

p._DisplayObject_initialize = p.initialize;

p.initialize = function(sequence, color){
    console.log('Call DisplayObject.initialize()');
    this._DisplayObject_initialize();
    console.log('Returned from DisplayObject.initialize()');
    this.seq = sequence;
    this.color = this.color || color;
};

p._DisplayObject_draw = p.draw;
//override the draw function
p.draw = function(ctx, ignoreCache){
    //if(this._DisplayObject_draw(ctx, ignoreCache)) {return true;}
    
    var p = this.seq.pos,
        h2 = this.seq.h2,
        w = this.seq.w,
        step = 10,
        step_p = step * base_width,
        start = step * Math.ceil(p / step),
        start_p = (start - p) * base_width,
        y = [h2 - sep - tick, h2 - sep, h2 + sep, h2 + sep + tick],
        x, i;

    var s = ctx.strokeStyle;
    ctx.strokeStype = this.color;
    ctx.textAlign = 'center';
    ctx.font = tick_text + "px sans-serif";

    ctx.beginPath();
    ctx.moveTo(0,y[1]);
    ctx.lineTo(w,y[1]);
    ctx.moveTo(0,y[2]);
    ctx.lineTo(w,y[2]);
    ctx.stroke();

    for(x = start_p; x < w; x += step_p){
        ctx.beginPath();
        ctx.moveTo(x,y[0]);
        ctx.lineTo(x,y[1]);
        ctx.moveTo(x,y[2]);
        ctx.lineTo(x,y[3]);
        ctx.stroke();
    }

    this.seq.labels.css('left', start_p - step_p / 2);

    if(start !== parseInt(this.seq.labels.children(':first-child').text(), 10)){
        i = start;
        this.seq.labels.children().each(function(){
            $(this).text(i);
            i += step;
        });
    }

    ctx.strokeStyle = s;
    return true;
};

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
        this._create_labels();

        this._trigger('completed');

        this._mouseInit();
        this.stage.update();
    },
    _init: function(){
    },
    _destroy: function(){
        this._mouseDestroy();
    },
    moveTo: function(pos){
        this.pos = Math.max(0, Math.min(pos, 
                        this.options.featureStore.seq_length - this.bw));
        this.stage.update();
    },
    _calc_sizes: function(){
        var o = this.options;
        //measure
        this.h = this.el.height();
        this.h2 = this.h / 2;
        this.w = this.el.width();
        this.w2 = this.w / 2;
        this.bw = Math.floor(this.w / base_width);

        this.canvas.width(this.w);
        this.canvas.height(this.h);
        this.canvas.attr({width: this.w, height: this.h});
    },
    _init_position: function(){
        this.pos = 0;
    },
    _create_canvas: function(){
        this.canvas = $('<canvas>')
            .append($('<div>')
                .append($('<p>').text(this.options.text.noCanvas)))
            .appendTo(this.el);
        this.stage = new createjs.Stage(this.canvas.get(0));
        
        var a = new Axis(this);
        this.stage.addChild(a);
    },
    _create_labels: function() {
        if(this.labels != null){
            this.labels.remove();
        }
        this.labels = $('<div>').addClass(labelC);
        var num = Math.ceil(this.w / (10 * base_width)),
            gap = 10 * base_width,
            i;
        for(i = 0; i < num; i+=1){
            $('<div>')
                .text(10*i)
                .css('width', gap+'px')
                .appendTo(this.labels);
        }

        this.labels
            .css({
                'top': this.h2 + sep + tick + 1,
                'left': -gap / 2
            })
            .appendTo(this.el);
    },
    _mouseStart: function(ev){
        this.mouse = {x: ev.pageX, y: ev.pageY};
    },
    _mouseStop: function(ev){
    },
    _mouseDrag: function(ev){
        var _mouse = {x: ev.pageX, y: ev.pageY},
            fs = this.options.featureStore,
            dx = _mouse.x - this.mouse.x,
            dy = _mouse.y - this.mouse.y;

        this.moveTo(this.pos - dx / base_width);
        this.mouse = _mouse;
    }
});

}(jQuery));

