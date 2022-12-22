/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

var ModName = "HttpServer";

/* Modules */
var _bodyParser = require("body-parser");
var _eng = require("./engine");
var _exp = require("express");
var _srv = _exp();
var _log = null;

// Configure express
_srv.use(_bodyParser.urlencoded({extended:false}));
_srv.use(_bodyParser.json());

/*
 * Public function
 */
function start(opt)
{
  _log = opt.log;

  /* Init engine */
  _eng.init(opt);

  /* Start http server */
  var port = opt.config.RlEngine.port;

  _srv.listen(port);
  _log.info(ModName+" - started on port "+port);
}

exports.start = start;

/*
 * Server routing
 */
_srv.get("/rule/:name",function(req,res)
{
  var addr = req.connection.remoteAddress;
  var name = req.params.name;
  var data = req.query;

  _log.info(ModName+" - GET "+req.url+" from "+addr);

  /* Run engine */
  _eng.run(name,data,function(err,ret)
  {
    _log.info(ModName+" - send response to "+addr);

    res.send(err ? {error:err.message} : {result:ret});
  });
});

_srv.post("/rule/:name",function(req,res)
{
  var addr = req.connection.remoteAddress;
  var name = req.params.name;
  var data = req.body;

  _log.info(ModName+" - POST "+req.url+" from "+addr);

  /* Run engine */
  _eng.run(name,data,function(err,ret)
  {
    _log.info(ModName+" - send response to "+addr);

    res.send(err ? {error:err.message} : {result:ret});
  });
});
