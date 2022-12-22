/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("WebApp")
  .service("userSvc",userSvc)
  .decorator("wgFilterBuilderSvc",wgFilterBuilderDecorator);

function userSvc(rwHttpSvc)
{
  var aUserCtx = [];
  var bLoadUser = true;

  /*
   * Sevice functions
   */
  this.usersCtx = function()
  {
    if (bLoadUser)
      loadUsers();

    return aUserCtx;
  };

  /*
   * Private functions
   */
  function loadUsers()
  {
    rwHttpSvc.get("/user/master",function(res)
    {
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
    });

    bLoadUser = false;
  };
}

/*
 * Service to build layer runtime filter (filter related to logged user)
 */
function wgFilterBuilderDecorator($delegate, rwAuthSvc, rwHttpSvc)
{
  $delegate.build = function(opt, callback)
  {
    var filter = null;

    // filter is not builded if user hasn't an authority associated
    // in these cases we show all features
    if (!rwAuthSvc.userInfo.authority_id)
    {
      callback({filter: filter, layerName: opt.layerName});
      return;
    }

    switch (opt.layerName)
    {
      case 'view_traslochi_aperti':
      case 'view_cantieri_aperti':
        filter = new ol.format.filter.equalTo("id_azienda", rwAuthSvc.userInfo.authority_id);

        callback({filter:filter, layerName:opt.layerName});
        break;

      default:
        console.error('Runtime filter for layer '+ opt.layerName + ' not implemented!');
        callback({filter: filter, layerName: opt.layerName});
    }
  };

  return $delegate;
}
