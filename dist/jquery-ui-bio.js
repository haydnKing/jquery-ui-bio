/*! jQuery Ui Bio - v0.1.0 - 2012-11-11
* https://github.com/Gibthon/jquery-ui-bio
* Copyright (c) 2012 Haydn King; Licensed MIT, GPL */

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

var iconStyle = 'bio-help ui-widget',
    tooltipStyle = 'tip ui-widget-content ui-corner-inherit',
    cornerStyle = 'ui-corner-all';

$.widget("bio.help", {
    options: {
        helphtml: 'Some Help',
        open: undefined,
        close: undefined
    },
    _init: function() {
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(iconStyle),
            tip = $('<div>').addClass(tooltipStyle).appendTo(el);
        
        if(el.hasClass('ui-corner-all')){
            tip.addClass('ui-corner-all');
        }

        this.help = $('<p>').html(o.helphtml).appendTo(tip);
        tip.tooltip({
            mouseTarget: el
        });

    },
    _create: function() {
    },
    setHelp: function(help){
        this.options.helphtml(help);
        this.help.html(help);
    }
});

}(jQuery));

/*global next_color:false */
(function($, undefined) {

var baseClasses = 'ui-widget bio-panel',
    headerClasses = 'ui-widget-header ui-state-default',
    panelClasses  = 'bio-panel-content ui-state-default',
    panelItemClasses = 'ui-widget-content ui-state-default',
    statusClasses = 'ui-state-default ui-widget-content statusbar',
    footerClasses = 'bio-footer ui-widget-header ui-state-default',
    defaultIcon   = 'ui-icon-circle-triangle-e';

$.widget("bio.panel", {
    options: {
        title: undefined,
        help: undefined,
        text: {
            defaultTitle: 'Bio Panel',
            defaultHelp: '',
            defaultStatus: 'Ready'
        },
        height: 400,
        showStatus: true
    },
    _create: function() {
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseClasses);

        o.title = o.title || o.text.defaultTitle;
        o.help = o.help || o.text.defaultHelp;
        o.color = o.color || next_color();

        var head = this.head = $('<div>').addClass(headerClasses).appendTo(el);
        var panel = this.panel = $('<div>').addClass(panelClasses).appendTo(el);
        var s = this.status_bar = $('<div>').addClass(statusClasses).appendTo(el);
        var foot = this.foot = $('<div>').addClass(footerClasses).appendTo(el);
        
        //define how items should scale with height
        this.stretch_factors = {'panel': 1};

        this.title = $('<span>').addClass('title').text(o.title).appendTo(head);
        var h = this.help = $('<span>').appendTo(head).help({
            helphtml: o.help
        });

        this.status_icon = $('<span>').addClass('ui-icon').appendTo(s);
        this.status_text = $('<p>').appendTo(s);
        if(!o.showStatus){
            s.hide();
        }

        if(el.hasClass('ui-corner-all')){
            head.addClass('ui-corner-top');
            foot.addClass('ui-corner-bottom');
            h.addClass('ui-corner-all');
        }
    },
    _init: function(){
        this._set_height();
    },
    option: function(key, value) {
        if(value == null){
            return this.options[key];
        }
        switch(key){
            case 'title':
                this.head.find('span').text(value);
                break;
            case 'help':
                this.help('setHelp', value);
                break;
            case 'height':
                this._set_height(value);
                break;
        }
        this.options[key] = value;
    },
    setStatus: function(text, icon) {
        this.status_icon.attr('class', 'ui-icon ' + (icon || defaultIcon));
        this.status_text.text(text || this.options.text.defaultStatus);
    },
    _set_height: function(){
        var stretch = 0, total = 0;
        for(var i in this.stretch_factors)
        {
            total += this.stretch_factors[i];
            stretch += this[i].outerHeight();
        }
        var fixed = this.el.outerHeight() - stretch;
        stretch = Math.max(0, this.options.height - fixed);
        console.log('Stretch = ' + stretch);
        for(i in this.stretch_factors)
        {
            console.log('this['+i+'].outerHeight('+(stretch * this.stretch_factors[i] / total)+');');
            this[i].outerHeight(stretch * this.stretch_factors[i] / total);
        }
    },
    _add_to_panel: function($item){
        $item.addClass(panelItemClasses);
        this.panel.append($item);
        return $item;
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

var baseClasses    = 'bio-search ui-widget',
    defaultClasses = 'ui-state-default',
    hoverClasses   = 'ui-state-hover',
    focusClasses   = 'ui-state-focus';

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
                        .removeClass(hoverClasses)
                        .addClass(focusClasses);
                },
                'blur': function(){
                    if(!$(this).val()){ 
                        self.search_hint.show();
                        self.search_clear.hide();
                    }
                    self.el
                        .removeClass(focusClasses);
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
                        .addClass(hoverClasses);
                }
            },
            'mouseleave': function() {
                if(self.el.hasClass(hoverClasses)){
                    self.el
                        .removeClass(hoverClasses);
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


/*global next_color:false Raphael:false */
(function($, undefined) {

var baseClasses = 'bio-fragment ui-widget',
    hoverClasses = 'ui-state-hover ui-state-active',
    disabledClasses = 'ui-state-disabled',
    infoClasses = 'ui-corner-all';

var tail_len = 10;

var makeLinearFrag = function(w, h, right) {
    if(right == null){
        right = true;
    }
    var h2 = h / 2;
    var wa = w - h2;
    var t = (right) ? h2 : -h2;
    var x0= (right) ? 0  :  h2;
    var s = 'M'+x0+',0 h'+wa+' l'+h2+','+h2+' l'+(-h2)+','+h2+
            ' h'+(-wa)+' l'+h2+','+(-h2)+' z';
    return s;
};

$.widget("bio.fragment", {
    options: {
        name: null,
        desc: null,
        length: null,
        url: undefined,
        color: undefined,
        width: undefined, //7em
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
        o.width = o.width || el.width();
        el.width(o.width);

        var w = el.width(),
            h = el.height();

        this.paper = Raphael(this.element[0], w, h);
        this.frag = this.paper.path('');
        this.name = this.paper.text(w/2, h/2, this.options.name).attr({
                fill: 'white',
                font: 'inherit'
            });


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
            'border-color': o.color
        });

        if(o.helper === 'clone'){
            o.revert = true;
            o.helper = function(){
                return $('<div>').addClass(baseClasses).css('z-index', 200)
                    .append(el.children('svg').clone());
            };
        }

        this.info.tooltip({
            'mouseTarget': this.el,
            openDelay: 500
        });

        this._redraw_frag();
        this._set_color();
    },
    _init: function() {
    },
    option: function(name, value)
    {
        var o = this.options;

        if(value == null) {
            return o[name];
        }
        o[name] = value;
        switch(name)
        {
            case 'name':
                this._redraw_frag();
                break;
            case 'desc':
            case 'length':
            case 'url':
                this.refreshInfo();
                break;
            case 'width':
                this._redraw_frag();
                break;
            case 'color':
                this.el.css({
                    'border-color':this.options.color
                });
                this._anim_color();
                break;
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
    },
    disable: function() {
        this.info.tooltip('disable');
    },
    enable: function() {
        this.info.tooltip('enable');
    },
    ghost: function(g) {
        if(g == null) {g = true;}
        if(!g) {
            this.name.attr('opacity', 1.0);
            this._set_color();
            this.frag.attr('stroke-dasharray', '');
        }
        else {
            this.name.attr('opacity', 0.0);
            this.frag.attr({
                'fill': null,
                'stroke': '#555555',
                'stroke-dasharray': '-'
            });
        }
    },
    _set_color: function() {
        var hsl = this.options.color.match(/\d+/g);
        this.frag.attr({
            fill: Raphael.hsl(hsl[0], hsl[1], hsl[2]),
            stroke: Raphael.hsl(hsl[0], hsl[1], Math.max(0, hsl[2]-10))
        });
    },
    _anim_color: function() {
        var hsl = this.options.color.match(/\d+/g);
        var a = Raphael.animation({
            fill: Raphael.hsl(hsl[0], hsl[1], hsl[2]),
            stroke: Raphael.hsl(hsl[0], hsl[1], Math.max(0, hsl[2]-10))
        }, 1000);
        this.frag.animate(a.delay(100));
    },
    _redraw_frag: function()
    {
        var w = this.el.width(),
            h = this.el.height();

        this.paper.setSize(w,h);
        this.frag.attr({
            'path': makeLinearFrag(w,h)
        });

        this.name.attr({
            x: w/2, 
            y: h/2, 
            text: this.options.name
        });

        var l = this.options.name.length - 1;
        while((this.name.getBBox().width + h) > w){
            l -= 1;
            this.name.attr({text: this.options.name.substr(0, l)+'...'});           
        }
    }
}); 

}(jQuery));

/*global next_color:false */
(function($, undefined) {

var baseClasses   = 'bio-fragment-select ui-widget',
    defaultIcon   = 'ui-icon-circle-triangle-e';

var test_frag = function(f, filter){
    return filter.test(f.fragment('option','name')) || 
        filter.test(f.fragment('option','desc'));
};

$.widget("bio.fragmentSelect", $.bio.panel, {
    options: {
        title: undefined,
        help: undefined,
        text: {
            defaultTitle: 'Fragment Selector',
            defaultHelp: 'Drag and drop fragments to select them',
            filter: 'filter',
            loading: 'Loading fragments...',
            error: 'Error',
            none_loaded: 'No fragments are loaded',
            none_matching: 'No fragments match the filter',
            showing_all: 'Showing %total %fragment',
            showing_filter: 'Showing %filter of %total %fragment',
            fragment: 'fragment',
            fragments: 'fragments',
            cberror: 'An error occurred'
        },
        defaultHelper: 'clone',
        height: 400,
        src: undefined, //string URL or f(cb, error_cb)
        color: null
    },
    _create: function() {
        this._super();
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseClasses);

        this.stretch_factors = {'ul': 1};

        this.timeout = null;

        var searchbar = self._add_to_panel($('<div>').addClass('searchbar'));
        
        this.search = $('<div>')
            .search({
                text: {search: 'filter'},
                change: function(){
                    self.filter(self.search.search('value'));
                }
            })
            .appendTo(searchbar);
        
        this.list = self._add_to_panel($('<div>').addClass('list'));

        //copy any initial fragments
        var ul = this.ul = el.find('ul');
        if(ul.length === 1){
            ul.detach().appendTo(this.list);
        }
        else{
            ul = this.ul = $('<ul>').appendTo(this.list);
        }

        ul.sortable({
            placeholder: 'ui-widget-content',
            connectWith: '.bio-panel ul',
            start: function(ev, ui) {
                $(this).find(':bio-fragment').fragment('disable');
            },
            stop: function(ev, ui) {
                $(this).find(':bio-fragment').fragment('enable');
            },
            receive: function(ev, ui) {
                var f = ui.item.find(':bio-fragment');
                f.fragment('option', 'color', o.color);
                self.setStatus('Added fragment "'+f.fragment('option','name')+'"',
                              'ui-icon-circle-plus');
            },  
            remove: function(ev, ui) {
                var f = ui.item.find(':bio-fragment');
                self.setStatus('Removed fragment "'+f.fragment('option','name')+'"',
                              'ui-icon-circle-minus');
            }
        });

        var success = function(data) {
            //copy into the DOM
            for(var i = 0; i < data.length; i++) {
                var f = data[i];
                $('<li>').append($('<div>').attr({
                    name: f.name,
                    length: f.length,
                    desc: f.desc,
                    href: f.url
                })).appendTo(ul);
            }
            //and initialise them
            ul.find('li').each(function() {
                var w = $(this).width();
                $(this).children().fragment({
                        color: o.color,
                        width: w
                    });
            });
            self.setStatus();
            ul.animate({
                'margin-top': '0px'
            }, 'fast', function() {
                self.list.css('overflow-y', 'auto');
            });

        };


        if(o.src != null) {
            if(typeof(o.src) === 'string') {
                //prepare for animations
                this.list.css('overflow', 'hidden');
                ul.css('margin-top', this.list.height() + 'px');
                //interpret as an url to load from
                this.setStatus(o.text.loading, 'ui-icon-loading');
                $.ajax({
                    'url': o.src,
                    'dataType': 'json',
                    'success': success,
                    'error': function(jqXHR, textStatus, errorThrown) {
                        self.setStatus(String(errorThrown),'ui-icon-alert');
                    }
                });
            }
            else if($.isFunction(o.src)){
                try{
                    o.src(success, function(){
                        self.setStatus(o.text.cberror, 'ui-icon-alert');
                    });
                }
                catch(e){
                    self.setStatus(e.message, 'ui-icon-alert');
                }
            }
            else {
                throw("options.src must be a string URL or a function");
            }
        }

        if(el.hasClass('ui-corner-all')){
            this.search.addClass('ui-corner-all');
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
    _get_text: function(str, filter, total){
        var t = this.options.text;
        return str
            .replace('%filter', filter)
            .replace('%total', total)
            .replace('%fragment', (total === 1)? t.fragment : t.fragments);
    }
});

}(jQuery));


/*global next_color:false Dajaxice:false Raphael:false*/
(function($, undefined) {

var baseClasses = 'bio-sequence-view ui-widget',
    metaClass = 'bio-meta',
    nameClass = 'bio-name',
    descClass = 'bio-desc',
    overviewClass = 'bio-overview',
    viewClass = 'bio-view',
    spacerClass = 'bio-spacer',
    zoomClass = 'bio-zoomview',
    arrowClass = 'bio-slidearrow ui-widget-header',
    leftClass = 'bio-slideleft',
    rightClass = 'bio-slideright';

$.widget("bio.sequenceView", $.bio.panel, {
    options: {
        title: undefined,
        help: undefined,
        text: {
            defaultTitle: 'Fragment View',
            defaultHelp: 'Drag to scroll around in the fragment',
            defaultName: '',
            defaultDesc: '',
            defaultStatus: 'Loading...',
            loading: 'Loading {loaded} of {total}',
            loaded: 'Loaded fragment \'{name}\'',
            sizes: ['B', 'kB', 'MB', 'GB'] 
        },
        height: 400
    },
    _create: function() {
        this._super();
        var self = this,
            o = this.options,
            el = this.el = $(this.element[0]).addClass(baseClasses);

        //set the stretch_factors
        this.stretch_factors = {
            'zoomview': 5,
            'spacer': 1,
            'overview': 2
        };

        var m = this.metadata = $('<div>')
            .addClass(metaClass)
            .appendTo(this.panel);

        this.name = $('<p>')
            .addClass(nameClass)
            .text(o.text.defaultName)
            .appendTo(m);
        this.desc = $('<p>')
            .addClass(descClass)
            .text(o.text.defaultDesc)
            .appendTo(m);

        this.overview = $('<div>')
            .addClass(overviewClass)
            .appendTo(this.panel);
        this.viewpane = $('<div>')
            .addClass(viewClass)
            .appendTo(this.overview);

        this.spacer = $('<div>')
            .addClass(spacerClass)
            .appendTo(this.panel);

        var zv = this.zoomview = $('<div>')
            .addClass(zoomClass)
            .appendTo(this.panel);

        this.right_arrow = $('<div>')
            .addClass(arrowClass + ' ' + rightClass)
            .append($('<span>')
                .addClass('ui-icon ui-icon-triangle-1-e'))
            .appendTo(zv);
        this.left_arrow = $('<div>')
            .addClass(arrowClass + ' ' + leftClass)
            .append($('<span>')
                .addClass('ui-icon ui-icon-triangle-1-w'))
            .appendTo(zv);
        this.progress_bar = $('<div>').progressbar({'value':0, 'max':100})
            .appendTo(zv);


        //Events
        this.right_arrow.add(this.left_arrow).mouseenter(function(){
            $(this).addClass('ui-state-hover');
        }).mouseleave(function() {
            $(this).removeClass('ui-state-hover');
        });

        var xhr = Dajaxice.call('ui_bio_demos.getMetadata', 'POST',
        function(data){
            self._onComplete(data);
        });
        xhr.onprogress = function(e){
            self._onProgress(e.loaded,xhr.getResponseHeader('Content-Length'));
        };
    
    },
    _init: function() {
        this._super();
        this.setStatus(this.options.text.defaultStatus);
    },
    _onProgress: function(loaded, total) {
        var pc = 100.0 * (loaded / total);
        this.progress_bar.progressbar('value', pc);
        var m = this.options.text.loading
            .replace('{loaded}', this._fmtsize(loaded))
            .replace('{total}', this._fmtsize(total));
        this.setStatus(m);
    },
    _onComplete: function(data) {
        var self = this;

        this.setStatus(this.options.text.loaded.replace('{name}', data.name));
        this.name.text(data.name);
        this.desc.text(data.description);
        this.progress_bar.fadeOut(250, function(){
            self._draw_overview();});
        this.meta = data;

    },
    _fmtsize: function(size){
        var i = 0;
        var s = this.options.text.sizes;
        while((size > 1024) && (i < s.length)){
            size = size / 1024.0;
            i = i+1;
        }
        if(i > 0){
            return size.toFixed(1) + s[i];
        }
        return size.toFixed(0) + s[i];

    },
    _draw_overview: function() {
        var w = this.overview.width(),
            h = this.overview.height(),
            pad = 0.05 * w,
            i = 0, j = 0, k = 0,
            feats = [],
            f, done, l;
        var paper = this.opaper = Raphael(this.overview.get(0), w, h);
        this.ow = w;
        this.oh = h;

        paper.path('M'+pad+','+(h/2)+' L'+(w-pad)+','+(h/2))
            .attr({'fill': '#ddd', 'width':'1px'});

        for(i=0; i < this.meta.features.length; i++){
            f = this.meta.features[i];
            feats.push({'feat':f, 'len': Math.abs(f.end-f.start)});
        }
        //sort in decreasing order of length
        feats.sort(function(a,b){return b.len-a.len;});

        var strands = {'fwd': [[]], 'rev': [[]]},
            s;

        var fits; 

        var lanes = this.lanes = {'fwd': [], 'rev':[]};

        for(i=0; i < feats.length; i++){
            f = feats[i].feat;
            done =false;
            s = (f.strand >= 0) ? lanes.fwd : lanes.rev;
            for(j=0; j< s.length; j++){
                l = s[j];
                k = 0;
                fits = true;
                var b;
                for( ; k < l.length; k++){
                    b = l[k];
                    if(((f.start < b.start) && (f.end > b.start)) ||
                        ((f.start < b.end) && (f.end > b.end)) ||
                        ((f.start > b.start) && (f.end < b.end))){
                        fits = false;
                        break;
                    }
                }
                
                if(fits){
                    s[j].push(f);
                    done=true;
                    break;
                }
            }

            if(!done){
                //add a new lane
                s.push([f]);
            }
        }

        var gap = Math.min(h / (2 * (lanes.fwd.length+1)), 
                           h / (2 * (lanes.rev.length+1)));
        var width = w - 2*pad;
        
        var fh,fa,fb;

        this._draw_lanes();
    },
    _draw_lanes: function(dir, i) {
        i = i || 0;
        dir = dir || 'fwd';

        console.log('_draw_lanes(\''+dir+'\', '+i+')');

        //should we stop?
        if(i >= this.lanes[dir].length){
            if(dir === 'fwd'){
                this._draw_lanes('rev', 0);
            }
            return;
        }

        this._draw_lane(dir, i);

        var self = this;
        setTimeout(function(){
            self._draw_lanes(dir, i+1);
        }, 50);

    },
    _draw_lane: function(direction, num){
        var gap = Math.min(this.oh / (2 * (this.lanes.fwd.length+1)), 
                           this.oh / (2 * (this.lanes.rev.length+1)));
        if(direction === 'rev'){
            gap = -gap;
        }
        var i, j, l, f, fh, fa, fb;
        var pad = 0.05 * this.ow,
            width = this.ow - 2 * pad;

        l = this.lanes[direction][num];
        fh = this.oh/2 - (num+1)*gap;
        for(j=0; j < l.length; j++){
            f = l[j];
            fa = width * (f.start / this.meta.length) + pad;
            fb = width * (f.end   / this.meta.length) + pad;                
            this.opaper.path('M'+fa+','+fh+'L'+fb+','+fh);
        }
    }
});

}(jQuery));

