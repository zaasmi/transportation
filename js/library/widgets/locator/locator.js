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
    "dojo/dom-attr",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom-geometry",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/cookie",
    "dojo/text!./templates/locatorTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "./locatorSettings"
], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, domClass, cookie, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, locatorSettings) {
    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, locatorSettings], {
        templateString: template,
        sharedNls: sharedNls,
        lastSearchString: null,
        stagedSearch: null,
        locatorScrollbar: null,
        screenPoint: null,
        currentValue: window.orientation,
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
                if (widget !== "locator") {
                    if (domGeom.getMarginBox(this.divAddressHolder).h > 0) {
                        domClass.replace(this.domNode, "esriCTTdHeaderSearch", "esriCTTdHeaderSearch-select");
                        domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                        this.txtAddress.blur();
                    }
                }
            }));
            topic.subscribe("createInfoWindowContent", lang.hitch(this, function (mapPoint, attributes, fields, infoIndex, featureArray, count, map, isInfoArrowClicked) {
                this.createInfoWindowContent(mapPoint, attributes, fields, infoIndex, featureArray, count, map, isInfoArrowClicked);
            }));

            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.search, "class": "esriCTTdHeaderSearch" }, null);
            domConstruct.place(this.divAddressContainer, dom.byId("esriCTParentDivContainer"));
            this.own(on(this.domNode, "click", lang.hitch(this, function () {
                domStyle.set(this.imgSearchLoader, "display", "none");
                domStyle.set(this.close, "display", "block");

                /**
                * minimize other open header panel widgets and show locator widget
                */
                topic.publish("toggleWidget", "locator");
                topic.publish("setMaxLegendLength");
                this._showLocateContainer();
            })));
            domStyle.set(this.divAddressContainer, "display", "block");
            domAttr.set(this.divAddressContainer, "title", "");
            domAttr.set(this.imgSearchLoader, "src", dojoConfig.baseURL + "/js/library/themes/images/blue-loader.gif");
            this._setDefaultTextboxValue();
            this._attachLocatorEvents();
            this.addressContentheight = domGeom.getMarginBox(this.divAddressScrollContent).h;
            if (window.orientation !== undefined && window.orientation !== null) {
                on(window, "orientationchange", lang.hitch(this, function () {
                    if (this.currentValue !== window.orientation) {
                        this.currentValue = window.orientation;
                        this._resetLocatorScrollBar();
                    }
                }));
            }

        },



        /**
        * set default value of locator textbox as specified in configuration file
        * @param {array} dojo.configData.LocatorSettings.Locators Locator settings specified in configuration file
        * @memberOf widgets/locator/locator
        */
        _setDefaultTextboxValue: function () {
            var storage, locatorConfigSettings = dojo.configData.LocatorSettings;
            storage = window.localStorage;

            /**
            * txtAddress Textbox for search text
            * @member {textbox} txtAddress
            * @private
            * @memberOf widgets/locator/locator
            */
            if (storage) {
                this.txtAddress.value = (storage.getItem("LocatorAddress") !== null) ? storage.getItem("LocatorAddress") : locatorConfigSettings.LocatorDefaultAddress;
                domAttr.set(this.txtAddress, "defaultAddress", this.txtAddress.value);
            } else if (cookie.isSupported()) {
                this.txtAddress.value = (cookie("LocatorAddress") !== undefined) ? cookie("LocatorAddress") : locatorConfigSettings.LocatorDefaultAddress;
                domAttr.set(this.txtAddress, "defaultAddress", this.txtAddress.value);
            } else {
                domAttr.set(this.txtAddress, "defaultAddress", locatorConfigSettings.LocatorDefaultAddress);
            }
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
                if (domStyle.get(this.imgSearchLoader, "display") === "none") {
                    domStyle.set(this.close, "display", "block");
                }
                domClass.add(this.txtAddress, "esriCTColorChange");
            })));
            this.own(on(this.close, "click", lang.hitch(this, function () {
                this._hideText();
            })));
        },

        /**
        * Hide textbox text
        * @memberOf widgets/locator/locator
        */
        _hideText: function () {
            this.txtAddress.value = "";
            domConstruct.empty(this.divAddressResults, this.divAddressScrollContent);
            domAttr.set(this.txtAddress, "defaultAddress", this.txtAddress.value);
            domClass.remove(this.divAddressContent, "esriCTAddressContainerHeight");
            domClass.remove(this.divAddressContent, "esriCTAddressResultHeight");
            if (this.locatorScrollbar) {
                domClass.add(this.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                this.locatorScrollbar.removeScrollBar();
            }
            domStyle.set(this.divAddressScrollContainer, "display", "none");
            domStyle.set(this.noResultFound, "display", "none");
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
                this.txtAddress.blur();
            } else {

                /**
                * when user clicks on locator icon in header panel, open the search panel if it is closed
                */
                domClass.replace(this.domNode, "esriCTTdHeaderSearch-select", "esriCTTdHeaderSearch");
                domClass.replace(this.txtAddress, "esriCTBlurColorChange", "esriCTColorChange");
                domClass.replace(this.divAddressHolder, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
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
                if (evt.keyCode === dojo.keys.ENTER) {
                    if (this.txtAddress.value !== '') {
                        domStyle.set(this.imgSearchLoader, "display", "block");
                        domStyle.set(this.close, "display", "none");
                        this._locatorErrBack();
                        this._locateAddress(evt);
                        return;
                    }
                }

                /**
                * do not perform auto complete search if alphabets,
                * numbers,numpad keys,comma,ctl+v,ctrl +x,delete or
                * backspace is pressed
                */
                if ((!((evt.keyCode >= 46 && evt.keyCode < 58) || (evt.keyCode > 64 && evt.keyCode < 91) || (evt.keyCode > 95 && evt.keyCode < 106) || evt.keyCode === 8 || evt.keyCode === 110 || evt.keyCode === 188)) || (evt.keyCode === 86 && evt.ctrlKey) || (evt.keyCode === 88 && evt.ctrlKey)) {
                    evt.cancelBubble = true;
                    if (evt.stopPropagation) {
                        evt.stopPropagation();
                    }
                    domStyle.set(this.imgSearchLoader, "display", "none");
                    domStyle.set(this.close, "display", "block");
                    return;
                }

                /**
                * call locator service if search text is not empty
                */
                domStyle.set(this.imgSearchLoader, "display", "block");
                domStyle.set(this.close, "display", "none");
                if (domGeom.getMarginBox(this.divAddressContent).h > 0) {
                    if (lang.trim(this.txtAddress.value) !== '') {
                        if (this.lastSearchString !== lang.trim(this.txtAddress.value)) {
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
                        this._locatorErrBack();
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
            domClass.add(this.divAddressHolder, "esriCTAddressContentHeight");
            if (lang.trim(this.txtAddress.value) === '') {
                domStyle.set(this.imgSearchLoader, "display", "none");
                domStyle.set(this.close, "display", "block");
                domConstruct.empty(this.divAddressResults);
                if (this.locatorScrollbar) {
                    domClass.remove(this.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                }
                this._locatorErrBack();
                return;
            }
            this.searchLocation();
        },

        /**
        * hide search panel
        * @memberOf widgets/locator/locator
        */
        _hideAddressContainer: function () {
            domClass.replace(this.domNode, "esriCTTdHeaderSearch", "esriCTTdHeaderSearch-select");
            this.txtAddress.blur();
            domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
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
            var contentHeight, addressContentHeight = domGeom.getMarginBox(this.divAddressContent).h;
            if (addressContentHeight > 0) {

                /**
                * divAddressScrollContent Scrollbar container for search results
                * @member {div} divAddressScrollContent
                * @private
                * @memberOf widgets/locator/locator
                */
                contentHeight = { height: addressContentHeight - 120 + 'px' };
                domStyle.set(this.divAddressScrollContent, "style", contentHeight + "px");
            }
        },

        /**
        * display search by address tab
        * @memberOf widgets/locator/locator
        */
        _showAddressSearchView: function () {
            if (domStyle.get(this.imgSearchLoader, "display") === "block") {
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
            domStyle.set(this.divAddressScrollContainer, "display", "none");
            domStyle.set(this.imgSearchLoader, "display", "none");
            domStyle.set(this.close, "display", "block");
            domClass.remove(this.divAddressContent, "esriCTAddressContainerHeight");
            domClass.add(this.divAddressContent, "esriCTAddressResultHeight");
            domClass.remove(this.divAddressHolder, "esriCTAddressContentHeight");
            domStyle.set(this.noResultFound, "display", "block");
        },

        /**
        * clear default value from search textbox
        * @param {object} evt Dblclick event
        * @memberOf widgets/locator/locator
        */
        _clearDefaultText: function (evt) {
            var target = window.event ? window.event.srcElement : evt ? evt.target : null;
            if (!target) {
                return;
            }
            target.style.color = "#FFF";
            target.value = '';
            this.txtAddress.value = "";
            domAttr.set(this.txtAddress, "defaultAddress", this.txtAddress.value);
        },

        /**
        * set default value to search textbox
        * @param {object} evt Blur event
        * @memberOf widgets/locator/locator
        */
        _replaceDefaultText: function (evt) {
            var target = window.event ? window.event.srcElement : evt ? evt.target : null;
            if (!target) {
                return;
            }
            domStyle.set(this.noResultFound, "display", "none");
            this._resetTargetValue(target, "defaultAddress");
        },

        /**
        * set default value to search textbox
        * @param {object} target Textbox dom element
        * @param {string} title Default value
        * @memberOf widgets/locator/locator
        */
        _resetTargetValue: function (target, title) {
            if (target.value === '' && domAttr.get(target, title)) {
                target.value = target.title;
                if (target.title === "") {
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
