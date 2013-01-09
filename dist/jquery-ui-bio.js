/*! jQuery Ui Bio - v0.1.0 - 2013-01-09
* https://github.com/Gibthon/jquery-ui-bio
* Copyright (c) 2013 Haydn King; Licensed MIT, GPL */

/*global bio:false */

this.bio = this.bio || {};

(function() {

    /**#######################################################################
     * FeatureLocation
     * #######################################################################
     */
    var FeatureLocation = function(start, end, strand)
    {
        this.init(start, end, strand);
    };
    var fl = FeatureLocation.prototype;

    fl.init = function(s,e,st)
    {
        this.start = s || 0;
        this.end = e || 0;
        this.strand = ((st || 1) > 0) ? 1 : -1;
        if(this.end < this.start)
        {
            var t = this.end;
            this.end = this.start;
            this.start = t;
        }
    };

    fl.overlaps = function(rhs)
    {
        if(!Array.isArray(rhs))
        {
            rhs = [rhs];
        }
        for(var i = 0; i < rhs.length; i++)
        {
            if( this.contains(rhs[i].start) ||
                this.contains(rhs[i].end) ||
                rhs[i].contains(this.start) )
            {
                return true;
            }
        }
        return false;
    };

    fl.contains = function(pos)
    {
        return (this.start <= pos) && (this.end > pos);
    };

    fl.length = function()
    {
        return this.end - this.start;
    };


    bio.FeatureLocation = FeatureLocation;
     

    /*########################################################################
     * SeqFeature: Represent a sequence feature
     * #######################################################################
     */
    var SeqFeature = function(location, type, id, qualifiers)
    {
        this.init(location, type, id, qualifiers);
    };
    var sf = SeqFeature.prototype;

    //Default values

    sf.location = null;
    sf.type = "NoneType";
    sf.id = -1;
    sf.qualifiers = {};

    /*
     * public functions
     */

    //Accessors
    sf.strand = function(){
        return this.location.strand;
    };
    
    sf.length = function()
    {
        return this.location.length();
    };

    //Functions
    sf.overlaps = function(rhs)
    {
        if(!Array.isArray(rhs))
        {
            rhs = [rhs];
        }
        for(var i = 0; i < rhs.length; i++)
        {
            if(this.location.overlaps(rhs[i].location))
            {
                return true;
            }
        }
        return false;
    };

    sf.toString = function(){
        return "[seqFeature (id="+this.id+", type="+this.type+"]";
    };

    /*
     * Private functions
     */
    sf.init = function(l,t,i,q)
    {
        if(i == null)
        {
            i = -1;
        }
        this.location = l;
        this.type = t || "NoneType";
        this.id = i;
        this.qualifiers = q || {};
    };

   

    //Export to namespace
    bio.SeqFeature = SeqFeature;

    bio.loadFeatureLocation = function(json)
    {
        if(!Array.isArray(json))
        {
            json = [json];
        }
        var ret = [];
        for(var i = 0; i < json.length; i++)
        {
            ret.push(new FeatureLocation(json[i].start, 
                                         json[i].end, 
                                         json[i].strand));
        }
        return ret;
    };

    bio.loadSeqFeature = function(json)
    {
        if(!Array.isArray(json))
        {
            json = [json];
        }
        var ret = [];
        for(var i = 0; i < json.length; i++)
        {
            ret.push(new SeqFeature(bio.loadFeatureLocation(
                                                        json[i].location)[0],
                                    json[i].type, 
                                    json[i].id, 
                                    json[i].qualifiers));
        }
        return ret;
    };

    /* #######################################################################
     * FeatureStore
     * #######################################################################
     *  Store all the features belonging to a fragment in a quick-to-access
     *  mannar. Can return all features at a position / in a range.
     */
    /*
     * Args:
     *      features: an Array of SeqFeatures
     *      tile_size: size of tiles to use internally, optional
     */

    var FeatureStore = function(features, length, tile_size)
    {
        this.init(features, length, tile_size);
    };
    var fs = FeatureStore.prototype;

    //Default values

    /*
     * features: flat Array of all features
     */
    fs.features = [];
    /*
     * tile_size: size (in bp) of internal tiles
     */
    fs.tile_size = 1024;
    /*
     * length: end of all the features
     */
    fs.length = 0;
    /*
     * types: array of all different feature types
     */
    fs.types = [];
    /*
     * by_type: dictionary object where keys are types and values are Arrays of
     * that type
     */
    fs.by_type = {};
    /*
     * stacks: the maximum stacking height for each type in each direction
     */
    fs.stacks = {};
    /*
     * tiles: an array of dictionary objects, keys are types, values are arrays
     * of features
     */
    fs.tiles = [];

    /*
     * Public Functions ------------------------------------------------------
     */

    //getters & setters
    fs.getTypes = function()
    {
        return this.types;
    };
    fs.getFeatures = function()
    {
        return this.features;
    };
    fs.getFeaturesByType = function(type)
    {
        return this.by_type[type.toLowerCase()];
    };
    fs.getFeaturesByTile = function(tile)
    {
        return this.tiles[tile];
    };
    fs.pos2tile = function(pos)
    {
        return Math.floor(pos/this.tile_size);
    };
    fs.tile2pos = function(i)
    {
        return [this.tile_size * i, this.tile_size * (i+1)];
    };


    /*
     * Private Functions -----------------------------------------------------
     */

    fs.init = function(f,l,s)
    {
        this.features = f || [];
        if(s != null)
        {
            this.tile_size = parseInt(s,10);
        }
        this.length = l;

        this._calc_types();
        this._calc_tracks();
        this._calc_tiles();
    };

    fs._calc_types = function()
    {
        var i,f,t;
        this.by_type = {};
        this.types = [];
        for(i = 0; i < this.features.length; i++)
        {
            f = this.features[i];
            t = f.type.toLowerCase();
            if(!this.by_type.hasOwnProperty(t))
            {
                this.by_type[t] = [];
                this.types.push(t);
            }
            this.by_type[t].push(f);
        }
    };

    fs._calc_tracks = function()
    {
        var type, feats, fwd, rev;
        this.stacks = {'fwd':{}, 'rev':{}};
        for(type=0; type < this.types.length; type++)
        {
            feats = this.getFeaturesByType(this.types[type]);
            fwd = [];
            rev = [];

            //split feats into fwd and reverse features
            for(var f = 0; f < feats.length; f++)
            {
                if(feats[f].strand() >= 0)
                {
                    fwd.push(feats[f]);
                }
                else
                {
                    rev.push(feats[f]);
                }
            }
            
            //set the tracks for each
            this.stacks.fwd[this.types[type]] = this._set_tracks(fwd);
            this.stacks.rev[this.types[type]] = this._set_tracks(rev);
        }
    };

    fs._set_tracks = function(features)
    {
        //do nothing if features are empty
        if(features.length === 0)
        {
            return 0;
        }

        var track = 0, i, f, stack=[[]], ok;

        //sort so biggest are first
        features.sort(function(a,b){
            return b.length() - a.length();
        });

        for(i = 0; i < features.length; i++)
        {
            f = features[i];
            ok = false;
            for(track = 0; track < stack.length; track++)
            {
                if(!f.overlaps(stack[track]))
                {
                    ok = true;
                    break;
                }
            }
            if(ok)
            {
                stack[track].push(f);
                f.track = track;
            }
            else
            {
                f.track = stack.length;
                stack.push([f]);
            }
        }
        
        return stack.length;    
    };

    fs._calc_tiles = function()
    {
        var f,i,j,t,first,last;

        //make enough blank tiles
        this.tiles = [];
        for(i = 0; i < this.length / this.tile_size; i++)
        {
            t = {};
            for(j = 0; j < this.types.length; j++)
            {
                t[this.types[j]] = [];
            }
            this.tiles.push(t);
        }

        for(i = 0; i < this.features.length; i++)
        {
            f = this.features[i];
           
            //find the positions of the first and last tiles for the feature
            first = this.pos2tile(f.location.start);
            last = this.pos2tile(f.location.end-1);

            //add the feature to each tile in [first, last]
            for(t = first; t <= last; t++)
            {
                this.tiles[t][f.type].push(f);
            }
        }
    };

    //Export to namespace
    bio.FeatureStore = FeatureStore;

}());

