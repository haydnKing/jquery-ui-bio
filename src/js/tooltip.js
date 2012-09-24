/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
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
