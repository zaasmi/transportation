/*global define,dojo,dojoConfig,alert,esri */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true */
/*
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
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/i18n!application/nls/localizedStrings",
    "esri/map",
    "esri/layers/ImageParameters",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/symbols/SimpleLineSymbol",
    "esri/renderers/SimpleRenderer",
    "dojo/_base/Color",
    "widgets/baseMapGallery/baseMapGallery",
    "widgets/legends/legends",
    "esri/geometry/Extent",
    "esri/dijit/HomeButton",
    "dojo/Deferred",
    "dojo/DeferredList",
    "esri/SpatialReference",
    "widgets/infoWindow/infoWindow",
    "dojo/text!../infoWindow/templates/infoWindow.html",
    "dojo/topic",
    "esri/geometry/Point",
    "dojo/aspect",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "dojo/cookie",
    "dojo/_base/unload",
    "dojo/domReady!"
    ],
     function (declare, domConstruct, domStyle, lang, esriUtils, on, dom, domAttr, query, domClass, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, appNls, esriMap, ImageParameters, FeatureLayer, GraphicsLayer, SimpleLineSymbol, SimpleRenderer, Color, baseMapGallery, legends, geometryExtent, HomeButton, Deferred, DeferredList, spatialReference, infoWindow, template, topic, Point, aspect, arcGISDynamicMapServiceLayer, cookie, baseUnload) {

         //========================================================================================================================//

         return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
             map: null,
             templateString: template,
             tempGraphicsLayerId: "esriGraphicsLayerMapSettings",
             sharedNls: sharedNls,
             appNls: appNls,
             stagedSearch: null,
             newLeft: 0,
             infoWindowPanel: null,
             frequentRoutesLayer: "frequentRoutesLayerID",

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
                 var extentPoints, graphicsLayer, mapDeferred, layer, geometry;
                 extentPoints = dojo.configData && dojo.configData.DefaultExtent && dojo.configData.DefaultExtent.split(",");
                 graphicsLayer = new GraphicsLayer();
                 graphicsLayer.id = this.tempGraphicsLayerId;

                 topic.subscribe("locateAddressOnMap", lang.hitch(this, function (mapPoint) {
                     this._addPushpinOnMap(mapPoint);
                 }));

                 /**
                 * load map
                 * @param {string} dojo.configData.BaseMapLayers Basemap settings specified in configuration file
                 */
                 this.infoWindowPanel = new infoWindow({ infoWindowWidth: dojo.configData.InfoPopupWidth, infoWindowHeight: dojo.configData.InfoPopupHeight });
                 if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                     mapDeferred = esriUtils.createMap(dojo.configData.WebMapId, "esriCTParentDivContainer", {
                         mapOptions: {
                             slider: true
                         },
                         ignorePopups: true
                     });
                     mapDeferred.then(lang.hitch(this, function (response) {
                         this.map = response.map;
                         this._fetchWebMapData(response);
                         topic.publish("setMap", this.map);
                         topic.publish("showProgressIndicator");
                         geometry = response.map.extent;
                         this._initializeMapSettings(graphicsLayer, geometry);
                         this._generateLayerURL(response.itemInfo.itemData.operationalLayers);
                         this._addLayerLegendWebmap(response);
                         this._addFrequentRoutesLayer();
                         topic.publish("showInfoWindowContent", geometry);
                         this._addMapEvents();
                         this._shareInfoWindow(this.map);
                         this._sharePointOnMap();
                         if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length != 0) {
                             if (window.location.toString().split("$frequentRouteId=").length > 1 || window.location.toString().split("$selectedInfo=")[1] == "true") {
                                 dojo.share = true;
                                 topic.publish("showDirection");
                             }
                         }
                     }), lang.hitch(this, function(error) {
                         alert(error.message);
                     }));
                 } else {
                     this._generateLayerURL(dojo.configData.OperationalLayers);
                     this.map = esriMap("esriCTParentDivContainer", {
                     });
                     layer = new esri.layers.ArcGISTiledMapServiceLayer(dojo.configData.BaseMapLayers[0].MapURL, { id: "esriCTbasemap", visible: true });
                     this.map.addLayer(layer);
                     this._addFrequentRoutesLayer();
                     this._mapOnLoad(extentPoints, graphicsLayer);
                 }
             },

             _mapOnLoad: function (extentPoints, graphicsLayer) {

                 /* set position of home button widget after map is successfuly loaded
                 * @param {array} dojo.configData.OperationalLayers List of operational Layers specified in configuration file
                 */
                 this.map.on("load", lang.hitch(this, function () {
                     var extent, mapDefaultExtent, mapPoint, i;
                     extent = this._getQueryString('extent');
                     if (extent === "") {
                         mapDefaultExtent = new geometryExtent({ "xmin": parseFloat(extentPoints[0]), "ymin": parseFloat(extentPoints[1]), "xmax": parseFloat(extentPoints[2]), "ymax": parseFloat(extentPoints[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                     } else {
                         dojo.share = true;
                         mapDefaultExtent = extent.split(',');
                         mapDefaultExtent = new geometryExtent({ "xmin": parseFloat(mapDefaultExtent[0]), "ymin": parseFloat(mapDefaultExtent[1]), "xmax": parseFloat(mapDefaultExtent[2]), "ymax": parseFloat(mapDefaultExtent[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                     }
                     this.map.setExtent(mapDefaultExtent);
                     this._initializeMapSettings(graphicsLayer, mapDefaultExtent);
                     this._sharePointOnMap();
                     for (i in dojo.configData.OperationalLayers) {
                         this._addOperationalLayerToMap(i, dojo.configData.OperationalLayers[i]);
                     }
                     if (dojo.configData.BaseMapLayers.length > 1) {
                         this._showBasMapGallery();
                     }
                     this._addMapEvents();
                 }));
                 aspect.after(this.map.on("load", lang.hitch(this, function () {
                     this._shareInfoWindow(this.map);
                 })));
             },

             _shareInfoWindow: function (map) {
                 if (window.location.toString().split("$featurepoint=").length > 1) {
                     dojo.share = true;
                     this._executeFeatureQueryTask(map);
                 }
             },

             _sharePointOnMap: function () {
                 if (window.location.toString().split("$point=").length > 1) {
                     dojo.share = true;
                     var mapPoint = new Point(Number(window.location.toString().split("$point=")[1].split("$selectedDirection")[0].split(",")[0]), Number(window.location.toString().split("$point=")[1].split("$selectedDirection")[0].split(",")[1]), this.map.spatialReference);
                     topic.publish("locateAddressOnMap", mapPoint);
                     topic.publish("setMaxLegendLength");
                 }
             },

             _addPushpinOnMap: function (mapPoint) {
                 var geoLocationPushpin, locatorMarkupSymbol, graphic;
                 this.map.setLevel(dojo.configData.ZoomLevel);
                 this.map.centerAt(mapPoint);
                 dojo.mapPoint = mapPoint;
                 geoLocationPushpin = dojoConfig.baseURL + dojo.configData.LocatorSettings.DefaultLocatorSymbol;
                 locatorMarkupSymbol = new esri.symbol.PictureMarkerSymbol(geoLocationPushpin, dojo.configData.LocatorSettings.MarkupSymbolSize.width, dojo.configData.LocatorSettings.MarkupSymbolSize.height);
                 graphic = new esri.Graphic(mapPoint, locatorMarkupSymbol, {}, null);
                 this.map.getLayer("esriGraphicsLayerMapSettings").clear();
                 this.map.getLayer("esriGraphicsLayerMapSettings").add(graphic);
                 topic.publish("hideProgressIndicator");
             },

             _initializeMapSettings: function (graphicsLayer, mapDefaultExtent) {
                 var home, imgSource, CustomLogoUrl = dojo.configData.CustomLogoUrl;
                 this.map.addLayer(graphicsLayer);
                 /**
                 * load esri 'Home Button' widget
                 */
                 home = this._addHomeButton();
                 domConstruct.place(home.domNode, query(".esriSimpleSliderIncrementButton")[0], "after");
                 if (!dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length === 0) {
                     home.extent = mapDefaultExtent;
                 }
                 home.startup();
                 if (CustomLogoUrl && lang.trim(CustomLogoUrl).length !== 0) {
                     if (CustomLogoUrl.match("http:") || CustomLogoUrl.match("https:")) {
                         imgSource = CustomLogoUrl;
                     } else {
                         imgSource = dojoConfig.baseURL + CustomLogoUrl;
                     }
                     domConstruct.create("img", { "src": imgSource, "class": "esriCTMapLogo" }, dom.byId("esriCTParentDivContainer"));
                 }

                 topic.subscribe("setInfoWindowHeightWidth", lang.hitch(this, function (infoPopupWidth, infoPopupHeight) {
                     this._setInfoWindowHeightWidth(infoPopupWidth, infoPopupHeight);
                 }));
                 this.map.on("extent-change", lang.hitch(this, function (evt) {
                     var infoPopupHeight, infoPopupWidth;
                     infoPopupHeight = dojo.configData.InfoPopupHeight;
                     infoPopupWidth = dojo.configData.InfoPopupWidth;
                     topic.publish("setInfoWindowHeightWidth", infoPopupWidth, infoPopupHeight);
                     if (dojo.onInfoWindowResize) {
                         topic.publish("onWindowResize");
                     }
                     if (!dojo.setMapTipPosition) {
                         topic.publish("setMapTipPosition", dojo.selectedMapPoint, this.map, this.infoWindowPanel);
                     }
                     if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                         topic.publish("showInfoWindowContent", evt.extent);
                     }
                 }));
                 if (!dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length === 0) {
                     this._addLayerLegend();
                 }
             },

             _setInfoWindowHeightWidth: function (infoPopupWidth, infoPopupHeight) {
                 this.infoWindowPanel.resize(infoPopupWidth, infoPopupHeight);
             },

             _addMapEvents: function () {
                 topic.subscribe("setInfoWindowOnMap", lang.hitch(this, function (infoTitle, mobTitle, divInfoDetailsTab, screenPoint) {
                     this._onSetInfoWindowPosition(infoTitle, mobTitle, divInfoDetailsTab, screenPoint);
                 }));
                 topic.subscribe("hideInfoWindowOnMap", lang.hitch(this, function () {
                     this._hideInfoWindow();
                 }));
                 baseUnload.addOnWindowUnload(lang.hitch(this, function (a) {
                     this._persistDirectionValue(a);
                 }));
                 this.map.on("click", lang.hitch(this, function (evt) {
                     dojo.showInfo = false;
                     dojo.setMapTipPosition = false;
                     dojo.openInfowindow = false;
                     this._showInfoWindowOnMap(evt.mapPoint, this.map);
                 }));
             },

             _fetchWebMapData: function (response) {
                 var searchSettings, i, j, k, l, str, index, serviceTitle = [], webMapDetails, operationalLayers,
                 p = 0, operationalLayerId, lastIndex, layerInfo, infowindowIndex, field;

                 dojo.configData.InfoWindowSettings = [];
                 dojo.configData.OperationalLayers = [];
                 searchSettings = dojo.configData.SearchAnd511Settings;
                 webMapDetails = response.itemInfo.itemData;
                 operationalLayers = dojo.configData.OperationalLayers;

                 for (i = 0; i < webMapDetails.operationalLayers.length; i++) {
                     operationalLayerId = lang.trim(webMapDetails.operationalLayers[i].title);
                     str = webMapDetails.operationalLayers[i].url.split('/');
                     lastIndex = str[str.length - 1];
                     if (isNaN(lastIndex) || lastIndex === "") {
                         if (lastIndex === "") {
                             serviceTitle[operationalLayerId] = webMapDetails.operationalLayers[i].url;
                         } else {
                             serviceTitle[operationalLayerId] = webMapDetails.operationalLayers[i].url + "/";
                         }
                     } else {
                         serviceTitle[operationalLayerId] = webMapDetails.operationalLayers[i].url.substring(0, webMapDetails.operationalLayers[i].url.length - 1);
                     }
                 }

                 for (index = 0; index < searchSettings.length; index++) {
                     if (searchSettings[index].Title && searchSettings[index].QueryLayerId && serviceTitle[searchSettings[index].Title]) {
                         searchSettings[index].QueryURL = serviceTitle[searchSettings[index].Title] + searchSettings[index].QueryLayerId;
                         for (j = 0; j < webMapDetails.operationalLayers.length; j++) {
                             if (webMapDetails.operationalLayers[j].title && serviceTitle[webMapDetails.operationalLayers[j].title] && (webMapDetails.operationalLayers[j].title == searchSettings[index].Title)) {
                                 if (webMapDetails.operationalLayers[j].layers) {
                                     //Fetching infopopup data in case the layers are added as dynamic layers in the webmap
                                     for (k = 0; k < webMapDetails.operationalLayers[j].layers.length; k++) {
                                         layerInfo = webMapDetails.operationalLayers[j].layers[k];
                                         if (Number(searchSettings[index].QueryLayerId) === layerInfo.id) {
                                             if (webMapDetails.operationalLayers[j].layers[k].popupInfo) {
                                                 dojo.configData.InfoWindowSettings.push({ "InfoQueryURL": serviceTitle[searchSettings[index].Title] + searchSettings[index].QueryLayerId });
                                                 operationalLayers[p] = {};
                                                 operationalLayers[p]["ServiceURL"] = webMapDetails.operationalLayers[j].url + "/" + webMapDetails.operationalLayers[j].layers[k].id;
                                                 p++;
                                                 if (layerInfo.popupInfo.title.split("{").length > 1) {
                                                     dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1]["InfoWindowHeaderField"] = dojo.string.trim(layerInfo.popupInfo.title.split("{")[0]) + " ";
                                                     for (l = 1; l < layerInfo.popupInfo.title.split("{").length; l++) {
                                                         dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1]["InfoWindowHeaderField"] += "${" + dojo.string.trim(layerInfo.popupInfo.title.split("{")[l]);
                                                     }
                                                 } else {
                                                     if (dojo.string.trim(layerInfo.popupInfo.title) !== "") {
                                                         dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1]["InfoWindowHeaderField"] = dojo.string.trim(layerInfo.popupInfo.title);
                                                     } else {
                                                         dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1]["InfoWindowHeaderField"] = sharedNls.showNullValue;
                                                     }
                                                 }
                                                 infowindowIndex = dojo.configData.InfoWindowSettings.length - 1;
                                                 this.getMobileCalloutContentField(infowindowIndex);
                                                 dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1]["InfoWindowData"] = [];
                                                 for (field in layerInfo.popupInfo.fieldInfos) {
                                                     if (layerInfo.popupInfo.fieldInfos.hasOwnProperty(field)) {
                                                         if (layerInfo.popupInfo.fieldInfos[field].visible) {
                                                             dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1]["InfoWindowData"].push({
                                                                 "DisplayText": layerInfo.popupInfo.fieldInfos[field].label + ":",
                                                                 "FieldName": "${" + layerInfo.popupInfo.fieldInfos[field].fieldName + "}"
                                                             });
                                                         }
                                                     }
                                                 }
                                             }
                                         }
                                     }
                                 } else if (webMapDetails.operationalLayers[j].popupInfo) {
                                     //Fetching infopopup data in case the layers are added as feature layers in the webmap
                                     operationalLayers[p] = {};
                                     operationalLayers[p]["ServiceURL"] = webMapDetails.operationalLayers[j].url;
                                     dojo.configData.InfoWindowSettings.push({ "InfoQueryURL": serviceTitle[searchSettings[index].Title] + searchSettings[index].QueryLayerId });
                                     p++;
                                     if (webMapDetails.operationalLayers[j].popupInfo.title.split("{").length > 1) {
                                         dojo.configData.InfoWindowSettings[index]["InfoWindowHeaderField"] = dojo.string.trim(webMapDetails.operationalLayers[j].popupInfo.title.split("{")[0]);
                                         for (l = 1; l < webMapDetails.operationalLayers[j].popupInfo.title.split("{").length; l++) {
                                             dojo.configData.InfoWindowSettings[index]["InfoWindowHeaderField"] += " ${" + dojo.string.trim(webMapDetails.operationalLayers[j].popupInfo.title.split("{")[l]);
                                         }
                                     } else {
                                         if (dojo.string.trim(webMapDetails.operationalLayers[j].popupInfo.title) !== "") {
                                             dojo.configData.InfoWindowSettings[index]["InfoWindowHeaderField"] = dojo.string.trim(webMapDetails.operationalLayers[j].popupInfo.title);
                                         } else {
                                             dojo.configData.InfoWindowSettings[index]["InfoWindowHeaderField"] = sharedNls.showNullValue;
                                         }
                                     }
                                     if (webMapDetails.operationalLayers[j].layerObject.displayField) {
                                         dojo.configData.InfoWindowSettings[index]["InfoWindowContent"] = "${" + webMapDetails.operationalLayers[j].layerObject.displayField + "}";
                                     } else {
                                         this.getMobileCalloutContentField(index);
                                     }
                                     dojo.configData.InfoWindowSettings[index]["InfoWindowData"] = [];
                                     for (field in webMapDetails.operationalLayers[j].popupInfo.fieldInfos) {
                                         if (webMapDetails.operationalLayers[j].popupInfo.fieldInfos.hasOwnProperty(field)) {
                                             if (webMapDetails.operationalLayers[j].popupInfo.fieldInfos[field].visible) {
                                                 dojo.configData.InfoWindowSettings[index]["InfoWindowData"].push({
                                                     "DisplayText": webMapDetails.operationalLayers[j].popupInfo.fieldInfos[field].label + ":",
                                                     "FieldName": "${" + webMapDetails.operationalLayers[j].popupInfo.fieldInfos[field].fieldName + "}"
                                                 });
                                             }
                                         }
                                     }
                                 }
                             }
                         }
                     } else {
                         alert(sharedNls.errorMessages.webMapMessages);
                     }
                 }
             },

             // Get data to be displayed in mobile callout content field

             getMobileCalloutContentField: function (index) {
                 var i, def = new Deferred();
                 esri.request({
                     url: dojo.configData.InfoWindowSettings[index].InfoQueryURL + '?f=json',
                     load: function (data) {
                         if (data.displayField) {
                             dojo.configData.InfoWindowSettings[index]["InfoWindowContent"] = "${" + data.displayField + "}";
                         } else {
                             for (i = 0; i < data.fields.length; i++) {
                                 if (data.fields[i].type !== "esriFieldTypeOID") {
                                     dojo.configData.InfoWindowSettings[index]["InfoWindowContent"] = "${" + data.fields[i].name + "}";
                                     break;
                                 }
                             }
                         }
                         def.resolve();
                     }
                 });
                 return def;
             },

             _addFrequentRoutesLayer: function () {
                 var roadLineSymbol, roadLinefillColor, roadLineRenderer, frequentRoutesLayer;

                 roadLineSymbol = new SimpleLineSymbol();
                 roadLineSymbol.setWidth(parseInt(dojo.configData.RouteSymbology.Width));
                 roadLinefillColor = new Color([parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[0]), parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[1]), parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[2]), parseFloat(dojo.configData.RouteSymbology.Transparency.split(",")[0])]);
                 roadLineSymbol.setColor(roadLinefillColor);
                 roadLineRenderer = new SimpleRenderer(roadLineSymbol);
                 frequentRoutesLayer = new FeatureLayer(dojo.configData.FrequentRoutesLayer.LayerURL, {
                     mode: FeatureLayer.MODE_SELECTION,
                     outFields: ["*"]
                 });
                 frequentRoutesLayer.id = this.frequentRoutesLayer;
                 frequentRoutesLayer.setRenderer(roadLineRenderer);
                 this.map.addLayer(frequentRoutesLayer);
             },

             _getQueryString: function (key) {
                 var _default;
                 if (!_default) {
                     _default = "";
                 }
                 key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
                 var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
                 var qs = regex.exec(window.location.href);
                 if (!qs) {
                     return _default;
                 } else {
                     return qs[1];
                 }
             },

             _hideInfoWindow: function () {
                 this.infoWindowPanel.hide();
             },

             _showInfoWindowOnMap: function (mapPoint, map) {
                 var featureArray = [], onMapFeaturArray = [], index, deferredListResult, i, j;

                 this.counter = 0;
                 for (index = 0; index < dojo.configData.InfoWindowSettings.length; index++) {
                     this._executeQueryTask(index, mapPoint, onMapFeaturArray);
                 }
                 deferredListResult = new DeferredList(onMapFeaturArray);
                 deferredListResult.then(lang.hitch(this, function (result) {
                     if (result) {
                         for (j = 0; j < result.length; j++) {
                             if (result[j][1].features.length > 0) {
                                 for (i = 0; i < result[j][1].features.length; i++) {
                                     featureArray.push({
                                         attr: result[j][1].features[i],
                                         layerId: j,
                                         fields: result[j][1].fields
                                     });
                                 }
                             }
                         }
                         this._fetchQueryResults(featureArray, map);
                     }
                 }), function (err) {
                     alert(err.message);
                 });
             },

             _executeFeatureQueryTask: function () {
                 var onMapFeaturArray = [], index;
                 this.counter = 0;
                 index = window.location.toString().split("$featurepoint=")[1].split("$LayerID=")[1].split("$selectedDirection=")[0];
                 this._executeShareQueryTask(index, onMapFeaturArray);
             },

             _executeShareQueryTask: function (index, onMapFeaturArray) {
                 var _self = this, featureArray = [], queryTask, queryLayer, queryOnRouteTask, i, j,
                  deferred, deferredListResult;
                 queryTask = new esri.tasks.QueryTask(dojo.configData.SearchAnd511Settings[index].QueryURL);
                 esri.request({
                     url: dojo.configData.SearchAnd511Settings[index].QueryURL + "?f=json",
                     load: function (data) {
                         for (p = 0; p < data.fields.length; p++) {
                             if (data.fields[p].type == "esriFieldTypeOID") {
                                 objID = data.fields[p].name;
                                 break;
                             }
                         }
                         queryLayer = new esri.tasks.Query();
                         queryLayer.where = objID + "=" + window.location.toString().split("$featurepoint=")[1].split("$LayerID=")[0].split("$selectedDirection=")[0];
                         queryLayer.outFields = ["*"];
                         queryLayer.outSpatialReference = _self.map.spatialReference;
                         queryLayer.returnGeometry = true;
                         queryLayer.maxAllowableOffset = 100;
                         queryOnRouteTask = queryTask.execute(queryLayer, lang.hitch(this, function (results) {
                             deferred = new Deferred();
                             deferred.resolve(results);
                             return deferred.promise;
                         }), function (err) {
                             alert(err.message);
                         });
                         onMapFeaturArray.push(queryOnRouteTask);
                         deferredListResult = new DeferredList(onMapFeaturArray);
                         deferredListResult.then(lang.hitch(this, function (result) {
                             if (result) {
                                 for (j = 0; j < result.length; j++) {
                                     if (result[j][1].features.length > 0) {
                                         for (i = 0; i < result[j][1].features.length; i++) {
                                             featureArray.push({
                                                 attr: result[j][1].features[i],
                                                 layerId: index,
                                                 fields: result[j][1].fields
                                             });
                                         }
                                     }
                                 }
                                 _self._fetchQueryResults(featureArray, _self.map);
                             }
                         }), function (err) {
                             alert(err.message);
                         });
                     },
                     error: function (err) {
                         alert(err.message);
                     }
                 });
             },
             _executeQueryTask: function (index, mapPoint, onMapFeaturArray) {
                 var queryTask, queryLayer, queryOnRouteTask, deferred;
                 queryTask = new esri.tasks.QueryTask(dojo.configData.SearchAnd511Settings[index].QueryURL);
                 queryLayer = new esri.tasks.Query();
                 queryLayer.outSpatialReference = this.map.spatialReference;
                 queryLayer.returnGeometry = true;
                 queryLayer.maxAllowableOffset = 100;
                 queryLayer.geometry = this._extentFromPoint(mapPoint);
                 queryLayer.outFields = ["*"];
                 queryOnRouteTask = queryTask.execute(queryLayer, lang.hitch(this, function (results) {
                     deferred = new Deferred();
                     deferred.resolve(results);
                     return deferred.promise;
                 }), function (err) {
                     alert(err.message);
                 });
                 onMapFeaturArray.push(queryOnRouteTask);

             },

             _extentFromPoint: function (point) {
                 var tolerance = 3, screenPoint, sourcePoint, destinationPoint, sourceMapPoint, destinationMapPoint;
                 screenPoint = this.map.toScreen(point);
                 sourcePoint = new Point(screenPoint.x - tolerance, screenPoint.y + tolerance);
                 destinationPoint = new Point(screenPoint.x + tolerance, screenPoint.y - tolerance);
                 sourceMapPoint = this.map.toMap(sourcePoint);
                 destinationMapPoint = this.map.toMap(destinationPoint);
                 return new geometryExtent(sourceMapPoint.x, sourceMapPoint.y, destinationMapPoint.x, destinationMapPoint.y, this.map.spatialReference);
             },

             _fetchQueryResults: function (featureArray, map) {
                 var point, _this = this;
                 if (featureArray.length > 0) {
                     if (featureArray.length === 1) {
                         domClass.remove(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                         topic.publish("createInfoWindowContent", featureArray[0].attr.geometry, featureArray[0].attr.attributes, featureArray[0].fields, featureArray[0].layerId, null, null, map);
                     } else {
                         this.count = 0;
                         dojo.setMapTipPosition = false;
                         domAttr.set(query(".esriCTdivInfoTotalFeatureCount")[0], "innerHTML", '/' + featureArray.length);
                         if (featureArray[this.count].attr.geometry.type == "polyline") {
                             point = featureArray[this.count].attr.geometry.getPoint(0, 0);
                         } else {
                             point = featureArray[0].attr.geometry;
                         }
                         topic.publish("createInfoWindowContent", point, featureArray[0].attr.attributes, featureArray[0].fields, featureArray[0].layerId, featureArray, this.count, map);
                         topic.publish("hideProgressIndicator");

                         query(".esriCTdivInfoRightArrow")[0].onclick = function () {
                             dojo.showInfo = true;
                             _this._nextInfoContent(featureArray, map, point);
                         };
                         query(".esriCTdivInfoLeftArrow")[0].onclick = function () {
                             dojo.showInfo = true;
                             _this._previousInfoContent(featureArray, map, point);
                         };
                     }
                 } else {
                     topic.publish("hideProgressIndicator");
                 }
             },

             _nextInfoContent: function (featureArray, map, point) {
                 if (this.count < featureArray.length) {
                     this.count++;
                 }
                 if (featureArray[this.count]) {
                     topic.publish("createInfoWindowContent", point, featureArray[this.count].attr.attributes, featureArray[this.count].fields, featureArray[this.count].layerId, featureArray, this.count, map);
                     if (dojo.window.getBox().w <= 680) {
                         topic.publish("openMobileInfowindow");
                     }
                 }
             },

             _previousInfoContent: function (featureArray, map, point) {
                 if (this.count != 0 && this.count < featureArray.length) {
                     this.count--;
                 }
                 if (featureArray[this.count]) {
                     topic.publish("createInfoWindowContent", point, featureArray[this.count].attr.attributes, featureArray[this.count].fields, featureArray[this.count].layerId, featureArray, this.count, map);
                     if (dojo.window.getBox().w <= 680) {
                         topic.publish("openMobileInfowindow");
                     }
                 }
             },

             _persistDirectionValue: function () {
                 var locatorAddress, sourceAddress, destAddress;
                 locatorAddress = query(".esriCTTxtAddress")[0].value || domAttr.get(query(".esriCTTxtAddress")[0], "defaultAddress");
                 if (query(".esriGeocoder").length) {
                     sourceAddress = query(".esriGeocoder")[0].getElementsByTagName("input")[0].value;
                     destAddress = query(".esriGeocoder")[1].getElementsByTagName("input")[0].value;
                 } else {
                     sourceAddress = destAddress = "";
                 }
                 if (this._supportsLocalStorage()) {
                     // use local storage
                     window.localStorage.setItem("LocatorAddress", locatorAddress);
                     window.localStorage.setItem("SourceAddress", sourceAddress);
                     window.localStorage.setItem("DestAddress", destAddress);
                 } else {
                     // use a cookie
                     if (cookie.isSupported()) {
                         cookie("LocatorAddress", locatorAddress, { expires: 5 });
                         cookie("SourceAddress", sourceAddress, { expires: 5 });
                         cookie("DestAddress", destAddress, { expires: 5 });
                     }
                 }
             },

             _supportsLocalStorage: function () {
                 try {
                     return window.localStorage !== 'undefined' && window.localStorage !== null;
                 } catch (e) {
                     return false;
                 }
             },

             _onSetInfoWindowPosition: function (infoTitle, mobTitle, divInfoDetailsTab, screenPoint) {
                 this.infoWindowPanel.hide();
                 this.infoWindowPanel.setTitle(infoTitle, mobTitle);
                 this.infoWindowPanel.show(divInfoDetailsTab, screenPoint);
                 if (dojo.window.getBox().w <= 680) {
                     if (dojo.openInfowindow) {
                         topic.publish("openMobileInfowindow");
                     }
                 }
             },

             _slideRight: function () {
                 var difference = query(".divlegendContainer")[0].offsetWidth - query(".divlegendContent")[0].offsetWidth;
                 if (this.newLeft > difference) {
                     domStyle.set(query(".esriCTLeftArrow")[0], "display", "block");
                     domStyle.set(query(".esriCTLeftArrow")[0], "cursor", "pointer");
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
                     domStyle.set(query(".esriCTLeftArrow")[0], "display", "none");
                     domStyle.set(query(".esriCTLeftArrow")[0], "cursor", "default");
                 } else {
                     domStyle.set(query(".esriCTLeftArrow")[0], "display", "block");
                     domStyle.set(query(".esriCTLeftArrow")[0], "cursor", "pointer");
                 }
             },

             _generateLayerURL: function (operationalLayers) {
                 var i, str;
                 for (i = 0; i < operationalLayers.length; i++) {
                     if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                         str = operationalLayers[i].url.split('/');
                         this._createLayerURL(str);
                     } else {
                         if (operationalLayers[i].ServiceURL) {
                             str = operationalLayers[i].ServiceURL.split('/');
                             this._createLayerURL(str);
                         }
                     }
                 }
             },

             _createLayerURL: function (str) {
                 var layerTitle, layerId, index, infoIndex, infoWindowSettings, searchSettings;
                 infoWindowSettings = dojo.configData.InfoWindowSettings;
                 searchSettings = dojo.configData.SearchAnd511Settings;
                 layerTitle = str[str.length - 3];
                 layerId = str[str.length - 1];
                 for (index = 0; index < searchSettings.length; index++) {
                     if (searchSettings[index].Title && searchSettings[index].QueryLayerId) {
                         if (layerTitle === searchSettings[index].Title && layerId === searchSettings[index].QueryLayerId) {
                             searchSettings[index].QueryURL = str.join("/");
                         }
                     }
                 }
                 for (infoIndex = 0; infoIndex < infoWindowSettings.length; infoIndex++) {
                     if (infoWindowSettings[infoIndex].Title && infoWindowSettings[infoIndex].QueryLayerId) {
                         if (layerTitle === infoWindowSettings[infoIndex].Title && layerId === infoWindowSettings[infoIndex].QueryLayerId) {
                             infoWindowSettings[infoIndex].InfoQueryURL = str.join("/");
                         }
                     }
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
                 var layerMode = null, featureLayer;
                 if (layerInfo.LoadAsServiceType.toLowerCase() === "feature") {

                     /**
                     * set layerMode of the operational layer if it's type is feature
                     */
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
                     featureLayer = new FeatureLayer(layerInfo.ServiceURL, {
                         id: index,
                         mode: layerMode,
                         outFields: ["*"],
                         displayOnPan: false
                     });
                     this.map.addLayer(featureLayer);
                 } else if (layerInfo.LoadAsServiceType.toLowerCase() === "dynamic") {
                     this._addDynamicLayerService(layerInfo);
                 }
             },

             _addDynamicLayerService: function (layerInfo) {
                 var layerTitle, lastIndex, str;
                 clearTimeout(this.stagedSearch);
                 str = layerInfo.ServiceURL.split('/');
                 lastIndex = str[str.length - 1];
                 if (isNaN(lastIndex) || lastIndex === "") {
                     if (lastIndex == "") {
                         layerTitle = str[str.length - 3];
                     } else {
                         layerTitle = str[str.length - 2];
                     }
                 } else {
                     layerTitle = str[str.length - 3];
                 }
                 this.stagedSearch = setTimeout(lang.hitch(this, function () {
                     this._addServiceLayers(layerTitle, layerInfo.ServiceURL);
                 }), 500);
             },

             _addServiceLayers: function (layerId, layerURL) {
                 var dynamicLayer, imageParams, lastIndex, dynamicLayerId;
                 imageParams = new ImageParameters();
                 lastIndex = layerURL.lastIndexOf('/');
                 dynamicLayerId = layerURL.substr(lastIndex + 1);
                 if (isNaN(dynamicLayerId) || dynamicLayerId === "") {
                     if (isNaN(dynamicLayerId)) {
                         dynamicLayer = layerURL + "/";
                     } else if (dynamicLayerId === "") {
                         dynamicLayer = layerURL;
                     }
                     this._createDynamicServiceLayer(dynamicLayer, imageParams, layerId);
                 } else {
                     imageParams.layerIds = [dynamicLayerId];
                     dynamicLayer = layerURL.substring(0, lastIndex);
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
                     isExtentBasedLegend: true
                 }, domConstruct.create("div", {}, null));
                 return this.legendObject;
             },

             _addLayerLegend: function () {
                 var mapServerArray = [];
                 for (var i in dojo.configData.OperationalLayers) {
                     if (dojo.configData.OperationalLayers[i].ServiceURL) {
                         mapServerArray.push(dojo.configData.OperationalLayers[i].ServiceURL);
                     }
                 }
                 var legendObject = this._addLegendBox();
                 legendObject.startup(mapServerArray);
             },

             _addLayerLegendWebmap: function (response) {
                 var mapServerArray = [], i, j, legendObject;
                 var webMapDetails = response.itemInfo.itemData;
                 for (j = 0; j < webMapDetails.operationalLayers.length; j++) {
                     if (webMapDetails.operationalLayers[j].layerObject) {
                         for (i = 0; i < webMapDetails.operationalLayers[j].layerObject.layerInfos.length; i++) {
                             var layer = webMapDetails.operationalLayers[j].url + "/" + webMapDetails.operationalLayers[j].layerObject.layerInfos[i].id;
                             mapServerArray.push(layer);
                         }
                     } else {
                         mapServerArray.push(webMapDetails.operationalLayers[j].url);
                     }
                 }
                 legendObject = this._addLegendBox();
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
