module.exports = function(grunt) {
  'use strict';

  // List all files in the app directory.
  var templates = grunt.file.expand({
    filter: 'isFile',
    cwd: 'app'
  }, ['**/*.pug', '!_*/**/*.pug']);

  // Make actual choices out of them that grunt-prompt can use.
  var choices = templates.map(function(t) {
    return {
      name: t.substr(t.indexOf('/') + 1).replace('.pug', ''),
      value: t.replace('.pug', '')
    };
  });

  // Show elapsed time after tasks run
  require('time-grunt')(grunt);

  // Load all Grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    settings: grunt.file.readJSON('gruntsettings.json'),

    /**
     * Project Paths Configuration
     * ===============================
     */
    paths: {
      images: 'img',
      src: 'app',
      directory: templates[0].substr(0, templates[0].indexOf('/')),
      file: templates[0].substr(templates[0].indexOf('/') + 1).replace('.pug', ''),
      tmp: '.tmp',
      dist: 'dist'
    },

    /**
     * Copy Tasks
     * ===============================
     */
    copy: {
      images: {
        files: [{
          expand: true,
          cwd: '<%= paths.src %>',
          src: ['<%= paths.directory %>/<%= paths.images %>/**/*.{png,jpg,jpeg,gif}', '_components/**/*.{png,jpg,jpeg,gif}'],
          dest: '<%= paths.tmp %>/<%= paths.directory %>/<%= paths.images %>',
          flatten: true
        }]
      },
      styles: {
        files: [{
          expand: true,
          cwd: '<%= paths.src %>',
          src: '{<%= paths.directory %>,_layouts,_components}/**/*.{scss,sass}',
          dest: '<%= paths.tmp %>/<%= paths.directory %>/styles',
          flatten: true
        }]
      }
    },

    /**
     * CSS Tasks
     * ===============================
     */
    sass: {
      dev: {
        options: {
          lineNumbers: true
        },
        files: [{
          expand: true,
          cwd: '<%= paths.tmp %>',
          src: '<%= paths.directory %>/styles/**/*.{scss,sass}',
          dest: '<%= paths.tmp %>',
          ext: '.css'
        }]
      },
      dist: {
        options: {
          sourcemap: 'none',
          style: 'expanded'
        },
        files: [{
          expand: true,
          cwd: '<%= paths.tmp %>',
          src: '<%= paths.directory %>/styles/**/*.{scss,sass}',
          dest: '<%= paths.tmp %>',
          ext: '.css'
        }]
      }
    },
    cssmin: {
      options: {
        keepBreaks: true
      },
      dist: {
        files: [{
          expand: true,
          cwd: '<%= paths.tmp %>',
          src: ['<%= paths.directory %>/styles/<%= paths.file %>.css'],
          dest: '<%= paths.tmp %>',
          ext: '.css'
        }]
      }
    },
    uncss: {
      dist: {
        options: {
          ignoreSheets : [/fonts.googleapis/],
        },
        files: [{
          src: '<%= paths.tmp %>/<%= paths.directory %>/<%= paths.file %>.html',
          dest: '<%= paths.tmp %>/<%= paths.directory %>/styles/styles.css'
        }]
      }
    },
    concat_css: {
      dist: {
        files: {
          '<%= paths.tmp %>/<%= paths.directory %>/styles/style.css': ['<%= paths.tmp %>/<%= paths.directory %>/styles/<%= paths.file %>.css', '<%= paths.tmp %>/<%= paths.directory %>/styles/<%= paths.file %>-editable.css']
        }
      }
    },
    cmq: {
      parts: {
        files: [{
          expand: true,
          cwd: '<%= paths.tmp %>',
          src: '<%= paths.directory %>/styles/**/*.css',
          dest: '<%= paths.tmp %>'
        }]
      },
      dist: {
        files: [{
          expand: true,
          cwd: '<%= paths.tmp %>',
          src: '<%= paths.directory %>/styles/style.css',
          dest: '<%= paths.tmp %>'
        }]
      }
    },
    processhtml: {
      dist: {
        files: [{
          src: '<%= paths.tmp %>/<%= paths.directory %>/<%= paths.file %>.html',
          dest: '<%= paths.dist %>/<%= paths.directory %>/index.html'
        }]
      }
    },

    premailer: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= paths.tmp %>',
          src: '<%= paths.directory %>/<%= paths.file %>.html',
          dest: '<%= paths.tmp %>'
        }]
      }
    },

    /**
     * Pug Compilation Tasks
     * ===============================
     */
    pug: {
      dev: {
        options: {
          pretty: true,
          data: function(dest, src) {
            return require('./' + src[0].replace(/(?=[\w-]+\.pug$).+/i,'') + 'data-dev.json');
          }
        },
        files: [{
          expand: true,
          cwd: '<%= paths.src %>',
          src: ['<%= paths.directory %>/*.pug'],
          dest: '<%= paths.tmp %>',
          ext: '.html'
        }]
      },
      dist: {
        options: {
          pretty: true,
          data: function(dest, src) {
            // Return an object of data to pass to templates
            return require('./' + src[0].replace(/(?=[\w-]+\.pug$).+/i,'') + 'data-prod.json');
          }
        },
        files: [{
          expand: true,
          cwd: '<%= paths.src %>',
          src: ['<%= paths.directory %>/*.pug'],
          dest: '<%= paths.tmp %>',
          ext: '.html'
        }]
      }
    },

    /**
     * Watch Task
     * ===============================
     */
    watch: {
      options: {
        spawn: false
      },
      sass: {
        files: ['<%= paths.src %>/{<%= paths.directory %>,_layouts,_components}/**/*.{scss,sass}'],
        tasks: ['copy:styles','sass:dev']
      },
      pug: {
        files: [
          '<%= paths.src %>/<%= paths.directory %>/*.json',
          '<%= paths.src %>/<%= paths.directory %>/<%= paths.file %>.pug',
          '<%= paths.src %>/{_layouts,_components}/**/*.pug'
        ],
        tasks: ['pug:dev']
      },
      image: {
        files: [
          '<%= paths.src %>/<%= paths.directory %>/<%= paths.images %>/**/*.{png,jpg,jpeg,gif}',
          '<%= paths.src %>/_components/**/*.{png,jpg,jpeg,gif}'
        ],
        tasks: ['copy:images']
      }
    },

    /**
     * Server Tasks
     * ===============================
     */

    browserSync: {
      dev: {
        bsFiles: {
          src: [
            '<%= paths.tmp %>/<%= paths.directory %>/<%= paths.file %>.html',
            '<%= paths.tmp %>/<%= paths.directory %>/styles/{,*/}*.css',
            '<%= paths.tmp %>/<%= paths.directory %>/<%= paths.images %>/{,*/}*.{png,jpg,jpeg,gif}'
          ]
        },
        options: {
          server: {
            baseDir: [
              '<%= paths.tmp %>/<%= paths.directory %>'
            ],
            index: "<%= paths.file %>.html"
          },
          port: 3000,
          watchTask: true
        }
      },
      dist: {
        options: {
          server: {
            baseDir: '<%= paths.dist %>/<%= paths.directory %>'
          }
        }
      }
    },

    /**
     * Cleanup Tasks
     * ===============================
     */
    clean: {
      dev: ['<%= paths.tmp %>'],
      dist: ['<%= paths.tmp %>', '<%= paths.dist %>/<%= paths.directory %>']
    },
    mkdir: {
      dist: {
        options: {
          create: ['<%= paths.tmp %>']
        }
      }
    },
    replace: {
      dist: {
        options: {
          patterns: [
            {
              match: /&amp;/g,
              replacement: '&'
            }
          ]
        },
        files: [{
          expand: true,
          flatten: true,
          cwd: '<%= paths.dist %>/<%= paths.directory %>',
          src: ['index.html'],
          dest: '<%= paths.dist %>/<%= paths.directory %>'
        }]
      }
    },

    /**
     * Images Optimization Tasks
     * ===============================
     */
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= paths.tmp %>',
          src: '<%= paths.directory %>/<%= paths.images %>/{,*/}*.{png,jpg,jpeg,gif}',
          dest: '<%= paths.dist %>'
        }]
      }
    },

    /**
     * Test Mailer Tasks
     * ===============================
     */
    nodemailer: {
      options: {
        transport: {
          type: 'SMTP',
          options: {
            service: '<%= paths.sender.service  %>',
            auth: {
              user: '<%= paths.sender.user  %>',
              pass: '<%= paths.sender.pass  %>'
            }
          }
        },
        message: {
          subject: '<%= paths.recipients.subject  %>'
        },
        recipients: [{
          name: '<%= paths.recipients.name  %>',
          email: '<%= paths.recipients.email %>'
        }]
      },
      dist: {
        src: ['<%= paths.dist %>/<%= paths.directory %>/index.html']
      }
    },
    prompt: {
      chooseFile: {
        options: {
          questions: [{
            config: 'paths.file',
            type: 'list',
            message: 'Which email should we build?',
            choices: choices,
            filter: function(answer) {
              grunt.config('paths.directory', answer.substr(0, answer.indexOf('/')));
              return answer.substr(answer.indexOf('/') + 1)
            }
          }]
        }
      },
      target: {
        options: {
          questions: [{
            config: 'paths.sender.service',
            type: 'input',
            message: 'What service should we use to send this email?',
            default: '<%= settings.mail.service %>'
          }, {
            config: 'paths.sender.user',
            type: 'input',
            message: 'What account should we send it from?',
            default: '<%= settings.mail.user %>'
          }, {
            config: 'paths.sender.pass',
            type: 'input',
            message: 'Account password?',
            default: '<%= settings.mail.pass %>'
          }, {
            config: 'paths.recipients.name',
            type: 'input',
            message: 'Who should we send this to (name)?',
            default: '<%= settings.mail.name %>'
          }, {
            config: 'paths.recipients.email',
            type: 'input',
            message: 'Who should we send this to (email)?',
            default: '<%= settings.mail.email %>'
          }, {
            config: 'paths.recipients.subject',
            type: 'input',
            message: 'What is the subject?',
            default: '<%= settings.mail.subject %>'
          }]
        }
      }
    }

  });

  grunt.registerTask('default', 'serve');

  grunt.registerTask('serve', function(target) {

    if (target === 'dist') {
      return grunt.task.run(['build', 'browserSync:dist']);
    }

    grunt.task.run([
      'chooseFile',
      'clean:dev',
      'copy',
      'sass:dev',
      'pug:dev',
      'browserSync:dev',
      'watch'
    ]);
  });


  grunt.registerTask('chooseFile', function(target) {

    if (templates.length > 1) {
      return grunt.task.run(['prompt:chooseFile']);
    }
  });

  grunt.registerTask('build', function(target) {

    var build = [
      'chooseFile',
      'clean:dist',
      'copy',
      'sass:dist',
      'cmq:parts',
      'cssmin'
    ];

    if (target === 'test') {
      build = build.concat([
        'pug:dev'
      ]);
    } else {
      build = build.concat([
        'pug:dist'
      ]);
    }

    build = build.concat([
      'imagemin',
      'concat_css',
      'cmq:dist',
      'premailer',
      'processhtml',
      'replace'
    ]);

    grunt.task.run(build);
  });

  grunt.registerTask('send', [
    'build',
    'prompt:target',
    'nodemailer'
  ]);

};