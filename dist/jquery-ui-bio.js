/*! jQuery Ui Bio - v0.1.0 - 2012-09-28
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

var baseClasses   = 'bio-fragment-select ui-widget',
    panelClasses  = 'bio-panel ui-widget-content ui-state-default',
    bottomClasses = 'bio-bottom ui-widget ui-widget-header',
    defaultIcon   = 'ui-icon-carat-1-e';

var test_frag = function(f, filter){
    return filter.test(f.fragment('option','name')) || 
        filter.test(f.fragment('option','desc'));
};

$.widget("bio.fragmentSelect", {
    options: {
        text: {
            title: 'Fragment Selector',
            filter: 'filter',
            loading: 'Loading fragments...',
            none_loaded: 'No fragments are loaded',
            none_matching: 'No fragments match the filter',
            showing_all: 'Showing %total %fragment',
            showing_filter: 'Showing %filter of %total %fragment',
            fragment: 'fragment',
            fragments: 'fragments'
        },
        defaultHelper: 'clone',
        height: 400
    },
    _create: function() {
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseClasses);

        this.timeout = null;

        var header = this.header = $('<div>').addClass('ui-widget-header').appendTo(el);
        var panel = this.panel = $('<div>').addClass(panelClasses).appendTo(el);
        var base = $('<div>').addClass(bottomClasses).appendTo(el);
        
        $('<span>').addClass('title').text(o.text.title).appendTo(header);
        $('<span>').addClass('help').appendTo(header);

        var searchbar = $('<div>').addClass('searchbar').appendTo(panel);
        
        this.search = $('<div>')
            .search({
                text: {search: 'filter'},
                change: function(){
                    self.filter(self.search.search('value'));
                }
            })
            .appendTo(searchbar);
        
        this.list = $('<div>').addClass('list ui-state-default').appendTo(panel);
        var s = $('<div>').addClass('ui-state-default statusbar')
            .appendTo(panel);
        this.status_icon = $('<span>').addClass('ui-icon').appendTo(s);
        this.status_text = $('<p>').appendTo(s);

        //copy any initial fragments
        var list = el.find('ul');
        if(list.length === 1){
            list.detach().appendTo(this.list);
        }
        else{
            list = $('ul').appendTo(this.list);
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

        this.setStatus();
        this._set_height();

        if(el.hasClass('ui-corner-all')){
            header.addClass('ui-corner-top');
            this.search.addClass('ui-corner-all');
            base.addClass('ui-corner-bottom');
        }
    },
    filter: function(str){
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
        this.setStatus();
    },
    showAll: function(){
        this.el.find(':bio-fragment').show();
    },
    setStatus: function(text, icon) {
        var tot = this.list.find(':bio-fragment').length;
        var fil = this.list.find(':bio-fragment:visible').length;
        if(text == null){
            var t = this.options.text;
            if(tot === 0 && fil === 0) {
                text = t.none_loaded;
                icon = 'ui-icon-alert';
            }
            else if(tot > 0 && fil === 0) {
                text = t.none_matching;
                icon = 'ui-icon-alert';
            }
            else if(tot === fil) {text = t.showing_all;}
            else {text = t.showing_filter;}
        }
        this.status_icon.attr('class', 'ui-icon ' + (icon || defaultIcon));
        this.status_text.text( this._get_text(text, fil, tot));
    },
    _set_height: function(){
        var others = 0;
        this.panel.siblings().add(this.list.siblings()).each(function() {
            others += $(this).outerHeight();
        });
        this.list.outerHeight(this.options.height - others);
    },
    _get_text: function(str, filter, total){
        var t = this.options.text;
        return str
            .replace('%filter', filter)
            .replace('%total', total)
            .replace('%fragment', (total === 1)? t.fragment : t.fragments);
    }
});

}(jQuery));


(function($, undefined) {

var baseClasses    = 'bio-search ui-widget',
    defaultClasses = 'ui-state-default',
    hoverClasses   = 'ui-state-hover',
    focusClasses   = 'ui-state-highlight';

$.widget("bio.search", {
    options: {
        text: {
            search: 'search'
        },
        // events
        change: undefined 
    },
    _create: function() {
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseClasses);

        this.timeout = null;

        el.addClass(baseClasses).addClass(defaultClasses);
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
                    self.el
                        .removeClass(defaultClasses)
                        .removeClass(hoverClasses)
                        .addClass(focusClasses);
                },
                'blur': function(){
                    if(!$(this).val()){ 
                        self.search_hint.show();
                        self.search_clear.hide();
                    }
                    self.el
                        .removeClass(focusClasses)
                        .addClass(defaultClasses);
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
                        self._trigger('change', v);
                    }, 500);
                }
            });
        this.el.on({
            'click': function() {
                self.input.focus();
            },
            'mouseenter': function() {
                if(self.el.hasClass(defaultClasses)){
                    self.el
                        .removeClass(defaultClasses)
                        .addClass(hoverClasses);
                }
            },
            'mouseleave': function() {
                if(self.el.hasClass(hoverClasses)){
                    self.el
                        .removeClass(hoverClasses)
                        .addClass(defaultClasses);
                }
            }
                    
        });
        this.search_clear.on('click', function(){
            self.input.val('');
            self.search_clear.hide();
            self._trigger('change');
        });
    },
    value: function(v) {
        if(v!=null){
            this.input.val(v);
            this._trigger('change');
            return;
        }
        return this.input.val();
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

var baseClasses = 'bio-fragment ui-widget',
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