(function($, undefined) {

    var outerC  = "tooltip ui-widget ui-widget-content ui-corner-all",
        leftC   = "tooltip-left",
        rightC  = "tooltip-right",
        topC    = "tooltip-top",
        bottomC = "tooltip-bottom",
        innerC  = "ui-widget-content",
        textC   = "stringContent",
        attr    = "tip",
        close_wait = 150,
        def_border = "black";

$.widget("bio.tooltip", {
    options: {
        hover: 250, //Delay to wait after the mouse hovers. 0 = don't open
        click: false, //Whether to open on-click
        holdOpen: true, //whether to hold open when the mouse enters the tip
        autoClose: true, //whether to close automatically when the mouse leaves
        /* content: widget tests for these things in order and accepts the
         * first one it finds
         *  - 'tip' property on DOM element
         *  - content option
         *      + function(event): returns jquery object
         *      + string text
         *      + array of items for a drop-down select. Item props
         *          - title: the title
         *          - [sub]: optional subtitle
         *          - [iconClass]: optional css class to apply to the icon
         *              e.g. ui-icon-close etc.
         *          - [iconCSS]: optional map of CSS attributes to apply to the
         *              icon        
         *      + jquery object
         */
        content: null,
        /* title: optional title for the tooltip, shown in bold at the top
         *  function(evt) | $-object | string
         */
        title: null,
        extraClasses: null, //any extra CSS classes for the tooltip
        width: 100, //integer in px, or string 'x%' of target element
        color: 'default', // border color: 
        //                 'default'|'parent'|'css string'|function
        location: 'center', //popup location: 'center'|'mouse'
        direction: 'auto', //'auto'|'n'|'s'|'e'|'w'|function
        fadeIn: 0, //length to animate appearence
        fadeOut: 100 //length to animate disappear
    },
    _create: function() {
        var el = this.el = $(this.element[0]);
        var o = this.options,
            self = this;

        this._tooltip = null;

        //the last mouse event
        this._evt = null;

        this._visible = false;
        this._enabled = true;
        this._timeout = null;
        this._hidefn = function(){
            self.hide();
        };
    },
    _init: function(){
        this._bind_events();
    },
    show: function() {
        if(!this._enabled || (this._trigger('beforeShow') === false)) {
            return;
        }
        if(this._visible){
            this.hide();
        }
        this._create_tip();
        this._set_content();
        this._set_size();
        this._set_location();
        this._set_color();

        var self = this;
        this._tooltip.fadeTo(this.options.fadeIn, 1.0, function(){
            self._trigger('show');
        });
        this._visible = true;
        //hide if there's another click anywhere
        $(document).one('click', function(){
            $(document).on('click', self._hidefn);
        });
    },
    hide: function() {
        $(document).off('click', this._hidefn);
        if(!this._visible || (this._trigger('beforeHide') === false)){
            return;
        }
        var self = this;
        var tt = self._tooltip;
        this._tooltip.fadeOut(this.options.fadeOut, function(){
            tt.remove();
            self._trigger('hide');
        });
        this._visible = false;
        self._tooltip = null;
    },
    enable: function() {
        this._enabled = true;
    },
    disable: function() {
        this._enabled = false;
        this.hide();
    },
    updateContent: function(c) {
        this._set_content(c, true);
    },
    _bind_events: function() {
        var self = this;
        this.el
            .mousemove(function(e) {self._mousemove(e);})
            .mouseleave(function(e) {self._mouseleave(e);})
            .mouseenter(function(e) {self._mouseenter(e);})
            .click(function(e) {self._mouseclick(e);});
    },
    _mousemove: function(evt) {
        if(!this._enabled) {return;}
        this._evt = evt;
        var self = this;
        if(!this._visible && this.options.hover > 0){
            this._clear_timeout();
            this._set_timeout(this.options.hover, function() {self.show();});
        }
    },
    _mouseleave: function(evt) {
        if(!this._enabled) {return;}
        this._evt = evt;
        var self = this;
        if(this.options.autoClose){
            this._set_timeout(close_wait, function() {self.hide();});
        }
    },
    _mouseenter: function(evt) {
        if(!this._enabled) {return;}
        this._evt = evt;
        this._clear_timeout();
    },
    _mouseclick: function(evt) {
        if(!this._enabled) {return;}
        this._evt = evt;
        if(this.options.click){
            this.show();
        }
    },
    _clear_timeout: function() {
        if(typeof(this._timeout) === 'number'){
            clearTimeout(this._timeout);
            this._timeout = null;
        }
    },
    _set_timeout: function(time, fn) {
        this._clear_timeout();
        this._timeout = setTimeout(function(){
            this._timout = null;
            fn();
        }, time);
    },
    _create_tip: function() {
        var self = this;
        this._tooltip = $('<div>')
            .addClass(outerC + ' ' + (this.options.extraClasses || ''))
            .fadeTo(0,0)
            .mouseenter(function(e) {self._mouseenter(e);})
            .mouseleave(function(e) {self._mouseleave(e);})
            .click(function(e) {e.stopPropagation();})//don't close
            .append($('<div>').addClass(innerC))
            .appendTo($('body'));
    },
    _set_content: function(c, anim) {
        c = c || this.options.content;
        anim = anim || false;
        var t, i, self = this;

        if($.isFunction(c)){
            c = c(this._evt);
        }

        if(this.el.attr(attr) != null){
            c = this._get_title()
                    .add($('<p>')
                        .text(this.el.attr(attr))
                        .addClass(textC));
        }
        else if(typeof(c) === "string"){
            c = this._get_title()
                    .add($('<p>')
                        .text(c)
                        .addClass(textC));
        }
        else if(Array.isArray(c)) {
            t = $();
            for(i = 0; i < c.length; i++) {
                t = t.add(this._make_item(c[i], i));
            } 
            c = this._get_title() 
                .add($('<div>').append(t));
        }
        else if(c instanceof $){
            c = this._get_title().add(c);
        }
        else {
            throw("No content specified");
        }
        if(!anim){
            //apply the content 
            this._tooltip.children('div')
                .empty()
                .append(c);
        }
        else {
            //fix the height
            this._tooltip.height(this._tooltip.height());
            //apply the content 
            this._tooltip.children('div')
                .empty()
                .append(c);
            //animate to new height
            this._tooltip.animate({
                height: this._tooltip.children('div').height()
            }, 'fast', function() {
                //unset the height
                self._tooltip.css('height', '');
                //set the size and location (may have been messed up by the
                //anim
                self._set_size();
                self._set_location();
            });
        }
    },
    _get_title: function() {
        var t = this.options.title;
        if($.isFunction(t)) {
            t = t(this._evt);
        }
        if(t == null || t === '') {
            return $();
        }
        else if(typeof(t) === 'string') {
            return $('<div>')
                    .addClass('tooltip-title')
                    .append($('<span>')
                        .text(t));
        }
        else {
            throw("Unknown title type");
        }
    },
    _set_size: function() {
        var w = this.options.width,
            width;
        //if the width is a string percentage, then we mean percentage of the
        //el, not of the body!
        if(typeof(w) === 'string') {
            if(/%$/.test(w)){
                var pc = parseFloat(w.match("([0-9.]+)%")[1]);
                w = this.el.width() * pc / 100.0;
            }
        }
        
        this._tooltip.width(w);
        //update the outer height
        //this._tooltip.height(this._tooltip.children('div').height());
    },
    _set_location: function() {
        var l = this.options.location,
            d = this.options.direction,
            pos, view, scroll, size, margins;
        if(l === 'center'){
            pos = this.el.offset();
            pos.left += this.el.width() / 2.0;
            pos.top += this.el.height() / 2.0;
        }
        else if(l === 'mouse'){
            pos = {top:this._evt.pageY, left: this._evt.pageX};
        }
        else {
            throw('Invalid location \''+ l + '\'');
        }

        
        if(d === 'auto'){
            view = {
                width: $(window).width(), 
                height: $(window).height()
            };
            scroll = {
                top: $(document).scrollTop(), 
                left: $(document).scrollLeft()
            };
            size = {
                width: this._tooltip.outerWidth(true), 
                height: this._tooltip.outerHeight(true)
            };
            margins = {
                top: pos.top - scroll.top,
                left: pos.left - scroll.left,
                bottom: scroll.top + view.height - pos.top,
                right: scroll.left + view.width - pos.left
            };

            //test for South
            if(      (margins.bottom >= size.height) &&
                     (margins.left >= size.width / 2.0) &&
                     (margins.right >= size.width / 2.0)) {
                d = 's';
            }
            //test for North
            else if( (margins.top >= size.height) &&
                     (margins.left >= size.width / 2.0) &&
                     (margins.right >= size.width / 2.0)) {
                d = 'n';
            }
            //test for East
            else if( (margins.right >= size.width) &&
                     (margins.top >= size.height / 2.0) &&
                     (margins.bottom >= size.height / 2.0)){
                d = 'e';
            }
            //test for West
            else if( (margins.left >= size.width) &&
                     (margins.top >= size.height / 2.0) &&
                     (margins.bottom >= size.height / 2.0)){
                d = 'w';
            }
            else {
                //either we're in a corner, or the viewport is too small
                //go towars the largest side
                if(margins.right >= margins.left) {
                    d = 'e';
                }
                else {
                    d = 'w';
                }
            }
        }

        if($.isFunction(d)){
            d = d(this._evt);
        }

        var t = this._tooltip;
        if(d === 'n'){
            t.addClass(topC);
            pos.left -= size.width / 2.0;
            pos.top -= size.height;
        }
        else if(d === 's'){
            t.addClass(bottomC);
            pos.left -= size.width / 2.0;
        }
        else if(d === 'e'){
            t.addClass(rightC);
            pos.top -= size.height / 2.0;
        }
        else if(d === 'w'){
            t.addClass(leftC);
            pos.left -= size.width;
            pos.top -= size.height / 2.0;
        }
        else {
            throw('Unknown direction \''+d+'\'');
        }
        t.css(pos);
    },
    _set_color: function() {
        var c = this.options.color;
        if($.isFunction(c)){
            c = c(this._evt);
        }
        if(c === "default"){
            //if the border color has been set
            if(this.el.css('border-color').length > 0){
                //don't override it
                return;
            }
            c = def_border;
        }
        else if(c === "parent"){
            c = this.el.css('border-color');
        }
        this._tooltip.css('border-color', c); 
    },
    _make_item: function(data, index) {
        var self = this;
        var icon = $('<span>');
        if(data.icon != null && data.icon !== ''){
            icon.addClass('ui-icon ' + data.iconClass || '');
        }
        else{
            icon.css(data.iconCSS || {})
                .addClass('ui-corner-all');
        }

        var item = $('<div>')
            .addClass('tooltip-item ui-widget-content ui-state-default')
            .append( $('<div>')
                .addClass('tooltip-icon')
                .append(icon)
                   )
            .append( $('<div>')
                .addClass('tooltip-desc')
                .append( $('<span>').text(data.title))
                .append( $('<p>').text(data.sub || ''))
                   )
            .mouseenter(function(evt) {
                item.addClass('ui-state-hover');
            })
            .mouseleave(function(evt) {
                item.removeClass('ui-state-hover');
            })
            .mousedown(function(evt) {
                item.addClass('ui-state-active');
            })
            .mouseup(function(evt) {
                item.removeClass('ui-state-active');
            })
            .click(function(evt) {
                self._trigger('selected', evt, {
                    index:index, 
                    tooltip: self.el,
                    item: item
                });
            });
        return item;
    }
});
        
}(jQuery));

