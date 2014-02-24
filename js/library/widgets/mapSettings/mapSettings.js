/*global define,dojo,dojoConfig,alert,esri,window,setTimeout,clearTimeout */
/*jslint sloppy:true,nomen:true,plusplus:true,unparam:true */  //
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
    "esri/arcgis/utils",
    "dojo/dom",
    "dojo/dom-attr",
    "dojo/query",
    "dojo/dom-class",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/i18n!application/nls/localizedStrings",
    "esri/map",
    "esri/layers/ImageParameters",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/symbols/SimpleLineSymbol",
    "esri/renderers/SimpleRenderer",
    "dojo/_base/Color",
    "widgets/baseMapGallery/baseMapGallery",
    "widgets/legends/legends",
    "esri/geometry/Extent",
    "esri/dijit/HomeButton",
    "dojo/Deferred",
    "dojo/DeferredList",
    "widgets/infoWindow/infoWindow",
    "dojo/text!../infoWindow/templates/infoWindow.html",
    "dojo/topic",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "dojo/cookie",
    "dojo/_base/unload",
    "dojo/domReady!"
], function (declare, domConstruct, domStyle, lang, esriUtils, dom, domAttr, query, domClass, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, appNls, esriMap, ImageParameters, FeatureLayer, GraphicsLayer, SimpleLineSymbol, SimpleRenderer, Color, BaseMapGallery, Legends, GeometryExtent, HomeButton, Deferred, DeferredList, InfoWindow, template, topic, ArcGISDynamicMapServiceLayer, cookie, baseUnload) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

        map: null,
        templateString: template,
        tempGraphicsLayerId: "esriGraphicsLayerMapSettings",
        sharedNls: sharedNls,
        appNls: appNls,
        stagedSearch: null,
        newLeft: 0,
        infoWindowPanel: null,
        frequentRoutesLayer: "frequentRoutesLayerID",

        /**
        * initialize map object
        *
        * @class
        * @name widgets/mapSettings/mapSettings
        */
        postCreate: function () {
            var extentPoints, graphicsLayer, mapDeferred, home,
                roadLineSymbol, roadLinefillColor, roadLineRenderer, frequentRoutesLayer;


            /**
            * set map extent to default extent specified in configuration file
            * @param {string} dojo.configData.DefaultExtent Default extent of map specified in configuration file
            */
            extentPoints = dojo.configData && dojo.configData.DefaultExtent && dojo.configData.DefaultExtent.split(",");
            graphicsLayer = new GraphicsLayer();
            graphicsLayer.id = this.tempGraphicsLayerId;

            /**
            * load map
            * @param {string} dojo.configData.BaseMapLayers Basemap settings specified in configuration file
            */
            this.infoWindowPanel = new InfoWindow({ infoWindowWidth: dojo.configData.InfoPopupWidth, infoWindowHeight: dojo.configData.InfoPopupHeight });
            if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !==  0) {
                mapDeferred = esriUtils.createMap(dojo.configData.WebMapId, "esriCTParentDivContainer", {
                    mapOptions: {
                        slider: true
                    },
                    ignorePopups: true
                });
                mapDeferred.then(lang.hitch(this, function (response) {
                    var getGeometry, home2, roadLineSymbol2, roadLinefillColor2, roadLineRenderer2, frequentRoutesLayer2;

                    this.map = response.map;
                    topic.publish("setMap", this.map);
                    topic.publish("showProgressIndicator");
                    getGeometry = response.map.extent;
                    this.map.addLayer(graphicsLayer);
                    this._generateLayerURL(response.itemInfo.itemData.operationalLayers);
                    home2 = this._addHomeButton();
                    domConstruct.place(home2.domNode, query(".esriSimpleSliderIncrementButton")[0], "after");
                    home2.startup();
                    this._addLayerLegend();
                    if (dojo.configData.CustomLogoUrl && lang.trim(dojo.configData.CustomLogoUrl).length !==  0) {
                        domConstruct.create("img", { "src": dojoConfig.baseURL + dojo.configData.CustomLogoUrl, "class": "esriCTMapLogo" }, dom.byId("esriCTParentDivContainer"));
                    }
                    this.map.on("extent-change", lang.hitch(this, function () {
                        topic.publish("setMapTipPosition", dojo.selectedMapPoint, this.map, this.infoWindowPanel);
                    }));

                    roadLineSymbol2 = new SimpleLineSymbol();
                    roadLineSymbol2.setWidth(parseInt(dojo.configData.RouteSymbology.Width, 10));
                    roadLinefillColor2 = new Color([parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[0], 10), parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[1], 10), parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[2], 10), parseFloat(dojo.configData.RouteSymbology.Transparency.split(",")[0])]);
                    roadLineSymbol2.setColor(roadLinefillColor2);
                    roadLineRenderer2 = new SimpleRenderer(roadLineSymbol2);

                    frequentRoutesLayer2 = new FeatureLayer(dojo.configData.FrequentRoutesLayer.LayerURL, {
                        mode: FeatureLayer.MODE_SELECTION,
                        outFields: ["*"]
                    });
                    frequentRoutesLayer2.id = this.frequentRoutesLayer2;
                    frequentRoutesLayer2.setRenderer(roadLineRenderer2);
                    this.map.addLayer(frequentRoutesLayer2);

                    topic.publish("showInfoWindowContent", getGeometry, this.map);
                    this.map.on("extent-change", lang.hitch(this, function () {
                        topic.publish("showInfoWindowContent", getGeometry, this.map);
                    }));
                    topic.subscribe("setInfoWindowOnMap", lang.hitch(this, function (infoTitle, mobTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight, count) {
                        this._onSetInfoWindowPosition(infoTitle, mobTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight, count);
                    }));
                    topic.subscribe("hideInfoWindowOnMap", lang.hitch(this, function () {
                        this._hideInfoWindow();
                    }));
                    baseUnload.addOnWindowUnload(lang.hitch(this, function (a) {
                        this._storeCredentials(a);
                    }));
                    this.map.on("click", lang.hitch(this, function (evt) {
                        topic.publish("showProgressIndicator");
                        var _self = this;
                        this._showInfoWindowOnMap(evt.mapPoint, _self.map);
                    }));
                }));
            } else {
                this._generateLayerURL(dojo.configData.OperationalLayers);

                this.map = esriMap("esriCTParentDivContainer", {
                    basemap: dojo.configData.BaseMapLayers[0].Key
                });

                roadLineSymbol = new SimpleLineSymbol();
                roadLineSymbol.setWidth(parseInt(dojo.configData.RouteSymbology.Width, 10));
                roadLinefillColor = new Color([parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[0], 10), parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[1], 10), parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[2], 10), parseFloat(dojo.configData.RouteSymbology.Transparency.split(",")[0])]);
                roadLineSymbol.setColor(roadLinefillColor);
                roadLineRenderer = new SimpleRenderer(roadLineSymbol);

                frequentRoutesLayer = new FeatureLayer(dojo.configData.FrequentRoutesLayer.LayerURL, {
                    mode: FeatureLayer.MODE_SELECTION,
                    outFields: ["*"]
                });
                frequentRoutesLayer.id = this.frequentRoutesLayer;
                frequentRoutesLayer.setRenderer(roadLineRenderer);
                this.map.addLayer(frequentRoutesLayer);

                if (dojo.configData.CustomLogoUrl && lang.trim(dojo.configData.CustomLogoUrl).length !==  0) {
                    domConstruct.create("img", { "src": dojoConfig.baseURL + dojo.configData.CustomLogoUrl, "class": "esriCTMapLogo" }, dom.byId("esriCTParentDivContainer"));
                }
                /**
                * load esri 'Home Button' widget
                */
                home = this._addHomeButton();

                /* set position of home button widget after map is successfuly loaded
                * @param {array} dojo.configData.OperationalLayers List of operational Layers specified in configuration file
                */
                this.map.on("load", lang.hitch(this, function () {
                    var mapDefaultExtent, i, _self;

                    mapDefaultExtent = new GeometryExtent({ "xmin": parseFloat(extentPoints[0]), "ymin": parseFloat(extentPoints[1]), "xmax": parseFloat(extentPoints[2]), "ymax": parseFloat(extentPoints[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                    this.map.setExtent(mapDefaultExtent);
                    domConstruct.place(home.domNode, query(".esriSimpleSliderIncrementButton")[0], "after");
                    home.extent = mapDefaultExtent;
                    home.startup();

                    for (i in dojo.configData.OperationalLayers) {
                        if (dojo.configData.OperationalLayers.hasOwnProperty(i)) {
                            this._addOperationalLayerToMap(i, dojo.configData.OperationalLayers[i]);
                        }
                    }
                    if (dojo.configData.BaseMapLayers.length > 1) {
                        this._showBasMapGallery();
                    }
                    this.map.addLayer(graphicsLayer);
                    _self = this;
                    this.map.on("extent-change", function () {
                        topic.publish("setMapTipPosition", dojo.selectedMapPoint, _self.map, _self.infoWindowPanel);
                    });
                    this._addLayerLegend();
                }));
                topic.subscribe("setInfoWindowOnMap", lang.hitch(this, function (infoTitle, mobTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight, count) {
                    this._onSetInfoWindowPosition(infoTitle, mobTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight, count);
                    this.map.on("extent-change", lang.hitch(this, function () {
                        this.infoWindowPanel.resize(infoPopupWidth, infoPopupHeight);
                    }));
                }));
                topic.subscribe("hideInfoWindowOnMap", lang.hitch(this, function () {
                    this._hideInfoWindow();
                }));
                baseUnload.addOnWindowUnload(lang.hitch(this, function (a) {
                    this._storeCredentials(a);
                }));

                this.map.on("click", lang.hitch(this, function (evt) {
                    topic.publish("showProgressIndicator");
                    this._showInfoWindowOnMap(evt.mapPoint, this.map);
                }));
            }
        },

        _hideInfoWindow: function () {
            this.infoWindowPanel.hide();
        },

        _showInfoWindowOnMap: function (mapPoint, map) {
            var index, deferredListResult,
                onMapFeaturArray = [],
                featureArray = [];

            this.counter = 0;
            for (index = 0; index < dojo.configData.InfoWindowSettings.length; index++) {
                this._executeQueryTask(index, mapPoint, onMapFeaturArray);
            }
            deferredListResult = new DeferredList(onMapFeaturArray);
            deferredListResult.then(lang.hitch(this, function (result) {
                var j, i;

                if (result) {
                    for (j = 0; j < result.length; j++) {
                        if (result[j][1].features.length > 0) {
                            for (i = 0; i < result[j][1].features.length; i++) {
                                featureArray.push({
                                    attr: result[j][1].features[i],
                                    layerId: j,
                                    fields: result[j][1].fields
                                });
                            }
                        }
                    }
                    this._fetchQueryResults(featureArray, mapPoint, map);
                }
            }), function (err) {
                alert(err.message);
            });
        },

        _executeQueryTask: function (index, mapPoint, onMapFeaturArray) {
            var queryTask, queryLayer, queryOnRouteTask;

            queryTask = new esri.tasks.QueryTask(dojo.configData.SearchAnd511Settings[index].QueryURL);
            queryLayer = new esri.tasks.Query();
            queryLayer.outSpatialReference = this.map.spatialReference;
            queryLayer.returnGeometry = true;
            queryLayer.geometry = this._extentFromPoint(mapPoint);
            queryLayer.outFields = ["*"];
            queryOnRouteTask = queryTask.execute(queryLayer, lang.hitch(this, function (results) {
                var deferred = new Deferred();
                deferred.resolve(results);
                return deferred.promise;
            }), function (err) {
                alert(err.message);
            });
            onMapFeaturArray.push(queryOnRouteTask);

        },

        _extentFromPoint: function (point) {
            var tolerance, screenPoint, pnt1, pnt2, mapPoint1, mapPoint2;

            tolerance = 3;
            screenPoint = this.map.toScreen(point);
            pnt1 = new esri.geometry.Point(screenPoint.x - tolerance, screenPoint.y + tolerance);
            pnt2 = new esri.geometry.Point(screenPoint.x + tolerance, screenPoint.y - tolerance);
            mapPoint1 = this.map.toMap(pnt1);
            mapPoint2 = this.map.toMap(pnt2);
            return new esri.geometry.Extent(mapPoint1.x, mapPoint1.y, mapPoint2.x, mapPoint2.y, this.map.spatialReference);
        },

        _fetchQueryResults: function (featureArray, mapPoint, map) {
            var _this = this, point;

            if (featureArray.length > 0) {
                if (featureArray.length === 1) {
                    dojo.showInfo = true;
                    domClass.remove(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                    topic.publish("createInfoWindowContent", featureArray[0].attr.geometry, featureArray[0].attr.attributes, featureArray[0].fields, featureArray[0].layerId, null, null, map);
                } else {
                    this.count = 0;
                    dojo.showInfo = true;
                    domAttr.set(query(".esriCTdivInfoTotalFeatureCount")[0], "innerHTML", '/' + featureArray.length);

                    if (featureArray[this.count].attr.geometry.type === "polyline") {
                        point = featureArray[this.count].attr.geometry.getPoint(0, 0);
                        topic.publish("createInfoWindowContent", point, featureArray[0].attr.attributes, featureArray[0].fields, featureArray[0].layerId, featureArray, this.count, map);
                    } else {
                        topic.publish("createInfoWindowContent", featureArray[0].attr.geometry, featureArray[0].attr.attributes, featureArray[0].fields, featureArray[0].layerId, featureArray, this.count, map);
                    }
                    topic.publish("hideProgressIndicator");
                    query(".esriCTdivInfoRightArrow")[0].onclick = function () {
                        dojo.showInfo = true;
                        topic.publish("showProgressIndicator");
                        _this._nextInfoContent(featureArray, map);
                    };
                    query(".esriCTdivInfoLeftArrow")[0].onclick = function () {
                        dojo.showInfo = true;
                        topic.publish("showProgressIndicator");
                        _this._previousInfoContent(featureArray, map);
                    };
                }
            } else {
                alert(sharedNls.errorMessages.invalidSearch);
                topic.publish("hideProgressIndicator");
            }
        },

        _nextInfoContent: function (featureArray, map) {
            if (this.count < featureArray.length) {
                this.count++;
            }
            if (featureArray[this.count]) {
                if (featureArray[this.count].attr.geometry.type === "polyline") {
                    var point = featureArray[this.count].attr.geometry.getPoint(0, 0);
                    topic.publish("createInfoWindowContent", point, featureArray[this.count].attr.attributes, featureArray[this.count].fields, featureArray[this.count].layerId, featureArray, this.count, map);
                } else {
                    topic.publish("createInfoWindowContent", featureArray[this.count].attr.geometry, featureArray[this.count].attr.attributes, featureArray[this.count].fields, featureArray[this.count].layerId, featureArray, this.count, map);
                }
            }
        },

        _previousInfoContent: function (featureArray, map) {
            var point;

            if (this.count !==  0 && this.count < featureArray.length) {
                this.count--;
            }
            if (featureArray[this.count]) {
                if (featureArray[this.count].attr.geometry.type === "polyline") {
                    point = featureArray[this.count].attr.geometry.getPoint(0, 0);
                    topic.publish("createInfoWindowContent", point, featureArray[this.count].attr.attributes, featureArray[this.count].fields, featureArray[this.count].layerId, featureArray, this.count, map);
                } else {
                    topic.publish("createInfoWindowContent", featureArray[this.count].attr.geometry, featureArray[this.count].attr.attributes, featureArray[this.count].fields, featureArray[this.count].layerId, featureArray, this.count, map);
                }
            }
        },

        _storeCredentials: function () {
            var locatorAddress, sourceAddress, destAddress;

            locatorAddress = query(".esriCTTxtAddress")[0].value || domAttr.get(query(".esriCTTxtAddress")[0], "defaultAddress");
            if (query(".esriGeocoder").length) {
                sourceAddress = query(".esriGeocoder")[0].getElementsByTagName("input")[0].value;
                destAddress = query(".esriGeocoder")[1].getElementsByTagName("input")[0].value;
            } else {
                sourceAddress = destAddress = "";
            }
            if (this._supportsLocalStorage()) {
                // use local storage
                window.localStorage.setItem("LocatorAddress", locatorAddress);
                window.localStorage.setItem("SourceAddress", sourceAddress);
                window.localStorage.setItem("DestAddress", destAddress);
            } else {
                // use a cookie
                if (cookie.isSupported()) {
                    cookie("LocatorAddress", locatorAddress, { expires: 5 });
                    cookie("SourceAddress", sourceAddress, { expires: 5 });
                    cookie("DestAddress", destAddress, { expires: 5 });
                }
            }
        },

        _supportsLocalStorage: function () {
            try {
                return window.localStorage !== 'undefined' && window.localStorage !== null;
            } catch (e) {
                return false;
            }
        },

        _onSetInfoWindowPosition: function (infoTitle, mobTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight) {

            this.infoWindowPanel.resize(infoPopupWidth, infoPopupHeight);

            this.infoWindowPanel.hide();
            this.infoWindowPanel.setTitle(infoTitle, mobTitle);
            this.infoWindowPanel.show(divInfoDetailsTab, screenPoint);
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

        _generateLayerURL: function (operationalLayers) {
            var infoWindowSettings, searchSettings, i, str, layerTitle, layerId, index, infoIndex;

            infoWindowSettings = dojo.configData.InfoWindowSettings;
            searchSettings = dojo.configData.SearchAnd511Settings;
            for (i = 0; i < operationalLayers.length; i++) {
                if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !==  0) {
                    str = operationalLayers[i].url.split('/');
                    layerTitle = str[str.length - 3];
                    layerId = str[str.length - 1];
                    for (index = 0; index < searchSettings.length; index++) {
                        if (searchSettings[index].Title && searchSettings[index].QueryLayerId) {
                            if (layerTitle === searchSettings[index].Title && layerId === searchSettings[index].QueryLayerId) {
                                searchSettings[index].QueryURL = str.join("/");
                            }
                        }
                    }
                    for (infoIndex = 0; infoIndex < infoWindowSettings.length; infoIndex++) {
                        if (infoWindowSettings[infoIndex].Title && infoWindowSettings[infoIndex].QueryLayerId) {
                            if (layerTitle === infoWindowSettings[infoIndex].Title && layerId === infoWindowSettings[infoIndex].QueryLayerId) {
                                infoWindowSettings[infoIndex].InfoQueryURL = str.join("/");
                            }
                        }
                    }
                } else {
                    if (operationalLayers[i].ServiceURL) {
                        str = operationalLayers[i].ServiceURL.split('/');
                        layerTitle = str[str.length - 3];
                        layerId = str[str.length - 1];
                        for (index = 0; index < searchSettings.length; index++) {
                            if (searchSettings[index].Title && searchSettings[index].QueryLayerId) {
                                if (layerTitle === searchSettings[index].Title && layerId === searchSettings[index].QueryLayerId) {
                                    searchSettings[index].QueryURL = str.join("/");
                                }
                            }
                        }
                        for (infoIndex = 0; infoIndex < infoWindowSettings.length; infoIndex++) {
                            if (infoWindowSettings[infoIndex].Title && infoWindowSettings[infoIndex].QueryLayerId) {
                                if (layerTitle === infoWindowSettings[infoIndex].Title && layerId === infoWindowSettings[infoIndex].QueryLayerId) {
                                    infoWindowSettings[infoIndex].InfoQueryURL = str.join("/");
                                }
                            }
                        }
                    }
                }
            }
        },

        /**
        * load esri 'Home Button' widget which sets map extent to default extent
        * @return {object} Home button widget
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addHomeButton: function () {
            var home = new HomeButton({
                map: this.map
            }, domConstruct.create("div", {}, null));
            return home;
        },

        _showBasMapGallery: function () {
            var basMapGallery = new BaseMapGallery({
                map: this.map
            }, domConstruct.create("div", {}, null));
            return basMapGallery;
        },

        /**
        * load and add operational layers depending on their LoadAsServiceType specified in configuration file
        * @param {int} index Layer order specified in configuration file
        * @param {object} layerInfo Layer settings specified in configuration file
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addOperationalLayerToMap: function (index, layerInfo) {
            var layerMode = null, featureLayer;

            if (layerInfo.LoadAsServiceType.toLowerCase() === "feature") {

                /**
                * set layerMode of the operational layer if it's type is feature
                */
                switch (layerInfo.layermode && layerInfo.layermode.toLowerCase()) {
                case "ondemand":
                    layerMode = FeatureLayer.MODE_ONDEMAND;
                    break;
                case "selection":
                    layerMode = FeatureLayer.MODE_SELECTION;
                    break;
                default:
                    layerMode = FeatureLayer.MODE_SNAPSHOT;
                    break;
                }

                /**
                * load operational layer if it's type is feature along with its layer mode
                */
                featureLayer = new FeatureLayer(layerInfo.ServiceURL, {
                    id: index,
                    mode: layerMode,
                    outFields: ["*"],
                    displayOnPan: false
                });
                this.map.addLayer(featureLayer);
            } else if (layerInfo.LoadAsServiceType.toLowerCase() === "dynamic") {
                this._addDynamicLayerService(layerInfo);
            }
        },

        _addDynamicLayerService: function (layerInfo) {
            var str, lastIndex, layerTitle;

            clearTimeout(this.stagedSearch);
            str = layerInfo.ServiceURL.split('/');
            lastIndex = str[str.length - 1];
            if (isNaN(lastIndex) || lastIndex === "") {
                if (lastIndex === "") {
                    layerTitle = str[str.length - 3];
                } else {
                    layerTitle = str[str.length - 2];
                }
            } else {
                layerTitle = str[str.length - 3];
            }
            this.stagedSearch = setTimeout(lang.hitch(this, function () {
                this._addServiceLayers(layerTitle, layerInfo.ServiceURL);
            }), 500);
        },

        _addServiceLayers: function (layerId, layerURL) {
            var dynamicLayer, imageParams, lastIndex, dynamicLayerId;

            imageParams = new ImageParameters();
            lastIndex = layerURL.lastIndexOf('/');
            dynamicLayerId = layerURL.substr(lastIndex + 1);
            if (isNaN(dynamicLayerId) || dynamicLayerId === "") {
                if (isNaN(dynamicLayerId)) {
                    dynamicLayer = layerURL + "/";
                } else if (dynamicLayerId === "") {
                    dynamicLayer = layerURL;
                }
                this._createDynamicServiceLayer(dynamicLayer, imageParams, layerId);
            } else {
                imageParams.layerIds = [dynamicLayerId];
                dynamicLayer = layerURL.substring(0, lastIndex);
                this._createDynamicServiceLayer(dynamicLayer, imageParams, layerId);
            }
        },

        _createDynamicServiceLayer: function (dynamicLayer, imageParams, layerId) {
            var dynamicMapService = new ArcGISDynamicMapServiceLayer(dynamicLayer, {
                imageParameters: imageParams,
                id: layerId,
                visible: true
            });
            this.map.addLayer(dynamicMapService);
        },

        _addLegendBox: function () {
            this.legendObject = new Legends({
                map: this.map,
                isExtentBasedLegend: true
            }, domConstruct.create("div", {}, null));
            return this.legendObject;
        },

        _addLayerLegend: function () {
            var mapServerArray = [], i, legendObject;

            for (i in dojo.configData.OperationalLayers) {
                if (dojo.configData.OperationalLayers.hasOwnProperty(i)) {
                    if (dojo.configData.OperationalLayers[i].ServiceURL) {
                        mapServerArray.push(dojo.configData.OperationalLayers[i].ServiceURL);
                    }
                }
            }
            legendObject = this._addLegendBox();
            legendObject.startup(mapServerArray);
        },

        /**
        * return current map instance
        * @return {object} Current map instance
        * @memberOf widgets/mapSettings/mapSettings
        */
        getMapInstance: function () {
            return this.map;
        }
    });
});