/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */
 
angular.module("webgis")
  .controller("wgLayerCtrl",wgLayerCtrl)
  .controller("wgLayerCfgCtrl",wgLayerCfgCtrl)
  .controller("wgBaseLayersCtrl",wgBaseLayersCtrl)
  .controller("wgLayersTreeCtrl",wgLayersTreeCtrl);

function wgLayerCtrl($scope, $timeout, wgMapSvc, rwHttpSvc, $rootScope)
{
  $scope.panel_accordion_body = "panel-body";

  // object to configure layers tree
  $scope.layersTreeOpt = null;

  // ui-tree configurations (delay to switch between click and drag)
  $scope.dataDragDelay = 250;

  // array to configure layers tree
  $scope.layersCategories = [];

  // tools configuration: key is layer id, value is config object
  $scope.toolsCfg = {};

  /*
   * Get from service JSON configuration object
   */
  wgMapSvc.getConfig(function(res)
  {
    $scope.wgConfig = res;

    // array of base layers
    $scope.baseLayersArr = $scope.wgConfig.layers.base;

    $scope.layersCfgObj = wgMapSvc.layersCfgObj;

    $scope.layersCategories = wgMapSvc.categoriesTree;

    // layers tree behaviour configuration
    $scope.layersTreeOpt =
    {
      toggle: function(collapsed, sourceNodeScope)
      {
        // setting flag display to load tree
        if (!collapsed)
          sourceNodeScope.$modelValue.display = true;
      },
      accept: function(sourceNodeScope, destNodesScope, destIndex)
      {
        var sourceModelValue = sourceNodeScope.$modelValue;
        var destModelValue   = destNodesScope.$modelValue;

        var sourceItem =
          (Array.isArray(sourceModelValue) && sourceModelValue.length > 0) ?
            sourceModelValue[0] : sourceModelValue;

        var destItem =
          (Array.isArray(destModelValue) && destModelValue.length > 0) ?
            destModelValue[0] : destModelValue;

        // items can't be moved out of source category
        if (sourceItem.id_category != destItem.id_category)
          return false;

        // items can't be moved into another group
        if (sourceItem.id_parent != destItem.id_parent)
          return false;

        return true;
      },
      beforeDrag: function(sourceNodeScope, destNodesScope, destIndex)
      {
        // categories can't be dragged (category doesn't have parent)
        var sourceParentNode = sourceNodeScope.$parentNodeScope;

        if (!sourceParentNode)
          return false;

        return true;
      },
      dropped:function(e)
      {
        // change layers order management

        // it hasn't occured no order change -> we exit
        if (e.source.index == e.dest.index)
          return;

        // we have to adjust layers order
        layerOrder(e);
      }
    };

    // variable to set style for selected base layer
    $scope.borderBaseLayer = {};
    $scope.borderBaseLayer[wgMapSvc.currBaseLayerId] = "border-layerBase";

    // initial configuration of base layer opacity slider
    $scope.configBaseSlider =
    {
      options: {
        id: wgMapSvc.currBaseLayerId,
        floor: 0,
        ceil: 100,
        step: 1,
        showSelectionBar: true,
        onChange: function(id, value){
          wgMapSvc.setOpacityLayer(id, 1-value/100);
        },
        translate: function (value) {
          return value+" %";
        }
      },
      value: (1 - wgMapSvc.getOpacityLayer(wgMapSvc.currBaseLayerId))*100
    };
  });

  /*
   * Change map layer order in response to a drag event on layers tree
   */
  function layerOrder(e)
  {
    var destItemArr = e.dest.nodesScope.$modelValue;

    // retrieve moved layer cfg
    var layerToMoveCfg = e.source.nodeScope.$modelValue;

    if (layerToMoveCfg.id_parent)
    {
      // layer have a parent -> we have to move it into parent boundaries

      if (layerToMoveCfg.layerType == "COMPOSED_LAYER_ITEM")
      {
        // in this case we have to change order into parent layer
        var parentCfg = $scope.layersCfgObj[layerToMoveCfg.id_parent];

        if (parentCfg.type == 'IMAGE')
        {
          // arrange wmsParams.LAYERS attribute
          var strListLayers = '';

          var source = parentCfg.layerOL.getSource();
          var params = source.getParams();

          // cicle on items to build strListLayers
          for (var idx=0; idx<destItemArr.length; idx++)
          {
            var itemCfg = destItemArr[idx];

            if (itemCfg.visible && !itemCfg.disabled)
            {
              strListLayers += (itemCfg.layer_name + ',');
            }
          }

          if (strListLayers != '')
            strListLayers = strListLayers.substring(0, strListLayers.length-1);

          // update layer source
          params.LAYERS = strListLayers;
          source.updateParams(params);
        }
        else if (parentCfg.type == 'VECTOR')
        {
          if (parentCfg.style instanceof ol.style.Style)
          {
            ; // in this case style is unique for layer
          }
          else // is and ol.StyleFunction
          {
            if (parentCfg.styleCache && Object.keys(parentCfg.styleCache).length > 0)
            {
              var zIndex = 1;

              for (var idx=0; idx<destItemArr.length; idx++)
              {
                var defaultKey = destItemArr[idx].style.default_key;

                if ((parentCfg.styleCache).hasOwnProperty(defaultKey))
                {
                  (parentCfg.styleCache[defaultKey]).setZIndex(zIndex++);
                }
              }

              // redraw layer
              parentCfg.layerOL.getSource().refresh();
            }
            else
            {
              // in this case layer has never been turned on,
              // so styles are not created.
              // We have to change styles configuration object
              var zIndex = 1;

              for (var idx=0; idx<destItemArr.length; idx++)
              {
                var defaultStylesArray = destItemArr[idx].style.default;

                for (var jdx=0; jdx<defaultStylesArray.length; jdx++)
                {
                  var style = defaultStylesArray[jdx];
                  style.zIndex = zIndex++;
                }
              }
            }
          }
        }
      }
      else
      {
        // retrieve new layer position
        var destLayerIndex = (e.source.index < e.dest.index) ?
          e.dest.index-1 : e.dest.index+1;

        var destLayer   = destItemArr[destLayerIndex].layerOL;
        var sourceLayer = destItemArr[e.dest.index].layerOL;

        var sourceIndex = -1;
        var destIndex   = -1;

        var sourceLayerId = sourceLayer.get('id');
        var destLayerId   = destLayer.get('id');

        // in this case we have to change order into group
        var groupCfg = $scope.layersCfgObj[layerToMoveCfg.id_parent];

        var groupOL = groupCfg.layerOL;
        var groupItemArray = groupOL.getLayers().getArray();

        for (var idx=0; idx<groupItemArray.length; idx++)
        {
          if (groupItemArray[idx].get('id') == sourceLayerId)
            sourceIndex = idx;

          if (groupItemArray[idx].get('id') == destLayerId)
            destIndex = idx;

          // remove moved layer from the original position and place it in the new one
          if (sourceIndex >= 0 && destIndex >= 0)
          {
            groupOL.getLayers().removeAt(sourceIndex);
            groupOL.getLayers().insertAt(destIndex, sourceLayer);

            break;
          }
        }
      }
    }
    else
    {
      // layer haven't a parent -> we have to move it into its category
      var destLayerIndex = (e.source.index < e.dest.index) ?
        e.dest.index-1 : e.dest.index+1;

      var destLayer   = destItemArr[destLayerIndex].layerOL;
      var sourceLayer = destItemArr[e.dest.index].layerOL;

      var sourceIndex = -1;
      var destIndex   = -1;

      var sourceLayerId = sourceLayer.get('id');
      var destLayerId   = destLayer.get('id');

      // map layers array
      var layersArr = wgMapSvc.map.getLayers().getArray();

      var itemId = null;

      // cycle into map layers array to find source and dest index
      for (var idx=0, len=layersArr.length; idx<len; idx++)
      {
        var item = layersArr[idx];

        itemId = layersArr[idx].get('id');

        if (itemId == sourceLayerId)
          sourceIndex = idx;

        if (itemId == destLayerId)
          destIndex = idx;

        // remove moved layer from the original position and place it in the new one
        if (sourceIndex >= 0 && destIndex >= 0)
        {
          wgMapSvc.getMap().getLayers().removeAt(sourceIndex);
          wgMapSvc.getMap().getLayers().insertAt(destIndex, sourceLayer);

          break;
        }
      }
    }
  }

  /*
   * active layer of type base,
   * set opacity layer base and css border icon layer
   */
  $scope.selectBaseLayer = function(layerId)
  {
    // reset style variable (deselect)
    $scope.borderBaseLayer = {};

    // hide old base layer
    wgMapSvc.manageLayerVisibility(wgMapSvc.currBaseLayerId, false);

    // set style on new base layer (select)
    $scope.borderBaseLayer[layerId] ="border-layerBase";

    wgMapSvc.currBaseLayerId = layerId;

    // display new base layer
    wgMapSvc.manageLayerVisibility(layerId, true);

    // update configuration of opacity slider
    $scope.configBaseSlider.value = (1 -
      wgMapSvc.getOpacityLayer(wgMapSvc.currBaseLayerId))*100;

    $scope.configBaseSlider.options.id = wgMapSvc.currBaseLayerId;
  };

  // force redraw slider to opening of the panel of base layer
  setTimeout(function()
  {
    $scope.$broadcast('reCalcViewDimensions');
  }, 100);

  /*
   * Called on layer tools button click.
   */
  $scope.manageLayerTools = function(layerId)
  {
    var layerTools = $scope.toolsCfg[layerId];

    if (!layerTools || !layerTools.slOptions)
    {
      layerTools =
      {
        slOptions: {
          id: layerId,
          step: 1,
          ceil: 100,
          floor: 0,
          showSelectionBar: true,
          onChange: function(id,value) {
            wgMapSvc.setOpacityLayer(id,1-value/100);
          },
          translate: function(value) {
            return value+" %";
          }
        },
        slValue: (1 - wgMapSvc.getOpacityLayer(layerId))*100,
        show: false
      };

      $scope.toolsCfg[layerId] = layerTools;
    }

    layerTools.show = !layerTools.show;

    if(layerTools.show)
    {
      // Refresh slider
      $timeout(function () {
        $scope.$broadcast('rzSliderForceRender');
      });
    }
  };

  /*
   * Method binded with layer selection check
   */
  $scope.selectLayer = function(layerId)
  {
    // get selected flag
    var selectedFlag = $scope.layersCfgObj[layerId].selected;

    // invoke service method
    wgMapSvc.manageLayerVisibility(layerId, selectedFlag);
  };

  /*
   * Zoom to layer extent.
   * If not defined, zoom to initial map bounding box.
   */
  $scope.zoomToLayerExtent = function(layerId)
  {
    var layerCfg = $scope.layersCfgObj[layerId];

    // Retrieve layer bbox
    var bbox, bboxEPSG;

    if (layerCfg.extent != undefined)
    {
      bbox     = layerCfg.extent;
      bboxEPSG = layerCfg.source.projection;
    }
    else
    {
      var mapSR = wgMapSvc.projObj[wgMapSvc.mapDefaultSRId];

      bbox     = wgMapSvc.mapBbox;
      bboxEPSG = mapSR.cfgParams.code;
    }

    // Convert bbox into current map SR (if it necessary)
    if (wgMapSvc.mapCurrSR.code != bboxEPSG)
    {
      bbox = ol.proj.transformExtent(
        bbox,
        bboxEPSG,
        'EPSG:' + wgMapSvc.mapCurrSR.code
      );
    }

    zoomToExtent(bbox);
  };


  /*
   * Zoom to extent
   */
  function zoomToExtent(bbox)
  {
    // Find map center
    var center = [(bbox[0]+ bbox[2])/2, (bbox[1]+ bbox[3])/2];

    // Retrieve max resolution for given extent
    var xResolution = ol.extent.getWidth(bbox) / wgMapSvc.map.getSize()[0];
    var yResolution = ol.extent.getHeight(bbox) / wgMapSvc.map.getSize()[1];
    var res = Math.max(xResolution, yResolution);

    // Retrieve our resolution that best fit resolution's extent
    for (var i=0; i<wgMapSvc.resolutions.length-1; i++)
    {
      if (wgMapSvc.resolutions[i] < res &&
          wgMapSvc.resolutions[i+1] > res)
        res = wgMapSvc.resolutions[i];
    }

    // Fit view to bounding box
    //wgMapSvc.mapView.fit(bbox, wgMapSvc.map.getSize()); OL v 3.20
    wgMapSvc.mapView.fit(bbox);
  }

  /*
   * Return true/false if layer has any visibility limitations on scales
   */
  $scope.layerHasScaleLimit = function(layerId)
  {
    var retVal = false;
    var layerCfg = $scope.layersCfgObj[layerId];

    if (layerCfg.min_scale || layerCfg.max_scale)
      retVal = true;

    return retVal;
  }

  /*
   * Return type of scale limit on layer:
   *
   * - until to 1:min_scale
   * - from 1:min_scale to 1:max_scale
   * - from 1:max_scale
   */
  $scope.scaleLimitType = function(layerId)
  {
    var type = null;
    var layerCfg = $scope.layersCfgObj[layerId];

    if (layerCfg.min_scale || layerCfg.max_scale)
    {
      if (layerCfg.max_scale && layerCfg.min_scale == undefined)
        type = "_FROM_SCALE_";
      else if (layerCfg.min_scale && layerCfg.max_scale == undefined)
        type = "_UNTIL_TO_SCALE_";
      else if (layerCfg.min_scale && layerCfg.max_scale)
        type = "_FROM_TO_SCALE_";
    }

    return type;
  }

  /*
   * On controller destroy:
   * - reset categories display flag (used by layer tree)
   */
  $scope.$on("$destroy",function()
  {
    for (var j = 0;j < $scope.layersCategories.length;j++)
    {
      $scope.layersCategories[j].display = false;

      // Reset flag on layers too
      if ($scope.layersCategories[j].layers)
        resetDisplayFlag($scope.layersCategories[j].layers);
    }
  });

  /*
   * Recursive function used to reset display flag on layers.
   */
  function resetDisplayFlag(aLayer)
  {
    for (var i = 0;i < aLayer.length;i++)
    {
      aLayer[i].display = false;

      if (aLayer[i].layers)
        resetDisplayFlag(aLayer[i].layers);
    }
  }
};

/*
 * Controller of layer-config.html.
 * Load webgis config. Has other configurations,functions used by
 * wgBaseLayersCtrl and wgLayersTreeCtrl.
 */
