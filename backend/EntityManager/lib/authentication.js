/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

var _log = null;
var _crud = null;
var _authConf = {};
//var _jwt = require('jsonwebtoken');
// var _jwksClient = require('jwks-rsa');
var _https = require('https');

var authentication = function(options)
{
  _log  = options.log;
  _crud = options.crud;
  _authConf = options.authConf;

  // Class attributes
  this.moduleName = "authentication";
  this.dbSchema = _authConf.dbSchema ? _authConf.dbSchema : "public";

  this.crudUtils = require("./crudUtils");
  this.funcUtils = require("core/funcUtils");

  // Entity methods that don't need authentication
  this.whiteEntity = {
    i18n: ["master"],
    auth: ["newPassword"],
    login: ["doLogin","doLoginNew","getToken"],
    userExt: ["getUserOtherwiseAdd"],
    wgLayer: ["download","getFile"],
    wgStyle: ["polygonSLD"],
    wgLegend: ["image"],
    wgLegendClass: ["image"],
    vipUser: ["login"],
    landfill: ["cityList"],
    loginWSO2:["check"]
  };

  this.publicKey = null;

  // resolve 'unable to verify the first certificate' problem
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

//   var _jwksClient = require('jwks-rsa');
//   this.jwksClient = _jwksClient({
//     jwksUri: 'https://is.smacampania.it/oauth2/jwks'
//   });
}

/*
 * Check the request to verify:
 * 1. if IP request address is into white list;
 * 2. if entity method is in white list;
 * 3. if the user sessions is expired.
 */
authentication.prototype.checkRequest = function(req, callback)
{
  var self = this;

  // Check IP address
  if (_authConf.whiteListIP.indexOf(req.connection.remoteAddress) >= 0)
  {
    _log.info(self.moduleName+ " - "+req.connection.remoteAddress+
      " is in white list; bypass token control.");

    // IP is in white list -> check token is unnecessary
    callback(null,null);
    return;
  }

  // Check entity method
  var entity = req.params.entity;
  var method = req.params.method;

  if (entity && method)
  {
    var aMethod = self.whiteEntity[entity];

    if (aMethod && aMethod.indexOf(method) >= 0)
    {
      callback(null,null);
      return;
    }
  }

  // recovery token from request
  var tokenObj = self.getTokenFromReq(req);
  //var token = self.getAuthTokenFromReq(req);

  // verify token presence
  if (tokenObj == null)
  {
    _log.error(self.moduleName + " - missing token from request");

    callback({message:"missing token from request"},null);
    return;
  }

  if (tokenObj.type == 'inner' && tokenObj.token == _authConf.innerToken)
  {
    // token is equal to innerToken -> request sent from system inner module
    callback(null,null);
    return;
  }

  // verify if session is valid and update her
  /*self.verifySession(token,function(err,res)
  {
    callback(err,res);
  });*/

  // IMPORTANT: workaround to remove as soon as possible!!!!!!!!!!!!
  // callback(null,{result:{id:1,sysuser_id:1}});

  // verify token
  if (tokenObj.type == 'inner')
  {
    self.verifySession(tokenObj.token,function(err,res)
    {
      // res contains id and sysuser_id
      callback(err,res);
    });
  }
  else
  {
    self.verifyToken(tokenObj, function(err,res)
    {
      // res contain taxCode
      callback(err,res);
    });
  }
}

/*
 * Recovery session token from request
 * Token can be stored in a cookie or in a request headers (with same name)
 */
authentication.prototype.getTokenFromReq = function(req)
{
  var self = this;
  var token = null;
  var type  = null;

  var cookie     = req.cookies;
  var authHeader = req.headers['authorization'];

  /* DEBUG
  for(var propt in req.headers){
    _log.info(propt + ': ' + req.headers[propt]);
  }*/

  if (authHeader)
  {
    //_log.info(self.moduleName + " - authHeader: " + authHeader);
    var authHeaderArray = authHeader.split(' ');

    token = authHeaderArray[1];
    type  = 'bearer';
  }
  else
  {
    if (self.funcUtils.isEmptyObject(cookie) || !cookie[_authConf.cookieName])
      token = req.headers[_authConf.cookieName];
    else
      token = cookie[_authConf.cookieName];

    // If token not found, look for it in query string
    if (!token && req.query[_authConf.cookieName])
      token = req.query[_authConf.cookieName];

    if (token)
      type = 'inner';
  }

  return token ? {type:type, token:token} : null;
}

