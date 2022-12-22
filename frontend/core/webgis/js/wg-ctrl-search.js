/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

function searchCtrl($scope, $anchorScroll, $translate,
  wgMapSvc, rwHttpSvc, rwConfigSvc, rwContextSvc, wgSearchSvc)
{
  // contains advanced search configuration
  $scope.advancedConfigSearch = {
    source: [],
    _reset: 0
  };

  // Set advanced search max groups attribute to 1
  $scope.advancedConfigSearch.maxGroups = 1;

  // flag to hide advanced search form
  $scope.advancedSearchFormHide = true;

  // index of selected tab
  $scope.selectedTab = null;

  // options for combo layers
  var layerSearchableOption = [];

  // object binded to search form
  $scope.searchObj = {};

  // flag to show loader while search is on
  $scope.showLoader = false;

  var map = null;

  // search service layer id
  var layerSearchId = null;

  // array of features returned from search
  $scope.featuresArray = null;

  // styles for search results
  var pointHighlightStyle = new ol.style.Style({
    image: new ol.style.Circle({
      fill: new ol.style.Fill({
        color: [129, 212, 250, 1]
      }),
      radius: 12
    })
  });

  var lineHighlightStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: [129, 212, 250, 1],
      width: 2
    })
  });

  // styles for selected item of search results
  var pointSelectedStyle = new ol.style.Style({
    image: new ol.style.Circle({
      fill: new ol.style.Fill({
        color: [79, 195, 247, 1]
      }),
      radius: 16
    })
  });

  var lineSelectedStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: [79, 195, 247, 1],
      width: 4
    })
  });

  // search service layer
  var layerSearchResult = null;

  // setting maxheight for panel of search
  $scope.panelScroll = function()
  {
    var panel = $(".tab-result").height() + 30;
    toolsPanelHeight = $scope.toolsPanelHeight - (panel + 25);

    return {'max-height': toolsPanelHeight}
  }

  $scope.panelSearchScroll = function()
  {
    var panel = $(".tab-result").height();
    toolsPanelHeight = $scope.toolsPanelHeight - panel;

    return {'max-height': toolsPanelHeight};
  }

  // search form configuration
  $scope.searchFormCfg =
  {
    id: "searchForm",
    fg:
    [
      {
        show: true, label: "", rows:
        [
          [
            {
              id: "layer_searchable",
              label: "WEBGIS.SEARCH.LAYER_SELECT",
              type: "select",
              width: 9,
              height: "input-sm",
              options: layerSearchableOption,
              required: false, enabled: true, show: true
            },
            {
              id: "filter_btn",
              type: "glyphButton",
              label: "",
              width: 3,
              icon: "filter",
              height: "input-sm",
              title: "WEBGIS.SEARCH.ADVANCED_SEARCH",
              required: false, enabled: true, show: true
            }
          ],
          [
            {
              id: "simple_search",
              label: "WORDS.SEARCH",
              type: "text",
              width: 9,
              height: "input-sm",
              options: layerSearchableOption,
              required: false, enabled: false, show: true
            },
            {

              id: "repeat_search_btn",
              type: "glyphButton",
              label: "",
              width: 3,
              icon: "repeat",
              height: "input-sm",
              title: "WORDS.RELOAD",
              required: false, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  };

  /*
   * retrieve configuration from service
   */
  wgMapSvc.getConfig(function(res)
  {
    // retrieves map
    map = wgMapSvc.getMap();

    layerSearchId = wgMapSvc.layerSearchId;

    // retrieve search service layer
    layerSearchResult = wgMapSvc.layersCfgObj[layerSearchId].layerOL;
    layerSearchResult.set("id", layerSearchId);

    // retrieve index of tab to show
    $scope.selectedTab = wgMapSvc.searchConfig["selectedTab"];

    // retrieve last layer searched (from service)
    $scope.searchObj["layer_searchable"] = wgMapSvc.searchConfig["layer_searched"]

    // retrieve last features searched (from service)
    $scope.featuresArray = wgMapSvc.searchConfig["features"];

    // cycle on layers to retrieve searchable layers
    $.each(wgMapSvc.layersCfgObj, function(i,layer)
    {
      if (layer.searchable)
      {
        var layerName = "";

        if (layer.id_parent)
        {
          var parentCfg = wgMapSvc.layersCfgObj[layer.id_parent];
          layerName = $translate.instant(parentCfg.label) + " - ";
        }

        layerName += $translate.instant(layer.label);

        // Populate combo of searchable layers
        layerSearchableOption.push({
          "id":   layer.id,
          "name": layerName
        });
      };
    });
  });

  /*
   * Watch on button to select between simple or advanced search
   */
  $scope.$watch("searchObj.filter_btn", function (nVal, oldVal)
  {
    var simple_search = $scope.searchFormCfg.fg[0].rows[1][0];
    var repeat_btn    = $scope.searchFormCfg.fg[0].rows[1][1];

    if (nVal == undefined)
      return;
    else if (simple_search.show)
    {
      // ADVANCED SEARCH

      // turn off field and button for simple search
      simple_search.show = false;
      repeat_btn.show    = false;

      // retrieve layerId from combo layers searchable
      var layerId = $scope.searchObj["layer_searchable"];

      if (layerId != null && layerId != "")
      {
        // activate advanced search
        // Show the advanced search form
        $scope.advancedSearchFormHide = false;
      }
    }
    else
    {
      // SIMPLE SEARCH

      // turn on field and button for simple search
      simple_search.show = true;
      repeat_btn.show    = true;

      // Hide the advanced search form
      $scope.advancedSearchFormHide = true;
    }
  })


  /*
   * Watch on layers combo: when the user select a layer, enable search field
   */
  $scope.$watch("searchObj.layer_searchable", function (nVal, oldVal)
    {
      if(nVal == undefined)
        return;
      else if (nVal != "")
      {
        // enable simple search field
        var simple_search = $scope.searchFormCfg.fg[0].rows[1][0];
        $scope.searchObj["simple_search"] = "";
        simple_search.enabled = true;

        // update the advanced search config at new selected layer
        var layerId = $scope.searchObj["layer_searchable"];

        // read searchable params from layer configuration
        wgMapSvc.searchConfig["layer_searched"] = layerId;

        // activate advanced search

        // Clear advancedConfigSearch.source
        $scope.advancedConfigSearch.source = [];

        // Build the form's configuration file
        //$scope.advancedConfigSearch.source = wgSearchSvc.buildAdvancedConfigSearch(layerId);

        wgSearchSvc.buildAdvancedConfigSearch(layerId, function(cfgArray)
        {
          $scope.advancedConfigSearch.source = cfgArray;
        });
      }
    },
    true
  );


  /*
   * Watch on advanced search query builder
   */
  $scope.$watch("advancedConfigSearch.result", function (nVal, oldVal)
    {
      if(nVal != undefined && $scope.advancedConfigSearch.result > 0)
      {
        // invoke advanced search
        $scope.query("advanced");
      }
    },
    true
  );

  /*
   * Watch on simple search field
   */
  $scope.$watch("searchObj.simple_search", function(nVal, oldVal)
  {
    if (nVal == undefined || nVal == "")
      return;
    else
      // invoke simple search
      $scope.query("simple");
  });

  /*
   * Watch on simple search reset button
   */
  $scope.$watch("searchObj.repeat_search_btn", function(nVal, oldVal)
  {
    if (nVal == undefined)
      return;
    else
      $scope.searchObj["simple_search"] = "";
  });

  /*
   * Execute http post call to retrieve search resutl
   */
  self.retrieveSearchResult = function(postURL, postBody)
  {
    var layerId = $scope.searchObj["layer_searchable"];

    // retrieve layer configuration for selected layer
    var layerCfg = wgMapSvc.layersCfgObj[layerId];

    // retrieve source configuration from layer queried
    var sourceCfg = layerCfg.source;

    // function to retrieve feature format
    // to encode and decode features from specified output format
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
    };

    rwHttpSvc.post(
      postURL,
      postBody,
      function(response)
      {
        // error or no result management
        if (!response || !response.features || response.features.length == 0)
        {
          $scope.showLoader = false;
          return;
        }

        var features = response.features;

        var attributesArr = wgMapSvc.layersCfgObj[layerId].searchable.result;

        for (i=0; i < features.length; i++)
        {
          var feature = features[i];
          feature["custom_properties"] = {};

          $.each(feature.properties, function(key, val)
          {
            for (var jdx=0; jdx<attributesArr.length; jdx++)
            {
              if (attributesArr[jdx].id === key && attributesArr[jdx].name != null)
              {
                var value;

                switch(attributesArr[jdx].type)
                {
                  case 'date':
                    value = getFormattedDate(val);
                    break;

                  case 'date-time':
                    value = getFormattedDateTime(val);
                    break;

                  case 'boolean':
                    value = getFormattedBool(val);
                    break;

                  default:
                    value = val;
                }

                feature["custom_properties"][attributesArr[jdx].name] = value;
              }
            }
          });
        }

        // populate array with features filtered and elaborated
        $scope.featuresArray = features;

        wgMapSvc.searchConfig["features"] = $scope.featuresArray;

        $scope.showLoader = false;

        // retrieve returned features format
        format = getFormat();

        wgMapSvc.searchConfig.source.addFeatures(
          format.readFeatures(response,
          {
            dataProjection:    'EPSG:' + wgMapSvc.mapCurrSR.code,
            featureProjection: 'EPSG:' + wgMapSvc.mapCurrSR.code
          })
        );

        var geometries = [];

        // setting extent for geometries filtered
        for(i=0; i<features.length;i++)
        {
          var featureOl  = format.readFeature(features[i]);
          geometries.push(featureOl.getGeometry());
        }

        var geomCollection = new ol.geom.GeometryCollection(geometries);
        var extent = geomCollection.getExtent();

        map.getView().fit(extent);

        // select appropriate styles based on geometry type
        var geomType = geometries[0].getType();
        var selStyle = null;
        var hiliteStyle = null;

        switch (geomType)
        {
          case "Point":
          case "MultiPoint":
            selStyle = pointSelectedStyle;
            hiliteStyle = pointHighlightStyle;
            break;
          case "LineString":
          case "MultiLineString":
            selStyle = lineSelectedStyle;
            hiliteStyle = lineHighlightStyle;
            break;
          case "Polygon":
          case "MultiPolygon":
            selStyle = lineSelectedStyle;
            hiliteStyle = lineHighlightStyle;
            break;
        }

        // set style and show result search layer
        layerSearchResult.setStyle(hiliteStyle);
        layerSearchResult.setVisible(true);

        // build interaction
        wgMapSvc.searchConfig["interaction"] = new ol.interaction.Select(
        {
          condition: ol.events.condition.singleClick,
          layers: [layerSearchResult],
          style: selStyle
        });

        // add interaction to map
        var interaction = wgMapSvc.searchConfig["interaction"];

        // add click interaction to map
        map.addInteraction(interaction);

        interaction.getFeatures().on("add", function (e)
        {
          var feature = e.element;

          var ftId = $scope.getFeatureId(feature.getId());

          $("#" + ftId).addClass("feature-selected");

          // check for noScroll attribute value
          // it is to decide whether or not scrolling result list
          if (!feature.get('noScroll'))
            $anchorScroll(ftId);
        });

        interaction.getFeatures().on("remove", function (e)
        {
          var feature = e.element;

          var ftId = $scope.getFeatureId(feature.getId());

          // remove noScroll attribute
          feature.unset('noScroll',true);

          $("#" + ftId).removeClass("feature-selected");
        });

        $scope.$on("$destroy",function()
        {
          ol.Observable.unByKey("add");
          ol.Observable.unByKey("remove");
        });
      }
    );
  }

  /*
   * Function used to query layers
   * searchType could be simple or advanced
   */
  $scope.query = function(searchType)
  {
    $scope.showLoader = true;

    // reset previous query result
    resetQueryResult();

    var layerId = $scope.searchObj["layer_searchable"];

    // retrieve layer configuration for selected layer
    var layerCfg = wgMapSvc.layersCfgObj[layerId];

    // retrieve source configuration from layer queried
    var sourceCfg = layerCfg.source;

    // initialize vector source
    wgMapSvc.searchConfig.source = new ol.source.Vector();

    // set custom attribute projection on source
    // we set the SR of the feature geometry so we can reproject
    // a vector layer to another SR
    wgMapSvc.searchConfig.source.set('projection', 'EPSG:' + wgMapSvc.mapCurrSR.code, true);

    // set source on search service layer
    layerSearchResult.setSource(wgMapSvc.searchConfig.source);

    switch(sourceCfg.type)
    {
      // data retrieved from mapserver WFS layer
      case 'VECTOR':
        queryWFSLayer(layerId, searchType, retrieveSearchResult);
        break;

      // data retrieved from backend url
      case 'GEOJSON':
        queryGeoJSONLayer(layerId, searchType, retrieveSearchResult);
        break;
    }

    // move to the result tab
    $scope.selectedTab = 1;
    wgMapSvc.searchConfig["selectedTab"] = 1;
  };

  /*
   * Convert feature id into a string without '.' char
   * (feature id is different depending on whether the layer is WFS or GEOJSON)
   */
  $scope.getFeatureId = function(id)
  {
    var ftId = Number.isInteger(id) ? id + '' : id.replace(".","");

    return ftId;
  }

  /*
   * Build filter for WFS mapserver request and invoke call
   */
  function queryWFSLayer(layerId, searchType, retrieveSearchFunc)
  {
    var filterArray = [];

    var operator_filter = null;

    // advanced search
    if (searchType == "advanced")
    {
      // build advanced filter
      var rules_filter = [];

      // retrieved compiled query from search form
      rules_filter = $scope.advancedConfigSearch.filter.rules;

      operator_filter = $scope.advancedConfigSearch.filter.groupOp;

      $.each(rules_filter, function(i, query)
      {
        var objFilter = {};

        var queryItems = query.split("|");

        objFilter["property_name"] = queryItems[0];
        objFilter["operator"]      = queryItems[1];
        objFilter["property_val"]  = queryItems[2];

        $.each($scope.advancedConfigSearch.source, function(j, source)
        {
          if (source.id == queryItems[0])
          {
            objFilter["property_type"] = source.type;
            return false;
          }
        });

        filterArray.push(wgMapSvc.buildFilter(objFilter));
      });

      // if not filter condition
      if (filterArray.length == 0)
      {
        $scope.selectedTab = 1;
        $scope.showLoader  = false;
        return;
      }

      // build condition AND|OR between more objFilter and return it
      //return wgMapSvc.buildWFSLayerFilter(filterArray, operator_filter);
      var filter = wgMapSvc.buildWFSLayerFilter(filterArray, operator_filter);

      // retrieve layer configuration for selected layer
      var layerCfg = wgMapSvc.layersCfgObj[layerId];

      // retrieve source configuration from layer queried
      var sourceCfg = layerCfg.source;

      retrieveSearchFunc(sourceCfg.url, featureRequest(layerId, filter));
    }
    else // simple search
    {
      // retrieve value to search from simple search field
      var valueToSearch = $scope.searchObj["simple_search"];

      // get filter object
      // (there may be implementation with the decorator pattern)
      //var filterObj = wgSearchSvc.buildSimpleSearchFilter(layerId, valueToSearch)
      wgSearchSvc.buildSimpleSearchFilter(layerId, valueToSearch, function(filterObj)
      {
        filterArray     = filterObj ? filterObj.filterArray : [];
        operator_filter = filterObj ? filterObj.operator : null;

        // if not filter condition
        if (filterArray.length == 0)
        {
          $scope.selectedTab = 1;
          $scope.showLoader  = false;
          return;
        }

        // build condition AND|OR between more objFilter and return it
        //return wgMapSvc.buildWFSLayerFilter(filterArray, operator_filter);
        var filter = wgMapSvc.buildWFSLayerFilter(filterArray, operator_filter);

        // retrieve layer configuration for selected layer
        var layerCfg = wgMapSvc.layersCfgObj[layerId];

        // retrieve source configuration from layer queried
        var sourceCfg = layerCfg.source;

        retrieveSearchFunc(sourceCfg.url, featureRequest(layerId, filter));
      });
    }
  }

  /*
   * Build filter for geoJSON request and invoke call
   */
  function queryGeoJSONLayer(layerId, searchType, callback)
  {
    var filterArray = [];
    var filterObj = {};

    var layerCfg = wgMapSvc.layersCfgObj[layerId];

    // retrieve source configuration from layer queried
    var sourceCfg = layerCfg.source;

    // advanced search
    if (searchType == "advanced")
    {
      // retrieve filter condition
      filterObj = $scope.advancedConfigSearch.filter;

      var url = sourceCfg.url.substring(0, sourceCfg.url.indexOf("?")>0 ?
              sourceCfg.url.indexOf("?") : sourceCfg.url.length);

      // add other filters already present on the layer
      var thereAreURLFilter = sourceCfg.completeUrl.indexOf("filter=") > 0 ? true : false;
      var urlFilter = {};

      if (thereAreURLFilter)
      {
        // 7 is length of 'filter=' string
        var startPos = sourceCfg.completeUrl.indexOf("filter=") + 7;
        var endPos = sourceCfg.completeUrl.indexOf("&",startPos) > 0 ?
          sourceCfg.completeUrl.indexOf("&",startPos) :
          sourceCfg.completeUrl.length;

        var filterStr = sourceCfg.completeUrl.substring(startPos, endPos);
        var filterItemArr = filterStr.split(";");

        urlFilter = {
          groupOp: "AND",
          rules: filterItemArr,
          groups: [filterObj]
        };
      }

      var filter =  ($.isEmptyObject(urlFilter)) ? filterObj : urlFilter;

      return callback(url, {filter:filter});
    }
    else // simple search
    {
      // retrieve value to search from simple search field
      var valueToSearch = $scope.searchObj["simple_search"];

      // get filter object
      // (there may be implementation with the decorator pattern)
      //filterObj = wgSearchSvc.buildSimpleSearchFilter(layerId, valueToSearch);
      wgSearchSvc.buildSimpleSearchFilter(layerId, valueToSearch, function(filterObj)
      {
        // retrieve layer configuration for selected layer
        var layerCfg = wgMapSvc.layersCfgObj[layerId];

        // retrieve source configuration from layer queried
        var sourceCfg = layerCfg.source;

        // add other filters already present on the layer
        var thereAreURLFilter = sourceCfg.completeUrl.indexOf("filter=") > 0 ? true : false;
        var urlFilter = {};

        if (thereAreURLFilter)
        {
          // 7 is length of 'filter=' string
          var startPos = sourceCfg.completeUrl.indexOf("filter=") + 7;
          var endPos = sourceCfg.completeUrl.indexOf("&",startPos) > 0 ?
            sourceCfg.completeUrl.indexOf("&",startPos) :
            sourceCfg.completeUrl.length;

          var filterStr = sourceCfg.completeUrl.substring(startPos, endPos);
          var filterItemArr = filterStr.split(";");

          urlFilter = {
            groupOp: "AND",
            rules: filterItemArr,
            groups: [filterObj]
          };
        }

        //return ($.isEmptyObject(urlFilter)) ? filterObj : urlFilter;
        var filter =  ($.isEmptyObject(urlFilter)) ? filterObj : urlFilter;

        var url = sourceCfg.url.substring(0, sourceCfg.url.indexOf("?")>0 ?
              sourceCfg.url.indexOf("?") : sourceCfg.url.length);

        return callback(url, {filter:filter});
      });
    }
  }

  /*
   * convert js object Date (in string format) to formatted string
   */
  function getFormattedDate(dateStr)
  {
    var date = new Date(dateStr);

    var year = date.getFullYear();

    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;

    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;

    return day + '-' + month + '-' + year;
  }

  /*
   * convert js object Datetime (in string format) to formatted string
   */
  function getFormattedDateTime(dateStr)
  {
    var onlyData = getFormattedDate(dateStr);

    var date = new Date(dateStr);

    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();

    return onlyData + " " +
        ("0" + h).slice(-2) + ":" +
        ("0" + m).slice(-2) + ":" +
        ("0" + s).slice(-2);
  }

  /*
   * convert Bool object into string // TODO: translate?
   */
  function getFormattedBool(bool)
  {
    return bool ? "Sì" : "No";
  }

  /*
   * Called on new search
   */
  var resetQueryResult = function()
  {
    // hide search result layer
    layerSearchResult.setVisible(false);

    // remove interaction from map
    map.removeInteraction(wgMapSvc.searchConfig["interaction"]);

    // remove features from source (if is not null)
    if (wgMapSvc.searchConfig.source)
    {
      wgMapSvc.searchConfig.source.clear(true);
      wgMapSvc.searchConfig.source.refresh();
    }

    // remove features from scope object and from map service
    $scope.featuresArray = [];
    wgMapSvc.searchConfig["features"] = [];
  };

  /*
   * Called on result reset
   */
  $scope.resetSearch = function()
  {
    // hide search result layer
    layerSearchResult.setVisible(false);

    $scope.searchObj.simple_search = "";

    // activate watch to reset advanced search form
    $scope.advancedConfigSearch._reset++;

    resetQueryResult();

    $scope.selectedTab = 0;
    wgMapSvc.searchConfig["selectedTab"] = 0;
    wgMapSvc.searchConfig["layer_searched"] = '';
  };

  /*
   * Highlight in map the feature selected from panel of results
   * of query with customized style
   */
  $scope.clickFeature = function(feature)
  {
    // retrieve object feature OL
    var layerSearchResult = wgMapSvc.layersCfgObj[layerSearchId].layerOL;

    var feature_ol = layerSearchResult.getSource().getFeatureById(feature.id);

    // set extent for each feature selected
    var extent_feature = feature_ol.getGeometry().getExtent();

    if (wgMapSvc.searchConfig.source.get('projection') != 'EPSG:'+wgMapSvc.mapCurrSR.code)
    {
      extent_feature = ol.proj.transformExtent(
        extent_feature,
        wgMapSvc.searchConfig.source.get('projection'),
        'EPSG:' + wgMapSvc.mapCurrSR.code
      );
    }

    // center on point
    wgMapSvc.mapView.setCenter([
      (extent_feature[0]+extent_feature[2])/2,
      (extent_feature[1]+extent_feature[3])/2
    ]);

    var interaction = wgMapSvc.searchConfig["interaction"];

    // add alternately feature selected into collection interaction of type select
    if (interaction.getFeatures().getLength() > 0)
      interaction.getFeatures().pop();

    // add noScroll attribute to avoid to scroll result list
    feature_ol.set('noScroll', true, true);

    interaction.getFeatures().push(feature_ol);
  };

  /* Private Functions */

  /*
   * generate a GetFeature request
   */
  function featureRequest(layerId, filter)
  {
    // attributes returned
    propNameArr = [];

    // retrieve layer configuration for selected layer
    var layerCfg = wgMapSvc.layersCfgObj[layerId];

    // retrieve results configuration
    var searchResultArr = layerCfg.searchable.result;

    // configure array of properties to return
    for (var idx=0; idx<searchResultArr.length; idx++)
    {
      propNameArr.push(searchResultArr[idx].id);
    }

    propNameArr.push("geom");  // TODO modify this code; geometry field name could be different ...

    var getFeatureCfgObj =
    {
      srsName: 'EPSG:' + wgMapSvc.mapCurrSR.code,
      featureTypes: [layerCfg.source.layer_name],
      outputFormat: layerCfg.source.format,
      propertyNames: propNameArr
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

    // create getFeature request
    var getFeatureRequest = new ol.format.WFS().writeGetFeature(getFeatureCfgObj);

    // serialize and return feature request
    return new XMLSerializer().serializeToString(getFeatureRequest);
  }
};

angular.module("webgis").controller("searchCtrl",searchCtrl);
