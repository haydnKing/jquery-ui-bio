/*! jQuery Ui Bio - v0.1.0 - 2013-02-05
* https://github.com/Gibthon/jquery-ui-bio
* Copyright (c) 2013 Haydn King; Licensed MIT, GPL */

/*global bio:false, */

this.bio = this.bio || {};

(function($) {

    //get the script location
    var worker_src = $('script').last().attr('src')
        .replace(/\w+\.js$/, 'jquery-ui-bio-worker.js');

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
                (rhs[i].start <= this.start) && (rhs[i].end > this.start) )
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

    sf.inRange = function(range){
       return this.location.overlaps(range); 
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

    var FeatureStore = function(features, length, tile_size, auto_start)
    {
        this.init(features, length, tile_size, auto_start);
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
     * seq_length: end of all the features
     */
    fs.seq_length = 0;
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
    fs.getStackHeight = function(){
        return this.stacks;
    };
    fs.getFeatures = function()
    {
        return this.features;
    };
    fs.getFeaturesByType = function(type)
    {
        return this.by_type[type.toLowerCase()];
    };
    fs.getFeaturesByTile = function(start, end)
    {
        if(!end){
            return this.tiles[start];
        }
        var ret = this.tiles[start],
            i;
        for(i = start; i <= end; i += 1){
            copy(this.tiles[i], ret);
        }
        return ret;
    };
    fs.pos2tile = function(pos)
    {
        return Math.floor(pos/this.tile_size);
    };
    fs.tile2pos = function(i)
    {
        return [this.tile_size * i, this.tile_size * (i+1)];
    };

    var copy = function(src, dest, range){
        var type, i;
        for(type in src){
            for(i=0; i < src[type].length; i+=1){
                if(range != null && !src[type][i].inRange(range)){
                    continue;
                }
                if($.inArray(src[type][i], dest[type]) < 0){
                    dest[type].push(src[type][i]);
                }
            }
        }
    };

    fs.getFeaturesInRange = function(start, end){
        var start_tile, end_tile, t, i;
        if(start > end){
            t = end;
            end = start;
            start = t;
        }
        start_tile = this.pos2tile(start);
        end_tile = this.pos2tile(end);

        var ret = {};
        for(i in this.types){
            ret[this.types[i]] = [];
        }

        var r = {start: start, end: end};
        //first tile
        copy(this.tiles[start_tile], ret, r);
        
        for(i = start_tile+1; i <= end_tile-1; i+=1){
            t = this.tiles[i];
            copy(this.tiles[i], ret);
        }

        //last tile
        if(start_tile !== end_tile){
            copy(this.tiles[end_tile], ret, r);
        }

        return ret;
    };


    /*
     * Private Functions -----------------------------------------------------
     */

    fs.init = function(f,l,s,start){
        this.features = f || [];
        if(start == null && typeof(s)==='boolean'){
            start = s;
            s = null;
        }   
        if(s != null)
        {
            this.tile_size = parseInt(s,10);
        }
        this.seq_length = l;
        if(this.seq_length == null){
            throw('Error: sequence length must be specified');
        }
        if(start == null){
            start = true;
        }

        this.done = 0;
        this.total = this.features.length;

        this.stacks = {'fwd':{}, 'rev':{}};

        if(start){
            this.go();
        }
    };

    fs.go = function(){
        this._calc_types();
        this._alloc_tiles();

        this._process();

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

    fs._process = function()
    {
        var self = this;

        var process_all = function(t) {
            self._process_type(self.types[t]);
            $(self).trigger('progress', {
                done: self.done, 
                total:self.total
            });
            if((t+1) < self.types.length){
                setTimeout(function(){
                    process_all(t+1);
                }, 50);
            }
            else {
                $(self).trigger('completed');
            }
        };

        process_all(0);
    };

    fs._process_type = function(type){
        var feats = this.getFeaturesByType(type),
            fwd = [],
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
        this.stacks.fwd[type] = this._set_tracks(fwd);
        this._calc_tiles(fwd);
        this.stacks.rev[type] = this._set_tracks(rev);
        this._calc_tiles(rev);
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

    fs._alloc_tiles = function()
    {
        var i,j,t;

        //make enough blank tiles
        this.tiles = [];
        for(i = 0; i < this.seq_length / this.tile_size; i++)
        {
            t = {};
            for(j = 0; j < this.types.length; j++)
            {
                t[this.types[j]] = [];
            }
            this.tiles.push(t);
        }
    };

    fs._calc_tiles = function(feats)
    {
        var f,i,j,t,first,last;

        feats = feats || this.features;

        for(i = 0; i < feats.length; i++)
        {
            f = feats[i];
           
            //find the positions of the first and last tiles for the feature
            first = this.pos2tile(f.location.start);
            last = this.pos2tile(f.location.end-1);

            //add the feature to each tile in [first, last]
            for(t = first; t <= last; t++)
            {
                this.tiles[t][f.type.toLowerCase()].push(f);
            }
        }
        this.done += feats.length;
    };

    //Export to namespace
    bio.FeatureStore = FeatureStore;
    

    /*
     * SequenceCache: cache parts of the sequence that have been downloaded
     *
     * callback: function(from, to, function(seq))
     */
    var SequenceCache = function(callback, tile_size){
        this.tile_size = tile_size || this.tile_size;
        this.cb = callback;
        this.seq = {};
    };
    var sc = SequenceCache.prototype;

    sc.tile_size = 1024;

    /*
     * return as much of the range as is available now as 
     *  [{from: int, to: int, seq: sequence}, ...]
     * call update_fn when the whole of the range is available, if it isn't
     * already
     */
    sc.get = function(start, end, update_fn){
        var self = this,
            calls = 0,
            ret = [],
            s_t = Math.floor(start / this.tile_size),
            e_t = Math.floor(end / this.tile_size),
            t;

        var _get_handler = function(tile){
            return function(seq){
                calls -= 1;
                self._add_tile(tile, seq);
                if(calls === 0 && $.isFunction(update_fn)){
                    update_fn();
                }
            };
        };

        for(t = s_t; t <= e_t; t+=1)
        {
            if(!this.seq[t]){
                calls += 1;
                this.cb(_get_handler(t), t*this.tile_size, (t+1)*this.tile_size);
            }
            else{
                ret.push({
                    from: this.tile_size * t,
                    to: this.tile_size * (t+1),
                    seq: this.seq[t]
                });
            }
        }
        if(ret.length > 0){
            ret[ret.length-1].seq = ret[ret.length-1].seq.slice(0,
                                Math.min(this.tile_size, end-e_t*this.tile_size));
            ret[ret.length-1].end = end;

            ret[0].seq = ret[0].seq.slice(Math.max(0,start-s_t*this.tile_size));
            ret[0].from = start;
        }

        return ret;
    };

    sc._add_tile = function(tile, seq){
        this.seq[tile] = seq.toLowerCase();
    };

    bio.SequenceCache = SequenceCache;

}(jQuery));

this.bio = this.bio || {};

(function($, undefined) {

    /*
     * data_read: read JSON data from the server
     *  - cb: function(data) to be called on success
     *  - target: either
     *      + url to fetch data
     *      + function(cb, send_data) -> XHR
     *  - send_data: OPTIONAL data to send to the server
     *  - event_object: OPTIONAL jQuery object on which to fire events
     *  - event_prefix: OPTIONAL only valid if event_object is set
     *      if supplied events are triggered with type
     *      event_prefix + '.' + event
     */
    this.bio.read_data = function(
            cb, target, send_data, event_object, event_prefix) {
        var xhr;

        //normalise input
        if(!$.isFunction(cb)){
            throw('Error: cb must be a function');
        }
        if(target == null){
            throw('Error: target must be provided');
        }
        if(send_data == null){
            event_prefix = '';
            event_object = null;
            send_data = {};
        }
        else if(send_data instanceof $){
            event_prefix = event_object || '';
            event_object = send_data;
            send_data = {};
        }
        event_prefix = event_prefix || '';
        send_data = send_data || {};
        if(event_prefix !== ''){event_prefix = event_prefix + '.';}

        var fire_evt = function(type, data){
            if(event_object != null){
                event_object.trigger(event_prefix+type, data);
            }
        };

        //send the request
        if(typeof(target) === 'string'){
            xhr = $.ajax(target, {
                data: send_data,
                success: cb,
                error: function(jqXHR, status, errorThrown){
                    fire_evt('error', {status: status, message: errorThrown});
                }
            });
        }
        else if($.isFunction(target)){
            xhr = target(cb, send_data);
            xhr.onerror = function(prog) {
                fire_evt('error', {status: 'error', message: xhr.statusText});
            };
        }

        $(xhr).on('progress', function(e){
            var oe = e.originalEvent;
            // Make sure the progress event properties get copied over:
            e.lengthComputable = oe.lengthComputable;
            e.loaded = oe.loaded;
            e.total = oe.total;
            if(e.lengthComputable) {
                fire_evt('progress', e);
            }
        });

    };
}(jQuery));

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
        if(!this._set_content()){
            this._tooltip.remove();
            this._tooltip = null;
            return;
        }
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
    option: function(k, v){
        if(v === null){
            return this.options[k];
        }
        this.options[k] = v;
        return this.el;
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

        if(c === false){
            return false;
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

        return true;
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
                    item: item,
                    data: data
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

var reg = /%\(([\w]+)\)/g,
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
        return s.replace(reg, function(m, $0, offset){
            //don't replace if it's excaped
            if(offset > 0 && s.charAt(offset-1) === '\\'){
                return '%(' + $0 + ')';
            }
            return String(fmt[$0]);
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


/*global bio:false */
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
        seq_length: null,
        features: null,
        post_data: null,
        auto_start: false,
        text: {
            warnNoXHR2: 'Warning: Your browser does not appear to support '+
                'XMLHttpRequest Level 2. You will not see download progress '+
                '- please consider updating your browser.',
            warnNoWebWorkers: 'Warning: Your browser does not appear to ' +
                'support webWorkers. The browser may freeze during loading '+
                '- please consider updating your browser.',
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
        var self = this,
            o = this.options;

        this.el
            .on('error', function(ev, data){
                self._trigger('error', ev, data);
            })
            .on('progress', function(ev, data){
                self._update(data.loaded, data.total, 0);
            });
        
        if(o.auto_start){
            this.start();
        }
        
    },
    _got_data: function(data) {
        var self = this;

        this._trigger('downloaded');
        this.progress.progressbar('value', 50);

        var features = bio.loadSeqFeature(data);
        this._update(0, features.length, 1);

        setTimeout(function(){
            self._process(features);
        }, 100);
    },
    _process: function(features)
    {
        var self = this;
        this.fs = new bio.FeatureStore(features, 
                                       this.length || this.options.seq_length,
                                       false);
        $(this.fs)
            .on('progress', function(ev, data){
                self._update(data.done, data.total, 1);
            })
            .on('completed', function(ev, data){
                self._update(features.length, features.length, 1);
                self._trigger('completed');
            });
        this.fs.go();
    },
    start: function(length) {
        var self = this,
            o = this.options;
        this.length = length;
        bio.read_data(function(data) {self._got_data(data);},
            o.features, o.post_data, this.el);
        this._trigger('start');
    },
    featureStore: function() {
        return this.fs;
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
        if(total > 0) {
            this.progress.progressbar('value',
                                      50.0 * state + 50.0 * (done / total));
        }
        this._trigger(state === 0 ? 'download' : 'process', null, {
            'loaded': done,
            'total': total
        });
    }
});

}(jQuery));


/*global Raphael:false */
(function($, undefined) {

var baseC   = 'bio-sequence-overview ui-widget';

var small_tick = 3,
    separation = 5,
    click_range = 3,
    names = ['bp', 'kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Yb'];

$.widget("bio.overview", $.ui.mouse, {
    options: {
        featureStore: null,
        colorScheme: {},
        seq_length: 0
    },
    setHighlight: function(start, width, anim){
        anim = anim || false;
        var s = this.w / this.options.seq_length;
        var attrs = {
            x: s * start,
            width: s * width
        };
        this.highlight.show();
        if(anim){
            this.highlight.animate(attrs, 200);
        }
        else {
            this.highlight.attr(attrs);
        }
    },
    _create: function(){
        var self = this;
        this.el = $(this.element[0])
            .addClass(baseC);
        var pad  = this.wrapper = $('<div>').appendTo(this.el);

        this.paper = new Raphael(pad.get(0), pad.width(), pad.height());
        this.scale = this.paper.set();

        this._get_size();

        this._draw_centerline();

        this._get_heights();
        this._progressive_draw();
        this._create_highlight();
        this._mouseInit();
        this.el.mousedown(function(ev){
            self._triggerClicked(ev);
        });
    },
    _init: function(){
    },
    _get_size: function(){
        this.w = $(this.paper).prop('width');
        this.h = $(this.paper).prop('height');
        this.w2 = this.w/2.0;
        this.h2 = this.h/2.0;
    },
    _triggerClicked: function(ev){
        this._trigger('clicked', null, this._loc_from_ev(ev));
    },
    _mouseDrag: function(ev){
        this._triggerClicked(ev);
    },
    _mouseStop: function(ev){
        this._triggerClicked(ev);
    },
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
        var loc = this.wrapper.offset(),
            ret = {},
            types = this.options.featureStore.types;
        ret.x = ev.pageX - loc.left;
        ret.y = ev.pageY - loc.top;
        ret.dir = (ret.y > this.h2) ? 'rev' : 'fwd';
        var elev = ret.dir === 'fwd' ? 
            this.h2 - separation - ret.y :
            ret.y - (this.h2 + separation);
        ret.type = types[types.length-1];
        for(var i = 1; i < types.length; i++){
            if(elev < this.stacks[ret.dir][types[i]]){
                ret.type = types[i];
                break;
            }
        }
        ret.pos = Math.round(this.options.seq_length * ret.x / this.w);
        return ret;
    },
    _create_highlight: function() {
        this.highlight = this.paper.rect(0,0,this.w,this.h)
            .attr({fill: '#C0F7FE', stroke: '#3DE4FC'})
            .toBack()
            .hide();
    }
});

}(jQuery));

/*global next_color:false,bio:false,createjs:false */
(function($, undefined) {

var baseC = 'bio-sequence ui-widget',
    labelC = 'label',
    fragC = 'bio-fraginfo';

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

p._DOinit = p.initialize;

p.initialize = function(sequence, color){
    this._DOinit();
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
var f = Features.prototype = new createjs.DisplayObject();

f.track_height = 0;
f.type_offsets = null;
f.highlight = null;

f._DOinit = f.initialize;
f.initialize = function(seq){
    this._DOinit();
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

f.getFeature = function(base, top){
    base = Math.floor(base);
    var h2 = this.seq.h2,
        strand = top <= h2 ? 1 : -1,
        o = (strand > 0) ? this.type_offsets.fwd : this.type_offsets.rev,
        y = Math.abs(top - h2),
        type, track, feat, feats;
    
    if(y < feat_offset) {return null;}
    y = (y - feat_offset) / this.track_height;

    feats = this.fs.getFeaturesInRange(base, base + 1);

    for(var t in o){
        if(o[t] > y){
            break;
        }
        type = t;
    }
    track = Math.floor(y - o[type]);

    feats = feats[type];
    for(feat in feats){
        if(feats[feat].strand() === strand && feats[feat].track === track){
            return feats[feat];
        }
    }
    return null;
};

f.setHighlight = function(f){
    if(f !== this.highlight){
        this.highlight = f;
        this.getStage().update();
    }
};

f.draw = function(ctx){
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
            ctx.globalAlpha = (feat === this.highlight) ? 0.8 : 1.0;
            
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
var s = Sequence.prototype = new createjs.DisplayObject();

s._DOinit = s.initialize;
s.initialize = function(seq, seqCache){
    this._DOinit();
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

s._draw_base = function(b){
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

s._draw_base_text = function(ctx, a,b){
    ctx.fillStyle = this.textC;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'normal ' + (sep-3) + 
                        'px "Helvetica Neue",Helvetica,Arial,sans-serif';

    ctx.fillText(a, 0.5*base_width, 1);
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(b, 0.5*base_width, 2*sep - 1);
};

s._draw_arrow = function(c, d, c1, c2){
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

s._update_tile = function(){
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

s.draw = function(ctx){
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
        this.el.tooltip({
            hover: 0,
            autoClose: false,
            width: 200,
            location: 'mouse'
        });

        this._trigger('completed');

        //this._mouseInit();
        this.moveTo(0);

        this._bind_events();
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
        this.el.mousemove(function(ev){
            var p = self._ev_to_pos(ev);
            self.featureObject.setHighlight(p.feature);
            self.el.css('cursor', (p.feature == null) ? 'move' : 'pointer');
        });
        this.el.click(function(ev){
            var p = self._ev_to_pos(ev);
            if(p.feature != null){
                self._showTooltip(p.feature);
            }
        });
        this.el.mousedown(function(ev){
            self.el.tooltip('hide');
        });

    },
    _ev_to_pos: function(ev){
        var o = this.el.offset(),
            p = {
                    'left': ev.pageX - o.left,
                    'top': ev.pageY - o.top,
                    'loc': this.pos + (ev.pageX-o.left)*this.bw/this.w
            };
        p.feature = this.featureObject.getFeature(p.loc, p.top);
        return p;
    },
    _showTooltip: function(f){
        var table = $('<table>'), q;
        table.append('<tr><td>Location:</td><td>['+
                     f.location.start+':'+f.location.end+']</td></tr>');
        for(q in f.qualifiers){
            table.append('<tr><td>'+q+':</td><td>'+f.qualifiers[q]+'</td></tr>');
        }
        var html = $('<div>')
            .addClass(fragC)
            .append(table);
            
        this.el.tooltip('option', 'title', f.type + ' ('+f.location.length()+'bp)');
        this.el.tooltip('option', 'content', html);
        this.el.tooltip('option', 'color', 
                        this.options.colorScheme[f.type.toLowerCase()]);
        this.el.tooltip('show');
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
        this.featureObject = new Features(this);
        this.stage.addChild(this.featureObject);
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


/*global next_color:false,bio:false,Raphael:false */
(function($, undefined) {

var baseClasses = 'bio-sequence-view ui-widget',
    metaClass = 'bio-meta',
    nameClass = 'bio-name',
    descClass = 'bio-desc',
    overviewClass = 'bio-overview',
    keyClass = 'bio-key',
    keyItemClass = 'bio-keyitem',
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

        this.key = this._panel_item()
            .addClass(keyClass)
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
            self._show_key(self._get_color_scheme(fs.types));
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
            'key': 1,
            'overview': 2
        };
        this.panel.append(this.seqview);
        this._refresh();
    },
    _show_key: function(cs){
        var key, item;
        for(key in cs){
            item = $('<p>').addClass(keyItemClass)
                .text(key)
                .prepend($('<span>').css('background-color', cs[key]));
            this.key.append(item);
        }
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

