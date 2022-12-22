/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("webgis").controller("wgEditCtrl",wgEditCtrl);

function wgEditCtrl($scope, $rootScope, rwAuthSvc, wgMapSvc, rwHttpSvc, $translate)
{
  // options for combo layers
  var layerEditableOption = [];

  // Edited layer id
  var layerId = null;

  // selected layer geometry type
  var layerTypeGeom = null;

  // OL layer to edit
  var layerOL = null;

  // OL select interaction used to modify and delete features
  var selectInteraction = null;

  // scope of wgMapCtrl
  var parentScope = angular.element('#mapDiv').scope();

  // variable to create shortcut to form elements
  var selLyr = null;

  var fgTypeGeom     = null;
  var btnEditPoint   = null;
  var btnEditLine    = null;
  var btnEditPolygon = null;

  var fgEdit         = null;
  var rowEditPoint   = null;
  var rowEditLine    = null;
  var rowEditPolygon = null

  var btnAdd   = null;
  var btnMod   = null;
  var btnDel   = null;
  var btnSave  = null;
  var btnGoto  = null;
  var btnReset = null;

  var btnPolyHole    = null;
  var btnPolyDelHole = null;

  var drawInt     = null;
  var drawHoleInt = null;

  // put map service into scope variable to observe its variables
  $scope.mapService = wgMapSvc;

  // support variable to discern if goto button is pressed
  $scope.gotoPressed = false;

  // configuration object for info and alert messages
  $scope.info_alert = {};

  // info & alert management function
  $scope.showInfoAlert = function(cfg)
  {
    $scope.info_alert.msg   = cfg.msg;
    $scope.info_alert.style = cfg.style;
  }

  // object binded to edit form
  $scope.editObj = {};

  // callback function to manage some form field change
  var editOnChange = function (key, nv, ov)
  {
    if (key == 'editPoint')
    {
      manageEditPointBtn();
    }
    else if (key == 'editLine')
    {
      manageEditLineBtn();
    }
    else if (key == 'editPolygon')
    {
      manageEditPolygonBtn();
    }
  };

  // layer edit form configuration
  $scope.editFormCfg =
  {
    id: "editForm", changeCallback:editOnChange, fg:
    [
      {
        show: true, label: "WEBGIS.SELECT_TO_EDIT", rows:
        [
          [
            {
              id: "layerEditable",
              type: "select",
              width: 12,
              height: "input-sm",
              options: [],
              required: false, enabled: true, show: true
            }
          ]
        ]
      },
      {
        show: false, label:"WEBGIS.SELECT_GEOM_TYPE_TO_EDIT", rows:
        [
          [
            {
              id: "editPoint",
              type: "genButton",
              src: "image/webgis/point.png",
              btnlabel:"WEBGIS.POINT",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "editLine",
              type: "genButton",
              src: "image/webgis/line.png",
              btnlabel:"WEBGIS.LINE",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "editPolygon",
              type: "genButton",
              src: "image/webgis/polygon.png",
              btnlabel:"WEBGIS.POLYGON",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]
        ]
      },
      {
        show: false, label:"", rows:
        [
          [// row to space edit buttons
            {
              id: "fake",
              type: "fake",
              width: 12,
              height: "input-sm",
              show: true
            }
          ],
          [
            { // fake field to center row content
              id: "fake",
              type: "fake",
              width: 1,
              height: "input-sm",
              show: true
            },
            {
              id: "addFeature",
              type: "imgButton",
              src: "image/webgis/add.png",
              title:"WEBGIS.ADD_FEATURE",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "modFeature",
              type: "imgButton",
              src: "image/webgis/move.png",
              title: "WEBGIS.MOD_FEATURE",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "delFeature",
              type: "imgButton",
              src: "image/webgis/delete.png",
              title: "WEBGIS.DEL_FEATURE",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "saveFeature",
              type: "imgButton",
              src: "image/webgis/save.png",
              title: "WEBGIS.SAVE_FEATURE",
              width: 2,
              height: "input-sm",
              required: false, enabled: false, show: false
            },
            {
              id: "gotoFeaturePanel",
              type: "imgButton",
              src: "image/webgis/stopEdit.png",
              title: "WEBGIS.GOTO_FT_PANEL",
              width: 2,
              height: "input-sm",
              required: false, enabled: false, show: false
            },
            {
              id: "reset",
              type: "imgButton",
              src: "image/webgis/reset.png",
              title: "WEBGIS.EDIT_RESET",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ],
          [
            { // fake field to center row content
              id: "fake",
              type: "fake",
              width: 1,
              height: "input-sm",
              show: true
            },
            {
              id: "addFeature",
              type: "imgButton",
              src: "image/webgis/add.png",
              title:"WEBGIS.ADD_FEATURE",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "modFeature",
              type: "imgButton",
              src: "image/webgis/modify.png",
              title: "WEBGIS.MOD_FEATURE",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "delFeature",
              type: "imgButton",
              src: "image/webgis/delete.png",
              title: "WEBGIS.DEL_FEATURE",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "saveFeature",
              type: "imgButton",
              src: "image/webgis/save.png",
              title: "WEBGIS.SAVE_FEATURE",
              width: 2,
              height: "input-sm",
              required: false, enabled: false, show: false
            },
            {
              id: "gotoFeaturePanel",
              type: "imgButton",
              src: "image/webgis/stopEdit.png",
              title: "WEBGIS.GOTO_FT_PANEL",
              width: 2,
              height: "input-sm",
              required: false, enabled: false, show: false
            },
            {
              id: "reset",
              type: "imgButton",
              src: "image/webgis/reset.png",
              title: "WEBGIS.EDIT_RESET",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ],
          [
            /*{ // fake field to center row content
              id: "fake",
              type: "fake",
              width: 3,
              height: "input-sm",
              show: true
            },*/
            {
              id: "addFeature",
              type: "imgButton",
              src: "image/webgis/add.png",
              title:"WEBGIS.ADD_FEATURE",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "modFeature",
              type: "imgButton",
              src: "image/webgis/modifyPolygon.png",
              title: "WEBGIS.MOD_FEATURE",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "holeFeature",
              type: "imgButton",
              src: "image/webgis/holePolygon.png",
              title: "WEBGIS.HOLE_FEATURE",
              width: 2,
              height: "input-sm",
              required: false, enabled: false, show: false
            },
            {
              id: "delHoleFeature",
              type: "imgButton",
              src: "image/webgis/removeHolePolygon.png",
              title: "WEBGIS.DEL_HOLE_FEATURE",
              width: 2,
              height: "input-sm",
              required: false, enabled: false, show: false
            },
            {
              id: "delFeature",
              type: "imgButton",
              src: "image/webgis/delete.png",
              title: "WEBGIS.DEL_FEATURE",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "saveFeature",
              type: "imgButton",
              src: "image/webgis/save.png",
              title: "WEBGIS.SAVE_FEATURE",
              width: 2,
              height: "input-sm",
              required: false, enabled: false, show: false
            },
            {
              id: "gotoFeaturePanel",
              type: "imgButton",
              src: "image/webgis/stopEdit.png",
              title: "WEBGIS.GOTO_FT_PANEL",
              width: 2,
              height: "input-sm",
              required: false, enabled: false, show: false
            },
            {
              id: "reset",
              type: "imgButton",
              src: "image/webgis/reset.png",
              title: "WEBGIS.EDIT_RESET",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  };


  // shortcut to form elements
  selLyr = $scope.editFormCfg.fg[0].rows[0][0];

  fgTypeGeom     = $scope.editFormCfg.fg[1];
  btnEditPoint   = fgTypeGeom.rows[0][0];
  btnEditLine    = fgTypeGeom.rows[0][1];
  btnEditPolygon = fgTypeGeom.rows[0][2];

  fgEdit         = $scope.editFormCfg.fg[2];
  rowEditPoint   = fgEdit.rows[1];
  rowEditLine    = fgEdit.rows[2];
  rowEditPolygon = fgEdit.rows[3];


  /*
   * Get from map service JSON configuration object
   */
  wgMapSvc.getConfig(function(res)
  {
    // set edit process mode
    if (!wgMapSvc.editCfg.editProcess)
      wgMapSvc.editCfg.editProcess = wgMapSvc._GIS_EDIT_PROCESS_;

    // Populate combo of editable layers
    for (var idx=0; idx<wgMapSvc.editableLayerIdArr.length; idx++)
    {
      var lyrId = wgMapSvc.editableLayerIdArr[idx];

      var layer = wgMapSvc.layersCfgObj[lyrId];

      var layerName = "";

      if (layer.id_parent)
      {
        var parentCfg = wgMapSvc.layersCfgObj[layer.id_parent];
        layerName = $translate.instant(parentCfg.label) + " - ";
      }

      layerName += $translate.instant(layer.label);

      layerEditableOption.push({
        "id":   layer.id,
        "name": layerName
      });
    }

    selLyr.options = layerEditableOption;
  });

  /*
   * Watch on editCfg map service variable
   */
  $scope.$watch("mapService.editCfg", function (nv, ov)
  {
    if(!nv)
      return;

    // edit process originated from extern of gis tools panel
    if (nv.editProcess == wgMapSvc._EXTERN_EDIT_PROCESS_)
    {
      var foundLayer = false;

      // set combo value, disable and hide it
      for (var idx=0; idx<layerEditableOption.length; idx++)
      {
        if (layerEditableOption[idx].id == nv.layerId)
        {
          $scope.editObj.layerEditable = nv.layerId;
          $scope.editFormCfg.fg[0].show = false;
          foundLayer = true;
//           layerId = nv.layerId
          break;
        }
      }

      if(!foundLayer)
      {
        $scope.gotoPressed = true;

        // invoke parent scope to close edit tools panel
        parentScope.getControl({id:'edit', tip:'WEBGIS.TLP.CTRL_EDIT'});

        // invoke callback associated to openGisEditPanelEvent event
        wgMapSvc.editCfg.callback();
      }
      else
        $scope.info_alert.msg = null;
    }

  });

  /*
   * Watch on editable layers combo
   */
  $scope.$watch("editObj.layerEditable", function (nv, ov)
  {
    if(!nv)
      return;

    // set layer Id
    layerId = nv;

    wgMapSvc.editCfg.layerId = layerId;

    // retrieve OpenLayers layer
    layerOL = wgMapSvc.layersCfgObj[layerId].layerOL;

    // light on layer
    wgMapSvc.manageLayerVisibility(layerId,true);

    // clear edit layer
    wgMapSvc.clearEditLayer();

    // retrieve geometry type
    if (wgMapSvc.editCfg.mode == wgMapSvc.editModeModify)
    {
      // in modify mode, if layer has geometry type equals to Geometry
      // we have to find edited feature geometry type to enable right edit button
      if (wgMapSvc.layersCfgObj[layerId].geometry_type == 'Geometry')
      {
        var ft = wgMapSvc.editCfg.features[0];

        var ftGeom = ft.getGeometry();

        if (ftGeom instanceof ol.geom.Point ||
            ftGeom instanceof ol.geom.MultiPoint)
        {
          fgTypeGeom.show = true;

          manageEditPointBtn();
        }
        else if (ftGeom instanceof ol.geom.LineString ||
                 ftGeom instanceof ol.geom.MultiLineString)
        {
          fgTypeGeom.show = true;

          manageEditLineBtn();
        }
        else if (ftGeom instanceof ol.geom.Polygon ||
                 ftGeom instanceof ol.geom.MultiPolygon)
        {
          fgTypeGeom.show = true;

          manageEditPolygonBtn();
        }
        else
        {
          fgTypeGeom.show = false;
          console.err("geometry type not managed!");
        }
      }
      else
      {
        layerTypeGeom = wgMapSvc.layersCfgObj[layerId].geometry_type;

        manageLayerTypeGeom(layerTypeGeom);

        if (wgMapSvc.editCfg.editProcess == wgMapSvc._EXTERN_EDIT_PROCESS_)
        {
          enableEditModifyMode();
        }
        else
        {
          // TODO
        }
      }
    }
    else if (wgMapSvc.editCfg.mode == wgMapSvc.editModeInsert)
    {
      layerTypeGeom = wgMapSvc.layersCfgObj[layerId].geometry_type;

      if (layerTypeGeom == 'Geometry')
      {
        fgTypeGeom.show = true;

        btnEditPoint.enabled   = true;
        btnEditLine.enabled    = true;
        btnEditPolygon.enabled = true;
      }
      else
      {
        fgTypeGeom.show = false;

        manageLayerTypeGeom(layerTypeGeom);

        if (wgMapSvc.editCfg.editProcess == wgMapSvc._EXTERN_EDIT_PROCESS_)
        {
          enableEditInsertMode();
        }
        else
        {
          // TODO
        }
      }
    }

  });


  /*
   * watch on click on addFeature button
   */
  $scope.$watch("editObj.addFeature", function(nv, ov)
  {
    if (!nv)
      return;

    wgMapSvc.editCfg.mode = wgMapSvc.editModeInsert;

    btnSave.enabled = true;
    btnAdd.enabled = false;
    btnMod.enabled = false;
    btnDel.enabled = false;

    $scope.showInfoAlert({
      msg: "WEBGIS.ADD_FEATURE_MSG",
      style: "info"
    });

    // TODO show form entity attributes retrieved from layers configuration

    // enable edit
    wgMapSvc.addEditLayer();
    wgMapSvc.addDrawInteraction(layerTypeGeom);
    wgMapSvc.addModifyInteraction();
    wgMapSvc.addSnapInteraction();

    // enable add polygon hole button
    if (layerTypeGeom == "Polygon" ||
        layerTypeGeom == "MultiPolygon" ||
        layerTypeGeom == "Geometry")
      btnPolyHole.enabled = true;
  });

  /*
   * watch on click on holeFeature button
   */
  $scope.$watch("editObj.holeFeature", function(nv, ov)
  {
    if (!nv)
      return;

    btnPolyHole.enabled = false;

    $scope.showInfoAlert({
      msg: "WEBGIS.DRAW_HOLE_FEATURE_MSG",
      style: "info"
    });

    var drawHoleInt = wgMapSvc.addDrawHoleInteraction();

    drawHoleInt.on('drawend', function(e)
    {
      btnPolyHole.enabled = true;

      if (drawInt)
        drawInt.setActive(true);
    });

    if (selectInteraction)
    {
      wgMapSvc.map.removeInteraction(selectInteraction);

      selectInteraction = null;
    }
  });

  /*
   * watch on click on modFeature button
   */
  $scope.$watch("editObj.modFeature", function(nv, ov)
  {
    if (!nv)
      return;

    wgMapSvc.editCfg.mode = wgMapSvc.editModeModify;

    btnSave.enabled = true;
    btnAdd.enabled = false;
    btnMod.enabled = false;
    btnDel.enabled = false;

    $scope.showInfoAlert({
      msg: "WEBGIS.MOD_FEATURE_MSG",
      style: "info"
    });

    // (remove if already present)
    if (selectInteraction)
      wgMapSvc.map.removeInteraction(selectInteraction);

    // enable select tool
    // (in this case it's possible to select one feature at a time)
    selectInteraction = new ol.interaction.Select({
      layers:[layerOL],
      toggleCondition: ol.events.condition.never
    });

    // add select interaction to the map
    wgMapSvc.map.addInteraction(selectInteraction);

    // feature format for reading in geoJson format
    var geoJsonFormat = new ol.format.GeoJSON(
      {defaultDataProjection:'EPSG:' + wgMapSvc.mapCurrSR.code}
    );

    // create vector source for editing
    var editingSource = new ol.source.Vector({
      wrapX: false,
      format: geoJsonFormat
    });

    // enable edit (only modify and snap!)
    wgMapSvc.addEditLayer(editingSource);
    wgMapSvc.addModifyInteraction();
    wgMapSvc.addSnapInteraction();

    // action binded on feature selection
    selectInteraction.on('select', function (event) {
      // clear source from previous selected
      editingSource.clear();
      // clone selected feature to put it into editing source layer
      var ft = event.selected[0];
      var clone = ft.clone();
      clone.setId(ft.getId());
      // add feature to editing layer
      editingSource.addFeature(clone);
      // remove feature from selection
      selectInteraction.getFeatures().clear();

      // enable add polygon hole button
      if (layerTypeGeom == "Polygon" ||
          layerTypeGeom == "MultiPolygon" ||
          layerTypeGeom == "Geometry")
        btnPolyHole.enabled = true;
    });

    // TODO show form entity attributes retrieved from layers configuration
  });

  /*
   * watch on click on delFeature button
   */
  $scope.$watch("editObj.delFeature", function(nv, ov)
  {
    if (!nv)
      return;

    wgMapSvc.editCfg.mode = wgMapSvc.editModeDelete;

    btnSave.enabled = true;
    btnAdd.enabled = false;
    btnMod.enabled = false;
    btnDel.enabled = false;

    $scope.showInfoAlert({
      msg: "WEBGIS.DEL_FEATURE_MSG",
      style: "info"
    });

    // enable select tool (remove if already present)
    if (selectInteraction)
      wgMapSvc.map.removeInteraction(selectInteraction);

    selectInteraction = new ol.interaction.Select({
      layers:[layerOL]
    });

    // add select interaction to the map
    wgMapSvc.map.addInteraction(selectInteraction);
  });

  /*
   * watch on click on saveFeature button
   */
  $scope.$watch("editObj.saveFeature", function(nv, ov)
  {
    if (!nv)
      return;

    switch(wgMapSvc.editCfg.mode)
    {
      case wgMapSvc.editModeInsert:
        manageInsert();
        break;

      case wgMapSvc.editModeModify:
        manageModify();
        break;

      case wgMapSvc.editModeDelete:
        manageDelete();
        break;
    }
  });

  /*
   * watch on click on reset button
   */
  $scope.$watch("editObj.reset", function(nv, ov)
  {
    if (!nv)
      return;

    if (fgTypeGeom.show == true)
    {
      btnEditPoint.enabled   = true;
      btnEditLine.enabled    = true;
      btnEditPolygon.enabled = true;

      fgEdit.show = false;
    }

    reset();

    // restore panel initial status
    resetStatus();
  });

  /*
   * watch on click on gotoFeaturePanel button
   */
  $scope.$watch("editObj.gotoFeaturePanel", function(nv, ov)
  {
    if (!nv)
      return;

    $scope.gotoPressed = true;

    // invoke parent scope to close edit tools panel
    parentScope.getControl({id:'edit', tip:'WEBGIS.TLP.CTRL_EDIT'});

    // invoke callback associated to openGisEditPanelEvent event
    wgMapSvc.editCfg.callback();
  });

  /*
   * on controller destroy:
   *  - reset editCfg object (map service object)
   *  - reset editObj object
   *  - reset edit layer (in certain cases)
   */
  $scope.$on("$destroy", function()
  {
    wgMapSvc.editCfg = {};
    $scope.editObj = {};

    if (!$scope.gotoPressed)
    {
      // reset edit layer if controller isn't closed from goto button
      wgMapSvc.clearEditLayer();
      wgMapSvc.removeEditLayer();
      wgMapSvc.disableEdit();
    }
    else
    {
      // disable edit if controller is closed from goto button
      wgMapSvc.disableEdit();
    }

    $scope.gotoPressed = false;

    $scope.info_alert = {};

    if (selectInteraction)
    {
      wgMapSvc.map.removeInteraction(selectInteraction);

      selectInteraction = null;
    }

    layerId = null;
    layerOL = null;
  });

  /*
   * Manage new feature insert
   */
  function manageInsert()
  {
    // retrieve feature from edit layer
    var ft = wgMapSvc.getFeaturesFromEditLayer();

    if (ft && (ft.length == 0 || ft.length > 1))
    {
      $scope.showInfoAlert({
        msg: "WEBGIS.NO_FEATURE_TO_SAVE",
        style: "info"
      });

      return;
    }
    else
    {
      var geoJsonStr = wgMapSvc.convertFeaturesToGeoJSON(ft);
      var geom    = null;

      try
      {
        var geoJson = JSON.parse(geoJsonStr);
        geom = geoJson.features[0].geometry;
      }
      catch(e)
      {
        // show error message
        $scope.showInfoAlert({
          msg: "CORE_LBL.GEO_JSON_ERR",
          style: "info"
        });

        return;
      }

      var layerName = wgMapSvc.getLayerNameById(layerId);

      var opt = {
        geom: geom,
        srid: wgMapSvc.mapCurrSR.code,
        authId: rwAuthSvc.userInfo.authority_id,
        layer: layerName
      };

      // check if drawed feature is into user authority boundary
      // (if user has EDIT_MAP_WITH_FEATURE_LIMIT permission)
      wgMapSvc.validateFeatureInBoundary(opt, function(res)
      {
        if (res && res.message == "OUT_OF_BOUNDARY")
        {
          // show error message
          $scope.showInfoAlert({
            msg: "CORE_LBL.FEATURE_OUT_OF_BOUNDARY",
            style: "danger"
          });
        }
        else if (res && res.message == "INTERSECTION_ERROR")
        {
          // show error message
          $scope.showInfoAlert({
            msg: "CORE_LBL.INTERSECTION_ERROR",
            style: "danger"
          });
        }
        else
        {
          opt = {
            geom: geom,
            srid: wgMapSvc.mapCurrSR.code
          };

          // store feature
          rwHttpSvc.post("/wgEdit/insert?layer="+layerName, opt, function(res)
          {
            if (res && res.result)
            {
              // show success message
              $scope.showInfoAlert({
                msg: "CORE_LBL.SAVE_FEATURE_OK",
                style: "info"
              });

              // remove draw interactions
              wgMapSvc.disableEdit();

              // remove edit layer from map
              wgMapSvc.removeEditLayer();

              // restore panel initial status
              resetStatus();
            }
            else
            {
              // show error message
              $scope.showInfoAlert({
                msg: "CORE_LBL.SAVE_FEATURE_ERR",
                style: "info"
              });
            }
          });
        }
      });

    }
  }

  /*
   * Manage feature modify
   */
  function manageModify()
  {
    // retrieve geoJson of modifed feature
    var ft = wgMapSvc.getFeaturesFromEditLayer();

    if (ft && (ft.length == 0 || ft.length > 1))
    {
      $scope.showInfoAlert({
        msg: "WEBGIS.NO_FEATURE_TO_SAVE",
        style: "info"
      });

      return;
    }

    var geoJsonStr = wgMapSvc.convertFeaturesToGeoJSON(ft);
    var geom    = null;

    try
    {
      var geoJson = JSON.parse(geoJsonStr);
      geom = geoJson.features[0].geometry;
    }
    catch(e)
    {
      // show error message
      $scope.showInfoAlert({
        msg: "CORE_LBL.GEO_JSON_ERR",
        style: "info"
      });

      return;
    }

    // build object to post
    var layerName = wgMapSvc.getLayerNameById(layerId);

    // TODO add also feature attributes
    var opt = {
      geom: geom,
      srid: wgMapSvc.mapCurrSR.code,
      authId: rwAuthSvc.userInfo.authority_id,
      layer: layerName
    };

    // check if modified feature is into user authority boundary
    // (if user has EDIT_MAP_WITH_FEATURE_LIMIT permission)
    wgMapSvc.validateFeatureInBoundary(opt, function(res)
    {
      if (res && res.message == "OUT_OF_BOUNDARY")
      {
        // show error message
        $scope.showInfoAlert({
          msg: "CORE_LBL.FEATURE_OUT_OF_BOUNDARY",
          style: "danger"
        });
      }
      else if (res && res.message == "INTERSECTION_ERROR")
      {
        // show error message
        $scope.showInfoAlert({
          msg: "CORE_LBL.INTERSECTION_ERROR",
          style: "danger"
        });
      }
      else
      {
        opt = {
          geom: geom,
          srid: wgMapSvc.mapCurrSR.code,
          layer: layerName,
          gid: ft[0].getProperties().gid
        };

        // Update feature
        rwHttpSvc.post("/wgEdit/updateFeatures", opt, function(res)
        {
          if (res && res.result)
          {
            // remove draw interactions
            wgMapSvc.disableEdit();

            // remove edit layer from map
            wgMapSvc.removeEditLayer();

            // remove select interaction
            if (selectInteraction)
            {
              wgMapSvc.map.removeInteraction(selectInteraction);

              selectInteraction = null;
            }

            // restore panel initial status
            resetStatus();

            $scope.showInfoAlert({
              msg: "CORE_LBL.UPDATE_OK",
              style: "info"
            });
          }
          else
          {
            $scope.showInfoAlert({
              msg: "CORE_LBL.UPDATE_ERR",
              style: "danger"
            });
          }
        });
      }
    });

  }

  /*
   * Manage feature delete
   */
  function manageDelete()
  {
    // retrieve selected features
    var ftArr = selectInteraction.getFeatures().getArray();
    var ftGid = [];

    if (ftArr && ftArr.length == 0)
    {
      $scope.showInfoAlert({
        msg: "WEBGIS.NO_FEATURE_TO_DELETE",
        style: "info"
      });

      return;
    }

    // retrieve features gid
    for (var idx=0; idx<ftArr.length; idx++)
    {
      var ftProp = ftArr[idx].getProperties();

      if (ftProp)
        ftGid.push(ftProp.gid);
    }

    // build object to post
    var layerName = wgMapSvc.getLayerNameById(layerId);

    var opt = {
      layerName: layerName,
      ftId: ftGid
    };

    // delete feature
    rwHttpSvc.post("/wgEdit/deleteFeatures", opt, function(res)
    {
      if (res && res.result)
      {
        // show success message
        $scope.showInfoAlert({
          msg: "CORE_LBL.DELETE_FEATURE_OK",
          style: "info"
        });

        // remove interaction
        wgMapSvc.map.removeInteraction(selectInteraction);

        selectInteraction = null;

        // restore panel initial status
        resetStatus();
      }
      else
      {
        // show error message
        $scope.showInfoAlert({
          msg: "CORE_LBL.DELETE_FEATURE_ERR",
          style: "info"
        });
      }
    });
  }

  /*
   *
   */
  function reset()
  {
    // remove all draw interactions
    wgMapSvc.disableEdit();

    // remove edit layer from map
    wgMapSvc.removeEditLayer();

    // reset info message
    $scope.info_alert.msg = null;

//     layerId = null;
//     layerOL = null;
  }

  /*
   * Reset panel to initial status
   */
  function resetStatus()
  {
    // manage edit mode (insert/modify) if process is originated from extern of gis tools panel
    if (wgMapSvc.editCfg.editProcess == wgMapSvc._EXTERN_EDIT_PROCESS_)
    {
      btnSave.enabled = false;

      btnAdd.enabled = false;
      btnMod.enabled = false;
      btnDel.enabled = false;

      switch(wgMapSvc.editCfg.mode)
      {
        case wgMapSvc.editModeInsert:
          enableEditInsertMode();
          break;

        case wgMapSvc.editModeModify:
          // in modify mode, if layer has geometry type equals to Geometry
          // we have to find edited feature geometry type to enable right edit button
          if (wgMapSvc.layersCfgObj[layerId].type == 'Geometry')
          {
            var ft = wgMapSvc.editCfg.features[0];

            var ftGeom = ft.getGeometry();

            if (ftGeom instanceof ol.geom.Point ||
                ftGeom instanceof ol.geom.MultiPoint)
            {
              fgTypeGeom.show = true;

//               btnEditPoint.enabled   = true;
//               btnEditLine.enabled    = false;
//               btnEditPolygon.enabled = false;

              manageEditPointBtn();
            }
            else if (ftGeom instanceof ol.geom.LineString ||
                     ftGeom instanceof ol.geom.MultiLineString)
            {
              fgTypeGeom.show = true;

//               btnEditPoint.enabled   = false;
//               btnEditLine.enabled    = true;
//               btnEditPolygon.enabled = false;

              manageEditLineBtn();
            }
            else if (ftGeom instanceof ol.geom.Polygon ||
                     ftGeom instanceof ol.geom.MultiPolygon)
            {
              fgTypeGeom.show = true;

//               btnEditPoint.enabled   = false;
//               btnEditLine.enabled    = false;
//               btnEditPolygon.enabled = true;

              manageEditPolygonBtn();
            }
            else
            {
              fgTypeGeom.show = false;
              console.err("geometry type not managed yet!");
            }
          }

          enableEditModifyMode();
          break;
      }
    }
    else
    {
      btnSave.enabled = false;
    }
  }

  /*
   * function to manage form behaviour based on layer type geom
   */
  function manageLayerTypeGeom(layerTypeGeom)
  {
    switch(layerTypeGeom)
    {
      case 'Point':
      case 'MultiPoint':
        fgEdit.show     = true;
        rowEditPoint.show   = true;
        rowEditLine.show    = false;
        rowEditPolygon.show = false;

        btnAdd   = fgEdit.rows[1][1];
        btnMod   = fgEdit.rows[1][2];
        btnDel   = fgEdit.rows[1][3];
        btnSave  = fgEdit.rows[1][4];
        btnGoto  = fgEdit.rows[1][5];
        btnReset = fgEdit.rows[1][6];
        break;

      case 'LineString':
      case 'MultiLineString':
        fgEdit.show     = true;
        rowEditPoint.show   = false;
        rowEditLine.show    = true;
        rowEditPolygon.show = false;

        btnAdd   = fgEdit.rows[2][1];
        btnMod   = fgEdit.rows[2][2];
        btnDel   = fgEdit.rows[2][3];
        btnSave  = fgEdit.rows[2][4];
        btnGoto  = fgEdit.rows[2][5];
        btnReset = fgEdit.rows[2][6];
        break;

      case 'Polygon':
      case 'MultiPolygon':
        fgEdit.show     = true;
        rowEditPoint.show   = false;
        rowEditLine.show    = false;
        rowEditPolygon.show = true;

        btnAdd         = fgEdit.rows[3][0];
        btnMod         = fgEdit.rows[3][1];
        btnPolyHole    = fgEdit.rows[3][2];
        btnPolyDelHole = fgEdit.rows[3][3];
        btnDel         = fgEdit.rows[3][4];
        btnSave        = fgEdit.rows[3][5];
        btnGoto        = fgEdit.rows[3][6];
        btnReset       = fgEdit.rows[3][7];

        btnPolyHole.show    = true;
        //btnPolyDelHole.show = true;

        btnPolyHole.enabled    = false;
        btnPolyDelHole.enabled = false;
        break;

      case 'Geometry':
        fgEdit.show     = false;
        break;
    }

    // edit process is originated from gis tools panel
    if (wgMapSvc.editCfg.editProcess == wgMapSvc._GIS_EDIT_PROCESS_)
    {
      // in this case editMode is defined when user select an edit action

      // TODO

      if (btnSave)
      {
        btnSave.enabled = false;
        btnSave.show = true
      }

      if (btnGoto)
      {
        btnGoto.enabled = false;
        btnGoto.show = false;
      }
    }
    else if (wgMapSvc.editCfg.editProcess == wgMapSvc._EXTERN_EDIT_PROCESS_)
    {
      if (btnAdd)
        btnAdd.enabled = false;

      if (btnMod)
        btnMod.enabled = false;

      if (btnDel)
        btnDel.enabled = false;

      if (btnPolyHole)
        btnPolyHole.enabled = false;

      if (btnPolyDelHole)
        btnPolyDelHole.enabled = false;


      if (btnSave)
      {
        btnSave.enabled = false;
        btnSave.show = false
      }

      if (btnGoto)
      {
        btnGoto.enabled = true;
        btnGoto.show = true;
      }

      $scope.showInfoAlert({
        msg: "WEBGIS.GOTO_FEATURE_MSG",
        style: "info"
      });
    }
    else
    {
      console.error("editProcess mode not managed: " + wgMapSvc.editCfg.editProcess);
    }

  }

  /*
   *
   */
  function enableEditInsertMode()
  {
    wgMapSvc.addEditLayer();

    wgMapSvc.addModifyInteraction();

    drawInt = wgMapSvc.addDrawInteraction(layerTypeGeom);
    wgMapSvc.addSnapInteraction();

    if (btnPolyHole)
      btnPolyHole.enabled = false;

    // enable btn poly hole button
    drawInt.on('drawend', function(e)
    {
      // enable add polygon hole button
      if (layerTypeGeom == "Polygon" ||
          layerTypeGeom == "MultiPolygon" ||
          layerTypeGeom == "Geometry")
        btnPolyHole.enabled = true;
    });
  }

  /*
   *
   */
  function enableEditModifyMode()
  {
    // feature format for reading in geoJson format
    var geoJsonFormat = new ol.format.GeoJSON(
      {defaultDataProjection:'EPSG:' + wgMapSvc.mapCurrSR.code}
    );
    // create vector source for editing with retrieved feature
    var editingSource = new ol.source.Vector({
      wrapX: false,
      format: geoJsonFormat
    });

    // enable edit (only modify and snap!)
    wgMapSvc.addEditLayer(editingSource);
    wgMapSvc.addModifyInteraction();
    wgMapSvc.addTransformInteraction();
    wgMapSvc.addSnapInteraction();

    // clone selected feature to put it into editing source layer
    var ft = wgMapSvc.editCfg.features[0];
    var clone = ft.clone();

    var ftGeom = clone.getGeometry();

    clone.setId(ft.getId());
    // add feature to editing layer
    editingSource.addFeature(clone);

    // enable add polygon hole button
    if (layerTypeGeom == "Polygon" ||
        layerTypeGeom == "MultiPolygon" ||
        layerTypeGeom == "Geometry")
      btnPolyHole.enabled = true;
  }

  /*
   *
   */
  function manageEditPointBtn()
  {
    btnEditLine.enabled    = false;
    btnEditPolygon.enabled = false;

    layerTypeGeom = 'Point';

    manageLayerTypeGeom(layerTypeGeom);

    $scope.info_alert.msg = null;

    if (wgMapSvc.editCfg.editProcess == wgMapSvc._EXTERN_EDIT_PROCESS_)
    {
      switch(wgMapSvc.editCfg.mode)
      {
        case wgMapSvc.editModeInsert:
          enableEditInsertMode();
          break;

        case wgMapSvc.editModeModify:
          enableEditModifyMode();
          break;
      }
    }
    else
    {
      // TODO
    }
  }

  /*
   *
   */
  function manageEditLineBtn()
  {
    btnEditPoint.enabled   = false;
    btnEditPolygon.enabled = false;

    layerTypeGeom = 'LineString';

    manageLayerTypeGeom(layerTypeGeom);

    $scope.info_alert.msg = null;

    if (wgMapSvc.editCfg.editProcess == wgMapSvc._EXTERN_EDIT_PROCESS_)
    {
      switch(wgMapSvc.editCfg.mode)
      {
        case wgMapSvc.editModeInsert:
          enableEditInsertMode();
          break;

        case wgMapSvc.editModeModify:
          enableEditModifyMode();
          break;
      }
    }
    else
    {
      // TODO
    }
  }

  /*
   *
   */
  function manageEditPolygonBtn()
  {
    btnEditPoint.enabled = false;
    btnEditLine.enabled  = false;

    layerTypeGeom = 'Polygon';

    manageLayerTypeGeom(layerTypeGeom);

    $scope.info_alert.msg = null;

    if (wgMapSvc.editCfg.editProcess == wgMapSvc._EXTERN_EDIT_PROCESS_)
    {
      switch(wgMapSvc.editCfg.mode)
      {
        case wgMapSvc.editModeInsert:
          enableEditInsertMode();
          break;

        case wgMapSvc.editModeModify:
          enableEditModifyMode();
          break;
      }
    }
    else
    {
      // TODO
    }
  }
}
