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

var sep = 12,
    tick = 3,
    tick_text = 6,
    base_width = 10,
    marker_height = 10,
    feat_offset = sep+marker_height;

/*
 * Override createjs.DisplayObject with axis
 */

var Axis = function(sequence, color){
    this.initialize(sequence, color);
};
var p = Axis.prototype = new createjs.DisplayObject();

p.color = 'rgb(50,50,50)';

p._DisplayObject_initialize = p.initialize;

p.initialize = function(sequence, color){
    this._DisplayObject_initialize();
    this.seq = sequence;
    this.color = this.color || color;
    this.first = 0;
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
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.0;

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

    ctx.strokeStyle = s;
    return true;
};

var Features = function(sequence){
    this.initialize(sequence);
};
p = Features.prototype = new createjs.DisplayObject();

p.track_height = 0;
p.type_offsets = null;

p._DO_init = p.initialize;
p.initialize = function(seq){
    this._DO_init();
    this.seq = seq;
    this.fs = seq.options.featureStore;
    this.cs = seq.options.colorScheme;

    this.type_offsets = {'fwd': {}, 'rev': {}};
    
    var i,fwd=0,rev=0,h,
        t = this.fs.getTypes(),
        s = this.fs.getStackHeight();

    for(i in t){
        this.type_offsets.fwd[t[i]] = fwd;
        fwd += s.fwd[t[i]];
        this.type_offsets.rev[t[i]] = rev;
        rev += s.rev[t[i]];
    }

    this.track_height = (this.seq.h2-feat_offset) / Math.max(rev,fwd,5);
};

p.draw = function(ctx){
    var feats,
        start = this.seq.pos,
        end = this.seq.pos + this.seq.bw,
        type, t,
        feat, f,
        y, o;

    //get the features to draw
    feats = this.fs.getFeaturesByTile(this.fs.pos2tile(start),
                                      this.fs.pos2tile(end));

    ctx.lineWidth = 0.8 * this.track_height;

    for(type in feats){
        ctx.strokeStyle = this.cs[type];
        t = feats[type];
    
        for(f in t){
            feat = t[f];
            y = (feat.strand() >= 0) ?
                this.seq.h2 - (feat_offset + 
                               (this.type_offsets.fwd[type] +0.5+feat.track) *
                                this.track_height) :
                this.seq.h2 + (feat_offset + 
                               (this.type_offsets.rev[type] +0.5+feat.track) *
                                this.track_height);

            ctx.beginPath();
            ctx.moveTo(base_width * (feat.location.start - start), y);
            ctx.lineTo(base_width * (feat.location.end - start), y);
            ctx.stroke();
        }
    }
};

var Sequence = function(sequence, seqCache){
    this.initialize(sequence, seqCache);
};
p = Sequence.prototype = new createjs.DisplayObject();

p._DO_init = p.initialize;
p.initialize = function(seq, seqCache){
    this._DO_init();
    this.seq = seq;
    this.sc = seqCache;

    this.textC = "#000000";
    this.colors = {
        a: "#6258FF",
        t: "#FFD13D",
        g: "#57FF3D",
        c: "#FF3D4B"
    };

    this.bases = {
        a: this._draw_base('A'),
        t: this._draw_base('T'),
        g: this._draw_base('G'),
        c: this._draw_base('C')
    };

    this.tile = document.createElement('canvas');
    this.tile.width = base_width * Math.ceil(3 * this.seq.bw);
    this.tile.height = 2*sep;

    this._update_tile();
};

p._draw_base = function(b){
    var cv = document.createElement('canvas');
    cv.width = base_width;
    cv.height = 2*sep;
    var c = cv.getContext('2d'),
        col = this.colors,
        p = 2;

    switch(b.toLowerCase()){
        case 'a':
            this._draw_arrow(c,p,col.a,col.t);
            this._draw_base_text(c,'A','T');
            break;
        case 't':
            this._draw_arrow(c,-p,col.t,col.a);
            this._draw_base_text(c,'T','A');
            break;
        case 'g':
            this._draw_arrow(c,p,col.g,col.c);
            this._draw_base_text(c,'G','C');
            break;
        case 'c':
            this._draw_arrow(c,-p,col.c,col.g);
            this._draw_base_text(c,'C','G');
            break;
    }
    return cv;
};

