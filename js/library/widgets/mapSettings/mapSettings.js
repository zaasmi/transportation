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
    "dojo/i18n!nls/localizedStrings",
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
    "esri/geometry/Extent",
    "esri/dijit/HomeButton",
    "dojo/Deferred",
    "dojo/DeferredList",
    "esri/SpatialReference",
    "widgets/infoWindow/infoWindow",
    "dojo/text!../infoWindow/templates/infoWindow.html",
    "dojo/topic",
    "esri/geometry/Point",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/request",
    "dojo/cookie",
    "dojo/_base/unload",
    "dojo/domReady!"
    ],
     function (declare, domConstruct, domStyle, lang, esriUtils, on, dom, domAttr, query, domClass, domGeom, array, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls, esriMap, ImageParameters, Directions, FeatureLayer, GraphicsLayer, SimpleLineSymbol, SimpleRenderer, basemap, Color, baseMapGallery, route, legends, geometryExtent, HomeButton, Deferred, DeferredList, spatialReference, infoWindow, template, topic, Point, arcGISDynamicMapServiceLayer, esriRequest, cookie, baseUnload) {

         //========================================================================================================================//

         return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

             map: null,
             templateString: template,
             tempGraphicsLayerId: "esriGraphicsLayerMapSettings",
             nls: nls,
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
                 var extentPoints = dojo.configData && dojo.configData.DefaultExtent && dojo.configData.DefaultExtent.split(",");
                 var graphicsLayer = new GraphicsLayer();
                 graphicsLayer.id = this.tempGraphicsLayerId;

                 /**
                 * load map
                 * @param {string} dojo.configData.BaseMapLayers Basemap settings specified in configuration file
                 */
                 this.infoWindowPanel = new infoWindow({ infoWindowWidth: dojo.configData.InfoPopupWidth, infoWindowHeight: dojo.configData.InfoPopupHeight });
                 if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length != 0) {
                     var mapDeferred = esriUtils.createMap(dojo.configData.WebMapId, "esriCTParentDivContainer", {
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
                         var geometry = response.map.extent;
                         this._initializeMapSettings(graphicsLayer, geometry);
                         this._generateLayerURL(response.itemInfo.itemData.operationalLayers);
                         var webMapDetails = response.itemInfo.itemData;
                         this._addLayerLegend();
                         this._addFrequentRoutesLayer();

                         topic.publish("showInfoWindowContent", geometry);
                         this._addMapEvents();
                     }));
                 }
                 else {
                     this._generateLayerURL(dojo.configData.OperationalLayers);
                     this.map = esriMap("esriCTParentDivContainer", {
                         basemap: dojo.configData.BaseMapLayers[0].Key
                     });
                     this._addFrequentRoutesLayer();
                     this._mapOnLoad(extentPoints, graphicsLayer);
                 }
             },

             _mapOnLoad: function (extentPoints, graphicsLayer) {

                 /* set position of home button widget after map is successfuly loaded
                 * @param {array} dojo.configData.OperationalLayers List of operational Layers specified in configuration file
                 */
                 this.map.on("load", lang.hitch(this, function () {
                     var extent = this._getQueryString('extent');
                     if (extent == "") {
                         var mapDefaultExtent = new geometryExtent({ "xmin": parseFloat(extentPoints[0]), "ymin": parseFloat(extentPoints[1]), "xmax": parseFloat(extentPoints[2]), "ymax": parseFloat(extentPoints[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                         this.map.setExtent(mapDefaultExtent);
                     } else {
                         var mapDefaultExtent = extent.split(',');
                         mapDefaultExtent = new geometryExtent({ "xmin": parseFloat(mapDefaultExtent[0]), "ymin": parseFloat(mapDefaultExtent[1]), "xmax": parseFloat(mapDefaultExtent[2]), "ymax": parseFloat(mapDefaultExtent[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                         this.map.setExtent(mapDefaultExtent);
                     }
                     this._initializeMapSettings(graphicsLayer, mapDefaultExtent);
                     if (window.location.toString().split("$point=").length > 1) {
                         var mapPoint = new Point(Number(window.location.toString().split("$point=")[1].split(",")[0]), Number(window.location.toString().split("$point=")[1].split(",")[1]), this.map.spatialReference);
                         topic.publish("locateAddressOnMap", mapPoint);
                     }
                     for (var i in dojo.configData.OperationalLayers) {
                         this._addOperationalLayerToMap(i, dojo.configData.OperationalLayers[i]);
                     }
                     if (dojo.configData.BaseMapLayers.length > 1) {
                         this._showBasMapGallery();
                     }
                     this._addMapEvents();
                 }));
             },

             _initializeMapSettings: function (graphicsLayer, mapDefaultExtent) {
                 this.map.addLayer(graphicsLayer);

                 /**
                 * load esri 'Home Button' widget
                 */
                 var home = this._addHomeButton();
                 domConstruct.place(home.domNode, query(".esriSimpleSliderIncrementButton")[0], "after");
                 if (!dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length == 0) {
                     home.extent = mapDefaultExtent;
                 }
                 home.startup();
                 if (dojo.configData.CustomLogoUrl && lang.trim(dojo.configData.CustomLogoUrl).length != 0) {
                     domConstruct.create("img", { "src": dojoConfig.baseURL + dojo.configData.CustomLogoUrl, "class": "esriCTMapLogo" }, dom.byId("esriCTParentDivContainer"));
                 }
                 this.map.on("extent-change", lang.hitch(this, function () {
                     topic.publish("setMapTipPosition", dojo.selectedMapPoint, this.map, this.infoWindowPanel);
                     if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length != 0) {
                         topic.publish("showInfoWindowContent", mapDefaultExtent);
                     }
                 }));
                 this._addLayerLegend();
             },

             _addMapEvents: function () {
                 topic.subscribe("setInfoWindowOnMap", lang.hitch(this, function (infoTitle, mobTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight, count) {
                     this._onSetInfoWindowPosition(infoTitle, mobTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight, count);
                 }));
                 topic.subscribe("hideInfoWindowOnMap", lang.hitch(this, function () {
                     this._hideInfoWindow();
                 }));
                 baseUnload.addOnWindowUnload(lang.hitch(this, function (a) {
                     this._persistDirectionValue(a);
                 }));

                 this.map.on("click", lang.hitch(this, function (evt) {
                     topic.publish("showProgressIndicator");
                     this._showInfoWindowOnMap(evt.mapPoint, this.map);
                 }));
             },

             _fetchWebMapData: function (response) {
                 dojo.configData.InfoWindowSettings = []
                 var infoWindowSettings, searchSettings, i, str, layerTitle, layerId, index, infoIndex;
                 searchSettings = dojo.configData.SearchAnd511Settings;
                 var webMapDetails = response.itemInfo.itemData;
                 dojo.configData.OperationalLayers = [];
                 var operationalLayers = dojo.configData.OperationalLayers;
                 var serviceTitle = [];
                 var p = 0;
                 for (var i = 0; i < webMapDetails.operationalLayers.length; i++) {
                     var operationalLayerId = lang.trim(webMapDetails.operationalLayers[i].title);
                     var str = webMapDetails.operationalLayers[i].url.split('/');
                     var lastIndex = str[str.length - 1];
                     if (isNaN(lastIndex) || lastIndex == "") {
                         if (lastIndex == "") {
                             serviceTitle[operationalLayerId] = webMapDetails.operationalLayers[i].url;
                         } else {
                             serviceTitle[operationalLayerId] = webMapDetails.operationalLayers[i].url + "/";
                         }
                     } else {
                         serviceTitle[operationalLayerId] = webMapDetails.operationalLayers[i].url.substring(0, webMapDetails.operationalLayers[i].url.length - 1);
                     }
                 }

                 for (var index = 0; index < searchSettings.length; index++) {
                     if (searchSettings[index].Title && searchSettings[index].QueryLayerId && serviceTitle[searchSettings[index].Title]) {
                         searchSettings[index].QueryURL = serviceTitle[searchSettings[index].Title] + searchSettings[index].QueryLayerId;
                         for (var j = 0; j < webMapDetails.operationalLayers.length; j++) {
                             if (webMapDetails.operationalLayers[j].title && serviceTitle[webMapDetails.operationalLayers[j].title] && (webMapDetails.operationalLayers[j].title == searchSettings[index].Title)) {
                                 if (webMapDetails.operationalLayers[j].layers) {
                                     //Fetching infopopup data in case the layers are added as dynamic layers in the webmap
                                     for (var k = 0; k < webMapDetails.operationalLayers[j].layers.length; k++) {
                                         var layerInfo = webMapDetails.operationalLayers[j].layers[k];
                                         if (searchSettings[index].QueryLayerId == layerInfo.id) {
                                             if (webMapDetails.operationalLayers[j].layers[k].popupInfo) {
                                                 dojo.configData.InfoWindowSettings.push({ "InfoQueryURL": serviceTitle[searchSettings[index].Title] + searchSettings[index].QueryLayerId });
                                                 operationalLayers[p] = {};
                                                 operationalLayers[p]["ServiceURL"] = webMapDetails.operationalLayers[j].url + "/" + webMapDetails.operationalLayers[j].layers[k].id;
                                                 p++;
                                                 if (layerInfo.popupInfo.title.split("{").length > 1) {
                                                     dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1]["InfoWindowHeaderField"] = dojo.string.trim(layerInfo.popupInfo.title.split("{")[0]) + " ";
                                                     for (var l = 1; l < layerInfo.popupInfo.title.split("{").length; l++) {
                                                         dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1]["InfoWindowHeaderField"] += "${" + dojo.string.trim(layerInfo.popupInfo.title.split("{")[l]);
                                                     }
                                                 } else {
                                                     if (dojo.string.trim(layerInfo.popupInfo.title) != "") {
                                                         dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1]["InfoWindowHeaderField"] = dojo.string.trim(layerInfo.popupInfo.title);
                                                     } else {
                                                         dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1]["InfoWindowHeaderField"] = responseObject.ShowNullValueAs;
                                                     }
                                                 }
                                                 var infowindowIndex = dojo.configData.InfoWindowSettings.length - 1;
                                                 this.getMobileCalloutContentField(infowindowIndex);
                                                 dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1]["InfoWindowData"] = [];
                                                 for (var field in layerInfo.popupInfo.fieldInfos) {
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
                                         for (var l = 1; l < webMapDetails.operationalLayers[j].popupInfo.title.split("{").length; l++) {
                                             dojo.configData.InfoWindowSettings[index]["InfoWindowHeaderField"] += " ${" + dojo.string.trim(webMapDetails.operationalLayers[j].popupInfo.title.split("{")[l]);
                                         }
                                     } else {
                                         if (dojo.string.trim(webMapDetails.operationalLayers[j].popupInfo.title) != "") {
                                             dojo.configData.InfoWindowSettings[index]["InfoWindowHeaderField"] = dojo.string.trim(webMapDetails.operationalLayers[j].popupInfo.title);
                                         } else {
                                             dojo.configData.InfoWindowSettings[index]["InfoWindowHeaderField"] = responseObject.ShowNullValueAs;
                                         }
                                     }
                                     if (webMapDetails.operationalLayers[j].layerObject.displayField) {
                                         dojo.configData.InfoWindowSettings[index]["InfoWindowContent"] = "${" + webMapDetails.operationalLayers[j].layerObject.displayField + "}";
                                     } else {
                                         this.getMobileCalloutContentField(index);
                                     }
                                     dojo.configData.InfoWindowSettings[index]["InfoWindowData"] = [];
                                     for (var field in webMapDetails.operationalLayers[j].popupInfo.fieldInfos) {
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
                         alert(nls.webMapMessages);
                     }
                 }
             },

             // Get data to be displayed in mobile callout content field

             getMobileCalloutContentField: function (index) {
                 var def = new Deferred();
                 esri.request({
                     url: dojo.configData.InfoWindowSettings[index].InfoQueryURL + '?f=json',
                     load: function (data) {
                         if (data.displayField) {
                             dojo.configData.InfoWindowSettings[index]["InfoWindowContent"] = "${" + data.displayField + "}";
                         } else {
                             for (var i = 0; i < data.fields.length; i++) {
                                 if (data.fields[i].type != "esriFieldTypeOID") {
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
                 var roadLineSymbol = new SimpleLineSymbol();
                 roadLineSymbol.setWidth(parseInt(dojo.configData.RouteSymbology.Width));
                 var roadLinefillColor = new Color([parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[0]), parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[1]), parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[2]), parseFloat(dojo.configData.RouteSymbology.Transparency.split(",")[0])]);
                 roadLineSymbol.setColor(roadLinefillColor);
                 var roadLineRenderer = new SimpleRenderer(roadLineSymbol);
                 var frequentRoutesLayer = new FeatureLayer(dojo.configData.FrequentRoutesLayer.LayerURL, {
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
                 this.counter = 0;
                 var onMapFeaturArray = [];
                 var onMapFeatureData = [];
                 for (var index = 0; index < dojo.configData.InfoWindowSettings.length; index++) {
                     this._executeQueryTask(index, mapPoint, onMapFeaturArray);
                 }
                 var deferredListResult = new DeferredList(onMapFeaturArray);
                 var featureArray = [];
                 deferredListResult.then(lang.hitch(this, function (result) {
                     if (result) {
                         for (var j = 0; j < result.length; j++) {
                             if (result[j][1].features.length > 0) {
                                 for (var i = 0; i < result[j][1].features.length; i++) {
                                     featureArray.push({
                                         attr: result[j][1].features[i],
                                         layerId: j,
                                         fields: result[j][1].fields
                                     });
                                 }
                             }
                         }
                         this._fetchQueryResults(featureArray, mapPoint, map);
                     }
                 }), function (err) {
                     alert(err.message);
                 });
             },

             _executeQueryTask: function (index, mapPoint, onMapFeaturArray) {
                 var queryTask = new esri.tasks.QueryTask(dojo.configData.SearchAnd511Settings[index].QueryURL);
                 var query = new esri.tasks.Query();
                 query.outSpatialReference = this.map.spatialReference;
                 query.returnGeometry = true;
                 query.geometry = this._extentFromPoint(mapPoint);
                 query.outFields = ["*"];
                 var queryOnRouteTask = queryTask.execute(query, lang.hitch(this, function (results) {
                     var deferred = new Deferred();
                     deferred.resolve(results);
                     return deferred.promise;
                 }), function (err) {
                     alert(err.message);
                 });
                 onMapFeaturArray.push(queryOnRouteTask);

             },

             _extentFromPoint: function (point) {
                 var tolerance = 3;
                 var screenPoint = this.map.toScreen(point);
                 var sourcePoint = new Point(screenPoint.x - tolerance, screenPoint.y + tolerance);
                 var destinationPoint = new Point(screenPoint.x + tolerance, screenPoint.y - tolerance);
                 var sourceMapPoint = this.map.toMap(sourcePoint);
                 var destinationMapPoint = this.map.toMap(destinationPoint);
                 return new geometryExtent(sourceMapPoint.x, sourceMapPoint.y, destinationMapPoint.x, destinationMapPoint.y, this.map.spatialReference);
             },

             _fetchQueryResults: function (featureArray, mapPoint, map) {
                 if (featureArray.length > 0) {
                     if (featureArray.length == 1) {
                         dojo.showInfo = true;
                         domClass.remove(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                         topic.publish("createInfoWindowContent", featureArray[0].attr.geometry, featureArray[0].attr.attributes, featureArray[0].fields, featureArray[0].layerId, null, null, map);
                     } else {
                         this.count = 0;
                         dojo.showInfo = true;
                         domAttr.set(query(".esriCTdivInfoTotalFeatureCount")[0], "innerHTML", '/' + featureArray.length);
                         if (featureArray[this.count].attr.geometry.type == "polyline") {
                             var point = featureArray[this.count].attr.geometry.getPoint(0, 0);
                             topic.publish("createInfoWindowContent", point, featureArray[0].attr.attributes, featureArray[0].fields, featureArray[0].layerId, featureArray, this.count, map);
                         } else {
                             topic.publish("createInfoWindowContent", featureArray[0].attr.geometry, featureArray[0].attr.attributes, featureArray[0].fields, featureArray[0].layerId, featureArray, this.count, map);
                         }
                         topic.publish("hideProgressIndicator");
                         var _this = this;
                         query(".esriCTdivInfoRightArrow")[0].onclick = function (evt) {
                             dojo.showInfo = true;
                             topic.publish("showProgressIndicator");
                             _this._nextInfoContent(featureArray, map);
                         };
                         query(".esriCTdivInfoLeftArrow")[0].onclick = function (evt) {
                             dojo.showInfo = true;
                             topic.publish("showProgressIndicator");
                             _this._previousInfoContent(featureArray, map);
                         };
                     }
                 } else {
                     alert(nls.errorMessages.invalidSearch);
                     topic.publish("hideProgressIndicator");
                 }
             },

             _nextInfoContent: function (featureArray, map) {
                 if (this.count < featureArray.length) {
                     this.count++;
                 }
                 if (featureArray[this.count]) {
                     if (featureArray[this.count].attr.geometry.type == "polyline") {
                         var point = featureArray[this.count].attr.geometry.getPoint(0, 0);
                         topic.publish("createInfoWindowContent", point, featureArray[this.count].attr.attributes, featureArray[this.count].fields, featureArray[this.count].layerId, featureArray, this.count, map);
                     } else {
                         topic.publish("createInfoWindowContent", featureArray[this.count].attr.geometry, featureArray[this.count].attr.attributes, featureArray[this.count].fields, featureArray[this.count].layerId, featureArray, this.count, map);
                     }
                 }
             },

             _previousInfoContent: function (featureArray, map) {
                 var featureCount = featureArray.length;
                 if (this.count != 0 && this.count < featureArray.length) {
                     this.count--;
                 }
                 if (featureArray[this.count]) {
                     if (featureArray[this.count].attr.geometry.type == "polyline") {
                         var point = featureArray[this.count].attr.geometry.getPoint(0, 0);
                         topic.publish("createInfoWindowContent", point, featureArray[this.count].attr.attributes, featureArray[this.count].fields, featureArray[this.count].layerId, featureArray, this.count, map);
                     } else {
                         topic.publish("createInfoWindowContent", featureArray[this.count].attr.geometry, featureArray[this.count].attr.attributes, featureArray[this.count].fields, featureArray[this.count].layerId, featureArray, this.count, map);
                     }
                 }
             },

             _persistDirectionValue: function (a) {
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
                     return "localStorage" in window && window["localStorage"] !== null;
                 } catch (e) {
                     return false;
                 }
             },

             _onSetInfoWindowPosition: function (infoTitle, mobTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight, count) {

                 this.infoWindowPanel.resize(infoPopupWidth, infoPopupHeight);

                 this.infoWindowPanel.hide();
                 this.infoWindowPanel.setTitle(infoTitle, mobTitle);
                 this.infoWindowPanel.show(divInfoDetailsTab, screenPoint);
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
                 var infoWindowSettings = dojo.configData.InfoWindowSettings;
                 var searchSettings = dojo.configData.SearchAnd511Settings;
                 for (var i = 0; i < operationalLayers.length; i++) {
                     if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length != 0) {
                         var str = operationalLayers[i].url.split('/');
                         var layerTitle = str[str.length - 3];
                         var layerId = str[str.length - 1];
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
                     } else {
                         if (operationalLayers[i].ServiceURL) {
                             var str = operationalLayers[i].ServiceURL.split('/');
                             var layerTitle = str[str.length - 3];
                             var layerId = str[str.length - 1];
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
                 var layerTitle;
                 if (isNaN(lastIndex) || lastIndex == "") {
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