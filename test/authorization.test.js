'use strict';

// external requires
var assert = require('chai').assert;
var restify = require('restify');
var restifyClients = require('restify-clients');

// local files
var helper = require('./lib/helper');
var plugins = require('../lib');

// local globals
var SERVER;
var CLIENT;
var PORT;

describe('authorization parser', function () {

    before(function (done) {
        SERVER = restify.createServer({
            dtrace: helper.dtrace,
            log: helper.getLog('server')
        });

        SERVER.use(plugins.authorizationParser());

        SERVER.get('/', function respond(req, res, next) {
            res.send();
            next();
        });

        SERVER.listen(PORT, '127.0.0.1', function () {
            PORT = SERVER.address().port;
            CLIENT = restifyClients.createJsonClient({
                url: 'http://127.0.0.1:' + PORT,
                dtrace: helper.dtrace,
                retry: false
            });

            done();
        });
    });

    after(function (done) {
        CLIENT.close();
        SERVER.close(done);
    });


    it('should accept basic authorization', function (done) {
        var authz = 'Basic ' + new Buffer('user:secret').toString('base64');
        var opts = {
            path: '/',
            headers: {
                authorization: authz
            }
        };
        CLIENT.get(opts, function (err, _, res) {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            done();
        });
    });

    it('should reject basic authorization', function (done) {
        var opts = {
            path: '/',
            headers: {
                authorization: 'Basic '
            }
        };
        CLIENT.get(opts, function (err, _, res) {
            assert.ok(err);
            assert.equal(err.name, 'InvalidHeaderError');
            assert.equal(res.statusCode, 400);
            done();
        });
    });

});

