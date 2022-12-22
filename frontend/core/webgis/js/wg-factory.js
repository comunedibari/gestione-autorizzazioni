/*
 *    Date: 
 *  Author: 
 * Project: 
 *
 * 
 */
 
angular.module("webgis")
  .factory("wgCategory",categoryFactory)
  .factory("wgLayer",layerFactory)
  .factory("wgBaseLayer",baseLayerFactory)
  .factory("wgLayerSource",layerSourceFactory)
  .factory("wgLayerSearch",layerSearchFactory)
  .factory("wgLayerLegend",layerLegendFactory)
  .factory("wgLayerLegendClass",layerLegendClassFactory)
  .factory("wgI18NObj",i18NFactory)
  .factory("wgLayerQueryable",layerQueryableFactory)
  .factory("wgLayerSelectable",layerSelectableFactory)
  .factory("wgLayerFilter",layerFilterFactory)
  .factory("wgLayerStyle",layerStyleFactory)
  .factory("wgLayerStyleClasses",layerStyleClassesFactory)
  .factory("wgStyle",styleFactory);

function categoryFactory(RWEntity,wgLayer,wgLayerSource,wgI18NObj,rwHttpSvc)
{
  // RWEntity inheritance
  wgCategory.prototype = new RWEntity();

  // wgCategory entity
  function wgCategory(cfg)
  {
    this.permission_exist = null; // Flag used into the view

    RWEntity.call(this,cfg,[
      "id",
      "label",
      "_position",
      "permission",
      "permission_descr"
    ]);
    this._name = "wgCategory";
  };

  wgCategory.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    this.layers = [];

    if(cfg != undefined)
    {
      // Flag used to know what do on Save
      this.op = "U";

      // Manage layers
      if(cfg.layers)
      {
        for(var i=0; i< cfg.layers.length;i++)
        {
          var layer = cfg.layers[i];
          this.layers.push(new wgLayer(layer));
        }
      }

      // Manage wgI18NObj
      if(cfg.label)
        this.i18n = new wgI18NObj({label_key:cfg.label});

      // Manage permission_exist flag
      if(cfg.permission && cfg.permission != null)
        this.permission_exist = true;
      else
        this.permission_exist = false;
    }
    else
    {
      // Flag used to know what do on Save
      this.op = "I";

      this.permission_exist = false;

      var self = this;
      rwHttpSvc.get("/webgis/serialId",function(res)
      {
        if(res && res.result)
        {
          self.id = res.result;
          self.label = "WEBGIS.LAYER.CAT_"+self.id;
          self.i18n = new wgI18NObj({label_key: self.label});
        }
        else
          console.error("wgCategory ERROR: unable to get serial id!");
      });
    }
  };

  wgCategory.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);

    if(!retObj)
      retObj = {};

    // Control if i18n is changed
    var chgObj_I18N = this.i18n.changedKeys();
    if(chgObj_I18N)
      retObj.i18n = chgObj_I18N;

     // Manage permission 
    if(retObj.permission)
    {
      // Create permission_obj
      retObj.permission_obj = {
        op:"I", name:retObj.permission, description:retObj.permission_descr};

      delete retObj.permission_descr;
    }
    else if(retObj.permission_descr)
    {
      // Create permission_obj
      retObj.permission_obj = {
        op:"U", name:this.permission, description:retObj.permission_descr};

      delete retObj.permission_descr;
    }
    else if(retObj.hasOwnProperty("permission") && retObj.permission == null)
    {
      retObj.permission_obj = {op:"D", name:this._config.permission};

      delete retObj.permission_descr;
    }

    return  angular.equals({},retObj) ? null : retObj;
  }

  wgCategory.prototype.updateChangedKeys = function()
  {
    RWEntity.prototype.updateChangedKeys.call(this);

    // Layers
    for(var i=0, nLayers=this.layers.length; i<nLayers; i++)
    {
      var layer = this.layers[i]; 
      var chgObj = layer.changedKeys(); 

      if(chgObj)
      { 
        layer.updateChangedKeys();
        layer.op = "U";
      }
    }

    // I18n
    if(this.i18n && this.i18n.changedKeys())
      this.i18n.updateChangedKeys();
  }

  // Create a wgLayer's that has some property setted
  wgCategory.prototype.createLayer = function()
  {
    var layer = new wgLayer();

    // Find the max child _position to set new 
    var max_position = 0;
    for(var i=0; i<this.layers.length; i++)
    {
      var l = this.layers[i];
      if(l._position > max_position)
        max_position = l._position;
    }
    // Set _position,category's id and depth
    layer._position = max_position +1;
    layer.id_category = this.id;
    layer.depth = 1;

    return layer;
  }
  return wgCategory;
};

