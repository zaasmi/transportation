/*global define,dojo,console */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
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
    "dojo/_base/array",
    "dojo/query",
    "dojo/dom-attr",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/text!./templates/legendsTemplate.html",
    "dojo/topic",
    "dojo/Deferred",
    "dojo/DeferredList",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/_base/Color",
    "esri/request",
    "esri/tasks/query",
    "esri/tasks/QueryTask"
], function (declare, domConstruct, domStyle, lang, array, query, domAttr, on, dom, domClass, template, topic, Deferred, DeferredList, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, Color, esriRequest, Query, QueryTask) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        divLegendlist: null,
        layerObject: null,
        logoContainer: null,
        _layerCollection: {},
        rendererArray: [],
        webmapUpdatedRenderer: null,
        hostedLayersJSON: null,
        newLeft: 0,
        extenChangeLegend: true,
        legendListWidth: [],
        indexesForLayer: [],

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

            if (this.extenChangeLegend) {
                this.map.on("extent-change", lang.hitch(this, function () {
                    this._legendOnExtentChange();
                }));
            }
        },

        /*
        * Update legend on extend base
        * @memberOf widgets/legends/legends
        */
        _legendOnExtentChange: function () {
            var geometry, defQueryArray = [], queryResult, resultListArray = [], queryDefList, i;
            geometry = this.map.extent;
            this.rendererArray = [];
            this.legendListWidth = [];
            this._resetLegendContainer();
            domConstruct.empty(this.divlegendContainer);
            this._addlegendListWidth(this.legendListWidth);
            domStyle.set(this.divRightArrow, "display", "none");
            domStyle.set(query(".esriCTLeftArrow")[0], "display", "none");
            domConstruct.create("span", { innerHTML: sharedNls.tooltips.loadingText, "class": "divlegendLoadingContainer" }, this.divlegendContainer);
            queryResult = this._fireQueryOnExtentChange(geometry);
            this._queryLegendOnMapExtent(this._layerCollection, defQueryArray, queryResult, false);
            this._queryLegendOnMapExtent(this.hostedLayersJSON, defQueryArray, queryResult, true);
            this._queryLegendOnMapExtent(this.webmapUpdatedRenderer, defQueryArray, queryResult, true);
            if (defQueryArray.length > 0) {
                queryDefList = new DeferredList(defQueryArray);
                queryDefList.then(lang.hitch(this, function (result) {
                    domConstruct.empty(this.divlegendContainer);
                    this.legendListWidth = [];
                    for (i = 0; i < result.length; i++) {
                        if (result[i][0] && result[i][1].count > 0) {
                            resultListArray.push(result[i][1]);
                            if (result[i][1].hasDrawingInfo) {
                                if (this.rendererArray[i].drawingInfo) {
                                    this._createLegendSymbol(this.rendererArray[i].drawingInfo, this.rendererArray[i].name);
                                } else if (this.rendererArray[i].layerDefinition) {
                                    this._createLegendSymbol(this.rendererArray[i].layerDefinition.drawingInfo, this.rendererArray[i].title);
                                } else {
                                    this._createLegendSymbol(this.rendererArray[i], this.rendererArray[i].renderer.label);

                                }
                            } else {
                                this._addLegendSymbol(this.rendererArray[i], this._layerCollection[this.rendererArray[i].layerUrl].layerName);
                            }
                        }
                    }
                    this._addlegendListWidth(this.legendListWidth);
                    if (resultListArray.length === 0) {
                        domConstruct.create("span", { "innerHTML": sharedNls.errorMessages.noLegend, "class": "divNoLegendContainer" }, this.divlegendContainer);
                    }
                }));
            } else {
                this.legendListWidth = [];
                domConstruct.empty(this.divlegendContainer);
                this._addlegendListWidth(this.legendListWidth);
                domConstruct.create("span", { "innerHTML": sharedNls.errorMessages.noLegend, "class": "divNoLegendContainer" }, this.divlegendContainer);
            }
        },

        /* Query for legend on map extent
        *  @memberOf widgets/legends/legends
        */
        _queryLegendOnMapExtent: function (layerArray, defQueryArray, queryResult, hasDrawingInfo) {
            var layer, layerUrl, rendererObject, layerObject, index, i, fieldValue, currentTime = new Date();
            for (layer in layerArray) {
                if (layerArray.hasOwnProperty(layer)) {
                    layerUrl = layer;
                    if (layerArray[layer].featureLayerUrl) {
                        layerUrl = layerArray[layer].featureLayerUrl;
                    }
                    if (this._checkLayerVisibility(layerUrl)) {
                        layerObject = layerArray[layer];
                        if (!hasDrawingInfo) {
                            rendererObject = layerArray[layer].legend;
                            if (rendererObject && rendererObject.length) {
                                for (index = 0; index < rendererObject.length; index++) {
                                    rendererObject[index].layerUrl = layer;
                                    this.rendererArray.push(rendererObject[index]);

                                    if (layerObject.rendererType === "uniqueValue") {
                                        if (rendererObject[index].values) {
                                            if (layerObject.fieldType === "esriFieldTypeString") {
                                                fieldValue = "'" + rendererObject[index].values[0] + "'";
                                            } else {
                                                fieldValue = rendererObject[index].values[0];
                                            }
                                            queryResult.where = layerObject.fieldName + " = " + fieldValue + " AND " + currentTime.getTime() + "=" + currentTime.getTime();
                                        } else {
                                            queryResult.where = currentTime.getTime() + "=" + currentTime.getTime();
                                        }
                                    } else if (layerObject.rendererType === "classBreaks") {
                                        queryResult.where = rendererObject[index - 1] ? layerObject.fieldName + ">" + rendererObject[index - 1].values[0] + " AND " + layerObject.fieldName + "<=" + rendererObject[index].values[0] : layerObject.fieldName + "=" + rendererObject[index].values[0] + " AND " + currentTime.getTime().toString() + "=" + currentTime.getTime().toString();
                                    } else {
                                        queryResult.where = currentTime.getTime() + "=" + currentTime.getTime();
                                    }
                                    this._executeQueryTask(layer, defQueryArray, queryResult, hasDrawingInfo);
                                }
                            }
                        } else {
                            if (layerObject.drawingInfo) {
                                rendererObject = layerObject.drawingInfo.renderer;
                            } else {
                                rendererObject = layerObject.layerDefinition.drawingInfo.renderer;
                            }

                            if (rendererObject.type === "uniqueValue") {
                                for (i = 0; i < rendererObject.uniqueValueInfos.length; i++) {
                                    this.rendererArray.push({ "renderer": rendererObject.uniqueValueInfos[i] });
                                    if (layerObject.fieldType === "esriFieldTypeString") {
                                        fieldValue = "'" + rendererObject.uniqueValueInfos[i].value + "'";
                                    } else {
                                        fieldValue = rendererObject.uniqueValueInfos[i].value;
                                    }
                                    if (rendererObject.uniqueValueInfos[i].value) {
                                        queryResult.where = layerObject.fieldName + " = " + fieldValue + " AND " + currentTime.getTime() + "=" + currentTime.getTime();
                                    } else {
                                        queryResult.where = currentTime.getTime() + "=" + currentTime.getTime();
                                    }
                                    this._executeQueryTask(layer, defQueryArray, queryResult, hasDrawingInfo);
                                }
                            } else if (rendererObject.type === "classBreaks") {
                                for (i = 0; i < rendererObject.classBreakInfos.length; i++) {
                                    this.rendererArray.push({ "renderer": rendererObject.classBreakInfos[i] });
                                    queryResult.where = layerObject.fieldName + ">=" + rendererObject.classBreakInfos[i].minValue + " AND " + layerObject.fieldName + "<=" + rendererObject.classBreakInfos[i].maxValue + " AND " + currentTime.getTime().toString() + "=" + currentTime.getTime().toString();
                                    this._executeQueryTask(layer, defQueryArray, queryResult, hasDrawingInfo);
                                }
                            } else {
                                this.rendererArray.push(layerObject);
                                queryResult.where = currentTime.getTime() + "=" + currentTime.getTime();
                                this._executeQueryTask(layer, defQueryArray, queryResult, hasDrawingInfo);
                            }
                        }
                    }
                }
            }
        },

        /*check layer visibility on map
        * @memberOf widgets/legends/legends
        */
        _checkLayerVisibility: function (layerUrl) {
            var layer, layerUrlIndex = layerUrl.split('/'), returnVal = false;
            layerUrlIndex = layerUrlIndex[layerUrlIndex.length - 1];
            for (layer in this.map._layers) {
                if (this.map._layers.hasOwnProperty(layer)) {
                    if (this.map._layers[layer].url === layerUrl) {
                        if (this.map._layers[layer].visibleAtMapScale) {
                            returnVal = true;
                            break;
                        }
                    } else if (this.map._layers[layer].visibleLayers && (this.map._layers[layer].url + "/" + layerUrlIndex === layerUrl)) {
                        if (this.map._layers[layer].visibleAtMapScale) {
                            returnVal = true;
                            break;
                        }
                    }
                }
            }
            return returnVal;
        },

        /*
        * Set Maximum  length of legend
        * @memberOf widgets/legends/legends
        */
        _setMaxLegendLengthResult: function () {
            if (this.logoContainer) {
                domClass.add(this.logoContainer, "mapLogoUrl");
            }
            if (this.legendrightbox) {
                domClass.add(this.legendrightbox, "legendrightboxTest");
            }
            if (this.divRightArrow) {
                domClass.add(this.divRightArrow, "divRightArrowRightMargin");
            }
            this._resetSlideControls();
        },

        /*
        * Set minimum length of legend
        * @memberOf widgets/legends/legends
        */
        _setMinLegendLengthResult: function () {
            if (this.logoContainer) {
                domClass.remove(this.logoContainer, "mapLogoUrl");
            }
            if (this.legendrightbox) {
                domClass.remove(this.legendrightbox, "legendrightboxTest");
            }
            if (this.divRightArrow) {
                domClass.remove(this.divRightArrow, "divRightArrowRightMargin");
            }
            this._resetSlideControls();
        },

        /*
        * Reset Legend panal
        * @memberOf widgets/legends/legends
        */
        _resetLegendContainer: function () {
            this.newLeft = 0;
            domStyle.set(query(".divlegendContent")[0], "left", (this.newLeft) + "px");
            this._resetSlideControls();
        },

        /*
        * Show legend Container
        * @memberOf widgets/legends/legends
        */
        _createLegendContainerUI: function () {
            var divlegendContainer, divLeftArrow, legendOuterContainer;
            legendOuterContainer = query('.esriCTdivLegendbox', dom.byId("esriCTParentDivContainer"));

            if (query('.legendbox')[0]) {
                domConstruct.empty(query('.legendbox')[0]);
            }
            if (legendOuterContainer[0]) {
                domConstruct.destroy(legendOuterContainer[0].parentElement);
            }
            dom.byId("esriCTParentDivContainer").appendChild(this.esriCTdivLegendbox);
            divlegendContainer = domConstruct.create("div", { "class": "divlegendContainer" }, this.divlegendList);
            this.divlegendContainer = domConstruct.create("div", { "class": "divlegendContent" }, divlegendContainer);
            divLeftArrow = domConstruct.create("div", { "class": "esriCTLeftArrow" }, this.legendbox);
            domStyle.set(divLeftArrow, "display", "none");
            on(divLeftArrow, "click", lang.hitch(this, function () {
                this._slideLeft();
            }));
            this.divRightArrow = domConstruct.create("div", { "class": "esriCTRightArrow" }, this.legendbox);
            domStyle.set(this.divRightArrow, "display", "none");
            on(this.divRightArrow, "click", lang.hitch(this, function () {
                this._slideRight();
            }));
        },

        /**
        * slide legend data to right
        * @memberOf widgets/legends/legends
        */
        _slideRight: function () {
            var difference = query(".divlegendContainer")[0].offsetWidth - query(".divlegendContent")[0].offsetWidth;
            if (this.newLeft > difference) {
                domStyle.set(query(".esriCTLeftArrow")[0], "display", "block");
                domStyle.set(query(".esriCTLeftArrow")[0], "cursor", "pointer");
                this.newLeft = this.newLeft - (100 + 9);
                domStyle.set(query(".divlegendContent")[0], "left", (this.newLeft) + "px");
                this._resetSlideControls();
            }
        },

        /**
        * slide legend data to left
        * @memberOf widgets/legends/legends
        */
        _slideLeft: function () {
            if (this.newLeft < 0) {
                if (this.newLeft > -(100 + 9)) {
                    this.newLeft = 0;
                } else {
                    this.newLeft = this.newLeft + (100 + 9);
                }
                if (this.newLeft >= -10) {
                    this.newLeft = 0;
                }
                domStyle.set(this.divlegendContainer, "left", (this.newLeft) + "px");
                this._resetSlideControls();
            }
        },

        /**
        * reset slider controls
        * @memberOf widgets/legends/legends
        */
        _resetSlideControls: function () {

            if (this.newLeft > query(".divlegendContainer")[0].offsetWidth - query(".divlegendContent")[0].offsetWidth) {
                domStyle.set(query(".esriCTRightArrow")[0], "display", "block");
                domStyle.set(query(".esriCTRightArrow")[0], "cursor", "pointer");
            } else {
                domStyle.set(query(".esriCTRightArrow")[0], "display", "none");
                domStyle.set(query(".esriCTRightArrow")[0], "cursor", "default");
            }
            if (this.newLeft === 0) {
                domStyle.set(query(".esriCTLeftArrow")[0], "display", "none");
                domStyle.set(query(".esriCTLeftArrow")[0], "cursor", "default");
            } else {
                domStyle.set(query(".esriCTLeftArrow")[0], "display", "block");
                domStyle.set(query(".esriCTLeftArrow")[0], "cursor", "pointer");
            }
        },

        /**
        * fires query for the renderer present in the current extent
        * @memberOf widgets/legends/legends
        */
        _fireQueryOnExtentChange: function (currentExtent) {
            var queryParams = new Query();
            queryParams.outFields = ["*"];
            queryParams.geometry = currentExtent;
            queryParams.spatialRelationship = "esriSpatialRelIntersects";
            queryParams.returnGeometry = false;
            return queryParams;
        },

        /**
        * performs query task for the no of features present in the current extent
        * @memberOf widgets/legends/legends
        */
        _executeQueryTask: function (layer, defQueryArray, queryParams, hasDrawingInfo) {
            var defResult = [], queryTask, queryDeferred = new Deferred();
            queryTask = new QueryTask(layer);
            defResult.hasDrawingInfo = hasDrawingInfo;
            defResult.count = 0;
            queryTask.executeForCount(queryParams, lang.hitch(this, function (count) {
                defResult.count = count;
                queryDeferred.resolve(defResult);
            }), function (error) {
                console.log(error);
                queryDeferred.reject(defResult);
            });
            defQueryArray.push(queryDeferred);
        },

        /*
        * initiates the creation of legend
        * @memberOf widgets/legends/legends
        */
        startup: function (layerArray, updatedRendererArray) {
            var mapServerURL, index, hostedDefArray = [], defArray = [], params, layersRequest, deferredList, hostedDeferredList, hostedLayers, i, featureLayerUrl, layerIndex;
            this.mapServerArray = [];
            this.featureServerArray = [];
            this.hostedLayersJSON = null;
            this.legendListWidth = [];
            this.webmapUpdatedRenderer = updatedRendererArray;
            hostedLayers = this._filterHostedFeatureServices(layerArray);
            for (i = 0; i < hostedLayers.length; i++) {
                params = {
                    url: hostedLayers[i],
                    content: { f: "json" },
                    handleAs: "json",
                    callbackParamName: "callback"
                };
                layersRequest = esriRequest(params);
                this._getLayerDetail(layersRequest, hostedDefArray);
            }
            if (hostedDefArray.length > 0) {
                hostedDeferredList = new DeferredList(hostedDefArray);
                hostedDeferredList.then(lang.hitch(this, function (result) {
                    if (result.length === 0) {
                        this.hostedLayersJSON = null;
                    } else {
                        this.hostedLayersJSON = {};
                        if (this.webmapUpdatedRenderer === null && this._layerCollection === null) {
                            domConstruct.empty(this.divlegendContainer);
                        }
                    }
                    for (i = 0; i < result.length; i++) {
                        this.hostedLayersJSON[hostedLayers[i]] = result[i][1];
                    }
                    this._displayHostedLayerRenderer();
                    this._addlegendListWidth(this.legendListWidth);
                }));
            }
            for (index = 0; index < layerArray.length; index++) {
                if (layerArray[index].match("/FeatureServer")) {
                    featureLayerUrl = layerArray[index];
                    layerArray[index] = layerArray[index].replace("/FeatureServer", "/MapServer");
                } else {
                    featureLayerUrl = null;
                }
                mapServerURL = layerArray[index].split("/");
                layerIndex = mapServerURL[mapServerURL.length - 1];
                mapServerURL.pop();
                mapServerURL = mapServerURL.join("/");
                if (!this.indexesForLayer[mapServerURL]) {
                    this.indexesForLayer[mapServerURL] = [];
                }
                this.indexesForLayer[mapServerURL].push(layerIndex);
                this.mapServerArray.push({ "url": mapServerURL, "featureLayerUrl": featureLayerUrl });
            }
            this.mapServerArray = this._removeDuplicate(this.mapServerArray);
            for (index = 0; index < this.mapServerArray.length; index++) {
                params = {
                    url: this.mapServerArray[index].url + "/legend",
                    content: { f: "json" },
                    handleAs: "json",
                    callbackParamName: "callback"
                };
                layersRequest = esriRequest(params);
                this._getLayerDetail(layersRequest, defArray);
            }
            deferredList = new DeferredList(defArray);
            deferredList.then(lang.hitch(this, function (result) {
                this._layerCollection = {};
                var LegendCreated = [];
                for (index = 0; index < result.length; index++) {
                    if (result[index][1]) {
                        LegendCreated.push(this._createLegendList(result[index][1], this.mapServerArray[index]));
                    }
                }
                if (!LegendCreated.length) {
                    this._layerCollection = null;
                } else {
                    this._addFieldValue(this._layerCollection);

                }
            }));
            this._displayWebmapRenderer();
            this._addlegendListWidth(this.legendListWidth);
        },

        /*
        * display webmap generated renderers
        * @memberOf widgets/legends/legends
        */
        _displayWebmapRenderer: function () {
            var layer;
            for (layer in this.webmapUpdatedRenderer) {
                if (this.webmapUpdatedRenderer.hasOwnProperty(layer)) {
                    this._setFieldValue(this.webmapUpdatedRenderer[layer].layerDefinition.drawingInfo, this.webmapUpdatedRenderer[layer]);
                    this._appendFieldType(this.webmapUpdatedRenderer[layer], this.webmapUpdatedRenderer[layer].layerObject);
                }
            }
            this._legendOnExtentChange();
        },

        /*
        * display hosted layer renderers
        * @memberOf widgets/legends/legends
        */
        _displayHostedLayerRenderer: function () {
            var layer;
            for (layer in this.hostedLayersJSON) {
                if (this.hostedLayersJSON.hasOwnProperty(layer)) {
                    this._setFieldValue(this.hostedLayersJSON[layer].drawingInfo, this.hostedLayersJSON[layer]);
                    this._appendFieldType(this.hostedLayersJSON[layer], false);
                }
            }
            this._legendOnExtentChange();
        },

        /*
        * create Legend symbols
        * @memberOf widgets/legends/legends
        */
        _createLegendSymbol: function (layerData, layerTitle) {
            var renderer, divLegendImage, divLegendLabel, image, rendererObject, i, legendWidth;
            if (layerData) {
                renderer = layerData.renderer;
                if (renderer.label) {
                    layerTitle = renderer.label;
                }
                if (renderer && renderer.symbol) {
                    this._createSymbol(renderer.symbol.type, renderer.symbol.url, renderer.symbol.color,
                        renderer.symbol.width, renderer.symbol.height, renderer.symbol.imageData, layerTitle);
                } else if (renderer) {
                    if (renderer.infos) {
                        rendererObject = renderer.info;
                    } else if (renderer.uniqueValueInfos) {
                        rendererObject = renderer.uniqueValueInfos;
                    } else if (renderer.classBreakInfos) {
                        rendererObject = renderer.classBreakInfos;
                    } else {
                        rendererObject = renderer;
                    }
                    if (rendererObject.label) {
                        layerTitle = rendererObject.label;
                    }
                    if (rendererObject.symbol) {
                        this._createSymbol(rendererObject.symbol.type, rendererObject.symbol.url, rendererObject.symbol.color,
                            rendererObject.symbol.width, rendererObject.symbol.height, rendererObject.symbol.imageData, layerTitle);
                    } else {
                        for (i = 0; i < rendererObject.length; i++) {
                            if (!rendererObject[i].label) {
                                rendererObject[i].label = layerTitle;
                            }
                            this._createSymbol(rendererObject[i].symbol.type, rendererObject[i].symbol.url, rendererObject[i].symbol.color,
                                rendererObject[i].symbol.width, rendererObject[i].symbol.height, rendererObject[i].symbol.imageData, rendererObject[i].label);
                        }
                    }
                } else if (renderer && renderer.defaultSymbol) {
                    this._createSymbol(renderer.defaultSymbol.type, renderer.defaultSymbol.url, renderer.defaultSymbol.color,
                        renderer.defaultSymbol.width, renderer.defaultSymbol.height, renderer.defaultSymbol.imageData, layerTitle);
                } else {
                    this.divLegendlist = domConstruct.create("div", { "class": "divLegendlist" }, this.divlegendContainer);
                    divLegendImage = dojo.create("div", { "class": "legend" }, null);
                    if (renderer.symbol.url) {
                        image = this._createImage(renderer.symbol.url, "", false, renderer.symbol.width, renderer.symbol.height);
                    }
                    domConstruct.place(image, divLegendImage);
                    this.divLegendlist.appendChild(divLegendImage);
                    divLegendLabel = dojo.create("div", { "class": "legendlbl" }, null);
                    this.divLegendlist.appendChild(divLegendLabel);
                    legendWidth = divLegendLabel.offsetWidth + renderer.symbol.width + 30;
                    this.legendListWidth.push(legendWidth);
                }
            }
        },

        /*
        *creates the symbol with or without label for displaying the legend
        * @memberOf widgets/legends/legends
        */
        _createSymbol: function (symbolType, url, color, width, height, imageData, label) {
            var bgColor, divLegendLabel, divLegendImage, divSymbol, image, legendWidth;
            this.divLegendlist = domConstruct.create("div", { "class": "divLegendlist" }, this.divlegendContainer);
            divLegendImage = domConstruct.create("div", { "class": "legend" }, null);
            height = height ? height < 5 ? 5 : height : 15;
            width = width ? width < 5 ? 5 : width : 15;
            if (symbolType === "picturemarkersymbol" && url) {
                image = this._createImage(url, "", false, width, height);
                divLegendImage.appendChild(image);
                this.divLegendlist.appendChild(divLegendImage);
            } else if (symbolType === "esriPMS" && url) {
                image = this._createImage("data:image/gif;base64," + imageData, "", false, width, height);
                divLegendImage.appendChild(image);
                this.divLegendlist.appendChild(divLegendImage);
            } else {
                divSymbol = document.createElement("div");
                if (color.a) {
                    bgColor = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + color.a + ')';
                    divSymbol.style.background = bgColor;
                } else {
                    if (Color.fromArray(color).toHex()) {
                        divSymbol.style.backgroundColor = Color.fromArray(color).toHex();
                    } else {
                        divSymbol.style.backgroundColor = Color.fromArray([255, 0, 255, 5]).toHex();
                    }
                }
                divSymbol.style.height = height + "px";
                divSymbol.style.width = width + "px";
                divSymbol.style.marginTop = "8px";
                divLegendImage.appendChild(divSymbol);
                this.divLegendlist.appendChild(divLegendImage);
            }
            divLegendLabel = dojo.create("div", { "class": "legendlbl" }, null);
            domAttr.set(divLegendLabel, "innerHTML", label);
            this.divLegendlist.appendChild(divLegendLabel);
            legendWidth = divLegendLabel.offsetWidth + width + 30;
            this.legendListWidth.push(legendWidth);
        },

        /*
        * find hosted feature services
        * @memberOf widgets/legends/legends
        */
        _filterHostedFeatureServices: function (layerArray) {
            var hostedLayers = [], layerDetails, index;
            for (index = 0; index < layerArray.length; index++) {
                if (layerArray[index].match("/FeatureServer")) {
                    layerDetails = layerArray[index].split("/");
                    if (layerDetails[5] && layerDetails[5].toLowerCase && layerDetails[5].toLowerCase() === "rest") {
                        hostedLayers.push(layerArray[index]);
                        layerArray.splice(index, 1);
                        index--;
                    }
                }
            }
            return hostedLayers;
        },

        /*
        * add field values
        * @memberOf widgets/legends/legends
        */
        _addFieldValue: function (layerCollectionArray) {
            var defArray = [], layerTempArray = [], params, layer, layersRequest, deferredList, i;
            for (layer in layerCollectionArray) {
                if (layerCollectionArray.hasOwnProperty(layer)) {
                    if (layerCollectionArray[layer].legend && layerCollectionArray[layer].legend.length > 1) {
                        layerTempArray.push(layer);
                        params = {
                            url: layer,
                            content: { f: "json" },
                            handleAs: "json",
                            callbackParamName: "callback"
                        };
                        layersRequest = esriRequest(params);
                        this._getLayerDetail(layersRequest, defArray);
                    }
                }
            }
            deferredList = new DeferredList(defArray);
            deferredList.then(lang.hitch(this, function (result) {
                for (i = 0; i < result.length; i++) {
                    if (result[i][0]) {
                        this._setFieldValue(result[i][1].drawingInfo, layerCollectionArray[layerTempArray[i]]);
                        this._appendFieldType(layerCollectionArray[layerTempArray[i]], result[i][1]);
                    }
                }
                this._legendOnExtentChange();
            }));
        },

        /**
        * Description
        * @method _appendFieldType
        * @param {} layerCollection
        * @param {} layerObject
        * @return
        */
        _appendFieldType: function (layerCollection, layerObject) {
            var i;
            if (!layerObject) {
                layerObject = layerCollection;
            }
            if (layerCollection.fieldName) {
                for (i = 0; i < layerObject.fields.length; i++) {
                    if (layerObject.fields[i].name === layerCollection.fieldName) {
                        layerCollection.fieldType = layerObject.fields[i].type;
                        break;
                    }
                }
            }
        },
        /*
        * get layer json data
        * @memberOf widgets/legends/legends
        */
        _getLayerDetail: function (layersRequest, defArray) {
            var deferred = new Deferred();
            layersRequest.then(function (response) {
                deferred.resolve(response);
            }, function (error) {
                console.log("Error: ", error.message);
                deferred.reject();
            });
            defArray.push(deferred);
        },

        /*
        *set field values for unique value and class breaks renderers
        * @memberOf widgets/legends/legends
        */
        _setFieldValue: function (layerDrawingInfo, layerCollectionArray) {
            if (layerDrawingInfo && layerDrawingInfo.renderer && layerDrawingInfo.renderer.type === "uniqueValue") {
                layerCollectionArray.rendererType = "uniqueValue";
                layerCollectionArray.fieldName = layerDrawingInfo.renderer.field1 || layerDrawingInfo.renderer.field2 || layerDrawingInfo.renderer.field3;
            } else if (layerDrawingInfo && layerDrawingInfo.renderer && layerDrawingInfo.renderer.type === "classBreaks") {
                layerCollectionArray.rendererType = "classBreaks";
                layerCollectionArray.fieldName = layerDrawingInfo.renderer.field;
            }
        },

        /**
        * remove redundant data
        * @memberOf widgets/legends/legends
        */
        _removeDuplicate: function (mapServerArray) {
            var filterArray = [], fliteredArray = [];
            array.filter(mapServerArray, function (item) {
                if (array.indexOf(filterArray, item.url) === -1) {
                    fliteredArray.push(item);
                    filterArray.push(item.url);
                }
            });
            return fliteredArray;
        },

        /**
        * create legend list
        * @memberOf widgets/legends/legends
        */
        _createLegendList: function (layerList, mapServerUrl) {
            var layerURL, i, j, isLegendCreated = false, layerUrl;
            if (layerList && layerList.layers && layerList.layers.length > 0) {
                for (i = 0; i < layerList.layers.length; i++) {
                    layerList.layers[i].featureLayerUrl = mapServerUrl.featureLayerUrl;
                    if (array.indexOf(this.indexesForLayer[mapServerUrl.url], layerList.layers[i].layerId) !== -1) {
                        isLegendCreated = true;
                        layerURL = mapServerUrl.url + '/' + layerList.layers[i].layerId;
                        this._layerCollection[layerURL] = layerList.layers[i];

                        if (this._layerCollection[layerURL].featureLayerUrl) {
                            layerUrl = this._layerCollection[layerURL].featureLayerUrl;
                        } else {
                            layerUrl = layerURL;
                        }
                        if (this._checkLayerVisibility(layerUrl)) {
                            for (j = 0; j < layerList.layers[i].legend.length; j++) {
                                this._addLegendSymbol(layerList.layers[i].legend[j], layerList.layers[i].layerName);
                            }
                        }
                    }
                }
            }
            this._addlegendListWidth(this.legendListWidth);
            return isLegendCreated;
        },

        /**
        * set legend container width
        * @memberOf widgets/legends/legends
        */
        _addlegendListWidth: function (legendListWidth) {
            var listWidth = legendListWidth, total = 0, j, boxWidth;
            for (j = 0; j < listWidth.length; j++) {
                total += listWidth[j];
            }

            if (total < query(".divlegendContainer")[0].offsetWidth) {
                domStyle.set(this.divlegendContainer, "width", "auto");
            } else {
                domStyle.set(this.divlegendContainer, "width", (total + 5) + "px");
            }
            boxWidth = this.legendbox.offsetWidth;
            if (total <= 0 || this.divlegendContainer.offsetWidth < boxWidth) {
                domStyle.set(this.divRightArrow, "display", "none");
            } else {
                domStyle.set(this.divRightArrow, "display", "block");
            }
            this._resetSlideControls();
        },

        /**
        * add legend symbol in legend list
        * @memberOf widgets/legends/legends
        */
        _addLegendSymbol: function (legend, layerName) {
            var divLegendImage, image, divLegendLabel, legendWidth;
            if (legend) {
                this.divLegendlist = domConstruct.create("div", { "class": "divLegendlist" }, this.divlegendContainer);
                divLegendImage = domConstruct.create("div", { "class": "legend" }, null);
                image = this._createImage("data:image/gif;base64," + legend.imageData, "", false, legend.width, legend.height);
                domConstruct.place(image, divLegendImage);
                this.divLegendlist.appendChild(divLegendImage);
                if (legend.label) {
                    divLegendLabel = domConstruct.create("div", { "class": "legendlbl", "innerHTML": legend.label }, null);
                } else {
                    divLegendLabel = domConstruct.create("div", { "class": "legendlbl", "innerHTML": layerName }, null);
                }
                this.divLegendlist.appendChild(divLegendLabel);
                legendWidth = divLegendLabel.offsetWidth + legend.width + 30;
                this.legendListWidth.push(legendWidth);
            }
        },

        /*
        * displays the picture marker symbol
        * @memberOf widgets/legends/legends
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
