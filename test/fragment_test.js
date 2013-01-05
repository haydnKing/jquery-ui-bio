/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
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
    var o = {'name': 'Frag Name', 'length':25, 'desc': 'Test Description',
          'url': 'http://www.url.com'};

  module('ui-bio.fragment', {
    setup: function() {
      this.elems = $('#qunit-fixture').children();
    }
  });

  test('is chainable', 1, function() {
    // Not a bad test to run on collection methods.
    strictEqual(this.elems.fragment(), this.elems, 'should be chaninable');
  });

  module('set data with JS', {
      setup: function() {
          this.f = $('#qunit-fixture').children().first().fragment(o);
      }
  });

  test('set name', 1, function() {
    equal(this.f.fragment('option', 'name'), o.name, 'name not set');
  });
  test('set desc', 1, function() {
    equal(this.f.find('.bio-desc').text(), o.desc, 'desc not set');
  });
  test('set length', 1, function() {
    equal(this.f.find('.bio-length').text(), o.length, 'length not set');
  });
  test('set url', 1, function() {
    equal(this.f.find('.bio-url').attr('href'), o.url, 'url not set');
  });

  module('set data with attrs', {
      setup: function() {
          this.f = $('#qunit-fixture').children().first()
            .attr(o).attr('href',o.url).fragment();
      }
  });

  test('set name', 1, function() {
    equal(this.f.fragment('option', 'name'), o.name, 'name not set');
  });
  test('set desc', 1, function() {
    equal(this.f.find('.bio-desc').text(), o.desc, 'desc not set');
  });
  test('set length', 1, function() {
    equal(this.f.find('.bio-length').text(), o.length, 'length not set');
  });
  test('set url', 1, function() {
    equal(this.f.find('.bio-url').attr('href'), o.url, 'url not set');
  });

  module('update data', {
      setup: function() {
          this.f = $('#qunit-fixture').children().first().fragment(o);
      }
  });

  test('update name', 1, function() {
      this.f.fragment('option', 'name', 'New Name');
      equal(this.f.fragment('option', 'name'), 'New Name', 'name not updated');
  });
  test('update desc', 1, function() {
      this.f.fragment('option', 'desc', 'New Desc');
      equal(this.f.find('.bio-desc').text(), 'New Desc', 'desc not updated');
  });
  test('update length', 1, function() {
      this.f.fragment('option', 'length', 256);
      equal(this.f.find('.bio-length').text(), 256, 'length not updated');
  });
  test('update url', 1, function() {
      this.f.fragment('option', 'url', 'http://www.newurl.com/');
      equal(this.f.find('.bio-url').attr('href'), 'http://www.newurl.com/', 'url not updated');
  });

  module(':fragment selector', {
    setup: function() {
      this.elems = $('#qunit-fixture').children();
      this.elems.last().fragment(o);
    }
  });

  test(':bio-fragment', 1, function() {
    // Use deepEqual & .get() when comparing jQuery objects.
    deepEqual(this.elems.filter(':bio-fragment').get(), this.elems.last().get(), 
              'fragment selector');
  });

}(jQuery));
