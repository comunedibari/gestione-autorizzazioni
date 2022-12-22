/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("core")
  .controller("rwMainCtrl",rwMainCtrl)
  .controller("rwLoginCtrl",rwLoginCtrl)
  .controller("rwTableCtrl",rwTableCtrl)
  .controller("rwAlertCtrl",rwAlertCtrl)
  .controller("rwSearchCtrl",rwSearchCtrl)
  .controller("rwResAreaCtrl",rwResAreaCtrl)
  .controller("rwModalPrintCtrl",rwModalPrintCtrl)
  .controller("rwCollectionCtrl",rwCollectionCtrl)
  .controller("rwPaginationCtrl",rwPaginationCtrl)
  .controller("rwSearchCondCtrl",rwSearchCondCtrl)
  .controller("rwSearchGroupCtrl",rwSearchGroupCtrl)
  .controller("rwRecoveryPwdCtrl",rwRecoveryPwdCtrl)
  .controller("rwModalHeaderCtrl",rwModalHeaderCtrl)
  .controller("rwSearchToolsCtrl",rwSearchToolsCtrl)
  .controller("rwSearchButtonCtrl",rwSearchButtonCtrl)
  .controller("rwAttachManagerCtrl",rwAttachManagerCtrl)
  .controller("rwPopupCollectionCtrl",rwPopupCollectionCtrl);

function rwLoginCtrl($scope,$state,$uibModal,md5,rwConfigSvc,rwHttpSvc,rwAuthSvc)
{
  $scope.title = rwConfigSvc.title;
  $scope.recoveryPwd = rwConfigSvc.recoveryPwd;

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
      templateUrl: "core/views/rw-recovery-pwd.html",
      controller: "rwRecoveryPwdCtrl",
      backdrop: "static",
      size: "md"
    });
  };
}

function rwRecoveryPwdCtrl($scope,$uibModalInstance,rwHttpSvc)
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

function rwMainCtrl($scope,$translate,$state,$uibModal,$window,tmhDynamicLocale,
  rwConfigSvc,rwHttpSvc,rwAuthSvc,rwContextSvc,permissions,context,wgMapSvc, $timeout,
  $rootScope,$http)
{
  /* Check permissions */
  if (permissions && permissions.data)
    rwAuthSvc.permissions = permissions.data;

  /* Check context */
  if (context)
    rwContextSvc.init(context);

  /* Layout */
  var aCorePerm = rwAuthSvc.permForModule("core"),
    bSidebar = false;

  if (aCorePerm && aCorePerm.indexOf("SHOW_SIDEBAR") >= 0)
    bSidebar = true;

  $scope.mainView = rwConfigSvc.layout.main;
  $scope.showHeader = rwConfigSvc.layout.header;
  $scope.showNavbar = rwConfigSvc.layout.navbar;
  $scope.showFooter = rwConfigSvc.layout.footer;
  $scope.showSidebar = rwConfigSvc.layout.sidebar || bSidebar;

  $rootScope.rwShowSidebar = $scope.showSidebar;
  $rootScope.rwShowFooter = $scope.showFooter;

  $scope.mainViewClass = $scope.showSidebar ?
    "no-pad col-lg-9 col-md-9 col-sm-8 col-xs-12" :
    "no-pad col-lg-12 col-md-12 col-sm-12 col-xs-12";

  /* Language */
  $scope.languages = rwConfigSvc.languages;

  $scope.changeLanguage = function(code)
  {
    $translate.use(code);

    // Change the locale dinamically
    tmhDynamicLocale.set(code);

    // Update config
    rwConfigSvc.language = code;
  };

  /* User info */
  $scope.userInfo = rwAuthSvc.userInfo;

  /* Logout */
  $scope.showLogout = rwConfigSvc.login && !rwConfigSvc.resArea;

  $scope.doLogout = function()
  {
    // Reset auth service
    rwAuthSvc.token = null;
    rwAuthSvc.userInfo = null;
    rwAuthSvc.permissions = null;

    // Reset auth http header
    rwHttpSvc.setAuthHeader(null);

    if (rwAuthSvc.loginISToken)
    {
      // IS logout
      $window.location.replace( "https://is.smacampania.it/oidc/logout?id_token_hint="+rwAuthSvc.loginISToken);
    }
    else
      // Application logout
      $window.location.reload();

    rwAuthSvc.loginISToken = null;
  };

  /* Reserved area */
  $scope.resAreaLogin = rwConfigSvc.resArea && !rwConfigSvc.resAreaLogin;
  $scope.resAreaLogout = rwConfigSvc.resArea && rwConfigSvc.resAreaLogin;

  $scope.accessResArea = function()
  {
    // Reset auth service
    rwAuthSvc.token = null;
    rwAuthSvc.userInfo = null;
    rwAuthSvc.permissions = null;

    // Show form
    $uibModal.open({
      templateUrl: "core/views/rw-reserved-area.html",
      controller: "rwResAreaCtrl",
      backdrop: "static",
      size: "sm"
    });
  };

  $scope.quitResArea = function()
  {
    rwConfigSvc.resAreaLogin = false;

    // Reset auth service
    rwAuthSvc.token = null;
    rwAuthSvc.userInfo = null;
    rwAuthSvc.permissions = null;

    // ATTENTION: workaround to remove querystring from url on logout application
    //           setting search to '' cause page reload, so subsequent instructions
    //           are not executed (in this case $state.reload() )
    if (window.location.search)
      window.location.search = "";

    // Reload main state
    $state.reload("main");
  };

  $scope.$on("showSidebar",function()
  {
    $scope.showSidebar = !$scope.showSidebar;
    $scope.mainViewClass = $scope.showSidebar ?
      "no-pad col-lg-9 col-md-9 col-sm-8 col-xs-12" :
      "no-pad col-lg-12 col-md-12 col-sm-12 col-xs-12";

    $timeout(function () {wgMapSvc.getMap().updateSize();}, 10);
  });
}

function rwResAreaCtrl($scope,$state,$uibModal,$uibModalInstance,md5,
  rwConfigSvc,rwHttpSvc,rwAuthSvc)
{
  $scope.username = null;
  $scope.password = null;
  $scope.errorMsg = null;
  $scope.recoveryPwd = rwConfigSvc.recoveryPwd;

  /*
   * Scope function.
   */
  $scope.close = function()
  {
    $uibModalInstance.dismiss("cancel");
  };

  $scope.login = function()
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

      rwConfigSvc.resAreaLogin = true;
      rwHttpSvc.setAuthHeader(res);
      rwAuthSvc.token = res;

      /* User info */
      rwHttpSvc.get("/auth/userInfo",function(uiRes)
      {
        if (uiRes)
          rwAuthSvc.userInfo = uiRes.result;

        // Reload main state
        $state.reload("main");

        // Close modal
        $uibModalInstance.close();
      });
    });
  };

  $scope.doRecoveryPwd = function()
  {
    $uibModalInstance.dismiss("cancel");

    $uibModal.open({
      templateUrl: "core/views/rw-recovery-pwd.html",
      controller: "rwRecoveryPwdCtrl",
      backdrop: "static",
      size: "md"
    });
  };
}

function rwModalHeaderCtrl($scope)
{
  /* Scope function */
  $scope.minimize = function()
  {
    $scope.config.minimized = !$scope.config.minimized;
  };

  $scope.close = function()
  {
    $scope.config.modalInstance.close();
  };
}

