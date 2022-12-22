/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("registration")
  .controller("requestCtrl",requestCtrl);

function requestCtrl($scope,ui, $uibModalInstance,rwContextSvc,rwHttpSvc,rwAuthSvc,
  Registration,$http,rwConfigSvc, DTColumnDefBuilder,DTOptionsBuilder, Authorization)
{
  $scope.requestObjCtrl = {};
  $scope.reqAlert = {};
  $scope.loading = false;

  $scope.newReg = true;
  $scope.changeAuthorization = false;

  _ROLE_ROADSITE = 37;
  _ROLE_MOVE = 38;

  /* Modal header */
  $scope.headerCfg =
  {
    title: "MENU.MENU_AUTH_1",
    minimized: false,
    modalInstance: $uibModalInstance
  };

  $scope.authAttach = {file: null}; //object to save authorization file
  $scope.authAttachUrl = null;
  $scope.mandatoryAuthAttach = false;

  /* Detail's user configuration */
  $scope.userFormCfg =
  {
    id:"userForm",fg:
    [
      {
        show:true, label:"REGISTRATION.USER_DATA", rows:
        [
          [
            {
              id: "username",
              type: "text",
              label: "WORDS.USERNAME",
              width: 3,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "creation_date",
              type: "date",
              label: "CORE_LBL.CREATION_DATE",
              width: 3,
              height: "input-sm",
              position: "up",
              required: false, enabled: false, show: true
            },
            {
              id: "name",
              type: "text",
              maxlength:64,
              label: "WORDS.NAME",
              width: 3,
              height: "input-sm",
              required: true, enabled: true, show: true
            },
            {
              id: "surname",
              type: "text",
              maxlength:64,
              label: "WORDS.SURNAME",
              width: 3,
              height: "input-sm",
              required: true, enabled: true, show: true
            }
          ],
          [
            {
              id: "cf",
              type: "text",
              maxlength:16,
              label: "WORDS.TAX_CODE",
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
              id: "phone",
              type: "telephone",
              label: "WORDS.PHONE",
              width: 3,
              height: "input-sm",
              required: false, enabled: true, show: true
            },
            {
              id: "title_id",
              type: "select",
              label: "WORDS.TYPE",
              width: 3,
              height: "input-sm",
              options: rwContextSvc.getContext("userTitle"),
              required: false, enabled: true, show: true
            }
          ]
        ]
      }
    ]
  };

  /* Detail's authority configuration */
  var onChangeAuthorityForm = function(key, nv,ov)
  {
    if (key == 'function_id')
    {
      if(nv >=2) // Traslochi
      {
        var year = new Date().getFullYear();
        // get the first day and last day (a month behind)
        var firstDay = new Date(year, 0, 1);
        var lastDay = new Date(year,11, 31);

        $scope.registration.authorization.start_date = firstDay.setHours(0,0,0,0);
        $scope.registration.authorization.end_date  = lastDay.setHours(0,0,0,0)

        $scope.authorityFormCfg.fg[0].rows[0][2].required = false;
      }
      else // Manutenzione Strade
      {
        $scope.registration.authorization.start_date = null;
        $scope.registration.authorization.end_date  = null;
        $scope.authorityFormCfg.fg[0].rows[0][2].required = true;
      }
    }
  };

  $scope.authorityFormCfg =
  {
    id:"authorityForm", changeCallback: onChangeAuthorityForm,  fg:
    [
      {
        show:true, label:"REGISTRATION.COMPANY_DATA", rows:
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
              options: rwContextSvc.getContext("authorityFunction"),
              required: true, enabled: true, show: true
            }
          ],
          [
            {
              id: "address",
              type: "text",
              maxlength:64,
              label: "WORDS.HEAD_OFFICE",
              width: 4,
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
              width: 6,
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
              required: true, enabled: true, show: true
            },
            {
              id: "end_date",
              type: "timestamp",
              label: "CORE_LBL.END_DATE",
              width: 6,
              height: "input-sm",
              hideTime: true,
              required: true, enabled: true, show: true
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
              width: 12,
              height: "input-sm",
              required: true, enabled: true, show: true
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
    // .withOption("scrollY",125)
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

  // Scope function
  $scope.reqAlertDone = function(val)
  {
    if (val == 1 && $scope.reqAlert.exe)
      $scope.reqAlert.exe();
    else if (val == 0 && $scope.reqAlert.exe0)
      $scope.reqAlert.exe0();

    $scope.reqAlert = {};
  };

  $scope.dateString = function(ts)
  {
    return ts ? new Date(ts).toCustomString() : null;
  };

  $scope.save = function()
  {
    var aForm = ["userForm","authorityForm"];
    if ($scope.registration.authority.function_id >= 2)
    {
      aForm.push("authorizationForm");
      aForm.push("authorizationProtocolForm");

      if (!$scope.registration.authorization.auth_attach)
      {
        $scope.mandatoryAuthAttach = true;
        return;
      }
    }
    var formVal = true;

    /* Check form validity */
    for (var j = 0;j < aForm.length;j++)
    {
      if (!$scope.requestObjCtrl[aForm[j]].isValid())
      {
        formVal &= false;
      }
    }

    if(!formVal)
    {
      $scope.reqAlert.msg = "CORE_LBL.NOT_VALID";
      $scope.reqAlert.style = "warning";
      $scope.reqAlert.bt0 = "Ok";
      return;
    }

    // Set the correct role to user
    switch($scope.registration.authority.function_id)
    {
      case 1: $scope.registration.user.role = _ROLE_ROADSITE; break;

      case 2: $scope.registration.user.role = _ROLE_MOVE; break;
    }

    if ($scope.newReg)
    {
       // INSERT
       var urlIns = "/" + $scope.registration.getName() + "/0/insert";

       var chgObj = $scope.registration.changedKeys();
       // Prepare payload
       var fd = new FormData();
       if ($scope.authAttach.file)
       {
         fd.append("auth_attach",$scope.authAttach.file);
       }

       for (var key in chgObj)
       {
         // modify object into string to send via multipart/form-data
        if (key == 'user' || key == 'authority' || key == 'authorization')
          fd.set(key, JSON.stringify(chgObj[key]));
        else
          fd.append(key,chgObj[key]);
       }

       // Configure request option
       var opt =
       {
         transformRequest: angular.identity,
         headers: {'Content-Type': undefined}
       };

       $scope.loading = true;
       // Exec request
       $http.post(rwConfigSvc.urlPrefix+urlIns,fd,opt).then(
        function(res)
        {
          if (res && !res.data)
          {
            /* Show Alert Insert Error */
            $scope.reqAlert.msg = "REGISTRATION.INSERT_ERROR";
            $scope.reqAlert.style = "danger";
            $scope.reqAlert.bt0 = "Ok";
            // $scope.reqAlert.exe0 = function()
            // {
            //   $uibModalInstance.close();
            // };
          }
          else if (res && res.data && res.data.result)
          {
            /* Show Alert Insert OK*/
            $scope.reqAlert.msg = "REGISTRATION.INSERT_OK";
            $scope.reqAlert.style = "info";
            $scope.reqAlert.bt0 = "Ok";
            $scope.authAttach.file = null;
            $scope.reqAlert.exe0 = function()
            {
              $uibModalInstance.close();
            };

            $scope.registration.updateChangedKeys();

          }
          else
          {
            if (res.data.error && res.data.error == "EXISTING_USERNAME")
            {
               /* Show Alert Insert Error */
              $scope.reqAlert.msg = "REGISTRATION.EXISTING_USERNAME";
              $scope.reqAlert.style = "danger";
              $scope.reqAlert.bt0 = "Ok";
            }
            else if (res.data.error && res.data.error.indexOf("un_sysuser_cf") >=0)
            {
              $scope.reqAlert.msg = "REGISTRATION.EXISTING_USER";
              $scope.reqAlert.style = "danger";
              $scope.reqAlert.bt0 = "Ok";
              // $scope.reqAlert.exe0 = function()
              // {
              //   $uibModalInstance.close();
              // };
            }
            else
            {
              /* Show Alert Insert Error */
              $scope.reqAlert.msg = "REGISTRATION.INSERT_ERROR";
              $scope.reqAlert.style = "danger";
              $scope.reqAlert.bt0 = "Ok";
              // $scope.reqAlert.exe0 = function()
              // {
              //   $uibModalInstance.close();
              // };
            }
          }
          $scope.loading = false;
         },
         function(err) {
            $scope.reqAlert.msg = "REGISTRATION.INSERT_ERROR";
            $scope.reqAlert.style = "danger";
            $scope.reqAlert.bt0 = "Ok";
            // $scope.reqAlert.exe0 = function()
            // {
            //   $uibModalInstance.close();
            // };

           $scope.loading = false;
         }
       );

    }
    else
    {
      var chgObj = $scope.registration.authorization.changedKeys();

      if (chgObj || $scope.authAttach.file)
      {
        chgObj.authority_id = $scope.registration.authority.id;

        // Set start_date
        chgObj.start_date = new Date(chgObj.start_date).setHours(0,0,0,0);

        // Set end_date
        chgObj.end_date = new Date(chgObj.end_date).setHours(0,0,0,0);

        // INSERT
        var urlIns = "/" + $scope.registration.authorization.getName() + "/0/insert";

        // Prepare payload
        var fd = new FormData();
        if ($scope.authAttach.file)
        {
          fd.append("auth_attach",$scope.authAttach.file);
        }

        for (var key in chgObj)
        {
          fd.append(key,chgObj[key]);
        }

        // Configure request option
        var opt =
        {
          transformRequest: angular.identity,
          headers: {'Content-Type': undefined}
        };

        $scope.loading = true;
        // Exec request
        $http.post(rwConfigSvc.urlPrefix+urlIns,fd,opt).then(
          function(res)
          {
            if (res && !res.data)
            {
              /* Show Alert Insert Error */
              $scope.reqAlert.msg = "CORE_LBL.UPDATE_ERR";
              $scope.reqAlert.style = "danger";
              $scope.reqAlert.bt0 = "Ok";
            }
            else if (res && res.data && res.data.result)
            {
              /* Show Alert Insert OK*/
              $scope.reqAlert.msg = "CORE_LBL.UPDATE_OK";
              $scope.reqAlert.style = "info";
              $scope.reqAlert.bt0 = "Ok";
              $scope.authAttach.file = null;

              $scope.registration.updateChangedKeys();

              $scope.changeAuthorization = false;

              $scope.registration.authority.authorizationHistory.unshift($scope.registration.authorization);

            }
            else
            {
              /* Show Alert Insert Error */
              $scope.reqAlert.msg = "CORE_LBL.UPDATE_ERR";
              $scope.reqAlert.style = "danger";
              $scope.reqAlert.bt0 = "Ok";
            }
            $scope.loading = false;
          },
          function(err) {
            console.log(err);
            $scope.reqAlert.msg = "CORE_LBL.UPDATE_ERR";
            $scope.reqAlert.style = "danger";
            $scope.reqAlert.bt0 = "Ok";

            $scope.loading = false;
          }
        );
      }

    }

  };

  $scope.clearFileSelection = function(element){
    angular.element("#"+element).val(null);
  };

  $scope.newAuthorization = function()
  {
    $scope.registration.authorization = new Authorization({});
    $scope.changeAuthorization = true;
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

    $scope.authAttachUrl = aURL.join("/") + "?it_app_auth=" + rwAuthSvc.token;
  };

  /*
   * Scope watch
   */

  $scope.$watch("authAttach.file", function(newObj,oldObj)
  {
    if (!newObj)
      return;

    $scope.registration.authorization.auth_attach = newObj.name;
    $scope.mandatoryAuthAttach = false;
  });

  // Check registration entity
  if (!ui)
  {
    $scope.registration = new Registration({});
    $scope.registration.user.creation_date = new Date();
    $scope.registration.user.enabled = false;

    $scope.registration.authority.enabled = false;

    $scope.newReg = true;
  }
  else
  {
    // Load detail
    var body = {
      user_id: ui.id,
      authority_id: ui.authority_id
    }
    var url = "/registration/wholeDetail";
    $scope.loading = true;
    rwHttpSvc.post(url,body,function(res)
    {
      $scope.loading = false;
      $scope.registration = new Registration(res);

      if (!$scope.registration.authorization.start_date  &&
        !$scope.registration.authorization.end_date )
      {
        var year = new Date().getFullYear();
        // get the first day and last day (a month behind)
        var firstDay = new Date(year, 0, 1);
        var lastDay = new Date(year,11, 31);

        $scope.registration.authorization.start_date = firstDay.setHours(0,0,0,0);
        $scope.registration.authorization.end_date  = lastDay.setHours(0,0,0,0);

        $scope.authorityFormCfg.fg[0].rows[0][2].required =
          $scope.registration.authority.function_id == 1 ? true : false;
      }

      $scope.newReg = false;
    });
  }

}