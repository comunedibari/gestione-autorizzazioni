/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("webgis")
  .service("wgMapSvc",wgMapSvc)
  .service("wgFilterBuilderSvc",wgFilterBuilderSvc)
  .service("wgRetrieveStylesSvc", wgRetrieveStylesSvc)
  .service("wgLayerTreeSvc",wgLayerTreeSvc)
  .service("wgSearchSvc", wgSearchSvc);

/*
 * Main map functionality
 */
function wgMapSvc($rootScope, $translate, $http, wgFilterBuilderSvc,
  wgRetrieveStylesSvc, rwConfigSvc, rwHttpSvc, rwAuthSvc, rwEventManager)
{
  var self = this;

  // webgis JSON configuration
  var wgConfig = null;

  // initial map bounding box (it's related to logged user)
  self.initBbox = null;

  // map bounding box (it's related to logged user)
  self.mapBbox = null;

  // map OL object
  self.map = null;

  // map view OL object
  self.mapView = null

  // array of base map controls
  self.arrayCtrl = null;

  // current map SR
  self.mapCurrSR = null;

  // default map SR id
  self.mapDefaultSRId = null;

  // Array with id attribute of queryable map layers  (WMS layers)
  self.queryableLayerArr = [];

  // Array with id attribute of selectable map layers (WFS layers)
  self.selectableLayerIdArr = [];

  // Array with id attribute of editable map layers (WFS layers)
  self.editableLayerIdArr = [];

  // Array with id attribute of hover map layers
  self.hoverLayerIdArr = [];

  // object with all projections available
  self.projObj = {};

  // current scale value (linked to zoom value)
  self.currScale = null;

  // array of map resolutions
  self.resolutions = [];

  // monitor resolution
  var _screenDPI = 96;

  // inches for meter
  var _IPM = 39.37;

  // current base layer id
  self.currBaseLayerId = null;

  // Object to store layers configuration
  self.layersCfgObj = {};

  // support array to store initial array order
  self.initLayerIdOrder = [];

  // contains configuration layers sorted according to json config
  self.categoriesArray = {};
  self.categoriesTree  = [];

  // zoom level to set for point zoom
  self.pointZoomLevel = null;

  // event listener to manage default single click on map feature
  self.mapDefaultSingleClickEvtKey = null;

  // event listener to manage custom single click on map feature
  self.mapCustomSingleClickEvtKey = null;

  // support layers id
  self.layerSearchId    = "_SEARCH_LAYER_ID_";
  self.layerPrintId     = "_PRINT_LAYER_ID_";
  self.layerOverlayId   = "_OVERLAY_LAYER_ID_";
  self.layerTemporaryId = "_TEMPORARY_LAYER_ID_";
  self.layerEditId      = "_EDIT_LAYER_ID_";

  self.editModeModify   = "_MODIFY";
  self.editModeInsert   = "_INSERT";
  self.editModeDelete   = "_DELETE";

  // support layers name
  self.layerTemporaryName = "_TEMPORARY_LAYER_NAME_";

  // contains info for last spatial search
  // is an ol.interaction.Select object with some custom attributes
  self.searchConfig = {
    source: null,
    features: [],
    selectedTab: 0,
    layer_searched: '',
    interaction: null
  };

  // contains geo service
  self.serviceMapConfig = {
    "category": {
      id: 'idCatWMSLayer',
      label: "WEBGIS.LAYER.CAT_WMS_ADDED",
      layers:[]
    },
    "services": []
  };

  // overview layer
  self.overviewLayer = null;

  // Overlay to anchor the popup to the map
  var mapPopupOverlay = null;

  // Overlay to shows feature popup
  var mapTooltipOverlay = null;

  // Overlay to shows markers on map
  var mapMarkerOverlay = null;

  /*
   * Elements that make up the map popup
   */
  var mapPopupContainer = null;
  var mapPopupContent   = null;
  var mapPopupCloser    = null;

  // Element that make the feature tooltip
  var mapTooltipContainer = null;

  // print configuration object
  var printCfg = null;

  // object that store for an event (specified by its type) an array of layer id
  // that must bu refreshed on that event
  var upgradableLayers = {};

  // object that store for a layer the style to apply to him to override default style
  var userStyles = {};

  // interaction to box and click selection
  var boxSelectInt = null;
  var clickSelectInt = null;
  var selectedFeatures = null;

  // styles for selected item
  var pointSelectedStyle = new ol.style.Style({
    image: new ol.style.Circle({
      fill: new ol.style.Fill({
        color: [87, 254, 255, 1]
      }),
      radius: 12
    })
  });

  var lineSelectedStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: [87, 254, 255, 1],
      width: 4
    })
  });

  // interactions to edit
  var modifyInt = null;
  var drawInt = null;
  var drawHoleInt  = null;
  var transformInt = null;
  var snapInt = null;

  // constants to define edit process
  // (from gis tools panel or from extern)
  self._GIS_EDIT_PROCESS_    = "_GIS_";
  self._EXTERN_EDIT_PROCESS_ = "_EXTERN_";

  self.editCfg = {};

  /*
   * On router state changed reset service (only if new state is 'main')
   */
  $rootScope.$on("$stateChangeSuccess",
    function(ev, toState, toParams, fromState, fromParams)
    {
      if (toState.name == "main")
        reset();
    }
  );

  /*
   * Retrieve main JSON configuration object
   */
  this.getConfig = function(callback)
  {
    if (wgConfig)
      callback(wgConfig);
    else
    {
      // user permission
      var objToSend = {
        permLayers: rwAuthSvc.permissions.webgis ? rwAuthSvc.permissions.webgis.name : [],
        permTools:  rwAuthSvc.permissions.gisTools ? rwAuthSvc.permissions.gisTools.name : []
      };

      rwHttpSvc.post('/webgis/getConfig', objToSend, function(res)
      {
        if (!res || res.error)
        {
          console.error("error on retrieve webgis configuration!");
          ; // TODO - manage error (popup)
        }
        else
        {
          wgConfig = res;

          // invoke map initialization
          self.initMap(wgConfig.map, function()
          {
            // invoke layers initialization (build and add to map)
            self.initLayers(wgConfig.layers);

            // add mouse hover pointer interaction (change cursor)
            self.addPointerInteraction();

            // add feature hover interaction (style change)
            self.addHoverInteraction();

            // add click map event to query vector features
            self.addMapClickEvent();

            // add listener on event to update map layers
            rwEventManager.on('event', function(e)
            {
              if (e.type == "refreshMap")
              {
                var layerNameArr = e.detail.layerName;

                for (var idx=0; idx<layerNameArr.length; idx++)
                {
                  var layerId = self.getLayerIdByName(layerNameArr[idx]);

                  // layerId is null if layer isn't available for logged user
                  if (layerId)
                  {
                    // clear and refresh layer source
                    var source = self.layersCfgObj[layerId].layerOL.getSource();

                    if (source instanceof ol.source.Cluster)
                      source = source.getSource();

                    source.clear(true);
                    source.refresh();
                  }
                }
              }
              else
              {
                // to manage old-style refresh (backward compatibility)
                if (upgradableLayers[e.type])
                {
                  var layersIdArr = upgradableLayers[e.type];

                  for (var idx=0; idx<layersIdArr.length; idx++)
                  {
                    // clear and refresh layer source
                    var source = self.layersCfgObj[layersIdArr[idx]].layerOL.getSource();

                    if (source instanceof ol.source.Cluster)
                      source = source.getSource();

                    source.clear(true);
                    source.refresh();
                  }
                }
              }
            });

            // emit event to notify that map is ready
            $rootScope.$broadcast("mapReady", {});

            // return retrieved object
            callback(wgConfig);
          });
        }
      });
    }
  }

  /*
   * Map initialization
   */
  this.initMap = function(mapCfg, callback)
  {
    // Fixs map div height
    $("#mapDiv").height($(window).height() - $("#mapDiv").offset().top - ($rootScope.rwShowFooter ? 60 : 0));

    /*
     * Find initial map SR (is the default SR) to create map view
     * Initial map SR is the current SR
     * Define projection other than 4326 and 3857 (with Proj lib)
     */
    for(var i=0; i<mapCfg.sr.length; i++)
    {
      self.projObj[mapCfg.sr[i].id] = {
        proj: ol.proj.get('EPSG:'+mapCfg.sr[i].code),
        cfgParams: mapCfg.sr[i]
      };

      if (mapCfg.sr[i]._default)
      {
        self.mapCurrSR      = mapCfg.sr[i];
        self.mapDefaultSRId = mapCfg.sr[i].id;
      }

      if (mapCfg.sr[i].definition)
        proj4.defs('EPSG:' + mapCfg.sr[i].code, mapCfg.sr[i].definition);
    }

    // Valorize elements that make up the popup
    mapPopupContainer = document.getElementById('mapPopup');
    mapPopupContent   = document.getElementById('mapPopupContent');
    mapPopupCloser    = document.getElementById('mapPopupCloser');

    // Create an overlay to anchor the popup to the map
    mapPopupOverlay = new ol.Overlay({
      element: mapPopupContainer,
      autoPan: true,
      autoPanAnimation: {
        duration: 250
      }
    });

    // Valorize element that make the tooltip
    mapTooltipContainer = document.getElementById('mapTooltip');

    // Overlay to show tooltip on selectable feature hover
    mapTooltipOverlay = new ol.Overlay({
      element: mapTooltipContainer,
      offset: [10, 0],
      positioning: 'bottom-left'
    });

    // img element to put into marker overlay
    var redDot = document.createElement('img');
    redDot.setAttribute('src', 'image/webgis/redDot.png');

    // Create an overlay to shows markers on the map
    mapMarkerOverlay = new ol.Overlay({
      id: 'mapMarkersOverlay',
      position: undefined,
      positioning: 'center-center',
      element: redDot,
      autoPan: true,
      autoPanAnimation: {
        duration: 250
      }
    });

    // Add a click handler to hide the popup
    mapPopupCloser.onclick = function() {
      mapPopupOverlay.setPosition(undefined);
      mapPopupCloser.blur();
      return false;
    };

    // Create map
    self.map = new ol.Map(
    {
      // initialize map without controls
      controls:[],
      // disable shiftDragZoom interaction to add our zoomBox control
      interactions: ol.interaction.defaults({shiftDragZoom: false}),
      overlays: [mapPopupOverlay, mapMarkerOverlay, mapTooltipOverlay],
      target: document.getElementById('mapDiv')
    });

    // Manage base controls
    self.arrayCtrl = buildBaseControls(mapCfg, self);

    // Add base controls to the map
    self.map.getControls().extend(self.arrayCtrl);

    // set point zoom level
    self.pointZoomLevel = mapCfg.point_zoom_level;

    // build overviewLayer
    var overviewLayerCfgObj = {};

    for(var idx=0; idx<mapCfg.tools.length; idx++)
    {
      if (mapCfg.tools[idx].id == "overview")
      {
        var layerObj = mapCfg.tools[idx].params.layer;

        overviewLayerCfgObj = {};

        // deep copy
        //angular.copy(layerObj, overviewLayerCfgObj);
        overviewLayerCfgObj = layerObj

        //overviewLayerCfgObj.config  = layerObj;
        overviewLayerCfgObj.opacity = layerObj.opacity;

        break;
      }
    }

    // build layer for overview map
    overviewLayerCfgObj.layer = self.buildLayer(overviewLayerCfgObj);
    self.overviewLayer = overviewLayerCfgObj;

    // retrieve user bounding box
    self.getUserExtent(mapCfg, function(mapBboxSRCode)
    {
      // Build object with map projection data and extent
      for(var i=0; i<mapCfg.sr.length; i++)
      {
        // transform bounding box in other SR used
        var mapExtentProj = ol.proj.transformExtent(
          self.mapBbox,
          'EPSG:' + mapBboxSRCode,
          'EPSG:' + mapCfg.sr[i].code
        );

        self.projObj[mapCfg.sr[i].id].mapExtent = mapExtentProj;
      }

      // save mapBbbox in map default SRID
      self.mapBbox = self.projObj[self.mapDefaultSRId].mapExtent;

      // Create view with given EPSG code and add to the map
      self.setMapSR(self.mapDefaultSRId, callback);
    });
  };

  /*
   * Retrieve user bounding box
   * If not found or on error, we use default bbox from configuration
   * Invoked by initMap function
   */
  self.getUserExtent = function(mapCfg, callback)
  {
    var authId = null;

    // check if userInfo object is valorized; otherwise we passed null
    if (rwAuthSvc.userInfo)
    {
      if (rwAuthSvc.userInfo.authority_id)
      {
        authId = rwAuthSvc.userInfo.authority_id;
      }
      else if (rwAuthSvc.userInfo.role &&
               rwAuthSvc.userInfo.role.length > 0 &&
               rwAuthSvc.userInfo.role[0].authority_id)
      {
        authId = rwAuthSvc.userInfo.role[0].authority_id;
      }
    }

    // bounding box variables initialization
    self.mapBbox = mapCfg.default_bbox;

    var mapBboxSR = self.projObj[self.mapDefaultSRId];
    var mapBboxSRCode = mapBboxSR.cfgParams.code;

    // if not authId (application without authentication) we return callback
    // with default values
    if (!authId)
    {
      callback(mapBboxSRCode);
      return;
    }

    // retrieve extent related to given user
    var url = '/gisUtility/getUserExtent?authId='+authId;

    rwHttpSvc.get(url, function(res)
    {
      if (res && res.result)
      {
        self.mapBbox = [
          res.result[0].x_min,
          res.result[0].y_min,
          res.result[0].x_max,
          res.result[0].y_max
        ];

        mapBboxSRCode  = res.result[0].srid;
      }

      // return callback with retrieved values
      callback(mapBboxSRCode);
    });
  }

  /*
   * Layers initialization
   */
  this.initLayers = function(layersCfg)
  {
    // cicle on base layers
    for(var i=0; i<layersCfg.base.length; i++)
    {
      // read base layer configuration
      var baseLayerCfg = layersCfg.base[i];

      self.layersCfgObj[baseLayerCfg.id] = {};

      // valorize object
      self.layersCfgObj[baseLayerCfg.id] = baseLayerCfg

      self.layersCfgObj[baseLayerCfg.id].base      = true;
      self.layersCfgObj[baseLayerCfg.id].visible   = baseLayerCfg._default ? true : false;
      self.layersCfgObj[baseLayerCfg.id].opacity   = baseLayerCfg.opacity;
      self.layersCfgObj[baseLayerCfg.id].layerType = 'SIMPLE_LAYER';

      // create and add base layer to map
      self.addLayer(self.layersCfgObj[baseLayerCfg.id]);

      // set variable to store current base layer id
      if (baseLayerCfg._default)
        self.currBaseLayerId = baseLayerCfg.id;
    }

    // copy array of categories configuration
    self.categoriesTree = angular.copy(layersCfg.categories);

    // cicle on layers categories
    for(var i=0; i<self.categoriesTree.length; i++)
    {
      var catCfg = self.categoriesTree[i];

      // skip empty categories
      if (!catCfg.layers)
        continue;

      // categories are collapsed by default
      catCfg.collapsed = true;

      // read map layers configuration for given category
      readLayersCfg(catCfg);
    }

    // adding serviceMap category into categoriesTree object
    // if serviceMap tool is enabled
    for(var idx=0; idx<wgConfig.map.tools.length; idx++)
    {
      if (wgConfig.map.tools[idx].id == "manageMaps")
        self.categoriesTree.push(self.serviceMapConfig.category);
    }

    // cycle to create layers
    for (var idx=0; idx<self.initLayerIdOrder.length; idx++)
    {
      // read layerId according to the initial order
      var id = self.initLayerIdOrder[idx]

      // get item configuration
      var item = self.layersCfgObj[id];

      // skip base layers (already added to the map)
      if (item.base)
        continue;

      // build hashmap that relate events type with upgradable layers
      if (item.upgradable)
        updateUpgradableLayersObj(item);

      // if layer have a dynamicFilter (depends from logged user) -> we build it
      if (item.dynamic_filter)
      {
        // set runtimeFilter source attribute to empty object
        self.layersCfgObj[item.id].source.runtimeFilter = {};

        var layerName = self.getLayerNameById(item.id);

        // build filter and on callback add it on layer and add layer to the map
        wgFilterBuilderSvc.build({layerName:layerName}, function(res)
        {
          // check if is returned a filter in the response to set it on layer source
          if (res)
          {
            var lyId = self.getLayerIdByName(res.layerName);
            self.layersCfgObj[lyId].source.runtimeFilter = res.filter;

            // adjust visible and selected flag on layers tree
            // This is done only on first level of layers (without parent)
            // because invoked function scroll down layer tree
            if (!self.layersCfgObj[lyId].id_parent)
            {
              var objRet = setVisibilityFlag(lyId);

              self.layersCfgObj[lyId].selected = objRet.selected;
              self.layersCfgObj[lyId].visible  = objRet.visible;
            }

            // if layer hasn't parent and belong to a category
            // we build it and add to map
            if (self.layersCfgObj[lyId].id_category &&
                !self.layersCfgObj[lyId].id_parent)
            {
              self.addLayer(self.layersCfgObj[lyId]);
            }
          }
          else
            console.error("Error on build dynamic filter on layer; layer don't added to the map");
        });
      }
      else
      {
        // adjust visible and selected flag on layers tree
        // This is done only on first level of layers (without parent)
        // because invoked function scroll down layer tree
        if (!item.id_parent)
        {
          var objRet = setVisibilityFlag(id);

          item.selected = objRet.selected;
          item.visible  = objRet.visible;
        }

        // if layer hasn't parent and belong to a category
        // we build it and add to map
        if (item.id_category && !item.id_parent)
          self.addLayer(item);
      }
    }

    /*
     * add service layer
     */

    // layer for search result
    var searchResultLayerCfg = {
      id        : self.layerSearchId,
      layerType : 'SIMPLE_LAYER',
      service   : true,
      type     : 'VECTOR',
      opacity   : 1,
      visible   : false
    };

    // layer for print
    var printLayerCfg = {
      id        : self.layerPrintId,
      layerType : 'SIMPLE_LAYER',
      service   : true,
      type     : 'VECTOR',
      opacity   : 1,
      visible   : true
    };

    // layer for highlight
    var highlightLayerCfg = {
      id        : self.layerOverlayId,
      layerType : 'SIMPLE_LAYER',
      service   : true,
      type     : 'VECTOR',
      opacity   : 1,
      visible   : true
    };

    // add object to configuration
    self.addServiceLayerCfg(searchResultLayerCfg);
    self.addServiceLayerCfg(printLayerCfg);
    self.addServiceLayerCfg(highlightLayerCfg);

    // create and add layer to map
    self.addLayer(self.layersCfgObj[self.layerSearchId]);
    self.addLayer(self.layersCfgObj[self.layerOverlayId]);
    self.addLayer(self.layersCfgObj[self.layerPrintId]);
  }

  /*
   * add a service layer to the map configuration object given its configuration
   */
  self.addServiceLayerCfg = function(layerCfg)
  {
    if (layerCfg.id)
    {
      self.layersCfgObj[layerCfg.id] = layerCfg;
    }
  };

  /*
   * remove a service layer from the map configuration object given its id
   */
  self.removeServiceLayerCfg = function(layerId)
  {
    if (self.layersCfgObj[layerId])
    {
      delete Object.getPrototypeOf(self.layersCfgObj).layerId;
    }
  };

  /*
   * Add a temporary vector layer on map
   * This layer is useful to shows query result
   */
  self.addTemporaryLayer = function(cfgOpt)
  {
    // flag to add layer to the map only once
    var layerAlreadyAdded = false;

    var mapLayersColl = self.map.getLayers();

    // cycle on layers to check temporary layer presence
    mapLayersColl.forEach(function(element, index, array){
      if (element.get('id') == self.layerTemporaryId)
        layerAlreadyAdded = true;
    });

    // exit if layer is already present on the map
    if (layerAlreadyAdded)
    {
      console.error("Error: temporary layer is already added to the map!");
      return;
    }

    // calculate default map extent in current map SR to assign it to
    // temporary layer (necessary to enable reprojection on this layer)
    var defaultEPSGCode = 'EPSG:' + self.projObj[self.mapDefaultSRId].cfgParams.code;
    var currentEPSGCode = 'EPSG:' + self.mapCurrSR.code;

    var mapExtentProj = (defaultEPSGCode == currentEPSGCode) ?
      self.mapBbox :
      ol.proj.transformExtent(
        self.mapBbox,
        defaultEPSGCode,
        currentEPSGCode
      );

//     // NEW
//
//     var sourceCfg = {
//       type:'GEOJSON',
//       projection: currentEPSGCode
//     };
//
//     var temporaryLayerCfg = {
//       id        : self.layerTemporaryId,
//       layer_name: self.layerTemporaryName,
//       layerType : 'SIMPLE_LAYER',
//       service   : true,
//       type      : 'VECTOR',
//       opacity   : 1,
//       visible   : true,
//       extent    : mapExtentProj
//     };
//
//     if (cfgOpt && cfgOpt.style)
//       temporaryLayerCfg.style = cfgOpt.style;
//
//     if (cfgOpt && cfgOpt.cluster)
//     {
//       sourceCfg.cluster = true;
//       temporaryLayerCfg.cluster_style = cfgOpt.cluster_style;
//     }
//
//     temporaryLayerCfg.source = sourceCfg;
//
//     // add temporary layer configuration to the layers configuration object
//     self.addServiceLayerCfg(temporaryLayerCfg);
//
//     self.addLayer(temporaryLayerCfg);
//
//     // NEW

    // temporary layer definition
    // (it is defined a default style for this layer)
    var temporarySource = new ol.source.Vector({
      wrapX: false
    });

    if (cfgOpt && cfgOpt.cluster)
    {
      var geomFun = cfgOpt.geometryFunction ? cfgOpt.geometryFunction : undefined;

      temporarySource = new ol.source.Cluster({
        wrapX: false,
        distance: 20,
        source: temporarySource,
        geometryFunction: geomFun
      });
    }

    var temporaryLayer = new ol.layer.Vector({
      source: temporarySource,
      style: cfgOpt.styleFunction
    });

    // set temporary layer attribute id
    temporaryLayer.set('id', self.layerTemporaryId);

    // set temporary source attribute projection
    temporarySource.set('projection', currentEPSGCode);

    // add temporary layer to the map
    self.map.addLayer(temporaryLayer);

    var sourceCfg = {
      type:'VECTOR',
      projection: currentEPSGCode
    };

    if (cfgOpt && cfgOpt.cluster)
      sourceCfg.cluster = true;

    var temporaryLayerCfg = {
      id        : self.layerTemporaryId,
      layer_name: self.layerTemporaryName,
      layerType : 'SIMPLE_LAYER',
      service   : true,
      type      : 'VECTOR',
      opacity   : 1,
      visible   : true,
      source    : sourceCfg,
      extent    : mapExtentProj,
      layerOL   : temporaryLayer
    };

    // check to add temporary layer into hover layer array to manage possible hover interaction
    if (cfgOpt && cfgOpt.hover)
    {
      temporaryLayerCfg.hover = cfgOpt.hover;

      self.hoverLayerIdArr.push(self.layerTemporaryId);
    }

    // check to add temporary layer into selectable layer array to manage possible click interaction
    if (cfgOpt && cfgOpt.selectable && Object.keys(cfgOpt.selectable).length != 0)
    {
      self.selectableLayerIdArr.push(self.layerTemporaryId);
      temporaryLayerCfg.selectable = cfgOpt.selectable;
      temporaryLayer.set('selectable', true);
    }

    // add temporary layer configuration to the layers configuration object
    self.addServiceLayerCfg(temporaryLayerCfg);
  };

  /*
   * Remove temporary layer from the map
   * (and also from layers configuration object)
   */
  self.removeTemporaryLayer = function()
  {
    var layerCfg = self.layersCfgObj[self.layerTemporaryId];

    self.map.removeLayer(layerCfg.layerOL);

    delete Object.getPrototypeOf(self.layersCfgObj)[self.layerTemporaryId];
  }

  /*
   * Remove all features from temporary layer
   */
  self.removeAllFeaturesFromTemporaryLayer = function()
  {
    var layerCfg = self.layersCfgObj[self.layerTemporaryId];

    var layerSource = layerCfg.layerOL.getSource();

    if (layerSource instanceof ol.source.Cluster)
        layerSource = layerSource.getSource();

    layerSource.clear();
  }

  /*
   * Remove given features from temporary layer
   * Features are specified by their id
   */
  self.removeFeaturesFromTemporaryLayer = function(arrFeaturesId)
  {
    var layerCfg = self.layersCfgObj[self.layerTemporaryId];

    var layerSource = layerCfg.layerOL.getSource();

    if (layerSource instanceof ol.source.Cluster)
      layerSource = layerSource.getSource();

    var feature = null;

    for (var idx=0, len=arrFeaturesId.length; idx<len; idx++)
    {
      feature = layerSource.getFeatureById(arrFeaturesId[idx]);

      layerSource.removeFeature(feature);
    }
  }

  /*
   * Add data to temporary layer
   * dataObj structure:
   *
   * - geoJson : geoJson data (as FeatureCollection)
   * - style   : style to apply to each feature as json {styles:[...]}
   */
  self.addDataOnTemporaryLayer = function(dataObj)
  {
    var featureArr = [];

    if (dataObj.geoJson)
    {
      // get features array
      featureArr = (new ol.format.GeoJSON()).readFeatures(dataObj.geoJson)

      // if defined, build OL style (same for all features)
      if (dataObj.style)
        var style = buildFeatureStyle(dataObj.style.styles);

      // cicle on all features to assign style and eventually reproject
      for (var idx=0, len=featureArr.length; idx<len; idx++)
      {
        // if current map SR is different, we have to tranform geometries
        if ('EPSG:'+self.mapCurrSR.code != dataObj.geoJson.crs.properties.name)
        {
          var geom = featureArr[idx].getGeometry().transform(
            dataObj.geoJson.crs.properties.name,
            'EPSG:' + self.mapCurrSR.code
          );

          featureArr[idx].setGeometry(geom);
        }

        if (style)
          featureArr[idx].setStyle(style);
      }

      var layerCfg = self.layersCfgObj[self.layerTemporaryId];

      var source = (layerCfg.layerOL.getSource() instanceof ol.source.Cluster) ?
        layerCfg.layerOL.getSource().getSource() :
        layerCfg.layerOL.getSource();

      source.addFeatures(featureArr);
    }
  }

  /*
   * Add an edit vector layer on map
   * source attribute is not mandatory
   */
  self.addEditLayer = function(source)
  {
    // flag to add layer to the map only once
    var layerAlreadyAdded = false;

    var mapLayersColl = self.map.getLayers();

    // cycle on layers to check editing layer presence
    mapLayersColl.forEach(function(element, index, array){
      if (element.get('id') == self.layerEditId)
        layerAlreadyAdded = true;
    });

    // if layer is already present on the map we clear and remove it
    // before to proceed with a new edit layer
    if (layerAlreadyAdded)
    {
      console.info("Error: editing layer is already added to the map!");
      self.clearEditLayer();
      self.disableEdit();
      self.removeEditLayer();
      //return;
    }

    // calculate default map extent in current map SR to assign it to
    // editing layer (necessary to enable reprojection on this layer)
    var defaultEPSGCode = 'EPSG:' + self.projObj[self.mapDefaultSRId].cfgParams.code;
    var currentEPSGCode = 'EPSG:' + self.mapCurrSR.code;

    var mapExtentProj = (defaultEPSGCode == currentEPSGCode) ?
      self.mapBbox :
      ol.proj.transformExtent(
        self.mapBbox,
        defaultEPSGCode,
        currentEPSGCode
      );

    // editing layer definition
    // It is defined a default style for this layer
    // source is received or it's created
    var editingSource = source ? source : new ol.source.Vector({
      wrapX: false,
      format: new ol.format.GeoJSON({defaultDataProjection:currentEPSGCode})
    });

    var editingLayer = new ol.layer.Vector({
      source: editingSource,
      style: [
        new ol.style.Style({
          image: new ol.style.Circle({
            fill: new ol.style.Fill({
              color: 'rgba(255,255,255,0.4)'
            }),
            stroke: new ol.style.Stroke({
              color: '#00FFFF',
              width: 1.25
            }),
            radius: 5
          }),
          fill: new ol.style.Fill({
            color: 'rgba(255,255,255,0.4)'
          }),
          stroke: new ol.style.Stroke({
            color: '#00FFFF',
            width: 1.25
          })
        })
      ]
    });

    // set editing layer attribute id
    editingLayer.set('id', self.layerEditId);

    // set editing source attribute projection
    editingSource.set('projection', currentEPSGCode);

    // add editing layer to the map
    self.map.addLayer(editingLayer);

    var editingLayerCfg = {
      id        : self.layerEditId,
      layerType : 'SIMPLE_LAYER',
      service   : true,
      type      : 'VECTOR',
      opacity   : 1,
      visible   : true,
      source    : {type:'VECTOR', projection: currentEPSGCode},
      extent    : mapExtentProj,
      layerOL   : editingLayer
    };

    // add editing layer configuration to the layers configuration object
    self.addServiceLayerCfg(editingLayerCfg);
  }

  /*
   * Add data to edit layer
   * dataObj structure:
   *
   * - geoJson : geoJson data (as FeatureCollection)
   *
   * return extents (xmin,ymin,xmax,ymax) of given geojson
   */
  self.addDataOnEditLayer = function(dataObj)
  {
    var featureArr = [];

    if (dataObj.geoJson)
    {
      // get features array
      featureArr = (new ol.format.GeoJSON()).readFeatures(dataObj.geoJson)

      // cicle on all features to assign style and eventually reproject
      for (var idx=0, len=featureArr.length; idx<len; idx++)
      {
        // if current map SR is different, we have to tranform geometries
        if ('EPSG:'+self.mapCurrSR.code != dataObj.geoJson.crs.properties.name)
        {
          var geom = featureArr[idx].getGeometry().transform(
            dataObj.geoJson.crs.properties.name,
            'EPSG:' + self.mapCurrSR.code
          );

          featureArr[idx].setGeometry(geom);
        }
      }

      var layerCfg = self.layersCfgObj[self.layerEditId];

      layerCfg.layerOL.getSource().addFeatures(featureArr);
    }

  }

  /*
   * Remove editing layer from the map (and related interaction)
   * (and also from layers configuration object)
   */
  self.removeEditLayer = function()
  {
    var layerCfg = self.layersCfgObj[self.layerEditId];

    if (layerCfg)
    {
      self.map.removeLayer(layerCfg.layerOL);

      delete Object.getPrototypeOf(self.layersCfgObj)[self.layerEditId];
    }
  }

  /*
   * Retrieve layerId given its name
   */
  self.getLayerIdByName = function(layerName)
  {
    var layerId = null;
    var name    = null;

    for (var id in self.layersCfgObj)
    {
      // object key is a number and for..in statement returns it as a string
      // for service layer id is a string
      id  = isNaN(id) ? id : id *= 1;

      // retrieve layerName
      if (self.layersCfgObj[id].layer_name)
      {
        name = self.layersCfgObj[id].layer_name;
      }
      else if (self.layersCfgObj[id].source)
      {
        name = self.layersCfgObj[id].source.layer_name;
      }

      if (name == layerName)
      {
        layerId = id;
        break;
      }
    }

    return layerId;
  }

  /*
   * Retrieve layerName given its id
   */
  self.getLayerNameById = function(layerId)
  {
    var layerName = self.layersCfgObj[layerId].layer_name ?
      self.layersCfgObj[layerId].layer_name :
      self.layersCfgObj[layerId].source.layer_name;

     return layerName;
  }

  /*
   * set once singleclick event on map to query layer with given id
   */
  self.setOnceSingleClick = function(layerId, callback)
  {
    var layerCfg = self.layersCfgObj[layerId];

    var layerSource = null;

    // layer is a group item or composed layer item:
    // we need to access to group configuration to retrieve item layer
    if (layerCfg.id_parent)
    {
      var parentCfg = self.layersCfgObj[layerCfg.id_parent];

      if (parentCfg.layerOL instanceof ol.layer.Group)
      {
        var itemsArray = parentCfg.layerOL.getLayers().getArray();

        for (var idx=0, len=itemsArray.length; idx<len; idx++)
        {
          if (itemsArray[idx].get('id') == layerId)
          {
            layerSource = itemsArray[idx].getSource();
          }
        }
      }
      else
      {
        var sourceOpt = parentCfg.source;
        sourceOpt.layer_name = layerCfg.layer_name;

        layerSource = self.buildWMSSource(sourceOpt, false);
      }
    }
    else
    {
      layerSource = layerCfg.layerOL.getSource();
    }

    // change cursor
    var pointerMoveListenerKey = self.map.on('pointermove', function(e)
    {
      self.map.getTarget().style.cursor = 'crosshair';
    });

    // add event listener
    self.map.once('singleclick', function(e)
    {
      e.preventDefault();

      // remove listener for cursor
      ol.Observable.unByKey(pointerMoveListenerKey);

      var url = layerSource.getGetFeatureInfoUrl(
        e.coordinate,
        self.mapView.getResolution(),
        'EPSG:'+self.mapCurrSR.code,
        {'INFO_FORMAT': 'application/json'}
      );

      // if url is an absolute url, we have to proxy it
      if (url.indexOf('http') == 0)
      {
        //url = rwConfigSvc.urlPrefix + "/webgis/proxyRequest/" + url;

        url = rwConfigSvc.urlPrefix + "/utility/proxy?url=" + encodeURIComponent(url);
      }

      // invoke get feature info url
      // (use http instead of rwHttpSvc because url already have urlPrefix)
      $http.get(url).then(function(res)
      {
        if (res && res.data)
        {
          var contentType = res.headers('content-type');

          if (contentType.toUpperCase().indexOf('application/json'.toUpperCase()) >= 0)
          {
            // If there are features, push into getFeatureInfoArray
            if(res.data.features && res.data.features.length)
            {
              var retData = [];

              for (var idx=0, len=res.data.features.length; idx<len; idx++)
                retData.push(res.data.features[idx].properties);

              callback(retData);
            }
          }
          else
          {
            console.error("ERROR: " + res.data);
            callback(null);
          }
        }
      });
    });

  }

  /*
   * refresh (reload) layer with given id
   */
  self.refreshLayer = function(layerId)
  {
    var layerCfg = self.layersCfgObj[layerId];

    var layerSource = null;

    // layer is a group item or composed layer item:
    // we need to access to group configuration to retrieve item layer
    if (layerCfg.id_parent)
    {
      var parentCfg = self.layersCfgObj[layerCfg.id_parent];

      if (parentCfg.layerOL instanceof ol.layer.Group)
      {
        var itemsArray = parentCfg.layerOL.getLayers().getArray();

        for (var idx=0, len=itemsArray.length; idx<len; idx++)
        {
          if (itemsArray[idx].get('id') == layerId)
          {
            layerSource = itemsArray[idx].getSource();
          }
        }
      }
      else
      {
        var sourceOpt = parentCfg.source;
        sourceOpt.layer_name = layerCfg.layer_name;

        layerSource = self.buildWMSSource(sourceOpt, false);
      }
    }
    else
    {
      layerSource = layerCfg.layerOL.getSource();
    }

    if (layerSource)
    {
      layerSource.clear(true);
      layerSource.refresh();
    }
  }

  /*
   * refresh (reload) layer with given name
   */
  self.refreshLayerByName = function(layerName)
  {
    var layerId = self.getLayerIdByName(layerName);

    self.refreshLayer(layerId);
  }

  /*
   * Set selected and visible flag on layers tree
   */
  function setVisibilityFlag(layerId)
  {
    var layerCfg = self.layersCfgObj[layerId];

    // if layer hasn't children -> is a leaf of layers tree -> we return
    if (!layerCfg.children || layerCfg.children.length == 0)
    {
      return {
        visible : layerCfg.visible,
        selected: layerCfg.selected
      };
    }
    else
    {
      var selected = true;
      var visibleArray = [];

      // for layer with children, cycle on them and invoke recursively this function
      for (var idx=0, len=layerCfg.children.length; idx<len; idx++)
      {
        var childId  = layerCfg.children[idx];
        var childCfg = self.layersCfgObj[childId];

        var objRet = setVisibilityFlag(childId);

        childCfg.selected = objRet.selected;
        childCfg.visible  = objRet.visible;

        visibleArray.push(objRet.visible);
        selected = selected && objRet.selected;
      }

      return {
        selected: selected,
        visible : visibleArray.indexOf(true)!= -1
      };
    }
  }

  /*
   * Recursive function to parse layers configuration object
   */
  function readLayersCfg(childObj)
  {
    for(var idx=0; idx<childObj.layers.length; idx++)
    {
      var item = childObj.layers[idx];

      // items into categories are collapsed
      item.collapsed = true;
      item.selected = item.visible ? true : false;

      self.layersCfgObj[item.id] = {};

      // valorize object
      self.layersCfgObj[item.id] = item;

      self.layersCfgObj[item.id].opacity    = item.opacity;
      self.layersCfgObj[item.id].legend     = item.legend;
      self.layersCfgObj[item.id].visible    = item.visible;
      self.layersCfgObj[item.id].selected   = item.visible ? true : false;

      // insert layerId into array that store initial order
      self.initLayerIdOrder.push(item.id);

      // if item has children
      if (item.layers && item.layers.length > 0)
      {
        self.layersCfgObj[item.id].layerType =
          (item.type == 'GROUP') ? 'GROUP' : 'COMPOSED_LAYER';

        self.layersCfgObj[item.id].children = [];

        for (var jdx=0, len=item.layers.length; jdx<len; jdx++)
        {
          self.layersCfgObj[item.id].children.push(item.layers[jdx].id);
        }

        readLayersCfg(item);
      }
      else // layer hasn't children
      {
        // layer hasn't a parent -> is a simple layer
        if (!item.id_parent)
        {
          self.layersCfgObj[item.id].layerType = 'SIMPLE_LAYER';
        }
        // layer has a parent but hasn't children -> is a terminal layer (group member)
        else
        {
          self.layersCfgObj[item.id].layerType =
              item.source ? 'GROUP_ITEM' : 'COMPOSED_LAYER_ITEM';
        }
      }
    }
  }

  /*
   * Add pointer interaction on selectable feature
   */
  this.addPointerInteraction = function()
  {
    var cursorHoverStyle = "pointer";
    var target = self.map.getTarget();

    // target returned might be the DOM element or the ID of this element
    // depending on how the map was initialized
    // either way get a jQuery object for it
    var jTarget = typeof target === "string" ? $("#"+target) : $(target);

    self.map.on("pointermove", function (event)
    {
      var mouseCoordInMapPixels = [
        event.originalEvent.offsetX,
        event.originalEvent.offsetY
      ];

      // detect feature at mouse coords
      // callback function verify if feature belongs to selectable layer
      var hit = self.map.forEachFeatureAtPixel(
        mouseCoordInMapPixels,
        function(feature, layer)
        {
          if (!layer)
            return true;
          else
            return self.selectableLayerIdArr.indexOf(layer.get('id')) >= 0 ? true : false;
        }
      );

      if (hit)
        jTarget.css("cursor", cursorHoverStyle);
      else
        jTarget.css("cursor", "");
    });
  }

  /*
   * Function to manage features hover interaction to change style
   */
  this.addHoverInteraction = function()
  {
    // define function to link at pointerMove event
    var displayTooltip = function(e)
    {
      var pixel = e.pixel;

      var style   = null;
      var layerId = null;
      var feature = null;

      // retrieve feature at mouse position that belongs to a layer with hover enabled
      // is also defined a layer filter function
      feature = self.map.forEachFeatureAtPixel(pixel, function(feature, layer)
      {
        if (layer && self.hoverLayerIdArr.indexOf(layer.get('id')) >= 0)
        {
          layerId = layer.get('id');
        }

        // discriminate between cluster and simple feature
        var size = 1;

        if (layerId && self.layersCfgObj[layerId].source.cluster)
        {
          size = feature.get('features').length;

          if (size == 1)
            feature = feature.get('features')[0];
        }

        return (layerId && size == 1)? feature : null;
      },
      {
        layerFilter:function(layer)
        {
          return self.hoverLayerIdArr.indexOf(layer.get('id')) >=0 ? true : false;
        }
      });

      mapTooltipContainer.style.display = feature ? '' : 'none';

      // reg expr to find parameter into hover text
      // (find everything between [[ and ]]);
      var regExpr = /(\[\[.*?\]\])/g;

      if (feature)
      {
        var parameterizedHover = self.layersCfgObj[layerId].hover;
        var attrsFoundedArray  = null;
        var innerHTMLContent   = parameterizedHover;
        var thereIsLabel       = false;

        // retrieve patterns and replace them with feature attribute values
        while ((attrsFoundedArray = regExpr.exec(parameterizedHover)) !== null)
        {
          // This is necessary to avoid infinite loops with zero-width matches
          if (attrsFoundedArray.index === regExpr.lastIndex)
          {
            regExpr.lastIndex++;
          }

          // remove bracket from the begin and the end to retrieve attribute name
          var attrName = attrsFoundedArray[0].substring(2, attrsFoundedArray[0].length-2);

          // retrieve attribute value
          var attrVal  = feature.getProperties()[attrName] != null ? feature.getProperties()[attrName] : "";

          // control to verify if attribute to show in tooltip are valued
          thereIsLabel = thereIsLabel || (attrVal != '');

          // replacing parameterized attr whit its value
          innerHTMLContent = innerHTMLContent.replace(attrsFoundedArray[0], attrVal);
        }

        // if there isn't label we don't show tooltip on hover
        if (thereIsLabel)
        {
          mapTooltipOverlay.setPosition(e.coordinate);
          mapTooltipContainer.innerHTML = innerHTMLContent;
        }
        else
        {
          mapTooltipOverlay.setPosition(undefined);
        }
      }
    };

    self.map.on('pointermove', displayTooltip);
  }

  /*
   * restore default map single click event management
   */
  self.restoreDefaultMapClickEvent = function()
  {
    self.mapDefaultSingleClickEvtKey = self.map.on('singleclick', singleClickDefaultCallback);
  }

  /*
   * remove default map single click event management
   */
  self.removeDefaultMapClickEvent = function()
  {
    //self.map.un('singleclick', singleClickDefaultCallback);
    ol.Observable.unByKey(self.mapDefaultSingleClickEvtKey);
  }

  /*
   * add custom map single click event management
   */
  self.addCustomMapClickEvent = function(callback)
  {
    self.mapCustomSingleClickEvtKey = self.map.on('singleclick', callback);
  }

  /*
   * remove custom map single click event management
   */
  self.removeCustomMapClickEvent = function(callback)
  {
    ol.Observable.unByKey(self.mapCustomSingleClickEvtKey);
  }

  /*
   * default filter function to apply on single click event
   */
  var layerFilterFunction = function(layer)
  {
    return layer.get('selectable');
  };

  /*
   * default map single click callback
   */
  var singleClickDefaultCallback = function(evt)
  {
    self.map.forEachFeatureAtPixel(
      evt.pixel,
      function(feature, layer)  // callback feature function
      {
        // retrieve layer id
        var layerId = layer.get('id');

        // feature cluster management
        var originalFeaturesArray = feature.get('features');

        if (originalFeaturesArray && originalFeaturesArray.length > 1)
          self.manageClusterPopup(evt, originalFeaturesArray, layerId);
        else
        {
          // manage single feature click

          // retrieve feature (for clustered source, features are always cluster)
          simpleFeature = originalFeaturesArray ? originalFeaturesArray[0] : feature;

          // retrieve, from layers configuration, the feature identifier
          // attribute name and its value
          var featureIdAttrName = self.layersCfgObj[layerId].selectable.feature_id;
          var featureId = simpleFeature.get(featureIdAttrName);

          // retrieve layerName
          var layerName = self.getLayerNameById(layerId);

          var objToSend = {
            layerId: layerName,
            featureId: featureId,
            x: evt.pixel[0] + $("#mapDiv").offset().left,
            y: evt.pixel[1] + $("#mapDiv").offset().top
          };

          // add context data, if exists.
          // Context data can be of 2 types:
          // 1. array with only attributes name
          // 2. array with attribute objects
          // TODO: case 1 is only for compatibility with old implementations
          if (self.layersCfgObj[layerId].selectable.data &&
              self.layersCfgObj[layerId].selectable.data.length > 0)
          {
            objToSend.data = {};

            var len = self.layersCfgObj[layerId].selectable.data.length;

            for (var idx=0; idx<len; idx++)
            {
              var attrName = self.layersCfgObj[layerId].selectable.data[idx];
              objToSend.data[attrName] = simpleFeature.get(attrName);
            }
          }
          else if (self.layersCfgObj[layerId].selectable.complex_data &&
                    self.layersCfgObj[layerId].selectable.complex_data.length > 0)
          {
            objToSend.data = {
              fields: []
            };

            var len = self.layersCfgObj[layerId].selectable.complex_data.length;

            for (var idx=0; idx<len; idx++)
            {
              var attrObj = self.layersCfgObj[layerId].selectable.complex_data[idx];

              objToSend.data.fields[idx] = {
                "key" : attrObj.label,
                "val" : simpleFeature.get(attrObj.key),
                "type": attrObj.type,
                "attr": attrObj.key
              };
            }
          }

          // TODO verify if use broadcast or emit and scope or rootScope
          $rootScope.$broadcast("featureClick", objToSend);
        }

        // stop detection at first feature founded
        return true;
      },
      {layerFilter:layerFilterFunction, hitTolerance:2}
    );
  };


  /*
   * Function to manage feature click event
   */
  this.addMapClickEvent = function()
  {
    // Layer filter function
    // Only layers which are visible and for which this function returns true
    // will be tested for features
    var layerFilterFunction = function(layer)
    {
      return layer.get('selectable');
    };

    // add click event on map
    self.mapDefaultSingleClickEvtKey = self.map.on("singleclick", singleClickDefaultCallback);
  }

  /*
   *
   */
  this.manageClusterPopup = function(evt, ftArray, layerId)
  {
    var coordinate = evt.coordinate;

    // retrieve, from layers configuration, the attribute names of the
    // feature identifier and the feature attribute to show on cluster popup
    var featureIdAttrName   = self.layersCfgObj[layerId].selectable.feature_id;
    var featureListAttrName = self.layersCfgObj[layerId].selectable.cluster_attribute;

    // retrieve layer style
    var style = self.layersCfgObj[layerId].style;

    // retrieve layerName
    var layerName = self.getLayerNameById(layerId);

    // clear content div
    mapPopupContent.innerHTML = "";

    for (var idx=0, len=ftArray.length; idx<len; idx++)
    {
      var ft = ftArray[idx];

      var objToSend = {
        layerId: layerName,
        featureId: ft.get(featureIdAttrName),
        x: evt.pixel[0] + $("#mapDiv").offset().left,
        y: evt.pixel[1] + $("#mapDiv").offset().top
      };

      _createFeatureDiv(objToSend, ft, featureListAttrName, style, layerId);
    }

    // positioning popup
    mapPopupOverlay.setPosition(coordinate);
  }

  /*
   * Function to create content related to a single feature into cluster
   */
  function _createFeatureDiv(obj, ft, featureListAttrName, styleObj, layerId)
  {
    var icon = null;

    // retrieve image to associate to feature
    if (styleObj)
      icon = _getIcon(ft, styleObj);

    var rowDiv = document.createElement("div");
    rowDiv.className = "row no-margin cursorPointer custom-list-group-item";

    var txtDiv = document.createElement("div");
    txtDiv.innerHTML = ft.get(featureListAttrName);

    if (icon)
    {
      var image = document.createElement("img");
      image.setAttribute('src', rwConfigSvc.urlPrefix+icon);
      image.setAttribute('height', '24px');
      image.setAttribute('width', '24px');

      var iconDiv = document.createElement("div");
      iconDiv.className = 'col-lg-3 col-md-3 col-sm-3 col-xs-3';
      iconDiv.appendChild(image);
      rowDiv.appendChild(iconDiv);

      txtDiv.className  = 'col-lg-9 col-md-9 col-sm-9 col-xs-9';
    }
    else
      txtDiv.className = 'col-lg-12 col-md-12 col-sm-12 col-xs-12';

    rowDiv.appendChild(txtDiv);

    // add context data, if exists.
    // Context data can be of 2 types:
    // 1. array with only attributes name
    // 2. array with attribute objects
    // TODO: case 1 is only for compatibility with old implementations
    if (self.layersCfgObj[layerId].selectable.data &&
        self.layersCfgObj[layerId].selectable.data.length > 0)
    {
      obj.data = {};

      var len = self.layersCfgObj[layerId].selectable.data.length;

      for (var idx=0; idx<len; idx++)
      {
        var attrName = self.layersCfgObj[layerId].selectable.data[idx];
        obj.data[attrName] = ft.get(attrName);
      }
    }
    else if (self.layersCfgObj[layerId].selectable.complex_data &&
              self.layersCfgObj[layerId].selectable.complex_data.length > 0)
    {
      obj.data = {
        fields: []
      };

      var len = self.layersCfgObj[layerId].selectable.complex_data.length;

      for (var idx=0; idx<len; idx++)
      {
        var attrObj = self.layersCfgObj[layerId].selectable.complex_data[idx];

        obj.data.fields[idx] = {
          "key" : attrObj.label,
          "val" : ft.get(attrObj.key),
          "type": attrObj.type
        };
      }
    }

    rowDiv.addEventListener('click', function (event) {
      // set popup origin to mouse click position
      obj.x = event.x;
      obj.y = event.y;

      $rootScope.$broadcast('featureClick', obj);
    });

    mapPopupContent.appendChild(rowDiv);
  }

  /*
   * Function to retrieve icon to associate to the feature into cluster popup
   * IMPORTANT: this method return an image only if style related to the given
   *            feature contains an image; in the others case return null
   */
  function _getIcon(feature, styleObj)
  {
    var srcImage = null;

    if (styleObj.styles &&
        styleObj.styles.default &&
        styleObj.styles.default.length > 0)
    {
      // in this case style doesn't have classes; we cycle into default style
      // array to verify if there is a style with an image
      for (var idx=0; idx<styleObj.styles.default.length; idx++)
      {
        var styleItem = styleObj.styles.default[idx];

        if (styleItem.src)
        {
          srcImage = styleItem.src;
          break;
        }
      }
    }
    else if (styleObj.classes)
    {
      // in this case style have classes: we have to cycle on classes
      // and verify if class condition is satisfied from feature properties;
      var styleClassItemsArray = null;

      for (var idx=0; idx<styleObj.classes.length; idx++)
      {
        var styleClass = styleObj.classes[idx];

        if (styleClass.styles &&
            styleClass.styles.default &&
            styleClass.styles.default.length > 0)
        {
          // transform old condition object (single condition)
          // into a conditions array with a single item
          if (!styleClass.conditions && styleClass.condition)
          {
            styleClass.conditions = [styleClass.condition];
          }

          // if array conditions has a single item, we force op to AND
          // in such a way that the check after for cycle working
          var op = styleClass.conditions.length > 1 ? styleClass.op : "AND";

          // support variable for exit to cycle on error
          var exit = false;

          // count verified condition
          var verifiedCond = 0;

          // cycle to find the condition verified by the given feature
          for (var jdx=0; jdx<styleClass.conditions.length; jdx++)
          {
            var itemProp = styleClass.conditions[jdx];

            var propertyName  = itemProp.property_name;
            var propertyValue = itemProp.property_val;
            var operator      = itemProp.operator;

            var ftPropVal = feature.getProperties()[propertyName];

            switch(operator)
            {
              case "EQ":
                if (ftPropVal == propertyValue)
                  verifiedCond++;

                break;

              case "NEQ":
                if (ftPropVal != propertyValue)
                  verifiedCond++;

                break;

              case "LIKE":
                // indexOf is case sensitive
                if (ftPropVal.indexOf(propertyValue)!= -1)
                  verifiedCond++;

                break;

              case "ILIKE":
                if ((ftPropVal.toLowerCase()).indexOf(propertyValue.toLowerCase())!= -1)
                  verifiedCond++;

                break;

              default:
                exit = true;
                console.error('Operator ' + styleClassCond.operator +
                  ' not managed into _getIcon function!');
            }

            if (exit)
            {
              styleCfg = null;
              break;
            }
          }

          if (op == "AND" && verifiedCond == styleClass.conditions.length)
          {
            // on AND all conditions must be verified
            styleClassItemsArray = styleClass.styles.default;
          }
          else if (op == "OR" && verifiedCond > 0)
          {
            // on OR at least one condition must be verified
            styleClassItemsArray = styleClass.styles.default;
          }

          // we exit from classes loop
          // because we have founded the class for this feature
          if (styleClassItemsArray != null)
            break;
        }
      }

      // into default style array we search for style with an image
      for (var idx=0; idx<styleClassItemsArray.length; idx++)
      {
        var styleClassItem = styleClassItemsArray[idx];

        if (styleClassItem.src)
        {
          srcImage = styleClassItem.src;
          break;
        }
      }
    }

    return srcImage;
  }

  /*
   * Function that given a configuration layer object
   * store in upgradableLayers object the events that upgrade that layer
   */
  function updateUpgradableLayersObj(layerCfg)
  {
    for (var idx=0; idx<layerCfg.upgradable.length; idx++)
    {
      if (!upgradableLayers[layerCfg.upgradable[idx]])
        upgradableLayers[layerCfg.upgradable[idx]] = [];

      upgradableLayers[layerCfg.upgradable[idx]].push(layerCfg.id);
    }
  }

  /*
   * Return the map object
   */
  self.getMap = function()
  {
    return self.map;
  };

  self.getScales = function()
  {
    return wgConfig.map.scales;
  }

  self.getMapserverUrl = function()
  {
    return wgConfig.map.mapserver_url;
  }


  /*
   * Calculate resolutions array for given map scales and given map SR
   */
  self.setResolutions = function(epsgId)
  {
    // check if EPSG id is among those in the map
    if (!self.projObj[epsgId])
    {
      console.error("The EPSG id " + epsgId + " is not available!");
      return;
    }

    var epsgCode = self.projObj[epsgId].cfgParams.code;

    // empties resolutions array
    self.resolutions.length = 0;

    // meters per unit for the given SR
    var MPU = ol.proj.METERS_PER_UNIT[ol.proj.get('EPSG:'+epsgCode).getUnits()];

    // calculate resolutions for each scale level
    for (var i=0; i<wgConfig.map.scales.length; i++)
    {
      self.resolutions.push(wgConfig.map.scales[i] / (MPU * _screenDPI * _IPM));
    }
  };


  /*
   * Change the map SR receiving the new SR EPSG id
   * This necessitates the creation of new map view
   */
  self.setMapSR = function(epsgId, callback)
  {
    // check if EPSG code is among those in the map
    var newSR = self.projObj[epsgId];

    if (!newSR)
    {
      console.error("The EPSG id " + epsgId + " is not available!");

      if (callback)
        callback();

      return;
    }

    // retrieve EPSG code
    var epsgCode = newSR.cfgParams.code;

    // retrieve actual extent and zoom before to change map resolutions
    var actualZoomLevel = self.map.getView().getZoom();

    // Define resolutions array for new map SR
    self.setResolutions(epsgId);

    var optionView = {};

    // initialize view options
    // in the first case (if branch) view already exists
    // in the else branch we are at first system access
    if (self.mapView)
    {
      var actualExtentOldSR = self.map.getView().calculateExtent(self.map.getSize());

      var actualExtentNewSR = ol.proj.transformExtent(actualExtentOldSR,
        'EPSG:'+self.mapCurrSR.code, 'EPSG:'+epsgCode);

      optionView.extent = newSR.mapExtent;
      optionView.center = ol.extent.getCenter(actualExtentNewSR || [0, 0, 0, 0]);
      optionView.zoom = actualZoomLevel;
    }
    else
    {
      // set map extent and center
      optionView.extent = self.mapBbox;

      optionView.center = [
        (self.mapBbox[0] + self.mapBbox[2])/2,
        (self.mapBbox[1] + self.mapBbox[3])/2
      ];

      /*
       * retrieve current scale value from current resolution value
       */

      var MPU = ol.proj.METERS_PER_UNIT[ol.proj.get('EPSG:'+epsgCode).getUnits()];

      // convert extent width and height in pixel
      var extPxW = (self.mapBbox[2] - self.mapBbox[0]) * (MPU * _screenDPI * _IPM);
      var extPxH = (self.mapBbox[3] - self.mapBbox[1]) * (MPU * _screenDPI * _IPM);

      // retrieve max scale between  width and height scales
      var scaleW = extPxW / $("#mapDiv").width();
      var scaleH = extPxH / $("#mapDiv").height();

      var scale = Math.max(scaleW, scaleH);

      // retrieve minimum map scale that is greather than current scale
      var initScaleIdx = null;

      for (var idx=0; idx<wgConfig.map.scales.length; idx++)
      {
        if (wgConfig.map.scales[idx] > scale)
          initScaleIdx = idx;
      }

      initScaleIdx = initScaleIdx ? initScaleIdx : 0;

      // set scale and resolution in according to founded value
      self.currScale = Math.round(
        self.resolutions[initScaleIdx] * (MPU * _screenDPI * _IPM)
      );

      optionView.resolution = self.resolutions[initScaleIdx];

      // remove scale and resolution greather than initScaleIdx
      wgConfig.map.scales.splice(0, initScaleIdx);
      self.resolutions.splice(0, initScaleIdx);
    }

    optionView.projection  = 'EPSG:' + epsgCode;
    optionView.resolutions = self.resolutions;

    // create new map view
    self.mapView = new ol.View(optionView);

    // change the map view
    self.map.setView(self.mapView);

    // change extent to zoomToExtent control
    self.map.getControls().forEach(
      function (control)
      {
        if(control instanceof ZoomToExtControl)
        {
          var mapSR = self.projObj[self.mapDefaultSRId];

          var bboxProj = ol.proj.transformExtent(self.mapBbox,
            'EPSG:'+mapSR.cfgParams.code, 'EPSG:'+epsgCode);

          control.setExtent(bboxProj);
        }
      }
    );

    // Listen on change resolution event to update scale value.
    // This code is here because we have generated a new OL view
    self.map.getView().on('change:resolution', function(e)
    {
      var MPU = ol.proj.METERS_PER_UNIT[ol.proj.get('EPSG:'+epsgCode).getUnits()];

      // retrieve current scale value from current resolution value
      self.currScale = Math.round(
        e.target.get(e.key) * (MPU * _screenDPI * _IPM)
      );

      // TODO We have to use $applyAsync to broadcast event
      //      otherwise binding doesn't work;
      //      also setTimeout doesn't work
      $rootScope.$applyAsync(function(){
        $rootScope.$broadcast("changeResolution", self.currScale);
      });
    });

    // set new map SR variable
    self.mapCurrSR = self.projObj[epsgId].cfgParams;

    // adjust layer extent and reproject vector layers
    $.each(self.layersCfgObj, function(layerId, layerCfg)
    {
      // if layer have extent and a source
      if (layerCfg.extent && layerCfg.source)
      {
        var layerProj = layerCfg.source.projection;

        // layer is a group item:
        // we need to access to group configuration to retrieve item layer
        if (layerCfg.id_parent)
        {
          var parentCfg = self.layersCfgObj[layerCfg.id_parent];

          var itemsArray = parentCfg.layerOL.getLayers().getArray();

          for (var idx=0, len=itemsArray.length; idx<len; idx++)
          {
            if (itemsArray[idx].get('id') == layerId)
            {
              layerOL = itemsArray[idx];
            }
          }
        }
        else
          layerOL = layerCfg.layerOL;

        // set layer extent (before, if necessary, convert them)
        if (layerProj != 'EPSG:'+self.mapCurrSR.code)
        {
          layerOL.setExtent(ol.proj.transformExtent(
            layerCfg.extent,
            layerProj,
            'EPSG:' + self.mapCurrSR.code
          ));
        }
        else
          layerOL.setExtent(layerCfg.extent);
      }

      // cicle on all vector layer
      // (we have to convert also hidden layers because if they are turned on
      //  after a reference system change, they are not visible)
      // layerCfg.source condition is to avoid to call function on member of
      // vector composed layer
      if (layerCfg.type == 'VECTOR' && layerCfg.source)
      {
        self.vectorLayerReproject(layerId, 'EPSG:'+epsgCode);
      }
    });

    if (callback)
      callback();
  };

  /*
   * custom implementation of ol.CoordinateFormatType() function
   * format the coords to show in mousePosition control according to the map SR
   */
  self.customCoordFormat = function()
  {
    return (
      function(coordinate)
      {
        var strCoord = '';

        switch(self.mapCurrSR.name)
        {
          case 'WEBGIS.SR_4326_NAME_DMS':
            strCoord =
              $translate.instant(self.mapCurrSR.prefix) + '  ' +
              self.mapCurrSR.x_prefix + ': ' + self.fromDDToDMS(coordinate[0]) +
              ', ' +
              self.mapCurrSR.y_prefix + ': ' + self.fromDDToDMS(coordinate[1]);

            break;

          case 'WEBGIS.SR_MGRS_NAME':
            strCoord =
              $translate.instant(self.mapCurrSR.prefix) + ':  ' +
              LLtoUSNG(coordinate[1], coordinate[0], 5);
            break;

          default:
            strCoord = ol.coordinate.format(
              coordinate,
              $translate.instant(self.mapCurrSR.prefix) + '  ' +
              self.mapCurrSR.x_prefix + ': {x}, ' +
              self.mapCurrSR.y_prefix + ': {y}',
              self.getCoordNumDec(self.mapCurrSR.units)
            );
        }

        return strCoord;
      }
    );
  }

  /*
   * Convert decimal degrees DD.XXXXXXX into DMS string DD° MM' SS.S"
   */
  self.fromDDToDMS = function(decDegree)
  {
    var normalizedDegrees = ((decDegree + 180) % 360) < 0 ?
      ((decDegree + 180) % 360)  :
      ((decDegree + 180) % 360) - 180;

    var x = Math.abs(3600 * normalizedDegrees);
    var precision = Math.pow(10, 1);

    var deg = Math.floor(x / 3600);
    var min = Math.floor((x - deg * 3600) / 60);
    var sec = x - (deg * 3600) - (min * 60);

    sec = Math.ceil(sec * precision) / precision;

    if (sec >= 60) {
      sec = 0;
      min += 1;
    }

    if (min >= 60) {
      min = 0;
      deg += 1;
    }

    return deg + '\u00b0 ' + padNumber(min, 2) + '\u2032 ' +
      padNumber(sec, 2, 1) + '\u2033';
  }

  /*
   * Convert DMS string DD° MM' SS.S" into decimal degrees DD.XXXXXXX
   */
  self.fromDMSToDD = function(dmsDegree)
  {
    var parts = dmsDegree.split(' ');

    var degrees = parts[0].slice(0, -1);
    var minutes = parts[1].slice(0, -1);
    var seconds = parts[2].slice(0, -1);

    var dd = Number(degrees) + Number(minutes)/60 + Number(seconds)/(60*60);

    // Truncate to 6 decimal's digits
    if(dd != null)
    {
      var truncateDD = dd.toFixed(self.getCoordNumDec("degrees"));
      dd = truncateDD*1;
    }

    return dd;
  }

  /*
   * Format number with padding
   */
  function padNumber(number, width, opt_precision)
  {
    var numberString = opt_precision !== undefined ?
      number.toFixed(opt_precision) : '' + number;

    var decimal = numberString.indexOf('.');
    decimal = decimal === -1 ? numberString.length : decimal;

    return decimal > width ?
      numberString : new Array(1 + width - decimal).join('0') + numberString;
  };

  /*
   * Retrieve the decimal number places to show
   */
  self.getCoordNumDec = function(coordsUnits)
  {
    var numDec = 2;

    switch(coordsUnits)
    {
      case "m":
      case "ft":
        numDec = 2;
        break;

      case "degrees":
        numDec = 6;
        break;
    }

    return numDec;
  };


  /*
   * Build layer and add it onto map into given category and group
   * groupId and catId aren't mandatory params
   */
  self.addLayer = function(layerCfg)
  {
    var layerOL = self.buildLayer(layerCfg);

    if (! $.isEmptyObject(layerOL))
    {
      layerCfg.layerOL = layerOL;

      // if layer is a ol.layer.Group we have to associate
      // the pertinent openlayer object to every group item
      if (layerOL instanceof ol.layer.Group)
      {
        associatelayer2GroupMember(layerOL);
      }

      // set resolutions and property disabled for layer
      self.setResolutionLayer(layerCfg)

      // add layer to map
      self.map.addLayer(layerOL);
    }
  };


  /*
   * Recursive function to associate OL layer object
   * to every group item configuration object
   */
  function associatelayer2GroupMember(layerOL)
  {
    // retrieve item of ol.layer.Group
    var itemsArray = layerOL.getLayers().getArray();

    for (var idx=0, len = itemsArray.length; idx<len; idx++)
    {
      var item = itemsArray[idx];

      self.layersCfgObj[item.get('id')].layerOL = item;

      // if item is a ol.layer.Group -> invoke recursively this function
      if (item instanceof ol.layer.Group)
      {
        associatelayer2GroupMember(item);
      }
    }
  }

  /*
   * Get OL layer from configuration object
   */
  self.buildLayer = function(layerCfg)
  {
    var layer  = null;
    var source = null;

    // build OL layer object
    switch(layerCfg.type)
    {
      case "GROUP":
        // in this case source is created for each group item
        layer = self.buildGroupLayer(layerCfg);
        break;

      case "IMAGE":
        layer  = self.buildImageLayer(layerCfg);
        source = self.buildSource(layerCfg);
        break;

      case "VECTOR":
        layer  = self.buildVectorLayer(layerCfg);
        source = self.buildSource(layerCfg);

        // build and apply to layer possible postCompose styles
        buildPostComposeStyle(layer, layerCfg);
        break;

      default:
        console.error("Layer Type " + layerCfg.type + " not managed yet!");
    }

    // set useful custom attributes
    if (layer)
    {
      layer.set('id', layerCfg.id);

      setCustomAttribute(layer, layerCfg);
    }

    // set source (if defined) to layer (source is not defined for group layers)
    if (source)
      layer.setSource(source);

    return layer;
  };

  /*
   * Setting OL layer object custom attributes
   */
  function setCustomAttribute(layer, layerCfg)
  {
    if (layerCfg.layerType == 'COMPOSED_LAYER')
    {
      if (layerCfg.type == 'IMAGE')
      {
        //layer.set('queryable', false);

        for (var idx=0; idx<layerCfg.layers.length; idx++)
        {
          var item = layerCfg.layers[idx];

          if (item.queryable && Object.keys(item.queryable).length != 0)
          {
            self.queryableLayerArr.push(
              {
                layerId : item.id,
                obj     : item.queryable
              }
            );
          }
        }
      }
      else // VECTOR
      {
        if (layerCfg.hover)
          self.hoverLayerIdArr.push(layerCfg.id);

        if (layerCfg.selectable && Object.keys(layerCfg.selectable).length != 0)
        {
          self.selectableLayerIdArr.push(layerCfg.id);
          layer.set('selectable', true);
        }

        if (layerCfg.editable)
        {
          self.editableLayerIdArr.push(layerCfg.id);
          layer.set('editable', true);
        }
      }
    }
    else if (layerCfg.layerType == 'SIMPLE_LAYER' ||
             layerCfg.layerType == 'GROUP_ITEM')
    {
      if (layerCfg.hover)
          self.hoverLayerIdArr.push(layerCfg.id);

      if (layerCfg.queryable && Object.keys(layerCfg.queryable).length != 0)
          self.queryableLayerArr.push(
            {
              layerId :layerCfg.id,
              obj     : layerCfg.queryable
            }
          );

      if (layerCfg.selectable && Object.keys(layerCfg.selectable).length != 0)
      {
        self.selectableLayerIdArr.push(layerCfg.id);
        layer.set('selectable', true);
      }

      if (layerCfg.editable)
      {
        self.editableLayerIdArr.push(layerCfg.id);
        layer.set('editable', true);
      }
    }
  }

  /*
   * Build a Group layer
   */
  self.buildGroupLayer = function(layerCfg)
  {
    var layer = null;
    var layerOptions = {};

    if (layerCfg.visible != undefined)
      layerOptions.visible = layerCfg.visible;

    if (layerCfg.opacity != undefined)
      layerOptions.opacity = layerCfg.opacity;

    if (layerCfg.extent)
    {
      var layerProj = layerCfg.source.projection;

      // convert layer extent (if necessary)
      if (layerProj != 'EPSG:'+self.mapCurrSR.code)
      {
        layerOptions.extent = ol.proj.transformExtent(
          layerCfg.extent,
          layerProj,
          'EPSG:' + self.mapCurrSR.code
        );
      }
      else
        layerOptions.extent = layerCfg.extent;
    }

    layerOptions.layers = [];

    // verify children presence to build them
    if (layerCfg.children && layerCfg.children.length > 0)
    {
      // cicle on group to build layer for each item
      for (var idx=0, len = layerCfg.children.length; idx<len; idx++)
      {
        var subLayerCfg = self.layersCfgObj[layerCfg.children[idx]];

        subLayer = self.buildLayer(subLayerCfg);

        if (subLayer)
          layerOptions.layers.push(subLayer);
      }
    }

    layer = new ol.layer.Group(layerOptions);

    return layer;
  }

  /*
   * Build an Image layer
   */
  self.buildImageLayer = function(layerCfg)
  {
    var layer = null;
    var layerOptions = {};

    if (layerCfg.visible != undefined)
      layerOptions.visible = layerCfg.visible;

    if (layerCfg.opacity != undefined)
      layerOptions.opacity = layerCfg.opacity;

//     if (layerCfg.extent)
//       layerOptions.extent = layerCfg.extent;

    if (layerCfg.extent)
    {
      var layerProj = layerCfg.source.projection;

      // convert layer extent (if necessary)
      if (layerProj != 'EPSG:'+self.mapCurrSR.code)
      {
        layerOptions.extent = ol.proj.transformExtent(
          layerCfg.extent,
          layerProj,
          'EPSG:' + self.mapCurrSR.code
        );
      }
      else
        layerOptions.extent = layerCfg.extent;
    }

    if (layerCfg.tiled)
    {
      layer = new ol.layer.Tile(layerOptions);
    }
    else
    {
      layer = new ol.layer.Image(layerOptions);
    }

    return layer;
  }

  /*
   * Build a Vector layer
   */
  self.buildVectorLayer = function(layerCfg)
  {
    var layer        = null;
    var layerOptions = {};

    // configure options
    if (layerCfg.visible != undefined)
      layerOptions.visible = layerCfg.visible;

    if (layerCfg.opacity != undefined)
      layerOptions.opacity = layerCfg.opacity;

    if (layerCfg.extent)
    {
      var layerProj = layerCfg.source.projection;

      // convert layer extent (if necessary)
      if (layerProj != 'EPSG:'+self.mapCurrSR.code)
      {
        layerOptions.extent = ol.proj.transformExtent(
          layerCfg.extent,
          layerProj,
          'EPSG:' + self.mapCurrSR.code
        );
      }
      else
        layerOptions.extent = layerCfg.extent;
    }

    // retrieve style type (could be 'FIXED', 'PROPERTY' and 'STYLE')
    //
    // FIXED    : single style for all features in the layer
    //            style related to layer
    // PROPERTY : styles depends from condition classes
    //            we cached them
    // STYLE    : style depends from feature, but we don't have condition classes
    //            we cached them
    var styleType = null;

    // layer with children
    if (layerCfg.children)
    {
      // style is defined on parent
      if (layerCfg.style)
      {
        if (layerCfg.style.classes)
          styleType = 'PROPERTY';
        else
          styleType = layerCfg.cluster_style ? 'STYLE' : 'FIXED';
      }
      else // style is defined on children
      {
        styleType = 'PROPERTY';
      }
    }
    else // layer without children
    {
      // this if is necessary to avoid to load system layers
      if (layerCfg.style)
      {
        if (layerCfg.style.classes)
          styleType = 'PROPERTY';
        else if (layerCfg.style.styles.default_key)
          styleType = 'STYLE';
        else
          styleType = layerCfg.cluster_style ? 'STYLE' : 'FIXED';
      }
    }

    // Store styleType variable into layer configuration object
    layerCfg.styleType = styleType;

    var styleCfgObj = null;

    if (styleType == "FIXED")
    {
      // in this case, the style is unique for all features of the layer
      // style is builded now and is associated to layer (no need style function)
      // IMPORTANT: style FIXED may not have cluster!!

      styleCfgObj = {style: layerCfg.style.styles};

      var style = self.buildStyle(styleCfgObj.style, null, null, null);

      layerOptions.style = style;
    }
    else
    {
      // in this case the style depends on the feature -> we have to cache them

      if (styleType == "STYLE")
      {
        styleCfgObj = {style: layerCfg.style};
      }
      else if (styleType == "PROPERTY")
      {
        // if layer have children, style can be defined on them or on parent
        if (layerCfg.children && !layerCfg.style)
        {
          styleCfgObj = {style: {classes: []}};

          for (var idx=0, len=layerCfg.children.length; idx<len; idx++)
          {
            styleCfgObj.style.classes[idx] = {
              condition: layerCfg.layers[idx].filter,
              styles: layerCfg.layers[idx].style.styles ?
                layerCfg.layers[idx].style.styles :
                layerCfg.layers[idx].style
            };
          }
        }
        else
        {
          styleCfgObj = {style: layerCfg.style};
        }
      }

      // if source have cluster properties, we save also cluster style conf
      if (layerCfg.source && layerCfg.source.cluster)
        styleCfgObj.clusterStyle = layerCfg.cluster_style;

      /*
       * styleChache variable contains OL styles.
       * if style for a feature was already builded, it is retrieved from styleCache
       */
      layerCfg.styleCache = {};

      var styleFunction = function(feature, resolution)
      {
        if (!layerCfg.source)
          return null;

        var styleCfg = null;

        // variable to discriminate between cluster and simple feature
        var size = (layerCfg.source.cluster) ? feature.get('features').length : 1;

        // single feature
        if (size == 1)
        {
          // if source is a cluster, also single features are returned
          // with cluster structure
          // in this case we extract the inner feature
          // to pass them to buildStyle method
          var simpleFeature = (layerCfg.source.cluster) ? feature.get('features')[0] : feature;

          /*
           * if style type is 'PROPERTY'
           * we build/retrieve from cache, for each class,
           * the corresponding style in according  with condition
           */
          if (styleType == "PROPERTY")
          {
            var classes = styleCfgObj.style.classes;

            // retrieve properties of the feature
            var featureProperties = simpleFeature.getProperties();

            for (var idx=0, len=classes.length; idx<len; idx++)
            {
              var property = classes[idx];

              // transform old condition object (single condition)
              // into a conditions array with a single item
              if (!property.conditions && property.condition)
              {
                property.conditions = [property.condition];
              }

              // if array conditions has a single item, we force op to AND
              // in such a way that the check after for cycle working
              var op = property.conditions.length > 1 ? property.op : "AND";

              // support variable for exit to cycle on error
              var exit = false;

              // count verified condition
              var verifiedCond = 0;

              // cycle to find the condition verified by the given feature
              for (var jdx=0; jdx<property.conditions.length; jdx++)
              {
                var itemProp = property.conditions[jdx];

                var propertyName  = itemProp.property_name;
                var propertyValue = itemProp.property_val;
                var operator      = itemProp.operator;

                // check single condition item
                switch(operator)
                {
                  case "EQ":
                    if (featureProperties[propertyName] == propertyValue)
                      verifiedCond++;
                    break;

                  case "NEQ":
                    if (featureProperties[propertyName] != propertyValue)
                      verifiedCond++;
                    break;

                  case "LIKE":
                    var featureValue = featureProperties[propertyName];

                    // indexOf is case sensitive
                    if (featureValue.indexOf(propertyValue)!= -1)
                      verifiedCond++;
                    break;

                  case "ILIKE":
                    var featureValue = featureProperties[propertyName].toLowerCase();

                    if (featureValue.indexOf(propertyValue.toLowerCase())!= -1)
                      verifiedCond++;
                    break;

                  case "LT":
                    if (featureProperties[propertyName] < propertyValue)
                      verifiedCond++;
                    break;

                  case "LTE":
                    if (featureProperties[propertyName] <= propertyValue)
                      verifiedCond++;
                    break;

                  case "GT":
                    if (featureProperties[propertyName] > propertyValue)
                      verifiedCond++;
                    break;

                  case "GTE":
                    if (featureProperties[propertyName] >= propertyValue)
                      verifiedCond++;
                    break;

                  case "BETWEEN":
                    // in this case propertyValue is an array with two elements
                    if (featureProperties[propertyName] >= propertyValue[0] &&
                        featureProperties[propertyName] <= propertyValue[1])
                      verifiedCond++;
                    break;

                  case "NOT_IN":
                    // in this case propertyValue is an array
                    if (propertyValue.indexOf(featureProperties[propertyName]) < 0)
                      verifiedCond++;
                    break;

                  case "IS_NULL":
                    if (featureProperties[propertyName] == null)
                      verifiedCond++;
                    break;

                  case "IS_NOT_NULL":
                    if (featureProperties[propertyName] != null)
                      verifiedCond++;
                    break;

                  default:
                    exit = true;
                    console.error("The operator "+ operator +
                      " is not managed yet into styles building!");
                }

                if (exit)
                {
                  styleCfg = null;
                  break;
                }
              }

              if (op == "AND" && verifiedCond == property.conditions.length)
              {
                // on AND all conditions must be verified
                styleCfg = property.styles;
              }
              else if (op == "OR" && verifiedCond > 0)
              {
                // on OR at least one condition must be verified
                styleCfg = property.styles;
              }

              // we exit from classes loop
              // because we have founded the class for this feature
              if (styleCfg != null)
                break;
            }

            // control error TODO manage error
            if (styleCfg == null)
            {
              console.error("Feature " + feature.getId() +
                " not soddisfy any style property class");

              return null;
            }

            return self.buildStyle(styleCfg, layerCfg.styleCache, simpleFeature, resolution);
          }
          else // type style is 'STYLE'
          {
            styleCfg = (size > 1) ? styleCfgObj.clusterStyle : styleCfgObj.style;

            return self.buildStyle(styleCfg.styles, layerCfg.styleCache, simpleFeature, resolution);
          }
        }
        else
        {
          // in this case we have a cluster -> cluster style is unique for the layer
          styleCfg = styleCfgObj.clusterStyle;

          return self.buildStyle(styleCfg.styles, layerCfg.styleCache, feature, resolution);
        }
      }

      // set function to style option
      layerOptions.style = styleFunction;
    }

    // build layer
    layer = new ol.layer.Vector(layerOptions);

    return layer;
  }

  /*
   * Build a layer source
   */
  self.buildSource = function(layerCfg)
  {
    var url = null;
    var source = null;
    var sourceCfg = layerCfg.source;

    // in this case, layer doesn't have a source
    if (!sourceCfg)
      return null;

    // add attribute for build complete url
    sourceCfg.completeUrl = null;

    // if source have a url, we adjust it
    if (sourceCfg.url)
    {
      // substitute params into url
      if (sourceCfg.urlParams)
      {
        $.each(sourceCfg.urlParams, function(key, val)
        {
          sourceCfg.url = sourceCfg.url.replace(key, val);
        });
      }

      // assign complete url to new parameter
      sourceCfg.completeUrl = sourceCfg.url;

      // add prefix to relative URL
      sourceCfg.completeUrl = (sourceCfg.completeUrl.indexOf('http') == 0) ?
         sourceCfg.completeUrl : rwConfigSvc.urlPrefix + sourceCfg.completeUrl;
    }

    switch(sourceCfg.type)
    {
      case "WMS":
        var layers = [];

        // retrieve layers name involved in this layer
        if (sourceCfg.layer_name)
          layers.push(sourceCfg.layer_name); // case of simple layer
        else
        {
          // case of composed layer
          for (var idx=0, len=layerCfg.layers.length; idx<len; idx++)
          {
            layers.push(layerCfg.layers[idx].layer_name);
          }
        }

        // invoke service to check if there are styles
        // to apply to these layers related to logged user
        for (var idx=0, len=layers.length; idx<len; idx++)
        {
          wgRetrieveStylesSvc.retrieve({layerName:layers[idx]}, function(res)
          {
            if (res && res.style)
            {
              userStyles[layers[idx]] = res.style;
            }
          });
        }

        source = self.buildWMSSource(sourceCfg, layerCfg.tiled);
        break;

      case "STATIC_IMAGE":
        source = self.buildImageStaticSource(sourceCfg);
        break;

      case "XYZ":
        source = self.buildXYZSource(sourceCfg);
        break;

      case "OSM":
        source = self.buildOSMSource(sourceCfg);
        break;

      case "VECTOR":
      case "GEOJSON":
        source = self.buildVectorSource(sourceCfg);
        break;

      default:
        console.error("Source Type " + sourceCfg.type + " not managed yet!");
    }

    return source;
  }

  /*
   *  Build OSM source
   */
  self.buildOSMSource = function(sourceCfg)
  {
    var source = null;
    var options = {};

    if (sourceCfg.attributions)
      options.attributions = sourceCfg.attributions;

    if (sourceCfg.url)
      options.url = sourceCfg.url;

    options.wrapX = false;

    source = new ol.source.OSM(options);

    return source;
  }

  /*
   * Build XYZ source
   */
  self.buildXYZSource = function(sourceCfg)
  {
    var source = null;
    var options = {};

    if (sourceCfg.attributions)
      options.attributions = sourceCfg.attributions;

    if (sourceCfg.tile_size)
      options.tileSize = sourceCfg.tile_size;

    if (sourceCfg.projection)
      options.projection = sourceCfg.projection;

    options.url = sourceCfg.completeUrl;

    source = new ol.source.XYZ(options);

    return source;
  }

  /*
   * Build WMS source
   */
  self.buildWMSSource = function(sourceCfg, tiled)
  {
    var source = null;
    var sourceOptions = {};
    var wmsParams = {};

    // check if there is a style to apply to this layer related to logged user
    if (userStyles[sourceCfg.layer_name])
    {
      wmsParams.STYLES = userStyles[sourceCfg.layer_name];
    }
    else if (sourceCfg.layer_style)
      wmsParams.STYLES = sourceCfg.layer_style;

    // configure WMS request parameters object
    if (sourceCfg.layer_name)
      wmsParams.LAYERS = sourceCfg.layer_name;
    if (sourceCfg.style)
      wmsParams.STYLES = sourceCfg.style;
    if (sourceCfg.version)
      wmsParams.VERSION = sourceCfg.version;
    if (sourceCfg.format)
      wmsParams.FORMAT  = sourceCfg.format;
    if (sourceCfg.width)
      wmsParams.WIDTH = sourceCfg.width;
    if (sourceCfg.height)
      wmsParams.HEIGHT  = sourceCfg.height;
    if (sourceCfg.time)
      wmsParams.TIME  = sourceCfg.time;

    if (sourceCfg.attributions)
      sourceOptions.attributions = sourceCfg.attributions;

    if (sourceCfg.projection)
      sourceOptions.projection = sourceCfg.projection;

    if (sourceCfg.ratio)
      sourceOptions.ratio = sourceCfg.ratio;

    sourceOptions.url    = sourceCfg.completeUrl;
    sourceOptions.params = wmsParams;
    sourceOptions.wrapX  = false;
    //sourceOptions.cacheSize = 1000;

    source = tiled ? new ol.source.TileWMS(sourceOptions) :
                     new ol.source.ImageWMS(sourceOptions);

    return source;
  }

  /*
   * Build Image Static source
   */
  self.buildImageStaticSource = function(sourceCfg)
  {
    var source = null;

    var options = {};

    if (sourceCfg.attributions)
      options.attributions = sourceCfg.attributions;

    if (sourceCfg.projection)
      options.projection = sourceCfg.projection;

    options.url = sourceCfg.url;
    options.imageSize = sourceCfg.imageSize;
    options.imageExtent = sourceCfg.imageExtent;

//     options.imageLoadFunction = function(image, src)
//     {
//       image.getImage().src = src;
//     };

    source = new ol.source.ImageStatic(options);

    return source;
  }

  /*
   * Build Vector source
   */
  self.buildVectorSource = function(sourceCfg)
  {
    var source = null;
    var sourceOptions = {};
    var propNameArr  = null;
    var filter = null;

    if (sourceCfg.attributions)
      sourceOptions.attributions = sourceCfg.attributions;

    sourceOptions.wrapX = false;

    // valorize strategy source option
    switch (sourceCfg.strategy)
    {
      case "BBOX":
        sourceOptions.strategy = ol.loadingstrategy.bbox;
        break;

      case "ALL":
        sourceOptions.strategy = ol.loadingstrategy.all
        break;

      case "TILE":
        sourceOptions.strategy = ol.loadingstrategy.tile;
        break;

      default:
        sourceOptions.strategy = ol.loadingstrategy.all;
    }

    // build array of property names to return
    if (sourceCfg.attributes)
    {
      propNameArr = [];

      for (var idx=0, len=sourceCfg.attributes.length; idx<len; idx++)
      {
        propNameArr.push(sourceCfg.attributes[idx]);
      }
    }

    // function to retrieve feature format class to encode
    // and decode features from specified output format
    var getFormat = function()
    {
      var format = null;

      switch(sourceCfg.format)
      {
        case "application/json":
          format = new ol.format.GeoJSON({defaultDataProjection:sourceCfg.projection});
          break;

        default:
          format = new ol.format.GeoJSON({defaultDataProjection:sourceCfg.projection});
          break;
      };

      return format;
    }

    if (sourceCfg.type == "GEOJSON")
    {
      // loader function
      sourceOptions.loader = function(extent, resolution, projection)
      {
        var additionalFilter = "";
        var arrQSParams;
        var baseURL;
        var thereIsBaseFilter = false;
        var thereIsAdditionalFilter = false;
        var filterIdx = -1;
        var bboxFilter= "";
        var paramsToPost = {};

        // split url into query string and base url
        //var arrURL = sourceCfg.completeUrl.split("?");
        var arrURL = sourceCfg.url.split("?");

        baseURL = arrURL[0];
        var queryString = (arrURL.length == 2) ? arrURL[1] : "";

        // split query string into its components
        arrQSParams = queryString.split("&");

        // check for presence of filter attribute into query string
        for (var idx=0; idx<arrQSParams.length; idx++)
        {
          if (arrQSParams[idx].indexOf("filter=") == 0)
          {
            thereIsBaseFilter = true;
            filterIdx = idx;
            break;
          }
        }

        // add runtime filter if presents
        if (sourceCfg.runtimeFilter)
        {
          thereIsAdditionalFilter = true;

          // source have runtime filter, but not is ready
          // we build a fake filter that return always false
          // to temporary block layer visualization
          if ($.isEmptyObject(sourceCfg.runtimeFilter))
          {
            additionalFilter = "id|EQ|-99";
          }
          else
          {
            additionalFilter = sourceCfg.runtimeFilter;
          }
        }

        // evaluate bbox condition if we have a bbox loading strategy
        if (sourceOptions.strategy == ol.loadingstrategy.bbox)
        {
          var bboxFilter = "geom|IN_BBOX|" + extent[0] + "," + extent[1] +
              "," + extent[2] + "," + extent[3] + "," + self.mapCurrSR.code;

          if (thereIsAdditionalFilter)
            additionalFilter += ";";

          additionalFilter += bboxFilter;

          thereIsAdditionalFilter = true;
        }

        // append additional filter to base filter (filter already present on url)
        if (thereIsAdditionalFilter)
        {
          if (!thereIsBaseFilter)
          {
            arrQSParams.push("filter="+additionalFilter);
            filterIdx = arrQSParams.length-1;
          }
          else
            arrQSParams[filterIdx] += ";" + additionalFilter;
        }

        // build object (from query string) to post
        for (var idx=0; idx<arrQSParams.length; idx++)
        {
          var item = arrQSParams[idx];
          var arrItemParts = item.split("=");

          paramsToPost[arrItemParts[0]] = arrItemParts[1];
        }

        // execute post
        rwHttpSvc.post(baseURL, paramsToPost, function(response)
        {
          if (!response || response.error)
          {
            console.error("error on retrieve features!");
            // TODO - manage error
          }
          else
          {
            var features = source.getFeatures();

            for (var idx=0, len=features.length; idx<len; idx++)
              source.removeFeature(features[idx]);

            format = new ol.format.GeoJSON({defaultDataProjection:sourceCfg.projection});

            source.addFeatures(format.readFeatures(response, {
              dataProjection: sourceCfg.projection,
              featureProjection:'EPSG:'+self.mapCurrSR.code
              })
            );
          }
        });

      };
    }
    else
    {
      // loader function
      sourceOptions.loader = function(extent, resolution, projection)
      {
        // configure getFeature request
        var getFeatureCfgObj = {
          srsName: 'EPSG:'+self.mapCurrSR.code, //sourceCfg.projection,
          featureTypes: [sourceCfg.layer_name],
          outputFormat: sourceCfg.format
        };

        // add propertyNames if presents
        if (propNameArr)
          getFeatureCfgObj.propertyNames = propNameArr;

        // add filter if presents
        if (sourceCfg.wfsFilter || sourceCfg.runtimeFilter)
        {
          if (!sourceCfg.runtimeFilter)
          {
            getFeatureCfgObj.filter = sourceCfg.wfsFilter;
          }
          else
          {
            // source have runtime filter, but not is ready
            // we build a filter that return always false
            // to temporary block layer visualization
            if ($.isEmptyObject(sourceCfg.runtimeFilter))
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
              getFeatureCfgObj.filter = sourceCfg.wfsFilter ?
                new ol.format.filter.And(
                  sourceCfg.wfsFilter,
                  sourceCfg.runtimeFilter
                ) : sourceCfg.runtimeFilter;
            }
          }
        }

        // add bbox condition if we have a bbox loading strategy
        if (sourceOptions.strategy == ol.loadingstrategy.bbox)
        {
          getFeatureCfgObj.bbox = extent;
          getFeatureCfgObj.geometryName = 'geom';
        }

        // create getFeature request
        var getFeatureRequest = new ol.format.WFS().writeGetFeature(getFeatureCfgObj);

        $.ajax({
          url: sourceCfg.completeUrl,
          type: 'POST',
          async: true,
          data: new XMLSerializer().serializeToString(getFeatureRequest),
          contentType: "text/xml",
          success: function(response)
          {
            // retrieve returned features format
            format = getFormat();

            // clear source from previous result
            // IMPORTANT: do not use source.clear() method because into
            //            feature loader causes recursive call of reloadFeature.
            //            Note we use getFeatures() because with forEachFeature()
            //            will get a 'Can not remove value while reading' error.
            var features = source.getFeatures();

            for (var idx=0, len=features.length; idx<len; idx++)
              source.removeFeature(features[idx]);

            source.addFeatures(format.readFeatures(response, {
              dataProjection:   'EPSG:'+self.mapCurrSR.code, //sourceCfg.projection,
              featureProjection:'EPSG:'+self.mapCurrSR.code
              })
            );
          }
          // TODO manage error ...
        });
      };
    }

    source = new ol.source.Vector(sourceOptions);

    // set custom attribute projection on source
    // we set the SR of the feature geometry so we can reproject
    // a vector layer to another SR
    source.set('projection', 'EPSG:'+self.mapCurrSR.code, true);

    // cluster management
    if (sourceCfg.cluster)
    {
      var clusterSourceOptions = {};

      if (sourceCfg.attributions)
        clusterSourceOptions.attributions = sourceCfg.attributions;

      clusterSourceOptions.distance = sourceCfg.clusterDist;
      clusterSourceOptions.wrapX    = false;
      clusterSourceOptions.source   = source;

      // function that return a point for cluster rappresentation of the feature
      // (the OL default function works only for Point geometry)
      var geometryFunction = function(feature)
      {
        var featureGeom = feature.getGeometry();
        var geom = null;

        // possible values are defined into ol.geom.GeometryType
        switch(featureGeom.getType())
        {
          case 'Point':
            geom = featureGeom;
            break;

          case 'MultiPoint':
            geom = new ol.geom.Point(ol.extent.getCenter(featureGeom.getExtent()));
            break;

          case 'LineString':
            geom = new ol.geom.Point(ol.extent.getCenter(featureGeom.getExtent()));
            break;

          case 'MultiLineString':
            geom = new ol.geom.Point(ol.extent.getCenter(featureGeom.getExtent()));
            break;

          case 'Polygon':
            geom = featureGeom.getInteriorPoint();
            break;

          case 'MultiPolygon':
            geom = new ol.geom.Point(ol.extent.getCenter(featureGeom.getExtent()));
            break;

          default:
            console.error("Geometry type " + geometry.getType() +
              " not managed yet into cluster source!");
        }

        return geom;
      }

      clusterSourceOptions.geometryFunction = geometryFunction;

      var clusterSource = new ol.source.Cluster(clusterSourceOptions);

      return clusterSource;
    }
    else
      return source;
  }

  /*
   * Reproject a vector layer
   */
  self.vectorLayerReproject = function(layerId, destProj)
  {
    // retrieve configuration
    var layerCfg = self.layersCfgObj[layerId];
    var layerOL  = null;

    // layer is a group item:
    // we need to access to group configuration to retrieve item layer
    if (layerCfg.id_parent)
    {
      var parentCfg = self.layersCfgObj[layerCfg.id_parent];

      // only layerOL of groups with group items have getLayers method;
      // composed layers with group items haven't it -> in this case layerOL
      // is that of the parent
      if (parentCfg.layerOL.getLayers)
      {
        var itemsArray = parentCfg.layerOL.getLayers().getArray();

        for (var idx=0, len=itemsArray.length; idx<len; idx++)
        {
          if (itemsArray[idx].get('id') == layerId)
          {
            layerOL = itemsArray[idx];
          }
        }
      }
      else
        layerOL = parentCfg.layerOL;

//       var itemsArray = parentCfg.layerOL.getLayers().getArray();
//
//       for (var idx=0, len=itemsArray.length; idx<len; idx++)
//       {
//         if (itemsArray[idx].get('id') == layerId)
//         {
//           layerOL = itemsArray[idx];
//         }
//       }
    }
    else
      layerOL = layerCfg.layerOL;

    // retrieve layer source
    // (if layer is clustered vector source is a property of cluster source)
    var source = (layerOL.getSource() instanceof ol.source.Cluster) ?
      layerOL.getSource().getSource() :
      layerOL.getSource();

    // reprojection is made only if layer has a source
    // (for service layer, source couldn't be defined)
    if (source)
    {
      // read source custom attribute projection
      var sourceProj = source.get('projection');

      // get all features from source
      var featureArray = layerOL.getSource().getFeatures();

      // remove all features from source
      layerOL.getSource().clear();

      // cicle on all features to reproject them and add to source
      for (var idx=0, len=featureArray.length; idx<len; idx++)
      {
        featureArray[idx].getGeometry().transform(sourceProj, destProj);
        layerOL.getSource().addFeature(featureArray[idx]);
      }

      // set new value on source custom attribute projection
      source.set('projection', destProj, true);
    }
  }

  /*
   * Build constructor style
   * feature can be also a cluster
   */
  self.buildStyle = function(styleObj, styleCache, feature, resolution)
  {
    // get default style configuration object
    var defaultStyleCfg = styleObj.default;
    var defaultStyleKey = styleObj.default_key;

    var styleKey = null;
    var style    = null;
    var toCache  = true;

    // support variables to manage style visibility
    var minResolution = 0;
    var maxResolution = Infinity;

    var units = self.map.getView().getProjection().getUnits();
    var MPU   = ol.proj.METERS_PER_UNIT[units];

    // if feature is null, we have to build a style to associate to entire layer
    // this style is not cached (styleType == FIXED)
    if (feature == null)
    {
      toCache = false;
    }
    else
    {
      // feature is not null
      // in this case we have style cached (styleType == STYLE|PROPERTY)
      // build the key of style into cache
      styleKey = retrieveStyleCacheKey(defaultStyleKey, feature);

      // control if style is into cache
      if (styleCache)
        style = styleCache[styleKey];
    }

    // style not founded into cache or style not cached
    if (!style)
    {
      /*
       * Attention:
       * if styleCfg has rules that depend from resolution
       * (by presence of attributes minScale and/or maxScale),
       * the related style must not be cached because it changes on map zoom;
       * in this case we set toCache attribute to false to avoid caching
       */

      // configuration of OpenLayers style
      var olStyleCfg = {};

      var numStyleRules = defaultStyleCfg.length;

      if (numStyleRules == 1)
      {
        if (defaultStyleCfg[0].minScale != undefined)
        {
          minResolution = defaultStyleCfg[0].minScale / (MPU * _screenDPI * _IPM);
          toCache = false;
        }

        if (defaultStyleCfg[0].maxScale != undefined)
        {
          maxResolution = (defaultStyleCfg[0].maxScale) / (MPU * _screenDPI * _IPM);
          toCache = false;
        }

        if (minResolution <= resolution && maxResolution >= resolution)
        {
          olStyleCfg = buildSimpleStyle(defaultStyleCfg[0], feature);
          style = new ol.style.Style(olStyleCfg);
        }
      }
      else
      {
        // more styles to combine into one
        var stylesArr   = [];
        var thereIsGeom = false;
        var numValidStyleRules = 0;

        for (var k=0; k<numStyleRules; k++)
        {
          minResolution = 0;
          maxResolution = Infinity;

          if (defaultStyleCfg[k].minScale != undefined)
          {
            minResolution = defaultStyleCfg[k].minScale / (MPU * _screenDPI * _IPM);
            toCache = false;
          }

          if (defaultStyleCfg[k].maxScale != undefined)
          {
            maxResolution = (defaultStyleCfg[k].maxScale) / (MPU * _screenDPI * _IPM);
            toCache = false;
          }

          if (minResolution <= resolution && maxResolution >= resolution)
          {
            numValidStyleRules++;

            if (defaultStyleCfg[k].geometry)
            thereIsGeom = true;

            // push simple styles into an array
            stylesArr.push(buildSimpleStyle(defaultStyleCfg[k], feature));
          }
        }

        // if on styles cfg there isn't geometry attributes,
        // all styles could be combined into one, otherwise
        // we have an array of styles
        if (!thereIsGeom)
        {
          for (var k=0; k<numValidStyleRules; k++)
          {
            $.extend(olStyleCfg, stylesArr[k]);
          }

          style = new ol.style.Style(olStyleCfg);
        }
        else
        {
          for (var k=0; k<numValidStyleRules; k++)
          {
            stylesArr[k] = new ol.style.Style(stylesArr[k]);
          }

          style = stylesArr;
        }
      }

      // put style into cache
      if (toCache && styleCache && style)
        styleCache[styleKey] = style;
    }

    return style;
  }

  /*
   * Build the key of style into cache replacing values in that parameterized
   */
  function retrieveStyleCacheKey(parameterizedStyleKey, feature)
  {
    // reg expr to find parameter into key (find everything between [[ and ]]);
    // TODO if we have more [[..]] into key,
    // this reg expr it finds one (add g at the end)
    var regExpr = /\[\[.*\]\]/;

    var styleVariables;
    var styleKey;

    // in this case style key is parametric
    if ((styleVariables = regExpr.exec(parameterizedStyleKey)) !== null)
    {
      /*
      // TODO use if we have many [[..]] into key??
      if (styleVariables.index === regExpr.lastIndex)
      {
        regExpr.lastIndex++;
      }*/

      // remove bracket from the begin and the end to retrieve attribute name
      var attrName = styleVariables[0].substring(2, styleVariables[0].length-2);
      var attrVal  = null;

      // retrieve attribute value
      // if feature is a cluster, the only usable properties is cluster size
      if (feature.get('features'))
        attrVal = feature.get('features').length;
      else
        attrVal = feature.getProperties()[attrName];

      styleKey = parameterizedStyleKey.replace(regExpr, attrVal);
    }
    else // in this case style key is fixed (no parameter)
    {
      styleKey = parameterizedStyleKey;
    }

    return styleKey;
  }

   /*
   * build constructor simple style, accept object style
   */
  function buildSimpleStyle(styleCfg, feature)
  {
    var style = {};

    // clone object input style.
    var styleObj = $.extend(true, {}, styleCfg);

    // read style type and remove from config object
    var type = styleObj.type;
    delete styleObj.type;

    // remove style resolution from config object
    delete styleObj.resolution;

    // textPath is a postCompose style and is builded with another function
    if (type == 'textPath')
      return style;

    // contains only the attributes of the style
    var attributes = styleObj;

    // build style constructor for the attributes of the type
    var attributeObj   = {};
    var attributeClass = {};

    /*
     * Convert the custom attributes of the style into an
     * object (attributeObj) with attributes style of OL
     */
    $.each(attributes, function(attribute, value)
    {
      switch(attribute)
      {
        case 'fillColor':
          attributeObj['fill'] = {'color':value};
          break;

        case 'strokeColor':
          if (attributeObj['stroke'] != undefined)
            $.extend(attributeObj['stroke'], {'color':value})
          else
            attributeObj['stroke'] = {'color':value};

          break;

        case 'strokeWidth':
          if (attributeObj['stroke'] != undefined)
            $.extend(
              attributeObj['stroke'],
              {"width":calculateExpression(value, 'TEXT', feature)}
            );
          else
            attributeObj['stroke'] = {'width':calculateExpression(value, 'TEXT', feature)};

          break;

        case 'text':
          // check for attribute presence
          attributeObj['text'] = calculateExpression(value, 'TEXT', feature);
          break;

        case 'radius':
          var radius = (typeof value === 'string') ?
            calculateExpression(value, 'NUMBER', feature) : value;

          attributeObj['radius'] =  radius;
          break;

        case 'src':
          // add url prefix
          var src = rwConfigSvc.urlPrefix + value;
          attributeObj['src'] =  src;
          break;

        case 'local_src':
          // local path
          attributeObj['src'] =  value;
          break;

        case 'angle':
          // convert degrees to radians
          var angle = value * Math.PI / 180;
          attributeObj['angle'] =  angle;
          break;

        case 'rotation':
          // convert degrees to radians
          var rotation = value * Math.PI / 180;
          attributeObj['rotation'] =  rotation;
          break;

        case 'anchor':
          var x = calculateExpression(value[0], 'NUMBER', feature);
          var y = calculateExpression(value[1], 'NUMBER', feature);

          attributeObj['anchor'] = [x,y];
          break;

        default:
          attributeObj[attribute] = value;
      }
    });

    /*
     * Convert object (attributeObj) who contains attributes,
     * in the corresponding costructor (attributeClass) of OL
     */
    for (var idx=0, len=Object.keys(attributeObj).length; idx<len; idx++)
    {
      var attributeKey = Object.keys(attributeObj)[idx];

      switch(attributeKey)
      {
        case 'fill':
          attributeClass['fill'] = new ol.style.Fill(attributeObj['fill']);
          break;

        case 'stroke':
          attributeClass['stroke'] = new ol.style.Stroke(attributeObj['stroke']);
          break;

        default:
          attributeClass[attributeKey] = attributeObj[attributeKey];
      }
    }

    /*
     * Build style constructor for the type.
     * Depending on the type of style, build costructor style OL who has like
     * attributes (attributeClass)
     */
    switch(type)
    {
      case 'circle':
        var style = {'image': new ol.style.Circle(attributeClass)};
        break;

      case 'line':
        var style = attributeClass;
        break;

      case 'poly':
        var style = attributeClass;
        break;

      case 'text':
        var style = {'text': new ol.style.Text(attributeClass)};
        break;

      case 'image':
        var style = {'image': new ol.style.Icon(attributeClass)};
        break;

      case 'shape':
        var style = {'image': new ol.style.RegularShape(attributeClass)};
        break;
    }

    // set zIndex on style
    if (styleObj.zIndex)
      style.zIndex = styleObj.zIndex;

    // set feature geometry to render for this style
    if (styleObj.geometry)
    {
      var f = null;

      switch(styleObj.geometry)
      {
        case 'center':
          f = function(feature) {
            var geom = feature.getGeometry();
            var center = null;

            switch(geom.getType())
            {
              case 'Polygon':
                center = geom.getInteriorPoint();
                break;

              case 'MultiPolygon':
                center = geom.getInteriorPoints();
                break;

              /* Add CT */
              case 'LineString':
                center = new ol.geom.Point(geom.getCoordinateAt(0.5));
                break;

              case 'MultiLineString':
                var coords = [];
                var ls = geom.getLineStrings();
                for (var idx=0; idx<ls.length; idx++)
                  coords.push(ls[idx].getCoordinateAt(0.5))
                center = new ol.geom.MultiPoint(coords);
                break;

              case 'Point':
                center = new ol.geom.Point(geom.getCoordinates());
                break;

              case 'MultiPoint':
                center = new ol.geom.MultiPoint(geom.getCoordinates());
                break;
              /**/
              default:
                console.error("Geometry type " + geom.getType() +
                  " not managed yet for center into style function!");
            }

            return center;
          };

          break;

        case 'vertex':
          f = function(feature) {
            var geom = feature.getGeometry();
            var coords = null;

            switch(geom.getType())
            {
              case 'LineString':
                coords = [
                  geom.getFirstCoordinate(),
                  geom.getLastCoordinate()
                ];
                break;

              case 'MultiLineString':
                coords = [];
                var lineStrings = geom.getLineStrings();

                for (var idx=0, len=lineStrings.length; idx<len; idx++)
                {
                  coords.push(lineStrings[idx].getFirstCoordinate());
                  coords.push(lineStrings[idx].getLastCoordinate());
                }
                break;

              case 'Polygon':
                coords = geom.getCoordinates();
                break;

              case 'MultiPolygon':
                coords = geom.getCoordinates()[0];
                break;

              /* Add CT*/
              case 'Point':
              case 'MultiPoint':
                coords = geom.getCoordinates();
                break;
              /**/
              default:
                console.error("Geometry type " + geom.getType() +
                  " not managed yet for vertex into style function!");
            }

            return new ol.geom.MultiPoint(coords);
          };

          break;

        default:
          console.error("Style on feature " + value +
            " not managed yet into style function!");
      }

      style.geometry = f;
    }

    return style;
  }

  /*
   * Build a postCompose style (textPath)
   */
  function buildPostComposeStyle(layer, layerCfg)
  {
    if (layerCfg.style && layerCfg.style.styles)
    {
      // TODO verify also for hover style
      var numDefaultStyles = layerCfg.style.styles.default.length;

      for (var idx=0; idx<numDefaultStyles; idx++)
      {
        var styleCfg = layerCfg.style.styles.default[idx];

        if (styleCfg.type == 'textPath')
        {
          // convert style minScale into map resolution
          var resolution = 0;

          if (styleCfg.resolution)
          {
            var units = self.mapView.getProjection().getUnits();
            var MPU   = ol.proj.METERS_PER_UNIT[units];

            resolution = styleCfg.resolution / (MPU * _screenDPI * _IPM);
          }

          layer.setTextPathStyle(function (f) {
            return [
                new ol.style.Style(
                  buildTextPathStyle(styleCfg, f)
                )
              ]},
            resolution
          );
        }
      }
    }
  }

  /*
   * build constructor textPath style, accept object style
   */
  function buildTextPathStyle(styleCfg, feature)
  {
    var style = {};

    // clone object input style.
    var styleObj = $.extend(true, {}, styleCfg);

    // read style type and remove from config object
    var type = styleObj.type;
    delete styleObj.type;

    // read style resolution and remove from config object
    var resolution = styleObj.resolution;
    delete styleObj.resolution;

    // contains only the attributes of the style
    var attributes = styleObj;

    // build style constructor for the attributes of the type
    var attributeObj   = {};
    var attributeClass = {};

    /*
     * Convert the custom attributes of the style into an
     * object (attributeObj) with attributes style of OL
     */
    $.each(attributes, function(attribute, value)
    {
      switch(attribute)
      {
        case 'fillColor':
          attributeObj['fill'] = {'color':value};
          break;

        case 'strokeColor':
          if (attributeObj['stroke'] != undefined)
            $.extend(attributeObj['stroke'], {'color':value})
          else
            attributeObj['stroke'] = {'color':value};

          break;

        case 'text':
          // check for attribute presence
          attributeObj['text'] = calculateExpression(value, 'TEXT', feature);
          break;

        default:
          attributeObj[attribute] = value;
      }
    });

    /*
     * Convert object (attributeObj) who contains attributes,
     * in the corresponding costructor (attributeClass) of OL
     */
    for (var idx=0, len=Object.keys(attributeObj).length; idx<len; idx++)
    {
      var attributeKey = Object.keys(attributeObj)[idx];

      switch(attributeKey)
      {
        case 'fill':
          attributeClass['fill'] = new ol.style.Fill(attributeObj['fill']);
          break;

        case 'stroke':
          attributeClass['stroke'] = new ol.style.Stroke(attributeObj['stroke']);
          break;

        default:
          attributeClass[attributeKey] = attributeObj[attributeKey];
      }
    }

    /*
     * Build TextPath style
     */
    var style = {'text': new ol.style.TextPath(attributeClass)};

    return style;
  }

  /*
   * Calculate parameterized expression with feature properties values
   * feature can be a cluster
   */
  function calculateExpression(parameterizedExpr, type, feature)
  {
    var expr = null;

    // reg expr to find parameter into key (find everything between [[ and ]]);
    // TODO if we have more [[..]] into key, this reg expr it finds one
    var regExpr = /\[\[.*\]\]/;

    var exprVariables = regExpr.exec(parameterizedExpr);

    // in this case expression isn't parametric
    if (exprVariables == null)
    {
      return parameterizedExpr;
    }

    if (type == 'TEXT')
    {
      /*
      // TODO use if we have many [[..]] into key??
      if (exprVariables.index === regExpr.lastIndex)
      {
        regExpr.lastIndex++;
      }*/

      // remove bracket from the begin and the end to retrieve attribute name
      var attrName = exprVariables[0].substring(2, exprVariables[0].length-2);
      var attrVal  = null;

      // retrieve attribute value
      // if feature is a cluster, the only usable properties is cluster size
      if (feature.get('features'))
        attrVal = feature.get('features').length;
      else
        attrVal = feature.getProperties()[attrName];

      // if attrVal is null -> replace with ' ' string (to avoid null into label)
      // IMPORTANT not use empty string because we have error on TextPath style
      if (!attrVal) attrVal = ' ';

      // subst attribute value into expression
      expr = parameterizedExpr.replace(regExpr, attrVal);
    }
    else // type is NUMBER
    {
      // remove bracket from the begin and the end to retrieve attribute name
      var attrName = exprVariables[0].substring(2, exprVariables[0].length-2);
      var attrVal  = null;

      // remove bracket from expression in order to evaluate
      var parameterizedExprWithoutBracket = parameterizedExpr.replace(regExpr, attrName);

      // retrieve attribute value
      // if feature is a cluster, the only usable properties is cluster size
      if (feature.get('features'))
        attrVal = feature.get('features').length;
      else
        attrVal = feature.getProperties()[attrName];

      // build function to evaluate expression
      //
      // construnctor Function has the signature
      //    new Function(param1, ..., paramN, funcBody)
      // and create this function
      //    function («param1», ..., «paramN») {
      //      «funcBody»
      //    }
      var f = new Function(attrName, 'return '+parameterizedExprWithoutBracket);

      // call function builded
      // (*1 to be sure to have a number)
      expr = f(attrVal)*1;
    }

    return expr;
  }

  /*
   * TODO  method to manage style on temporary layer
   */
  function buildFeatureStyle(styleCfg, feature)
  {
    // configuration of OpenLayers style
    var olStyleCfg = {};
    // OpenLayers style
    var style      = null;

    var numStyleRules = styleCfg.length;

    if (numStyleRules == 1)
    {
      olStyleCfg = buildSimpleStyle(styleCfg[0], feature);
      style = new ol.style.Style(olStyleCfg);
    }
    else
    {
      // more styles to combine into one
      var stylesArr   = [];
      var thereIsGeom = false;

      for (var k=0; k<numStyleRules; k++)
      {
        if (styleCfg[k].geometry)
          thereIsGeom = true;

        // push simple styles into an array
        stylesArr.push(buildSimpleStyle(styleCfg[k], feature));
      }

      // if on styles cfg there isn't geometry attributes,
      // all styles could be combined into one, otherwise
      // we have an array of styles
      if (!thereIsGeom)
      {
        for (var k=0; k<numStyleRules; k++)
        {
          $.extend(olStyleCfg, stylesArr[k]);
        }

        style = new ol.style.Style(olStyleCfg);
      }
      else
      {
        for (var k=0; k<numStyleRules; k++)
        {
          stylesArr[k] = new ol.style.Style(stylesArr[k]);
        }

        style = stylesArr;
      }
    }

    return style;
  }

  /*
   * Called on addLayer and on change map resolution (zoom)
   * Single layers could have resolution restrictions (min_scale and max_scale),
   * then we have to adjust layers that must be shown
   */
  self.setResolutionLayer = function(layerCfg)
  {
    var minResolution = 0;
    var maxResolution = Infinity;

    var units = self.map.getView().getProjection().getUnits();
    var MPU   = ol.proj.METERS_PER_UNIT[units];

    var resolutionMap = self.map.getView().getResolution();

    // For composed layer, on change resolution, if there are changes,
    // we have to update and recall layer source
    if (layerCfg.layerType == 'COMPOSED_LAYER')
    {
      // IMAGE layer -> we have to update attribute LAYERS of source WMS params
      if (layerCfg.type == 'IMAGE')
      {
        var strListLayers = '';
        var source = layerCfg.layerOL.getSource();
        var params = source.getParams();

        // cicle on composed layer items
        for (var idx=0, len=layerCfg.children.length; idx<len; idx++)
        {
          var minResolution = 0;
          var maxResolution = Infinity;
          var itemCfg = self.layersCfgObj[layerCfg.children[idx]];
          itemCfg.disabled = true;

          if (itemCfg.min_scale != undefined)
            minResolution = itemCfg.min_scale / (MPU * _screenDPI * _IPM);

          if (itemCfg.max_scale != undefined)
            // add 50 so that layer is already visible at maxscale
            maxResolution = (itemCfg.max_scale + 50) / (MPU * _screenDPI * _IPM);

          // item is visible
          if (minResolution <= resolutionMap && maxResolution >= resolutionMap)
          {
            itemCfg.disabled = false;
          }

          if (itemCfg.visible && !itemCfg.disabled)
          {
            strListLayers += (itemCfg.layer_name + ',');
          }
        }

        // if strListLayers isn't empty then turn on the visibility of layerOL
        // else turn off
        if (strListLayers != '')
        {
          strListLayers = strListLayers.substring(0, strListLayers.length-1);
          self.manageComposedLayerVisibility(itemCfg.id_parent, true);
        }
        else
          self.manageComposedLayerVisibility(itemCfg.id_parent, false);


        // we update source only if LAYERS atytribute it is different from old one
        if (params.LAYERS != strListLayers)
        {
          params.LAYERS = strListLayers;
          params.STYLES = buildListStyles(strListLayers);
          source.updateParams(params);
        }
      }
      // VECTOR layer -> we have to update filter on VECTOR source
      else
      {
        var filterArray = [];

        // cicle on composed layer items
        for (var idx=0, len=layerCfg.children.length; idx<len; idx++)
        {
          var minResolution = 0;
          var maxResolution = Infinity;
          var itemCfg = self.layersCfgObj[layerCfg.children[idx]];
          itemCfg.disabled = true;

          if (itemCfg.min_scale != undefined)
            minResolution = itemCfg.min_scale / (MPU * _screenDPI * _IPM);

          if (itemCfg.max_scale != undefined)
            // add 50 so that layer is already visible at maxscale
            maxResolution = (itemCfg.max_scale + 50) / (MPU * _screenDPI * _IPM);

          // item is visible
          if (minResolution <= resolutionMap && maxResolution >= resolutionMap)
          {
            itemCfg.disabled = false;
          }

          if (itemCfg.visible && !itemCfg.disabled)
            filterArray.push(self.buildFilter(itemCfg.filter));
        }

        // build wfs filter according to selection and disable
        // the different conditions are in OR between them
        var filter = self.buildWFSLayerFilter(filterArray, 'OR');

        // we update filter only if it is different from old one
        if (!angular.equals(filter, layerCfg.source.wfsFilter))
        {
          layerCfg.source.wfsFilter = filter;

          // retrieve layer source
          // (if layer is clustered vector source is a property of cluster source)
          var source = (layerCfg.layerOL.getSource() instanceof ol.source.Cluster) ?
            layerCfg.layerOL.getSource().getSource() :
            layerCfg.layerOL.getSource();

          // clear source
          source.clear(true);
          //layerCfg.layerOL.getSource().clear(true);

          // refresh source
          if (layerCfg.source.wfsFilter != null)
            source.refresh();
            //layerCfg.layerOL.getSource().refresh();
        }
      }
    }

    // set resolutions for:
    // groups, layers child of a group (recursively), simple layers
    if (layerCfg.layerType == 'GROUP' ||
        layerCfg.layerType == 'SIMPLE_LAYER')
    {
      if (layerCfg.layerType == 'GROUP')
      {
        var groupDisabled = true;

        var groupItems = layerCfg.layerOL.getLayers().getArray();

        for (var idx=0, len=groupItems.length; idx<len; idx++)
        {
          minResolution = 0;
          maxResolution = Infinity;

          var groupItemDisabled = false;

          var groupItemId = groupItems[idx].get("id");
          var groupCfgItem = self.layersCfgObj[groupItemId];

          if (groupCfgItem.min_scale != undefined)
          {
            minResolution = groupCfgItem.min_scale / (MPU * _screenDPI * _IPM);
            groupItems[idx].setMinResolution(minResolution);
          }

          if (groupCfgItem.max_scale != undefined)
          {
            // add 50 so that layer is already visible at maxscale
            maxResolution = (groupCfgItem.max_scale + 50) / (MPU * _screenDPI * _IPM);
            groupItems[idx].setMaxResolution(maxResolution);
          }

          if (minResolution > resolutionMap || maxResolution < resolutionMap)
            groupItemDisabled = true;

          groupCfgItem.disabled = groupItemDisabled;

          // valorize disable flag for group
          groupDisabled = groupDisabled && groupItemDisabled;

          // invoke recursively this function for group items
          // (if layerType of item is GROUP_ITEM this invocation is unnecessary)
          self.setResolutionLayer(groupCfgItem);
        }

        // set disabled on group
        layerCfg.disabled = groupDisabled;
      }

      // manage disabled for simple layers
      if (layerCfg.layerType == 'SIMPLE_LAYER')
      {
        minResolution = 0;
        maxResolution = Infinity;

        if (layerCfg.min_scale != undefined)
        {
          minResolution = layerCfg.min_scale / (MPU * _screenDPI * _IPM);
          layerCfg.layerOL.setMinResolution(minResolution);
        }

        if (layerCfg.max_scale != undefined)
        {
          // add 50 so that layer is already visible at maxscale
          maxResolution = (layerCfg.max_scale + 50) / (MPU * _screenDPI * _IPM);
          layerCfg.layerOL.setMaxResolution(maxResolution);
        }

        layerCfg.disabled = false;

        if (minResolution > resolutionMap || maxResolution < resolutionMap)
          layerCfg.disabled = true;
      }
    }
  }


  /*
   * get opacity layer
   */
  self.getOpacityLayer = function(layerId)
  {
    // retrieve OL layer
    var layerOL = self.layersCfgObj[layerId].layerOL;

    if (!$.isEmptyObject(layerOL))
    {
      return layerOL.getOpacity();
    }
  };

  /*
   * set opacity layer or LayerGroup
   */
  self.setOpacityLayer = function(layerId, value)
  {
    // retrieve OL layer
    var layerOL = self.layersCfgObj[layerId].layerOL;

    if (!$.isEmptyObject(layerOL))
    {
      layerOL.setOpacity(value);
    }
  };

  /*
   * // TODO remove this function, use manageLayerVisibility instead !!!!!!!
   */
  self.setVisibleLayer = function(layerId, layerVisibility)
  {
    var layerCfg = self.layersCfgObj[layerId];

    if (layerCfg)
    {
      layerCfg.layerOL.setVisible(layerVisibility);
    }
  }

  /*
   * Called:
   * - by layer selection on layer control panel (check on layer)
   * - from external method to light on/off layer
   */
  self.manageLayerVisibility = function(layerId, layerVisibility)
  {
    var layerCfg = self.layersCfgObj[layerId];

    layerCfg.visible = layerVisibility;

    // if layer have children -> manage their visibility
    if (layerCfg.children && layerCfg.children.length > 0)
    {
      manageChildrenVisibility(layerId, layerVisibility);
    }

    // if layer have a parent -> manage its visibility
    if (layerCfg.id_parent)
    {
      manageParentVisibility(layerId, layerVisibility);
    }

    // update layer visibility
    if (layerCfg.layerOL)
    {
      layerCfg.layerOL.setVisible(layerVisibility);

      layerCfg.selected = layerVisibility;
    }
  }

  /*
   * Manage visibility on layer's children
   */
  function manageChildrenVisibility(layerId, layerVisibility)
  {
    var layerCfg = self.layersCfgObj[layerId];

    // cycle on all children to make them visible and selected
    for (var idx=0, len=layerCfg.children.length; idx<len; idx++)
    {
      var itemId  = layerCfg.children[idx];
      var itemCfg = self.layersCfgObj[itemId];

      itemCfg.selected = layerVisibility;
      itemCfg.visible  = layerVisibility;

      // update layer visibility
      // (for COMPOSED_LAYER we have to adjust
      //  layers list (IMAGE) or filter (VECTOR))
      if (layerCfg.layerType == 'COMPOSED_LAYER')
      {
        self.manageComposedLayerVisibility(layerId, layerVisibility);
      }
      else if (itemCfg.layerOL)
      {
        itemCfg.layerOL.setVisible(layerVisibility);
      }

      // if children have children -> call recursively this function
      if (itemCfg.children && itemCfg.children.length > 0)
      {
        manageChildrenVisibility(itemId, layerVisibility);
      }
    }
  }

  /*
   * Manage visibility on layer's parent
   */
  function manageParentVisibility(layerId, layerVisibility)
  {
    var layerCfg = self.layersCfgObj[layerId];

    // retrieve parent layer configuration
    var parentCfg = self.layersCfgObj[layerCfg.id_parent];

    // check for 'brother' of given layer
    // if layer is only child -> we have to do nothing
    // otherwise we have to check other brother visibility
    if (parentCfg.children && parentCfg.children.length > 1)
    {
      var allBrotherSelected = true;
      var allBrotherVisible  = false;

      // parent check is selected only if all children check are selected
      // parent layer is visible if at least one child layer is visible
      for (var idx=0, len=parentCfg.children.length; idx<len; idx++)
      {
        var brotherCfg = self.layersCfgObj[parentCfg.children[idx]];

        allBrotherSelected = allBrotherSelected && brotherCfg.selected;
        allBrotherVisible  = allBrotherVisible || brotherCfg.visible;
      }

      parentCfg.selected = allBrotherSelected;
      parentCfg.visible  = allBrotherVisible;
    }
    else // parent has only one child
    {
      var childCfg = self.layersCfgObj[parentCfg.children[0]];

      parentCfg.selected = childCfg.selected ? true : false;
      parentCfg.visible  = childCfg.visible  ? true : false;
    }

    // update layer visibility
    // (for COMPOSED_LAYER_ITEM we have to adjust
    //  parent layers list (IMAGE) or parent filter (VECTOR))
    if ((parentCfg.type == "IMAGE" && layerCfg.layerType == 'COMPOSED_LAYER_ITEM') ||
        (parentCfg.type == "VECTOR" && layerCfg.layerType == 'GROUP_ITEM'))
    {
      self.manageComposedLayerVisibility(layerCfg.id_parent, layerVisibility);
    }
    else if (parentCfg.layerOL)
    {
      parentCfg.layerOL.setVisible(parentCfg.visible);
    }

    // if parent have a parent -> call recursively this function
    if (parentCfg.id_parent)
      manageParentVisibility(layerCfg.id_parent, layerVisibility);
  }

  /*
   * Set visibility on parent of composed layer item
   */
  self.manageComposedLayerVisibility = function(layerId, layerVisibility)
  {
    var layerCfg = self.layersCfgObj[layerId];

    if (layerCfg.type == 'VECTOR')
    {
      var filterArray = [];

      for (var idx=0, len=layerCfg.children.length; idx<len; idx++)
      {
        var childCfg = self.layersCfgObj[layerCfg.children[idx]];

        if (childCfg.selected && !childCfg.disabled)
          filterArray.push(self.buildFilter(childCfg.filter));
      }

      // build wfs filter according to selection and disable
      // the different conditions are in OR between them
      layerCfg.source.wfsFilter = self.buildWFSLayerFilter(filterArray, "OR");

      // retrieve source of vector layer
      // (if layer is clustered vector source is a property of cluster source)
      var source = (layerCfg.layerOL.getSource() instanceof ol.source.Cluster) ?
        layerCfg.layerOL.getSource().getSource() :
        layerCfg.layerOL.getSource();

      // clear source
      source.clear(true);

      // refresh source (and show layer) only if filter is valued
      if (layerCfg.source.wfsFilter != null)
      {
        source.refresh();
        layerCfg.layerOL.setVisible(true);
      }
      else
        layerCfg.layerOL.setVisible(false);
    }
    else if (layerCfg.type == 'IMAGE')
    {
      var strListLayers = '';

      for (var idx=0, len=layerCfg.children.length; idx<len; idx++)
      {
        var childCfg = self.layersCfgObj[layerCfg.children[idx]];

        if (childCfg.selected && !childCfg.disabled)
          strListLayers += (childCfg.layer_name + ',');
      }

      layerCfg.layerOL.setVisible(false);

      // if there are items to show we update WMS source params
      // and set composed layer visible, otherwise composed layer is hidden
      if (strListLayers != '')
      {
        strListLayers = strListLayers.substring(0, strListLayers.length-1);
        strListStyles = buildListStyles(strListLayers);

        layerCfg.layerOL.getSource().updateParams({
          'LAYERS': strListLayers,
          'STYLES': strListStyles
        });

        layerCfg.layerOL.setVisible(true);
      }
    }
    else
    {
      // Attention: this else branch is unattainable
      console.error("manageComposedLayerVisibility layer type " +
        layerCfg.type + " not managed!");
    }
  }

  /*
   * build WMS list styles to apply to getMap request (STYLES parameter)
   * given related layers list (LAYERS parameter)
   */
  function buildListStyles(listLayers)
  {
    var stylesList = null;

    if (listLayers && listLayers.length>0)
    {
      var layers = listLayers.split(",");

      stylesList = "";

      for (var idx=0, len=layers.length; idx<len; idx++)
      {
        stylesList += (userStyles[layers[idx]] ? userStyles[layers[idx]] : "");

        if (idx<len-1)
          stylesList += ",";
      }
    }

    return stylesList;
  }

  /*
   * Build filter to apply to vector layer
   */
  self.buildFilter = function(filterCfgObj)
  {
    var filter     = null;
    var filterItem = null;
    var value      = null;

    // manage property val data type
    switch(filterCfgObj.property_type)
    {
      case 'date':
        value = new Date(filterCfgObj.property_val*1).toDateString();
        break;

      case 'datetime':
        var hours = new Date(filterCfgObj.property_val*1).toTimeString();

        // if datetime has time set to 0 --> it is a date
        if (hours.indexOf('00:00:00') >= 0)
        {
          value = new Date(filterCfgObj.property_val*1).toDateString();
        }
        else
        {
          value = new Date(filterCfgObj.property_val*1).toUTCString();
        }
        break;

      default:
        value = filterCfgObj.property_val;
    }

    switch(filterCfgObj.operator)
    {
      case "EQ":
        filter = new ol.format.filter.EqualTo(
          filterCfgObj.property_name,
          value,
          false  // set true if case sensitive
        );
        break;

      case "NEQ":
        filter = new ol.format.filter.NotEqualTo(
          filterCfgObj.property_name,
          value,
          false  // set true if case sensitive
        );
        break;

      case "IS":
        filter = new ol.format.filter.isNull(
          filterCfgObj.property_name
        );
        break;

      case "IS_NOT":
        filter = new ol.format.filter.not(
          new ol.format.filter.isNull(
            filterCfgObj.property_name
          )
        );
        break;

      case "LT":
        filter = new ol.format.filter.lessThan(
          filterCfgObj.property_name,
          value
        );
        break;

      case "GT":
        filter = new ol.format.filter.greaterThan(
          filterCfgObj.property_name,
          value
        );
        break;

      case "ILIKE":
        filter = new ol.format.filter.IsLike(
          filterCfgObj.property_name,
          filterCfgObj.property_val,
          "*",  // wildcard
          ".",  // single char
          "!",  // escape char
          false //set true if case sensitive
        );
        break;

      case "NOT_IN":
        if (filterCfgObj.property_val.length == 1)
        {
          // if we have one value
          filter = new ol.format.filter.notEqualTo(
            filterCfgObj.property_name,
            filterCfgObj.property_val
          );
        }
        else if (filterCfgObj.property_val.length > 1)
        {
          var filterItems = [];

          for (var idx=0; idx<filterCfgObj.property_val.length; idx++)
          {
            filterItems[idx] = new ol.format.filter.notEqualTo(
              filterCfgObj.property_name,
              filterCfgObj.property_val[idx]
            );
          }

          // see http://2ality.com/2011/08/spreading.html
          filter = new (Function.prototype.bind.apply(
              ol.format.filter.or, [null].concat(filterItems)
            )
          );
        }
        break;

      case "IN":
        if (filterCfgObj.property_val.length == 1)
        {
          // if we have one value
          filter = new ol.format.filter.equalTo(
            filterCfgObj.property_name,
            filterCfgObj.property_val
          );
        }
        else if (filterCfgObj.property_val.length > 1)
        {
          var filterItems = [];

          for (var idx=0; idx<filterCfgObj.property_val.length; idx++)
          {
            filterItems[idx] = new ol.format.filter.equalTo(
              filterCfgObj.property_name,
              filterCfgObj.property_val[idx]
            );
          }

          // see http://2ality.com/2011/08/spreading.html
          filter = new (Function.prototype.bind.apply(
              ol.format.filter.or, [null].concat(filterItems)
            )
          );
        }
        break;

      case "IS_NULL":
        filter = new ol.format.filter.isNull(filterCfgObj.property_name);
        break;

      case "DATE_EQ":
        // check if we have one or two values (commas is separator)
        if (filterCfgObj.property_val.indexOf(',') == 0)
        {
          // if we have one value, this is a date
          filter = new ol.format.filter.EqualTo(
            filterCfgObj.property_name,
            new Date(filterCfgObj.property_val.split(',')[0]*1).toDateString()
          );
        }
        else
        {
          // if we have two values, we could have date or datetime object
          // so we have to check time to verify this
          var hours = new Date(filterCfgObj.property_val.split(',')[0]*1).toTimeString();

          // if datetime has time set to 0 --> it is a date
          if (hours.indexOf('00:00:00') >= 0)
          {
            filter = new ol.format.filter.EqualTo(
              filterCfgObj.property_name,
              new Date(filterCfgObj.property_val.split(',')[0]*1).toDateString()
            );
          }
          else
          {
            filter = new ol.format.filter.between(
              filterCfgObj.property_name,
              new Date(filterCfgObj.property_val.split(',')[0]*1).toUTCString(),
              new Date(filterCfgObj.property_val.split(',')[1]*1).toUTCString()
            );
          }
        }

        break;

      default:
        console.error("filter operator " + filterCfgObj.operator + " not managed yet!");
    };

    return filter;
  }


  /*
   * Build filter on vector layer
   */
  self.buildWFSLayerFilter = function(filterCondArray, operator)
  {
    if (filterCondArray.length == 0)
      return null;

    // the condition of a vector composed layer are in OR between them
    function createFilter(filterArr, index, operator)
    {
      // only one item -> return a filter
      if (index === filterArr.length - 1)
          return filterArr[index];

      // more than 1 item -> call recursively the function
      switch (operator)
      {
        case "OR":
          return new ol.format.filter.Or(
            filterArr[index],
            createFilter(filterArr, index + 1, operator)
          );
          break;

        case "AND":
          return new ol.format.filter.And(
            filterArr[index],
            createFilter(filterArr, index + 1, operator)
          );
          break;
      }
    }

    var filterObj = createFilter(filterCondArray, 0, operator);

    return filterObj;
  }

  self.addBoxSelectInteraction = function(layerName, callback)
  {
    var layerId = self.getLayerIdByName(layerName);

    if (!layerId)
      return;

    var layerSource       = self.layersCfgObj[layerId].layerOL.getSource();
    var layerDefaultStyle = self.layersCfgObj[layerId].layerOL.getStyle();

    boxSelectInt = new ol.interaction.DragBox({
      condition: ol.events.condition.always
    });

    self.map.addInteraction(boxSelectInt);

    // clear selection when drawing a new box
    boxSelectInt.on('boxstart', function()
    {
      if (!selectedFeatures)
        selectedFeatures = new ol.Collection();

      // set default style on selected features
      selectedFeatures.forEach(function(element,index,array)
      {
        element.setStyle(layerDefaultStyle);
      });

      // empty selected features collection
      selectedFeatures.clear();
    });

    // features that intersect the box are added to the collection of
    // selected features
    boxSelectInt.on('boxend', function()
    {
      var selectedGid = [];
      var extent = boxSelectInt.getGeometry().getExtent();

      layerSource.forEachFeatureIntersectingExtent(extent, function(feature)
      {
        var geomType = feature.getGeometry().getType();

        // set different style on selected features
        switch (geomType)
        {
          case "Point":
          case "MultiPoint":
            feature.setStyle(pointSelectedStyle);
            break;
          case "LineString":
          case "MultiLineString":
          case "Polygon":
          case "MultiPolygon":
            feature.setStyle(lineSelectedStyle);
            break;
        }

        selectedFeatures.push(feature);
        selectedGid.push(feature.getProperties().gid);
      });

      callback(selectedGid)
    });
  }

  self.removeBoxSelectInteraction = function(layerName)
  {
    var layerId = self.getLayerIdByName(layerName);

    if (!layerId)
      return;

    var layerDefaultStyle = self.layersCfgObj[layerId].layerOL.getStyle();

    if (selectedFeatures)
    {
      // set default style on selected features
      selectedFeatures.forEach(function(element,index,array)
      {
        element.setStyle(layerDefaultStyle);
      });

      selectedFeatures.clear();
    }

    if (boxSelectInt)
      self.map.removeInteraction(boxSelectInt);
  }

  self.addClickSelectInteraction = function(layerName)
  {
    var layerId = self.getLayerIdByName(layerName);

    if (!layerId)
      return;

    if (!selectedFeatures)
        selectedFeatures = new ol.Collection();

    // empty selected features collection
    selectedFeatures.clear();

    var layerOL = self.layersCfgObj[layerId].layerOL;

    var filterFunction = function(feature, layer)
    {
      return (layer.get('id') == layerId) ? true:false;
    };

    clickSelectInt = new ol.interaction.Select(
    {
      condition: ol.events.condition.singleClick,
      toggleCondition:ol.events.condition.shiftKeyOnly,
      removeCondition:ol.events.condition.singleClick,
      layers: [layerOL],
      /*style: function(ft, res){console.info('click style function');
        var geomType = ft.getGeometry().getType();

        // return different style based on selected features
        switch (geomType)
        {
          case "Point":
          case "MultiPoint":
            return pointSelectedStyle;
            break;
          case "LineString":
          case "MultiLineString":
          case "Polygon":
          case "MultiPolygon":
            return lineSelectedStyle;
            break;
        }
      },
      features: selectedFeatures,*/
      filter:filterFunction
    });

    self.map.addInteraction(clickSelectInt);

    // listen on select event on clickSelectInt interaction to set features style
    clickSelectInt.on('select', function(evt)
    {
      var selected   = evt.selected;
      var deselected = evt.deselected;

      selected.forEach(function(ft)
      {
        selectedFeatures.push(ft);

        var geomType = ft.getGeometry().getType();

        // set different style based on selected features
        switch (geomType)
        {
          case "Point":
          case "MultiPoint":
            ft.setStyle(pointSelectedStyle);
            break;
          case "LineString":
          case "MultiLineString":
          case "Polygon":
          case "MultiPolygon":
            ft.setStyle(lineSelectedStyle);
            break;
        }
      });

      deselected.forEach(function(ft)
      {
        selectedFeatures.remove(ft);

        ft.setStyle(null);
      });
    });
  }

  self.removeClickSelectInteraction = function(layerName)
  {
    var layerId = self.getLayerIdByName(layerName);

    if (!layerId)
      return;

    var layerDefaultStyle = self.layersCfgObj[layerId].layerOL.getStyle();

    if (selectedFeatures)
    {
      // set default style on selected features
      selectedFeatures.forEach(function(element,index,array)
      {
        element.setStyle(null);
      });

      selectedFeatures.clear();

      //clickSelectInt.getFeatures().clear();
    }

    if (clickSelectInt)
      self.map.removeInteraction(clickSelectInt);
  }

  self.getSelectedFeaturesId = function()
  {
    var selectedGid = [];

    if (selectedFeatures)
    {
      selectedFeatures.forEach(function(feature)
      {
        selectedGid.push(feature.getProperties().gid);
      });
    }

    return selectedGid;
  }

   self.addDrawInteraction = function(geometry_type)
  {
    var editLayerCfg = self.layersCfgObj[self.layerEditId];

    // check if edit layer is added to the map
    if (editLayerCfg)
    {
      // retrieve edit layer source to create interactions
      var editSource = editLayerCfg.layerOL.getSource();

      if (!drawInt)
      {
        drawInt = new ol.interaction.Draw({
          source: editSource,
          type: geometry_type
        });

        self.map.addInteraction(drawInt);
      }

      drawInt.setActive(true);

      return drawInt;
    }
  }

  self.addModifyInteraction = function()
  {
    var editLayerCfg = self.layersCfgObj[self.layerEditId];

    // check if edit layer is added to the map
    if (editLayerCfg)
    {
      // retrieve edit layer source to create interactions
      var editSource = editLayerCfg.layerOL.getSource();

      if (!modifyInt)
      {
        modifyInt = new ol.interaction.Modify({source: editSource});

        self.map.addInteraction(modifyInt);
      }
    }
  }

  self.addSnapInteraction = function()
  {
    var editLayerCfg = self.layersCfgObj[self.layerEditId];

    // check if edit layer is added to the map
    if (editLayerCfg)
    {
      // retrieve edit layer source to create interactions
      var editSource = editLayerCfg.layerOL.getSource();

      if (!snapInt)
      {
        snapInt = new ol.interaction.Snap({source: editSource});

        self.map.addInteraction(snapInt);
      }

    }
  }

  self.addDrawHoleInteraction = function()
  {
    var editLayerCfg = self.layersCfgObj[self.layerEditId];

    // check if edit layer is added to the map
    if (editLayerCfg)
    {
//       var layerTypeGeom = editLayerCfg.geometry_type;
//
//       // draw hole is usable only on polygon layers
//       if (layerTypeGeom == "Polygon" ||
//           layerTypeGeom == "MultiPolygon" ||
//           layerTypeGeom == "Geometry" ||
//           layerTypeGeom == null)
//       {
        if (drawInt)
          drawInt.setActive(false);
//           self.map.removeInteraction(drawInt);

//         if (snapInt)
//           self.map.removeInteraction(snapInt);
//
//         if (modifyInt)
//           self.map.removeInteraction(modifyInt);

        if (!drawHoleInt)
        {
          drawHoleInt = new ol.interaction.DrawHole({
            layers:[editLayerCfg.layerOL]
          });

          self.map.addInteraction(drawHoleInt);
        }

        return drawHoleInt;
//       }
    }
  }

  self.addTransformInteraction = function()
  {
    var editLayerCfg = self.layersCfgObj[self.layerEditId];

    // check if edit layer is added to the map
    if (editLayerCfg)
    {
      if (!transformInt)
      {
        transformInt = new ol.interaction.Transform({
          layers:[editLayerCfg.layerOL],
          scale:true,
          rotate:true,
          translate:true,
          translateFeature:false,
          stretch:true
        });

        self.map.addInteraction(transformInt);
      }

      return transformInt;
    }
  }

  /*
   * Remove editing interactions from map
   */
  self.disableEdit = function()
  {
    if (modifyInt)
    {
      self.map.removeInteraction(modifyInt);
      modifyInt = null;
    }

    if (drawInt)
    {
      self.map.removeInteraction(drawInt);
      drawInt = null;
    }

    if (drawHoleInt)
    {
      self.map.removeInteraction(drawHoleInt);
      drawHoleInt = null;
    }

    if (snapInt)
    {
      self.map.removeInteraction(snapInt);
      snapInt = null;
    }

    if (transformInt)
    {
      self.map.removeInteraction(transformInt);
      transformInt = null;
    }
  }

  /*
   * Remove all features from edit layer
   */
  self.clearEditLayer = function()
  {
    var editLayerCfg = self.layersCfgObj[self.layerEditId];

    // verify if edit layer is added to the map
    if (editLayerCfg)
    {
      var editSource = editLayerCfg.layerOL.getSource();

      editSource.clear(true);
    }
  }

  /*
   * Return features from edit layer
   */
  self.getFeaturesFromEditLayer = function()
  {
    var editLayerCfg = self.layersCfgObj[self.layerEditId];

    // verify if edit layer is added to the map
    if (editLayerCfg)
    {
      var editSource = editLayerCfg.layerOL.getSource();

      return editSource.getFeatures();
    }
  }

  /*
   * Convert features from ol to geoJSON format
   */
  self.convertFeaturesToGeoJSON = function(features)
  {
    var geojson = new ol.format.GeoJSON();

    return geojson.writeFeatures(features);
  }

  /*
   * function to check if drawed feature is into user authority boundary
   * (if user has EDIT_MAP_WITH_FEATURE_LIMIT permission)
   */
  this.validateFeatureInBoundary = function(opt, callback)
  {
    // permissions for gisTools module
    var aPerm = rwAuthSvc.permForModule("gisTools") || [];

    // check for edit permission
    if (aPerm.indexOf("EDIT_MAP_WITH_FEATURE_LIMIT") >= 0)
    {
      // check if geometry is outer of user authority limit
      rwHttpSvc.post("/wgEdit/validateFeatureInBoundary", opt, function(res)
      {
        // post returns intersect=true only if feature intersect user authority boundary
        if(res && res.result && res.result[0].intersect)
          callback(null);
        else if (res && res.result && !res.result[0].intersect)
          callback({message:"OUT_OF_BOUNDARY"});
        else
          callback({message:"INTERSECTION_ERROR"});
      });
    }
    else
      callback(null);
  }

  /*
   * Retrieve coordinate from map click
   * Coordinates are returned into current map sr
   */
  this.getCoordinate = function(callback)
  {
    //change cursor
    var pointerMoveListenerKey = self.map.on('pointermove', function(e)
    {
      self.map.getTarget().style.cursor = 'crosshair';
    });

    // add event listener
    self.map.once('singleclick', function(e)
    {
      e.preventDefault();

      // remove listener
      ol.Observable.unByKey(pointerMoveListenerKey);

      var numDec = self.getCoordNumDec(self.mapCurrSR.units);
      var coordsArray = [];

      switch(self.mapCurrSR.name)
      {
        case 'WEBGIS.SR_4326_NAME_DMS':
          coordsArray = [
            self.fromDDToDMS(e.coordinate[0]),
            self.fromDDToDMS(e.coordinate[1])
          ];
          break;

        case 'WEBGIS.SR_MGRS_NAME':
          var strUSNG = LLtoUSNG(e.coordinate[1], e.coordinate[0], 5);
          var tmpArr = strUSNG.split(' ');
          coordsArray[0] = tmpArr[0] + ' ' + tmpArr[1];
          coordsArray[1] = tmpArr[2];
          coordsArray[2] = tmpArr[3];
          break;

        default:
          coordsArray = [
            e.coordinate[0].toFixed(numDec)*1,
            e.coordinate[1].toFixed(numDec)*1
          ];
      }

      callback(coordsArray);
    });
  }

  /*
   * Retrieve coordinate from map click into given sr
   */
  this.getCoordinatesIntoSR = function(sr, callback)
  {
    var prj = null;

    // check input parameter
    if (!sr)
      return callback(null);

    // retrieve projection among those defined for the map
    for (var id in self.projObj)
    {
      prj = self.projObj[id];

      if (prj.cfgParams.code == sr)
        break;
    }

    if (!prj)
      return callback(null);

    //change cursor
    var pointerMoveListenerKey = self.map.on('pointermove', function(e)
    {
      self.map.getTarget().style.cursor = 'crosshair';
    });

    // add event listener
    self.map.once('singleclick', function(e)
    {
      e.preventDefault();

      // remove listener
      ol.Observable.unByKey(pointerMoveListenerKey);

      var numDec = self.getCoordNumDec(prj.cfgParams.units);

      var coords =  (prj.name == 'WEBGIS.SR_4326_NAME_DMS') ?
        [self.fromDDToDMS(e.coordinate[0]), self.fromDDToDMS(e.coordinate[1])] :
        e.coordinate;

      coords = ol.proj.transform(coords, 'EPSG:'+ self.mapCurrSR.code, 'EPSG:'+sr);

      callback([coords[0].toFixed(numDec)*1, coords[1].toFixed(numDec)*1]);
    });
  }

  /*
   * Retrieve longitude and latitude from map click
   */
  this.getLatLon = function(callback)
  {
    // add event listener
    self.map.once('singleclick', function(e)
    {
      e.preventDefault();

      var numDec = self.getCoordNumDec('degrees');
      var coordinate = null;

      // trasform coordinate in SR 4326
      if (self.mapCurrSR.code != 4326)
        coordinate = ol.proj.transform(e.coordinate, 'EPSG:'+ self.mapCurrSR.code, 'EPSG:4326');
      else
        coordinate = e.coordinate;

      callback({
        lon: coordinate[0].toFixed(numDec)*1,
        lat: coordinate[1].toFixed(numDec)*1
      });
    });
  }

  /*
   * Zoom to the specified point (x,y) giving EPSG code of these coords
   */
  this.goToCoordsWithSR = function(coordX, coordY, srCode)
  {
    var coordArray = [coordX, coordY];
    var mapExtent  = self.projObj[self.mapCurrSR.id].mapExtent;
    var currentSR  = 'EPSG:'+ self.mapCurrSR.code;

    // trasform coordinate from srCode to current SR of map
    var coordinate = ol.proj.transform(coordArray, "EPSG:"+srCode, currentSR);

    // Center and zoom on point
    self.mapView.setCenter(coordinate);
    self.mapView.setZoom(self.pointZoomLevel);
  }

  /*
   * Zoom to the specified point having geographic coords (lat,lon)
   */
  this.goToLatLon = function(lat,lon)
  {
    this.goToCoordsWithSR(lon, lat, 4326);
  }

  /*
   * Zoom to given bounding box specifying EPSG
   */
  this.zoomToBBox = function(bbox, srCode)
  {
    if (self.mapCurrSR.code != srCode)
    {
      // transform bounding box in other SR used
      bbox = ol.proj.transformExtent(
        bbox,
        'EPSG:' + srCode,
        'EPSG:' + self.mapCurrSR.code
      );
    }

    self.mapView.fit(bbox);
  }

  /*
   * Zoom to feature given layer name and feature id
   */
  this.zoomToFeatureOnLayer = function (layerName, fId)
  {
    // retrieve layer id
    var layerId = self.getLayerIdByName(layerName);

    if (layerId)
    {
      // retrieve layer source
      var source = self.layersCfgObj[layerId].layerOL.getSource();

      if (source instanceof ol.source.Cluster)
        source = source.getSource();

      var ft = source.getFeatureById(fId);
      var ftGeom = ft.getGeometry();
      var extent = ftGeom.getExtent();

      self.zoomToBBox(extent, self.mapCurrSR.code);
    }
  }

  /*
   *
   */
  this.getLegendExtern = function(layerId)
  {
    var url = "";
    var sourceCfg = null;
    var layerName = "";
    var layerCfg = self.layersCfgObj[layerId];

    switch(layerCfg.layerType)
    {
      case "GROUP_ITEM":
        sourceCfg = layerCfg.source;
        layerName = layerCfg.source.layer_name;
        break;

      case "COMPOSED_LAYER_ITEM":
        sourceCfg = self.layersCfgObj[layerCfg.id_parent].source;
        layerName = layerCfg.layer_name;
        break;

      case "SIMPLE_LAYER":
        sourceCfg = self.layersCfgObj[layerId].source;
        layerName = layerCfg.source.layer_name;
        break;

      default:
        console.error("Defined extern legend for " +
          layerCfg.layerType + " " + layerId +
          ". This layerType has not source!");
    }

    if (sourceCfg)
    {
      url = self.getLegendUrl(sourceCfg);
      url += "&LAYER=" + layerName;

      return url;
    }
  }

  /*
   *
   */
  this.getLegendUrl = function(source)
  {
    var completeUrl;

    if (source.completeUrl)
    {
      completeUrl = source.completeUrl;
    }
    else
    {
      // add prefix to relative URL
      var completeUrl = (source.url.indexOf('http') == 0) ?
        source.url : rwConfigSvc.urlPrefix + "/" + source.url;

      // substitute params into url
      if (source.urlParams)
      {
        $.each(source.urlParams, function(key, val)
        {
          completeUrl = completeUrl.replace(key, val);
        });
      }
    }

    completeUrl = completeUrl.indexOf('?') > 0 ? completeUrl : completeUrl + '?';
    completeUrl += "REQUEST=GetLegendGraphic";

    if (source.version)
      completeUrl += "&VERSION=" + source.version;

    if (source.format)
      completeUrl += "&FORMAT=" + source.format;

    // adding legend options
    completeUrl += "&LEGEND_OPTIONS=forceLabels:ON;fontAntiAliasing:true"

    // TODO could be added language

    return completeUrl;
  }

    /*
   * Retrieve coordinate from map click
   * and return layer info by coordinates
   *
   * TODO: Use this function into wg-ctrl-info (replace function queryLayer)
   */
  this.getFeatureInfo = function(layerName, callback)
  {
    this.removeDefaultMapClickEvent();

    var lightOnLayer = false;

    if(!layerName)
      callback(null);

    // add listener on pointer move
    var pointerMoveListenerKey = self.map.on('pointermove', function(evt)
    {
      //change cursor
      if (evt.dragging)
      {
        self.map.getTargetElement().style.cursor = 'default';
        return;
      }

      self.map.getTargetElement().style.cursor = 'crosshair';
    });

    // add event listener
    self.map.once('singleclick', function(e)
    {
      e.preventDefault();

      // remove listener
      ol.Observable.unByKey(pointerMoveListenerKey);

      var layId = self.getLayerIdByName(layerName);

      if (!layId)
        callback(null);
      else
      {
        var layerCfg  = self.layersCfgObj[layId];

        if (!layerCfg)
          callback(null);
        else
        {
          /* Light on layer */
          if (!layerCfg.visible)
            self.manageLayerVisibility(layId,true);
          else
            lightOnLayer = true;

          var parentName  = null;
          var layerOL     = null;
          var layerSource = null;

          // layer is a group item or composed layer item:
          // we need to access to group configuration to retrieve item layer
          if (layerCfg.id_parent)
          {
            var parentCfg = self.layersCfgObj[layerCfg.id_parent];

            parentName = parentCfg.label;

            if (parentCfg.layerOL instanceof ol.layer.Group)
            {
              var itemsArray = parentCfg.layerOL.getLayers().getArray();

              for (var idx=0, len=itemsArray.length; idx<len; idx++)
              {
                if (itemsArray[idx].get('id') == layId)
                {
                  layerOL     = itemsArray[idx];
                  layerSource = layerOL.getSource();
                  break;
                }
              }
            }
            else
            {
              layerOL = parentCfg.layerOL;

              var sourceOpt = parentCfg.source;
              sourceOpt.layer_name = layerCfg.layer_name;

              layerSource = self.buildWMSSource(sourceOpt, false);
            }
          }
          else
          {
            layerOL     = layerCfg.layerOL;
            layerSource = layerOL.getSource();
          }

          var url = layerSource.getGetFeatureInfoUrl(
            e.coordinate,
            self.resolutions[self.resolutions.length-1],
            'EPSG:' + self.mapCurrSR.code,
            {
              'INFO_FORMAT'  : layerCfg.queryable ? layerCfg.queryable.info_format : 'application/json'
            }
          );

          // add layerId in query string to use it on asynchronous response
          url += '&layerId='+layId;

          // if url is an absolute url, we have to proxy it
          if (url.indexOf('http') == 0)
            url = rwConfigSvc.urlPrefix + "/utility/proxy?url=" + encodeURIComponent(url);

          $http.get(url).then(function(res)
          {
            if (res && res.data)
            {
              // There are features
              if(res.data.features && res.data.features.length > 0 )
              {
                if (!lightOnLayer)
                  self.manageLayerVisibility(layId,false);

                callback(res.data.features[0]);
              }
              else
              {
                if (!lightOnLayer)
                  self.manageLayerVisibility(layId,false);

                callback(null);
              }
            }
            else
              callback(null);
          });
        }
      }
    });
    this.restoreDefaultMapClickEvent();
  };

  /*
   * Builds map base controls and return array with these controls
   * (zoom +, zoom -, zoom box, zoom max, pan, attribution)
   * mapCfg is the map configuration object
   */
  function buildBaseControls(mapCfg)
  {
    // zoom in DOM elements
    var zoomInImg = document.createElement('img')
    zoomInImg.src = 'image/webgis/plus.png';

    var zoomInSpan = document.createElement('span');
    zoomInSpan.appendChild(zoomInImg);

    // zoom out DOM elements
    var zoomOutImg = document.createElement('img')
    zoomOutImg.src = 'image/webgis/minus.png';

    var zoomOutSpan = document.createElement('span');
    zoomOutSpan.appendChild(zoomOutImg);

    // zoom box DOM elements
    var zoomBoxImg = document.createElement('img')
    zoomBoxImg.src = 'image/webgis/zoomBox.png';

    var zoomBoxBtn = document.createElement('button');
    zoomBoxBtn.appendChild(zoomBoxImg);
    zoomBoxBtn.addEventListener(
      'click',
      null,
      false
    );

    var zoomBoxDiv = document.createElement('div');
    zoomBoxDiv.className = 'custom-zoomBox ol-unselectable ol-control';
    zoomBoxDiv.appendChild(zoomBoxBtn);

    // map attribution DOM elements
    var attrImg = document.createElement('img')
    attrImg.src = 'image/webgis/info.png';

    var attrSpan = document.createElement('span');
    attrSpan.appendChild(attrImg);


    // create zoom +/- control
    var ctrlZoom = new ol.control.Zoom({
      className: 'custom-zoom',
      target: document.getElementById('mapBaseCtrl'),
      zoomInLabel: zoomInSpan,
      zoomOutLabel: zoomOutSpan
    });

    // create scale control
    var ctrlScale = new ol.control.ScaleLine({
      target: document.getElementById('mapCoords'),
      className: 'custom-scale-line'
    });

    // create mouse position control
    var ctrlMousePosition = new ol.control.MousePosition({
      target: document.getElementById('mapCoords'),
      className: 'custom-mouse-position',
      coordinateFormat: self.customCoordFormat(),
      undefinedHTML: ''
    });

    // create attribution control
    var ctrlAttr = new ol.control.Attribution({
      className: 'custom-attribution ol-attribution', //TODO ol-attribution
      target: document.getElementById('mapAttr'),
      label: attrSpan,
      collapseLabel: "<<",
      collapsed: true
    });

    // return control array
    return arrayCtrl = [
      ctrlZoom,
      new ZoomToExtControl({
        extent: self.mapBbox
      }),
      new DragZoomControl(),
      ctrlScale,
      ctrlMousePosition,
      ctrlAttr
    ];
  }

  /*
   * Reset all service/private variables to default value.
   */
  function reset()
  {
    wgConfig = null;
    printCfg = null;
    userStyles = {};
    upgradableLayers = {};
    mapPopupOverlay = null;
    mapMarkerOverlay = null;
    mapTooltipOverlay = null;
    mapPopupCloser = null;
    mapPopupContent = null;
    mapPopupContainer = null;
    mapTooltipContainer = null;

    boxSelectInt = null;
    clickSelectInt = null;
    selectedFeatures = null;

    modifyInt    = null;
    drawInt      = null;
    drawHoleInt  = null;
    transformInt = null;
    snapInt      = null;

    self.map = null;
    self.mapBbox = null;
    self.initBbox = null;
    self.mapView = null
    self.arrayCtrl = null;
    self.mapCurrSR = null;
    self.currScale = null;
    self.overviewLayer = null;
    self.pointZoomLevel = null;
    self.mapDefaultSRId = null;
    self.currBaseLayerId = null;
    self.projObj = {};
    self.resolutions = [];
    self.layersCfgObj = {};
    self.categoriesArray = {};
    self.queryableLayerArr = [];
    self.selectableLayerIdArr = [];
    self.editableLayerIdArr = [];
    self.hoverLayerIdArr = [];
    self.initLayerIdOrder = [];
    self.editCfg = {};

    self.searchConfig = {
      source: null,
      features: [],
      selectedTab: 0,
      layer_searched: '',
      interaction: null
    };

    self.serviceMapConfig = {
      'category': {
        id: 'idCatWMSLayer',
        label: 'WEBGIS.LAYER.CAT_WMS_ADDED',
        layers:[]
      },
      'services': []
    };
  };
}

