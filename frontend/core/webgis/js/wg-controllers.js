/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("webgis")
  .controller("wgMapCtrl",wgMapCtrl)
  .controller("wgLegendClassCtrl",wgLegendClassCtrl)
  .controller("wgFilterItemCtrl",wgFilterItemCtrl)
  .controller("wgStylesCtrl",wgStylesCtrl)
  .controller("wgStylesDefaultObjectCtrl",wgStylesDefaultObjectCtrl);


function wgMapCtrl($scope, $rootScope, $http, wgMapSvc, rwHttpSvc)
{
  $scope.showSidebar = $rootScope.rwShowSidebar;

  // watermark to show on the map
  $scope.watermark = "";

  // map reference system
  $scope.mapCurrSR = null;

  // array of map controls
  $scope.controls = [];

  // control title (to show in control box)
  $scope.controlTitle = null;

  // height of map controls panel
  $scope.toolsPanelHeight = null;

  // flag to control if map controls panel is open
  $scope.toolsPanelIsOpen = true;

  // div id of active map control
  $scope.enabledToolId = null;

  // current scale value
  $scope.currScale = null;

  // variable to set style for selected control
  $scope.selectedControl = {};

  // initial value of box controls width
  var boxControlWidth = $("#boxControls").width();

  // support variable to dynamic positioning of tool buttons
  var controlWidth;

  /*
   * Map configuration
   */
  $scope.configMap = function()
  {
    if ($scope.wgConfig.map)
    {
      // acquire watermark value from map service
      $scope.watermark = $scope.wgConfig.map.watermark;

      // acquire controls config
      $scope.controls = $scope.wgConfig.map.tools;

      // dynamic positioning of tool buttons
      controlWidth = $("#mapControls").width()/$scope.controls.length;

      // truncate width to 2 decimal place to avoid approximation error
      controlWidth = Math.round(controlWidth * 100) / 100;

      $scope.controlWidthStyle = "width: " + controlWidth + "px;";
    }
  };

  /*
   * Get from map service JSON configuration object
   */
  wgMapSvc.getConfig(function(res)
  {
    $scope.wgConfig = res;

    // invoke map configuration
    $scope.configMap();

    // valorize current scale value
    $scope.currScale = wgMapSvc.currScale;
  });

  /*
   * Enable a map control
   * toOpenParam is an optional parameter; set to true to force tool panel opening
   */
  $scope.getControl = function(tool, toOpenParam)
  {
    toOpenParam = toOpenParam || false;

    if (!$scope.toolsPanelHeight)
      setToolsPanelHeight();

    // deselect style for old tool
    $scope.selectedControl[$scope.enabledToolId] = "";

    // set enabled tool id and box title
    if ($scope.enabledToolId == tool.id && !toOpenParam)
    {
      $scope.enabledToolId = null;
      $scope.controlTitle  = null;
    }
    else
    {
      $scope.enabledToolId = tool.id;
      $scope.controlTitle  = tool.tip;
      $scope.selectedControl[tool.id] = "selectedControl";
    }
  };

  /*
   * Manage tools panel opening and closing
   */
  $scope.manageToolsPanel = function(openFlag)
  {
    if (openFlag)
    {
      $("#boxControlContent").show();
      $("#toolsPanel").show();
    }
    else
    {
      $("#boxControlContent").hide();
      $("#toolsPanel").hide();
    }

    $scope.toolsPanelIsOpen = openFlag;
  };

  /*
   * Manage sidebar opening and closing
   */
  $scope.manageSidebar = function()
  {
    $rootScope.$broadcast("showSidebar");
  };

  /*
   * Window resize event
   */
  $(window).resize(function()
  {
    // Adjust map height according to window height
    $("#mapDiv").height($(window).height() - $("#mapDiv").offset().top - ($rootScope.rwShowFooter ? 60 : 0));

    // check control div (#boxControls) width to rearrange tools icon
    if (boxControlWidth != $("#boxControls").width())
    {
      boxControlWidth = $("#boxControls").width();

      controlWidth = $("#mapControls").width()/$scope.controls.length;

      $scope.controlWidthStyle = "width: " + controlWidth + "px;";
    }

    // set tools panel height on window resize
    $scope.$apply(setToolsPanelHeight());
  });


  /*
   * Calculate tools panel height
   */
  function setToolsPanelHeight()
  {
    $scope.toolsPanelHeight =
      $("#mapCoords").offset().top -
      $("#boxControlContent").offset().top -
      $("#boxControlContent").height() -
      8 - // padding of div into toolsPanel div (layersPanel, coordsPanel, ...)
      10;
  }

  /*
   * Intercept changeResolution to update currScale variable
   */
  $scope.$on('changeResolution', function(e, currScale)
  {
    $scope.currScale = currScale;

    $.each(wgMapSvc.layersCfgObj, function(i,layerCfg)
    {
      wgMapSvc.setResolutionLayer(layerCfg)
    })
  });

  /*
   * Intercept editing event from extern of gis tools
   */
  $rootScope.$on("openGisEditPanelEvent", function(ev, layerId, editOpt, callback)
  {
    // set edit configuration
    wgMapSvc.editCfg = {
      editProcess: editOpt.editProcess, //wgMapSvc._EXTERN_EDIT_PROCESS_,
      layerId: layerId,
      mode: editOpt.mode ? editOpt.mode : wgMapSvc.editModeInsert, // if mode is not specify, set it to insert
      features: editOpt.features,
      callback: callback
    };

    // invoke edit controller
    $scope.getControl({id:'edit', tip:'WEBGIS.TLP.CTRL_EDIT'}, true);
  });

  /*
   * Intercept open layers panel event from extern of gis tools
   */
  $rootScope.$on("openGisLayerPanelEvent", function(ev, callback)
  {
    // invoke edit controller
    $scope.getControl({id:'layers', tip:'WEBGIS.TLP.CTRL_LAYERS'}, true);
  });
};