function wgLayerCfgCtrl($scope,$state,$uibModalInstance,rwConfigSvc,wgMapSvc,
  rwI18NSvc,wgLayer,wgBaseLayer,wgCategory,rwHttpSvc,rwAuthSvc)
{
  $scope.alert = {};
  $scope.formCtrlObj = {};

  // Flag used to know if config was loaded
  $scope.configLoaded = false;

  // Base Layers for base-layer
  $scope.baseLayers = [];
  // Categories Array for layer-tree
  $scope.tree = [];

  $scope.bReload = false;

  // Panel header config
  $scope.headerCfg =
  {
    title: "WEBGIS.LAYERS_CFG_PANEL",
    minimized: false,
    modalInstance: $uibModalInstance
  };

  /*
   * I18n loaded event.
   * NOTE When i18n is loaded, get Config.
   */
  $scope.$on("rwI18NSvc.refreshed",function(ev)
  {
    if(!$scope.configLoaded)
      $scope._getConfig();
  });

  /* Modal is closing ...*/
  $scope.$on("modal.closing",function()
  {
    /* If something is changed, reload main state (to see what has been
     * changed into layers cfg) */
    if($scope.bReload)
    {
      // Refresh i18n
      rwI18NSvc.refresh();
      // Reload main state (to see what has been changed into layers cfg)
      $state.reload("main");

      $scope.bReload = false;
    }
  });

  $scope.i18nFormCfg =
  {
    id:"i18nForm", fg:
    [
      {
        show:true, label:"", rows:[[]]
      }
    ]
  };

  $scope.permissionFormCfg =
  {
    id:"layerPermissionForm", fg:
    [
      {
        show:true, label:"",rows:
        [
          [
            {
              id:"permission_exist",
              type:"checkbox",
              label:"WORDS.PRIVATE",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id:"permission_descr",
              type:"textarea",
              label:"WORDS.DESCRIPTION",
              width: 9,
              maxlength: 128,
              rows: 1,
              height: "input-sm",
              required: false, enabled: false, show: true
            }
          ]
        ]
      }
    ]
  }

  /* ui-tree configurations */
  $scope.dataDragDelay = 250;

  // Populate i18nFormCfg
  var i18nFormFg =  $scope.i18nFormCfg.fg[0].rows[0];

  // Get Languages from rwConfigSvc
  for(var i=0,numLang=rwConfigSvc.languages.length;i<numLang;i++)
  {
    var lang = rwConfigSvc.languages[i];
    var width = 12/numLang;
    var formObj =
    {
      id: lang,
      type: "text",
      label: lang,
      width: width,
      height: "input-sm",
      required: false, enabled: true, show: true
    }

    if(lang == "it")
      formObj.required = true;

    i18nFormFg.push(formObj);
  }

  /* Alert event and functions */
  $scope.$on("showAlert",function(ev,cfg)
  {
    $scope.alert.tag = cfg.tag;
    $scope.alert.msg = cfg.msg;
    $scope.alert.btOk = cfg.btOk;
    $scope.alert.btKo = cfg.btKo;
    $scope.alert.style = cfg.style;
    $scope.alert.callback = cfg.callback;
  });

  $scope.alertOk = function()
  {
    // Look for callback
    if ($scope.alert.callback)
      $scope.alert.callback();

    // Reset alert
    $scope.alert = {};
  };

  $scope.alertKo = function()
  {
    $scope.alert = {};
  };

  /* Scope functions */

  // Get layer config
  $scope._getConfig = function()
  {
    var permMasterUrl = "/permission/master?filter=app_name|EQ|webgis";
    var wConfigUrl = "/webgis/getConfig";

    // Get Permission's master (filtered by app_name 'webgis') ;
    rwHttpSvc.get(permMasterUrl,function(pRes)
    {
      var aPerms = [];
      if(pRes && pRes.result)
      {
        if (pRes.result.length)
          aPerms = pRes.result.map(function(el){ return el.name; });

        // user permission
        var objToSend = {permLayers: aPerms};

        /*NOTE
         * Get Webgis Config passing all permissions
         * (to get all layers even if the user hasn't permissions configured)
         */
        rwHttpSvc.post(wConfigUrl, objToSend, function(res)
        {
          if (!res || res.error)
            console.error("wg-ctrl-layers.js: ERROR on retrieve webgis configuration!");
          else
          {
            if(res && res.layers)
            {
              $scope.configLoaded = true;

              /* Get map sr */
              $scope.mapSr = res.map.sr;
              /* Get map format */
              $scope.wmsMapFormat = res.map.image_format ? res.map.image_format : [];
              $scope.wfsMapFormat = res.map.vector_format ? res.map.vector_format : [];
              $scope.infoFormat = res.map.info_format ? res.map.info_format : [];
              /* Get base layers */
              $scope.baseLayers = [];
              var aBaseLayers = res.layers.base;
              for(var j=0; j<aBaseLayers.length;j++)
              {
                var layer = new wgBaseLayer(aBaseLayers[j]);
                $scope.baseLayers.push(layer);
              }

              /* Get categories for layer-tree */
              $scope.tree = [];
              var aCategories = res.layers.categories;
              for(var i=0;i<aCategories.length;i++)
              {
                var category = new wgCategory(aCategories[i]);
                $scope.tree.push(category);
              }
            }
            else
            {
              $scope.$emit("showAlert",{
                msg:"CORE_LBL.MAP_GET_CONFIG_ERR",btKo:"Ok",style:"danger"});
            }
          }
        });
      }
      else
        console.error("wg-ctrl-layers.js: ERROR on retrieve permission master!");
    });
  };

  // Retrive recursively all layers for the service
  $scope._getLayersService = function(array, layersObj)
  {
    for(var i=0; i < array.length; i++)
    {
      var item = array[i];

      if (item.hasOwnProperty("Layer"))
      {
        $scope._getLayersService(item.Layer, layersObj);
      }
      else
      {
        var minScale = "";
        var maxScale = "";
        if (item.MinScaleDenominator)
           minScale = item.MinScaleDenominator.toFixed(0);
        if (item.MaxScaleDenominator)
        {
          minScale = (minScale == "") ? 1: minScale;
          maxScale = item.MaxScaleDenominator.toFixed(0);
        }

        var layerId = item.Name;
        var layerObj = {
          label: item.Title,
          id: layerId,
          layer_name: item.Name,
          min_scale: minScale,
          max_scale: maxScale,
          bounding_box: item.BoundingBox,
          style: item.Style,
          added: false
        };

        // Manage spatial reference
        if(item.SRS) // Version 1.3.0
          layerObj.SRS = item.SRS;

        if(item.CRS) // Version 1.1.1
          layerObj.CRS = item.CRS;

        // Manage style
        if(item.Style)
          layerObj.style= item.Style;

        layersObj[layerId] = layerObj;
      }
    }
    return layersObj;
  };

  $scope._getFileExtension = function(filename)
  {
    var aSplittedFilename = filename.split(".");
    var fileExtension = null;
    if(aSplittedFilename.length > 0)
    {
      //Get the file extension
      fileExtension = aSplittedFilename[aSplittedFilename.length-1];
    }
    return fileExtension;
  };

  // Set the reload's flag (used to reload state 'main')
  $scope._setReload = function(flag)
  {
    $scope.bReload = flag;
  };

  /* Get categories from map configuration */
  if(rwI18NSvc.isReady())
    $scope._getConfig();
};

/*
 * Controller of base layer configuration view (base-layer.html)
 */
