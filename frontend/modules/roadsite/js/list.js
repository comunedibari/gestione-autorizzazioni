/*
 *   Date: 2022 05 11
 *
 *
 *
 */

angular.module("roadsite")
  .controller("roadsiteListCtrl",roadsiteListCtrl);

function roadsiteListCtrl($scope,$uibModalInstance,Roadsite,rwAuthSvc,rsModelSvc,
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
    filter.rules.push("status_id|GE|3"); // Approved or rejected roadsite
    bDefFilter = true;
  }
  else
  {
    // Access admin (utente comunale)
    // Nothing to do
    filter = {rules:[]};
    filter.rules.push("status_id|GE|2"); // Not in REDAZIONE
    bDefFilter = true;
  }

  var arrAddressMulti = [];
  var arrTownMulti = [];

  var authorities = [];
  var aUserCtx = [];

  var aPerm = rwAuthSvc.permForModule("roadsite") || [];
  $scope.btnPermission = aPerm.indexOf("ROADSITE_CRUD") >= 0 ? true : false;

  var viaArray = [];

  var objRoadsiteOnMap  = null;
  var showRoadsiteOnMap = false;

  /*
   * Scope variables
   */
  $scope.selEnt = null;
  $scope.rsListAlert = {};
  $scope.showForm = false;
  $scope.loading = false;
  $scope.roadsiteObjCtrl = {};
  $scope.bSaved = false;

  $scope.geodataFile = {};
  $scope.gdDownloadUrl = null;

  // flag to manage button status after shape loading or geom drawing
  $scope.geomDrawed = false;

  $scope.projectAttach = {file: null}; //object to save project_attach file
  $scope.projectAttachUrl = null;

  $scope.authorizationAttach = {file: null}; //object to save authorization_attach file
  $scope.authorizationAttachUrl = null;

  $scope.coordCommunicationAttach = {file: null}; //object to save coord_communication_attach file
  $scope.coordCommunicationAttachUrl = null;

  $scope.approvedAttach = {file: null}; //object to save approved_attach file
  $scope.approvedAttachUrl = null;

  $scope.canApprove = aPerm.indexOf("ROADSITE_APPROVE") >= 0 ? true : false;
  $scope.canSend = aPerm.indexOf("ROADSITE_SEND_REQUEST") >= 0 ? true : false;
  $scope.canAddNotePM = aPerm.indexOf("ROADSITE_NOTE_PM") >= 0 ? true : false;
  if ($scope.canAddNotePM) //Admin traslochi
  {
    if(!authId && Object.keys(userInfo).length != 0)
    {
      filter = {rules:[]};
      filter.rules.push("status_id|EQ|3"); // Approved roadsite
      bDefFilter = true;
    }

  }

  $scope.mandatoryApproveAttach = false;
  $scope.mandatoryProjectAttach = false;

   // With this variable we enable or disable buttons SHOW_PATH
   $scope.disableShowButton = true;

   // buttons classes (view on map buttons)
   $scope.showRoadsiteBtnClass  = "btn-default";

  // add temporary layer on the map
  wgMapSvc.addTemporaryLayer({
    cluster: false,
    styleFunction: function(feature) {
      var geometry = feature.getGeometry();
      var style = [
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: '#0000ff',
            width: 3
          }),
          fill: new ol.style.Fill({
            color: "#0000ff80"
          })
        }),
      ];

      return style;
    }
  });


  /* Modal header */
  $scope.headerCfg =
  {
    title: "MENU.MENU_ROADSITE_1",
    minimized: false,
    modalInstance: $uibModalInstance
  };

  /* Roadsites table */
  var addRoadsite = function()
  {
    /*Create new Roadsite */
    $scope.selEnt = new Roadsite({});
    $scope.selEnt.authority_id = userInfo.authority_id;
    $scope.selEnt.email = userInfo.email;
    $scope.selEnt.status_id = 1; // In redazione
    $scope.selEnt.request_date = new Date().getTime();
    $scope.selEnt.request_year = new Date().getFullYear();
    $scope.selEnt.open_user_id = rwAuthSvc.userInfo.id;

    $scope.rsFormCfg.fg[0].rows[2][0].options = [];
    arrAddressMulti = [];
    $scope.rsFormCfg.fg[0].rows[2][1].options = arrAddressMulti;

    arrTownMulti = [];
    $scope.rsFormCfg.fg[0].rows[2][2].options = arrTownMulti;


    $scope.searchCfg.advanced.source[0].values = [];
    $scope.rsFormCfg.fg[0].rows[0][2].options = [];

    loadAuthority(function(resAuth)
    {
      $scope.showForm = true;
      $scope.headerCfg.closeDisabled = true;

      $scope.selEnt.authority_id = userInfo.authority_id;

      var auth = resAuth.find(function(a){ return a.id == $scope.selEnt.authority_id;});
      if (!auth)
      {
        $scope.rsListAlert.msg = "MOVE.AUTH_NOT_ENABLED";
        $scope.rsListAlert.style = "warning";
        $scope.rsListAlert.bt0 = "Ok";
        $scope.rsListAlert.exe0 = function(){
          $scope.close();
        };
        return;
      }

      $scope.searchCfg.advanced.source[0].values = resAuth;
      $scope.rsFormCfg.fg[0].rows[0][2].options = resAuth;

      // Set authority pec
      $scope.selEnt.pec = auth.pec;

    });

  };

  var delRoadsite = function()
  {
    if (!$scope.selEnt || !$scope.selEnt.id)
      return;

    if ($scope.selEnt.status_id != 1)
    {
      $scope.rsListAlert.msg = "ROADSITE.NO_DELETE_ROADSITE";
      $scope.rsListAlert.bt0 = "Ok";
      $scope.rsListAlert.style = "warning";
      return;
    }

    $scope.rsListAlert.msg = "CORE_MSG.DELETE_ITEM_MSG";
    $scope.rsListAlert.bt0 = "No";
    $scope.rsListAlert.bt1 = "WORDS.YES";
    $scope.rsListAlert.style = "info";
    $scope.rsListAlert.exe = function()
    {
      $scope.loading = true;

      rsModelSvc.delete($scope.selEnt,function(err)
      {
        $scope.loading = false;
        if (err)
        {
          $scope.rsListAlert.msg = err.msg;
          $scope.rsListAlert.bt0 = "Ok";
          $scope.rsListAlert.style = "danger";
        }
        else
        {
          $scope.rsListAlert.msg = "CORE_LBL.DELETE_OK";
          $scope.rsListAlert.bt0 = "Ok";
          $scope.rsListAlert.style = "info";

        }

        $scope.roadsiteTable.reload++;
        $scope.roadsiteTable.reset++;
        $scope.selEnt = null;

        if($scope.btnPermission)
        {
          $scope.roadsiteTable.btAdd.disabled = false;
          $scope.roadsiteTable.btDel.disabled = true;
        }
        $scope.roadsiteTable.btUpd.disabled = true;
      });
    }


  };

  var updRoadsite = function()
  {
    viaArray = [];
    $scope.loading = true;

    // Get the entity's detail
    rsModelSvc.loadDetail($scope.selEnt,function(err,res)
    {
      //Hide loader
      $scope.loading = false;

      loadAuthority(function(resAuth)
      {

        var auth = resAuth.find(function(a){ return a.id == $scope.selEnt.authority_id;});
        if (!auth)
        {
          var findAuth = $scope.searchCfg.advanced.source[0].values.find(function(item)
          {
            return item.id == $scope.selEnt.authority_id;
          });
          if (!findAuth)
          {
            $scope.searchCfg.advanced.source[0].values.push({id:$scope.selEnt.authority_id, name:$scope.selEnt.authority});
          }

          var findAuth1 = $scope.rsFormCfg.fg[0].rows[0][2].options.find(function(item)
          {
            return item.id == $scope.selEnt.authority_id;
          });
          if (!findAuth1)
          {
            $scope.rsFormCfg.fg[0].rows[0][2].options.push({id:$scope.selEnt.authority_id, name:$scope.selEnt.authority});
          }

        }

        if (!aUserCtx.find(function(elem){return elem.id == $scope.selEnt.open_user_id;}))
        {
          aUserCtx.unshift({id:$scope.selEnt.open_user_id,name:$scope.selEnt.open_user});
          $scope.searchCfg.advanced.source[1].values = aUserCtx;
          $scope.rsFormCfg.fg[0].rows[0][0].options = aUserCtx;
          $scope.rsApprovedFormCfg.fg[0].rows[0][0].options = aUserCtx;
        }

        if (err)
        {
          $scope.rsListAlert.msg = "CORE_LBL.DETAIL_ERR";
          $scope.rsListAlert.bt0 = "Ok";
          $scope.rsListAlert.style = "danger";
        }

        $scope.showForm = true;
        $scope.headerCfg.closeDisabled = true;

        if ($scope.selEnt.address)
        {
          // Create array address multiselect
          arrAddressMulti = $scope.selEnt.address.split(";").map(function(elem){
            return {id: Math.random(), name: elem};
          });
          $scope.rsFormCfg.fg[0].rows[2][1].options = arrAddressMulti;
          $scope.selEnt.address_multi = arrAddressMulti.map(function(elem){return elem.id});
        }

        if ($scope.selEnt.town)
        {
          // Create array town multiselect
          arrTownMulti = $scope.selEnt.town.split(";").map(function(elem){
            return {id: Math.random(), name: elem};
          });
          $scope.rsFormCfg.fg[0].rows[2][2].options = arrTownMulti;
          $scope.selEnt.town_multi = arrTownMulti.map(function(elem){return elem.id});
        }

        // Set authority pec
        $scope.selEnt.pec = auth.pec;

      });
    });
  };

  $scope.searchCfg = {
    simple: {key:["address","protocol_request_number","town",
    "protocol_approved_number","authority","open_user"]},
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
          values: rwContextSvc.getContext("roadsiteStatus"),
          operators: ["EQ"]
        },
        {
          id: "address",
          name: "WORDS.ADDRESS",
          type: "text",
          operators: ["EQ","ILIKE"]
        },
        {
          id: "start_date",
          name: "CORE_LBL.START_DATE",
          type: "date",
          operators: ["EQ","GT","LT"]
        },
        {
          id: "end_date",
          name: "CORE_LBL.END_DATE",
          type: "date",
          operators: ["EQ","GT","LT"]
        },
        {
          id: "protocol_request_number",
          name: "ROADSITE.PROTOCOL_REQUEST_NUMBER",
          type: "text",
          operators: ["EQ","ILIKE"]
        },
        {
          id: "protocol_approved_number",
          name: "ROADSITE.PROTOCOL_APPROVED_NUMBER",
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
  }

  // Search event
  $scope.$watch("searchCfg.simple.filter",function(nVal,oVal)
  {
    if (!nVal && !oVal)
      return;


    $scope.roadsiteTable.filter = nVal ? nVal : filter;
    $scope.roadsiteTable.reload ++;
  });

  $scope.$watch("searchCfg.advanced.filter",function(nVal,oVal)
  {
    if (!nVal && !oVal)
      return;

    $scope.roadsiteTable.filter = nVal ? nVal : filter;
    $scope.roadsiteTable.reload ++;
  });

  $scope.roadsiteTable =
  {
    id: "roadsite",
    order: "request_date|DESC",
    reset: 0,
    reload: 0,
    scrollY: 375,
    rerender: 0,
    filter: filter ? filter : null,
    entityName: "roadsite",
    entityClass: Roadsite,
    pagination: {rpp:"10", rppArray:["10","15","20"]},
    btAdd: $scope.btnPermission ? {click:addRoadsite, disabled:!$scope.btnPermission} : null,
    btDel: $scope.btnPermission ? {click:delRoadsite, disabled:true} : null,
    btUpd: {click:updRoadsite, disabled:true},
    // search: {
    //   simple: {key:["address","protocol_request_number","town",
    //   "protocol_approved_number","authority","open_user"]},
    //   advanced: {
    //     source: [
    //       {
    //         id: "authority_id",
    //         name: "WORDS.COMPANY",
    //         type: "combo",
    //         values: [],
    //         operators: ["EQ"]
    //       },
    //       {
    //         id: "open_user_id",
    //         name: "WORDS.USER",
    //         type: "combo",
    //         values: [],
    //         operators: ["EQ"]
    //       },
    //       {
    //         id: "request_date",
    //         name: "CORE_LBL.REQUEST_DATE",
    //         type: "date",
    //         operators: ["EQ","GT","LT"]
    //       },
    //       {
    //         id: "status_id",
    //         name: "WORDS.STATUS",
    //         type: "combo",
    //         values: rwContextSvc.getContext("roadsiteStatus"),
    //         operators: ["EQ"]
    //       },
    //       {
    //         id: "address",
    //         name: "WORDS.ADDRESS",
    //         type: "text",
    //         operators: ["EQ","ILIKE"]
    //       },
    //       {
    //         id: "start_date",
    //         name: "CORE_LBL.START_DATE",
    //         type: "date",
    //         operators: ["EQ","GT","LT"]
    //       },
    //       {
    //         id: "end_date",
    //         name: "CORE_LBL.END_DATE",
    //         type: "date",
    //         operators: ["EQ","GT","LT"]
    //       },
    //       {
    //         id: "protocol_request_number",
    //         name: "ROADSITE.PROTOCOL_REQUEST_NUMBER",
    //         type: "text",
    //         operators: ["EQ","ILIKE"]
    //       },
    //       {
    //         id: "protocol_approved_number",
    //         name: "ROADSITE.PROTOCOL_APPROVED_NUMBER",
    //         type: "text",
    //         operators: ["EQ","ILIKE"]
    //       },
    //       {
    //         id: "town",
    //         name: "WORDS.TOWN",
    //         type: "text",
    //         operators: ["EQ","ILIKE"]
    //       }
    //     ]
    //   }
    // },
    columns: [
      {
        // id: "authority_id",
        // type: "object",
        id: "authority",
        type: "text",
        label: "WORDS.COMPANY",
        // source: [], //rwContextSvc.getContext("authority"),
        style: function(obj)
        {
          if (obj.status_id == 2)
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
          if (obj.status_id == 2)
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
          if (obj.status_id == 2)
            return {"font-weight": "900"};
        }
      },
      {
        id: "status_id",
        type: "object",
        label: "WORDS.STATUS",
        source: rwContextSvc.getContext("roadsiteStatus"),
        style: function(obj)
        {
          if (obj.status_id == 2)
            return {"font-weight": "900"};
        }
      },
      {
        id:"address",
        label:"WORDS.ADDRESS",
        sortable:true,
        style: function(obj)
        {
          if (obj.status_id == 2)
            return {"font-weight": "900"};
        }
      },
      {
        id:"town",
        label:"WORDS.TOWN",
        sortable:true,
        style: function(obj)
        {
          if (obj.status_id == 2)
            return {"font-weight": "900"};
        }
      },
      {
        id:"protocol_request_date",
        type:"date",
        label:"ROADSITE.PROTOCOL_REQUEST_DATE",
        sortable:true,
        style: function(obj)
        {
          if (obj.status_id == 2)
            return {"font-weight": "900"};
        }
      },
      {
        id:"protocol_request_number",
        label: "ROADSITE.PROTOCOL_REQUEST_NUMBER",
        style: function(obj)
        {
          if (obj.status_id == 2)
            return {"font-weight": "900"};
        }
      },
      {
        id:"protocol_approved_date",
        type:"date",
        label:"ROADSITE.PROTOCOL_APPROVED_DATE",
        sortable:true,
        style: function(obj)
        {
          if (obj.status_id == 2)
            return {"font-weight": "900"};
        }
      },
      {
        id:"protocol_approved_number",
        label: "ROADSITE.PROTOCOL_APPROVED_NUMBER",
        style: function(obj)
        {
          if (obj.status_id == 2)
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

      // disable show_path buttons
      $scope.disableShowButton = true;

      if($scope.btnPermission)
      {
        $scope.roadsiteTable.btDel.disabled = true;
      }

      $scope.roadsiteTable.btUpd.disabled = true;

      // Clear map from roadsite showed
      resetRoadsiteOnMap();
      return;
    }

    $scope.selEnt = ent;
    if($scope.btnPermission)
    {
      $scope.roadsiteTable.btDel.disabled = ent ? false : true;
    }

    $scope.roadsiteTable.btUpd.disabled = ent ? false : true;

    if ($scope.selEnt.x_min && $scope.selEnt.y_min && $scope.selEnt.x_max && $scope.selEnt.y_max)
    {
      $scope.selEnt.hasGeom = true;
      $scope.disableShowButton = false;
    }
    else
    {
      $scope.selEnt.hasGeom = false;
      $scope.disableShowButton = true;
    }

    // reset map
    resetRoadsiteOnMap();

  });

  /* Roadsite form */
  function filterVia(str)
  {
    if(str !== null && str !== "")
    {
      $scope.loading = true;

       /* Look for civic presence */
      let aTerm = str.split(",");
      let civic = aTerm.length >= 2 ? aTerm[1].trim() : null;

      // Get via with the specified string
      var url = "/via/master";

      body = {
        filter: {rules:["denominazione|LIKE|%"+str.toUpperCase()+"%"], groupOp:"AND"}
      }


      if (civic && !isNaN(civic))
      {
        url = "/civico/master";
        body.filter = {rules:["nome_via|ILIKE|%"+aTerm[0]+"%", "numero|EQ|"+aTerm[1]], groupOp:"AND"};
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
            // Civic presence
            if (civic && !isNaN(civic))
            {
              viaArray.push({
                id: Math.random(),
                descr: res.result[j].localita + " - " + res.result[j].municipio,
                name:res.result[j].nome_via + ", " + res.result[j].numero,
                extent: [res.result[j].x, res.result[j].y, res.result[j].x, res.result[j].y]
              });
            }
            else if (res.result[j].localita_val)
            {
              var loc = res.result[j].localita_val ? res.result[j].localita_val.join() : "";
              var mun = res.result[j].municipio_val ? res.result[j].municipio_val.join() : ""
              viaArray.push({
                id: Math.random(),
                descr: loc  + " - " + mun,
                name:res.result[j].denominazione,
                extent: res.result[j].extent
              });
            }
            else
            {
              viaArray.push({
                id: Math.random(),
                name:res.result[j].denominazione,
                descr: "",
                extent: res.result[j].extent
              });
            }
          }
        }
        else
           viaArray = [];

        $scope.rsFormCfg.fg[0].rows[2][0].options = viaArray;
      });
    }
  };

  var selectedVia =  function(obj)
  {
    if (obj)
    {
      var elemToFind = arrAddressMulti.find(function(item){
        return item.id == obj.id;
      });
      if (!elemToFind)
      {
        arrAddressMulti.push({id: obj.id, name: obj.name.toUpperCase(), descr: obj.descr.toUpperCase().split(" - ")[1]});
        $scope.rsFormCfg.fg[0].rows[2][1].options = arrAddressMulti;
        $scope.selEnt.address_multi = arrAddressMulti.map(function(elem){return elem.id});

        // Check the presence of town
        var t = arrTownMulti.find(function(elem){
          return elem.name == obj.descr.toUpperCase().split(" - ")[1];
        });
        if(!t)
        {
          arrTownMulti.push({id: obj.id, name: obj.descr.toUpperCase().split(" - ")[1]});
        }
        $scope.rsFormCfg.fg[0].rows[2][2].options = arrTownMulti;
        $scope.selEnt.town_multi = arrTownMulti.map(function(elem){return elem.id});
      }
    }

    // EPSG code is 32633
    if (obj && obj.extent && obj.extent.length)
      wgMapSvc.zoomToBBox(obj.extent, 32633);
  };

  var removeVia = function(item, model)
  {
    if(item)
    {
      var townToFind = arrAddressMulti.filter(function(elem,index,array){
        return elem.descr == item.descr;
      });

      var idxAddressToFind = arrAddressMulti.findIndex(function(elem){
        return elem.id == item.id;
      });
      if (idxAddressToFind >=0)
      {
        arrAddressMulti.splice(idxAddressToFind,1);

        $scope.rsFormCfg.fg[0].rows[2][1].options = arrAddressMulti;
        $scope.selEnt.address_multi = arrAddressMulti.map(function(elem){return elem.id});
      }

      if (townToFind && townToFind.length  == 1)
      {
        var idxTownToFind = arrTownMulti.findIndex(function(elem){
          return elem.name == item.descr;
        });

        if (idxTownToFind >=0)
        {
          arrTownMulti.splice(idxTownToFind,1);
        }

        $scope.rsFormCfg.fg[0].rows[2][2].options = arrTownMulti;
        $scope.selEnt.town_multi = arrTownMulti.map(function(elem){return elem.id});

      }


    }
  };

  var rsFormOnChange = function(key, nv,ov)
  {
    if (key == 'authority_id')
    {
      var a = $scope.rsFormCfg.fg[0].rows[0][2].options.find(function(item)
      {
        return item.id == nv;
      });

      if (a)
      {
        $scope.selEnt.pec = a.pec;
      }

    }
  };

  $scope.rsFormCfg =
  {
    id:"rsForm", changeCallback:rsFormOnChange,
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
              width: 3,
              height: "input-sm",
              required: false, enabled:false, show:true
            },
            {
              id: "email",
              type: "text",
              label: "WORDS.EMAIL",
              width: 3,
              height: "input-sm",
              required:false, enabled:false, show:true
            },
            {
              id: "authority_id",
              type: "select",
              label: "WORDS.COMPANY",
              width: 3,
              height: "input-sm",
              options: [],
              required:true, enabled:authId ? false : true, show:true
            },
            {
              id: "pec",
              type: "text",
              label: "PEC",
              width: 3,
              height: "input-sm",
              required:false, enabled:false, show:true
            }
          ],
          [
            {
              id: "request_date",
              type: "timestamp",
              label: "CORE_LBL.REQUEST_DATE",
              width: 4,
              height: "input-sm",
              hideTime: true,
              required: false, enabled: true, show: true
            },
            {
              id: "request_year",
              type: "text",
              label: "WORDS.YEAR",
              width: 4,
              height: "input-sm",
              required:false, enabled:false, show:true
            },
            {
              id: "protocol_company",
              type: "text",
              label: "ROADSITE.PROTOCOL_COMPANY",
              width: 4,
              height: "input-sm",
              required: false, enabled: true, show: true
            }
          ],
          [
            {
              id: "address_select",
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
              id: "address_multi",
              type: "multiselect",
              label: "WORDS.ADDRESS",
              width: 5,
              height: "input-sm",
              options: arrAddressMulti,
              onRemove: removeVia,
              required: true, enabled: true, show: true
            },
            {
              id: "town_multi",
              type: "multiselect",
              label: "WORDS.TOWN",
              width: 4,
              height: "input-sm",
              options: arrTownMulti,
              required: false, enabled: false, show: true
            }
          ]
        ]
      }
    ]
  };

  $scope.rsNoteFormCfg =
  {
    id:"rsNoteForm",
    fg:
    [
      {
        show:true, rows:
        [
          [
            {
              id: "note",
              type: "textarea",
              label: "WORDS.NOTE",
              width: 12,
              height: "input-sm",
              required:false, enabled:true, show:true
            }
          ]
        ]
      }
    ]
  };

  $scope.rsRequestFormCfg =
  {
    id:"rsRequestForm",
    fg:
    [
      {
        show:true, label:"ROADSITE.REQUEST_STATUS", rows:
        [
          [
            {
              id: "status_id",
              type: "select",
              label: "WORDS.STATUS",
              width: 4,
              height: "input-sm",
              options: rwContextSvc.getContext("roadsiteStatus"),
              required:false, enabled:false, show:true
            },
            {
              id: "protocol_request_date",
              type: "timestamp",
              label: "ROADSITE.PROTOCOL_REQUEST_DATE",
              width: 4,
              height: "input-sm",
              hideTime: true,
              required: false, enabled: false, show: true
            },
            {
              id: "protocol_request_number",
              type: "text",
              label: "ROADSITE.PROTOCOL_REQUEST_NUMBER",
              width: 4,
              height: "input-sm",
              required:false, enabled:false, show:true
            }
          ]
        ]
      }
    ]
  };

  $scope.rsApprovedFormCfg =
  {
    id:"rsApprovedForm",
    fg:
    [
      {
        show:true, rows:
        [
          [
            {
              id: "protocol_approved_date",
              type: "timestamp",
              label: "ROADSITE.PROTOCOL_APPROVED_DATE",
              width: 6,
              height: "input-sm",
              hideTime: true,
              required: false, enabled: false, show: true
            },
            {
              id: "protocol_approved_number",
              type: "text",
              label: "ROADSITE.PROTOCOL_APPROVED_NUMBER",
              width: 6,
              height: "input-sm",
              required: false, enabled: false, show: true
            }
          ]
        ]
      }
    ]
  };

  $scope.rsRoadsiteNoteAdminCfg =
  {
    id:"rsRoadsiteNoteAdmin",
    fg:
    [
      {
        show:true, rows:
        [
          [
            {
              id: "noteadmin",
              type: "textarea",
              label: "Note amministratore",
              width: 12,
              height: "input-sm",
              required: false,
              enabled: true,
              show: true
            }
          ]
        ]
      }
    ]
  };

  $scope.rsRoadsiteDate =
  {
    id:"rsRoadsiteDateForm",
    fg:
    [
      {
        show:true, rows:
        [
          [
            {
              id: "start_date",
              type: "timestamp",
              label: "CORE_LBL.START_DATE",
              width: 6,
              height: "input-sm",
              customErrMsg:"MOVE.START_DATE_GREATER_END_DATE",
              hideTime: true,
              required: true,
              enabled: true,
              show: true
            },
            {
              id: "end_date",
              type: "timestamp",
              label: "CORE_LBL.END_DATE",
              width: 6,
              height: "input-sm",
              hideTime: true,
              required: true,
              enabled: true,
              show: true
            }
          ]
        ]
      }
    ]
  };

  $scope.rsRoadsitePMCfg =
  {
    id:"rsRoadsitePMorm",
    fg:
    [
      {
        show:true, rows:
        [
          [
            {
              id: "notepm",
              type: "textarea",
              label: "Note polizia locale",
              width: 12,
              height: "input-sm",
              required: false,
              enabled: true,
              show: true
            }
          ]
        ]
      }
    ]
  };

  /* Scope function */
  $scope.rsListAlertDone = function(val)
  {
    if (val == 1 && $scope.rsListAlert.exe)
      $scope.rsListAlert.exe();
    else if (val == 0 && $scope.rsListAlert.exe0)
      $scope.rsListAlert.exe0();

    $scope.rsListAlert = {};
  };

  $scope.endDateGreaterNow = function()
  {
    if ($scope.selEnt && $scope.selEnt.end_date)
      return new Date($scope.selEnt.end_date).getTime() > new Date().getTime();
    else
      return false;
  }

  $scope.close = function()
  {
    if ($scope.selEnt)
      $scope.selEnt.restoreChangedKeys();
    //reset form
    $scope.roadsiteObjCtrl[$scope.rsFormCfg.id].reset();
    $scope.selEnt = null;
    $scope.showForm = false;
    $scope.headerCfg.closeDisabled = false;

    wgMapSvc.clearEditLayer();

    if($scope.btnPermission)
    {
      $scope.roadsiteTable.btAdd.disabled = false;
      $scope.roadsiteTable.btDel.disabled = true;
    }
    $scope.roadsiteTable.btUpd.disabled = true;

    $scope.roadsiteTable.reset++;
    $scope.roadsiteTable.reload++;


    $scope.projectAttach.file = null;
    $scope.authorizationAttach.file = null;
    $scope.coordCommunicationAttach.file = null;
    $scope.approvedAttach.file = null;

    $scope.geomDrawed = false;
  };

  $scope.save = function()
  {
    $scope.selEnt.address = arrAddressMulti.map(function(elem){return elem.name}).join(";");
    $scope.selEnt.town = arrTownMulti.map(function(elem){return elem.name}).join(";");

    // Check that the start date isn't earleier than the request date
    if ($scope.selEnt.start_date && $scope.selEnt.end_date && $scope.selEnt.request_date)
    {
      var rd = new Date($scope.selEnt.request_date).setHours(0,0,0,0);
      if (rd > $scope.selEnt.start_date || rd  > $scope.selEnt.end_date)
      {
        $scope.rsListAlert.msg = "ROADSITE.START_DATE_NOT_VALID";
        $scope.rsListAlert.style = "warning";
        $scope.rsListAlert.bt0 = "Ok";
        return;
      }
    }

    if ($scope.selEnt.start_date)
      $scope.selEnt.start_date = new Date($scope.selEnt.start_date).setHours(0,0,0,0);

    if ($scope.selEnt.end_date)
      $scope.selEnt.end_date = new Date($scope.selEnt.end_date).setHours(0,0,0,0);

    /* Check if start_date is less than end_date
    * otherwise show error
    */
    if($scope.selEnt.start_date && $scope.selEnt.end_date)
    {
      if($scope.selEnt.end_date < $scope.selEnt.start_date)
      {
        $scope.roadsiteObjCtrl[$scope.rsRoadsiteDate.id].showCustomErrOnField("start_date",true);
      }
      else
      {
        $scope.roadsiteObjCtrl[$scope.rsRoadsiteDate.id].showCustomErrOnField("start_date",false);
      }
    }
    else
    {
      $scope.roadsiteObjCtrl[$scope.rsRoadsiteDate.id].showCustomErrOnField("start_date",false);
    }

    /* Check data form validity */
    if (!$scope.roadsiteObjCtrl[$scope.rsFormCfg.id].isValid() ||
      !$scope.roadsiteObjCtrl[$scope.rsRoadsiteDate.id].isValid() ||
      !$scope.selEnt.address)
    {
      $scope.rsListAlert.msg = "CORE_LBL.NOT_VALID";
      $scope.rsListAlert.style = "warning";
      $scope.rsListAlert.bt0 = "Ok";
      return;
    }

    var chgObj = $scope.selEnt.changedKeys();

    /*Look for if entity has geom*/
    if (!$scope.selEnt.id && !$scope.selEnt.hasGeom && !chgObj.geoJson)
    {
      // Geom is mandatory
      $scope.rsListAlert.msg = "ROADSITE.GEOM_MANDATORY";
      $scope.rsListAlert.style = "warning";
      $scope.rsListAlert.bt0 = "Ok";
      return;
    }

    if (!chgObj)
    {
      $scope.rsListAlert.msg = "CORE_LBL.NO_CHANGES_MSG";
      $scope.rsListAlert.style = "info";
      $scope.rsListAlert.bt0 = "Ok";
      return;
    }

    /*Look for if entity has geom*/
    if(!$scope.selEnt.hasGeom && chgObj.geoJson) {
        chgObj.geoJson = undefined;
    }

    if (chgObj.geoJson)
    {
      // set map srid to changed object
      chgObj.srid = wgMapSvc.mapCurrSR.code;
    }

    $scope.loading = true;

    /* Save - insert or update */
    if (!$scope.selEnt.id)
    {
      // INSERT
      var urlIns = "/" + $scope.selEnt.getName() + "/0/insert";

      // Prepare payload
      var fd = new FormData();
      if ($scope.projectAttach.file)
      {
        fd.append("project_attach",$scope.projectAttach.file);
      }

      if ($scope.coordCommunicationAttach.file)
      {
        fd.append("coord_communication_attach",$scope.coordCommunicationAttach.file);
      }

      if ($scope.authorizationAttach.file)
      {
        fd.append("authorization_attach",$scope.authorizationAttach.file);
      }

      for (var key in chgObj)
      {
        // modify object into string to send via multipart/form-data
        if (key == 'geoJson')
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

      // Exec request
      $http.post(rwConfigSvc.urlPrefix+urlIns,fd,opt).then(
        function(res)
        {
          if (res && !res.data)
          {
            /* Show Alert Insert Error */
            $scope.rsListAlert.msg = "CORE_LBL.INSERT_ERR";
            $scope.rsListAlert.style = "danger";
            $scope.rsListAlert.bt0 = "Ok";
          }
          else if (res && res.data && res.data.result)
          {
            /* Show Alert Insert OK*/
            $scope.rsListAlert.msg = "CORE_LBL.INSERT_OK";
            $scope.rsListAlert.style = "info";
            $scope.rsListAlert.bt0 = "Ok";
            $scope.projectAttach.file = null;
            $scope.authorizationAttach.file = null;
            $scope.coordCommunicationAttach.file = null;

            $scope.selEnt.id = res.data.result.id;
            $scope.selEnt.x_min = res.data.result.x_min;
            $scope.selEnt.y_min = res.data.result.y_min;
            $scope.selEnt.x_max = res.data.result.x_max;
            $scope.selEnt.y_max = res.data.result.y_max;

            $scope.selEnt.updateChangedKeys();

            $scope.bSaved = true;

          }
          else
          {
            /* Show Alert Insert Error */
            $scope.rsListAlert.msg = "CORE_LBL.INSERT_ERR";
            $scope.rsListAlert.style = "danger";
            $scope.rsListAlert.bt0 = "Ok";
          }
          $scope.loading = false;
          $scope.geomDrawed = false;
        },
        function(err) {
          $scope.rsListAlert.msg = "CORE_LBL.INSERT_ERR";
          $scope.rsListAlert.style = "danger";
          $scope.rsListAlert.bt0 = "Ok";

          $scope.loading = false;
          $scope.geomDrawed = false;
        }
      );
    }
    else
    {
      // UPDATE
      var urlUpd = "/" + $scope.selEnt.getName() + "/" +$scope.selEnt.id +"/updateAndUpload";

      // Prepare payload
      var fd = new FormData();
      if ($scope.projectAttach.file)
      {
        fd.append("project_attach",$scope.projectAttach.file);
        fd.append("old_project_attach",$scope.selEnt._config['project_attach']);
      }

      if ($scope.coordCommunicationAttach.file)
      {
        fd.append("coord_communication_attach",$scope.coordCommunicationAttach.file);
        fd.append("old_coord_communication_attach",$scope.selEnt._config['coord_communication_attach']);
      }

      if ($scope.authorizationAttach.file)
      {
        fd.append("authorization_attach",$scope.authorizationAttach.file);
        fd.append("old_authorization_attach",$scope.selEnt._config['authorization_attach']);
      }

      if ($scope.approvedAttach.file)
      {
        fd.append("approved_attach",$scope.approvedAttach.file);
        fd.append("old_approved_attach",$scope.selEnt._config['approved_attach']);
      }

      for (var key in chgObj)
      {
        // modify object into string to send via multipart/form-data
        if (key == 'geoJson')
          fd.set(key, JSON.stringify(chgObj[key]));
        else
          fd.append(key,chgObj[key]);
      }

      fd.append("id",$scope.selEnt.id);

      // Configure request option
      var opt =
      {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      };

      // Exec request
      $http.post(rwConfigSvc.urlPrefix+urlUpd,fd,opt).then(
        function(res)
        {
          if (res && !res.data)
          {
            /* Show Alert Update Error */
            $scope.rsListAlert.msg = "CORE_LBL.UPDATE_ERR";
            $scope.rsListAlert.style = "danger";
            $scope.rsListAlert.bt0 = "Ok";
          }
          else if (res && res.data && res.data.result)
          {
            /* Show Alert Update OK*/
            $scope.selEnt.updateChangedKeys();

            $scope.selEnt.x_min = res.data.result.x_min;
            $scope.selEnt.y_min = res.data.result.y_min;
            $scope.selEnt.x_max = res.data.result.x_max;
            $scope.selEnt.y_max = res.data.result.y_max;

            $scope.rsListAlert.msg = "CORE_LBL.UPDATE_OK";
            $scope.rsListAlert.style = "info";
            $scope.rsListAlert.bt0 = "Ok";


            $scope.bSaved = true;

            $scope.projectAttach.file = null;
            $scope.authorizationAttach.file = null;
            $scope.coordCommunicationAttach.file = null;
            $scope.approvedAttach.file = null;
          }
          else
          {
            /* Show Alert Update Error */
            $scope.rsListAlert.msg = "CORE_LBL.UPDATE_ERR";
            $scope.rsListAlert.style = "danger";
            $scope.rsListAlert.bt0 = "Ok";
          }
          $scope.loading = false;
          $scope.geomDrawed = false;
        },
        function(err) {
          $scope.rsListAlert.msg = "CORE_LBL.UPDATE_ERR";
          $scope.rsListAlert.style = "danger";
          $scope.rsListAlert.bt0 = "Ok";

          $scope.loading = false;
          $scope.geomDrawed = false;
        }
      );
    }

    wgMapSvc.clearEditLayer();
    wgMapSvc.disableEdit();
    wgMapSvc.removeEditLayer();
  };

  $scope.clearFileSelection = function(element){
    angular.element("#"+element).val(null);
  };

  $scope.zoomTo = function(obj)
  {
    if (obj.x_min && obj.y_min && obj.x_max && obj.y_max)
    {
      // calculate bounding box
      var bbox = [obj.x_min, obj.y_min, obj.x_max, obj.y_max];

      // EPSG code is 32633
      wgMapSvc.zoomToBBox(bbox, 32633);

      /* Light on layer */
      var layId = wgMapSvc.getLayerIdByName("view_cantieri_aperti");
      if (layId) wgMapSvc.manageLayerVisibility(layId,true);
    }
  };

  $scope.drawRoadsite = function ()
  {
    var layerId   = wgMapSvc.getLayerIdByName("view_cantieri_aperti");
    var layerName = wgMapSvc.getLayerNameById(layerId)

    //Light on layer
    if (layerId)
      wgMapSvc.manageLayerVisibility(layerId,true);

    // set edit options
    var editOpt = {
      editProcess: wgMapSvc._EXTERN_EDIT_PROCESS_
      //multiGeom: true
    };

    // callback invoked on draw end operation
    var callbackEditFn = function()
    {
      // re-open panel
      $scope.headerCfg.minimized = false;

      // retrieve drawed feature
      var ft = wgMapSvc.getFeaturesFromEditLayer();

//       // check feature (we must have only one feature)
//       if (ft && (ft.length == 0 || ft.length > 1))
//       {
//         $scope.rsListAlert.msg = "CORE_MSG.ERR_EDIT_FEATURES";
//         $scope.rsListAlert.bt0 = "Ok";
//         $scope.rsListAlert.style = "danger";
//
//         return;
//       }

      var geoJsonFt = wgMapSvc.convertFeaturesToGeoJSON(ft);
      var geom      = null;

      try
      {
        var geoJson = JSON.parse(geoJsonFt);

        if (geoJson.features.length == 1) // single
          geom = geoJson.features[0].geometry;
        else // multi
        {
          // set right geometry type
          var type = geoJson.features[0].geometry.type.indexOf('Multi') == 0 ?
            geoJson.features[0].geometry.type :
            'Multi' + geoJson.features[0].geometry.type;

          geom = {type: type, coordinates:[]};

          for (var idx=0; idx<geoJson.features.length; idx++)
          {
            var itemG = geoJson.features[idx];

            geom.coordinates.push(itemG.geometry.coordinates);
          }
        }
      }
      catch(e)
      {
        // show error message
        $scope.rsListAlert.msg = "CORE_LBL.GEO_JSON_ERR";
        $scope.rsListAlert.bt0 = "Ok";
        $scope.rsListAlert.style = "danger";

        return;
      }

      // check if modified feature is into user authority boundary
      // (if user has EDIT_MAP_WITH_FEATURE_LIMIT permission)
      var opt = {
        geom: geom,
        srid: wgMapSvc.mapCurrSR.code,
        authId: $scope.selEnt.authority_id,
        layer: wgMapSvc.getLayerNameById(layerId)
      };

      wgMapSvc.validateFeatureInBoundary(opt, function(res)
      {
        if (res && res.message == "OUT_OF_BOUNDARY")
        {
          // show error message
          $scope.rsListAlert.msg = "CORE_LBL.FEATURE_OUT_OF_BOUNDARY";
          $scope.rsListAlert.bt0 = "Ok";
          $scope.rsListAlert.style = "danger";
          $scope.rsListAlert.exe0 = function ()
          {
            wgMapSvc.clearEditLayer();
          }
        }
        else if (res && res.message == "INTERSECTION_ERROR")
        {
          // show error message
          $scope.rsListAlert.msg = "CORE_LBL.INTERSECTION_ERROR";
          $scope.rsListAlert.bt0 = "Ok";
          $scope.rsListAlert.style = "danger";
          $scope.rsListAlert.exe0 = function ()
          {
            wgMapSvc.clearEditLayer();
          }
        }
        else
        {
          // set drawed geometry to entity
          $scope.selEnt.geoJson = geom;

          $scope.geomDrawed = true;

          // set extent to enable zoom on loaded feature
          var extent = ft[0].getGeometry().getExtent();

          $scope.selEnt.x_min = extent[0];
          $scope.selEnt.y_min = extent[1];
          $scope.selEnt.x_max = extent[2];
          $scope.selEnt.y_max = extent[3];

          $scope.selEnt.hasGeom = true;
        }
      });
    }

    // if entity has id, then we have to do an update -> get feature and zoom map on it
    if ($scope.selEnt.id)
    {
      var outputFormat = "application/json";
      var currentEPSGCode = 'EPSG:' + wgMapSvc.mapCurrSR.code;

      // build getFeature url specifying featureId value
      // (url prefix is added by rwHttpSvc)
      var getFeatureUrl =
        "/geoserver/"+rwConfigSvc.msWorkspace+"/wfs?SERVICE=WFS&VERSION=2.0.0" +
        "&REQUEST=GetFeature&typeNames="+rwConfigSvc.msWorkspace+":" + layerName +
        "&propertyName=geom" +
        "&outputFormat=" + outputFormat +
        "&featureId=" + $scope.selEnt.id +
        "&srsname=" + currentEPSGCode;

      // retrieve feature geometry to zoom on it
      rwHttpSvc.get(getFeatureUrl, function(res)
      {
        // there is only 1 feature returned from getFeature request, otherwise error
        if (res && res.features && res.features.length == 1)
        {
          // feature format for reading in geoJson format
          var geoJsonFormat = new ol.format.GeoJSON(
            {defaultDataProjection:currentEPSGCode}
          );

          // get features from response
          var features = geoJsonFormat.readFeatures(res);

          // get feature extent (we have only 1 feature!)
          if (features[0].getGeometry())
          {
            var extent = features[0].getGeometry().getExtent();

            // zoom map on feature
            wgMapSvc.zoomToBBox(extent, wgMapSvc.mapCurrSR.code);

            // set features to edit in edit option
            editOpt.features = features;
            editOpt.mode = wgMapSvc.editModeModify;
          }
          else
          {
            // in this case entity has no geom; set mode to insert
            editOpt.mode = wgMapSvc.editModeInsert;
          }

          // close panel
          $scope.headerCfg.minimized = true;

          // open edit gis panel with callback
          $rootScope.$broadcast("openGisEditPanelEvent", layerId, editOpt, callbackEditFn);
        }
        else
          console.error("Error on WFS getFeature request!");
      });
    }
    else
    {
      // set edit mode
      editOpt.mode = wgMapSvc.editModeInsert;

      // close panel
      $scope.headerCfg.minimized = true;

      // open edit gis panel with callback
      $rootScope.$broadcast("openGisEditPanelEvent", layerId, editOpt, callbackEditFn);
    }

  };

  //Delete geometry
  $scope.deleteGeom = function()
  {
    $scope.selEnt.hasGeom = false;
    $scope.geomDrawed = false;

    $scope.selEnt.geom = null;
    $scope.selEnt.x_min = null;
    $scope.selEnt.y_min = null;
    $scope.selEnt.x_max = null;
    $scope.selEnt.y_max = null;

    if ($scope.selEnt.id)
    {
      var chgObj = {};
      chgObj.geom = null;

      //Update
      var url = "/" + $scope.selEnt.getName() + "/update/" + $scope.selEnt.id;

      $scope.loading = true;

      rwHttpSvc.put(url,chgObj,function(res)
      {
        // remove edit layer from map
        wgMapSvc.removeEditLayer();

        if (res && res.result)
        {
          $scope.selEnt.x_min = res.result.x_min;
          $scope.selEnt.y_min = res.result.y_min;
          $scope.selEnt.x_max = res.result.x_max;
          $scope.selEnt.y_max = res.result.y_max;

          $scope.selEnt.updateChangedKeys();

          $scope.rsListAlert.msg = "CORE_LBL.UPDATE_OK";
          $scope.rsListAlert.style = "info";
          $scope.rsListAlert.bt0 = "Ok";
        }
        else
        {
          $scope.rsListAlert.msg = "CORE_LBL.UPDATE_ERR";
          $scope.rsListAlert.style = "danger";
          $scope.rsListAlert.bt0 = "Ok";

          $scope.selEnt.restoreChangedKeys();
        }

        $scope.loading= false;


      });
    }

  }

  // Manage download link
  $scope.download = function(idx)
  {
    var downloadUrl = "/geoserver/"+rwConfigSvc.msWorkspace+"/wfs?SERVICE=WFS&VERSION=2.0.0" +
    "&REQUEST=GetFeature&typeNames="+rwConfigSvc.msWorkspace+":view_cantieri_aperti"
    "&propertyName=geom";
    var outputFormat = "shape-zip";

    // build download url specifying featureId value
    $scope.gdDownloadUrl =
      rwConfigSvc.urlPrefix +
      downloadUrl +
      "&outputFormat=" + outputFormat +
      "&featureId=" + $scope.selEnt.id;
  };

  $scope.sendRequest = function()
  {
    $scope.rsListAlert.msg = "ROADSITE.SEND_REQUEST_CONFIRM";
    $scope.rsListAlert.style = "info";
    $scope.rsListAlert.bt0 = "No";
    $scope.rsListAlert.bt1 = "WORDS.YES";
    $scope.rsListAlert.exe = function()
    {
      /* Check data form validity */
      if (!$scope.selEnt.authorization_attach || !$scope.selEnt.project_attach)
      {
        $scope.rsListAlert.msg = "CORE_LBL.NOT_VALID";
        $scope.rsListAlert.style = "warning";
        $scope.rsListAlert.bt0 = "Ok";
        if (!$scope.selEnt.authorization_attach && !$scope.selEnt.project_attach)
        {
          $scope.mandatoryAuthorizationAttach = true;
          $scope.mandatoryProjectAttach = true;
          return;
        }
        else if (!$scope.selEnt.authorization_attach)
        {
          $scope.mandatoryAuthorizationAttach = true;
          return;
        }
        else
        {
          $scope.mandatoryProjectAttach = true;
          return;
        }
      }
      else
      {
        $scope.mandatoryApproveAttach = false;
        $scope.mandatoryProjectAttach = false;
      }

      $scope.selEnt.status_id = 2;

      var chgObj = $scope.selEnt.changedKeys();

      /*Look if entity has geom*/
      if(!$scope.selEnt.hasGeom && chgObj.geoJson) {
          chgObj.geoJson = undefined;
      }

      if (chgObj.geoJson)
      {
        // set map srid to changed object
        chgObj.srid = wgMapSvc.mapCurrSR.code;
      }

      var docsToSend = [];

      if ($scope.selEnt.authorization_attach)
        docsToSend.push($scope.selEnt.authorization_attach);

      if ($scope.selEnt.project_attach)
        docsToSend.push($scope.selEnt.project_attach);

      if ($scope.selEnt.coord_communication_attach)
        docsToSend.push($scope.selEnt.coord_communication_attach);

      if (docsToSend.length)
        chgObj.docsToSend = docsToSend;
      else
        return; // nothing to send

      chgObj.authority = authorities.find(function(auth){return auth.id == $scope.selEnt.authority_id;}).name;
      chgObj.piva = authorities.find(function(auth){return auth.id == $scope.selEnt.authority_id;}).vat;
      chgObj.emailAuth =  authorities.find(function(auth){return auth.id == $scope.selEnt.authority_id;}).pec;
      chgObj.address = $scope.selEnt.address;
      chgObj.town = $scope.selEnt.town;

      // Prepare payload
      var fd = new FormData();
      if ($scope.projectAttach.file)
      {
        fd.append("project_attach",$scope.projectAttach.file);
        fd.append("old_project_attach",$scope.selEnt._config['project_attach']);
      }

      if ($scope.coordCommunicationAttach.file)
      {
        fd.append("coord_communication_attach",$scope.coordCommunicationAttach.file);
        fd.append("old_coord_communication_attach",$scope.selEnt._config['coord_communication_attach']);
      }

      if ($scope.authorizationAttach.file)
      {
        fd.append("authorization_attach",$scope.authorizationAttach.file);
        fd.append("old_authorization_attach",$scope.selEnt._config['authorization_attach']);
      }

      for (var key in chgObj)
      {
        // modify object into string to send via multipart/form-data
        if (key == 'geoJson' || key == 'docsToSend')
          fd.set(key, JSON.stringify(chgObj[key]));
        else
          fd.append(key,chgObj[key]);
      }

      fd.append("id",$scope.selEnt.id);


      $scope.loading = true;
      var url = "/" + $scope.selEnt.getName() + "/" +$scope.selEnt.id + "/sendRequest";


      // Configure request option
      var opt =
      {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      };

      // Exec request
      $http.post(rwConfigSvc.urlPrefix+url,fd,opt).then(
        function(res)
        {
          $scope.loading = false;
          $scope.geomDrawed = false;

          if (res && !res.data)
          {
            /* Show Alert Error */
            $scope.rsListAlert.msg = "ROADSITE.PROTOCOL_ERROR";
            $scope.rsListAlert.style = "warning";
            $scope.rsListAlert.bt0 = "Ok";
            $scope.rsListAlert.exe0 = function()
            {
              $scope.selEnt.restoreChangedKeys();
            };
          }
          else if (res && res.data && res.data.error && res.data.error == "ERROR_SEND_PEC")
          {
            /* Show Alert Update OK but ERROR on send PEC */

            //save number protocol and protocol_date
            $scope.selEnt.protocol_request_number = res.data.result.protocol_request_number;
            $scope.selEnt.protocol_request_date = res.data.result.protocol_request_date;
            $scope.selEnt.updateChangedKeys();

            $scope.projectAttach.file = null;
            $scope.authorizationAttach.file = null;
            $scope.coordCommunicationAttach.file = null;
            $scope.approvedAttach.file = null;

            $scope.rsListAlert.msg = "ROADSITE.UPDATE_OK_ERROR_PEC";
            $scope.rsListAlert.style = "warning";
            $scope.rsListAlert.bt0 = "Ok";
          }
          else if (res && res.data && res.data.result)
          {
            /* Show Alert  OK*/

          //save number protocol and protocol_date
            $scope.selEnt.protocol_request_number = res.data.result.protocol_request_number;
            $scope.selEnt.protocol_request_date = res.data.result.protocol_request_date;
            $scope.selEnt.updateChangedKeys();

            $scope.projectAttach.file = null;
            $scope.authorizationAttach.file = null;
            $scope.coordCommunicationAttach.file = null;
            $scope.approvedAttach.file = null;

          }
          else
          {
            /* Show Alert Error */
            $scope.rsListAlert.msg = "ROADSITE.PROTOCOL_ERROR";
            $scope.rsListAlert.style = "warning";
            $scope.rsListAlert.bt0 = "Ok";
            $scope.rsListAlert.exe0 = function()
            {
              $scope.selEnt.restoreChangedKeys();
            };
          }
        },
        function(err) {
          $scope.rsListAlert.msg = "ROADSITE.PROTOCOL_ERROR";
          $scope.rsListAlert.style = "warning";
          $scope.rsListAlert.bt0 = "Ok";
          $scope.rsListAlert.exe0 = function()
          {
            $scope.selEnt.restoreChangedKeys();
          };
          $scope.loading = false;
          $scope.geomDrawed = false;
        }
      );
    };
  };

  $scope.setUrl = function(attach)
  {
    var aURL = [
      rwConfigSvc.urlPrefix,
      "roadsite",
      $scope.selEnt.id,
      "download",
      $scope.selEnt[attach]
    ];

    switch(attach)
    {
      case 'project_attach':
        $scope.projectAttachUrl = aURL.join("/") + "?it_app_auth=" + rwAuthSvc.token;
        break;

      case 'authorization_attach':
        $scope.authorizationAttachUrl = aURL.join("/") + "?it_app_auth=" + rwAuthSvc.token;
        break;

      case 'coord_communication_attach':
        $scope.coordCommunicationAttachUrl = aURL.join("/") + "?it_app_auth=" + rwAuthSvc.token;
        break;

      case 'approved_attach':
        $scope.approvedAttachUrl = aURL.join("/") + "?it_app_auth=" + rwAuthSvc.token;
        break;
    }

  };

  $scope.approve = function(bool)
  {
    $scope.rsListAlert.msg = bool == 0 ? "ROADSITE.REJECT_REQUEST_CONFIRM" : "ROADSITE.APPROVE_REQUEST_CONFIRM";
    $scope.rsListAlert.style = "info";
    $scope.rsListAlert.bt0 = "No";
    $scope.rsListAlert.bt1 = "WORDS.YES";
    $scope.rsListAlert.exe = function()
    {

      /* Check data form validity */
      if (!$scope.selEnt.approved_attach)
      {
        // $scope.rsListAlert.msg = "CORE_LBL.NOT_VALID";
        // $scope.rsListAlert.style = "warning";
        // $scope.rsListAlert.bt0 = "Ok";
        $scope.mandatoryApproveAttach = true;
        return;
      }
      else
        $scope.mandatoryApproveAttach = false;

      $scope.selEnt.status_id = bool == 0 ?  4 : 3;
      $scope.selEnt.approved_user_id = rwAuthSvc.userInfo.id;

      var chgObj = $scope.selEnt.changedKeys();

      chgObj.authority = authorities.find(function(auth){return auth.id == $scope.selEnt.authority_id;}).name;
      chgObj.piva = authorities.find(function(auth){return auth.id == $scope.selEnt.authority_id;}).vat;
      chgObj.approved_attach = $scope.selEnt.approved_attach;
      chgObj.emailAuth =  authorities.find(function(auth){return auth.id == $scope.selEnt.authority_id;}).pec;
      chgObj.address = $scope.selEnt.address;
      chgObj.town = $scope.selEnt.town;
      chgObj.protocol_request_number = $scope.selEnt.protocol_request_number;

      $scope.loading = true;
      var url = "/" + $scope.selEnt.getName() + "/" +$scope.selEnt.id +"/approve";

      // Prepare payload
      var fd = new FormData();

      for (var key in chgObj)
      {
        fd.append(key,chgObj[key]);
      }
      if ($scope.approvedAttach.file)
      {
        fd.append("approved_attach",$scope.approvedAttach.file);
      }
      fd.append("id",$scope.selEnt.id);

      // Configure request option
      var opt =
      {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      };

      $scope.loading = true;
      // Exec request
      $http.post(rwConfigSvc.urlPrefix+url,fd,opt).then(
        function(res)
        {
          $scope.loading = false;
          if (res && !res.data)
          {
            /* Show Alert Error */
            $scope.rsListAlert.msg = "ROADSITE.PROTOCOL_ERROR";
            $scope.rsListAlert.style = "warning";
            $scope.rsListAlert.bt0 = "Ok";
            $scope.rsListAlert.exe0 = function()
            {
              $scope.selEnt.restoreChangedKeys();
            };
          }
          else if (res && res.data && res.data.error)
          {

            if (res.data.error == 'ERROR_SEND_PEC') // error send pec
            {
              //save number protocol and protocol_date
              $scope.selEnt.protocol_approved_number = res.data.result.protocol_approved_number;
              $scope.selEnt.protocol_approved_date = res.data.result.protocol_approved_date;
              $scope.selEnt.updateChangedKeys();

              $scope.rsListAlert.msg = "ROADSITE.UPDATE_OK_ERROR_PEC";
              $scope.rsListAlert.style = "warning";
              $scope.rsListAlert.bt0 = "Ok";
            }
            else //Generic error
            {
              /* Show Alert Error */
              $scope.rsListAlert.msg = "ROADSITE.PROTOCOL_ERROR";
              $scope.rsListAlert.style = "warning";
              $scope.rsListAlert.bt0 = "Ok";
              $scope.rsListAlert.exe0 = function()
              {
                $scope.selEnt.restoreChangedKeys();
              };
            }

          }
          else if (res && res.data && res.data.result)
          {
            //save number protocol and protocol_date
            $scope.selEnt.protocol_approved_number = res.data.result.protocol_approved_number;
            $scope.selEnt.protocol_approved_date = res.data.result.protocol_approved_date;
            $scope.selEnt.updateChangedKeys();

          }
          else
          {
            /* Show Alert Error */
            $scope.rsListAlert.msg = "ROADSITE.PROTOCOL_ERROR";
            $scope.rsListAlert.style = "warning";
            $scope.rsListAlert.bt0 = "Ok";
            $scope.rsListAlert.exe0 = function()
            {
              $scope.selEnt.restoreChangedKeys();
            };
          }
        },
        function(err) {

          /* Show Alert Error */
          $scope.rsListAlert.msg = "ROADSITE.PROTOCOL_ERROR";
          $scope.rsListAlert.style = "warning";
          $scope.rsListAlert.bt0 = "Ok";
          $scope.rsListAlert.exe0 = function()
          {
            $scope.selEnt.restoreChangedKeys();
          };

          $scope.loading = false;
        }
      );
    };
  }

  // function invoked on show user btn
  $scope.showRoadsite = function()
  {
    showRoadsiteOnMap = !showRoadsiteOnMap;

    if (showRoadsiteOnMap)
    {
      objRoadsiteOnMap = $scope.selEnt.geojson;

      if (objRoadsiteOnMap)
      {
        wgMapSvc.addDataOnTemporaryLayer({
          geoJson: objRoadsiteOnMap
        });

        $scope.showRoadsiteBtnClass = "btn-info";
        $scope.zoomTo($scope.selEnt);
      }
      else
      {
        // TODO manage error
        console.error("Error on loading roadsite to show on the map");

        showRoadsiteOnMap = !showRoadsiteOnMap;
      }
    }
    else
    {
      resetRoadsiteOnMap();
      $scope.selEnt = null;

      if($scope.btnPermission)
      {
        $scope.roadsiteTable.btAdd.disabled = false;
        $scope.roadsiteTable.btDel.disabled = true;
      }
      $scope.roadsiteTable.btUpd.disabled = true;

      $scope.roadsiteTable.reset++;
      $scope.disableShowButton = true;
    }
  }

  /*
   * Watch Functions
   */
  var getFile = $scope.$watch(function(){return $scope.geodataFile.file}, function(newObj,oldObj)
  {
    if (newObj == undefined || angular.equals("null",newObj))
      return;

    // Prepare payload
    var fd = new FormData();

    if ($scope.geodataFile.file)
    {
      fd.append("file[]", $scope.geodataFile.file);
    }

    // Configure request option
    var opt = {
      transformRequest: angular.identity,
      headers: {'Content-Type': undefined}
    };

    // load shape URL
    var url = "/roadsite/loadShape";

    $scope.loading = true;

    $http.post(rwConfigSvc.urlPrefix+url, fd, opt).then(
      function(res){
        $scope.geodataFile = {};

        $scope.loading = false;

        if (res && res.data && res.data.result)
        {
          // get roadsite layer id
          var layerId = wgMapSvc.getLayerIdByName("view_cantieri_aperti");

          // add edit layer on map
          wgMapSvc.addEditLayer();

          // add data on edit layer (returned geoJson is in EPSG 4326; if necessary, it is reprojected)
          wgMapSvc.addDataOnEditLayer({
            geoJson: res.data.result
          });

          // check if loaded feature is into user authority boundary
          // (if user has EDIT_MAP_WITH_FEATURE_LIMIT permission)
          // retrieve drawed feature from edit layer in current map EPSG
          var ft = wgMapSvc.getFeaturesFromEditLayer();

          // check feature (we must have only one feature)
          if (ft && (ft.length == 0 || ft.length > 1))
          {
            $scope.rsListAlert.msg = "CORE_MSG.ERR_EDIT_FEATURES";
            $scope.rsListAlert.bt0 = "Ok";
            $scope.rsListAlert.style = "danger";

            return;
          }

          var geoJsonFt = wgMapSvc.convertFeaturesToGeoJSON(ft);
          var geom    = null;

          try
          {
            var geoJson = JSON.parse(geoJsonFt);
            geom = geoJson.features[0].geometry;
          }
          catch(e)
          {
            // show error message
            $scope.rsListAlert.msg = "CORE_LBL.GEO_JSON_ERR";
            $scope.rsListAlert.bt0 = "Ok";
            $scope.rsListAlert.style = "danger";

            return;
          }

          var vOpt = {
            geom: geom,
            srid: wgMapSvc.mapCurrSR.code,
            authId: $scope.selEnt.authority_id,
            layer: wgMapSvc.getLayerNameById(layerId)
          };

          wgMapSvc.validateFeatureInBoundary(vOpt, function(res)
          {
            $scope.loading = false;

            if (res && res.message == "OUT_OF_BOUNDARY")
            {
              // show error message
              $scope.rsListAlert.msg = "CORE_LBL.FEATURE_OUT_OF_BOUNDARY";
              $scope.rsListAlert.bt0 = "Ok";
              $scope.rsListAlert.style = "danger";
              $scope.rsListAlert.exe0 = function ()
              {
                wgMapSvc.clearEditLayer();
              }
            }
            else if (res && res.message == "INTERSECTION_ERROR")
            {
              // show error message
              $scope.rsListAlert.msg = "CORE_LBL.INTERSECTION_ERROR";
              $scope.rsListAlert.bt0 = "Ok";
              $scope.rsListAlert.style = "danger";
              $scope.rsListAlert.exe0 = function ()
              {
                wgMapSvc.clearEditLayer();
              }
            }
            else
            {
              $scope.geomDrawed = true;

              // set extent to enable zoom on loaded feature
              var extent = ft[0].getGeometry().getExtent();

              $scope.selEnt.x_min = extent[0];
              $scope.selEnt.y_min = extent[1];
              $scope.selEnt.x_max = extent[2];
              $scope.selEnt.y_max = extent[3];

              $scope.selEnt.hasGeom = true;

              $scope.rsListAlert.msg = "CORE_MSG.SHP_LOAD_OK";
              $scope.rsListAlert.style = "info";
              $scope.rsListAlert.bt0 = "Ok";

              // set drawed geometry to entity
              $scope.selEnt.geoJson = geom;
            }
          });

        }
        else
        {
          $scope.rsListAlert.msg = (res.data && res.data.error) ? getShpErrMsg(res.data.error) : "CORE_MSG.SHP_LOAD_ERR";
          $scope.rsListAlert.style = "danger";
          $scope.rsListAlert.bt0 = "Ok";

          $scope.loading = false;
        }
      },
      function(err){

        $scope.rsListAlert.msg = "CORE_MSG.SHP_LOAD_ERR";
        $scope.rsListAlert.style = "danger";
        $scope.rsListAlert.bt0 = "Ok";

        $scope.loading = false;
        $scope.geodataFile = {};
      }
    );

  });

  $scope.$watch("projectAttach.file", function(newObj,oldObj)
  {
    if (!newObj)
      return;

    $scope.selEnt.project_attach = newObj.name;
    $scope.mandatoryProjectAttach = false;
  });

  $scope.$watch("authorizationAttach.file", function(newObj,oldObj)
  {
    if (!newObj)
      return;

    $scope.selEnt.authorization_attach = newObj.name;
    $scope.mandatoryAuthorizationAttach = false;
  });

  $scope.$watch("coordCommunicationAttach.file", function(newObj,oldObj)
  {
    if (!newObj)
      return;

    $scope.selEnt.coord_communication_attach = newObj.name;
  });

  $scope.$watch("approvedAttach.file", function(newObj,oldObj)
  {
    if (!newObj)
      return;

    $scope.selEnt.approved_attach = newObj.name;
    $scope.mandatoryApproveAttach = false;
  });

  $scope.$on("$destroy",function()
  {
    // Unbind Watches
    getFile();

    // get scope of wgEditCtrl
    var mapScope = angular.element('#mapDiv').scope();

    // check if edit panel is open
    if (mapScope.enabledToolId == 'edit')
    {
      // invoke map scope to close edit panel
      mapScope.getControl({id:'edit', tip:'WEBGIS.TLP.CTRL_EDIT'});
    }

    wgMapSvc.clearEditLayer();
    wgMapSvc.disableEdit();
    wgMapSvc.removeEditLayer();

    wgMapSvc.removeTemporaryLayer();
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


      // $scope.roadsiteTable.search.advanced.source[1].values = aUserCtx;-
      $scope.searchCfg.advanced.source[1].values = aUserCtx;
      // $scope.roadsiteTable.columns[1].source = aUserCtx;
      $scope.rsFormCfg.fg[0].rows[0][0].options = aUserCtx;
      $scope.rsApprovedFormCfg.fg[0].rows[0][0].options = aUserCtx;
    });
  }

  function getShpErrMsg(errorCode)
  {
    var errMsg = "CORE_MSG.SHP_LOAD_ERR";

    switch(errorCode)
    {
      case 1: errMsg = "CORE_MSG.SHP_NO_FILE_ERR"; break;
      case 2: errMsg = "CORE_MSG.SHP_OPEN_ERR"; break;
      case 3: errMsg = "CORE_MSG.SHP_MORE_GEOM_ERR"; break;
      case 4: errMsg = "CORE_MSG.SHP_GEOM_TYPE_ERR"; break;
      case 5: errMsg = "CORE_MSG.SHP_FEATURE_ERR"; break;
      case 6: errMsg = "CORE_MSG.SHP_PARSE_ERR"; break;
    }

    return errMsg;
  }

  function loadAuthority(callback)
  {
    authorities = [];
    // Retrieve authority Manutenzione strade
    var body = {
      filter:{
        rules:["function_id|EQ|1","enabled|EQ|true"],
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

  // remove roadsite from map
  function resetRoadsiteOnMap()
  {
    if (objRoadsiteOnMap)
    {
      var arrayId = [];

      for (var idx=0, len=objRoadsiteOnMap.features.length; idx<len; idx++)
        arrayId.push(objRoadsiteOnMap.features[idx].id);

      wgMapSvc.removeFeaturesFromTemporaryLayer(arrayId);

      objRoadsiteOnMap = null;

      $scope.showRoadsiteBtnClass = "btn-default";
    }

    showRoadsiteOnMap = false;
  }

  loadUser();
  loadAuthority(function(res)
  {
    $scope.searchCfg.advanced.source[0].values = res;
    $scope.rsFormCfg.fg[0].rows[0][2].options = res;
  });
}