/*
 * Runtime layer filter builder (filter related to logged user)
 *
 * This is a base implementation that must be implemented with a decorator
 * before being used
 */
function wgFilterBuilderSvc()
{
  this.build = function(opt, callback)
  {
    console.warn("wgFilterBuilderSvc: " +
      "'build' function must be implemented with decorator pattern !");

    callback(null);
  };
}


/*
 * Runtime layer styles retriever (styles related to logged user)
 *
 * This is a base implementation that must be implemented with a decorator
 * before being used
 */
function wgRetrieveStylesSvc()
{
  this.retrieve = function(opt, callback)
  {
    callback(null);
  };
}


/*
 * Runtime layer simple search builder
 * (on some layer needed a simple search with advanced functionality)
 *
 * This is a base implementation that must be implemented with a decorator
 * before being used
 */
function wgSearchSvc(wgMapSvc)
{
  /*
   * Build the configuration for advanced search
   */
  this.buildAdvancedConfigSearch = function(layerId,callback)
  {
    var cfgArray = [];
    var searchParams = wgMapSvc.layersCfgObj[layerId].searchable.params;

    for (var idx=0; idx<searchParams.length; idx++)
    {
      var cfgObj = {};

      // clone searchParam item into cfgObj
      $.extend(cfgObj, searchParams[idx]);

      if(cfgObj.type)
      {
        //Set operators according to the type
        switch(cfgObj.type)
        {
          case "text":
          case "string":
            cfgObj.operators = ["EQ", "ILIKE","NEQ"];
            break;

          case "date":
          case "datetime":
          case "time":
            cfgObj.operators = ["EQ", "LT", "GT"];
            break;

          case "number":
            cfgObj.operators = ["EQ", "LT", "GT"];
            break;

          default:
            cfgObj.operators = ["EQ", "NEQ"];
            break;
        }
      }
      else
      {
        // TODO manage error
        ;
      }

      cfgArray.push(cfgObj);
    }

    callback(cfgArray);
  }

  /*
   * Build filter for layer simple search
   */
  this.buildSimpleSearchFilter = function(layerId, valueToSearch, callback)
  {
    // retrieve search configuration object for selected layer
    var searchCfg = wgMapSvc.layersCfgObj[layerId].searchable.params;

    // retrieve layer configuration for selected layer
    var layerCfg = wgMapSvc.layersCfgObj[layerId];

    // retrieve source configuration from layer queried
    var sourceCfg = layerCfg.source;

    var filterArray = [];
    var itemsArray = [];

    // build filterArray cycling on searchCfg object
    $.each(searchCfg, function(i, obj)
    {
      var objFilter = {};
      var value    = null;
      var operator = null;

      switch(obj.type)
      {
        case "string":
        case "text":
        case "combo":
          operator = "ILIKE"; // no case sensitive like
          value = "%" + valueToSearch  + "%";

          break;

        case "number":
        case "int":
          operator = "EQ";
          value = valueToSearch;
          break;

        default:
          console.error("Type " + obj.type + " not managed yet in search!");
      }

      if (operator && value)
      {
        itemsArray.push({id:obj.id, op:operator, val:value});
      }
    });

    // return type syntax is different from VECTOR or GEOJSON source
    //
    // in simple search, the inputed values is searched in all attributes
    // configured for the layer -> we have to use OR condition
    switch(sourceCfg.type)
    {
      case 'VECTOR':
        for (var idx=0; idx<itemsArray.length; idx++)
        {
          filterArray.push(wgMapSvc.buildFilter({
            property_name: itemsArray[idx].id,
            operator: itemsArray[idx].op,
            property_val: itemsArray[idx].val
          }));
        }
        callback({filterArray:filterArray, operator:"OR"});
        break;

      case 'GEOJSON':
        for (var idx=0; idx<itemsArray.length; idx++)
        {
          filterArray.push(
            itemsArray[idx].id+"|"+itemsArray[idx].op+"|"+itemsArray[idx].val
          );
        }
        callback({rules:filterArray, groupOp:"OR"});
        break;
    }
  }
}