function rwModalPrintCtrl($scope,$rootScope,$uibModal,rwConfigSvc)
{
  $rootScope.config = $scope.config;

  function _getQueryStr(obj)
  {
    var queryStr = "";
    $.each(obj, function(k,v)
    {
      queryStr += k +"="+ v + "&";
    })
    queryStr = queryStr.slice(0,-1);
    return queryStr;
  }

  $uibModal.open({
    templateUrl: "core/views/rw-modal-print.html",
    size: "md",
    backdrop: "static",
    controller: function($scope,$uibModalInstance,rwHttpSvc)
    {
      $scope.formCfg = $rootScope.config.formCfg;
      $scope.entity = $rootScope.config.entity;
      var method = $rootScope.config.method;

      $scope.blob = false;
      if (method == "post")
        $scope.blob = true;

      $scope.close = function()
      {
        $uibModalInstance.close();
        $rootScope.config.open = false;
      };

      $scope.print = function()
      {

        var filename = $rootScope.config.filename, url = $rootScope.config.url;

        $.extend($rootScope.config.body,$rootScope.config.entity)

        if (method == "post")
        {
          var reqOpt = {
            responseType: "arraybuffer",
            method: "POST",
            data: $rootScope.config.body,
            url: url
          };


          rwHttpSvc.request(reqOpt,function(res)
          {
            if (!res)
              return;

            var resCT = res.headers("content-type").split(";")[0];
            // Process content type
            switch (resCT)
            {
              case "text/plain": filename += ".txt"; break;
              case "application/pdf": filename += ".pdf"; break;
            }

            // Save response data as file
            var blob = new Blob([res.data],{type:resCT});
            saveAs(blob,filename);
          });
        }
        else
        {
          url += "?"+ _getQueryStr($rootScope.config.body);
          $rootScope.url = rwConfigSvc.urlPrefix + url;
          // remove first char (/)
          $rootScope.url = $rootScope.url.substr(1);
        }
      }
    }
  });
}