function layerFactory(RWEntity,wgLayerSource,wgLayerSearch,wgLayerLegend,
  wgI18NObj,wgLayerQueryable,wgLayerSelectable,wgLayerFilter,wgLayerStyle,
  wgLayerStyleClasses,rwHttpSvc)
{
  // RWEntity inheritance
  wgLayer.prototype = new RWEntity();

  // wgLayer entity
  function wgLayer(cfg)
  {
    this.layers = [];
    this.extent = [];
    this.extent_minx = null;
    this.extent_miny = null;
    this.extent_maxx = null;
    this.extent_maxy = null;
    this.permission_exist = null; // Flag used into the view

    this.styleStatus = null;
    this.clusterStyleStatus = null;
    this.styleStatusEnum = 
    {
      NOT_DEFINED: 1,
      DEFINED_IN_RELATIVES: 2,
      DEFINED: 3
    };

    RWEntity.call(this,cfg,[
      "id",
      "id_category",
      "id_parent",
      "depth",
      "label",
      "image_id",
      "type",
      "visible",
      "opacity",
      "tiled",
      "layer_name",
      "hover",
      "dynamic_filter",
      "min_scale",
      "max_scale",
      "_position",
      "op",
      "permission",
      "permission_descr",
      "editable"
    ]);

    this._name = "wgLayer";
    this.hasDetail = false;
  };

  wgLayer.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    if(cfg != undefined)
    {
      // Flag used to know what do on Save
      this.op = "U";

      // Manage wgLayerSource
      if(cfg.source && cfg.source.url != undefined)
      {
        this.source = new wgLayerSource(cfg.source);
        this._enableSourceAndType = true;

        /* If a WMS layer has source and layer_name, can't have children; 
         * instead WFS  can have children */
        if(cfg.type == "VECTOR")
          this._canHaveChildren = true;
        else
        {
          if(cfg.source.hasOwnProperty("layer_name") && 
            cfg.source.layer_name!== null)
            this._canHaveChildren = false;
          else
          {
            if(cfg.hasOwnProperty("_canHaveChildren"))
              this._canHaveChildren = cfg._canHaveChildren;
            else
              this._canHaveChildren = true;
          }
        }
      }
      else
      {
        if(cfg.hasOwnProperty("_canHaveChildren"))
          this._canHaveChildren = cfg._canHaveChildren;
        else
          this._canHaveChildren = true;

        this.source = new wgLayerSource();
        if(cfg.hasOwnProperty("_enableSourceAndType"))
          this._enableSourceAndType = cfg._enableSourceAndType;
        else
          this._enableSourceAndType = true;

        if(cfg.hasOwnProperty("_parentSource"))
          this._parentSource = cfg._parentSource;
      }

      // Manage wgLayerSearch
      this.searchable = new wgLayerSearch(cfg.searchable);

      // Manage legend
      if(cfg.legend)
        this.legend = new wgLayerLegend(cfg.legend);
      else
        this.legend = new wgLayerLegend();

      // Manage wgI18NObj
      if(cfg.label)
        this.i18n = new wgI18NObj({label_key:cfg.label});

      // Manage Extent (0-->minx, 1-->miny, 2-->miny, 3-->maxy)
      if(cfg.extent && cfg.extent.length == 4)
      {
        this.extent_minx = cfg.extent[0];
        this.extent_miny = cfg.extent[1];
        this.extent_maxx = cfg.extent[2];
        this.extent_maxy = cfg.extent[3];

        this.extent = [ this.extent_minx,this.extent_miny, 
          this.extent_maxx,this.extent_maxy];
      }

      // Manage queryable
      this.queryable = new wgLayerQueryable(cfg.queryable);

      // Manage selectable
      this.selectable = new wgLayerSelectable(cfg.selectable);

      // Manage permission_exist flag
      if(cfg.permission && cfg.permission != null)
        this.permission_exist = true;
      else
        this.permission_exist = false;

      // Manage filter 
      if(cfg.filter)
        this.filter = new wgLayerFilter(cfg.filter);

      // Manage style
      if(cfg.style)
      {
        this.styleStatus = this.styleStatusEnum.DEFINED;

        // Find what type of style has been defined
        if(cfg.style.classes)
        {
          this.style = new wgLayerStyleClasses(cfg.style);

          if(this.source != undefined)
          {
            // Set layer's info (id) used to generate unique keys into the class
            this.style.setLayerInfo({id:this.source.layer_name});
          }
          else
            console.error("WgLayer style classes ERROR: cannot set attributes and layer info into style's classes because source is undefined!");//CCC
        }
        else
        { 
          this.style = new wgLayerStyle(cfg.style.styles);

          // Set layer's info (id) used to generate unique keys into the class
          if(!this._enableSourceAndType) // Is child 
          {
            if(this._parentSource.layer_name != undefined)
              this.style.setLayerInfo({
                id: this._parentSource.layer_name,
                isChild: !this._enableSourceAndType,
                filter: this.filter
              });
          }
          else
            this.style.setLayerInfo({id:this.source.layer_name,
              isChild:!this._enableSourceAndType});
        }
      }
      else
      {
        if(this.type == "VECTOR")
        {
          if(this.layers)
          {
            if(this.layers.length)
              this.styleStatus = this.styleStatusEnum.DEFINED_IN_RELATIVES;
            else
              this.styleStatus = this.styleStatusEnum.NOT_DEFINED;
          }
        }
      }

      // Manage cluster_style
      if(cfg.cluster_style)
      {
        this.clusterStyleStatus = this.styleStatusEnum.DEFINED;

        this.cluster_style = new wgLayerStyle(cfg.cluster_style.styles);

        // Set layer's info (id) used to generate unique keys into the class
        if(!this._enableSourceAndType) // Is child
          console.error("wgLayerStyle ERROR: cluster_style can't be into a child!");
        else
          this.cluster_style.setLayerInfo({id:this.source.layer_name,
            isChild:!this._enableSourceAndType,isCluster:true});
      }
      else
      {
        if(this.type == "VECTOR")
        {
          // Layer is a child
          if(this._enableSourceAndType != undefined && !this._enableSourceAndType)
          {
            /* it can't have style,nothing to do beceause the style is 
            * defined into its father.
            */
            this.clusterStyleStatus = this.styleStatusEnum.DEFINED_IN_RELATIVES;
          }
          else
            this.clusterStyleStatus = this.styleStatusEnum.NOT_DEFINED;
        }
      }

      // Manage layers
      if(cfg.layers)
      {
        for(var i=0; i< cfg.layers.length;i++)
        {
          var layer = cfg.layers[i];
          /* NOTE if this layer has a source, it's a layer container and so
          * its children can't have children. Into the container's children will 
          * be specified only the layername.
          */
          if(this.source && this.source.url != undefined)
          {
            layer._enableSourceAndType = false;
            layer._canHaveChildren = false;
            layer._parentSource = cfg.source;
          }

          var layerEnt = new wgLayer(layer);
          // Manage style status
          this.manageStyleStatus(this.styleStatus,layerEnt);

          this.layers.push(layerEnt);
        }
      }
    }
    else
    {
      // Flag used to know what do on Save
      this.op = "I";
      var self = this;

      self.permission_exist = false;
      self.source = new wgLayerSource();
      self.searchable = new wgLayerSearch();
      self.queryable = new wgLayerQueryable();
      self.selectable = new wgLayerSelectable();
      self.filter = new wgLayerFilter();

      // Set the initial style status
      this.styleStatus = this.styleStatusEnum.NOT_DEFINED;
      // Set the initial cluster style status
      this.clusterStyleStatus = this.styleStatusEnum.NOT_DEFINED;

      // Default values
      self.type = "GROUP";
      self.image_id = 1;

      self.visible = false;
      self.opacity = 1;
      self.tiled = false;
      self.editable = null;
      self._enableSourceAndType = true;

      rwHttpSvc.get("/webgis/serialId",function(res)
      {
        if(res && res.result)
        {
          self.id = res.result;
          self.label = "WEBGIS.LAYER.LAY_"+self.id;
          self.legend = new wgLayerLegend();
          self.i18n = new wgI18NObj({label_key:self.label});
          self.visible = false;
        }
        else
          console.error("wgLayer ERROR: unable to get serial id!");
      });
    }
  };

  wgLayer.prototype.manageStyleStatus = function(fatherStatus,childLayerEnt)
  {
    if(childLayerEnt != null)
    {
      switch(fatherStatus)
      {
        case this.styleStatusEnum.DEFINED:
          // Children can't have style because it's defined into their father
          childLayerEnt.styleStatus = this.styleStatusEnum.DEFINED_IN_RELATIVES;
          break;

        case this.styleStatusEnum.NOT_DEFINED:
          if(childLayerEnt.style)
          {
            // Father can't have style because it's defined into their children
            this.styleStatus == this.styleStatusEnum.DEFINED_IN_RELATIVES;
          }
          break;
      }
    }
  }

  wgLayer.prototype.refreshStyleStatus = function()
  {
    switch(this.styleStatus)
    {
      case this.styleStatusEnum.DEFINED:
        if(this.style == undefined)
        {
          if(this.type == "VECTOR")
          {
            if(this.layers)
            {
              if(this.layers.length)
                this.styleStatus = this.styleStatusEnum.DEFINED_IN_RELATIVES;
              else
                this.styleStatus = this.styleStatusEnum.NOT_DEFINED;
            }
            else
              this.styleStatus = this.styleStatusEnum.NOT_DEFINED;
          }
        }
        break;

      case this.styleStatusEnum.NOT_DEFINED:

        if(this.style)
        {
          // Set the style status to defined
          this.styleStatus = this.styleStatusEnum.DEFINED;
        }
        else
        {
          if(this.type == "VECTOR")
          {
            if(this.layers)
            {
              if(this.layers.length)
                this.styleStatus = this.styleStatusEnum.DEFINED_IN_RELATIVES;
            }
          }
        }
        break;

      case this.styleStatusEnum.DEFINED_IN_RELATIVES:

        // Layer is a child
        if(this._enableSourceAndType != undefined && !this._enableSourceAndType)
        {
          /* it can't have style,nothing to do because the style is 
           * defined into its father.
           */
        }
        else
        {
          // Control if there are children
          if(this.layers)
          {
            if(this.layers.length == 0)
              this.styleStatus = this.styleStatusEnum.NOT_DEFINED;
          }
          else
            this.styleStatus = this.styleStatusEnum.NOT_DEFINED;
        }
        break;
    }
  }

  wgLayer.prototype.refreshClusterStyleStatus = function()
  {
    switch(this.clusterStyleStatus)
    {
      case this.styleStatusEnum.DEFINED:
        if(this.cluster_style == undefined)
          this.clusterStyleStatus = this.styleStatusEnum.NOT_DEFINED;
        break;

      case this.styleStatusEnum.NOT_DEFINED:
        if(this.cluster_style)
        {
          // Set the style status to defined
          this.clusterStyleStatus = this.styleStatusEnum.DEFINED;
        }
        break;

      case this.styleStatusEnum.DEFINED_IN_RELATIVES:
        /* it can't have cluster style,nothing to do beceause the style is 
        * defined into its father.
        */
        break;
    }
  }

  wgLayer.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);

    /* Manage  wgLayerSource */
    if(!retObj)
      retObj = {};

    if(this.searchable && this.searchable.changedKeys())
       retObj.searchable = this.searchable.stringify();

    if(this.legend)
    {
      var legendChgObj = this.legend.changedKeys();
      if(legendChgObj)
      {
        if(this.legend.op == "I")
        {
          // If the legend is extern, send even if i18n isn't defined 
          if(legendChgObj.extern != undefined && legendChgObj.extern)
            retObj.legend = legendChgObj;

          if(legendChgObj.i18n != null) // Send only if it contain i18n object
            retObj.legend = legendChgObj;
        }
        else
          retObj.legend = legendChgObj;
      }
    }

    // Control if i18n is changed
    var chgObj_I18N = this.i18n.changedKeys();
    if (chgObj_I18N)
      retObj.i18n = chgObj_I18N;

    // Manage extent
    var b_extent_changed = false;
    var b_extent_is_null = false;
    if (this.extent_minx != null || this.extent_miny != null ||
      this.extent_maxx != null || this.extent_maxy != null)
    {
      if (this.extent.length == 4)
      {
        if (this.extent_minx != this.extent[0])
        {
          this.extent[0] = this.extent_minx;
          b_extent_changed = true;
          if (this.extent_minx == "")
            b_extent_is_null = true;
        }
        if (this.extent_miny != this.extent[1])
        {
          this.extent[1] = this.extent_miny;
          b_extent_changed = true;
          if (this.extent_miny == "")
            b_extent_is_null = true;
        }
        if (this.extent_maxx != this.extent[2])
        {
          this.extent[2] = this.extent_maxx ;
          b_extent_changed = true;
          if (this.extent_maxx == "")
            b_extent_is_null = true;
        }
        if (this.extent_maxy != this.extent[3])
        {
          this.extent[3] = this.extent_maxy;
          b_extent_changed = true;
          if(this.extent_maxy == "")
            b_extent_is_null = true;
        }
      }
      else
      {
        b_extent_changed = true;

        this.extent = [ this.extent_minx,this.extent_miny, this.extent_maxx,
          this.extent_maxy];

        if (this.extent_minx == "")
          b_extent_is_null = true;
        if (this.extent_miny == "")
          b_extent_is_null = true;
        if (this.extent_maxx == "")
          b_extent_is_null = true;
        if (this.extent_maxy == "")
          b_extent_is_null = true;
      }
    }

    if(b_extent_changed && this.extent.length>0)
    { 
      if(!b_extent_is_null)
        retObj.extent = this.extent;
      else
        retObj.extent = null;
    }

    // Control if layers are changed or added
    var aChangedLayers = [];

    for(var i=0,n = this.layers.length; i<n ;i++)
    {
      var l = this.layers[i];
      var lChgObj = l.changedKeys();
      if(lChgObj)
      {
        if(this.op == "I") //Don't send the flag
          delete lChgObj.op;
        else
        {
          // Add op to the lChgObj
          lChgObj.op = l.op;
        }
        // Add id to the lChgObj
        lChgObj.id = l.id;

        aChangedLayers.push(lChgObj);
      }
    }
    // Remove from this object the op (because backend know what do)
    delete retObj.op;

    if(aChangedLayers.length > 0)
      retObj.layers = aChangedLayers;

    // Manage wgLayerSource, wgLayerSelectable
    if(this.source)
    {
      if(this.source.changedKeys())
      {
        retObj.source = this.source.stringify();
      }

      if(this.selectable && this.selectable.changedKeys())
        retObj.selectable = this.selectable.stringify();
    }

    // Manage wgLayerQueryable
    if(this.queryable && this.queryable.changedKeys())
      retObj.queryable = this.queryable.stringify();

    // Manage permission 
    if(retObj.permission)
    {
      // Create permission_obj
      retObj.permission_obj = {
        op:"I", name:retObj.permission, description:retObj.permission_descr};

      delete retObj.permission_descr;
    }
    else if(retObj.permission_descr)
    {
      // Create permission_obj
      retObj.permission_obj = {
        op:"U", name:this.permission, description:retObj.permission_descr};

      delete retObj.permission_descr;
    }
    else if(retObj.hasOwnProperty("permission") && retObj.permission == null)
    {
       retObj.permission_obj = {op:"D", name:this._config.permission};

       delete retObj.permission_descr;
    }

    // Manage wgLayerFilter
    if(this.filter && this.filter.changedKeys())
      retObj.filter = this.filter.stringify();

    // Manage wgLayerStyle
    if(this.style && this.style.changedKeys())
      retObj.style = this.style.stringify();
    if(this.cluster_style && this.cluster_style.changedKeys())
      retObj.cluster_style = this.cluster_style.stringify();

    if(this.source)
    {
      /* Automatically determine source's attributes */
      var aAttributeToControl = 
      [
        {id:"selectable", controlled:false},
        {id:"hover", controlled:false},
        {id:"style", controlled:false},
        {id:"cluster_style", controlled:false}
      ];

      var aAttributeChanged = [];
      var dAttribsToSend = {"geom":''};

      for(var i=0;i < aAttributeToControl.length;i++)
      {
        var att = aAttributeToControl[i];
        if (retObj.hasOwnProperty(att.id))
        {
          aAttributeChanged.push(att.id);
          att.controlled = true;
        }
      }

      if (aAttributeChanged.length) // Something is changed
      {
        // Search in changed attributes
        for(var i=0; i<aAttributeChanged.length;i++)
        {
          var chgAttr = aAttributeChanged[i];
          switch (chgAttr)
          {
            case 'selectable':
              findAttribs(retObj.selectable,dAttribsToSend);
              // check feature id and cluster attribute combo
              if (retObj.selectable.feature_id)
                dAttribsToSend[retObj.selectable.feature_id] = '';
              if (retObj.selectable.cluster_attribute)
                dAttribsToSend[retObj.selectable.cluster_attribute] = '';
              break;
            case 'hover':
              findAttribs(retObj.hover,dAttribsToSend);
              break;
            case 'style':
              findAttribs(retObj.style,dAttribsToSend);
              break;
            case 'cluster_style':
              findAttribs(retObj.cluster_style,dAttribsToSend);
              break;
          }
        }

        // Search in not-changed attributes
        for (var i=0; i<aAttributeToControl.length;i++)
        {
          var att = aAttributeToControl[i];
          if (!att.controlled)
          {
            switch (att.id)
            {
              case 'selectable':
                findAttribs(this.selectable,dAttribsToSend);
                break;
              case 'hover':
                findAttribs(this.hover,dAttribsToSend);
                break;
              case 'style':
                findAttribs(this.style,dAttribsToSend);
                break;
              case 'cluster_style':
                findAttribs(this.cluster_style,dAttribsToSend);
                break;
            };
            att.controlled = true;
          }
        }

        /*NOTE Remove 'size' attribute,if exist, from dKeys because it 
         *     cannot be sended */
        if(dAttribsToSend.hasOwnProperty("size"))
          delete dAttribsToSend.size;

        // Replace this.source.attributes
        var dKeys = Object.keys(dAttribsToSend);

        this.source.attributes = [];
        this.source.attributes = dKeys;

        retObj.source = this.source.stringify();
      }
    }

    return angular.equals({},retObj) ? null : retObj;
  }

  wgLayer.prototype.updateChangedKeys = function()
  {
    RWEntity.prototype.updateChangedKeys.call(this);

    /* Call updateChangedKeys to every modified children  */

    // Changed layers
    for(var i=0,n = this.layers.length; i<n ;i++)
    {
      var l = this.layers[i];

      if(l.changedKeys())
      {
        if(this.op == "U")
          l.updateChangedKeys();
      }
    }
    // Searchable
    if(this.searchable && this.searchable.changedKeys())
      this.searchable.updateChangedKeys();

    // Source
    if(this.source && this.source.changedKeys())
      this.source.updateChangedKeys();

    // Legend
    if(this.legend && this.legend.changedKeys())
      this.legend.updateChangedKeys();

    // I18n
    if(this.i18n && this.i18n.changedKeys())
      this.i18n.updateChangedKeys();

    // Queryable
    if(this.queryable && this.queryable.changedKeys())
      this.queryable.updateChangedKeys();

    // Filter
    if(this.filter && this.filter.changedKeys())
      this.filter.updateChangedKeys();

    // Manage style status and cluster style status
    if(this.type == "VECTOR")
    { 
      this.refreshStyleStatus();
      this.refreshClusterStyleStatus();

      // Selectable
      if(this.selectable && this.selectable.changedKeys())
        this.selectable.updateChangedKeys();

      if(this.style)
        this.style.updateChangedKeys();
    }
  }

  // Create a wgLayer's that has some property setted
  wgLayer.prototype.createChildLayer = function()
  {
    var layer = new wgLayer();

    // Find the max child _position to set new 
    var max_position = 0;
    for(var i=0; i<this.layers.length; i++)
    {
      var l = this.layers[i];
      if(l._position > max_position)
        max_position = l._position;
    }
    // Set _position,category's id, depth, id_parent
    layer._position = max_position +1;
    layer.id_category = this.id_category;
    layer.depth = this.depth +1;
//       layer.image_id = null;
    // Set the parent id to the layer
    layer.id_parent = this.id;

    /* NOTE if this entity has a source, it's a layer container and so
    * its children can't have children. Into children will be specified only
    * the layername.
    */
    if(this.source && this.source.url != undefined)
    {
      layer._enableSourceAndType = false;
      layer._canHaveChildren = false;
      // Set the parent's source used to load service capabilities
      layer._parentSource = this.source;
      // Set the parent's tiled 
      layer.tiled = this.tiled;
      // Set the parent's min_scale and max_scale
      layer.min_scale = this.min_scale;
      layer.max_scale = this.max_scale;
      // Set the parent's initial visibility
      layer.visible = this.visible;
    }

    return layer;
  }

  // Set tiled to this layer and its children
  wgLayer.prototype.setTiled = function(t)
  {
    this.tiled = t;
    for(var i=0; i < this.layers.length;i++)
    {
      var childLayer = this.layers[i];
      childLayer.setTiled(t);
    }
  }

  // Set min scale to this layer and its children
  wgLayer.prototype.setMinScale = function(s)
  {
    this.min_scale = s;
    for(var i=0; i < this.layers.length;i++)
    {
      var childLayer = this.layers[i];
      childLayer.setMinScale(s);
    }
  }

  // Set max scale to this layer and its children
  wgLayer.prototype.setMaxScale = function(s)
  {
    this.max_scale = s;
    for(var i=0; i < this.layers.length;i++)
    {
      var childLayer = this.layers[i];
      childLayer.setMaxScale(s);
    }
  }
  // Set initial visibility to this layer and its children
  wgLayer.prototype.setInitialVisibility = function(v)
  {
    this.visible =v;
    for(var i=0; i < this.layers.length;i++)
    {
      var childLayer = this.layers[i];
      childLayer.setInitialVisibility(v);
    }
  }

  wgLayer.prototype.updateCanHaveChildren = function()
  {
    if(this.op == "U")
    {
      if(this.source && this.source.url != undefined)
      {
        /* If a WMS layer has source and layer_name, can't have children; 
          * instead WFS  can have children */
        if(this.type == "VECTOR")
          this._canHaveChildren = true;
        else
        {
          if(this.source.hasOwnProperty("layer_name") && 
            this.source.layer_name != null)
            this._canHaveChildren = false;
          else
            this._canHaveChildren = true;
        }
      }
      else
      {
        if(!this.hasOwnProperty("_canHaveChildren"))
          this._canHaveChildren = true;
      }
    }
  }

  wgLayer.prototype.createLayerStyle = function()
  {
    var styleObj = new wgLayerStyle();
    return styleObj;
  }

  wgLayer.prototype.createLayerStyleClasses = function()
  {
    var styleObj = new wgLayerStyleClasses();
    return styleObj;
  }

  /* Private functions */

  /*
   * Find attribute in [[ ]] (ex. [[surname]]) into a specified object.
   * Find, also, attribute if used as property_name.
   * obj: object where search attributes in [[ ]];
   * dRes: result dictionary where push finded attributes name
   */
  function findAttribs(obj,dRes)
  {
    if (!obj)
      return;

    var objType = typeof obj;
    switch (objType)
    {
      case "string": 
        var regExp = /\[\[(.*?)\]\]/g;
        var matches;
        while (matches = regExp.exec(obj))
        {
          var att = matches[1];

          // Insert into attributes dictionary
          dRes[att] = '';
        }
        break;
      case "object":
        for (var k in obj)
        {
          /* In categorized style, attributes are selected in property_name;
           * In selectable, attributes are writed in key; */
          if (k == 'property_name' || k == 'key')
          { 
            var name = obj[k];
            if (name != undefined)
              dRes[name] = '';
          }

          findAttribs(obj[k],dRes);
        }
        break;
    }
    return;
  };

  return wgLayer;
};


