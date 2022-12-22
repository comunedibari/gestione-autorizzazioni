/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("roadsite",["core"])
  .factory("Roadsite",roadsiteFact)
  .service("rsModelSvc",rsModelSvc);

function roadsiteFact(RWEntity)
{
  Roadsite.prototype = new RWEntity();

  function Roadsite(cfg)
  {
    RWEntity.call(this,cfg,["id","open_user_id","authority_id","email",
      "request_date","request_year","address","note","project_attach",
      "authorization_attach","coord_communication_attach","protocol_request_date",
      "protocol_request_number","status_id","approved_user_id",
      "protocol_approved_date","approved_attach","geom","x_min", "y_min",
      "x_max", "y_max", "geoJson","protocol_approved_number","start_date",
      "end_date","geojson","protocol_company","notepm","authority","open_user","town"
    ]);
    this.hasDetail = false;
    //geoJson drawed or uploaded geometry
    //geojson geometry returned from BE
  };

  Roadsite.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);

    // NOTE: Delete this keys of retObj because not are real attributes
    var keyToDel = ["x_min", "x_max", "y_min", "y_max", "hasGeom"];

    for(var z = 0; z < keyToDel.length; z++)
    {
      if (retObj && retObj.hasOwnProperty(keyToDel[z]))
        delete retObj[keyToDel[z]];
    }

    // Reset retObj to null
    if (retObj && Object.keys(retObj).length == 0)
      retObj = null;

    return retObj;
  }


  Roadsite.prototype.getName = function()
  {
    return "roadsite";
  };

  return Roadsite;
}

function rsModelSvc(rwHttpSvc)
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