function rwTableCtrl($scope,rwHttpSvc,DTOptionsBuilder,DTColumnDefBuilder)
{
  /* Private attributes */
  var id = $scope.config.id;
  var order = $scope.config.order;
  var filter = null;
  var colToOrder = null;
  var bDefFilter = false;
  var entityName = $scope.config.entityName;
  var entityClass = $scope.config.entityClass;

  var countUrl = $scope.config.countUrl ?
    $scope.config.countUrl : "/"+entityName+"/count";
  var masterUrl = $scope.config.masterUrl ?
    $scope.config.masterUrl : "/"+entityName+"/master";
  var exportUrl = "/"+entityName+"/export";

  /* Scope attributes */
  $scope.searchCfg = $scope.config.search;
  $scope.loading = false;
  $scope.export = $scope.config.export;
  $scope.count = null;
  $scope.data = [];

  $scope.curPage = 1;
  $scope.first = 0;
  $scope.last = 0;

  // Add reset attribute to search config, if present
  if ($scope.searchCfg)
    $scope.searchCfg.reset = 0;

  // Class and style
  $scope.tableStyle = {};
  $scope.rowClasses = {};

  /* Process config */
  if ($scope.config.maxHeight)
  {
    $scope.tableStyle["max-height"] = $scope.config.maxHeight;
    $scope.tableStyle["overflow-y"] = "auto";
  }

  if ($scope.config.pagination)
  {
    $scope.rpp = $scope.config.pagination.rpp;
    $scope.rppArray = $scope.config.pagination.rppArray;
  }

  /*
   * Configure datatable
   */
  $scope.dtInstance = {};
  $scope.dtColDef = [];
  $scope.dtOpt = DTOptionsBuilder.newOptions()
    .withOption("order",[])
    .withOption("bInfo",false)
    .withOption("paging",false)
    .withOption("scrollX",$scope.config.scrollX ? true : false)
    .withOption("scrollY",$scope.config.scrollY)
    .withOption("scrollCollapse",$scope.config.scrollY ? true : false)
    .withOption("ordering",false)
    .withOption("searching",false)
    .withOption("responsive",false)
    .withOption("bLengthChange",false)
    .withOption("initComplete",function(opt){
      $scope.$emit("tvInitComplete",id);
    })
    .withOption("createdRow",$scope.config.createdRowFnc)
    .withLanguage({emptyTable: " "});

  for (var i = 0;i < $scope.config.columns.length;i++)
  {
    var col = $scope.config.columns[i];

    if (col.width)
    {
      $scope.dtColDef.push(
        DTColumnDefBuilder.newColumnDef(i).withOption("sWidth",col.width));
    }

    // Process type
    var rFunc = null;

    switch (col.type)
    {
      case "bool":
        rFunc = function(strData,type,row,meta)
        {
          switch (strData)
          {
            case "true": return "Si";
            case "false": return "No";
            default: return strData;
          }
        };
        break;
      case "date":
        rFunc = function(strData,type,row,meta)
        {
          var colId = $scope.config.columns[meta.col].id,
            data = $scope.data[meta.row][colId];

          switch (typeof data)
          {
            case "object": return data ? data.toCustomString() : null;
            case "number": return new Date(data).toCustomString();
            default: return strData;
          }
        };
        break;
      case "object":
        rFunc = function(data,type,row,meta)
        {
          var col = $scope.config.columns[meta.col];

          if (!col || !col.source || !col.source.length)
            return data;

          for (var i = 0, count = col.source.length;i < count;i++)
          {
            if (data == "")
              return "";

            if (col.source[i].id == data)
              return col.source[i].name;
          }
          return data;
        };
        break;
    }

    if (rFunc)
      $scope.dtColDef.push(DTColumnDefBuilder.newColumnDef(i).renderWith(rFunc));
  }

  /* Set right sorting class on columns */
  resetColsConfig();

  if (order)
  {
    var aOrder = order.split("|");
    if (aOrder.length == 2)
    {
      for (var i = 0;i < $scope.config.columns.length;i++)
      {
        var col = $scope.config.columns[i];

        if (col.id == aOrder[0])
        {
          col.class = aOrder[1] == "ASC" ? "sorting_asc" : "sorting_desc";
          colToOrder = col;
          break;
        }
      }
    }
  }

  /* Config watch */
  $scope.$watch("config.countUrl",function(nv,ov)
  {
    if (nv) countUrl = nv;
  });

  $scope.$watch("config.masterUrl",function(nv,ov)
  {
    if (nv) masterUrl = nv;
  });

  $scope.$watch("config.exportUrl",function(nv,ov)
  {
    if (nv) exportUrl = nv;
  });

  $scope.$watch("config.filter",function(nObj,oObj)
  {
    // Reset search tools
    if ($scope.searchCfg)
      $scope.searchCfg.reset++;

    // Add default filter
    bDefFilter = nObj ? true : false;
    filter = nObj ? {groupOp:"AND", rules:[], groups:[nObj]} : null;
  });

  $scope.$watch("config.data",function(nv,ov)
  {
    if (!nv)
      return;

    $scope.data = [];

    for (var i = 0;i < nv.length;i++)
      $scope.data.push(entityClass ? new entityClass(nv[i]) : nv[i]);

    /* Sort data, if requested */
    if (colToOrder)
      sortDataArray(colToOrder,colToOrder.class == "sorting_asc" ? true : false);
  },true);

  $scope.$watch("config.reset",function(nv,ov)
  {
    if (nv)
    {
      $scope.rowClasses = {};
      $scope.config.selectedRow = null;
    }
  });

  $scope.$watch("config.rerender",function(nv,ov)
  {
    if (!nv || nv == ov)
      return;

    $scope.dtInstance.rerender();
  });

  $scope.$watch("config.adjust",function(nv,ov)
  {
    if (!nv)
      return;

    $scope.dtInstance.DataTable.columns.adjust();
  });

  $scope.$watch("config.reload",function(nv,ov)
  {
    if (nv == undefined || nv < 0)
      return;

    // Show loader
    $scope.loading = true;

    // Prepare request
    var body = filter ? {filter: filter} : {};

    if ($scope.config.pagination)
    {
      rwHttpSvc.post(countUrl,body,function(res)
      {
        if (res && res.count != null)
        {
          $scope.count = res.count;

          // Notify to listener
          var emObj = {
            count: res.count,
            filter: angular.copy(filter)
          };

          $scope.$emit("tvCountReloaded",id,emObj);

          // Load master
          $scope.curPage = 1;
          loadMasterPage();
        }
        else
          $scope.loading = false;
      });
    }
    else
    {
      if (order)
        body.ord = order;

      rwHttpSvc.post(masterUrl,body,function(res)
      {
        $scope.data = [];

        if (res && res.result)
        {
          for (var i = 0;i < res.result.length;i++)
          {
            var obj = res.result[i];
            $scope.data.push(entityClass ? new entityClass(obj) : obj);
          }
        }

        $scope.loading = false;
      });
    }
  });

  /* Search watch */
  $scope.$watch("searchCfg.simple.filter",function(newVal,oldVal)
  {
    if (!oldVal && !newVal)
      return;

    if (bDefFilter)
    {
      // Reset filter
      filter.groups = [$scope.config.filter];

      if (newVal)
        filter.groups.push(newVal);
    }
    else
      filter = newVal;

    $scope.config.reload++;
  });

  $scope.$watch("searchCfg.advanced.filter",function(newVal,oldVal)
  {
    if (!oldVal && !newVal)
      return;
    if (bDefFilter)
    {
      // Reset filter
      filter.groups = [$scope.config.filter];

      if (newVal)
        filter.groups.push(newVal);
    }
    else
      filter = newVal;

    $scope.searchCfg.reset++;
    $scope.config.reload++;
  });

  /* Scope function */
  $scope.setSelectedRow = function(idx,obj)
  {
    var selIdx = idx;
    var selObj = obj;

    if ($scope.rowClasses[idx])
    {
      selIdx = null;
      selObj = null;

      delete $scope.rowClasses[idx];
    }
    else
    {
      $scope.rowClasses = {};
      $scope.rowClasses[idx] = "row-selected";
    }

    // Update selected row
    $scope.config.selectedRow = selIdx;

    // Emit event
    $scope.$emit("tvSelObj",id,selObj);

    //OLD CODE
    //$scope.$emit("tvSelObj",id,obj);
  };

  $scope.rppChanged = function()
  {
    $scope.loading = true;
    loadMasterPage();
  };

  $scope.pageChanged = function()
  {
    $scope.loading = true;
    loadMasterPage();
  };

  $scope.changeOrder = function(col)
  {
    if (!col.sortable)
      return;

    var asc = (col.class == "sorting_asc") ? false : true;

    // Update css
    resetColsConfig();
    col.class = asc ? "sorting_asc" : "sorting_desc";

    // Reorder
    if ($scope.config.pagination)
    {
      order = col.id + "|" + (asc ? "ASC" : "DESC");
      $scope.loading = true;

      loadMasterPage();
    }
    else
    {
      sortDataArray(col,asc);

      // Reset selected object
      $scope.rowClasses = {};
      $scope.config.selectedRow = null;

      $scope.$emit("tvSelObj",id,null);
    }
  };

  $scope.onExport = function()
  {
    var body = {filter:filter, ord:order};

    // Exec request
    rwHttpSvc.post(exportUrl,body,function(res)
    {
      if (res)
      {
        // Exec download
        var blob = new Blob([res],{type:"text/csv"});

        saveAs(blob,entityName+".csv");
      }
    });
  };

  /* Private function */
  function loadMasterPage()
  {
    if (!$scope.count)
    {
      $scope.data = [];
      $scope.last = 0;
      $scope.first = 0;
      $scope.loading = false;
      return;
    }

    // Master request
    var body = {
      filter: filter,
      ord: order,
      rpp: $scope.rpp,
      cp: $scope.curPage
    };

    rwHttpSvc.post(masterUrl,body,function(res)
    {
      $scope.data = [];

      if (res && res.result)
      {
        for (var i = 0;i < res.result.length;i++)
        {
          var obj = res.result[i];
          $scope.data.push(entityClass ? new entityClass(obj) : obj);
        }

        // Update pagination info
        $scope.first = ($scope.curPage-1) * $scope.rpp + 1;
        $scope.last = $scope.first + $scope.rpp*1 - 1;

        if ($scope.last > $scope.count)
          $scope.last = $scope.count;
      }

      // Reset selected object
      $scope.rowClasses = {};
      $scope.config.selectedRow = null;

      $scope.$emit("tvSelObj",id,null);

      // Hide loader
      $scope.loading = false;
    });
  };


  function sortDataArray(col,asc)
  {
    switch (col.type)
    {
      case "date":
      case "number":
        $scope.data.sort(function(a,b)
        {
          return asc ? a[col.id]-b[col.id] : b[col.id]-a[col.id];
        });
        break;
      case "object":
        $scope.data.sort(function(a,b)
        {
          var aVal = a[col.id], bVal = b[col.id],
            aStr = "", bStr = "";

          for (var i = 0, count = col.source.length;i < count;i++)
          {
            var obj = col.source[i];

            if (obj.id == aVal) aStr = obj.name;
            if (obj.id == bVal) bStr = obj.name;
          }

          return asc ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        });
        break;
      default:
        $scope.data.sort(function(a,b)
        {
          var res = a[col.id] ? a[col.id].localeCompare(b[col.id]) : 1;

          return asc ? res : res*(-1);
        });
        break;
    }
  };

  function resetColsConfig()
  {
    for (var i = 0;i < $scope.config.columns.length;i++)
    {
      var col = $scope.config.columns[i];

      if (col.sortable)
        col.class = "sorting";
    }
  };
}

