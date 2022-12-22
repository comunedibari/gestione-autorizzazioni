/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("core")
  .directive("rwAttachManager",rwAttachManager)
  .directive("rwFileModel",rwFileModel)
  .directive("rwSearchTools",rwSearchTools)
  .directive("rwSearchButton",rwSearchButton)
  .directive("rwSearchCondition",rwSearchCondition)
  .directive("rwSearchGroup",rwSearchGroup)
  .directive("rwSearch",rwSearch)
  .directive("rwForm",rwForm)
  .directive("rwTable",rwTable)
  .directive("rwCollection",rwCollection)
  .directive("rwPagination",rwPagination)
  .directive("rwPopupCollection",rwPopupCollection)
  .directive("rwModalHeader",rwModalHeader)
  .directive("rwModalMovable",rwModalMovable)
  .directive("rwModalPrint",rwModalPrint)
  .directive("rwChange",rwChange);

function rwModalMovable()
{
  return {
    restrict: "AC",
    link: function($scope,element)
    {
      var draggableStr = "draggableModal";
      var header = element;

      // Set cursor
      header.css("cursor","move");

      // Enable motion
      header.on("mousedown",function(mouseDownEvent)
      {
        var  modal = header.closest(".modal-dialog");
        var offset = modal.offset();

        // If modal is modaless, must move its parent
        if (modal.parent().hasClass("modaless"))
        {
          modal = modal.parent();
          offset = modal.offset();

          // Manage z-index to order front selected modal
          // (If not modaless only 1 modal can be visible)
          $(".modal").each(function(i,obj)
          {
            $(obj).css("z-index",1050);
          });

          modal.css("z-index",1055);
        }

        modal.addClass(draggableStr)//.parents()
          .on("mousemove",function(mouseMoveEvent)
          {
            var top = mouseMoveEvent.pageY - (mouseDownEvent.pageY - offset.top);
            var left = mouseMoveEvent.pageX - (mouseDownEvent.pageX - offset.left);

            $("." + draggableStr).offset(
            {
              top: top > 0 ? top : 0,
              left: left
            });
          })
          .on("mouseup",function()
          {
            // Remove event's handler
            modal.off("mousemove");
            modal.off("mouseup");
            modal.removeClass(draggableStr);
          });
      });

      // Enable touch motion
      header.on("touchstart",function(e)
      {
        var touchobj = null,startX = null,startY = null,modalLeft = null,
          modal = header.closest(".modal-dialog"), offset = modal.offset();

        // If modal is modaless, must move its parent
        if (modal.parent().hasClass("modaless"))
        {
          modal = modal.parent();
          // Manage z-index to order front selected modal
          // (If not modaless only 1 modal can be visible)
          $(".modal").each(function(i,obj)
          {
            $(obj).css("z-index",1050);
          });

          modal.css("z-index",1055);
        }

        touchobj = e.originalEvent.changedTouches[0]; // reference first touch point
        modalLeft = modal.offset().left;
        modalTop = modal.offset().top;
        startx = parseInt(touchobj.clientX) // get x coord of touch point
        starty = parseInt(touchobj.clientY) // get y coord of touch point
        e.preventDefault(); // prevent default click behavior

        modal.addClass(draggableStr).on("touchmove",function(e)
        {
          touchobj = e.originalEvent.changedTouches[0]; // reference first touch point

          // calculate dist traveled by touch point
          var distX = parseInt(touchobj.clientX) - startx;
          var distY = parseInt(touchobj.clientY) - starty;

          var offsetObj = {
            left: modalLeft + distX ,
            top: modalTop + distY

          };
          // Set the new offset
          $("." + draggableStr).offset(offsetObj);
          e.preventDefault();
        })
        .on("touchend",function()
        {
          // Remove event's handler
          modal.off("touchmove");
          modal.off("touchend");
          modal.removeClass(draggableStr);
        });
      });

      $scope.$on('$destroy', function()
      {
        // deregister all event handlers
        header.off();
      });
    }
  };
}

function rwModalHeader()
{
  return {
    templateUrl: "core/views/rw-modal-header.html",
    controller: "rwModalHeaderCtrl",
    restrict: "E",
    scope: {config: "="}
  };
}

function rwTable()
{
  return {
    templateUrl: "core/views/rw-table.html",
    controller: "rwTableCtrl",
    restrict: "E",
    scope: {config: "="}
  };
}

function rwCollection()
{
  return {
    templateUrl: "core/views/rw-collection.html",
    controller: "rwCollectionCtrl",
    restrict: "E",
    scope: {config: "="}
  };
}

