/**
 * @ignore
 * @fileOverview use flash to accomplish cross domain request, usage scenario ? why not jsonp ?
 * @author yiminghe@gmail.com
 */
KISSY.add('ajax/xdr-flash-transport', function (S, io, DOM) {

    var // current running request instances
        maps = {},
        ID = 'io_swf',
    // flash transporter
        flash,
        doc = S.Env.host.document,
    // whether create the flash transporter
        init = false;

    // create the flash transporter
    function _swf(uri, _, uid) {
        if (init) {
            return;
        }
        init = true;
        var o = '<object id="' + ID +
                '" type="application/x-shockwave-flash" data="' +
                uri + '" width="0" height="0">' +
                '<param name="movie" value="' +
                uri + '" />' +
                '<param name="FlashVars" value="yid=' +
                _ + '&uid=' +
                uid +
                '&host=KISSY.require(\'ajax\')" />' +
                '<param name="allowScriptAccess" value="always" />' +
                '</object>',
            c = doc.createElement('div');
        DOM.prepend(c, doc.body || doc.documentElement);
        c.innerHTML = o;
    }

    function XdrFlashTransport(io) {
        S.log('use flash xdr');
        this.io = io;
    }

    S.augment(XdrFlashTransport, {
        // rewrite send to support flash xdr
        send: function () {
            var self = this,
                io = self.io,
                c = io.config,
                xdr = c['xdr'] || {};
            // 不提供则使用 cdn 默认的 flash
            _swf(xdr.src || (S.Config.base + 'ajax/io.swf'), 1, 1);
            // 简便起见，用轮训
            if (!flash) {
                // S.log('detect xdr flash');
                setTimeout(function () {
                    self.send();
                }, 200);
                return;
            }
            self._uid = S.guid();
            maps[self._uid] = self;

            // ie67 send 出错？
            flash.send(c.uri.toString(c.serializeArray), {
                id: self._uid,
                uid: self._uid,
                method: c.type,
                data: c.hasContent && c.query.toString(c.serializeArray) || {}
            });
        },

        abort: function () {
            flash.abort(this._uid);
        },

        _xdrResponse: function (e, o) {
            // S.log(e);
            var self = this,
                ret,
                id = o.id,
                io = self.io;

            // need decodeURI to get real value from flash returned value
            io.responseText = decodeURI(o.c.responseText);

            switch (e) {
                case 'success':
                    ret = { status: 200, statusText: 'success' };
                    delete maps[id];
                    break;
                case 'abort':
                    delete maps[id];
                    break;
                case 'timeout':
                case 'transport error':
                case 'failure':
                    delete maps[id];
                    ret = { status: 500, statusText: e };
                    break;
            }
            if (ret) {
                io._ioReady(ret.status, ret.statusText);
            }
        }
    });

    /*called by flash*/
    io['applyTo'] = function (_, cmd, args) {
        // S.log(cmd + ' execute');
        var cmds = cmd.split('.').slice(1),
            func = io;
        S.each(cmds, function (c) {
            func = func[c];
        });
        func.apply(null, args);
    };

    // when flash is loaded
    io['xdrReady'] = function () {
        flash = doc.getElementById(ID);
    };

    /*
     when response is returned from server
     @param e response status
     @param o internal data
     */
    io['xdrResponse'] = function (e, o) {
        var xhr = maps[o.uid];
        xhr && xhr._xdrResponse(e, o);
    };

    return XdrFlashTransport;

}, {
    requires: ['./base', 'dom']
});