function rwCollectionCtrl($scope,rwHttpSvc)
{
  $scope.content = [];
  $scope.itemCSS = {};
  $scope.titleAtt = $scope.config.titleAtt;
  $scope.descrAtt = $scope.config.descrAtt;
  $scope.searchCfg = $scope.config.search;
  $scope.loading = false;

  if ($scope.searchCfg)
    $scope.searchCfg.reset = 0;

  // Pagination
  $scope.rpp = "5";
  $scope.rppArray = ["5","10","15","20"];

  if ($scope.config.paginationCfg)
  {
    var pagRpp = $scope.config.paginationCfg.rpp,
      pagRppArray = $scope.config.paginationCfg.rppArray;

    if(pagRpp != null && pagRpp > 0)
      $scope.rpp = pagRpp;

    if(pagRppArray != null && pagRppArray.length)
      $scope.rppArray = pagRppArray;
  }

  $scope.count = 0;
  $scope.curPage = 1;

  $scope.firstItem = 0;
  $scope.lastItem = 0;

  // Style
  $scope.collStyle = {};

  if ($scope.config.maxHeight)
  {
    $scope.collStyle["max-height"] = $scope.config.maxHeight;
    $scope.collStyle["overflow-y"] = "auto";
  }

  /* Private properties */
  var id = $scope.config.id;
  var order = $scope.config.order;
  var filter = null;
  var entName = $scope.config.entityName;
  var entClass = $scope.config.entityClass;
  var bDefFilter = false;

  function loadMasterPage()
  {
    var body = {
      filter: filter,
      ord: order ? order : $scope.titleAtt+"|ASC",
      rpp: $scope.rpp,
      cp: $scope.curPage
    };

    $scope.loading = true;

    rwHttpSvc.post("/"+entName+"/master",body,function(res)
    {
      $scope.content = [];

      if (res && res.result)
      {
        for (var i = 0;i < res.result.length;i++)
          $scope.content.push(new entClass(res.result[i]));

        // Update pagination info
        $scope.firstItem = ($scope.curPage-1) * $scope.rpp + 1;
        $scope.lastItem = $scope.firstItem + $scope.rpp*1 - 1;

        if ($scope.lastItem > $scope.count)
          $scope.lastItem = $scope.count;
      }

      $scope.loading = false;
    });
  };


  /* Config watch */
  $scope.$watch("config.filter",function(nObj,oObj)
  {
    if(!nObj)
      return;

    // Reset search tools
    $scope.searchCfg.reset++;

    // Add default filter
    bDefFilter = true;
    filter = {groupOp:"AND", rules:[], groups:[nObj]};
  });

  $scope.$watch("config.reload",function(newVal,oldVal)
  {
    var body = filter ? {filter:filter} : {};

    $scope.loading = true;

    if ($scope.config.pagination)
    {
      rwHttpSvc.post("/"+entName+"/count",body,function(res)
      {
        if (res && res.count != null)
        {
          $scope.count = res.count;

          // Notify to listener
          var emObj = {
            count: res.count,
            filter: angular.copy(filter)
          };

          $scope.$emit("cvCountReloaded",id,emObj);
          loadMasterPage();
        }
      });
    }
    else
    {
      if(order)
        body.ord = order;
      else
         body.ord = $scope.titleAtt+"|ASC";

      rwHttpSvc.post("/"+entName+"/master",body,function(res)
      {
        $scope.content = [];

        if (res && res.result)
        {
          for (var i = 0;i < res.result.length;i++)
            $scope.content.push(new entClass(res.result[i]));
        }
        $scope.loading = false;
      });
    }
  });

  $scope.$watch("config.reset",function(newVal,oldVal)
  {
    $scope.itemCSS = {};
  });

  /* Search watch */
  $scope.$watch("searchCfg.simple.filter",function(newVal,oldVal)
  {
    if (!oldVal && !newVal)
      return;

    if (bDefFilter)
    {
      // Reset filter
      filter.groups = [$scope.config.filter];

      if (newVal)
        filter.groups.push(newVal);
    }
    else
      filter = newVal;

    $scope.config.reload++;
  });

  $scope.$watch("searchCfg.advanced.filter",function(newVal,oldVal)
  {
    if (!oldVal && !newVal)
      return;

    if (bDefFilter)
    {
      // Reset filter
      filter.groups = [$scope.config.filter];

      if (newVal)
        filter.groups.push(newVal);
    }
    else
      filter = newVal;

    $scope.searchCfg.reset++;
    $scope.config.reload++;
  });

  /* Scope function */
  $scope.setSelected = function(entity)
  {
    $scope.itemCSS = {};
    $scope.itemCSS[entity.id] = "cv-item-sel";

    $scope.$emit("cvSelItem",entity,id);
  };

  $scope.pageChanged = function()
  {
    loadMasterPage();
  };

  $scope.rppChanged = function()
  {
    loadMasterPage();
  };
}

function rwPaginationCtrl($scope,rwHttpSvc)
{
  $scope.rpp = "5";
  $scope.rppArray = ["5","10","15","20"];

  $scope.count = 0;
  $scope.curPage = 1;

  $scope.firstIndex = 0;
  $scope.lastIndex = 0;

  /*
   * Read configuration
   */
  var order = $scope.config.order;
  var filter = $scope.config.filter;
  var entity = $scope.config.entity;
  var countUrl = $scope.config.countUrl;
  var masterUrl = $scope.config.masterUrl;

  if ($scope.config.rpp)
    $scope.rpp = $scope.config.rpp;

  if ($scope.config.rppArray)
    $scope.rppArray = $scope.config.rppArray;

  /*
   * Configuration watch
   */
  $scope.$watch("config.order",function(nVal,oVal)
  {
    if (!nVal && !oVal)
      return;

    order = nVal;
  });

  $scope.$watch("config.filter",function(nVal,oVal)
  {
    if (!nVal && !oVal)
      return;

    filter = nVal;
  });

  $scope.$watch("config.reload",function(nVal,oVal)
  {
    if (nVal < 0)
      return;

    // Exec count
    var body = filter ? {filter: filter} : {};

    rwHttpSvc.post(countUrl,body,function(res)
    {
      if (res && res.count != null)
      {
        $scope.count = res.count;
        $scope.curPage = 1;

        $scope.loadPage();
      }
    });
  });

  /*
   * Scope function
   */
  $scope.loadPage = function()
  {
    var body = {
      filter: filter,
      ord: order,
      rpp: $scope.rpp,
      cp: $scope.curPage
    };

    rwHttpSvc.post(masterUrl,body,function(res)
    {
      var retObj = [];

      if (res && res.result)
      {
        // Update pagination info
        $scope.firstIndex = ($scope.curPage-1) * $scope.rpp + 1;
        $scope.lastIndex = $scope.firstIndex + $scope.rpp*1 - 1;

        if ($scope.lastIndex > $scope.count)
          $scope.lastIndex = $scope.count;

        // Prepare retObj
        if (entity)
        {
          for (var i = 0;i < res.result.length;i++)
            retObj.push(new entity(res.result[i]));
        }
        else
          retObj = res.result;
      }

      $scope.$emit("rwPageLoaded",$scope.config.id,retObj);
    });
  };
}

function rwPopupCollectionCtrl($scope)
{
  $scope.popoverCfg = {
    templateUrl:"core/views/rw-popup-collection-template.html"
  };

  $scope.templateStyle = "";
  $scope.btnClass = "";
  $scope.popoverIsOpen = false;

  $scope.popoverVisibility = function()
  {
    $scope.popoverIsOpen = !$scope.popoverIsOpen;
  }

  /* Watches */
  var unbindConfigW = $scope.$watch("config",function(nv,ov)
  {
    if(nv == undefined)
      return;

    // Manage disabled if defined
    if(nv.hasOwnProperty("disabled"))
      $scope.disabled = nv.disabled;

    // Manage maxWidth if defined
    if(nv.maxWidth)
      $scope.templateStyle = "max-width:"+nv.maxWidth+"px";
    else
      $scope.templateStyle = "max-width:250px;";

    // Manage visible if defined
    if(nv.hasOwnProperty("visible") && nv.visible > 0)
      $scope.popoverVisibility();

    // Manage forceClose if defined
    if(nv.hasOwnProperty("forceClose") && nv.forceClose > 0)
    {
      $scope.popoverIsOpen = false;
      nv.forceClose = 0;
    }

  },true);

  var unbindBtnclassW =$scope.$watch("btnclass",function(nv,ov)
  {
    if(nv == undefined)
      return;
    // Change button's class
    $scope.btnClass = nv;
  });

  $scope.$on("$destroy",function()
  {
    unbindConfigW();
    unbindBtnclassW();
  });
}

