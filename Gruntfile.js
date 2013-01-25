// ----------------------------------------------------------------------------
//
// grunt.js - tasks for grunt to perform
//
// ----------------------------------------------------------------------------

module.exports = function(grunt) {

    // project configuration
    grunt.initConfig({
        uglify : {
            options : {},
            all : {
                files : {
                    'public/s/js/all.min.js' : [
                        'public/s/js/jquery-1.8.3.js',
                        'public/s/js/jquery.easing-1.3.js',
                        'public/s/js/jquery.transit-0.9.9.js',
                        'public/s/js/ready.js',
                    ],
                },
            },
        },
        cssmin : {
            style : {
                src  : 'public/s/css/style.css',
                dest : 'public/s/css/style.min.css',
            },
        },
    });

    // load up some other tasks
    grunt.loadNpmTasks('grunt-css');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // default task
    grunt.registerTask('default', 'uglify cssmin concat'.split(' '));
};

// ----------------------------------------------------------------------------