/*
 * Control and update session. If the session has not expired,
 * last_access_date and expiration_date fields are updated.
 */
authentication.prototype.verifySession = function(token, callback)
{
  var self = this;
  var nowTs = new Date().getTime();

  // verify if session has expired
  // if sessionTimeout < 0, session never expires -> no need to control,
  // only update last_access_date
  if (_authConf.sessionTimeout > 0)
  {
    var selectOpt =
    {
      queryName: "selectSession",
      fields:[
        {name:"last_access_date"},
        {name:"expiration_date"}
      ],
      fieldType:{
        last_access_date: self.crudUtils.TIMESTAMP,
        expiration_date: self.crudUtils.TIMESTAMP
      },
      from: [
        {schema:self.dbSchema, name:"session", type:self.crudUtils.TABLE}
      ],
      where:[
        {
          typeCond: self.crudUtils.SIMPLE_COND,
          leftSide: "token",
          operator: self.crudUtils.EQ,
          rightSide: "$1"
        }
      ]
    };

    var selectVal = [];
    selectVal.push({value:token});

    _crud.select(selectOpt, selectVal, function(errSel, resSel)
    {
      if (errSel)
        return callback(errSel,null);

      if (resSel.result && resSel.result.length == 0)
      {
        callback({message:"No rows found in session table for token: "+token},null);
      }
      else
      {
        var lastAccessDate = resSel.result[0].last_access_date || 0;

        // session has not expired -> update
        if (lastAccessDate+_authConf.sessionTimeout*1000 > nowTs)
        {
          self.updateSession(nowTs,token,function(errUpd,resUpd)
          {
            callback(errUpd, resUpd);
          });
        }
        else
        {
          callback({message:"Session has expired!"},null);
        }
      }
    });
  }
  else
  {
    // update session table without any session control
    self.updateSession(nowTs,token,function(errUpd,resUpd)
    {
      callback(errUpd,resUpd);
    });
  }
}

/*
 * Update session table last_access_date with now value.
 * If session has a timeout, we have to update also expiration_date.
 */
authentication.prototype.updateSession = function(nowTs,token,callback)
{
  var self = this;

  // valorize query configuration object
  var numQueryParam = 2;
  var fields = [{name:"last_access_date"}];
  var fieldType = {last_access_date: self.crudUtils.TIMESTAMP};

  var updateVal = [];
  updateVal.push({value:new Date(nowTs)});

  // if session has a timeout, we have to update also expiration_date
  if (_authConf.sessionTimeout > 0)
  {
    fields.push({name:"expiration_date"});
    fieldType.expiration_date = self.crudUtils.TIMESTAMP;

    updateVal.push({value:new Date(nowTs+(_authConf.sessionTimeout*1000))});

    numQueryParam++;
  }

  var updateOpt =
  {
    queryName: "updateSession",
    table: {schema:self.dbSchema, name:"session"},
    fields: fields,
    fieldType: fieldType,
    where:[
      {
        typeCond: self.crudUtils.SIMPLE_COND,
        leftSide: "token",
        operator: self.crudUtils.EQ,
        rightSide: "$"+numQueryParam
      }
    ],
    returning:[
      {name:"id"},
      {name:"sysuser_id"}
    ]
  };

  // value of the query WHERE param
  updateVal.push({value:token});

  _crud.update(updateOpt,updateVal,function(errUpd,resUpd)
  {
    callback(errUpd, {result: resUpd.result[0]});
  });
}

/*
 * Recovery authentication token from request
 * JWT Token is searched in x-auth header;
 * if not found here we search a cookie named 'token'
 * If not found return null
 */
/*authentication.prototype.getAuthTokenFromReq = function(req)
{
  var self  = this;
  var token = null;

  var authHeader = req.headers['authorization'];

  if (authHeader)
  {
    var authHeaderArray = authHeader.split(' ');

    token = authHeaderArray[1];
  }

_log.info(token);
  return token;
}*/


