/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

module.exports = function(grunt)
{
  grunt.initConfig({
    ngAnnotate:
    {
      options: {},
      cantieri:
      {
        files:
        [
          {
            src: ["core/js/*.js"],
            dest: "tmp/core.ann.js"
          },
          {
            src: ["core/webgis/js/*.js"],
            dest: "tmp/webgis.ann.js"
          },
          {
            src: ["js/*.js"],
            dest: "tmp/app.ann.js"
          },
          {
            src: ["modules/management/js/management.js","modules/management/js/*.js"],
            dest: "tmp/management.ann.js"
          },
          {
            src: ["modules/roadsite/js/roadsite.js","modules/roadsite/js/*.js"],
            dest: "tmp/roadsite.ann.js"
          },
          {
            src: ["modules/move/js/move.js","modules/move/js/*.js"],
            dest: "tmp/move.ann.js"
          },
          {
            src: ["modules/registration/js/registration.js","modules/registration/js/*.js"],
            dest: "tmp/registration.ann.js"
          }
        ]
      },
    },
    uglify:
    {
      cantieri:
      {
        files:
        [
          {src:["tmp/core.ann.js"], dest:"dist/core.min.js"},
          {src:["tmp/webgis.ann.js"], dest:"dist/webgis.min.js"},
          {src:["tmp/app.ann.js"], dest:"dist/app.min.js"},
          {src:["tmp/management.ann.js"], dest:"dist/management.min.js"},
          {src:["tmp/roadsite.ann.js"], dest:"dist/roadsite.min.js"},
          {src:["tmp/move.ann.js"], dest:"dist/move.min.js"},
          {src:["tmp/registration.ann.js"], dest:"dist/registration.min.js"}
        ]
      }
    },
    cssmin:
    {
      options: {},
      cantieri:
      {
        files:
        {
          "dist/app.min.css": [
            "css/app.css",
            "css/core.css",
            "css/webgis.css",
            "css/bootstrap.css"
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-ng-annotate");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-cssmin");

  grunt.registerTask("default",["ngAnnotate","uglify","cssmin"]);
};
