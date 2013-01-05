/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
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
