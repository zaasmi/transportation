/*global dojo,define,document */
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
    "dojo/_base/array",
    "dojo/query",
    "dojo/dom-attr",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/string",
    "dojo/_base/html",
    "dojo/aspect",
    "dojo/text!./templates/legendsTemplate.html",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/renderers/SimpleRenderer",
    "dojo/_base/Color",
    "dojo/topic",
    "dojo/Deferred",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!nls/localizedStrings",
    "esri/request",
     "esri/map",
     "esri/tasks/query",
     "esri/tasks/QueryTask"
  ],
function (declare, domConstruct, domStyle, lang, array, query, domAttr, on, dom, domClass, domGeom, string, html, aspect, template, simpleMarkerSymbol, simpleFillSymbol, SimpleRenderer, Color, topic, Deferred, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls, esriRequest, esriMap, Query, QueryTask) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        nls: nls,
        divLegendList: null,
        layerObject: null,
        _layerCollection: {},
        _rendererArray: [],

        /**
        * create legends widget
        * @class
        * @name widgets/legends/legends
        */
        postCreate: function () {
            if (this.isExtentBasedLegend) {
                this.map.on("extent-change", lang.hitch(this, function (evt) {
                    var defQueryArray = [];
                    var queryResult;
                    for (layer in this._layerCollection) {
                        var layerObject = this._layerCollection[layer];
                        var rendererObject = layerObject.renderer && layerObject.renderer.infos ? layerObject.renderer.infos : layerObject.drawingInfo.renderer.uniqueValueInfos ? layerObject.drawingInfo.renderer.uniqueValueInfos : layerObject.drawingInfo.renderer.classBreakInfos ? layerObject.drawingInfo.renderer.classBreakInfos : layerObject.drawingInfo.renderer;
                        if (rendererObject.length) {
                            for (var index = 0; index < rendererObject.length; index++) {
                                this._rendererArray.push(rendererObject[index]);
                                queryResult = this._fireQueryOnExtentChange(evt.extent);

                                if (lang.trim(layerObject.definitionExpression) != "") {
                                    queryResult.where = this._layerCollection[layer].definitionExpression;
                                }
                                else if (layerObject.drawingInfo && layerObject.drawingInfo.renderer && layerObject.drawingInfo.renderer.type == "uniqueValue") {
                                    var fieldName = layerObject.drawingInfo.renderer.field1 || layerObject.drawingInfo.renderer.field2 || layerObject.drawingInfo.renderer.field3;
                                    if (fieldName != "")
                                        queryResult.where = fieldName + " = " + "'" + rendererObject[index].value + "'";
                                }
                                else if (layerObject.drawingInfo && layerObject.drawingInfo.renderer && layerObject.drawingInfo.renderer.type == "classBreaks") {
                                    queryResult.where = rendererObject[index - 1] ? layerObject.drawingInfo.renderer.field + ">" + rendererObject[index - 1].classMaxValue + " AND " + layerObject.drawingInfo.renderer.field + "<=" + rendererObject[index].classMaxValue : layerObject.drawingInfo.renderer.field + "=" + rendererObject[index].classMaxValue;
                                }
                                else {
                                    queryResult.where = "1=1";
                                }
                                this._executeQueryTask(layer, defQueryArray, queryResult);
                            }
                        } else if (layerObject && rendererObject) {
                            //  executes if length is not found
                            this._rendererArray.push(rendererObject);
                            queryResult = this._fireQueryOnExtentChange(evt.extent);
                            if (lang.trim(layerObject.definitionExpression) != "") {
                                queryResult.where = layerObject.definitionExpression;
                            }
                            else {
                                queryResult.where = "1=1";
                            }
                            this._executeQueryTask(layer, defQueryArray, queryResult);
                        }
                    }
                    if (defQueryArray.length > 0) {
                        domConstruct.empty(this.divlegendContainer);
                        domConstruct.create("span", { innerHTML: "Loading...", marginTop: "5px" }, this.divlegendContainer);
                        var queryDefList = new dojo.DeferredList(defQueryArray);
                        queryDefList.then(lang.hitch(this, function (result) {
                            domConstruct.empty(this.divlegendContainer);
                            for (var i = 0; i < result.length; i++) {
                                if (result[i][0] && result[i][1] > 0) {
                                    this._createSymbol(this._rendererArray[i].symbol.type, this._rendererArray[i].symbol.url, this._rendererArray[i].symbol.color,
                    this._rendererArray[i].symbol.width, this._rendererArray[i].symbol.height, this._rendererArray[i].symbol.imageData, this._rendererArray[i].label);
                                }
                            }
                        }));
                    } else {
                    }
                }));
            }
        },

        /*
        * fires query for the renderer present in the current extent
        */
        _fireQueryOnExtentChange: function (currentExtent) {
            var queryParams = new Query();
            queryParams.outFields = ["*"];
            queryParams.geometry = currentExtent;
            queryParams.spatialRelationship = "esriSpatialRelContains";
            queryParams.returnGeometry = false;
            return queryParams;
        },

        /*
        * performs query task for the no of features present in the current extent
        */
        _executeQueryTask: function (layer, defQueryArray, queryParams) {
            var queryTask = new QueryTask(layer);
            defQueryArray.push(queryTask.executeForCount(queryParams, function (count) {
                var queryDeferred = new dojo.Deferred();
                queryDeferred.resolve(count);
                return queryDeferred.promise;
                console.log(count);
            }, function (error) {
                console.log(error);
            }));
        },

        /*
        * initiates the creation of legend
        */
        startup: function (mapServerArray) {
            var defArray = [];
            for (var i = 0; i < mapServerArray.length; i++) {
                var params = {
                    url: mapServerArray[i],
                    content: { f: "json" },
                    handleAs: "json",
                    callbackParamName: "callback"
                }
                var layersRequest = esriRequest(params);
                defArray.push(layersRequest.then(lang.hitch(this,
                function (response) {
                    var deferred = new dojo.Deferred();
                    deferred.resolve(response);
                    return deferred.promise;
                }
                ),
                function (error) {
                    console.log("Error: ", error.message);
                }));
            }
            var deferredList = new dojo.DeferredList(defArray);
            deferredList.then(lang.hitch(this, function (result) {
                domConstruct.empty(this.divlegendContainer);
                for (var i = 0; i < result.length; i++) {
                    this._layerCollection[mapServerArray[i]] = result[i][1];
                    this._addLegendOnMap(result[i][1], mapServerArray[i], true);
                }
            }));
        },

        /*
        * adds legend on map for the layers passed
        */
        _addLegendOnMap: function (addLayersObject, layerUrl, isDynamic) {
            if (addLayersObject) {
                var layerObject = addLayersObject.layerObject ? addLayersObject.layerObject : addLayersObject;
            }
            var image;
            var divLegendLabl;
            domAttr.set(this.divlegendList, "layerID", layerObject.id);
            if (isDynamic) {
                this._createLegend(layerObject);
            }
            else {
                if (layerObject.renderer.declaredClass == "esri.renderer.UniqueValueRenderer" || layerObject.renderer.declaredClass == "esri.renderer.ClassBreaksRenderer") {
                    this._createLegend(layerObject);
                }
                else if (layerObject.renderer.declaredClass == "esri.renderer.SimpleRenderer") {
                    this._createLegend(layerObject);
                }
            }
        },

        /*
        *creates legend for the corresponding  symbol passed
        */
        _createLegend: function (layerObject) {
            if (layerObject.renderer && layerObject.renderer.symbol) {
                this._createSymbol(layerObject.renderer.symbol.type, layerObject.renderer.symbol.url, layerObject.renderer.symbol.color,
                    layerObject.renderer.symbol.width, layerObject.renderer.symbol.height, layerObject.renderer.symbol.imageData, layerObject.renderer.label);
            }
            else if (layerObject.renderer && layerObject.renderer.defaultSymbol) {
                this._createSymbol(layerObject.renderer.defaultSymbol.type, layerObject.renderer.defaultSymbol.url, layerObject.renderer.defaultSymbol.color,
                    layerObject.renderer.defaultSymbol.width, layerObject.renderer.defaultSymbol.height, layerObject.renderer.defaultSymbol.imageData, layerObject.renderer.label);
            }
            else if (layerObject) {
                var rendererObject = layerObject.renderer && layerObject.renderer.infos ? layerObject.renderer.infos : layerObject.drawingInfo.renderer.uniqueValueInfos ? layerObject.drawingInfo.renderer.uniqueValueInfos : layerObject.drawingInfo.renderer.classBreakInfos ? layerObject.drawingInfo.renderer.classBreakInfos : layerObject.drawingInfo.renderer;
                if (rendererObject.symbol) {
                    this._createSymbol(rendererObject.symbol.type, rendererObject.symbol.url, rendererObject.symbol.color,
                    rendererObject.symbol.width, rendererObject.symbol.height, rendererObject.symbol.imageData, rendererObject.label);
                } else {
                    for (var i = 0; i < rendererObject.length; i++) {
                        this._createSymbol(rendererObject[i].symbol.type, rendererObject[i].symbol.url, rendererObject[i].symbol.color,
                    rendererObject[i].symbol.width, rendererObject[i].symbol.height, rendererObject[i].symbol.imageData, rendererObject[i].label);
                    }
                }
            }
            else {
                this.divLegendlist = domConstruct.create("div", { "class": "divLegendlist" }, this.divlegendContainer);
                divLegendImage = dojo.create("div", { "class": "legend" }, null);
                if (layerObject.renderer.symbol.url) {
                    image = this._createImage(layerObject.renderer.symbol.url, "", false, layerObject.renderer.symbol.width, layerObject.renderer.symbol.height);
                }
                domConstruct.place(image, divLegendImage);
                this.divLegendlist.appendChild(divLegendImage);
                divLegendLabl = dojo.create("div", { "class": "legendlbl" }, null);

                this.divLegendlist.appendChild(divLegendLabl);
            }
        },

        /*
        *creates the symbol with or without label for displaying the legend
        */
        _createSymbol: function (symbolType, url, color, width, height, imageData, label) {
            this.divLegendlist = domConstruct.create("div", { "class": "divLegendlist" }, this.divlegendContainer);
            var divLegendImage = domConstruct.create("div", { "class": "legend" }, null);
            if (symbolType == "picturemarkersymbol" && url) {
                image = this._createImage(url, "", false, width, height);
                domConstruct.place(image, divLegendImage);
            }
            else if (symbolType == "esriPMS" && url) {
                image = this._createImage("data:image/gif;base64," + imageData, "", false, width, height);
                domConstruct.place(image, divLegendImage);
            }
            else {
                var divSymbol = document.createElement("div");
                divSymbol.style.backgroundColor = Color.fromArray(color).toHex() ? Color.fromArray(color).toHex() : Color.fromArray([255, 0, 255, 5]).toHex();
                divSymbol.style.height = width ? width < 5 ? "5px" : width + "px" : "15px";
                divSymbol.style.width = height ? height < 5 ? "5px" : height + "px" : "15px";
                if (height < 5 || width < 5) {
                    divSymbol.style.marginTop = "16px";
                } else {
                    divSymbol.style.marginTop = "8px";
                }
                domConstruct.place(divSymbol, divLegendImage);
            }
            this.divLegendlist.appendChild(divLegendImage);
            divLegendLabl = dojo.create("div", { "class": "legendlbl" }, null);
            domAttr.set(divLegendLabl, "innerHTML", label);
            this.divLegendlist.appendChild(divLegendLabl);
        },

        /*
        * displays the picture marker symbol
        */
        _createImage: function (imageSrc, title, isCursorPointer, imageWidth, imageHeight) {
            var imgLocate = domConstruct.create("img");
            var imageHeightWidth = { width: imageWidth + 'px', height: imageHeight + 'px' };
            domAttr.set(imgLocate, "style", imageHeightWidth);
            if (isCursorPointer) {
                domStyle.set(imgLocate, "cursor", "pointer");
            }
            domAttr.set(imgLocate, "src", imageSrc);
            domAttr.set(imgLocate, "title", title);
            return imgLocate;
        }
    });
});