function baseLayerFactory(RWEntity,wgLayerSource,wgLayerSearch,wgLayerLegend,
  wgI18NObj,rwHttpSvc)
{
  // RWEntity inheritance
  wgBaseLayer.prototype = new RWEntity();

  // wgBaseLayer entity
  function wgBaseLayer(cfg)
  {
    RWEntity.call(this,cfg,[
      "id",
      "label",
      "type",
      "image",
      "tiled",
      "opacity",
      "_default",
      "_position",
      "print_not_reproject"
    ]);

    this._name = "wgBaseMap";
  };

  wgBaseLayer.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    if(cfg != undefined)
    {
      // Flag used to know what do on Save
      this.op = "U";

      // Manage wgLayerSource
      if(cfg.source)
        this.source = new wgLayerSource(cfg.source);
      else
        this.source = new wgLayerSource();

      // Manage default
      this._default = cfg._default ? cfg._default : false;

      // Manage wgI18NObj
      if(cfg.label)
        this.i18n = new wgI18NObj({label_key:cfg.label});
    }
    else
    {
      // Flag used to know what do on Save
      this.op = "I"; 

      var self = this;
      rwHttpSvc.get("/webgis/serialId",function(res)
      {
        if(res && res.result)
        {
          self.id = res.result;
          self._default = false;
          self.label = "WEBGIS.LAYER.BASELAY_"+self.id;
          self.source = new wgLayerSource();
          self.i18n = new wgI18NObj({label_key:self.label});

          // Set default values
          self.type = "IMAGE"; // It's fixed for baselayer!
          self.opacity = 1;
          self.tiled = false;
        }
        else
          console.error("wgBaseLayer ERROR: unable to get serial id!");
      });
    }
  };

  wgBaseLayer.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);

    /* Manage  wgLayerSource */
    if(!retObj)
      retObj = {};

    // Control if i18n is changed
    var chgObj_I18N = this.i18n.changedKeys();
    if(chgObj_I18N)
      retObj.i18n = chgObj_I18N;

    // Manage wgLayerSource
    if(this.source)
    {
      var sourceChgObj = this.source.changedKeys();
      if(sourceChgObj)
        retObj.source = this.source.stringify();
    }

    return angular.equals({},retObj) ? null : retObj;
  }

  wgBaseLayer.prototype.updateChangedKeys = function()
  {
    RWEntity.prototype.updateChangedKeys.call(this);

    // Source
    if(this.source && this.source.changedKeys())
      this.source.updateChangedKeys();

    // I18n
    if(this.i18n && this.i18n.changedKeys())
      this.i18n.updateChangedKeys();
  }
  return wgBaseLayer;
};