function wgLegendClassCtrl($scope,rwHttpSvc,rwConfigSvc)
{
  $scope.fileExt = null;
  $scope.disableIcon = true;
  $scope.showError = false;
  $scope.errorMsg = "";

  $scope.iconToDownload = null;
  $scope.iconToShow = null;

  // Form Configuration
  $scope.formCtrlObj = {};
  $scope.formCfg =
  {
    id:"formCfg", fg:
    [
      {
        show:true, label:"", rows:
        [
          []
        ]
      }
    ]
  }

  // Populate formCfg
  var labelFormFg =  $scope.formCfg.fg[0].rows[0];

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

    labelFormFg.push(formObj);
  }

  /* Initialize imageToShow and iconToShow */
  if($scope.class.image)
  {
    $scope.iconToShow = $scope.class.image;
    $scope.disableIcon = false;
  }
  // Url to download image
  $scope.iconToDownload =  $scope.iconToShow;

  /* Scope functions */
  $scope.deleteIcon = function()
  {
    // Remove image from the entity
    $scope.class.image = null;
    // Reset scope variables
    $scope.iconToShow = null;
    $scope.iconToDownload = null;
    $scope.fileExt = null;

    // Disable delete icon
    $scope.disableIcon = true;
  }

  /* Watches */

  $scope.$watch("fileIcon", function(newObj,oldObj)
  {
    if (newObj == undefined)
      return;

    $scope.iconToDownload = null;

    // Dictionary of img extensions
    var imageExtensions = { img:"", png:"", jpg:"", jpeg:"", gif:""};

    // Get the file extension
    $scope.fileExt = _getFileExtension(newObj.name);

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
          $scope.iconToShow =
            image.replace(/^data:image\/(img|png|jpg|jpeg|gif);base64,/, "");
          // Save the new image into the layerEntity
          $scope.class.image = $scope.iconToShow;
          $scope.$apply();
        };

        // Read the original obj to show a preview, instantly
        reader.readAsDataURL(newObj);
      }
      else
      {
        // Show error to the user
        $scope.showError = true;
        $scope.errorMsg = "WEBGIS.ICON_CHARGE_ERR";
      }

      // Enable send button
      $scope.disableIconSend = false;
    }
  });

  /* Private functions */

  function _getFileExtension(filename)
  {
    var aSplittedFilename = filename.split(".");
    var fileExtension = null;
    if(aSplittedFilename.length > 0)
    {
      //Get the file extension
      fileExtension = aSplittedFilename[aSplittedFilename.length-1];
    }
    return fileExtension;
  }
}

function wgFilterItemCtrl($scope)
{
  $scope.$watch("entity",function(nv,ov)
  {
    if(nv != undefined)
    {
      _layerFilterAttributeChanged("operator",nv.operator,ov);
    }
  });

  $scope.$watch("entity.operator",function(nv,ov)
  {
    _layerFilterAttributeChanged("operator",nv,ov);
  });

  /* Private function */
  function _layerFilterAttributeChanged(attr,nv,ov)
  {
    if(nv==undefined)
    {
      if($scope.entity)
        $scope.entity.operands_number = null;
      return;
    }

    switch(attr)
    {
      case "operator":
        // Find operands number of selected operator and set into the entity
        var aOperators = $scope.entity.operators;
        for(var i=0,found = false; i<aOperators.length && !found;i++)
        {
          var op = aOperators[i];
          if(op.id == nv)
          {
            found = true;
            $scope.entity.operands_number = op.operands;
          }
        }
        break;
    }
  }
}

