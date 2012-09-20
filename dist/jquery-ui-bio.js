/*! jQuery Ui Bio - v0.1.0 - 2012-09-20
* https://github.com/Gibthon/jquery-ui-bio
* Copyright (c) 2012 Haydn King; Licensed MIT, GPL */

(function($) {

  // Collection method.
  $.fn.awesome = function() {
    return this.each(function() {
      $(this).html('awesome');
    });
  };

  // Static method.
  $.awesome = function() {
    return 'awesome';
  };

  // Custom selector.
  $.expr[':'].awesome = function(elem) {
    return elem.textContent.indexOf('awesome') >= 0;
  };

}(jQuery));

(function($, undefined) {

var baseClasses = 'bio-fragment ui-widget ui-state-default',
    hoverClasses = 'ui-state-hover ui-state-active',
    disabledClasses = 'ui-state-disabled';

$.widget("bio.fragment", $.ui.draggable, {
    options: {
        name: 'Unnamed Fragment',
        description: '',
        length: 0,
        url: undefined,
        color: undefined
    },
    _create: function() {
        console.log('fragment._create');
        var o = this.options;
        var el = this.el = $(this.element[0])
            .addClass(baseClasses);
        this.name = $("<p>")
            .addClass('bio-fragment-name')
            .text(o.name)
            .appendTo(el);
        
        if(o.color != null) {
            el.css({
                'background-color':this.options.color,
                'border-color':this.options.color
            });
        }

        el.draggable(o);
    },
    _init: function() {
        console.log('fragment._init');
    },
    option: function(name, value)
    {
        if(value == null) {
            return this.options[name] || this.$el.draggable(name);
        }
        switch(name)
        {
            case 'name':
                this.name.text(value);
                break;
            case 'description':
                break;
            case 'length':
                break;
            case 'url':
                break;
            case 'color':
                this.el.css({
                    'background-color':this.options.color,
                    'border-color':this.options.color
                });
                break;
            case 'draggable':
                break;
            default:
                this.el.draggable(name, value);
        }
        this.options[name] = value;
        return this;
    }
}); 

}(jQuery));
