/*global define, document, Modernizr */
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
    "dojo/dom-attr",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom-geometry",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/query",
    "dojo/_base/html",
    "dojo/string",
    "esri/tasks/locator",
    "esri/tasks/query",
    "../scrollBar/scrollBar",
    "dojo/Deferred",
    "dojo/_base/array",
    "dojo/DeferredList",
    "esri/tasks/QueryTask",
    "widgets/infoWindow/infoWindow",
    "esri/geometry",
    "dojo/cookie",
    "esri/geometry/Point",
    "dojo/text!./templates/locatorTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!nls/localizedStrings",
    "dojo/topic"
    ],
     function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, domClass, query, html, string, Locator, Query, scrollBar, Deferred, array, DeferredList, QueryTask, InfoWindow, Geometry, cookie, point, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls, topic) {
         //========================================================================================================================//

         return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
             templateString: template,
             nls: nls,
             lastSearchString: null,
             stagedSearch: null,
             locatorScrollbar: null,
             screenPoint: null,

             /**
             * display locator widget
             *
             * @class
             * @name widgets/locator/locator
             */
             /**
             * filter valid results from results returned by locator service
             * @param {object} candidates Contains results from locator service
             * @memberOf widgets/locator/locator
             */
             /**
             * call locator service and get search results
             * @memberOf widgets/locator/locator
             */
             searchLocation: function () {
                 var nameArray = { Address: [] };
                 domStyle.set(this.imgSearchLoader, "display", "block");
                 domStyle.set(this.close, "display", "none");
                 domAttr.set(this.txtAddress, "defaultAddress", this.txtAddress.value);
                 this._setHeightAddressResults();

                 /**
                 * call locator service specified in configuration file
                 */
                 var locatorSettings = dojo.configData.LocatorSettings;
                 var locator = new Locator(locatorSettings.LocatorURL);
                 var searchFieldName = locatorSettings.LocatorParameters.SearchField;
                 var addressField = {};
                 addressField[searchFieldName] = lang.trim(this.txtAddress.value);
                 var baseMapExtent;
                 if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length != 0) {
                     baseMapExtent = this.map.getLayer(this.map.layerIds[0]).fullExtent;
                 } else {
                     baseMapExtent = this.map.getLayer(this.map.basemapLayerIds[0]).fullExtent;
                 }
                 var options = {};
                 options["address"] = addressField;
                 options["outFields"] = locatorSettings.LocatorOutFields;
                 options[locatorSettings.LocatorParameters.SearchBoundaryField] = baseMapExtent;
                 locator.outSpatialReference = this.map.spatialReference;
                 var searchFields = [];
                 var addressFieldValues = locatorSettings.FilterFieldValues;
                 var addressFieldName = locatorSettings.FilterFieldName;
                 for (var s in addressFieldValues) {
                     if (addressFieldValues.hasOwnProperty(s)) {
                         searchFields.push(addressFieldValues[s]);
                     }
                 }

                 /**
                 * get results from locator service
                 * @param {object} options Contains address, outFields and basemap extent for locator service
                 * @param {object} candidates Contains results from locator service
                 */
                 var defferedArray = [];
                 for (var index = 0; index < dojo.configData.SearchAnd511Settings.length; index++) {
                     this._locateLayersearchResult(defferedArray, dojo.configData.SearchAnd511Settings[index]);

                 }
                 var locatorDef = locator.addressToLocations(options);
                 locator.on("address-to-locations-complete", lang.hitch(this, function (candidates) {
                     var deferred = new Deferred();
                     deferred.resolve(candidates);
                     return deferred.promise;
                 }), function () {
                     domStyle.set(this.imgSearchLoader, "display", "none");
                     domStyle.set(this.close, "display", "block");
                     this._locatorErrBack();
                 });
                 var resultLength;
                 defferedArray.push(locatorDef);
                 var deferredListResult = new DeferredList(defferedArray);
                 deferredListResult.then(lang.hitch(this, function (result) {
                     if (result) {
                         if (result.length > 0) {
                             for (var num = 0; num < result.length; num++) {
                                 if (dojo.configData.SearchAnd511Settings[num]) {
                                     var key = dojo.configData.SearchAnd511Settings[num].SearchDisplayTitle;
                                     nameArray[key] = [];
                                     for (var order = 0; order < result[num][1].features.length; order++) {
                                         for (var i in result[num][1].features[order].attributes) {
                                             if (result[num][1].features[order].attributes.hasOwnProperty(i)) {
                                                 if (!result[num][1].features[order].attributes[i]) {
                                                     result[num][1].features[order].attributes[i] = nls.showNullValue;
                                                 }
                                             }
                                         }
                                         if (nameArray[key].length < dojo.configData.LocatorSettings.MaxResults) {
                                             nameArray[key].push({
                                                 name: string.substitute(dojo.configData.SearchAnd511Settings[num].SearchDisplayFields, result[num][1].features[order].attributes),
                                                 attributes: result[num][1].features[order].attributes,
                                                 layer: dojo.configData.SearchAnd511Settings[num],
                                                 geometry: result[num][1].features[order].geometry
                                             });
                                         }
                                     }
                                 } else {
                                     this._addressResult(result[num][1], nameArray, searchFields, addressFieldName);
                                 }
                                 resultLength = result[num][1].length;
                             }
                             this._showLocatedAddress(nameArray, resultLength);
                         }
                     }
                     else {
                         domStyle.set(this.imgSearchLoader, "display", "none");
                         domStyle.set(this.close, "display", "block");
                         this.mapPoint = null;
                         this._locatorErrBack();
                     }
                 }));
             },

             _addressResult: function (candidates, nameArray, searchFields, addressFieldName) {
                 for (var order = 0; order < candidates.length; order++) {
                     if (candidates[order].attributes[dojo.configData.LocatorSettings.AddressMatchScore.Field] > dojo.configData.LocatorSettings.AddressMatchScore.Value) {
                         for (var j in searchFields) {
                             if (searchFields.hasOwnProperty(j)) {
                                 if (candidates[order].attributes[addressFieldName] == searchFields[j]) {
                                     if (nameArray.Address.length < dojo.configData.LocatorSettings.MaxResults) {
                                         nameArray.Address.push({
                                             name: string.substitute(dojo.configData.LocatorSettings.DisplayField, candidates[order].attributes),
                                             attributes: candidates[order]
                                         });
                                     }
                                 }
                             }
                         }
                     }
                 }
             },

             _locateLayersearchResult: function (defferedArray, layerobject) {
                 domStyle.set(this.imgSearchLoader, "display", "block");
                 domStyle.set(this.close, "display", "none");
                 if (layerobject.QueryURL) {
                     var queryTask = new QueryTask(layerobject.QueryURL);
                     var query = new Query();
                     query.where = string.substitute(layerobject.SearchExpression, [lang.trim(this.txtAddress.value).toUpperCase()]);
                     query.outSpatialReference = this.map.spatialReference;
                     query.returnGeometry = true;
                     query.outFields = ["*"];
                     var queryTaskResult = queryTask.execute(query, lang.hitch(this, function (featureSet) {
                         var deferred = new Deferred();
                         deferred.resolve(featureSet);
                         return deferred.promise;
                     }), function (err) {
                         alert(err.message);
                     });
                     defferedArray.push(queryTaskResult);
                 }
             },

             _showLocatedAddress: function (candidates, resultLength) {
                 var addrListCount = 0;
                 var addrList = [];
                 domConstruct.empty(this.divAddressResults);
                 if (lang.trim(this.txtAddress.value) === "") {
                     this.txtAddress.focus();
                     domConstruct.empty(this.divAddressResults);
                     this.locatorScrollbar = new scrollBar({ domNode: this.divAddressScrollContent });
                     this.locatorScrollbar.setContent(this.divAddressResults);
                     this.locatorScrollbar.createScrollBar();
                     domStyle.set(this.imgSearchLoader, "display", "none");
                     domStyle.set(this.close, "display", "block");
                     return;
                 }

                 /**
                 * display all the located address in the address container
                 * 'this.divAddressResults' div dom element contains located addresses, created in widget template
                 */

                 if (this.locatorScrollbar) {
                     domClass.add(this.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                     this.locatorScrollbar.removeScrollBar();
                 }
                 this.locatorScrollbar = new scrollBar({ domNode: this.divAddressScrollContent });
                 this.locatorScrollbar.setContent(this.divAddressResults);
                 this.locatorScrollbar.createScrollBar();
                 if (resultLength > 0) {
                     for (var candidateArray in candidates) {
                         if (candidates[candidateArray].length > 0) {
                             var divAddressCounty = domConstruct.create("div", { "class": "esriCTBottomBorder esriCTResultColor esriCTCursorPointer esriAddressCounty" }, this.divAddressResults);
                             var candiate = candidateArray + " (" + candidates[candidateArray].length + ")";
                             domConstruct.create("span", { "innerHTML": "+", "class": "plus-minus" }, divAddressCounty);
                             domConstruct.create("span", { "innerHTML": candiate }, divAddressCounty);
                             domStyle.set(this.imgSearchLoader, "display", "none");
                             domStyle.set(this.close, "display", "block");
                             addrList.push(divAddressCounty);
                             this._toggleAddressList(addrList, addrListCount);
                             addrListCount++;
                             var listContainer = domConstruct.create("div", { "class": "listContainer hideAddressList" }, this.divAddressResults);
                             for (var i = 0; i < candidates[candidateArray].length; i++) {
                                 this._displayValidLocations(candidates[candidateArray][i], i, candidates[candidateArray], listContainer);
                             }
                         }
                     }
                 }
                 else {
                     domStyle.set(this.imgSearchLoader, "display", "none");
                     domStyle.set(this.close, "display", "block");
                     this.mapPoint = null;
                     this._locatorErrBack();
                 }
             },

             locateAddressOnMap: function (mapPoint) {
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

             _toggleAddressList: function (addressList, idx) {
                 on(addressList[idx], "click", lang.hitch(this, function () {
                     if (domClass.contains(query(".listContainer")[idx], "showAddressList")) {
                         domClass.toggle(query(".listContainer")[idx], "showAddressList");
                         var listStatusSymbol = (domAttr.get(query(".plus-minus")[idx], "innerHTML") == "+") ? "-" : "+";
                         domAttr.set(query(".plus-minus")[idx], "innerHTML", listStatusSymbol);
                         this.locatorScrollbar.resetScrollBar();
                         return;
                     } else {
                         domClass.add(query(".listContainer")[idx], "showAddressList");
                         domAttr.set(query(".plus-minus")[idx], "innerHTML", "-");
                     }
                     this.locatorScrollbar.resetScrollBar();
                 }));
             },

             /**
             * display valid result in search panel
             * @param {object} candidate Contains valid result to be displayed in search panel
             * @return {Boolean} true if result is displayed successfully
             * @memberOf widgets/locator/locator
             */
             _displayValidLocations: function (candidate, index, candidateArray, listContainer) {
                 domClass.remove(this.divAddressContent, "esriCTAddressResultHeight");
                 domClass.add(this.divAddressContent, "esriCTAddressContainerHeight");
                 var candidateDate = domConstruct.create("div", { "class": "esriCTContentBottomBorder esriCTCursorPointer" }, listContainer);
                 domAttr.set(candidateDate, "index", index);
                 try {
                     if (candidate.name) {
                         domAttr.set(candidateDate, "innerHTML", candidate.name);
                     }
                     else {
                         domAttr.set(candidateDate, "innerHTML", candidate);
                     }
                     if (candidate.attributes.location) {
                         domAttr.set(candidateDate, "x", candidate.attributes.location.x);
                         domAttr.set(candidateDate, "y", candidate.attributes.location.y);
                         domAttr.set(candidateDate, "address", string.substitute(dojo.configData.LocatorSettings.DisplayField, candidate.attributes.attributes));
                     }
                 } catch (err) {
                     alert(nls.errorMessages.falseConfigParams);
                 }
                 var _this = this;
                 candidateDate.onclick = function (evt) {
                     topic.publish("showProgressIndicator");
                     if (_this.map.infoWindow) {
                         _this.map.infoWindow.hide();
                     }
                     _this.txtAddress.value = this.innerHTML;
                     domAttr.set(_this.txtAddress, "defaultAddress", _this.txtAddress.value);
                     _this._hideAddressContainer();
                     if (candidate.attributes.location) {
                         _this.mapPoint = new point(domAttr.get(this, "x"), domAttr.get(this, "y"), _this.map.spatialReference);
                         _this.locateAddressOnMap(_this.mapPoint);
                     }
                     else {
                         if (candidateArray[domAttr.get(candidateDate, "index", index)]) {
                             var layer = candidateArray[domAttr.get(candidateDate, "index", index)].layer.QueryURL;
                             for (var infoIndex = 0; infoIndex < dojo.configData.SearchAnd511Settings.length; infoIndex++) {
                                 if (dojo.configData.InfoWindowSettings[infoIndex] && dojo.configData.InfoWindowSettings[infoIndex].InfoQueryURL == layer) {
                                     _this._showFeatureResultsOnMap(candidateArray, candidate, infoIndex, index);
                                 } else if (dojo.configData.SearchAnd511Settings[infoIndex].QueryURL == layer) {
                                     _this._showRoadResultsOnMap(candidate);
                                 }
                             }
                         }
                     }
                 };
             },

             _showRoadResultsOnMap: function (candidate) {
                 this.map.setLevel(dojo.configData.ZoomLevel);
                 var point = candidate.geometry.getPoint(0, 0);
                 this.map.centerAt(point);
                 topic.publish("hideProgressIndicator");
             },

             _showFeatureResultsOnMap: function (candidateArray, candidate, infoIndex, index) {
                 domStyle.set(this.imgSearchLoader, "display", "block");
                 domStyle.set(this.close, "display", "none");
                 this.txtAddress.value = (candidate.name);
                 if (candidate.layer.QueryURL) {
                     var queryTask = new QueryTask(candidate.layer.QueryURL);
                     var query = new Query();
                     query.where = "1=1";
                     query.outSpatialReference = this.map.spatialReference;
                     query.returnGeometry = true;
                     query.outFields = ["*"];
                     queryTask.execute(query, lang.hitch(this, function (featureSet) {
                         if (featureSet.features[index].geometry.type == "point") {
                             this.createInfoWindowContent(featureSet.features[index].geometry, featureSet.features[index].attributes, featureSet.fields, infoIndex, null, null, this.map);
                         } else if (featureSet.features[index].geometry.type == "polyline") {
                             var point = featureSet.features[index].geometry.getPoint(0, 0);
                             this.createInfoWindowContent(point, featureSet.features[index].attributes, featureSet.fields, infoIndex, null, null, this.map);
                         }
                     }), function (err) {
                         alert(err.message);
                     });
                 }
             },

             createInfoWindowContent: function (mapPoint, attributes, fields, infoIndex, featureArray, count, map) {
                 if (featureArray) {
                     if (featureArray.length > 1 && count != featureArray.length - 1) {
                         domClass.add(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                         domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", count);
                     } else {
                         domClass.remove(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                         domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", "");
                     }
                     if (count > 0 && count < featureArray.length) {
                         domClass.add(query(".esriCTdivInfoLeftArrow")[0], "esriCTShowInfoLeftArrow");
                         domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", count + 1);
                     } else {
                         domClass.remove(query(".esriCTdivInfoLeftArrow")[0], "esriCTShowInfoLeftArrow");
                         domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", count + 1);
                     }
                 } else {
                     domClass.remove(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                     domClass.remove(query(".esriCTdivInfoLeftArrow")[0], "esriCTShowInfoLeftArrow");
                     domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", "");
                     domAttr.set(query(".esriCTdivInfoTotalFeatureCount")[0], "innerHTML", "");
                 }
                 var layerSettings = dojo.configData;
                 var infoPopupFieldsCollection = layerSettings.InfoWindowSettings[infoIndex].InfoWindowData;
                 var infoWindowTitle = layerSettings.InfoWindowSettings[infoIndex].InfoWindowHeaderField;
                 var infoPopupHeight = layerSettings.InfoPopupHeight;
                 var infoPopupWidth = layerSettings.InfoPopupWidth;
                 var divInfoDetailsTab = domConstruct.create("div", { "class": "esriCTInfoDetailsTab" }, null);
                 this.divInfoDetailsContainer = domConstruct.create("div", { "class": "divInfoDetailsContainer" }, divInfoDetailsTab);
                 for (var key = 0; key < infoPopupFieldsCollection.length; key++) {
                     var divInfoRow = domConstruct.create("div", { "className": "esriCTDisplayRow" }, this.divInfoDetailsContainer);
                     // Create the row's label
                     this.divInfoDisplayField = domConstruct.create("div", { "className": "esriCTDisplayField", "innerHTML": infoPopupFieldsCollection[key].DisplayText }, divInfoRow);
                     this.divInfoFieldValue = domConstruct.create("div", { "className": "esriCTValueField" }, divInfoRow);
                     for (var i in attributes) {
                         if (attributes.hasOwnProperty(i)) {
                             if (!attributes[i]) {
                                 attributes[i] = nls.showNullValue;
                             }
                         }
                     }
                     var fieldNames = string.substitute(infoPopupFieldsCollection[key].FieldName, attributes);
                     if (infoPopupFieldsCollection[key].FieldName == "${Link}" || infoPopupFieldsCollection[key].FieldName == "Link") {
                         var link = fieldNames;
                         var divLink;
                         if (layerSettings.SearchAnd511Settings[infoIndex].SearchDisplayTitle == "Cameras") {
                             divLink = domConstruct.create("img", { "class": "esriCTLink" }, this.divInfoFieldValue);
                             domAttr.set(divLink, "src", link);
                         }
                         else if (layerSettings.SearchAnd511Settings[infoIndex].SearchDisplayTitle == "Video Cameras") {
                             divLink = domConstruct.create("div", { "class": "esriCTLink" }, this.divInfoFieldValue);
                             this._renderVideoContent(link, divLink);

                         } else {
                             divLink = domConstruct.create("img", { "class": "esriCTLink" }, this.divInfoFieldValue);
                             domAttr.set(divLink, "src", link);
                         }
                         domClass.replace(this.divInfoFieldValue, "esriCTValueFieldLink", "esriCTValueField");
                     }
                     else {
                         this.divInfoFieldValue.innerHTML = fieldNames;
                     }
                 }
                 for (var j in attributes) {
                     if (attributes.hasOwnProperty(j)) {
                         if (!attributes[j]) {
                             attributes[j] = nls.showNullValue;
                         }
                     }
                 }
                 var infoTitle = string.substitute(layerSettings.InfoWindowSettings[infoIndex].InfoWindowHeaderField, attributes);
                 var mobTitle = string.substitute(layerSettings.InfoWindowSettings[infoIndex].InfoWindowContent, attributes);
                 dojo.selectedMapPoint = mapPoint;
                 var extentChanged = map.setExtent(this._calculateCustomMapExtent(mapPoint));
                 extentChanged.then(lang.hitch(this, function () {
                     topic.publish("hideProgressIndicator");
                     var screenPoint = map.toScreen(dojo.selectedMapPoint);
                     screenPoint.y = map.height - screenPoint.y;
                     topic.publish("setInfoWindowOnMap", infoTitle, mobTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight, count);
                 }));
             },

             _renderVideoContent: function (pageContentModule, pageModule) {
                 var embed = '', urlParam = pageContentModule;
                 embed += "<video width=" + "90%" + " height=" + "150" + "px src='" + pageContentModule + "' frameborder=0 webkitAllowFullScreen mozallowfullscreen allowFullScreen></video>";
                 pageModule.innerHTML = embed;
             },

             _calculateCustomMapExtent: function (mapPoint) {
                 var width = this.map.extent.getWidth();
                 var height = this.map.extent.getHeight();
                 var ratioHeight = height / this.map.height;
                 var totalYPoint = dojo.configData.InfoPopupHeight + 30 + 61;
                 var infoWindowHeight = height - (ratioHeight * totalYPoint);
                 var xmin = mapPoint.x - (width / 2);
                 var ymin = mapPoint.y - infoWindowHeight;
                 var xmax = xmin + width;
                 var ymax = ymin + height;
                 return new esri.geometry.Extent(xmin, ymin, xmax, ymax, this.map.spatialReference);
             }
         });
     });