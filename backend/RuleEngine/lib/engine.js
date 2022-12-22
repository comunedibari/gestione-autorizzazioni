/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

var ModName = "Engine";

/* Modules */
var _job = require("cron").CronJob;
var _clt = require("core/httpClient");
var _cfg = null;
var _log = null;

/*
 * Public function
 */
function init(opt)
{
  _cfg = opt.config;
  _log = opt.log;

  /* Initialize http client */
  _clt.init(opt.log);

  /* Create jobs for scheduled rules */
  var scheduler = opt.rleCfg.scheduler;
  if (scheduler)
  {
    for (var rule in scheduler)
      createJob(rule,scheduler[rule]);
  }
}

function run(name,data,callback)
{
  try
  {
    var rule = require("rule/"+name);
    var rOpt = {
      clt: _clt,
      cfg: _cfg,
      log: _log,
      data: data
    };

    /* Run rule */
    _log.info(ModName+" - Run rule "+name);

    rule.run(rOpt,function(err,res)
    {
      if (err)
        _log.error(ModName+" - Rule "+name+" error: "+err.message);
      else
        _log.info(ModName+" - Rule "+name+" done: "+JSON.stringify(res));

      callback(err,res);
    });
  }
  catch (err)
  {
    _log.error(ModName+" - Cannot run rule "+name+": "+err.message);

    callback(err,null);
  }
}

exports.init = init;
exports.run = run;

/*
 * Private function
 */
function createJob(rule,opt)
{
  if (!rule || !opt)
    return;

  /* Create job */
  var job = new _job(opt.cron,function()
  {
    run(rule,opt.data,function(err,res){});
  },
  null,true);

  _log.info(ModName+" - Created job for scheduled rule "+rule);
}
