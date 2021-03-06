describe("KISSY ComboLoader", function () {
    var S = KISSY,
        host = location.hostname,
        ComboLoader = S.Loader.Combo;


    it("should works simply", function () {

        var p = KISSY.config("packages");
        for (var i in p) {
            if (p.hasOwnProperty(i)) {
                delete p[i];
            }
        }

        var ret = 0;

        KISSY.config({
            packages: [
                {
                    name: 'tests3',
                    path: '/kissy_git/kissy1.3/src/seed/tests/specs/combo/'
                }
            ]
        });

        S.add({
            "tests3/a": {
                requires: ["./b"]
            },
            "tests3/b": {
                requires: ["./c", "dom"]
            },
            dom: {
                requires: ['ua']
            }
        });

        S.use("tests3/b", function (S, c) {
            expect(c).toBe(3);
            ret = 1;
        });

        waitsFor(function () {
            return ret;
        }, 2000);

    });

    it("should calculate rightly", function () {

        expect(S.Env._comboLoader.loading).toBe(0);

        S.Env.mods = {};

        var l = new ComboLoader(S);

        l.add({
            a: {
                requires: ["b", "c"]
            },
            b: {
                requires: ["d", "e"]
            },
            d: {
                requires: ["f", "g"]
            },
            "h": {
                requires: ["a", "m"]
            }
        });

        var r;
        r = l.calculate(["a", "h"]);
        S.Loader.Utils.createModulesInfo(S, r);
        var c = l.getComboUrls(r);
        expect(c.js[''][0]).toBe(S.Config.base +
            "??a.js,b.js,d.js,f.js,g.js,e.js,c.js,h.js,m.js?t=" + S.Config.tag);
    });

    it("should trunk url by comboMaxFileNum config rightly", function () {

        expect(S.Env._comboLoader.loading).toBe(0);

        S.clearLoader();

        var comboMaxFileNum = S.config('comboMaxFileNum');

        S.config('comboMaxFileNum', 2);

        var l = new ComboLoader(S);

        l.add({
            a: {
                requires: ["b", "c"]
            },
            b: {
                requires: ["d", "e"]
            }
        });

        var r;
        r = l.calculate(["a", "b"]);
        S.Loader.Utils.createModulesInfo(S, r);
        var c = l.getComboUrls(r);
        var js = c.js[''];
        expect(js.length).toBe(3);
        expect(js[0]).toBe(S.Config.base + "??a.js,b.js?t=" + S.Config.tag);
        expect(js[1]).toBe(S.Config.base + "??d.js,e.js?t=" + S.Config.tag);
        expect(js[2]).toBe(S.Config.base + "??c.js?t=" + S.Config.tag);

        S.config('comboMaxFileNum', comboMaxFileNum);
    });

    it("should trunk url by comboMaxUrlLength automatically", function () {

        S.config('comboMaxFileNum', 9999);

        expect(S.Env._comboLoader.loading).toBe(0);

        S.clearLoader();

        var x = {}, k = 3000;

        for (var i = 0; i < 100; i++) {
            var r2 = [];
            for (var j = 0; j < 5; j++) {
                r2.push("y" + (k++))
            }
            x["y" + i] = {
                requires: r2
            }
        }

        var l = new ComboLoader(S);

        l.add(x);

        var ret = [];
        for (i = 0; i < 100; i++) {
            ret.push("y" + i);
        }
        var r;
        r = l.calculate(ret);
        S.Loader.Utils.createModulesInfo(S, r);
        var c = l.getComboUrls(r);
        var cjs = c.js[''];
        expect(cjs.length).toBe(3);

        S.each(cjs, function (j) {
            expect(j.length).not.toBeGreaterThan(S.Config.comboMaxUrlLength)
        });
    });

    it("should works for native mod", function () {

        expect(S.Env._comboLoader.loading).toBe(0);

        S.Env.mods = {};
        S.DOM = null;
        S.add({
            dom: {requires: ['ua']}
        });
        S.use("dom", function () {
            expect(S.DOM).not.toBe(undefined);
        });
        waitsFor(function () {
            return S.DOM;
        });

    });

    it("should works for packages", function () {

        var p = KISSY.config("packages");
        for (var i in p) {
            if (p.hasOwnProperty(i)) {
                delete p[i];
            }
        }

        expect(S.Env._comboLoader.loading).toBe(0);

        S.Env.mods = {};

        KISSY.config({
            packages: [
                {
                    name: 'tests',
                    path: '/kissy_git/kissy1.3/src/seed/tests/specs/combo/'
                }
            ]
        });
        S.add({
            "tests/a": {
                requires: ['./b']
            },
            "tests/b": {
                requires: ['./c', 'dom']
            },
            dom: {
                requires: ['ua']
            }
        });

        var mods = S.getLoader().calculate(["tests/a"]);
        S.Loader.Utils.createModulesInfo(S, mods);
        var urls = S.getLoader().getComboUrls(mods);
        var host = location.hostname;

        expect(urls['js']['tests'][0])
            .toBe("http://" + host + "/kissy_git/kissy1.3/src/seed/tests/specs/combo/" +
            "tests/??a.js,b.js,c.js?t=" + S.Config.tag);

        S.DOM = null;

        S.use('tests/a', function (S, a) {
            expect(a).toBe(6);
        });

        waitsFor(function () {
            return S.DOM;
        });
    });

    it("should works for multiple use at the same time", function () {

        var p = KISSY.config("packages");
        for (var i in p) {
            if (p.hasOwnProperty(i)) {
                delete p[i];
            }
        }

        expect(S.Env._comboLoader.loading).toBe(0);

        S.Env.mods = {};

        KISSY.config({
            packages: [
                {
                    name: 'tests2',
                    path: '/kissy_git/kissy1.3/src/seed/tests/specs/combo/'
                }
            ]
        });
        S.add({
            "tests2/a": {
                requires: ['./b']
            },
            "tests2/b": {
                requires: ['./c', 'dom']
            },
            dom: {
                requires: ['ua']
            },
            x: {}
        });

        S.DOM = null;

        window.TEST_A = 0;

        var ret = 0, order = [];

        S.use('tests2/a', function (S, a) {
            order.push(1);
            expect(a).toBe(7);
            ret = 1;
        });

        S.use('tests2/a', function (S, a) {
            order.push(2);
            expect(a).toBe(7);
            ret = 2;
        });

        waitsFor(function () {
            return ret == 2;
        });

        runs(function () {
            expect(order).toEqual([1, 2]);
        });
    });

    it("works for not combo for specified packages", function () {
        window.TIMESTAMP_X = 0;

        KISSY.config({
            base: '',
            tag: '',
            debug: true,
            packages: {
                'timestamp': {
                    combine: false,
                    base: '/kissy_git/kissy1.3/src/seed/tests/specs/'
                }
            },
            modules: {
                'timestamp/x': {
                    requires: ['./z']
                },
                'timestamp/y': {
                    requires: ['./x']
                }
            }
        });

        runs(function () {
            var loader = S.getLoader(), Loader = S.Loader, utils = Loader.Utils;

            var allModNames = loader.calculate(["timestamp/y"]);

            utils.createModulesInfo(S, allModNames);
            var comboUrls = loader.getComboUrls(allModNames);

            var key = "timestamp";

            var jss = comboUrls.js[key];

            expect(jss[0]).toBe("http://" + host + "/kissy_git/kissy1.3/src/seed/tests/specs/timestamp/y.js");
            expect(jss[1]).toBe("http://" + host + "/kissy_git/kissy1.3/src/seed/tests/specs/timestamp/x.js");
            expect(jss[2]).toBe("http://" + host + "/kissy_git/kissy1.3/src/seed/tests/specs/timestamp/z.js");

        });
    });


    it("should load mod not config", function () {
        var p = KISSY.config("packages");
        for (var i in p) {
            if (p.hasOwnProperty(i)) {
                delete p[i];
            }
        }

        S.Env.mods = {};

        KISSY.config({
            packages: [
                {
                    name: 'tests4',
                    path: '/kissy_git/kissy1.3/src/seed/tests/specs/combo/'
                }
            ]
        });

        S.DOM = null;

        var ret = 0;

        S.use('tests4/a', function () {
            ret = 9;
        });

        waitsFor(function () {
            return S.DOM && (ret === 9);
        });
    });

    it("can use after another use", function () {

        KISSY.config({
            packages: [
                {
                    name: 'test5',
                    path: '/kissy_git/kissy1.3/src/seed/tests/specs/combo/'
                }
            ]
        });

        S.add({
            "test5/a": {
                requires: ["test5/b"]
            }
        });

        var ok = 0;
        S.use("test5/a", function (S, A) {
            expect(A).toBe("test5/a");
            S.use("test5/b", function (S, B) {
                expect(B).toBe("test5/b");
                ok = 1;
            });
        });

        waitsFor(function () {
            return ok;
        }, "too long!");
    });

    it("clean", function () {
        var p = KISSY.config("packages");
        for (var i in p) {
            if (p.hasOwnProperty(i)) {
                delete p[i];
            }
        }
    });
});