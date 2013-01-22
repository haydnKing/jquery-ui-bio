/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
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
