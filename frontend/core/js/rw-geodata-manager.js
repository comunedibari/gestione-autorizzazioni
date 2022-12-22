/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

/*
 * directive config object syntax:
 *
 * {
 *   multiple:      bool value to configure 1:n relation between features and
 *                  its parent object
 *   subTitle:      main widget label
 *   addShpLabel:   add shapefile button label
 *   addDrawLabel:  draw feature button label
 *   formCfg:       json form (with feature attributes) configuration
 *                  the form id is generated into directive
 *   editLbl:       editing feature button label
 *   saveLbl:       save/update feature button label
 *   downloadLbl:   download shapefile feature button label
 *   deleteLbl:     remove feature button label
 *   zoomToLbl:     zoom to button label
 *   showBtnEdit:   bool value to show/hide edit feature button
 *   showBtnSave:   bool value to show/hide save/update feature button
 *   showBtnDown:   bool value to show/hide download shapefile button
 *   showBtnDel:    bool value to show/hide remove feature button
 *   showBtnZoomTo: bool value to show/hide zoom to feature button
 *   onBeginDraw:   name of function defined to execute custom action
 *                  first to begin to draw feature
 *   onEndDraw:     name of function defined to execute custom action
 *                  at the end of the feature drawing
 *   storeShpUrl:   url to save shapefile
 *                  (this url may depend from the feature; in this case must be
 *                  determineted at runtime)
 *   storeDrawUrl:  url to save drawed feature
 *                  (this url may depend from the feature; in this case must be
 *                  determineted at runtime)
 *   delUrl:        url to remove feature
 *                  (this url may depend from the feature; in this case must be
 *                  determineted at runtime)
 *   updUrl:        url to update feature
 *                  (this url may depend from the feature; in this case must be
 *                  determineted at runtime)
 *   downloadUrl:   url to download feature shapefile
 *                  (this url may depend from the feature; in this case must be
 *                  determineted at runtime)
 *   layerName:     feature layer name (on mapserver)
 *   layerIdField:  feature identifier field name
 * }
 *
 */

angular.module("core")
  .directive("rwGeoDataManager",rwGeoDataManager)
  .controller("rwGeoDataManagerCtrl",rwGeoDataManagerCtrl);

function rwGeoDataManager()
{
  return {
    templateUrl: "core/views/rw-geodata-manager.html",
    restrict: "E",
    scope: {config:"=", geodata:"=", disabled:"="},
    controller:"rwGeoDataManagerCtrl"
  };
}

