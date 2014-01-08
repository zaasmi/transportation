/*global define, document, Modernizr */
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
    "dojo/dom-attr",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom-geometry",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/_base/html",
    "dojo/string",
    "esri/tasks/locator",
    "dojo/window",
    "esri/tasks/query",
    "../scrollBar/scrollBar",
    "dojo/Deferred",
    "dojo/DeferredList",
    "esri/tasks/QueryTask",
    "dojo/text!./templates/locatorTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!nls/localizedStrings",
    "dojo/topic"
    ],
     function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, domClass, html, string, Locator, window, Query, scrollBar, Deferred, DeferredList, QueryTask, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls, topic) {
         //========================================================================================================================//

         return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
             templateString: template,
             nls: nls,
             lastSearchString: null,
             stagedSearch: null,
             locatorScrollbar: null,

             /**
             * display locator widget
             *
             * @class
             * @name widgets/locator/locator
             */
             postCreate: function () {

                 /**
                 * close locator widget if any other widget is opened
                 * @param {string} widget Key of the newly opened widget
                 */
                 topic.subscribe("toggleWidget", lang.hitch(this, function (widget) {
                     if (widget != "locator") {
                         if (domGeom.getMarginBox(this.divAddressHolder).h > 0) {
                             domClass.replace(this.domNode, "esriCTTdHeaderSearch", "esriCTTdHeaderSearch-select");
                             domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                             domClass.replace(this.divAddressHolder, "esriCTZeroHeight", "esriCTAddressContentHeight");
                             this.txtAddress.blur();
                         }
                     }
                 }));
                 this.domNode = domConstruct.create("div", { "title": this.title, "class": "esriCTTdHeaderSearch" }, null);
                 domConstruct.place(this.divAddressContainer, dom.byId("esriCTParentDivContainer"));
                 this.own(on(this.domNode, "click", lang.hitch(this, function () {
                     domStyle.set(this.imgSearchLoader, "display", "none");
                     domStyle.set(this.close, "display", "block");
                     /**
                     * minimize other open header panel widgets and show locator widget
                     */
                     topic.publish("toggleWidget", "locator");
                     this._showLocateContainer();
                 })));
                 domStyle.set(this.divAddressContainer, "display", "block");
                 domAttr.set(this.divAddressContainer, "title", "");
                 domAttr.set(this.imgSearchLoader, "src", dojoConfig.baseURL + "/themes/images/blue-loader.gif");
                 this._setDefaultTextboxValue();
                 this._attachLocatorEvents();
             },

             /**
             * set default value of locator textbox as specified in configuration file
             * @param {array} dojo.configData.LocatorSettings.Locators Locator settings specified in configuration file
             * @memberOf widgets/locator/locator
             */
             _setDefaultTextboxValue: function () {
                 var locatorSettings = dojo.configData.LocatorSettings;
                 /**
                 * txtAddress Textbox for search text
                 * @member {textbox} txtAddress
                 * @private
                 * @memberOf widgets/locator/locator
                 */
                 domAttr.set(this.txtAddress, "defaultAddress", locatorSettings.LocatorDefaultAddress);
             },

             /**
             * attach locator events
             * @memberOf widgets/locator/locator
             */
             _attachLocatorEvents: function () {
                 this.own(on(this.esriCTSearch, "click", lang.hitch(this, function (evt) {
                     domStyle.set(this.imgSearchLoader, "display", "block");
                     domStyle.set(this.close, "display", "none");
                     this._locateAddress(evt);
                 })));
                 this.own(on(this.txtAddress, "keyup", lang.hitch(this, function (evt) {
                     domStyle.set(this.close, "display", "block");
                     this._submitAddress(evt);
                 })));
                 this.own(on(this.txtAddress, "dblclick", lang.hitch(this, function (evt) {
                     this._clearDefaultText(evt);
                 })));
                 this.own(on(this.txtAddress, "blur", lang.hitch(this, function (evt) {
                     this._replaceDefaultText(evt);
                 })));
                 this.own(on(this.txtAddress, "focus", lang.hitch(this, function () {
                     domStyle.set(this.close, "display", "block");
                     domClass.add(this.txtAddress, "esriCTColorChange");
                 })));
                 this.own(on(this.close, "click", lang.hitch(this, function () {
                     this._hideText();
                 })));
             },

             _hideText: function () {
                 this.txtAddress.value = "";
                 domStyle.set(this.close, "display", "none");
             },

             /**
             * show/hide locator widget and set default search text
             * @memberOf widgets/locator/locator
             */
             _showLocateContainer: function () {
                 this.txtAddress.blur();
                 if (domGeom.getMarginBox(this.divAddressHolder).h > 0) {

                     /**
                     * when user clicks on locator icon in header panel, close the search panel if it is open
                     */
                     domClass.replace(this.domNode, "esriCTTdHeaderSearch", "esriCTTdHeaderSearch-select");
                     domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                     domClass.replace(this.divAddressHolder, "esriCTZeroHeight", "esriCTAddressContentHeight");
                     this.txtAddress.blur();
                 } else {

                     /**
                     * when user clicks on locator icon in header panel, open the search panel if it is closed
                     */
                     domClass.replace(this.domNode, "esriCTTdHeaderSearch-select", "esriCTTdHeaderSearch");
                     domClass.replace(this.txtAddress, "esriCTBlurColorChange", "esriCTColorChange");
                     domClass.replace(this.divAddressHolder, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                     domClass.add(this.divAddressHolder, "esriCTAddressContentHeight");

                     domStyle.set(this.txtAddress, "verticalAlign", "middle");
                     this.txtAddress.value = domAttr.get(this.txtAddress, "defaultAddress");
                     this.lastSearchString = lang.trim(this.txtAddress.value);
                 }
                 this._setHeightAddressResults();
             },

             /**
             * search address on every key press
             * @param {object} evt Keyup event
             * @memberOf widgets/locator/locator
             */
             _submitAddress: function (evt) {
                 if (evt) {
                     if (evt.keyCode == dojo.keys.ENTER) {
                         if (this.txtAddress.value != '') {
                             domStyle.set(this.imgSearchLoader, "display", "block");
                             domStyle.set(this.close, "display", "none");
                             this._locateAddress(evt);
                             return;
                         }
                     }
                     domStyle.set(this.imgSearchLoader, "display", "block");
                     domStyle.set(this.close, "display", "none");
                     /**
                     * do not perform auto complete search if alphabets,
                     * numbers,numpad keys,comma,ctl+v,ctrl +x,delete or
                     * backspace is pressed
                     */
                     if ((!((evt.keyCode >= 46 && evt.keyCode < 58) || (evt.keyCode > 64 && evt.keyCode < 91) || (evt.keyCode > 95 && evt.keyCode < 106) || evt.keyCode == 8 || evt.keyCode == 110 || evt.keyCode == 188)) || (evt.keyCode == 86 && evt.ctrlKey) || (evt.keyCode == 88 && evt.ctrlKey)) {
                         evt.cancelBubble = true;
                         evt.stopPropagation && evt.stopPropagation();
                         return;
                     }

                     /**
                     * call locator service if search text is not empty
                     */
                     if (domGeom.getMarginBox(this.divAddressContent).h > 0) {
                         if (lang.trim(this.txtAddress.value) != '') {
                             if (this.lastSearchString != lang.trim(this.txtAddress.value)) {
                                 this.lastSearchString = lang.trim(this.txtAddress.value);
                                 domConstruct.empty(this.divAddressResults);

                                 /**
                                 * clear any staged search
                                 */
                                 clearTimeout(this.stagedSearch);
                                 if (lang.trim(this.txtAddress.value).length > 0) {

                                     /**
                                     * stage a new search, which will launch if no new searches show up
                                     * before the timeout
                                     */
                                     this.stagedSearch = setTimeout(lang.hitch(this, function () {
                                         this.stagedSearch = this._locateAddress();
                                     }), 500);
                                 }
                             }
                         } else {
                             this.lastSearchString = lang.trim(this.txtAddress.value);
                             domStyle.set(this.imgSearchLoader, "display", "none");
                             domStyle.set(this.close, "display", "block");
                             domConstruct.empty(this.divAddressResults);
                         }
                     }
                 }
             },

             /**
             * perform search by addess if search type is address search
             * @memberOf widgets/locator/locator
             */
             _locateAddress: function () {
                 domConstruct.empty(this.divAddressResults);
                 if (lang.trim(this.txtAddress.value) == '') {
                     domStyle.set(this.imgSearchLoader, "display", "none");
                     domStyle.set(this.close, "display", "block");
                     domConstruct.empty(this.divAddressResults);
                     return;
                 } else {
                     this._searchLocation();
                 }
             },

             /**
             * call locator service and get search results
             * @memberOf widgets/locator/locator
             */
             _searchLocation: function () {
                 var nameArray = { Address: [] };
                 domStyle.set(this.imgSearchLoader, "display", "block");
                 domStyle.set(this.close, "display", "none");
                 domAttr.set(this.txtAddress, "defaultAddress", this.txtAddress.value);
                 this._setHeightAddressResults();

                 /**
                 * call locator service specified in configuration file
                 */
                 var locatorSettings = dojo.configData.LocatorSettings;
                 var locator = new Locator(locatorSettings.LocatorURL);
                 var searchFieldName = locatorSettings.LocatorParameters.SearchField;
                 var addressField = {};
                 addressField[searchFieldName] = lang.trim(this.txtAddress.value);
                 var baseMapExtent = this.map.getLayer(this.map.basemapLayerIds[0]).fullExtent;
                 var options = {};
                 options["address"] = addressField;
                 options["outFields"] = locatorSettings.LocatorOutFields;
                 options[locatorSettings.LocatorParameters.SearchBoundaryField] = baseMapExtent;
                 locator.outSpatialReference = this.map.spatialReference;

                 /**
                 * get results from locator service
                 * @param {object} options Contains address, outFields and basemap extent for locator service
                 * @param {object} candidates Contains results from locator service
                 */
                 var defferedArray = [];
                 for (var index = 0; index < dojo.configData.SearchAnd511Settings.length; index++) {
                     this._locateLayersearchResult(defferedArray, index);

                 }
                 var locatorDef = locator.addressToLocations(options);
                 locator.on("address-to-locations-complete", lang.hitch(this, function (candidates) {
                     var deferred = new Deferred();
                     deferred.resolve(candidates);
                     return deferred.promise;
                 }), function () {
                     domStyle.set(this.imgSearchLoader, "display", "none");
                     domStyle.set(this.close, "display", "block");
                     this._locatorErrBack();
                 });

                 defferedArray.push(locatorDef);
                 var deferredListResult = new DeferredList(defferedArray);
                 deferredListResult.then(lang.hitch(this, function (result) {
                     if (result) {
                         if (result.length > 0) {
                             for (var num = 0; num < result.length; num++)
                                 if (dojo.configData.SearchAnd511Settings[num]) {
                                     var key = dojo.configData.SearchAnd511Settings[num].SearchDisplayTitle;
                                     nameArray[key] = [];
                                     for (var order = 0; order < result[num][1].features.length; order++) {
                                         nameArray[key].push({
                                             name: string.substitute(dojo.configData.SearchAnd511Settings[num].SearchDisplayFields, result[num][1].features[order].attributes),
                                             attributes: result[num][1].features[order].attributes
                                         });
                                     }
                                 } else {
                                     this._addressResult(result[num][1], nameArray);
                                 }
                         }
                     }
                     this._showLocatedAddress(nameArray);
                 }));
             },

             _addressResult: function (candidates, nameArray) {
                 for (var order = 0; order < candidates.length; order++) {
                     nameArray.Address.push({
                         name: string.substitute(dojo.configData.LocatorSettings.DisplayField, candidates[order].attributes),
                         attributes: candidates[order].attributes
                     });
                 }
             },

             _locateLayersearchResult: function (defferedArray, index) {
                 var layerobject = dojo.configData.SearchAnd511Settings[index];
                 domStyle.set(this.imgSearchLoader, "display", "block");
                 domStyle.set(this.close, "display", "none");
                 if (layerobject.QueryURL) {
                     var queryTask = new QueryTask(layerobject.QueryURL);
                     var query = new Query();
                     query.where = string.substitute(layerobject.SearchExpression, [lang.trim(this.txtAddress.value).toUpperCase()]);
                     query.outSpatialReference = this.map.spatialReference;
                     query.returnGeometry = false;
                     query.outFields = ["*"];
                     var queryTaskResult = queryTask.execute(query, lang.hitch(this, function (featureSet) {
                         var deferred = new Deferred();
                         deferred.resolve(featureSet);
                         return deferred.promise;
                     }), function (err) {
                         alert("error");
                     });
                     defferedArray.push(queryTaskResult);
                 }
             },

             /**
             * filter valid results from results returned by locator service
             * @param {object} candidates Contains results from locator service
             * @memberOf widgets/locator/locator
             */
             _showLocatedAddress: function (candidates) {
                 domConstruct.empty(this.divAddressResults);
                 if (lang.trim(this.txtAddress.value) === "") {
                     this.txtAddress.focus();
                     domConstruct.empty(this.divAddressResults);
                     this.locatorScrollbar = new scrollBar({ domNode: this.divAddressScrollContent });
                     this.locatorScrollbar.setContent(this.divAddressResults);
                     this.locatorScrollbar.createScrollBar();
                     domStyle.set(this.imgSearchLoader, "display", "none");
                     domStyle.set(this.close, "display", "block");
                     return;
                 }

                 /**
                 * display all the located address in the address container
                 * 'this.divAddressResults' div dom element contains located addresses, created in widget template
                 */

                 if (this.locatorScrollbar) {
                     domClass.add(this.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                     this.locatorScrollbar.removeScrollBar();
                 }
                 this.locatorScrollbar = new scrollBar({ domNode: this.divAddressScrollContent });
                 this.locatorScrollbar.setContent(this.divAddressResults);
                 this.locatorScrollbar.createScrollBar();
                 for (var candidateArray in candidates) {
                     if (candidates[candidateArray].length > 0) {
                         var divAddressCounty = domConstruct.create("div", { "class": "esriCTBottomBorder esriCTCursorPointer esriAddressCounty" }, this.divAddressResults);
                         domAttr.set(divAddressCounty, "innerHTML", candidateArray);
                         domStyle.set(this.imgSearchLoader, "display", "none");
                         domStyle.set(this.close, "display", "block");
                         for (var i = 0; i < candidates[candidateArray].length; i++) {
                             this._displayValidLocations(candidates[candidateArray][i]);
                         }
                     }
                 }
             },

             /**
             * display valid result in search panel
             * @param {object} candidate Contains valid result to be displayed in search panel
             * @return {Boolean} true if result is displayed successfully
             * @memberOf widgets/locator/locator
             */
             _displayValidLocations: function (candidate) {
                 domClass.add(this.divAddressContent, "esriCTAddressContainerHeight");
                 var candidateDate = domConstruct.create("div", { "class": "esriCTContentBottomBorder esriCTCursorPointer" }, this.divAddressResults);
                 try {
                     if (candidate.name) {
                         domAttr.set(candidateDate, "innerHTML", candidate.name);
                     }
                     else {
                         domAttr.set(candidateDate, "innerHTML", candidate);
                     }
                 } catch (err) {
                     alert(nls.errorMessages.falseConfigParams);
                 }
             },

             /**
             * hide search panel
             * @memberOf widgets/locator/locator
             */
             _hideAddressContainer: function () {
                 domClass.replace(this.domNode, "esriCTTdHeaderSearch", "esriCTTdHeaderSearch-select");
                 this.txtAddress.blur();
                 domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                 domClass.replace(this.divAddressHolder, "esriCTZeroHeight", "esriCTAddressContentHeight");

             },

             /**
             * set height of the search panel
             * @memberOf widgets/locator/locator
             */
             _setHeightAddressResults: function () {

                 /**
                 * divAddressContent Container for search results
                 * @member {div} divAddressContent
                 * @private
                 * @memberOf widgets/locator/locator
                 */
                 var height = domGeom.getMarginBox(this.divAddressContent).h;
                 if (height > 0) {

                     /**
                     * divAddressScrollContent Scrollbar container for search results
                     * @member {div} divAddressScrollContent
                     * @private
                     * @memberOf widgets/locator/locator
                     */
                     domStyle.set(this.divAddressScrollContent, "height", (height - 120) + "px");
                 }
             },

             /**
             * display search by address tab
             * @memberOf widgets/locator/locator
             */
             _showAddressSearchView: function () {
                 if (domStyle.get(this.imgSearchLoader, "display", "block") == "block") {
                     return;
                 }
                 this.txtAddress.value = domAttr.get(this.txtAddress, "defaultAddress");
                 this.lastSearchString = lang.trim(this.txtAddress.value);
                 domConstruct.empty(this.divAddressResults);
             },

             /**
             * display error message if locator service fails or does not return any results
             * @memberOf widgets/locator/locator
             */
             _locatorErrBack: function () {
                 domConstruct.empty(this.divAddressResults);
                 domStyle.set(this.imgSearchLoader, "display", "none");
                 domStyle.set(this.close, "display", "block");
                 domClass.remove(this.divAddressContent, "esriCTAddressContainerHeight");
                 var errorAddressCounty = domConstruct.create("div", { "class": "esriCTBottomBorder esriCTCursorPointer esriAddressCounty" }, this.divAddressResults);
                 domAttr.set(errorAddressCounty, "innerHTML", nls.errorMessages.invalidSearch);
             },

             /**
             * clear default value from search textbox
             * @param {object} evt Dblclick event
             * @memberOf widgets/locator/locator
             */
             _clearDefaultText: function (evt) {
                 var target = window.event ? window.event.srcElement : evt ? evt.target : null;
                 if (!target) return;
                 target.style.color = "#FFF";
                 target.value = '';
             },

             /**
             * set default value to search textbox
             * @param {object} evt Blur event
             * @memberOf widgets/locator/locator
             */
             _replaceDefaultText: function (evt) {
                 var target = window.event ? window.event.srcElement : evt ? evt.target : null;
                 if (!target) return;
                 this._resetTargetValue(target, "defaultAddress");
             },

             /**
             * set default value to search textbox
             * @param {object} target Textbox dom element
             * @param {string} title Default value
             * @param {string} color Background color of search textbox
             * @memberOf widgets/locator/locator
             */
             _resetTargetValue: function (target, title) {
                 if (target.value == '' && domAttr.get(target, title)) {
                     target.value = target.title;
                     if (target.title == "") {
                         target.value = domAttr.get(target, title);
                     }
                 }
                 if (domClass.contains(target, "esriCTColorChange")) {
                     domClass.remove(target, "esriCTColorChange");
                 }
                 domClass.add(target, "esriCTBlurColorChange");
                 this.lastSearchString = lang.trim(this.txtAddress.value);
             }
         });
     });