function rwAlertCtrl($rootScope,$scope,$uibModalInstance,data)
{
  $scope.data = data;
  $scope.buttons = data.buttons;
  $scope.btnClass = "btn btn-sm btn-" + data.style;
  $scope.mainClass = "alert alert-" + data.style;

  $scope.close = function()
  {
    $uibModalInstance.close();
  };

  $scope.btnClicked = function(btn)
  {
    $rootScope.$broadcast("rwAlertDidEnd",data.id,btn);
    $uibModalInstance.close();
  };
}

function rwSearchCtrl($scope)
{
  // Flag used to show the error of "groupOp not defined"
  $scope.showError = false;

  // SelectedField data source
  $scope.sourceDS = [];

  $scope.config.result = 0;

  // Function called when a user press search button
  $scope.search = function (form, $event)
  {
    //Insert the filter in the config
    $scope.config.filter = $scope.filter;

    $scope.config.result +=1;

    //Update _close to close popover
    $scope.config._close++;
  }

  // Function called to reset filter
  $scope.resetFilter = function()
  {
    resetSearch();

    //Insert the empty filter in the config
    $scope.config.filter = null;
  }

  // Function called to control if the search form is globally invalid
  $scope.searchIsInvalid = function(filter)
  {
    var res = true;
    if($scope.searchForm.$invalid) // Base step
      res = true;
    else
      res &= $scope.logicalOperatorIsInvalid(filter);

    return res;
  }
  // Function called to control if the user has selected logical operator, if necessary
  $scope.logicalOperatorIsInvalid = function(filter)
  {
    var res = true;

    if(filter.groups && filter.groups.length >0 && filter.rules && filter.rules.length >0)
    {
      if(filter.groupOp && filter.groupOp !== "")
      {
        for(var i=0; i< filter.groups.length; i++)
          res &= $scope.logicalOperatorIsInvalid(filter.groups[i]);
      }
      else
        res &= true;
    }
    else
    {
      if(filter.groups && filter.groups.length >0)
      {
        if(filter.groupOp && filter.groupOp !== "")
        {
          for(var i=0; i< filter.groups.length; i++)
            res &= $scope.logicalOperatorIsInvalid(filter.groups[i]);
        }
        else
          res &= true;
      }
      else
      {
        if(filter.rules && filter.rules.length > 1) //filter.rules
        {
          if(filter.groupOp && filter.groupOp !== "")
            res &= false;
          else
            res &= true;
        }
        else
          res &= false;
      }
    }

    // Manage error
    if(res)
    {
      $scope.showError = true;
      $scope.errorMessage = "CORE_MSG.SEARCH_OP_ERROR";
    }
    else
      $scope.showError = false;

    return res;
  }

  $scope.$watch("config.source",function()
  {
    resetSearch();
  },true);

  $scope.$watch("config._reset",function(nv,ov)
  {
    if (!nv)
      return;

    //Reset
    resetSearch();
  });

  $scope.$watch("config._update",function(nv,ov)
  {
    if(nv == undefined)
    {
      //Reset
      resetSearch();
      return;
    }

    var logOp = [{"op":"AND","lbl":"AND"},{"op":"OR","lbl":"OR"}]; //Default operators
    if($scope.config.hasOwnProperty("logicalOperators"))
      logOp = $scope.config.logicalOperators; //User defined operators


    if(!angular.equals(nv,$scope.filter))
    {
      //Update filter, coping the nv
      angular.copy(nv,$scope.filter);
    }
    //Create the searchObj from filter to show groups and/or conditions
    $scope.searchObj = createSearchObj(nv,logOp);
  },true);

  // Function used to create the searchObj from the filter
  function createSearchObj(filter,logOp)
  {
    var newSearchObj = {groups:[]};

    //Clear sourceDS and populate it
    $scope.sourceDS.splice(0,$scope.sourceDS.length);
    angular.forEach($scope.config.source,function(value,key)
    {
      this.push(value);
    },$scope.sourceDS);

    var innerGroup = recursiveCreateSearchObj(filter,logOp);
    //Add sourceDS
    innerGroup.source=$scope.sourceDS;

    var lbl = "OPERATOR."+filter.groupOp;
    newSearchObj.selectedLogicalOperator= {op:filter.groupOp,lbl:lbl};
    newSearchObj.source = $scope.sourceDS;
    newSearchObj.groups.push(innerGroup);

    return newSearchObj;
  }

  // Recursive function
  function recursiveCreateSearchObj(filter,logOp)
  {
    var obj = {conditions:[],groups:[],operators:[]};

    // Add selected operator and operators
    var lbl = "OPERATOR."+filter.groupOp;
    obj.selectedLogicalOperator= {op:filter.groupOp,lbl:lbl};
    angular.forEach(logOp,function(val,key)
    {
      this.push(val);
    },obj.operators);

    // Add rules
    angular.forEach(filter.rules,function(val,key)
    {
      var rule = {"sourceDs":$scope.sourceDS};

      //Extract from val sourceField, comparisonOperator and data (if it's not empty)
      if(!angular.equals({},val))
      {
        if(val != undefined && val!=null)
        {
          /* Clean val from % characters */
          var cleanVal = "";
          for(var j=0; j<val.length; j++)
          {
            var char = val[j];
            if(char !== '%')
              cleanVal += char;
          }

          if(cleanVal.length > 0)
          {
            var splittedVal = cleanVal.split("|"), sourceField = splittedVal[0],
              comparisonOp = splittedVal[1], data = "";

            if(splittedVal.length == 3)
              data = splittedVal[2];

            /* Find the type of selected sourceField */
            var numSourceDS = $scope.sourceDS.length, trovato = false, type=null;
            for(var k=0; k<numSourceDS && !trovato;k++)
            {
              var ds= $scope.sourceDS[k];
              if(angular.equals(ds.id,sourceField))
              {
                 trovato = true;
                 type=ds.type;
              }
            }
            if(trovato)
            {
              switch (type)
              {
                case "date":
                  if(comparisonOp == "DATE_EQ")
                  {
                    /* Substitude the comparisonOp with EQ to show
                     * the correct operator in the combo
                     */
                    comparisonOp = "EQ";
                    /* NOTE data arrived as a list of 2 date separeted by comma.
                     * This couple of date permit to define an interval starting
                     * from the 00:00 and ending to te 23:59 of the selected day.
                     * The first date is the user's selected date with time
                     * equal to 00:00, the second date is the same date time
                     * equal to 23:59.
                     * So i can show the first date as data!
                     */
                    var aIntervalDate=data.split(","), num=aIntervalDate.length;
                    if(num != 2)
                      console.error("rwSearchCtrl error: dates interval not"+
                      " contain 2 date to manage DATE_EQ operator!");
                    else
                    {
                      // Get the first date
                      var originalDate=aIntervalDate[0];
                      // Convert timestamp to Date
                      data = new Date(originalDate*1);
                    }
                  }
                  else
                  {
                    // Convert timestamp to Date
                    data = new Date(data*1);
                  }
                  break;
                case "datetime":
                  // Convert timestamp to Date
                  data = new Date(data*1);
                  break;
                case "combo":
                  // Manage true and false (for checkbox)
                  switch (data)
                  {
                    case "true":
                      data = true;
                      break;
                    case "false":
                      data = false;
                      break;
                  }
                  break;
              }
            }

            rule.inputItem = {
              sourceField:sourceField,
              comparisonOperator:comparisonOp,
              data:data
            };
          }
        }
      }
      this.push(rule);
    },obj.conditions);

    /* Recursion */
    if(filter.groups && filter.groups.length >0)
    {
      for(var i=0; i< filter.groups.length; i++)
        obj.groups.push(recursiveCreateSearchObj(filter.groups[i],logOp));
    }
    return obj;
  }

  // Reset the search (UI and filter)
  function resetSearch()
  {
    //Clear sourceDS and populate it
    $scope.sourceDS.splice(0,$scope.sourceDS.length);
    angular.forEach($scope.config.source,function(value,key)
    {
      this.push(value);
    },$scope.sourceDS);

    // Set empty filter
    $scope.filter = {"rules":[{}], "groups":[], "groupOp":""};

    // Set empty search obj used to configure the UI
    $scope.searchObj = {
      "groups": [{"conditions": [] ,"operators":[], "groups":[]}], "source":$scope.sourceDS
    };

    if($scope.config)
    {
      // Parse the config file
      if($scope.config.source)
      {
        var logOp = [{"op":"AND","lbl":"AND"},{"op":"OR","lbl":"OR"}]; //Default operators

        if($scope.config.hasOwnProperty("logicalOperators"))
          logOp = $scope.config.logicalOperators; //User defined operators

        /* Add logical operators */
        var logOpN = logOp.length;
        for(var j=0; j < logOpN;j++)
          $scope.searchObj.groups[0].operators.push(logOp[j]);

        /* Set maxGroups and maxConditions, if defined by user */
        if($scope.config.hasOwnProperty("maxGroups") && $scope.config.maxGroups!= null)
          $scope.searchObj.maxGroups = $scope.config.maxGroups;
        else //Default value
          $scope.searchObj.maxGroups = 4;

        if($scope.config.hasOwnProperty("maxConditions") && $scope.config.maxConditions!= null)
          $scope.searchObj.maxConditions = $scope.config.maxConditions;
        else //Default value
          $scope.searchObj.maxConditions = 4;

        //Add condition
        $scope.searchObj.groups[0].conditions.push({"sourceDs":$scope.sourceDS});
      }
    }
  }
}

