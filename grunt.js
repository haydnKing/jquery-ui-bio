
function stripBanner( files ) {
    return files.map(function( file ) {
        return "<file_strip_banners:" + file + ">";
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
      dist: {
        src: ['<banner:meta.banner>', stripBanner(grunt.file.expandFiles('src/js/*.js'))],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
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
      files: '<config:lint.files>',
      tasks: 'lint qunit less:development'
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
        browser: true
      },
      globals: {
        jQuery: true
      }
    },
    uglify: {},
    less: {
        development: {
            files: {
                "dist/<%= pkg.name %>.css": "src/less/<%= pkg.name %>.less"
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
