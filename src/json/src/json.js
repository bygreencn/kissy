/**
 * @ignore
 * @fileOverview adapt json2 to kissy
 */
KISSY.add('json', function (S, JSON) {

    /**
     * Provide json utils for KISSY.
     * @class KISSY.JSON
     * @singleton
     */
    return S.JSON = {

        /**
         * Parse json object from string.
         * @param text
         * @return {Object}
         */
        parse: function (text) {
            // 当输入为 undefined / null / '' 时，返回 null
            if (text == null || text === '') {
                return null;
            }
            return JSON.parse(text);
        },
        /**
         * serialize json object to string.
         * @method
         * @param {Object} jsonObject
         * @return {String}
         */
        stringify: JSON.stringify
    };
}, {
    requires: ["json/json2"]
});