function wgBaseLayersCtrl($scope,$translate,rwConfigSvc,rwAuthSvc,rwHttpSvc,
  rwI18NSvc,wgBaseLayer)
{
  $scope.showLoader = false;
  $scope.baseLayerEntity = null;
  $scope.showBaseLayerForm = false;
  $scope.baseFormCtrlObj = {};
  $scope.dBaseLayers = {};

  $scope.imageToShow = null;
  $scope.fileExt = null;
  $scope.showIconError = false;
  $scope.iconErrorMsg = "";

  // Disable icon delete button
  $scope.disabled = true;

  $scope.baseLayerSourceFormCfg =
  {
    id:"baseLayerSourceForm",changeCallback:_sourceAttributeChanged, fg:
    [
      {
        show:true, label:"WEBGIS.BASIC_CONFIG", rows:
        [
          [
            {
              id: "type",
              type: "select",
              label: "WORDS.SERVICE",
              options:
              [
                {id:"WMS",name:"WEBGIS.WMS"},
                {id:"OSM",name:"WEBGIS.OSM"},
                {id:"XYZ",name:"WEBGIS.XYZ"}
              ],
              width: 3,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "url",
              type: "text",
              label: "WEBGIS.GEOSERVICE.SERVICE_URL",
              width: 7,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "load_service_btn",
              type: "glyphButton",
              label: "",
              icon: "download-alt",
              width: 2,
              height: "input-sm",
              title: "WORDS.DOWNLOAD",
              required: false, enabled: true, show: true
            }
          ],
          [
            {
              id: "layer_name",
              type: "customSelect",
              label: "WEBGIS.GEOSERVICE.SERVICE_NAME",
              customOption: {key:"layer_name",label:"label"},
              options: [],
              width: 6,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "projection",
              type: "select",
              label: "WORDS.PROJECTION",
              options:[],
              width: 4,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "transparent",
              type: "checkbox",
              label: "WORDS.TRANSPARENCY",
              width: 2,
              height: "input-sm",
              required: true, enabled: true, show: true
            }
          ],
          [
            {
              id: "format",
              type: "select",
              label: "WORDS.FORMAT",
              options: [],
              width: 4,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "version",
              type: "text",
              label: "WORDS.VERSION",
              width: 4,
              height: "input-sm",
              required: false, enabled: false, show: true
            }
          ]
        ]
      }
    ]
  };

  $scope.baseLayerFormCfg =
  {
    id:"baseLayerForm", fg:
    [
      {
        show:true, label:"", rows:
        [
          [
            {
              id: "opacity",
              type: "number",
              min:0,
              max:1,
              label: "WORDS.OPACITY",
              width: 4,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "tiled",
              type: "checkbox",
              label: "Tiled",
              width: 4,
              height: "input-sm",
              required: true, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  }

  /* ui-tree configurations */
  $scope.baseTreeOptions =
  {
    beforeDrag:function(sourceNodeScope)
    {
      var ent = $scope.baseLayers[sourceNodeScope.$index];
      var res = false;

      if(!$scope.showBaseLayerForm)
      {
        // The user can move only saved layer!
        if(ent.op != undefined)
        {
          if(ent.op == "U")
            res = true;
        }
      }

      return res;
    },
    dropped:function(e)
    {
      // it hasn't occured no order change -> we exit
      if (e.source.index == e.dest.index)
        return;

      var sourceEnt = e.source.nodeScope.$modelValue;

      // Create the array containing layer to update the position
      var aBLayerToUpdate = [];

      var destPos = $scope.dropDestEnt._position;
      // Destination's index is greater then start's index
      if(sourceEnt._position < destPos)
      {
        for(var i=0;i<$scope.baseLayers.length;i++)
        {
          var bl = $scope.baseLayers[i];
          if(sourceEnt.id != bl.id && bl._position <= destPos) // Decrease its _position
          {
            bl._position--;
            aBLayerToUpdate.push({id:bl.id, _position:bl._position});
          }
        }
      }
      else if(sourceEnt._position > destPos)// Destination's index is less then start's index
      {
        for(var i=0;i<$scope.baseLayers.length;i++)
        {
          var bl = $scope.baseLayers[i];
          if(sourceEnt.id != bl.id && bl._position >= destPos) // Increase its _position
          {
            bl._position++;
            aBLayerToUpdate.push({id:bl.id, _position:bl._position});
          }
        }
      }
      // Change sourceEnt position and push it into aBLayerToUpdate
      sourceEnt._position = destPos;
      aBLayerToUpdate.push({id:sourceEnt.id, _position:destPos});

      /* Bulk save to update layers position */
      var bulkUrl = "/"+$scope.dropDestEnt._name+ "/bulkUpdate";
      $scope.showLoader = true;
      rwHttpSvc.post(bulkUrl, aBLayerToUpdate, function(res)
      {
        $scope.showLoader = false;
        if(!res || !res.result)
        {
          $scope.$emit("showAlert",{
            msg: "CORE_LBL.INSERT_ERR",
            btKo: "Ok",
            style: "danger"});
        }
        else
          $scope._setReload(true);
      });
    },
    beforeDrop:function(e)
    {
      var res = false;
      $scope.dropDestEnt = null;
      $scope.dropDestEnt = $scope.baseLayers[e.dest.index]; // Get the swapped ent

      // The node can be swapped only with an inserted node!
      if($scope.dropDestEnt.op == "U")
        res = true;

      return res;
    },
    accept: function(sourceNodeScope, destNodesScope, destIndex)
    {
      return true;
    }
  }

  /* Scope functions */
  $scope.editBaseLayer = function(it)
  {
    $scope.baseLayerEntity = it.$modelValue;

    var sourceObj = $scope.baseLayerEntity.source;
    var imageObj = $scope.baseLayerEntity.image;

    if(sourceObj)
    {
      if(sourceObj.type =="WMS")
      {
        // Get service capabilities
        _loadServiceCapabilities(function(res)
        {
            if(res)
            {
              // Manage view and datasources
              _sourceAttributeChanged("type",sourceObj.type,null);
              _sourceAttributeChanged("layer_name",sourceObj.layer_name,null);
            }
            $scope.showBaseLayerForm = true;
        });
      }
      else
      {
        // Manage view and datasources
        _sourceAttributeChanged("type",sourceObj.type,null);
        _sourceAttributeChanged("layer_name",sourceObj.layer_name,null);
        $scope.showBaseLayerForm = true;
      }
    }
    else // Is a new layer
      $scope.showBaseLayerForm = true;

    if(!imageObj)
    {
       // Reset image
      $scope.disabled = true;
      $scope.imageToShow = null;
    }
    else
    {
      // Set the image
      $scope.disabled = false;
      $scope.imageToShow = imageObj;
    }
  }

  $scope.removeBaseLayer = function(it)
  {
    $scope.$emit("showAlert",
    {
      msg: "CORE_MSG.DELETE_ITEM_MSG",
      btOk: "WORDS.YES",
      btKo: "No",
      style: "info",
      callback: function()
      {
        var baseLayerEntity = it.$modelValue;
        var bIsDefaultLayer = baseLayerEntity._default;
        var operation = baseLayerEntity.op;
        if (operation == "U")
        {
          rwHttpSvc.delete("/" +
            baseLayerEntity._name + "/delete/" +baseLayerEntity.id ,function(res)
          {
            if (res && res.result)
            {
              it.remove();
              $scope.showBaseLayerForm = false;

              $scope._setReload(true);

              if(bIsDefaultLayer && $scope.baseLayers.length >0) // Set another layer as default
              {
                $scope.baseLayers[0]._default = true;
                // Bulk save to update layers default
                _defaultLayerBulk(baseLayerEntity,[{id:$scope.baseLayers[0].id,_default:true}]);
              }
            }
            else
            {
              $scope.$emit("showAlert",{
                msg: "CORE_LBL.DELETE_ERR",
                btKo: "Ok",
                style: "danger"});
            }
          });
        }
        else
        {
          it.remove();
          $scope.showBaseLayerForm = false;
          if(bIsDefaultLayer && $scope.baseLayers.length >0) // Set another layer as default
          {
            // Bulk save to update layers default
            $scope.baseLayers[0]._default = true;
            _defaultLayerBulk(baseLayerEntity,[{id:$scope.baseLayers[0].id,_default:true}]);
          }
        }
      }
    });
  }

  $scope.addBaseLayer = function()
  {
    // Create an empty wgBaseLayer and add to the baseLayers array
    var l = new wgBaseLayer();

    // Find the max _position to set new
    var max_position = 0;
    for(var i=0; i< $scope.baseLayers.length; i++)
    {
      var bl = $scope.baseLayers[i];
      if(bl._position > max_position)
        max_position = bl._position;
    }
    // Set _position,category's id and depth
    l._position = max_position +1;

    // Reset image
    $scope.disabled = true;
    $scope.imageToShow = null;

    // Set as current entity the created entity and show the form
    $scope.baseLayerEntity = l;
    $scope.showBaseLayerForm = true;
  }

  // Delete the icon
  $scope.deleteIcon = function()
  {
    // Restore entity and scope variables
    $scope.baseLayerEntity.image = null;
    $scope.imageToShow = null;
    $scope.fileExt = null;

    // Disable delete image
    $scope.disabled = true;
  }

  // Save the base layer
  $scope.save = function()
  {
    // Control if all mandatory fields have been inserted
    if($scope.baseFormCtrlObj.i18nForm.isValid() &
      $scope.baseFormCtrlObj.baseLayerSourceForm.isValid() &
      $scope.baseFormCtrlObj.baseLayerForm.isValid())
    {
      // Control the image presence
      if($scope.baseLayerEntity.image == null ||
        $scope.baseLayerEntity.image == "")
      {
        // Show error to the user
        $scope.showIconError = true;
        $scope.iconErrorMsg = "WEBGIS.IMAGE_EMPTY_ERR";
      }
      else
      {
        var chgObj = $scope.baseLayerEntity.changedKeys(),
          entId = $scope.baseLayerEntity.id,
          operation = $scope.baseLayerEntity.op;

        if(!chgObj)
        {
          // Do nothing
          return;
        }
        if (operation == "U")
        {
          // Update
          var url = "/"+$scope.baseLayerEntity._name+"/update/"+entId;

          $scope.showLoader = true;
          rwHttpSvc.put(url,chgObj,function(res)
          {
            $scope.showLoader = false;
            if (res && res.result)
            {
              $scope._setReload(true);

              // Reload i18n to show the new label only if i18n is changed
              if(chgObj.hasOwnProperty("i18n"))
                $translate.refresh(rwConfigSvc.language);

              $scope.baseLayerEntity.updateChangedKeys();
            }
            else
            {
              $scope.baseLayerEntity.restoreChangedKeys();

              $scope.$emit("showAlert",{
                msg:"CORE_LBL.UPDATE_ERR",btKo: "WORDS.CLOSE",style:"danger"});
            }
          });
        }
        else if(operation == "I") // Insert
        {
          // Insert
          var url = "/"+$scope.baseLayerEntity._name+"/insert";

          $scope.showLoader = true;
          rwHttpSvc.post(url,chgObj,function(res)
          {
            $scope.showLoader = false;
            if (res && res.result)
            {
              $scope._setReload(true);

              $scope.baseLayerEntity.id = res.result.id;
              $scope.baseLayerEntity.op = "U";
              $scope.baseLayerEntity.updateChangedKeys();

              $scope.baseLayers.push($scope.baseLayerEntity);

              // Reload i18n to show the new label
              $translate.refresh(rwConfigSvc.language);
            }
            else
            {
              $scope.$emit("showAlert",{
                msg:"CORE_LBL.INSERT_ERR",btKo: "WORDS.CLOSE",style:"danger"});
            }
          });
        }
      }
    }
  }

  // Hide the showed base layer
  $scope.close = function()
  {
    if($scope.baseLayerEntity.changedKeys()) // There are unsaved things into the entity
    {
      $scope.$emit("showAlert",
      {
        msg: "WEBGIS.CLOSE_MSG",
        btOk: "WORDS.YES",
        btKo: "No",
        style: "info",
        callback: function()
        {

          $scope.baseFormCtrlObj.i18nForm.reset();
          $scope.baseFormCtrlObj.baseLayerSourceForm.reset();
          $scope.baseFormCtrlObj.baseLayerForm.reset();

          $scope.showBaseLayerForm = false;

          if($scope.baseLayerEntity.op == "U")
            $scope.baseLayerEntity.restoreChangedKeys();

          $scope.baseLayerEntity = null;
        }
      });
    }
    else
    {
      $scope.showBaseLayerForm = false;
      $scope.baseLayerEntity = null;
    }
  }

  // Set the default base layer showed on map initialization
  $scope.defaultChanged = function(it,idx)
  {
    // Create the array containing layer to update the _default
    var aLayerToUpdate = [];
    var ent = $scope.baseLayers[idx];
    aLayerToUpdate.push({id:ent.id, _default:true});

    // Update the array setting _default = false to the "ex" default layer
    for(var i=0, n=$scope.baseLayers.length, found=false; i< n && !found; i++)
    {
      if(i != idx)
      {
        var layer = $scope.baseLayers[i];

        if(layer._default)
        {
          found = true;
          layer._default = false;
          aLayerToUpdate.push({id:layer.id, _default:false});
        }
      }
    }

    // Bulk save to update layers default
    _defaultLayerBulk(ent,aLayerToUpdate);
  }

  /* Watches */
  $scope.$watch("baseLayerEntity.source.load_service_btn",function(nv,ov)
  {
    if (nv == undefined)
      return;

    $scope.baseLayerEntity.source.load_service_btn = undefined;

    // Get service capabilities
    _loadServiceCapabilities(function(res)
    {
        //Do nothing
    });
  });

  $scope.$watch("baseLayerEntity.image",function(nv,ov)
  {
    if(nv == undefined)
      return;

    if(nv != null)
    {
      $scope.disabled = false;
      $scope.imageToShow = $scope.baseLayerEntity.image;
    }
    else
      $scope.disabled = true;
  });

  $scope.$watch("file", function(newObj,oldObj)
  {
    if (newObj == undefined)
      return;

    // Dictionary of img extensions
    var imageExtensions = { img:"", png:"", jpg:"", jpeg:"", gif:""};

    // Get the file extension
    $scope.fileExt = $scope._getFileExtension(newObj.name);

    if($scope.fileExt != null)
    {
      // The file is an image
      if(imageExtensions.hasOwnProperty($scope.fileExt))
      {
        $scope.showIconError = false;

        var reader = new FileReader();
        reader.onload = function(ev)
        {
          // Show image's preview
          $scope.disabled = false;
          var image = ev.target.result;
          // Replace base64 attribute
          $scope.imageToShow =
            image.replace(/^data:image\/(img|png|jpg|jpeg|gif);base64,/, "");
          // Save the new image into the baseLayerEntity
          $scope.baseLayerEntity.image = $scope.imageToShow;
          $scope.$apply();
        };
        // Read the original obj to show a preview, instantly
        reader.readAsDataURL(newObj);
      }
      else
      {
        // Show error to the user
        $scope.showIconError = true;
        $scope.iconErrorMsg = "WEBGIS.ICON_CHARGE_ERR";
      }
    }
  });

  /* Private Functions */
  function _loadServiceCapabilities(callback)
  {
    // check for presence of ? in url_service
    var quesryStringAppender =
      ($scope.baseLayerEntity.source.url.indexOf('?') > 0) ? '&' : '?';

    // Control if the service_url is out of our geoserver
    var pattern = /^http(s)?:\/\//i;

    if(pattern.test($scope.baseLayerEntity.source.url))
    {
      var capUrl = $scope.baseLayerEntity.source.url + quesryStringAppender +
        "request=GetCapabilities&service=" + $scope.baseLayerEntity.source.type;

      var getCapabilityUrl = "/utility/proxy?url=" + encodeURIComponent(capUrl);

//       var getCapabilityUrl = "/webgis/proxyRequest/"+
//         $scope.baseLayerEntity.source.url  + quesryStringAppender +
//         "request=GetCapabilities&service="+ $scope.baseLayerEntity.source.type;

        // Set print_not_reproject=true for wms loaded extern at our geoserver
        $scope.baseLayerEntity.print_not_reproject = true;
    }
    else
    {
      var getCapabilityUrl = $scope.baseLayerEntity.source.url  +
        quesryStringAppender +
        "request=GetCapabilities&service=" + $scope.baseLayerEntity.source.type;

      // Set print_not_reproject=false for wms in our geoserver
      $scope.baseLayerEntity.print_not_reproject = false;
    }

    //Do the request
    $scope.showLoader = true;
    rwHttpSvc.get(getCapabilityUrl,function(res)
    {
      $scope.showLoader = false;
      if(res)
      {
        try
        {
          // Parse the response to use the capabilities
          var parser = new ol.format.WMSCapabilities();
          var service = parser.read(res);

          // Set version
          if(service.version)
            $scope.baseLayerEntity.source.version = service.version;
          else
            $scope.baseLayerEntity.source.version = "";

          if (service.hasOwnProperty("Capability"))
          {
            var capabilities = service.Capability;

            // Create Format ds
            var aFormatDs = [];

            // Get the application's map format, used to filter format
            var configuredFormatObj = $scope.wmsMapFormat;

            if (capabilities.Request)
            {
              if (capabilities.Request.GetMap)
              {
                // Create Format Datasource
                if(capabilities.Request.GetMap.Format)
                {
                  var aFormat = capabilities.Request.GetMap.Format;

                  for(var i=0;i<aFormat.length;i++)
                  {
                    var format = aFormat[i];

                    var confFormatObjKeys =  Object.keys(configuredFormatObj);
                    if(confFormatObjKeys.length>0)
                    {
                      /* If the format exists into configuredFormatObj,
                       * add to aFormatDs */
                      var found = false;

                      for(var j=0;j<confFormatObjKeys.length && !found;j++)
                      {
                        var key = confFormatObjKeys[j];
                        var cfgFormat = configuredFormatObj[key];

                        if(cfgFormat == format)
                        {
                          found = true;
                          aFormatDs.push({id:format,name:key});
                        }
                      }
                    }
                    else
                      aFormatDs.push({id:format,name:format});
                  }
                }
              }
            }
            $scope.baseLayerSourceFormCfg.fg[0].rows[2][0].options = aFormatDs;

            var layers = capabilities.Layer;
            // Get Layers from service and save into dBaseLayers
            $scope.dBaseLayers = {};

            if (capabilities.Layer.hasOwnProperty("Layer"))
              $scope._getLayersService(layers.Layer,$scope.dBaseLayers);
            else
              $scope._getLayersService([layers],$scope.dBaseLayers);

            // Create layers array
            var aLayers = [];
            for(var key in $scope.dBaseLayers)
              aLayers.push($scope.dBaseLayers[key]);

            // Set aLayers as layerName ds in baseLayerSourceFormCfg
            $scope.baseLayerSourceFormCfg.fg[0].rows[1][0].options = aLayers;
          }

          callback(true);
        }
        catch(err)
        {
          console.error("ERROR "+err);
          // Show custom message into the form
          $scope.$emit("showAlert",{
            msg:" CORE_MSG.INVALID_URL",btKo:"Ok",style:"danger"});

          callback(null);
        }
      }
      else
      {
        console.error("ERROR load "+getCapabilityUrl);
        // Show custom message into the form
        $scope.$emit("showAlert",{
          msg:" CORE_MSG.INVALID_URL",btKo:"Ok",style:"danger"});

        callback(null);
      }
    });
  }

  // Function used to control if something is changed in form
  function _sourceAttributeChanged(attr,nv,ov)
  {
    if(nv==undefined)
      return;
    switch(attr)
    {
      case "type":
        var loadSrvBtnF = $scope.baseLayerSourceFormCfg.fg[0].rows[0][2];
        var srvNameF =  $scope.baseLayerSourceFormCfg.fg[0].rows[1][0];
        var srvProjectF =  $scope.baseLayerSourceFormCfg.fg[0].rows[1][1];
        var srvTranspF =  $scope.baseLayerSourceFormCfg.fg[0].rows[1][2];
        var srvFormatF =  $scope.baseLayerSourceFormCfg.fg[0].rows[2][0];

        switch(nv)
        {
          case "OSM":
            loadSrvBtnF.enabled = false;
            srvNameF.enabled = false;
            srvNameF.required = false;

            srvProjectF.enabled = true;

            srvTranspF.enabled = false;
            srvTranspF.required = false;

            srvFormatF.enabled = false;
            srvFormatF.required = false;

            // Set print_not_reproject=true for osm
            $scope.baseLayerEntity.print_not_reproject = true;

            // Set the projectionDS with EPSG:3862
            $scope.baseLayerSourceFormCfg.fg[0].rows[1][1].options = [];
            $scope.baseLayerSourceFormCfg.fg[0].rows[1][1].options =
            [
              {id:"EPSG:3857", name:"EPSG:3857"}
            ];

            break;

          case "XYZ":
            loadSrvBtnF.enabled = false;
            srvNameF.enabled = false;
            srvNameF.required = false;

            srvProjectF.enabled = true;
            srvTranspF.enabled = false;
            srvTranspF.required = false;

            srvFormatF.enabled = false;
            srvFormatF.required = false;

            /* Get the application's map rs, used to filter and create projectionDS */
            var aConfiguredSr = $scope.mapSr;

            var projectionDs = [];
            for(var i=0; i< aConfiguredSr.length; i++)
            {
              var confSr = aConfiguredSr[i];
              var sr = "EPSG:" + confSr.code;

              projectionDs.push({id:sr, name:sr});
            }

            $scope.baseLayerSourceFormCfg.fg[0].rows[1][1].options = [];
            $scope.baseLayerSourceFormCfg.fg[0].rows[1][1].options = projectionDs;

            break;

          default:
            loadSrvBtnF.enabled = true;
            srvNameF.enabled = true;
            srvNameF.required = true;

            srvProjectF.enabled = true;
            srvTranspF.enabled = true;
            srvTranspF.required = true;

            srvFormatF.enabled = true;
            srvFormatF.required = true;

            break;
        }
        break;

      case "layer_name":
        // Get the selected layer from dBaseLayers
        var layerObj = $scope.dBaseLayers[nv];

        if(layerObj)
        {
          // Set the projection's ds
          var projectionDs = [];

          // Get the application's map rs, used to filter
          var aConfiguredSr = $scope.mapSr;

          if(layerObj.CRS) // Version 1.1.1
          {
            for(var i=0; i < layerObj.CRS.length; i++)
            {
              var crs = layerObj.CRS[i];
              var exists = false;
              // Workaround --> Control if the element exists into the projectionDs
              for(var j=0; j< projectionDs.length;j++)
              {
                if(angular.equals(crs, projectionDs[j].id))
                  exists = true;
              }
              if(!exists)
              {
                // If the crs exist into configured sr, add to the projectionDs
                var found = false;
                for(var j=0; j< aConfiguredSr.length && !found;j++)
                {
                  var sr = aConfiguredSr[j];

                  //From crs get the number
                  var aSplittedCrs = crs.split(":");
                  if(aSplittedCrs[1] == sr.code)
                    found = true;
                }
                if(found)
                  projectionDs.push({id:crs, name:crs});

              }
            }
          }
          else if (layerObj.SRS) // Version 1.3.0
          {
            for(var i=0; i < layerObj.SRS.length; i++)
            {
              var srs = layerObj.SRS[i];
              var exists = false;
              // Workaround --> Control if the element exists into the projectionDs
              for(var j=0; j< projectionDs.length;j++)
              {
                if(angular.equals(srs,projectionDs[j].id))
                  exists = true;
              }
              if(!exists)
              {
                // If the srs exist into configured sr, add to the projectionDs
                var found = false;
                for(var j=0; j< aConfiguredSr.length && !found;j++)
                {
                  var sr = aConfiguredSr[j];

                  //From srs get the number
                  var aSplittedCrs = srs.split(":");
                  if(aSplittedCrs[1] == sr.code)
                    found = true;
                }
                if(found)
                  projectionDs.push({id:srs, name:srs});
              }
            }
          }

          $scope.baseLayerSourceFormCfg.fg[0].rows[1][1].options = [];
          $scope.baseLayerSourceFormCfg.fg[0].rows[1][1].options = projectionDs;
        }
        break;
    }
  }

  // Bulk save to update layers default
  function _defaultLayerBulk(ent,aArray)
  {
    var bulkUrl = "/"+ent._name+ "/bulkUpdate";
    $scope.showLoader = true;
    rwHttpSvc.post(bulkUrl, aArray, function(res)
    {
      $scope.showLoader = false;
      if(!res || !res.result)
        $scope.$emit("showAlert",{
          msg: "WEBGIS.UPDATE_DEFAULT_LAYER_ERR",
          btKo: "Ok",
          style: "danger"});
    });
  }
};

/*
 * Controller of layer configuration view (layer-tree.html)
 */
function wgLayersTreeCtrl($scope,$translate,DTOptionsBuilder,DTColumnDefBuilder,
  wgCategory,wgLayer,wgLayerSearch,rwHttpSvc,rwConfigSvc,rwAuthSvc,rwI18NSvc,
  wgLayerTreeSvc,wgLayerLegendClass,wgLayerStyle,wgLayerStyleClasses,wgLayerFilter)
{
  $scope.layerFormCtrlObj = {};
  $scope.groupFormCtrlObj = {};
  $scope.showLoader = false;

  // Legend variables
  $scope.lIconToShow = null;
  $scope.lIconToDownload = null;
  $scope.fileExt = null;
  $scope.disableIcon = false;
  $scope.showLIconError = false;
  $scope.LIconErrorMsg = "";

  // Layer configuration Form cfg
  $scope.collapsed = true;
  $scope.curEntity = null;
  $scope.showLayerForm = false;
  $scope.showI18nCategoryForm = false;
  $scope.dWMSCapabilities = {};
  $scope.dWFSCapabilities = {};
  $scope.dDescribeFeatureType = {};
  $scope.dLayers = {};

  $scope.aLayerType = [];
  $scope.selectableAttrTypeDs = ["TEXT","IMAGE","LINK"]; //TODO Read from ctx?

  /* Searchable table config */
  $scope.searchableTableStyle =
  {
    "overflow-y":"auto","margin":"10px 15px 5px 15px"
  };

  $scope.searchDtOpt = DTOptionsBuilder.newOptions()
    .withOption("bInfo",false)
    .withOption("paging",false)
    .withOption("ordering",true)
    .withOption("searching",false)
    .withOption("responsive",true)
    .withOption("bLengthChange",false)
    .withLanguage({emptyTable: "No data"});

  $scope.searchDtColDef = [
    DTColumnDefBuilder.newColumnDef(4).notSortable(),
    DTColumnDefBuilder.newColumnDef(3).notSortable(),
    DTColumnDefBuilder.newColumnDef(2).notSortable()
  ];

  /* Queryable table config */
  $scope.queryableTableStyle =
  {
    "max-height":170, "overflow-y":"auto","margin":"5px 15px 5px 15px"
  };

  $scope.queryableDtOpt = DTOptionsBuilder.newOptions()
    .withOption("bInfo",false)
    .withOption("paging",false)
    .withOption("ordering",true)
    .withOption("searching",false)
    .withOption("responsive",true)
    .withOption("bLengthChange",false)
    .withLanguage({emptyTable: "No data"});

  $scope.queryableDtColDef = [
    DTColumnDefBuilder.newColumnDef(2).notSortable()
  ];

  /* (OLD) Attributes table config */
  $scope.attributeTableStyle =
  {
    "overflow-y":"auto",
    "margin":"5px 15px 5px 15px"
  };
  $scope.attributeDtOpt = DTOptionsBuilder.newOptions()
    .withOption("bInfo",false)
    .withOption("paging",false)
    .withOption("ordering",true)
    .withOption("searching",false)
    .withOption("responsive",true)
    .withOption("bLengthChange",false)
    .withLanguage({emptyTable: "No data"});

  $scope.attributeDtColDef = [
    DTColumnDefBuilder.newColumnDef(1).notSortable()
  ];

  /* Read from wgLayerTreeSvc the layer type array */
  wgLayerTreeSvc.getLayerTypes(function(res)
  {
    for(var i=0; i< res.length;i++)
    {
      var type = res[i];
      if(type.id != 1) // Is different from 'Gruppo'
      {
        $scope.aLayerType.push(type);
      }
    }
  });

  $scope.layerFormCfg =
  {
    id:"layerForm", fg:
    [
      {
        show:true, label:"", rows:
        [
          [
            {
              id: "image_id",
              type:"select",
              label:"WORDS.TYPE",
              options: $scope.aLayerType,
              width: 3,
              height: "input-sm",
              required: true, enabled: false, show: false
            },
            {
              id: "tiled",
              type: "checkbox",
              label: "Tiled",
              width: 3,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "opacity",
              type: "number",
              min:0,
              max:1,
              label: "WORDS.OPACITY",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "dynamic_filter",
              type: "checkbox",
              label: "WEBGIS.DYNAMIC_FILTER_LBL",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: false
            },
            {
              id: "editable",
              type: "checkbox",
              label: "WEBGIS.EDITING_LBL",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: false
            }
          ],
          [
            {
              id: "min_scale",
              type: "number",
              label: "WEBGIS.GEOSERVICE.SCALE_MIN",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "max_scale",
              type: "number",
              label: "WEBGIS.GEOSERVICE.SCALE_MAX",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "visible",
              type: "checkbox",
              label: "WEBGIS.INITIAL_VISIBILITY",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]
        ]
      },
      {
        show:true, label:"Extent", rows:
        [
          [
            {
              id: "extent_minx",
              type: "text",
              label: "Min x",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "extent_miny",
              type: "text",
              label: "Min y",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "extent_maxx",
              type: "text",
              label: "Max x",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "extent_maxy",
              type: "text",
              label: "Max y",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  };

  $scope.layerSimpleSourceFormCfg =
  {
    id:"layerSimpleSourceForm", changeCallback:_simpleSourceAttributeChanged,fg:
    [
      {
        show:true, label:"", rows:
        [
          [
            {
              id: "layer_name",
              type: "customSelect",
              label: "WEBGIS.GEOSERVICE.SERVICE_NAME",
              customOption: {key:"layer_name",label:"label"},
              options: [],
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  }

  $scope.layerSourceFormCfg =
  {
    id:"layerSourceForm", changeCallback:_sourceAttributeChanged, fg:
    [
      {
        show:true, label:"", rows:
        [
          [
            {
              id: "type",
              type: "select",
              label: "WORDS.SERVICE",
              options:[
                {id:"VECTOR",name:"WEBGIS.WFS"},
                {id:"WMS",name:"WEBGIS.WMS"},
                {id:"GEOJSON", name:"WEBGIS.GEOJSON"},
                {id:"STATIC_IMAGE", name:"WEBGIS.STATIC_IMAGE"}
              ],
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "url",
              type: "text",
              label: "WEBGIS.GEOSERVICE.SERVICE_URL",
              width: 6,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "load_service_btn",
              type: "glyphButton",
              label: "",
              icon: "download-alt",
              width: 2,
              height: "input-sm",
              title: "WORDS.DOWNLOAD",
              required: false, enabled: true, show: true
            }
          ],
          [
            {
              id: "layer_name",
              type: "customSelect",
              label: "WEBGIS.GEOSERVICE.SERVICE_NAME",
              customOption: {key:"layer_name",label:"label"},
              options: [],
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "projection",
              type: "select",
              label: "WORDS.PROJECTION",
              options:[],
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "transparent",
              type: "checkbox",
              label: "WEBGIS.TRANSPARENT_BACKGROUND",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "imgWidth",
              type: "text",
              label: "WEBGIS.IMG_WIDTH",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: false
            },
            {
              id: "imgHeight",
              type: "text",
              label: "WEBGIS.IMG_HEIGHT",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: false
            }
          ],
          [
            {
              id: "format",
              type: "select",
              label: "WORDS.FORMAT",
              options: [],
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "version",
              type: "text",
              label: "WORDS.VERSION",
              width: 4,
              height: "input-sm",
              required: false, enabled: false, show: true
            }
          ]
        ]
      },
      { // Fieldgroup showed only with WFS. MANAGE
        show:false, label:"", rows:
        [
          [
            {
              id: "cluster",
              type: "checkbox",
              label: "Cluster",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "clusterDist",
              type: "number",
              min:0,
              label: "WEBGIS.CLUSTER_RADIUS",
              width: 4,
              height: "input-sm",
              required: false, enabled: false, show: true
            },
            {
              id: "strategy",
              type: "select",
              options:[{id:"BBOX",name:"Bounding box"},{id:"all",name:"All"}],
              label: "WEBGIS.WFS_LOADING_STRATEGY",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]/*,
          [
            {
              id: "strategy",
              type: "select",
              options:[{id:"BBOX",name:"Bounding box"},{id:"all",name:"All"}],
              label: "WEBGIS.WFS_LOADING_STRATEGY",
              width: 8,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "mod_attributes_btn",
              type: "button",
              label: "",
              btnlabel: "WEBGIS.SELECT_ATTRIBUTES",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: false // (OLD)
            }
          ]*/
        ]
      },
      {
        show:true, label:"Extent", rows:
        [
          [
            {
              id: "minx",
              type: "text",
              label: "Min x",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "miny",
              type: "text",
              label: "Min y",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "maxx",
              type: "text",
              label: "Max x",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "maxy",
              type: "text",
              label: "Max y",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  };

  $scope.layerRasterQueryableFormCfg =
  {
    id:"layerRasterQueryableForm", fg:
    [
      {
        show:true, label:"", rows:
        [
          [
            {
              id: "checked",
              type: "checkbox",
              label: "WORDS.SELECTED",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "id",
              type: "text",
              label: "WORDS.ATTRIBUTE",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "name",
              type: "text",
              label: "Alias",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  }

  $scope.layerLegendFormCfg =
  {
    id:"layerLegendForm", changeCallback:_layerLegendAttributeChanged, fg:
    [
      {
        show:true, label:"", rows:
        [
          [
            {
              id: "extern",
              type: "checkbox",
              label: "WORDS.EXTERNAL",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "class_presence",
              type: "checkbox",
              label: "WORDS.CLASSES",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "add_class_btn",
              type:"glyphButton",
              label: "",
              btnlabel: "WEBGIS.ADD_LEGEND_CLASS",
              icon: "plus",
              width: 4,
              height: "input-sm",
              required: false, enabled: false, show: true
            }
          ]
        ]
      }
    ]
  }

  $scope.layerLegendI18nFormCfg =
  {
    id:"layerLegendI18nForm", fg:
    [
      {
        show:true, label:"", rows:
        [
          []
        ]
      }
    ]
  };

  // Populate legendI18nFormFg
  var legendI18nFormFg =  $scope.layerLegendI18nFormCfg.fg[0].rows[0];

  // Get Languages from rwConfigSvc
  for(var i=0,numLang=rwConfigSvc.languages.length;i<numLang;i++)
  {
    var lang = rwConfigSvc.languages[i];
    var width = 12/numLang;
    var formObj =
    {
      id: lang,
      type: "text",
      label: lang,
      width: width,
      height: "input-sm",
      required: false, enabled: true, show: true
    }

    legendI18nFormFg.push(formObj);
  }

  /* angular-summernote options */
  $scope.summOpt =
  {
    height: 120,
    focus: false,
    toolbar:[
      ['codeview',['codeview','fullscreen']],
      ['edit',['undo','redo']],
      ['style', ['bold', 'italic', 'underline']],
      ['font',['fontsize','fontname','clear']],
      ['para',['ul', 'ol', 'paragraph']],
      ['table',['table']]
    ]
  };

  /* ui-tree configurations */

  $scope.treeOptions =
  {
    toggle: function(collapsed, sourceNodeScope)
    {
      if (!collapsed)
        sourceNodeScope.$modelValue.display = true;
    },
    accept: function(sourceNodeScope, destNodesScope, destIndex)
    {
      // The user is moving a categories!
      if(!sourceNodeScope.$parentNodeScope)
      {
        // A Category is moved within the categories
        if(destNodesScope == sourceNodeScope.$parent)
          return true;
        else
          return false;
      }

      var sourceModelValue = sourceNodeScope.$modelValue;
      var destModelValue   = destNodesScope.$modelValue;

      var sourceItem =
        (Array.isArray(sourceModelValue) && sourceModelValue.length > 0) ?
          sourceModelValue[0] : sourceModelValue;

      var destItem =
        (Array.isArray(destModelValue) && destModelValue.length > 0) ?
          destModelValue[0] : destModelValue;

      // items can't be moved out of source category
      if (sourceItem.id_category != destItem.id_category)
        return false;

      // items can't be moved into another group
      if (sourceItem.id_parent != destItem.id_parent)
        return false;

      return true;
    },
    dropped: function(e)
    {
      // it hasn't occured no order change -> we exit
      if (e.source.index == e.dest.index)
        return;

      var destItemArr = e.dest.nodesScope.$modelValue;
      var sourceEnt = e.source.nodeScope.$modelValue;

      // Create the array containing layer to update the position
      var aBLayerToUpdate = [];

      var destPos = $scope.lDropDestEnt._position;
      // Destination's index is greater then start's index
      if(sourceEnt._position < destPos)
      {
        for(var i=0;i<destItemArr.length;i++)
        {
          var bl = destItemArr[i];
          if(sourceEnt.id != bl.id && bl._position <= destPos) // Decrease its _position
          {
            bl._position--;
            aBLayerToUpdate.push({id:bl.id, _position:bl._position});
          }
        }
      }
      else if(sourceEnt._position > destPos)// Destination's index is less then start's index
      {
        for(var i=0;i<destItemArr.length;i++)
        {
          var bl = destItemArr[i];
          if(sourceEnt.id != bl.id && bl._position >= destPos) // Increase its _position
          {
            bl._position++;
            aBLayerToUpdate.push({id:bl.id, _position:bl._position});
          }
        }
      }
      // Change sourceEnt position and push it into aBLayerToUpdate
      sourceEnt._position = destPos;
      aBLayerToUpdate.push({id:sourceEnt.id, _position:destPos});

      /* Bulk save to update layers position */
      var bulkUrl = "/"+$scope.lDropDestEnt._name+ "/bulkUpdate";
      $scope.showLoader = true;
      rwHttpSvc.post(bulkUrl, aBLayerToUpdate, function(res)
      {
        $scope.showLoader = false;
        if(!res || !res.result)
        {
          $scope.$emit("showAlert",{ msg: "CORE_LBL.INSERT_ERR",
            btKo: "Ok", style: "danger"});
        }
        else
          $scope._setReload(true);
      });
    },
    beforeDrop:function(e)
    {
      var res = false;
      var destItemArr = e.dest.nodesScope.$modelValue;
      $scope.lDropDestEnt = null;
      $scope.lDropDestEnt = destItemArr[e.dest.index]; // Get the swapped ent

      // The node can be swapped only with an inserted node!
      if($scope.lDropDestEnt.op == "U")
        res = true;

      return res;
    }
  }

  /* Scope functions */
  $scope.addCategory = function()
  {
    var cat = new wgCategory();
    var max_position = 0;

    // Find the max category _position to set new
    for(var i=0;i<$scope.tree.length;i++)
    {
      var c = $scope.tree[i];
      if(c._position > max_position)
        max_position = c._position;
    }

    // Set the _position
    cat._position = max_position + 1;

    // Set the current entity
    $scope.curEntity = cat;

    // Show category form and hide showLayerForm
    $scope.showLayerForm = false;
    $scope.showI18nCategoryForm = true;
  }

  $scope.removeCategory = function(it)
  {
    $scope.$emit("showAlert",
    {
      msg: "CORE_MSG.DELETE_ITEM_MSG",
      btOk: "WORDS.YES",
      btKo: "No",
      style: "info",
      callback: function()
      {
        var catEntity = it.$modelValue;
        var operation = catEntity.op;

        if (operation == "U")
        {
          rwHttpSvc.delete("/" +
            catEntity._name + "/delete/" +catEntity.id ,function(res)
          {
            if (res && res.result)
            {
              $scope._setReload(true);

              it.remove();
              $scope.showI18nCategoryForm = false;
              // Hide also the layer form (it could be opened)
              $scope.showLayerForm = false;
            }
            else
            {
              $scope.$emit("showAlert",{
                msg: "CORE_LBL.DELETE_ERR",
                btKo: "Ok",
                style: "danger"});
            }
          });
        }
        else
        {
          it.remove();
          $scope.showI18nCategoryForm = false;
          // Hide also the layer form (it could be opened)
          $scope.showLayerForm = false;
        }
      }
    });
  }

  $scope.addLayer = function(it)
  {
    var nodeData = it.$modelValue;
    var layer = null;

    if(nodeData._name == 'wgCategory')
      layer = nodeData.createLayer();
    else
    {
      layer = nodeData.createChildLayer();

      // Manage layer style status
      nodeData.manageStyleStatus(nodeData.styleStatus,layer);
    }

    // Show the layer form
    $scope.showI18nCategoryForm = false;
    $scope.showLayerForm = true;
    // Set the current entity and manage the view
    $scope.curEntity = layer;
    _manageLayerView();
  }

  $scope.removeLayer = function(it)
  {
    $scope.$emit("showAlert",
    {
      msg: "CORE_MSG.DELETE_ITEM_MSG",
      btOk: "WORDS.YES",
      btKo: "No",
      style: "info",
      callback: function()
      {
        var layerEntity = it.$modelValue;
        var operation = layerEntity.op;

        if (operation == "U")
        {
          rwHttpSvc.delete("/" +
            layerEntity._name + "/delete/" +layerEntity.id ,function(res)
          {
            if (res && res.result)
            {
              $scope._setReload(true);

              it.remove();
              $scope.showLayerForm = false;
            }
            else
            {
              $scope.$emit("showAlert",{
                msg: "CORE_LBL.DELETE_ERR",
                btKo: "Ok",
                style: "danger"});
            }
          });
        }
        else
        {
          it.remove();
          $scope.showLayerForm = false;
        }
      }
    });
  }

  $scope.editLayer = function(it)
  {
    $scope.curEntity = {};
    $scope.curEntity = it.$modelValue;

    if($scope.curEntity.type == "VECTOR") // Layer is a WFS
    {
      // Refresh style status
      $scope.curEntity.refreshStyleStatus();

      // Refresh cluster's style status
      $scope.curEntity.refreshClusterStyleStatus();
    }

    _manageLayerView();
  }

  $scope.editCategory = function(it)
  {
    $scope.curEntity = it.$modelValue;

    $scope.showI18nCategoryForm = true;
    $scope.showLayerForm = false;
  }

  $scope.deleteLegendIcon = function()
  {
    // Restore entity and scope variables
    $scope.curEntity.legend.image = null;
    $scope.lIconToShow = null;
    $scope.lIconToDownload = null;
    $scope.fileExt = null;

    // Disable delete icon
    $scope.disableIcon = true;
  }

  // Remove a class from the legend's classes
  $scope.removeClass = function(idx)
  {
    $scope.$emit("showAlert",
    {
      msg: "CORE_MSG.DELETE_ITEM_MSG",
      btOk: "WORDS.YES",
      btKo: "No",
      style: "info",
      callback: function()
      {
        var classToRemove = $scope.curEntity.legend.classes[idx];
        var operation = classToRemove.op;

        if (operation == "U")
        {
          $scope.showLoader = true;
          rwHttpSvc.delete("/" +
            classToRemove._name + "/delete/" +classToRemove.id ,function(res)
          {
            $scope.showLoader = false;
            if (res && res.result)
            {
              $scope._setReload(true);

              // Remove item from classes
              $scope.curEntity.legend.classes.splice(idx,1);
            }
            else
            {
              $scope.$emit("showAlert",{
                msg: "CORE_LBL.DELETE_ERR",
                btKo: "Ok",
                style: "danger"});
            }
          });
        }
        else
        {
          // Remove item from classes
          $scope.curEntity.legend.classes.splice(idx,1);
        }
      }
    });
  }

  // Save
  $scope.save = function()
  {
    var chgObj = null;
    var validationCond = null;

    if($scope.showI18nCategoryForm) // Category Save
    {
      validationCond = $scope.groupFormCtrlObj.i18nForm.isValid() &
        $scope.groupFormCtrlObj.layerPermissionForm.isValid();
    }
    else if($scope.showLayerForm) // Layer Save
    {
      validationCond = $scope.layerFormCtrlObj.i18nForm.isValid() &
        $scope.layerFormCtrlObj.layerPermissionForm.isValid() &
        $scope.layerFormCtrlObj.layerSourceForm.isValid() &
        $scope.layerFormCtrlObj.layerForm.isValid();
    }
    else
    {
      console.error("wg-ctrl-layers.js: wgLayersTreeCtrl --> Unrecognized save!");
      return;
    }

    // Control if all mandatory fields have been inserted
    if(validationCond)
    {
      if($scope.curEntity)
      {
        chgObj = $scope.curEntity.changedKeys();

        if(!chgObj)
          return;

        var entStatus = $scope.curEntity.op;

        if(entStatus == "U") // Update
        {
          var url = "/"+$scope.curEntity._name+"/update/"+$scope.curEntity.id;

          $scope.showLoader = true;

          rwHttpSvc.put(url,chgObj,function(res)
          {
            $scope.showLoader = false;
            if (res && res.result)
            {
              $scope._setReload(true);

              // Reload i18n to show the new label only if i18n is changed
              if(chgObj.hasOwnProperty("i18n"))
                $translate.refresh(rwConfigSvc.language);

              $scope.curEntity.updateChangedKeys();

              // Show a message to the user
              $scope.$emit("showAlert",{
                msg:"CORE_LBL.UPDATE_OK",btKo: "Ok",style:"info"});
            }
            else
            {
              $scope.curEntity.restoreChangedKeys();

              $scope.$emit("showAlert",{
                msg:"CORE_LBL.UPDATE_ERR",btKo: "WORDS.CLOSE",style:"danger"});
            }
          });
        }
        if(entStatus == "I") // Insert
        {
          var url = "/"+$scope.curEntity._name+"/insert";

          $scope.showLoader = true;
          rwHttpSvc.post(url,chgObj,function(res)
          {
            $scope.showLoader = false;
            if (res && res.result)
            {
              $scope._setReload(true);

              $scope.curEntity.updateChangedKeys();
              $scope.curEntity.op = "U";

              // Add the save category into tree
              if($scope.curEntity instanceof wgCategory)
                $scope.tree.push($scope.curEntity);
              else if($scope.curEntity instanceof wgLayer)
              {
                // Update update CanHaveChildren
                $scope.curEntity.updateCanHaveChildren();

                /* Find the parent where to add the saved layer */
                var id_catToFind = $scope.curEntity.id_category;
                var id_parentToFind = $scope.curEntity.id_parent;
                if(id_catToFind != null)
                {
                  for(var i=0,found = false;i<$scope.tree.length && !found;i++)
                  {
                    var cat = $scope.tree[i];
                    if(cat.id == id_catToFind)
                    {
                      found = true;
                      {
                        if(id_parentToFind == null)
                          cat.layers.push($scope.curEntity);
                        else
                        {
                          var father = _findLayerFather(id_parentToFind,cat.layers);
                          if(father != null)
                            father.layers.push($scope.curEntity);
                          else
                            console.error("wgLayersTreeCtrl ERROR: unable to"+
                              " push the saved layer into it's father because"+
                              " it not exists!");
                        }
                      }
                    }
                  }
                }
                else
                  console.error("wgLayersTreeCtrl ERROR: unable to push"+
                    " the saved layer into it's father because "+
                    "id_category is null!");

              }

              // Reload i18n to show the new label
              $translate.refresh(rwConfigSvc.language);

              // Show a message to the user
              $scope.$emit("showAlert",{
                msg:"CORE_LBL.INSERT_OK",btKo: "Ok",style:"info"});
            }
            else
            {
              $scope.$emit("showAlert",{
                msg:"CORE_LBL.INSERT_ERR",btKo: "WORDS.CLOSE",style:"danger"});
            }
          });
        }
      }
    }
  }

  // Hide the showed form
  $scope.close = function()
  {
    if($scope.curEntity.changedKeys()) // There are unsaved things into the entity
    {
      $scope.$emit("showAlert",
      {
        msg: "WEBGIS.CLOSE_MSG",
        btOk: "WORDS.YES",
        btKo: "No",
        style: "info",
        callback: function()
        {
          // Reset Forms
          if($scope.showI18nCategoryForm)
          {
            $scope.groupFormCtrlObj.i18nForm.reset();
            $scope.groupFormCtrlObj.layerPermissionForm.reset();
          }
          else
          {
            $scope.layerFormCtrlObj.i18nForm.reset();
            $scope.layerFormCtrlObj.layerForm.reset();
            $scope.layerFormCtrlObj.layerLegendForm.reset();
            $scope.layerFormCtrlObj.layerLegendI18nForm.reset();
            $scope.layerFormCtrlObj.layerPermissionForm.reset();
            $scope.layerFormCtrlObj.layerRasterQueryableForm.reset();
            $scope.layerFormCtrlObj.layerSimpleSourceForm.reset();
            $scope.layerFormCtrlObj.layerSourceForm.reset();
          }

          $scope.showLayerForm = false;
          $scope.showI18nCategoryForm = false;

          if($scope.curEntity.op == "U")
            $scope.curEntity.restoreChangedKeys();

          $scope.curEntity = {};
        }
      });
    }
    else
    {
      $scope.showLayerForm = false;
      $scope.showI18nCategoryForm = false;
      $scope.curEntity = {};
    }
  }

  $scope.legendTabClicked = function()
  {
    var legend = $scope.curEntity.legend;

    if(legend.id == null)
    {
      legend.getSerialId();
      // Set the legend id_layer to self
      legend.id_layer = $scope.curEntity.id;
    }
  }

  // Function called when user click on search tab (Showed only in WFS layer)
  $scope.searchTabClicked = function()
  {
    var source = $scope.curEntity.source;
    var searchable = $scope.curEntity.searchable;

    // Load describeFeatureType
    _loadDescribeFeatureType(source.url,source.layer_name,function(res)
    {
      if(res != null)
      {
        // Refresh checked attribute into the source
        source.refreshCheckedAttribute();
        // Refresh checked attribute into the searchable
        searchable.refreshCheckedAttribute();
      }
      else
        $scope.$emit("showAlert",{
          msg:"WEBGIS.LOAD_DESCRIBEFT_ERR",btKo:"Ok",style:"danger"});
    });
  }

  // Function called when user click on query tab (Showed only in WMS layer)
  $scope.queryTabClicked = function()
  {
    $scope.showQueryTable = true;

    /* Load describeFeatureType */
    var queryable = $scope.curEntity.queryable;
    var source = null;
    var layerName = null;

    if($scope.curEntity.source && $scope.curEntity.source.url)
    {
      source = $scope.curEntity.source;
      layerName = source.layer_name;
    }
    else if ($scope.curEntity._parentSource &&
      $scope.curEntity._parentSource.url)
    {
      source = $scope.curEntity._parentSource;
      layerName = $scope.curEntity.layer_name;
    }

    if(layerName != undefined)
    {
      if($scope.curEntity.image_id == 5) // Raster
      {
        // Don't do describe feature type but show fields to define query attribute
        $scope.showQueryTable = false; // Hide query table (to show 3 fields)
        var queryableEnt = $scope.curEntity.queryable;

        if(queryableEnt.result.length)
        {
          queryableEnt.properties = [];
          for(var i=0; i< queryableEnt.result.length; i++)
            queryableEnt.addProperty(queryableEnt.result[i]);
          // Refresh checked attribute into the source
          queryable.refreshCheckedAttribute();
        }
        else // Create empty item
          queryableEnt.addProperty({checked:false,id:"",name:"",type:null});
      }
      else
      {
        _loadDescribeFeatureType(source.url,layerName,function(res)
        {
          if(res != null)
          {
            // Refresh checked attribute into the source
            queryable.refreshCheckedAttribute();
          }
          else
            $scope.$emit("showAlert",{
              msg:"WEBGIS.LOAD_DESCRIBEFT_ERR",btKo:"Ok",style:"danger"});
        });
      }
    }
  }

  $scope.wfsQueryTabClicked = function()
  {
    /* Load describeFeatureType */
    var selectable = $scope.curEntity.selectable;
    var source = null;
    var layerName = null;
    var searchable = null;

    if($scope.curEntity.source && $scope.curEntity.source.url)
    {
      source = $scope.curEntity.source;
      searchable = $scope.curEntity.searchable;
      layerName = source.layer_name;
    }
    else if ($scope.curEntity._parentSource &&
      $scope.curEntity._parentSource.url)
    {
      source = $scope.curEntity._parentSource;
      searchable = $scope.curEntity.searchable;
      layerName = $scope.curEntity.layer_name;
    }

    if(layerName != undefined)
    {
      _loadDescribeFeatureType(source.url,layerName,function(res)
      {
        if(res != null)
        {
          // Refresh checked attribute into the source
          source.refreshCheckedAttribute();
          // Refresh checked attribute into the searchable
          searchable.refreshCheckedAttribute();
          // Set table rows
          selectable.setTableDs(selectable.attributes);
          // Refresh checked attribute
          selectable.refreshCheckedAttribute();
        }
        else
          $scope.$emit("showAlert",{
            msg:"WEBGIS.LOAD_DESCRIBEFT_ERR",btKo:"Ok",style:"danger"});
      });
    }
  }

  // Function called when user click on hover tab
  $scope.hoverTabClicked = function()
  {
    $scope.hoverObj = {};
    $scope.hoverAttrDs = [];

    var hover = $scope.curEntity.hover;
    var source = $scope.curEntity.source;
    var searchable = $scope.curEntity.searchable;
    var queryable = $scope.curEntity.queryable;
    var layerName = source.layer_name;

    if(layerName != undefined)
    {
      _loadDescribeFeatureType(source.url,layerName,function(res)
      {
        if(res != null)
        {
          // Refresh checked attribute into the source
          source.refreshCheckedAttribute();

          for(var i=0; i<queryable.properties.length; i++)
          {
            var attr = queryable.properties[i];
            // NOTE Can't use geom attribute
            if(attr.id != "geom")
            {
              // Create object to show into the combo
              var obj = { id:"[["+attr.id+"]]", name:attr.id };
              $scope.hoverAttrDs.push(obj);
            }
          }

          // Refresh checked attribute into the searchable
          searchable.refreshCheckedAttribute();
        }
        else
          $scope.$emit("showAlert",{
            msg:"WEBGIS.LOAD_DESCRIBEFT_ERR",btKo:"Ok",style:"danger"});
      });
    }
  }

  // Function called when user click on filter tab (Showed only in WFS layer)
  $scope.filterTabClicked = function()
  {
    var source = null;
    var layerName = null;
    var queryable = null;

    if($scope.curEntity.filter == undefined)
      $scope.curEntity.filter = new wgLayerFilter();

    var filter = $scope.curEntity.filter;

    if($scope.curEntity.source && $scope.curEntity.source.url)
    {
      source = $scope.curEntity.source;
      layerName = source.layer_name;
    }
    else if ($scope.curEntity._parentSource &&
      $scope.curEntity._parentSource.url)
    {
      source = $scope.curEntity._parentSource;
      layerName = $scope.curEntity._parentSource.layer_name;
    }

    queryable = $scope.curEntity.queryable;

    if(layerName != undefined)
    {
      _loadDescribeFeatureType(source.url,layerName,function(res)
      {
        if(res != null)
        {
          var aAttribs = [];
          for(var i=0;i<queryable.properties.length;i++)
          {
            var attr = queryable.properties[i];
            if(attr.id != "geom")
              aAttribs.push(attr.id);
          }

          // Set attributes in filter
          filter.setAttributes(aAttribs);
        }
        else
          $scope.$emit("showAlert",{
            msg:"WEBGIS.LOAD_DESCRIBEFT_ERR",btKo:"Ok",style:"danger"});
      });
    }
  }

  $scope.styleTabClicked = function()
  {
    $scope.styleObj = {};
    $scope.featureAttrDs = [];

    $scope.showUnclassifiedStyle = false;
    $scope.showClassifiedStyle = false;

    $scope.styleTreeOpt =
    {
      toggle: function(collapsed, sourceNodeScope)
      {
        // setting flag display to load tree
        if (!collapsed)
          sourceNodeScope.$modelValue.display = true;
      },
      accept: function(sourceNodeScope, destNodesScope, destIndex)
      {
        return false;
      },
      beforeDrag: function(sourceNodeScope, destNodesScope, destIndex)
      {
        return false;
      }
    };

    $scope.styleTypeDs = [{id:1,name:"WEBGIS.STYLE.UNCLASSIFIED"}];

    // If it isn't a child, it can have classified style
    if($scope.curEntity && $scope.curEntity._canHaveChildren)
      $scope.styleTypeDs.push({id:2,name:"WEBGIS.STYLE.CLASSIFIED"});

    // Manage style type combo if style has been already defined
    if($scope.curEntity.style != undefined)
    {
      if($scope.curEntity.style instanceof wgLayerStyle)
      {
        $scope.styleObj.style_type = 1;
        $scope.showUnclassifiedStyle = true;
        $scope.showClassifiedStyle = false;
      }
      else if($scope.curEntity.style instanceof wgLayerStyleClasses)
      {
        $scope.styleObj.style_type = 2;
        $scope.showUnclassifiedStyle = false;
        $scope.showClassifiedStyle = true;
      }
    }

    var source = $scope.curEntity.source;
    var searchable = $scope.curEntity.searchable;
    var queryable = $scope.curEntity.queryable;
    var style = $scope.curEntity.style;
    var layerName = source.layer_name;

    if(layerName != undefined)
    {
      _loadDescribeFeatureType(source.url,layerName,function(res)
      {
        if(res != null)
        {
          // Refresh checked attribute into the source
          source.refreshCheckedAttribute();

          for(var i=0; i<queryable.properties.length; i++)
          {
            var attr = queryable.properties[i];
            // NOTE Can't use geom attribute
            if(attr.id != "geom")
            {
              // Create object to show into the combo
              var obj = { id:"[["+attr.id+"]]", name:attr.id };
              $scope.featureAttrDs.push(obj);
            }
          }

          // Set attributes to style if it's a wgLayerStyleClasses
          if (style instanceof wgLayerStyleClasses)
          {
            style.setAttributes(queryable.properties);
            style.refreshAttributes();
          }

          // Refresh checked attribute into the searchable
          searchable.refreshCheckedAttribute();
        }
        else
          $scope.$emit("showAlert",{
            msg:"WEBGIS.LOAD_DESCRIBEFT_ERR",btKo:"Ok",style:"danger"});
      });
    }

  }

  $scope.clusterStyleTabClicked = function()
  {
    if($scope.curEntity.cluster_style == undefined)
    {
      $scope.curEntity.cluster_style = $scope.curEntity.createLayerStyle();

      // Set the correct layerInfo
      $scope.curEntity.cluster_style.setLayerInfo({
        id:$scope.curEntity.source.layer_name,
        isChild:!$scope.curEntity._enableSourceAndType,isCluster:true});
    }

    $scope.featureAttrDs = [];
    $scope.styleTreeOpt =
    {
      toggle: function(collapsed, sourceNodeScope)
      {
        // setting flag display to load tree
        if (!collapsed)
          sourceNodeScope.$modelValue.display = true;
      },
      accept: function(sourceNodeScope, destNodesScope, destIndex)
      {
        return false;
      },
      beforeDrag: function(sourceNodeScope, destNodesScope, destIndex)
      {
        return false;
      }
    };

    var source = $scope.curEntity.source;
    var searchable = $scope.curEntity.searchable;
    var layerName = source.layer_name;

    if(layerName != undefined)
    {
      _loadDescribeFeatureType(source.url,layerName,function(res)
      {
        if(res != null)
        {
          // Refresh checked attribute into the source
          source.refreshCheckedAttribute();

          // Cluster have only 'size' attribute
          $scope.featureAttrDs.push({id:"[[size]]",name:"WEBGIS.STYLE.CLUSTER_SIZE"});

          // Refresh checked attribute into the searchable
          searchable.refreshCheckedAttribute();
        }
        else
          $scope.$emit("showAlert",{
            msg:"WEBGIS.LOAD_DESCRIBEFT_ERR",btKo:"Ok",style:"danger"});
      });
    }
  }

  // Function called when user click on attribute's combo item in hoverTab
  $scope.changedHoverAttribute = function()
  {
// (OLD)    var input = $("#hoverTxtArea")[0];
    var input = $(".note-codable")[0];
    var scrollPos = input.scrollTop;
    var pos = 0;
    var browser = ((input.selectionStart || input.selectionStart == "0") ?
      "ff" : (document.selection ? "ie" : false ));
    var front = "";
    var back = "";

    if (browser == "ie")
    {
      input.focus();
      var range = document.selection.createRange();
      range.moveStart ("character", -$scope.curEntity.hover.length);
      pos = range.text.length;
    }
    else if (browser == "ff")
      pos = input.selectionStart;

    if($scope.curEntity.hover != undefined)
    {
      front = ($scope.curEntity.hover).substring(0, pos);
      back = ($scope.curEntity.hover).substring(pos, $scope.curEntity.hover.length);
    }
    $scope.curEntity.hover = front+$scope.hoverObj.attribute+back;
    pos = pos + $scope.hoverObj.attribute.length;

    if (browser == "ie")
    {
      input.focus();
      var range = document.selection.createRange();
      range.moveStart ("character", -$scope.curEntity.hover.length);
      range.moveStart ("character", pos);
      range.moveEnd ("character", 0);
      range.select();
    }
    else if (browser == "ff")
    {
      input.selectionStart = pos;
      input.selectionEnd = pos;
      input.focus();
    }
    input.scrollTop = scrollPos;

    // Clear hoverObj.attribute
    $scope.hoverObj.attribute = null;
  }

  $scope.changedStyleType = function()
  {
    switch($scope.styleObj.style_type)
    {
      case 1: // Show Default
        // Create layer's style
        $scope.curEntity.style = $scope.curEntity.createLayerStyle();

        // Set layer's info (id) used to generate unique keys into the class
        if(!$scope.curEntity._enableSourceAndType) // Is child
        {
          if($scope.curEntity._parentSource.layer_name != undefined)
            $scope.curEntity.style.setLayerInfo({
              id: $scope.curEntity._parentSource.layer_name,
              isChild: !$scope.curEntity._enableSourceAndType,
              filter: $scope.curEntity.filter
            });
        }
        else
          $scope.curEntity.style.setLayerInfo({id:$scope.curEntity.source.layer_name,
            isChild:!$scope.curEntity._enableSourceAndType});

        $scope.showUnclassifiedStyle = true;
        $scope.showClassifiedStyle = false;
        break;

      case 2: // Show Default and Condition. Create default_key and hover_key
        // Create layer's style classes
        $scope.curEntity.style = $scope.curEntity.createLayerStyleClasses();
        $scope.curEntity.style.setLayerInfo({id:$scope.curEntity.source.layer_name,
            isChild:!$scope.curEntity._enableSourceAndType});

        $scope.showUnclassifiedStyle = false;
        $scope.showClassifiedStyle = true;
        break;
    }
  }

  $scope.addStyleClassesObj = function()
  {
    var queryable = $scope.curEntity.queryable;
    var style = $scope.curEntity.style;

    if (style instanceof wgLayerStyleClasses)
    {
      style.addClassesObject();

      style.attributes = [];
      for(var i=0;i<queryable.properties.length; i++)
      {
        var q = queryable.properties[i];
        style.attributes.push(q.id);
      }

      style.refreshAttributes();
    }
  }

  $scope.removeStyleClassesObj = function(idx)
  {
    if($scope.curEntity.style instanceof wgLayerStyleClasses)
      $scope.curEntity.style.removeClassesObject(idx);
  }

  /* Watches */
  $scope.$watch("curEntity.source.load_service_btn",function(nv,ov)
  {
    if (nv == undefined)
      return;

    $scope.curEntity.source.load_service_btn = undefined;

    _loadServiceCapabilities($scope.curEntity,function(res)
    {
      //Do nothing
    });
  });

  /*$scope.$watch("curEntity.source.mod_attributes_btn",function(nv,ov)
  {
    if (nv == undefined)
      return;

    $scope.curEntity.source.mod_attributes_btn = undefined;

    // Load describeFeatureType
    var source = $scope.curEntity.source;
    var searchable = $scope.curEntity.searchable;

    _loadDescribeFeatureType(source.url,source.layer_name,function(res)
    {
      if(res != null)
      {
        // Refresh checked attribute into the source
        source.refreshCheckedAttribute();
        // Refresh checked attribute into the searchable
        searchable.refreshCheckedAttribute();

        // Show/Hide attributes check list
        $scope.curEntity.source.show_attributes =
          !$scope.curEntity.source.show_attributes;
      }
      else
        $scope.$emit("showAlert",{
          msg:"WEBGIS.LOAD_DESCRIBEFT_ERR",btKo:"Ok",style:"danger"});
    });
  });*/

  $scope.$watch("curEntity.legend.image",function(nv,ov)
  {
    if(nv == undefined)
      return;

    if(nv != null)
    {
      $scope.disableIcon = false;

      if($scope.curEntity.legend.image != null)
        $scope.lIconToShow = $scope.curEntity.legend.image;
         // Url to download image
        $scope.lIconToDownload =  $scope.lIconToShow;
    }
    else
      $scope.disableIcon = true;
  });

  $scope.$watch("curEntity.imageIcon", function(newObj,oldObj)
  {
    if (newObj == undefined)
      return;

    $scope.lIconToDownload = null;

    // Dictionary of img extensions
    var imageExtensions = { img:"", png:"", jpg:"", jpeg:"", gif:""};

    // Get the file extension
    $scope.fileExt = $scope._getFileExtension(newObj.name);

    if($scope.fileExt != null)
    {
      // The file is an image
      if(imageExtensions.hasOwnProperty($scope.fileExt))
      {
        $scope.showLIconError = false;

        var reader = new FileReader();
        reader.onload = function(ev)
        {
          // Show image's preview
          $scope.disableIcon = false;
          var image = ev.target.result;
          // Replace base64 attribute
          $scope.lIconToShow =
            image.replace(/^data:image\/(img|png|jpg|jpeg|gif);base64,/, "");
          // Save the new image into the curEntity
          $scope.curEntity.legend.image = $scope.lIconToShow;
          $scope.$apply();
        };

        // Read the original obj to show a preview, instantly
        reader.readAsDataURL(newObj);
      }
      else
      {
        // Show error to the user
        $scope.showLIconError = true;
        $scope.LIconErrorMsg = "WEBGIS.ICON_CHARGE_ERR";
      }
    }
  });

  $scope.$watch("curEntity.legend.add_class_btn",function(nv,ov)
  {
    if (nv == undefined)
      return;

    $scope.curEntity.legend.add_class_btn = undefined;

    var nClasses = $scope.curEntity.legend.classes.length;

    /* Add a class into the legend's classes */
    var item = new wgLayerLegendClass();
    // Get serialId
    item.getSerialId();
    // Set the id_legend to the class
    item.id_legend = $scope.curEntity.legend.id;
    // Set the _position to the class
    item._position = nClasses > 0 ? nClasses+1 : 1;
    $scope.curEntity.legend.classes.push(item);
  });

  $scope.$watch("curEntity.tiled",function(nv,ov)
  {
    if(nv == undefined)
      return;

    // Set tiled to children layers
    for(var i=0; i< $scope.curEntity.layers.length;i++)
    {
      var layer = $scope.curEntity.layers[i];
      layer.setTiled(nv);
    }
  });

  $scope.$watch("curEntity.visible",function(nv,ov)
  {
    if(nv == undefined)
      return;

    // Set visible to children layers
    for(var i=0; i< $scope.curEntity.layers.length;i++)
    {
      var layer = $scope.curEntity.layers[i];
      layer.setInitialVisibility(nv);
    }
  });

  $scope.$watch("curEntity.min_scale",function(nv,ov)
  {
    if(nv == undefined)
      return;

    // Attribute has been modified by user
    if($scope.layerFormCtrlObj[$scope.layerFormCfg.id].$dirty)
    {
      // If source exists
      if($scope.curEntity.source && $scope.curEntity.source != undefined)
      {
        // Set visible to children layers
        for(var i=0; i< $scope.curEntity.layers.length;i++)
        {
          var layer = $scope.curEntity.layers[i];
          layer.setMinScale(nv);
        }
      }
    }
  });

  $scope.$watch("curEntity.max_scale",function(nv,ov)
  {
    if(nv == undefined)
      return;

     // Attribute has been modified by user
    if($scope.layerFormCtrlObj[$scope.layerFormCfg.id].$dirty)
    {
      // If source exists
      if($scope.curEntity.source && $scope.curEntity.source != undefined)
      {
        // Set visible to children layers
        for(var i=0; i< $scope.curEntity.layers.length;i++)
        {
          var layer = $scope.curEntity.layers[i];
          layer.setMaxScale(nv);
        }
      }
    }
  });

  $scope.$watch("curEntity.permission_exist",function(nv,ov)
  {
    if(nv == undefined)
      return;

    var permDescrF = $scope.permissionFormCfg.fg[0].rows[0][1];

    /* Get the correct form controller end entity */
    var i18nFormCtrlObj = null;
    var permission_prefix = null;
    var permission_descr_prefix = null;

    if($scope.curEntity instanceof wgCategory)
    {
      i18nFormCtrlObj = $scope.groupFormCtrlObj[$scope.permissionFormCfg.id];
      permission_prefix = "VIEW_CAT_";
      permission_descr_prefix = "Visualizza la categoria di layer '";
    }
    else if($scope.curEntity instanceof wgLayer)
    {
      i18nFormCtrlObj = $scope.layerFormCtrlObj[$scope.permissionFormCfg.id];
      permission_prefix = "VIEW_LYR_";
      permission_descr_prefix = "Visualizza il layer '";
    }

    if(nv)
    {
      // Enable permission's decsription
      permDescrF.enabled = true;
      permDescrF.required = true;
      if(i18nFormCtrlObj != null)
      {
        if(i18nFormCtrlObj.$dirty) //User has modified the value
        {
          // Create the permission string
          $scope.curEntity.permission = permission_prefix + $scope.curEntity.id;
          // Create a default permission description
          if($scope.curEntity.i18n.it)
            $scope.curEntity.permission_descr = permission_descr_prefix +
              $scope.curEntity.i18n.it +"'";
          else
            $scope.curEntity.permission_descr = permission_descr_prefix + "'";
        }
      }
    }
    else
    {
      // Disable permission's decription
      permDescrF.enabled = false;
      permDescrF.required = false;
      if(i18nFormCtrlObj != null)
      {
        if(i18nFormCtrlObj.$dirty) //User has modified the value
        {
          // Clear the permission string
          $scope.curEntity.permission = null;
          // Clear a default permission description
          $scope.curEntity.permission_descr = null;
        }
      }
    }
  });

  /* Private Functions */

  function _manageLayerView()
  {
    // Select the first tab
    $scope.activeTab = 0;

    var sourceObj = $scope.curEntity.source;

    if(sourceObj)
    {
      var typeF = $scope.layerSourceFormCfg.fg[0].rows[0][0];
      var urlF = $scope.layerSourceFormCfg.fg[0].rows[0][1];
      var legendExternF = $scope.layerLegendFormCfg.fg[0].rows[0][0];

      // Enable source fields
      typeF.enabled = true;
      urlF.enabled = true;

      // Hide legend extern
      legendExternF.show = false;

      if(sourceObj.type != undefined)
      {
        if(sourceObj.type =="WMS" || sourceObj.type =="VECTOR")
        {
          // Get service capabilities
          _loadServiceCapabilities($scope.curEntity,function(res)
          {
            if(res)
            {
              // Manage view and datasources
              _sourceAttributeChanged("type",sourceObj.type,null);
              _sourceAttributeChanged("layer_name",sourceObj.layer_name,null);
            }
            $scope.showLayerForm = true;
            $scope.showI18nCategoryForm = false;
          });
        }
        else if (sourceObj.type == "STATIC_IMAGE")
        {
           _sourceAttributeChanged("type",sourceObj.type,null);
        }
        else
        {
          // Manage view and datasources
          _sourceAttributeChanged("type",sourceObj.type,null);
          _sourceAttributeChanged("layer_name",sourceObj.layer_name,null);
          $scope.showLayerForm = true;
          $scope.showI18nCategoryForm = false;
        }
      }
      else
      {
        _setWFSSourceAttributeRequired(false);
        // Manage _enableSourceAndType flag
        if($scope.curEntity._enableSourceAndType != undefined &&
          !$scope.curEntity._enableSourceAndType)
        {
          // Show legend extern
          legendExternF.show = true;
          // Disable source fields (to avoid validation)
          typeF.enabled = false;
          urlF.enabled = false;

          // Create a temp entity to load capabilites
          var temp_ent = {
            source: $scope.curEntity._parentSource,
            layer_name: $scope.curEntity.layer_name
          };

          if(temp_ent.source.url != undefined)
          {
            // Get service capabilities
            _loadServiceCapabilities(temp_ent,function(res)
            {
              if(res)
              {
                // Manage view and datasources
                _sourceAttributeChanged("type",temp_ent.source.type,null);
                _sourceAttributeChanged("layer_name",temp_ent.layer_name,null);
                $scope.showLayerForm = true;
              }
              else
                $scope.showLayerForm = true;

              $scope.showI18nCategoryForm = false;
            });
          }
        }
        else
        {
          // Hide legend extern
          legendExternF.show = false;

          // Clear layerName ds in layerSourceFormCfg and in layerSimpleSourceFormCfg
          $scope.layerSourceFormCfg.fg[0].rows[1][0].options = [];
          $scope.layerSimpleSourceFormCfg.fg[0].rows[0][0].options = [];

          // Manage view and datasources
          _sourceAttributeChanged("type",null,null);
          _sourceAttributeChanged("layer_name",null,null);

          $scope.showLayerForm = true;
          $scope.showI18nCategoryForm = false;
        }
      }
    }
    else // It's a new layer
    {
      $scope.showLayerForm = true;
      $scope.showI18nCategoryForm = false;
    }

    if($scope.curEntity.legend)
    {
      var legend = $scope.curEntity.legend;
      _layerLegendAttributeChanged("extern",legend.extern,null);

      if(legend.classes && legend.classes.length >0)
        _layerLegendAttributeChanged("class_presence",true,null);
      else
        _layerLegendAttributeChanged("class_presence",false,null);
    }
    else
    {
      _layerLegendAttributeChanged("extern",false,null);
      _layerLegendAttributeChanged("class_presence",false,null);
    }

    if($scope.curEntity.legend == null || !$scope.curEntity.legend.image)
    {
       // Reset icon
      $scope.disableIcon = true;
      $scope.lIconToShow = null;
      $scope.lIconToDownload = null;
    }
    else
    {
      $scope.disableIcon = true;
      $scope.lIconToShow = $scope.curEntity.legend.image;
      $scope.lIconToDownload = $scope.lIconToShow;
    }
  }

  function _loadServiceCapabilities(ent,callback)
  {
    var servType = "";
    switch(ent.source.type)
    {
      case "WMS":
        servType = "WMS";
        break;

      case "VECTOR":
        servType = "WFS";
        break;
    }

    var getCapabilityUrl = null;

    // check for presence of ? in url_service
    var quesryStringAppender = (ent.source.url.indexOf('?') > 0) ? '&' : '?';

    // Control if the service_url is out of our geoserver
    var pattern = /^http(s)?:\/\//i;

    if(pattern.test(ent.source.url))
    {
      var capUrl = ent.source.url + quesryStringAppender +
        "request=GetCapabilities&service=" + servType;

      getCapabilityUrl = "/utility/proxy?url=" + encodeURIComponent(capUrl);

//       var getCapabilityUrl = "/webgis/proxyRequest/" + ent.source.url +
//         quesryStringAppender + "request=GetCapabilities&service=" + servType;
    }
    else
    {
      getCapabilityUrl = ent.source.url +
        quesryStringAppender + "request=GetCapabilities&service=" + servType;
    }

    //TODO MANAGE ERROR IN XML RESPONSE!!!
    if(ent.source.type == "WMS")
    {
      // Manage capabilities
      var capabilities = $scope.dWMSCapabilities[getCapabilityUrl];
      if(capabilities != undefined)
      {
        _WMSCapabilitiesParser(ent,capabilities,callback);
      }
      else
      {
        //Do the request
        $scope.showLoader = true;
        rwHttpSvc.get(getCapabilityUrl,function(res)
        {
          $scope.showLoader = false;
          if(res)
          {
            try
            {
              // Get the response to use the capabilities
              var wmsCapabilities = new ol.format.WMSCapabilities();
              var service = wmsCapabilities.read(res);

              // Memorize  capabilities into dictionary
              $scope.dWMSCapabilities[getCapabilityUrl] = service;

              _WMSCapabilitiesParser(ent,service,callback);
            }
            catch(err)
            {
              console.error("ERROR "+err);
              // Show custom message into the form
              $scope.$emit("showAlert",{
                msg:" CORE_MSG.INVALID_URL",btKo:"Ok",style:"danger"});

              callback(null);
            }
          }
          else
          {
            console.error("ERROR load "+getCapabilityUrl);
            // Show custom message into the form
            $scope.$emit("showAlert",{
              msg:" CORE_MSG.INVALID_URL",btKo:"Ok",style:"danger"});
            callback(null);
          }
        });
      }
    }
    else if(ent.source.type == "VECTOR")
    {
      // Manage capabilities
      var capabilities = $scope.dWFSCapabilities[getCapabilityUrl];
      if(capabilities != undefined)
      {
        _WFSCapabilitiesParser(ent,capabilities,callback);
      }
      else
      {
        //Do the request
        $scope.showLoader = true;
        rwHttpSvc.get(getCapabilityUrl,function(res)
        {
          $scope.showLoader = false;
          if(res)
          {
            try
            {
              // Convert the res into json
              var x2js = new X2JS();
              var resJson = x2js.xml_str2json(res);
              //Get wfs capabilities
              var wfsCapabilites = resJson.WFS_Capabilities;

              // Memorize  capabilities into dictionary
              $scope.dWFSCapabilities[getCapabilityUrl] = wfsCapabilites;

              _WFSCapabilitiesParser(ent,wfsCapabilites,callback);
            }
            catch(err)
            {
              console.error("ERROR "+err);
              // Show custom message into the form
              $scope.$emit("showAlert",{
                msg:" CORE_MSG.INVALID_URL",btKo:"Ok",style:"danger"});

              callback(null);
            }
          }
          else
          {
            console.error("ERROR load "+getCapabilityUrl);
            // Show custom message into the form
            $scope.$emit("showAlert",{
              msg:" CORE_MSG.INVALID_URL",btKo:"Ok",style:"danger"});

            callback(null);
          }
        });
      }
    }
  }

  // Analyze service capabilities to extract version,format and layers
  function _WMSCapabilitiesParser(ent,service,callback)
  {
    if(service.version)
      ent.source.version = service.version;
    else
      ent.source.version = "";

    if (service.hasOwnProperty("Capability"))
    {
      var capabilities = service.Capability;

      // Create Format ds
      var aFormatDs = [];
      // Get the application's map format, used to filter format
      var configuredFormatObj = $scope.wmsMapFormat;

      if (capabilities.Request)
      {
        if (capabilities.Request.GetMap)
        {
          // Create Format Datasource
          if(capabilities.Request.GetMap.Format)
          {
            var aFormat = capabilities.Request.GetMap.Format;

            for(var i=0;i<aFormat.length;i++)
            {
              var format = aFormat[i];

              var confFormatObjKeys =  Object.keys(configuredFormatObj);
              if(confFormatObjKeys.length>0)
              {
                /* If the format exists into configuredFormatObj,
                  * add to aFormatDs */
                var found = false;

                for(var j=0;j<confFormatObjKeys.length && !found;j++)
                {
                  var key = confFormatObjKeys[j];
                  var cfgFormat = configuredFormatObj[key];

                  if(cfgFormat == format)
                  {
                    found = true;
                    aFormatDs.push({id:format,name:key});
                  }
                }
              }
              else
                aFormatDs.push({id:format,name:format});
            }
          }
        }
      }
      $scope.layerSourceFormCfg.fg[0].rows[2][0].options = aFormatDs;

      var layers = capabilities.Layer;

      // Get Layers from service and save into dLayers
      $scope.dLayers = {};

      if (capabilities.Layer.hasOwnProperty("Layer"))
        $scope._getLayersService(layers.Layer,$scope.dLayers);
      else
        $scope._getLayersService([layers],$scope.dLayers);

      // Create layers array
      var aLayers = [];
      for(var key in $scope.dLayers)
        aLayers.push($scope.dLayers[key]);

      // Set aLayers as layerName ds in layerSourceFormCfg
      $scope.layerSourceFormCfg.fg[0].rows[1][0].options = aLayers;
      // Set aLayers as layerName ds in layerSimpleSourceFormCfg
      $scope.layerSimpleSourceFormCfg.fg[0].rows[0][0].options = aLayers;

      /* Get the default spatial references (SRS/CRS) */
      var aDefaultSr = [];
      if(capabilities.Layer.hasOwnProperty("CRS")) // Version 1.1.1
        aDefaultSr = capabilities.Layer.CRS;
      else if(capabilities.Layer.hasOwnProperty("SRS")) // Version 1.3.0
        aDefaultSr = capabilities.Layer.SRS;

      if(aDefaultSr.length >0)
      {
        /*
         * Intersect aDefaultSr with mapSr to obtain spatial references
         * to show as projectionDs.
         */
        var projectionDs = [];

        // Get the application's map rs, used to filter
        var aConfiguredSr = $scope.mapSr;

        for(var i=0; i < aDefaultSr.length; i++)
        {
          var sr = aDefaultSr[i];
          var exists = false;
          // Workaround --> Control if the element exists into the projectionDs
          for(var j=0; j< projectionDs.length;j++)
          {
            if(angular.equals(sr, projectionDs[j].id))
              exists = true;
          }
          if(!exists)
          {
            // If the crs exist into configured sr, add to the projectionDs
            var found = false;
            for(var j=0; j< aConfiguredSr.length && !found;j++)
            {
              var confSr = aConfiguredSr[j];

              //From sr get the number
              var aSplittedCrs = sr.split(":");
              if(aSplittedCrs[1] == confSr.code)
                found = true;
            }
            if(found)
              projectionDs.push({id:sr, name:sr});
          }
        }
        $scope.layerSourceFormCfg.fg[0].rows[1][1].options = [];
        $scope.layerSourceFormCfg.fg[0].rows[1][1].options = projectionDs;
      }
    }

    callback(true);
  }

  function _WFSCapabilitiesParser(ent,service,callback)
  {
    if(service._version)
      ent.source.version = service._version;

    // Create Format ds
    var aFormatDs = [];
    // Get the application's map format, used to filter format
    var configuredFormatObj = $scope.wfsMapFormat;

    if (service.hasOwnProperty("OperationsMetadata"))
    {
      var opMetaData = service.OperationsMetadata;
      if (opMetaData.hasOwnProperty("Operation"))
      {
        var aOperations = opMetaData.Operation;
        for(var i=0,found = false; i< aOperations.length &&!found; i++)
        {
          var op = aOperations[i];
          if(op._name == "GetFeature")
          {
            found = true;
            if(op.hasOwnProperty("Parameter"))
            {
              var aParameter = op.Parameter;
              for(var j=0,opFound=false; j< aParameter.length &&!opFound; j++)
              {
                var param = aParameter[j];
                if(param._name == "outputFormat")
                {
                  opFound = true;
                  if(param.hasOwnProperty("AllowedValues"))
                  {
                    var aFormat = param.AllowedValues.Value;
                    for(var k=0;k<aFormat.length;k++)
                    {
                      var format = aFormat[k].__text;

                      var confFormatObjKeys = Object.keys(configuredFormatObj);
                      if(confFormatObjKeys.length>0)
                      {
                        /* If the format exists into configuredFormatObj,
                          * add to aFormatDs */
                        var foundF = false;
                        for(var l=0;l<confFormatObjKeys.length && !foundF;l++)
                        {
                          var key = confFormatObjKeys[l]
                          var cfgFormat = configuredFormatObj[key];

                          if(cfgFormat == format)
                          {
                            foundF = true;
                            aFormatDs.push({id:format,name:key});
                          }
                        }
                      }
                      else
                        aFormatDs.push({id:format,name:format});
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    $scope.layerSourceFormCfg.fg[0].rows[2][0].options = aFormatDs;

    // Get Features
    if (service.hasOwnProperty("FeatureTypeList"))
    {
      var featTypeList = service.FeatureTypeList;
      if (featTypeList.hasOwnProperty("FeatureType"))
      {
        var aFeatures = [];
        // Create layers array
        var aLayers = [];
        // Get Layers from service and save into dLayers
        $scope.dLayers = {};

        /* NOTE If there is only  1 layer, featTypeList.FeatureType is an
         * object not an array!
         */
        if (Array.isArray(featTypeList.FeatureType))
          aFeatures = featTypeList.FeatureType;
        else
          aFeatures.push(featTypeList.FeatureType);

        for(var i=0; i< aFeatures.length;i++)
        {
          var feature = aFeatures[i];

          var layerId = feature.Title;

          // Create bounding box as array(0-->minx, 1-->miny, 2-->miny, 3-->maxy)
          //TODO Convert in our rs?
          var lowCorner = feature.WGS84BoundingBox.LowerCorner.toString();
          var upCorner = feature.WGS84BoundingBox.UpperCorner.toString();
          var aSplittedLowCorner = lowCorner.split(" ");
          var xMin = aSplittedLowCorner[0];
          var yMin = aSplittedLowCorner[1];
          var aSplittedUpCorner = upCorner.split(" ");
          var xMax = aSplittedUpCorner[0];
          var yMax = aSplittedUpCorner[1];

          var aBbox = [xMin,yMin,xMax,yMax];

          var layerObj = {
            label: feature.Title,
            id: layerId,
            layer_name: feature.Title,
            min_scale: "",
            max_scale: "",
            bounding_box: aBbox,
          };

          // Get CRS
          if(feature.hasOwnProperty("DefaultCRS"))
          {
            //NOTE The CRS is in this format ==> prefix:suffix
            var crsStr = feature.DefaultCRS;
            var aSplittedCrs = crsStr.split(/:+:/);

            // Get suffix
            var rsSuffix = aSplittedCrs[(aSplittedCrs.length-1)];

            // Get prefix
            var aSplittedPrefix = aSplittedCrs[0].split(/:/);
            var rsPrefix = aSplittedPrefix[(aSplittedPrefix.length-1)];

            var crs = rsPrefix+":"+rsSuffix;
            layerObj.CRS = [crs];
          }

          $scope.dLayers[layerId] = layerObj;
          aLayers.push(layerObj);
        }

        // Set aLayers as layerName ds in layerSourceFormCfg
        $scope.layerSourceFormCfg.fg[0].rows[1][0].options = aLayers;
        // Set aLayers as layerName ds in layerSimpleSourceFormCfg
        $scope.layerSimpleSourceFormCfg.fg[0].rows[0][0].options = aLayers;
      }
    }
    callback(true);
  }

  // Load the DescribeFeatureType, if not contained into dDescribeFeatureType
  function _loadDescribeFeatureType(url,layer_name,callback)
  {
    var getDescribeFeatTypeUrl;

    // if source.type = GEOJSON, this url doesn't belong to a mapserver
    var notMapserverUrl = ($scope.curEntity.source.type == "GEOJSON") ? true : false;

    // check if in the url there is a queryString
    var thereIsQueryString = (url.indexOf("?") > 0) ? true : false;

    // set the appropriate query string to get a description of features
    var queryString = notMapserverUrl ? "getListFields=1" :
      "request=DescribeFeatureType" +
        "&service=WFS" +
        //"&version=" + $scope.curEntity.source.version +
        "&outputFormat=application/json";

    var version = null;

    if ($scope.curEntity.source && $scope.curEntity.source.version)
      version = $scope.curEntity.source.version;
    else if ($scope.curEntity._parentSource && $scope.curEntity._parentSource.version)
      version = $scope.curEntity._parentSource.version;

    if (version)
      queryString += "&version=" + version;

    // from WMS >= 1.3.0 typeName attribute must be typeNames, but doesn't work
    queryString += "&typeName=" + layer_name;

    // set the appropriate manner to append query string to given url
    var append = thereIsQueryString ? "&" : "?";

    // Control if the service_url is out of our network (cross request)
    var pattern = /^http(s)?:\/\//i;

    if(pattern.test(url))
    {
      var capUrl = url + append + queryString;

      getDescribeFeatTypeUrl = "/utility/proxy?url=" + encodeURIComponent(capUrl);

      //getDescribeFeatTypeUrl = "/webgis/proxyRequest/"+ url + append + queryString;
    }
    else
    {
      getDescribeFeatTypeUrl = url + append + queryString;
    }

    // Manage DescribeFeatureType
    var describeFeatureType = $scope.dDescribeFeatureType[getDescribeFeatTypeUrl];

    if(describeFeatureType != undefined)
      _describeFeatureTypeParser(describeFeatureType,callback);
    else
    {
      //Do the request
      $scope.showLoader = true;
      rwHttpSvc.get(getDescribeFeatTypeUrl,function(res)
      {
        $scope.showLoader = false;
        if(res)
        {
          $scope.dDescribeFeatureType[getDescribeFeatTypeUrl] = res;
          _describeFeatureTypeParser(res,callback);
        }
      });
    }
  }

  function _describeFeatureTypeParser(describeFeatureType,callback)
  {
    if(describeFeatureType.hasOwnProperty("featureTypes"))
    {
      var aFeatureTypes = describeFeatureType.featureTypes;
      var queryableEnt = $scope.curEntity.queryable;
      var selectable = $scope.curEntity.selectable;
      var source = $scope.curEntity.source;
      var searchable = $scope.curEntity.searchable;
      var aProperties = aFeatureTypes[0].properties;

      // NOTE Filter prop, don't add property with localType equal to:
      var aTypeToFilter = ["Polygon","MultiPolygon","Point","MultiPoint",
        "LineString","MultiLineString","Geometry","MultiGeometry"];

      /*
       * Populate queryableEnt.properties, source.attributesForView,
       * searchable.attributesForView and selectable.attributes only
       * if they aren't populated, yet
       */
      if(queryableEnt.properties.length == 0)
      {
        //Flag used to add attributes to the source
        var bAddAttributes = false;
        if(source.type == "VECTOR" || source.type == "GEOJSON")
          bAddAttributes = true;

        for(var i=0; i<aProperties.length; i++)
        {
          var prop = aProperties[i];
          // Control if locType is in aTypeToFilter
          var locType = prop.localType;
          var found = false;
          for(var j=0; j< aTypeToFilter.length && !found;j++)
          {
            if(locType == aTypeToFilter[j])
              found = true;
          }
          if(!found)
          {
            queryableEnt.addProperty(prop);

            if(bAddAttributes)
            {
              source.addAttribute(prop);
              searchable.addAttribute(prop);
              selectable.addAttribute(prop);
            }
          }
        }
      }
      callback(1);
    }
    else
      callback(null);
  }

  // Set the source's attribute required according to the specified bVal
  function _setWFSSourceAttributeRequired(bVal)
  {
    var urlF = $scope.layerSourceFormCfg.fg[0].rows[0][1];
    var layerNameF = $scope.layerSourceFormCfg.fg[0].rows[1][0];
    var projectionF = $scope.layerSourceFormCfg.fg[0].rows[1][1];
    var formatF = $scope.layerSourceFormCfg.fg[0].rows[2][0];
    var strategyF = $scope.layerSourceFormCfg.fg[1].rows[0][2];

    urlF.required = bVal;
    layerNameF.required = bVal;
    projectionF.required = bVal;
    formatF.required = bVal;
    strategyF.required = bVal;
  }

  // Set the source's attribute required according to the specified bVal
  function _setWMSSourceAttributeRequired(bVal)
  {
    var urlF = $scope.layerSourceFormCfg.fg[0].rows[0][1];
    var projectionF = $scope.layerSourceFormCfg.fg[0].rows[1][1];
    var formatF = $scope.layerSourceFormCfg.fg[0].rows[2][0];

    urlF.required = bVal;
    projectionF.required = bVal;
    formatF.required = bVal;
  }

  // Function used to control if something is changed in layer's source form
  function _sourceAttributeChanged(attr,nv,ov)
  {
    var transparentF = $scope.layerSourceFormCfg.fg[0].rows[1][2];
    var tiledF = $scope.layerFormCfg.fg[0].rows[0][1];
    var editableF = $scope.layerFormCfg.fg[0].rows[0][4];
    var visibleF = $scope.layerFormCfg.fg[0].rows[1][2];
    var dynamicFilterF = $scope.layerFormCfg.fg[0].rows[0][3];
    var clusterDistF =  $scope.layerSourceFormCfg.fg[1].rows[0][1];
    var legendExternF = $scope.layerLegendFormCfg.fg[0].rows[0][0];
    var formatF = $scope.layerSourceFormCfg.fg[0].rows[2][0];
    var versionF = $scope.layerSourceFormCfg.fg[0].rows[2][1];
    var btnGetCap = $scope.layerSourceFormCfg.fg[0].rows[0][2];
    var nameF = $scope.layerSourceFormCfg.fg[0].rows[1][0];
    var projF = $scope.layerSourceFormCfg.fg[0].rows[1][1];
    var urlF = $scope.layerSourceFormCfg.fg[0].rows[0][1];
    var imgW = $scope.layerSourceFormCfg.fg[0].rows[1][3];
    var imgH = $scope.layerSourceFormCfg.fg[0].rows[1][4];
    var projF = $scope.layerSourceFormCfg.fg[0].rows[1][1];

    var wfsSourceAttribFG = $scope.layerSourceFormCfg.fg[1];
    var imgStatExtentFG = $scope.layerSourceFormCfg.fg[2];
    var extentFG = $scope.layerFormCfg.fg[1];

    if(nv == undefined)
    {
      if(attr == "layer_name")
      {
        // Hide extern legend
        legendExternF.show = false;

        // Hide the image type
        $scope.layerFormCfg.fg[0].rows[0][0].show = false;
        $scope.layerFormCfg.fg[0].rows[0][0].enabled = false;
      }
      else if(attr == "type")
      {
        // Hide extern legend
        legendExternF.show = false;
        // Hide and disable tiled
        tiledF.show = false;
        tiledF.enabled = false;
        // Show and enable transparent
        transparentF.show = true;
        transparentF.enabled = true;
        // Show and enable visible
        visibleF.show = true;
        visibleF.enabled = true;
        // Hide and disable img width
        imgW.show = false;
        imgW.enabled = false;
        // Hide and disable img height
        imgH.show = false;
        imgH.enabled = false;

        // hide img extents
        imgStatExtentFG.show = false;

        wfsSourceAttribFG.show = false;
      }
      else if(attr == "cluster")
      {
        clusterDistF.enabled = false;
      }

      return;
    }

    switch(attr)
    {
      case "type":

        if(nv == "VECTOR")
        {
          // Hide and disable tiled
          tiledF.show = false;
          tiledF.enabled = false;
          //Hide and disable transparent
          transparentF.show = false;
          transparentF.enabled = false;
          // Show and enable visible
          visibleF.show = true;
          visibleF.enabled = true;
          // Show and enable dynamic filter
          dynamicFilterF.show = true;
          dynamicFilterF.enabled = true;
          // Show and enable editable
          editableF.show = true;
          editableF.enabled = true;
          // show GetCapabilities button
          btnGetCap.show = true;
          // Hide and disable img width
          imgW.show = false;
          imgW.enabled = false;
          // Hide and disable img height
          imgH.show = false;
          imgH.enabled = false;

          extentFG.show = true;
          imgStatExtentFG.show = false;

          formatF.show = true;
          versionF.show = true;

          nameF.show = true;
          nameF.type = "customSelect";

          projF.type = "select";
          projF.options = [];

          urlF.label = "WEBGIS.GEOSERVICE.SERVICE_URL";

          $scope.curEntity.type = "VECTOR";

          /*
           * If this layer don't have source and type,it's a children!
           * So show only ADVANCED TAB ,STYLE TAB and LEGEND TAB.
           */
          if($scope.curEntity._enableSourceAndType != undefined &&
              !$scope.curEntity._enableSourceAndType)
          {
            // Select advanced tab as active
            $scope.activeTab = 1;
            // Set source attribure not required
            _setWFSSourceAttributeRequired(false);
          }
          else
          {
            // Set source attribute required
            _setWFSSourceAttributeRequired(true);

            wfsSourceAttribFG.show = true;
          }
        }
        else if (nv == "GEOJSON")
        {
          // Hide and disable tiled
          tiledF.show = false;
          tiledF.enabled = false;
          //Hide and disable transparent
          transparentF.show = false;
          transparentF.enabled = false;
          // Show and enable visible
          visibleF.show = true;
          visibleF.enabled = true;
          // Show and enable dynamic filter
          dynamicFilterF.show = true;
          dynamicFilterF.enabled = true;
          // Show and enable editable
          editableF.show = true;
          editableF.enabled = true;
          // hide GetCapabilities button
          btnGetCap.show = false;
          // hide format
          formatF.show = false;
          // hide version
          versionF.show = false;
          // Hide and disable img width
          imgW.show = false;
          imgW.enabled = false;
          // Hide and disable img height
          imgH.show = false;
          imgH.enabled = false;

          extentFG.show = true;
          imgStatExtentFG.show = false;

          nameF.show = true;
          nameF.type = "text";

          projF.type = "text";
          urlF.label = "WEBGIS.GEOSERVICE.SERVICE_URL";

          $scope.curEntity.type = "VECTOR";

          // Set source attribute required
          _setWFSSourceAttributeRequired(true);

          wfsSourceAttribFG.show = true;
        }
        else if (nv == "STATIC_IMAGE")
        {
          var projDs = [];

          for(var j=0; j< $scope.mapSr.length; j++)
          {
            var sr = $scope.mapSr[j];

            projDs.push({id:"EPSG:"+sr.code, name:"EPSG:"+sr.code});
          }

          /* base configuration */
          // hide GetCapabilities button
          btnGetCap.show = false;
          // hide version
          versionF.show = false;
          // hide format
          formatF.show = false;
          // hide name
          nameF.show = false;
          //Hide transparent
          transparentF.show = false;
          // Hide and disable img width
          imgW.show = true;
          imgW.enabled = true;
          // Hide and disable img height
          imgH.show = true;
          imgH.enabled = true;
          // show img extents
          imgStatExtentFG.show = true;

          projF.type = "select";
          projF.options = projDs;

          urlF.label = "WEBGIS.GEOSERVICE.STATIC_IMAGE_URL";

          // hide cluster fields group
          wfsSourceAttribFG.show = false;

          /* advanced configuration */
          // Hide tiled
          tiledF.show = false;
          // Hide editable
          editableF.show = false;
          // Hide dynamic filter
          dynamicFilterF.show = false;
          // Hide extent fields group
          extentFG.show = false;

          $scope.curEntity.type = "IMAGE";
        }
        else // WMS
        {
          // show, hide and modify some form fields
          btnGetCap.show = true;
          versionF.show = true;
          formatF.show = true;

          nameF.show = true;
          nameF.type = "customSelect";

          projF.type = "select";
          projF.options = [];

          urlF.label = "WEBGIS.GEOSERVICE.SERVICE_URL";

          // Hide and disable img width
          imgW.show = false;
          imgW.enabled = false;
          // Hide and disable img height
          imgH.show = false;
          imgH.enabled = false;

          // Hide and disable dynamic filter
          dynamicFilterF.show = false;
          dynamicFilterF.enabled = false;

          // Hide and disable editable
          editableF.show = false;
          editableF.enabled = false;

          extentFG.show = true;
          imgStatExtentFG.show = false;

          wfsSourceAttribFG.show = false;
          // Set source attribute not required
          _setWFSSourceAttributeRequired(false);

          if(nv == "WMS")
          {
            /*
             * Manage tiled. If this layer don't have source and type, has the same
             * tiled and the same visible from it's parent and then disable
             * these fields.
             */
            if($scope.curEntity._enableSourceAndType != undefined &&
              !$scope.curEntity._enableSourceAndType)
            {
              tiledF.enabled = false;
              tiledF.show = false;

              visibleF.show = false;
              visibleF.enabled = false;

              _setWMSSourceAttributeRequired(false);
            }
            else
            {
              tiledF.enabled = true;
              tiledF.show = true;

              visibleF.show = true;
              visibleF.enabled = true;

              _setWMSSourceAttributeRequired(true);
            }

            // Show and enable  transparent
            transparentF.show = true;
            transparentF.enabled = true;

            $scope.curEntity.type = "IMAGE";

            if($scope.curEntity.image_id == null)
              $scope.curEntity.image_id = 1;
          }
          else
          {
            // Hide and disable tiled
            tiledF.show = false;
            tiledF.enabled = false;

            // Hide and disable visible
            visibleF.show = false;
            visibleF.enabled = false;

            // Hide and disable transparent
            transparentF.show = false;
            transparentF.enabled = false;

            $scope.curEntity.type = "GROUP";

            // Set a 'Gruppo' value for image_id
            $scope.curEntity.image_id = 1;
          }
          // Clear entity
          $scope.curEntity.searchable.reset();
        }
        break;

      case "layer_name":
        // Show extern legend
        legendExternF.show = true;

        // Get the selected layer from dLayers
        var layerObj = $scope.dLayers[nv];

        // Set the projection's ds
        var projectionDs = [];

        // Get the application's map rs, used to filter
        var aConfiguredSr = $scope.mapSr;

        if(layerObj != undefined)
        {
          if(layerObj.hasOwnProperty("CRS")) // Version 1.1.1
          {
            for(var i=0; i < layerObj.CRS.length; i++)
            {
              var crs = layerObj.CRS[i];
              var exists = false;
              // Workaround --> Control if the element exists into the projectionDs
              for(var j=0; j< projectionDs.length;j++)
              {
                if(angular.equals(crs, projectionDs[j].id))
                  exists = true;
              }
              if(!exists)
              {
                // If the crs exist into configured sr, add to the projectionDs
                var found = false;
                for(var j=0; j< aConfiguredSr.length && !found;j++)
                {
                  var sr = aConfiguredSr[j];

                  //From crs get the number
                  var aSplittedCrs = crs.split(":");
                  if(aSplittedCrs[1] == sr.code)
                    found = true;
                }
                if(found)
                  projectionDs.push({id:crs, name:crs});
              }
            }
          }
          else if (layerObj.hasOwnProperty("SRS")) // Version 1.3.0
          {
            for(var i=0; i < layerObj.SRS.length; i++)
            {
              var srs = layerObj.SRS[i];
              var exists = false;
              // Workaround --> Control if the element exists into the projectionDs
              for(var j=0; j< projectionDs.length;j++)
              {
                if(angular.equals(srs,projectionDs[j].id))
                  exists = true;
              }
              if(!exists)
              {
                // If the srs exist into configured sr, add to the projectionDs
                var found = false;
                for(var j=0; j< aConfiguredSr.length && !found;j++)
                {
                  var sr = aConfiguredSr[j];

                  //From srs get the number
                  var aSplittedCrs = srs.split(":");
                  if(aSplittedCrs[1] == sr.code)
                    found = true;
                }
                if(found)
                  projectionDs.push({id:srs, name:srs});
              }
            }
          }

          $scope.layerSourceFormCfg.fg[0].rows[1][1].options = [];
          $scope.layerSourceFormCfg.fg[0].rows[1][1].options = projectionDs;

          if( $scope.curEntity.op =="I") // Set the minScale and maxScale
          {
            $scope.curEntity.min_scale = layerObj.min_scale !== "" ?
              parseInt(layerObj.min_scale) : null;
            $scope.curEntity.max_scale = layerObj.max_scale !== "" ?
              parseInt(layerObj.max_scale) : null;
          }
        }

        // Show the image type
        $scope.layerFormCfg.fg[0].rows[0][0].show = true;
        $scope.layerFormCfg.fg[0].rows[0][0].enabled = true;

        // Set image_id to null (user MUST select him!) if it is "Group"
        if($scope.curEntity.image_id == 1) // Group
          $scope.curEntity.image_id = null;

        // Get The correct source
        var sourceForProj = null;

        if($scope.curEntity.source &&
          $scope.curEntity.source.projection != undefined)
          sourceForProj = $scope.curEntity.source;
        else if ($scope.curEntity._parentSource &&
          $scope.curEntity._parentSource.projection != undefined)
          sourceForProj = $scope.curEntity._parentSource;

        // If projection is defined, reload the correct bounding box according to it
        if(sourceForProj)
        {
          var curProj = sourceForProj.projection;

          if(sourceForProj.type != "VECTOR" && sourceForProj.type != "GEOJSON")
          {
            // Find the correct bounding box according to the selected projection
            for(var i=0,found = false;i<layerObj.bounding_box.length && ! found;i++)
            {
              var bb = layerObj.bounding_box[i];
              if(curProj == bb.crs || curProj == bb.srs)
              {
                found = true;
                var extent = bb.extent; // (0-->minx, 1-->miny, 2-->miny, 3-->maxy)
                if(extent.length == 4)
                {
                  if(curProj == "EPSG:4326") // In this projection, lon and lat are inverted
                  {
                    $scope.curEntity.extent_minx = extent[1];
                    $scope.curEntity.extent_miny = extent[0];
                    $scope.curEntity.extent_maxx = extent[3];
                    $scope.curEntity.extent_maxy = extent[2];
                  }
                  else
                  {
                    $scope.curEntity.extent_minx = extent[0];
                    $scope.curEntity.extent_miny = extent[1];
                    $scope.curEntity.extent_maxx = extent[2];
                    $scope.curEntity.extent_maxy = extent[3];
                  }
                }
                else
                  console.error("ERROR: layer extent hasn't correct items!");
              }
            }
          }
        }

        break;

      case "projection":

        // Get The correct source
        var sourceForProj = null;

        if($scope.curEntity.source)
          sourceForProj = $scope.curEntity.source;
        else if ($scope.curEntity._parentSource)
          sourceForProj = $scope.curEntity._parentSource;

        // Get the selected layer from dLayers
        var layerObj = $scope.dLayers[sourceForProj.layer_name];

        // If projection is defined, reload the correct bounding box according to it
        if(sourceForProj)
        {
          if(sourceForProj.type != "VECTOR")
          {
            if(layerObj)
            {
              // Find the correct bounding box according to the selected projection
              for(var i=0,found = false;i<layerObj.bounding_box.length && ! found;i++)
              {
                var bb = layerObj.bounding_box[i];
                if(nv == bb.crs || nv == bb.srs)
                {
                  found = true;
                  var extent = bb.extent; // (0-->minx, 1-->miny, 2-->miny, 3-->maxy)
                  if(extent.length == 4)
                  {
                    // In this projection, lon and lat are inverted
                    if(sourceForProj.projection == "EPSG:4326")
                    {
                      $scope.curEntity.extent_minx = extent[1];
                      $scope.curEntity.extent_miny = extent[0];
                      $scope.curEntity.extent_maxx = extent[3];
                      $scope.curEntity.extent_maxy = extent[2];
                    }
                    else
                    {
                      $scope.curEntity.extent_minx = extent[0];
                      $scope.curEntity.extent_miny = extent[1];
                      $scope.curEntity.extent_maxx = extent[2];
                      $scope.curEntity.extent_maxy = extent[3];
                    }
                  }
                  else
                    console.error("ERROR: layer extent hasn't correct items!");
                }
              }
            }
          }
        }

        break;

      case "cluster":
        clusterDistF.enabled = nv;
        if(!nv) // Clear clusterDist if it's not a cluster
          $scope.curEntity.source.clusterDist = null;
        break;
    }
  }

  function _simpleSourceAttributeChanged(attr,nv,ov)
  {
    var legendExternF = $scope.layerLegendFormCfg.fg[0].rows[0][0];

    if(nv==undefined)
    {
      if(attr == "layer_name")
      {
        // Hide legend extern
        legendExternF.show = false;
        // Hide the image type
        $scope.layerFormCfg.fg[0].rows[0][0].show = false;
        $scope.layerFormCfg.fg[0].rows[0][0].enabled = false;
      }
    }
    else
    {
      switch(attr)
      {
        case "layer_name":
          // Show legend extern
          legendExternF.show = true;

          // Show the image type
          $scope.layerFormCfg.fg[0].rows[0][0].show = true;
          $scope.layerFormCfg.fg[0].rows[0][0].enabled = true;

          // Set image_id to null (user MUST select him!) if it is "Gruppo"
          if($scope.curEntity.image_id == 1) // Gruppo
          $scope.curEntity.image_id = null;

          break;
      }
    }
  }

  function _layerLegendAttributeChanged(attr,nv,ov)
  {
    if(nv==undefined)
      return;

    var classField = $scope.layerLegendFormCfg.fg[0].rows[0][1];
    var addClassBtnField = $scope.layerLegendFormCfg.fg[0].rows[0][2];

    switch(attr)
    {
      case "extern":

        if($scope.curEntity.type =="GROUP")
           classField.enabled = false;
        else
        {
          // Enable/disable class field
          classField.enabled = (nv == null ? false:nv) ? false : true;
        }

        if(!classField.enabled && $scope.curEntity.legend)
        {
          $scope.curEntity.legend.class_presence = false;
          // Disable add class btn
          addClassBtnField.enabled = false;
        }
        break;

      case "class_presence":
        if($scope.curEntity.legend)
          $scope.curEntity.legend.class_presence = nv;
        else
        {
           $scope.curEntity.legend = {};
           $scope.curEntity.legend.class_presence = nv;
        }

        addClassBtnField.enabled = nv;
        break;
    }
  }

  /* According to the parentId, return the father's entity searching into a
   * specified array of layers
   */
  function _findLayerFather(parentId,aLayers)
  {
    var res = null;

    if(aLayers.length > 0)
    {
      for(var i=0,found=false; i<aLayers.length &&!found; i++)
      {
        var layer = aLayers[i];
        if(layer.id == parentId)
        {
          found = true;
          res = layer;
        }
        else
        {
          res = _findLayerFather(parentId,layer.layers);
          if(res != null)
            found = true;
        }
      }
    }
    return res;
  }
};
