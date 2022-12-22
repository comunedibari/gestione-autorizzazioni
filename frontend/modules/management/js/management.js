/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("management",["core"])
  .factory("User",userEntity)
  .factory("Role",roleEntity)
  .factory("UserInfo",userInfoEntity)
  .factory("Authority",authorityFactory)
  .factory("Authorization",authorizationFactory)
  .service("urModelSvc",urModelSvc);

/*
 * Entities.
 */
function userEntity()
{
  function User(cfg)
  {
    this.hasDetail = false;
    this.entityName = "user";

    this.update(cfg);
  };

  User.prototype.update = function(cfg)
  {
    if (!cfg)
      cfg = {};

    this.id = cfg.id;
    this.name = cfg.name;
    this.role = cfg.role ? cfg.role[0] : null;
    this.role_name = cfg.role_name ? cfg.role_name[0] : null;
    this.phone = cfg.phone;
    this.email = cfg.email;
    this.surname = cfg.surname;
    this.username = cfg.username;
    this.authority_id = cfg.authority_id;
    this.authority_name = cfg.authority_name;
    this.title_id = cfg.title_id;
    this.enabled = cfg.enabled;
    this.cf = cfg.cf;
    this.creation_date = cfg.creation_date ? new Date(cfg.creation_date) : null;

    this.config = cfg;
    this.oldRole = this.role;
    this.fullname = cfg.name+" "+cfg.surname;
  };

  User.prototype.changedKeys = function()
  {
    var aKey = ["name","surname","username","phone","email","authority_id",
      "title_id","enabled","cf"],
      retObj = {};

    for (var i = 0;i < aKey.length;i++)
    {
      var key = aKey[i];

      if (this[key] != this.config[key])
        retObj[key] = this[key];
    }

    // Manage role
    if (this.oldRole != this.role)
    {
      retObj.role = {add:[], del:[]};

      if (this.role)
        retObj.role.add.push(this.role);
      if (this.oldRole)
        retObj.role.del.push(this.oldRole);
    }

    // Ok
    return angular.equals({},retObj) ? null : retObj;
  };

  User.prototype.updateChangedKeys = function()
  {
    this.oldRole = this.role;
    this.fullname = this.name+" "+this.surname;

    this.config.id = this.id;
    this.config.name = this.name;
    this.config.role = [this.role];
    this.config.role_name = [this.role_name];
    this.config.phone = this.phone;
    this.config.email = this.email;
    this.config.surname = this.surname;
    this.config.username = this.username;
    this.config.authority_id = this.authority_id;
    this.config.authority_name = this.authority_name;
    this.config.title_id = this.title_id;
    this.config.enabled = this.enabled;
    this.config.cf = this.cf;
  };

  User.prototype.restoreChangedKeys = function()
  {
    this.update(this.config);
  };

  return User;
}

function roleEntity()
{
  function Role(cfg)
  {
    this.entityName = "role";
    this.update(cfg);
  };

  Role.prototype.update = function(cfg)
  {
    if (!cfg)
      cfg = {};
    if (!cfg.permission)
      cfg.permission = [];

    this.id = cfg.id;
    this.name = cfg.name;
    this.descr = cfg.descr;
    this.readonly = cfg.readonly;
    this.config = cfg;
    this.permObj = {};

    // Process permission
    for (var i = 0;i < cfg.permission.length;i++)
      this.permObj[cfg.permission[i]] = true;
  };

  Role.prototype.changedKeys = function()
  {
    var aKey = ["name","descr"],
      retObj = {permission: {add:[],del:[]}};

    for (var i = 0;i < aKey.length;i++)
    {
      var key = aKey[i];

      if (this[key] != this.config[key])
        retObj[key] = this[key];
    }

    // Look for permission
    for (var key in this.permObj)
    {
      var pId = key*1, pVal = this.permObj[key];

      if (pVal == false && this.config.permission.indexOf(pId) >= 0)
        retObj.permission.del.push(pId);
      else if (pVal == true && this.config.permission.indexOf(pId) < 0)
        retObj.permission.add.push(pId);
    }

    if (!retObj.permission.add.length && !retObj.permission.del.length)
      delete retObj.permission;

    // Ok
    return angular.equals({},retObj) ? null : retObj;
  };

  Role.prototype.updateChangedKeys = function()
  {
    this.config.id = this.id;
    this.config.name = this.name;
    this.config.descr = this.descr;

    for (var key in this.permObj)
    {
      if (this.permObj[key] == true)
        this.config.permission.push(key*1);
      else
        delete this.permObj[key];
    }
  };

  Role.prototype.restoreChangedKeys = function()
  {
    this.update(this.config);
  };

  return Role;
}

