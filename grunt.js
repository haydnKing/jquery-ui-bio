
function stripBanner( files ) {
    return files.map(function( file ) {
        return "<file_strip_banner:" + file + ">";
    });
}

/*global module:false*/
module.exports = function(grunt) {
    /*Load grunt-contrib-less*/
    grunt.loadNpmTasks('grunt-contrib-less');


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
        src: ['<banner:meta.banner>', stripBanner(grunt.file.expandFiles('src/js/*.js'))],
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
      tasks: 'lint qunit concat less:development'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
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
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint qunit concat min less');

};
