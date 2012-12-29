/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
/*global bio:false */
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


  module('bio.SeqFeature', {
    setup: function() {
        this.load = bio.loadSeqFeature(sf_json);
    }
  });

  test('load from json', sf_json.length * tests_sf, function(){
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


}());
