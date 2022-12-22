/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */

angular.module("core")
  .factory("RWEntity",rwEntity)
  .factory("rwEventManager",rwEventManager)
  .factory("RWAttachment",rwAttachment);

function rwEntity()
{
  function RWEntity(cfg,aKey)
  {
    this._aKey = aKey ? aKey : [];
    this._config = cfg ? cfg : {};

    this.update(cfg);
  };

  RWEntity.prototype.update = function(cfg)
  {
    if (!cfg)
      cfg = {};

    for (var i = 0;i < this._aKey.length;i++)
    {
      var key = this._aKey[i];
      this[key] = cfg[key];
    }

    this._config = cfg;
  };

  RWEntity.prototype.changedKeys = function()
  {
    var retObj = {};

    for (var i = 0;i < this._aKey.length;i++)
    {
      var key = this._aKey[i];

      if (this[key] != this._config[key])
        retObj[key] = this[key] != undefined ? this[key] : null;
    }
    return angular.equals({},retObj) ? null : retObj;
  };

  RWEntity.prototype.updateChangedKeys = function()
  {
    var chgObj = this.changedKeys();
    if (chgObj)
    {
      for (var key in chgObj)
        this._config[key] = chgObj[key];
    }
  };

  RWEntity.prototype.restoreChangedKeys = function()
  {
    this.update(this._config);
  };

  return RWEntity;
}

function rwEventManager($window,rwHttpSvc)
{
  var socket = null;

  if ($window.io)
  {
    socket = io();

    socket.on("connect",function()
    {
      console.log("==> Connected to EventEngine");
      rwHttpSvc.setSIOHeader(socket.id);
    });

    socket.on("disconnect",function()
    {
      console.log("==> Disconnected from EventEngine");
      rwHttpSvc.setSIOHeader(null);
    });
  }

  return {
    on: function(event,listener)
    {
      if (socket)
        socket.on(event,listener);
    },
    off: function(event,listener)
    {
      if (socket)
        socket.off(event,listener);
    },
    emit: function(event,data)
    {
      if (socket)
        socket.emit(event,data);
    },
    sioId: function()
    {
      return socket ? socket.id : null;
    }
  };
}

/*
 * Attachment Entity
 */
function rwAttachment(RWEntity)
{
  // RWEntity inheritance
  RWAttachment.prototype = new RWEntity();

  // Constructor
  function RWAttachment(cfg)
  {
    this.fileExt = "";
    this.isImage = false;

    RWEntity.call(this,cfg,[
      "id",
      "name",
      "descr",
      "insert_date",
      "size",
      "entity_id"]);
  };

  var self = this;

  RWAttachment.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    if(cfg != undefined)
    {
      // Manage Date
      this.insert_date = cfg.insert_date ? new Date(cfg.insert_date) : null;

      // Convert size in kB
      this.size = cfg.size > 1024 ? Math.ceil(cfg.size/1024) : 1;

      // Dictionary of img extensions
      var imageExtensions = { img:"", png:"", jpg:"", jpeg:"", gif:""};

      // Dictionary of file extensions and image name to show as image
      var fileExtensionsImage = {
        pdf:"./image/file-icon/pdf.png",
        doc:"./image/file-icon/doc.png",
        xls:"./image/file-icon/xls.png",
        txt:"./image/file-icon/txt.png",
        default:"./image/file-icon/default.png"
      };

      var aSplittedFilename = this.name.split(".");

      if(aSplittedFilename.length > 0)
      {
        // Get the file extension
        this.fileExt = aSplittedFilename[aSplittedFilename.length-1];

        // Set if the file is an image
        if(imageExtensions.hasOwnProperty(this.fileExt))
          this.isImage = true;
        else
        {
          this.isImage = false;
          this.icon = fileExtensionsImage.hasOwnProperty(this.fileExt) ?
           fileExtensionsImage[this.fileExt] : fileExtensionsImage.default;
        }
      }
    }
  };

  return RWAttachment;
}
