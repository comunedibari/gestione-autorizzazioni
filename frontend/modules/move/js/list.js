/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("move")
  .controller("moveListCtrl",moveListCtrl);

function moveListCtrl($scope,$uibModalInstance,Move,rwAuthSvc,mvModelSvc,
  rwContextSvc,rwHttpSvc,rwConfigSvc,wgMapSvc,$rootScope,$http)
{
  /*Private variables*/
  var filter  = null;
  var bDefFilter = false;
  var userInfo = rwAuthSvc.userInfo || {};
  var authId = userInfo.authority_id ? userInfo.authority_id : null;
  if(authId)
  {
    // Access with login
    filter = {rules:[]};
    filter.rules.push("authority_id|EQ|" + authId);
    bDefFilter = true;
  }
  else if (Object.keys(userInfo).length == 0)
  {
    // Pubblic access
    filter = {rules:[]};
    filter.rules.push("status_id|GE|3","status_id|NEQ|5"); // Approved or rejected move and not in REDAZIONE
    bDefFilter = true;
  }
  else
  {
    // Access admin
    // Nothing to do
  }

  var authorities = [];
  var viaArray = [];
  var viaArraySignage = [];
  var aUserCtx = [];

  var aPerm = rwAuthSvc.permForModule("move") || [];
  var btnPermission = aPerm.indexOf("MOVE_CRUD") >= 0 ? true : false;

  $scope.canApprove = aPerm.indexOf("MOVE_APPROVE") >= 0 ? true : false;
  $scope.canSend = aPerm.indexOf("MOVE_SEND_REQUEST") >= 0 ? true : false;
  $scope.canManageRequest = aPerm.indexOf("MOVE_MANAGE_REQUEST") >= 0 ? true : false;


  /*
   * Scope variables
   */
  $scope.selEnt = null;
  $scope.mvListAlert = {};
  $scope.showForm = false;
  $scope.loading = false;
  $scope.moveObjCtrl = {};
  $scope.bSaved = false;
  $scope.curTab = 0;

  /* Modal header */
  $scope.headerCfg =
  {
    title: "MENU.MENU_MOVE_1",
    minimized: false,
    modalInstance: $uibModalInstance
  };

  /*
   * Attach config
   */
  $scope.moveAttachCfg =
  {
    disabled: !aPerm.indexOf("MOVE_CRUD"),
    uploadEntityName: "move",
    photoAttrName: "attach",
    fileAttrName: "attachToUpload",
  };

  $scope.movePhotoAttachCfg =
  {
    disabled: !aPerm.indexOf("MOVE_CRUD"),
    uploadEntityName: "movePhoto",
    photoAttrName: "photo",
    fileAttrName: "photoToUpload",
  };

  /* Moves table */
  var addMove = function()
  {
    $scope.curTab = 0;
    viaArray = [];
    viaArraySignage = [];

    /*Create new Move */
    $scope.selEnt = new Move({});
    $scope.selEnt.authority_id = userInfo.authority_id;

    $scope.selEnt.email = userInfo.email;
    $scope.selEnt.status_id = 5; // In redazione
    $scope.selEnt.request_date = new Date().getTime();
    $scope.selEnt.request_year = new Date().getFullYear();
    $scope.selEnt.open_user_id = rwAuthSvc.userInfo.id;

    $scope.moveTable.search.advanced.source[0].values = [];
    // $scope.moveTable.columns[0].source = [];
    $scope.mvFormCfg.fg[0].rows[0][1].options = [];

    loadAuthority(function(resAuth)
    {
      $scope.showForm = true;

      $scope.selEnt.authority_id = userInfo.authority_id;

      if (!resAuth.find(function(a){ return a.id == $scope.selEnt.authority_id;}))
      {
        $scope.mvListAlert.msg = "MOVE.AUTH_NOT_ENABLED";
        $scope.mvListAlert.style = "warning";
        $scope.mvListAlert.bt0 = "Ok";
        $scope.mvListAlert.exe0 = function(){
          $scope.close();
        };
        return;
      }

      $scope.moveTable.search.advanced.source[0].values = resAuth;
      // $scope.moveTable.columns[0].source = resAuth;
      $scope.mvFormCfg.fg[0].rows[0][1].options = resAuth;

      checkAuthorization($scope.selEnt.authority_id);
    });
  };

  var delMove = function()
  {
    if (!$scope.selEnt || !$scope.selEnt.id)
      return;

    if ($scope.selEnt.status_id != 5)
    {
      $scope.mvListAlert.msg = "MOVE.NO_DELETE_MOVE";
      $scope.mvListAlert.bt0 = "Ok";
      $scope.mvListAlert.style = "warning";
      return;
    }

    $scope.mvListAlert.msg = "CORE_MSG.DELETE_ITEM_MSG";
    $scope.mvListAlert.bt0 = "No";
    $scope.mvListAlert.bt1 = "WORDS.YES";
    $scope.mvListAlert.style = "info";
    $scope.mvListAlert.exe = function()
    {
      $scope.loading = true;

      mvModelSvc.delete($scope.selEnt,function(err)
      {
        $scope.loading = false;
        if (err)
        {
          $scope.mvListAlert.msg = err.msg;
          $scope.mvListAlert.bt0 = "Ok";
          $scope.mvListAlert.style = "danger";
        }
        else
        {
          $scope.mvListAlert.msg = "CORE_LBL.DELETE_OK";
          $scope.mvListAlert.bt0 = "Ok";
          $scope.mvListAlert.style = "info";

        }

        $scope.moveTable.reload++;
        $scope.moveTable.reset++;
        $scope.selEnt = null;

        if(btnPermission)
        {
          $scope.moveTable.btAdd.disabled = false;
          $scope.moveTable.btDel.disabled = true;
        }
        $scope.moveTable.btUpd.disabled = true;
      });
    }


  };

  var updMove = function()
  {
    $scope.curTab = 0;
    viaArray = [];
    viaArraySignage = [];

    $scope.loading = true;

    // Get the entity's detail
    mvModelSvc.loadDetail($scope.selEnt,function(err,res)
    {
      //Hide loader
      $scope.loading = false;

      loadAuthority(function(resAuth)
      {
        if (!resAuth.find(function(a){ return a.id == $scope.selEnt.authority_id;}))
        {
          var findAuth = $scope.moveTable.search.advanced.source[0].values.find(function(item)
          {
            return item.id == $scope.selEnt.authority_id;
          });

          if (!findAuth)
            $scope.moveTable.search.advanced.source[0].values.push({id:$scope.selEnt.authority_id, name:$scope.selEnt.authority});

          var findAuth1 = $scope.mvFormCfg.fg[0].rows[0][1].options.find(function(item)
          {
            return item.id == $scope.selEnt.authority_id;
          });
          if (!findAuth1)
            $scope.mvFormCfg.fg[0].rows[0][1].options.push({id:$scope.selEnt.authority_id, name:$scope.selEnt.authority});

        }

        if (!aUserCtx.find(function(elem){return elem.id == $scope.selEnt.open_user_id;}))
        {
          aUserCtx.unshift({id:$scope.selEnt.open_user_id,name:$scope.selEnt.open_user});
          $scope.moveTable.search.advanced.source[1].values = aUserCtx;
          $scope.mvFormCfg.fg[0].rows[0][0].options = aUserCtx;
          $scope.moveControlFormCfg.fg[0].rows[0][1].options = aUserCtx;
          $scope.moveApprovalFormCfg.fg[0].rows[0][0].options = aUserCtx;
        }

        if (err)
        {
          $scope.mvListAlert.msg = "CORE_LBL.DETAIL_ERR";
          $scope.mvListAlert.btKo = "Ok";
          $scope.mvListAlert.style = "danger";
        }
        else
          $scope.showForm = true;

        if ($scope.selEnt.address)
        {
          // Get via master with the specified $scope.selEnt.address
          var url = "/via/master";
          var address = "";
          if ($scope.selEnt.address.split(" - ").length)
            address = $scope.selEnt.address.split(" - ")[0];
          else
            address = $scope.selEnt.address;

          body = {
            filter: {rules:["denominazione|LIKE|%"+address.toUpperCase()+"%"], groupOp:"AND"}
          }

          // Load via master
          rwHttpSvc.post(url,body,function(res)
          {
            $scope.loading = false;
            if (res && res.result && res.result.length > 0)
            {
              for(var j= 0; j< res.result.length; j++)
              {
                if (res.result[j].localita_val)
                {
                  viaArray.push({
                    id: res.result[j].denominazione + " - " + res.result[j].localita_val[0],
                    name:res.result[j].denominazione + " - " + res.result[j].localita_val[0],
                    extent: res.result[j].extent
                  });
                }
                else
                {
                  viaArray.push({
                    id: res.result[j].denominazione,
                    name:res.result[j].denominazione,
                    extent: res.result[j].extent
                  });
                }
              }
            }
            else
              viaArray = [];

            $scope.mvFormCfg.fg[1].rows[0][0].options = viaArray;
          });
        }
        else
          viaArray = []

        if ($scope.selEnt.signage_address)
        {
          // Get via master with the specified $scope.selEnt.signage_address
          var url = "/via/master";
          var address = "";
          if ($scope.selEnt.signage_address.split(" - ").length)
            address = $scope.selEnt.signage_address.split(" - ")[0];
          else
            address = $scope.selEnt.signage_address;

          body = {
            filter: {rules:["denominazione|LIKE|%"+address.toUpperCase()+"%"], groupOp:"AND"}
          }

          // Load via master
          rwHttpSvc.post(url,body,function(res)
          {
            $scope.loading = false;
            if (res && res.result && res.result.length > 0)
            {
              for(var j= 0; j< res.result.length; j++)
              {
                if (res.result[j].localita_val)
                {
                  viaArraySignage.push({
                    id: res.result[j].denominazione + " - " + res.result[j].localita_val[0],
                    name:res.result[j].denominazione + " - " + res.result[j].localita_val[0],
                    extent: res.result[j].extent
                  });
                }
                else
                {
                  viaArraySignage.push({
                    id: res.result[j].denominazione,
                    name:res.result[j].denominazione,
                    extent: res.result[j].extent
                  });
                }
              }
            }
            else
              viaArraySignage = [];

            $scope.moveSignageMobileFormCfg.fg[0].rows[0][1].options = viaArraySignage;
          });
        }
        else
          viaArraySignage = []

        if ($scope.selEnt.authority_id)
        {
          checkAuthorization($scope.selEnt.authority_id);
        }

        // Set automatically manage date and user if the status_id is 1 (Inviata)
        if (!$scope.selEnt.manage_date && $scope.selEnt.status_id == 2 && $scope.canManageRequest)
        {
          $scope.selEnt.manage_user_id = rwAuthSvc.userInfo.id;
          $scope.selEnt.manage_date = new Date().getTime();
        }

        // Set automatically manage date and user if the status_id is 2 (presa in carico)
        if (!$scope.selEnt.approved_date && $scope.selEnt.status_id == 2 && $scope.canApprove)
        {
          $scope.selEnt.approved_user_id = rwAuthSvc.userInfo.id;
          $scope.selEnt.approved_date = new Date().getTime();
        }

        $scope.movePhotoAttachCfg.disabled = !aPerm.indexOf("MOVE_CRUD") ||
        ($scope.selEnt.status_id != 5)

        $scope.moveAttachCfg.disabled = !aPerm.indexOf("MOVE_CRUD") ||
        ($scope.selEnt.status_id == 5)

      });

    });
  };

  $scope.moveTable =
  {
    id: "move",
    order: "id|DESC",
    reset: 0,
    reload: 0,
    scrollY: 350,
    rerender: 0,
    filter: filter ? filter : null,
    entityName: "move",
    entityClass: Move,
    pagination: {rpp:"10", rppArray:["10","15","20"]},
    btAdd: btnPermission ? {click:addMove, disabled:!btnPermission} : null,
    btDel: btnPermission ? {click:delMove, disabled:true} : null,
    btUpd: {click:updMove, disabled:true},
    search: {
      simple: {key:["address","authority","open_user","town"]},
      advanced: {
        source: [
          {
            id: "authority_id",
            name: "WORDS.COMPANY",
            type: "combo",
            values: [],
            operators: ["EQ"]
          },
          {
            id: "open_user_id",
            name: "WORDS.USER",
            type: "combo",
            values: [],
            operators: ["EQ"]
          },
          {
            id: "request_date",
            name: "CORE_LBL.REQUEST_DATE",
            type: "date",
            operators: ["EQ","GT","LT"]
          },
          {
            id: "status_id",
            name: "WORDS.STATUS",
            type: "combo",
            values: rwContextSvc.getContext("moveStatus"),
            operators: ["EQ"]
          },
          {
            id: "address",
            name: "WORDS.ADDRESS",
            type: "text",
            operators: ["EQ","ILIKE"]
          },
          {
            id: "town",
            name: "WORDS.TOWN",
            type: "text",
            operators: ["EQ","ILIKE"]
          }
        ]
      }
    },
    columns: [
      {
        // id: "authority_id",
        // type: "object",
        id: "authority",
        type: "text",
        label: "WORDS.COMPANY",
        //source: [], //rwContextSvc.getContext("authority"),
        style: function(obj)
        {
          if (obj.status_id == 1)
            return {"font-weight": "900"};
        }
      },
      {
        // id: "open_user_id",
        // type: "object",
        id: "open_user",
        type: "text",
        label: "WORDS.USER",
        // source: [],
        style: function(obj)
        {
          if (obj.status_id == 1)
            return {"font-weight": "900"};
        }
      },
      {
        id:"request_date",
        type:"date",
        label:"CORE_LBL.REQUEST_DATE",
        sortable:true,
        style: function(obj)
        {
          if (obj.status_id == 1)
            return {"font-weight": "900"};
        }
      },
      {
        id: "status_id",
        type: "object",
        label: "WORDS.STATUS",
        source: rwContextSvc.getContext("moveStatus"),
        style: function(obj)
        {
          if (obj.status_id == 1)
            return {"font-weight": "900"};
        }
      },
      { id:"start_date",
        type:"date",
        label:"CORE_LBL.START_DATE",
        sortable:true,
        style: function(obj)
        {
          if (obj.status_id == 1)
            return {"font-weight": "900"};
        }},
      {
        id:"end_date",
        type:"date",
        label:"CORE_LBL.END_DATE",
        sortable:true,
        style: function(obj)
        {
          if (obj.status_id == 1)
            return {"font-weight": "900"};
        }
      },
      {
        id:"address",
        label:"WORDS.ADDRESS",
        sortable:true,
        style: function(obj)
        {
          if (obj.status_id == 1)
            return {"font-weight": "900"};
        }
      },
      {
        id:"town",
        label:"WORDS.TOWN",
        sortable:true,
        style: function(obj)
        {
          if (obj.status_id == 1)
            return {"font-weight": "900"};
        }
      }

    ]
  };

  $scope.$on("tvSelObj",function(ev,id,ent)
  {
    if (!ent)
    {
      $scope.selEnt = null;
      return;
    }

    $scope.selEnt = ent;
    if(btnPermission)
    {
      $scope.moveTable.btDel.disabled = ent ? false : true;
    }

    $scope.moveTable.btUpd.disabled = ent ? false : true;

  });

  /* Move form */
  function filterVia(str)
  {
    if(str !== null && str !== "")
    {
      $scope.loading = true;

      // Get via with the specified string
      var url = "/via/master";

      body = {
        filter: {rules:["denominazione|LIKE|%"+str.toUpperCase()+"%"], groupOp:"AND"}
      }

      // Load via master
      rwHttpSvc.post(url,body,function(res)
      {
        viaArray = [];
        $scope.loading = false;
        if (res && res.result && res.result.length > 0)
        {
          for(var j= 0; j< res.result.length; j++)
          {
            if (res.result[j].localita_val)
            {
              var loc = res.result[j].localita_val ? res.result[j].localita_val.join() : "";
              var mun = res.result[j].municipio_val ? res.result[j].municipio_val.join() : ""
              viaArray.push({
                id: Math.random(),
                descr: loc  + " - " + mun,
                name:res.result[j].denominazione,
                extent: res.result[j].extent
              });

//               viaArray.push({
//                 descr: res.result[j].municipio_val ? res.result[j].municipio_val.join(): "",
//                 id: res.result[j].denominazione + " - " + res.result[j].localita_val.join(),
//                 name:res.result[j].denominazione + " - " + res.result[j].localita_val.join(),
//                 extent: res.result[j].extent
//               });
            }
            else
            {
              viaArray.push({
                id: Math.random(),
                name:res.result[j].denominazione,
                descr: "",
                extent: res.result[j].extent
              });

//               viaArray.push({
//                 id: res.result[j].denominazione,
//                 name:res.result[j].denominazione,
//                 descr: res.result[j].municipio_val ? res.result[j].municipio_val.join() : "",
//                 extent: res.result[j].extent
//               });
            }
          }
        }
        else
           viaArray = [];

        $scope.mvFormCfg.fg[1].rows[0][0].options = viaArray;
      });
    }
  };

  var selectedVia =  function(obj)
  {
    $scope.selEnt.address = obj ? obj.name.toUpperCase() : null;
    $scope.selEnt.town = obj ? obj.descr.toUpperCase().split(" - ")[1]: null;

    // EPSG code is 32633
    if (obj && obj.extent && obj.extent.length)
      wgMapSvc.zoomToBBox(obj.extent, 32633);
  };

  function filterViaSignage(str)
  {
    if(str !== null && str !== "")
    {
      $scope.loading = true;

      // Get via with the specified string
      var url = "/via/master";

      body = {
        filter: {rules:["denominazione|LIKE|%"+str.toUpperCase()+"%"], groupOp:"AND"}
      }

      // Load via master
      rwHttpSvc.post(url,body,function(res)
      {
        viaArraySignage = [];
        $scope.loading = false;
        if (res && res.result && res.result.length > 0)
        {
          for(var j= 0; j< res.result.length; j++)
          {
            if (res.result[j].localita_val)
            {
              var loc = res.result[j].localita_val ? res.result[j].localita_val.join() : "";
              var mun = res.result[j].municipio_val ? res.result[j].municipio_val.join() : ""
              viaArraySignage.push({
                id: Math.random(),
                descr: loc  + " - " + mun,
                name:res.result[j].denominazione,
                extent: res.result[j].extent
              });

//               viaArraySignage.push({
//                 id: res.result[j].denominazione + " - " + res.result[j].localita_val[0],
//                 name:res.result[j].denominazione + " - " + res.result[j].localita_val[0],
//                 descr: res.result[j].municipio_val ? res.result[j].municipio_val.join() : "",
//                 extent: res.result[j].extent
//               });
            }
            else
            {
              viaArraySignage.push({
                id: Math.random(),
                name:res.result[j].denominazione,
                descr: "",
                extent: res.result[j].extent
              });

//               viaArraySignage.push({
//                 id: res.result[j].denominazione,
//                 name:res.result[j].denominazione,
//                 descr: res.result[j].municipio_val ? res.result[j].municipio_val.join() : "",
//                 extent: res.result[j].extent
//               });
            }
          }
        }
        else
        viaArraySignage = [];

        $scope.moveSignageMobileFormCfg.fg[0].rows[0][1].options = viaArraySignage;
      });
    }
  };

  var selectedViaSignage =  function(obj)
  {
    $scope.selEnt.signage_address = obj ? obj.name.toUpperCase() : null;

    // EPSG code is 32633
    if (obj && obj.extent && obj.extent.length)
      wgMapSvc.zoomToBBox(obj.extent, 32633);
  };

  var moveOnFormChange = function(key, nv,ov)
  {
    if (key == 'authority_id')
    {
      checkAuthorization(nv);
    }
  };

  $scope.mvFormCfg =
  {
    id:"mvForm", changeCallback:moveOnFormChange,
    fg:
    [
      {
        show:true, rows:
        [
          [
            {
              id: "open_user_id",
              type: "select",
              label: "WORDS.USER",
              width: 4,
              height: "input-sm",
              options:[],
              required: false, enabled:false, show:true
            },
            {
              id: "authority_id",
              type: "select",
              label: "WORDS.COMPANY",
              width: 4,
              height: "input-sm",
              options: [],
              required:true, enabled: authId ? false : true, show:true
            },
            {
              id: "email",
              type: "text",
              label: "WORDS.EMAIL",
              width: 4,
              height: "input-sm",
              required:false, enabled:false, show:true
            }
          ],
          [
            {
              id: "auth_protocol",
              type: "text",
              label: "MOVE.AUTH_PROTOCOL",
              width: 2,
              height: "input-sm",
              required:false, enabled:false, show:true
            },
            {
              id: "auth_start_date",
              type: "timestamp",
              label: "MOVE.AUTH_START_DATE",
              width: 4,
              height: "input-sm",
              hideTime: true,
              required: false, enabled: false, show: true
            },
            {
              id: "auth_end_date",
              type: "timestamp",
              label: "MOVE.AUTH_END_DATE",
              width: 4,
              height: "input-sm",
              hideTime: true,
              required: false, enabled: false, show: true
            },
            {
              id: "status_id",
              type: "select",
              label: "WORDS.STATUS",
              width: 2,
              height: "input-sm",
              options: rwContextSvc.getContext("moveStatus"),
              required:false, enabled:false, show:true
            },
          ],
          [
            {
              id: "request_date",
              type: "timestamp",
              label: "CORE_LBL.REQUEST_DATE",
              width: 3,
              height: "input-sm",
              // hideTime: true,
              required: false, enabled: true, show: true
            },
            {
              id: "request_year",
              type: "text",
              label: "WORDS.YEAR",
              width: 3,
              height: "input-sm",
              required:true, enabled:false, show:true
            },
            {
              id: "start_date",
              type: "timestamp",
              label: "CORE_LBL.START_DATE",
              width: 3,
              height: "input-sm",
              hideTime: true,
              customErrMsg:"MOVE.START_DATE_GREATER_END_DATE",
              required: true, enabled: true, show: true
            },
            {
              id: "end_date",
              type: "timestamp",
              label: "CORE_LBL.END_DATE",
              width: 3,
              height: "input-sm",
              hideTime: true,
              required: true, enabled: true, show: true
            }
          ],
        ]
      },
      {
        show:true, label:"WORDS.LOCALIZATION",rows:
        [
          [
            {
              id: "address_select", // Via oggetto del trasloco
              type: "selectWithSearch",
              label: "ROADSITE.SELECT_ADDRESS",
              width: 3,
              height: "input-sm",
              options: [],
              maxlength: 10,
              refreshfunc: filterVia,
              refreshdelay: 100,
              mininputlength: 3,
              changeCallback: selectedVia,
              required:false, enabled:true, show:true
            },
            {
              id: "address", // Via
              type: "text",
              label: "WORDS.ADDRESS",
              width: 3,
              height: "input-sm",
              customErrMsg:"CORE_MSG.MANDATORY_ERROR",
              required:true, enabled:false, show:true
            },
            {
              id: "town", // Municipio
              type: "text",
              label: "WORDS.TOWN",
              width: 3,
              height: "input-sm",
              required:true, enabled:false, show:true
            },
            {
              id: "x",
              type: "number",
              label: "WORDS.X_COORD",
              width: 1,
              height: "input-sm",
              required:true, enabled:true, show:true
            },
            {
              id: "y",
              type: "number",
              label: "WORDS.Y_COORD",
              width: 1,
              height: "input-sm",
              required:true, enabled:true, show:true
            },
            {
              id: "getXYBtn",
              type: "glyphButton",
              label: "",
              width: 1,
              icon: "map-marker",
              height: "input-sm",
              title: "CORE_MSG.MAP_POINT_SELECT",
              required:false, enabled:true, show:true
            }
          ],
          [
             {
              id: "number_from", // Dal civico
              type: "text",
              label: "MOVE.NUMBER_FROM",
              width: 2,
              height: "input-sm",
              required:false, enabled:true, show:true
            },
            {
              id: "number_to", // Al Civivo
              type: "text",
              label: "MOVE.NUMBER_TO",
              width: 2,
              height: "input-sm",
              required:false, enabled:true, show:true
            },
            {
              id: "place", // Oppure nel tratto da ... a ...
              type: "text",
              label: "MOVE.PLACE",
              width: 8,
              height: "input-sm",
              required:false, enabled:true, show:true
            }
          ]
        ]
      }
    ]
  };

  $scope.moveSignageMobileFormCfg =
  {
    id: "moveSignageMobileForm",
    fg:
    [
      {
        show:true, label:"MOVE.SIGNAGE_MOBILE",rows:
        [
          [
            {
              id: "signage_date",
              type: "timestamp",
              label: "MOVE.SIGNAGE_DATE", // Data posizionamento segnaletica mobile
              width: 3,
              height: "input-sm",
              hideTime: true,
              required: true, enabled: true, show: true
            },
            {
              id: "signage_address_select", // Via in cui è posizionata la segnaletica mobile
              type: "selectWithSearch",
              label: "ROADSITE.SELECT_ADDRESS",
              width: 5,
              height: "input-sm",
              options: [],
              maxlength: 10,
              refreshfunc: filterViaSignage,
              refreshdelay: 100,
              mininputlength: 3,
              changeCallback: selectedViaSignage,
              required:false, enabled:true, show:true
            },
            {
              id: "signage_address", // Via
              type: "text",
              label: "WORDS.ADDRESS",
              width: 4,
              height: "input-sm",
              customErrMsg:"CORE_MSG.MANDATORY_ERROR",
              required:true, enabled:false, show:true
            }
          ],
          [
            {
              id: "signage_num_from", // Dal civico
              type: "text",
              label: "MOVE.NUMBER_FROM",
              width: 2,
              height: "input-sm",
              required:false, enabled:true, show:true
            },
            {
              id: "signage_num_to", // Al Civivo
              type: "text",
              label: "MOVE.NUMBER_TO",
              width: 2,
              height: "input-sm",
              required:false, enabled:true, show:true
            },
            {
              id: "signage_place", // Oppure nel tratto da ... a ...
              type: "text",
              label: "MOVE.PLACE",
              width: 8,
              height: "input-sm",
              required:false, enabled:true, show:true
            }
          ],
          [
            {
              id: "signage_base", // Palo segnaletica mobile sostenuto da base
              type: "text",
              label: "MOVE.SIGNAGE_BASE",
              width: 3,
              height: "input-sm",
              required:false, enabled:true, show:true
            },
            {
              id: "signage_num_bags", // Palo segnaletica mobile ancorato con n° sacchetti
              type: "number",
              label: "MOVE.SIGNAGE_NUM_BAGS",
              width: 3,
              height: "input-sm",
              required:false, enabled:true, show:true
            },
            {
              id: "signage_bag_other", // Palo segnaletica mobile ancorato con altro
              type: "text",
              label: "MOVE.SIGNAGE_BAG_OTHER",
              width: 3,
              height: "input-sm",
              required:false, enabled:true, show:true
            },
            {
              id: "signage_position_id", // Palo segnaletica mobile posizionato...
              type: "select",
              label: "MOVE.SIGNAGE_POSITION",
              width: 3,
              height: "input-sm",
              options: rwContextSvc.getContext("signagePosition"),
              required:false, enabled:true, show:true
            }
          ],
          [
            {
              id: "vechile_num", // Numero veicoli presenti
              type: "number",
              label: "MOVE.VEHICLE_NUM",
              width: 3,
              height: "input-sm",
              required:false, enabled:true, show:true
            },
            {
              id: "vehicle_plate", // Targhe veicoli presenti
              type: "text",
              label: "MOVE.VEHICLE_PLATE",
              width: 3,
              height: "input-sm",
              required:false, enabled:true, show:true
            }
          ]
        ]
      }
    ]
  };

  $scope.moveControlFormCfg =
  {
    id:"moveControlForm",
    fg:
    [
      {
        show:true, label:"MOVE.CONTROL_PL",rows:
        [
          [
            {
              id: "manage_date",
              type: "timestamp",
              label: "MOVE.MANAGE_DATE", // Data presa in carico richiesta
              width: 3,
              height: "input-sm",
              // hideTime: true,
              required: true, enabled: false, show: true
            },
            {
              id: "manage_user_id",    // Operatore ricevente la richiesta
              type: "select",
              label: "MOVE.MANAGE_USER",
              width: 3,
              height: "input-sm",
              options:[],
              required: false, enabled:false, show:true
            },
            {
              id: "control_date",
              type: "timestamp",
              label: "WORDS.DATE", // Data controllo segnaletica
              width: 3,
              height: "input-sm",
              // hideTime: true,
              required: true, enabled: true, show: true
            },
            {
              id: "control_team", // Pattuglia controllo
              type: "text",
              label: "MOVE.CONTROL_TEAM",
              width: 3,
              height: "input-sm",
              required:true, enabled:true, show:true
            }
          ]
        ]
      }
    ]
  };

  $scope.moveApprovalFormCfg =
  {
    id:"moveApprovalForm",
    fg:
    [
      {
        show:true, label:"MOVE.APPROVAL",rows:
        [
          [
            {
              id: "approved_user_id",    // Operatore approvatore
              type: "select",
              label: "MOVE.APPROVED_USER",
              width: 6,
              height: "input-sm",
              options:[],
              required: true, enabled:false, show:true
            },
            {
              id: "approved_date", // Data approvazione
              type: "timestamp",
              label: "WORDS.DATE",
              width: 6,
              height: "input-sm",
              // hideTime: true,
              required: true, enabled: true, show: true
            }
          ],
          [
            {
              id: "note",
              type: "textarea",
              label: "WORDS.NOTE",
              width: 12,
              rows:5,
              height: "input-sm",
              required:false, enabled:true, show:true
            }
          ]
        ]
      }
    ]
  };

  /* Scope function */
  $scope.mvListAlertDone = function(val)
  {
    if (val == 1 && $scope.mvListAlert.exe)
      $scope.mvListAlert.exe();
    else if (val == 0 && $scope.mvListAlert.exe0)
      $scope.mvListAlert.exe0();

    $scope.mvListAlert = {};
  };

  $scope.zoomTo = function(obj)
  {
    if (obj.x_min && obj.y_min && obj.x_max && obj.y_max)
    {
      // calculate bounding box
      var bbox = [obj.x_min, obj.y_min, obj.x_max, obj.y_max];

      // EPSG code is 32633
      wgMapSvc.zoomToBBox(bbox, 32633);
    }
  };

  $scope.close = function()
  {
    $scope.selEnt.restoreChangedKeys();
    //reset form
    $scope.moveObjCtrl[$scope.mvFormCfg.id].reset();
    $scope.moveObjCtrl[$scope.moveSignageMobileFormCfg.id].reset();
    $scope.moveObjCtrl[$scope.moveControlFormCfg.id].reset();
    $scope.moveObjCtrl[$scope.moveApprovalFormCfg.id].reset();
    $scope.selEnt = null;
    $scope.showForm = false;

    if(btnPermission)
    {
      $scope.moveTable.btAdd.disabled = false;
      $scope.moveTable.btDel.disabled = true;
    }
    $scope.moveTable.btUpd.disabled = true;

    $scope.moveTable.reset++;
    $scope.moveTable.reload++;
  };

  $scope.save = function()
  {
    if ($scope.selEnt.start_date)
      $scope.selEnt.start_date = new Date($scope.selEnt.start_date).setHours(0,0,0,0);

    if ($scope.selEnt.end_date)
      $scope.selEnt.end_date = new Date($scope.selEnt.end_date).setHours(0,0,0,0);

    if ($scope.selEnt.signage_date)
      $scope.selEnt.signage_date = new Date($scope.selEnt.signage_date).setHours(0,0,0,0);

    if ($scope.selEnt.auth_end_date)
      $scope.selEnt.auth_end_date = new Date($scope.selEnt.auth_end_date).setHours(0,0,0,0);

    if ($scope.selEnt.auth_start_date)
      $scope.selEnt.auth_start_date = new Date($scope.selEnt.auth_start_date).setHours(0,0,0,0);

    // Check that the start date is within 48 hours
    // 48 hour in ms => 172800000
    if (!$scope.selEnt.id)
    {
      var rd = new Date($scope.selEnt.request_date).setHours(0,0,0,0);

      if (($scope.selEnt.start_date - rd) < 172800000)
      {
        $scope.mvListAlert.msg = "MOVE.START_DATE_NOT_VALID";
        $scope.mvListAlert.style = "warning";
        $scope.mvListAlert.bt0 = "Ok";
        return;
      }
    }

    // Check that the signage date is within 48 hours of the start_date
    // 48 hour in ms => 172800000
    if ($scope.selEnt.signage_date && $scope.selEnt.start_date)
    {
      if (($scope.selEnt.start_date - $scope.selEnt.signage_date) < 172800000)
      {
        $scope.mvListAlert.msg = "MOVE.SIGNAGE_DATE_NOT_VALID";
        $scope.mvListAlert.style = "warning";
        $scope.mvListAlert.bt0 = "Ok";
        return;
      }
    }

    /* Check if start_date is less than end_date
    * otherwise show error
    */
    if($scope.selEnt.start_date && $scope.selEnt.end_date)
    {
      if($scope.selEnt.start_date <= $scope.selEnt.end_date)
      {
        $scope.moveObjCtrl["mvForm"].showCustomErrOnField("start_date",false);
      }
      else
      {
        $scope.moveObjCtrl["mvForm"].showCustomErrOnField("start_date",true);
      }
    }
    else
    {
      $scope.moveObjCtrl["mvForm"].showCustomErrOnField("start_date",false);
    }

    /* Check if control_date is less or equal than approved_date
    * otherwise show error
    */
    if($scope.selEnt.control_date && $scope.selEnt.approved_date)
    {
      if($scope.selEnt.control_date > $scope.selEnt.approved_date)
      {
        $scope.mvListAlert.msg = "MOVE.CONTROL_DATE_GREATER_APPROVE_DATE";
        $scope.mvListAlert.style = "warning";
        $scope.mvListAlert.bt0 = "Ok";
        return;
      }
    }

    /* Check if control_date is greater than request date
    * otherwise show error
    */
    if($scope.selEnt.control_date && $scope.selEnt.request_date)
    {
      if($scope.selEnt.control_date < $scope.selEnt.request_date)
      {
        $scope.mvListAlert.msg = "MOVE.CONTROL_DATE_LESS_REQUEST_DATE";
        $scope.mvListAlert.style = "warning";
        $scope.mvListAlert.bt0 = "Ok";
        return;
      }
    }

    /*
    * Check that the end_date date is within auth_end_date
    */
    if ($scope.selEnt.end_date && $scope.selEnt.auth_end_date)
    {
      if ($scope.selEnt.end_date > $scope.selEnt.auth_end_date)
      {
        $scope.mvListAlert.msg = "MOVE.END_DATE_NOT_VALID";
        $scope.mvListAlert.style = "warning";
        $scope.mvListAlert.bt0 = "Ok";
        return;
      }
    }

    /*
    * Check if the address and signage_address is setted
    * otherwise show error
    */
    if(!$scope.selEnt.address)
    {
      $scope.moveObjCtrl["mvForm"].showCustomErrOnField("address",true);
    }
    else
    {
      $scope.moveObjCtrl["mvForm"].showCustomErrOnField("address",false);
    }

    if(!$scope.selEnt.signage_address)
    {
      $scope.moveObjCtrl["moveSignageMobileForm"].showCustomErrOnField("signage_address",true);
    }
    else
    {
      $scope.moveObjCtrl["moveSignageMobileForm"].showCustomErrOnField("signage_address",false);
    }

    /* Check data form validity */
    var aForm = ["mvForm","moveSignageMobileForm"];

    var formVal = true;

    /* Check form validity */
    for (var j = 0;j < aForm.length;j++)
    {
      if (!$scope.moveObjCtrl[aForm[j]].isValid())
      {
        formVal &= false;
      }
    }

    if(!formVal)
    {
      $scope.mvListAlert.msg = "CORE_LBL.NOT_VALID";
      $scope.mvListAlert.style = "warning";
      $scope.mvListAlert.bt0 = "Ok";

      return;
    }

    var chgObj = $scope.selEnt.changedKeys();

    if (!chgObj)
    {
      $scope.mvListAlert.msg = "CORE_LBL.NO_CHANGES_MSG";
      $scope.mvListAlert.style = "info";
      $scope.mvListAlert.bt0 = "Ok";
      return;
    }

    $scope.loading = true;

    mvModelSvc.save($scope.selEnt,function(err,opt)
    {
      $scope.loading = false;
      if (err)
      {
        $scope.mvListAlert.msg = err;
        $scope.mvListAlert.style = "danger";
        $scope.mvListAlert.bt0 = "Ok";
      }
      else
      {
        if (opt.reload)
        {
          /* Show Alert Insert OK*/
          $scope.mvListAlert.msg = "CORE_LBL.INSERT_OK";
          $scope.mvListAlert.style = "info";
          $scope.mvListAlert.bt0 = "Ok";
        }
        else
        {
          /* Show Alert Update OK*/
          $scope.mvListAlert.msg = "CORE_LBL.UPDATE_OK";
          $scope.mvListAlert.style = "info";
          $scope.mvListAlert.bt0 = "Ok";
        }

        // Disabled attach photo
        $scope.movePhotoAttachCfg.disabled = !aPerm.indexOf("MOVE_CRUD") ||
        ($scope.selEnt.status_id != 5)

        $scope.moveAttachCfg.disabled = !aPerm.indexOf("MOVE_CRUD") ||
        ($scope.selEnt.status_id == 5)

        // Set automatically manage date and user if the status_id is 1 (Inviata)
        if (!$scope.selEnt.manage_date && $scope.selEnt.status_id == 2 && $scope.canManageRequest)
        {
          $scope.selEnt.manage_user_id = rwAuthSvc.userInfo.id;
          $scope.selEnt.manage_date = new Date().getTime();
        }

        // Set automatically manage date and user if the status_id is 2 (presa in carico)
        if (!$scope.selEnt.approved_date && $scope.selEnt.status_id == 2 && $scope.canApprove)
        {
          $scope.selEnt.approved_user_id = rwAuthSvc.userInfo.id;
          $scope.selEnt.approved_date = new Date().getTime();
        }

//         $scope.close();
//         $scope.moveTable.reload++;
      }
    });
  };

  $scope.sendRequest = function()
  {
    /* Check if there is at least one photo attachment before send request */
    if (($scope.selEnt.photo.attach && $scope.selEnt.photo.attach.length == 0) &&
      ($scope.selEnt.attach && $scope.selEnt.attach.length == 0))
    {
      $scope.mvListAlert.msg = "MOVE.PHOTO_MANDATORY";
      $scope.mvListAlert.style = "warning";
      $scope.mvListAlert.bt0 = "Ok";
      return;
    }

    $scope.mvListAlert.msg = "MOVE.SEND_REQUEST_CONFIRM";
    $scope.mvListAlert.style = "info";
    $scope.mvListAlert.bt0 = "No";
    $scope.mvListAlert.bt1 = "WORDS.YES";
    $scope.mvListAlert.exe = function()
    {
      $scope.selEnt.status_id = 1;
      $scope.save();
    };
  };

  $scope.manageRequest = function()
  {
    $scope.mvListAlert.msg = "MOVE.MANAGE_REQUEST_CONFIRM";
    $scope.mvListAlert.style = "info";
    $scope.mvListAlert.bt0 = "No";
    $scope.mvListAlert.bt1 = "WORDS.YES";
    $scope.mvListAlert.exe = function()
    {
      $scope.selEnt.status_id = 2;
      $scope.save();
    };
  }

  $scope.approve = function(bool)
  {
    $scope.mvListAlert.msg = bool == 0 ? "MOVE.REJECT_REQUEST_CONFIRM" : "MOVE.APPROVE_REQUEST_CONFIRM";
    $scope.mvListAlert.style = "info";
    $scope.mvListAlert.bt0 = "No";
    $scope.mvListAlert.bt1 = "WORDS.YES";
    $scope.mvListAlert.exe = function()
    {

      /* Check if control_date is less or equal than approved_date
      * otherwise show error
      */
      if($scope.selEnt.control_date && $scope.selEnt.approved_date)
      {
        if($scope.selEnt.control_date <= $scope.selEnt.approved_date)
        {
          $scope.moveObjCtrl["moveControlForm"].showCustomErrOnField("control_date",false);
        }
        else
        {
          $scope.moveControlFormCfg.fg[0].rows[0][2].customErrMsg = "MOVE.CONTROL_DATE_GREATER_APPROVE_DATE";
          $scope.moveObjCtrl["moveControlForm"].showCustomErrOnField("control_date",true);
        }
      }
      else
      {
        $scope.moveObjCtrl["moveControlForm"].showCustomErrOnField("control_date",false);
      }

      /* Check form validity */
      if (!$scope.moveObjCtrl["moveControlForm"].isValid())
      {

        $scope.mvListAlert.msg = "CORE_LBL.NOT_VALID";
        $scope.mvListAlert.style = "warning";
        $scope.mvListAlert.bt0 = "Ok";
        return;
      }

      /* Check form validity */
      if (!$scope.moveObjCtrl["moveApprovalForm"].isValid())
      {

        $scope.mvListAlert.msg = "CORE_LBL.NOT_VALID";
        $scope.mvListAlert.style = "warning";
        $scope.mvListAlert.bt0 = "Ok";
        return;
      }

      $scope.selEnt.status_id = bool == 0 ?  4 : 3;

      $scope.save();
    };
  }

  /* Scope watch */
  $scope.$watch("selEnt.getXYBtn",function(nVal,oVal)
  {
    if (nVal == undefined)
      return;

    $scope.selEnt.getXYBtn = undefined;
    $scope.headerCfg.minimized = true;

    /* Get coordinates from map */
    wgMapSvc.getCoordinatesIntoSR(32633,function(aCoord)
    {
      $scope.headerCfg.minimized = false;

      if (aCoord)
      {
        $scope.$apply(function()
        {
          $scope.selEnt.x = aCoord[0];
          $scope.selEnt.y = aCoord[1];

          $scope.headerCfg.minimized = false;
          $scope.moveObjCtrl[$scope.mvFormCfg.id].$setDirty();
        });
      }
    });
  });

  /* Private function */
  function loadUser()
  {
    rwHttpSvc.get("/user/master",function(res)
    {
      aUserCtx = [];
      if (res && res.result)
      {
        for (var j = 0,len = res.result.length;j < len;j++)
        {
          var obj = res.result[j];

          aUserCtx.push({
            id: obj.id,
            name: obj.name+" "+obj.surname
          });
        }
        aUserCtx.unshift({id:null, name:""});
      }

      $scope.moveTable.search.advanced.source[1].values = aUserCtx;
      // $scope.moveTable.columns[1].source = aUserCtx;
      $scope.mvFormCfg.fg[0].rows[0][0].options = aUserCtx;
      $scope.moveControlFormCfg.fg[0].rows[0][1].options = aUserCtx;
      $scope.moveApprovalFormCfg.fg[0].rows[0][0].options = aUserCtx;
    });
  }

  function loadAuthority(callback)
  {

    authorities = [];
    // Retrieve authority Traslochi
    var body = {
      filter:{
        rules:["function_id|EQ|2","enabled|EQ|true"],
        groupOp:"AND",
        groups:[]
      }
    };
    rwHttpSvc.post("/authority/master",body,function(res)
    {

      if (res && res.result)
      {
        res.result.forEach(function(item){authorities.push(item);});
        authorities.push({id:null,name: ""});
        callback(authorities);
      }
    });

  }

  function checkAuthorization(auth)
  {
    // Retrieve detail of authority
    rwHttpSvc.get("/authority/detail/"+auth,function(res)
    {
      if (res && res.result)
      {
        if (res.result.authorization)
        {
          if (!$scope.selEnt.authorization_id)
          {
            $scope.selEnt.auth_protocol = res.result.authorization.auth_protocol;
            $scope.selEnt.auth_start_date = res.result.authorization.start_date;
            $scope.selEnt.auth_end_date = res.result.authorization.end_date;
          }
          else
          {
            // Retrieve authorizathion in history array
            var auth = res.result.authorizationHistory.find(function(item)
            {
              return item.id == $scope.selEnt.authorization_id;
            });

            if (auth)
            {
              $scope.selEnt.auth_protocol = auth.auth_protocol;
              $scope.selEnt.auth_start_date = auth.start_date;
              $scope.selEnt.auth_end_date = auth.end_date;
            }
          }

         // if ($scope.selEnt.request_year && $scope.selEnt.auth_end_date)
         // {
            // Check year authorization
          //  if (new Date($scope.selEnt.auth_end_date).getFullYear() != $scope.selEnt.request_year)
          //  {
          //    $scope.mvListAlert.msg = "MOVE.AUTHORIZATION_EXPIRED";
          //    $scope.mvListAlert.style = "warning";
          //    $scope.mvListAlert.bt0 = "Ok";
          //    $scope.mvListAlert.exe0 = function()
          //    {
          //      $uibModalInstance.close();
          //    }
          //  }

            if (new Date($scope.selEnt.auth_start_date).getTime() > $scope.selEnt.request_date ||
            new Date($scope.selEnt.auth_end_date).getTime() < $scope.selEnt.request_date)
            {
              $scope.mvListAlert.msg = "MOVE.AUTH_NOT_ENABLED";
              $scope.mvListAlert.style = "warning";
              $scope.mvListAlert.bt0 = "Ok";
              $scope.mvListAlert.exe0 = function(){
                $scope.close();
              };
            }
         // }
        }
        else
        {
          $scope.selEnt.auth_protocol = null;
          $scope.selEnt.auth_start_date = null;
          $scope.selEnt.auth_end_date = null;

          $scope.mvListAlert.msg = "MOVE.MISSING_AUTHORIZATION";
          $scope.mvListAlert.style = "warning";
          $scope.mvListAlert.bt0 = "Ok";
          $scope.mvListAlert.exe0 = function()
          {
            $uibModalInstance.close();
          }
        }
      }
    });
  }

  loadUser();
  loadAuthority(function(res)
  {
    $scope.moveTable.search.advanced.source[0].values = res;
    $scope.mvFormCfg.fg[0].rows[0][1].options = res;
  });
}