/*
 * Control and update session. If the session has not expired,
 * last_access_date and expiration_date fields are updated.
 */
authentication.prototype.verifyToken = function(tokenObj, callback)
{
  var self = this;
  var nowTs = new Date().getTime()/1000; // now in seconds

  if (tokenObj.type == "bearer")
  {
    var _jwksClient = require('jwks-rsa');
    var jwksClient = _jwksClient({
      jwksUri: 'https://is.smacampania.it/oauth2/jwks'
    });

    // function retrieving JWT signing key
    function getKey(header, callback){
      jwksClient.getSigningKey(header.kid, function(err, key) {

        if (err)
          _log.error(self.moduleName + " - Error on get signing key: " + err.message);

        //console.log(key);
        var signingKey = key.publicKey || key.rsaPublicKey;
        //console.log(signingKey);
        callback(null, signingKey);
      });
    }

    // verify jwt token
    var _jwt = require('jsonwebtoken');
    _jwt.verify(tokenObj.token, getKey, {}, function(err,payload)
    {
      // console.log('valid');
      // manage error
      if (err)
      {
        _log.error(self.moduleName + " - Error on verify token: " + err.message);
        return callback(err,null);
      }
      // check and manage token expired
      if (payload && payload.exp)
      {
        //_log.info(self.moduleName + " - Success on verify token!");
        if (nowTs > payload.exp)
          return callback({message:"token expired!"},null);
      }

      /*
        SELECT view_sysuser.* FROM view_sysuser
        WHERE (tax_code = $1)
      */
      var queryVal = [{value: payload.sub}];
      var queryOpt =
      {
        queryName: "UserInfo",
        fields: self.crudUtils.ALL_FIELDS,
        from: [{
          schema: self.schemaName,
          name: "view_sysuser",
          type:self.crudUtils.TABLE
        }],
        where: [{
          typeCond: self.crudUtils.SIMPLE_COND,
          leftSide: "tax_code",
          operator: self.crudUtils.EQ,
          rightSide: "$1"
        }]
      };

      // Exec query
      _crud.select(queryOpt,queryVal,function(err,res)
      {
        if (err)
          return callback(err,null);

        if (res.result)
        {
          if (res.result.length == 0)
          {
            var noUserErr = {
              message: "No user founded with tax_code " + params.taxCode
            };

            self.log.error(self.moduleName + " - " + noUserErr.message);
            return callback({message:noUserErr},null);
          }
          else if (res.result.length > 1)
          {
            var moreErr = {
              message: "Founded more user with tax_code " + params.taxCode
            };

            self.log.error(self.moduleName + " - " + moreErr.message);
            return callback({message:moreErr},null);
          }
          else
          {
            // valid token
            callback(null,{result:{taxCode:payload.sub, sysuser_id: res.result[0].id}});
          }
        }
      });
    });
  }
  else if (tokenObj.type == "inner")
  {
    self.verifySession(tokenObj.token,function(err,res)
    {
      callback(err,res);
    });
  }
  else
  {
    callback({message:'no token'},null);
  }
}

/*
 * return publicKey for jwt verify
 */
/*authentication.prototype.getKey = function(callback)
{
  var self = this;

  if (this.publicKey)
  {
    _log.info(self.moduleName + " - key already valued: " + this.publicKey);
    callback(null,this.publicKey);
    return;
  }

  var reqOpt = {
    hostname: "is.smacampania.it",
    path: "/oauth2/jwks",
    method: "GET",
    headers: {
      'Content-Type': 'application/json'
    }
  };

  var req = _https.request(reqOpt, function (res) {_log.info('getKey');
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function (chunk) {_log.info('end getKey');
      var body = Buffer.concat(chunks);
      body = JSON.parse(body.toString());
      self.publicKey = body.keys[0].n; _log.info(self.publicKey);
      callback(null,this.publicKey);
    });

    res.on("error", function (error) {
      _log.error(error);
      callback(error,null);
    });
  });

  req.end();
}*/

/*
 * Exports
 */
exports.authentication = authentication;