function layerSourceFactory(RWEntity)
{
  // RWEntity inheritance
  wgLayerSource.prototype = new RWEntity();

  function wgLayerSource(cfg)
  {
    this.imageExtent = [];
    this.imageSize   = [];
    this.minx = null;
    this.miny = null;
    this.maxx = null;
    this.maxy = null;
    this.imgHeight = null;
    this.imgWidth  = null;

    this.attributes = []; // Attributes to return when layer is viewed
    // Array used into the view
    this.attributesForView = [];

    RWEntity.call(this,cfg,[
      "type",
      "url",
      "layer_name",
      "projection",
      "transparent",
      "format",
      "version",
      "cluster",
      "clusterDist",
      "strategy"
    ]);

    this._name = "wglayersource";
  };

  wgLayerSource.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    this.show_attributes = false;

    if(cfg != undefined)
    {
      // Flag used to know what do on Save
      this.op = "U";

      if(cfg.imageExtent && cfg.imageExtent.length == 4)
      {
        this.minx = cfg.imageExtent[0];
        this.miny = cfg.imageExtent[1];
        this.maxx = cfg.imageExtent[2];
        this.maxy = cfg.imageExtent[3];

        this.imageExtent = [this.minx,this.miny,this.maxx,this.maxy];
      }

      if(cfg.imageSize && cfg.imageSize.length == 2)
      {
        this.imgWidth  = cfg.imageSize[0];
        this.imgHeight = cfg.imageSize[1];

        this.imageSize = [this.imgWidth,this.imgHeight];
      }

      if(cfg.attributes)
        this.attributes = cfg.attributes;
    }
    else
    {
      // Flag used to know what do on Save
      this.op = "I";
    }
  }

  wgLayerSource.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);

    if(!retObj)
      retObj = {};

    // Manage image size change
    var b_size_changed = false;
    var b_size_is_null = false;
    if (this.imgWidth != null || this.imgHeight != null)
    {
      if (this.imageSize.length == 2)
      {
        if (this.imgWidth != this.imageSize[0])
        {
          this.imageSize[0] = this.imgWidth*1;
          b_size_changed = true;
          if (this.imgWidth == "")
            b_size_is_null = true;
        }
        if (this.imgHeight != this.imageSize[1])
        {
          this.imageSize[1] = this.imgHeight*1;
          b_size_changed = true;
          if (this.imgHeight == "")
            b_size_is_null = true;
        }
      }
      else
      {
        b_size_changed = true;

        this.imageSize = [this.imgWidth*1,this.imgHeight*1];

        if (this.imgWidth == "")
          b_size_is_null = true;
        if (this.imgHeight == "")
          b_size_is_null = true;
      }
    }

    if(b_size_changed && this.imageSize.length>0)
    { 
      if(!b_size_is_null)
        retObj.imageSize = this.imageSize;
      else
        retObj.imageSize = null;
    }

    // Manage image extent change
    var b_extent_changed = false;
    var b_extent_is_null = false;
    if (this.minx != null || this.miny != null ||
      this.maxx != null || this.maxy != null)
    {
      if (this.imageExtent.length == 4)
      {
        if (this.minx != this.imageExtent[0])
        {
          this.imageExtent[0] = this.minx*1;
          b_extent_changed = true;
          if (this.minx == "")
            b_extent_is_null = true;
        }
        if (this.miny != this.imageExtent[1])
        {
          this.imageExtent[1] = this.miny*1;
          b_extent_changed = true;
          if (this.miny == "")
            b_extent_is_null = true;
        }
        if (this.maxx != this.imageExtent[2])
        {
          this.imageExtent[2] = this.maxx*1;
          b_extent_changed = true;
          if (this.maxx == "")
            b_extent_is_null = true;
        }
        if (this.maxy != this.imageExtent[3])
        {
          this.imageExtent[3] = this.maxy*1;
          b_extent_changed = true;
          if(this.maxy == "")
            b_extent_is_null = true;
        }
      }
      else
      {
        b_extent_changed = true;

        this.imageExtent = [this.minx*1,this.miny*1,this.maxx*1,this.maxy*1];

        if (this.minx == "")
          b_extent_is_null = true;
        if (this.miny == "")
          b_extent_is_null = true;
        if (this.maxx == "")
          b_extent_is_null = true;
        if (this.maxy == "")
          b_extent_is_null = true;
      }
    }

    if(b_extent_changed && this.imageExtent.length>0)
    { 
      if(!b_extent_is_null)
        retObj.imageExtent = this.imageExtent;
      else
        retObj.imageExtent = null;
    }

    if(this.op == "I")
    {
      if(this.type && this.type == "VECTOR")
      {
        var aAttributes = ["geom"];

        for(var i=0; i< this.attributesForView.length;i++)
        {
          var attr = this.attributesForView[i];

          if(attr.checked)
          {
            var new_attr = {};

            angular.copy(attr,new_attr);
            delete new_attr.checked;

            aAttributes.push(new_attr.id);
          }
        }

        if(aAttributes.length >1)
          retObj.attributes = aAttributes;
      }
    }
    else if(this.op == "U")
    {
      if(this.type && this.type == "VECTOR")
      {
        var new_attributes = ["geom"];
        if(this.attributesForView.length >0) // attributesForView were loaded
        {
          for(var i=0; i<this.attributesForView.length;i++)
          {
            var attr = this.attributesForView[i];
            if(attr.checked)
              new_attributes.push(attr.id);
          }

          /* Control if attributes were changed */
          if(this.attributes.length != new_attributes.length) 
            retObj.attributes = new_attributes;
          else
          {
            var found = false;
            for(var i=0; i< this.attributes.length && !found;i++)
            {
              if(this.attributes[i] != new_attributes[i])
                found = true;
            }
            if(found)
              retObj.attributes = new_attributes;
          }
        }
      }
    }

    return angular.equals({},retObj) ? null : retObj;
  }

  wgLayerSource.prototype.updateChangedKeys = function()
  {
    RWEntity.prototype.updateChangedKeys.call(this);

    if(this.op == "I")
      this.op = "U";

    this.show_attributes = false;

    if(this.type && this.type == "VECTOR")
    {
      this.attributes = ["geom"];
      // Update attributes array
      for(var i=0; i< this.attributesForView.length;i++)
      {
        var attr = this.attributesForView[i];

        if(attr.checked)
          this.attributes.push(attr.id);
      }
    }

  }

  wgLayerSource.prototype.addAttribute = function(obj)
  {
    var attr = {};
    if(obj!= null)
    {
      if(obj.hasOwnProperty("id"))
        attr.id = obj.id;
      else // Initially id and name are the same
        attr.id = obj.name;

      attr.name = obj.name;
      attr.checked = obj.checked != undefined ? obj.checked : false;
    }
    // Add the object to the attributesForView
    this.attributesForView.push(attr); 
  }

  // Get attributes and checked into attributesForView
  wgLayerSource.prototype.refreshCheckedAttribute = function()
  {
    if(this.attributes.length >0)
    {
      // Array used into the view
      if(this.attributesForView.length > 0)
      {
        for(var i=0; i < this.attributes.length; i++)
        {
          var attr = this.attributes[i];
          for(var j=0,found = false; j < this.attributesForView.length && !found; j++)
          {
            var attrForview = this.attributesForView[j];
            if(attr == attrForview.id)
            {
              found = true;
              attrForview.checked = true;
            }
          }
        }
      }
      else
        console.error("wgLayerSource.refreshCheckedAttribute ERROR:empty attributesForView!"); 
    }
  }

  wgLayerSource.prototype.stringify = function()
  {
    var retObj = {};

    for (var i = 0;i < this._aKey.length;i++)
    {
      var key = this._aKey[i];

      if (this[key] != this._config[key])
        retObj[key] = this[key] != undefined ? this[key] : null;
      else
      {
        if(this._config[key] != undefined)
          retObj[key] = this._config[key];
      }
    }

    if(this.type && this.type == "VECTOR")
      retObj.attributes = this.attributes;

    if(this.type && this.type == "STATIC_IMAGE")
    {
      if (this.imageSize && this.imageSize.length == 2)
        retObj.imageSize = this.imageSize;

      if (this.imageExtent && this.imageExtent.length == 4)
        retObj.imageExtent = this.imageExtent;
    }

    // Remove op
    delete retObj.op;

    return JSON.stringify(retObj);
  }

  return wgLayerSource;
};

function layerSearchFactory(RWEntity)
{
  // RWEntity inheritance
  wgLayerSearch.prototype = new RWEntity();

  function wgLayerSearch(cfg)
  {
    this.params = [];
    this.result = [];
    this.attributesForView = [];

    RWEntity.call(this,cfg,[]);

    this._name = "wglayersearch";
    this.hasDetail = false;
  };

  wgLayerSearch.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    if(cfg != undefined)
    {
      // Flag used to know what do on Save
      this.op = "U";

      if(cfg.params)
        this.params = cfg.params;

      if(cfg.result)
        this.result = cfg.result;
    }
    else
    {
      // Flag used to know what do on Save
      this.op = "I";
    }
  }

  wgLayerSearch.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);

    if(!retObj)
      retObj = {};

    if(this.op == "I")
    {
      var tempParams = [];
      var tempResult = [];

      for(var i=0; i< this.attributesForView.length;i++)
      {
        var attr = this.attributesForView[i];

        var attrObj = {};

        attrObj.id = attr.id;
        attrObj.name = attr.name;
        attrObj.type = attr.type;

        if(attr.searchable)
          tempParams.push(attrObj);

        if(attr.returned)
          tempResult.push(attrObj);
      }

      // Send params and result only if they aren't empty
      if(tempParams.length > 0)
        retObj.params = tempParams;

      if(tempResult.length > 0)
        retObj.result = tempResult;
    }
    else if(this.op == "U")
    {
      var new_params = [];
      var new_results = [];

      if(this.attributesForView.length >0) // attributesForView were loaded
      {
        for(var i=0; i<this.attributesForView.length;i++)
        {
          var attr = this.attributesForView[i];

          var attrObj = {};

          attrObj.id = attr.id;
          attrObj.name = attr.name;
          attrObj.type = attr.type;

          if(attr.searchable)
            new_params.push(attrObj);

          if(attr.returned)
            new_results.push(attrObj);
        }

        if(new_results.length != this.result.length)
          retObj.result = new_results;
        else
        {
          var foundDiff = false;
          for(var i=0; i<new_results.length && !foundDiff;i++)
          {
            if(!angular.equals(new_results,this.result))
              foundDiff = true;
          }
          if(foundDiff)
            retObj.result = new_results;
        }

        if(new_params.length != this.params.length)
          retObj.params = new_params;
        else
        {
          var foundDiff = false;
          for(var i=0; i<new_params.length && !foundDiff;i++)
          {
            if(!angular.equals(new_params,this.params))
              foundDiff = true;
          }
          if(foundDiff)
            retObj.params = new_params;
        }
      }
    }

    return angular.equals({},retObj) ? null : retObj;
  }

  wgLayerSearch.prototype.stringify = function()
  {
    var retObj = {};

    for (var i = 0;i < this._aKey.length;i++)
    {
      var key = this._aKey[i];

      if (this[key] != this._config[key])
        retObj[key] = this[key] != undefined ? this[key] : null;
      else
        retObj[key] = this._config[key];
    }

    // Manage attributes
    retObj.params = [];
    retObj.result = [];

    for(var i=0; i< this.attributesForView.length;i++)
    {
      var attr = this.attributesForView[i];

      var attrObj = {};

      attrObj.id = attr.id;
      attrObj.name = attr.name;
      attrObj.type = attr.type;

      if(attr.searchable)
        retObj.params.push(attrObj);

      if(attr.returned)
         retObj.result.push(attrObj);
    }

    // Don't send result if it is empty
    if(retObj.result.length == 0)
      delete retObj.result;
    // Don't send params if it is empty
    if(retObj.params.length == 0)
      delete retObj.params;

    return angular.equals({},retObj) ? null : retObj;
  }

  wgLayerSearch.prototype.updateChangedKeys = function()
  {
    RWEntity.prototype.updateChangedKeys.call(this);

    if(this.op == "I")
      this.op = "U";

    this.params = [];
    this.result = [];

    for(var i=0; i< this.attributesForView.length;i++)
    {
      var attr = this.attributesForView[i];

      var attrObj = {};

      attrObj.id = attr.id;
      attrObj.name = attr.name;
      attrObj.type = attr.type;

      if(attr.searchable)
        this.params.push(attrObj);

      if(attr.returned)
        this.result.push(attrObj);
    }

  }

  // Get attributes and checked into attributesForView
  wgLayerSearch.prototype.refreshCheckedAttribute = function()
  {
    // Array used into the view
    if(this.attributesForView.length > 0)
    {
      for(var i=0; i < this.params.length; i++)
      {
        var attr = this.params[i];
        for(var j=0,found = false; j < this.attributesForView.length && !found; j++)
        {
          var attrForview = this.attributesForView[j];
          if(attr.id == attrForview.id)
          {
            found = true;
            attrForview.searchable = true;
            // Update the showed name
            attrForview.name = attr.name;
          }
        }
      }

      for(var i=0; i < this.result.length; i++)
      {
        var attr = this.result[i];
        for(var j=0,found = false; j < this.attributesForView.length && !found; j++)
        {
          var attrForview = this.attributesForView[j];
          if(attr.id == attrForview.id)
          {
            found = true;
            attrForview.returned = true;
            // Update the showed name
            attrForview.name = attr.name;
          }
        }
      }
    }
    else
      console.error("wgLayerSearch.refreshCheckedAttribute ERROR:empty attributesForView!"); 
  }

  wgLayerSearch.prototype.reset = function()
  {
    this.result = [];
    this.params = [];
  }

  wgLayerSearch.prototype.addAttribute = function(obj)
  {
    var attr = {};
    if(obj!= null)
    {
      if(obj.hasOwnProperty("id"))
        attr.id = obj.id;
      else // Initially id and name are the same
        attr.id = obj.name;

      attr.searchable = false;
      attr.returned = false;
      attr.type = obj.localType ? obj.localType : obj.type;
      attr.name = obj.name;
      attr.checked = obj.checked != undefined ? obj.checked : false;
    }
    // Add the object to the attributesForView
    this.attributesForView.push(attr); 
  }

  return wgLayerSearch;
};

