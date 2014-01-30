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
    "dojo/on",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/dom",
    "dojo/query",
    "dojo/dom-class",
    "esri/tasks/RouteParameters",
    "esri/tasks/FeatureSet",
    "dojo/dom-geometry",
    "esri/tasks/GeometryService",
    "dojo/string",
    "dojo/_base/html",
    "dojo/text!./templates/getRoute.html",
    "esri/urlUtils",
    "esri/tasks/query",
    "esri/dijit/Directions",
    "esri/tasks/QueryTask",
    "dojo/Deferred",
    "dojo/DeferredList",
    "esri/dijit/editing/Union",
    "dijit/layout/BorderContainer",
    "esri/symbols/SimpleLineSymbol",
    "dijit/layout/ContentPane",
    "../scrollBar/scrollBar",
    "esri/graphic",
    "dojo/_base/Color",
    "esri/symbols/SimpleFillSymbol",
    "dojo/aspect",
    "esri/tasks/DataFile",
    "esri/tasks/BufferParameters",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/shared/nls/localizedStrings",
    "dojo/i18n!application/nls/localizedStrings",
    "esri/geometry/Polyline",
    "dojo/domReady!"
  ],
function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, domClass, RouteParameters, FeatureSet, domGeom, GeometryService, string, html, template, urlUtils, Query, Directions, QueryTask, Deferred, DeferredList, Union, _BorderContainer, SimpleLineSymbol, _ContentPane, scrollBar, graphic, color, SimpleFillSymbol, aspect, DataFile, BufferParameters, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, appNls, Polyline) {

    //========================================================================================================================//

    return declare([_BorderContainer, _ContentPane, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        _esriDirectionsWidger: null,
        esriCTrouteScrollbar: null,
        esriCTInfoLayerFeatureList: null,
        logoContainer: null,
        esriCTrouteDirectionScrollbar: null,
        esriCTInfoPanelScrollbar: null,
        bufferValue: 1,
        divShowReRouteContainer: null,
        divEmptyContainer: null,
        bufferCount: null,

        /**
        * create route widget
        *
        * @class
        * @name widgets/route/route
        */
        postCreate: function () {
            //relative path/// <reference path="../../proxy.ashx" />
            /// <reference path="../../proxy.ashx" />

            // millisecond
            this.logoContainer = query(".map .logo-sm") && query(".map .logo-sm")[0] || query(".map .logo-med") && query(".map .logo-med")[0];
            domAttr.set(this.imgSearchLoader, "src", dojoConfig.baseURL + "/shared/themes/images/blue-loader.gif");
            domStyle.set(this.imgSearchLoader, "display", "block");
            topic.subscribe("toggleWidget", lang.hitch(this, function (widgetID) {
                if (widgetID != "route") {

                    /**
                    * @memberOf widgets/route/route
                    */
                    if (html.coords(this.applicationHeaderRouteContainer).h > 0) {
                        domClass.replace(this.domNode, "esriCTRouteImg", "esriCTRouteImg-select");
                        domClass.replace(this.applicationHeaderRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
                        domClass.remove(this.logoContainer, "mapLogo");
                    }
                }
            }));
            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.route, "class": "esriCTRouteImg esriCTRouteImg-select-i" }, null);
            this._showHideInfoRouteContainer();

            /**
            * minimize other open header panel widgets and show route
            */
            var applicationRouteContainer = domConstruct.create("div", { "class": "applicationRouteContainer" }, dom.byId("esriCTParentDivContainer"));
            applicationRouteContainer.appendChild(this.applicationHeaderRouteContainer);
            var esriRoutesHeight = window.innerHeight - 49;
            var esriRoutesStyle = { height: esriRoutesHeight + 'px' };
            domAttr.set(this.applicationHeaderRouteContainer, "style", esriRoutesStyle);
            domStyle.set(this.esriCTRouteContainer, "display", "none");
            domStyle.set(this.esriCTRouteInformationContainer, "display", "block");
            this.routeHandle = this.own(on(this.domNode, "click", lang.hitch(this, function (evt) {
                topic.publish("toggleWidget", "route");
                this._showHideInfoRouteContainer();
                domClass.remove(this.domNode, "esriCTRouteImg-select-i");
                domStyle.set(this.applicationHeaderRouteContainer, "display", "block");
                if (html.coords(this.esriCTRouteContainer).h > 1) {
                    domStyle.set(this.esriCTRouteContainer, "display", "block");
                    domStyle.set(this.esriCTRouteInformationContent, "display", "none");
                }
            })));
            aspect.after(this.map.on("load", lang.hitch(this, function () {
                var getGeometry = this.map.extent;
                this._infoResult(getGeometry);
            })), function (err) {
                alert(err.message);
            });
            domClass.add(this.logoContainer, "mapLogo");
            if (dojo.configData.RoutingEnabled == "true" && lang.trim(dojo.configData.RoutingEnabled).length != 0) {
                this.own(on(this.esriCTDirectionContainer, "click", lang.hitch(this, function () {
                    this._showRoute();
                    this._showDirectionTab();

                })));
            }
            this.own(on(this.esriCTRouteInformationContainer, "click", lang.hitch(this, function () {
                this._showInformationTab();
            })));
        },

        _showHideInfoRouteContainer: function () {
            if (html.coords(this.applicationHeaderRouteContainer).h > 1) {

                /**
                * when user clicks on share icon in header panel, close the sharing panel if it is open
                */
                domClass.remove(this.logoContainer, "mapLogo");
                domClass.replace(this.domNode, "esriCTRouteImg", "esriCTRouteImg-select");
                domClass.replace(this.applicationHeaderRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
            }
            else {

                /**
                * when user clicks on share icon in header panel, open the sharing panel if it is closed
                */
                domClass.add(this.logoContainer, "mapLogo");
                domClass.replace(this.domNode, "esriCTRouteImg-select", "esriCTRouteImg");
                domClass.replace(this.applicationHeaderRouteContainer, "esriCTShowRouteContainerHeight", "esriCTHideContainerHeight");
                domClass.replace(this.esriCTRouteContainer, "esriCTShowRouteContainerHeight", "esriCTHideContainerHeight");
            }
        },

        _showDirectionTab: function () {
            if (domStyle.get(this.esriCTRouteInformationContent, "display", "block")) {
                domStyle.set(this.esriCTRouteInformationContent, "display", "none");
                domStyle.set(this.esriCTRouteContainer, "display", "block");
                domClass.replace(this.esriCTDirectionContainer, "esriCTDirectionContainer-select", "esriCTDirectionContainer");
                domClass.replace(this.esriCTRouteContainer, "esriCTShowRouteContainerHeight", "esriCTHideContainerHeight");
                domClass.replace(this.esriCTRouteInformationContainer, "esriCTRouteInformationContainer-select", "esriCTRouteInformationContainer");
            }
        },

        _showInformationTab: function () {
            if (domStyle.get(this.esriCTRouteInformationContent, "display", "none")) {
                domStyle.set(this.esriCTRouteInformationContent, "display", "block");
                domStyle.set(this.esriCTRouteContainer, "display", "none");
                domClass.replace(this.esriCTDirectionContainer, "esriCTDirectionContainer", "esriCTDirectionContainer-select");
                domClass.replace(this.esriCTRouteInformationContainer, "esriCTRouteInformationContainer", "esriCTRouteInformationContainer-select");
            }
        },

        /**
        * show route page
        * @memberOf widgets/route/route
        */
        _showRoute: function () {
            esriConfig.defaults.io.alwaysUseProxy = true;
            if (!this._esriDirectionsWidger) {
                this._esriDirectionsWidger = new Directions({
                    map: this.map,
                    routeTaskUrl: dojo.configData.RouteTaskService
                }, domConstruct.create("div", {}, this.esriCTRouteContainer));
                this._esriDirectionsWidger.startup();
                this._esriDirectionsWidger.options.routeSymbol.color = new color([parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[0]), parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[1]), parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[2]), parseFloat(dojo.configData.RouteSymbology.Transparency.split(",")[0])]);
                this._esriDirectionsWidger.options.routeSymbol.width = parseInt(dojo.configData.RouteSymbology.Width);
                this.own(on(this._esriDirectionsWidger, "directions-finish", lang.hitch(this, function (evt) {
                    domStyle.set(this.imgSearchLoader, "display", "block");
                    if (this._esriDirectionsWidger.directions != null) {
                        this._clearAllGraphics();
                        this._addBufferGeometry();
                        var esriRoutesHeight = window.innerHeight - query(".esriCTApplicationHeader")[0].offsetHeight - html.coords(query(".simpleDirections .esriStopsContainer")[0]).h - 117;
                        var esriRoutesStyle = { height: esriRoutesHeight + 'px' };
                        domAttr.set(query(".esriRoutes")[0], "style", esriRoutesStyle);
                        domAttr.set(query(".esriResultsPrint")[0], "innerHTML", sharedNls.buttons.print);
                        if (!this.esriCTrouteDirectionScrollbar) {
                            this.esriCTrouteDirectionScrollbar = new scrollBar({ domNode: this.esriCTRouteContainer });
                            this.esriCTrouteDirectionScrollbar.setContent(query(".simpleDirections")[0]);
                            this.esriCTrouteDirectionScrollbar.createScrollBar();
                        }
                    } else {
                        alert("no direction found");
                    }
                })));
            }
        },

        _addBufferGeometry: function () {
            var featureGeometry = [];
            var geometryServiceURL = dojo.configData.GeometryService;
            var geometryService = new GeometryService(geometryServiceURL);
            for (var featureIndex = 1; featureIndex < this._esriDirectionsWidger.directions.features.length; featureIndex++) {
                featureGeometry.push(this._esriDirectionsWidger.directions.features[featureIndex].geometry);
            }
            this._showBufferDistance(featureGeometry, geometryService);
        },

        _showBufferDistance: function (geometry, geometryService) {
            this.bufferValue = 1;
            esriConfig.defaults.io.alwaysUseProxy = true;
            geometryService.union(geometry).then(lang.hitch(this, function (geometries) {
                var params = new BufferParameters();
                params.distances = [parseInt(dojo.configData.BufferMilesForProximityAnalysis) * this.bufferValue];
                params.bufferSpatialReference = new esri.SpatialReference({ wkid: 102100 });
                params.outSpatialReference = this.map.spatialReference;
                params.unit = GeometryService.UNIT_STATUTE_MILE;
                params.geometries = [geometries];
                geometryService.buffer(params, lang.hitch(this, function (bufferedGeometries) {
                    this._showBufferRoute(this.map.getLayer("esriGraphicsLayerMapSettings"), bufferedGeometries);
                    if (this.bufferValue >= 1) {
                        this._onRouteFeatureCount(geometries, bufferedGeometries[0]);
                    }
                }));

            }), function (err) {
                alert(err.message);
            });
        },

        _onRouteFeatureCount: function (geometry, bufferedGeometries) {
            var onRouteFeaturArray = [];
            var onRouteFeatureData = [];
            var countOfFeatures = 0;
            for (var index = 0; index < dojo.configData.SearchAnd511Settings.length; index++) {
                if (dojo.configData.SearchAnd511Settings[index].BarrierLayer == "true") {
                    onRouteFeatureData.push(dojo.configData.SearchAnd511Settings[index]);
                    this._showfeatureCountresultResult(onRouteFeaturArray, index, geometry);
                }
            }
            var deferredListResult = new DeferredList(onRouteFeaturArray);
            var arrInfoResult = [];
            var barrierArray = [];
            deferredListResult.then(lang.hitch(this, function (result) {
                for (count = 0; count < result.length; count++) {
                    if (result[count][1].features) {
                        if (result[count][1].features.length > 0) {
                            dojo.forEach(result[count][1].features, lang.hitch(this, function (feature) {
                                countOfFeatures++;
                                barrierArray.push(feature);
                            }));
                        }
                    }
                }
                if (countOfFeatures == 0 && this.bufferValue >= 1) {
                    domConstruct.empty(this.esriCTInfoLayerTitle, this.esriCTRouteInformationContent, "first");
                    domClass.add(this.esriCTInfoLayerTitle, "esriCTInfoLayerTitleHeight");
                    domStyle.set(this.esriCTInfoLayerTitle, "height", "0px");
                    this._infoResult(geometry);
                }

                if (countOfFeatures > 0 && this.bufferValue >= 1) {
                    if (this.divEmptyContainer) {
                        domConstruct.empty(this.divEmptyContainer, this.esriCTRouteInformationContent, "first");
                    }
                    this._esriDirectionsWidger.routeParams = new RouteParameters();
                    this._esriDirectionsWidger.routeParams.polylineBarriers = new FeatureSet();
                    this._esriDirectionsWidger.routeParams.polylineBarriers.features = barrierArray;
                    this._showRouteButton(countOfFeatures, geometry, bufferedGeometries);
                    this._showRouteCount(countOfFeatures);
                }
            }));
        },

        _showRouteButton: function (countOfFeatures, geometry, bufferedGeometries) {
            domStyle.set(this.imgSearchLoader, "display", "block");
            this.divShowReRouteContainer = domConstruct.create("div", { "class": "esriCTdivShowReRouteContainer" });
            domConstruct.place(this.divShowReRouteContainer, query(".esriRoutesContainer")[0], "first");
            var showRouteInfoContent = domConstruct.create("div", { "class": "esriCTshowRouteInfoContent" }, this.divShowReRouteContainer);
            domAttr.set(showRouteInfoContent, "innerHTML", appNls.reRouteDisplayText);
            var showRouteImgContent = domConstruct.create("div", { "class": "showRouteImgContent esriCTCursorPointer" }, this.divShowReRouteContainer);
            domConstruct.empty(this.esriCTInfoLayerTitle, this.esriCTRouteInformationContent, "first");
            domClass.add(this.esriCTInfoLayerTitle, "esriCTInfoLayerTitleHeight");
            domStyle.set(this.esriCTInfoLayerTitle, "height", "0px");
            this._infoResult(bufferedGeometries);
            this.own(on(showRouteImgContent, "click", lang.hitch(this, function (evt) {
                this.bufferValue++;
                this._esriDirectionsWidger.getDirections();
                domConstruct.empty(this.esriCTInfoLayerTitle, this.esriCTRouteInformationContent, "first");
                domStyle.set(this.esriCTInfoLayerTitle, "height", "0px");
                domClass.add(this.esriCTInfoLayerTitle, "esriCTInfoLayerTitleHeight");
                this._infoResult(bufferedGeometries);
            })));
        },

        _showRouteCount: function (countOfFeatures) {
            this.bufferCount = true;
            var showCountContent = domConstruct.create("div", { "class": "esriCTshowCountContent" });
            domConstruct.place(showCountContent, this.divShowReRouteContainer, "first");
            domAttr.set(showCountContent, "innerHTML", countOfFeatures);
            domStyle.set(this.imgSearchLoader, "display", "none");
        },

        _showfeatureCountresultResult: function (onRouteFeaturArray, index, geometry) {
            var layerobject = dojo.configData.SearchAnd511Settings[index];
            if (layerobject.QueryURL) {
                var queryTask = new QueryTask(layerobject.QueryURL);
                var query = new Query();
                var newDate = (new Date().toISOString().split("T")[0]);
                var newTime = ((new Date().toISOString().split("T")[1]).split(".")[0]);
                var fullDate = newDate + " " + newTime;
                if (layerobject.BarrierSearchExpression && layerobject.BarrierSearchExpression.length != 0) {
                    query.where = string.substitute(layerobject.BarrierSearchExpression, [fullDate, fullDate]);
                } else {
                    query.where = "1=1";
                }
                query.returnGeometry = true;
                query.outSpatialReference = { wkid: 102100 };
                query.outFields = ["*"];
                query.geometry = geometry;
                query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
                var queryOnRouteTask = queryTask.execute(query, lang.hitch(this, function (featureSet) {
                    var deferred = new Deferred();
                    deferred.resolve(featureSet);
                    return deferred.promise;
                }), function (err) {
                    alert(err.message);
                });
                onRouteFeaturArray.push(queryOnRouteTask);
            }
        },

        _clearAllGraphics: function () {
            var graphicsLength = this.map.getLayer("esriGraphicsLayerMapSettings").graphics.length;
            if (graphicsLength > 0) {
                if (this.map.getLayer("esriGraphicsLayerMapSettings").visible) {
                    this.map.getLayer("esriGraphicsLayerMapSettings").clear();
                }
            }
        },

        _showBufferRoute: function (layer, geometries) {
            var symbol = new SimpleFillSymbol(
                    SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(
                      SimpleLineSymbol.STYLE_SOLID,
                      new color([parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[0]), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[1]), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[2]), parseFloat(dojo.configData.BufferSymbology.LineSymbolTransparency.split(",")[0])]), 2
                    ),
                    new color([parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[0]), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[1]), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[2]), parseFloat(dojo.configData.BufferSymbology.FillSymbolTransparency.split(",")[0])])
                  );
            dojo.forEach(geometries, lang.hitch(this, function (geometry) {
                var graphic = new esri.Graphic(geometry, symbol);
                var features = [];
                features.push(graphic);
                var featureSet = new esri.tasks.FeatureSet();
                featureSet.features = features;
                layer.add(featureSet.features[0]);
            }));
        },

        _infoResult: function (geometry) {
            var infoArray = [];
            var layerData = [];
            for (var index = 0; index < dojo.configData.SearchAnd511Settings.length; index++) {
                if (dojo.configData.SearchAnd511Settings[index].InfoLayer == "true") {
                    layerData.push(dojo.configData.SearchAnd511Settings[index]);
                    this._locateInformationSearchResult(infoArray, index, geometry);
                }
            }
            var deferredListResult = new DeferredList(infoArray);
            var arrInfoResult = [];
            var infoArrayResult;
            deferredListResult.then(lang.hitch(this, function (result) {
                if (result) {
                    for (var infoArrayResult = 0; infoArrayResult < result.length; infoArrayResult++)
                        if (result[infoArrayResult][1].features) {
                            arrInfoResult.push({
                                resultFeatures: result[infoArrayResult][1].features,
                                layerDetails: dojo.configData.SearchAnd511Settings[infoArrayResult]
                            });
                        }
                }
                this._showInfoResults(result, arrInfoResult);
            }));
        },

        _locateInformationSearchResult: function (infoArray, index, geometry) {
            var layerobject = dojo.configData.SearchAnd511Settings[index];
            if (layerobject.QueryURL) {
                var queryTask = new QueryTask(layerobject.QueryURL);
                var query = new Query();
                if (layerobject.InfoSearchExpression && layerobject.InfoSearchExpression.length != 0) {
                    query.where = layerobject.InfoSearchExpression;
                } else {
                    query.where = "1=1";
                }
                query.outSpatialReference = { wkid: 102100 };
                query.returnGeometry = false;
                query.outFields = ["*"];
                query.geometry = geometry;
                query.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                var queryOverlayTask = queryTask.execute(query, lang.hitch(this, function (featureSet) {
                    var deferred = new Deferred();
                    deferred.resolve(featureSet);
                    return deferred.promise;
                }), function (err) {
                    alert(err.message);
                });
                infoArray.push(queryOverlayTask);
            }
        },

        _showInfoResults: function (result, arrInfoResult) {
            this.esriCTInfoLayerTitle = domConstruct.create("div", { "class": "esriCTInfoLayerTitle" }, this.esriCTRouteInformationContent);
            this.esriCTInfoLayerTitleContent = domConstruct.create("div", { "class": "esriCTInfoLayerTitleContent" }, this.esriCTInfoLayerTitle);
            this.esriCTInfoLayerFeatureList = domConstruct.create("div", { "class": "esriCTInfoLayerFeatureList" }, this.esriCTRouteInformationContent);
            var backPanelInfoHeader = domConstruct.create("div", { "class": "esriCTRouteInformationBackTitle" }, this.esriCTInfoLayerFeatureList);
            var backPanel = domConstruct.create("div", { "class": "" }, backPanelInfoHeader);
            var infoBackTiteArrow = domConstruct.create("span", { "class": "infoBackTiteArrow esriCTCursorPointer" }, backPanel);
            var infoBackTite = domConstruct.create("span", { "class": "infoBackTite esriCTCursorPointer" }, backPanel);
            domAttr.set(infoBackTite, "innerHTML", sharedNls.buttons.back);
            var resultTitle = domConstruct.create("span", {}, backPanelInfoHeader);
            var resultPanelContainer = domConstruct.create("div", { "class": "resultPanelContainer" }, this.esriCTInfoLayerFeatureList);
            this.resultPanelContents = domConstruct.create("div", { "class": "resultPanelContents" }, resultPanelContainer);
            query(".esriCTApplicationHeader")[0];
            var esriRoutesHeight = window.innerHeight - query(".esriCTApplicationHeader")[0].offsetHeight - query(".esriCTRouteInformationBackTitle")[0].offsetHeight - 75;
            var esriRoutesStyle = { height: esriRoutesHeight + 'px' };
            domAttr.set(resultPanelContainer, "style", esriRoutesStyle);
            domStyle.set(backPanelInfoHeader, "display", "none");
            domAttr.set(this.esriCTInfoLayerTitle, "style", esriRoutesStyle);
            if (!this.esriCTrouteScrollbar) {
                this.esriCTrouteScrollbar = new scrollBar({ domNode: this.esriCTInfoLayerTitle });
                this.esriCTrouteScrollbar.setContent(this.esriCTInfoLayerTitleContent);
                this.esriCTrouteScrollbar.createScrollBar();
            }
            domStyle.set(this.imgSearchLoader, "display", "none");
            for (var i in dojo.configData.SearchAnd511Settings) {
                if (dojo.configData.SearchAnd511Settings[i].InfoLayer == "true") {
                    if (arrInfoResult.length > 0) {
                        if (dojo.configData.SearchAnd511Settings[i].SearchDisplayTitle) {
                            var infoLayerTitlePanel = domConstruct.create("div", { "infoTitle": dojo.configData.SearchAnd511Settings[i].SearchDisplayTitle, "class": "esriCTInformationLayerListContainer " }, this.esriCTInfoLayerTitleContent);
                            var esriInfoPanelContainer = domConstruct.create("div", { "class": "esriInfoPanelContainer" }, infoLayerTitlePanel);
                            var esriInfoTitle = domConstruct.create("div", { "class": "esriCTInformationLayerList esriCTInformationLayerListContent esriCTCursorPointer" }, esriInfoPanelContainer);
                            var infoTitleText = domConstruct.create("div", { "class": "esriCTRouteMapName" }, esriInfoTitle);
                            domAttr.set(infoTitleText, "innerHTML", dojo.configData.SearchAnd511Settings[i].SearchDisplayTitle);
                            var infoTitleNum = domConstruct.create("div", { "class": "esriCTRouteMapNum" }, esriInfoTitle);
                            domAttr.set(infoTitleNum, "innerHTML", '(' + arrInfoResult[i].resultFeatures.length + ')');
                            var infoTiteArrow = domConstruct.create("div", { "class": "infoTiteArrow esriCTCursorPointer" }, esriInfoTitle);
                            domStyle.set(this.esriCTInfoLayerFeatureList, "display", "none");
                            this.own(on(infoLayerTitlePanel, "click", lang.hitch(this, function (evt) {
                                domStyle.set(this.imgSearchLoader, "display", "none");
                                if (this.InfoPanelScrollbar) {
                                    domClass.add(this.InfoPanelScrollbar._scrollBarContent, "esriCTZeroHeight");
                                    this.InfoPanelScrollbar.removeScrollBar();
                                }
                                domStyle.set(this.esriCTInfoLayerFeatureList, "display", "block");
                                var infoTitle = domAttr.get(evt.currentTarget, "infoTitle");
                                domAttr.set(resultTitle, "innerHTML", infoTitle);
                                domStyle.set(backPanelInfoHeader, "display", "block");
                                domStyle.set(this.esriCTInfoLayerTitle, "display", "none");
                                domStyle.set(this.esriCTRouteInformationTitle, "display", "none");
                                this.InfoPanelScrollbar = new scrollBar({ domNode: resultPanelContainer });
                                this.InfoPanelScrollbar.setContent(this.resultPanelContents);
                                this.InfoPanelScrollbar.createScrollBar();
                                for (var index = 0; index < arrInfoResult.length; index++) {
                                    if (arrInfoResult[index].layerDetails.SearchDisplayTitle == infoTitle) {
                                        var routeArray = [];
                                        for (var j = 0; j < arrInfoResult[index].resultFeatures.length; j++) {
                                            for (var x in arrInfoResult[index].resultFeatures[j].attributes) {
                                                if (arrInfoResult[index].resultFeatures[j].attributes.hasOwnProperty(x)) {
                                                    if (!arrInfoResult[index].resultFeatures[j].attributes[x]) {
                                                        arrInfoResult[index].resultFeatures[j].attributes[x] = sharedNls.showNullValue;
                                                    }
                                                }
                                            }
                                            if (arrInfoResult[index].resultFeatures[j].attributes) {
                                                if (arrInfoResult[index].layerDetails.InfoDetailFields && arrInfoResult[index].layerDetails.InfoDetailFields.length != 0) {
                                                    routeArray.push({
                                                        name: string.substitute(arrInfoResult[index].layerDetails.InfoDetailFields, arrInfoResult[index].resultFeatures[j].attributes)
                                                    });
                                                }
                                                else {
                                                    routeArray.push({
                                                        name: string.substitute(arrInfoResult[index].layerDetails.SearchDisplayFields, arrInfoResult[index].resultFeatures[j].attributes)
                                                    });
                                                }
                                            }
                                        }
                                        for (var currentIndex = 0; currentIndex < routeArray.length; currentIndex++) {
                                            this._displayInfoPanelResult(routeArray[currentIndex]);
                                        }
                                    }
                                }
                            })));
                            this.own(on(backPanel, "click", lang.hitch(this, function (evt) {
                                domStyle.set(this.esriCTInfoLayerFeatureList, "display", "none");
                                this.InfoPanelScrollbar.removeScrollBar();
                                domStyle.set(backPanelInfoHeader, "display", "none");
                                domStyle.set(this.esriCTInfoLayerTitle, "display", "block");
                                domStyle.set(this.esriCTRouteInformationTitle, "display", "block");
                                domConstruct.empty(this.resultPanelContents);
                                domStyle.set(this.imgSearchLoader, "display", "none");
                            })));
                            domStyle.set(this.imgSearchLoader, "display", "none");
                        }
                    }
                }
            }
        },

        _displayInfoPanelResult: function (arrSearchResult) {
            var esriInfoPanelContainer = domConstruct.create("div", { "class": "esriInfoPanelContainer" }, this.resultPanelContents);
            var infoPanel = domConstruct.create("div", { "class": "esriCTInformationLayerList esriCTCursorDefult" }, esriInfoPanelContainer);
            domAttr.set(infoPanel, "innerHTML", arrSearchResult.name);
        }
    });
});