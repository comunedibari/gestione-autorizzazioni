/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */
 
angular.module("webgis")
  .directive("wgLegendClass",wgLegendClass)
  .directive("wgFilterItem",wgFilterItem)
  .directive("wgStylesItem",wgStylesItem)
  .directive("wgStylesDefaultObject",wgStylesDefaultObject);

function wgLegendClass()
{
  return {
    templateUrl: "core/webgis/views/layer-legend-class.html",
    controller: "wgLegendClassCtrl",
    restrict: "E",
    scope: {class: "=",url: "="}
  };
}

function wgFilterItem()
{
  return {
    templateUrl: "core/webgis/views/layer-tree-filter-item.html",
    controller: "wgFilterItemCtrl",
    restrict: "E",
    scope: {entity: "="}
  };
}

function wgStylesItem()
{
  return {
    templateUrl: "core/webgis/views/layer-tree-styles-item.html",
    controller: "wgStylesCtrl",
    restrict: "E",
    scope: {entity: "=",featureAttribs:"=",layerId:"="}
  };
}

function wgStylesDefaultObject()
{
  return {
    templateUrl: "core/webgis/views/layer-tree-default-styles-item.html",
    controller: "wgStylesDefaultObjectCtrl",
    restrict: "E",
    scope: {entity: "=",attribs:"=", featureAttribs:"=",layerId:"="}
  };
}
