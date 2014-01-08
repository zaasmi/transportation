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
    "esri/tasks/QueryTask",
    "dojo/Deferred",
    "dojo/DeferredList",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "../scrollBar/scrollBar",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!nls/localizedStrings",
    "dojo/domReady!"
  ],
function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, domClass, domGeom, string, html, template, urlUtils, Query, Directions, QueryTask, Deferred, DeferredList, _BorderContainer, _ContentPane, scrollBar, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls) {

    //========================================================================================================================//

    return declare([_BorderContainer, _ContentPane, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        nls: nls,
        directions: null,
        esriCTrouteScrollbar: null,
        esriCTInfoLayerFeatureList: null,
        logoContainer: null,
        esriCTrouteDirectionScrollbar: null,
        esriCTInfoPanelScrollbar: null,

        /**
        * create route widget
        *
        * @class
        * @name widgets/route/route
        */
        postCreate: function () {
            this.logoContainer = query(".map .logo-sm") && query(".map .logo-sm")[0] || query(".map .logo-med") && query(".map .logo-med")[0];
            domAttr.set(this.imgSearchLoader, "src", dojoConfig.baseURL + "/themes/images/blue-loader.gif");
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
            this.domNode = domConstruct.create("div", { "title": this.title, "class": "esriCTRouteImg esriCTRouteImg-select-i" }, null);
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

                if (!this.esriCTInfoPanelScrollbar && this.esriCTrouteScrollbar._containerHeight < 1) {
                    var esriPanelHeight = window.innerHeight - query(".esriCTApplicationHeader")[0].offsetHeight - 80;
                    var esriPanelStyle = { height: esriPanelHeight + 'px' };
                    domAttr.set(this.esriCTInfoLayerTitle, "style", esriPanelStyle);
                    this.esriCTInfoPanelScrollbar = new scrollBar({ domNode: this.esriCTInfoLayerTitle });
                    this.esriCTInfoPanelScrollbar.setContent(this.esriCTInfoLayerTitleContent);
                    this.esriCTInfoPanelScrollbar.createScrollBar();
                }
            })));
            this._infoResult();
            domClass.add(this.logoContainer, "mapLogo");
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

        _showHideInfoRouteContainer: function () {
            if (html.coords(this.applicationHeaderRouteContainer).h > 1) {

                /**
                * when user clicks on share icon in header panel, close the sharing panel if it is open
                */
                domClass.remove(this.logoContainer, "mapLogo");
                domClass.replace(this.domNode, "esriCTRouteImg", "esriCTRouteImg-select");
                domClass.replace(this.applicationHeaderRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
                domClass.replace(this.esriCTRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");

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

        /**
        * show route page
        * @memberOf widgets/route/route
        */
        _showRoute: function () {
            this.directions = new Directions({
                map: this.map,
                routeTaskUrl: dojo.configData.RouteTaskService
            }, domConstruct.create("div", {}, this.esriCTRouteContainer));
            this.directions.startup();

            this.own(on(this.directions, "directions-finish", lang.hitch(this, function (evt) {
                var esriRoutesHeight = window.innerHeight - query(".esriCTApplicationHeader")[0].offsetHeight - html.coords(query(".simpleDirections .esriStopsContainer")[0]).h - 117;
                var esriRoutesStyle = { height: esriRoutesHeight + 'px' };
                domAttr.set(query(".esriRoutes")[0], "style", esriRoutesStyle);
                domAttr.set(query(".esriResultsPrint")[0], "innerHTML", nls.print);

                if (!this.esriCTrouteDirectionScrollbar) {
                    this.esriCTrouteDirectionScrollbar = new scrollBar({ domNode: this.esriCTRouteContainer });
                    this.esriCTrouteDirectionScrollbar.setContent(query(".simpleDirections")[0]);
                    this.esriCTrouteDirectionScrollbar.createScrollBar();
                }
            })));

        },

        _showDirectionTab: function () {
            if (domStyle.set(this.esriCTRouteInformationContent, "display", "block")) {
                if (this.esriCTrouteDirectionScrollbar) {
                    this.esriCTrouteDirectionScrollbar.removeScrollBar();
                    this.esriCTrouteDirectionScrollbar = null;
                }
                domStyle.set(this.esriCTRouteInformationContent, "display", "none");
                domStyle.set(this.esriCTRouteContainer, "display", "block");
                domClass.replace(this.esriCTDirectionContainer, "esriCTDirectionContainer-select", "esriCTDirectionContainer");
                domClass.replace(this.esriCTRouteInformationContainer, "esriCTRouteInformationContainer-select", "esriCTRouteInformationContainer");
            }
        },

        _showInformationTab: function () {
            if (domStyle.set(this.esriCTRouteInformationContent, "display", "none")) {
                domStyle.set(this.esriCTRouteInformationContent, "display", "block");
                domStyle.set(this.esriCTRouteContainer, "display", "none");
                domClass.replace(this.esriCTDirectionContainer, "esriCTDirectionContainer", "esriCTDirectionContainer-select");
                domClass.replace(this.esriCTRouteInformationContainer, "esriCTRouteInformationContainer", "esriCTRouteInformationContainer-select");
            }
        },

        _infoResult: function () {
            var infoArray = [];
            var layerData = [];
            for (var index = 0; index < dojo.configData.SearchAnd511Settings.length; index++) {
                if (dojo.configData.SearchAnd511Settings[index].InfoLayer == "true") {
                    layerData.push(dojo.configData.SearchAnd511Settings[index]);
                    this._locateInformationSearchResult(infoArray, index);
                }
            }
            var deferredListResult = new DeferredList(infoArray);
            var arrInfoResult = [];
            deferredListResult.then(lang.hitch(this, function (result) {
                if (result) {
                    for (var i = 0; i < result.length; i++)
                        arrInfoResult.push({
                            resultFeatures: result[i][1].features,
                            layerDetails: dojo.configData.SearchAnd511Settings[i]
                        });
                }
                this._showInfoResults(result, arrInfoResult);
            }));
        },

        _locateInformationSearchResult: function (infoArray, index) {
            var layerobject = dojo.configData.SearchAnd511Settings[index];
            if (layerobject.QueryURL) {
                var queryTask = new QueryTask(layerobject.QueryURL);
                var query = new Query();
                if (layerobject.InfoSearchExpression && layerobject.InfoSearchExpression.length != 0) {
                    query.where = layerobject.InfoSearchExpression;
                } else {
                    query.where = "1=1";
                }
                query.returnGeometry = false;
                query.outFields = ["*"];

                var queryOverlayTask = queryTask.execute(query, lang.hitch(this, function (featureSet) {
                    var deferred = new Deferred();
                    deferred.resolve(featureSet);
                    return deferred.promise;
                }), function (err) {
                    alert("error");
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
            domAttr.set(infoBackTite, "innerHTML", nls.back);
            var resultTitle = domConstruct.create("span", {}, backPanelInfoHeader);
            var resultPanelContainer = domConstruct.create("div", { "class": "resultPanelContainer" }, this.esriCTInfoLayerFeatureList);
            this.resultPanelContents = domConstruct.create("div", { "class": "resultPanelContents" }, resultPanelContainer);
            query(".esriCTApplicationHeader")[0];
            var esriRoutesHeight = window.innerHeight - query(".esriCTApplicationHeader")[0].offsetHeight - query(".esriCTRouteInformationBackTitle")[0].offsetHeight - query(".esriCTRouteInformationContainer")[0].offsetHeight - 40;
            var esriRoutesStyle = { height: esriRoutesHeight + 'px' };
            domAttr.set(resultPanelContainer, "style", esriRoutesStyle);
            domStyle.set(backPanelInfoHeader, "display", "none");
            domAttr.set(this.esriCTInfoLayerTitle, "style", esriRoutesStyle);
            this.esriCTrouteScrollbar = new scrollBar({ domNode: this.esriCTInfoLayerTitle });
            this.esriCTrouteScrollbar.setContent(this.esriCTInfoLayerTitleContent);
            this.esriCTrouteScrollbar.createScrollBar();

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
                                                        arrInfoResult[index].resultFeatures[j].attributes[x] = nls.showNullValue;
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
                                            this._displayValidLocations(routeArray[currentIndex]);
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

        _displayValidLocations: function (arrSearchResult) {
            var esriInfoPanelContainer = domConstruct.create("div", { "class": "esriInfoPanelContainer" }, this.resultPanelContents);
            var infoPanel = domConstruct.create("div", { "class": "esriCTInformationLayerList esriCTCursorDefult" }, esriInfoPanelContainer);
            domAttr.set(infoPanel, "innerHTML", arrSearchResult.name);
        }
    });
});