/*global next_color:false */
(function($, undefined) {

var iconStyle = 'bio-help ui-widget',
    tooltipStyle = 'bio-help-tip',
    cornerStyle = 'ui-corner-all';

$.widget("bio.help", {
    options: {
        helphtml: 'Some Help',
        open: undefined,
        close: undefined,
        width: null
    },
    _init: function() {
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(iconStyle),
            tip = $('<div>').addClass(tooltipStyle);
        
        if(el.hasClass('ui-corner-all')){
            tip.addClass('ui-corner-all');
        }

        this.help = $('<p>').html(o.helphtml).appendTo(tip);
        this.el.tooltip({
            content: tip,
            width: this.options.width || 250
        });

    },
    _create: function() {
    },
    setHelp: function(help){
        this.options.helphtml(help);
        this.help.html(help);
    }
});

}(jQuery));

/*global next_color:false */
(function($, undefined) {

var baseC = 'bio-statusbar ui-widget-content ui-state-default',
    iconC = 'ui-icon';

var reg = /([^\\])%\(([\w]+)\)/g,
    defaultState = 'default';

$.widget("bio.statusBar", {
    options: {
        message: null,
        state: null,
        text: {
            defaultMessage: 'Ready'
        },
        defaultState: 'default',
        states: {
            'default': {'icon': 'ui-icon-circle-triangle-e', 'state': ''},
            'info': {'icon': 'ui-icon-info', 'state': ''},
            'warning': {'icon': 'ui-icon-alert', 'state': 'ui-state-highlight' },
            'error': {'icon': 'ui-icon-alert', 'state': 'ui-state-error'},
            'loading': {'icon': 'ui-icon-refresh', 'state': 'ui-state-highlight'},
            'ok': {'icon': 'ui-icon-circle-check', 'state': ''},
            'add': {'icon': 'ui-icon-circle-plus', 'state': 'ui-state-highlight'},
            'remove': {'icon': 'ui-icon-circle-minus', 'state': 'ui-state-highlight'},
            'saved': {'icon': 'ui-icon-disk', 'state': 'ui-state-highlight'}
        }
    },
    _create: function() {
        var self = this,
            o = this.options;
        
        this.el = $(this.element[0])
            .addClass(baseC);


        this.icon = $('<span>')
            .addClass(iconC)
            .appendTo(this.el);
        this.text = $('<p>')
            .appendTo(this.el);
        this.set(o.message || o.text.defaultMessage);
    },
    //set( string msg, [object format], [string state])
    set: function(msg, format, state) {
        msg = msg || this.options.text.defaultMessage;
        //if format was omitted
        if(typeof(format) === 'string' || state == null){
            state = format;
            format = null;
        }
        state = state || this.options.defaultState;

        if(format != null){
            msg = this._format(msg, format);
        }

        //get the state
        state = this.options.states[state];
        
        if(typeof(state) === 'undefined'){
            throw("Error: unknown state \'"+state+"\'");
        }

        //set everything
        this.text.text(msg);
        this.icon.attr('class', iconC + ' ' + state.icon);
        this.el.attr('class', baseC + ' ' + state.state);
    },
    _format: function(s, fmt){
        return s.replace(reg, function(m, $0, $1){
            return $0 + String(fmt[$1]);
        });
    }
});


}(jQuery));

