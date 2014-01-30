/*global dojo, define, document */
/*jslint sloppy:true */
/** @license
| Version 10.2
| Copyright 2013 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
|    http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/
//============================================================================================================================//
define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/_base/lang",
    "esri/arcgis/utils",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-attr",
    "dojo/query",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/_base/array",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/shared/nls/localizedStrings",
    "dojo/i18n!application/nls/localizedStrings",
    "esri/map",
    "esri/layers/ImageParameters",
    "esri/dijit/Directions",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/symbols/SimpleLineSymbol",
    "esri/renderers/SimpleRenderer",
    "esri/dijit/Basemap",
    "dojo/_base/Color",
    "widgets/baseMapGallery/baseMapGallery",
    "widgets/route/route",
    "widgets/legends/legends",
    "dojo/text!../legends/templates/legendsTemplate.html",
    "esri/geometry/Extent",
    "esri/dijit/HomeButton",
    "esri/SpatialReference",
    "widgets/infoWindow/infoWindow",
    "dojo/topic",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/request",
    "dojo/domReady!"
    ],
     function (declare, domConstruct, domStyle, lang, esriUtils, on, dom, domAttr, query, domClass, domGeom, array, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, appNls, esriMap, ImageParameters, Directions, FeatureLayer, GraphicsLayer, SimpleLineSymbol, SimpleRenderer, basemap, Color, baseMapGallery, route, legends, template, geometryExtent, HomeButton, spatialReference, infoWindow, topic, arcGISDynamicMapServiceLayer, esriRequest) {

         //========================================================================================================================//

         return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

             map: null,
             templateString: template,
             tempGraphicsLayerId: "esriGraphicsLayerMapSettings",
             stagedSearch: null,
             newLeft: 0,
             logoContainer: null,

             /**
             * initialize map object
             *
             * @class
             * @name widgets/mapSettings/mapSettings
             */
             postCreate: function () {

                 /**
                 * set map extent to default extent specified in configuration file
                 * @param {string} dojo.configData.DefaultExtent Default extent of map specified in configuration file
                 */
                 this.logoContainer = query(".map .logo-sm") && query(".map .logo-sm")[0] || query(".map .logo-med") && query(".map .logo-med")[0];
                 var extentPoints = dojo.configData && dojo.configData.DefaultExtent && dojo.configData.DefaultExtent.split(",");
                 var graphicsLayer = new GraphicsLayer();
                 graphicsLayer.id = this.tempGraphicsLayerId;


                 /**
                 * load map
                 * @param {string} dojo.configData.BaseMapLayers Basemap settings specified in configuration file
                 */
                 this._generateLayerURL(dojo.configData.OperationalLayers);
                 if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length != 0) {
                     var mapDeferred = esriUtils.createMap(dojo.configData.WebMapId, "esriCTParentDivContainer", {
                         mapOptions: {
                             slider: true
                         },
                         ignorePopups: true
                     });
                     mapDeferred.then(lang.hitch(this, function (response) {
                         this.map = response.map;
                         this.map.addLayer(graphicsLayer);
                         var webMapDetails = response.itemInfo.itemData;
                         this._addLogoUrl();
                         var home = this._addHomeButton();
                         domConstruct.place(home.domNode, query(".esriSimpleSliderIncrementButton")[0], "after");
                         home.startup();
                         this._addLayerLegend();
                     }));
                 }

                 else {
                     var infoWindowPanel = new infoWindow({ infoWindowWidth: dojo.configData.InfoPopupWidth, infoWindowHeight: dojo.configData.InfoPopupHeight });
                     this.map = esriMap("esriCTParentDivContainer", {
                         infoWindow: infoWindowPanel,
                         basemap: dojo.configData.BaseMapLayers[0].Key
                     });

                     /**
                     * load esri 'Home Button' widget
                     */
                     var home = this._addHomeButton();

                     /* set position of home button widget after map is successfuly loaded
                     * @param {array} dojo.configData.OperationalLayers List of operational Layers specified in configuration file
                     */
                     this.map.on("load", lang.hitch(this, function () {
                         var mapDefaultExtent = new geometryExtent({ "xmin": parseFloat(extentPoints[0]), "ymin": parseFloat(extentPoints[1]), "xmax": parseFloat(extentPoints[2]), "ymax": parseFloat(extentPoints[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                         this.map.setExtent(mapDefaultExtent);
                         domConstruct.place(home.domNode, query(".esriSimpleSliderIncrementButton")[0], "after");
                         home.extent = mapDefaultExtent;
                         home.startup();
                         this.esriCTLegendContainer = domConstruct.create("div", {}, dom.byId("esriCTParentDivContainer"));
                         this.esriCTLegendContainer.appendChild(this.esriCTdivLegendbox);
                         var divlegendContainer = domConstruct.create("div", { "class": "divlegendContainer" }, this.divlegendList);
                         this.divlegendContent = domConstruct.create("div", { "class": "divlegendContent" }, divlegendContainer);
                         var divLeftArrow = domConstruct.create("div", { "class": "divLeftArrow" }, this.legendbox);
                         var esriCTLeftArrow = domConstruct.create("img", { "class": "esriCTArrow" }, divLeftArrow);
                         domAttr.set(esriCTLeftArrow, "src", "shared/themes/images/left.png");
                         domStyle.set(divLeftArrow, "display", "none");
                         on(divLeftArrow, "click", lang.hitch(this, function () {
                             this._slideLeft();
                         }));
                         var divRightArrow = domConstruct.create("div", { "class": "divRightArrow" }, this.legendbox);
                         var esriCTRightArrow = domConstruct.create("img", { "class": "esriCTArrow" }, divRightArrow);
                         domStyle.set(divRightArrow, "display", "block");
                         on(esriCTRightArrow, "click", lang.hitch(this, function () {
                             this._slideRight();
                         }));
                         domAttr.set(esriCTRightArrow, "src", "shared/themes/images/right.png");
                         for (var i in dojo.configData.OperationalLayers) {
                             this._addOperationalLayerToMap(i, dojo.configData.OperationalLayers[i]);
                         }
                         this._showBasMapGallery();
                         this.map.addLayer(graphicsLayer);
                         var _self = this;
                         this.map.on("extent-change", function () {
                             topic.publish("setMapTipPosition", dojo.selectedMapPoint, _self.map);
                         });
                         this._addLayerLegend();
                     }));
                 }
             },

             _slideRight: function () {
                 var difference = query(".divlegendContainer")[0].offsetWidth - query(".divlegendContent")[0].offsetWidth;
                 if (this.newLeft > difference) {
                     domStyle.set(query(".divLeftArrow")[0], "display", "block");
                     domStyle.set(query(".divLeftArrow")[0], "cursor", "pointer");
                     this.newLeft = this.newLeft - (200 + 9);
                     domStyle.set(query(".divlegendContent")[0], "left", (this.newLeft) + "px");
                     this._resetSlideControls();
                 }
             },

             _slideLeft: function () {
                 if (this.newLeft < 0) {
                     if (this.newLeft > -(200 + 9)) {
                         this.newLeft = 0;
                     } else {
                         this.newLeft = this.newLeft + (200 + 9);
                     }
                     if (this.newLeft >= -10) {
                         this.newLeft = 0;
                     }
                     domStyle.set(query(".divlegendContent")[0], "left", (this.newLeft) + "px");
                     this._resetSlideControls();
                 }
             },

             _resetSlideControls: function () {
                 if (this.newLeft > query(".divlegendContainer")[0].offsetWidth - query(".divlegendContent")[0].offsetWidth) {
                     domStyle.set(query(".divRightArrow")[0], "display", "block");
                     domStyle.set(query(".divRightArrow")[0], "cursor", "pointer");
                 } else {
                     domStyle.set(query(".divRightArrow")[0], "display", "none");
                     domStyle.set(query(".divRightArrow")[0], "cursor", "default");
                 }
                 if (this.newLeft == 0) {
                     domStyle.set(query(".divLeftArrow")[0], "display", "none");
                     domStyle.set(query(".divLeftArrow")[0], "cursor", "default");
                 } else {
                     domStyle.set(query(".divLeftArrow")[0], "display", "block");
                     domStyle.set(query(".divLeftArrow")[0], "cursor", "pointer");
                 }
             },

             _generateLayerURL: function (operationalLayers) {
                 for (var i = 0; i < operationalLayers.length; i++) {
                     if (operationalLayers[i].ServiceURL) {
                         var str = operationalLayers[i].ServiceURL.split('/');
                         var layerTitle = str[str.length - 3];
                         var layerId = str[str.length - 1];
                         var infoWindowSettings = dojo.configData.InfoWindowSettings;
                         var searchSettings = dojo.configData.SearchAnd511Settings;
                         for (var index = 0; index < searchSettings.length; index++) {
                             if (searchSettings[index].Title && searchSettings[index].QueryLayerId) {
                                 if (layerTitle == searchSettings[index].Title && layerId == searchSettings[index].QueryLayerId) {
                                     searchSettings[index].QueryURL = str.join("/");
                                 }
                             }
                         }
                         for (var infoIndex = 0; infoIndex < infoWindowSettings.length; infoIndex++) {
                             if (infoWindowSettings[infoIndex].Title && infoWindowSettings[infoIndex].QueryLayerId) {
                                 if (layerTitle == infoWindowSettings[infoIndex].Title && layerId == infoWindowSettings[infoIndex].QueryLayerId) {
                                     infoWindowSettings[infoIndex].InfoQueryURL = str.join("/");
                                 }
                             }
                         }
                     }
                 }
             },

             _addLogoUrl: function () {
                 if (dojo.configData.LogoUrl && lang.trim(dojo.configData.LogoUrl).length != 0) {
                     domStyle.set(this.logoContainer, "display", "none");
                     var esriCTLogoUrl = domConstruct.create("img", { "class": "esriCTLogoUrl", "src": dojo.configData.LogoUrl });
                     domConstruct.place(esriCTLogoUrl, query(".esriControlsBR")[0]);
                 }
             },

             /**
             * load esri 'Home Button' widget which sets map extent to default extent
             * @return {object} Home button widget
             * @memberOf widgets/mapSettings/mapSettings
             */
             _addHomeButton: function () {
                 var home = new HomeButton({
                     map: this.map
                 }, domConstruct.create("div", {}, null));
                 return home;
             },

             _showBasMapGallery: function () {
                 var basMapGallery = new baseMapGallery({
                     map: this.map
                 }, domConstruct.create("div", {}, null));
                 return basMapGallery;
             },

             /**
             * load and add operational layers depending on their LoadAsServiceType specified in configuration file
             * @param {int} index Layer order specified in configuration file
             * @param {object} layerInfo Layer settings specified in configuration file
             * @memberOf widgets/mapSettings/mapSettings
             */
             _addOperationalLayerToMap: function (index, layerInfo) {
                 if (layerInfo.LoadAsServiceType.toLowerCase() == "feature") {

                     /**
                     * set layerMode of the operational layer if it's type is feature
                     */
                     var layerMode = null;
                     switch (layerInfo.layermode && layerInfo.layermode.toLowerCase()) {
                         case "ondemand":
                             layerMode = FeatureLayer.MODE_ONDEMAND;
                             break;
                         case "selection":
                             layerMode = FeatureLayer.MODE_SELECTION;
                             break;
                         default:
                             layerMode = FeatureLayer.MODE_SNAPSHOT;
                             break;
                     }

                     /**
                     * load operational layer if it's type is feature along with its layer mode
                     */
                     var featureLayer = new FeatureLayer(layerInfo.ServiceURL, {
                         id: index,
                         mode: layerMode,
                         outFields: ["*"],
                         displayOnPan: false
                     });
                     this.map.addLayer(featureLayer);
                 } else if (layerInfo.LoadAsServiceType.toLowerCase() == "dynamic") {
                     this._addDynamicLayerService(layerInfo);
                 }
             },

             _addDynamicLayerService: function (layerInfo) {
                 clearTimeout(this.stagedSearch);
                 var str = layerInfo.ServiceURL.split('/');
                 var lastIndex = str[str.length - 1];
                 if (isNaN(lastIndex) || lastIndex == "") {
                     if (lastIndex == "") {
                         var layerTitle = str[str.length - 3];
                     } else {
                         var layerTitle = str[str.length - 2];
                     }
                 } else {
                     var layerTitle = str[str.length - 3];
                 }
                 this.stagedSearch = setTimeout(lang.hitch(this, function () {
                     this._addServiceLayers(layerTitle, layerInfo.ServiceURL);
                 }), 500);

             },

             _addServiceLayers: function (layerId, layerURL) {
                 var dynamicLayer;
                 var layertype;
                 var imageParams = new ImageParameters();
                 var lastIndex = layerURL.lastIndexOf('/');
                 var dynamicLayerId = layerURL.substr(lastIndex + 1);
                 if (isNaN(dynamicLayerId) || dynamicLayerId == "") {
                     if (isNaN(dynamicLayerId)) {
                         dynamicLayer = layerURL + "/";
                     } else if (dynamicLayerId == "") {
                         dynamicLayer = layerURL;
                     }
                     layertype = dynamicLayer.substring(((dynamicLayer.lastIndexOf("/")) + 1), (dynamicLayer.length));
                     this._createDynamicServiceLayer(dynamicLayer, imageParams, layerId);
                 } else {
                     imageParams.layerIds = [dynamicLayerId];
                     dynamicLayer = layerURL.substring(0, lastIndex);
                     layertype = dynamicLayer.substring(((dynamicLayer.lastIndexOf("/")) + 1), (dynamicLayer.length));
                     this._createDynamicServiceLayer(dynamicLayer, imageParams, layerId);
                 }
             },

             _createDynamicServiceLayer: function (dynamicLayer, imageParams, layerId) {
                 var dynamicMapService = new arcGISDynamicMapServiceLayer(dynamicLayer, {
                     imageParameters: imageParams,
                     id: layerId,
                     visible: true
                 });
                 this.map.addLayer(dynamicMapService);
             },

             _addLegendBox: function () {
                 this.legendObject = new legends({
                     map: this.map,
                     isExtentBasedLegend: true,
                     divlegendContainer: this.divlegendContent
                 }, domConstruct.create("div", {}, null));
                 return this.legendObject;
             },

             _addLayerLegend: function () {
                 var mapServerArray = [];
                 for (var i in dojo.configData.OperationalLayers) {
                     if (dojo.configData.OperationalLayers[i].ServiceURL) {
                         var mapServerURL = dojo.configData.OperationalLayers[i].ServiceURL;
                         mapServerArray.push(dojo.configData.OperationalLayers[i].ServiceURL);
                     }
                 }
                 var legendObject = this._addLegendBox();
                 legendObject.startup(mapServerArray);
             },


             /**
             * return current map instance
             * @return {object} Current map instance
             * @memberOf widgets/mapSettings/mapSettings
             */
             getMapInstance: function () {
                 return this.map;
             }
         });
     });