function wgLayerTreeSvc(rwHttpSvc)
{
  this.wgLayerTypes = null;

   /*  Array for style's object type used to configure fields to show in style
    *  tab (in wgLayersTreeCtrl).
    *  Every field can have one of these types:
    *    - text: the value will be insert into a text box;
    *    - combo: the value will be selected into a select; must be defined options;
    *    - boolean: the value will be selected into a select with true or false;
    *    - colorPicker: the value will be selected using a color picker
    *    - image: The item permit to upload an image or to delete;
    *             The value is the url of an uploaded image;
    *    - fillPatternPopup: the value will be selected from images into popup (TODO - to finish);
    *
    * Some style attributes can have 'dependFromFeature' property:
    *  - if true, the user can define the value selecting feature's attribute
    *    from a popup (showed by a popup button).
    *  - if false, the popup's button is hide;
  */
  this.stylesTypesArray =
  [
    {
      id:"circle",name:"WEBGIS.STYLE.CIRCLE",attributes:
      [
        {id:"radius",label:"WORDS.RADIUS", type:"text", dependFromFeature:true},
        {id:"strokeWidth",label:"WEBGIS.STYLE.STROKE_WIDTH",type:"text", dependFromFeature:true},
        {id:"strokeColor",label:"WEBGIS.STYLE.STROKE_COLOR",type:"colorPicker"},
        {id:"fillColor",label:"WEBGIS.STYLE.FILL_COLOR",type:"colorPicker"},
        {id:"geometry",label:"WEBGIS.STYLE.APPLY_STYLE_TO",type:"combo",
          options:[
            {id:"center",name:"WEBGIS.STYLE.CENTER"},
            {id:"vertex",name:"WEBGIS.STYLE.VERTEX"}]
        }
      ]
    },
    {
      id:"line",name:"WEBGIS.STYLE.LINE",attributes:
      [
        {id:"strokeWidth",label:"WEBGIS.STYLE.STROKE_WIDTH",type:"text",dependFromFeature:true},
        {id:"strokeColor",label:"WEBGIS.STYLE.STROKE_COLOR",type:"colorPicker"}
      ]
    },
    {
      id:"poly",name:"WEBGIS.STYLE.POLYGON",attributes:
      [
        {id:"strokeWidth",label:"WEBGIS.STYLE.STROKE_WIDTH",type:"text",dependFromFeature:true},
        {id:"strokeColor",label:"WEBGIS.STYLE.STROKE_COLOR",type:"colorPicker"},
        {id:"fillColor",label:"WEBGIS.STYLE.FILL_COLOR",type:"colorPicker"}
      ]
    },
//TODO Finish this type management     {
//       id:"polyWithPattern",name:"WEBGIS.STYLE.POLY_WITH_PATTERN",attributes:
//       [
//         // FillPattern attributes
//         {id:"fillPattern", label:"Pattern", type:"fillPatternPopup"},
//         {id:"fillPatternSize",type:"text"},
//         {id:"fillPatternSpacing",type:"text"},{id:"fillPatternAngle",type:"text"},
//         {id:"fillPatternOffset",type:"text"},{id:"fillPatternScale",type:"text"},
//         {id:"fillPatternColor",type:"colorPicker"},
//         {id:"fillPatternBackground",type:"colorPicker"}
//       ]
//     },
    {
      id:"text",name:"WEBGIS.STYLE.TEXT",attributes:
      [
        {id:"minScale",label:"WEBGIS.STYLE.VISIBLE_UNTIL_TO",type:"text"},
        {id:"maxScale",label:"WEBGIS.STYLE.VISIBLE_FROM",type:"text"},
        {id:"strokeColor",label:"WEBGIS.STYLE.STROKE_COLOR",type:"colorPicker"},
        {id:"fillColor",label:"WEBGIS.STYLE.FILL_COLOR",type:"colorPicker"},
        {id:"strokeWidth",label:"WEBGIS.STYLE.STROKE_WIDTH",type:"text",dependFromFeature:true},
        {id:"font",label:"Font",type:"combo",
          options:[
            {id:"7px sans-serif",name:"7px"},
            {id:"8px sans-serif",name:"8px"},
            {id:"9px sans-serif",name:"9px"},
            {id:"10px sans-serif",name:"10px"},
            {id:"11px sans-serif",name:"11px"},
            {id:"12px sans-serif",name:"12px"},
            {id:"13px sans-serif",name:"13px"},
            {id:"14px sans-serif",name:"14px"}]}, //TODO Options for fonts
        {id:"text",label:"WORDS.TEXT",type:"text",dependFromFeature:true},
        {id:"placement", label:"WEBGIS.STYLE.PLACEMENT", type:"combo",options:[
          {id:"point",name:"WEBGIS.STYLE.POINT"},{id:"line",name:"WEBGIS.STYLE.LINE"}]},
        {id:"offsetX",label:"WEBGIS.STYLE.OFFSET_X",type:"text"},
        {id:"offsetY",label:"WEBGIS.STYLE.OFFSET_Y",type:"text"},
        {id:"overflow", label:"WEBGIS.STYLE.OVERFLOW", type:"combo",options:[
          {id:true,name:"WORDS.YES"},{id:false,name:"WORDS.NO"}]},
        {id:"textAlign",label:"WEBGIS.STYLE.TEXT_ALIGN", type:"combo",options:[
          {id:"left", name:"WEBGIS.STYLE.LEFT"},
          {id:"right", name:"WEBGIS.STYLE.RIGHT"},
          {id:"center", name:"WEBGIS.STYLE.CENTER"},
          {id:"end", name:"WEBGIS.STYLE.END"},
          {id:"start", name:"WEBGIS.STYLE.START"}
        ]},
        {id:"textBaseline",label:"WEBGIS.STYLE.TEXT_BASELINE", type:"combo",options:[
          {id:"bottom", name:"WEBGIS.STYLE.BOTTOM"},
          {id:"top", name:"WEBGIS.STYLE.TOP"},
          {id:"middle", name:"WEBGIS.STYLE.MIDDLE"},
          {id:"alphabetic", name:"WEBGIS.STYLE.ALPHABETIC"},
          {id:"hanging", name:"WEBGIS.STYLE.HANGING"},
          {id:"ideographic", name:"WEBGIS.STYLE.IDEOGRAPHIC"}
        ]}
      ]
    },
    {
      id:"image",name:"WEBGIS.STYLE.IMAGE",attributes:
      [
        {id:"src",label:"WORDS.IMAGE",type:"image"},
        {id:"geometry",label:"WEBGIS.STYLE.APPLY_STYLE_TO",type:"combo",
          options:[
            {id:"center",name:"WEBGIS.STYLE.CENTER"},
            {id:"vertex",name:"WEBGIS.STYLE.VERTEX"}]
        },
        {id:"anchorX",label:"WEBGIS.STYLE.OFFSET_X",type:"text",dependFromFeature:true},
        {id:"anchorY",label:"WEBGIS.STYLE.OFFSET_Y",type:"text",dependFromFeature:true}
      ]
    },
    {
      id:"shape",name:"WEBGIS.STYLE.SHAPE",attributes:
      [
        {id:"points",label:"WEBGIS.STYLE.POINTS_REGULAR_POLYGON",type:"text"},
        {id:"radius",label:"WEBGIS.STYLE.RADIUS_REGULAR_POLYGON",type:"text",dependFromFeature:true},
        {id:"rotation",label:"WEBGIS.STYLE.ROTATION_REGULAR_POLYGON",type:"text"},
        {id:"angle",label:"WEBGIS.STYLE.ANGLE_REGULAR_POLYGON",type:"text"},
        {id:"strokeWidth",label:"WEBGIS.STYLE.STROKE_WIDTH",type:"text"},
        {id:"strokeColor",label:"WEBGIS.STYLE.STROKE_COLOR",type:"colorPicker"},
        {id:"fillColor",label:"WEBGIS.STYLE.FILL_COLOR",type:"colorPicker"}
      ]
    }
  ];

  // Return styleTypes object according to the defined name
  this.getStylesTypesForName = function(name)
  {
    var res = null;
    if(name == undefined)
      return res;

    for(var i=0,found = false; i< this.stylesTypesArray.length && !found; i++)
    {
      var style = this.stylesTypesArray[i];
      if(style.id == name)
      {
        found = true;
        res = style;
      }
    }
    return res;
  }

  /*
  * Return the layer types array
  */
  this.getLayerTypes = function(callback)
  {
    if(this.wgLayerTypes)
      callback(this.wgLayerTypes);
    else
    {
      var self = this;
      var url = "/wgLayerImage/master";
      rwHttpSvc.get(url,function(res)
      {
        if(res && res.result)
          self.wgLayerTypes = res.result;
        else
          self.wgLayerTypes = [];

        callback(self.wgLayerTypes);
      });
    }
  }
}
/*
 * Extend OL controls
 */
