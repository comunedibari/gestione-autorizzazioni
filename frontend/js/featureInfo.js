/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("WebApp")
  .controller("featureInfoCtrl",featureInfoCtrl);

function featureInfoCtrl($scope,$document)
{
  $scope.data = [];
  $scope.open = false;
  $scope.style = {position:"absolute", left:0, top:0};

  /*
   * WebGis event
   */
  $scope.$on("featureClick",function(ev,obj)
  {
    //console.info(obj);

    if ($scope.open)
      $scope.close();

    /*
     * Manage layers
     */
    switch (obj.layerId)
    {
      default:
        if (obj.data && obj.data.fields)
        {
          $scope.data = obj.data.fields;

          /* Show popover */
          $scope.style.left = obj.x;
          $scope.style.top = obj.y;
          $scope.open = true;

          $scope.$apply();

          /* Attach mousedown handler */
          $document.on("mousedown",_onDocumentClick);
        }
        break;
    }
  });

  /*
   * Scope function
   */
  $scope.close = function()
  {
    $scope.data = [];
    $scope.open = false;

    /* Detach mousedown handler */
    $document.off("mousedown",_onDocumentClick);
  };

  /*
   * Private function.
   */
  function _onDocumentClick(ev)
  {
    /* Ignore mousedown on popover itself */
    if (!$(ev.target).closest(".popover").length)
      $scope.$apply($scope.close());
  }
}