p._draw_base_text = function(ctx, a,b){
    ctx.fillStyle = this.textC;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'normal ' + (sep-3) + 
                        'px "Helvetica Neue",Helvetica,Arial,sans-serif';

    ctx.fillText(a, 0.5*base_width, 1);
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(b, 0.5*base_width, 2*sep - 1);
};

p._draw_arrow = function(c, d, c1, c2){
    c.fillStyle = c1;
    c.beginPath();
    c.moveTo(0,0);
    c.lineTo(0,sep-d);
    c.lineTo(0.5*base_width, sep+d);
    c.lineTo(base_width, sep-d);
    c.lineTo(base_width, 0);
    c.fill();

    c.beginPath();
    c.fillStyle = c2;
    c.moveTo(0,2*sep);
    c.lineTo(0,sep-d);
    c.lineTo(0.5*base_width, sep+d);
    c.lineTo(base_width, sep-d);
    c.lineTo(base_width, 2*sep);
    c.fill();
};

p._update_tile = function(){
    var self = this,
        ctx = this.tile.getContext('2d'),
        from = Math.floor(Math.max(0, this.seq.pos - this.seq.bw)),
        to = Math.ceil(from + 3*this.seq.bw),
        seq = this.sc.get(Math.floor(from), Math.ceil(to)+1, function(){
            self._update_tile();
            self.getStage().update();
        }),
        i, j, snip, char;

    this.tile_start = from;
    this.tile_end = to;
    ctx.clearRect(0,0,this.tile.width, this.tile.height);

    for(i = 0; i < seq.length; i+=1){
        snip = seq[i];
        for(j = 0; j < snip.seq.length; j+=1){
            char = snip.seq[j];
            ctx.drawImage(this.bases[char], 
                          (snip.from + j - from) * base_width,0);
        }
    }
};

p.draw = function(ctx){
    if((this.seq.pos < this.tile_start) || 
        (this.seq.pos + this.seq.bw > this.tile_end)){
        this._update_tile();
    }
   ctx.drawImage(this.tile,  
                    Math.round(base_width * (this.seq.pos - this.tile_start)),
                                        //in float sx,
                    0,                  //in float sy,
                    this.seq.w,         //in float sw,
                    2*sep,              //in float sh,
                    0,                  //in float dx, 
                    this.seq.h2-sep,    //in float dy,
                    this.seq.w,         //in float dw,
                    2*sep               //in float dh
                );
};

//Monkey patch a createjs.stage so as not to respond to mousemove events
//and thus save a load of CPU

var _patch_stage = function(stage){
    stage.__handleMouseMove = stage._handleMouseMove;
    stage._handleMouseMove = function() {};
    return stage;
};

