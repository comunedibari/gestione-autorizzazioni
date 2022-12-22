/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("webgis").
  controller("wgOverviewCtrl",wgOverviewCtrl);

function wgOverviewCtrl($scope,wgMapSvc)
{
  /*
   * Get from service JSON configuration object
   */
  wgMapSvc.getConfig(function(res)
  {
    var ovCfg = getOvConfig(res);

    // create overview control and store it into service
    wgMapSvc.ctrlOverview = new ol.control.OverviewMap(
    {
      target: document.getElementById("overviewMap"),
      collapsed: false,
      collapsible: false,
      className: "ol-overviewmap custom-overview",
      view: new ol.View(
      {
        projection: "EPSG:" + wgMapSvc.mapCurrSR.code,
        minZoom: ovCfg.minZoom || 0
      }),
      layers: [wgMapSvc.overviewLayer.layer]
    });

    // add control to the map
    wgMapSvc.map.addControl(wgMapSvc.ctrlOverview);
  });

  /*
   * Listen for controller destroy
   */
  $scope.$on("$destroy", function()
  {
    // remove overviewMap control
    wgMapSvc.map.removeControl(wgMapSvc.ctrlOverview);
  });

  /*
   * Utility functions
   */
  function getOvConfig(wgCfg)
  {
    var aTools = wgCfg && wgCfg.map ? wgCfg.map.tools : null;
    if (!aTools) return {};

    for (var j = 0;j < aTools.length;j++)
    {
      if (aTools[j].id == "overview")
        return aTools[j].params || {};
    }

    return {};
  };
};