function layerLegendFactory(RWEntity,rwHttpSvc,wgLayerLegendClass,wgI18NObj)
{
  // RWEntity inheritance
  wgLayerLegend.prototype = new RWEntity;

  function wgLayerLegend(cfg)
  {
    this.classes = [];
    this.class_presence = false;

    RWEntity.call(this,cfg,[
      "id",
      "id_layer",
      "label",
      "image",
      "extern"
    ]);
    this._name = "wgLegend";
  };

  wgLayerLegend.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    if(cfg != undefined)
    {
      // Flag used to know what do on Save
      this.op = "U";

      if(cfg.classes)
      {
        for(var i=0;i<cfg.classes.length;i++)
        {
          var c = new wgLayerLegendClass(cfg.classes[i]);
          // Set the id_leged to this
          c.id_legend = this.id;
          // Set the _position
          c._position = (i+1);

          this.classes.push(c);
        }
      }

      // Manage wgI18NObj
      if(cfg.label)
        this.i18n = new wgI18NObj({label_key:cfg.label});
      else
        this.i18n = new wgI18NObj();
    }
    else
    {
      // Flag used to know what do on Save
      this.op = "I";

      this.id = null;
      this.id_layer = null;
      this.label = null;
      this.image = null;
      this.extern = null;
      this.i18n = new wgI18NObj();
    }
  };

  wgLayerLegend.prototype.getSerialId = function()
  {
    var self = this;

    rwHttpSvc.get("/webgis/serialId",function(res)
    {
      if(res && res.result)
        self.id = res.result;
      else
        console.error("wgLegend ERROR: unable to get serial id!");
    });
  }

  wgLayerLegend.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);

    if(!retObj)
      retObj = {};

    if(this.op == "I")
    {
      if(this.i18n && this.i18n.changedKeys())
      {
        // Set the label
        this.label = "WEBGIS.LEGEND.LEGEND_"+this.id;
        // Set the label into i18n
        this.i18n.setLabelKey(this.label);

        retObj.label = this.label;
        retObj.i18n = this.i18n.changedKeys();
      }
    }
    else if(this.op == "U")
    {
      if(this.i18n && this.i18n.changedKeys() && this.i18n.label == null) 
      {
        // Set the label
        this.label = "WEBGIS.LEGEND.LEGEND_"+this.id;
        // Set the label into i18n
        this.i18n.setLabelKey(this.label);

        retObj.label = this.label;
        retObj.i18n = this.i18n.changedKeys();
      }
    }

    // Control if legend class are changed or added
    var classesToIns = [];
    var classesToUpd = [];

    for(var i=0,n = this.classes.length; i<n ;i++)
    {
      var c = this.classes[i];
      var classChgObj = c.changedKeys();

      if(c.op == "I")
        classesToIns.push(classChgObj);
      else // Control if it's changed
      {
        if(classChgObj)
        {
          // Add id to the changed keys obj
          classChgObj.id = c.id;
          classesToUpd.push(classChgObj);
        }
      }
    }
    // Return classesToIns & classesToUpd array only if populated
    if(classesToIns.length >0)
      retObj.classesToIns = classesToIns;

    if(classesToUpd.length>0)
      retObj.classesToUpd = classesToUpd;

    if(!angular.equals({},retObj))// Add the id
      retObj.id = this.id;

    return angular.equals({},retObj) ? null : retObj;
  }

  wgLayerLegend.prototype.updateChangedKeys = function()
  {
    RWEntity.prototype.updateChangedKeys.call(this);

    if(this.op == "I")
      this.op = "U";

    if(this.i18n && this.i18n.changedKeys())
      this.i18n.updateChangedKeys();

    /* Manage Classes */
    for(var i=0,n = this.classes.length; i<n ;i++)
    {
      var c = this.classes[i];

      if(c.op == "U")
      {
        if(c.changedKeys())
          c.updateChangedKeys();
      }
    }
  }

  return wgLayerLegend;
};

function layerLegendClassFactory(RWEntity,rwHttpSvc,wgI18NObj)
{
  // RWEntity inheritance
  wgLayerLegendClass.prototype = new RWEntity;

  function wgLayerLegendClass(cfg)
  {
    RWEntity.call(this,cfg,[
      "id",
      "id_legend",
      "name",
      "image",
      "_position"
    ]);

    this._name = "wgLegendClass";
  };

  wgLayerLegendClass.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    if(cfg != undefined)
    {
      // Flag used to know what do on Save
      this.op = "U";
      // Manage wgI18NObj
      if(cfg.name)
        this.i18n = new wgI18NObj({label_key:cfg.name});
      else
        this.i18n = new wgI18NObj();
    }
    else
    {
      // Flag used to know what do on Save
      this.op = "I";
      this.i18n = new wgI18NObj();
    }
  };

  wgLayerLegendClass.prototype.getSerialId = function()
  {
    var self = this;
    rwHttpSvc.get("/webgis/serialId",function(res)
    {
      if(res && res.result)
        self.id = res.result;
      else
        console.error("wgLegendClass ERROR: unable to get serial id!");
    });
  }

  wgLayerLegendClass.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);
    if(!retObj)
      retObj = {};

    if(this.op == "I")
    {
      if(this.i18n && this.i18n.changedKeys())
      {
        // Set the name
        retObj.name = "WEBGIS.LEGEND.LEGENDCLASS_"+this.id;
        // Set the label into i18n
        this.i18n.setLabelKey(retObj.name);

        retObj.i18n = this.i18n.changedKeys();
      }
    }
    else if(this.op == "U")
    {
      if(this.i18n && this.i18n.changedKeys() && this.i18n.label == null) 
      {
        // Set the name
        retObj.name = "WEBGIS.LEGEND.LEGENDCLASS_"+this.id;
        // Set the label into i18n
        this.i18n.setLabelKey(retObj.name);

        retObj.i18n = this.i18n.changedKeys();
      }
    }
    return angular.equals({},retObj) ? null : retObj;
  }

  return wgLayerLegendClass;
};

function i18NFactory(RWEntity,rwConfigSvc,rwI18NSvc)
{
  // RWEntity inheritance
  wgI18NObj.prototype = new RWEntity;

  function wgI18NObj(cfg)
  {
    /* Get Languages from rwConfigSvc to add the languages as entity's attributes */
    var aAttribute = ["label_key"];
    for(var i=0,numLang=rwConfigSvc.languages.length;i<numLang;i++)
    {
      var lang = rwConfigSvc.languages[i];
      aAttribute.push(lang);
    }

    // Create the correct cfg that include
    if(cfg!= undefined)
    {
      var cfgWithTranslations = rwI18NSvc.i18nForKey(cfg.label_key);
      if(!cfgWithTranslations)
        cfgWithTranslations = {};
      cfgWithTranslations.label_key = cfg.label_key;

      // Create the entity
      RWEntity.call(this,cfgWithTranslations,aAttribute);
    }
    else
      RWEntity.call(this,{label_key:null},aAttribute);

    this._name = "wgI18NObj";
  };

  wgI18NObj.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);

    if(retObj)
    {
      // Add the label_key
      retObj.label_key = this.label_key;
    }

    return retObj;
  }

  wgI18NObj.prototype.setLabelKey = function(lbl_key)
  {
    if (lbl_key == null)
      return;

    this.label_key = lbl_key;
  }
  return wgI18NObj;
};

function layerQueryableFactory(RWEntity)
{
  // RWEntity inheritance
  wgLayerQueryable.prototype = new RWEntity;

  function wgLayerQueryable(cfg)
  {
    this.result = [];
    // Array used into the view
    this.properties = []; 

    RWEntity.call(this,cfg,[
      "info_format",
      "feature_id"
    ]);

    this._name = "wglayerqueryable";
  };

  wgLayerQueryable.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    if(cfg != undefined)
    {
      // Flag used to know what do on Save
      this.op = "U";

      if(cfg.result)
        this.result = cfg.result;

      // Added checked attribute to fix ChangedKeys's bug
      for(var i=0; i<this.result.length; i++)
      {
        var obj = this.result[i];
        obj.checked = true;
      }
    }
    else
    {
      this.op = "I";
      this.result = [];
    }
  };

  wgLayerQueryable.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);

    if(!retObj)
      retObj = {};

    if(this.op == "I")
    {
      var tempResult = [];
      for(var i=0; i< this.properties.length;i++)
      {
        var prop = this.properties[i];

        if(prop.checked)
          tempResult.push(prop);
      }
      // Send result only if it's not empty
      if(tempResult.length > 0)
        retObj.result = tempResult;
    }
    else if(this.op == "U")
    {
      var new_result = [];
      if(this.properties.length>0) // Properties were loaded
      {
        for(var i=0; i<this.properties.length;i++)
        {
          var prop = this.properties[i];
          if(prop.checked)
            new_result.push(prop);
        }
        if(new_result.length != this.result.length)
          retObj.result = new_result;
        else
        {
          var foundDiff = false;

          for(var i=0; i<new_result.length && !foundDiff;i++)
          {
            var val1 = new_result[i], val2 = this.result[i];

            if (val1.checked !== val2.checked || val1.id !== val2.id ||
                val1.name !== val2.name || val1.type !== val2.type) 
            {
              foundDiff = true;
            }
          }
          if(foundDiff)
            retObj.result = new_result;
        }
      }
    }

    return angular.equals({},retObj) ? null : retObj;
  }

  wgLayerQueryable.prototype.stringify = function()
  {
    var retObj = {};

    for (var i = 0;i < this._aKey.length;i++)
    {
      var key = this._aKey[i];

      if (this[key] != this._config[key])
        retObj[key] = this[key] != undefined ? this[key] : null;
      else
        retObj[key] = this._config[key];
    }

    // Manage properties
    retObj.result = [];
    for(var i=0; i< this.properties.length;i++)
    {
      var prop = this.properties[i];

      if(prop.checked)
      {
        var propObj = {};
        propObj.id = prop.id;
        propObj.name = prop.name;
        propObj.type = prop.type;

        retObj.result.push(propObj);
      }
    }
    // Don't send result if it is empty
    if(retObj.result.length == 0)
      delete retObj.result;

    if(this.op == "I")
    {
      // Set the default value for info_format
      this.info_format = "application/json";
      retObj.info_format = this.info_format;
    }

    return angular.equals({},retObj) ? null : retObj;
  }

  wgLayerQueryable.prototype.updateChangedKeys = function()
  {
    RWEntity.prototype.updateChangedKeys.call(this);

    if(this.op == "I")
      this.op = "U";

    // Update result array
    this.result = [];
    for(var i=0; i< this.properties.length;i++)
    {
      var attr = this.properties[i];

      if(attr.checked)
        this.result.push(attr);
    }
  }

  // Get result and checked into properties
  wgLayerQueryable.prototype.refreshCheckedAttribute = function()
  {
    if(this.result.length >0)
    {
      // Array used into the view
      if(this.properties.length > 0)
      {
        for(var i=0; i < this.result.length; i++)
        {
          var attr = this.result[i];
          for(var j=0,found = false; j < this.properties.length && !found; j++)
          {
            var attrForview = this.properties[j];
            if(attr.id == attrForview.id)
            {
              found = true;
              attrForview.checked = true;
              attrForview.name = attr.name;
              attrForview.type = attr.type;
            }
          }
        }
      }
      else
        console.error("wgLayerQueryable.refreshCheckedAttribute ERROR:empty properties!"); 
    }
  }

  wgLayerQueryable.prototype.addProperty = function(obj)
  {
    var property = {};
    if(obj!= null)
    {
      if(obj.hasOwnProperty("id"))
        property.id = obj.id;
      else // Initially id and name are the same
        property.id = obj.name;

      property.name = obj.name;
      property.checked = obj.checked != undefined ? obj.checked : false;
      property.type = obj.type != undefined ? obj.type : null;
    }
    // Add the object to the properties
    this.properties.push(property); 
  }

  return wgLayerQueryable;
};