$.widget("bio.kineticScroll", $.ui.mouse, {
    options: {
        slow: 0.9,
        stop: 0.1,
        fps: 25,
        scroll: function(ev, data){}
    },
    _create: function(){
        var self = this;
        this.last_pos = {x: 0, y: 0};
        this.vel = {dx: 0, dy: 0};
        this._mouseInit();
        this.timer = null;
        $(this.element[0]).bind('mousedown', function(ev){
            self.vel.dx = self.vel.dy = 0;
            if(self.timer){
                clearTimeout(self.timer);
                self.timer = null;
            }
        });
    },
    _mouseDrag: function(ev){
        var dx = ev.pageX - this.last_pos.x,
            dy = ev.pageY - this.last_pos.y,
            dt = ev.timeStamp - this.last_pos.time;

        this._scroll(dx, dy);

        this.vel.dy = 0.5 * (this.vel.dy + 1000*dy/dt);
        this.vel.dx = 0.5 * (this.vel.dx + 1000*dx/dt);

        this._update(ev);
    },
    _step: function(){
        var o = this.options,
            self = this,
            dt = 1 / o.fps;

        this.vel.dx = o.slow * this.vel.dx;
        this.vel.dy = o.slow * this.vel.dy;

        if((this.vel.dx*this.vel.dx+this.vel.dy*this.vel.dy) < o.stop*o.stop){
            this.vel.dx = this.vel.dy = 0;
            return;
        }

        this._scroll(dt * this.vel.dx, dt * this.vel.dy);

        this.timer = setTimeout(function() {self._step();}, 1000*dt);
    },
    _mouseStart: function(ev){
        this._update(ev);
    },
    _mouseStop: function(ev){
        var self = this;
        this.timer = setTimeout(function() {self._step();}, 
                                1000/this.options.fps);
    },
    _scroll: function(dx,dy){},
    cancelScroll: function(){
        this.vel.dx = this.vel.dy = 0;
    },
    _update: function(ev){
        this.last_pos.x = ev.pageX;
        this.last_pos.y = ev.pageY;
        this.last_pos.time = ev.timeStamp;
    }

});

$.widget("bio.sequence", $.bio.kineticScroll, { 
    options: {
        tile_length: 1024,
        tick_color: null,
        featureStore: null,
        sequence: null,
        text: {
            noCanvas: "Sorry, your browser does not support HTML5 canvas.\n"+
                "Please upgrade your browser to use this widget"
        }
    },
    _create: function(){
        this._super();
        this.el = $(this.element[0])
            .addClass(baseC);
        var o = this.options;

        o.tick_color = o.tick_color || this.el.css('color');
        o.back_color = o.back_color || this.el.css('background-color');

        this._create_canvas();
        this._create_labels();

        this._trigger('completed');

        //this._mouseInit();
        this.moveTo(0);
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


        var first = parseInt(this.labels.children(':first-child'), 10),
            start = 50 * Math.ceil(this.pos / 50);
        if(start !== first){
            var i = start;
            this.labels.children().each(function(){
                $(this).text(i);
                i += 50;
            });
        }
        this.labels.css('left', (start - this.pos - 25)*base_width);

        this._trigger('moved', null, {start: this.pos, width: this.bw});
    },
    center: function(pos){
        this.moveTo(pos - this.bw / 2);
        this.cancelScroll();
    },
    _bind_events: function(){
        var self = this;
        this.el.click(function(ev){

        });
    },
    _ev_to_pos: function(ev){
        var o = this.el.offset(),
            p = {
                    'left': ev.pageX - o.left,
                    'top': ev.pageY - o.top,
                    'loc': this.pos + (ev.pageX-o.left)*this.bw/this.w,
                    'feature': null
            };


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
    _create_canvas: function(){
        this.canvas = $('<canvas>')
            .append($('<div>')
                .append($('<p>').text(this.options.text.noCanvas)))
            .appendTo(this.el);
        this.stage = _patch_stage(new createjs.Stage(this.canvas.get(0)));
        this.stage.enableMouseOver(0);

        this.pos = 0;
        
        this._calc_sizes();

        this.stage.addChild(new Axis(this));
        this.stage.addChild(new Features(this));
        this.stage.addChild(new Sequence(this, 
                                new bio.SequenceCache(this.options.sequence)));
    },
    _create_labels: function() {
        if(this.labels != null){
            this.labels.remove();
        }
        this.labels = $('<div>').addClass(labelC);
        var num = Math.ceil(this.w / (50 * base_width)),
            gap = 50 * base_width,
            i;
        for(i = 0; i < num; i+=1){
            $('<div>')
                .text(50*i)
                .css('width', gap+'px')
                .appendTo(this.labels);
        }

        this.labels
            .css({
                'top': this.h2 + sep + tick + 1
            })
            .appendTo(this.el);
    },
    _scroll: function(dx,dy){
        this.moveTo(this.pos - dx / base_width);
    }
});

}(jQuery));

