/*
 * jquery-ui-bio
 * https://github.com/Gibthon/jquery-ui-bio
 *
 * Copyright (c) 2012 Haydn King & Gibthon Developers
 * Licensed under the MIT, GPL licenses.
 */
this.bio = this.bio || {};

(function($, undefined) {

    /*
     * data_read: read JSON data from the server
     *  - cb: function(data) to be called on success
     *  - target: either
     *      + url to fetch data
     *      + function(cb, send_data) -> XHR
     *  - send_data: OPTIONAL data to send to the server
     *  - event_object: OPTIONAL jQuery object on which to fire events
     *  - event_prefix: OPTIONAL only valid if event_object is set
     *      if supplied events are triggered with type
     *      event_prefix + '.' + event
     */
    this.bio.read_data = function(
            cb, target, send_data, event_object, event_prefix) {
        var xhr;

        //normalise input
        if(!$.isFunction(cb)){
            throw('Error: cb must be a function');
        }
        if(target == null){
            throw('Error: target must be provided');
        }
        if(send_data == null){
            event_prefix = '';
            event_object = null;
            send_data = {};
        }
        else if(send_data instanceof $){
            event_prefix = event_object || '';
            event_object = send_data;
            send_data = {};
        }
        event_prefix = event_prefix || '';
        send_data = send_data || {};
        if(event_prefix !== ''){event_prefix = event_prefix + '.';}

        var fire_evt = function(type, data){
            if(event_object != null){
                event_object.trigger(event_prefix+type, data);
            }
        };

        //send the request
        if(typeof(target) === 'string'){
            xhr = $.ajax(target, {
                data: send_data,
                success: cb,
                error: function(jqXHR, status, errorThrown){
                    fire_evt('error', {status: status, message: errorThrown});
                }
            });
        }
        else if($.isFunction(target)){
            xhr = target(cb, send_data);
            xhr.onerror = function(prog) {
                fire_evt('error', {status: 'error', message: xhr.statusText});
            };
        }

        $(xhr).on('progress', function(e){
            var oe = e.originalEvent;
            // Make sure the progress event properties get copied over:
            e.lengthComputable = oe.lengthComputable;
            e.loaded = oe.loaded;
            e.total = oe.total;
            if(e.lengthComputable) {
                fire_evt('progress', e);
            }
        });

    };
}(jQuery));
