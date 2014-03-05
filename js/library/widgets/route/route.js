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
    "esri/renderers/SimpleRenderer",
    "dijit/layout/ContentPane",
    "../scrollBar/scrollBar",
    "esri/graphic",
    "dojo/_base/Color",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "dojo/aspect",
    "esri/tasks/DataFile",
     "dojo/cookie",
    "esri/tasks/BufferParameters",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!nls/localizedStrings",
    "esri/geometry/Polyline",
    "esri/SnappingManager",
    "esri/symbols/CartographicLineSymbol",
    "esri/layers/GraphicsLayer",
    "./routeSetting"
  ],
function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, domClass, RouteParameters, FeatureSet, domGeom, GeometryService, string, html, template, urlUtils, Query, Directions, QueryTask, Deferred, DeferredList, Union, _BorderContainer, SimpleLineSymbol, SimpleRenderer, _ContentPane, scrollBar, Graphic, Color, SimpleFillSymbol, SimpleMarkerSymbol, aspect, DataFile, cookie, BufferParameters, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls, Polyline, SnappingManager, CartographicLineSymbol, GraphicsLayer, routeSetting) {

    //========================================================================================================================//

    return declare([_BorderContainer, _ContentPane, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, routeSetting], {
        templateString: template,
        nls: nls,
        _esriDirectionsWidget: null,
        esriCTrouteScrollbar: null,
        esriCTInfoLayerFeatureList: null,
        logoContainer: null,
        esriCTrouteDirectionScrollbar: null,
        divShowReRouteContainer: null,
        divEmptyContainer: null,
        countBuffer: false,
        inforesult: false,
        infoPanelHeight: false,
        buffercount: 0,
        divapplicationFrequentRoutes: null,
        containerButtonHtml: null,
        routeTopTiteArrow: null,
        esriRoute: false,

        /**
        * create route widget
        *
        * @class
        * @name widgets/route/route
        */
        postCreate: function () {
            this.snapManager = null;
            handle = new Graphic();

            //relative path/// <reference path="../../proxy.ashx" />
            /// <reference path="../../proxy.ashx" />
            // millisecond
            this.logoContainer = query(".map .logo-sm") && query(".map .logo-sm")[0] || query(".map .logo-med") && query(".map .logo-med")[0];
            topic.subscribe("toggleWidget", lang.hitch(this, function (widgetID) {
                if (widgetID != "route") {

                    /**
                    * @memberOf widgets/route/route
                    */
                    if (html.coords(this.applicationHeaderRouteContainer).h > 0) {
                        domClass.replace(this.domNode, "esriCTRouteImg", "esriCTRouteImg-select");
                        domClass.replace(this.applicationHeaderRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
                        if (this.logoContainer) {
                            domClass.remove(this.logoContainer, "mapLogo");
                        }
                        domStyle.set(this.esriCTRouteInformationContent, "display", "none");
                        if (this.divFrequentRouteContainerButton) {
                            domStyle.set(this.divFrequentRouteContainerButton, "display", "none");
                        }
                    }
                } else if (widgetID == "route") {
                    domStyle.set(this.esriCTRouteInformationContent, "display", "block");
                }

            }));
            dojo.showInfo = false;
            this.domNode = domConstruct.create("div", { "title": this.title, "class": "esriCTRouteImg esriCTRouteImg-select-i" }, null);
            this._showHideInfoRouteContainer();

            /**
            * minimize other open header panel widgets and show route
            */
            var bufferGeometry;
            this.applicationRouteContainer = domConstruct.create("div", { "class": "applicationRouteContainer" }, dom.byId("esriCTParentDivContainer"));
            this.applicationRouteContainer.appendChild(this.applicationHeaderRouteContainer);
            domStyle.set(this.esriCTRouteContainer, "display", "none");
            domStyle.set(this.esriCTRouteInformationContainer, "display", "block");
            domStyle.set(this.esriCTRouteInformationContent, "display", "block");
            if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length != 0) {
                topic.subscribe("showInfoWindowContent", lang.hitch(this, function (bufferGeometry) {
                    this._showInfoWindowContent(bufferGeometry);
                }));

            } else {
                this._executeOnload(bufferGeometry);

            }
            graphicsLayerHandle = new GraphicsLayer();
            this.routeHandle = this.own(on(this.domNode, "click", lang.hitch(this, function () {
                topic.publish("toggleWidget", "route");
                if (dojo.window.getBox().w <= 640) {
                    this._showHideInfoRouteContainer();
                }
                domClass.remove(this.domNode, "esriCTRouteImg-select-i");
                domStyle.set(this.applicationHeaderRouteContainer, "display", "block");
                if (html.coords(this.esriCTRouteContainer).h > 1) {
                    domStyle.set(this.esriCTRouteContainer, "display", "block");
                    domStyle.set(this.esriCTRouteInformationContent, "display", "none");
                }
                if (dojo.window.getBox().w >= 640) {
                    this._showHideInfoRouteContainer();
                }
                if (domStyle.get(this.esriCTRouteInformationContent, "display") == "block") {
                    this._showInfoResultsPanel(bufferGeometry);
                }
            })));
            if (this.logoContainer) {
                domClass.add(this.logoContainer, "mapLogo");
            }
            this._showWidgetContainer(bufferGeometry);
            this._activate();

        },
 
        _executeOnload: function (bufferGeometry) {
            aspect.after(this.map.on("load", lang.hitch(this, function () {
                this.map.on("extent-change", lang.hitch(this, function (evt) {
                    bufferGeometry = evt.extent;
                    this._showInfoWindowContent(bufferGeometry);
                    graphicsHandleEvent.spatialReference = this.map.extent.spatialReference;
                }));
            })), function (err) {
                alert(err.message);
                topic.publish("hideProgressIndicator");
            });
        },

        _showWidgetContainer: function (bufferGeometry) {
            if (dojo.configData.RoutingEnabled == "true" && lang.trim(dojo.configData.RoutingEnabled).length != 0) {
                this.own(on(this.esriCTDirectionContainer, "click", lang.hitch(this, function () {
                    this.showRoute();
                    if (!query(".esriRoutes")[0]) {
                        if (dojo.configData.FrequentRoutesLayer.FrequentRoutesEnabled == "true" && lang.trim(dojo.configData.FrequentRoutesLayer.FrequentRoutesEnabled).length != 0) {
                            if (!this.divFrequentRouteContainer) {
                                domStyle.set(this.routeLoader, "display", "block");
                                this._showFrequentRoutes();
                                this._showFrequentRoutesPanel();
                            }
                        }
                    }
                    this._showDirectionTab();
                })));
            }
            this.own(on(this.esriCTRouteInformationContainer, "click", lang.hitch(this, function () {
                this._showInformationTab(bufferGeometry);
            })));
        },

        _activate: function () {
            var symbolEventPaddingMouseCursor = new CartographicLineSymbol().setColor(new Color([parseInt(dojo.configData.RouteSymbology.CartographicLineColor.split(",")[0]), parseInt(dojo.configData.RouteSymbology.CartographicLineColor.split(",")[1]), parseInt(dojo.configData.RouteSymbology.CartographicLineColor.split(",")[2]), parseFloat(dojo.configData.RouteSymbology.CartographicTransparency.split(",")[0])])).setWidth(dojo.configData.RouteSymbology.CartographicLineWidth).setCap(esri.symbol.CartographicLineSymbol.CAP_ROUND);
            this.map.removeLayer(graphicsLayerHandle);
            this.map.addLayer(graphicsLayerHandle);
            graphicsHandleEvent = new GraphicsLayer(); //static, singleton - big near-circle geometry around mouse cursor while d-n-d: topmost; draws with transparent symbol
            graphicsHandleEvent.setRenderer(new SimpleRenderer(symbolEventPaddingMouseCursor));
            this.map.removeLayer(graphicsHandleEvent);
            //event geometry
            graphicsLayerHandle.clear();
        },

        _showInfoWindowContent: function (bufferGeometry) {
            if (domStyle.get(this.esriCTRouteInformationContent, "display") == "block") {
                if (dojo.window.getBox().w <= 640) {
                    if (this.esriCTRouteInformationContent.offsetHeight > 1 && !dojo.showInfo) {
                        this._showInfoResultsPanel(bufferGeometry);
                    }
                } else if (!dojo.showInfo && !dojo.featureResult) {
                    this._showInfoResultsPanel(bufferGeometry);
                }
            }
        },

        _showInfoResultsPanel: function (bufferGeometry) {
            if (!this.inforesult || this.map.getLayer("frequentRoutesLayerID").graphics.length <= 0) {
                if (this.map.getLayer("esriGraphicsLayerMapSettings").graphics.length <= 0) {
                    topic.publish("showProgressIndicator");
                    domAttr.set(this.esriCTRouteInformationTitle, "innerHTML", nls.informationPanelTitle);
                    this._infoResult(bufferGeometry);
                }
            }
        },

        _showFrequentRoutesPanel: function () {
            this.divFrequentRouteContainerButton = domConstruct.create("div", { "class": "esriCTFrequentRouteContainerButton" });
            domConstruct.place(this.divFrequentRouteContainerButton, query(".esriStopsContainer")[0], "after");
            this.divapplicationFrequentRoutes = domConstruct.create("span", { "class": "esriCTcontainerButtonHtml esriCTCursorPointer" }, this.divFrequentRouteContainerButton);
            this.containerButtonHtml = domConstruct.create("span", { "class": "esriCTcontainerButtonHtml esriCTCursorPointer" }, this.divapplicationFrequentRoutes);
            domAttr.set(this.containerButtonHtml, "innerHTML", nls.frequentlRoute);
            this.routeTopTiteArrow = domConstruct.create("span", { "class": "esriCTrouteUpTitleArrow" }, this.divapplicationFrequentRoutes);
        },

        _showHideInfoRouteContainer: function () {
            if (html.coords(this.applicationHeaderRouteContainer).h > 1) {

                /**
                * when user clicks on share icon in header panel, close the sharing panel if it is open
                */
                domClass.add(this.applicationHeaderRouteContainer, "esriCTZeroHeight");
                if (this.logoContainer) {
                    domClass.remove(this.logoContainer, "mapLogo");

                }
                domClass.replace(this.domNode, "esriCTRouteImg", "esriCTRouteImg-select");
                domClass.replace(this.applicationHeaderRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
                if (this.divFrequentRouteContainerButton && !query(".esriRoutes")[0]) {
                    domStyle.set(this.divFrequentRouteContainerButton, "display", "none");
                }
                if (this.divFrequentRouteContainerButton) {
                    domStyle.set(this.divFrequentRouteContainerButton, "display", "none");
                }

                topic.publish("setMaxLegendLength");
            } else {

                /**
                * when user clicks on share icon in header panel, open the sharing panel if it is closed
                */
                domClass.remove(this.applicationHeaderRouteContainer, "esriCTZeroHeight");
                if (this.logoContainer) {
                    domClass.add(this.logoContainer, "mapLogo");
                }
                domClass.replace(this.domNode, "esriCTRouteImg-select", "esriCTRouteImg");
                domClass.replace(this.applicationHeaderRouteContainer, "esriCTShowRouteContainerHeight", "esriCTHideContainerHeight");
                domClass.replace(this.esriCTRouteContainer, "esriCTShowRouteContainerHeight", "esriCTHideContainerHeight");
                if (domStyle.get(this.esriCTRouteInformationContent, "display") != "block" && this.divFrequentRouteContainerButton) {
                    domStyle.set(this.divFrequentRouteContainerButton, "display", "block");
                }
                this.inforesult = false;
                topic.publish("setMinLegendLength");
            }
        },

        _showDirectionTab: function () {
            if (domStyle.get(this.esriCTRouteInformationContent, "display") == "block") {
                domStyle.set(this.esriCTRouteInformationContent, "display", "none");
                domStyle.set(this.esriCTRouteContainer, "display", "block");
                if (this.divFrequentRouteContainerButton) {
                    domStyle.set(this.divFrequentRouteContainerButton, "display", "block");
                }
                domClass.replace(this.esriCTDirectionContainer, "esriCTDirectionContainer-select", "esriCTDirectionContainer");
                domClass.replace(this.esriCTRouteContainer, "esriCTShowRouteContainerHeight", "esriCTHideContainerHeight");
                domClass.replace(this.esriCTRouteInformationContainer, "esriCTRouteInformationContainer-select", "esriCTRouteInformationContainer");
            }
        },

        _showInformationTab: function (bufferGeometry) {
            if (domStyle.get(this.esriCTRouteInformationContent, "display") == "none") {
                if (this.divFrequentRouteContainerButton) {
                    domStyle.set(this.divFrequentRouteContainerButton, "display", "none");
                }
                domStyle.set(this.esriCTRouteInformationContent, "display", "block");
                domStyle.set(this.esriCTRouteContainer, "display", "none");
                domClass.replace(this.esriCTDirectionContainer, "esriCTDirectionContainer", "esriCTDirectionContainer-select");
                domClass.replace(this.esriCTRouteInformationContainer, "esriCTRouteInformationContainer", "esriCTRouteInformationContainer-select");
                this.infoPanelHeight = true;
                if (domStyle.get(this.esriCTInfoLayerFeatureList, "display") == "block") {
                    dojo.featureResult = false;
                    domStyle.set(this.esriCTInfoLayerFeatureList, "display", "none");
                    domStyle.set(this.esriCTRouteInformationTitle, "display", "block");
                    domStyle.set(this.esriCTInfoLayerTitle, "display", "block");
                }
                this._showInfoResultsPanel(bufferGeometry);
            }
        },

        _showFrequentRoutes: function () {
            var featuresetResult = [];
            var defffeaturesetResult = [];
            var queryTask = new QueryTask(dojo.configData.FrequentRoutesLayer.LayerURL);
            var query = new Query();
            query.where = "1=1";
            query.returnGeometry = false;
            query.outSpatialReference = { wkid: this.map.spatialReference.wkid };
            var routeId;
            dojo.configData.FrequentRoutesLayer.UniqueRouteField.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function (match, key) {
                routeId = key;
            });
            query.orderByFields = [routeId];
            query.outFields = ["*"];
            var queryOnRouteTask = queryTask.execute(query, lang.hitch(this, function (featureSet) {
                var deferred = new Deferred();
                deferred.resolve(featureSet);
                return deferred.promise;
            }), function (err) {
                alert(err.message);
                topic.publish("hideProgressIndicator");
            });
            defffeaturesetResult.push(queryOnRouteTask);
            var deferredListResult = new DeferredList(defffeaturesetResult);
            deferredListResult.then(lang.hitch(this, function (result) {
                if (result) {
                    if (result[0][1].features.length > 0) {
                        for (var arrayResult = 0; arrayResult < result[0][1].features.length; arrayResult++) {
                            for (var i in result[0][1].features[arrayResult].attributes) {
                                if (result[0][1].features[arrayResult].attributes.hasOwnProperty(i)) {
                                    if (!result[0][1].features[arrayResult].attributes[i]) {
                                        result[0][1].features[arrayResult].attributes[i] = nls.showNullValue;
                                    }
                                }
                            }
                            featuresetResult.push({
                                name: string.substitute(dojo.configData.FrequentRoutesLayer.DisplayField, result[0][1].features[arrayResult].attributes),
                                routeId: string.substitute(dojo.configData.FrequentRoutesLayer.UniqueRouteField, result[0][1].features[arrayResult].attributes)
                            });
                        }
                        this._frequentRoutesResult(featuresetResult);
                    }
                }
            }), function (err) {
                alert(err.message);
                topic.publish("hideProgressIndicator");
            });
        },

        _frequentRoutesResult: function (featuresetResult) {
            this.divFrequentRoutePanel = domConstruct.create("div", { "class": "esriCTdivFrequentRoutePanel" });
            domConstruct.place(this.divFrequentRoutePanel, query(".esriRoutesContainer")[0], "after");
            this.divFrequentRouteContainer = domConstruct.create("div", { "class": "esriCTFrequentRouteContainer" }, this.divFrequentRoutePanel);
            this.divFrequentRouteContainerScroll = domConstruct.create("div", { "class": "esriCTFrequentRouteContainerScroll" }, this.divFrequentRouteContainer);
            var esriRoutesHeight = window.innerHeight - query(".esriCTApplicationHeader")[0].offsetHeight - html.coords(query(".simpleDirections .esriStopsContainer")[0]).h - this.divFrequentRouteContainerButton.offsetHeight - 65;
            var esriRoutesStyle = { height: esriRoutesHeight + 'px' };
            domAttr.set(this.divFrequentRouteContainer, "style", esriRoutesStyle);
            if (!this.esriCTrouteDirectionScrollbar) {
                this.esriCTrouteDirectionScrollbar = new scrollBar({ domNode: this.esriCTRouteContainer });
                this.esriCTrouteDirectionScrollbar.setContent(query(".simpleDirections")[0]);
                this.esriCTrouteDirectionScrollbar.createScrollBar();
            }
            for (var i = 0; i < featuresetResult.length; i++) {
                this._displayFrequentRouteResult(featuresetResult[i]);
            }
            domStyle.set(this.routeLoader, "display", "none");
        },

        _displayFrequentRouteResult: function (featuresetRouteResult) {
            var divFrequentRouteContent = domConstruct.create("div", { "class": " esriCTInformationLayerList esriCTCursorPointer esriInfoPanelContainer" }, this.divFrequentRouteContainerScroll);
            domAttr.set(divFrequentRouteContent, "innerHTML", featuresetRouteResult.name);
            domAttr.set(divFrequentRouteContent, "routeId", featuresetRouteResult.routeId);
            var _this = this;
            divFrequentRouteContent.onclick = function (evt) {
                topic.publish("showProgressIndicator");
                _this._clearAllGraphics();
                var id = domAttr.get(divFrequentRouteContent, "routeId");
                var routeId;
                dojo.configData.FrequentRoutesLayer.UniqueRouteField.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function (match, key) {
                    routeId = key;
                });
                var queryResult = new Query();
                queryResult.where = routeId + "=" + id;
                var frequentRouteName = domAttr.get(divFrequentRouteContent, "innerHTML", featuresetRouteResult.name);
                _this.map.getLayer("frequentRoutesLayerID").selectFeatures(queryResult, esri.layers.FeatureLayer.SELECTION_NEW, lang.hitch(this, function (features) {
                    _this._showFrequentRouteOnMap(features[0].geometry, frequentRouteName);
                }), function (err) {
                    alert(err.message);
                    topic.publish("hideProgressIndicator");
                });
            };
        },

        _showFrequentRouteOnMap: function (featureGeometry, frequentRouteName) {
            var polyLine = new esri.geometry.Polyline(this.map.spatialReference.wkid);
            var routeSegments = this.map.getLayer("frequentRoutesLayerID").graphics.length;
            var roadArray = [];
            if (0 < routeSegments) {
                for (var j = 0; j < routeSegments; j++) {
                    if (this.map.getLayer("frequentRoutesLayerID").graphics[j]) {
                        polyLine.addPath(this.map.getLayer("frequentRoutesLayerID").graphics[j].geometry.paths[0]);
                    }
                    roadArray.push(this.map.getLayer("frequentRoutesLayerID").graphics[j].attributes[this.map.getLayer("frequentRoutesLayerID").objectIdField]);
                }
                this.map.setExtent(polyLine.getExtent().expand(dojo.configData.ZoomLevel));
            }
            this._addBufferGeometryOnMap(featureGeometry, frequentRouteName);
        },

        _addBufferGeometryOnMap: function (featureGeometry, frequentRouteName) {
            if (this._esriDirectionsWidget) {
                this.esriRoute = true;
                this._emptyPersistRouteAddress();
                domConstruct.empty(query(".esriRoutesContainer")[0]);
            }
            this.inforesult = true;
            var geometryServiceUrl = dojo.configData.GeometryService;
            var geometryService = new GeometryService(geometryServiceUrl);
            this.executeBufferQuery(featureGeometry, geometryService, this.map.getLayer("frequentRoutesLayerID"), frequentRouteName);
        },


        _showHideFrequentRouteContainer: function () {
            if (this.divFrequentRouteContainerButton) {
                domClass.replace(this.divFrequentRouteContainerButton, "esriCTFrequentRouteContainerTopButton", "esriCTFrequentRouteContainerButton");
                domClass.replace(this.routeTopTiteArrow, "esriCTrouteDownTitleArrow", "esriCTrouteUpTitleArrow");
                var _this = this;
                this.divapplicationFrequentRoutes.onclick = function (evt) {
                    if (!_this.esriRoute) {
                        if (query(".esriRoutesContainer")[0]) {
                            if (domStyle.get(query(".esriRoutesContainer")[0], "display") == "none") {
                                domClass.replace(_this.divFrequentRouteContainerButton, "esriCTFrequentRouteContainerTopButton", "esriCTFrequentRouteContainerButton");
                                domClass.replace(_this.routeTopTiteArrow, "esriCTrouteDownTitleArrow", "esriCTrouteUpTitleArrow");
                                domStyle.set(query(".esriRoutesContainer")[0], "display", "block");
                                domStyle.set(_this.divFrequentRoutePanel, "display", "none");

                            } else {
                                domClass.replace(_this.routeTopTiteArrow, "esriCTrouteUpTitleArrow", "esriCTrouteDownTitleArrow");
                                domClass.replace(_this.divFrequentRouteContainerButton, "esriCTFrequentRouteContainerButton", "esriCTFrequentRouteContainerTopButton");
                                domStyle.set(query(".esriRoutesContainer")[0], "display", "none");
                                domStyle.set(_this.divFrequentRoutePanel, "display", "block");
                            }

                        }
                    }
                };
            }
        },

        _showErrorResult: function () {
            var featureLength = this._esriDirectionsWidget.stops;
            for (var result = 0; result < featureLength.length; result++) {
                if (!featureLength[result].feature) {
                    alert(featureLength[result].name + " " + nls.notFound);
                }
            }
        },

        disableMouseEvents: function () {
            dojo.disconnect(this.routeGraphics_onMouseMove);
            dojo.disconnect(this.routeGraphics_onMouseOut);
            dojo.disconnect(this.routeGraphics_onMouseDown);
            dojo.disconnect(this.graphicsLayerHandleEventPadding_onMouseDrag);
            dojo.disconnect(this.graphicsLayerHandleEventPadding_onMouseUp);
        },

        _emptyPersistRouteAddress: function () {
            var storage, stops;
            stops = [];
            storage = window.localStorage;
            if (storage) {
                stops.push("");
                stops.push("");
            } else {
                if (cookie.isSupported()) {
                    stops.push("");
                    stops.push("");
                }
            }
            this._esriDirectionsWidget.updateStops(stops);
        },

        _clearAllGraphics: function () {
            var graphicsLength = this.map.getLayer("esriGraphicsLayerMapSettings").graphics.length;
            var graphicsBufferLength = this.map.getLayer("frequentRoutesLayerID").graphics.length;
            if (graphicsLength > 0) {
                if (this.map.getLayer("esriGraphicsLayerMapSettings").visible) {
                    this.map.getLayer("esriGraphicsLayerMapSettings").clear();
                }
            }
            if (graphicsBufferLength > 0) {
                if (this.map.getLayer("frequentRoutesLayerID").visible) {
                    this.map.getLayer("frequentRoutesLayerID").clear();
                }
            }
        },

        _infoResult: function (geometry) {
            var graphicsBufferLength = this.map.getLayer("frequentRoutesLayerID").graphics.length;
            if (graphicsBufferLength > 0) {
                topic.publish("hideInfoWindowOnMap");
                this.infoPanelHeight = true;
            }
            if (this.esriCTInfoLayerTitle) {
                domConstruct.destroy(this.esriCTInfoLayerTitle, this.esriCTRouteInformationContent, "first");
                domConstruct.destroy(this.esriCTInfoLayerTitle);
            }
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
                    for (infoArrayResult = 0; infoArrayResult < result.length; infoArrayResult++)
                        if (result[infoArrayResult][1].features) {
                            arrInfoResult.push({
                                resultFeatures: result[infoArrayResult][1].features,
                                resultFields: result[infoArrayResult][1].fields,
                                layerDetails: dojo.configData.SearchAnd511Settings[infoArrayResult]
                            });
                        }
                }
                this._showInfoResults(result, arrInfoResult, geometry);
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
                query.outSpatialReference = { wkid: this.map.spatialReference.wkid };
                query.returnGeometry = false;
                query.outFields = ["*"];
                query.geometry = geometry;
                query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
                var queryOverlayTask = queryTask.execute(query, lang.hitch(this, function (featureSet) {
                    var deferred = new Deferred();
                    deferred.resolve(featureSet);
                    return deferred.promise;
                }), function (err) {
                    alert(err.message);
                    topic.publish("hideProgressIndicator");
                });
                infoArray.push(queryOverlayTask);
            }
        },

        _showInfoResults: function (result, arrInfoResult, geometry) {
            this.esriCTInfoLayerTitle = domConstruct.create("div", { "class": "esriCTInfoLayerTitle" }, this.esriCTRouteInformationContent);
            this.esriCTInfoLayerTitleContent = domConstruct.create("div", { "class": "esriCTInfoLayerTitleContent" }, this.esriCTInfoLayerTitle);
            this.esriCTInfoLayerFeatureList = domConstruct.create("div", { "class": "esriCTInfoLayerFeatureList" }, this.esriCTRouteInformationContent);
            var backPanelInfoHeader = domConstruct.create("div", { "class": "" }, this.esriCTInfoLayerFeatureList);
            var backPanel = domConstruct.create("div", { "class": "esriCTRouteInformationBackTitle" }, backPanelInfoHeader);
            var infoBackTiteArrow = domConstruct.create("span", { "class": "infoBackTiteArrow esriCTCursorPointer" }, backPanel);
            var infoBackTite = domConstruct.create("span", { "class": "infoBackTite esriCTCursorPointer" }, backPanel);
            domAttr.set(infoBackTite, "innerHTML", nls.back);
            var resultTitle = domConstruct.create("div", { "class": "esriCTRouteInformation511ttile" }, backPanelInfoHeader);
            var resultPanelContainer = domConstruct.create("div", { "class": "resultPanelContainer" }, this.esriCTInfoLayerFeatureList);
            this.resultPanelContents = domConstruct.create("div", { "class": "resultPanelContents" }, resultPanelContainer);
            var esriRoutesHeight = domGeom.position(query(".esriCTHeaderRouteContainer")[0]).h - query(".esriCTRouteInformationBackTitle")[0].offsetHeight - 130;
            var esriRoutesStyle = { height: esriRoutesHeight + 'px' };
            if (!this.infoPanelHeight) {
                domAttr.set(this.esriCTInfoLayerTitle, "style", esriRoutesStyle);
            }
            domStyle.set(this.esriCTInfoLayerTitle, "display", "block");
            domStyle.set(this.esriCTInfoLayerFeatureList, "display", "none");
            this.infoPanelHeight = false;
            domStyle.set(backPanelInfoHeader, "display", "none");
            domStyle.set(resultPanelContainer, "display", "none");
            if (!this.esriCTrouteScrollbar && this.esriCTInfoLayerTitle.offsetHeight > 1) {
                this.esriCTrouteScrollbar = new scrollBar({ domNode: this.esriCTInfoLayerTitle });
                this.esriCTrouteScrollbar.setContent(this.esriCTInfoLayerTitleContent);
                this.esriCTrouteScrollbar.createScrollBar();
            }
            topic.publish("hideProgressIndicator");
            this._showInfoResultsList(arrInfoResult, backPanel, resultPanelContainer, backPanelInfoHeader, resultTitle);

        },

        _showInfoResultsList: function (arrInfoResult, backPanel, resultPanelContainer, backPanelInfoHeader, resultTitle) {
            for (var i in dojo.configData.SearchAnd511Settings) {
                if (dojo.configData.SearchAnd511Settings[i].InfoLayer == "true") {
                    if (arrInfoResult.length > 0) {
                        if (dojo.configData.SearchAnd511Settings[i].SearchDisplayTitle) {
                            var infoLayerTitlePanel = domConstruct.create("div", { "infoTitle": dojo.configData.SearchAnd511Settings[i].SearchDisplayTitle, "class": "esriCTInformationLayerListContainer " }, this.esriCTInfoLayerTitleContent);
                            domAttr.set(infoLayerTitlePanel, "layer", dojo.configData.SearchAnd511Settings[i].QueryURL);
                            domAttr.set(infoLayerTitlePanel, "index", i);
                            var esriInfoPanelContainer = domConstruct.create("div", { "class": "esriInfoPanelContainer esriCTCursorPointer" }, infoLayerTitlePanel);
                            var esriInfoTitle = domConstruct.create("div", { "class": "esriCTInformationLayerList esriCTInformationLayerListContent esriCTCursorPointer" }, esriInfoPanelContainer);
                            var infoTitleText = domConstruct.create("div", { "class": "esriCTRouteMapName" }, esriInfoTitle);
                            domAttr.set(infoTitleText, "innerHTML", dojo.configData.SearchAnd511Settings[i].SearchDisplayTitle);
                            var infoTitleNum = domConstruct.create("div", { "class": "esriCTRouteMapNum" }, esriInfoTitle);
                            domAttr.set(infoTitleNum, "innerHTML", '(' + arrInfoResult[i].resultFeatures.length + ')');
                            var infoTitleArrow = domConstruct.create("div", { "class": "infoTitleArrow esriCTCursorPointer" }, esriInfoTitle);
                            domStyle.set(this.esriCTInfoLayerFeatureList, "display", "none");
                            if (arrInfoResult[i].resultFeatures.length > 0) {
                                this.own(on(infoLayerTitlePanel, "click", lang.hitch(this, function (event) {
                                    this._showLayerListPanel(arrInfoResult, event, resultTitle, resultPanelContainer, backPanelInfoHeader, resultTitle);
                                })));
                            } else {
                                domStyle.set(esriInfoTitle, "cursor", "default");
                            }
                            this.own(on(backPanel, "click", lang.hitch(this, function () {
                                dojo.featureResult = false;
                                domStyle.set(this.esriCTInfoLayerTitle, "display", "block");
                                domStyle.set(this.esriCTInfoLayerFeatureList, "display", "none");
                                this.InfoPanelScrollbar.removeScrollBar();
                                domStyle.set(backPanelInfoHeader, "display", "none");
                                domStyle.set(resultPanelContainer, "display", "none");
                                domStyle.set(this.esriCTInfoLayerTitle, "display", "block");
                                domStyle.set(this.esriCTRouteInformationTitle, "display", "block");
                                domConstruct.empty(this.resultPanelContents);
                            })));
                        }
                    }
                }
            }
        },

        _showLayerListPanel: function (arrInfoResult, event, resultTitle, resultPanelContainer, backPanelInfoHeader, resultTitle) {
            domStyle.set(this.esriCTInfoLayerTitle, "display", "none");
            domStyle.set(this.esriCTInfoLayerFeatureList, "display", "block");
            dojo.featureResult = true;
            var esriInfoPanelHeight = domGeom.position(query(".esriCTHeaderRouteContainer")[0]).h - query(".esriCTRouteInformationBackTitle")[0].offsetHeight - 100;
            var esriInfoPanelStyle = { height: esriInfoPanelHeight + 'px' };
            domStyle.set(resultPanelContainer, "display", "block");
            domAttr.set(resultPanelContainer, "style", esriInfoPanelStyle);
            if (this.InfoPanelScrollbar) {
                domClass.add(this.InfoPanelScrollbar._scrollBarContent, "esriCTZeroHeight");
                this.InfoPanelScrollbar.removeScrollBar();
            }
            var infoTitle = domAttr.get(event.currentTarget, "infoTitle");
            var layer = domAttr.get(event.currentTarget, "layer");
            var selectedIndex = domAttr.get(event.currentTarget, "index");
            domAttr.set(resultTitle, "innerHTML", infoTitle);
            domStyle.set(backPanelInfoHeader, "display", "block");
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
                                    arrInfoResult[index].resultFeatures[j].attributes[x] = nls.showNullValue;
                                }
                            }
                        }
                        if (arrInfoResult[index].resultFeatures[j].attributes) {
                            if (arrInfoResult[index].layerDetails.InfoDetailFields && arrInfoResult[index].layerDetails.InfoDetailFields.length != 0) {
                                routeArray.push({
                                    name: string.substitute(arrInfoResult[index].layerDetails.InfoDetailFields, arrInfoResult[index].resultFeatures[j].attributes)
                                });
                            } else {
                                routeArray.push({
                                    name: string.substitute(arrInfoResult[index].layerDetails.SearchDisplayFields, arrInfoResult[index].resultFeatures[j].attributes)
                                });
                            }
                        }
                    }
                    for (var currentIndex = 0; currentIndex < routeArray.length; currentIndex++) {
                        this._displayInfoPanelResult(routeArray[currentIndex], layer, arrInfoResult[selectedIndex], currentIndex, selectedIndex);
                    }
                }
            }
        },

        _displayInfoPanelResult: function (arrSearchResult, selectedLayer, featureset, currentIndex, selectedIndex) {
            var esriInfoPanelContainer = domConstruct.create("div", { "class": "esriInfoPanelContainer" }, this.resultPanelContents);
            var infoPanel = domConstruct.create("div", { "class": "esriCTInformationLayerList" }, esriInfoPanelContainer);
            domAttr.set(infoPanel, "innerHTML", arrSearchResult.name);
            domAttr.set(infoPanel, "currentLayer", selectedLayer);
            this.selectedIndex = selectedIndex;
            for (var i = 0; i < featureset.resultFields.length; i++) {
                if (featureset.resultFields[i].type == "esriFieldTypeOID") {
                    this.objID = featureset.resultFields[i].name;
                    break;
                }
            }
            domAttr.set(infoPanel, "selectedFeatureID", featureset.resultFeatures[currentIndex].attributes[this.objID]);
            this.own(on(infoPanel, "click", lang.hitch(this, function () {
                var map = this.map;
                if (dojo.window.getBox().w <= 640) {
                    domStyle.set(this.applicationHeaderRouteContainer, "display", "none");
                    domClass.replace(this.domNode, "esriCTRouteImg", "esriCTRouteImg-select");
                }
                dojo.showInfo = true;
                this.inforesult = true;
                topic.publish("showProgressIndicator");
                var currentLayer = domAttr.get(infoPanel, "currentLayer");
                var selectedFeature = domAttr.get(infoPanel, "selectedFeatureID");
                var queryTask = new QueryTask(currentLayer);
                var query = new Query();
                query.where = this.objID + "=" + selectedFeature;
                query.outSpatialReference = this.map.spatialReference;
                query.returnGeometry = true;
                query.outFields = ["*"];
                queryTask.execute(query, lang.hitch(this, function (featureSet) {
                    if (featureSet.features[0].geometry.type == "point") {
                        topic.publish("createInfoWindowContent", featureSet.features[0].geometry, featureSet.features[0].attributes, featureSet.fields, this.selectedIndex, null, null, map);
                    } else if (featureSet.features[0].geometry.type == "polyline") {
                        var point = featureSet.features[0].geometry.getPoint(0, 0);
                        topic.publish("createInfoWindowContent", point, featureSet.features[0].attributes, featureSet.fields, this.selectedIndex, null, null, map);
                    }

                }), function (err) {
                    alert(err.message);
                    topic.publish("hideProgressIndicator");
                });
            })));
        }
    });
});