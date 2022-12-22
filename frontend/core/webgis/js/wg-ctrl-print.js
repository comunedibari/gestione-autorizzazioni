/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */


function printFormCtrl($scope, $translate, wgMapSvc,rwHttpSvc, rwConfigSvc)
{
  // service layer for print
  var layerPrint = null;

  // extent of print area
  var printAreaExtent = null;

  // utility constant for measures conversion
  var PRINT_BASE_DPI  = 72;
  var METERS_PER_INCH = 0.0254;

  // options array for print form combo
  var scaleOpt   = [];
  var dpiOpt     = [];
  var formatOpt  = [];

  // preview print area style
  var printPreviewStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#7A7A7A',
      width: 1.4
    }),
    fill: new ol.style.Fill({
      color: [0, 0, 0, 0.2]
    })
  });

  // interactions to select and translate print box area
  var translateInteraction = null;
  var selectInteraction    = null;

  // unique key for pointer move listener
  var pointerMoveListenerKey = null;

  // object binded to print form
  $scope.printObj = {};

  // form controller object
  $scope.formCtrlObj = {};

  // loader
  $scope.showLoader = false;

  // legend object
  var legendPrint = {name:'', classes:[]};

  // flag to manage print error
  $scope.printError = false;

  // flag to manage 'wrong' projection on base map
  // (OSM and MapBox are printable only in EPSG:3857)
  $scope.printBadEPSGMsg = false;

  // print form configuration
  $scope.printformCfg =
  {
    id: "printForm",
    fg:
    [
      {
        show: true, label: "Informazioni", rows:
        [
          [
            {
              id: "title_print",
              type: "text",
              label: "WEBGIS.PRINT_TITLE",
              width: 12,
              height: "input-sm",
              required: true, enabled: true, show: true
            }
          ],
          [
            {
              id: "description_print",
              type: "textarea",
              label: "WEBGIS.PRINT_DESCRIPTION",
              width: 12,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]
        ],
      },
      {
        show: true, label: "Impostazioni", rows:
        [
          [
            {
              id: "format_print",
              type: "select",
              label: "WEBGIS.PRINT_FORMAT",
              width: 6,
              height: "input-sm",
              options: formatOpt,
              required: true, enabled: true, show: true
            },
            {
              id: "orientation_print",
              type: "select",
              label: "WEBGIS.PRINT_ORIENTATION",
              width: 6,
              height: "input-sm",
              options: [
                {id:"Landscape",name:"WEBGIS.PRINT_LANDSCAPE"},
                {id:"Portrait",name:"WEBGIS.PRINT_VERTICAL"}
              ],
              required: true, enabled: true, show: true
            }
          ],
          [
            {
              id: "scale_print",
              type: "select",
              label: "WEBGIS.PRINT_SCALE",
              width: 6,
              height: "input-sm",
              options: scaleOpt,
              required: true, enabled: true, show: true
            },
            {
              id: "dpi_print",
              type: "select",
              label: "WEBGIS.PRINT_QUALITY",
              width: 6,
              height: "input-sm",
              options: dpiOpt,
              required: true, enabled: true, show: true
            }
          ],
          [
            {
              id: "legend_print",
              type: "checkbox",
              label: "WEBGIS.PRINT_LEGEND",
              width: 6,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "overview_print",
              type: "checkbox",
              label: "WEBGIS.PRINT_OVERVIEW",
              width: 6,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  };

  // if print configuration object is valorized into map service
  // we call configurePrint method to prepare print form
  // otherwise invoke getConfig map service method to load map configuration
  if (wgMapSvc.printCfg)
    configurePrint();
  else
  {
    wgMapSvc.getConfig(function(res)
    {
      // read print params from map configuration
      $.each(res.map.tools, function(i, tool)
      {
        if (tool.id == "print")
        {
          wgMapSvc.printCfg = tool.params;
          return false; // exit from $.each loop
        }
      });

      // read scales list from configuration, order it and save into service
      // (create a copy of scale array because we have to order it)
      wgMapSvc.printCfg.scaleArray = [];
      angular.copy(res.map.scales, wgMapSvc.printCfg.scaleArray);
      wgMapSvc.printCfg.scaleArray.sort(function(a, b){return a-b});

      // invoke print server capabilities url
      rwHttpSvc.get(
        "/webgis/print/" + wgMapSvc.printCfg.printAppName + "/capabilities.json",
        function(res)
        {
          if (!res)
            ; // TODO manage error
          else
          {
            // from result json, read map size for layouts
            var layoutArray = res.layouts;

            wgMapSvc.printCfg.format = {};

            // cycle on layouts
            for (var idx=0, len=layoutArray.length; idx<len; idx++)
            {
              var layout = layoutArray[idx];
              var layoutMapAttr = null;

              // split format and orientation into 2 variables
              var layoutNameFormatArray = layout.name.split('|');

              layoutFormat      = layoutNameFormatArray[0];
              layoutOrientation = layoutNameFormatArray[1];

              if (!wgMapSvc.printCfg.format[layoutFormat])
                wgMapSvc.printCfg.format[layoutFormat] = {};

              // retrieve layout map attributes (to read width and height)
              var layoutAttr = layout.attributes;

              for (var jdx=0, numAttr=layoutAttr.length; jdx<numAttr; jdx++)
              {
                if (layoutAttr[jdx].name == "map")
                {
                  layoutMapAttr = layoutAttr[jdx];
                  break;
                }
              }

              // save map size
              switch(layoutOrientation)
              {
                case "Portrait":
                  wgMapSvc.printCfg.format[layoutFormat].Portrait = [
                    layoutMapAttr.clientInfo.width,
                    layoutMapAttr.clientInfo.height
                  ];
                  break;

                case "Landscape":
                  wgMapSvc.printCfg.format[layoutFormat].Landscape = [
                    layoutMapAttr.clientInfo.width,
                    layoutMapAttr.clientInfo.height
                  ];
                  break;

                default:
                  console.error("Bad orientation value in print configuration: " +
                    layoutOrientation);
              }
            }

            // configure print form
            configurePrint();
          }
        }
      );
    });
  }

  /*
   * Configure print form
   */
  function configurePrint()
  {
    // setting scales combo, default is current map scale
    $.each(wgMapSvc.printCfg.scaleArray, function(i, v)
    {
      scaleOpt.push({"id": v, "name": "1:" + v});
    });

    // setting dpi combo
    if (wgMapSvc.printCfg.hasOwnProperty("dpi"))
    {
      $.each(wgMapSvc.printCfg.dpi, function(i, value)
      {
        dpiOpt.push({"id": value.id, "name": $translate.instant(value.name)});
      });
    }

    // setting format combo
    if (wgMapSvc.printCfg.hasOwnProperty("format"))
    {
      for (var key in wgMapSvc.printCfg.format)
      {
        formatOpt.push({"id": key, "name": key});
      }
    }

    // valorize object binded to print form
    $scope.printObj = {
      format_print: wgMapSvc.printCfg.default_format,
      orientation_print: "Landscape",
      scale_print: wgMapSvc.currScale,
      dpi_print: wgMapSvc.printCfg.default_dpi
    };

    // retrieve print service layer
    layerPrint = wgMapSvc.layersCfgObj[wgMapSvc.layerPrintId].layerOL;

    // configure service print layer
    layerPrint.setSource(new ol.source.Vector());
    layerPrint.setStyle(printPreviewStyle);

    // create select and translate interaction and add them to the map
    // (these interactions working only on layerPrint layer)
    selectInteraction = new ol.interaction.Select({
      condition: ol.events.condition.pointerMove,
      layers: [layerPrint],
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#5A5A5A',
          width: 1.6
        }),
        fill: new ol.style.Fill({
          color: [0, 0, 0, 0.15]
        })
      })
    });

    translateInteraction = new ol.interaction.Translate({
      features: selectInteraction.getFeatures(),
      layers: [layerPrint]
    });

    wgMapSvc.map.getInteractions().extend(
      [selectInteraction, translateInteraction]
    );

    // read new print area extent at the end of translate
    translateInteraction.on("translateend",function(e)
    {
      var feature = selectInteraction.getFeatures();
      printAreaExtent = feature.getArray()[0].getGeometry().getExtent();
    });

    // change mouse cursor when mouse is over print box feature
    // return key listener because we have to remove it on controller destroy
    pointerMoveListenerKey = wgMapSvc.map.on('pointermove', function(e)
    {
      var pixel = wgMapSvc.map.getEventPixel(e.originalEvent);

      var hit = wgMapSvc.map.hasFeatureAtPixel(pixel,
        function(layer){return layer.get('id') === wgMapSvc.layerPrintId;}
      );

      wgMapSvc.map.getTarget().style.cursor = hit ? 'move' : '';
    });

    // draw print area on map view
    drawPrintArea();
  }

  /*
   * Watch on format combo change
   */
  $scope.$watch("printObj.format_print", function(newValue, oldValue)
  {
    if (newValue != oldValue)
    {
      drawPrintArea();
    }
  }, false);

  /*
   * Watch on orientation combo change
   */
  $scope.$watch("printObj.orientation_print", function(newValue, oldValue)
  {
    if (newValue != oldValue)
    {
      drawPrintArea();
    }
  }, false);

  /*
   * Watch on scale combo change
   */
  $scope.$watch("printObj.scale_print", function(newValue, oldValue)
  {
    if (newValue != oldValue)
    {
      drawPrintArea();
    }
  }, false);


  /*
   * Action on print button
   */
  $scope.print = function()
  {
    // reset print error flag
    $scope.printError = false;

    // reset print bad EPSG flag
    $scope.printBadEPSGMsg = false;

    // reset legend object
    legendPrint = {name:'', classes:[]};

    // if form is valid -> start print process
    if ($scope.formCtrlObj["printForm"].isValid())
    {
      // retrieve layer to print
      getLayersToPrint();
    }
  };

  /*
   * Remove (on controller destroy):
   *  - map event listener using its key
   *  - drag interaction from map
   */
  $scope.$on("$destroy", function()
  {
    ol.Observable.unByKey(pointerMoveListenerKey);

    wgMapSvc.map.removeInteraction(translateInteraction);
    wgMapSvc.map.removeInteraction(selectInteraction);

    layerPrint.setSource(null);
  });

  /*
   * Retrieve print layer configuration
   */
  function getLayersToPrint()
  {
    var printlayerCfgArray     = [];
    var buildPrintSupportArray = [];

    // retrieve ordered layers array from map
    var layersArray = wgMapSvc.map.getLayers().getArray();

    // counter to manage async layer cycle to retrieve layers data
    var count = 0;
    var numLayer = layersArray.length;

    // cycle on map layers
    for (var idx=0; idx<numLayer; idx++)
    {
      // retrieve layer id
      var layerId = layersArray[idx].get('id');

      // retrieve layer configuration from map service
      var layerCfg = wgMapSvc.layersCfgObj[layerId];

      // remove special or support layers from print
      if (layerId == '_SEARCH_LAYER_ID_' || layerId == '_PRINT_LAYER_ID_')
      {
        continue;
      }

      // we have to show only current base layer -> skip all others base layers
      if (layerCfg.base == true && layerId != wgMapSvc.currBaseLayerId)
      {
        continue;
      }

      retrieveLayerToPrintCfg(layerCfg, buildPrintSupportArray);
    }

    var numLayerToPrint = buildPrintSupportArray.length;

    for (var idx=0, len=numLayerToPrint; idx<len; idx++)
    {
      // invoke async function to retrieve layers print configuration
      // the callback put layer configuration into an array;
      // when we have retrieved info from all layers (if condition),
      // we invoke managePrint function
      buildPrintLayerCfg(
        idx,
        buildPrintSupportArray[idx].param1,
        buildPrintSupportArray[idx].param2,
        function(res)
        {
          if (res && res.printLayerCfg)
          {
            // in this way we mantain map layers order
            printlayerCfgArray[res.index] = res.printLayerCfg;

            // if legend flag is true, build legend object for this layer
            if ($scope.printObj.legend_print)
              buildLayerLegend(res.param1);
          }

          // print
          if (numLayerToPrint == ++count)
          {
            // remove null from array
            // (there are null for WFS call that hasn't return)
            for (var j=printlayerCfgArray.length-1; j>0; j--)
            {
              if (!printlayerCfgArray[j])
                printlayerCfgArray.splice(j,1);
            }

            // From mapfish documentation:
            // (https://mapfish.github.io/mapfish-print-doc/attributes.html)
            // The first layer in the array will be the top layer in the map.
            // The last layer in the array will be the bottom layer in the map.
            //
            // so, we have to revert layers array order
            managePrint(printlayerCfgArray.reverse());
          }
        }
      );
    }
  }

  /*
   * Recursive function to retrieve configuration of map layers to print
   */
  function retrieveLayerToPrintCfg(layerCfg, buildPrintSupportArray)
  {
    // support variables
    var param1 = null;
    var param2 = null;

    switch(layerCfg.layerType)
    {
      case "COMPOSED_LAYER":
        var itemsArray = [];

        for (var i=0, len=layerCfg.children.length; i<len; i++)
        {
          // retrieve child layer configuration
          var childCfg = wgMapSvc.layersCfgObj[layerCfg.children[i]];

          var childMinScale = (childCfg.min_scale) ? childCfg.min_scale : 1;
          var childMaxScale = (childCfg.max_scale) ? childCfg.max_scale : Infinity;

          // if child layer is off or out of print scale, we skip it
          if(childCfg.selected &&
              ($scope.printObj.scale_print >= childMinScale &&
                $scope.printObj.scale_print <= childMaxScale))
          {
            if (layerCfg.type == "IMAGE")
            {
              itemsArray.push(childCfg.layer_name);
            }
            else
            {
              itemsArray.push(wgMapSvc.buildFilter(childCfg.filter));
            }
          }
        }

        // if array is not empty, we have to invoke function
        // to build layer print configuration
        // valorize params to be passed to the function
        if (itemsArray.length > 0)
        {
          param1 = layerCfg;
          param2 = itemsArray;
        }

        break;

      case "GROUP":
        var groupItems = layerCfg.layerOL.getLayers().getArray();

        for (var i=0, len=groupItems.length; i<len; i++)
        {
          // retrieve group items layer configuration
          var groupItemId = groupItems[i].get("id");
          var groupCfgItem = wgMapSvc.layersCfgObj[groupItemId];

          var minScale = (groupCfgItem.min_scale) ? groupCfgItem.min_scale: 1;
          var maxScale = (groupCfgItem.max_scale) ? groupCfgItem.max_scale: Infinity;

          // if group item layer is out of print scale, we skip it,
          // else we have to invoke function to build layer print configuration
          // valorize params to be passed to the function
          if (//groupCfgItem.selected &&
              ($scope.printObj.scale_print >= minScale &&
                $scope.printObj.scale_print <= maxScale))
          {
            retrieveLayerToPrintCfg(groupCfgItem, buildPrintSupportArray)
          }
        }

        break;

      case "SIMPLE_LAYER":
      case "GROUP_ITEM":

          var minScale = (layerCfg.min_scale) ? layerCfg.min_scale: 1;
          var maxScale = (layerCfg.max_scale) ? layerCfg.max_scale: Infinity;

          // if is current base layer (base layers are always simple layers)
          // or layer is selected and in print scale
          // we have to invoke function to build layer print configuration;
          // else we skip it
          // valorize params to be passed to the function
          if ((layerCfg.base == true && layerCfg.id == wgMapSvc.currBaseLayerId) ||
              (layerCfg.selected &&
                ($scope.printObj.scale_print >= minScale &&
                 $scope.printObj.scale_print <= maxScale)))
          {
            param1 = layerCfg;
            param2 = null;
          }

        break;

      default:
        console.error("Error: type " + layerCfg.layerType + " not managed!");
        console.error(layerCfg);
        break;
    }

    if (param1 != null || param2 != null)
    {
      buildPrintSupportArray.push({
        param1: param1,
        param2: param2
      });
    }
  }

  /*
   * Function that retrieve layer print configuration
   * The configuration founded is returneb invoking callback function
   */
  function buildPrintLayerCfg(index, layerCfg, itemsArray, callback)
  {
    if (!layerCfg && !itemsArray)
      callback(null);
    else
    {
      // check if layer is reprojectable when called from print server
      if (layerCfg.print_not_reproject)
      {
        if (layerCfg.source.projection &&
            layerCfg.source.projection != 'EPSG:' + wgMapSvc.mapCurrSR.code)
        {
          $scope.printBadEPSGMsg = true;
          return;
        }
      }

      // return also input variables because this function
      // makes async calls and is invoked into a cycle
      var objToRet = {
        index:  index,
        param1: layerCfg,
        param2: itemsArray
      };

      var printLayerCfg = {};

      // switch on source type
      switch(layerCfg.source.type)
      {
        case 'OSM':
        case 'XYZ':
          // in this case layer configuration is retrieved in sync way
          printLayerCfg.type = 'osm';
          //printLayerCfg.imageFormat = 'image/png';
          printLayerCfg.opacity = wgMapSvc.getOpacityLayer(layerCfg.id);
          printLayerCfg.customParams = {"TRANSPARENT": true};

          // if possible, we use inner mapserver url to access layer
          printLayerCfg.baseURL =
            (layerCfg.source.completeUrl.indexOf('http') == 0) ?
              layerCfg.source.completeUrl :
              wgMapSvc.printCfg.mapserverUrl + layerCfg.source.url;

          objToRet.printLayerCfg = printLayerCfg;

          callback(objToRet);
          break;

        case 'WMS':
          // in this case layer configuration is retrieved in sync way
          printLayerCfg.type = layerCfg.tiled ? 'tiledwms' : 'wms';

          // itemsArray, if presents, contains layers list
          printLayerCfg.layers = itemsArray ? itemsArray : [layerCfg.source.layer_name];
          printLayerCfg.imageFormat = 'image/png';
          printLayerCfg.opacity = wgMapSvc.getOpacityLayer(layerCfg.id);
          printLayerCfg.customParams = {'TRANSPARENT': true};

          // if possible, we use inner mapserver url to access layer
          printLayerCfg.baseURL =
            (layerCfg.source.completeUrl.indexOf('http') == 0) ?
              layerCfg.source.completeUrl :
              wgMapSvc.printCfg.mapserverUrl + layerCfg.source.url;

          if (layerCfg.tiled)
            printLayerCfg.tileSize = [256, 256];

          objToRet.printLayerCfg = printLayerCfg;

          callback(objToRet);
          break;

        case 'VECTOR':
          // in this case layer configuration is retrieved in async way

          // itemsArray, if presents, contains filter to apply to this layer
          if (itemsArray)
            var filter = wgMapSvc.buildWFSLayerFilter(itemsArray, 'OR');

          // invoke wfs layer
          rwHttpSvc.post(
            layerCfg.source.url,
            featureRequest(layerCfg, filter),
            function(response)
            {
              // if there aren't result we skip layer also if it's selected
              if (response.features && response.features.length == 0)
                printLayerCfg = null;
              else
              {
                // see https://groups.google.com/forum/#!topic/mapfish-print-users/28XsAZUxFSk
                // The standard EPSG:4326 is Lat-Long;
                // CRS:84 changing the axis from Lat-Long to Long-Lat
                if (wgMapSvc.mapCurrSR.code == 4326 && response.features)
                  response.crs.properties.name = 'urn:ogc:def:crs:CRS::84';

                printLayerCfg.type = (layerCfg.source.format == 'application/json') ?
                  'geojson' : 'geojson'; // TODO: manage other format
                printLayerCfg.geoJson = response;
                printLayerCfg.style = buildLayerStyle(layerCfg, response.features);
              }

              objToRet.printLayerCfg = printLayerCfg;
              callback(objToRet);
            }
          );

          break;

        case 'GEOJSON':
          // in this case layer configuration is retrieved in async way

          var printURL = layerCfg.source.completeUrl;

          // add possible filter
          if (layerCfg.source.runtimeFilter)
          {
            // source have runtime filter, but not is ready
            // we build a fake filter that return always false
            // to temporary block layer visualization
            if ($.isEmptyObject(layerCfg.source.runtimeFilter))
            {
              filter =  "id|EQ|-99";
            }
            else
            {
              filter = layerCfg.source.runtimeFilter;
            }

            // append filter to url
            printURL += printURL.indexOf("filter=") > 0 ?
                ";" + filter :
                "?filter=" + filter;
          }

          // add bbox filter equals to print area
          printURL += printURL.indexOf("filter=") > 0 ? ";" : "?filter=";

          printURL += "geom|IN_BBOX|" + printAreaExtent[0] + "," +
            printAreaExtent[1] + "," + printAreaExtent[2] + "," +
            printAreaExtent[3] + "," + wgMapSvc.mapCurrSR.code;

          rwHttpSvc.post(printURL, {}, function(response)
          {
            if (!response || response.error)
            {
              printLayerCfg = null;
            }
            else
            {
              printLayerCfg.type = 'geojson';
              printLayerCfg.geoJson = response;
              printLayerCfg.style = buildLayerStyle(layerCfg, response.features);
            }

            objToRet.printLayerCfg = printLayerCfg;
            callback(objToRet);
          });
          break;
      }
    }
  }


  /*
   * generate a GetFeature request on WFS layer
   */
  function featureRequest(layerCfg, filter)
  {
    var getFeatureCfgObj =
    {
      srsName: 'EPSG:' + wgMapSvc.mapCurrSR.code,
      featureTypes: [layerCfg.source.layer_name],
      outputFormat: layerCfg.source.format,
      propertyNames: layerCfg.source.attributes
    };

    // add filter if presents
    // we have to control if layer have a runtimeFilter
    if (filter || layerCfg.source.runtimeFilter)
    {
      if (!layerCfg.source.runtimeFilter)
      {
        getFeatureCfgObj.filter = filter;
      }
      else
      {
        // source have runtime filter, but not is ready
        // we build a filter that return always false
        // to temporary block layer visualization
        if ($.isEmptyObject(layerCfg.source.runtimeFilter))
        {
          var fakeFilter =  new ol.format.filter.EqualTo(
            'id',
            -99,
            false
          );

          getFeatureCfgObj.filter = fakeFilter;
        }
        else
        {
          getFeatureCfgObj.filter = filter ?
            new ol.format.filter.And(filter, layerCfg.source.runtimeFilter) :
            layerCfg.source.runtimeFilter;
        }
      }
    }

    // added print extent restriction to load only features into print area
    getFeatureCfgObj.bbox = printAreaExtent;
    // TODO    modify this code; geometry field name could be different ...
    getFeatureCfgObj.geometryName = 'geom';

    // create getFeature request
    var getFeatureRequest = new ol.format.WFS().writeGetFeature(getFeatureCfgObj);

    // serialize and return feature request
    return new XMLSerializer().serializeToString(getFeatureRequest);
  }

  /*
   *
   */
  function managePrint(printlayerCfgArray)
  {
    // decimal position of coordinate
    var numDec = wgMapSvc.getCoordNumDec(wgMapSvc.mapCurrSR.units);

    // create json object to post to print url
    var printPostData = {};

    printPostData.layout =
      $scope.printObj.format_print + "|" + $scope.printObj.orientation_print;
    printPostData.outputFormat = "pdf";
    printPostData.attributes = {};

    printPostData.attributes.map = {
      dpi: $scope.printObj.dpi_print,
      rotation: 0,
      scale: $scope.printObj.scale_print,
      projection: 'EPSG:' + wgMapSvc.mapCurrSR.code,
      bbox: printAreaExtent,
      layers: printlayerCfgArray
    };

    printPostData.attributes.authority = wgMapSvc.printCfg.authority;
    printPostData.attributes.title = $scope.printObj.title_print;
    printPostData.attributes.descr = $scope.printObj.description_print;
    printPostData.attributes.scale = $scope.printObj.scale_print;
    printPostData.attributes.projection = $translate.instant(wgMapSvc.mapCurrSR.name);
    printPostData.attributes.printURL = wgMapSvc.printCfg.printURL;
    printPostData.attributes.xmin = printAreaExtent[0].toFixed(numDec);
    printPostData.attributes.ymin = printAreaExtent[1].toFixed(numDec);
    printPostData.attributes.xmax = printAreaExtent[2].toFixed(numDec);
    printPostData.attributes.ymax = printAreaExtent[3].toFixed(numDec);

    // overview attributes settings
    printPostData.attributes.thereIsOverview = $scope.printObj.overview_print || false;

    // retrieve overview map url
    var mapOverviewURL =
      (wgMapSvc.overviewLayer.source.completeUrl.indexOf('http') == 0) ?
        wgMapSvc.overviewLayer.completeUrl :
        wgMapSvc.printCfg.mapserverUrl + wgMapSvc.overviewLayer.source.url;

    printPostData.attributes.overviewMap = {
      layers: [
        {
          baseURL: mapOverviewURL,
          opacity: wgMapSvc.overviewLayer.opacity,
          type: wgMapSvc.overviewLayer.source.type,
          layers: [wgMapSvc.overviewLayer.source.layer_name],
          imageFormat: wgMapSvc.overviewLayer.source.format,
          customParams: {"TRANSPARENT": false}
        }
      ]
    };

    // legend attribute settings
    printPostData.attributes.thereIsLegend = $scope.printObj.legend_print || false;
    printPostData.attributes.legend_title = $translate.instant("WEBGIS.PRINT_LEGEND");

    if (printPostData.attributes.thereIsLegend)
      printPostData.attributes.legend = legendPrint;

    // adjust coordinate order for EPSG:4326
    // (see http://docs.geotools.org/latest/userguide/library/referencing/order.html)
    if (wgMapSvc.mapCurrSR.code == 4326)
      printPostData.attributes.map.longitudeFirst = true;

    var startTime = new Date().getTime();

    $scope.showLoader = true;

    // invoke print server
    // extension (.pdf) could be customized with print supported format
    rwHttpSvc.post(
      "/webgis/print/"+wgMapSvc.printCfg.printAppName+"/report.pdf",
      printPostData,
      function(res)
      {
        if (!res)
        {
          $scope.printError = true;
          $scope.showLoader = false;
        }
        else
        {
          // recursive function to request print status
          downloadWhenReady(startTime, res);
        }
      }
    );
  }


  /*
   * Build style object (for vector layer) to pass to print server
   */
  function buildLayerStyle(layerCfg, features)
  {
    // use Mapfish JSON Style Version 2
    var printStyle = {
      version: "2"
    };

    if (!layerCfg.style)
    {
      // TODO put default values???
    }

    switch(layerCfg.styleType)
    {
      case "FIXED":

        printStyle["*"] = buildStyleRule(layerCfg.style.styles.default, null);
        break;

      case "PROPERTY":

        var styleCfgObj = null;

        // if layer have children, style can be defined on them or on parent
        if (layerCfg.children && !layerCfg.style)
        {
          styleCfgObj = {classes:[]};

          for (var idx=0, len=layerCfg.children.length; idx<len; idx++)
          {
            styleCfgObj.classes[idx] = {
              condition: layerCfg.layers[idx].filter,
              styles: layerCfg.layers[idx].style.styles ?
                layerCfg.layers[idx].style.styles :
                layerCfg.layers[idx].style/*,
              clusterStyles: layerCfg.layers[idx].cluster_style.styles ?
                layerCfg.layers[idx].cluster_style.styles :
                layerCfg.layers[idx].custerStyles*/
            };
          }
        }
        else
        {
          styleCfgObj = layerCfg.style;
        }

        // if source have cluster properties, we need also cluster style conf
        if (layerCfg.source && layerCfg.source.cluster)
          styleCfgObj.clusterStyle = layerCfg.cluster_style;

        var numClasses = styleCfgObj.classes.length;

        for (var idx=0; idx<numClasses; idx++)
        {
          var itemClass = styleCfgObj.classes[idx];

          // transform old condition object (single condition)
          // into a conditions array with a single item
          if (!itemClass.conditions && itemClass.condition)
          {
            itemClass.conditions = [itemClass.condition];
          }

          var styleRuleCond = buildStyleCond(itemClass.conditions, itemClass.op);

          printStyle[styleRuleCond] = buildStyleRule(itemClass.styles.default, features);
        }

        break;

      case "STYLE":

        printStyle["*"] = buildStyleRule(layerCfg.style.styles.default, features);
        break;
    }

    return printStyle;
  }

  /*
   * Build mapfish style rule key from style conditions (read from configuration)
   */
  function buildStyleCond(condArray, condOperator)
  {
    // return value
    var cond = "[";

    // cycle conditions array to build condition
    for (var idx=0; idx<condArray.length; idx++)
    {
      condObj = condArray[idx];

      // if propertyVal is a string, we surround it with quotes
      // this is useful for EQ operator, that is valid for both string and numbers
      var propertyVal = null;

      if (typeof condObj.property_val === 'string' ||
          condObj.property_val instanceof String)
        propertyVal = "'" + condObj.property_val + "'";
      else
        propertyVal = condObj.property_val;

      switch(condObj.operator)
      {
        case "EQ":
          cond += (condObj.property_name + " = " + propertyVal);
          break;

        case "NEQ":
          cond += (condObj.property_name + " <> " + propertyVal);
          break;

        case "LT":
          cond += (condObj.property_name + " < " + property_val);
          break;

        case "LTE":
          cond += (condObj.property_name + " <= " + property_val);
          break;

        case "GT":
          cond += (condObj.property_name + " > " + property_val);
          break;

        case "GTE":
          cond += (condObj.property_name + " >= " + property_val);
          break;

        case "LIKE":
          cond += (condObj.property_name + " LIKE '%" + property_val + "%'");
          break;

        case "ILIKE":
          cond += (condObj.property_name + " ILIKE '%" + property_val + "%'");
          break;

        case "BETWEEN":
          // in this case propertyVal is an array with two elements
          cond += ("("+ condObj.property_name + " BETWEEN " +
                  condObj.property_val[0] + "AND" + condObj.property_val[1] + ")");
          break;

        case "NOT_IN":
          // in this case propertyVal is an array
          cond += (condObj.property_name + " NOT IN (" + condObj.property_val.join() + ")");
          break;

        case "IS_NULL":
          cond += (condObj.property_name + " IS NULL ");
          break;

        case "IS_NOT":
          cond += (condObj.property_name + " IS NOT NULL ");
          break;

        default:
          console.error("filter operator " + condObj.operator + " not managed yet!");
      };

      // add operator if not is last condition added
      if (idx < condArray.length-1)
        cond += " " + condOperator + " ";
    }

    return cond + "]";
  }

  /*
   *
   */
  function buildStyleRule(styleObjArray, featuresArray)
  {
    // retrieve num of style rules
    var numStyleRules = styleObjArray.length;

    // object to return
    var styleCfg = {
      symbolizers: []
    };

    if (numStyleRules == 1)
      styleCfg.symbolizers.push(buildSimpleStyle(styleObjArray[0], featuresArray));
    else
    {
      // more styles to combine into one
      for (var i=0; i<numStyleRules; i++)
      {
        styleCfg.symbolizers.push(buildSimpleStyle(styleObjArray[i], featuresArray));
      }
    }

    return styleCfg;
  }

  /*
   *
   */
  function buildSimpleStyle(styleObj, featuresArray)
  {
    var styleRule = {};

    switch(styleObj.type)
    {
      case "circle":
        styleRule.type = "point";
        styleRule.graphicName = "circle";

        styleRule.pointRadius =
          (typeof styleObj.radius === 'string' || styleObj.radius instanceof String) ?
            evaluateExpr(styleObj.radius) : styleObj.radius;
        //styleRule.pointRadius = '[5+gid]';//styleObj.radius;

        if (styleObj.strokeColor)
        {
          styleRule.strokeColor = styleObj.strokeColor;

          var strokeColorArray = ol.color.asArray(styleObj.strokeColor);

          if (strokeColorArray.length == 4)
            styleRule.strokeOpacity = strokeColorArray[3];
        }

        if (styleObj.strokeWidth)
          styleRule.strokeWidth = styleObj.strokeWidth;

        if (styleObj.fillColor)
        {
          styleRule.fillColor = styleObj.fillColor;

          var fillColorArray = ol.color.asArray(styleObj.fillColor);

          if (fillColorArray.length == 4)
            styleRule.fillOpacity = fillColorArray[3];
        }
        break;

      case "line":
        styleRule.type = "line";

        if (styleObj.strokeColor)
        {
          styleRule.strokeColor = styleObj.strokeColor;

          var strokeColorArray = ol.color.asArray(styleObj.strokeColor);

          if (strokeColorArray.length == 4)
            styleRule.strokeOpacity = strokeColorArray[3];
        }

        if (styleObj.strokeWidth)
          styleRule.strokeWidth = styleObj.strokeWidth;
        break;

      case "poly":
        styleRule.type = "polygon";

        if (styleObj.fillColor)
        {
          styleRule.fillColor = styleObj.fillColor;

          var fillColorArray = ol.color.asArray(styleObj.fillColor);

          if (fillColorArray.length == 4)
            styleRule.fillOpacity = fillColorArray[3];
        }

        if (styleObj.strokeColor)
        {
          styleRule.strokeColor = styleObj.strokeColor;

          var strokeColorArray = ol.color.asArray(styleObj.strokeColor);

          if (strokeColorArray.length == 4)
            styleRule.strokeOpacity = strokeColorArray[3];
        }
        break;

      case "text":
      case "textPath":
        styleRule.type = "text";

        if (styleObj.fillColor)
        {
          styleRule.fillColor = styleObj.fillColor;

          var fillColorArray = ol.color.asArray(styleObj.fillColor);

          if (fillColorArray.length == 4)
            styleRule.fillOpacity = fillColorArray[3];
        }

        if (styleObj.offsetX)
          styleRule.labelXOffset = styleObj.offsetX + ''; // convert to string

        if (styleObj.offsetY)
          styleRule.labelYOffset = styleObj.offsetY + ''; // convert to string

        if (styleObj.scale)
          styleRule.fontSize = Math.round(10*styleObj.scale) + 'px';

        if (styleObj.rotation)
          styleRule.labelRotation = styleObj.rotation + ''; // convert to string

        var labelAlign;

        if (styleObj.textAlign)
        {
          switch(styleObj.textAlign)
          {
            case 'left'   : labelAlign = 'l'; break;
            case 'right'  : labelAlign = 'r'; break;
            case 'center' : labelAlign = 'c'; break;
            case 'end'    : labelAlign = 'r'; break;
            case 'start'  : labelAlign = 'l'; break;
          }
        }
        else
          labelAlign = 'c';

        if (styleObj.textBaseline)
        {
          switch(styleObj.textBaseline)
          {
            case 'bottom'      : labelAlign += 'b'; break;
            case 'top'         : labelAlign += 't'; break;
            case 'middle'      : labelAlign += 'm'; break;
            case 'alphabetic'  : labelAlign += 'b'; break;
            case 'hanging'     : labelAlign += 't'; break;
            case 'ideographic' : labelAlign += 'b'; break;
          }
        }
        else
          labelAlign += 'm';

        styleRule.labelAlign = labelAlign;

        styleRule.label = styleObj.text.replace('[', '').replace(']','');

        break;

      case "image":
        styleRule.type = "point";

        // build path to retrieve image
        styleRule.externalGraphic =
          window.location.protocol + "//" + window.location.hostname + '/' +
          wgMapSvc.printCfg.imgContext + rwConfigSvc.urlPrefix + styleObj.src;

        if (styleObj.graphicWidth)
          styleRule.graphicWidth = styleObj.graphicWidth;

        if (styleObj.graphicFormat)
          styleRule.graphicFormat = styleObj.graphicFormat;
        break;

      case "shape":
        console.error("Style type SHAPE Not implemented yet!");
        break;

      default:
        console.error("Error: Style type " + styleObj.type + " not implemented yet!");
        break;
    }

    return styleRule;
  }

  /*
   * Convert parameterized expression into mapfish style syntax
   *
   * (i.e. "5+[[gid]]" --> "[5+gid]")
   */
  function evaluateExpr(parameterizedExpr)
  {
    if (parameterizedExpr.indexOf('[') == 0)
      return parameterizedExpr.replace('[','').replace(']','');

    // reg expr to find parameter into key (find everything between [[ and ]]);
    // TODO if we have more [[..]] into key, this reg expr it finds one
    var regExpr = /\[\[.*\]\]/;

    var exprVariables = regExpr.exec(parameterizedExpr);

    // remove bracket from the begin and the end to retrieve attribute name
    var attrName = exprVariables[0].substring(2, exprVariables[0].length-2);

    // return parameterized expression with mapfish style syntax
    return "[" + parameterizedExpr.replace(regExpr, attrName) + "]";
  }

  /*
   * Build legend object (for a given layer) to be passed to mapfish
   */
  function buildLayerLegend(layerCfg)
  {
    // if layer config contains legend object
    if (layerCfg.legend)
    {
      switch(layerCfg.layerType)
      {
        case "SIMPLE_LAYER":
          // in this case invoke function on single layer
          buildLegendItem(layerCfg);
          break;

        case "COMPOSED_LAYER":
        case "GROUP":
          // in this case invoke function on parent layer
          // and on visible and enabled children
          buildLegendItem(layerCfg);

          for (var idx=0, len=layerCfg.children.length; idx<len; idx++)
          {
            var itemCfg = wgMapSvc.layersCfgObj[layerCfg.children[idx]];

            if (itemCfg.selected && !itemCfg.disabled)
            {
              buildLegendItem(itemCfg);
            }
          }
          break;

        case "GROUP_ITEM":
        case "COMPOSED_LAYER_ITEM":
          // in this case invoke function on parent layer and on child
          var parentCfg = wgMapSvc.layersCfgObj[layerCfg.id_parent]
          buildLegendItem(parentCfg);
          buildLegendItem(layerCfg);
          // retrieve parent layer configuration
          /*var parentCfg = wgMapSvc.layersCfgObj[layerCfg.id_parent];
          var groupLayers = parentCfg.layerOL.getLayers().getArray();

          for (var idx=0, len=layerCfg.children.length; idx<len; idx++)
          {
            var itemCfg = wgMapSvc.layersCfgObj[layerCfg.children[idx]];

            if (itemCfg.selected && !itemCfg.disabled)
            {
              buildLegendItem(itemCfg);
            }
          }*/
          break;

        default:
          console.error("Bad value on layerType: " + layerCfg.layerType);
          break;
      }
    }
  }

  /*
   * Build item legend object
   */
  function buildLegendItem(layerCfg)
  {
    // check if layer have a configured legend
    if (!layerCfg.legend)
      return;

    // building print legend object is different depending on legend config object
    if (layerCfg.legend.extern)
    {
      var itemLegend = layerCfg.legend;
      var iconUrl = wgMapSvc.getLegendExtern(layerCfg.id);

      // if iconUrl is a relative url, we transform it into absolute url
      if (!iconUrl.indexOf('http') == 0)
      {
        if (iconUrl.indexOf(rwConfigSvc.urlPrefix) == 0)
        {
          iconUrl = iconUrl.substr(rwConfigSvc.urlPrefix.length);
        }

        iconUrl = wgMapSvc.printCfg.mapserverUrl + iconUrl;
      }

      // create legend object
      var legendObj = {icons:[iconUrl]};

      if (itemLegend.label)
      {
        legendObj.name = $translate.instant(itemLegend.label);
      }

      legendPrint.classes.push(legendObj);
    }
    else if (layerCfg.legend.classes)
    {
      for (var idx=0, len=layerCfg.legend.classes.length; idx<len; idx++)
      {
        var itemLegend = layerCfg.legend.classes[idx];
        var iconUrl =
          window.location.protocol + "//" + window.location.hostname + '/' +
          rwConfigSvc.urlPrefix + '/wgLegendClass/image/' + itemLegend.id;

        // create legend object
        var legendObj = {icons:[iconUrl]};

        if (itemLegend.name)
        {
          legendObj.name = $translate.instant(itemLegend.name);
        }

        legendPrint.classes.push(legendObj);
      }
    }
    else if (layerCfg.legend.image)
    {
      var label = layerCfg.legend.label ?
        $translate.instant(layerCfg.legend.label) :
        $translate.instant(layerCfg.label);

      var iconUrl =
         window.location.protocol + "//" + window.location.hostname + '/' +
         rwConfigSvc.urlPrefix + '/wgLegend/image/' + layerCfg.legend.id;

      // create legend object
      var legendObj = {icons:[iconUrl]};

      if (label)
      {
        legendObj.name = label;
      }

      legendPrint.classes.push(legendObj);
    }
    else
    {
      var itemLegend = layerCfg.legend;

      legendPrint.classes.push({name: $translate.instant(itemLegend.label), icons:[]});
    }
  }

  /*
   * draw vector for area print
   */
  function drawPrintArea()
  {
    // clear layer from previous feature
    layerPrint.getSource().clear(true);
    layerPrint.getSource().refresh();

    // retrieve selected print format
    var selectedFormat = $scope.printObj.format_print;

    // retrieve selected print orientation
    var selectedOrientation = $scope.printObj.orientation_print;

    // get print area (in mm) [width, height]
    var printArea = wgMapSvc.printCfg.format[selectedFormat][selectedOrientation];

    // get print extent
    printAreaExtent = getPrintExtent(wgMapSvc.mapView.getCenter(), printArea);

    // convert extent to geometry
    var printRectGeom = new ol.geom.Polygon.fromExtent(printAreaExtent);

    // create feature
    var printRectFeature = new ol.Feature({
      name: 'printBox',
      geometry: printRectGeom
    });

    layerPrint.getSource().addFeature(printRectFeature);
  }

  /*
   * Retrieve print extent
   */
  function getPrintExtent(center, printArea)
  {
    // meters per map unit
    var MPU = ol.proj.METERS_PER_UNIT[ol.proj.get('EPSG:'+wgMapSvc.mapCurrSR.code).getUnits()];

    // map resolution
    var resolutionMap = wgMapSvc.mapView.getResolution();

    var printScale = $scope.printObj.scale_print;

    /*
     * Calculate width and height of print area:
     *
     *              pixel         m       m         m
     * ((( pixel / ------- ) * ------) * --- ) / -------- = map unit
     *              inch        inch      m      map unit
     *
     */
    var width  = (((printArea[0]/PRINT_BASE_DPI)*METERS_PER_INCH) * $scope.printObj.scale_print)/MPU;

    var height = (((printArea[1]/PRINT_BASE_DPI)*METERS_PER_INCH) * $scope.printObj.scale_print)/MPU;

    return [
      center[0] - width/2,
      center[1] - height/2,
      center[0] + width/2,
      center[1] + height/2
    ];
  }

  /*
   * Recursive function to request print status
   */
  function downloadWhenReady(startTime, postPrintRes)
  {
    if ((new Date().getTime() - startTime) > 60000)
    {
      // after 60 sec notify a print error and invoke cancel on print job
      $scope.showLoader = false;
      rwHttpSvc.delete("/webgis/print/cancel/"+postPrintRes.ref, function(){});
    }
    else
    {
      // every 2 seconds poll print server
      setTimeout(function(){
        rwHttpSvc.get("/webgis/print/status/"+postPrintRes.ref+".json", function(status)
        {
          switch (status.status)
          {
            case 'error':
            case 'cancelled':
              // TODO manage requesting status error
              $scope.printError = true;
              $scope.showLoader = false;
              break;

            case 'running':
            case 'waiting':
              downloadWhenReady(startTime, postPrintRes);
              break;


            case 'finished':
              if (status.done)
              {
                $scope.showLoader = false;
                window.location = rwConfigSvc.urlPrefix +
                  "/webgis/print/report/" + postPrintRes.ref;
              }
              break;
          }
        });
      }, 2000);
    }
  }
};


angular.module("webgis").controller("printFormCtrl",printFormCtrl);