function layerSelectableFactory(RWEntity)
{
  // RWEntity inheritance
  wgLayerSelectable.prototype = new RWEntity;

  function wgLayerSelectable(cfg)
  {
    this.result = [];
    this.attributes = [];

    // Array used into the view
    this.tableRows = [];

    RWEntity.call(this,cfg,[
      "feature_id",
      "cluster_attribute"
    ]);

    this._name = "wglayersearchable";
  };

  wgLayerSelectable.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    if(cfg != undefined)
    {
      // Flag used to know what do on Save
      this.op = "U";

      if(cfg.complex_data)
        this.result = cfg.complex_data;

      // Added checked attribute to fix ChangedKeys's bug
      for(var i=0; i<this.result.length; i++)
      {
        var obj = this.result[i];
        obj.checked = true;
      }
    }
    else
    {
      this.op = "I";
    }
  };

  wgLayerSelectable.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);

    if(!retObj)
      retObj = {};

    if(this.op == "I")
    {
      var tempResult = [];
      for(var i=0; i< this.tableRows.length;i++)
      {
        var prop = this.tableRows[i];

        if(prop.checked)
          tempResult.push(prop);
      }
      // Send complex_data only if it's not empty
      if(tempResult.length > 0)
        retObj.complex_data = tempResult;
    }
    else if(this.op == "U")
    {
      var new_result = [];
      if(this.tableRows.length>0) // Rows were loaded
      {
        for(var i=0; i<this.tableRows.length;i++)
        {
          var prop = this.tableRows[i];
          if(prop.checked)
            new_result.push(prop);
        }
        if(new_result.length != this.result.length)
          retObj.complex_data = new_result;
        else
        {
          var foundDiff = false;

          for(var i=0; i<new_result.length && !foundDiff;i++)
          {
            var val1 = new_result[i], val2 = this.result[i];

            if (val1.checked !== val2.checked || val1.id !== val2.key ||
                val1.name !== val2.label || val1.type !== val2.type) 
            {
              foundDiff = true;
            }
          }

          if(foundDiff)
            retObj.complex_data = new_result;
        }
      }
    }

    return angular.equals({},retObj) ? null : retObj;
  }

  wgLayerSelectable.prototype.stringify = function()
  {
    var retObj = {};

    for (var i = 0;i < this._aKey.length;i++)
    {
      var key = this._aKey[i];

      if (this[key] != this._config[key])
        retObj[key] = this[key] != undefined ? this[key] : null;
      else
        retObj[key] = this._config[key];
    }

    // Manage rows
    retObj.complex_data = [];
    for(var i=0; i< this.tableRows.length;i++)
    {
      var prop = this.tableRows[i];

      if(prop.checked)
      {
        var propObj = {};
        propObj.key = prop.id;
        propObj.label = prop.name;
        propObj.type = prop.type;

        retObj.complex_data.push(propObj);
      }
    }
    // Don't send complex_data if it is empty
    if(retObj.complex_data.length == 0)
      delete retObj.complex_data;

    return angular.equals({},retObj) ? null : retObj;
  }

  wgLayerSelectable.prototype.updateChangedKeys = function()
  {
    RWEntity.prototype.updateChangedKeys.call(this);

    if(this.op == "I")
      this.op = "U";

    // Update result array
    this.result = [];
    for(var i=0; i< this.tableRows.length;i++)
    {
      var attr = this.tableRows[i];

      if(attr.checked)
        this.result.push({key:attr.id,label:attr.name,type:attr.type});
    }
  }

  // Get result and checked into tableRows
  wgLayerSelectable.prototype.refreshCheckedAttribute = function()
  {
    if(this.result.length >0)
    {
      // Array used into the view
      if(this.tableRows.length > 0)
      {
        for(var i=0; i < this.result.length; i++)
        {
          var attr = this.result[i];
          for(var j=0,found = false; j < this.tableRows.length && !found; j++)
          {
            var attrForview = this.tableRows[j];
            if(attr.key == attrForview.id)
            {
              found = true;
              attrForview.checked = true;
              attrForview.name = attr.label;
              attrForview.type = attr.type;
            }
          }
        }
      }
    }
  }

  wgLayerSelectable.prototype.addAttribute = function(obj)
  {
    var attr = {};
    if(obj!= null)
    {
      if(obj.hasOwnProperty("id"))
        attr.id = obj.id;
      else // Initially id and name are the same
        attr.id = obj.name;

      attr.name = obj.name;
      attr.checked = obj.checked != undefined ? obj.checked : false;
    }
    // Add the object to attributes
    this.attributes.push(attr); 
  }

  wgLayerSelectable.prototype.setTableDs = function(aArray)
  {
    this.tableRows = [];
    if (Array.isArray(aArray))
    {
      for(var i=0;i<aArray.length;i++)
      {
        var item = aArray[i];
        if(item.id != "geom")
          this.tableRows.push(item);
      }
    }
  }

  return wgLayerSelectable;
};

function layerFilterFactory(RWEntity)
{
  // RWEntity inheritance
  wgLayerFilter.prototype = new RWEntity;

  function wgLayerFilter(cfg)
  {
    //TODO Read operators from context?
    var operators = ["EQ","ILIKE","LT","LTE","NEQ","GT","GTE","BETWEEN","NOT_IN","IS_NULL"];

    // Set operators to filter 
    this.setOperators(operators);

    RWEntity.call(this,cfg,[
      "property_name",
      "operator",
      "property_val"
    ]);

    this._name = "wglayerfilter";
  };

  wgLayerFilter.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg); 

    if(cfg != undefined)
    {
      // Flag used to know what do on Save
      this.op = "U";

      // According to the operator from property_val populate min and, if necessary, max
      if(cfg.operator)
      {
        switch(cfg.operator)
        {
          case "BETWEEN": 
            if(cfg.property_val instanceof Array)
            {
              if(cfg.property_val.length == 2)
              {
                this.min = cfg.property_val[0];
                this.max = cfg.property_val[1];
              }
              else
                console.error("wgLayerFilter update error: property_val hasn't min and max!");
            }
            else
              console.error("wgLayerFilter update error: property_val isn't an array but the operator is BETWEEN!");
            break;

          case "NOT_IN":
            if(cfg.property_val instanceof Array)
              this.min = cfg.property_val.join();
            else
              console.error("wgLayerFilter update error: property_val isn't an array but the operator is NOT_IN!");
            break;

          default: 
            this.min = cfg.property_val;
            break;
        }
      }
    }
    else
    {
      // Flag used to know what do on Save
      this.op = "I";
    }
  }

  wgLayerFilter.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);

    if(!retObj)
      retObj = {};

    this.valueChanged(retObj,this.operator);

    return angular.equals({},retObj) ? null : retObj;
  }

  wgLayerFilter.prototype.stringify = function()
  {
    var retObj = {};

    for (var i = 0;i < this._aKey.length;i++)
    {
      var key = this._aKey[i];

      if(key == "property_val")
      {
        if (this[key] != this._config[key])
        {
          if(this[key] != undefined)
            retObj[key] = this[key] != "" ? this[key] : null;
          else
            retObj[key] = null;
        }
        else
        {
           if(this._config[key] != undefined)
            retObj[key] = this[key] != "" ? this._config[key] : null;
          else
            retObj[key] = null;
        }
      }
      else
      {
        if (this[key] != this._config[key])
          retObj[key] = this[key] != undefined ? this[key] : null;
        else
          retObj[key] = this._config[key] != undefined ? this._config[key] : null;
      }
    }

    this.valueChanged(retObj,this.operator);

    // Control if all is at null
    if(this.property_name == null && this.operatore == null && 
      this.property_val == null)
      retObj = {};

    return angular.equals({},retObj) ? null : retObj;
  }

  wgLayerFilter.prototype.toString = function()
  {
    var str = "";
    var strObj = this.stringify();

    if(strObj)
    {
      if(strObj.property_name != undefined)
        str += strObj.property_name;
      if(strObj.operator != undefined)
        str += " "+ this.operatorI18nStr() +" ";
      if(strObj.property_val != undefined)
        str += strObj.property_val;
    }

    return str;
  }

  // Return the operator's i18n key
  wgLayerFilter.prototype.operatorI18nStr = function()
  {
    var str = "";
    if(this.operator != undefined)
    {
      // Find operator from operators
      for(var i=0,found=false; i< this.operators.length && !found; i++)
      {
        var op = this.operators[i];
        if(op.id == this.operator)
        {
          found = true;
          str += op.name;
        }
      }
    }

    return str;
  }

  wgLayerFilter.prototype.setAttributes = function(aArray)
  {
    this.attributes = [];

    for(var i=0; i<aArray.length; i++)
    {
      if(aArray[i] != "geom")
       this.attributes.push({id:aArray[i], name:aArray[i]});
    }
  }

  wgLayerFilter.prototype.setOperators = function(aArray)
  {
    this.operators = [];

    for(var i=0; i<aArray.length; i++)
    {
      var operands = 1;
      // Set the number of operands in specific cases
      if(aArray[i] == "BETWEEN")
        operands = 2;
      else if (aArray[i] == "NOT_IN")
        operands = "endless";
      else if (aArray[i] == "IS_NULL")
        operands = 0;

      var name = (aArray[i] == "GTE") ? "OPERATOR.GE" : 
        ((aArray[i] == "LTE") ? "OPERATOR.LE" : "OPERATOR."+aArray[i]);

      this.operators.push({
        id: aArray[i],
        name: name,
        operands: operands});
    }
  }

  // If the filter hasn't an existing's property_name into aArray, clear the filter
  wgLayerFilter.prototype.checkFilter = function(aArray)
  {
    // Remove filter if it's property_name has been deleted!
    if(this.property_name != undefined && 
      aArray.indexOf(this.property_name) == -1)
    {
      this.property_name = null;
      this.operator = null;
      this.property_val = null;

      this.min = null;
      this.max = null;
    }
  }

  /* Private functions */
  wgLayerFilter.prototype.valueChanged = function(retObj,op)
  {
    switch(op)
    {
      case "BETWEEN": 

        var different = false;
        var value = [];

        // The user has specified 2 values in 2 different textbox (min e max)
        value.push(this.min);
        value.push(this.max);

        // Control if something is changed
        if(this.property_val instanceof Array)
        {
          if(value.length != this.property_val.length)
            different = true;
          else
          {
            for(var i=0; i<value.length && !different;i++)
            {
              if(value[i] != this.property_val[i])
                different = true;
            }
          }
        }
        else
          different = true;

        if(different)
        {
          this.property_val = value;
          retObj.property_val = value;
        }
        break;

      case "NOT_IN":

        var different = false;
        var value = [];

        // The user has specified n-values in a textbox (min), separate by comma
        var aValues = this.min.split(",");
        for(var i=0; i< aValues.length; i++)
          value.push(aValues[i]);

        // Control if something is changed
        if(this.property_val instanceof Array)
        {
          if(value.length != this.property_val.length)
            different = true;
          else
          {
            for(var i=0; i<value.length && !different;i++)
            {
              if(value[i] != this.property_val[i])
                different = true;
            }
          }
        }
        else
          different = true;

        if(different)
        {
          this.property_val = value;
          retObj.property_val = value;
        }
        break;

      default: 
        // The user specify only one value in min's textbox
        if(this.property_val != this.min)
        {
          this.property_val = this.min;
          retObj.property_val = this.min;
        }
        break;
    }
  }

  return wgLayerFilter;
};

