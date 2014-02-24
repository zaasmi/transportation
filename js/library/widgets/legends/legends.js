/*global define,dojo,console */
/*jslint sloppy:true,nomen:true,plusplus:true */
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
    "dojo/text!./templates/legendsTemplate.html",
    "dojo/topic",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/i18n!application/nls/localizedStrings",
    "esri/request",
    "esri/tasks/query",
    "esri/tasks/QueryTask"
], function (declare, domConstruct, domStyle, lang, array, query, domAttr, on, dom, domClass, template, topic, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, appNls, esriRequest, Query, QueryTask) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        appNls: appNls,
        divLegendList: null,
        layerObject: null,
        logoContainer: null,
        _layerCollection: {},
        _rendererArray: [],
        newLeft: 0,
        /**
        * create legends widget
        * @class
        * @name widgets/legends/legends
        */
        postCreate: function () {
            this._createLegendContainerUI();
            this.logoContainer = (query(".map .logo-sm") && query(".map .logo-sm")[0])
                || (query(".map .logo-med") && query(".map .logo-med")[0]);
            topic.subscribe("setMaxLegendLength", lang.hitch(this, function () {
                this._setMaxLegendLengthResult();
            }));

            topic.subscribe("setMinLegendLength", lang.hitch(this, function () {
                this._setMinLegendLengthResult();
            }));

            if (this.isExtentBasedLegend) {
                this.map.on("extent-change", lang.hitch(this, function (evt) {
                    var defQueryArray = [], layer, layerObject, rendererObject, index, queryResult, queryDefList, i;

                    this._resetLegendContainer();
                    this._rendererArray.length = 0;
                    for (layer in this._layerCollection) {
                        if (this._layerCollection.hasOwnProperty(layer)) {
                            layerObject = this._layerCollection[layer];
                            rendererObject = this._layerCollection[layer].legend;
                            if (rendererObject.length) {
                                for (index = 0; index < rendererObject.length; index++) {
                                    rendererObject[index].layerUrl = layer;
                                    this._rendererArray.push(rendererObject[index]);
                                    queryResult = this._fireQueryOnExtentChange(evt.extent);

                                    if (layerObject.rendererType === "uniqueValue") {
                                        if (rendererObject[index].values) {
                                            queryResult.where = layerObject.fieldName + " = " + "'" + rendererObject[index].values[0] + "'";
                                        } else {
                                            queryResult.where = "1=1";
                                        }
                                    } else if (layerObject.rendererType === "classBreaks") {
                                        queryResult.where = rendererObject[index - 1] ? layerObject.fieldName + ">" + rendererObject[index - 1].values[0] + " AND " + layerObject.fieldName + "<=" + rendererObject[index].values[0] : layerObject.fieldName + "=" + rendererObject[index].values[0];
                                    } else {
                                        queryResult.where = "1=1";
                                    }
                                    this._executeQueryTask(layer, defQueryArray, queryResult);
                                }
                            }
                        }
                    }
                    if (defQueryArray.length > 0) {
                        domConstruct.empty(this.divlegendContainer);
                        domConstruct.create("span", { innerHTML: "Loading...", marginTop: "5px" }, this.divlegendContainer);
                        queryDefList = new dojo.DeferredList(defQueryArray);
                        queryDefList.then(lang.hitch(this, function (result) {
                            domConstruct.empty(this.divlegendContainer);
                            for (i = 0; i < result.length; i++) {
                                if (result[i][0] && result[i][1] > 0) {
                                    this._addLegendSymbol(this._rendererArray[i], this._layerCollection[this._rendererArray[i].layerUrl].layerName);
                                }
                            }
                        }));
                    }
                }));
            }
        },

        _setMaxLegendLengthResult: function () {
            domClass.add(this.logoContainer, "mapLogoUrl");
            if (this.legendrightbox) {
                domClass.replace(this.legendrightbox, "legendrightboxTest", query(".legendrightbox")[0]);
            } else if (query(".legendrightbox")[0]) {
                domClass.replace(this.legendrightbox, query(".legendrightbox")[0], "legendrightboxTest");
            }
            if (this.divRightArrow) {
                domClass.replace(this.divRightArrow, "divRightArrowRightMargin", query(".divRightArrow")[0]);
            } else if (query(".divRightArrow")[0]) {
                domClass.replace(this.divRightArrow, query(".divRightArrow")[0], "divRightArrowRightMargin");
            }
        },

        _setMinLegendLengthResult: function () {
            domClass.remove(this.logoContainer, "mapLogoUrl");
            if (this.legendrightbox) {
                domClass.replace(this.legendrightbox, query(".legendrightbox")[0], "legendrightboxTest");
            } else if (query(".legendrightbox")[0]) {
                domClass.replace(this.legendrightbox, query(".legendrightbox")[0], "legendrightboxTest");
            }
            if (this.divRightArrow) {
                domClass.replace(this.divRightArrow, query(".divRightArrow")[0], "divRightArrowRightMargin");
            } else if (query(".divRightArrow")[0]) {
                domClass.replace(this.divRightArrow, query(".divRightArrow")[0], "divRightArrowRightMargin");
            }
        },

        _resetLegendContainer: function () {
            this.newLeft = 0;
            domStyle.set(query(".divlegendContent")[0], "left", (this.newLeft) + "px");
            this._resetSlideControls();
        },

        _createLegendContainerUI: function () {
            var divlegendContainer, divLeftArrow, esriCTLeftArrow, esriCTRightArrow;

            this.esriCTLegendContainer = domConstruct.create("div", {}, dom.byId("esriCTParentDivContainer"));
            this.esriCTLegendContainer.appendChild(this.esriCTdivLegendbox);
            divlegendContainer = domConstruct.create("div", { "class": "divlegendContainer" }, this.divlegendList);
            this.divlegendContainer = domConstruct.create("div", { "class": "divlegendContent" }, divlegendContainer);
            divLeftArrow = domConstruct.create("div", { "class": "divLeftArrow" }, this.legendbox);
            esriCTLeftArrow = domConstruct.create("img", { "class": "esriCTArrow" }, divLeftArrow);
            domAttr.set(esriCTLeftArrow, "src", "js/library/themes/images/left.png");
            domStyle.set(divLeftArrow, "display", "none");
            on(divLeftArrow, "click", lang.hitch(this, function () {
                this._slideLeft();
            }));
            this.divRightArrow = domConstruct.create("div", { "class": "divRightArrow" }, this.legendbox);
            esriCTRightArrow = domConstruct.create("img", { "class": "esriCTArrow" }, this.divRightArrow);
            domStyle.set(this.divRightArrow, "display", "block");
            on(esriCTRightArrow, "click", lang.hitch(this, function () {
                this._slideRight();
            }));
            domAttr.set(esriCTRightArrow, "src", "js/library/themes/images/right.png");

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
            if (this.newLeft === 0) {
                domStyle.set(query(".divLeftArrow")[0], "display", "none");
                domStyle.set(query(".divLeftArrow")[0], "cursor", "default");
            } else {
                domStyle.set(query(".divLeftArrow")[0], "display", "block");
                domStyle.set(query(".divLeftArrow")[0], "cursor", "pointer");
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
            }, function (error) {
                console.log(error);
            }));
        },

        _resolveUsingResponse: function (response) {
            var deferred = new dojo.Deferred();
            deferred.resolve(response);
            return deferred.promise;
        },

        _logError: function (error) {
            console.log("Error: ", error.message);
        },

        /*
        * initiates the creation of legend
        */
        startup: function (layerArray) {
            var mapServerArray, index, mapServerURL, defArray, i, params, layersRequest, deferredList;

            mapServerArray = [];
            for (index = 0; index < layerArray.length; index++) {
                mapServerURL = layerArray[index].split("/");
                mapServerURL.pop();
                mapServerURL = mapServerURL.join("/");
                mapServerArray.push(mapServerURL);
            }

            mapServerArray = this._removeDuplicate(mapServerArray);
            defArray = [];

            for (i = 0; i < mapServerArray.length; i++) {
                params = {
                    url: mapServerArray[i] + "/legend",
                    content: { f: "json" },
                    handleAs: "json",
                    callbackParamName: "callback"
                };
                layersRequest = esriRequest(params);
                defArray.push(layersRequest.then(this._resolveUsingResponse, this._logError));
            }
            deferredList = new dojo.DeferredList(defArray);
            deferredList.then(lang.hitch(this, function (result) {
                domConstruct.empty(this.divlegendContainer);
                for (i = 0; i < result.length; i++) {
                    this._createLegendList(result[i][1], mapServerArray[i]);
                }
            }));
        },

        _addFieldValue: function () {
            var layer, params, layersRequest, deferredList, layerObject, i,
                defArray = [],
                layerTempArray = [];

            for (layer in this._layerCollection) {
                if (this._layerCollection.hasOwnProperty(layer)) {
                    if (this._layerCollection[layer].legend && this._layerCollection[layer].legend.length > 1) {
                        layerTempArray.push(layer);
                        params = {
                            url: layer,
                            content: { f: "json" },
                            handleAs: "json",
                            callbackParamName: "callback"
                        };
                        layersRequest = esriRequest(params);
                        defArray.push(layersRequest.then(this._resolveUsingResponse, this._logError));
                    }
                }
            }
            deferredList = new dojo.DeferredList(defArray);
            deferredList.then(lang.hitch(this, function (result) {
                for (i = 0; i < result.length; i++) {
                    if (result[i][0]) {
                        layerObject = result[i][1];
                        if (layerObject.drawingInfo && layerObject.drawingInfo.renderer && layerObject.drawingInfo.renderer.type === "uniqueValue") {
                            this._layerCollection[layerTempArray[i]].rendererType = "uniqueValue";
                            this._layerCollection[layerTempArray[i]].fieldName = layerObject.drawingInfo.renderer.field1 || layerObject.drawingInfo.renderer.field2 || layerObject.drawingInfo.renderer.field3;

                        } else if (layerObject.drawingInfo && layerObject.drawingInfo.renderer && layerObject.drawingInfo.renderer.type === "classBreaks") {
                            this._layerCollection[layerTempArray[i]].rendererType = "classBreaks";
                            this._layerCollection[layerTempArray[i]].fieldName = layerObject.drawingInfo.renderer.field;
                        }
                    }
                }
            }));
        },

        _removeDuplicate: function (mapServerArray) {
            var filterArray = [];

            array.filter(mapServerArray, function (item) {
                if (array.indexOf(filterArray, item) === -1) {
                    filterArray.push(item);
                }
            });
            return filterArray;
        },

        _createLegendList: function (layerList, mapServerUrl) {
            var i, j;

            for (i = 0; i < layerList.layers.length; i++) {
                this._layerCollection[mapServerUrl + '/' + layerList.layers[i].layerId] = layerList.layers[i];

                for (j = 0; j < layerList.layers[i].legend.length; j++) {
                    this._addLegendSymbol(layerList.layers[i].legend[j], layerList.layers[i].layerName);
                }
            }

            this._addFieldValue();

        },

        _addLegendSymbol: function (legend, layerName) {
            var divLegendImage, image, divLegendLabel;

            if (legend) {
                this.divLegendlist = domConstruct.create("div", { "class": "divLegendlist" }, this.divlegendContainer);
                divLegendImage = domConstruct.create("div", { "class": "legend" }, null);
                image = this._createImage("data:image/gif;base64," + legend.imageData, "", false, legend.width, legend.height);
                domConstruct.place(image, divLegendImage);
                this.divLegendlist.appendChild(divLegendImage);

                if (legend.label) {
                    divLegendLabel = dojo.create("div", { "class": "legendlbl", "innerHTML": legend.label }, null);

                } else {
                    divLegendLabel = dojo.create("div", { "class": "legendlbl", "innerHTML": layerName }, null);
                }
                this.divLegendlist.appendChild(divLegendLabel);
            }
        },

        /*
        * displays the picture marker symbol
        */
        _createImage: function (imageSrc, title, isCursorPointer, imageWidth, imageHeight) {
            var imgLocate, imageHeightWidth;

            imgLocate = domConstruct.create("img");
            imageHeightWidth = { width: imageWidth + 'px', height: imageHeight + 'px' };
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