/*global next_color:false */
(function($, undefined) {

var baseClasses = 'ui-widget bio-panel',
    headerClasses = 'ui-widget-header ui-state-default',
    panelClasses  = 'bio-panel-content ui-widget-content',
    panelItemClasses = 'bio-panel-item ui-widget-content',
    footerClasses = 'bio-footer ui-widget-header ui-state-default',
    defaultIcon   = 'ui-icon-circle-triangle-e';

$.widget("bio.panel", {
    options: {
        title: undefined,
        help: undefined,
        text: {
            defaultTitle: 'Bio Panel',
            defaultHelp: '',
            defaultStatus: 'Ready'
        },
        height: 400,
        showStatus: true
    },
    _create: function() {
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseClasses);

        o.title = o.title || o.text.defaultTitle;
        o.help = o.help || o.text.defaultHelp;
        o.color = o.color || next_color();

        var head = this.head = $('<div>')
            .addClass(headerClasses)
            .appendTo(el);
        var panel = this.panel = $('<div>')
            .addClass(panelClasses)
            .appendTo(el);
        var s = this.status = $('<div>')
            .statusBar()
            .appendTo(el);
        var foot = this.foot = $('<div>')
            .addClass(footerClasses)
            .appendTo(el);
        
        //define how items should scale with height
        this.stretch_factors = {'panel': 1};

        this.title = $('<span>').addClass('title').text(o.title).appendTo(head);
        var h = this.help = $('<span>').appendTo(head).help({
            helphtml: o.help
        });

        if(!o.showStatus){
            s.hide();
        }

        if(el.hasClass('ui-corner-all')){
            head.addClass('ui-corner-top');
            foot.addClass('ui-corner-bottom');
            h.addClass('ui-corner-all');
        }
    },
    _init: function(){
        this._set_height();
    },
    option: function(key, value) {
        if(value == null){
            return this.options[key];
        }
        switch(key){
            case 'title':
                this.head.find('span').text(value);
                break;
            case 'help':
                this.help('setHelp', value);
                break;
            case 'height':
                this._set_height(value);
                break;
        }
        this.options[key] = value;
    },
    setStatus: function(msg, filter, state){
        this.status.statusBar('set', msg, filter, state);
    },
    _refresh: function(){
        this._set_height();
    },
    _set_height: function(height){
        var stretch = 0, total = 0;
        height = height || this.options.height;
        for(var i in this.stretch_factors)
        {
            total += this.stretch_factors[i];
            stretch += this[i].outerHeight();
        }
        var fixed = this.el.outerHeight() - stretch;
        stretch = Math.max(0, height - fixed);
        for(i in this.stretch_factors)
        {
            this[i].outerHeight(stretch * this.stretch_factors[i] / total);
        }
    },
    _panel_item: function(i){
        return (i || $('<div>')).addClass(panelItemClasses);
    }
});

}(jQuery));


