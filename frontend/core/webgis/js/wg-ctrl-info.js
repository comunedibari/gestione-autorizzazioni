/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */
angular.module("webgis")
  .controller("wgInfoCtrl", wgInfoCtrl);

function wgInfoCtrl($rootScope,$scope,wgMapSvc,rwHttpSvc,rwConfigSvc,$http)
{
  // listener identifier
  var pointerMoveListenerKey        = null;
  var pointerSingleClickListenerKey = null;

  $scope.customCoordFormat = null; // Custom Coordinate Format function
  $scope.clickPointCoord   = null;

  // dictionary with key equal layer to layer name and object equal to info
  $scope.dLayersAttributes = {};

  // array of infos returned from getFeatureInfo
  $scope.getFeatureInfoArray = null;

  $scope.numResult = 0;

  // style to hilight linear and areal features
  var lineAreaHighlightStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#FF0000',
      width: 2
    })
  });

  // style to hilight point features
  var pointHighlightStyle = new ol.style.Style({
    image: new ol.style.Circle({
      radius: 24,
      fill: new ol.style.Fill({
        color: '#FF0000'
      })
    })
  });

  // retrieve service layer for info highlight
  var layerHighlight = wgMapSvc.layersCfgObj[wgMapSvc.layerOverlayId].layerOL;

  // configure service highlight layer
  layerHighlight.setSource(new ol.source.Vector());

  var parser = new ol.format.GeoJSON();

  // flag to show loader while getFeatureInfo is awaiting response
  $scope.showLoader = false;

  $scope.resetInfo = function()
  {
    $scope.getFeatureInfoArray = null;
    $scope.dLayersAttributes   = {};
    $scope.clickPointCoord     = null;
    $scope.numResult           = 0;

    layerHighlight.getSource().clear();
  }

  $scope.showNoLayerMsg = null;

  // add listener on pointer move
  pointerMoveListenerKey = wgMapSvc.map.on('pointermove', function(evt)
  {
    if (evt.dragging)
    {
      wgMapSvc.map.getTargetElement().style.cursor = 'default';
      return;
    }

    wgMapSvc.map.getTargetElement().style.cursor = 'pointer';
  });

  // add listener on pointer single click
  pointerSingleClickListenerKey = wgMapSvc.map.on('singleclick', function(evt)
  {
    $scope.resetInfo();

    // Get clicked point coordinate
    $scope.clickPointCoord = evt.coordinate;

    // Get Custom Coordinate Format function
    $scope.customCoordFormat = wgMapSvc.customCoordFormat();

    $scope.showLoader = true;

    // Clear featureinfo array
    $scope.getFeatureInfoArray = [];

    var viewResolution = wgMapSvc.mapView.getResolution();
    var numLayerToQuery = 0;

    // cicle on queryable layers
    for (var idx=0, len = wgMapSvc.queryableLayerArr.length; idx<len; idx++)
    {
      var queryCfg = wgMapSvc.queryableLayerArr[idx];

      if (wgMapSvc.layersCfgObj[queryCfg.layerId].visible)
      {
        numLayerToQuery++;
        queryLayer(queryCfg, evt.coordinate, evt.pixel, viewResolution);
      }
    }

    $scope.showNoLayerMsg = numLayerToQuery ? false : true;

    if ($scope.showNoLayerMsg)
      $scope.showLoader = false;

    // we are into OpenLayers method
    $scope.$apply();
  });

  /*
   * Execute GetFeatureInfo on layer given its id and coordinate
   */
  function queryLayer(queryCfg, coords, pixel, viewResolution)
  {
    var layerId   = queryCfg.layerId;
    var layerCfg  = wgMapSvc.layersCfgObj[layerId];
    var layerName = layerCfg.label;

    var parentName  = null;
    var layerOL     = null;
    var layerSource = null;

    // layer is a group item or composed layer item:
    // we need to access to group configuration to retrieve item layer
    if (layerCfg.id_parent)
    {
      var parentCfg = wgMapSvc.layersCfgObj[layerCfg.id_parent];

      parentName = parentCfg.label;

      // Put the queryable configuration into the dictionary
      $scope.dLayersAttributes[layerName] = queryCfg.obj;

      if (parentCfg.layerOL instanceof ol.layer.Group)
      {
        var itemsArray = parentCfg.layerOL.getLayers().getArray();

        for (var idx=0, len=itemsArray.length; idx<len; idx++)
        {
          if (itemsArray[idx].get('id') == layerId)
          {
            layerOL     = itemsArray[idx];
            layerSource = layerOL.getSource();
          }
        }
      }
      else
      {
        layerOL = parentCfg.layerOL;

        var sourceOpt = parentCfg.source;
        sourceOpt.layer_name = layerCfg.layer_name;

        layerSource = wgMapSvc.buildWMSSource(sourceOpt, false);
      }
    }
    else
    {
      layerOL     = layerCfg.layerOL;
      layerSource = layerOL.getSource();

      // Put the queryable configuration into the dictionary
      $scope.dLayersAttributes[layerName] = queryCfg.obj;
    }

    // check for errors
    if (!layerOL)
    {
      console.error("ERROR: not layer founded with id " + layerId);
      return;
    }

    // Get layer infoFormat
    var infoFormat  = queryCfg.obj.info_format;

    var url = layerSource.getGetFeatureInfoUrl(
      coords,
      viewResolution,
      'EPSG:' + wgMapSvc.mapCurrSR.code,
      {
        'INFO_FORMAT'  : infoFormat,
        'feature_count': 20  // limit number of returned results
      }
    );

    if (url)
    {
      // add layerId in query string to use it on asynchronous response
      url += '&layerId='+layerId;

      // if url is an absolute url, we have to proxy it
      if (url.indexOf('http') == 0)
      {
        //url = rwConfigSvc.urlPrefix + "/webgis/proxyRequest/" + url;

        url = rwConfigSvc.urlPrefix + "/utility/proxy?url=" + encodeURIComponent(url);
      }

      $http.get(url).then(function(res)
      {
        $scope.showLoader = false;
        if (res && res.data)
        {
          var contentType = res.headers('content-type');

          if (contentType.toUpperCase().indexOf(infoFormat.toUpperCase()) >= 0)
          {
            // If there are features, push into getFeatureInfoArray
            if(res.data.features && res.data.features.length)
            {
              // put features on layerHighlight to highlight them
              var features = parser.readFeatures(res.data);

              if (features.length > 0)
              {
                // retrieve layer configuration
                var url    = res.config.url;
                var layId  = url.substr(url.lastIndexOf('&layerId=')+'&layerId='.length);
                var layCfg = wgMapSvc.layersCfgObj[layId];
                var source = null;

                if (!layCfg.source && layCfg.id_parent)
                {
                  var parentCfg = wgMapSvc.layersCfgObj[layCfg.id_parent];
                  source = parentCfg.source;
                }
                else
                  source = layCfg.source;

                var layProj = source.projection;
                var mapProj = wgMapSvc.mapView.getProjection().getCode();

//                 if (layProj != mapProj)
//                 {
//                   for (var idx=0, len=features.length; idx<len; idx++)
//                   {
//                     features[idx].setGeometry(
//                       features[idx].getGeometry().transform(layProj, mapProj)
//                     );
//                   }
//                 }

                // before to apply a style, verify if feature has a geometry
                // (if is a raster there isn't geometry)
                if (features[0].getGeometry())
                {
                  // reproject features
                  if (layProj != mapProj)
                  {
                    for (var idx=0, len=features.length; idx<len; idx++)
                    {
                      features[idx].setGeometry(
                        features[idx].getGeometry().transform(layProj, mapProj)
                      );
                    }
                  }

                  // set layer style
                  switch(features[0].getGeometry().getType())
                  {
                    case 'LineString':
                    case 'MultiLineString':
                    case 'Polygon':
                    case 'MultiPolygon':
                      layerHighlight.setStyle(lineAreaHighlightStyle);
                      break;

                    case 'Point':
                    case 'MultiPoint':
                      layerHighlight.setStyle(pointHighlightStyle);
                      break;
                  }

                  layerHighlight.getSource().addFeatures(features);
                }
              }

              // push data into array to view them
              $scope.getFeatureInfoArray.push(
              {
                parentName: parentName,
                layerName: layerName,
                layerId: layId,
                pixel: pixel,
                type: infoFormat,
                data: res.data
              });

              // count results number
              $scope.numResult += res.data.features.length;
            }
          }
          else
          {
            console.error("ERROR: " + res.data);
          }
        }
      });
    }
  }

  /*
   * Function invoked on click on result list
   * Emit an event to invoke extended info functions
   */
  $scope.extendedInfo = function(obj, feature)
  {
    // retrieve layer configuration
    var layerCfg = wgMapSvc.layersCfgObj[obj.layerId];

    // object to send
    var objToSend = {
      layerId: layerCfg.layer_name ? layerCfg.layer_name : layerCfg.source.layer_name,
      featureId: feature.properties[layerCfg.queryable.feature_id],
      x: obj.pixel[0] + $("#mapDiv").offset().left,
      y: obj.pixel[1] + $("#mapDiv").offset().top,
      data: {
        fields:[]
      }
    };

    // valorize feature properties
    for (var idx=0, len = layerCfg.queryable.result.length; idx<len; idx++)
    {
      var attrObj = layerCfg.queryable.result[idx];

      objToSend.data.fields[idx] = {
        "key" : attrObj.id,
        "val" : feature.properties[attrObj.id],
        "type": attrObj.type
      };
    }

    // emit event
    $rootScope.$broadcast("wmsFeatureInfo", objToSend);
  }

  /*
   * Remove (on controller destroy):
   *  - listener on pointer move
   *  - listener on single click
   */
  $scope.$on("$destroy", function()
  {
    ol.Observable.unByKey(pointerMoveListenerKey);
    ol.Observable.unByKey(pointerSingleClickListenerKey);

    layerHighlight.setSource(null);
  });
};
