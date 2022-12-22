/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

 angular.module("webgis").controller("wgCtrlManageMap",wgCtrlManageMap);

function wgCtrlManageMap($scope,wgMapSvc,rwHttpSvc)
{
  $scope.serviceMapFormObj = {};

  // contains list of services
  $scope.servicesArray = wgMapSvc.serviceMapConfig.services;


  /* retrieve category with layers array empty */
  wgMapSvc.getConfig(function(res)
  {
    $scope.wgConfig = res;

    /*var categories = $scope.wgConfig.layers.categories;
    for(var i=0; i<categories.length; i++)
    {
      if (categories[i].layers.length == 0)
      {
        wgMapSvc.serviceMapConfig.category["id"] = categories[i].id;
        wgMapSvc.serviceMapConfig.category["label"] = categories[i].label;
      }
    }*/
  });


  $scope.formCtrlObj = {};
  $scope.icon_accordion = true;
  $scope.showLoader = false;
  $scope.panel_accordion_body = "panel-accordion-body";

  var serviceTypeCombo = [{"id":"WMS","name":"WMS"}]



  $scope.serviceMapFormCfg =
  {
    id: "serviceMapForm",
    fg:
    [
      {
        show: true, label: "WEBGIS.GEOSERVICE.ADD_SERVICES", rows:
        [
          [
            {
              id: "service_type",
              label: "WEBGIS.GEOSERVICE.SERVICE_TYPE",
              type: "select",
              width: 6,
              height: "input-sm",
              options: serviceTypeCombo,
              required: true, enabled: true, show: true
            },
            {
              id: "service_name",
              type: "text",
              label: "WEBGIS.GEOSERVICE.SERVICE_NAME",
              width: 6,
              height: "input-sm",
              customErrMsg: "",
              required: true, enabled: true, show: true
            }
          ],
          [
            {
              id: "service_url",
              type: "text",
              label: "WEBGIS.GEOSERVICE.SERVICE_URL",
              width: 9,
              height: "input-sm",
              customErrMsg: "CORE_MSG.INVALID_URL",
              required: true, enabled: true, show: true
            },
            {
              id: "btn_service",
              type: "glyphButton",
              label: "",
              width: 3,
              icon: "download-alt",
              height: "input-sm",
              title: "WORDS.DOWNLOAD",
              required: false, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  }


  $scope.$watch("serviceMapFormObj.btn_service", function(nv,ov)
  {
    if (nv == undefined)
      return;
    $scope.formCtrlObj["serviceMapForm"].isValid();


    var label_service = $scope.serviceMapFormObj["service_name"];
    var url_service   = $scope.serviceMapFormObj["service_url"];
    var type_service  = $scope.serviceMapFormObj["service_type"];

    if (label_service == "" || label_service == undefined)
      return;
    if (url_service == "" || url_service == undefined)
      return;
    if (type_service == "" || type_service == undefined)
      return;

    // check for presence of ? in url_service
    var quesryStringAppender = (url_service.indexOf('?') > 0) ? '&' : '?';

    var capUrl = url_service + quesryStringAppender + "request=GetCapabilities&service=" + type_service;

    /* get request to service*/
    var url = "/utility/proxy?url=" + encodeURIComponent(capUrl);

    //var url = "/webgis/proxyRequest/" + url_service + quesryStringAppender +
    //    "request=getcapabilities&service=" + type_service;

    // check if url or custom label of service is already request
    for (var i=0; i<$scope.servicesArray.length; i++)
    {
      if ($scope.servicesArray[i].url == url)
      {
        var msg = "WEBGIS.GEOSERVICE.DUPLICATE_GEOSERVICE_URL";
        $scope.serviceMapFormCfg.fg[0].rows[1][0].customErrMsg = msg;
        validityField(true,"service_url");
        return;
      }
      else
        validityField(false,"service_url");

      if ($scope.servicesArray[i].label == label_service)
      {
        var msg = "WEBGIS.GEOSERVICE.DUPLICATE_GEOSERVICE_NAME";
        $scope.serviceMapFormCfg.fg[0].rows[0][1].customErrMsg = msg;
        validityField(true,"service_name");
        return;
      }
      else
        validityField(false,"service_name");
    }

    $scope.showLoader = true;

    // request service
    rwHttpSvc.get(url, function(response)
    {
      $scope.showLoader = false;

      if (response)
      {
        try {
          var parser = new ol.format.WMSCapabilities();
          var service = parser.read(response);
        }
        catch(err) {
          validityField(true,"service_url");
          return;
        }

        $scope.showLoader = false;

        if (service.hasOwnProperty("Capability"))
        {
          // reset fields of form only if the service responce is correct
          $scope.serviceMapFormObj["service_name"] = "";
          $scope.serviceMapFormObj["service_url"] = "";


          var layersObj = {};
          // retrieve all layers list returned from service
          if (service.Capability.Layer.hasOwnProperty("Layer"))
          {
            getLayersService(service.Capability.Layer.Layer, layersObj);
          }
          // retrieve the only layer returned from service
          else
          {
            var singleLayer = service.Capability.Layer;
            var minScale = "";
            var maxScale = "";
            if (singleLayer.MinScaleDenominator)
              var minScale = singleLayer.toFixed(0);
            if (singleLayer.MaxScaleDenominator)
            {
              minScale = (minScale == "") ? 1: minScale;
              var maxScale = singleLayer.toFixed(0);
            }

            /* Id of layer is composed from name and title;
               is possible have different service, who has same name */
            var layerId = singleLayer.Name + "_" + singleLayer.Title;

            layersObj[layerId] =
              { "label": singleLayer.Title,
                "id": layerId,
                "layer_name": singleLayer.Name,
                "min_scale": minScale,
                "max_scale": maxScale,
                "added": false
              };

          }

          // setting configuration for single service added
          $scope.servicesArray.push({
            "layers": layersObj,
            "url_service": url_service,
            "url": url,
            "type": type_service,
            "label": label_service,
            "added": false,
            "layersAdded": 0,
            "width": service.Service.MaxWidth,
            "height": service.Service.MaxHeight});
        }
        else
        {
          // if responce return service exception or however a invalid xml
          validityField(true,"service_url");
        }
      }
      else
      {
        // there isn't responce for request
        validityField(true,"service_url");
        $scope.showLoader = false;
      }
    })
  })

  // show custom message for validity of fields
  function validityField(bool,field)
  {
    $scope.formCtrlObj["serviceMapForm"].showCustomErrOnField(field,bool)
    $scope.formCtrlObj["serviceMapForm"].isValid();
  }

  // retrieve recursively all layers for the service
  function getLayersService(array, layersObj)
  {
    for(var i=0; i < array.length; i++)
    {
      var item = array[i];

      if (item.hasOwnProperty("Layer"))
      {
        getLayersService(item.Layer, layersObj);
      }
      else
      {
        var minScale = "";
        var maxScale = "";
        if (item.MinScaleDenominator)
          var minScale = item.MinScaleDenominator.toFixed(0);
        if (item.MaxScaleDenominator)
        {
          minScale = (minScale == "") ? 1: minScale;
          var maxScale = item.MaxScaleDenominator.toFixed(0);
        }

        var layerId = item.Name + "_" + item.Title;
        var layerObj = {
          label: item.Title,
          id: layerId,
          layer_name: item.Name,
          min_scale: minScale,
          max_scale: maxScale,
          added: false
        }

        layersObj[layerId] = layerObj;
      }
    }
    return layersObj
  }



  // add layer from service Map to controller layers list
  $scope.addLayerToMap = function(posService,layerId)
  {
    var url = $scope.servicesArray[posService].url_service;
    var layersForService = $scope.servicesArray[posService].layers;
    var type_service = $scope.servicesArray[posService].type;
    var name_service = $scope.servicesArray[posService].label;
    var layer = layersForService[layerId];
    var width = $scope.servicesArray[posService].width;
    var height = $scope.servicesArray[posService].height;


    layer.added = true;

    // increases number of layers added for service
    $scope.servicesArray[posService].layersAdded += 1;

    // if the layers numbers added is equal to layers numbers for the service
    // then change icon for add all together layers
    if ($scope.servicesArray[posService].layersAdded ==
          Object.keys(layersForService).length)
      $scope.servicesArray[posService].added = true;


    var layerCfg = {
      id: layer.id,
      label: layer.label,
      icon: "image/webgis/layer/group.png",
      type: "IMAGE",
      tiled : false,
      source: {
        type: type_service,
        url: url,
        layer_name: layer.layer_name,
        projection: wgMapSvc.mapCurrSR.code,
        transparent: true,
        format: "image/png",
        version: "1.1.1"
      },
      layerType: "SIMPLE_LAYER",
      legend: {"label":layer.label,"extern":true},
      opacity: 1,
      visible: true,
      id_category: wgMapSvc.serviceMapConfig.category.id,
      selected: true,
      disabled: false,
      temporary: true,
      serviceId: name_service
    };

    if (width)
    {
      layerCfg.tiled = true;
      layerCfg.source.width = width;
    }
    if (height)
    {
      layerCfg.tiled = true;
      layerCfg.source.height = height;
    }

    // added layer configuration to category list;
    // this is need for show layers in panels of layers and in legend
    wgMapSvc.serviceMapConfig.category.layers.push(layerCfg);

    wgMapSvc.layersCfgObj[layer.id] = layerCfg;

    // add layer to map
    wgMapSvc.addLayer(layerCfg);
  }

  $scope.addAllLayersForService = function(posService)
  {
    var layersForService = $scope.servicesArray[posService].layers;

    $scope.servicesArray[posService].added = true;

    $.each(layersForService, function(layerId, layer)
    {
      if (!layer.added)
        $scope.addLayerToMap(posService,layerId)
    })

    // reset value attribute "layersAdded"
    $scope.servicesArray[posService].layersAdded =
        Object.keys(layersForService).length;
  }

  $scope.removeAllLayersForService = function(posService)
  {
    var layersForService = $scope.servicesArray[posService].layers;
    $scope.servicesArray[posService].added = false;

    $.each(layersForService, function(layerId, layer)
    {
      if (layer.added)
        $scope.removeLayerToMap(posService,layer.id)
    });

    // reset to 0  attribute "layersAdded"
    $scope.servicesArray[posService].layersAdded = 0;
  }

  //remove single layr from the service
  $scope.removeLayerToMap = function(posService,layerId)
  {
    //retrived all layers for a specific service
    var layersForService = $scope.servicesArray[posService].layers;

    var layersCategory = wgMapSvc.serviceMapConfig.category.layers;
    var layer = layersForService[layerId];

    //disable single layer of a specific service
    layer.added = false;

    $scope.servicesArray[posService].layersAdded -= 1;

    /* change icon for added or removed all together layers for a service */
    if ($scope.servicesArray[posService].layersAdded == 0)
      $scope.servicesArray[posService].added = false;

    // remove layerOL from map
    wgMapSvc.getMap().removeLayer(wgMapSvc.layersCfgObj[layer.id].layerOL);

    // remove layer from panels of layers and legend
    delete wgMapSvc.layersCfgObj[layer.id];

    for(var i=0; i<layersCategory.length; i++)
    {
      if (layersCategory[i].id == layerId)
        layersCategory.splice(i,1);
    }
  }

  // remove entire service
  $scope.removeAccordion = function(event)
  {
    var posService = this.$index
    var layersForService = $scope.servicesArray[posService].layers;

    $.each(layersForService, function(layerId, layer)
    {
      if (layer.added)
        $scope.removeLayerToMap(posService, layer.id)
    });

    //remove accordion
    $scope.servicesArray.splice(posService, 1);
  }
}