function rwSearchGroupCtrl($scope, $element, $attrs)
{
  if($scope.groups.selectedLogicalOperator != undefined)
    $scope.selectedLogicalOperator = $scope.groups.selectedLogicalOperator;

  // Function used to show/hide addGroup button
  $scope.canAddGroup = function()
  {
    var canAddGroup = false, maxGroups = $scope.config.maxGroups;

    if (!maxGroups || maxGroups <= 0)
      canAddGroup = true;
    else
    {
      var groupCount = 0;
      groupCount = recursiveGroupCount($scope.config, groupCount);
      canAddGroup = groupCount + 1 <= maxGroups;
    }
    return canAddGroup;
  }

  // Function used to verify if is possible to remove the group
  $scope.canRemoveGroup = function()
  {
    if($scope.groups.groups.length>0)
      return true;
    else
      return false;
  }

  // Function used to remove the group
  $scope.removeGroup = function ()
  {
    /* Update filter */
    $scope.filter.groups.splice($scope.groupIndex,1);

    /* Update config */
    $scope.groups.groups.splice($scope.groupIndex,1);
  };

  // Function used to add a group
  $scope.addGroup = function ()
  {
    /* Update filter  */
    var newGroupInFilter = {};
    newGroupInFilter.rules = [{}];
    newGroupInFilter.groups = [];
    newGroupInFilter.groupOp = "";

    $scope.filter.groups.push(newGroupInFilter);

    /* Update config */
    var newGroup = {"conditions":[] ,"operators":[], "groups":[]};

    /* Insert operators in the new group */
    angular.forEach($scope.groups.operators,function(value,key)
    {
      this.push(value);
    },newGroup.operators);


    // Insert condition in the new group
    newGroup.conditions.push({"sourceDs":$scope.config.source});

    // Add the new group to groups
    $scope.groups.groups.push(newGroup);
  };

  // Function used to show/hide addCondition button
  $scope.canAddCondition = function (index)
  {
    var canAddCondition = false, conditionsCount = 1;
    var maxConditions = $scope.config.maxConditions;

    if (!!$scope.groups.conditions && $scope.groups.conditions instanceof Array)
        conditionsCount = $scope.groups.conditions.length;

    if ((!maxConditions || maxConditions <= 0) && index + 1 === conditionsCount)
        canAddCondition = true;
    else
        canAddCondition = conditionsCount + 1 <= maxConditions && index + 1 === conditionsCount;
    return canAddCondition;
  };

  // Function used to add a condition
  $scope.addCondition = function (form)
  {
    var isValid = false;
    if (!!form)
    {
      if (form.$valid)
        isValid = true;
    }
    else
      isValid = true;

    if (isValid)
    {
      /* Update filter */
      $scope.filter.rules.push({});

      // Insert condition in the group
      var newCondition = { "sourceDs":$scope.config.source};
      $scope.groups.conditions.push(newCondition);
    }
  };

  // Function used to remove a condition
  $scope.removeCondition = function(index)
  {
    /* Update filter */
    $scope.filter.rules.splice(index,1);

    /* update config */
    $scope.groups.conditions.splice(index, 1);
  }

  // Function used to count groups
  function recursiveGroupCount(item, count)
  {
    if (!!item && !!item.groups && item.groups instanceof Array)
    {
      count = count + item.groups.length;
      for (var i = 0; i < item.groups.length; i++)
        count = recursiveGroupCount(item.groups[i], count);
    }
    return count;
  }

  // Function used to specify the logical operator
  $scope.selectLogicalOperator = function(operator)
  {
    $scope.selectedLogicalOperator = {
      "op": operator.op,
      "lbl": operator.lbl
    };

    // Update filter
    $scope.filter.groupOp = $scope.selectedLogicalOperator.op;
  }
}

