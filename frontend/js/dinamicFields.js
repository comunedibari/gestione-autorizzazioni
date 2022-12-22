/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("WebApp")
  .directive("sdDinamicFields",sdDinamicFields)
  .controller("sdDinamicFieldsCtrl",sdDinamicFieldsCtrl);

function sdDinamicFields()
{
  return {
    templateUrl: "views/dinamic-fields.html",
    controller: "sdDinamicFieldsCtrl",
    restrict: "E",
    scope: {config:"=", entities:"=", controllers:"=", disabled:"="}
  };
}


function sdDinamicFieldsCtrl($scope)
{
  /*
   * Scope variables
   */
  $scope.alert = {};
  // Flag used to show error message
  $scope.invalid = false;
  $scope.disable = false;

  if ($scope.controllers)
    $scope.controllers[$scope.config.id] = $scope;


  /*
   * Scope watch
   */
   $scope.$watch("disabled",function(nVal,oVal)
  {
    $scope.disable = nVal;
  });

  /*
   * Scope function
   */
  $scope.addFields = function () 
  {
    if(!isValue($scope.entities))
      $scope.entities = [];

    $scope.entities.push(
          $scope.config.entity ? new $scope.config.entity() : {}
    );
  };

  $scope.removeFields = function (ent) 
  {
    var canRemove = true;
    /* Check if the fields are empty otherwise remove entity */
    for (var j = 0;j < $scope.config.conf.length;j++)
    {
      if(ent[$scope.config.conf[j].id] != undefined)
      {
        canRemove = false;
        break;
      }
    }

    if(!canRemove)
    {
      $scope.alert.tag = "DEL";
      $scope.alert.msg = "CORE_MSG.DELETE_ITEM_MSG";
      $scope.alert.bt0 = "No";
      $scope.alert.bt1 = "WORDS.YES";
      $scope.alert.entity = ent;
    }
    else
    {
      for(i=0; i< $scope.entities.length; i++)
      {
        if($scope.entities[i] === ent)
          $scope.entities.splice(i,1);
      }
    }
  };

  $scope.alertDone = function(val)
  {
    if (val == 1 && $scope.alert.tag == "DEL")
    {
      for(i=0; i< $scope.entities.length; i++)
      {
        if($scope.entities[i] === $scope.alert.entity)
          $scope.entities.splice(i,1);
      }
    }

    $scope.alert = {};
  };

  /*
   * Function used to insert pattern if input type of field is telephone
   */
  $scope.pattern = function (type) 
  {
    if(type == "tel")
      return '^[0-9]+$';
  };

  /*
   * Function used to know if form is valid
   */

  $scope.isValid = function()
  {
    $scope.invalid = false;
    var condition = true;

    for (var i = 0; i < $scope.entities.length; i++)
    {
      for (var j = 0; j < $scope.config.conf.length; j++)
      {
        var field = $scope.config.conf[j];

        if($scope.sdFormCtrl.hasOwnProperty(field.id+"-"+i))
        {
          condition &= $scope.sdFormCtrl[field.id+"-"+i].$valid;
        }
      }
    }
    $scope.invalid = !condition;
    return condition;
  }

  /* Reset input fields*/
  $scope.reset = function()
  {
    $scope.invalid = false;
    $scope.sdFormCtrl.$setPristine();
    $scope.sdFormCtrl.$setUntouched();
  }

  /*
   * Private function
   */

  /**
  * A convenience function for detecting a legitimate non-null value.
  * Returns false for null/undefined/NaN/Infinity, true for other values,
  * including 0/false/''
  */
  function isValue (val)
  {
    return !(val === null || !angular.isDefined(val) || 
            (angular.isNumber(val)   &&  !isFinite(val)) || 
            (val == 0) || (val == false));
  };
}
