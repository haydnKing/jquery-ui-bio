/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
/*global bio:false */
/*global _$:false */
(function($) {

  /*
    ======== A Handy Little QUnit Reference ========
    http://docs.jquery.com/QUnit

    Test methods:
      expect(numAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      raises(block, [expected], [message])
  */
 //all collide with 0 but the last
    var fl_json = [{
        start: 50,
        end: 100,
        strand: 100,
        e_strand: 1
    },
    {
        start: 57,
        end: 150,
        strand: 1,
        e_strand: 1,
        e_overlap: true
    },
    {
        start: 4,
        end: 65,
        strand: -172,
        e_strand: -1,
        e_overlap: true
    },
    {
        start: 47,
        end: 101,
        strand: 0,
        e_strand: 1,
        e_overlap: true
    },
    {
        start: 55,
        end: 60,
        strand: 1,
        e_strand: 1,
        e_overlap: true
    },
    {
        start: 105,
        end: 170,
        strand: 5,
        e_strand: 1,
        e_overlap: false
    }];

    var rev = {
        start: 100,
        end: 50,
        strand: 125,
        e_strand: 1
    };

    var sf_json = [{
        type: 'one',
        id: 0,
        qualifiers: {},
        location: fl_json[0]
    },
    {
        type: 'two',
        id: 1,
        qualifiers: {one: 1, two: '2'},
        location: fl_json[3],
        e_overlap: true
    },
    {
        type: 'three',
        id: 1,
        qualifiers: {one: 1, two: '2'},
        location: fl_json[5],
        e_overlap: false
    }];

    var equal_fl = function(actual, expected, msg)
    {
        msg = msg || "";
        equal(actual.start, expected.start, msg + " start");
        equal(actual.end, expected.end, msg + " end");
        equal(actual.strand, expected.e_strand, msg + " strand");
    };

    var tests_fl = 3;

    var equal_sf = function(actual, expected, msg)
    {
        msg = msg || "";
        equal(actual.type, expected.type, msg + " type");
        equal(actual.id, expected.id, msg + " id");
        equal(actual.qualifiers, expected.qualifiers, msg + " qualifiers");
        equal_fl(actual.location, expected.location, " location");
    };
    var tests_sf = 3 + tests_fl;

    /*
     * #####################################################
     * FeaureLocation
     * #####################################################
     */

    module('bio.FeatureLocation', {
        setup: function() {
            this.load = bio.loadFeatureLocation(fl_json);
        }
    });

    test('load from json', 1 + tests_fl*fl_json.length, function(){
        equal(this.load.length, fl_json.length, "Loaded length is different");

        for(var i = 0; i < fl_json.length; i++)
        {
            equal_fl(this.load[i], fl_json[i], "fl("+i+")"); 
        }
    });

    test('overlaps', fl_json.length-1, function(){

        for(var i = 1; i < fl_json.length; i++)
        {
            equal(this.load[0].overlaps(this.load[i]), fl_json[i].e_overlap, 
                  "Overlap "+i);
        }
    });

    test('reverse order', 3, function(){
        var a = bio.loadFeatureLocation(rev);
        equal(a[0].start, rev.end);
        equal(a[0].end, rev.start);
        equal(a[0].strand, rev.e_strand);
    });

    /*
     * #####################################################
     * SeqFeature
     * #####################################################
     */

    module('bio.SeqFeature', {
        setup: function() {
            this.load = bio.loadSeqFeature(sf_json);
        }
    });

    test('load from json', 1 + sf_json.length * tests_sf, function(){
        equal(this.load.length, sf_json.length, "Loaded length is different");

        for(var i = 0; i < sf_json.length; i++)
        {
            equal_sf(this.load[i], sf_json[i], "SF("+i+")");
        }
    });

    test('overlap', sf_json.length - 1, function(){

        for(var i = 1; i < sf_json.length; i++)
        {
            equal(this.load[0].overlaps(this.load[i]), sf_json[i].e_overlap);
        }
    });

    /*
     * #####################################################
     * FeaureStore
     * #####################################################
     */
    
    module('bio.FeatureStore', {
        setup: function() {
            this.json = [{
                type: 'one',
                id: 0,
                qualifiers: {},
                location: {
                    start: 50,
                    end: 100,
                    strand: 100
                }
            },
            {
                type: 'one',
                id: 1,
                qualifiers: {one: 1, two: '2'},
                location: {
                    start: 47,
                    end: 101,
                    strand: 0
                }
            },
            {
                type: 'one',
                id: 2,
                qualifiers: {one: 1, two: '2'},
                location:  {
                    start: 105,
                    end: 170,
                    strand: 5
                }
            },
            {
                type: 'two',
                id: 3,
                qualifiers: {one: 1, two: '2'},
                location: {
                    start: 47,
                    end: 101,
                    strand: 0
                }
            },
            {
                type: 'three',
                id: 4,
                qualifiers: {one: 1, two: '2'},
                location:  {
                    start: 105,
                    end: 170,
                    strand: -5
                }
            }];

            //stop testing until the store is built
            stop();

            this.fs = new bio.FeatureStore(bio.loadSeqFeature(this.json), 
                                           200, 50, false);

            var $fs = _$(this.fs);
            $fs.one('completed', function() {
                start();
            });
            this.fs.go();
        }
    });

    test('types', 1, function(){
        deepEqual(this.fs.types, ['one','two','three']);
    });

    test('getFeaturesByType', 3, function(){
        equal(this.fs.getFeaturesByType('one').length, 3);
        equal(this.fs.getFeaturesByType('two').length, 1);
        equal(this.fs.getFeaturesByType('three').length, 1);
    });

    test('tiles', undefined, function(){
        var i,j,k;
        equal(this.fs.tiles.length, 4);

        var data = [{'one':[1],'two':[3],'three':[]},
                    {'one':[0,1],'two':[3],'three':[]},
                    {'one':[1,2],'two':[3],'three':[4]},
                    {'one':[2],'two':[],'three':[4]}
        ];

        var types = ['one', 'two', 'three'];

        for(i = 0; i < 4; i++)
        {
            for(j = 0; j < types.length; j++)
            {
                var t = types[j];
                var ids = [];
                for(k = 0; k < this.fs.tiles[i][t].length; k++)
                {
                    ids.push(this.fs.tiles[i][t][k].id);
                }
                ids.sort();

                var msg = 'Tile '+i+', type="'+t+'" expected \n\t['+
                            data[i][t]+'] got \n\t['+ids+']';

                equal(ids.length, data[i][t].length, msg);
                if(ids.length === data[i][t].length){
                    for(k = 0; k < data[i][t].length; k++){
                        equal(ids[k], data[i][t][k], msg);
                    }
                }
            }
        }
    });

    test('getFeaturesInRange', 3, function(){
        var f = this.fs.getFeaturesInRange(100,105);
        //we only want to test the ids
        for(var i in f){
            for(var j in f[i]){
                f[i][j] = f[i][j].id;
            }
        }
        deepEqual(f.one.sort(), [1,2]);
        deepEqual(f.two.sort(), [3]);
        deepEqual(f.three.sort(), [4]);
    });

    test('getFeaturesInRange - accross tiles', 3, function(){
        var f = this.fs.getFeaturesInRange(40,107);
        //we only want to test the ids
        for(var i in f){
            for(var j in f[i]){
                f[i][j] = f[i][j].id;
            }
        }
        deepEqual(f.one.sort(), [0,1,2]);
        deepEqual(f.two.sort(), [3]);
        deepEqual(f.three.sort(), [4]);
    });

    test('getFeaturesInRange - inner range', 3, function(){
        var f = this.fs.getFeaturesInRange(70,80);
        //we only want to test the ids
        for(var i in f){
            for(var j in f[i]){
                f[i][j] = f[i][j].id;
            }
        }
        deepEqual(f.one.sort(), [0,1]);
        deepEqual(f.two.sort(), [3]);
        deepEqual(f.three.sort(), []);
    });

    test('tracks', 5, function(){
        equal(this.fs.features[0].track, 1);
        equal(this.fs.features[1].track, 0);
        equal(this.fs.features[2].track, 0);
        equal(this.fs.features[3].track, 0);
        equal(this.fs.features[4].track, 0);
    });

    test('stack', 6, function(){
        equal(this.fs.stacks.fwd.one, 2);
        equal(this.fs.stacks.fwd.two, 1);
        equal(this.fs.stacks.fwd.three, 0);
        equal(this.fs.stacks.rev.one, 0);
        equal(this.fs.stacks.rev.two, 0);
        equal(this.fs.stacks.rev.three, 1);
    });

}());
