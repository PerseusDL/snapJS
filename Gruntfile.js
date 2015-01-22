//Mostly reused from SigmaJS Config
var fs = require('fs');

module.exports = function(grunt) {
  coreJsFiles = [
    //Core
    "./src/snap.drgn.js",

    //Sigma Parsers
    "sigma.parsers.snap.js"
  ]
  // Project configuration:
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    grunt: subGrunts,
    closureLint: {
      app: {
        closureLinterPath: '/usr/local/bin',
        command: 'gjslint',
        src: coreJsFiles,
        options: {
          stdout: true,
          strict: true,
          opt: '--disable 6,13'
        }
      }
    },
    jshint: {
      all: coreJsFiles,
      options: {
        '-W055': true,
        '-W040': true,
        '-W064': true
      }
    },
    qunit: {
      all: {
        options: {
          urls: [
            './test/unit.html'
          ]
        }
      }
    },
    uglify: {
      prod: {
        files: {
          'build/sigma.min.js': coreJsFiles
        },
        options: {
          banner: '/* sigma.js - <%= pkg.description %> - Version: <%= pkg.version %> - Author: Thibault Clérice, Leipzig Universität - License: MIT */\n'
        }
      }
    },
    concat: {
      options: {
        separator: '\n'
      },
      dist: {
        src: coreJsFiles,
        dest: 'build/snap.drgn.js'
      },
      require: {
        src: npmJsFiles,
        dest: 'build/sigma.require.js'
      }
    },
    sed: {
      version: {
        recursive: true,
        path: 'examples/',
        pattern: /<!-- START SIGMA IMPORTS -->[\s\S]*<!-- END SIGMA IMPORTS -->/g,
        replacement: ['<!-- START SIGMA IMPORTS -->'].concat(coreJsFiles.map(function(path) {
          return '<script src="../' + path + '"></script>';
        }).concat('<!-- END SIGMA IMPORTS -->')).join('\n')
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  // By default, will check lint, hint, test and minify:
  grunt.registerTask('default', ['closureLint', 'jshint', 'qunit', 'sed', 'grunt', 'uglify']);
  grunt.registerTask('build', ['uglify', 'grunt', 'concat:require']);
  grunt.registerTask('test', ['qunit']);

  // For travis-ci.org, only launch tests:
  grunt.registerTask('travis', ['qunit']);
};