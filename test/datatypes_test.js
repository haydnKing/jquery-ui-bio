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
        e_strand: 1
    },
    {
        start: 4,
        end: 65,
        strand: -172,
        e_strand: -1
    },
    {
        start: 47,
        end: 101,
        strand: 0,
        e_strand: 1
    },
    {
        start: 55,
        end: 60,
        strand: 1,
        e_strand: 1
    },
    {
        start: 105,
        end: 170,
        strand: 5,
        e_strand: 1
    }];

    var rev = {
        start: 100,
        end: 50,
        strand: 125,
        e_strand: 1
    };

  module('bio.FeatureLocation', {
    setup: function() {
        this.load = bio.loadFeatureLocation(fl_json);
    }
  });

  test('load from json', 1 + 3*fl_json.length, function(){
    equal(this.load.length, fl_json.length, "Loaded length is different");

    for(var i = 0; i < fl_json.length; i++)
    {
        equal(this.load[i].start, fl_json[i].start, "Start "+i+" is different");
        equal(this.load[i].end, fl_json[i].end, "End "+i+" is different");
        equal(this.load[i].strand, fl_json[i].e_strand, 
              "Strand "+i+" is different");
    }
  });

}());