//generate a decent color palette
var next_color = (function() {
    var last = Math.random() * 360;
    var stride = 360 / 1.61803;
    return function() {
        last = Math.floor((last + stride)) % 360;
        return 'hsl('+last+',40%,50%)';
    };
}());

(function($, undefined) {

var baseC    = 'bio-search ui-widget',
    defaultC = 'ui-state-default',
    hoverC   = 'ui-state-hover',
    focusC   = 'ui-state-focus',
    noneC    = 'ui-state-error';

$.widget("bio.search", {
    options: {
        text: {
            search: 'search'
        },
        items: $(), //the DOM items to be filtered
        filterFunc: function(regexp, item) {return true;}, //the function to 
            //filter the items with, return true if the item is selected
        
        beforeFilter: undefined,
        filter: undefined,
        pause: 150, //how long to wait before filtering
        anim: 0 //length of time to animate - default 0
    },
    _create: function() {
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseC);

        this.timeout = null;

        el.addClass(baseC).addClass(defaultC);
        this.input = $('<input type="text">')
            .appendTo($('<div>').appendTo(el));
        this.search_hint = $('<div>')
            .addClass('hint')
            .text(o.text.search)
            .appendTo(el);
        $('<span>').addClass('ui-icon ui-icon-search').appendTo(el);
        this.search_clear = $('<span>').addClass('ui-icon ui-icon-close')
            .hide()
            .appendTo(el);
            
    },
    _init: function(){
        var self = this,
            o = this.options;
        this.input.on({
                'focus': function(){
                    self.search_hint.hide();
                    self.el.addClass(focusC);
                },
                'blur': function(){
                    if(!$(this).val()){ 
                        self.search_hint.show();
                        self.search_clear.hide();
                    }
                    self.el.removeClass(focusC);
                },
                'keyup': function(){
                    var v = self.input.val();
                    if(v){
                        self.search_clear.show();
                    } else{
                        self.search_clear.hide();
                    }
                    if(self.timeout)
                    {
                        clearTimeout(self.timeout);
                    }
                    self.timeout = setTimeout(function() {
                        self.timeout = null;
                        self._filter();
                    }, o.pause);
                }
            });
        this.el.on({
            'click': function() {
                self.input.focus();
            },
            'mouseenter': function() {
                self.el.addClass(hoverC);
            },
            'mouseleave': function() {
                self.el.removeClass(hoverC);
            }
                    
        });
        this.search_clear.on('click', function(){
            self.input.val('');
            self.search_clear.hide();
            self._filter();
        });
    },
    value: function(v) {
        if(v!=null){
            this.input.val(v);
            this._filter();
            return;
        }
        return this.input.val();
    },
    _filter: function() {
        if(this._trigger('beforeFilter') !== true){
            return;
        }
        var f = this.options.filterFunc,
            reg = new RegExp(this.input.val(), 'i'),
            i = this.options.items,
            show = $(),
            hide = $();

        if(!$.isFunction(f)){
            throw('search.options.filterFunc is not callable');
        }
        if($.isFunction(i)){
            i = i();
        }

        i.each(function() {
            if(f(reg, $(this))){
                show = show.add($(this));
            }
            else {
                hide = hide.add($(this));
            }
        });

        show.filter(':hidden').slideDown(this.options.anim);
        hide.filter(':visible').slideUp(this.options.anim);

        if(show.length === 0 && hide.length > 0) {
            this.el.addClass(noneC);
        }
        else {
            this.el.removeClass(noneC);
        }

        this._trigger('filter', null, {
            search: this.el,
            hide: hide,
            show: show
        });
    }
});

}(jQuery));


