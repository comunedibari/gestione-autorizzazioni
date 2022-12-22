/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("WebApp",["nvd3","mwl.calendar","treeControl","core","webgis","management",
  "roadsite","move","registration"])
  .controller("bodyCtrl",bodyCtrl)
  .controller("loginCtrl",loginCtrl)
  .controller("recoveryPwdCtrl",recoveryPwdCtrl);

function bodyCtrl($scope)
{
  $scope.addFIPopDiv = false;

  /*
   * Register listener for ui-router stateChangeSuccess
   */
  $scope.$on("$stateChangeSuccess",function(ev,toState,toPar,fromState,fromPar)
  {
    if (toState.name == "main")
      $scope.addFIPopDiv = true;
  });
}

function loginCtrl($scope,$state,$uibModal,md5,rwConfigSvc,rwHttpSvc,rwAuthSvc)
{
  $scope.username = null;
  $scope.password = null;
  $scope.errorMsg = null;

  /*
   * Scope function.
   */
  $scope.doLogin = function()
  {
    $scope.errorMsg = null;

    if (!$scope.username || !$scope.password)
      return;

    /* Login */
    var md5Key = md5.createHash($scope.username+$scope.password);

    rwHttpSvc.post("/auth/login",{signature: md5Key},function(res)
    {
      if (!res || res.error)
      {
        if (res.error && res.error == "USER_DISABLED")
          $scope.errorMsg = "CORE_LBL.USER_DISABLED";
        else
          $scope.errorMsg = "CORE_MSG.LOGIN_ERROR_MSG";
        return;
      }

      rwHttpSvc.setAuthHeader(res);
      rwAuthSvc.token = res;

      /* User info */
      rwHttpSvc.get("/auth/userInfo",function(uiRes)
      {
        if (uiRes)
          rwAuthSvc.userInfo = uiRes.result;

        $state.go("main");
      });
    });
  };

  $scope.doRecoveryPwd = function()
  {
    $uibModal.open({
      templateUrl: "views/recovery-pwd.html",
      controller: "rwRecoveryPwdCtrl",
      backdrop: "static",
      size: "md"
    });
  };
}

function recoveryPwdCtrl($scope,$uibModalInstance,rwHttpSvc)
{
  $scope.data = {};
  $scope.message = null;
  $scope.loading = false;

  $scope.close = function()
  {
    $uibModalInstance.close();
  };

  $scope.recovery = function()
  {
    if (!$scope.data.username || !$scope.data.email)
      return;

    // Show loader
    $scope.loading = true;

    // Exec request
    rwHttpSvc.post("/auth/newPassword",$scope.data,function(res)
    {
      $scope.loading = false;

      if (!res)
      {
        $scope.message = "CORE_MSG.SERVER_CONNECTION_ERROR";
        return;
      }

      if (res.result)
      {
        $scope.message = "CORE_MSG.NEW_PWD_OK_MSG";
        return;
      }

      // Process response error
      switch (res.error)
      {
        case 1:
          $scope.message = "CORE_MSG.NEW_PWD_WRONG_DATA";
          break;
        case 2:
          $scope.message = "CORE_MSG.NEW_PWD_RECOVERY_DATA_ERROR";
          break;
        case 3:
          $scope.message = "CORE_MSG.NEW_PWD_SAVE_PWD_ERROR";
          break;
        case 4:
          $scope.message = "CORE_MSG.NEW_PWD_EMAIL_ERROR";
          break;
        default:
          $scope.message = "CORE_MSG.NEW_PWD_GENERIC_ERROR";
          break;
      }
    });
  };
}

/*
 * Extend javascript Math object
 * roundToDec: round given value to specified n decimal
 */
Math.roundToDec = function(val,n)
{
  if (val == null)
    return val;

  var x = Math.pow(10,n);

  return Math.round(val * x) / x;
};