function rwSearchCondCtrl($scope, $element, $attrs)
{
  $scope.inputItem = $scope.condition.inputItem;

  /* Variables for datetime */
  $scope.formatDatetime = 'dd/MM/yyyy HH:mm';
  var splittedFormat = $scope.formatDatetime.split(' ');
  $scope.formatDate = splittedFormat[0];
  $scope.formatTime = splittedFormat[1];
  $scope.dateOptions = {showWeeks:false};
  $scope.timeOptions = {showWeeks:false,showSpinners:false};
  $scope.buttonBar=
  {
    show:true,
    now: {show: false},
    today: {show: false},
    clear: {show: true},
    date: {show: true},
    time: {show: true},
    close: {show: true}
  }

  $scope.popupDatetime = {};

  // Function used to open bootstrap-ui-datetime-picker
  $scope.openPopup = function ()
  {
    $scope.$emit("dtpVisibility",true);
    $scope.popupDatetime.opened = true;
  }

  // Function used to set/unset error class on a specified field
  $scope.errorClass = function(fieldName)
  {
    if($scope.searchConditionForm.$submitted &&
      $scope.searchConditionForm[fieldName].$error.required)
      return "rw-search-input-error";
    else
      return "";
  }

  /* Change type and operators according to the selected source field */
  $scope.$watch("inputItem.sourceField",function(nVal,oVal)
  {
    if(nVal == undefined)
      return;

    if(nVal !== oVal)
    {
      // Clear InputItem
      $scope.inputItem.comparisonOperator = null;
      $scope.inputItem.data = null;
    }

    // Manage operator
    var found = false, numDs = $scope.condition.sourceDs.length, operatorsWithLbl = [];
    for(var i=0; i < numDs;i++)
    {
      var ds = $scope.condition.sourceDs[i];
      if(ds.id == nVal)
      {
        found = true;

        // Change type
        $scope.selectedSourcefieldType = ds.type;

        var comboDs = [{id:null,name:""}];
        if(ds.type == "combo") //Build combo ds
        {
          angular.forEach(ds.values,function(value,key)
          {
            if(ds.values[key].id != null) // Workaround to avoid empty item duplication
              this.push(ds.values[key])
          },comboDs);
          $scope.inputItemDataSource = comboDs;
        }

        // Memorize the inputItem type
        $scope.inputItem.type = ds.type;

        // Create operator object, made up by a name and a id and put in $scope.condition.operatorsWithLbl
        angular.forEach(ds.operators,function(value,key)
        {
          var operatorObj = {};
          operatorObj.id= value;
          operatorObj.name= "OPERATOR."+value;

          this.push(operatorObj);
        },operatorsWithLbl);

        // Change operator according to the selected source field
        $scope.operatorsWithLbl = operatorsWithLbl;

        //NOTE If there's only one operator, select it by default
        if(ds.operators.length ==1)
          $scope.inputItem.comparisonOperator = ds.operators[0];
      }
    }

    //Update filter
    updateCondition();
  },true);

  $scope.$watch("inputItem.comparisonOperator",function(nVal,oVal)
  {
    if(nVal == undefined)
      return;
    //Update filter
    updateCondition();
  },true);

  $scope.$watch("inputItem.data",function(nVal,oVal)
  {
    // If the iinputItem is a combo,select the correct item
    if($scope.inputItemDataSource && $scope.inputItem.data != null)
    {
      if (!isNaN(parseInt($scope.inputItem.data)) &&
        isFinite($scope.inputItem.data))
      {
        // Convert to int to show the selected item into the combo
        $scope.inputItem.data = $scope.inputItem.data*1;
      }
      else
        $scope.inputItem.data = $scope.inputItem.data;
    }

    //Update filter
    updateCondition();
  },true);


  $scope.$watch("popupDatetime.opened",function(nVal,oVal)
  {
    if(nVal == undefined)
      return;

    if(!nVal)
      $scope.$emit("dtpVisibility",false);
  });

  // Function used to update the condition in the filter
  function updateCondition()
  {
    if(!$scope.inputItem)
      return;

    var operator = $scope.inputItem.comparisonOperator,
      value = $scope.inputItem.data;

    if(operator == "ILIKE" || operator == "LIKE") // Add % before and after value
      value = "%" + value + "%";

    if(operator == "IS") // Convert operator to EQ
      $scope.inputItem.comparisonOperator = "EQ";
    if(operator == "IS_NOT") // Convert operator to NE
      $scope.inputItem.comparisonOperator = "NE";


    if($scope.inputItem.type == "date")
    {
      //Convert Data in timestamp in milliseconds
      if(value)
        value = value.getTime();

      if(operator == "EQ")
      {
        /* Change the operator in DATE_EQ.
        * NOTE Backend substitude this date as an interval of date
        */
        var startTimestamp = value, endTimestamp = startTimestamp + 86399000;
        $scope.filter = $scope.inputItem.sourceField +"|DATE_EQ|"+startTimestamp+
          ","+endTimestamp;
      }
      else
        $scope.filter = $scope.inputItem.sourceField +"|"+operator +"|" + value;
    }
    else if($scope.inputItem.type == "datetime")
    {
      //Convert Data in timestamp in milliseconds
      if(value)
        value = value.getTime();
      $scope.filter = $scope.inputItem.sourceField +"|"+operator +"|" + value;
    }
    else
    {
      if(value == null)
      {
        switch($scope.inputItem.comparisonOperator)
        {
          case "NE":
          case "NEQ":
            $scope.filter = $scope.inputItem.sourceField +"|IS_NOT|" + value;
            break;
          case "IS_NOT":
            $scope.filter = $scope.inputItem.sourceField +"|IS_NOT|" + value;
            break;
          default:
            $scope.filter = $scope.inputItem.sourceField +"|IS|" + value;
        }
      }
      else if(value === "null" || value === "")
      {
        $scope.inputItem.data = null;
        switch($scope.inputItem.comparisonOperator)
        {
          case "IS_NOT":
            $scope.filter = $scope.inputItem.sourceField +"|IS_NOT|" + value;
            break;
          default:
            $scope.filter = $scope.inputItem.sourceField +"|IS|" + value;
            break;
        }
      }
      else
        $scope.filter = $scope.inputItem.sourceField +"|"+operator +"|" + value;
    }
  }

  /* Functions to call on parent */
  $scope.canAddCondition = $scope.$parent.canAddCondition;
  $scope.addCondition = $scope.$parent.addCondition;
  $scope.removeCondition = $scope.$parent.removeCondition;
}

function rwSearchButtonCtrl($scope)
{
  var curFilter = null;
  $scope.btnStyle="";
  $scope.popoverIsOpen = false;

  if ($scope.config)
  {
    /* Flag used to manage popover close when search is done */
    $scope.config._close = 0;

    /* Add reset attributes */
    $scope.config.reset = 0;

    /*
     * Flag used to memorize the filter.
     * This is usefult to show the same filter when the popover is re-opened;
     */
    $scope.config._update = null;

    /* Popover to show search form */
    $scope.filterPopover = {
      templateUrl: 'core/views/rw-search-popover-template.html',
      title: 'WORDS.SEARCH'
    };

    $scope.$watch("config._close",function(nVal,oVal)
    {
      if(nVal == undefined)
        return;
      // Close popover when filter arrived
      $scope.popoverIsOpen = false;
    },true);

    $scope.$watch("config.reset",function(nVal,oVal)
    {
      curFilter = null;
    });

    $scope.$watch("config.filter",function(nVal,oVal)
    {
      // Memorize the filter
      curFilter = nVal;
    });

    // Change btn class according to the presence/absence of curFilter
    $scope.classForBtn = function()
    {
      if(curFilter)
        return "btn-info";
      else
        return "btn-default";
    }

    $scope.popoverVisibility = function()
    {
      if (!$scope.popoverIsOpen)
        $scope.config._update = curFilter;

      // Manage visibility
      $scope.popoverIsOpen = !$scope.popoverIsOpen;
    };

    // Default popover class
    var defaultPopoverClass = "rw-search-popover";
    $scope.popoverClass = defaultPopoverClass;

    // Manage popover class when uib-datetime-picker is opened
    $scope.$on("dtpVisibility",function(ev,arg)
    {
      if(arg)
        $scope.popoverClass = "rw-search-popover-no-overflow";
      else
        $scope.popoverClass = defaultPopoverClass;
    });

  }
  else
    console.error("rwSearchButtonCtrl error: configuration not find!");
}

