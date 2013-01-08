/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
(function($, undefined) {

var baseC       = 'bio-sequence-loader ui-widget',
    progressC   = 'loader-progress',
    warningC    = 'loader-warnings ui-widget-content ui-state-error',
    headerC     = 'ui-widget-header',
    wtitleC     = 'warning-title',
    closeC      = 'ui-icon ui-icon-close',
    listC       = 'ui-widget-content';

var hasXHR2 = function() {
    return window.XMLHttpRequest && ('upload' in new XMLHttpRequest());
};
var hasWebWorker = function() {
    return typeof(Worker) !== 'undefined';
};

$.widget("bio.sequenceLoader", {
    options: {
        text: {
            warnNoXHR2: 'Warning: Your browser does not appear to support '+
                'XMLHttpRequest Level 2. You will not see download progress '+
                '- please consider updating your browser.',
            warnNoWebWorkers: 'Warning: Your browser does not appear to ' +
                'support webWorkers. The browser may freeze during loading '+
                '- please consider updating your browser.',
            states: ['Downloading', 'Processing'],
            warnings: 'Warnings'
        }
    },
    _create: function() {
        this.el = $(this.element[0])
            .addClass(baseC);
        this._build_elements();

        this.el.append(this.warnings)
            .append(this.progress);

        if(this.warnings.find('li').length > 0){
            this._show_warnings();
        }
        
    },
    _init: function() {
    },
    _build_elements: function() {
        var self = this, t = this.options.text;
        this.progress = $('<div>')
            .addClass(progressC)
            .progressbar({max:100.0});

        this.warnings = $('<div>')
            .addClass(warningC)
            .append($('<div>')
                .addClass(headerC)
                .append($('<span>')
                    .addClass(wtitleC)
                    .text(t.warnings))
                .append($('<span>')
                    .addClass(closeC)
                    .click(function() {
                        self._hide_warnings();
                    })))
            .append($('<ul>')
                .addClass(listC)
                .append(this._get_warnings()));

    },
    _hide_warnings: function(){
        this.warnings.slideUp();
    },
    _show_warnings: function(){
        this.warnings.slideDown();
    },
    _get_warnings: function(){
        var self = this, t = this.options.text;
        var w = $();
        if(!hasXHR2()){
            w = w.add($('<li>'+t.warnNoXHR2+'</li>'));
        }
        if(!hasWebWorker()){
            w = w.add($('<li>'+t.warnNoWebWorkers+'</li>'));
        }
        return w;
    },
    _update: function(done, total, state) {
        this.progress.progressbar('value', 50.0 * state + 50.0 * (done / total));
        this._trigger('update', null, {
            'state': this.options.states[state],
            'done': done,
            'total': total
        });
    }
});

}(jQuery));

