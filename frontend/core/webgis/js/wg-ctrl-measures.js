/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */
 
angular.module("webgis")
  .controller("wgMeasuresCtrl", wgMeasuresCtrl);

function wgMeasuresCtrl($scope, wgMapSvc,rwHttpSvc)
{
  var style = {};
  var activeMeasure = {};

  // support layer for measures tools
  var LayerForMeasure = "_MEASURE_LAYER_";

  var map = wgMapSvc.getMap();

  var interactions = [];
  var params   = {};
  var objLayer = {};

  // define object for changing um
  $scope.objUm = {};

  // sphere whose radius is equal to the semi-major axis of the WGS84 ellipsoid
  var wgs84Sphere = new ol.Sphere(6378137);

  // define style vector length
  var styleLength = new ol.style.Style(
  {
    image: new ol.style.Circle(
    {
      radius: 2,
      fill:  new ol.style.Fill({color: "rgba(255, 0, 0, 1)"})
    }),
    stroke:new ol.style.Stroke(
    {
      color: "rgba(255, 0, 0, 1)",
      width: 1
    })
  });

  // define style vector area
  var styleArea = new ol.style.Style(
  {
    "image": new ol.style.Circle(
    {
      "radius": 2,
      "fill":  new ol.style.Fill({
        "color": "rgba(255, 0, 0, 1)"
      })
    }),
    "fill": new ol.style.Fill(
    {
      "color": "rgba(192,192,192,0.4)"
    }),
    "stroke": new ol.style.Stroke(
    {
      "color": "rgba(255, 0, 0, 1)",
      "width": 1
    })
  });

  // conversion factors from meters for length
  var lengthCfg =
  {
    meter:       {factor: 1,       symbol:"m",   label:"WEBGIS.MEASURES.METERS"},
    mile:        {factor: 0.00062, symbol:"mi",  label:"WEBGIS.MEASURES.MILES"},
    yard:        {factor: 1.09361, symbol:"yds", label:"WEBGIS.MEASURES.YARD"},
    kilometer:   {factor: 0.001,   symbol:"km",  label:"WEBGIS.MEASURES.KILOMETERS"},
    mile_marine: {factor: 0.00054, symbol:"NM",  label:"WEBGIS.MEASURES.MILES_MARINE"},
    inch:        {factor: 39.37,   symbol:"in",  label:"WEBGIS.MEASURES.INCH"}
  };

  // conversion factors from meters for area
  var areaCfg =
  {
    meter:           {factor: 1,           symbol:"m2",  label:"WEBGIS.MEASURES.METERS_SQUARE"},
    mile:            {factor: 0.00000386,  symbol:"mi2", label:"WEBGIS.MEASURES.MILES_SQUARE"},
    acre:            {factor: 0.000247105, symbol:"ac",  label:"WEBGIS.MEASURES.ACRE"},
    hectare:         {factor: 0.0001,      symbol:"ha",  label:"WEBGIS.MEASURES.HECTARE"},
    kilometerSquare: {factor: 0.000001,    symbol:"km2", label:"WEBGIS.MEASURES.KILOMETERS_SQUARE"},
    inchSquare:      {factor: 1550,        symbol:"in2", label:"WEBGIS.MEASURES.INCH_SQUARE"}
  };

  $scope.lengthCfg = lengthCfg;
  $scope.areaCfg   = areaCfg;

  // variables that contains the measure units for distance and surface
  // initialized with default values
  var um_length = "meter";
  var um_area   = "kilometerSquare";

  var symbol_length;
  var symbol_area;

  $scope.lineOptions = [];
  $scope.areaOptions = [];

  /*
   * Get from service JSON configuration object
   */
  wgMapSvc.getConfig(function(res)
  {
    // retrieve parameters from configuration
    $.each(res.map.tools, function(i, tool)
    {
      if (tool.id == "measures")
      {
        params = tool.params;
        return false; // exit from each loop
      }
    });

    // read configuration object to retrieve units to use
    if (!$.isEmptyObject(params))
    {
      if (params.length != undefined && params.length.um != undefined)
        um_length = params.length.um;

      if (params.area != undefined && params.area.um != undefined)
        um_area = params.area.um;
    }

    symbol_length = lengthCfg[um_length]["symbol"];
    symbol_area   = areaCfg[um_area]["symbol"];

    // initialize object who contains current status of measure for each type
    $scope.objUm.length = {value:0, um:um_length, symbol:symbol_length};

    $scope.objUm.last_segment = {value:0, um:um_length, symbol:symbol_length};

    $scope.objUm.area = {value:0, um:um_area, symbol:symbol_area};

    $scope.objUm.perimeter = {value:0, um:um_length, symbol:symbol_length};

    // define options for combo line
    $.each(lengthCfg, function(k, obj)
    {
      $scope.lineOptions.push({id:k, name:obj.label});
    });

    // define options for combo area
    $.each(areaCfg, function(k, obj)
    {
      $scope.areaOptions.push({id:k, name:obj.label});
    });
  });

  /*
   * if active measure, disable measuring tool when change tool
   * and remove vector drawed
   */
  $scope.$on("$destroy", function()
  {
    if (interactions.length > 0)
    {
      map.removeInteraction(interactions[0]);
      map.removeLayer(objLayer[LayerForMeasure]);
    }
  })


  /*
   * function actived at every changed of um
   */
  $scope.changeMeasure = function(um, type)
  {
    var objUmCfg = {};

    // type of measure who was selected
    switch(type)
    {
      case "length":
        objUmCfg = lengthCfg;
        break;

      case "last_segment":
        objUmCfg = lengthCfg;
        break;

      case "perimeter":
        objUmCfg = lengthCfg;
        break;

      case "area":
        objUmCfg = areaCfg;
        break;
    }

    // update object with last changed of um
    $scope.objUm[type]["um"]     = um;
    $scope.objUm[type]["symbol"] = objUmCfg[um].symbol;

    // update value of measure with last changed of um
    if ($scope.objUm[type].hasOwnProperty("current_value"))
    {
      var current = $scope.objUm[type].current_value;
      var current_um = current.um;
      var conversion_meters = current.value / objUmCfg[current_um].factor;
      var measure_final = conversion_meters * objUmCfg[um].factor;
      var output = measure_final.toFixed(2);

      $scope.objUm[type]["value"] = output;
    }
  }


  /*
   *  Method bounded to tools buttons
   */
  $scope.selectMeasureTool = function($event, measureType)
  {
    var targetId = $event.currentTarget.id;
    var geom = {};
    activeMeasure[targetId] = true;

    $.each(activeMeasure, function(k,v)
    {
      if (k == targetId)
      {
        activeMeasure[k] = true;
        $("#" + targetId).addClass("btn-measure-focus");
      }
      else
      {
        activeMeasure[k] = false
        $("#" + k).removeClass("btn-measure-focus");
      }
    });

    // settings default value for each type of measure
    $scope.objUm.length.value    = 0;
    $scope.objUm.area.value      = 0;
    $scope.objUm.perimeter.value = 0;
    $scope.featureLine = false;
    $scope.featureArea = false;

    if (measureType == "Distance")
    {
      $scope.objUm.last_segment.value = 0;
      $scope.featureLine = true;
    }
    else
      $scope.featureArea = true;

    // build vector draw
    buildVectorDraw(measureType);
  };



  /*
   * build vector draw
   */
  var buildVectorDraw = function(measureType)
  {
    if (interactions.length > 0)
    {
      map.removeInteraction(interactions[0]);
      interactions = [];
    }

    var geom;

    // set style related to selected measure type
    style = (measureType == "Distance") ? styleLength : styleArea;

    // remove if exist, previous draw layer
    map.removeLayer(objLayer[LayerForMeasure])

    // create vector draw
    var source = new ol.source.Vector({wrapX: false});
    var vector = new ol.layer.Vector({
      source: source,
      style: style
    });

    vector.set("id", LayerForMeasure);
    objLayer[LayerForMeasure] = vector;

    var draw = new ol.interaction.Draw(
    {
      source: source,
      type: (measureType == 'Distance') ? 'LineString' : 'Polygon',
      id: measureType,
      style: style
    });

    // add interaction Draw to map
    interactions.push(draw);
    map.addInteraction(draw);

    // start drawing
    draw.on('drawstart',function(e)
    {

      source.clear();
      map.removeLayer(vector);
      geom = e.feature.getGeometry();

    });

    // finish draw
    draw.on('drawend',function(e)
    {
      map.addLayer(vector);
      geom = {};
    });


    // to event mouse move calculate length or area
    $(map.getViewport()).on('mousemove', function(e)
    {
      // get length of vector line drew
      if (geom instanceof ol.geom.LineString)
      {
        output = formatLength(geom,"length");

        // calculate length of last segment
        geom.forEachSegment(function(i,v)
        {
          var last_segment = formatLength(new ol.geom.LineString([i,v]),"last_segment");

          $scope.$apply(function()
          {
            $scope.objUm.last_segment.value = last_segment >0 ? last_segment : null;
          });
        });

        // get total length
        $scope.$apply(function()
        {
          $scope.objUm.length.value = output;
        });
      }

      // get area of vector polygon drew
      if (geom instanceof ol.geom.Polygon)
      {
        output = formatArea(geom);

        $scope.$apply(function()
        {
          $scope.objUm.area.value      = output.area;
          $scope.objUm.perimeter.value = output.perimeter;
        });
      }
    });
  };


  /*
   * get format of measure for line
   */
  var formatLength = function(line, type)
  {
    var coordinates = line.getCoordinates();
    var length = 0;
    var sourceProj = map.getView().getProjection();

    for (var i = 0, len = coordinates.length - 1; i < len; ++i)
    {
      var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
      var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');

      length += wgs84Sphere.haversineDistance(c1, c2);
    }

    // get value + symbol for measure of length
    if (type == "length")
    {
      var um = $scope.objUm.length.um;
      var convertor = lengthCfg[um].factor;
      var symbol = $scope.objUm.length.symbol;
      var lineConvert = length * convertor;

      // stores value and um of last measure of length
      $scope.objUm.length.current_value = {
        value: lineConvert.toFixed(2),
        um: um
      };

      var output = lineConvert.toFixed(2);
    }
    // get value + symbol for measure of the last segment
    else
    {
      var um = $scope.objUm.last_segment.um;
      var convertor = lengthCfg[um].factor;
      var symbol = $scope.objUm.last_segment.symbol;
      var lineConvert = length * convertor;

      // stores value and um of last measure of length
      $scope.objUm.last_segment.current_value = {
        value: lineConvert.toFixed(2),
        um: um
      };

      var output = lineConvert.toFixed(2);
    }

    return output;
  };


  /*
   * get format of measure for polygon
   */
  var formatArea = function(polygon)
  {
    var um = $scope.objUm.area.um;
    var convertor = areaCfg[um].factor;
    var symbol = $scope.objUm.area.symbol;

    var sourceProj = map.getView().getProjection();
    var geom = (polygon.clone().transform(sourceProj, 'EPSG:4326'));
    var coordinates = geom.getLinearRing(0).getCoordinates();

    // get Perimeter
    var um_perimeter = $scope.objUm.perimeter.um;
    var convertor_length = lengthCfg[um_perimeter].factor;
    var symbol_len = $scope.objUm.perimeter.symbol;

    var length = 0;
    var first_point = coordinates[0];
    var last_point  = coordinates[coordinates.length -1];
    var last_line   = wgs84Sphere.haversineDistance(first_point, last_point);

    for (var i = 0, len = coordinates.length - 1; i < len; ++i)
    {
      var c1 = coordinates[i];
      var c2 = coordinates[i + 1];

      length += wgs84Sphere.haversineDistance(c1, c2);
    }

    var perimeter_measure = (length + last_line) * convertor_length;
    var perimeter = perimeter_measure.toFixed(2);

    // stores value and um of last measure for perimeter
    $scope.objUm.perimeter.current_value = {
      value: perimeter_measure.toFixed(2),
      um: um_perimeter
    };

    //  get Area
    area = Math.abs(wgs84Sphere.geodesicArea(coordinates));

    var areaConvert = area * convertor;
    var output = areaConvert.toFixed(2);

    // stores value and um of last measure for area
    $scope.objUm.area.current_value =
    {
      value: areaConvert.toFixed(2),
      um: um
    };

    return { area: output, perimeter: perimeter };
  };
};
