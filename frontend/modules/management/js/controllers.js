/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("management")
  .controller("userCtrl",userCtrl)
  .controller("roleCtrl",roleCtrl)
  .controller("userInfoCtrl",userInfoCtrl)
  .controller("authorityCtrl",authorityCtrl);

function userCtrl($scope,$uibModalInstance,rwHttpSvc,urModelSvc,User,rwContextSvc)
{
  var userFormId = "userForm";

  _ROLE_ROADSITE = 37;
  _ROLE_MOVE = 38;

  $scope.selUser = null;
  $scope.formCtrlObj = {};

  // Alert config: {tag, msg, style, btExec, btClose}
  $scope.alert = {};

  $scope.authorizationAttachUrl = null;

  // Panel header config
  $scope.headerCfg =
  {

    title: "USER_ROLE.TITLE_USER",
    minimized: false,
    modalInstance: $uibModalInstance
  };

  // Collection config
  $scope.collCfg =
  {
    entityClass: User,
    entityName: "user",
    pagination: true,
    maxHeight: 450,
    titleAtt: "fullname",
    descrAtt: "role_name",
    order: "name|ASC",
    paginationCfg: {rpp:"10", rppArray:["5","10","15","20"]},
    reload: 0,
    reset: 0,
    search: {
      simple: {key:["name","surname","username"]},
      advanced: {source:
        [
          {id:"name",name:"WORDS.NAME",type:"text",operators:["EQ","ILIKE"]},
          {id:"surname",name:"WORDS.SURNAME",type:"text",operators:["EQ","ILIKE"]},
          {id:"username",name:"WORDS.USERNAME",type:"text",operators:["EQ","ILIKE"]},
          {id:"authority_id",name:"WORDS.AUTHORITY",type: "combo",values: [],operators: ["EQ"]},
          {id:"enabled",name:"WORDS.ENABLED",type: "combo",
            values: [{id:true, name:"Si"}, {id:false, name:"No"}],operators: ["EQ"]
          },
        ]}
    }
  };

  var onChangeUserForm = function(key, nv, ov)
  {
    if (key == 'role')
    {
      if (nv == _ROLE_ROADSITE || nv == _ROLE_MOVE)
      {
        $scope.formCfg.fg[0].rows[3][1].required = true;
      }
      else
      {
        $scope.formCfg.fg[0].rows[3][1].required = false;
      }
    }
  };
  // Form config
  $scope.formCfg =
  {
    id:userFormId, maxHeight:450, changeCallback: onChangeUserForm,
    fg:
    [
      {
        show:true, label:null, rows:
        [
          [
            {
              id: "username",
              type: "text",
              label: "WORDS.USERNAME",
              width: 6,
              height: "input-sm",
              required: true, enabled: false, show: true
            },
            {
              id: "creation_date",
              type: "date",
              label: "CORE_LBL.CREATION_DATE",
              width: 6,
              height: "input-sm",
              position: "bottom",
              required: false, enabled: false, show: true
            }
          ],
          [
            {
              id: "name",
              type: "text",
              label: "WORDS.NAME",
              width: 6,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "surname",
              type: "text",
              label: "WORDS.SURNAME",
              width: 6,
              height: "input-sm",
              required: true, enabled: true, show: true
            }
          ],
          [
           {
              id: "phone",
              type: "telephone",
              label: "WORDS.PHONE",
              width: 6,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "email",
              type: "email",
              label: "WORDS.EMAIL",
              width: 6,
              height: "input-sm",
              required: true, enabled: true, show: true
            }
          ],
          [
            {
              id: "role",
              type: "select",
              label: "WORDS.ROLE",
              width: 6,
              height: "input-sm",
              options: [],
              required: true, enabled: true, show: true
            },
            {
              id: "authority_id",
              type: "select",
              label: "WORDS.AUTHORITY",
              width: 6,
              height: "input-sm",
              options: [],
              required: false, enabled: true, show: true
            }
          ],
          [
            {
              id: "cf",
              type: "text",
              maxlength:16,
              label: "WORDS.TAX_CODE",
              width: 4,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "title_id",
              type: "select",
              label: "WORDS.TYPE",
              width: 4,
              height: "input-sm",
              options: rwContextSvc.getContext("userTitle"),
              required: false, enabled: true, show: true
            },
            {
              id: "enabled",
              type: "checkbox",
              label: "WORDS.ENABLED",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  };

  /*
   * Collection event.
   */
  $scope.$on("cvSelItem",function(ev,user)
  {
    if ($scope.selUser == user)
      return;

    if ($scope.selUser)
    {
      if ($scope.formCtrlObj[userFormId].$dirty)
        $scope.selUser.restoreChangedKeys();

      $scope.formCtrlObj[userFormId].reset();
      $scope.selUser = null;
    }

    // Reset form
    $scope.formCfg.fg[0].rows[0][0].enabled = false;
    $scope.formCfg.fg[0].rows[0][1].enabled = false;

    // Look for user detail
    if (user.hasDetail)
    {
      $scope.selUser = user;
      if ($scope.selUser.role == _ROLE_ROADSITE || $scope.selUser.role == _ROLE_MOVE)
      {
        $scope.formCfg.fg[0].rows[3][1].required = true;
      }
      else
      {
        $scope.formCfg.fg[0].rows[3][1].required = false;
      }
      return;
    }

    // Load user detail
    urModelSvc.loadDetail(user,function(err)
    {
      if (err)
        $scope.alert = err;
      else
      {
        $scope.selUser = user;

        if ($scope.selUser.role == _ROLE_ROADSITE || $scope.selUser.role == _ROLE_MOVE)
        {
          $scope.formCfg.fg[0].rows[3][1].required = true;
        }
        else
        {
          $scope.formCfg.fg[0].rows[3][1].required = false;
        }
      }
    });
  });

  /*
   * Scope function.
   */
  $scope.add = function()
  {
    $scope.formCfg.fg[0].rows[0][0].enabled = true;
    $scope.formCfg.fg[0].rows[0][1].enabled = true;

    $scope.selUser = new User({});
    $scope.selUser.enabled = true;
    $scope.selUser.creation_date = new Date();
  };

  $scope.del = function()
  {
    $scope.alert.tag = "DEL";
    $scope.alert.msg = "CORE_MSG.DELETE_MSG";
    $scope.alert.style = "info";
    $scope.alert.btExec = "WORDS.YES";
    $scope.alert.btClose = "No";
  };

  $scope.save = function()
  {
    if (!$scope.formCtrlObj[userFormId].isValid())
      return;

    // Look for entity change
    var chObj = $scope.selUser.changedKeys();
    if (!chObj)
    {
      $scope.selUser = null;
      return;
    }

    // Save
    urModelSvc.save($scope.selUser,function(op,err)
    {
      if (err)
      {
        $scope.alert = err;
      }
      else
      {
        if (op == "I")
          $scope.collCfg.reload++;

        $scope.selUser = null;
      }
    });
  };

  $scope.close = function()
  {
    if ($scope.formCtrlObj[userFormId].$dirty)
      $scope.selUser.restoreChangedKeys();

    $scope.formCtrlObj[userFormId].reset();
    $scope.collCfg.reset++;

    $scope.selUser = null;
  };

  $scope.onAlert = function(ret)
  {
    if (ret)
    {
      switch ($scope.alert.tag)
      {
        case "DEL":
          urModelSvc.logdel($scope.selUser,function(err)
          {
            if (err)
              $scope.alert = err;
            else
            {
              $scope.collCfg.reload++;
              $scope.selUser = null;
            }
          });
          break;
      }
    }

    // Close alert
    $scope.alert = {};
  };

  /*
   * Load role master.
   */
  rwHttpSvc.get("/role/master?simple=1",function(res)
  {
    if (res && res.result)
    {
      $scope.formCfg.fg[0].rows[3][0].options = res.result;
    }
  });

  /*
   * Load authority master.
   */
  rwHttpSvc.get("/authority/master",function(res)
  {
    var aAuth = [];
    if (res && res.result)
    {
      res.result.forEach(function(item){aAuth.push(item);});
      aAuth.push({id:null,name: ""});
      $scope.formCfg.fg[0].rows[3][1].options = aAuth;
      $scope.collCfg.search.advanced.source[3].values = aAuth;
    }
  });
}

function roleCtrl($scope,$uibModalInstance,$timeout,rwHttpSvc,urModelSvc,Role,
  DTOptionsBuilder,DTColumnDefBuilder)
{
  var roleFormId = "roleForm";

  $scope.selRole = null;
  $scope.formCtrlObj = {};
  $scope.permissions = [];

  // Alert config: {tag, msg, style, btExec, btClose}
  $scope.alert = {};

  // Panel header config
  $scope.headerCfg =
  {
    title: "USER_ROLE.TITLE_ROLE",
    minimized: false,
    modalInstance: $uibModalInstance
  };

  // Collection config
  $scope.collCfg =
  {
    entityClass: Role,
    entityName: "role",
    pagination: true,
    maxHeight: 450,
    titleAtt: "name",
    descrAtt: "descr",
    order: "name|ASC",
    reload: 0,
    reset: 0,
    search: {simple: {key:["name","descr"]}}
  };

  // Form config
  $scope.formCfg =
  {
    id:roleFormId, maxHeight:100, fg:
    [
      {
        show:true, label:null, rows:
        [
          [
            {
              id: "name",
              type: "text",
              label: "WORDS.NAME",
              width: 6,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "descr",
              type: "textarea",
              label: "WORDS.DESCRIPTION",
              width: 6,
              height: "input-sm",
              required: true, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  };

  // Permission table config
  $scope.dtInstance = {};

  $scope.dtOpt = DTOptionsBuilder.newOptions()
    .withOption("bInfo",false)
    .withOption("paging",false)
    .withOption("scrollY",250)
    .withOption("scrollCollapse",true)
    .withOption("ordering",true)
    .withOption("searching",false)
    .withOption("responsive",false)
    .withOption("bLengthChange",false)
    .withLanguage({emptyTable: "No data"});

  $scope.dtColDef = [
    DTColumnDefBuilder.newColumnDef(2).notSortable()
  ];

  /*
   * Collection event.
   */
  $scope.$on("cvSelItem",function(ev,role)
  {
    if ($scope.selRole == role)
      return;

    if ($scope.selRole)
    {
      if ($scope.formCtrlObj[roleFormId].$dirty)
        $scope.selRole.restoreChangedKeys();

      $scope.formCtrlObj[roleFormId].reset();
    }

    // Disable form for readonly role
    $scope.formCtrlObj[roleFormId].setEnabled(!role.readonly);

    // Update selected role
    $scope.selRole = role;

    // Adjust datatable
    $timeout(function(){$scope.dtInstance.DataTable.columns.adjust();},10);
  });

  /*
   * Scope function.
   */
  $scope.add = function()
  {
    $scope.formCtrlObj[roleFormId].setEnabled(true);
    $scope.selRole = new Role();
  };

  $scope.del = function()
  {
    $scope.alert.tag = "DEL";
    $scope.alert.msg = "CORE_MSG.DELETE_MSG";
    $scope.alert.style = "info";
    $scope.alert.btExec = "WORDS.YES";
    $scope.alert.btClose = "No";
  };

  $scope.save = function()
  {
    if (!$scope.formCtrlObj[roleFormId].isValid())
      return;

    // Look for entity change
    var chObj = $scope.selRole.changedKeys();
    if (!chObj)
    {
      $scope.selRole = null;
      return;
    }

    // Save
    urModelSvc.save($scope.selRole,function(op,err)
    {
      if (err)
      {
        $scope.alert = err;
      }
      else
      {
        if (op == "I")
          $scope.collCfg.reload++;

        $scope.selRole = null;
      }
    });
  };

  $scope.close = function()
  {
    if ($scope.formCtrlObj[roleFormId].$dirty)
      $scope.selRole.restoreChangedKeys();

    $scope.formCtrlObj[roleFormId].reset();
    $scope.collCfg.reset++;

    $scope.selRole = null;
  };

  $scope.onAlert = function(ret)
  {
    if (ret)
    {
      switch ($scope.alert.tag)
      {
        case "DEL":
          urModelSvc.delete($scope.selRole,function(err)
          {
            if (err)
              $scope.alert = err;
            else
            {
              $scope.collCfg.reload++;
              $scope.selRole = null;
            }
          });
          break;
      }
    }

    // Close alert
    $scope.alert = {};
  };

  /*
   * Load permission master.
   */
  rwHttpSvc.get("/permission/master",function(res)
  {
    $scope.permissions = (res && res.result) ? res.result : [];
  });
}

function userInfoCtrl($scope,$uibModalInstance,rwHttpSvc,rwAuthSvc,UserInfo,rwContextSvc)
{
  var uiFormId = "userInfoForm";

  $scope.message = null;
  $scope.userInfo = new UserInfo(rwAuthSvc.userInfo);
  $scope.formCtrlObj = {};

  // Panel header config
  $scope.headerCfg =
  {
    title: "CORE_LBL.USER_INFO",
    minimized: false,
    modalInstance: $uibModalInstance
  };

  // Form config
  $scope.formCfg =
  {
    id:uiFormId, fg:
    [
      {
        show:true, label:null, rows:
        [
          [
            {
              id: "username",
              type: "text",
              label: "WORDS.USERNAME",
              width: 4,
              height: "input-sm",
              required: false, enabled: false, show: true
            },
            {
              id: "strRole",
              type: "text",
              label: "WORDS.ROLE",
              width: 4,
              height: "input-sm",
              required: false, enabled: false, show: true
            },
            {
              id: "authority_id",
              type: "select",
              label: "WORDS.AUTHORITY",
              width: 4,
              height: "input-sm",
              options: [],
              required: false, enabled: false, show: true
            }
          ],
          [
            {
              id: "name",
              type: "text",
              label: "WORDS.NAME",
              width: 6,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "surname",
              type: "text",
              label: "WORDS.SURNAME",
              width: 6,
              height: "input-sm",
              required: true, enabled: true, show: true
            }
          ],
          [
           {
              id: "phone",
              type: "telephone",
              label: "WORDS.PHONE",
              width: 6,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "email",
              type: "email",
              label: "WORDS.EMAIL",
              width: 6,
              height: "input-sm",
              required: true, enabled: true, show: true
            }
          ]
        ]
      },
      {
        show:true, label:"CORE_LBL.CHANGE_PASSWORD", rows:
        [
          [
           {
              id: "newPwd1",
              type: "password",
              label: "CORE_LBL.NEW_PASSWORD",
              width: 6,
              height: "input-sm",
              required: false, enabled: true, show: true,
              customErrMsg: "CORE_MSG.PASSWORD_MISMATCH"
            },
            {
              id: "newPwd2",
              type: "password",
              label: "CORE_LBL.RETYPE_NEW_PASSWORD",
              width: 6,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  };

  /*
   * Scope function.
   */
  $scope.save = function()
  {
    // Reset
    $scope.message = null;
    $scope.formCtrlObj[uiFormId].showCustomErrOnField("newPwd1",false);

    // Check
    var pwd1 = $scope.userInfo.newPwd1,
      pwd2 = $scope.userInfo.newPwd2;

    if ((pwd1 || pwd2) && pwd1 != pwd2)
      $scope.formCtrlObj[uiFormId].showCustomErrOnField("newPwd1",true);

    if (!$scope.formCtrlObj[uiFormId].isValid())
      return;

    // Get changed attributes
    var chObj = $scope.userInfo.changedKeys();
    if (!chObj) return;

    // Update
    rwHttpSvc.put("/user/update/"+$scope.userInfo.id,chObj,function(res)
    {
      if (res && res.result)
      {
        $scope.userInfo.updateChangedKeys();
      }
      else
      {
        $scope.userInfo.restoreChangedKeys();
        $scope.message = "CORE_LBL.UPDATE_ERR";
      }
    });
  };

  function loadAuthority()
  {
    authorities = [];
    rwHttpSvc.get("/authority/master",function(res)
    {

      if (res && res.result)
      {
        res.result.forEach(function(item){authorities.push(item);});
        authorities.push({id:null,name: ""});
        $scope.formCfg.fg[0].rows[0][2].options = authorities;
      }
    });
  }

  loadAuthority();
}

function authorityCtrl($scope,$uibModalInstance,Authority,urModelSvc,rwContextSvc,
  rwConfigSvc,rwAuthSvc, DTOptionsBuilder, DTColumnDefBuilder)
{
  // Private variables
  var ctxAuthFunction = rwContextSvc.getContext("authorityFunction");

  // Scope variabled
  $scope.selAuth = null;
  $scope.formCtrlObj = {};
  $scope.loading = true;
  $scope.authAlert = {};
  $scope.authList = [];

  /* Header config */
  $scope.headerCfg =
  {
    title: "MENU.MENU_MAN_4",
    minimized: false,
    modalInstance: $uibModalInstance
  };

  /*
  * Pagination
  */
  $scope.authorityPagination =  {
    id: "authListPag",
    order: "name|DESC",
    filter: null,
    reload: 0,
    rpp:"10",
    rppArray:["5","10","15","20"],
    entity: Authority,
    countUrl: "/authority/count",
    masterUrl: "/authority/master"
  };

  $scope.$on("rwPageLoaded",function(ev,id,aRes)
  {
    $scope.authList = aRes;
    $scope.loading = false;
  });

    /*
    * Search
    */
  $scope.authoritySearch =
  {
    simple: {key:["name","vat"]},
    advanced: {source:
    [
      {id:"name",name:"WORDS.NAME",type:"text",operators:["EQ","ILIKE"]},
      {id:"vat",name:"WORDS.VAT",type:"text",operators:["EQ","ILIKE"]},
      {id:"function_id",name:"REGISTRATION.FUNCTION",type: "combo",
        values: rwContextSvc.getContext("authorityFunction"),
        operators: ["EQ"]},
    ]}
  };

  $scope.$watch("authoritySearch.simple.filter",function(nVal,oVal)
  {
    if (!nVal && !oVal)
      return;

    $scope.authorityPagination.filter = nVal;


    $scope.authorityPagination.reload++;
  });

  $scope.$watch("authoritySearch.advanced.filter",function(nVal,oVal)
  {
    if (!nVal && !oVal)
      return;

    $scope.authorityPagination.filter = nVal;

    $scope.authorityPagination.reload++;
  });

  /* Detail's authority configuration */
  var onChangeAuthorityForm = function(key, nv,ov)
  {
    if (key == 'function_id')
    {
      $scope.formCfg.fg[0].rows[0][2].required = nv >=2 ? false : true;
    }
  };

  /* Form config */
  $scope.formCfg =
  {
    id:"authorityForm", changeCallback: onChangeAuthorityForm,  fg:
    [
      {
        show:true, label:"", rows:
        [
          [
            {
              id: "name",
              type: "text",
              label: "WORDS.BUSINESS_NAME",
              width: 3,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "email",
              type: "email",
              label: "WORDS.EMAIL",
              width: 3,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "pec",
              type: "email",
              label: "PEC",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "vat",
              type: "text",
              label: "WORDS.VAT",
              width: 1,
              maxlength:11,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "function_id",
              type: "select",
              label: "REGISTRATION.FUNCTION",
              width: 2,
              height: "input-sm",
              options: ctxAuthFunction,
              required: true, enabled: true, show: true
            }
          ],
          [
            {
              id: "address",
              type: "text",
              maxlength:64,
              label: "WORDS.HEAD_OFFICE",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "address_number",
              type: "text",
              maxlength:16,
              label: "WORDS.STREET_NUMBER",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "municipality",
              type: "text",
              maxlength:64,
              label: "WORDS.MUNICIPALITY",
              width: 5,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "enabled",
              type: "checkbox",
              label: "WORDS.ENABLED",
              width: 2,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  };

  /* Detail's authorization configuration */
  $scope.authorizationFormCfg =
  {
    id:"authorizationForm",fg:
    [
      {
        show:true, label:"REGISTRATION.AUTHORIZATION", rows:
        [
          [
            {
              id: "start_date",
              type: "timestamp",
              label: "CORE_LBL.START_DATE",
              width: 6,
              height: "input-sm",
              hideTime: true,
              required: false, enabled: true, show: true
            },
            {
              id: "end_date",
              type: "timestamp",
              label: "CORE_LBL.END_DATE",
              width: 6,
              height: "input-sm",
              hideTime: true,
              required: false, enabled: true, show: true
            }
          ],
        ]
      }
    ]
  };

  /* Detail's protocol authorization configuration */
  $scope.authorizationProtocolFormCfg =
  {
    id:"authorizationProtocolForm",fg:
    [
      {
        show:true, label:"", rows:
        [
          [
            {
              id: "auth_protocol",
              type: "text",
              label: "WORDS.PROTOCOL",
              width: 5,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "auth_attach",
              type: "text",
              label: "WORDS.ATTACHMENT",
              width: 6,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  };

  /*
   * History table
   */
  $scope.historyTable = {};
  $scope.historyTableOpt = DTOptionsBuilder.newOptions()
    .withOption("bInfo",false)
    .withOption("paging",false)
    .withOption("scrollY",125)
    .withOption("scrollCollapse",true)
    .withOption("ordering",false)
    .withOption("searching",false)
    .withOption("responsive",false)
    .withOption("bLengthChange",false)
    .withLanguage({emptyTable: "Nessun dato"});
  $scope.historyTableDef = [
    DTColumnDefBuilder.newColumnDef(0).withOption("sWidth",'25%'),
    DTColumnDefBuilder.newColumnDef(1).withOption("sWidth",'25%'),
    DTColumnDefBuilder.newColumnDef(2).withOption("sWidth",'25%'),
    DTColumnDefBuilder.newColumnDef(3).withOption("sWidth",'25%')
  ];


  $scope.setHistoryTableInstance = function(instance)
  {
    $scope.historyTable = instance;
  };

  /* Scope function */
  $scope.authAlertDone = function(val)
  {
    if (val == 1 && $scope.authAlert.exe)
      $scope.authAlert.exe();
    else if (val == 0 && $scope.authAlert.exe0)
      $scope.authAlert.exe0();

    $scope.authAlert = {};
  };

  $scope.isSelected = function(auth)
  {
    return $scope.selAuth === auth;
  };

  $scope.functionInfo = function(id)
  {
    for (var i = 0;i < ctxAuthFunction.length;i++)
    {
      var obj = ctxAuthFunction[i];

      if (obj.id == id)
        return obj["name"];
    };

    return null;
  };

  /* Set the selected authority */
  $scope.onAuth = function(auth)
  {
    if (!auth || auth == $scope.selAuth)
    {
      $scope.selAuth.restoreChangedKeys();
      $scope.selAuth = null;
      return;
    }

    // Get the entity's detail
    urModelSvc.loadDetail(auth,function(err)
    {
      //Hide loader
      $scope.loading = false;

      if (err)
      {
        $scope.authAlert.msg = "CORE_LBL.DETAIL_ERR";
        $scope.authAlert.btKo = "Ok";
        $scope.authAlert.style = "danger";
      }
      else
        $scope.selAuth = auth;


      $scope.formCfg.fg[0].rows[0][2].required = auth.function_id >=2 ? false : true;
    });
  };

  $scope.dateString = function(ts)
  {
    return ts ? new Date(ts).toCustomString() : null;
  };

  $scope.addAuth = function()
  {
    $scope.selAuth = new Authority({});
    $scope.selAuth.enabled = true;
  };

  $scope.delAuth = function()
  {
    if (!$scope.selAuth || !$scope.selAuth.id)
      return;

    $scope.authAlert.msg = "CORE_MSG.DELETE_ITEM_MSG";
    $scope.authAlert.style = "info";
    $scope.authAlert.bt0 = "No";
    $scope.authAlert.bt1 = "WORDS.YES";
    $scope.authAlert.exe = function()
    {
      $scope.loading = true;
      urModelSvc.logdel($scope.selAuth,function(err)
      {
        $scope.loading = false;
        if (err)
        {
          $scope.authAlert.msg = err.msg;
          $scope.authAlert.bt0 = "Ok";
          $scope.authAlert.style = "danger";
        }
        else
        {
          $scope.authorityPagination.reload++;
          $scope.selAuth = null;
        }
      });
    };
  };

  $scope.save = function()
  {
    var bSaveAuth = false;

    if (!$scope.formCtrlObj['authorityForm'].isValid())
      return;


    var chObj = $scope.selAuth.changedKeys();
    if (chObj)
      bSaveAuth = true;

    if(bSaveAuth)
    {
      urModelSvc.save($scope.selAuth,function(op,err)
      {
        if (err)
        {
          $scope.authAlert.msg = err.msg;
          $scope.authAlert.style = "danger";
          $scope.authAlert.bt0 = "Ok";
        }
        else
        {
          /* Show Alert Save OK*/
          $scope.selAuth = null;
          $scope.authAlert.msg = op == "I" ?  "CORE_LBL.INSERT_OK" : "CORE_LBL.UPDATE_OK";
          $scope.authAlert.style = "info";
          $scope.authAlert.bt0 = "Ok";
          $scope.authorityPagination.reload++;
        }
      });
    }
    else
    {
      /* Show alert No Changes*/
      $scope.authAlert.msg = "CORE_LBL.NO_CHANGES_MSG";
      $scope.authAlert.bt0 = "OK";
      $scope.authAlert.style = "info";
      $scope.selAuth = null;
    }
  };

  $scope.canc = function()
  {
    if ($scope.formCtrlObj['authorityForm'].$dirty)
      $scope.selAuth.restoreChangedKeys();

    $scope.formCtrlObj['authorityForm'].reset();

    $scope.selAuth = null;
  };

  $scope.setUrl = function(id,name)
  {
    var aURL = [
      rwConfigSvc.urlPrefix,
      "authorization",
      id,
      "download",
      name
    ];

    $scope.authorizationAttachUrl = aURL.join("/") + "?it_app_auth=" + rwAuthSvc.token;
  };
}
