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
    "dojo/dom-geometry",
    "dojo/string",
    "dojo/_base/html",
    "dojo/text!./templates/getRoute.html",
    "esri/urlUtils",
    "esri/tasks/query",
    "esri/dijit/Directions",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "../scrollBar/scrollBar",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!nls/localizedStrings",
    "dojo/domReady!"
  ],
function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, domClass, domGeom, string, html, template, urlUtils, Query, Directions, _BorderContainer, _ContentPane, scrollBar, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls) {

    //========================================================================================================================//

    return declare([_BorderContainer, _ContentPane, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        nls: nls,
        directions: null,
        esriCTrouteScrollbar: null,
        esriCTInfoLayerFeatureList: null,

        /**
        * create route widget
        *
        * @class
        * @name widgets/route/route
        */
        postCreate: function () {
            var logoContainer = query(".map .logo-sm") && query(".map .logo-sm")[0] || query(".map .logo-med") && query(".map .logo-med")[0];
            this.imgSearchLoader.src = dojoConfig.baseURL + "/themes/images/blue-loader.gif";
            domStyle.set(this.imgSearchLoader, "display", "block");
            topic.subscribe("toggleWidget", lang.hitch(this, function (widgetID) {

                if (widgetID != "route") {

                    /**
                    * @memberOf widgets/route/route
                    */
                    if (html.coords(this.applicationHeaderRouteContainer).h > 0) {
                        domClass.replace(this.domNode, "esriCTRouteImg", "esriCTRouteImg-select");
                        domClass.replace(this.applicationHeaderRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
                        domClass.remove(logoContainer, "mapLogo");
                    }
                }
            }));
            this.domNode = domConstruct.create("div", { "title": this.title, "class": "esriCTRouteImg esriCTRouteImg-select-i" }, null);
            this._applicationHeaderRouteContainerHeight();
            if (html.coords(this.applicationHeaderRouteContainer).h > 1) {
                /**
                * when user clicks on share icon in header panel, close the sharing panel if it is open
                */
                domClass.remove(logoContainer, "mapLogo");
                domClass.replace(this.domNode, "esriCTRouteImg", "esriCTRouteImg-select");
                domClass.replace(this.applicationHeaderRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
                domClass.replace(this.esriCTRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
                domStyle.set(this.applicationHeaderRouteContainer, "display", "none");
            }
            else {
                /**
                * when user clicks on share icon in header panel, open the sharing panel if it is closed
                */
                domClass.add(logoContainer, "mapLogo");
                domClass.replace(this.domNode, "esriCTRouteImg-select", "esriCTRouteImg");
                domClass.replace(this.applicationHeaderRouteContainer, "esriCTShowRouteContainerHeight", "esriCTHideContainerHeight");
                domClass.replace(this.esriCTRouteContainer, "esriCTShowRouteContainerHeight", "esriCTHideContainerHeight");

            }
            /**
            * minimize other open header panel widgets and show route
            */

            var applicationRouteContainer = domConstruct.create("div", { "class": "applicationRouteContainer" }, dom.byId("esriCTParentDivContainer"));
            applicationRouteContainer.appendChild(this.applicationHeaderRouteContainer);
            var esriRoutesHeight = window.innerHeight - 49;
            var esriRoutesStyle = { height: esriRoutesHeight + 'px' };
            domAttr.set(this.applicationHeaderRouteContainer, "style", esriRoutesStyle);

            if (!this.esriCTRouteContainer.style.display) {
                domStyle.set(this.esriCTRouteContainer, "display", "none");
                domStyle.set(this.esriCTRouteInformationContainer, "display", "block");
            }

            this.routeHandle = this.own(on(this.domNode, "click", lang.hitch(this, function (evt) {
                topic.publish("toggleWidget", "route");

                if (html.coords(this.applicationHeaderRouteContainer).h > 1) {
                    /**
                    * when user clicks on share icon in header panel, close the sharing panel if it is open
                    */
                    domClass.remove(logoContainer, "mapLogo");
                    domClass.replace(this.domNode, "esriCTRouteImg", "esriCTRouteImg-select");
                    domClass.replace(this.applicationHeaderRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
                    domClass.replace(this.esriCTRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
                    domStyle.set(this.applicationHeaderRouteContainer, "display", "none");

                }
                else {
                    /**
                    * when user clicks on share icon in header panel, open the sharing panel if it is closed
                    */
                    domClass.add(logoContainer, "mapLogo");
                    domClass.replace(this.domNode, "esriCTRouteImg-select", "esriCTRouteImg");
                    domClass.replace(this.applicationHeaderRouteContainer, "esriCTShowRouteContainerHeight", "esriCTHideContainerHeight");
                    domClass.replace(this.esriCTRouteContainer, "esriCTShowRouteContainerHeight", "esriCTHideContainerHeight");
                }
                domClass.remove(this.domNode, "esriCTRouteImg-select-i");
                domStyle.set(this.applicationHeaderRouteContainer, "display", "block");
                if (html.coords(this.esriCTRouteContainer).h > 1) {
                    domStyle.set(this.esriCTRouteContainer, "display", "block");
                    domStyle.set(this.esriCTRouteInformationContent, "display", "none");
                }
            })));

            this._infoResult();

            domClass.add(logoContainer, "mapLogo");
            if (dojo.configData.RoutingEnabled == "true" && lang.trim(dojo.configData.RoutingEnabled).length != 0) {
                this.own(on(this.esriCTDirectionContainer, "click", lang.hitch(this, function () {
                    if (this.directions) {
                        this.directions.destroy();
                    }
                    this._showRoute();
                    this._showDirectionTab();

                })));
            }
            this.own(on(this.esriCTRouteInformationContainer, "click", lang.hitch(this, function () {
                this._showInformationTab();
            })));

        },

        _applicationHeaderRouteContainerHeight: function () {

        },

        /**
        * show route page
        * @memberOf widgets/route/route
        */
        _showRoute: function () {
            urlUtils.addProxyRule({
                urlPrefix: "route.arcgis.com",
                proxyUrl: "/sproxy"
            });
            this.directions = new Directions({
                map: this.map,
                routeTaskUrl: dojo.configData.RouteTaskService
            }, domConstruct.create("div", {}, this.esriCTRouteContainer));
            this.directions.startup();
            this.own(on(this.directions, "directions-finish", lang.hitch(this, function (evt) {
                this.esriCTrouteScrollbar = new scrollBar({ domNode: query(".esriRoutes")[0] });
                this.esriCTrouteScrollbar.setContent(query(".simpleDirections .esriRoutes table")[0]);
                this.esriCTrouteScrollbar.createScrollBar();
            })));
        },

        _showDirectionTab: function () {
            if (domStyle.set(this.esriCTRouteInformationContent, "display", "block")) {
                domStyle.set(this.esriCTRouteInformationContent, "display", "none");
                domStyle.set(this.esriCTRouteContainer, "display", "block")
                domClass.replace(this.esriCTDirectionContainer, "esriCTDirectionContainer-select", "esriCTDirectionContainer");
                domClass.replace(this.esriCTRouteInformationContainer, "esriCTRouteInformationContainer-select", "esriCTRouteInformationContainer");
            }
        },

        _showInformationTab: function () {
            if (this.esriCTRouteInformationContent.style.display == "none") {
                domStyle.set(this.esriCTRouteInformationContent, "display", "block")
                domStyle.set(this.esriCTRouteContainer, "display", "none");
                domClass.replace(this.esriCTDirectionContainer, "esriCTDirectionContainer", "esriCTDirectionContainer-select");
                domClass.replace(this.esriCTRouteInformationContainer, "esriCTRouteInformationContainer", "esriCTRouteInformationContainer-select");
            }
        },

        _infoResult: function () {

            var infoArray = [];
            var layerData = [];

            for (index = 0; index < dojo.configData.SearchAnd511Settings.length; index++) {
                if (dojo.configData.SearchAnd511Settings[index].InfoLayer == "true") {
                    layerData.push(dojo.configData.SearchAnd511Settings[index]);
                    this._locateInformationSearchResult(infoArray, index, layerData);
                }
            }
            var deferredListResult = new dojo.DeferredList(infoArray);
            var array = [];
            deferredListResult.then(lang.hitch(this, function (result) {
                if (result) {

                    for (var i = 0; i < result.length; i++)
                        array.push({
                            resultFeatures: result[i][1].features,
                            layerDetails: dojo.configData.SearchAnd511Settings[i]
                        });
                }
                this._showInfoResults(layerData, result, array);

            }));


        },

        _locateInformationSearchResult: function (infoArray, index, layerData) {
            var layerobject = dojo.configData.SearchAnd511Settings[index];
            var array = [];

            if (layerobject.QueryURL) {
                var queryTask = new esri.tasks.QueryTask(layerobject.QueryURL);
                var query = new Query();
                if (layerobject.InfoSearchExpression && layerobject.InfoSearchExpression.length != 0) {
                    query.where = layerobject.InfoSearchExpression;
                } else {
                    query.where = "1=1";
                }
                query.returnGeometry = false;
                query.outFields = ["*"];

                var QueryOverlayTask = queryTask.execute(query, lang.hitch(this, function (featureSet) {
                    var deferred = new dojo.Deferred();
                    deferred.resolve(featureSet);
                    return deferred.promise;

                }), function (err) {
                    alert("error");
                });

                infoArray.push(QueryOverlayTask);

            }

        },

        _showInfoResults: function (layerData, result, array) {
            var esriCTInfoLayerTitle = domConstruct.create("div", { "class": "esriCTInfoLayerTitle" }, this.esriCTRouteInformationContent);
            this.esriCTInfoLayerFeatureList = domConstruct.create("div", { "class": "esriCTInfoLayerFeatureList" }, this.esriCTRouteInformationContent);
            var backPanelInfoHeader = domConstruct.create("div", { "class": "esriCTRouteInformationBackTitle" }, this.esriCTInfoLayerFeatureList);
            var backPanel = domConstruct.create("div", { "class": "" }, backPanelInfoHeader);
            var infoBackTiteArrow = domConstruct.create("span", { "class": "infoBackTiteArrow esriCTCursorPointer" }, backPanel);
            var infoBackTite = domConstruct.create("span", { "class": "infoBackTite esriCTCursorPointer", "innerHTML": "Back" }, backPanel);
            var resultTitle = domConstruct.create("span", {}, backPanelInfoHeader);
            var resultPanelContainer = domConstruct.create("div", { "class": "resultPanelContainer" }, this.esriCTInfoLayerFeatureList);
            this.resultPanelContents = domConstruct.create("div", { "class": "resultPanelContents" }, resultPanelContainer);
            var esriRoutesHeight = window.innerHeight - 49 - query(".esriCTRouteInformationBackTitle")[0].offsetHeight - query(".esriCTRouteInformationContainer")[0].offsetHeight - 40;
            var esriRoutesStyle = { height: esriRoutesHeight + 'px' };
            domAttr.set(resultPanelContainer, "style", esriRoutesStyle);
            domStyle.set(backPanelInfoHeader, "display", "none");

            for (var i in dojo.configData.SearchAnd511Settings) {
                if (dojo.configData.SearchAnd511Settings[i].InfoLayer == "true") {
                    if (array.length > 0) {
                        if (dojo.configData.SearchAnd511Settings[i].SearchDisplayTitle) {
                            var infoLayerTitlePanel = domConstruct.create("div", { "infoTitle": dojo.configData.SearchAnd511Settings[i].SearchDisplayTitle, "class": "esriCTInformationLayerListContainer " }, esriCTInfoLayerTitle);
                            var esriInfoTitle = domConstruct.create("div", { "class": "esriCTInformationLayerList esriCTInformationLayerListContent esriCTCursorPointer" }, infoLayerTitlePanel);
                            var infoTitleText = domConstruct.create("div", { "class": "esriCTRouteMapName" }, esriInfoTitle);
                            domAttr.set(infoTitleText, "innerHTML", dojo.configData.SearchAnd511Settings[i].SearchDisplayTitle);
                            var infoTitleNum = domConstruct.create("div", { "class": "esriCTRouteMapNum" }, esriInfoTitle);
                            domAttr.set(infoTitleNum, "innerHTML", '(' + array[i].resultFeatures.length + ')');
                            var infoTiteArrow = domConstruct.create("div", { "class": "infoTiteArrow esriCTCursorPointer" }, esriInfoTitle);

                            this.own(on(infoLayerTitlePanel, "click", lang.hitch(this, function (evt) {
                                domStyle.set(this.imgSearchLoader, "display", "none");
                                if (this.splashScreenScrollbar) {
                                    domClass.add(this.splashScreenScrollbar._scrollBarContent, "esriCTZeroHeight");
                                    this.splashScreenScrollbar.removeScrollBar();
                                }
                                var infoTitle = domAttr.get(evt.currentTarget, "infoTitle");
                                domAttr.set(resultTitle, "innerHTML", infoTitle);
                                domStyle.set(backPanelInfoHeader, "display", "block");
                                domStyle.set(esriCTInfoLayerTitle, "display", "none");
                                domStyle.set(this.esriCTRouteInformationTitle, "display", "none");
                                this.splashScreenScrollbar = new scrollBar({ domNode: resultPanelContainer });
                                this.splashScreenScrollbar.setContent(this.resultPanelContents);
                                this.splashScreenScrollbar.createScrollBar();

                                for (var index = 0; index < array.length; index++) {
                                    if (array[index].layerDetails.SearchDisplayTitle == infoTitle) {
                                        var routeArray = [];
                                        for (var j = 0; j < array[index].resultFeatures.length; j++) {
                                            for (var x in array[index].resultFeatures[j].attributes) {
                                                if (array[index].resultFeatures[j].attributes.hasOwnProperty(x)) {
                                                    if (!array[index].resultFeatures[j].attributes[x]) {
                                                        array[index].resultFeatures[j].attributes[x] = nls.showNullValue;
                                                    }
                                                }
                                            }
                                            if (array[index].resultFeatures[j].attributes) {
                                                if (array[index].layerDetails.InfoDetailFields && array[index].layerDetails.InfoDetailFields.length != 0) {
                                                    routeArray.push({
                                                        name: string.substitute(array[index].layerDetails.InfoDetailFields, array[index].resultFeatures[j].attributes)
                                                    });
                                                }
                                                else {
                                                    routeArray.push({
                                                        name: string.substitute(array[index].layerDetails.SearchDisplayFields, array[index].resultFeatures[j].attributes)
                                                    });
                                                }
                                            }
                                        }
                                        for (var currentIndex = 0; currentIndex < routeArray.length; currentIndex++) {
                                            this._displayValidLocations(routeArray[currentIndex]);
                                        }
                                    }
                                }
                            })));
                            this.own(on(backPanel, "click", lang.hitch(this, function (evt) {
                                this.splashScreenScrollbar.removeScrollBar();
                                domStyle.set(backPanelInfoHeader, "display", "none");
                                domStyle.set(esriCTInfoLayerTitle, "display", "block");
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

        _displayValidLocations: function (arrPermits) {
            var infoPanel = domConstruct.create("div", { "class": "esriCTInformationLayerList esriCTCursorDefult" }, this.resultPanelContents);
            domAttr.set(infoPanel, "innerHTML", arrPermits.name);
        }

    });
});