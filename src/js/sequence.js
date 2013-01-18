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

$.widget("bio.sequence", $.bio.panel, {
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
        this.el.append(this._make_tile(0));
        this._trigger('completed');
    },
    _init: function(){
    },
    _calc_sizes: function(){
        var o = this.options;
        //measure
        this.h = this.el.height();
        this.h2 = this.h / 2;
        this.w = base_width * o.tile_length;
    },
    _make_tile: function(tile_num){
        var o = this.options,
            self = this,
            from = tile_num * o.tile_length,
            to = from + o.tile_length,
            d = $('<div>')
                .height(this.h)
                .width(this.w);
        Raphael(d.get(0), this.w, this.h, function(){
            
            var tile = this,
                i,x,y,path;

            y = [self.h2-sep-tick, self.h2+sep+tick];
            path = '';
            for(i = 10 * Math.ceil(from/10); i < to; i+=10){
                x = (0.5+i-from) * base_width;
                path = path + 'M'+x+','+y[0]+'L'+x+','+y[1];
                var text = tile.text(x, y[1], String(i))
                    .attr({
                        color: o.tick_color,
                        'font-height': tick_text
                    });
                $('tspan:first-child', text.node).attr('dy', tick_text+1);
            }
            tile.path(path)
                .attr({
                    stroke: o.tick_color
                });

            tile.rect(-1, self.h2-sep, self.w+2, 2*sep)
                .attr({
                    stroke: o.tick_color,
                    fill: o.back_color
                });

            tile.path('M-5,'+self.h2+'L'+(self.w+5)+','+self.h2);

        });

        return d;

    }
});

}(jQuery));

