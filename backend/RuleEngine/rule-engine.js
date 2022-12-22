/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

/*
 * Modules
 */
var _config = require("config/config.json");
var _reConf = require("config/rleConf.json");
var _logger = require("core/log.js");

/*
 * Create log
 */
var _log = null;

try
{
  _log = _logger.createLogger(
    _config.Log.path,
    _reConf.Log.filename,
    _reConf.Log.category
  );

  _log.info("=====================");
  _log.info("       STARTED       ");
  _log.info("=====================");
}
catch (err)
{
  console.log("CANNOT create log: " + err.message);
  process.exit(-1);
}

/*
 * Start http server
 */
require("./lib/http-server").start({
  rleCfg: _reConf,
  config: _config,
  log: _log
});