function rwGeoDataManagerCtrl($scope, $rootScope, rwHttpSvc, rwConfigSvc, wgMapSvc)
{
  /* scope variables */
  $scope.alert         = {};
  $scope.formCtrlObj   = {};
  $scope.geodataFile   = null;
  $scope.gdDownloadUrl = null;

  /* local variables */
  var newItem = null;
  var layerId = wgMapSvc.getLayerIdByName($scope.config.layerName);

  // status variable
  var drawMode = false;

  // layer field identifier name
  var layerIdField = $scope.config.layerIdField;

  /*
   * Proxy map service method to clear edit layer function
   */
  var clearEditLayer = function()
  {
    wgMapSvc.clearEditLayer();
  }

  /*
   * Scope Functions
   */

  // alert management
  $scope.showAlert = function(cfg)
  {
    $scope.alert.tag      = cfg.tag;
    $scope.alert.msg      = cfg.msg;
    $scope.alert.detMsg   = cfg.detMsg;
    $scope.alert.btOk     = cfg.btOk;
    $scope.alert.btKo     = cfg.btKo;
    $scope.alert.style    = cfg.style;
    $scope.alert.callback = cfg.callback;
  }

  // alert ok button
  $scope.alertOk = function()
  {
    // Look for callback
    if ($scope.alert.callback)
      $scope.alert.callback();

    // Reset alert
    $scope.alert = {};
  }

  // alert ko button
  $scope.alertKo = function()
  {
    $scope.alert = {};
  };

  // Check if enable/disable add shapefile and draw buttons
  $scope.disableAddBtn = function()
  {
    // disable from received param
    if ($scope.disabled)
      return true;

    // disable if we have to associate to parent entity only one geodata item
    if (!$scope.config.multiple && $scope.geodata && $scope.geodata.length >= 1)
      return true;

    return false;
  }

  // Check on save/update entity button
  $scope.disableSaveBtn = function(idx)
  {
    var item = $scope.geodata[idx];

    // save/update button is enabled only if we have:
    // - a shape to save
    // - a geoJson to save
    // - an item already stored on db (with identifier valued)
    return (!item.fileToUpload && !item.geoJson && !item[layerIdField]);
  }

  // Add draw button function
  $scope.addItem = function()
  {
    newItem         = {};
    newItem.geoJson = {};

    var numGdItems = $scope.geodata.length;

    // add form configuration to new item
    newItem.formCfg = $scope.config.formCfg;
    newItem.formCfg.id = "formGeodata_" + numGdItems;

    // this check is necessary if user change from shape to draw button
    // (before to save) to avoid to add a new item into geodata array
    if (numGdItems > 0 && !$scope.geodata[numGdItems-1][layerIdField])
      $scope.geodata[numGdItems-1] = newItem;
    else
      $scope.geodata.push(newItem);

    // call function to execute custom action first to begin to draw
    if ($scope.config.onBeginDraw)
    {
      $scope.config.onBeginDraw();
    }

    // light on feature layer
    wgMapSvc.manageLayerVisibility(layerId, true);

    // retrieve feature geometry type
    var geometry_type = wgMapSvc.layersCfgObj[layerId].geometry_type;

    // enable edit
    wgMapSvc.addEditLayer();
    wgMapSvc.addDrawInteraction(geometry_type);
    wgMapSvc.addModifyInteraction();
    wgMapSvc.addSnapInteraction();

    // set status variables
    drawMode = true;

    // open edit gis panel with callback
    $rootScope.$broadcast("openGisEditPanelEvent", layerId, function()
    {
      // invoke custom action on draw end
      if ($scope.config.onEndDraw)
      {
        $scope.config.onEndDraw();
      }

      // remove draw interactions
      wgMapSvc.disableEdit();
    });
  }

  // Manage save/update button
  $scope.save = function(idx)
  {
    var item = $scope.geodata[idx];

    var formId = "formGeodata_" + idx;

    // validate form
    if (!$scope.formCtrlObj[formId].isValid())
    {
      return;
    }

    // retrieve form field to save
    var formFieldsTosave = [];

    for (var idx=0; idx<item.formCfg.fg.length; idx++)
    {
      var fg = item.formCfg.fg[idx];

      for (var jdx=0; jdx<fg.rows.length; jdx++)
      {
        var row = fg.rows[jdx];

        for (var kdx=0; kdx<row.length; kdx++)
          if (row[kdx].show && row[kdx].enabled)
            formFieldsTosave.push(row[kdx].id);
      }
    }

    if(item.hasOwnProperty("fileToUpload"))
    {
      // insert with a shapefile uploaded from which derive feature geometry

      var opt = {
        file: item.fileToUpload
      };

      for (var idx=0; idx<formFieldsTosave.length; idx++)
        opt[formFieldsTosave[idx]] = item[formFieldsTosave[idx]];

      /* Upload file */
      rwHttpSvc.upload($scope.config.storeShpUrl, opt, function(res)
      {
        if (res && res.data && res.data.result)
        {
          var response = res.data.result;

          // Update entity
          item[layerIdField] = response[layerIdField];
          item.area          = response.area;
          item.perimeter     = response.perimeter;

          delete item.fileToUpload;

          $scope.showAlert({
            msg: "CORE_LBL.INSERT_OK",
            btKo: "Ok",
            style: "info"
          });
        }
        else
        {
          var customErrMsg;

          if (res.data.error)
          {
            switch(res.data.error)
            {
              case  1: customErrMsg = "CORE_LBL.MISSING_PAR_ERR" ; break;
              case  2: customErrMsg = "CORE_LBL.OPEN_FILE_ERR"   ; break;
              case  3: customErrMsg = "CORE_LBL.MORE_FEAT_ERR"   ; break;
              case  4: customErrMsg = "CORE_LBL.GEOM_TYPE_ERR"   ; break;
              case  5: customErrMsg = "CORE_LBL.GEO_JSON_ERR"    ; break;
              case  6: customErrMsg = "CORE_LBL.PARSE_FILE_ERR"  ; break;
              default: customErrMsg = "";
            }
          }

          $scope.showAlert({
            msg: "CORE_LBL.INSERT_ERR",
            detMsg: customErrMsg,
            btKo: "Ok",
            style: "danger"
          });
        }
      });

    }
    else if(item.hasOwnProperty("geoJson"))
    {
      // insert with a geojson (map drawing) from which derive feature geometry

      drawMode = false;

      // retrieve features from edit layer
      var ft = wgMapSvc.getFeaturesFromEditLayer();

      // if we haven't features or have more than one feature -> error
      // (to save multi geometry -> modify also backend)
      if (ft && (ft.length == 0 || ft.length > 1))
      {
        $scope.showAlert({
          msg: "CORE_MSG.ERR_EDIT_FEATURES",
          btOk: "Ok",
          style: "danger",
          callback: clearEditLayer
        });

        return;
      }
      else
      {
        var geoJsonFt = wgMapSvc.convertFeaturesToGeoJSON(ft);

        var opt = {
          geoJson: geoJsonFt,
          srid: wgMapSvc.mapCurrSR.code
        };

        for (var idx=0; idx<formFieldsTosave.length; idx++)
          opt[formFieldsTosave[idx]] = item[formFieldsTosave[idx]];

        /* Store geoJson */
        rwHttpSvc.post($scope.config.storeDrawUrl, opt, function(res)
        {
          if (res && res.result)
          {
            // Update entity
            item[layerIdField] = res.result[layerIdField];
            item.area          = res.result.area;
            item.perimeter     = res.result.perimeter;

            delete item.geoJson;

            // remove edit layer from map
            wgMapSvc.removeEditLayer();

            $scope.showAlert({
              msg: "CORE_LBL.INSERT_OK",
              btKo: "Ok",
              style: "info"
            });
          }
          else
          {
            var customErrMsg;

            if (res.error)
            {
              switch(res.error)
              {
                case 1: customErrMsg = "CORE_LBL.MISSING_PAR_ERR" ; break;
                case 2: customErrMsg = "CORE_LBL.MORE_FEAT_ERR"   ; break;
                case 3: customErrMsg = "CORE_LBL.GEO_JSON_ERR"    ; break;
                default: customErrMsg = "";
              }
            }

            $scope.showAlert({
              msg: "CORE_LBL.INSERT_ERR",
              detMsg: customErrMsg,
              btKo: "Ok",
              style: "danger"
            });
          }
        });
      }
    }
    else if(item.editGeom || $scope.formCtrlObj[formId].$dirty)
    {
      // in this case we have ato manage an entity update
      // update can affect both geometric data and alphanumeric data

      var updUrl = $scope.config.updUrl + item[layerIdField];
      var opt = {};

      // chek if form is changed
      if ($scope.formCtrlObj[formId].$dirty)
      {
        for (var idx=0; idx<formFieldsTosave.length; idx++)
          opt[formFieldsTosave[idx]] = item[formFieldsTosave[idx]];
      }

      if (item.editGeom)
      {
        opt.geoJson = item.geom;
        opt.srid = wgMapSvc.mapCurrSR.code;
      }

      /* Update entity descr attribute */
      rwHttpSvc.put(updUrl, opt, function(res)
      {
        if (res && res.result)
        {
          // update item
          if (res.result[0].area)
            item.area = res.result[0].area;

          if (res.result[0].perimeter)
            item.perimeter = res.result[0].perimeter;

          // remove edit layer from map (if we have modified geometry item)
          if (item.editGeom)
          {
            wgMapSvc.removeEditLayer();

            // remove flag
            delete item.editGeom;
          }

          $scope.showAlert({
            msg: "CORE_LBL.UPDATE_OK",
            btOk: "Ok",
            style: "info"
          });
        }
        else
        {
          $scope.showAlert({
            msg: "CORE_LBL.UPDATE_ERR",
            btOk: "Ok",
            style: "danger"
          });
        }
      });
    }
    else
    {
      console.info("rwGeoDataManager ERROR: nothing to save/update!");
    }
  }

  // Manage download link
  $scope.download = function(idx)
  {
    var geodataId = $scope.geodata[idx][layerIdField];
    var outputFormat = "shape-zip";

    // build download url specifying featureId value
    $scope.gdDownloadUrl =
      rwConfigSvc.urlPrefix +
      $scope.config.downloadUrl +
      "&outputFormat=" + outputFormat +
      "&featureId="+geodataId;
  }

  // Manage edit geodata button
  $scope.edit = function(idx)
  {
    var outputFormat = "application/json";
    var currentEPSGCode = 'EPSG:' + wgMapSvc.mapCurrSR.code;

    // build getFeature url specifying featureId value
    // (url prefix is added by rwHttpSvc)
    var getFeatureUrl =
      $scope.config.downloadUrl +
      "&outputFormat=" + outputFormat +
      "&featureId=" + $scope.geodata[idx][layerIdField] +
      "&srsname=" + currentEPSGCode;

    // retrieve feature geometry to edit it
    rwHttpSvc.get(getFeatureUrl, function(res)
    {
      // there is only 1 feature returned from getFeature request, otherwise error
      if (res && res.features && res.features.length == 1)
      {
        // feature format for reading in geoJson format
        var geoJsonFormat = new ol.format.GeoJSON(
          {defaultDataProjection:currentEPSGCode}
        );

        // get features from response
        var features = geoJsonFormat.readFeatures(res);

        // get feature extent (we have only 1 feature!)
        var extent = features[0].getGeometry().getExtent();

        // zoom map on feature
        wgMapSvc.zoomToBBox(extent, wgMapSvc.mapCurrSR.code);

        // create vector source for editing with retrieved feature
        var editingSource = new ol.source.Vector({
          wrapX: false,
          format: geoJsonFormat,
          features: features
        });

        // call function to execute custom action first to begin to draw
        if ($scope.config.onBeginDraw)
        {
          $scope.config.onBeginDraw();
        }

        // light on feature layer
        wgMapSvc.manageLayerVisibility(layerId, true);

        // enable edit (only modify and snap!)
        wgMapSvc.addEditLayer(editingSource);
        wgMapSvc.addModifyInteraction();
        wgMapSvc.addSnapInteraction();

        // set status variable
        drawMode = true;

        // open edit gis panel with callback
        $rootScope.$broadcast("openGisEditPanelEvent", layerId, function()
        {
          // invoke custom action on draw end
          if ($scope.config.onEndDraw)
          {
            $scope.config.onEndDraw();
          }

          // remove draw interactions
          wgMapSvc.disableEdit();

          // set flag to report that geometry is changed
          $scope.geodata[idx].editGeom = true;

          // retrieve geoJson of modifed feature and set it to geodata
          var ft = wgMapSvc.getFeaturesFromEditLayer();

          var geoJsonFt = wgMapSvc.convertFeaturesToGeoJSON(ft);

          $scope.geodata[idx].geom = geoJsonFt;
        });
      }
      else
        console.error("Error on WFS getFeature request!");
    });
  }

  // Manage zoom to button
  $scope.zoomTo = function(idx)
  {
    var outputFormat = "application/json";
    var currentEPSGCode = 'EPSG:' + wgMapSvc.mapCurrSR.code;

    // build getFeature url specifying featureId value
    // (url prefix is added by rwHttpSvc)
    var getFeatureUrl =
      $scope.config.downloadUrl +
      "&outputFormat=" + outputFormat +
      "&featureId=" + $scope.geodata[idx][layerIdField] +
      "&srsname=" + currentEPSGCode;

    // retrieve feature geometry to zoom on it
    rwHttpSvc.get(getFeatureUrl, function(res)
    {
      // there is only 1 feature returned from getFeature request, otherwise error
      if (res && res.features && res.features.length == 1)
      {
        // feature format for reading in geoJson format
        var geoJsonFormat = new ol.format.GeoJSON(
          {defaultDataProjection:currentEPSGCode}
        );

        // get features from response
        var features = geoJsonFormat.readFeatures(res);

        // get feature extent (we have only 1 feature!)
        var extent = features[0].getGeometry().getExtent();

        // zoom map on feature
        wgMapSvc.zoomToBBox(extent, wgMapSvc.mapCurrSR.code);
      }
      else
        console.error("Error on WFS getFeature request!");
    });
  }

  // Manage delete button
  $scope.delete = function(idx)
  {
    $scope.showAlert(
    {
      msg: "CORE_MSG.DELETE_MSG",
      btOk: "WORDS.YES",
      btKo: "No",
      style: "info",
      callback: function()
      {
        // if drawMode is active -> clear edit layer and remove it
        if (drawMode)
        {
          drawMode = false;

          wgMapSvc.disableEdit();
          wgMapSvc.clearEditLayer();
          wgMapSvc.removeEditLayer();
        }

        var geodataId = $scope.geodata[idx][layerIdField];

        if (geodataId)
        {
          var delUrl = $scope.config.delUrl + geodataId;

          /* Delete */
          rwHttpSvc.delete(delUrl,function(res)
          {
            if (res && res.result)
            {
              $scope.geodata.splice(idx,1);
            }
            else
            {
              $scope.showAlert({
                msg: "CORE_LBL.DELETE_ERR",
                btKo: "Ok",
                style: "danger"
              });
            }
          });
        }
        else // Delete locally
        {
          $scope.geodata.splice(idx,1);
        }
      }
    });
  }

  // return form configuration to form directive (config attribute)
  $scope.getFormCfg = function(index)
  {
    var item = $scope.geodata[index];

    if (!item.formCfg)
    {
      // add form configuration to item
      item.formCfg = $scope.config.formCfg;
      item.formCfg.id = "formGeodata_" + index;
    }

    return item.formCfg;
  }

  /*
   * Watch Functions
   */
  var getFile = $scope.$watch("geodataFile", function(newObj,oldObj)
  {
    if (newObj == undefined)
      return;

    newItem = {};

    // Memorize, into the newItem, the new object as fileToUpload attribute
    newItem.fileToUpload = newObj;

    var numGdItems = $scope.geodata.length;

    // add form configuration to new item
    newItem.formCfg = $scope.config.formCfg;
    newItem.formCfg.id = "formGeodata_" + numGdItems;

    // this check is necessary if user change from shape to draw button
    // (before to save) to avoid to add a new item into geodata array
    if (numGdItems > 0 && !$scope.geodata[numGdItems-1][layerIdField])
      $scope.geodata[numGdItems-1] = newItem;
    else
      $scope.geodata.push(newItem);
  });

  $scope.$on("$destroy",function()
  {
    // Unbind Watches
    getFile();

    // reset status variables
    drawMode = false
  });

}