/*global next_color:false Raphael:false */
(function($, undefined) {

var baseClasses = 'bio-fragment ui-widget',
    hoverClasses = 'ui-state-hover ui-state-active',
    disabledClasses = 'ui-state-disabled',
    infoClasses = 'bio-fragment-info';

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

$.widget("bio.fragment", {
    options: {
        name: null,
        desc: null,
        length: null,
        url: undefined,
        color: undefined,
        width: undefined, //7em
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
        o.width = o.width || el.width();
        el.width(o.width);

        var w = el.width(),
            h = el.height();

        this.paper = Raphael(this.element[0], w, h);
        this.frag = this.paper.path('');
        this.name = this.paper.text(w/2, h/2, this.options.name).attr({
                fill: 'white',
                font: 'inherit'
            });


        this.info = $("<div>")
            .addClass(infoClasses)
            .mousedown(function(ev){
                //stop the fragment from being dragged
                ev.stopPropagation();
            });
        this.refreshInfo();            
        
        el.css({
            'border-color': o.color
        });

        if(o.helper === 'clone'){
            o.revert = true;
            o.helper = function(){
                return $('<div>').addClass(baseClasses).css('z-index', 200)
                    .append(el.children('svg').clone());
            };
        }

        this.el.tooltip({
            color: function() {
                return o.color;
            },
            content: this.info,
            width: "125%"
        });

        this._redraw_frag();
        this._set_color();
    },
    _init: function() {
    },
    option: function(name, value)
    {
        var o = this.options;

        if(value == null) {
            return o[name];
        }
        o[name] = value;
        switch(name)
        {
            case 'name':
                this._redraw_frag();
                break;
            case 'desc':
            case 'length':
            case 'url':
                this.refreshInfo();
                break;
            case 'width':
                this._redraw_frag();
                break;
            case 'color':
                this.el.css({
                    'border-color':this.options.color
                });
                this._anim_color();
                break;
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
    disable: function() {
        this.el.tooltip('disable');
    },
    enable: function() {
        this.el.tooltip('enable');
    },
    ghost: function(g) {
        if(g == null) {g = true;}
        if(!g) {
            this.name.attr('opacity', 1.0);
            this._set_color();
            this.frag.attr('stroke-dasharray', '');
        }
        else {
            this.name.attr('opacity', 0.0);
            this.frag.attr({
                'fill': null,
                'stroke': '#555555',
                'stroke-dasharray': '-'
            });
        }
    },
    _set_color: function() {
        var hsl = this.options.color.match(/\d+/g);
        this.frag.attr({
            fill: Raphael.hsl(hsl[0], hsl[1], hsl[2]),
            stroke: Raphael.hsl(hsl[0], hsl[1], Math.max(0, hsl[2]-10))
        });
    },
    _anim_color: function() {
        var hsl = this.options.color.match(/\d+/g);
        var a = Raphael.animation({
            fill: Raphael.hsl(hsl[0], hsl[1], hsl[2]),
            stroke: Raphael.hsl(hsl[0], hsl[1], Math.max(0, hsl[2]-10))
        }, 1000);
        this.frag.animate(a.delay(100));
    },
    _redraw_frag: function()
    {
        var w = this.el.width(),
            h = this.el.height();

        this.paper.setSize(w,h);
        this.frag.attr({
            'path': makeLinearFrag(w,h)
        });

        this.name.attr({
            x: w/2, 
            y: h/2, 
            text: this.options.name
        });

        var l = this.options.name.length - 1;
        while((this.name.getBBox().width + h) > w){
            l -= 1;
            this.name.attr({text: this.options.name.substr(0, l)+'...'});           
        }
    }
}); 

}(jQuery));

/*global next_color:false */
(function($, undefined) {

var baseClasses   = 'bio-fragment-select ui-widget',
    defaultIcon   = 'ui-icon-circle-triangle-e';

var test_frag = function(filter, f){
    f = f.children(':bio-fragment');
    return filter.test(f.fragment('option','name')) || 
        filter.test(f.fragment('option','desc'));
};

$.widget("bio.fragmentSelect", $.bio.panel, {
    options: {
        title: undefined,
        help: undefined,
        text: {
            defaultTitle: 'Fragment Selector',
            defaultHelp: 'Drag and drop fragments to select them',
            filter: 'filter',
            loading: 'Loading fragments...',
            loaded: 'Loaded %(total) %(fragment)',
            error: 'Error',
            none_loaded: 'No fragments are loaded',
            none_matching: 'No fragments match the filter',
            showing_all: 'Showing %(total) %(fragment)',
            showing_filter: 'Showing %(filter) of %(total) %(fragment)',
            add_fragment: 'Added fragment \'%(name)\'',
            remove_fragment: 'Removed fragment \'%(name)\'',
            fragment: 'fragment',
            fragments: 'fragments',
            cberror: 'An error occurred'
        },
        defaultHelper: 'clone',
        height: 400,
        src: undefined, //string URL or f(cb, error_cb)
        color: null
    },
    _create: function() {
        this._super();
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseClasses);

        this.stretch_factors = {'ul': 1};

        this.timeout = null;

        var searchbar = self._panel_item()
            .addClass('searchbar')
            .appendTo(this.panel);
        
        this.search = $('<div>')
            .search({
                text: {search: 'filter'},
                filter: function(ev, data){
                    self.filterStatus(data.show.length, data.hide.length);
                },
                filterFunc: test_frag,
                items: function() {
                    return self.list.find(':bio-fragment').parent();
                },
                anim: 200
            })
            .appendTo(searchbar);
        
        this.list = this._panel_item()
            .addClass('list')
            .appendTo(this.panel);

        //copy any initial fragments
        var ul = this.ul = el.find('ul');
        if(ul.length === 1){
            ul.detach().appendTo(this.list);
        }
        else{
            ul = this.ul = $('<ul>').appendTo(this.list);
        }

        ul.sortable({
            placeholder: 'ui-widget-content bio-fragment-placeholder',
            connectWith: '.bio-panel ul',
            start: function(ev, ui) {
                ui.item.find(':bio-fragment').fragment('disable');
            },
            stop: function(ev, ui) {
                ui.item.find(':bio-fragment').fragment('enable');
            },
            receive: function(ev, ui) {
                var f = ui.item.find(':bio-fragment');
                f.fragment('option', 'color', o.color);
                self.setStatus( o.text.add_fragment, {
                    name: f.fragment('option', 'name')
                }, 'add');
            },  
            remove: function(ev, ui) {
                var f = ui.item.find(':bio-fragment');
                self.setStatus( o.text.remove_fragment, {
                    name: f.fragment('option', 'name')
                }, 'remove');
            },
            helper: function(ev, item) {
                return $(item)
                    .find(':bio-fragment')
                    .clone()
                    .appendTo($('body'));
            }
        });

        var success = function(data) {
            //copy into the DOM
            for(var i = 0; i < data.length; i++) {
                var f = data[i];
                $('<li>').append($('<div>').attr({
                    name: f.name,
                    length: f.length,
                    desc: f.desc,
                    href: f.url
                })).appendTo(ul);
            }
            //and initialise them
            ul.find('li').each(function() {
                var w = $(this).width();
                $(this).children().fragment({
                        color: o.color,
                        width: w
                    });
            });
            self.setStatus( o.text.loaded, {
                total: data.length,
                fragment: data.length === 1 ? o.text.fragment:o.text.fragments
            }, 'ok');
            ul.animate({
                'margin-top': 0
            }, 'fast', function() {
                self.list.css('overflow', '');
                ul.css('margin-top', '');
            });

        };


        if(o.src != null) {
            if(typeof(o.src) === 'string') {
                //prepare for animations
                this.list.css('overflow', 'hidden');
                ul.css('margin-top', this.list.height() + 'px');
                //interpret as an url to load from
                this.setStatus( o.text.loading, 'loading');
                $.ajax({
                    'url': o.src,
                    'dataType': 'json',
                    'success': success,
                    'error': function(jqXHR, textStatus, errorThrown) {
                        self.setStatus( String(errorThrown),
                                              'error');
                    }
                });
            }
            else if($.isFunction(o.src)){
                try{
                    o.src(success, function(){
                        self.setStatus( o.text.cberror, 'error');
                    });
                }
                catch(e){
                    self.setStatus( e.message, 'error');
                }
            }
            else {
                throw("options.src must be a string URL or a function");
            }
        }

        if(el.hasClass('ui-corner-all')){
            this.search.addClass('ui-corner-all');
        }
    },
    showAll: function(){
        this.el.find(':bio-fragment').show();
    },
    filterStatus: function(shown, hidden){
        var text,
            state = '',
            t = this.options.text;
        
        if(hidden > 0 && shown > 0) {
            text = t.showing_filter;
            state = 'info';
        }           
        else if(hidden === 0 && shown === 0) {
            text = t.none_loaded;
            state = 'warning';
        }
        else if(hidden > 0 && shown === 0) {
            text = t.none_matching;
            state = 'warning';
        }
        else if(hidden === 0) {
            text = t.showing_all;
            state = 'default';
        }

        this.setStatus( text, {
            filter: shown,
            total: shown+hidden,
            fragment: (shown+hidden) === 1 ? t.fragment : t.fragments
        }, state);
    }
});

}(jQuery));


(function($, undefined) {

var baseC       = 'bio-sequence-loader ui-widget',
    progressC   = 'loader-progress',
    warningC    = 'loader-warnings ui-widget-content ui-state-error',
    headerC     = 'ui-widget-header',
    wtitleC     = 'warning-title',
    closeC      = 'ui-icon ui-icon-close',
    listC       = 'ui-widget-content';

var hasXHR2 = function() {
    return window.XMLHttpRequest && ('upload' in new XMLHttpRequest());
};
var hasWebWorker = function() {
    return typeof(Worker) !== 'undefined';
};

$.widget("bio.sequenceLoader", {
    options: {
        text: {
            warnNoXHR2: 'Warning: Your browser does not appear to support '+
                'XMLHttpRequest Level 2. You will not see download progress '+
                '- please consider updating your browser.',
            warnNoWebWorkers: 'Warning: Your browser does not appear to ' +
                'support webWorkers. The browser may freeze during loading '+
                '- please consider updating your browser.',
            states: ['Downloading', 'Processing'],
            warnings: 'Warnings'
        }
    },
    _create: function() {
        this.el = $(this.element[0])
            .addClass(baseC);
        this._build_elements();

        this.el.append(this.warnings)
            .append(this.progress);

        if(this.warnings.find('li').length > 0){
            this._show_warnings();
        }
        
    },
    _init: function() {
    },
    _build_elements: function() {
        var self = this, t = this.options.text;
        this.progress = $('<div>')
            .addClass(progressC)
            .progressbar({max:100.0});

        this.warnings = $('<div>')
            .addClass(warningC)
            .append($('<div>')
                .addClass(headerC)
                .append($('<span>')
                    .addClass(wtitleC)
                    .text(t.warnings))
                .append($('<span>')
                    .addClass(closeC)
                    .click(function() {
                        self._hide_warnings();
                    })))
            .append($('<ul>')
                .addClass(listC)
                .append(this._get_warnings()));

    },
    _hide_warnings: function(){
        this.warnings.slideUp();
    },
    _show_warnings: function(){
        this.warnings.slideDown();
    },
    _get_warnings: function(){
        var self = this, t = this.options.text;
        var w = $();
        if(!hasXHR2()){
            w = w.add($('<li>'+t.warnNoXHR2+'</li>'));
        }
        if(!hasWebWorker()){
            w = w.add($('<li>'+t.warnNoWebWorkers+'</li>'));
        }
        return w;
    },
    _update: function(done, total, state) {
        this.progress.progressbar('value', 50.0 * state + 50.0 * (done / total));
        this._trigger('update', null, {
            'state': this.options.states[state],
            'done': done,
            'total': total
        });
    }
});

}(jQuery));


/*global next_color:false */
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
            defaultStatus: 'No fragment loaded'
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
        this.setStatus(this.options.text.defaultStatus);
    },
    _build_elements: function() {
        
        // --------------------------------------------------------------
        // Make metadata
        // --------------------------------------------------------------

        var m = this.metadata = this._panel_item()
            .addClass(metaClass);

        this.name = $('<p>')
            .addClass(nameClass)
            .text('Fragment Name')
            .appendTo(m);
        this.desc = $('<p>')
            .addClass(descClass)
            .text('Fragment Description')
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
        
        this.loader = $('<div>').sequenceLoader();
        this.loaderpanel = this._panel_item()
            .addClass(loadpanelC)
            .append(this.loader);
    },
    _show_meta: function() {
        this.panel.append(this.metadata);
    },
    _show_loader: function() {
        this.panel.append(this.loaderpanel);
        this.stretch_factors = {
            'loaderpanel': 1
        };
        this._refresh();
    },
    _hide_loader: function() {
        this.loaderpanel.remove();
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

