/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("WebApp")
  .directive("sdDualListBox",sdDualListBox)
  .controller("sdDualListBoxCtrl",sdDualListBoxCtrl);

function sdDualListBox()
{
  return {
    templateUrl: "views/dual-list-box.html",
    controller: "sdDualListBoxCtrl",
    restrict: "E",
    scope: {config:"=", allItem:"=", selectedItem:"=", availableItem:"="}
  };
}


function sdDualListBoxCtrl($scope,rwHttpSvc)
{
  /*
   * Scope variables
   */
  $scope.availableItemLabel = "";
  $scope.selectedItemLabel = "";
  /* array of available items -> left box*/
  $scope.aLeft = [];
  /* array of selected items-> right box*/
  $scope.aRight = [];

  if ($scope.config)
  {
    var availLbl = $scope.config.availableItemLabel,
      selecLbl = $scope.config.selectedItemLabel;

    /*
    * key needed to retrieve the items of arrays items passed to the directive
    */
    var key =  $scope.config.key;

    /*
    * label to show if the arrays passed to the directive are arrays of
    * objects
    */
    if($scope.config.label)
      $scope.label = $scope.config.label;

    /*
     * Legend above the left box -> available items
     */
    if(availLbl)
      $scope.availableItemLabel = availLbl;

    /*
     * Legend above the right box -> selected items
     */
    if(selecLbl)
      $scope.selectedItemLabel = selecLbl;

//     $scope.aLeft = $scope.allItem;
  }

  /*
   * Scope function
   */

  /*
   * Set the style of the selected item
   */
  $scope.selItem = function(item)
  {
    item.style = item.style ? null : {"background-color":"#66b2ff"};
  };

  /*
   * Move the selected item from left box to right box
   */
  $scope.addSelItem = function()
  {
    var last = $scope.aLeft.length-1;

    for (var i = last;i >= 0;i--)
    {
      var item = $scope.aLeft[i];
      if (item.style)
      {
        $scope.aRight.push(item);
        $scope.aLeft.splice(i,1);
        item.style = null;
        if(key)
          $scope.selectedItem.push(item[key])
        else
          $scope.selectedItem.push(item['noKey'])
      }
    }
  };

  /*
   * Move all items from left box to right box
   */
  $scope.addAllItems = function()
  {
    var last = $scope.aLeft.length-1;

    for (var i = last;i >= 0;i--)
    {
      var item = $scope.aLeft[i];

      $scope.aRight.push(item);
      $scope.aLeft.splice(i,1);
      item.style = null;
      if(key)
        $scope.selectedItem.push(item[key])
      else
        $scope.selectedItem.push(item['noKey'])
    }
  };

  /*
   * Move the selected item from right box to left box
   */
  $scope.rmSelItem = function()
  {
    var last = $scope.aRight.length-1;

    for (var i = last;i >= 0;i--)
    {
      var item = $scope.aRight[i];
      if (item.style)
      {
        $scope.aLeft.push(item);
        $scope.aRight.splice(i,1);
        item.style = null;
        if(key)
        {
          var idx = $scope.selectedItem.indexOf(item[key])
          if(idx >= 0)
            $scope.selectedItem.splice(idx,1);
        }
        else
        {
          var idx = $scope.selectedItem.indexOf(item['noKey'])
          if(idx >= 0)
            $scope.selectedItem.splice(idx,1);
        }
      }
    }
  };

  /*
   * Move all items from right box to left box
   */
  $scope.rmAllItems = function()
  {
    var last = $scope.aRight.length-1;

    for (var i = last;i >= 0;i--)
    {
      var item = $scope.aRight[i];

      $scope.aLeft.push(item);
      $scope.aRight.splice(i,1);
      item.style = null;
    }
    $scope.selectedItem = [];
  };

  /*
   * Observe the change of array selectedItem and set
   * the available items array (aLeft) and selected items array (aRight).
   * If array "availableItem" is setted create only
   * array aRight (selected items) otherwise create
   * array "aLeft" and "aRight" from allItem array.
   * REMEMBER: Not set availableItem array if coincedes with allItem array
   */
  $scope.$watch("selectedItem",function(nVal,oVal)
  {
    $scope.selectedItem = nVal;
    if($scope.selectedItem)
    {
      if($scope.selectedItem.length != 0)
      {
        if($scope.availableItem)
        {
          $scope.aLeft = $scope.availableItem;
          $scope.aRight = [];
          for(var i=0; i<$scope.allItem.length; i++)
          {
            if($scope.allItem[i].style)
              $scope.allItem[i].style = {};
            if(key)
            {
              var idx = $scope.selectedItem.indexOf($scope.allItem[i][key]);
              if(idx >= 0)
              {
                $scope.aRight.push($scope.allItem[i]);
              }
            }
            else
            {
              var idx = $scope.selectedItem.indexOf($scope.allItem[i]);
              if(idx >= 0)
              {
                $scope.aRight.push({
                  'noKey': $scope.allItem[i]
                });
              }
            }
          }
        }
        else
        {
          $scope.aRight = [];
          $scope.aLeft = [];
          for(var i=0; i<$scope.allItem.length; i++)
          {
            if($scope.allItem[i].style)
              $scope.allItem[i].style = {};
            if(key)
            {
              var idx = $scope.selectedItem.indexOf($scope.allItem[i][key]);
              if(idx >= 0)
                $scope.aRight.push($scope.allItem[i]);
              else
                $scope.aLeft.push($scope.allItem[i]);
            }
            else
            {
              var idx = $scope.selectedItem.indexOf($scope.allItem[i])
              if(idx >= 0)
                $scope.aRight.push({
                  'noKey': $scope.allItem[i]
                });
              else
                $scope.aLeft.push({
                  'noKey': $scope.allItem[i]
                });
            }
          }
        }
      }
      else
      {
        $scope.aRight = [];
        if($scope.availableItem)
          $scope.aLeft = $scope.availableItem;
        else
        {
          for(var i=0; i<$scope.allItem.length; i++)
          {
            $scope.aLeft[i] = $scope.allItem[i];
          }
        }
      }
    }
  },true);

  $scope.$watch("availableItem",function(nVal,oVal)
  {
    $scope.availableItem = nVal;
    if($scope.availableItem)
      $scope.aLeft = $scope.availableItem;
  });

  $scope.$watch("allItem",function(nVal,oVal)
  {
    $scope.allItem = nVal;
    if($scope.allItem && $scope.selectedItem)
    {
      $scope.aRight = [];
      $scope.aLeft = [];
      for(var i=0; i<$scope.allItem.length; i++)
      {
        if($scope.allItem[i].style)
          $scope.allItem[i].style = {};
        if(key)
        {
          var idx = $scope.selectedItem.indexOf($scope.allItem[i][key])
          if(idx >= 0)
            $scope.aRight.push($scope.allItem[i]);
          else
            $scope.aLeft.push($scope.allItem[i]);
        }
        else
        {
          var idx = $scope.selectedItem.indexOf($scope.allItem[i])
          if(idx >= 0)
            $scope.aRight.push({
              'noKey': $scope.allItem[i]
            });
          else
            $scope.aLeft.push({
              'noKey': $scope.allItem[i]
            });
        }
      }
    }
    else
    {
      $scope.aRight = [];
      if($scope.availableItem)
        $scope.aLeft = $scope.availableItem;
      else
      {
        for(var i=0; i<$scope.allItem.length; i++)
        {
          $scope.aLeft[i] = $scope.allItem[i];
        }
      }
    }
  });
}
