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

    /**
     * FeatureLocation
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
                rhs.contains(rhs[i].start) )
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


    bio.FeatureLocation = FeatureLocation;
     

    /**
     * SeqFeature: Represent a sequence feature
     */
    var SeqFeature = function(location, type, id, qualifiers)
    {
        this.init(location, type, id, qualifiers);
    };
    var sf = SeqFeature.prototype;

    sf.init = function(l,t,i,q)
    {
        if(!Array.isArray(l))
        {
            l = [l];
        }
        this.location = l || [];
        this.type = t || "NoneType";
        this.id = i || -1;
        this.qualifiers = q || {};
    };

    sf.overlaps = function(rhs)
    {
        if(!Array.isArray(rhs))
        {
            rhs = [rhs];
        }
        for(var i = 0; i < rhs.length; i++)
        {
            for(var j = 0; j < this.location.length; j++)
            {
                if(this.location[j].overlaps(rhs[i].location))
                {
                    return true;
                }
            }
        }
        return false;
    };

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
        var loc = [];
        for(var i = 0; i < json.location.length; i++)
        {
            loc.push(bio.loadSeqLocation(json.location[i]));
        }
        return new SeqFeature(loc, json.type, json.id, json.qualifiers);
    };

}());