function layerStyleFactory(RWEntity,wgLayerTreeSvc,wgStyle)
{
  // RWEntity inheritance
  wgLayerStyle.prototype = new RWEntity;

  function wgLayerStyle(cfg)
  {
    this.styles = {"default":[],"hover":[],"default_key":null,"hover_key":null};
    this.count_default = 0;
    this.count_hover = 0;

    RWEntity.call(this,cfg,[]);

    this._name = "wglayerstyle";
  };

  wgLayerStyle.prototype.update = function(cfg)
  {
    if(cfg != undefined)
    {
      // Flag used to know what do on Save
      this.op = "U";

      if(cfg.default)
      {
        this.styles.default = [];

        this.count_default = cfg.default.length;

        for(var i=0; i< cfg.default.length;i++)
        {
          var item = cfg.default[i];

          /*NOTE Get styleTypes attribute according to the defined item.type 
           *     and substitude it with the object
           */
          var typeObj = wgLayerTreeSvc.getStylesTypesForName(item.type);
          if(typeObj != null)
            item.type = typeObj;
          this.styles.default.push(new wgStyle(item));
        }
      }

      if(cfg.hover)
      {
        this.styles.hover = [];

        this.count_hover = cfg.hover.length;

        for(var i=0; i< cfg.hover.length;i++)
        {
          var item = cfg.hover[i];

          /*NOTE Get styleTypes attribute according to the defined item.type 
           *     and substitude it with the object
           */
          var typeObj = wgLayerTreeSvc.getStylesTypesForName(item.type);
          if(typeObj != null)
            item.type = typeObj;
          this.styles.hover.push(new wgStyle(item));
        }
      }

      if(cfg.default_key)
        this.styles.default_key = cfg.default_key;
      if(cfg.hover_key)
        this.styles.hover_key = cfg.hover_key;
    }
    else
    {
      this.op = "I";
    }
  }

  wgLayerStyle.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);

    if(!retObj)
      retObj = {};

    this.checkUniqueKeys();

    // Manage default array
    var diff = false;
    for(var i=0;i<this.styles.default.length && ! diff;i++)
    {
      var defStyle = this.styles.default[i];
      if(defStyle.changedKeys())
        diff = true;
    }
    if(diff)
      retObj.styles = this.styles;
    else // Control if there are more/less styles
    {
      if(this.count_default != this.styles.default.length)
        retObj.styles = this.styles;
    }

    // Manage hover array
    diff = false;
    for(var i=0;i<this.styles.hover.length && ! diff;i++)
    {
      var hovStyle = this.styles.hover[i];
      if(hovStyle.changedKeys())
        diff = true;
    }
    if(diff)
      retObj.styles = this.styles;
    else // Control if there are more/less styles
    {
      if(this.count_hover != this.styles.hover.length)
        retObj.styles = this.styles;
    }

    return angular.equals({},retObj) ? null : retObj;
  }

  wgLayerStyle.prototype.updateChangedKeys = function()
  {
    RWEntity.prototype.updateChangedKeys.call(this);

    if(this.op = "I")
      this.op = "U";

    this.count_default = this.styles.default.length;
    this.count_hover = this.styles.hover.length;

    for(var i=0;i<this.styles.default.length;i++)
    {
      var defStyle = this.styles.default[i];
      defStyle.updateChangedKeys();
    }

    for(var i=0;i<this.styles.hover.length;i++)
    {
      var defHover = this.hover.default[i];
      defHover.updateChangedKeys();
    }

  }

  wgLayerStyle.prototype.stringify = function()
  {
    var retObj = {styles:{default:[],hover:[]}};

    for(var i=0;i<this.styles.default.length;i++)
    {
      var defStyle = this.styles.default[i];
      retObj.styles.default.push(defStyle.stringify());
    }

    for(var i=0;i<this.styles.hover.length;i++)
    {
      var hovStyle = this.styles.hover[i];
      retObj.styles.hover.push(hovStyle.stringify());
    }

    // Manage default_key and hover_key
    if(this.styles.default_key == null)
      delete retObj.styles.default_key;
    else
      retObj.styles.default_key = this.styles.default_key;

    if(this.styles.hover_key == null)
      delete retObj.styles.hover_key;
    else
      retObj.styles.hover_key = this.styles.hover_key;

    return angular.equals({},retObj) ? null : retObj;
  }

  wgLayerStyle.prototype.addDefaultObject = function()
  {
    this.styles.default.push(new wgStyle());
  }

  wgLayerStyle.prototype.removeDefaultObject = function(idx)
  {
    this.styles.default.splice(idx,1);
  }

  wgLayerStyle.prototype.defaultObjectAtIndex = function(idx)
  {
    return this.styles.default[idx];
  }
  /* Set layer information used to generate unique keys. 
   * It contains layer's id, a flag to know if it's a child and then a filter.
   * Then is in this format 
   * {
   *  id: "the_layer_Id_",
   *  isCluster: true/false,
   *  isChild: true/false,
   *  filter: {see wgLayerFilter}
   * }
   */
  wgLayerStyle.prototype.setLayerInfo = function(obj)
  {
    this.layerInfo = obj;
  }

  // Check and set unique keys if necessary
  wgLayerStyle.prototype.checkUniqueKeys = function()
  {
    if(this.layerInfo == undefined) //Layer info not setted
      return;

    if(this.layerInfo.isChild) // Is a WFS child
    {
      if(this.styles && (this.styles.default.length || this.styles.hover.length))
      {
        // Unique keys common part
        var key_template = "in_alloc_"+this.layerInfo.id+"_";

        if(this.layerInfo.filter)
        {
          var condVal = this.layerInfo.filter.property_val;
          var condOp = this.layerInfo.filter.operator;

          if(condVal)
          {
            if(condVal instanceof Array)
            {
              var new_condVal = "";
              for(var i=0; i< condVal.length;i++)
              {
                new_condVal +=condVal[i];
              }
              condVal = new_condVal+"_";
            }
            if(condOp)
              key_template += condOp+"_"+condVal+"_";
            else
              key_template += condVal+"_";
          }
        }

        if(this.styles.default.length) // Set default_key
          this.styles.default_key = key_template + "default";
        else 
          delete this.styles.default_key;

        if(this.styles.hover.length) // Set hover_key
          this.styles.hover_key =  key_template + "hover"; 
        else
          delete this.styles.hover_key;
      }
    }
    else if(this.layerInfo.isCluster) //Is a cluster
    {
      // Unique keys common part
      var timestamp = new Date().getTime();
      var key_template = "cluster_"+this.layerInfo.id+"_"+timestamp+"_";

      if(this.styles.default.length) // Set default_key
      {
        this.styles.default_key = key_template + "default";

        // Manage key when an attribute is parametrized
        var parameter = null;
        for(var i=0, found=false ; i<this.styles.default.length && ! found;i++)
        {
          var defObj = this.styles.default[i];

          // Check if there is a parameter (in [[]]) into style's attributes
          parameter = defObj.checkParameter();

          if(parameter != null)
            found = true;
        }
        if(parameter != null) // Add parameter to the key
          this.styles.default_key += parameter;
      }
      else 
        delete this.styles.default_key;

      if(this.styles.hover.length) // Set hover_key
      {
        this.styles.hover_key =  key_template + "hover";

        // Manage key when an attribute is parametrized
        var parameter = null;
        for(var i=0, found=false ; i<this.styles.hover.length && ! found;i++)
        {
          var hovObj = this.styles.hover[i];

          // Check if there is a parameter (in [[]]) into style's attributes
          parameter = hovObj.checkParameter();

          if(parameter != null)
            found = true;
        }
        if(parameter != null) // Add parameter to the key
          this.styles.hover_key += parameter;
      }
      else
        delete this.styles.hover_key;
    }
    else
    {
      // Unique keys common part
      var timestamp = new Date().getTime();
      var key_template = "_"+this.layerInfo.id+"_"+timestamp+"_";

      if(this.styles.default.length) // Set default_key
      {
        // Manage key when an attribute is parametrized
        var parameter = null;
        for(var i=0, found=false ; i<this.styles.default.length && ! found;i++)
        {
          var defObj = this.styles.default[i];
          // Check if there is a parameter (in [[...]]) into style's attributes
          parameter = defObj.checkParameter();

          if(parameter != null)
            found = true;
        }
        if(parameter != null) // Add parameter to the key
          this.styles.default_key = key_template + "default"+ parameter;
        else
          delete this.styles.default_key;
      }
      else 
        delete this.styles.default_key;

      if(this.styles.hover.length) // Set hover_key
      {
        // Manage key when an attribute is parametrized
        var parameter = null;
        for(var i=0, found=false ; i<this.styles.hover.length && ! found;i++)
        {
          var hovObj = this.styles.hover[i];
          // Check if there is a parameter (in [[]]) into style's attributes
          parameter = hovObj.checkParameter();

          if(parameter != null)
            found = true;
        }
        if(parameter != null) // Add parameter to the key
          this.styles.hover_key =  key_template + "hover" + parameter;
        else
          delete this.styles.hover_key;
      }
      else
        delete this.styles.hover_key;
    }
  }

  return wgLayerStyle;
};

