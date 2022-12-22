/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("move",["core"])
  .factory("Move",moveFact)
  .factory("MovePhoto", movePhotoFact)
  .service("mvModelSvc",mvModelSvc);

function moveFact(RWEntity,MovePhoto)
{
  Move.prototype = new RWEntity();

  function Move(cfg)
  {
    RWEntity.call(this,cfg,["id","open_user_id","authority_id","email",
      "request_date","request_year","address","note","status_id",
      "geom","x","y","start_date","end_date","number_from","number_to",
      "signage_date","signage_date","signage_address","signage_num_from",
      "signage_num_to","vehichle_num","vechicle_plate","place","signage_place",
      "signage_base","signage_position_id","control_date","control_team",
      "manage_user_id","manage_date","approved_user_id","approved_date",
      "signage_num_bags","signage_bag_other","x_min", "y_min",
      "x_max", "y_max","authority","open_user","town","authorization_id"
    ]);
    this.hasDetail = false;
  };

  Move.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    /*Attach*/
    this.attach = cfg.attach || [];

    /*Photo*/
    this.photo = cfg.photo ?
      new MovePhoto({id: this.id, attach:cfg.photo}) :
      new MovePhoto({});
  }

  Move.prototype.updateChangedKeys = function()
  {
    RWEntity.prototype.updateChangedKeys.call(this);

    if (!this.photo.id)
      this.photo.id = this.id;

    this.photo.updateChangedKeys();
  }

  Move.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);

    // Check if send mail
    if (retObj && retObj.status_id >= 1 && retObj.status_id != 5)
    {
      retObj.send_mail = true;
    }

    return retObj;
  }

  Move.prototype.getName = function()
  {
    return "move";
  };

  return Move;
}

function movePhotoFact(RWEntity)
{
  MovePhoto.prototype = new RWEntity();

  function MovePhoto(cfg)
  {
    RWEntity.call(this,cfg,["id"]);
    this.hasDetail = false;
  };

  MovePhoto.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    /*Attach*/
    this.attach = cfg.attach || [];
  }

  MovePhoto.prototype.getName = function()
  {
    return "move";
  };

  return MovePhoto;
}

function mvModelSvc(rwHttpSvc)
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
        entity.code = res.result.code;
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