'use strict';

var decompress = require('decompress');
var eachAsync = require('each-async');
var fs = require('fs');
var mkdir = require('mkdirp');
var path = require('path');
var through = require('through2');
var Promise = require('promise');

/**
 * Download a file to a given destination
 *
 * Options:
 *
 *   - `extract` Try extracting the file
 *   - `mode` Set mode on the downloaded files
 *   - `strip` Equivalent to --strip-components for tar
 *
 * @param {String|Array|Object} url
 * @param {String} dest
 * @param {Object} opts
 * @api public
 */

module.exports = function (url, dest, opts) {
    return new Promise(function (fulfill, reject){
        download(url, dest, opts, fulfill, reject, function (err, res){
         //   if (err) reject(err);
         //   else fulfill(res);
        });
     });
};

function download (url, dest, opts, fullfill, reject, cb) {
 
    url = Array.isArray(url) ? url : [url];
    opts = opts || {};

    var request = require('request');
 //   var stream = through();
    var strip = +opts.strip || '0';
    
    eachAsync(url, function (url, i, done) {

        var req;
        var target = path.join(dest, path.basename(url));

        opts.url = url;
        opts.proxy = process.env.HTTPS_PROXY ||
                     process.env.https_proxy ||
                     process.env.HTTP_PROXY ||
                     process.env.http_proxy;

        if (url.url && url.name) {
            target = path.join(dest, url.name);
            opts.url = url.url;
        }
        
        req = request.get(url);

        req.on('error', function (err) {
            reject(err);
        });
        

        req.on('response', function (res) {
            var mime = res.headers['content-type'];
            var status = res.statusCode;
            var end;
            

            if (status < 200 || status >= 300) {
                reject(err);
                return;
            }


            if (opts.extract && decompress.canExtract(opts.url, mime)) {
                var ext = decompress.canExtract(opts.url) ? opts.url : mime;
                
                end = decompress({
                    ext: ext,
                    path: target,
                    strip: strip
                });
            } else {
               console.log(dest);
                if (!fs.existsSync(dest)) {
                    mkdir.sync(dest);
                }
                end = fs.createWriteStream(target);
            }

            req.pipe(end);

            end.on('close', function () {
                if (!opts.extract && opts.mode) {
                    fs.chmod(target, opts.mode, function(){
                     //fullfill("done");
                      done();
                    });
                }
               
                done();
            });
        });
     }, function () {
         fullfill("done");
     });
        
    return cb(null, "");
}