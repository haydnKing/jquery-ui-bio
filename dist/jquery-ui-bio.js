/*! jQuery Ui Bio - v0.1.0 - 2012-09-27
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

/*global next_color:false */
(function($, undefined) {

var baseClasses = 'bio-fragment-list ui-widget ui-state-default';

var test_frag = function(f, filter){
    var r = filter.test(f.fragment('option','name')) || 
        filter.test(f.fragment('option','desc'));
    console.log('test_frag(f,' + filter + ') -> ' + r);
    return r;
};

$.widget("bio.fragmentSelect", {
    options: {
        text: {
            filter: 'filter',
            loading: 'Loading fragments...',
            none_found: 'No fragments found'
        },
        defaultHelper: 'clone',
        height: 400
    },
    _create: function() {
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseClasses);

        this.timeout = null;

        var header  = this.header = $('<div>').addClass('ui-widget-header').appendTo(el);
        var filter = $('<div>')
            .addClass('bio-filter ui-state-default ui-corner-all')
            .appendTo(header);
        this.input = $('<input type="text">')
            .appendTo($('<div>').appendTo(filter))
            .on({
                'focus': function(){self.filter_hint.hide();},
                'blur': function(){
                    if(!$(this).val()){ 
                        self.filter_hint.show();
                        self.filter_clear.hide();
                    }
                },
                'keyup': function(){
                    var v = self.input.val();
                    if(v){
                        self.filter_clear.show();
                    } else{
                        self.filter_clear.hide();
                    }
                    if(self.timeout)
                    {
                        clearTimeout(self.timeout);
                    }
                    self.timeout = setTimeout(function() {
                        self.timeout = null;
                        self.filter(v);
                    }, 500);
                }
            });
        this.filter_hint = $('<div>')
            .addClass('hint')
            .text(o.text.filter)
            .appendTo(filter)
            .on('click', function() {self.input.focus();});
        $('<span>').addClass('ui-icon ui-icon-search').appendTo(filter);
        this.filter_clear = $('<span>').addClass('ui-icon ui-icon-close')
            .hide()
            .appendTo(filter)
            .on('click', function(){
               
            });

        var panel = this.panel = $('<div>').addClass('bio-panel').appendTo(el);

        //copy any initial fragments
        var list = el.find('ul');
        if(list.length === 1){
            list.detach().appendTo(panel);
        }
        else{
            list = $('ul').appendTo(panel);
        }

        //and initialise them
        list.find('li').each(function() {
            $(this).addClass('ui-state-default')
                .children().fragment({helper: o.defaultHelper});
        });

        //interaction clues
        list.on({
            'mouseenter': function(){
                $(this).addClass('ui-state-hover');
            },
            'mouseleave dragstop': function(){
                $(this).removeClass('ui-state-hover');
            }
        }, 'ul > li');

        self._set_height();
    },
    filter: function(str){
        console.log('str = '+str);
        var reg = new RegExp(str, 'i');
        this.el.find(':bio-fragment').each( function(){
            var f = $(this);
            if(test_frag(f, reg)){
                f.parent().show();
            }
            else{
                f.parent().hide();
            }
        });
    },
    showAll: function(){
        this.el.find(':bio-fragment').show();
    },
    _set_height: function(){
        this.panel.outerHeight(this.options.height - this.header.outerHeight());
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

$.widget("bio.tooltip", {
    options: {
        mouseTarget: 'this', //'this', a jQuery selector or an object
        openDelay: 250,
        closeDelay: 250,
        openAnim: 0,
        closeAnim: 200
    },
    _create: function() {
        var el = this.el = $(this.element[0]).hide();
        var o = this.options,
            self = this;

        if(typeof o.mouseTarget === "string"){
            if(o.mouseTarget === "this"){
                o.mouseTarget = el;
            }
            else{
                o.mouseTarget = el.find(o.mouseTarget);
            }
        }

        this.timeout = null;
        this._is_open = false;
        this._enabled = true;

        o.mouseTarget.mouseenter(function(){self._on_enter();})
          .mouseleave(function(){self._on_leave();});
    },
    close: function(){
        this._clear_timeout();
        this.el.fadeOut(this.options.closeAnim);
        this._is_open = false;
        this._trigger('close');
    },
    open: function(){
        this._clear_timeout();
        this.el.fadeIn(this.options.openAnim);
        this._is_open = true;
        this._trigger('open');
    },
    disable: function(){
        this.close();
        this._enabled = false;
    },
    enable: function(){
        this._enabled = true;
    },
    _on_enter: function(){
        if(!this._enabled) {return;}

        var self = this,
            o = this.options;

        //don't close
        this._clear_timeout();

        //if we're closed, open
        if(!this._is_open){
            this.timeout = setTimeout(function() {
                self.open();
            }, o.openDelay);
        }
    },
    _on_leave: function(){
        if(!this._enabled) {return;}

        var self = this,
            o = this.options;

        //don't open
        this._clear_timeout();

        //close if we're open
        if(this._is_open){
            this.timeout = setTimeout(function() {
                self.close();
            }, o.closeDelay);
        }
    },
    _clear_timeout: function()
    {
        if(this.timeout != null){
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
});
        
}(jQuery));

/*global next_color:false */
(function($, undefined) {

var baseClasses = 'bio-fragment ui-widget ui-state-default',
    hoverClasses = 'ui-state-hover ui-state-active',
    disabledClasses = 'ui-state-disabled',
    infoClasses = 'ui-corner-all';

$.widget("bio.fragment", $.ui.draggable, {
    options: {
        name: null,
        desc: null,
        length: null,
        url: undefined,
        color: undefined,
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

        this.name = $("<p>")
            .text(o.name)
            .addClass('bio-name')
            .appendTo(el);
        this.info = $("<div>")
            .hide()
            .addClass(infoClasses)
            .appendTo(el)
            .mousedown(function(ev){
                //stop the fragment from being dragged
                ev.stopPropagation();
            });
        this.refreshInfo();            
        
        el.css({
            'background-color': o.color,
            'border-color': o.color
        });

        if(o.helper === 'clone'){
            o.helper = function(){
                return $('<div>')
                    .addClass(baseClasses)
                    .css({
                        'background-color': o.color,
                        'border-color': o.color,
                        'z-index': 100
                    })
                    .append($("<p>").text(o.name));
            };
        }

        el.draggable(o).on('dragstart', function(){
            self.info.tooltip('disable');
        }).on('dragstop', function(){
            self.info.tooltip('enable');
        });
        this.info.tooltip({
            'mouseTarget': this.el,
            openDelay: 500
        });
    },
    _init: function() {
    },
    option: function(name, value)
    {
        var o = this.options;

        if(value == null) {
            return o[name] || this.$el.draggable(name);
        }
        o[name] = value;
        switch(name)
        {
            case 'name':
                this.name.text(value);
                break;
            case 'desc':
            case 'length':
            case 'url':
                this.refreshInfo();
                break;
            case 'color':
                this.el.css({
                    'background-color':this.options.color,
                    'border-color':this.options.color
                });
                break;
            case 'draggable':
                this.el.draggable( (value) ? 'enable' : 'disable');
                break;
            default:
                this.el.draggable(name, value);
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
    }
}); 

}(jQuery));
