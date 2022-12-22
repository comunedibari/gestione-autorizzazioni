/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("webgis",["ui.tree","colorpicker.module","summernote"])
  .config(function(treeConfig) {
    treeConfig.defaultCollapsed = true; // collapse tree nodes by default
  });
