/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global next_color:false */
(function($, undefined) {

var baseC = 'bio-statusbar ui-widget-content ui-state-default',
    iconC = 'ui-icon';

var reg = /%\(([\w]+)\)/g,
    defaultState = 'default';

$.widget("bio.statusBar", {
    options: {
        message: null,
        state: null,
        text: {
            defaultMessage: 'Ready'
        },
        defaultState: 'default',
        states: {
            'default': {'icon': 'ui-icon-circle-triangle-e', 'state': ''},
            'info': {'icon': 'ui-icon-info', 'state': ''},
            'warning': {'icon': 'ui-icon-alert', 'state': 'ui-state-highlight' },
            'error': {'icon': 'ui-icon-alert', 'state': 'ui-state-error'},
            'loading': {'icon': 'ui-icon-refresh', 'state': 'ui-state-highlight'},
            'ok': {'icon': 'ui-icon-circle-check', 'state': ''},
            'add': {'icon': 'ui-icon-circle-plus', 'state': 'ui-state-highlight'},
            'remove': {'icon': 'ui-icon-circle-minus', 'state': 'ui-state-highlight'},
            'saved': {'icon': 'ui-icon-disk', 'state': 'ui-state-highlight'}
        }
    },
    _create: function() {
        var self = this,
            o = this.options;
        
        this.el = $(this.element[0])
            .addClass(baseC);


        this.icon = $('<span>')
            .addClass(iconC)
            .appendTo(this.el);
        this.text = $('<p>')
            .appendTo(this.el);
        this.set(o.message || o.text.defaultMessage);
    },
    //set( string msg, [object format], [string state])
    set: function(msg, format, state) {
        msg = msg || this.options.text.defaultMessage;
        //if format was omitted
        if(typeof(format) === 'string' || state == null){
            state = format;
            format = null;
        }
        state = state || this.options.defaultState;

        if(format != null){
            msg = this._format(msg, format);
        }

        //get the state
        state = this.options.states[state];
        
        if(typeof(state) === 'undefined'){
            throw("Error: unknown state \'"+state+"\'");
        }

        //set everything
        this.text.text(msg);
        this.icon.attr('class', iconC + ' ' + state.icon);
        this.el.attr('class', baseC + ' ' + state.state);
    },
    _format: function(s, fmt){
        return s.replace(reg, function(m, $0, offset){
            //don't replace if it's excaped
            if(offset > 0 && s.charAt(offset-1) === '\\'){
                return '%(' + $0 + ')';
            }
            return String(fmt[$0]);
        });
    }
});


}(jQuery));