function rwPagination()
{
  return {
    templateUrl: "core/views/rw-pagination.html",
    controller: "rwPaginationCtrl",
    restrict: "E",
    scope: {config: "="}
  };
}

function rwPopupCollection()
{
  return {
    templateUrl: "core/views/rw-popup-collection.html",
    controller: "rwPopupCollectionCtrl",
    restrict: "E",
    scope:
    {
      btnclass: "=",
      config: "="
    }
  };
}

function rwForm()
{
  return {
    templateUrl: "core/views/rw-form.html",
    restrict: "E",
    scope: {config:"=", entity:"=", controllers:"="},
    link: function(scope,elem,attrs)
    {
      // Dictionary containing form fields
      scope.fieldsDict = {};
      //Dictionary containing date form field opened flag
      scope.popupDict = {};

      scope.formStyle = {};

      /* angular-summernote options */
      scope.summOpt =
      {
        disableResizeEditor: true,
        toolbar:[
          ['codeview',['codeview']],
          ['edit',['undo','redo']],
          ['style', ['bold', 'italic', 'underline']],
          ['font',['fontsize','fontname','clear']],
          ['color', ['color']],
          ['para',['ul', 'ol', 'paragraph']],
          ['insert', ['link']]
        ]
      };

      /* Variables for bootstrap-ui-datetime-picker*/
      scope.formatDatetime = 'dd/MM/yyyy HH:mm';
      var splittedFormat = scope.formatDatetime.split(' ');
      scope.formatDate = splittedFormat[0];
      scope.formatTime = splittedFormat[1];
      scope.dateOptions = {showWeeks:false};
      scope.timeOptions = {showWeeks:false,showSpinners:false};
      scope.buttonBar=
      {
        show:true,
        now: {show: false},
        today: {show: false},
        clear: {show: true},
        date: {show: true},
        time: {show: true},
        close: {show: true}
      }

      /* Populate fieldsDict and popupDict */
      if(scope.config)
      {
        // Get the changeCallback function to notify attribute change
        scope.changeCallback = scope.config.changeCallback;

        //Get fieldgroups
        var aFieldgroups = scope.config.fg, numFg = aFieldgroups.length;
        for(var i=0; i< numFg; i++)
        {
          var fieldgroup = aFieldgroups[i];

          // Get fieldgroup rows
          var aFgRows = fieldgroup.rows, numRows = aFgRows.length;
          for(var j=0;j<numRows;j++)
          {
            var row = aFgRows[j], numCol = row.length;
            for(var k=0; k<numCol; k++)
            {
              //Get field
              var field = row[k];
              //Memorize the field in the dictionary
              scope.fieldsDict[field.id] = field;
              //Populate popupDict dictionary
              if (field.type == "datetime" || field.type == "date" ||
                  field.type == "time" || field.type == "timestamp")
                scope.popupDict[field.id] = { opened:false };
            }
          }
        }
        // Get maxHeight if defined
        if(scope.config.maxHeight != null)
        {
          scope.formStyle["max-height"] = scope.config.maxHeight;
          scope.formStyle["overflow-y"] = "auto";
        }

        // Function used to open bootstrap-ui-datetime-picker
        scope.openPopup = function (popup)
        {
          scope.popupDict[popup].opened = true;
        }
      }

      scope.valueBoolean = function(value)
      {
        switch(value)
        {
          case true:
           return "Si";
          case false:
            return "No";
          default:
            return "";
        };
      };

      scope.changeBoolean = function(field, value)
      {
        switch(value)
        {
          case true:
            scope.entity[field] = false;
            break;
          case false:
            scope.entity[field] = null;
            break;
          case null:
            scope.entity[field] = true;
            break;
          case undefined:
            scope.entity[field] = true;
            break;
        };
        if(scope.config.changeCallback)
          scope.changeCallback(field,scope.entity[field],value);
      };

      // Flag used to show ng-messages
      scope.rwFormCtrl.isInvalid = false;

      // Function used to know if form is valid
      scope.rwFormCtrl.isValid = function()
      {
        var condition = true;
        for(var key in scope.fieldsDict)
        {
          var field = scope.fieldsDict[key];

          if(field.enabled && field.show)
          {
            if(scope.rwFormCtrl.hasOwnProperty(field.id))
              condition &= scope.rwFormCtrl[field.id].$valid;
          }
        }
        scope.rwFormCtrl.isInvalid = !condition;
        return condition;
      }

      // Function used to set all form's fields readonly or modifiable
      scope.rwFormCtrl.setEnabled = function(val)
      {
        if(val == null)
          return;

        for(var key in scope.fieldsDict)
          scope.fieldsDict[key].enabled = val;
      }

      // Function used to reset the form controller
      scope.rwFormCtrl.reset = function()
      {
        scope.rwFormCtrl.isInvalid = false;
        scope.rwFormCtrl.$setPristine();
        scope.rwFormCtrl.$setUntouched();
      }

      /* Function used to show/hide custom error on a specified field
       */
      scope.rwFormCtrl.showCustomErrOnField = function(fieldId,show)
      {
        // Set the customErrMsg to the specified fieldId
        scope.rwFormCtrl[fieldId].$setValidity("customErrMsg",!show);
        // Set isInvalid to show the custom message
        scope.rwFormCtrl.isInvalid = show;
      }

      /* Private function used to align the button according to the
         presence/absence of label
      */
      scope.classForButton = function(field)
      {
        if(field.label)
          return "rw-button-no-margin form-control btn btn-default "+ field.height;
        else
          return "rw-button-with-margin form-control btn btn-default "+ field.height;
      }

      scope.classForText = function(field)
      {
        if(field.uppercase)
          return "form-control uppercase " + field.height;
        else
          return "form-control " + field.height;
      }

      scope.classForFieldset = function(fs)
      {
        if(fs.border)
          return "fieldset-border";
        else
          return "";
      }

      scope.classForLegend = function(fs)
      {
        if(fs.border)
          return "fieldset-border";
        else
          return "rw-legend";
      }

      // Inject form controller into non-isolated scope
      if (scope.controllers)
        scope.controllers[scope.config.id] = scope.rwFormCtrl;
    }
  };
}

