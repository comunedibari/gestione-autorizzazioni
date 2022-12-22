/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("WebApp")
  .controller("sidebarCtrl",sidebarCtrl)
  .controller("sbEventCtrl",sbEventCtrl)
  .controller("sbHintCtrl",sbHintCtrl);

function sidebarCtrl($scope,$timeout,rwAuthSvc,rwEventManager)
{
  /*
   * Scope variables
   */
  $scope.boxes =
  [
    {
      ctrl: sbEventCtrl,
      perm: "BOX_EVENT",
      title: "SIDEBAR.BOX_EVENT"
    },
    {
      ctrl: sbHintCtrl,
      perm: "BOX_HINT",
      title: "SIDEBAR.BOX_HINT"
    },
    {
      ctrl: sbAlertCtrl,
      perm: "BOX_ALERT",
      title: "Notifiche/Alert"
    },
  ];

  $scope.newEvent = null;
  $scope.boxStyle = {height: 200};
  $scope.boxBodyStyle = {height: 165};

  /*
   * Scope function
   */


  /*
   * Manage permissions
   */
  var aPerm = rwAuthSvc.permForModule("sidebar");

  for (var i = $scope.boxes.length-1;i >= 0;i--)
  {
    if (aPerm.indexOf($scope.boxes[i].perm) < 0)
      $scope.boxes.splice(i,1);
  }

  /*
   * Add EventManager listener
   */
  rwEventManager.on("event",function(ev)
  {
    if (ev && ev.type)
    {
      $scope.newEvent = ev;
      $scope.$apply();
    }
  });

  /*
   * Function used to update sidebar height
   */
  function _updateHeight()
  {
    var height = $(window).height() - $("#sidebar").offset().top;
    var boxLen = $scope.boxes.length;

    /* Update sidebar height */
    $("#sidebar").height(height);

    /* Update box height (each box has 6px of vertical margin) */
    $scope.boxStyle.height = boxLen > 4 ? 200 :
      Math.floor((height - (boxLen+1)*6) / boxLen);

    /* Update box body height (header height is 32px) */
    $scope.boxBodyStyle.height = $scope.boxStyle.height - 35;
  };

  $(window).ready(_updateHeight);
  $(window).resize(_updateHeight);

  // Workaround to avoid initial scroll
  $timeout(function(){_updateHeight();},2000);
}

function sbAlertCtrl($scope)
{
  $scope.items = [];
  $scope.blinkAlertId = -1;

  $scope.onItem = function(it)
  {
  };

  $scope.$watch("newEvent",function(nv,ov)
  {
    // TODO
  });

  $scope.items.push({
    object: {},
    lbl1: "Test notifica",
    lbl2: "Alert notifica",
    style: {"background-color": "red"}
  });
}


function sbEventCtrl($scope,rwHttpSvc)
{
  $scope.items = [];

  $scope.$watch("newEvent",function(nv,ov)
  {
    if (nv)
    {
      if ($scope.items.length > 20)
        $scope.items.pop();

      $scope.items.unshift({
        img: "image/sidebar/event.png",
        lbl1: new Date(nv.date).toCustomString(),
        lbl2: nv.message,
        blink: true
      });
    }
  });

  /*
   * Load last 20 event to show
   */
  var load = function()
  {
    var opt = {
      filter: "show|GE|2",
      ord: "date|DESC",
      rpp: 20,
      cp: 1
    };

    rwHttpSvc.post("/event/master",opt,function(res)
    {
      if (res && res.result)
      {
        for (var j = 0;j < res.result.length;j++)
        {
          var obj = res.result[j];

          $scope.items.push({
            img: "image/sidebar/event.png",
            lbl1: new Date(obj.date).toCustomString(),
            lbl2: obj.message
          });
        }
      }
    });
  };

  load();
}

function sbHintCtrl($scope,rwEventManager,rwHttpSvc)
{
  var aEvType = [];
  $scope.items = [];

  $scope.$watch("newEvent",function(nv,ov)
  {
    if (nv && aEvType.indexOf(nv.type) >= 0 &&
      nv.detail && nv.detail.x && nv.detail.y &&
      nv.detail.sio_id == rwEventManager.sioId())
    {
      rwHttpSvc.post("/rule/",nv.detail,function(res)
      {
        if (res && res.result && res.result.length)
        {
          for (var j = 0;j < res.result.length;j++)
          {
            var hint = res.result[j];

            $scope.items.unshift({
              img: "image/sidebar/hint.png",
              lbl1: hint.message,
              blink: true
            });
          }
        }
      });
    }
  });
}
