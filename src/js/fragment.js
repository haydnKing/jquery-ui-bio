/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global next_color:false Raphael:false */
(function($, undefined) {

var baseClasses = 'bio-fragment ui-widget',
    hoverClasses = 'ui-state-hover ui-state-active',
    disabledClasses = 'ui-state-disabled',
    infoClasses = 'ui-corner-all';

var tail_len = 10;

var makeLinearFrag = function(w, h, right) {
    if(right == null){
        right = true;
    }
    var h2 = h / 2;
    var wa = w - h2;
    var t = (right) ? h2 : -h2;
    var x0= (right) ? 0  :  h2;
    var s = 'M'+x0+',0 h'+wa+' l'+h2+','+h2+' l'+(-h2)+','+h2+
            ' h'+(-wa)+' l'+h2+','+(-h2)+' z';
    return s;
};

$.widget("bio.fragment", $.ui.draggable, {
    options: {
        name: null,
        desc: null,
        length: null,
        url: undefined,
        color: undefined,
        text: {
            goto_page: 'Goto Page',
            def_desc: 'No Description',
            def_name: 'Unnamed Fragment'
        },
        helper: 'clone'
    },
    _create: function() {
        var o = this.options,
            self = this;

        var el = this.el = $(this.element[0])
            .addClass(baseClasses);

        o.name = el.attr('name') || o.name || o.text.def_name;
        o.desc = el.attr('desc') || o.desc || o.text.def_desc;
        o.length = el.attr('length') || o.length || 0;
        o.url = el.attr('href') || o.url;
        o.color = o.color || next_color();

        this.info = $("<div>")
            .hide()
            .addClass(infoClasses)
            .appendTo(el)
            .mousedown(function(ev){
                //stop the fragment from being dragged
                ev.stopPropagation();
            });
        this.refreshInfo();            
        
        el.css({
            'border-color': o.color
        });

        if(o.helper === 'clone'){
            o.helper = function(){
                return $('<div>').addClass(baseClasses)
                    .append(el.children('svg').clone());
            };
        }

        el.draggable(o).on('dragstart', function(){
            self.info.tooltip('disable');
        }).on('dragstop', function(){
            self.info.tooltip('enable');
        });
        this.info.tooltip({
            'mouseTarget': this.el,
            openDelay: 500
        });

        this._add_svg(el);
    },
    _init: function() {
    },
    option: function(name, value)
    {
        var o = this.options;

        if(value == null) {
            return o[name] || this.$el.draggable(name);
        }
        o[name] = value;
        switch(name)
        {
            case 'name':
                this.name.attr('name', value);
                break;
            case 'desc':
            case 'length':
            case 'url':
                this.refreshInfo();
                break;
            case 'color':
                this.el.css({
                    'background-color':this.options.color,
                    'border-color':this.options.color
                });
                break;
            case 'draggable':
                this.el.draggable( (value) ? 'enable' : 'disable');
                break;
            default:
                this.el.draggable(name, value);
        }
        return this;
    },
    refreshInfo: function()
    {
        var o = this.options;
        this.info.html('');
        $('<div><p class="bio-length">'+ o.length + '</p></div>')
            .appendTo(this.info);
        $('<div><p class="bio-desc">'+ o.desc + '</p></div>')
            .appendTo(this.info);
        if(o.url != null){
            $('<div><a href=' + o.url + ' class="bio-url">'+o.text.goto_page+'</a></div>').
                appendTo(this.info);
        }
    },
    _add_svg: function(el)
    {
        var w = el.width(),
            h = el.height(),
            hsl= this.options.color.match(/\d+/g),
            paper = Raphael(this.element[0], w, h),
            frag = paper.path(makeLinearFrag(w,h)).attr({
                fill: Raphael.hsl(hsl[0], hsl[1], hsl[2]),
                stroke: Raphael.hsl(hsl[0], hsl[1], Math.max(0, hsl[2]-10))
            });
        this.name = paper.text(w/2, h/2, this.options.name).attr({
                fill: 'white',
                font: 'inherit'
            });
        var w2 = (this.name.getBBox().width + h);
        if(w2 > w){
            frag.attr('path', makeLinearFrag(w2,h));
            this.name.transform('t'+0.5*(w2-w)+',0');
            this.el.width(w2);
            paper.setSize(w2, h);
        }
    }
}); 

}(jQuery));
