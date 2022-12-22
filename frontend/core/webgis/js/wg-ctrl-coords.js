/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

function wgCoordsCtrl($scope, $http, wgMapSvc, rwHttpSvc)
{
  var markersOverlay = null;

  $scope.coordsOutOfBBoxError = null;

  $scope.objFormCtrl = {};

  // coordinate management form configuration
  $scope.coordsFormCfg =
  {
    id: "coordsForm", fg:
    [
      {
        show: true, label: "WORDS.REFERENCE_SYSTEM", rows:
        [
          [
            {
              id: "mapSR",
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
        show: true, label: "WEBGIS.COORDS_ACQUIRE", rows:
        [
          [
            {
              id: "mgrsPrefix",
              type: "text",
              width: 4,
              height: "input-sm",
              required: true, enabled: true, show: false
            },
            {
              id: "xCoord",
              type: "text",
              width: 6,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "yCoord",
              type: "text",
              width: 6,
              height: "input-sm",
              required: true, enabled: true, show: true
            }
          ],
          [
            {
              id: "getClickCoords",
              type: "glyphButton",
              icon: "pushpin",
              title:"CORE_MSG.MAP_POINT_SELECT",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "goToCoords",
              type: "glyphButton",
              icon: "screenshot",
              title: "WEBGIS.GO_TO_COORDS",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "resetCoords",
              type: "glyphButton",
              icon: "remove",
              title: "WORDS.CANCEL",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]
        ]
      },
      {
        show: true, label: "WORDS.COORDS_CONVERT", rows:
        [
          [
            {
              id: "convertSR",
              type: "select",
              label: "WORDS.NEW_REFERENCE_SYSTEM",
              width: 12,
              height: "input-sm",
              options: [],
              required: false, enabled: true, show: true
            }
          ],
          [
            {
              id: "convertCoords",
              type: "glyphButton",
              icon: "refresh",
              title: "WORDS.CONVERT",
              width: 6,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "resetConvert",
              type: "glyphButton",
              icon: "remove",
              title: "WORDS.CANCEL",
              width: 6,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ],
          [
            {
              id: "mgrsPrefixNew",
              type: "text",
              width: 4,
              height: "input-sm",
              required: true, enabled: false, show: false
            },
            {
              id: "xCoordNew",
              type: "text",
              width: 6,
              height: "input-sm",
              required: false, enabled: false, show: true
            },
            {
              id: "yCoordNew",
              type: "text",
              width: 6,
              height: "input-sm",
              required: false, enabled: false, show: true
            }
          ]
        ]
      }
    ]
  };

  /*
   * Get from service JSON configuration object
   */
  wgMapSvc.getConfig(function(res)
  {
    $scope.wgConfig = res;

    // setting options for map SR combo
    $scope.coordsFormCfg.fg[0].rows[0][0].options = $scope.wgConfig.map.sr;

    // setting options for conversion SR combo
    $scope.coordsFormCfg.fg[2].rows[0][0].options = $scope.wgConfig.map.sr;

    // init fields label on coordinate form
    $scope.coordsFormCfg.fg[1].rows[0][1].label = wgMapSvc.mapCurrSR.x_label;
    $scope.coordsFormCfg.fg[1].rows[0][2].label = wgMapSvc.mapCurrSR.y_label;

    /*
     * Init object binded to coordinate form
     */
    $scope.coordsObj =
    {
      mapSR: wgMapSvc.mapCurrSR.id,
      xCoord: null,
      yCoord: null
    };

    // retrieve map markers overlay
    markersOverlay = wgMapSvc.map.getOverlayById('mapMarkersOverlay');
  });

  /*
   * watch on combo of map SR
   * change map SR and change coords field labels
   */
  $scope.$watch("coordsObj.mapSR", function(newValue, oldValue)
  {
    var mask = null;

    if (oldValue == undefined || oldValue == newValue)
    {
      // Define mask to show DMS correctly
      if(wgMapSvc.mapCurrSR.name == 'WEBGIS.SR_4326_NAME_DMS')
      {
        mask = "99° 99' 99.9\"";
        // Set coords fields's type as text
        $scope.coordsFormCfg.fg[1].rows[0][1].type = "text";
        $scope.coordsFormCfg.fg[1].rows[0][2].type = "text";
      }
      else
      {
        // Set coords fields's type as number
        $scope.coordsFormCfg.fg[1].rows[0][1].type = "number";
        $scope.coordsFormCfg.fg[1].rows[0][2].type = "number";
      }

      // Set mask to the coords field
      $scope.coordsFormCfg.fg[1].rows[0][1].mask = mask;
      $scope.coordsFormCfg.fg[1].rows[0][2].mask = mask;

      return;
    }

    // change map SR
    var newSR = wgMapSvc.projObj[newValue];
    wgMapSvc.setMapSR(newSR.cfgParams.id);

    // empties fields from previous values
    $scope.coordsObj.xCoord = null;
    $scope.coordsObj.yCoord = null;

    if (newSR.cfgParams.name == 'WEBGIS.SR_MGRS_NAME')
    {
      $scope.coordsFormCfg.fg[1].rows[0][0].show = true;
      $scope.coordsFormCfg.fg[1].rows[0][1].width = 4;
      $scope.coordsFormCfg.fg[1].rows[0][2].width = 4;
    }
    else
    {
      $scope.coordsFormCfg.fg[1].rows[0][0].show = false;
      $scope.coordsFormCfg.fg[1].rows[0][1].width = 6;
      $scope.coordsFormCfg.fg[1].rows[0][2].width = 6;
    }

//     // change label on coords fields
//     $scope.coordsFormCfg.fg[1].rows[0][0].label = wgMapSvc.mapCurrSR.x_label;
//     $scope.coordsFormCfg.fg[1].rows[0][1].label = wgMapSvc.mapCurrSR.y_label;

    // Define mask to show DMS correctly
    if(wgMapSvc.mapCurrSR.name == 'WEBGIS.SR_4326_NAME_DMS')
    {
      mask = "99° 99' 99.9\"";
      // Set coords fields's type as text
      $scope.coordsFormCfg.fg[1].rows[0][1].type = "text";
      $scope.coordsFormCfg.fg[1].rows[0][2].type = "text";
    }
    else
    {
      // Set coords fields's type as number
      $scope.coordsFormCfg.fg[1].rows[0][1].type = "number";
      $scope.coordsFormCfg.fg[1].rows[0][2].type = "number";
    }

    // Set mask to the coords field
    $scope.coordsFormCfg.fg[1].rows[0][1].mask = mask;
    $scope.coordsFormCfg.fg[1].rows[0][2].mask = mask;

    // change label on coords fields
    $scope.coordsFormCfg.fg[1].rows[0][1].label = wgMapSvc.mapCurrSR.x_label;
    $scope.coordsFormCfg.fg[1].rows[0][2].label = wgMapSvc.mapCurrSR.y_label;
  });

  /*
   * watch on combo of SR conversion
   */
  $scope.$watch("coordsObj.convertSR", function(newValue, oldValue)
  {
    if (newValue == undefined || oldValue == newValue)
      return;

    // empties fields from previous values
    $scope.coordsObj.xCoordNew = null;
    $scope.coordsObj.yCoordNew = null;

    var newSR = wgMapSvc.projObj[newValue];

    if (newSR.cfgParams.name == 'WEBGIS.SR_MGRS_NAME')
    {
      $scope.coordsFormCfg.fg[2].rows[2][0].show = true;
      $scope.coordsFormCfg.fg[2].rows[2][1].width = 4;
      $scope.coordsFormCfg.fg[2].rows[2][2].width = 4;
    }
    else
    {
      $scope.coordsFormCfg.fg[2].rows[2][0].show = false;
      $scope.coordsFormCfg.fg[2].rows[2][1].width = 6;
      $scope.coordsFormCfg.fg[2].rows[2][2].width = 6;
    }

    // check for change label on coords fields
    $scope.coordsFormCfg.fg[2].rows[2][1].label = newSR.cfgParams.x_label;
    $scope.coordsFormCfg.fg[2].rows[2][2].label = newSR.cfgParams.y_label;
  });

  /*
   * watch on click getClickCoords button
   */
  $scope.$watch("coordsObj.getClickCoords", function(newValue, oldValue)
  {
    if (newValue == undefined)
      return;

    // empties fields from previous values
    $scope.coordsObj.mgrsPrefix = null;
    $scope.coordsObj.xCoord     = null;
    $scope.coordsObj.yCoord     = null;

    // change map cursor

    // invoke service function to get coords values
    //wgMapSvc.getCoordinate(function(coord1, coord2){
    wgMapSvc.getCoordinate(function(coordsArray){

      var newSR = wgMapSvc.projObj[$scope.coordsObj.mapSR];

      $scope.$apply(function()
      {
        switch(newSR.cfgParams.name)
        {
          case 'WEBGIS.SR_MGRS_NAME':
            $scope.coordsObj.mgrsPrefix = coordsArray[0];
            $scope.coordsObj.xCoord = coordsArray[1]*1;
            $scope.coordsObj.yCoord = coordsArray[2]*1;
            break;

          default:
            $scope.coordsObj.xCoord = coordsArray[0];
            $scope.coordsObj.yCoord = coordsArray[1];
        }

      });
    });
  });

  /*
   * watch on click goToCoords button
   */
  $scope.$watch("coordsObj.goToCoords", function(newValue, oldValue)
  {
    if (oldValue == undefined && newValue == undefined)
      return;

    $scope.coordsOutOfBBoxError = false;

    // it is checked whether the fields are valued
    if ($scope.coordsObj.xCoord  &&
        $scope.coordsObj.yCoord )
    {
      var newSR = wgMapSvc.projObj[$scope.coordsObj.mapSR];
      var coordArray = [];

      switch(newSR.cfgParams.name)
      {
        case 'WEBGIS.SR_4326_NAME_DMS':
          coordArray = [
            wgMapSvc.fromDMSToDD($scope.coordsObj.xCoord),
            wgMapSvc.fromDMSToDD($scope.coordsObj.yCoord)
          ];
          break;

        case 'WEBGIS.SR_MGRS_NAME':
          var usngStr = $scope.coordsObj.mgrsPrefix +
                        $scope.coordsObj.xCoord+$scope.coordsObj.yCoord;
          USNGtoLL(usngStr, coordArray);
          // USNGtoLL function return coordinate in lat lon order
          // we have to invert them
          coordArray = coordArray.reverse();
          break;

        default:
          coordArray = [$scope.coordsObj.xCoord, $scope.coordsObj.yCoord];
      }

      //var coordArray = [$scope.coordsObj.xCoord, $scope.coordsObj.yCoord];
      var mapExtent  = wgMapSvc.projObj[wgMapSvc.mapCurrSR.id].mapExtent;

      // check if the coords are valid (into bounding box)
      if (ol.extent.containsCoordinate(mapExtent, coordArray))
      {
        // center map
        wgMapSvc.mapView.setCenter(coordArray);

        // show marker
        markersOverlay.setPosition(coordArray);

      //wgMapSvc.mapView.setZoom(); TODO
      }
      else
      {
        $scope.coordsOutOfBBoxError = true;
      }
    }
    else
    {
      // error management TODO

    }
  });

  /*
   * watch on click get resetCoords form button
   */
  $scope.$watch("coordsObj.resetCoords", function(newValue, oldValue)
  {
    resetCoords();
  });

  /*
   * watch on click get resetCoords form button
   */
  $scope.$watch("coordsObj.convertCoords", function(newValue, oldValue)
  {
    // empties fields from previous values
    $scope.coordsObj.mgrsPrefixNew = null;
    $scope.coordsObj.xCoordNew     = null;
    $scope.coordsObj.yCoordNew     = null;

    // check if the coords fields are valued
    if ($scope.coordsObj.xCoord  &&
        $scope.coordsObj.yCoord )
    {
      // check if dest SR combo is valued
      if($scope.coordsObj.convertSR)
      {
        var fromSR, toSR, coordArray = [];

        fromSR = wgMapSvc.projObj[$scope.coordsObj.mapSR];
        toSR   = wgMapSvc.projObj[$scope.coordsObj.convertSR];

        switch(fromSR.cfgParams.name)
        {
          case 'WEBGIS.SR_4326_NAME_DMS':
            coordArray = [
              wgMapSvc.fromDMSToDD($scope.coordsObj.xCoord),
              wgMapSvc.fromDMSToDD($scope.coordsObj.yCoord)
            ];
            break;

          case 'WEBGIS.SR_MGRS_NAME':
            var usngStr = $scope.coordsObj.mgrsPrefix +
                        $scope.coordsObj.xCoord+$scope.coordsObj.yCoord;
            USNGtoLL(usngStr, coordArray);
            // USNGtoLL function return coordinate in lat lon order
            // we have to invert them
            coordArray = coordArray.reverse();
            break;

          default:
            coordArray = [$scope.coordsObj.xCoord*1, $scope.coordsObj.yCoord*1];
        }

        var convertedCoords = ol.proj.transform(
          coordArray,
          'EPSG:'+fromSR.cfgParams.code, 'EPSG:'+toSR.cfgParams.code);

        var newProjUnits = toSR.cfgParams.units;

        var numDec = wgMapSvc.getCoordNumDec(newProjUnits);

        switch(toSR.cfgParams.name)
        {
          case 'WEBGIS.SR_4326_NAME_DMS':
            convertedCoords = [
              wgMapSvc.fromDDToDMS(convertedCoords[0]),
              wgMapSvc.fromDDToDMS(convertedCoords[1])
            ];

            $scope.coordsObj.xCoordNew = convertedCoords[0];
            $scope.coordsObj.yCoordNew = convertedCoords[1];
            break;

          case 'WEBGIS.SR_MGRS_NAME':
            var strUSNG = LLtoUSNG(convertedCoords[1], convertedCoords[0], 5);
            var tmpArr = strUSNG.split(' ');
            convertedCoords[0] = tmpArr[0] + ' ' + tmpArr[1];
            convertedCoords[1] = tmpArr[2];
            convertedCoords[2] = tmpArr[3];

            $scope.coordsObj.mgrsPrefixNew = convertedCoords[0];
            $scope.coordsObj.xCoordNew     = convertedCoords[1];
            $scope.coordsObj.yCoordNew     = convertedCoords[2];

            break;

          default:
            convertedCoords = [
              convertedCoords[0].toFixed(numDec)*1,
              convertedCoords[1].toFixed(numDec)*1
            ];

            $scope.coordsObj.xCoordNew = convertedCoords[0];
            $scope.coordsObj.yCoordNew = convertedCoords[1];
        }

//         $scope.coordsObj.xCoordNew = convertedCoords[0];
//         $scope.coordsObj.yCoordNew = convertedCoords[1];
      }
      else
      {
        // error managment  TODO

      }
    }
    else
    {
      // error management  TODO

    }
  });

  /*
   * watch on click get resetConvert form button
   */
  $scope.$watch("coordsObj.resetConvert", function(newValue, oldValue)
  {
    // empties fields from previous values
    $scope.coordsObj.mgrsPrefixNew = null;
    $scope.coordsObj.xCoordNew     = null;
    $scope.coordsObj.yCoordNew     = null;

    // remove labels from converted coords fields
    $scope.coordsFormCfg.fg[2].rows[2][1].label = null;
    $scope.coordsFormCfg.fg[2].rows[2][2].label = null;

    // reset combo
    $scope.coordsObj.convertSR = null;
  });

  /*
   * Remove marker from overlay
   */
  $scope.$on("$destroy", function()
  {
    hideMarker();
  });

  /*
   * Hide marker from map
   */
  function hideMarker()
  {
    markersOverlay.setPosition(undefined);
  }

  /*
   * Reset coords
   */
  function resetCoords()
  {
    // empties fields from previous values
    $scope.coordsObj.mgrsPrefix = null;
    $scope.coordsObj.xCoord     = null;
    $scope.coordsObj.yCoord     = null;

    $scope.coordsOutOfBBoxError = false;

    // hide marker
    hideMarker();
  }
}

angular.module("webgis").controller("wgCoordsCtrl", wgCoordsCtrl);
