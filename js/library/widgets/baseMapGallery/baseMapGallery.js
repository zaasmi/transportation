/*global define,dojo,esri,console */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true */
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
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom",
    "dojo/_base/array",
    "dojo/Deferred",
    "dojo/DeferredList",
    "esri/request",
    "esri/arcgis/utils",
    "dojo/dom-attr",
    "dojo/text!./templates/baseMapGalleryTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings"
], function (declare, domConstruct, lang, on, dom, array, Deferred, DeferredList, esriRequest, esriUtils, domAttr, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,

        /**
        * create baseMapGallery widget
        *
        * @class
        * @name widgets/baseMapGallery/baseMapGallery
        */
        postCreate: function () {
            var i, basemapContainer, baseMapURL = 0, baseMapURLCount = 0,
             basemapDeferred = new Deferred();
            this._fetchBasemapCollection(basemapDeferred);
            basemapDeferred.then(lang.hitch(this, function (baseMapLayers) {
                dojo.configData.BaseMapLayers = baseMapLayers;
                for (i = 0; i < baseMapLayers.length; i++) {
                    if (baseMapLayers[i].MapURL) {
                        if (baseMapURLCount === 0) {
                            baseMapURL = i;
                        }
                        baseMapURLCount++;
                    }
                }

                basemapContainer = domConstruct.create("div", {}, dom.byId("esriCTParentDivContainer"));
                basemapContainer.appendChild(this.esriCTDivLayerContainer);
                this.layerList.appendChild(this._createBaseMapElement(baseMapURL, baseMapURLCount));
            }));
        },

        _fetchBasemapCollection: function (basemapDeferred) {
            var dListResult, groupUrl, searchUrl, webmapRequest, groupRequest, deferred, thumbnailSrc, baseMapArray = [], deferredArray = [];
            groupUrl = dojo.configData.GroupURL + "community/groups?q=title:\"" + dojo.configData.BasemapGroupTitle + "\" AND owner:" + dojo.configData.BasemapGroupOwner + "&f=json";
            groupRequest = esriRequest({
                url: groupUrl,
                callbackParamName: "callback"
            });
            groupRequest.then(function (groupInfo) {
                searchUrl = dojo.configData.SearchURL + groupInfo.results[0].id + "&sortField=name&sortOrder=desc&num=50&f=json";
                webmapRequest = esriRequest({
                    url: searchUrl,
                    callbackParamName: "callback"
                });
                webmapRequest.then(function (groupInfo) {
                    array.forEach(groupInfo.results, lang.hitch(this, function (info, index) {
                        if (info.type === "Map Service") {
                            thumbnailSrc = (groupInfo.results[index].thumbnail === null) ? dojo.configData.webmapThumbnail : dojo.configData.GroupURL + "content/items/" + info.id + "/info/" + info.thumbnail;
                            baseMapArray.push({
                                ThumbnailSource: thumbnailSrc,
                                Name: info.title,
                                MapURL: info.url
                            });
                        } else if (info.type === "Web Map") {
                            var mapDeferred = esriUtils.getItem(info.id);
                            mapDeferred.then(lang.hitch(this, function () {
                                deferred = new Deferred();
                                deferred.resolve();
                            }));
                            deferredArray.push(mapDeferred);
                        }
                    }));
                    dListResult = new DeferredList(deferredArray);
                    dListResult.then(function (res) {
                        if (res[1].length === 0) {
                            basemapDeferred.resolve(baseMapArray);
                            return;
                        }
                        array.forEach(res, function (data, innerIdx) {
                            if (innerIdx === 0) {
                                array.forEach(data[1].itemData.baseMap.baseMapLayers, function (baseMapLayer, idx) {
                                    if (baseMapLayer.url) {
                                        thumbnailSrc = (data[1].item.thumbnail === null) ? dojo.configData.WebmapThumbnail : dojo.configData.GroupURL + "content/items/" + data[1].item.id + "/info/" + data[1].item.thumbnail;
                                        baseMapArray.push({
                                            ThumbnailSource: thumbnailSrc,
                                            Name: data[1].itemData.baseMap.title,
                                            MapURL: baseMapLayer.url
                                        });
                                    }
                                });
                            } else {
                                array.some(baseMapArray, function (arrayBasemap) {
                                    array.forEach(data[1].itemData.baseMap.baseMapLayers, function (baseMapLayer, idx) {
                                        if (baseMapLayer.url && arrayBasemap.MapURL !== baseMapLayer.url) {
                                            thumbnailSrc = (data[1].item.thumbnail === null) ? dojo.configData.WebmapThumbnail : data[1].item.thumbnail;
                                            baseMapArray.push({
                                                ThumbnailSource: thumbnailSrc,
                                                Name: data[1].itemData.baseMap.title,
                                                MapURL: baseMapLayer.url
                                            });
                                        }
                                    });
                                });
                            }
                        });
                        basemapDeferred.resolve(baseMapArray);
                    });
                }, function(err) {
                    console.log(err);
                });
            }, function (err) {
                console.log(err);
            });
        },

        _createBaseMapElement: function (baseMapURL, baseMapURLCount) {
            var presentThumbNail, divContainer, imgThumbnail, presentBaseMap;
            divContainer = domConstruct.create("div", { "class": "esriCTbaseMapContainerNode" });
            imgThumbnail = domConstruct.create("img", { "class": "basemapThumbnail", "src": dojo.configData.BaseMapLayers[baseMapURL + 1].ThumbnailSource }, null);
            presentBaseMap = baseMapURL + 1;
            presentThumbNail = baseMapURL + 2;
            on(imgThumbnail, "click", lang.hitch(this, function () {
                imgThumbnail.src = dojo.configData.BaseMapLayers[presentThumbNail].ThumbnailSource;
                this._changeBaseMap(presentBaseMap);
                if (baseMapURLCount - 1 === presentThumbNail) {
                    presentThumbNail = baseMapURL;
                } else {
                    presentThumbNail++;
                }
                if (baseMapURLCount - 1 === presentBaseMap) {
                    presentBaseMap = baseMapURL;
                } else {
                    presentBaseMap++;
                }
            }));
            divContainer.appendChild(imgThumbnail);
            return divContainer;
        },

        _changeBaseMap: function (spanControl) {
            var layer, basemap;
            if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                basemap = this.map.getLayer("defaultBasemap");
            } else {
                basemap = this.map.getLayer("esriCTbasemap");
            }
            this.map.removeLayer(basemap);
            if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                layer = new esri.layers.ArcGISTiledMapServiceLayer(dojo.configData.BaseMapLayers[spanControl].MapURL, { id: "defaultBasemap", visible: true });
            } else {
                layer = new esri.layers.ArcGISTiledMapServiceLayer(dojo.configData.BaseMapLayers[spanControl].MapURL, { id: "esriCTbasemap", visible: true });
            }
            this.map.addLayer(layer, 0);
        }
    });
});
