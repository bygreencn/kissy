/**
 * @ignore
 * @fileOverview getScript support for css and js callback after load
 * @author yiminghe@gmail.com, lifesinger@gmail.com
 */
(function (S) {

    var MILLISECONDS_OF_SECOND = 1000,
        doc = S.Env.host.document,
        utils = S.Loader.Utils,
        Path = S.Path,
        jsCssCallbacks = {};

    S.mix(S, {
        /**
         * Load a JavaScript/Css file from the server using a GET HTTP request,
         * then execute it.
         *
         * for example:
         *      @example
         *      getScript(url, success, charset);
         *      // or
         *      getScript(url, {
         *          charset: string
         *          success: fn,
         *          error: fn,
         *          timeout: number
         *      });
         *
         * @param {String} url resource's url
         * @param {Function|Object} [success] success callback or config
         * @param {Function} [success.success] success callback
         * @param {Function} [success.error] error callback
         * @param {Number} [success.timeout] timeout (s)
         * @param {String} [success.charset] charset of current resource
         * @param {String} [charset] charset of current resource
         * @return {HTMLElement} script/style node
         * @member KISSY
         */
        getScript: function (url, success, charset) {

            var src = utils.resolveByPage(url).toString(),
                config = success,
                css = 0,
                error,
                timeout,
                timer;

            if (S.startsWith(Path.extname(url).toLowerCase(), '.css')) {
                css = 1;
            }

            if (S.isPlainObject(config)) {
                success = config.success;
                error = config.error;
                timeout = config.timeout;
                charset = config.charset;
            }

            var callbacks = jsCssCallbacks[src] = jsCssCallbacks[src] || [];

            callbacks.push([success, error]);

            if (callbacks.length > 1) {
                // S.log(' queue js : ' + callbacks.length + ' : for :' + url + ' by ' + (config.source || ''));
                return callbacks.node;
            } else {
                // S.log('init getScript : by ' + config.source);
            }

            var head = utils.docHead(),
                node = doc.createElement(css ? 'link' : 'script'),
                clearTimer = function () {
                    if (timer) {
                        timer.cancel();
                        timer = undefined;
                    }
                };

            if (css) {
                // can not use src.toString
                // ? is escaped when combo in KISSY.Uri
                node.href = url;
                node.rel = 'stylesheet';
            } else {
                node.src = url;
                node.async = true;
            }

            callbacks.node = node;

            if (charset) {
                node.charset = charset;
            }

            var end = function (error) {
                var index = error ? 1 : 0;
                clearTimer();
                var callbacks = jsCssCallbacks[src];
                S.each(callbacks, function (callback) {
                    if (callback[index]) {
                        callback[index].call(node);
                    }
                });
                delete jsCssCallbacks[src];
            };

            //标准浏览器 css and all script
            if ('onload' in node || !css) {
                node.onload = node.onreadystatechange = function () {
                    var readyState = node.readyState;
                    if (!readyState ||
                        readyState == "loaded" ||
                        readyState == "complete") {
                        node.onreadystatechange = node.onload = null;
                        end(0)
                    }
                };
                node.onerror = function () {
                    node.onerror = null;
                    error(1);
                };
            }
            // old chrome/firefox for css
            else {
                utils.pollCss(node, function () {
                    end(0);
                });
            }

            if (timeout) {
                timer = S.later(function () {
                    end(1);
                }, timeout * MILLISECONDS_OF_SECOND);
            }

            head.appendChild(node);
            return node;
        }
    });

})(KISSY);
/*
 yiminghe@gmail.com refactor@2012-03-29
 - 考虑连续重复请求单个 script 的情况，内部排队

 yiminghe@gmail.com 2012-03-13
 - getScript
 - 404 in ie<9 trigger success , others trigger error
 - syntax error in all trigger success
 */