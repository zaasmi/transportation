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
    "dojo/_base/Color",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "dojo/aspect",
    "esri/tasks/DataFile",
     "dojo/cookie",
    "esri/graphic",
    "esri/tasks/BufferParameters",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!nls/localizedStrings",
    "esri/geometry/Polyline",
    "esri/SnappingManager",
    "esri/symbols/CartographicLineSymbol",
    "esri/layers/GraphicsLayer"
  ],
function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, domClass, RouteParameters, FeatureSet, domGeom, GeometryService, string, html, template, urlUtils, Query, Directions, QueryTask, Deferred, DeferredList, Union, _BorderContainer, SimpleLineSymbol, _ContentPane, scrollBar, graphic, color, Color, SimpleFillSymbol, SimpleMarkerSymbol, aspect, DataFile, cookie, Graphic, BufferParameters, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls, Polyline, SnappingManager, CartographicLineSymbol, GraphicsLayer) {

    //========================================================================================================================//

    return declare([_BorderContainer, _ContentPane, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
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

        /**
        * create route widget
        *
        * @class
        * @name widgets/route/route
        */
        postCreate: function () {
            this.snapManager = null;
            handle = new esri.Graphic();

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
                        domClass.remove(query(".esriCTHeaderRouteContainer")[0], "esriCTHeaderFrequentRouteContainer");
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
            this.domNode = domConstruct.create("div", { "title": nls.tooltips.route, "class": "esriCTRouteImg esriCTRouteImg-select-i" }, null);
            this._showHideInfoRouteContainer();
            var getGeometry;

            /**
            * minimize other open header panel widgets and show route
            */
            this.applicationRouteContainer = domConstruct.create("div", { "class": "applicationRouteContainer" }, dom.byId("esriCTParentDivContainer"));
            this.applicationRouteContainer.appendChild(this.applicationHeaderRouteContainer);
            domStyle.set(this.esriCTRouteContainer, "display", "none");
            domStyle.set(this.esriCTRouteInformationContainer, "display", "block");
            domStyle.set(this.esriCTRouteInformationContent, "display", "block");
            if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length != 0) {
                topic.subscribe("showInfoWindowContent", lang.hitch(this, function (getGeometry, map) {
                    this.map = map;
                    this._showInfoWindowContent(getGeometry, map);
                }));

            } else {
                aspect.after(this.map.on("load", lang.hitch(this, function () {
                    this.map.on("extent-change", lang.hitch(this, function (evt) {
                        getGeometry = evt.extent;
                        this._showInfoWindowContent(getGeometry, this.map);
                        graphicsLayerHandleEventPadding.spatialReference = this.map.extent.spatialReference;
                    }));
                })), function (err) {
                    alert(err.message);
                    topic.publish("hideProgressIndicator");
                });
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
                if (domStyle.get(this.esriCTRouteInformationContent, "display", "block") == "block") {
                    this._showInfoResultsPanel(getGeometry);
                }
            })));
            if (this.logoContainer) {
                domClass.add(this.logoContainer, "mapLogo");
            }
            if (dojo.configData.RoutingEnabled == "true" && lang.trim(dojo.configData.RoutingEnabled).length != 0) {
                this.own(on(this.esriCTDirectionContainer, "click", lang.hitch(this, function () {
                    this._showRoute();
                    if (!query(".esriRoutes")[0]) {
                        domClass.add(query(".esriCTHeaderRouteContainer")[0], "esriCTHeaderFrequentRouteContainer");
                        if (!this.divFrequentRouteContainer) {
                            domStyle.set(this.routeLoader, "display", "block");
                            this._showFrequentRoutes();
                            this._showFrequentRoutesPanel();
                        }
                    }
                    this._showDirectionTab();
                })));
            }
            this.own(on(this.esriCTRouteInformationContainer, "click", lang.hitch(this, function () {
                domClass.remove(query(".esriCTHeaderRouteContainer")[0], "esriCTHeaderFrequentRouteContainer");
                this._showInformationTab(getGeometry);
            })));
            this._activate();
        },

        _activate: function () {
            symbolEventPaddingMouseCursor = new CartographicLineSymbol().setColor(new dojo.Color([0, 255, 0, 0])).setWidth(512).setCap(esri.symbol.CartographicLineSymbol.CAP_ROUND);
            this.map.removeLayer(graphicsLayerHandle);
            this.map.addLayer(graphicsLayerHandle);
            graphicsLayerHandleEventPadding = new GraphicsLayer(); //static, singleton - big near-circle geometry around mouse cursor while d-n-d: topmost; draws with transparent symbol
            graphicsLayerHandleEventPadding.setRenderer(new esri.renderer.SimpleRenderer(symbolEventPaddingMouseCursor));
            this.map.removeLayer(graphicsLayerHandleEventPadding);
            //event geometry
            graphicsLayerHandle.clear();
        },

        _showInfoWindowContent: function (getGeometry, map) {
            if (domStyle.get(this.esriCTRouteInformationContent, "display", "block") == "block") {
                if (dojo.window.getBox().w <= 640) {
                    if (this.esriCTRouteInformationContent.offsetHeight > 1) {
                        if (!dojo.showInfo) {
                            this._showInfoResultsPanel(getGeometry);
                        }
                    }
                } else {
                    if (!dojo.showInfo && !dojo.featureResult) {
                        this._showInfoResultsPanel(getGeometry);
                    }
                }
            }
        },

        _showInfoResultsPanel: function (getGeometry) {
            if (!this.inforesult || this.map.getLayer("frequentRoutesLayerID").graphics.length <= 0) {
                if (this.map.getLayer("esriGraphicsLayerMapSettings").graphics.length <= 0) {
                    topic.publish("showProgressIndicator");
                    this._infoResult(getGeometry);
                }
            }
        },

        _showFrequentRoutesPanel: function () {
            this.divFrequentRouteContainerButton = domConstruct.create("div", { "class": "esriCTFrequentRouteContainerButton" });
            this.applicationRouteContainer.appendChild(this.divFrequentRouteContainerButton);
            var divapplicationFrequentRoutes = domConstruct.create("span", { "class": "esriCTcontainerButtonHtml esriCTCursorPointer" }, this.divFrequentRouteContainerButton);
            var containerButtonHtml = domConstruct.create("span", { "class": "esriCTcontainerButtonHtml esriCTCursorPointer" }, divapplicationFrequentRoutes);
            domAttr.set(containerButtonHtml, "innerHTML", nls.more);
            if (containerButtonHtml.innerHTML == nls.more) {
                this.infoPanelHeight = true;
            } else {
                this.infoPanelHeight = false;
            }
            var routeTopTiteArrow = domConstruct.create("span", { "class": "esriCTrouteUpTitleArrow esriCTCursorPointer" }, divapplicationFrequentRoutes);
            this.own(on(divapplicationFrequentRoutes, "click", lang.hitch(this, function () {
                if (containerButtonHtml.innerHTML == nls.more) {
                    this.infoPanelHeight = false;
                    domClass.remove(query(".esriCTHeaderRouteContainer")[0], "esriCTHeaderFrequentRouteContainer");
                    domClass.replace(this.divFrequentRouteContainerButton, "esriCTFrequentRouteContainerTopButton", "esriCTFrequentRouteContainerButton");
                    domClass.replace(routeTopTiteArrow, "esriCTrouteDownTitleArrow", "esriCTrouteUpTitleArrow");
                    domAttr.set(containerButtonHtml, "innerHTML", nls.less);
                }
                else if (containerButtonHtml.innerHTML == nls.less) {
                    domClass.add(query(".esriCTHeaderRouteContainer")[0], "esriCTHeaderFrequentRouteContainer");
                    domClass.replace(this.divFrequentRouteContainerButton, "esriCTFrequentRouteContainerButton", "esriCTFrequentRouteContainerTopButton");
                    domClass.replace(routeTopTiteArrow, "esriCTrouteUpTitleArrow", "esriCTrouteDownTitleArrow");
                    domAttr.set(containerButtonHtml, "innerHTML", nls.more);
                }
            })));
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
                domClass.remove(query(".esriCTHeaderRouteContainer")[0], "esriCTHeaderFrequentRouteContainer");
                if (this.divFrequentRouteContainerButton && !query(".esriRoutes")[0]) {
                    domStyle.set(this.divFrequentRouteContainerButton, "display", "none");
                }
                topic.publish("setMaxLegendLength");
            }
            else {

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
                if (domStyle.get(this.esriCTRouteInformationContent, "display", "none") == "none") {
                    if (this.divFrequentRouteContainerButton && !query(".esriRoutes")[0]) {
                        domStyle.set(this.divFrequentRouteContainerButton, "display", "block");
                        if (this.divFrequentRouteContainerButton.innerText == nls.less) {
                            domClass.remove(query(".esriCTHeaderRouteContainer")[0], "esriCTHeaderFrequentRouteContainer");
                        } else {
                            domClass.add(query(".esriCTHeaderRouteContainer")[0], "esriCTHeaderFrequentRouteContainer");
                        }
                    }
                }
                this.inforesult = false;
                topic.publish("setMinLegendLength");
            }
        },

        _showDirectionTab: function () {
            if (domStyle.get(this.esriCTRouteInformationContent, "display", "block")) {
                domStyle.set(this.esriCTRouteInformationContent, "display", "none");
                domStyle.set(this.esriCTRouteContainer, "display", "block");
                if (query(".esriRoutes")[0]) {
                    domClass.remove(query(".esriResultsContainer")[0], this.divFrequentRouteContainer);
                    domStyle.set(this.divFrequentRouteContainerButton, "display", "none");
                } else if (this.divFrequentRouteContainerButton && !query(".esriRoutes")[0]) {
                    domStyle.set(this.divFrequentRouteContainerButton, "display", "block");
                    if (this.divFrequentRouteContainerButton.innerText == nls.less) {
                        domClass.remove(query(".esriCTHeaderRouteContainer")[0], "esriCTHeaderFrequentRouteContainer");
                    } else {
                        domClass.add(query(".esriCTHeaderRouteContainer")[0], "esriCTHeaderFrequentRouteContainer");
                    }
                }
                domClass.replace(this.esriCTDirectionContainer, "esriCTDirectionContainer-select", "esriCTDirectionContainer");
                domClass.replace(this.esriCTRouteContainer, "esriCTShowRouteContainerHeight", "esriCTHideContainerHeight");
                domClass.replace(this.esriCTRouteInformationContainer, "esriCTRouteInformationContainer-select", "esriCTRouteInformationContainer");
            }
        },

        _showInformationTab: function (getGeometry) {
            if (domStyle.get(this.esriCTRouteInformationContent, "display", "none")) {
                domStyle.set(this.divFrequentRouteContainerButton, "display", "none");
                domStyle.set(this.esriCTRouteInformationContent, "display", "block");
                domStyle.set(this.esriCTRouteContainer, "display", "none");
                domStyle.set(this.divFrequentRouteContainerButton, "display", "none");
                domClass.replace(this.esriCTDirectionContainer, "esriCTDirectionContainer", "esriCTDirectionContainer-select");
                domClass.replace(this.esriCTRouteInformationContainer, "esriCTRouteInformationContainer", "esriCTRouteInformationContainer-select");
                this.infoPanelHeight = true;
                this._showInfoResultsPanel(getGeometry);
            }
        },

        _showFrequentRoutes: function () {
            var featuresetResult = [];
            var defffeaturesetResult = [];
            var queryTask = new QueryTask(dojo.configData.FrequentRoutesLayer.LayerURL);
            var query = new Query();
            query.where = "1=1";
            query.returnGeometry = false;
            query.outSpatialReference = { wkid: 102100 };
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
            this.divFrequentRouteContainer = domConstruct.create("div", { "class": "esriCTFrequentRouteContainer" });
            domConstruct.place(this.divFrequentRouteContainer, query(".esriRoutesContainer")[0]);
            this.divFrequentRouteContainerScroll = domConstruct.create("div", { "class": "esriCTFrequentRouteContainerScroll" }, this.divFrequentRouteContainer);
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
                var query = new Query();
                query.where = routeId + "=" + id;
                var frequentRouteName = domAttr.get(divFrequentRouteContent, "innerHTML", featuresetRouteResult.name).toUpperCase();
                _this.map.getLayer("frequentRoutesLayerID").selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, lang.hitch(this, function (features) {
                    _this._showFrequentRouteOnMap(features[0].geometry, frequentRouteName);
                }), function (err) {
                    alert(err.message);
                    topic.publish("hideProgressIndicator");
                });
            };
        },

        _showFrequentRouteOnMap: function (featureGeometry, frequentRouteName) {
            var polyLine = new esri.geometry.Polyline(this.map.spatialReference);
            var routeSegments = this.map.getLayer("frequentRoutesLayerID").graphics.length;
            var roadArray = [];
            if (0 < routeSegments) {
                for (var j = 0; j < routeSegments; j++) {
                    if (this.map.getLayer("frequentRoutesLayerID").graphics[j]) {
                        polyLine.addPath(this.map.getLayer("frequentRoutesLayerID").graphics[j].geometry.paths[0]);
                    }
                    roadArray.push(this.map.getLayer("frequentRoutesLayerID").graphics[j].attributes[this.map.getLayer("frequentRoutesLayerID").objectIdField]);
                }
                this.map.setExtent(polyLine.getExtent().expand(7));
            }
            this._addBufferGeometryOnMap(featureGeometry, frequentRouteName);
        },

        _addBufferGeometryOnMap: function (featureGeometry, frequentRouteName) {
            this.inforesult = true;
            var geometryServiceUrl = dojo.configData.GeometryService;
            var geometryService = new GeometryService(geometryServiceUrl);
            this._showGraphicBufferDistance(featureGeometry, geometryService, this.map.getLayer("frequentRoutesLayerID"), frequentRouteName);
        },

        /**
        * show route page
        * @memberOf widgets/route/route
        */
        _showRoute: function () {
            esriConfig.defaults.io.alwaysUseProxy = true;
            var directionsUnits = dojo.configData.RouteSymbology.DirectionUnits;

            if (!this._esriDirectionsWidget) {
                this._esriDirectionsWidget = new Directions({
                    map: this.map,
                    directionsLengthUnits: directionsUnits,
                    routeTaskUrl: dojo.configData.RouteTaskService
                }, domConstruct.create("div", {}, this.esriCTRouteContainer));
                this._esriDirectionsWidget.startup();
                //barriers feature set
                this._esriDirectionsWidget.routeParams.barriers = new FeatureSet();
                this._esriDirectionsWidget.routeParams.polylineBarriers = new FeatureSet();
                this._esriDirectionsWidget.routeParams.polygonBarriers = new FeatureSet();

                this._esriDirectionsWidget.options.routeSymbol.color = new color([parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[0]), parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[1]), parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[2]), parseFloat(dojo.configData.RouteSymbology.Transparency.split(",")[0])]);
                this._esriDirectionsWidget.options.routeSymbol.width = parseInt(dojo.configData.RouteSymbology.Width);
                var divFrequentRoute = domConstruct.create("div", { "class": "esriCTdivFrequentRoute" });
                domAttr.set(divFrequentRoute, "innerHTML", nls.titles.frequentRoute);
                domConstruct.place(divFrequentRoute, query(".esriRoutesContainer")[0], "first");
                this.routeLoader = domConstruct.create("img", { "class": "esriCTInfoLoader" }, divFrequentRoute);
                domAttr.set(this.routeLoader, "src", dojoConfig.baseURL + "/js/library/themes/images/blue-loader.gif");
                this.own(on(this._esriDirectionsWidget, "directions-finish", lang.hitch(this, function (evt) {
                    topic.publish("showProgressIndicator");
                    this._onDirectionFinish();
                }), function (err) {
                    alert(err.message);
                    topic.publish("hideProgressIndicator");
                }));
                this.own(on(this._esriDirectionsWidget, "add-stops", lang.hitch(this, function (evt) {
                    topic.publish("showProgressIndicator");
                    this._esriDirectionsWidget.getDirections();
                })));
                this._persistRouteAddress();
            }
        },

        _onDirectionFinish: function () {
            this.infoPanelHeight = false;
            domStyle.set(this.divFrequentRouteContainerButton, "display", "none");
            domClass.remove(query(".esriCTHeaderRouteContainer")[0], "esriCTHeaderFrequentRouteContainer");
            this.inforesult = true;
            if (this.divFrequentRouteContainer) {
                domConstruct.empty(this.divFrequentRouteContainer, query(".esriResultsContainer")[0], "first");
            }
            if (this._esriDirectionsWidget.directions != null) {
                this._clearAllGraphics();
                this._addBufferGeometry();
                this._enableMouseEvents();
                var esriRoutesHeight = window.innerHeight - query(".esriCTApplicationHeader")[0].offsetHeight - html.coords(query(".simpleDirections .esriStopsContainer")[0]).h - 117;
                var esriRoutesStyle = { height: esriRoutesHeight + 'px' };
                domAttr.set(query(".esriRoutes")[0], "style", esriRoutesStyle);
                domAttr.set(query(".esriResultsPrint")[0], "innerHTML", nls.buttons.print);
                if (!this.esriCTrouteDirectionScrollbar) {
                    this.esriCTrouteDirectionScrollbar = new scrollBar({ domNode: this.esriCTRouteContainer });
                    this.esriCTrouteDirectionScrollbar.setContent(query(".simpleDirections")[0]);
                    this.esriCTrouteDirectionScrollbar.createScrollBar();
                }
            } else {
                alert(nls.errorMessages.noDirection);
                topic.publish("hideProgressIndicator");
            }
        },

        disableMouseEvents: function () {
            dojo.disconnect(this.routeGraphics_onMouseMove);
            dojo.disconnect(this.routeGraphics_onMouseOut);
            dojo.disconnect(this.routeGraphics_onMouseDown);
            dojo.disconnect(this.graphicsLayerHandleEventPadding_onMouseDrag);
            dojo.disconnect(this.graphicsLayerHandleEventPadding_onMouseUp);
        },

        _enableMouseEvents: function () {
            this.disableMouseEvents();
            var routeGraphics = this.map.getLayer("esriCTParentDivContainer_graphics");
            var dragSymbol = new SimpleMarkerSymbol(
                SimpleMarkerSymbol.STYLE_CIRCLE,
                12,
                new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new color("#007AC2"), 2
                ),
                new color("#FFFFFF")
				);

            this.routeGraphics_onMouseMove = on(routeGraphics, "mouse-over", lang.hitch(this, function (evt) {
                //snapping to active directions geometry on hovering
                this._initSnappingManager();
                handle.setSymbol(dragSymbol);
                clearTimeout(handle.hideTimer);
                this.map.setMapCursor("pointer");
                this.map.snappingManager.getSnappingPoint(evt.screenPoint).then(this._moveHandle);
            }));
            this.routeGraphics_onMouseOut = on(routeGraphics, "mouse-out", lang.hitch(this, function (evt) {
                //hide the handle
                clearTimeout(handle.hideTimer);
                handle.hideTimer = setTimeout("graphicsLayerHandle.clear();", 500);
                this.map.setMapCursor("default");
            }));

            this.routeGraphics_onMouseDown = on(routeGraphics, "mouse-down", lang.hitch(this, function (evt) {
                handle.setSymbol(dragSymbol);
                this._onHandleDrag(evt);
            }));

            this.graphicsLayerHandleEventPadding_onMouseDrag = on(graphicsLayerHandleEventPadding, "mouse-move", lang.hitch(this, function (evt) {
                this._onHandleDrag(evt);
            }));
            this.graphicsLayerHandleEventPadding_onMouseUp = on(graphicsLayerHandleEventPadding, "mouse-up", lang.hitch(this, function (evt) {
                graphicsLayerHandleEventPadding.clear(); //hiding circular geometry around mouse cursor which helped to deal with mouse events
                this._onMoveWaypoint(evt); //permanently moving waypoint, rebuilding directions
            }));
        },

        _initSnappingManager: function (tolerance) {
            if (this.snapManager == null) {
                if (!tolerance) tolerance = 15;
                this.snapManager = this.map.enableSnapping({
                    layerInfos: [{
                        layer: this.map.getLayer("esriCTParentDivContainer_graphics"),
                        snapToVertex: false,
                        snapToPoint: true,
                        snapToEdge: true
                    }],
                    tolerance: tolerance
                });
            }
        },

        _onHandleDrag: function (evt) {
            dojo.stopEvent(evt);
            this._moveHandle(evt.mapPoint);

            //using the handle.eventPadding 1px length line with a 512px-width symbol around the handle
            //so if user moves cursor too fast, graphicsLayterHandle will still produce onMouseMove events
            //while draggin the Handle
            var r = Math.max(this.map.toMap(new esri.geometry.Point(0, 0)).y - this.map.toMap(new esri.geometry.Point(0, 1)).y, 1);
            var pl = new esri.geometry.Polyline({ paths: [[[evt.mapPoint.x, evt.mapPoint.y - r], [evt.mapPoint.x, evt.mapPoint.y + r]]] });
            pl.setSpatialReference(graphicsLayerHandleEventPadding.spatialReference);
            if (!handle.eventPadding) {
                handle.eventPadding = new esri.Graphic(pl);
            }
            handle.eventPadding.setGeometry(pl);
            graphicsLayerHandleEventPadding.clear();
            graphicsLayerHandleEventPadding.add(handle.eventPadding);
            this.map.addLayer(graphicsLayerHandleEventPadding);
        },

        _onMoveWaypoint: function (evt) {
            var stopIndex = Math.ceil(this._esriDirectionsWidget.stops.length / 2);
            this._esriDirectionsWidget.addStop(evt.mapPoint, stopIndex);
            this._esriDirectionsWidget.clearDirections();
        },

        _moveHandle: function (point) {
            //moving handle
            handle.geometry = point;
            graphicsLayerHandle.clear();
            graphicsLayerHandle.add(handle);
        },
        _persistRouteAddress: function () {
            var storage, stops;
            stops = [];
            storage = window.localStorage;
            if (storage) {
                stops.push((storage.getItem("SourceAddress") !== null) ? storage.getItem("SourceAddress") : "");
                stops.push((storage.getItem("DestAddress") !== null) ? storage.getItem("DestAddress") : "");
            } else {
                if (cookie.isSupported()) {
                    stops.push((cookie("SourceAddress") != undefined) ? cookie("SourceAddress") : "");
                    stops.push((cookie("DestAddress") != undefined) ? cookie("DestAddress") : "");
                }
            }
            this._esriDirectionsWidget.updateStops(stops);
        },


        _addBufferGeometry: function () {
            var featureGeometry = [];
            var geometryServiceUrl = dojo.configData.GeometryService;
            var geometryService = new GeometryService(geometryServiceUrl);
            for (var featureIndex = 1; featureIndex < this._esriDirectionsWidget.directions.features.length; featureIndex++) {
                featureGeometry.push(this._esriDirectionsWidget.directions.features[featureIndex].geometry);
            }
            if (this.countBuffer) {
                this._getIncidentGeometryOnMap(featureGeometry, geometryService);
            }
            else {
                this._showBufferDistance(featureGeometry, geometryService);
                this._showBufferOnRoute(featureGeometry, geometryService);
            }
        },

        _getIncidentGeometryOnMap: function (geometry, geometryService) {
            this.countBuffer = false;
            geometryService.union(geometry).then(lang.hitch(this, function (geometries) {
                var params = new BufferParameters();
                params.distances = [parseInt(dojo.configData.BufferMilesForProximityAnalysis) * this.buffercount];
                params.bufferSpatialReference = new esri.SpatialReference({ wkid: 102100 });
                params.outSpatialReference = this.map.spatialReference;
                params.unit = GeometryService.UNIT_STATUTE_MILE;
                params.geometries = [geometries];
                geometryService.buffer(params, lang.hitch(this, function (bufferedRouteGeometries) {
                    this._onRouteIncidentCount(bufferedRouteGeometries[0]);
                }));

            }), function (err) {
                alert(err.message);
                topic.publish("hideProgressIndicator");
            });
        },

        _onRouteIncidentCount: function (onBuffergeometry) {
            var onRouteFeaturArray = [];
            var onRouteFeatureData = [];
            var countOfFeatures = 0;
            for (var index = 0; index < dojo.configData.SearchAnd511Settings.length; index++) {
                if (dojo.configData.SearchAnd511Settings[index].BarrierLayer == "true") {
                    onRouteFeatureData.push(dojo.configData.SearchAnd511Settings[index]);
                    this._showfeatureCountResult(onRouteFeaturArray, index, onBuffergeometry);
                }
            }
            var deferredListResult = new DeferredList(onRouteFeaturArray);
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
                this._esriDirectionsWidget.getDirections();
            }));
        },

        _showBufferOnRoute: function (geometry, geometryService) {
            esriConfig.defaults.io.alwaysUseProxy = true;
            geometryService.union(geometry).then(lang.hitch(this, function (geometries) {
                var params = new BufferParameters();
                params.distances = [parseInt(dojo.configData.BufferMetersForFindingBarriers)];
                params.bufferSpatialReference = new esri.SpatialReference({ wkid: 102100 });
                params.outSpatialReference = this.map.spatialReference;
                params.unit = GeometryService.UNIT_METER;
                params.geometries = [geometries];
                geometryService.buffer(params, lang.hitch(this, function (bufferedRouteGeometries) {
                    if (bufferedRouteGeometries.length > 0) {
                        this._onRouteFeatureCount(geometries);
                    }
                }));

            }), function (err) {
                alert(err.message);
                topic.publish("hideProgressIndicator");
            });
        },

        _showGraphicBufferDistance: function (geometry, geometryService, featureLayer, frequentRouteName) {
            var params = new BufferParameters();
            params.distances = [parseInt(dojo.configData.BufferMilesForProximityAnalysis)];
            params.bufferSpatialReference = new esri.SpatialReference({ wkid: 102100 });
            params.outSpatialReference = this.map.spatialReference;
            params.unit = GeometryService.UNIT_STATUTE_MILE;
            params.geometries = [geometry];
            geometryService.buffer(params, lang.hitch(this, function (bufferedGeometries) {
                this._showBufferRoute(featureLayer, bufferedGeometries);
                this._onBufferInfoREsult(bufferedGeometries[0], frequentRouteName);
            }), function (err) {
                alert(err.message);
                topic.publish("hideProgressIndicator");
            });
        },

        _showBufferDistance: function (geometry, geometryService) {
            esriConfig.defaults.io.alwaysUseProxy = true;
            var routeLength = this._esriDirectionsWidget.stops.length;
            var routeFirstName = this._esriDirectionsWidget.stops[0].name.toUpperCase();
            var routeLastName = this._esriDirectionsWidget.stops[routeLength - 1].name.toUpperCase();
            var routeName = routeFirstName + " " + nls.to + " " + routeLastName;
            geometryService.union(geometry).then(lang.hitch(this, function (geometries) {
                var params = new BufferParameters();
                params.distances = [parseInt(dojo.configData.BufferMilesForProximityAnalysis)];
                params.bufferSpatialReference = new esri.SpatialReference({ wkid: 102100 });
                params.outSpatialReference = this.map.spatialReference;
                params.unit = GeometryService.UNIT_STATUTE_MILE;
                params.geometries = [geometries];
                geometryService.buffer(params, lang.hitch(this, function (bufferedGeometries) {
                    if (bufferedGeometries.length > 0) {
                        this._showBufferRoute(this.map.getLayer("esriGraphicsLayerMapSettings"), bufferedGeometries);
                        this._onBufferInfoREsult(bufferedGeometries[0], routeName);
                    }
                }));

            }), function (err) {
                alert(err.message);
                topic.publish("hideProgressIndicator");
            });
        },

        _onBufferInfoREsult: function (geometry, routeName) {
            domAttr.set(this.esriCTRouteInformationTitle, "innerHTML", routeName);
            this._infoResult(geometry);
        },

        _onRouteFeatureCount: function (onRoutegeometry) {
            topic.publish("hideInfoWindowOnMap");
            this.divSearchLoader = domConstruct.create("div", { "class": "esriCTRouteLoader" });
            domConstruct.place(this.divSearchLoader, query(".esriRoutesContainer")[0], "first");
            var onRouteFeaturArray = [];
            var onRouteFeatureData = [];
            var countOfFeatures = 0;
            for (var index = 0; index < dojo.configData.SearchAnd511Settings.length; index++) {
                if (dojo.configData.SearchAnd511Settings[index].BarrierLayer == "true") {
                    onRouteFeatureData.push(dojo.configData.SearchAnd511Settings[index]);
                    this._showfeatureCountResult(onRouteFeaturArray, index, onRoutegeometry);
                }
            }
            var deferredListResult = new DeferredList(onRouteFeaturArray);
            var barrierArray = [];
            deferredListResult.then(lang.hitch(this, function (result) {
                for (var count = 0; count < result.length; count++) {
                    if (result[count][1].features) {
                        if (result[count][1].features.length > 0) {
                            dojo.forEach(result[count][1].features, lang.hitch(this, function (feature) {
                                countOfFeatures++;
                                barrierArray.push(feature);
                                if (feature.geometry && feature.geometry.type && feature.geometry.type.toLowerCase() == "polygon") {
                                    this._esriDirectionsWidget.routeParams.polygonBarriers.features.push(new Graphic(feature.geometry));
                                } else if (feature.geometry && feature.geometry.type && feature.geometry.type.toLowerCase() == "polyline") {
                                    this._esriDirectionsWidget.routeParams.polylineBarriers.features.push(new Graphic(feature.geometry));
                                } else if (feature.geometry && feature.geometry.type && feature.geometry.type.toLowerCase() == "point") {
                                    this._esriDirectionsWidget.routeParams.barriers.features.push(new Graphic(feature.geometry));
                                }
                            }));
                        }
                    }
                }
                if (countOfFeatures > 0) {
                    if (this.divEmptyContainer) {
                        domConstruct.empty(this.divEmptyContainer, this.esriCTRouteInformationContent, "first");
                    }
                    this._showRouteButton(countOfFeatures, onRoutegeometry);
                }
            }));
        },

        _showRouteButton: function (countOfFeatures) {
            var count = 0;
            this.divShowReRouteContainer = domConstruct.create("div", { "class": "esriCTdivShowReRouteContainer" });
            domConstruct.place(this.divShowReRouteContainer, query(".esriRoutesContainer")[0], "first");
            var showRouteInfoContent = domConstruct.create("div", { "class": "esriCTshowRouteInfoContent" }, this.divShowReRouteContainer);
            domAttr.set(showRouteInfoContent, "innerHTML", countOfFeatures + " " + nls.appSpecific.titles.reRouteDisplayText);
            var showRouteImgContent = domConstruct.create("div", { "class": "showRouteImgContent esriCTCursorPointer" }, this.divShowReRouteContainer);
            this.own(on(showRouteImgContent, "click", lang.hitch(this, function (evt) {
                topic.publish("showProgressIndicator");
                this.countBuffer = true;
                count++;
                this.buffercount++;
                this._addBufferGeometry();
            })));
        },

        _showfeatureCountResult: function (onRouteFeaturArray, index, geometry) {
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
                    topic.publish("hideProgressIndicator");
                });
                onRouteFeaturArray.push(queryOnRouteTask);
            }
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

        _showBufferRoute: function (layer, geometries) {
            this.inforesult = true;
            var symbol = new SimpleFillSymbol(
                    SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(
                      SimpleLineSymbol.STYLE_SOLID,
                      new color([parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[0]), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[1]), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[2]), parseFloat(dojo.configData.BufferSymbology.LineSymbolTransparency.split(",")[0])]), 2
                    ),
                    new color([parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[0]), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[1]), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[2]), parseFloat(dojo.configData.BufferSymbology.FillSymbolTransparency.split(",")[0])])
                  );
            dojo.forEach(geometries, lang.hitch(this, function (geometry) {
                var graphic = new Graphic(geometry, symbol);
                var features = [];
                features.push(graphic);
                var featureSet = new FeatureSet();
                featureSet.features = features;
                layer.add(featureSet.features[0]);
            }));
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
                query.outSpatialReference = { wkid: 102100 };
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

            var backPanelInfoHeader = domConstruct.create("div", { "class": "esriCTRouteInformationBackTitle" }, this.esriCTInfoLayerFeatureList);
            var backPanel = domConstruct.create("div", { "class": "" }, backPanelInfoHeader);
            var infoBackTiteArrow = domConstruct.create("span", { "class": "infoBackTiteArrow esriCTCursorPointer" }, backPanel);
            var infoBackTite = domConstruct.create("span", { "class": "infoBackTite esriCTCursorPointer" }, backPanel);
            domAttr.set(infoBackTite, "innerHTML", nls.buttons.back);
            var resultTitle = domConstruct.create("span", {}, backPanelInfoHeader);
            var resultPanelContainer = domConstruct.create("div", { "class": "resultPanelContainer" }, this.esriCTInfoLayerFeatureList);
            this.resultPanelContents = domConstruct.create("div", { "class": "resultPanelContents" }, resultPanelContainer);
            var esriRoutesHeight = domGeom.position(query(".esriCTHeaderRouteContainer")[0]).h - query(".esriCTRouteInformationBackTitle")[0].offsetHeight - 130;
            var esriRoutesStyle = { height: esriRoutesHeight + 'px' };
            if (!this.infoPanelHeight) {
                domAttr.set(this.esriCTInfoLayerTitle, "style", esriRoutesStyle);
            }
            domStyle.set(this.esriCTInfoLayerTitle, "display", "block");
            if (dojo.featureResult) {
                domStyle.set(this.esriCTInfoLayerTitle, "display", "none");

            }
            this.infoPanelHeight = false;
            domStyle.set(backPanelInfoHeader, "display", "none");
            domStyle.set(resultPanelContainer, "display", "none");
            if (!this.esriCTrouteScrollbar && this.esriCTInfoLayerTitle.offsetHeight > 1) {
                this.esriCTrouteScrollbar = new scrollBar({ domNode: this.esriCTInfoLayerTitle });
                this.esriCTrouteScrollbar.setContent(this.esriCTInfoLayerTitleContent);
                this.esriCTrouteScrollbar.createScrollBar();
            }
            topic.publish("hideProgressIndicator");
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
                                this.own(on(infoLayerTitlePanel, "click", lang.hitch(this, function (evt) {
                                    //                                dojo.showInfo = true;
                                    domStyle.set(this.esriCTInfoLayerTitle, "display", "none");
                                    domStyle.set(this.esriCTInfoLayerFeatureList, "display", "block");
                                    dojo.featureResult = true;
                                    var esriInfoPanelHeight = domGeom.position(query(".esriCTHeaderRouteContainer")[0]).h - query(".esriCTRouteInformationBackTitle")[0].offsetHeight - 145;
                                    var esriInfoPanelStyle = { height: esriInfoPanelHeight + 'px' };
                                    domStyle.set(resultPanelContainer, "display", "block");
                                    domAttr.set(resultPanelContainer, "style", esriInfoPanelStyle);
                                    if (this.InfoPanelScrollbar) {
                                        domClass.add(this.InfoPanelScrollbar._scrollBarContent, "esriCTZeroHeight");
                                        this.InfoPanelScrollbar.removeScrollBar();
                                    }
                                    var infoTitle = domAttr.get(evt.currentTarget, "infoTitle");
                                    var layer = domAttr.get(evt.currentTarget, "layer");
                                    var selectedIndex = domAttr.get(evt.currentTarget, "index");
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