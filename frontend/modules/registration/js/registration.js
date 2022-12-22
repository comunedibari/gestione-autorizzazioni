/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("registration",["core"])
  .factory("Registration",registrationFact)
  .service("registrationSvc",registrationSvc)
  .service("regModelSvc",regModelSvc);

  function registrationFact(RWEntity,rwContextSvc,User,Authority,Authorization)
  {
    Registration.prototype = new RWEntity();

    function Registration(cfg)
    {
      RWEntity.call(this,cfg,["id","user_id","authority_id","approved","approved_date",
        "approved_user_id",]);
      this.hasDetail = false;
    };

    Registration.prototype.update = function(cfg)
    {
      RWEntity.prototype.update.call(this,cfg);

      /*User*/
      this.user = cfg.user ? new User(cfg.user) : new User({});

      /*Authority*/
      this.authority = cfg.authority ? new Authority(cfg.authority) : new Authority({});

      /*Authorization*/
      this.authorization = cfg.authorization ? new Authorization(cfg.authorization) : new Authorization({});

    };

    Registration.prototype.changedKeys = function()
    {
      var retObj = RWEntity.prototype.changedKeys.call(this);

      if (this.user.changedKeys())
      {
        if(!retObj)
          retObj = {};
        retObj.user = this.user.changedKeys();
      }

      if (this.authority.changedKeys())
      {
        if(!retObj)
          retObj = {};
        retObj.authority = this.authority.changedKeys();
      }

      if (this.authorization.changedKeys())
      {
        if(!retObj)
          retObj = {};
        retObj.authorization = this.authorization.changedKeys();
      }

      // Reset retObj to null
      if (retObj && Object.keys(retObj).length == 0)
      retObj = null;

    return retObj;
    }

    Registration.prototype.updateChangedKeys = function()
    {
      RWEntity.prototype.updateChangedKeys.call(this);

      this.user.updateChangedKeys();

      this.authority.updateChangedKeys();

      this.authorization.updateChangedKeys();

    };

    Registration.prototype.restoreChangedKeys = function()
    {
      RWEntity.prototype.restoreChangedKeys.call(this);

      this.user.restoreChangedKeys();

      this.authority.restoreChangedKeys();

      this.authorization.restoreChangedKeys();
    };

    Registration.prototype.getName = function()
    {
      return "registration";
    };

    return Registration;
  }

function registrationSvc(Registration)
{
  var selRegistration= null;
  //Dictionary registration modal instance
  var regModInstDict = {};

  /*
    * Open sheet for given forest fire
    */
  this.openModal = function(reg)
  {
    if (!reg)
      return;

    if (!(reg instanceof Registration))
    reg = new Registration(ff);

    /* Look for existing modal */
    var regId = reg.id || "_new_";

    if (regModInstDict[regId])
      return;

    /* Open new modal */
    regModInstDict[regId] = $uibModal.open({
      windowClass: "modaless",
      templateUrl: "modules/registration/views/request.html",
      controller: "requestCtrl",
      backdrop: false,
      keyboard: false,
      resolve: {entity: reg},
      size: "lg"
    });

    fireModInstDict[ffId].result.then(function()
    {
      delete fireModInstDict[ffId];
    });
  };

  this.setRegMod = function(reg,modal)
  {
    var regId = reg.id || "_new_";
    regModInstDict[regId] = modal;

    regModInstDict[regId].result.then(function()
    {
      delete regModInstDict[regId];
    });
  };

}

function regModelSvc(rwHttpSvc)
{
  this.loadDetail = function(entity,callback)
  {
    var url = "/"+entity.getName()+"/detail/"+entity.id;

    rwHttpSvc.get(url,function(res)
    {
      if (res && res.result)
      {
        entity.update(res.result);
        entity.hasDetail = true;
        callback(null);
      }
      else
      {
        callback({
          msg: "CORE_LBL.DETAIL_ERR",
          style: "danger",
          btClose: "WORDS.CLOSE"
        });
      }
    });
  };

  this.save = function(entity,callback)
  {
    if (entity.id)
      this.update(entity,callback);
    else
      this.insert(entity,callback);
  };

  this.insert = function(entity,callback)
  {
    var url = "/"+entity.getName()+"/insert";

    rwHttpSvc.post(url,entity.changedKeys(),function(res)
    {
      if (res && res.result && res.result.id)
      {
        entity.id = res.result.id;
        entity.updateChangedKeys();

        callback(null,{reload:true});
      }
      else
        callback("CORE_LBL.INSERT_ERR",{});
    });
  };

  this.update = function(entity,callback)
  {
    var url = "/"+entity.getName()+"/update/"+entity.id;

    rwHttpSvc.put(url,entity.changedKeys(),function(res)
    {
      if (res && res.result)
      {
        entity.updateChangedKeys();
        callback(null,{});
      }
      else
        callback("CORE_LBL.UPDATE_ERR",{});
    });
  };

  this.logdel = function(entity,callback)
  {
    var url = "/"+entity.getName()+"/logdel/"+entity.id;

    rwHttpSvc.delete(url,function(res)
    {
      callback((res && res.result) ? null : {
        msg: "CORE_LBL.DELETE_ERR",
        style: "danger",
        btClose: "WORDS.CLOSE"
      });
    });
  };

  this.delete = function(entity,callback)
  {
    var url = "/"+entity.getName()+"/delete/"+entity.id;

    rwHttpSvc.delete(url,function(res)
    {
      callback((res && res.result) ? null : {
        msg: "CORE_LBL.DELETE_ERR",
        style: "danger",
        btClose: "WORDS.CLOSE"
      });
    });
  };
}