function rwSearch()
{
   return {
    templateUrl: "core/views/rw-search.html",
    restrict:"E",
    scope: { config:"=" },
    controller: "rwSearchCtrl"
  };
}

function rwSearchGroup()
{
  return {
    templateUrl: "core/views/rw-search-group.html",
    scope:
    {
      filter:"=",
      config:"=",
      groups:"=",
      groupIndex:"=",
      logicalOperators:"=",
    },
    controller: "rwSearchGroupCtrl"
  };
}

function rwSearchCondition()
{
   return {
    templateUrl: "core/views/rw-search-condition.html",
    scope:
    {
      filter:"=",
      condition: "=",
      conditionIndex: "=",
    },
    controller: "rwSearchCondCtrl"
  };
}

function rwSearchButton() // Button with popover containing search form
{
   return {
    templateUrl: "core/views/rw-search-button.html",
    restrict:"E",
    scope:
    {
      config:"=",
      disabled:"=ngDisabled"
    },
    controller: "rwSearchButtonCtrl"
  };
}

function rwSearchTools()
{
  return {
    templateUrl: "core/views/rw-search-tools.html",
    controller: "rwSearchToolsCtrl",
    restrict: "E",
    scope: {config: "="}
  };
}

/*
 * Angular’s ng-model doesn’t work on inputs with type=“file” so i need to
 * create a directive to bind files to variables in the view controller.
 */
function rwFileModel($parse)
{
  return {
    restrict: "A",
    link: function(scope, element, attrs)
    {
      var model = $parse(attrs.rwFileModel);
      var modelSetter = model.assign;

      element.bind("change",function()
      {
        scope.$apply(function()
        {
          modelSetter(scope,element[0].files[0]);
        });
      });
    }
  };
}

function rwAttachManager(RWAttachment,rwHttpSvc,$location,$anchorScroll)
{
  return {
    templateUrl: "core/views/rw-attach-manager.html",
    restrict: "E",
    scope: {config: "=", entity:"="},
    controller:"rwAttachManagerCtrl"
  };
}

function rwModalPrint()
{
  return {
    controller: "rwModalPrintCtrl",
    restrict: "E",
    scope: {config: "="}
  };
}

// Notify changing in model without use a $watch
function rwChange()
{
  return {
    scope:{
      rwChange: "&"
    },
    require: "ngModel",
    link: function(scope, element, attrs, ctrl)
    {
      var oldValue;
      /* Update the array of functions to execute, as a pipeline,
       * whenever the model value changes.
       */
      ctrl.$formatters.push(function(value)
      {
        oldValue = value;
        return value;
      });

      /* Update the array of functions to execute whenever the view
       * value has changed.
       */
      ctrl.$viewChangeListeners.push(function()
      {
        /*
         * If a rwChange function is defined, call it with the attribute name,
         * the new and old value
         */
        if(angular.isFunction(scope.rwChange()))
          scope.rwChange()(attrs.name,ctrl.$modelValue, oldValue);
        oldValue = ctrl.$modelValue;
      });
    }
  };
}


