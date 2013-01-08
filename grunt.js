
function stripBanner( files ) {
    return files.map(function( file ) {
        return "<file_strip_banner:" + file + ">";
    });
}

var src_files = [   'src/js/datatypes.js',
                    'src/js/tooltip.js',
                    'src/js/help.js',
                    'src/js/statusBar.js',
                    'src/js/panel.js',
                    'src/js/color.js',
                    'src/js/search.js',
                    'src/js/fragment.js',
                    'src/js/fragmentSelect.js',
                    'src/js/sequenceLoader.js',
                    'src/js/sequenceView.js'
];

/*global module:false*/
module.exports = function(grunt) {
    /*Load grunt-contrib-less*/
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-templater');

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    concat: {
      js: {
        src: ['<banner:meta.banner>', stripBanner(src_files)],
        dest: 'dist/<%= pkg.name %>.js'
      },
      css: {
        src: ['<banner:meta.banner>', 'src/less/*.less'],
        dest: 'dist/<%= pkg.name %>.less'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.js.dest>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    lint: {
      files: ['grunt.js', 'src/**/*.js', 'test/**/*.js']
    },
    watch: {
      files: ['grunt.js', 'src/**/*.*', 'test/**/*.js'],
      tasks: 'lint qunit concat template less:development'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true,
        devel: true
      },
      globals: {
        jQuery: true
      }
    },
    uglify: {},
    less: {
        development: {
            files: {
                "dist/<%= pkg.name %>.css": "dist/<%= pkg.name %>.less"
            }
        },
        production: {
            options: {
                yuicompress: true
            },
            files: {
                "dist/<%= pkg.name %>.min.css": "src/less/<%= pkg.name %>.less"
            }
        }
    },
    template: {
        dev: {
            src: 'libs/jquery-ui-bio-loader.dust',
            dest: 'libs/jquery-ui-bio-loader.js',
            variables: {
                names: src_files
            }
        }
    },
    phantomjs: {
        timeout: 100000
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint qunit concat min less template');

};