function rwSearchToolsCtrl($scope)
{
  $scope.curSearchVal = null;
  $scope.oldSearchVal = null;
  $scope.disable = false;

  /* Config watch */
  $scope.$watch("config.disable",function(nVal,oVal)
  {
    if (nVal == undefined)
      return;

    // Flag used to disable search tools
    $scope.disable = nVal;
  });

  $scope.$watch("config.reset",function(nv,ov)
  {
    if (!nv)
      return;

    $scope.curSearchVal = null;
    $scope.oldSearchVal = null;
    $scope.config.advanced.reset++;
  });

  /* Scope function */
  $scope.onSearch = function(ev)
  {
    if (ev.keyCode != 13)
      return;

    if ($scope.curSearchVal != $scope.oldSearchVal)
    {
      var res = null;

      if ($scope.curSearchVal)
      {
        var aKey = $scope.config.simple.key;
        res = {rules:[], groups:[], groupOp:"OR"};

        for (var i = 0;i < aKey.length;i++)
          res.rules.push(aKey[i]+"|ILIKE|%"+$scope.curSearchVal+"%");
      }

      // Notify result
      $scope.config.simple.filter = res;

      // Update old value
      $scope.oldSearchVal = $scope.curSearchVal;
    }
  };

  $scope.onClear = function()
  {
    $scope.curSearchVal = null;
    $scope.oldSearchVal = null;
    $scope.config.simple.filter = null;
  };

}

function rwAttachManagerCtrl($scope,RWAttachment,rwHttpSvc,rwConfigSvc,rwAuthSvc)
{
  $scope.alert = {};
  $scope.file = null;

  /* Alert event */
  $scope.$on("showUploadAlert",function(ev,cfg)
  {
    $scope.alert.tag = cfg.tag;
    $scope.alert.msg = cfg.msg;
    $scope.alert.btOk = cfg.btOk;
    $scope.alert.btKo = cfg.btKo;
    $scope.alert.style = cfg.style;
    $scope.alert.callback = cfg.callback;
  });

  /* Scope Functions */
  $scope.clearFileSelection = function(){
    angular.element("input[type='file']").val(null);
  }

  $scope.alertOk = function()
  {
    // Look for callback
    if ($scope.alert.callback)
      $scope.alert.callback();

    // Reset alert
    $scope.alert = {};
  }

  $scope.alertKo = function()
  {
    $scope.alert = {};
  };

  $scope.upload = function(idx)
  {
    var entToUpload = $scope.attachments[idx];

    if(entToUpload.hasOwnProperty("fileToUpload"))
    {
      var uploadUrl ="/"+$scope.config.uploadEntityName+"/"+$scope.entity.id+"/upload",
        opt = {
          file:entToUpload.fileToUpload,
          descr:entToUpload.descr != null ? entToUpload.descr: ""
        };

      /* Upload file */
      rwHttpSvc.upload(uploadUrl,opt,function(res)
      {
        if (res && res.data && res.data.result)
        {
          var response = res.data.result;
          // Update entity id
          entToUpload.id = response.id;
          entToUpload.insert_date = response.insert_date;

          // Update the preview with the Url to call to obtain preview
          entToUpload.preview = rwConfigSvc.urlPrefix + "/" +
            $scope.config.uploadEntityName + "/" +
            $scope.entity.id + "/getFile/" + entToUpload.name +
            "?it_app_auth=" + rwAuthSvc.token;

          // Update entity's attach
          $scope.entity.attach.push(entToUpload);
        }
        else
        {
          $scope.$emit("showAlert",{
            msg: "CORE_LBL.INSERT_ERR",
            btKo: "Ok",
            style: "danger"});
        }
      });

    }
    else
      console.error("rwAttachManager ERROR: nothing to upload! ");
  }

  $scope.delete = function(idx)
  {
    $scope.$emit("showUploadAlert",
    {
      msg: "CORE_MSG.DELETE_MSG",
      btOk: "WORDS.YES",
      btKo: "No",
      style: "info",
      callback: function()
      {
        var attachId = $scope.attachments[idx].id;

        if (attachId)
        {
          var delUrl = "/"+$scope.config.uploadEntityName +
            "/delAttach/"+ attachId;

          /* Delete */
          rwHttpSvc.delete(delUrl,function(res)
          {
            if (res && res.result)
            {
              $scope.attachments.splice(idx,1);

              // Find the deleted attachment into the entity's attach and remove
              var attachN=$scope.entity.attach.length, found=false;
              for(var i=0; i<attachN &&!found;i++)
              {
                var item = $scope.entity.attach[i];
                if(item.id == attachId)
                {
                  found = true;
                  $scope.entity.attach.splice(i,1);
                }
              }
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
        else // Delete locally
          $scope.attachments.splice(idx,1);
      }
    });
  };

  /* Watch Functions */

  var unbindConfigW = $scope.$watch("config", function(newObj,oldObj)
  {
    if (newObj == undefined)
      return;

    $scope.disabled = newObj.hasOwnProperty("disabled") ?
      newObj.disabled : false;
  },true);

  var unbindEntityAttachW =$scope.$watch("entity.attach", function(newObj,oldObj)
  {
    if (newObj == undefined)
      return;

    if(newObj !== null)
    {
      // Populate attachments variable
      $scope.attachments = [];

      angular.forEach(newObj,function(obj,idx)
      {
        var attach = new RWAttachment(obj);

        // Create the Url to call to obtain preview
        attach.preview = rwConfigSvc.urlPrefix + "/" +
          $scope.config.uploadEntityName + "/" +
          $scope.entity.id + "/getFile/" + attach.name +
          "?it_app_auth=" + rwAuthSvc.token;

        this.push(attach);
      },$scope.attachments);
    }
  });

  var unbindFileW = $scope.$watch("file", function(newObj,oldObj)
  {
    if (newObj == undefined)
      return;

    /* Create a new RWAttachment */
    var cfg = {
      id: null,
      name:newObj.name,
      descr:null,
      insert_date:null,
      size:newObj.size,
      entity_id:$scope.entity.id
    };

    var attach = new RWAttachment(cfg);
    // Memorize,into the attach, the new object as the fileToUpload
    attach.fileToUpload = newObj;

    // Verify if there's another file with the same name of the new file
    for(var i=0, found = false; i<$scope.attachments.length && !found; i++)
    {
      var item = $scope.attachments[i];
      if(item.name == attach.name)
        found = true;
    }
    if(!found)
    {
      // Add to the attachments
      $scope.attachments.push(attach);

      if(attach.isImage)
      {
        if(attach.fileExt != null)
        {
          // Dictionary of img extensions
          var imageExtensions = { img:"", png:"", jpg:"", jpeg:"", gif:""};
          // The file is an image
          if(imageExtensions.hasOwnProperty(attach.fileExt))
          {
            var reader = new FileReader();
            reader.onload = function(ev)
            {
              /*
              * Update entity photo's name and memorize the selected File before
              * showing the image
              * (it'll be upload if necessary)
              */
              $scope.entity[$scope.config.photoAttrName] = newObj.name;
              $scope.entity[$scope.config.fileAttrName] = newObj;

              // Show image's preview
              $scope.disabled = false;
              attach.preview = ev.target.result;

              $scope.$apply();

            };
            reader.readAsDataURL(newObj);
          }
        }
      }
    }
    else
    {
      // Show message to the user
      $scope.$emit("showUploadAlert",
      {
        msg: "CORE_MSG.DUPLICATE_ATTACH",
        btOk: "Ok",
        style: "warning"
      });
    }
  });

  $scope.$on("$destroy",function()
  {
    // Unbind Watches
    unbindConfigW();
    unbindEntityAttachW();
    unbindFileW();
  });
}