function userInfoEntity(md5)
{
  function UserInfo(cfg)
  {
    this.update(cfg);
  };

  UserInfo.prototype.update = function(cfg)
  {
    if (!cfg)
      cfg = {};

    this.id = cfg.id;
    this.name = cfg.name;
    this.phone = cfg.phone;
    this.email = cfg.email;
    this.surname = cfg.surname;
    this.username = cfg.username;
    this.password = cfg.password;
    this.authority_id = cfg.authority_id;

    this.config = cfg;
    this.newPwd1 = null;
    this.newPwd2 = null;
    this.strRole = (cfg.role && cfg.role.length) ? cfg.role[0].name : null;
  };

  UserInfo.prototype.changedKeys = function()
  {
    var aKey = ["name","phone","email","surname"],
      retObj = {};

    for (var i = 0;i < aKey.length;i++)
    {
      var key = aKey[i];

      if (this[key] != this.config[key])
        retObj[key] = this[key];
    }

    if (this.newPwd1 && this.newPwd2 && this.newPwd1 == this.newPwd2)
    {
      this.password = md5.createHash(this.username+this.newPwd1);
      retObj.signature = this.password;
    }

    return angular.equals({},retObj) ? null : retObj;
  };

  UserInfo.prototype.updateChangedKeys = function()
  {
    this.newPwd1 = null;
    this.newPwd2 = null;

    this.config.name = this.name;
    this.config.phone = this.phone;
    this.config.email = this.email;
    this.config.surname = this.surname;
    this.config.password = this.password;
  };

  UserInfo.prototype.restoreChangedKeys = function()
  {
    this.update(this.config);
  };

  return UserInfo;
}

function authorityFactory(RWEntity,Authorization)
{
  Authority.prototype = new RWEntity();

  function Authority(cfg)
  {
    RWEntity.call(this,cfg,["id","name","geom","vat","enabled","function_id",
    "address","address_number","municipality","phone","approved_user_id",
    "approved_date","email","pec"]);
    this.entityName = "authority";
  };

  Authority.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    /* Authorization */
    this.authorization = cfg.authorization ? new Authorization(cfg.authorization) : null;

    /* History authorization */
    this.authorizationHistory = cfg.authorizationHistory || [] ;

  };

  Authority.prototype.updateChangedKeys = function()
  {
    RWEntity.prototype.updateChangedKeys.call(this);

    if (this.authorization)
      this.authorization.updateChangedKeys();
  };

  Authority.prototype.restoreChangedKeys = function()
  {
    RWEntity.prototype.restoreChangedKeys.call(this);

    /* Restore authorization*/
    if (this.authorization)
      this.authorization.restoreChangedKeys();

  };

  Authority.prototype.getName = function()
  {
    return "authority";
  };

  return Authority;
}

function authorizationFactory(RWEntity)
{
  Authorization.prototype = new RWEntity();

  function Authorization(cfg)
  {
    RWEntity.call(this,cfg,["id","start_date","end_date","auth_protocol",
    "auth_attach", "authority_id"]);
    this.entityName = "authorization";
  };

  Authorization.prototype.getName = function()
  {
    return "authorization";
  };

  return Authorization;
}

/*
 * Services.
 */
function urModelSvc(rwHttpSvc)
{
  this.loadDetail = function(entity,callback)
  {
    var url = "/"+entity.entityName+"/detail/"+entity.id;

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
    var entId = entity.id;
    if (entId)
    {
      // Update
      var url = "/"+entity.entityName+"/update/"+entId;

      rwHttpSvc.put(url,entity.changedKeys(),function(res)
      {
        if (res && res.result)
        {
          entity.updateChangedKeys();
          callback("U",null);
        }
        else
        {
          entity.restoreChangedKeys();

          callback("U",{
            msg: "CORE_LBL.UPDATE_ERR",
            style: "danger",
            btClose: "WORDS.CLOSE"
          });
        }
      });
    }
    else
    {
      // Insert
      var url = "/"+entity.entityName+"/insert";

      rwHttpSvc.post(url,entity.changedKeys(),function(res)
      {
        if (res && res.result)
        {
          entity.id = res.result.id;
          entity.updateChangedKeys();

          callback("I",null);
        }
        else
        {
          callback("I",{
            msg: "CORE_LBL.INSERT_ERR",
            style: "danger",
            btClose: "WORDS.CLOSE"
          });
        }
      });
    }
  };

  this.delete = function(entity,callback)
  {
    var url = "/"+entity.entityName+"/delete/"+entity.id;

    rwHttpSvc.delete(url,function(res)
    {
      callback((res && res.result) ? null : {
        msg: "CORE_LBL.DELETE_ERR",
        style: "danger",
        btClose: "WORDS.CLOSE"
      });
    });
  };

  this.logdel = function(entity,callback)
  {
    var url = "/"+entity.entityName+"/logdel/"+entity.id;

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
