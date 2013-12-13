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
function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, domClass, domGeom, string, html, template, urlUtils, Directions, _BorderContainer, _ContentPane, scrollBar, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls) {

    //========================================================================================================================//

    return declare([_BorderContainer, _ContentPane, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        nls: nls,
        directions: null,
        esriCTRouteContent: null,
        resultsHeaderContent: null,
        esriCTRouteInformationContent: null,
        esriCTrouteScrollbar: null,

        /**
        * create route widget
        *
        * @class
        * @name widgets/route/route
        */
        postCreate: function () {
            topic.subscribe("toggleWidget", lang.hitch(this, function (widgetID) {
                if (widgetID != "route") {

                    /**
                    * divAppContainer Sharing Options Container
                    * @member {div} divAppContainer
                    * @private
                    * @memberOf widgets/route/route
                    */
                    if (html.coords(this.esriCTRouteContainer).h > 0) {
                        domClass.replace(this.domNode, "esriCTRouteImg", "esriCTRouteImg-select");
                        domClass.replace(this.esriCTRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
                        domClass.remove(query(".map .logo-med")[0], "mapLogo");
                    }
                }
            }));
            this.domNode = domConstruct.create("div", { "title": this.title, "class": "esriCTRouteImg" }, null);
            this.own(on(this.domNode, "click", lang.hitch(this, function (evt) {

                /**
                * minimize other open header panel widgets and show route
                */
                topic.publish("toggleWidget", "route");
                if (this.directions) {
                    this.directions.destroy();
                    domClass.remove(query(".map .logo-med")[0], "mapLogo");
                }
                this._showRoute(evt);

            })));

        },

        /**
        * show route page
        * @memberOf widgets/route/route
        */
        _showRoute: function () {
            var applicationRouteContainer = domConstruct.create("div", { "class": "applicationRouteContainer" }, dom.byId("esriCTParentDivContainer"));
            applicationRouteContainer.appendChild(this.applicationHeaderShareContainer);
            urlUtils.addProxyRule({
                urlPrefix: "route.arcgis.com",
                proxyUrl: "/sproxy"
            });
            this.directions = new Directions({
                map: this.map,
                routeTaskUrl: dojo.configData.RouteTaskService
            }, domConstruct.create("div", {}, this.esriCTRouteContainer));
            this.directions.startup();
            if (html.coords(this.esriCTRouteContainer).h > 1) {
                /**
                * when user clicks on share icon in header panel, close the sharing panel if it is open
                */
                domClass.remove(query(".map .logo-med")[0], "mapLogo");
                domClass.replace(this.domNode, "esriCTRouteImg", "esriCTRouteImg-select");
                domClass.replace(this.esriCTRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
            }
            else {
                /**
                * when user clicks on share icon in header panel, open the sharing panel if it is closed
                */
                domClass.replace(this.domNode, "esriCTRouteImg-select", "esriCTRouteImg");
                domClass.replace(this.esriCTRouteContainer, "esriCTShowRouteContainerHeight", "esriCTHideContainerHeight");
            }

            this.own(on(this.directions, "directions-finish", lang.hitch(this, function (evt) {
                var esriRoutesHeight = window.innerHeight - 48 - html.coords(query(".simpleDirections .esriStopsContainer")[0]).h - 77;
                var esriRoutesStyle = { height: esriRoutesHeight + 'px' };
                domAttr.set(query(".esriRoutes")[0], "style", esriRoutesStyle);
                domClass.add(query(".map .logo-med")[0], "mapLogo");
                this.esriCTRouteContent = domConstruct.create("div", { "class": "esriCTRouteContent" });
                this.esriCTRouteInformationContent = domConstruct.create("div", { "class": "esriCTRouteInformationContent" });
                domConstruct.place(this.esriCTRouteInformationContent, query(".esriRoutes")[0]);
                domAttr.set(this.esriCTRouteInformationContent, "innerHTML", nls.incidentInformationDisplayText);
                domStyle.set(this.esriCTRouteInformationContent, "display", "none");

                this.resultsHeaderContent = domConstruct.create("div", { "class": "esriResultHeaderContent" });
                domConstruct.place(this.resultsHeaderContent, query(".esriRoutesContainer")[0], "first");
                domAttr.set(this.resultsHeaderContent, "innerHTML", nls.directionsDisplayText);
                this.own(on(this.resultsHeaderContent, "click", lang.hitch(this, function () {
                    this._showDirectionTab();
                })));
                domConstruct.place(this.esriCTRouteContent, query(".esriRoutesContainer")[0], "first");
                domAttr.set(this.esriCTRouteContent, "innerHTML", nls.informationDispalyText);
                domAttr.set(query(".esriResultsPrint")[0], "innerHTML", nls.print);
                this.resultsHeaderDistanceContent = query(".esriResultsSummary")[0];
                domConstruct.place(this.resultsHeaderDistanceContent, query(".esriRoutes")[0], "first");
                this.esriCTrouteScrollbar = new scrollBar({ domNode: query(".esriRoutes")[0] });
                this.esriCTrouteScrollbar.setContent(query(".simpleDirections .esriRoutes table")[0]);
                this.esriCTrouteScrollbar.createScrollBar();
            })));
        },

        _showInformationTab: function () {
            if (domStyle.set(this.esriCTRouteInformationContent, "display", "none")) {
                domStyle.set(query(".esriRoutes table")[0], "display", "none");
                domStyle.set(this.esriCTRouteInformationContent, "display", "block");
                domStyle.set(query(".esriResultsSummary")[0], "display", "none");
                domStyle.set(query(".esriResultsButtonsContainer")[0], "display", "none");
                domClass.replace(this.resultsHeaderContent, "esriResultHeaderContent-select", "esriResultHeaderContent");
                domClass.replace(this.esriCTRouteContent, "esriCTRouteContent-select", "esriCTRouteContent");
            }
        },

        _showDirectionTab: function () {
            if (domStyle.set(query(".esriRoutes table")[0], "display", "none")) {
                domStyle.set(query(".esriRoutes table")[0], "display", "block")
                domStyle.set(this.esriCTRouteInformationContent, "display", "none")
                domStyle.set(query(".esriResultsSummary")[0], "display", "block")
                domStyle.set(query(".esriResultsButtonsContainer")[0], "display", "block")
                domClass.replace(this.resultsHeaderContent, "esriResultHeaderContent", "esriResultHeaderContent-select");
                domClass.replace(this.esriCTRouteContent, "esriCTRouteContent", "esriCTRouteContent-select");
            }
        }
    });
});