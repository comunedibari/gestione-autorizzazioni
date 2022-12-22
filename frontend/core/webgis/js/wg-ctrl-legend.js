/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("webgis").controller("wgLegendCtrl",wgLegendCtrl);

function wgLegendCtrl($scope,wgMapSvc)
{
  $scope.categories = [];
  $scope.layersObj = wgMapSvc.layersCfgObj;

  // cycle on service categories array to build legend
  for (var i = 0;i < wgMapSvc.categoriesTree.length;i++)
  {
    var cat = wgMapSvc.categoriesTree[i];

    $scope.categories.push({
      label: cat.label,
      layers: cat.layers,
      isOpen: i ? false : true
    });
  }

  /*
   * Check to show legend for given layer.
   */
  $scope.showLegend = function(layerId)
  {
    var layer = $scope.layersObj[layerId];

    if (!layer)
      return false;

    return layer.legend && layer.visible && !layer.disabled;
  };

  /*
   * Retrieve external legend url for given layer.
   */
  $scope.legendURL = function(layerId)
  {
    // Proxy to service method
    return wgMapSvc.getLegendExtern(layerId);
  };
};