function wgStylesCtrl($scope,rwHttpSvc,wgLayerStyle,wgLayerTreeSvc)
{
  // ui-tree configurations (delay to switch between click and drag)
  $scope.dataDragDelay = 250;

  $scope.stylesTreeOpt =
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

  // Set Array for default's object type.
  $scope.aDefaultObjType = wgLayerTreeSvc.stylesTypesArray;

  $scope.addDefaultStyleObj = function()
  {
    if($scope.entity instanceof wgLayerStyle)
      $scope.entity.addDefaultObject();
  }

  $scope.removeDefaultStyleObj = function(idx)
  {
    if($scope.entity instanceof wgLayerStyle)
    {
      var defaultStyleObj = $scope.entity.defaultObjectAtIndex(idx);

      if(defaultStyleObj.type && defaultStyleObj.type.name == "image")
      {
        // Control if there is a src
        if(defaultStyleObj.src != undefined)
        {
          // Remove the attachment before remove style
          var aSplittedSrc = defaultStyleObj.src.split("/");

          if(aSplittedSrc.length)
          {
            var filenameToDel = aSplittedSrc[aSplittedSrc.length-1];
            var layerId = aSplittedSrc[2];

            $scope.$emit("showAlert",
            {
              msg: "CORE_MSG.DELETE_MSG",
              btOk: "WORDS.YES",
              btKo: "No",
              style: "info",
              callback: function()
              {
                var delUrl = "/wgLayer/"+layerId+"/delAttachByName/"+filenameToDel;

                /* Delete */
                $scope.showLoader = true;
                rwHttpSvc.delete(delUrl,function(res)
                {
                  $scope.showLoader = false;
                  if (res && res.result)
                  {
                    // Remove the style
                    $scope.entity.removeDefaultObject(idx);
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
            });
          }
        }
        else
          $scope.entity.removeDefaultObject(idx);
      }
      else
        $scope.entity.removeDefaultObject(idx);
    }
  }
}

function wgStylesDefaultObjectCtrl($scope,rwConfigSvc,rwHttpSvc)
{
  $scope.colorPreviewStyle = {};
  $scope.aFillPatterns = [];
  $scope.dFillPatterns = {};

  // Image url used to show a preview
  $scope.dImage = {};
  $scope.emptyImagePath = './image/empty_gallery.png';

  // Popuplate aFillPatterns array
  for(var i in ol.style.FillPattern.prototype.patterns)
  {
    var p = new ol.style.FillPattern({ pattern:i });
    var obj = { id:i, image:p.getImage().toDataURL() };

    $scope.aFillPatterns.push(obj);
    $scope.dFillPatterns[i] = obj;
  }

  /* Scope functions */
  // Function called when user click on feature attribute's item into popup
  $scope.changedFeatureAttribute = function(selectedFeature)
  {
    if(selectedFeature != undefined)
    {
      var selectedFtAttr = selectedFeature.id;
      var input = $("#"+$scope.attr.id)[0];
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
        range.moveStart ("character", -$scope.entity[$scope.attr.id].length);
        pos = range.text.length;
      }
      else if (browser == "ff")
        pos = input.selectionStart;

      if($scope.entity[$scope.attr.id] != undefined)
      {
        front = ($scope.entity[$scope.attr.id]).substring(0, pos);
        back = ($scope.entity[$scope.attr.id])
          .substring(pos, $scope.entity[$scope.attr.id].length);
      }
      $scope.entity[$scope.attr.id] = front+selectedFtAttr+back;
      pos = pos + selectedFtAttr.length;
      if (browser == "ie")
      {
        input.focus();
        var range = document.selection.createRange();
        range.moveStart ("character", -$scope.entity[$scope.attr.id].length);
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
    }
  }

  /* Function used to show/hide feature attribute select according to the
   * attribute type */
  $scope.showFtAttribSelect = function()
  {
    var res = false;
    if($scope.attr.type != 'boolean' && $scope.attr.type != 'combo')
      res = true;

    return res;
  }

  /* Listener */
  $scope.$on("colorpicker-closed",function(ev,data)
  {
    if(data)
    {
      var color = data.value;
      // Create color style for preview's color div
      $scope.colorPreviewStyle[data.fieldId] = { 'background-color':color,
        border:'1px solid #ccc'};
      $scope.$apply();
    }
  });

  /* Watches */
  $scope.$watch("entity",function(nv,ov)
  {
    if(nv == undefined)
      return;

    if(nv.type)
    {
      if(nv.type.attributes.length)
      {
        for(var i=0; i<nv.type.attributes.length; i++)
        {
          var attr = nv.type.attributes[i];
          /* Manage colors if colorPicker is defined */
          if(attr.type == "colorPicker")
          {
            // Get color from the entity
            var color = nv[attr.id];
            if(color != undefined)
            {
              // Set selected color
              $scope.colorPreviewStyle[attr.id] = {'background-color':color,
                border:'1px solid #ccc'};
            }
            else
            {
              // Set default color white
              $scope.colorPreviewStyle[attr.id] = {'background-color':'white',
                border:'1px solid #ccc'};
            }
          }
          else if(attr.type == "image")
          {
            // Add object into the dictionary
            $scope.dImage[attr.id] = {imgToUpload:null,imgUrl:$scope.emptyImagePath,filename:null};
            // Get image url from the entity, to show a preview
            var url = nv[attr.id];
            if(url)
            {
              $scope.dImage[attr.id].imgUrl = rwConfigSvc.urlPrefix+url;
              // Find filename from url and setted into dImage dictionary
              var aSplittedUrl = url.split("/");
              if(aSplittedUrl.length)
              {
                // Filename is ever the last object
                var fileName = aSplittedUrl[aSplittedUrl.length-1];
                $scope.dImage[attr.id].filename = fileName;
              }
            }
          }
        }
      }
    }
  },true);

  $scope.$watch("dImage", function(newObj, oldObj)
  {
    var imgExtensions = { png:"" ,jpg:"",jpeg:"" };

    // Loop through new object and compare
    angular.forEach(newObj, function(val, key)
    {
      var oldVal = oldObj[key];

      if(val !== oldVal) // dImage[key] changed
      {
        if(val.imgToUpload != undefined)
        {
          if(!angular.equals(val.imgToUpload,oldVal.imgToUpload)) // Image is changed
          {
            var newImageObj = val.imgToUpload;
            var imageName = newImageObj.name;

            $scope.fileExt = getFileExtension(imageName);
            if($scope.fileExt != null)
            {
              // The file is an image
              if(imgExtensions.hasOwnProperty($scope.fileExt))
              {
                // Create a new file
                var file = new File([newImageObj],imageName);
                var opt = {file:file,descr:""};

                //Upload the file
                $scope.showLoader = true;
                rwHttpSvc.upload("/wgLayer/"+$scope.layerId+"/upload",opt,function(res)
                {
                  $scope.showLoader = false;
                  if (res && res.data && res.data.result)
                  {
                     // Update entity
                    $scope.entity[key] ="/wgLayer/"+$scope.layerId+"/getFile/"+
                      imageName;

                    // Set imgUrl into dImage (adding it_app_auth to get preview)
                    val.imgUrl = rwConfigSvc.urlPrefix+ $scope.entity[key];

                    // Set filename into dImage
                    val.filename = imageName;
                    // Reset imgToUpload
                    val.imgToUpload = null;
                  }
                  else //There is an error
                  {
                    val.imgToUpload = null;
                    $scope.$emit("showAlert",{
                      msg: "WEBGIS.ICON_CHARGE_ERR",
                      btKo: "Ok",
                      style: "danger"});
                  }
                });
              }
              else
              {
                // Reset imgToUpload
                val.imgToUpload = null;

                $scope.$emit("showAlert",{
                  msg: "CORE_MSG.INVALID_FORMAT",
                  btKo: "Ok",
                  style: "danger"});
              }
            }
          }
        }
      }
    });

  },true);

  $scope.$watch("imgEntity.imgUrl",function(nv,ov)
  {
    if(nv == undefined)
      return;
  });

  $scope.deleteImage = function(dObj,attrId)
  {
    $scope.$emit("showAlert",
    {
      msg: "CORE_MSG.DELETE_MSG",
      btOk: "WORDS.YES",
      btKo: "No",
      style: "info",
      callback: function()
      {
        var filenameToDel = dObj.filename;
        var delUrl = "/wgLayer/"+$scope.layerId+"/delAttachByName/"+filenameToDel;

        /* Delete */
        $scope.showLoader = true;
        rwHttpSvc.delete(delUrl,function(res)
        {
          $scope.showLoader = false;
          if (res && res.result)
          {
            // Reset dImage object
            dObj.imgToUpload = null;
            dObj.imgUrl = $scope.emptyImagePath;
            dObj.filename = null;

            // Update Entity
            $scope.entity[attrId] = null;
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
    });
  };

  /* Functions */
  function getFileExtension(filename)
  {
    var aSplittedFilename = filename.split(".");
    var fileExtension = null;
    if(aSplittedFilename.length > 0)
    {
      //Get the file extension
      fileExtension = aSplittedFilename[aSplittedFilename.length-1];
    }
    return fileExtension;
  }
}
