/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("WebApp")
  .controller("menuCtrl",menuCtrl);

function menuCtrl($scope,$uibModal,rwHttpSvc,rwAuthSvc,$rootScope)
{
  $scope.menu = [];
  // this variable define if the menu icons are separed by divider
  $scope.menuHasGroup = false;

  /*
   * Load menu.
   */
  var url = "/core/menu?permId=",
    aPermId = [];

  // Add permissions
  for (var key in rwAuthSvc.permissions)
    aPermId = aPermId.concat(rwAuthSvc.permissions[key].id);

  url += aPermId.join(",");

  // Exec request
  rwHttpSvc.get(url,function(res)
  {
//     if (res && res.result)
//       $scope.menu = res.result;
    if (res && res.result)
    {
      // Retrieve menu group (group divided by divider)
      var menuGroup = res.result.reduce(function(filtered, element)
      {
        if (element.group != null) {
          if (filtered.indexOf(element.group) < 0)
            filtered.push(element.group);
        }
        return filtered;
      }, []);

      // Retrieve menu item foreach menu group to group menu in section
      $scope.menu = [];

      if (menuGroup.length)
      {
        $scope.menuHasGroup = true;
        for (var i = 0; i < menuGroup.length; i++)
        {
          $scope.menu.push
          (
            res.result.filter(function(m){return m.group == menuGroup[i]})
          );
        }
      }
      else
        $scope.menu = res.result;
    }
  });

  /*
   * Process menu action.
   */
  var m_menuAction = {
    roadsiteList: {
      view: "modules/roadsite/views/list.html",
      ctrl: "roadsiteListCtrl",
      size: "xl"
    },
    moveList: {
      view: "modules/move/views/list.html",
      ctrl: "moveListCtrl",
      size: "xl"
    },
    registerCompany: {
      view: "modules/registration/views/request.html",
      ctrl: "requestCtrl",
      size: "xl",
      resolve:{ui: rwAuthSvc.userInfo}
    },
    manageRoles: {
      view: "modules/management/views/role.html",
      ctrl: "roleCtrl"
    },
    manageUsers: {
      view: "modules/management/views/user.html",
      ctrl: "userCtrl"
    },
    manageAuthority: {
      view: "modules/management/views/authority.html",
      ctrl: "authorityCtrl",
      size: "xl"
    },
    manageLayers: {
      view: "core/webgis/views/layer-config.html",
      ctrl: "wgLayerCfgCtrl",
      size: "xl"
    },
    userInfo: {
      view: "modules/management/views/user-info.html",
      ctrl: "userInfoCtrl",
      size: "md"
    }
  };

  $scope.onMenuAction = function(action)
  {
    /* External link */


    /* Exec menu action */
    var obj = m_menuAction[action];

    if (!obj || obj.modal)
      return;

    obj.modal = $uibModal.open({
      windowClass: "modaless",
      templateUrl: obj.view,
      controller: obj.ctrl,
      backdrop: false,
      keyboard: false,
      resolve: obj.resolve,
      size: obj.size ? obj.size : "lg"
    });

    // Ignore promise reject (used on dismiss)
    obj.modal.result.then(function()
    {
      m_menuAction[action].modal = null;
    });
  };

  /*
   * Manage execMenuAction event.
   */
  $scope.$on("execMenuAction",function(ev,action)
  {
    var obj = m_menuAction[action];
    if (obj && obj.modal)
    {
      // Dismiss modal (not close) to avoid promise
      obj.modal.dismiss();
      obj.modal = null;
    }

    $scope.onMenuAction(action);
  });

    /*
   * Register listener for ui-router stateChangeSuccess.
   */
  var scsListener = $rootScope.$on("$stateChangeSuccess",
    function(ev,toState,toPar,fromState,fromPar)
    {
      // Dismiss opened modal
      for (var key in m_menuAction)
      {
        var obj = m_menuAction[key];

        if (obj.modal)
          obj.modal.dismiss();
      }

      // Unregister listener
      scsListener();
    }
  );
}
