/*global define,dojo,dojoConfig,esri,esriConfig,alert,window,setTimeout,clearTimeout,handle:true,graphicsLayerHandle:true,graphicsLayerHandleEventPadding:true,symbolEventPaddingMouseCursor:true */
/*jslint sloppy:true,nomen:true,plusplus:true,unparam:true */
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
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/dom",
    "dojo/query",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "esri/tasks/GeometryService",
    "dojo/string",
    "dojo/_base/html",
    "dojo/text!./templates/routeTemplate.html",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "dojo/Deferred",
    "dojo/DeferredList",
    "dijit/layout/BorderContainer",
    "esri/renderers/SimpleRenderer",
    "dijit/layout/ContentPane",
    "../scrollBar/scrollBar",
    "esri/graphic",
    "dojo/_base/Color",
    "dojo/aspect",
     "dojo/cookie",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/i18n!application/nls/localizedStrings",
    "esri/geometry/Polyline",
    "esri/symbols/CartographicLineSymbol",
    "esri/layers/GraphicsLayer",
    "./routeSetting"
  ],
function (declare, domConstruct, on, topic, lang, domStyle, domAttr, dom, query, domClass, domGeom, GeometryService, string, html, template, Query, QueryTask, Deferred, DeferredList, _BorderContainer, SimpleRenderer, _ContentPane, scrollBar, Graphic, Color, aspect, cookie, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, appNls, Polyline, CartographicLineSymbol, GraphicsLayer, routeSetting) {

    //========================================================================================================================//

    return declare([_BorderContainer, _ContentPane, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, routeSetting], {
        templateString: template,
        sharedNls: sharedNls,
        appNls: appNls,
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
            var bufferGeometry;
            this.snapManager = null;

            this.logoContainer = query(".map .logo-sm") && query(".map .logo-sm")[0] 
            || query(".map .logo-med") && query(".map .logo-med")[0];
            topic.subscribe("toggleWidget", lang.hitch(this, function (widgetID) {
                if (widgetID !== "route") {
                    if (widgetID !== "share") {
                        dojo.selectedDirection = false;
                    }

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
                } else if (widgetID === "route") {
                    dojo.selectedDirection = true;
                    domStyle.set(this.esriCTRouteInformationContent, "display", "block");
                }

            }));
            dojo.selectedInfo = false;
            dojo.selectedDirection = true;
            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.route, "class": "esriCTRouteImg esriCTRouteImg-select-i" }, null);

            topic.subscribe("showDirection", lang.hitch(this, function () {
                this._shareDirection();
            }));
            topic.subscribe("showfrequentRouteResult", lang.hitch(this, function (id, a, b) {
                this._showfrequentRouteResult(id, a, b);
            }));
            topic.subscribe("clearAllGraphics", lang.hitch(this, function () {
                this._clearAllGraphics();
            }));
            if (this.logoContainer) {
                domClass.add(this.logoContainer, "mapLogo");
            }
            topic.subscribe("show511InfoResult", lang.hitch(this, function (bufferGeometry) {
                this.extenChangeResult = true;
                this._executeOnload(bufferGeometry);
            }));
            /**
            * minimize other open header panel widgets and show route
            */
                setTimeout(lang.hitch(this, function () {
                    this.map.setExtent(this.map.extent);
                }), 1000);
            if (window.location.toString().split("$selectedDirection=")[1] === "true" || window.location.toString().split("$point=").length <= 1) {
                this._showHideInfoRouteContainer();
                this.applicationRouteContainer = domConstruct.create("div", { "class": "applicationRouteContainer" }, dom.byId("esriCTParentDivContainer"));
                this.applicationRouteContainer.appendChild(this.applicationHeaderRouteContainer);
                domStyle.set(this.esriCTRouteContainer, "display", "none");
                domStyle.set(this.esriCTRouteInformationContainer, "display", "block");
                domStyle.set(this.esriCTRouteInformationContent, "display", "block");
                if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                    topic.subscribe("showInfoWindowContent", lang.hitch(this, function (bufferGeometry) {
                        this._showInfoWindowContent(bufferGeometry);
                    }));
                } 
            } else if (this.logoContainer) {
                domClass.remove(this.logoContainer, "mapLogo");
            }

            if (window.location.toString().split("$stops=").length > 1) {
                setTimeout(lang.hitch(this, function () {
                    var stops, stopsArray;
                    this._shareDirection();
                    stops = window.location.toString().split("$stops=")[1].split("$")[0];
                    stops = stops.replace(/%20/g, " ");
                    stopsArray = stops.split("^");
                    this._esriDirectionsWidget.updateStops(stopsArray).then(lang.hitch(this, function () {
                        this._esriDirectionsWidget.getDirections();
                    }));
                }), 2000);
            }
            handle = new Graphic();
            graphicsLayerHandle = new GraphicsLayer();
            this.routeHandle = this.own(on(this.domNode, "click", lang.hitch(this, function () {
                topic.publish("toggleWidget", "route");
                if (dojo.window.getBox().w <= 680) {
                    this._showHideInfoRouteContainer();
                }
                domClass.remove(this.domNode, "esriCTRouteImg-select-i");
                domStyle.set(this.applicationHeaderRouteContainer, "display", "block");
                if (html.coords(this.esriCTRouteContainer).h > 1) {
                    domStyle.set(this.esriCTRouteContainer, "display", "block");
                    domStyle.set(this.esriCTRouteInformationContent, "display", "none");
                }
                if (dojo.window.getBox().w >= 680) {
                    this._showHideInfoRouteContainer();
                }
                if (domStyle.get(this.esriCTRouteInformationContent, "display") === "block") {
                    if (this.showInfoRouteContainer) {
                        this._showInfoResultsPanel(bufferGeometry);
                    }
                }
            })));

            this._showWidgetContainer(bufferGeometry);
            this._activate();
        },

        _executeOnload: function (bufferGeometry) {
                this.map.on("extent-change", lang.hitch(this, function (evt) {
                    bufferGeometry = evt.extent;
                    if (this.extenChangeResult) {
                        this._showInfoWindowContent(bufferGeometry);
                    }
                    graphicsHandleEvent.spatialReference = this.map.extent.spatialReference;
                }));
                aspect.after(this.map.on("extent-change", lang.hitch(this, function () {
                    if (window.location.toString().split("$frequentRouteId=").length > 1 || window.location.toString().split("$selectedInfo=")[1] === "true") {
                        dojo.share = true;
                        topic.publish("showDirection");
                    }
                })));
        },

        _showWidgetContainer: function (bufferGeometry) {
            if (dojo.configData.RoutingEnabled === "true" && lang.trim(dojo.configData.RoutingEnabled).length !== 0) {
                this.own(on(this.esriCTDirectionContainer, "click", lang.hitch(this, function () {
                    this._shareDirection();
                })));
            }
            else {
                domStyle.set(this.esriCTDirectionContainer, "cursor", "default");
            }
            this.own(on(this.esriCTRouteInformationContainer, "click", lang.hitch(this, function () {
                this._showInformationTab(bufferGeometry);
            })));
        },

        _shareDirection: function () {
            dojo.selectedDirection = true;
            dojo.selectedInfo = true;
            this.showRoute();
            if (!query(".esriRoutes")[0]) {
                if (dojo.configData.FrequentRoutesLayer.FrequentRoutesEnabled === "true" && lang.trim(dojo.configData.FrequentRoutesLayer.FrequentRoutesEnabled).length !== 0) {
                    if (!this.divFrequentRouteContainer) {
                        topic.publish("showProgressIndicator");
                        domStyle.set(this.routeLoader, "display", "block");
                        this._showFrequentRoutes();
                        this._showFrequentRoutesPanel();
                    }
                }
            }
            this._showDirectionTab();
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
            this.extenChangeResult = false;
            if (domStyle.get(this.esriCTRouteInformationContent, "display") === "block") {
                if (dojo.window.getBox().w <= 680) {
                    if (this.esriCTRouteInformationContent.offsetHeight > 1 && !dojo.showInfo) {
                        this._showInfoResultsPanel(bufferGeometry);
                    }
                } else if (!dojo.featureResult && !dojo.showInfo) {
                    this._showInfoResultsPanel(bufferGeometry);
                }
            }
        },

        _showInfoResultsPanel: function (bufferGeometry) {
            if (!this.inforesult || this.map.getLayer("frequentRoutesLayerID").graphics.length <= 0) {
                if (this.map.getLayer("esriGraphicsLayerMapSettings").graphics.length <= 0) {
                    topic.publish("showProgressIndicator");
                    dojo.showIndicator = true;
                    this.extenChangeResult = false;
                    domAttr.set(this.esriCTRouteInformationTitle, "innerHTML", sharedNls.titles.informationPanelTitle);
                    this._infoResult(bufferGeometry);
                }
            }
        },

        _showFrequentRoutesPanel: function () {
            this.divFrequentRouteContainerButton = domConstruct.create("div", { "class": "esriCTFrequentRouteContainerButton" });
            domConstruct.place(this.divFrequentRouteContainerButton, query(".esriStopsContainer")[0], "after");
            this.divapplicationFrequentRoutes = domConstruct.create("div", { "class": "esriCTcontainerButtonHtml " }, this.divFrequentRouteContainerButton);
            this.containerButtonHtml = domConstruct.create("div", { "class": "esriCTFTRHeader esriCTCursorPointer" }, this.divapplicationFrequentRoutes);
            domAttr.set(this.containerButtonHtml, "innerHTML", sharedNls.titles.frequentRoute);
            this.routeTopTiteArrow = domConstruct.create("div", { "class": "esriCTrouteUpTitleArrow esriCTCursorPointer" }, this.divapplicationFrequentRoutes);
        },

        _showHideInfoRouteContainer: function () {
            if (html.coords(this.applicationHeaderRouteContainer).h > 1) {
                this.showInfoRouteContainer = false;
                dojo.showIndicator = false;
                dojo.showInfo = true;
                dojo.featureResult = true;
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
                this.showInfoRouteContainer = true;
                dojo.showInfo = false;
                dojo.featureResult = false;
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
            if (domStyle.get(this.esriCTRouteInformationContent, "display") === "block") {
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
            dojo.selectedInfo = false;
            if (domStyle.get(this.esriCTRouteInformationContent, "display") === "none") {
                if (this.divFrequentRouteContainerButton) {
                    domStyle.set(this.divFrequentRouteContainerButton, "display", "none");
                }
                domStyle.set(this.esriCTRouteInformationContent, "display", "block");
                domStyle.set(this.esriCTRouteContainer, "display", "none");
                domClass.replace(this.esriCTDirectionContainer, "esriCTDirectionContainer", "esriCTDirectionContainer-select");
                domClass.replace(this.esriCTRouteInformationContainer, "esriCTRouteInformationContainer", "esriCTRouteInformationContainer-select");
                this.infoPanelHeight = true;
                if (domStyle.get(this.esriCTInfoLayerFeatureList, "display") === "block") {
                    dojo.featureResult = false;
                    domStyle.set(this.esriCTInfoLayerFeatureList, "display", "none");
                    domStyle.set(this.esriCTRouteInformationTitle, "display", "block");
                    domStyle.set(this.esriCTInfoLayerTitle, "display", "block");
                }
                this._showInfoResultsPanel(bufferGeometry);
            }
        },

        _showFrequentRoutes: function () {
            var featuresetResult = [], defffeaturesetResult = [], routeId, queryTask,
            queryLayer, queryOnRouteTask, deferred, deferredListResult, arrayResult, i;
             queryTask = new QueryTask(dojo.configData.FrequentRoutesLayer.LayerURL);
             queryLayer = new Query();
             queryLayer.where = "1=1";
             queryLayer.returnGeometry = false;
             queryLayer.outSpatialReference = { wkid: this.map.spatialReference.wkid };
           
            dojo.configData.FrequentRoutesLayer.UniqueRouteField.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function (match, key) {
                routeId = key;
            });
            queryLayer.orderByFields = [routeId];
            queryLayer.outFields = ["*"];
            queryOnRouteTask = queryTask.execute(queryLayer, lang.hitch(this, function (featureSet) {
                 deferred = new Deferred();
                deferred.resolve(featureSet);
                return deferred.promise;
            }), function (err) {
                alert(err.message);
                topic.publish("hideProgressIndicator");
            });
            defffeaturesetResult.push(queryOnRouteTask);
             deferredListResult = new DeferredList(defffeaturesetResult);
            deferredListResult.then(lang.hitch(this, function (result) {
                if (result) {
                    if (result[0][1].features.length > 0) {
                        for ( arrayResult = 0; arrayResult < result[0][1].features.length; arrayResult++) {
                            for ( i in result[0][1].features[arrayResult].attributes) {
                                if (result[0][1].features[arrayResult].attributes.hasOwnProperty(i)) {
                                    if (!result[0][1].features[arrayResult].attributes[i]) {
                                        result[0][1].features[arrayResult].attributes[i] = sharedNls.showNullValue;
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
                topic.publish("hideProgressIndicator");
            }), function (err) {
                alert(err.message);
                topic.publish("hideProgressIndicator");
            });
        },

        _frequentRoutesResult: function (featuresetResult) {
            var esriRoutesHeight, esriRoutesStyle, i, j, frequentRouteId, frequentRouteName;
            this.divFrequentRoutePanel = domConstruct.create("div", { "class": "esriCTdivFrequentRoutePanel" });
            domConstruct.place(this.divFrequentRoutePanel, query(".esriRoutesContainer")[0], "after");
            this.divFrequentRouteContainer = domConstruct.create("div", { "class": "esriCTFrequentRouteContainer" }, this.divFrequentRoutePanel);
            this.divFrequentRouteContainerScroll = domConstruct.create("div", { "class": "esriCTFrequentRouteContainerScroll" }, this.divFrequentRouteContainer);
             esriRoutesHeight = window.innerHeight - query(".esriCTApplicationHeader")[0].offsetHeight - html.coords(query(".simpleDirections .esriStopsContainer")[0]).h - 94;
             esriRoutesStyle = { height: esriRoutesHeight + 'px' };
            domAttr.set(this.divFrequentRouteContainer, "style", esriRoutesStyle);
            if (!this.esriCTrouteDirectionScrollbar) {
                this.esriCTrouteDirectionScrollbar = new scrollBar({ domNode: this.esriCTRouteContainer });
                this.esriCTrouteDirectionScrollbar.setContent(query(".simpleDirections")[0]);
                this.esriCTrouteDirectionScrollbar.createScrollBar();
            }
            for ( i = 0; i < featuresetResult.length; i++) {
                this._displayFrequentRouteResult(featuresetResult[i]);
            }
            if (dojo.share) {
                if (window.location.toString().split("$frequentRouteId=").length > 1) {
                    if (window.location.toString().split("$frequentRouteId=")[1].split("$selectedDirection=")[1].length > 1 && window.location.toString().split("$frequentRouteId=")[1].split("$selectedDirection=")[1] === "true") {
                         frequentRouteId = window.location.toString().split("$frequentRouteId=")[1].split("$selectedDirection=")[0];
                        for ( j = 0; j < featuresetResult.length; j++) {
                            if (frequentRouteId === featuresetResult[j].routeId) {
                                 frequentRouteName = featuresetResult[j].name;
                            }
                        }
                        topic.publish("showfrequentRouteResult", frequentRouteId, frequentRouteName);
                    }
                }
            }
            domStyle.set(this.routeLoader, "display", "none");
        },

        _displayFrequentRouteResult: function (featuresetRouteResult) {
            var divFrequentRouteContent, divFrequentRoutePanelContainer, _this = this, divFrequentRouteList, id;
             divFrequentRoutePanelContainer = domConstruct.create("div", { "class": " esriInfoPanelContainer " }, this.divFrequentRouteContainerScroll);
             divFrequentRouteContent = domConstruct.create("div", { "class": " esriCTInformationLayerList esriCTCursorPointer " }, divFrequentRoutePanelContainer);
             divFrequentRouteList = domConstruct.create("div", { "class": "esriCTinfoPanelContentList" }, divFrequentRouteContent);
            domAttr.set(divFrequentRouteList, "innerHTML", featuresetRouteResult.name);
            domAttr.set(divFrequentRouteList, "routeId", featuresetRouteResult.routeId);
            divFrequentRouteList.onclick = function () {
                topic.publish("showProgressIndicator");
                _this._clearAllGraphics();
                id = domAttr.get(divFrequentRouteList, "routeId");
                _this._showfrequentRouteResult(id, featuresetRouteResult, divFrequentRouteList);
            };
        },

        _showfrequentRouteResult: function (id, featuresetRouteResult, divFrequentRouteList) {
            var routeId, _this = this, queryResult;
            dojo.configData.FrequentRoutesLayer.UniqueRouteField.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function (match, key) {
                routeId = key;
            });
            dojo.frequentRouteId = id;
             queryResult = new Query();
            queryResult.where = routeId + "=" + id;

            if (!dojo.share) {
                dojo.frequentRouteName = featuresetRouteResult.name;
                var frequentRouteName = domAttr.get(divFrequentRouteList, "innerHTML", featuresetRouteResult.name);
            }
            _this.map.getLayer("frequentRoutesLayerID").selectFeatures(queryResult, esri.layers.FeatureLayer.SELECTION_NEW, lang.hitch(this, function (features) {
                if (!dojo.share) {
                    _this._showFrequentRouteOnMap(features[0].geometry, frequentRouteName);
                }
                else {
                    _this._showFrequentRouteOnMap(features[0].geometry, featuresetRouteResult);
                }
            }), function (err) {
                alert(err.message);
                topic.publish("hideProgressIndicator");
            });
        },

        _showFrequentRouteOnMap: function (featureGeometry, frequentRouteName) {
            var polyLine, routeSegments, roadArray = [], j; 
             polyLine = new Polyline(this.map.spatialReference);
             routeSegments = this.map.getLayer("frequentRoutesLayerID").graphics.length;
            if (0 < routeSegments) {
                for (j = 0; j < routeSegments; j++) {
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
            var geometryServiceUrl, geometryService;
            if (this._esriDirectionsWidget) {
                this.esriRoute = true;
                this._emptyPersistRouteAddress();
                domConstruct.empty(query(".esriRoutesContainer")[0]);
            }
            this.inforesult = true;
             geometryServiceUrl = dojo.configData.GeometryService;
             geometryService = new GeometryService(geometryServiceUrl);
            this.executeBufferQuery(featureGeometry, geometryService, this.map.getLayer("frequentRoutesLayerID"), frequentRouteName);
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
            var graphicsLength, graphicsBufferLength;
             graphicsLength = this.map.getLayer("esriGraphicsLayerMapSettings").graphics.length;
             graphicsBufferLength = this.map.getLayer("frequentRoutesLayerID").graphics.length;
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
            var infoArray = [], layerData = [], graphicsBufferLength, index, arrInfoResult = [],
            infoArrayResult, deferredListResult;

            this.extenChangeResult = false;
             graphicsBufferLength = this.map.getLayer("frequentRoutesLayerID").graphics.length;
            if (graphicsBufferLength > 0) {
                topic.publish("hideInfoWindowOnMap");
                this.infoPanelHeight = true;
            }
            if (this.esriCTInfoLayerTitle) {
                domConstruct.destroy(this.esriCTInfoLayerTitle, this.esriCTRouteInformationContent, "first");
                domConstruct.destroy(this.esriCTInfoLayerTitle);
            }
           
            for ( index = 0; index < dojo.configData.SearchAnd511Settings.length; index++) {
                if (dojo.configData.SearchAnd511Settings[index].InfoLayer === "true") {
                    layerData.push(dojo.configData.SearchAnd511Settings[index]);
                    this._locateInformationSearchResult(infoArray, index, geometry, layerData);
                }
            }
             deferredListResult = new DeferredList(infoArray);
            deferredListResult.then(lang.hitch(this, function (result) {
                if (result) {
                    for (infoArrayResult = 0; infoArrayResult < result.length; infoArrayResult++) {
                        if (result[infoArrayResult][1].features) {
                            this.extenChangeResult = false;
                            arrInfoResult.push({
                                resultFeatures: result[infoArrayResult][1].features,
                                resultFields: result[infoArrayResult][1].fields,
                                layerDetails: layerData[infoArrayResult]
                            });
                        }
                    }
                }
                this._showInfoResults(result, arrInfoResult, geometry);
            }));
        },

        _locateInformationSearchResult: function (infoArray, index, geometry) {
            var layerobject = dojo.configData.SearchAnd511Settings[index], queryLayer, queryTask, queryOverlayTask, deferred;
            if (layerobject.QueryURL) {
                 queryTask = new QueryTask(layerobject.QueryURL);
                 queryLayer = new Query();
                if (layerobject.InfoSearchExpression && layerobject.InfoSearchExpression.length !== 0) {
                    queryLayer.where = layerobject.InfoSearchExpression;
                } else {
                    queryLayer.where = "1=1";
                }
                queryLayer.outSpatialReference = { wkid: this.map.spatialReference.wkid };
                queryLayer.returnGeometry = false;
                queryLayer.outFields = ["*"];
                queryLayer.geometry = geometry;
                queryLayer.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
                 queryOverlayTask = queryTask.execute(queryLayer, lang.hitch(this, function (featureSet) {
                    this.extenChangeResult = false;
                     deferred = new Deferred();
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
            var backPanelInfoHeader, backPanel, infoBackTite, resultTitle, resultPanelContainer, esriRoutesHeight, esriRoutesStyle;
            this.esriCTInfoLayerTitle = domConstruct.create("div", { "class": "esriCTInfoLayerTitle" }, this.esriCTRouteInformationContent);
            this.esriCTInfoLayerTitleContent = domConstruct.create("div", { "class": "esriCTInfoLayerTitleContent" }, this.esriCTInfoLayerTitle);
            this.esriCTInfoLayerFeatureList = domConstruct.create("div", { "class": "esriCTInfoLayerFeatureList" }, this.esriCTRouteInformationContent);
             backPanelInfoHeader = domConstruct.create("div", { "class": "" }, this.esriCTInfoLayerFeatureList);
             backPanel = domConstruct.create("div", { "class": "esriCTRouteInformationBackTitle" }, backPanelInfoHeader);
            domConstruct.create("span", { "class": "infoBackTiteArrow esriCTCursorPointer" }, backPanel);
             infoBackTite = domConstruct.create("span", { "class": "infoBackTite esriCTCursorPointer" }, backPanel);
            domAttr.set(infoBackTite, "innerHTML", sharedNls.buttons.back);
             resultTitle = domConstruct.create("div", { "class": "esriCTRouteInformation511ttile" }, backPanelInfoHeader);
             resultPanelContainer = domConstruct.create("div", { "class": "resultPanelContainer" }, this.esriCTInfoLayerFeatureList);
            this.resultPanelContents = domConstruct.create("div", { "class": "resultPanelContents" }, resultPanelContainer);
             esriRoutesHeight = domGeom.position(query(".esriCTHeaderRouteContainer")[0]).h - query(".esriCTRouteInformationBackTitle")[0].offsetHeight - 130;
             esriRoutesStyle = { height: esriRoutesHeight + 'px' };
            if (!this.infoPanelHeight) {
                domAttr.set(this.esriCTInfoLayerTitle, "style", esriRoutesStyle);
            }
            domStyle.set(this.esriCTInfoLayerTitle, "display", "block");
            domStyle.set(this.esriCTInfoLayerFeatureList, "display", "none");
            this.infoPanelHeight = false;
            domStyle.set(backPanelInfoHeader, "display", "none");
            domStyle.set(resultPanelContainer, "display", "none");
            if (this.esriCTrouteScrollbar) {
                this.esriCTrouteScrollbar.removeScrollBar && this.esriCTrouteScrollbar.removeScrollBar();
                this.esriCTrouteScrollbar = null;
            }
            if (!this.esriCTrouteScrollbar) {
                if (this.esriCTInfoLayerTitle.offsetHeight > 1) {
                    this.esriCTrouteScrollbar = new scrollBar({ domNode: this.esriCTInfoLayerTitle });
                    this.esriCTrouteScrollbar.setContent(this.esriCTInfoLayerTitleContent);
                    this.esriCTrouteScrollbar.createScrollBar();
                }
            }
            topic.publish("hideProgressIndicator");
            this._showInfoResultsList(arrInfoResult, backPanel, resultPanelContainer, backPanelInfoHeader, resultTitle, geometry);
            this.extenChangeResult = true;
        },

        _showInfoResultsList: function (arrInfoResult, backPanel, resultPanelContainer, backPanelInfoHeader, resultTitle, geometry) {
            var i, infoLayerTitlePanel, esriInfoPanelContainer, esriInfoTitle, infoTitleText, infoTitleNum;
            for (i = 0; i < arrInfoResult.length; i++) {
                if (arrInfoResult[i].layerDetails.SearchDisplayTitle) {
                     infoLayerTitlePanel = domConstruct.create("div", { "infoTitle": arrInfoResult[i].layerDetails.SearchDisplayTitle, "class": "esriCTInformationLayerListContainer " }, this.esriCTInfoLayerTitleContent);
                    domAttr.set(infoLayerTitlePanel, "layer", arrInfoResult[i].layerDetails.QueryURL);
                    domAttr.set(infoLayerTitlePanel, "index", arrInfoResult[i].layerDetails.QueryLayerId);
                     esriInfoPanelContainer = domConstruct.create("div", { "class": "esriInfoPanelContainer esriCTCursorPointer" }, infoLayerTitlePanel);
                     esriInfoTitle = domConstruct.create("div", { "class": "esriCTInformationLayerList esriCTInformationLayerListContent esriCTCursorPointer" }, esriInfoPanelContainer);
                     infoTitleText = domConstruct.create("div", { "class": "esriCTRouteMapName" }, esriInfoTitle);
                    domAttr.set(infoTitleText, "innerHTML", arrInfoResult[i].layerDetails.SearchDisplayTitle);
                     infoTitleNum = domConstruct.create("div", { "class": "esriCTRouteMapNum" }, esriInfoTitle);
                    domAttr.set(infoTitleNum, "innerHTML", '(' + arrInfoResult[i].resultFeatures.length + ')');
                    domConstruct.create("div", { "class": "infoTitleArrow esriCTCursorPointer" }, esriInfoTitle);
                    domStyle.set(this.esriCTInfoLayerFeatureList, "display", "none");
                    if (arrInfoResult[i].resultFeatures.length > 0) {
                        this.own(on(infoLayerTitlePanel, "click", lang.hitch(this, function (event) {
                            this._showLayerListPanel(arrInfoResult, event, resultTitle, resultPanelContainer, backPanelInfoHeader, geometry);
                        })));
                    } else {
                        domStyle.set(esriInfoTitle, "cursor", "default");
                    }
                    this.own(on(backPanel, "click", lang.hitch(this, function () {
                        this.extenChangeResult = true;
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
        },

        _showLayerListPanel: function (arrInfoResult, event, resultTitle, resultPanelContainer, backPanelInfoHeader, geometry) {
            var routeArray = [], esriInfoPanelHeight, esriInfoPanelStyle, infoTitle, layer, selectedIndex, index, j, x, currentIndex;
            domStyle.set(this.esriCTInfoLayerTitle, "display", "none");
            domStyle.set(this.esriCTInfoLayerFeatureList, "display", "block");
            dojo.featureResult = true;
             esriInfoPanelHeight = domGeom.position(query(".esriCTHeaderRouteContainer")[0]).h - query(".esriCTRouteInformationBackTitle")[0].offsetHeight - 153;
             esriInfoPanelStyle = { height: esriInfoPanelHeight + 'px' };
            domStyle.set(resultPanelContainer, "display", "block");
            domAttr.set(resultPanelContainer, "style", esriInfoPanelStyle);
            if (this.InfoPanelScrollbar) {
                domClass.add(this.InfoPanelScrollbar._scrollBarContent, "esriCTZeroHeight");
                this.InfoPanelScrollbar.removeScrollBar();
            }
             infoTitle = domAttr.get(event.currentTarget, "infoTitle");
             layer = domAttr.get(event.currentTarget, "layer");
             selectedIndex = domAttr.get(event.currentTarget, "index");
            domAttr.set(resultTitle, "innerHTML", infoTitle);
            domStyle.set(backPanelInfoHeader, "display", "block");
            domStyle.set(this.esriCTRouteInformationTitle, "display", "none");
            this.InfoPanelScrollbar = new scrollBar({ domNode: resultPanelContainer });
            this.InfoPanelScrollbar.setContent(this.resultPanelContents);
            this.InfoPanelScrollbar.createScrollBar();
            for (index = 0; index < arrInfoResult.length; index++) {
                if (arrInfoResult[index].layerDetails.SearchDisplayTitle === infoTitle) {
                    for (j = 0; j < arrInfoResult[index].resultFeatures.length; j++) {
                        for (x in arrInfoResult[index].resultFeatures[j].attributes) {
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
                            } else {
                                routeArray.push({
                                    name: string.substitute(arrInfoResult[index].layerDetails.SearchDisplayFields, arrInfoResult[index].resultFeatures[j].attributes)
                                });
                            }
                        }
                    }
                    for ( currentIndex = 0; currentIndex < routeArray.length; currentIndex++) {
                        this._displayInfoPanelResult(routeArray[currentIndex], layer, arrInfoResult[index], currentIndex, selectedIndex, geometry);
                    }
                }
            }
        },

        _displayInfoPanelResult: function (arrSearchResult, selectedLayer, featureset, currentIndex, selectedIndex, geometry) {
            var esriInfoPanelContainer, infoPanel, infoPanelContent, i;
             esriInfoPanelContainer = domConstruct.create("div", { "class": "esriInfoPanelContainer" }, this.resultPanelContents);
             infoPanel = domConstruct.create("div", { "class": "esriCTInformationLayerList" }, esriInfoPanelContainer);
             infoPanelContent = domConstruct.create("div", { "class": "esriCTinfoPanelContentList" }, infoPanel);
            domAttr.set(infoPanelContent, "innerHTML", arrSearchResult.name);
            domAttr.set(infoPanelContent, "currentLayer", selectedLayer);
            this.selectedIndex = selectedIndex;
            for ( i = 0; i < featureset.resultFields.length; i++) {
                if (featureset.resultFields[i].type == "esriFieldTypeOID") {
                    this.objID = featureset.resultFields[i].name;
                    break;
                }
            }
            domAttr.set(infoPanelContent, "selectedFeatureID", featureset.resultFeatures[currentIndex].attributes[this.objID]);
            this.own(on(infoPanelContent, "click", lang.hitch(this, function () {
                var map, currentLayer, selectedFeature, queryTask, queryLayer, geometryPaths, j, point;
                dojo.showIndicator = false;
                dojo.openInfowindow = false;
                dojo.setMapTipPosition = false;
                 map = this.map;
                if (dojo.window.getBox().w <= 640) {
                    domStyle.set(this.applicationHeaderRouteContainer, "display", "none");
                    domClass.replace(this.domNode, "esriCTRouteImg", "esriCTRouteImg-select");
                }
                this.inforesult = true;
                topic.publish("showProgressIndicator");
                 currentLayer = domAttr.get(infoPanelContent, "currentLayer");
                 selectedFeature = domAttr.get(infoPanelContent, "selectedFeatureID");
                 queryTask = new QueryTask(currentLayer);
                 queryLayer = new Query();
                 queryLayer.where = this.objID + "=" + selectedFeature;
                 queryLayer.outSpatialReference = this.map.spatialReference;
                 queryLayer.returnGeometry = true;
                 queryLayer.maxAllowableOffset = 100;
                 queryLayer.outFields = ["*"];
                 queryTask.execute(queryLayer, lang.hitch(this, function (featureSet) {
                    if (featureSet.features[0].geometry.type === "point") {
                        topic.publish("createInfoWindowContent", featureSet.features[0].geometry, featureSet.features[0].attributes, featureSet.fields, this.selectedIndex, null, null, map);
                    } else if (featureSet.features[0].geometry.type == "polyline") {
                         geometryPaths = featureSet.features[0].geometry.paths;
                        for ( i = 0; i < geometryPaths.length; i++) {
                            for ( j = 0; j < geometryPaths[i].length; j++) {
                                 point = featureSet.features[0].geometry.getPoint(i, j);
                                if (geometry.contains(point)) {
                                    topic.publish("createInfoWindowContent", point, featureSet.features[0].attributes, featureSet.fields, this.selectedIndex, null, null, map);
                                    return;
                                }
                            }
                        }
                    }
                }), function (err) {
                    alert(err.message);
                    topic.publish("hideProgressIndicator");
                });
            })));
        }
    });
});