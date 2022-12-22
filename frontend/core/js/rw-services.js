/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("core")
  .service("rwConfigSvc",rwConfigSvc)
  .service("rwAuthSvc",rwAuthSvc)
  .service("rwContextSvc",rwContextSvc)
  .service("rwI18NSvc",rwI18NSvc)
  .service("rwHttpSvc",rwHttpSvc)
  .service("rwAlertSvc",rwAlertSvc)
  .service("rwAlertForModalSvc",rwAlertForModalSvc);

function rwConfigSvc()
{
  this.title = WAConfig.title;
  this.login = WAConfig.login;
  this.layout = WAConfig.layout;
  this.webRoot = WAConfig.webRoot;
  this.language = WAConfig.language;
  this.languages = WAConfig.languages;
  this.urlPrefix = WAConfig.urlPrefix;
  this.recoveryPwd = WAConfig.recoveryPwd;
  this.customLogin = WAConfig.customLogin;

  this.authToken = WAConfig.authToken;
  this.defaultRole = WAConfig.defaultRole;

  this.resArea = WAConfig.reservedArea;
  this.resAreaLogin = false;

  this.msWorkspace = WAConfig.msWorkspace;
}

function rwAuthSvc()
{
  this.token = null;
  this.userInfo = null;
  this.permissions = null;
  this.loginISToken = null;
  this.XAuthToken = null;

  this.permForModule = function(name)
  {
    if (this.permissions && this.permissions[name])
      return this.permissions[name].name;

    return null;
  };
}

function rwContextSvc()
{
  var ctxObj = {};

  // Service function
  this.init = function(ctx)
  {
    ctxObj = ctx;
  };

  this.getContext = function(name)
  {
    return ctxObj[name];
  };
}

function rwI18NSvc($rootScope,rwConfigSvc,rwHttpSvc)
{
  var i18nObj = {};

  /* Service function */
  this.isReady = function()
  {
    return !isEmpty(i18nObj);
  };

  this.i18nForKey = function(key)
  {
    return i18nObj[key];
  };

  this.refresh = function()
  {
    if (rwConfigSvc.languages)
    {
      var iAll = rwConfigSvc.languages.length;
      var iCur = 0;

      i18nObj = {};

      for (var i = 0;i < iAll;i++)
      {
        loadI18N(rwConfigSvc.languages[i],function()
        {
          if (++iCur >= iAll)
            $rootScope.$broadcast("rwI18NSvc.refreshed");
        });
      }
    }
  };

  /* Private function */
  function loadI18N(lang,callback)
  {
    rwHttpSvc.get("/core/i18n?lang="+lang,function(res)
    {
      if (res)
        linearizeObject(lang,res,[]);

      callback();
    });
  };

  function linearizeObject(lang,obj,aKey)
  {
    for (var key in obj)
    {
      if (typeof obj[key] == "object")
      {
        aKey.push(key);
        linearizeObject(lang,obj[key],aKey);
      }
      else
      {
        var linearizedKey = aKey.join(".") + "." + key;

        if (!i18nObj[linearizedKey])
          i18nObj[linearizedKey] = {};

        i18nObj[linearizedKey][lang] = obj[key];
      }
    }

    aKey.pop();
  };

  // Init service
  this.refresh();
}

function rwHttpSvc($http,rwConfigSvc,rwAuthSvc)
{
  var prefix = rwConfigSvc.urlPrefix;

  this.setAuthHeader = function(token)
  {
    $http.defaults.headers.common["it_app_auth"] = token;
  };

  this.setBearerToken = function()
  {
    $http.defaults.headers.common.Authorization = 'Bearer ' + rwAuthSvc.XAuthToken;
  };

  this.setSIOHeader = function(value)
  {
    $http.defaults.headers.common["it_app_sio"] = value;
  }

  /* Generic request: opt is an object ($http config) */
  this.request = function(opt,callback)
  {
    if (opt.url)
      opt.url = prefix+opt.url;

    $http(opt).then(
      function(res) {callback(res);},
      function(err) {callback(null);}
    );
  };

  /* GET */
  this.get = function(url,callback)
  {
    $http.get(prefix+url).then(
      function(res) {callback(res.data);},
      function(err) {callback(null);}
    );
  };

  /* POST */
  this.post = function(url,data,callback)
  {
    $http.post(prefix+url,data).then(
      function(res) {callback(res.data);},
      function(err) {callback(null);}
    );
  };

  /* PUT */
  this.put = function(url,data,callback)
  {
    $http.put(prefix+url,data).then(
      function(res) {callback(res.data);},
      function(err) {callback(null);}
    );
  };

  /* DELETE */
  this.delete = function(url,callback)
  {
    $http.delete(prefix+url).then(
      function(res) {callback(res.data);},
      function(err) {callback(null);}
    );
  };

  /* UPLOAD */
  this.upload = function(url,data,callback)
  {
    if (!data || !data.file)
    {
      callback(null);
      return;
    }

    // Prepare payload
    var fd = new FormData();
    fd.append("file[]",data.file);

    for (var key in data)
    {
      if (key != "file")
        fd.append(key,data[key]);
    }

    // Configure request option
    var opt =
    {
      transformRequest: angular.identity,
      headers: {'Content-Type': undefined}
    };

    // Exec request
    $http.post(prefix+url,fd,opt).then(
      function(res) {callback(res);},
      function(err) {callback(null);}
    );
  };
}

function rwAlertSvc($uibModal)
{
  /*
   * opt object:
   * id
   * text
   * title
   * style: info|success|warning|danger
   * buttons: [{id:1,text:"Ok"}]
   */
  this.show = function(opt)
  {
    if (!opt.style)
      opt.style = "info";

    $uibModal.open({
      templateUrl: "core/views/rw-alert.html",
      controller: rwAlertCtrl,
      backdrop: "static",
      keyboard: true,
      resolve: {
        data: function(){return opt;}
      }
    });
  }
}

function rwAlertForModalSvc($uibModal,$timeout)
{
  /*
   * opt object:
   * id
   * text
   * title
   * style: info|success|warning|danger
   * buttons: [{id:1,text:"Ok"}]
   *
   * elem: element where append the modal
   */
  this.show = function(opt, elem)
  {
    if (!opt.style)
      opt.style = "info";

    var modalInstance = $uibModal.open({
      templateUrl: "core/views/rw-alert.html",
      controller: rwAlertCtrl,
      backdrop: false,
      keyboard: true,
      appendTo: elem,
      resolve: {
        data: function(){return opt;}
      }
    });

    if (opt.style == "info") // Auto close
    {
      $timeout(function()
      {
        modalInstance.close();
      },3000);
    }
  };

}