function layerStyleClassesFactory(RWEntity,wgLayerStyle,wgLayerFilter)
{
  // RWEntity inheritance
  wgLayerStyleClasses.prototype = new RWEntity;

  function wgLayerStyleClasses(cfg)
  {
    this.classes = [];
    this.layerInfo = null;
    this.count_classes = 0;

    RWEntity.call(this,cfg,[]);

    this._name = "wglayerstyleclasses";
    this._dirty = false;
  };

  wgLayerStyleClasses.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    if (cfg != undefined)
    {
      // Flag used to know what do on Save
      this.op = "U";

      if (cfg.classes)
      {
        this.classes = [];
        this.count_classes = cfg.classes.length;

        for (var i = 0;i < cfg.classes.length;i++)
        {
          var item = cfg.classes[i];
          var new_class = {
            op: "AND",
            name: item.name,
            style: new wgLayerStyle(item.styles),
            conditions: []
          };

          /* Look for conditions: if find a condition object
             create a conditions array (for retro-compatibility) */
          if (item.condition)
            item.conditions = [item.condition];

          for (var j = 0;j < item.conditions.length;j++)
            new_class.conditions.push(new wgLayerFilter(item.conditions[j]));

          /* Add class */
          this.classes.push(new_class);
        }
      }
    }
    else
      this.op = "I";
  };

  wgLayerStyleClasses.prototype.changedKeys = function()
  {
    var retObj = RWEntity.prototype.changedKeys.call(this);

    if (!retObj)
      retObj = {classes:[]};

    if (this.count_classes != this.classes.length || this._dirty)
    {
      /* Send all classes */
      for (var i = 0, nClasses = this.classes.length;i < nClasses;i++)
      {
        var cls = this.classes[i];
        var clsRetObj = {op:cls.op, name:cls.name};

        // Check unique keys
        this.checkUniqueKeys(cls);

        // Manage wgLayerFilter
        clsRetObj.conditions = [];

        for (var j = 0;j < cls.conditions.length;j++)
          clsRetObj.conditions.push(cls.conditions[j].stringify())

        // Manage style
        var styleStr = cls.style.stringify();
        clsRetObj.styles = styleStr.styles;

        // Add class
        if(!retObj.classes)
          retObj.classes = [];

        retObj.classes.push(clsRetObj);
      }
    }
    else
    {
      var bClassesChanged = false;

      // Control if classes are changed
      for (var i=0, nClasses=this.classes.length; i<nClasses && !bClassesChanged; i++)
      {
        var cls = this.classes[i];

        // Check unique keys
        this.checkUniqueKeys(cls);

        // Check wgLayerFilter
        for (var j = 0;j < cls.conditions.length;j++)
        {
          if (cls.conditions[j].changedKeys())
          {
            bClassesChanged = true;
            break;
          }
        }

        // Check wgLayerStyle
        if (cls.style.changedKeys())
          bClassesChanged = true;
      }

      if (bClassesChanged) //If something is changed, send all classes
      {
        for (var i=0, nClasses=this.classes.length; i<nClasses; i++)
        {
          var cls = this.classes[i];
          var clsRetObj = {op:cls.op, name:cls.name, conditions:[]};

          // Check unique keys
          this.checkUniqueKeys(cls);

          // wgLayerStyle
          var styleStr = cls.style.stringify();
          clsRetObj.styles = styleStr.styles;

          // wgLayerFilter
          for (var j = 0;j < cls.conditions.length;j++)
            clsRetObj.conditions.push(cls.conditions[j].stringify())

          // Add class
          if(!retObj.classes)
            retObj.classes = [];

          retObj.classes.push(clsRetObj);
        }
      }
    }

    return angular.equals({classes:[]},retObj) ? null : retObj;
  };

  wgLayerStyleClasses.prototype.updateChangedKeys = function()
  {
    RWEntity.prototype.updateChangedKeys.call(this);

    this._dirty = false;
    this.count_classes = this.classes.length;
  };

  wgLayerStyleClasses.prototype.stringify = function()
  {
    var retObj = this.changedKeys();

    return angular.equals({classes:[]},retObj) ? null : retObj; 
  };

  wgLayerStyleClasses.prototype.setDirty = function()
  {
    this._dirty = true;
  };

  wgLayerStyleClasses.prototype.addClassesObject = function()
  {
    var obj = {op:"AND",conditions:[new wgLayerFilter()],style:new wgLayerStyle()};

    this.classes.push(obj);
  };

  wgLayerStyleClasses.prototype.removeClassesObject = function(idx)
  {
     this.classes.splice(idx,1);
  };

  wgLayerStyleClasses.prototype.addCond = function(cls)
  {
    cls.conditions.push(new wgLayerFilter());
    this.refreshAttributes();
  };

  wgLayerStyleClasses.prototype.delCond = function(cls,idx)
  {
    cls.conditions.splice(idx,1);
  };

  /* Set layer information used to generate unique keys.
   * It contains layer's id and then is in this format {id:"the_layer_Id_"} */
  wgLayerStyleClasses.prototype.setLayerInfo = function(obj)
  {
    this.layerInfo = obj;
  };

  // Check and set unique keys if necessary
  wgLayerStyleClasses.prototype.checkUniqueKeys = function(cls)
  {
    if(!cls)
      return;

    if(this.layerInfo == undefined) //Layer info not setted
      return;

    var clsStyle = cls.style.styles;
    if (clsStyle &&  (clsStyle.default.length || clsStyle.hover.length))
    {
      // Unique keys common part
      var key_template = this.layerInfo.id+"_"+
        Math.random().toString(36).substr(2,9);

      // Replace space with _
      var replaced_key_template = key_template.replace(/\s/g, "_");

      if (clsStyle.default.length)
      {
        // Manage key when an attribute is parametrized
        var parameter = null;
        for(var i=0, found=false ; i<clsStyle.default.length && ! found;i++)
        {
          var defObj = clsStyle.default[i];

           // Check if there is a parameter (in [[]]) into style's attributes
          parameter = defObj.checkParameter();

          if(parameter != null)
            found = true;
        }
        // Set default_key
        clsStyle.default_key = "default_" + replaced_key_template;

        if(parameter != null) // Add parameter to the key
          clsStyle.default_key += parameter;
      }
      else
      {
        if(clsStyle.hasOwnProperty("default_key"))
          delete clsStyle.default_key; 
      }

      if (clsStyle.hover.length)
      {
        // Manage key when an attribute is parametrized
        var parameter = null;
        for(var i=0, found=false ; i<clsStyle.hover.length && ! found;i++)
        {
          var hovObj = clsStyle.hover[i];
          // Check if there is a parameter (in [[]]) into style's attributes
          parameter = hovObj.checkParameter();

          if(parameter != null)
            found = true;

        }
         // Set hover_key
        clsStyle.hover_key = "hover_" + replaced_key_template; 
        if(parameter != null) // Add parameter to the key
          clsStyle.hover_key += parameter;
      }
      else
      {
        if(clsStyle.hasOwnProperty("hover_key"))
          delete clsStyle.hover_key;
      }
    }
  };

  wgLayerStyleClasses.prototype.setAttributes = function(aArray) //TODO TEST
  {
    this.attributes = [];

    for (var i = 0;i < aArray.length;i++)
    {
      var attr = aArray[i];

      if (attr.id != "geom")
       this.attributes.push(attr.id);
    }
  };

  wgLayerStyleClasses.prototype.refreshAttributes = function() //TODO TEST
  {
    if (this.classes)
    {
      /* Set Attributes to every conditions */
      for (var i = 0;i < this.classes.length;i++)
      {
        var cls = this.classes[i];
        var conditions = cls.conditions;

        if (conditions && this.attributes)
        {
          for (var j = 0;j < conditions.length;j++)
          {
            var cond = conditions[j];

            // Check cond according to the attributes
            cond.checkFilter(this.attributes);

            // Set attributes in cond
            cond.setAttributes(this.attributes);
          }
        }
      }
    }
  };

  return wgLayerStyleClasses;
};

function styleFactory(RWEntity)
{
  // RWEntity inheritance
  wgStyle.prototype = new RWEntity;

  function wgStyle(cfg)
  {
    this.aAttribs = [ "fillColor","font","radius","src","strokeColor",
      "strokeWidth","text","type","offsetX","offsetY","geometry",
      "anchorX","anchorY","placement","overflow","textAlign","textBaseline",
      "points","rotation","angle","minScale","maxScale"];

    RWEntity.call(this,cfg,this.aAttribs);

    this._name = "wgstyle";
  };

  wgStyle.prototype.update = function(cfg)
  {
    RWEntity.prototype.update.call(this,cfg);

    if(cfg == undefined)
    {
      this.fillColor = null;
      this.font = null;
      this.radius = null;
      this.src = null;
      this.strokeColor = null;
      this.strokeWidth = null;
      this.text = null;
      this.type  = null;
      this.offsetX = null;
      this.offsetY = null;
      this.geometry = null;
      this.anchorX = null;
      this.anchorY = null;
      this.placement = null;
      this.overflow = null;
      this.textAlign = null;
      this.textBaseline = null;
      this.points = null;
      this.rotation = null;
      this.angle = null;
      this.minSscale = null;
      this.maxScale = null;
    }
    else
    {
      // Manage anchor
      if(cfg.anchor && cfg.anchor.length)
      {
        this.anchorX = cfg.anchor[0];
        this.anchorY = cfg.anchor[1];
      }
    }
  }

  wgStyle.prototype.stringify = function()
  {
    var retObj = {};

    if(this.fillColor != null && this.fillColor != "")
      retObj.fillColor = this.fillColor;
    if(this.font != null)
      retObj.font = this.font;
    if(this.radius != null && this.radius != "")
      retObj.radius = manageNumber(this.radius);
    if(this.src != null && this.src != "")
      retObj.src = this.src;
    if(this.strokeColor != null && this.strokeColor != "")
      retObj.strokeColor = this.strokeColor;
    if(this.strokeWidth != null && this.strokeWidth != "")
      retObj.strokeWidth = this.strokeWidth;
    if(this.text != null && this.text != "")
      retObj.text = this.text;
    if(this.placement != null && this.placement != "")
      retObj.placement = this.placement;
    if(this.overflow !== null && this.overflow !== "") // using !== operator because overflow attribute is a boolean
      retObj.overflow = this.overflow;
    if (this.textAlign != null && this.textAlign != "")
      retObj.textAlign = this.textAlign;
    if (this.textBaseline != null && this.textBaseline != "")
      retObj.textBaseline = this.textBaseline;
    if(this.type != null)
      retObj.type = this.type.id;
    if(this.offsetX != null && this.offsetX != "")
      retObj.offsetX = manageNumber(this.offsetX);
    if(this.offsetY != null && this.offsetY != "")
      retObj.offsetY = manageNumber(this.offsetY);
    if(this.geometry != null)
      retObj.geometry = this.geometry;
    if(this.anchorX != null && this.anchorX != "")
      retObj.anchorX = manageNumber(this.anchorX);
    if(this.anchorY != null && this.anchorY != "")
      retObj.anchorY = manageNumber(this.anchorY);
    if(this.points != null && this.points != "")
      retObj.points = manageNumber(this.points);
    if(this.rotation != null && this.rotation != "")
      retObj.rotation = manageNumber(this.rotation);
    if(this.angle != null && this.angle != "")
      retObj.angle = manageNumber(this.angle);
    if(this.minScale != null && this.minScale != "")
      retObj.minScale = manageNumber(this.minScale);
    if(this.maxScale != null && this.maxScale != "")
      retObj.maxScale = manageNumber(this.maxScale);

    // Manage anchorX and anchorY
    var anchor = [];
    if(retObj.hasOwnProperty("anchorX"))
    {
      anchor.push(retObj.anchorX);
      delete retObj.anchorX;
    }
    if(retObj.hasOwnProperty("anchorY"))
    {
      if(anchor.length)
        anchor.push(retObj.anchorY);
      else
      {
        if(this.anchorX == null || this.anchorX == "") //NOTE Add default value to anchorX
          this.anchorX = 0;

        anchor.push(this.anchorX);
        anchor.push(retObj.anchorY);
      }
      delete retObj.anchorY;
    }

    if(anchor.length == 1) // anchorY is empty
    { 
      if(this.anchorY == null | this.anchorY == "") //NOTE Add default value to anchorY
        this.anchorY = 0;
      anchor.push(this.anchorY);
    }

    if(anchor.length)
    { 
      // Set anchorXUnits and anchorYUnits in pixel to express the offest in pixel
      retObj.anchorXUnits = 'pixels';
      retObj.anchorYUnits = 'pixels';

      retObj.anchor = anchor;
    }

    return angular.equals({},retObj) ? null : retObj; 
  }

  // Check if there is a parametrized style attribute
  wgStyle.prototype.checkParameter = function()
  {
    var parameter = null;
    /*
    * regex is a regular expression to find variable into double square bracket.
    * ex. [[pippo]] 
    */
    var regex = /\[.*?\]./;

    for(var i=0; i<this.aAttribs.length;i++) 
    {
      var key =this.aAttribs[i];
      var matched = regex.exec(this[key]);
      if(matched != null)
      {
        parameter = matched[0];
      }
    }
    return parameter;
  }

  /* Control if the parameter is an number. IF it's true convert from string to integer.
  * Otherwise return the string 
  */
  function manageNumber(param,isFloat)
  {
    if(param == undefined)
      return;

    if(!isNaN(param)) // Param is a Number
      return parseFloat(param);
    else
      return param;
  }

  return wgStyle;
};
