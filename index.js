/* jshint node: true */
'use strict';

/**
 * Module dependencies.
 */

var Concat = require('concat-with-sourcemaps');
var extend = require('object-assign');
var through = require('through2');
var gutil = require('gulp-util');
var stream = require('stream');
var path = require('path');

/**
 * gulp-header plugin
 */

module.exports = function (headerText, data) {
    headerText = headerText || '';

    var fileName;
    var concat;

    var stream = through.obj(function (file, enc, cb) {

        if (typeof file === 'string') {
            fileName = file;
        } else if (typeof file.path === 'string') {
            fileName = path.basename(file.path);
        } else {
            fileName = '';
        }

        var template = gutil.template(headerText, extend({file : file}, data));

        concat = new Concat(true, fileName);

        if (file.isBuffer()) {
            concat.add(fileName, new Buffer(template));
        }

        if (file.isStream()) {
            var stream = through();
            stream.write(new Buffer(template));
            stream.on('error', this.emit.bind(this, 'error'));
            file.contents = file.contents.pipe(stream);
        }

        // add sourcemap
        concat.add(file.relative, file.contents, file.sourceMap);

        // make sure streaming content is preserved
        if (file.contents && !isStream(file.contents)) {
          file.contents = concat.content;
        }

        // apply source map
        if (concat.sourceMapping) {
          file.sourceMap = JSON.parse(concat.sourceMap);
        }

        // make sure the file goes through the next gulp plugin
        this.push(file);

        // tell the stream engine that we are done with this file
        cb();
    });

    // returning the file stream
    return stream;
};

/**
 * is stream
 */

function isStream (obj) {
  return obj instanceof stream.Stream;
}
