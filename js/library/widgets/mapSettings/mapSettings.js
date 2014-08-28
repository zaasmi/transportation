/*global define,dojo,dojoConfig,alert,esri */
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
    "esri/arcgis/utils",
    "dojo/dom",
    "dojo/dom-attr",
    "dojo/query",
    "dojo/dom-class",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
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
    "esri/geometry/Point",
    "dojo/_base/array",
    "dojo/aspect",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/OpenStreetMapLayer",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "dojo/cookie",
    "dojo/_base/unload",
    "dojo/domReady!"
], function (declare, domConstruct, domStyle, lang, esriUtils, dom, domAttr, query, domClass, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, esriMap, ImageParameters, FeatureLayer, GraphicsLayer, SimpleLineSymbol, SimpleRenderer, Color, BaseMapGallery, Legends, GeometryExtent, HomeButton, Deferred, DeferredList, InfoWindow, template, topic, Point, array, aspect, ArcGISDynamicMapServiceLayer, OpenStreetMapLayer, ArcGISTiledMapServiceLayer, cookie, baseUnload) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        map: null,
        templateString: template,
        tempGraphicsLayerId: "esriGraphicsLayerMapSettings",
        locaterGraphicsLayerId: "esrilocaterGraphicsLayer",
        routeGraphicsLayerId: "esriRouteGraphicsLayerMapSettings",
        sharedNls: sharedNls,
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

            /**
            * set map extent to default extent specified in configuration file
            * @param {string} dojo.configData.DefaultExtent Default extent of map specified in configuration file
            */
            var extentPoints, graphicsLayer, routeGraphicsLayer, mapDeferred, layer, geometry, locaterGraphicsLayer, i;
            extentPoints = dojo.configData && dojo.configData.DefaultExtent && dojo.configData.DefaultExtent.split(",");
            graphicsLayer = new GraphicsLayer();
            graphicsLayer.id = this.tempGraphicsLayerId;
            routeGraphicsLayer = new GraphicsLayer();
            routeGraphicsLayer.id = this.routeGraphicsLayerId;
            locaterGraphicsLayer = new GraphicsLayer();
            locaterGraphicsLayer.id = this.locaterGraphicsLayerId;
            this.sharePoint = false;
            topic.subscribe("locateAddressOnMap", lang.hitch(this, function (mapPoint) {
                this._addPushpinOnMap(mapPoint);
            }));

            topic.subscribe("setMapTipPosition", lang.hitch(this, function (selectedPoint) {
                this._onSetMapTipPosition(selectedPoint);
            }));
            /**
            * load map
            * @param {string} dojo.configData.BaseMapLayers Basemap settings specified in configuration file
            */
            this.infoWindowPanel = new InfoWindow({ infoWindowWidth: dojo.configData.InfoPopupWidth, infoWindowHeight: dojo.configData.InfoPopupHeight });
            if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                mapDeferred = esriUtils.createMap(dojo.configData.WebMapId, "esriCTParentDivContainer", {
                    mapOptions: {
                        slider: true
                    },
                    ignorePopups: true
                });
                mapDeferred.then(lang.hitch(this, function (response) {
                    this.map = response.map;
                    dojo.selectedBasemapIndex = null;
                    if (response.itemInfo.itemData.baseMap.baseMapLayers) {
                        this._setBasemapLayerId(response.itemInfo.itemData.baseMap.baseMapLayers);
                    }
                    topic.publish("filterRedundantBasemap", response.itemInfo);
                    this._fetchWebMapData(response);
                    topic.publish("setMap", this.map);
                    geometry = response.map.extent;
                    this._mapOnCurrentExtent(response);
                    this.map.addLayer(graphicsLayer);
                    this.map.addLayer(routeGraphicsLayer);
                    this.map.addLayer(locaterGraphicsLayer);
                    this._addFrequentRoutesLayer();
                    this._initializeMapSettings(geometry);
                    this._generateLayerURL(response.itemInfo.itemData.operationalLayers);
                    if (dojo.configData.ShowLegend === "true" && lang.trim(dojo.configData.ShowLegend).length !== 0) {
                        this._createWebmapLegendLayerList(response.itemInfo.itemData.operationalLayers);
                    }
                    topic.publish("showInfoWindowContent", geometry);
                    this._addMapEvents();
                    topic.publish("hideProgressIndicator");
                    this._shareInfoWindow(this.map);
                    this._sharePointOnMap(geometry);
                    if (dojo.configData.BaseMapLayers.length > 1) {
                        this._showBasMapGallery();
                    }
                }), lang.hitch(this, function (error) {
                    alert(error.message);
                }));
            } else {
                this._generateLayerURL(dojo.configData.OperationalLayers);
                this.map = esriMap("esriCTParentDivContainer", {});

                dojo.selectedBasemapIndex = 0;

                if (!dojo.configData.BaseMapLayers[0].length) {
                    if (dojo.configData.BaseMapLayers[0].layerType === "OpenStreetMap") {
                        layer = new OpenStreetMapLayer({ id: "defaultBasemap", visible: true });
                    } else {
                        layer = new ArcGISTiledMapServiceLayer(dojo.configData.BaseMapLayers[0].MapURL, { id: "defaultBasemap", visible: true });
                    }
                    this.map.addLayer(layer, 0);
                } else {
                    for (i = 0; i < dojo.configData.BaseMapLayers[0].length; i++) {
                        layer = new ArcGISTiledMapServiceLayer(dojo.configData.BaseMapLayers[0][i].MapURL, { id: "defaultBasemap" + i, visible: true });
                        this.map.addLayer(layer, i);
                    }
                }
                this.map.addLayer(graphicsLayer);
                this.map.addLayer(routeGraphicsLayer);
                this.map.addLayer(locaterGraphicsLayer);
                this._addFrequentRoutesLayer();
                this._mapOnLoad(extentPoints);
            }

        },

        /**
        * set default id for basemaps
        * @memberOf widgets/mapSettings/mapSettings
        */
        _setBasemapLayerId: function (baseMapLayers) {
            var i = 0, defaultId = "defaultBasemap";
            if (baseMapLayers.length === 1) {
                this._setBasemapId(baseMapLayers[0], defaultId);
            } else {
                for (i = 0; i < baseMapLayers.length; i++) {
                    this._setBasemapId(baseMapLayers[i], defaultId + i);
                }
            }

        },

        /**
        * set default id for each basemap of webmap
        * @memberOf widgets/mapSettings/mapSettings
        */
        _setBasemapId: function (basmap, defaultId) {
            var layerIndex;
            this.map.getLayer(basmap.id).id = defaultId;
            this.map._layers[defaultId] = this.map.getLayer(basmap.id);
            layerIndex = array.indexOf(this.map.layerIds, basmap.id);
            if (basmap.id !== defaultId) {
                delete this.map._layers[basmap.id];
            }
            this.map.layerIds[layerIndex] = defaultId;
        },

        /**
        * Create an Array For Legend
        * @memberOf widgets/mapSettings/mapSettings
        */
        _createWebmapLegendLayerList: function (layers) {
            var i, webMapLayers = [], webmapLayerList = {}, hasLayers = false;
            for (i = 0; i < layers.length; i++) {
                if (layers[i].layerDefinition && layers[i].layerDefinition.drawingInfo) {
                    webmapLayerList[layers[i].url] = layers[i];
                    hasLayers = true;
                } else {
                    webMapLayers.push(layers[i]);
                }
            }
            if (!hasLayers) {
                webmapLayerList = null;
            }
            this._addLayerLegendWebmap(webMapLayers, webmapLayerList);

        },

        /**
        * load BasMap Gallery, opertation layers ,attach map events ,share info window on map on load
        * @param{object} geometry points
        * @param{object} graphic layer instance
        * @memberOf widgets/mapSettings/mapSettings
        */
        _mapOnLoad: function (extentPoints) {

            /* set position of home button widget after map is successfuly loaded
            * @param {array} dojo.configData.OperationalLayers List of operational Layers specified in configuration file
            */
            this.map.on("load", lang.hitch(this, function (evt) {
                var i;
                for (i in dojo.configData.OperationalLayers) {
                    if (dojo.configData.OperationalLayers.hasOwnProperty(i)) {
                        this._addOperationalLayerToMap(i, dojo.configData.OperationalLayers[i]);
                    }
                }
                this._mapOnCurrentExtent(extentPoints);
                this._sharePointOnMap(evt.map.extent);
                if (dojo.configData.BaseMapLayers.length > 1) {
                    this._showBasMapGallery();
                }
                this._addMapEvents();
            }));
            aspect.after(this.map.on("load", lang.hitch(this, function () {
                this._shareInfoWindow(this.map);
            })));
        },

        /**
        * Set map default extent
        * @param{object} geometry points
        * @param{object} graphics layer instance
        * @memberOf widgets/mapSettings/mapSettings
        */
        _mapOnCurrentExtent: function (extentPoints) {
            /* set map Extent */

            var extent, mapDefaultExtent;
            extent = this._getQueryString('extent');
            if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                if (extent === "") {
                    this.currentExtent = true;
                }
                if (!this.currentExtent) {
                    dojo.share = true;
                    mapDefaultExtent = extent.split(',');
                    mapDefaultExtent = new GeometryExtent({ "xmin": parseFloat(mapDefaultExtent[0]), "ymin": parseFloat(mapDefaultExtent[1]), "xmax": parseFloat(mapDefaultExtent[2]), "ymax": parseFloat(mapDefaultExtent[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                    extentPoints.map.setExtent(mapDefaultExtent);
                }
            } else {
                if (extent === "") {
                    mapDefaultExtent = new GeometryExtent({ "xmin": parseFloat(extentPoints[0]), "ymin": parseFloat(extentPoints[1]), "xmax": parseFloat(extentPoints[2]), "ymax": parseFloat(extentPoints[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                } else {
                    dojo.share = true;
                    mapDefaultExtent = extent.split(',');
                    mapDefaultExtent = new GeometryExtent({ "xmin": parseFloat(mapDefaultExtent[0]), "ymin": parseFloat(mapDefaultExtent[1]), "xmax": parseFloat(mapDefaultExtent[2]), "ymax": parseFloat(mapDefaultExtent[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                }
                this.map.setExtent(mapDefaultExtent);
                this._initializeMapSettings(mapDefaultExtent);
            }
        },

        /**
        * On share of infowindow
        * @param{object} map instance
        * @memberOf widgets/mapSettings/mapSettings
        */
        _shareInfoWindow: function (map) {
            if (window.location.toString().split("$featurepoint=").length > 1) {
                dojo.share = true;
                this._executeFeatureQueryTask(map);
            }
        },

        /**
        * On share of point(pushpin) on map
        * @param{object} map extent
        * @memberOf widgets/mapSettings/mapSettings
        */
        _sharePointOnMap: function () {
            if (window.location.toString().split("$point=").length > 1) {
                dojo.share = true;
                this.sharePoint = true;
                var mapPoint = new Point(Number(window.location.toString().split("$point=")[1].split("$selectedDirection")[0].split(",")[0]), Number(window.location.toString().split("$point=")[1].split("$selectedDirection")[0].split(",")[1]), this.map.spatialReference);
                topic.publish("locateAddressOnMap", mapPoint);
                topic.publish("setMaxLegendLength");
            }
        },

        /**
        * add grphic layer and show pushpin on map
        * @param{object} map point geometry
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addPushpinOnMap: function (mapPoint) {
            var geoLocationPushpin, locatorMarkupSymbol, graphic;
            if (!this.sharePoint) {
                this.map.setLevel(dojo.configData.ZoomLevel);
                this.map.centerAt(mapPoint);
            }
            this.sharePoint = false;
            dojo.mapPoint = mapPoint;
            geoLocationPushpin = dojoConfig.baseURL + dojo.configData.LocatorSettings.DefaultLocatorSymbol;
            locatorMarkupSymbol = new esri.symbol.PictureMarkerSymbol(geoLocationPushpin, dojo.configData.LocatorSettings.MarkupSymbolSize.width, dojo.configData.LocatorSettings.MarkupSymbolSize.height);
            graphic = new esri.Graphic(mapPoint, locatorMarkupSymbol, {}, null);
            this.map.getLayer("esrilocaterGraphicsLayer").clear();
            this.map.getLayer("esrilocaterGraphicsLayer").add(graphic);
            topic.publish("hideProgressIndicator");
            topic.publish("hideInfoWindowOnMap");
        },

        /**
        * Trigger extent change event , Create home button object
        * @param{object} graphic layer object
        * @param{geometry} pass default extent of map
        * @memberOf widgets/mapSettings/mapSettings
        */
        _initializeMapSettings: function (mapDefaultExtent) {
            var home, imgSource, CustomLogoUrl = dojo.configData.CustomLogoUrl, divMapLogo;

            /**
            * load esri 'Home Button' widget
            */
            home = this._addHomeButton();
            domConstruct.place(home.domNode, query(".esriSimpleSliderIncrementButton")[0], "after");
            if (!dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length === 0) {
                home.extent = mapDefaultExtent;
            }
            home.startup();
            if (CustomLogoUrl && lang.trim(CustomLogoUrl).length !== 0) {
                if (CustomLogoUrl.match("http:") || CustomLogoUrl.match("https:")) {
                    imgSource = CustomLogoUrl;
                } else {
                    imgSource = dojoConfig.baseURL + CustomLogoUrl;
                }

                divMapLogo = domConstruct.create("img", { "src": imgSource, "class": "esriCTMapLogo" }, dom.byId("esriCTParentDivContainer"));
                if (dojo.configData.ShowLegend !== "true" || lang.trim(dojo.configData.ShowLegend).length === 0) {
                    domClass.replace(divMapLogo, "esriCTMapLogo-select", "esriCTMapLogo");
                }
            }

            topic.subscribe("setInfoWindowHeightWidth", lang.hitch(this, function (infoPopupWidth, infoPopupHeight) {
                this._setInfoWindowHeightWidth(infoPopupWidth, infoPopupHeight);
            }));
            this.map.on("extent-change", lang.hitch(this, function (evt) {
                var infoPopupHeight, infoPopupWidth;
                infoPopupHeight = dojo.configData.InfoPopupHeight;
                infoPopupWidth = dojo.configData.InfoPopupWidth;
                if (!dojo.setMapTipPosition) {
                    this._onSetMapTipPosition(dojo.selectedMapPoint);
                }
                topic.publish("setInfoWindowHeightWidth", infoPopupWidth, infoPopupHeight);
                if (dojo.onInfoWindowResize) {
                    topic.publish("onWindowResize");
                }

                if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                    topic.publish("showInfoWindowContent", evt.extent);
                }
                topic.publish("setSplashScreenScrollbar");
            }));
            if (!dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length === 0) {
                if (dojo.configData.ShowLegend === "true" && lang.trim(dojo.configData.ShowLegend).length !== 0) {
                    this._addLayerLegend();
                }
            }
        },

        /**
        * Set info window height and width
        * @param{int} info popup width
        * @param{int} info popup Height
        * @memberOf widgets/mapSettings/mapSettings
        */
        _setInfoWindowHeightWidth: function (infoPopupWidth, infoPopupHeight) {
            this.infoWindowPanel.resize(infoPopupWidth, infoPopupHeight);
        },

        /**
        * Add map on click event
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addMapEvents: function () {
            topic.subscribe("setInfoWindowOnMap", lang.hitch(this, function (infoTitle, mobTitle, divInfoDetailsTab, screenPoint) {
                this._onSetInfoWindowPosition(infoTitle, mobTitle, divInfoDetailsTab, screenPoint);
            }));
            topic.subscribe("hideInfoWindowOnMap", lang.hitch(this, function () {
                this._hideInfoWindow();
            }));
            baseUnload.addOnWindowUnload(lang.hitch(this, function (a) {
                this._persistDirectionValue(a);
            }));
            this.map.on("click", lang.hitch(this, function (evt) {
                dojo.showInfo = false;
                dojo.setMapTipPosition = false;
                dojo.openInfowindow = false;
                topic.publish("showProgressIndicator");
                this._showInfoWindowOnMap(evt.mapPoint, this.map);
            }));
        },

        /**
        * fetch web map data
        * @param{object} instance of web map
        * @memberOf widgets/mapSettings/mapSettings
        */
        _fetchWebMapData: function (response) {
            var searchSettings, i, j, k, l, str, displayText, index, serviceTitle = [], webMapDetails, operationalLayers, frequentRoutesLayer,
                p = 0, operationalLayerId, lastIndex, layerInfo, infowindowIndex, field;
            dojo.configData.InfoWindowSettings = [];
            dojo.configData.OperationalLayers = [];
            searchSettings = dojo.configData.SearchAnd511Settings;
            webMapDetails = response.itemInfo.itemData;
            operationalLayers = dojo.configData.OperationalLayers;
            frequentRoutesLayer = dojo.configData.FrequentRoutesSettings;

            for (i = 0; i < webMapDetails.operationalLayers.length; i++) {
                operationalLayerId = lang.trim(webMapDetails.operationalLayers[i].title);
                str = webMapDetails.operationalLayers[i].url.split('/');
                lastIndex = str[str.length - 1];
                if (isNaN(lastIndex) || lastIndex === "") {
                    if (lastIndex === "") {
                        serviceTitle[operationalLayerId] = webMapDetails.operationalLayers[i].url;
                    } else {
                        serviceTitle[operationalLayerId] = webMapDetails.operationalLayers[i].url + "/";
                    }
                } else {
                    serviceTitle[operationalLayerId] = webMapDetails.operationalLayers[i].url.substring(0, webMapDetails.operationalLayers[i].url.length - 1);
                }
            }
            if (frequentRoutesLayer.Title && frequentRoutesLayer.QueryLayerId) {
                frequentRoutesLayer.QueryURL = serviceTitle[frequentRoutesLayer.Title] + frequentRoutesLayer.QueryLayerId;
            }
            for (index = 0; index < searchSettings.length; index++) {
                if (searchSettings[index].Title && searchSettings[index].QueryLayerId && serviceTitle[searchSettings[index].Title]) {
                    searchSettings[index].QueryURL = serviceTitle[searchSettings[index].Title] + searchSettings[index].QueryLayerId;

                    for (j = 0; j < webMapDetails.operationalLayers.length; j++) {
                        if (webMapDetails.operationalLayers[j].title && serviceTitle[webMapDetails.operationalLayers[j].title] && (webMapDetails.operationalLayers[j].title === searchSettings[index].Title)) {
                            if (webMapDetails.operationalLayers[j].layers) {
                                //Fetching infopopup data in case the layers are added as dynamic layers in the webmap
                                for (k = 0; k < webMapDetails.operationalLayers[j].layers.length; k++) {
                                    layerInfo = webMapDetails.operationalLayers[j].layers[k];
                                    if (Number(searchSettings[index].QueryLayerId) === layerInfo.id) {
                                        if (webMapDetails.operationalLayers[j].layers[k].popupInfo) {
                                            dojo.configData.InfoWindowSettings.push({ "InfoQueryURL": serviceTitle[searchSettings[index].Title] + searchSettings[index].QueryLayerId });
                                            operationalLayers[p] = {};
                                            operationalLayers[p].ServiceURL = webMapDetails.operationalLayers[j].url + "/" + webMapDetails.operationalLayers[j].layers[k].id;
                                            p++;
                                            if (layerInfo.popupInfo.title.split("{").length > 1) {
                                                dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1].InfoWindowHeaderField = dojo.string.trim(layerInfo.popupInfo.title.split("{")[0]) + " ";
                                                for (l = 1; l < layerInfo.popupInfo.title.split("{").length; l++) {
                                                    dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1].InfoWindowHeaderField += "${" + dojo.string.trim(layerInfo.popupInfo.title.split("{")[l]);
                                                }
                                            } else {
                                                if (dojo.string.trim(layerInfo.popupInfo.title) !== "") {
                                                    dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1].InfoWindowHeaderField = dojo.string.trim(layerInfo.popupInfo.title);
                                                } else {
                                                    dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1].InfoWindowHeaderField = sharedNls.showNullValue;
                                                }
                                            }
                                            infowindowIndex = dojo.configData.InfoWindowSettings.length - 1;
                                            this.getMobileCalloutContentField(infowindowIndex);
                                            dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1].InfoWindowData = [];
                                            for (field in layerInfo.popupInfo.fieldInfos) {
                                                if (layerInfo.popupInfo.fieldInfos.hasOwnProperty(field)) {
                                                    if (layerInfo.popupInfo.fieldInfos[field].visible) {
                                                        displayText = layerInfo.popupInfo.fieldInfos[field].label;
                                                        if (displayText === "") {
                                                            displayText = layerInfo.popupInfo.fieldInfos[field].fieldName;
                                                        }
                                                        dojo.configData.InfoWindowSettings[dojo.configData.InfoWindowSettings.length - 1].InfoWindowData.push({
                                                            "DisplayText": displayText + ":",
                                                            "FieldName": "${" + layerInfo.popupInfo.fieldInfos[field].fieldName + "}"
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } else if (webMapDetails.operationalLayers[j].popupInfo) {
                                //Fetching infopopup data in case the layers are added as feature layers in the webmap
                                operationalLayers[p] = {};
                                operationalLayers[p].ServiceURL = webMapDetails.operationalLayers[j].url;
                                dojo.configData.InfoWindowSettings.push({ "InfoQueryURL": serviceTitle[searchSettings[index].Title] + searchSettings[index].QueryLayerId });
                                p++;
                                if (webMapDetails.operationalLayers[j].popupInfo.title.split("{").length > 1) {
                                    dojo.configData.InfoWindowSettings[index].InfoWindowHeaderField = dojo.string.trim(webMapDetails.operationalLayers[j].popupInfo.title.split("{")[0]);
                                    for (l = 1; l < webMapDetails.operationalLayers[j].popupInfo.title.split("{").length; l++) {
                                        dojo.configData.InfoWindowSettings[index].InfoWindowHeaderField += " ${" + dojo.string.trim(webMapDetails.operationalLayers[j].popupInfo.title.split("{")[l]);
                                    }
                                } else {
                                    if (dojo.string.trim(webMapDetails.operationalLayers[j].popupInfo.title) !== "") {
                                        dojo.configData.InfoWindowSettings[index].InfoWindowHeaderField = dojo.string.trim(webMapDetails.operationalLayers[j].popupInfo.title);
                                    } else {
                                        dojo.configData.InfoWindowSettings[index].InfoWindowHeaderField = sharedNls.showNullValue;
                                    }
                                }
                                if (webMapDetails.operationalLayers[j].layerObject.displayField) {
                                    dojo.configData.InfoWindowSettings[index].InfoWindowContent = "${" + webMapDetails.operationalLayers[j].layerObject.displayField + "}";
                                } else {
                                    this.getMobileCalloutContentField(index);
                                }
                                dojo.configData.InfoWindowSettings[index].InfoWindowData = [];
                                for (field in webMapDetails.operationalLayers[j].popupInfo.fieldInfos) {
                                    if (webMapDetails.operationalLayers[j].popupInfo.fieldInfos.hasOwnProperty(field)) {
                                        if (webMapDetails.operationalLayers[j].popupInfo.fieldInfos[field].visible) {
                                            dojo.configData.InfoWindowSettings[index].InfoWindowData.push({
                                                "DisplayText": webMapDetails.operationalLayers[j].popupInfo.fieldInfos[field].label + ":",
                                                "FieldName": "${" + webMapDetails.operationalLayers[j].popupInfo.fieldInfos[field].fieldName + "}"
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    alert(sharedNls.errorMessages.webMapMessages);
                }
            }
        },

        /**
        * Get data to be displayed in mobile callout content field
        * @param{int} index for mobile popup
        * @memberOf widgets/mapSettings/mapSettings
        */
        getMobileCalloutContentField: function (index) {
            var i, def = new Deferred();
            esri.request({
                url: dojo.configData.InfoWindowSettings[index].InfoQueryURL + '?f=json',
                load: function (data) {
                    if (data.displayField) {
                        dojo.configData.InfoWindowSettings[index].InfoWindowContent = "${" + data.displayField + "}";
                    } else {
                        for (i = 0; i < data.fields.length; i++) {
                            if (data.fields[i].type !== "esriFieldTypeOID") {
                                dojo.configData.InfoWindowSettings[index].InfoWindowContent = "${" + data.fields[i].name + "}";
                                break;
                            }
                        }
                    }
                    def.resolve();
                }
            });
            return def;
        },

        /**
        * Add Freuent route layer as a feature layer
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addFrequentRoutesLayer: function () {
            var roadLineSymbol, roadLinefillColor, roadLineRenderer, frequentRoutesLayer, layer;
            layer = dojo.configData.FrequentRoutesSettings;
            if (layer.QueryURL) {
                roadLineSymbol = new SimpleLineSymbol();
                roadLineSymbol.setWidth(parseInt(dojo.configData.RouteSymbology.Width, 10));
                roadLinefillColor = new Color([parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[0], 10), parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[1], 10), parseInt(dojo.configData.RouteSymbology.ColorRGB.split(",")[2], 10), parseFloat(dojo.configData.RouteSymbology.Transparency.split(",")[0])]);
                roadLineSymbol.setColor(roadLinefillColor);
                roadLineRenderer = new SimpleRenderer(roadLineSymbol);
                frequentRoutesLayer = new FeatureLayer(layer.QueryURL, {
                    mode: FeatureLayer.MODE_SELECTION,
                    outFields: ["*"]
                });
                frequentRoutesLayer.id = this.frequentRoutesLayer;
                frequentRoutesLayer.setRenderer(roadLineRenderer);
                this.map.addLayer(frequentRoutesLayer);
            }
        },

        /**
        * Get result of string
        * @param{string} string value of extent
        * @memberOf widgets/mapSettings/mapSettings
        */
        _getQueryString: function (key) {
            var extentValue = "", regex, qs;
            regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
            qs = regex.exec(window.location.href);
            if (qs && qs.length > 0) {
                extentValue = qs[1];
            }
            return extentValue;
        },

        /**
        * Hide info Winodw on map
        * @memberOf widgets/mapSettings/mapSettings
        */
        _hideInfoWindow: function () {
            this.infoWindowPanel.hide();
        },

        /**
        * Get result of map click event
        * @param{geometry} map geometry
        * @param{object} map instance
        * @memberOf widgets/mapSettings/mapSettings
        */
        _showInfoWindowOnMap: function (mapPoint, map) {
            var featureArray = [], onMapFeaturArray = [], index, deferredListResult, i, j;
            this.counter = 0;
            for (index = 0; index < dojo.configData.InfoWindowSettings.length; index++) {
                this._executeQueryTask(index, mapPoint, onMapFeaturArray);
            }
            deferredListResult = new DeferredList(onMapFeaturArray);
            deferredListResult.then(lang.hitch(this, function (result) {
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
                    this._fetchQueryResults(featureArray, map, mapPoint);
                }
            }), function (err) {
                alert(err.message);
            });
        },

        /**
        * Fetch index and query the layer
        * @memberOf widgets/mapSettings/mapSettings
        */
        _executeFeatureQueryTask: function () {
            var onMapFeaturArray = [], index;
            this.counter = 0;
            index = window.location.toString().split("$featurepoint=")[1].split("$LayerID=")[1].split("$selectedDirection=")[0];
            this._executeShareQueryTask(index, onMapFeaturArray);
        },

        /**
        * Query the layer to fetch the data for info winodow
        * @param{int} index of operational layers
        * @param{array} an array of features
        * @memberOf widgets/mapSettings/mapSettings
        */
        _executeShareQueryTask: function (index, onMapFeaturArray) {
            var _self = this, featureArray = [], queryTask, queryLayer, queryOnRouteTask, i, j, p, objID,
                deferred, deferredListResult;
            queryTask = new esri.tasks.QueryTask(dojo.configData.SearchAnd511Settings[index].QueryURL);
            esri.request({
                url: dojo.configData.SearchAnd511Settings[index].QueryURL + "?f=json",
                load: function (data) {
                    for (p = 0; p < data.fields.length; p++) {
                        if (data.fields[p].type === "esriFieldTypeOID") {
                            objID = data.fields[p].name;
                            break;
                        }
                    }
                    queryLayer = new esri.tasks.Query();
                    queryLayer.where = objID + "=" + window.location.toString().split("$featurepoint=")[1].split("$LayerID=")[0].split("$selectedDirection=")[0];
                    queryLayer.outFields = ["*"];
                    queryLayer.outSpatialReference = _self.map.spatialReference;
                    queryLayer.returnGeometry = true;
                    queryLayer.maxAllowableOffset = 100;
                    queryOnRouteTask = queryTask.execute(queryLayer, lang.hitch(this, function (results) {
                        deferred = new Deferred();
                        deferred.resolve(results);
                        return deferred.promise;
                    }), function (err) {
                        alert(err.message);
                    });
                    onMapFeaturArray.push(queryOnRouteTask);
                    deferredListResult = new DeferredList(onMapFeaturArray);
                    deferredListResult.then(lang.hitch(this, function (result) {
                        if (result) {
                            for (j = 0; j < result.length; j++) {
                                if (result[j][1].features.length > 0) {
                                    for (i = 0; i < result[j][1].features.length; i++) {
                                        featureArray.push({
                                            attr: result[j][1].features[i],
                                            layerId: index,
                                            fields: result[j][1].fields
                                        });
                                    }
                                }
                            }
                            _self._fetchQueryResults(featureArray, _self.map);
                        }
                    }), function (err) {
                        alert(err.message);
                    });
                },
                error: function (err) {
                    alert(err.message);
                }
            });
        },

        /**
        * Query the layers on map click
        * @param{int} index of operational layers
        * @param{geometry} current map point geometry
        * @param{array} an array of features
        * @memberOf widgets/mapSettings/mapSettings
        */
        _executeQueryTask: function (index, mapPoint, onMapFeaturArray) {
            var queryTask, queryLayer, queryOnRouteTask, deferred;
            queryTask = new esri.tasks.QueryTask(dojo.configData.InfoWindowSettings[index].InfoQueryURL);
            queryLayer = new esri.tasks.Query();
            queryLayer.outSpatialReference = this.map.spatialReference;
            queryLayer.returnGeometry = true;
            queryLayer.maxAllowableOffset = 100;
            queryLayer.geometry = this._extentFromPoint(mapPoint);
            queryLayer.outFields = ["*"];
            queryOnRouteTask = queryTask.execute(queryLayer, lang.hitch(this, function (results) {
                deferred = new Deferred();
                deferred.resolve(results);
                return deferred.promise;
            }), function (err) {
                alert(err.message);
            });
            onMapFeaturArray.push(queryOnRouteTask);

        },

        /**
        * Set extent on given map point
        * @return {object} Current map extent geometry
        * @memberOf widgets/mapSettings/mapSettings
        */
        _extentFromPoint: function (point) {
            var tolerance = 15, screenPoint, sourcePoint, destinationPoint, sourceMapPoint, destinationMapPoint;
            screenPoint = this.map.toScreen(point);
            sourcePoint = new Point(screenPoint.x - tolerance, screenPoint.y + tolerance);
            destinationPoint = new Point(screenPoint.x + tolerance, screenPoint.y - tolerance);
            sourceMapPoint = this.map.toMap(sourcePoint);
            destinationMapPoint = this.map.toMap(destinationPoint);
            return new GeometryExtent(sourceMapPoint.x, sourceMapPoint.y, destinationMapPoint.x, destinationMapPoint.y, this.map.spatialReference);
        },

        /**
        * Populate information for info window
        * @param{array} an array of features
        * @param{object} an instance of map
        * @param{geometry} map point geometry
        * @memberOf widgets/mapSettings/mapSettings
        */
        _fetchQueryResults: function (featureArray, map, mapPoint) {
            var point, _this = this;
            if (featureArray.length > 0) {
                if (featureArray.length === 1) {
                    domStyle.set(query(".esriCTdivInfoWindowCrasual")[0], "display", "none");
                    domClass.remove(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                    if (window.location.toString().split("$featurepoint=").length > 1) {
                        if (window.location.toString().split("$ispolyline=")[1].split("$selectedBasemapIndex=")[0] === "true") {
                            point = featureArray[0].attr.geometry.getPoint(0, 0);
                        } else {
                            point = featureArray[0].attr.geometry;
                        }
                        topic.publish("createInfoWindowContent", point, featureArray[0].attr.attributes, featureArray[0].fields, featureArray[0].layerId, featureArray, this.count, map, false);
                    } else {
                        if (featureArray[0].attr.geometry.type === "polygon") {
                            point = mapPoint;
                        } else {
                            point = mapPoint;
                        }
                        dojo.ispolyline = false;
                        topic.publish("createInfoWindowContent", point, featureArray[0].attr.attributes, featureArray[0].fields, featureArray[0].layerId, null, null, map, false);
                    }
                } else {
                    domStyle.set(query(".esriCTdivInfoWindowCrasual")[0], "display", "block");
                    this.count = 0;
                    dojo.setMapTipPosition = false;
                    domAttr.set(query(".esriCTdivInfoTotalFeatureCount")[0], "innerHTML", '/' + featureArray.length);
                    if (featureArray[this.count].attr.geometry.type === "polyline") {
                        dojo.ispolyline = true;
                        point = mapPoint;
                    } else {
                        if (featureArray[0].attr.geometry.type === "polygon") {
                            point = mapPoint;
                        } else {
                            point = mapPoint;
                        }
                        dojo.ispolyline = false;
                    }
                    topic.publish("createInfoWindowContent", point, featureArray[0].attr.attributes, featureArray[0].fields, featureArray[0].layerId, featureArray, this.count, map, false);
                    topic.publish("hideProgressIndicator");

                    query(".esriCTdivInfoRightArrow")[0].onclick = function () {
                        dojo.showInfo = true;
                        _this._nextInfoContent(featureArray, map, point);
                    };
                    query(".esriCTdivInfoLeftArrow")[0].onclick = function () {
                        dojo.showInfo = true;
                        _this._previousInfoContent(featureArray, map, point);
                    };
                }
            } else {
                topic.publish("hideProgressIndicator");
            }
        },

        /**
        * Trigger event to show next info window details
        * @param{array} an array of features
        * @param{object} an instance of map
        * @param{geometry} map point geometry
        * @memberOf widgets/mapSettings/mapSettings
        */
        _nextInfoContent: function (featureArray, map, point) {
            if (!domClass.contains(query(".esriCTdivInfoRightArrow")[0], "disableArrow")) {
                if (this.count < featureArray.length) {
                    this.count++;
                }
                if (featureArray[this.count]) {
                    domClass.add(query(".esriCTdivInfoRightArrow")[0], "disableArrow");
                    topic.publish("createInfoWindowContent", point, featureArray[this.count].attr.attributes, featureArray[this.count].fields, featureArray[this.count].layerId, featureArray, this.count, map, true);
                    if (dojo.window.getBox().w <= 680) {
                        topic.publish("openMobileInfowindow");
                    }
                }
            }
        },

        /**
        * Trigger event to show previous info window details
        * @param{array} an array of features
        * @param{object} an instance of map
        * @param{geometry} map point geometry
        * @memberOf widgets/mapSettings/mapSettings
        */
        _previousInfoContent: function (featureArray, map, point) {
            if (!domClass.contains(query(".esriCTdivInfoLeftArrow")[0], "disableArrow")) {
                if (this.count !== 0 && this.count < featureArray.length) {
                    this.count--;
                }
                if (featureArray[this.count]) {
                    domClass.add(query(".esriCTdivInfoLeftArrow")[0], "disableArrow");
                    topic.publish("createInfoWindowContent", point, featureArray[this.count].attr.attributes, featureArray[this.count].fields, featureArray[this.count].layerId, featureArray, this.count, map, true);
                    if (dojo.window.getBox().w <= 680) {
                        topic.publish("openMobileInfowindow");
                    }
                }
            }
        },

        /**
        * Set persist route value
        * @memberOf widgets/mapSettings/mapSettings
        */
        _persistDirectionValue: function () {
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

        /**
        * Local storage value
        * @return {boolean} of window local storage value
        * @memberOf widgets/mapSettings/mapSettings
        */
        _supportsLocalStorage: function () {
            try {
                return window.localStorage !== 'undefined' && window.localStorage !== null;
            } catch (e) {
                return false;
            }
        },

        /**
        * Set info Window poistion
        * @memberOf widgets/mapSettings/mapSettings
        */
        _onSetInfoWindowPosition: function (infoTitle, mobTitle, divInfoDetailsTab, screenPoint) {
            if (infoTitle) {
                this.infoWindowPanel.hide();
                this.infoWindowPanel.setTitle(infoTitle, mobTitle);
                this.infoWindowPanel.show(divInfoDetailsTab, screenPoint);
                topic.publish("hideProgressIndicator");
                if (dojo.window.getBox().w <= 680) {
                    if (dojo.openInfowindow) {
                        topic.publish("openMobileInfowindow");
                    }
                }
            } else if (this.infoWindowPanel.isVisible) {
                topic.publish("hideProgressIndicator");
                this._onSetMapTipPosition(screenPoint);
            }
        },


        /**
        * set infowindow anchor position on map
        * @memberOf widgets/locator/locator
        */
        _onSetMapTipPosition: function (selectedPoint) {
            if (selectedPoint) {
                var screenPoint = this.map.toScreen(selectedPoint);
                screenPoint.y = this.map.height - screenPoint.y;
                this.infoWindowPanel.setLocation(screenPoint);

            }
        },

        /**
        * Slide legend panel to right
        * @memberOf widgets/mapSettings/mapSettings
        */
        _slideRight: function () {
            var difference = query(".divlegendContainer")[0].offsetWidth - query(".divlegendContent")[0].offsetWidth;
            if (this.newLeft > difference) {
                domStyle.set(query(".esriCTLeftArrow")[0], "display", "block");
                domStyle.set(query(".esriCTLeftArrow")[0], "cursor", "pointer");
                this.newLeft = this.newLeft - (200 + 9);
                domStyle.set(query(".divlegendContent")[0], "left", (this.newLeft) + "px");
                this._resetSlideControls();
            }
        },

        /**
        * Slide legend panel to left
        * @memberOf widgets/mapSettings/mapSettings
        */
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

        /**
        * Set Sliding legend position
        * @memberOf widgets/mapSettings/mapSettings
        */
        _resetSlideControls: function () {
            if (this.newLeft > query(".divlegendContainer")[0].offsetWidth - query(".divlegendContent")[0].offsetWidth) {
                domStyle.set(query(".divRightArrow")[0], "display", "block");
                domStyle.set(query(".divRightArrow")[0], "cursor", "pointer");
            } else {
                domStyle.set(query(".divRightArrow")[0], "display", "none");
                domStyle.set(query(".divRightArrow")[0], "cursor", "default");
            }
            if (parseInt(this.newLeft, 10) === 0) {
                domStyle.set(query(".esriCTLeftArrow")[0], "display", "none");
                domStyle.set(query(".esriCTLeftArrow")[0], "cursor", "default");
            } else {
                domStyle.set(query(".esriCTLeftArrow")[0], "display", "block");
                domStyle.set(query(".esriCTLeftArrow")[0], "cursor", "pointer");
            }
        },

        /**
        * Get operational layers
        * @param{url} operational layers
        * @memberOf widgets/mapSettings/mapSettings
        */
        _generateLayerURL: function (operationalLayers) {
            var i, str;
            for (i = 0; i < operationalLayers.length; i++) {
                if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                    str = operationalLayers[i].url.split('/');
                    this._createLayerURL(str);
                } else {
                    if (operationalLayers[i].ServiceURL) {
                        str = operationalLayers[i].ServiceURL.split('/');
                        this._createLayerURL(str);
                    }
                }
            }
        },

        /**
        * Generate Id and title of operational layers
        * @param{string} string value of layer ul
        * @memberOf widgets/mapSettings/mapSettings
        */
        _createLayerURL: function (str) {
            var layerTitle, layerId, index, infoIndex, infoWindowSettings, searchSettings, frequentRoutesLayer;
            infoWindowSettings = dojo.configData.InfoWindowSettings;
            searchSettings = dojo.configData.SearchAnd511Settings;
            frequentRoutesLayer = dojo.configData.FrequentRoutesSettings;
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
            if (frequentRoutesLayer.Title && frequentRoutesLayer.QueryLayerId) {
                if (layerTitle === frequentRoutesLayer.Title && layerId === frequentRoutesLayer.QueryLayerId) {
                    frequentRoutesLayer.QueryURL = str.join("/");
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

        /**
        * Crate an object of base map gallery
        * @return {object} base map object
        * @memberOf widgets/mapSettings/mapSettings
        */
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

        /**
        * Set dynamic layer title
        * @param {string} layer information
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addDynamicLayerService: function (layerInfo) {
            var layerTitle, lastIndex, str;
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

        /**
        * Set dynamic layers
        * @param {int} service layer id
        * @param {URL} service layer URL
        * @memberOf widgets/mapSettings/mapSettings
        */
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

        /**
        * Add dynamic service layer , Create an istance of dynamic service layer
        * @memberOf widgets/mapSettings/mapSettings
        */
        _createDynamicServiceLayer: function (dynamicLayer, imageParams, layerId) {
            var dynamicMapService = new ArcGISDynamicMapServiceLayer(dynamicLayer, {
                imageParameters: imageParams,
                id: layerId,
                visible: true
            });
            this.map.addLayer(dynamicMapService);
        },

        /**
        * Create an istance of Legend
        * @param {int} service layer id
        * @param {URL} service layer URL
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addLegendBox: function () {
            if (this.legendObject) {
                this.legendObject.destroy();
            }
            this.legendObject = new Legends({
                map: this.map,
                isExtentBasedLegend: true
            }, domConstruct.create("div", {}, null));
            return this.legendObject;
        },

        /**
        * get layers for legend
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addLayerLegend: function () {
            var mapServerArray = [], legendObject, i;
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
        * Set layers for legend in Web Map
        * @param {object} response object of legend
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addLayerLegendWebmap: function (webMapLayers, webmapLayerList) {
            var mapServerArray = [], i, j, legendObject, layer;
            for (j = 0; j < webMapLayers.length; j++) {
                if (webMapLayers[j].layerObject) {
                    if (webMapLayers[j].layerObject.layerInfos) {
                        for (i = 0; i < webMapLayers[j].layerObject.layerInfos.length; i++) {
                            layer = webMapLayers[j].url + "/" + webMapLayers[j].layerObject.layerInfos[i].id;
                            mapServerArray.push(layer);
                        }
                    } else {
                        mapServerArray.push(webMapLayers[j].url);
                    }
                } else {
                    mapServerArray.push(webMapLayers[j].url);
                }
            }
            legendObject = this._addLegendBox();
            legendObject.startup(mapServerArray, webmapLayerList);
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
