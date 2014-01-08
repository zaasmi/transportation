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
    "dojo/dom-style",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/query",
    "dojo/dom-attr",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/string",
    "dojo/_base/html",
    "dojo/aspect",
    "dojo/text!./templates/legendsTemplate.html",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/renderers/SimpleRenderer",
    "dojo/_base/Color",
    "dojo/topic",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!nls/localizedStrings"
  ],
function (declare, domConstruct, domStyle, lang, array, query, domAttr, on, dom, domClass, domGeom, string, html, aspect, template, simpleMarkerSymbol, simpleFillSymbol, SimpleRenderer, Color, topic, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        nls: nls,
        divLegendList: null,

        /**
        * create legends widget
        *
        * @class
        * @name widgets/legends/legends
        */
        postCreate: function () {
            if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length != 0) {
                for (var i in this.addLayersObject) {
                    this._addLegendOnMap(this.addLayersObject[i]);
                }
            }
            else {
                this._addLegendOnMap();
            }
        },

        _addLegendOnMap: function (addLayersObject) {
            var layerObject;
            if (addLayersObject) {
                layerObject = addLayersObject.layerObject;
            } else {
                layerObject = this.addLayersObject.layer;
            }
            var image;
            var divLegendLabl;
            domAttr.set(this.divlegendList, "layerID", layerObject.id);
            if (layerObject.geometryType == "esriGeometryPoint") {
                if (layerObject.renderer.infos) {
                    for (var i = 0; i < layerObject.renderer.infos.length; i++) {
                        this.divLegendlist = domConstruct.create("div", { "class": "divLegendlist" }, this.divlegendContainer);
                        var divLegendImage = domConstruct.create("div", { "class": "legend" }, null);
                        if (layerObject.renderer.infos[i].symbol.url) {
                            image = this._createImage(layerObject.renderer.infos[i].symbol.url, "", false, layerObject.renderer.infos[i].symbol.width, layerObject.renderer.infos[i].symbol.height);
                        }
                        domConstruct.place(image, divLegendImage);
                        this.divLegendlist.appendChild(divLegendImage);
                        divLegendLabl = dojo.create("div", { "class": "legendlbl" }, null);
                        domAttr.set(divLegendLabl, "innerHTML", layerObject.renderer.infos[i].label);
                        this.divLegendlist.appendChild(divLegendLabl);
                    }
                }
                else {
                    this.divLegendlist = domConstruct.create("div", { "class": "divLegendlist" }, this.divlegendContainer);
                    divLegendImage = dojo.create("div", { "class": "legend" }, null);
                    if (layerObject.renderer.symbol.url) {
                        image = this._createImage(layerObject.renderer.symbol.url, "", false, layerObject.renderer.symbol.width, layerObject.renderer.symbol.height);
                    }
                    domConstruct.place(image, divLegendImage);
                    this.divLegendlist.appendChild(divLegendImage);
                    divLegendLabl = dojo.create("div", { "class": "legendlbl" }, null);
                    this.divLegendlist.appendChild(divLegendLabl);
                }
            }
        },

        _createImage: function (imageSrc, title, isCursorPointer, imageWidth, imageHeight) {
            var imgLocate = domConstruct.create("img");
            var imageHeightWidth = { width: imageWidth + 'px', height: imageHeight + 'px' };
            domAttr.set(imgLocate, "style", imageHeightWidth);
            if (isCursorPointer) {
                domStyle.set(imgLocate, "cursor", "pointer");
            }
            domAttr.set(imgLocate, "src", imageSrc);
            domAttr.set(imgLocate, "title", title);
            return imgLocate;
        }
    });
});