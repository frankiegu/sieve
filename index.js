var models = require('./types');
var cookie = require('js-cookie');
var fetch  = require('whatwg-fetch').fetch;
var qs     = require('querystring');

function App(opts) {
    this.opts  = {
        storage_key_name: 'see_alloc',
        base_url        : 'http://localhost:8080'
    };

    if (opts) {
        for (var k in this.opts) {
            if (opts.hasOwnProperty(k)) {
                this.opts[k] = opts[k];
            }
        }
    }
}

App.prototype.allocate = function () {
    var that = this;

    return getStorage(this.opts.storage_key_name)
        .then(function (allocstr) {
            var uri = that.opts.base_url +
                '/allocate?' +
                qs.stringify({ current: allocstr });

            return window.fetch(uri, { method: 'GET' });
        })
        .then(function (resp) {
            if (!resp.ok) {
                throw new Error(resp.status + ': ' + resp.statusText);
            }
            return resp.json();
        })
        .then(function (body) {
            return setStorage(that.opts.storage_key_name, body.data.serialized)
                .then(function () {
                    return body;
                });
        })
        .then(function (body) {
            return body.data.experiments.map(function (exp) {
                return new models.ExperimentT(exp);
            });
        });
};

App.prototype.track = function (event, params) {
    var that = this;

    return getStorage(this.opts.storage_key_name)
        .then(function (allocstr) {
            params.alloc = allocstr;
            params.event = event;
            var uri      = that.opts.base_url + '/track?' + qs.stringify(params);

            return window.fetch(uri, { method: 'GET' });
        })
        .then(function (resp) {
            if (!resp.ok) {
                throw new Error(resp.status + ': ' + resp.statusText);
            }
            return true;
        });
};

function getStorage(key) {
    return Promise.resolve(cookie.get(key));
}

function setStorage(key, val) {
    return Promise.resolve(cookie.set(key, val));
}

module.exports = App;