// create custom control to execute zoomToExtent
var ZoomToExtControl = function(opt_options)
{
  var options = opt_options || {};

  var self = this;

  // function to set the map extent
  self.setExtent = function(ext) {
    options.extent = ext;
  }

  // function to zoom to map extent
  var zoomToExt = function() {
    if (options.extent)
    {
      var view = self.getMap().getView();
      view.fit(options.extent);
    }
  };

  var zoomToExtImg = document.createElement('img')
  zoomToExtImg.src = 'image/webgis/zoomAll.png';

  var zoomToExtBtn = document.createElement('button');
  zoomToExtBtn.appendChild(zoomToExtImg);

  // listener on zoomBox button
  zoomToExtBtn.addEventListener('click', zoomToExt, false);

  var zoomToExtDiv = document.createElement('div');
  zoomToExtDiv.className = 'custom-zoomToExtent ol-unselectable ol-control';
  zoomToExtDiv.appendChild(zoomToExtBtn);

  ol.control.Control.call(this, {
    target: document.getElementById('mapBaseCtrl'),
    element: zoomToExtDiv
  });
};

// create custom control to manage dragZoom interaction
var DragZoomControl = function(opt_options)
{
  var options = opt_options || {};

  var self = this;

  // dragZoom interaction
  var dragZoomInteraction = new ol.interaction.DragZoom({
    condition: ol.events.condition.always
  });

  // function to add dragZoom interaction
  var addDragZoomInteraction = function() {
    self.getMap().addInteraction(dragZoomInteraction);
  };

  // function to remove dragZoom interaction
  var removeDragZoomInteraction = function() {
    self.getMap().removeInteraction(dragZoomInteraction);
  };

  var zoomBoxImg = document.createElement('img')
  zoomBoxImg.src = 'image/webgis/zoomBox.png';

  var zoomBoxBtn = document.createElement('button');
  zoomBoxBtn.appendChild(zoomBoxImg);

  // listener on zoomBox button
  zoomBoxBtn.addEventListener('click', addDragZoomInteraction, false);

  //listener on draw zoom box end
  dragZoomInteraction.addEventListener('boxend', removeDragZoomInteraction, false);

  var zoomBoxDiv = document.createElement('div');
  zoomBoxDiv.className = 'custom-zoomBox ol-unselectable ol-control';
  zoomBoxDiv.appendChild(zoomBoxBtn);

  ol.control.Control.call(this, {
    target: document.getElementById('mapBaseCtrl'),
    element: zoomBoxDiv
  });
};

ol.inherits(ZoomToExtControl, ol.control.Control);
ol.inherits(DragZoomControl, ol.control.Control);
