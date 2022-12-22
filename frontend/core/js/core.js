/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("core",[
  "ui.router",
  "ui.bootstrap",
  "angular-md5",
  "datatables",
  "datatables.select",
  "pascalprecht.translate",
  "ngMessages",
  "ui.bootstrap.datetimepicker",
  "tmh.dynamicLocale",
  "rzModule",
  "ui.select",
  "ngSanitize",
  "ui.mask"]);

angular.module("core").config(config).run(run);

/*
 * Module configuration.
 */
function config($stateProvider,$translateProvider,$httpProvider,tmhDynamicLocaleProvider)
{
  // Router
  $stateProvider
    .state("main",
    {
      templateUrl: "core/views/rw-main.html",
      controller: "rwMainCtrl",
      resolve:
      {
        permissions: function($http,rwHttpSvc,rwConfigSvc)
        {
          var url = rwConfigSvc.urlPrefix + "/auth/permissions";

          if (!rwConfigSvc.login && !rwConfigSvc.resAreaLogin)
          {
            if (rwConfigSvc.authToken)
              rwHttpSvc.setAuthHeader(rwConfigSvc.authToken);

            if (rwConfigSvc.defaultRole)
              url += "ForRole?role="+rwConfigSvc.defaultRole;
          }

          return $http.get(url);
        },
        context: function($q,rwHttpSvc)
        {
          var deferred = $q.defer();

          rwHttpSvc.get("/context/master",function(res)
          {
            deferred.resolve(res);
          });

          return deferred.promise;
        }
      }
    })
    .state("login",WAConfig.customLogin ? WAConfig.customLogin :
    {
      templateUrl: "core/views/rw-login.html",
      controller: "rwLoginCtrl"
    });

  // i18n (NOTE: cannot use rwConfigSvc here)
  $translateProvider.useUrlLoader(WAConfig.urlPrefix + "/core/i18n");
  $translateProvider.preferredLanguage(WAConfig.language);
  $translateProvider.fallbackLanguage(WAConfig.language);
  //$translateProvider.useSanitizeValueStrategy("escape");
  // CT: The method `useSanitizeValueStrategy(strategy)` defines which strategy for escaping
  // will be used;
  // https://github.com/angular-translate/angular-translate/blob/master/docs/content/guide/en/19_security.ngdoc
  $translateProvider.useSanitizeValueStrategy(null);

  // Workaround to avoid browser cache on GET request
  if (!$httpProvider.defaults.headers.get)
    $httpProvider.defaults.headers.get = {};

  $httpProvider.defaults.headers.get["Pragma"] = "no-cache";
  $httpProvider.defaults.headers.get["Cache-Control"] =
    "no-cache, no-store, must-revalidate";

  $httpProvider.defaults.headers.get["max-age"] = 0; //Firefox
  $httpProvider.defaults.headers.get["If-Modified-Since"] =
    "Mon, 26 Jul 1997 05:00:00 GMT"; //IE

  // Set locale location
  tmhDynamicLocaleProvider.localeLocationPattern(
    "core/lib/angular/i18n/angular-locale_{{locale}}.js");
}

/*
 * Module startup.
 */
function run($rootScope,$state,rwConfigSvc,tmhDynamicLocale)
{
  // Set right state
  $state.go(rwConfigSvc.login ? "login" : "main");

  // Inject $state
  $rootScope.$state = $state;

  // Set initial locale
  tmhDynamicLocale.set(rwConfigSvc.language);

  // Add listener for router transition error
  /*
  $rootScope.$on("$stateChangeError",
  function(ev,toState,toParams,fromState,fromParams,err)
  {
  });
  */
}

/*
 * Utility function.
 */
Date.prototype.toCustomString = function()
{
  var year = this.getFullYear(),
    mon = ("0" + (this.getMonth()+1)).slice(-2),
    day = ("0" + this.getDate()).slice(-2),
    hou = ("0" + this.getHours()).slice(-2),
    min = ("0" + this.getMinutes()).slice(-2);

  if (hou == "00" && min == "00" && this.getSeconds() == 0)
    return day + "/" + mon + "/" + year;

  return day + "/" + mon + "/" + year + " " + hou + ":" + min;
}

Date.prototype.dateString = function()
{
  var year = this.getFullYear(),
    mon = ("0" + (this.getMonth()+1)).slice(-2),
    day = ("0" + this.getDate()).slice(-2);

  return day + "/" + mon + "/" + year;
}

Date.prototype.dateTimeString = function()
{
  var year = this.getFullYear(),
    mon = ("0" + (this.getMonth()+1)).slice(-2),
    day = ("0" + this.getDate()).slice(-2),
    hou = ("0" + this.getHours()).slice(-2),
    min = ("0" + this.getMinutes()).slice(-2);

  return day + "/" + mon + "/" + year + " " + hou + ":" + min;
}

function isEmpty(object)
{
  for(var key in object)
  {
    if(object.hasOwnProperty(key))
      return false;
  }

  return true;
}
