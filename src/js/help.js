/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
/*global next_color:false */
(function($, undefined) {

var iconStyle = 'bio-help',
    tooltipStype = 'tip';

$.widget("bio.help", {
    options: {
        helpstring: 'Some Help',
        open: undefined,
        close: undefined
    },
    _init: function() {
        var self = this,
            el = this.el = $(this.element[0]),
            tip = $('<div>').addClass()

    },
    _create: function() {
    }
}(jQuery))
