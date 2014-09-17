/*global define,dojo */
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
    "../scrollBar/scrollBar",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/topic",
    "esri/domUtils",
    "esri/InfoWindowBase",
    "dojo/text!./templates/infoWindow.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/query",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dijit/_WidgetsInTemplateMixin"
], function (declare, domConstruct, domStyle, domAttr, lang, on, ScrollBar, dom, domClass, topic, domUtils, InfoWindowBase, template, _WidgetBase, _TemplatedMixin, query, sharedNls, _WidgetsInTemplateMixin) {
    return declare([InfoWindowBase, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        InfoShow: null,
        /**
        * create infoWindow widget
        *
        * @class
        * @name widgets/infoWindow/infoWindow
        */
        postCreate: function () {
            if (!this.infoWindowWidth) {
                this.infoWindowWidth = "100px";
            }
            if (!this.infoWindowHeight) {
                this.infoWindowHeight = "100px";
            }
            this.infoWindowContainer = domConstruct.create("div", {}, dom.byId("esriCTParentDivContainer"));
            this.infoWindowContainer.appendChild(this.domNode);
            this._anchor = domConstruct.create("div", { "class": "esriCTdivTriangle" }, this.domNode);
            domUtils.hide(this.domNode);
            domAttr.set(this.backToMap, "innerHTML", sharedNls.buttons.backToMap);

            this.own(on(this.backToMap, "click", lang.hitch(this, function () {
                this._closeInfowindow();
            })));

            this.own(on(this.divInfoMobileContent, "click", lang.hitch(this, function () {
                dojo.openInfowindow = true;
                this._openInfowindow();
            })));

            topic.subscribe("openMobileInfowindow", lang.hitch(this, function () {
                this._openInfowindow();
            }));
            topic.subscribe("onWindowResize", lang.hitch(this, function () {
                this.onWindowResize();
            }));

            this.own(on(this.esriCTclosediv, "click", lang.hitch(this, function () {
                dojo.featurePoint = null;
                dojo.showInfo = false;
                dojo.setMapTipPosition = true;
                if (dojo.window.getBox().w <= 680) {
                    this.InfoShow = true;
                } else {
                    this.InfoShow = false;
                }
                domUtils.hide(this.domNode);
            })));

            this.own(on(this.esriCTMobileCloseDiv, "click", lang.hitch(this, function () {
                dojo.featurePoint = null;
                dojo.setMapTipPosition = true;
                domUtils.hide(this.domNode);
            })));
        },

        /**
        * Set parameter on window resize
        * @memberOf widgets/infoWindow/infoWindow
        */
        onWindowResize: function () {
            this.infoWindowzIndex = 1002;
            domStyle.set(this.domNode, { zIndex: 1002 });
        },

        /**
        * Set parameter for info window
        * @memberOf widgets/infoWindow/infoWindow
        */
        infoWindowResizeOnMap: function () {
            this.infoWindowzIndex = 998;
            domStyle.set(this.domNode, { zIndex: 998 });
        },

        /**
        * show infowindow
        * @param {object} screenPoint to show infowindow
        * @memberOf widgets/infoWindow/infoWindow
        */
        show: function (detailsTab, screenPoint) {
            this.InfoShow = false;
            this.isVisible = true;
            this.infoContent = detailsTab;
            if (this.divInfoDetailsScroll) {
                while (this.divInfoDetailsScroll.hasChildNodes()) {
                    this.divInfoDetailsScroll.removeChild(this.divInfoDetailsScroll.lastChild);
                }
            }
            if (screenPoint) {
                this.setLocation(screenPoint);
            }
            if (dojo.window.getBox().w >= 680) {
                if (this.infoContainerScrollbar) {
                    this.infoContainerScrollbar.removeScrollBar();
                }
                this.divInfoDetailsScroll.appendChild(detailsTab);
                this.infoContainerScrollbar = new ScrollBar({
                    domNode: this.divInfoScrollContent
                });
                this.infoContainerScrollbar.setContent(this.divInfoDetailsScroll);
                this.infoContainerScrollbar.createScrollBar();
                while (this.infoContainerScrollbar.domNode.children.length > 1) {
                    this.infoContainerScrollbar.domNode.removeChild(this.infoContainerScrollbar.domNode.firstChild);
                }
            } else {
                this._closeInfowindow();
            }
        },

        /**
        * resize infowindow
        * @memberOf widgets/infoWindow/infoWindow
        */
        resize: function (width, height) {
            if (dojo.window.getBox().w <= 680) {
                this.infoWindowWidth = 180;
                this.infoWindowHeight = 30;
                this.infoWindowResizeOnMap();
                domStyle.set(this.domNode, { width: 180 + "px", height: 30 + "px" });
            } else {
                this.infoWindowWidth = width;
                this.infoWindowHeight = height;
                domStyle.set(this.domNode, { width: width + "px", height: height + "px" });
                var divInfoContentHeight = this.infoWindowHeight - 50,
                    esriInfoStyle = { height: divInfoContentHeight + 'px' };
                domAttr.set(this.divInfoScrollContent, "style", esriInfoStyle);
            }
            this._setScrollbarOnReSize();
        },

        /**
        * set title of infowindow
        * @memberOf widgets/infoWindow/infoWindow
        */
        setTitle: function (infoTitle, mobTitle) {
            if (infoTitle.length > 0) {
                this.esriCTheadderPanel.innerHTML = infoTitle;
                this.esriCTheadderPanel.title = infoTitle;
                this.spanDirection.innerHTML = mobTitle;
                this.spanDirection.title = mobTitle;
            } else {
                this.esriCTheadderPanel.innerHTML = "";
                this.spanDirection.innerHTML = "";
            }
        },

        /**
        * set location of infowindow
        * @memberOf widgets/infoWindow/infoWindow
        */
        setLocation: function (location) {
            if (this.isVisible) {
                if (location.spatialReference) {
                    location = this.map.toScreen(location);
                }
                domStyle.set(this.domNode, {
                    left: (location.x - (this.infoWindowWidth / 2)) + "px",
                    bottom: (location.y + 19) + "px"
                });
                if (!this.InfoShow) {
                    domUtils.show(this.domNode);
                }
                this.isShowing = true;
            }
        },

        /**
        * hide infowindow
        * @memberOf widgets/infoWindow/infoWindow
        */
        hide: function () {
            dojo.onInfoWindowResize = false;
            if (dojo.window.getBox().w <= 680) {
                this.infoWindowResizeOnMap();
            }
            domUtils.hide(this.domNode);
            this.isShowing = false;
            this.isVisible = false;
            this.onHide();
        },

        /**
        * hide infowindow container
        * @memberOf widgets/infoWindow/infoWindow
        */
        _hideInfoContainer: function () {
            this.own(on(this.esriCTclosediv, "click", lang.hitch(this, function () {
                dojo.setMapTipPosition = true;
                if (dojo.window.getBox().w <= 680) {
                    this.infoWindowResizeOnMap();
                }
                dojo.onInfoWindowResize = false;
                domUtils.hide(this.domNode);
            })));
        },

        /**
        * Create info winodw for mobile
        * @memberOf widgets/infoWindow/infoWindow
        */
        _openInfowindow: function () {
            domClass.remove(query(".cloasedivmobile")[0], "scrollbar_footerVisible");
            domClass.add(query(".esriCTInfoContent")[0], "esriCTShowInfoContent");
            domClass.add(query(".divInfoMobileContent")[0], "divHideInfoMobileContent");
            domClass.add(query(".esriCTdivTriangle")[0], "esriCThidedivTriangle");
            domClass.add(query(".esriCTinfoWindow")[0], "esriCTinfoWindowHeightWidth");
            if (dojo.window.getBox().w <= 680) {
                var divInfoContentHeight = document.documentElement.clientHeight - 60,
                    esriInfoStyle = { height: divInfoContentHeight + 'px' };
                domAttr.set(this.divInfoScrollContent, "style", esriInfoStyle);
                if (this.divInfoDetailsScroll) {
                    while (this.divInfoDetailsScroll.hasChildNodes()) {
                        this.divInfoDetailsScroll.removeChild(this.divInfoDetailsScroll.lastChild);
                    }
                }
                if (this.infoContainerScrollbar) {
                    this.infoContainerScrollbar.removeScrollBar();
                }
                this.divInfoDetailsScroll.appendChild(this.infoContent);
                this.infoContainerScrollbar = new ScrollBar({
                    domNode: this.divInfoScrollContent
                });
                this.infoContainerScrollbar.setContent(this.divInfoDetailsScroll);
                this.infoContainerScrollbar.createScrollBar();
                dojo.onInfoWindowResize = true;
                while (this.infoContainerScrollbar.domNode.children.length > 1) {
                    this.infoContainerScrollbar.domNode.removeChild(this.infoContainerScrollbar.domNode.firstChild);
                }
                topic.publish("onWindowResize");
            }
        },

        /**
        * Set Scrollbar to InfoWinodw
        * @memberOf widgets/infoWindow/infoWindow
        */
        _setScrollbarOnReSize: function () {
            if (dojo.window.getBox().w <= 680) {
                var divInfoContentHeight = document.documentElement.clientHeight - 60,
                    esriInfoStyle = { height: divInfoContentHeight + 'px' };
                domAttr.set(this.divInfoScrollContent, "style", esriInfoStyle);
                if (this.infoContainerScrollbar) {
                    this.infoContainerScrollbar.removeScrollBar();
                }
                this.infoContainerScrollbar = new ScrollBar({
                    domNode: this.divInfoScrollContent
                });
                this.infoContainerScrollbar.setContent(this.divInfoDetailsScroll);
                this.infoContainerScrollbar.createScrollBar();
                while (this.infoContainerScrollbar.domNode.children.length > 1) {
                    this.infoContainerScrollbar.domNode.removeChild(this.infoContainerScrollbar.domNode.firstChild);
                }
            }
        },

        /**
        * Hide mobile info window
        * @memberOf widgets/infoWindow/infoWindow
        */
        _closeInfowindow: function () {
            dojo.onInfoWindowResize = false;
            this.infoWindowResizeOnMap();
            domClass.remove(query(".esriCTInfoContent")[0], "esriCTShowInfoContent");
            domClass.remove(query(".divInfoMobileContent")[0], "divHideInfoMobileContent");
            domClass.remove(query(".esriCTdivTriangle")[0], "esriCThidedivTriangle");
            domClass.remove(query(".esriCTinfoWindow")[0], "esriCTinfoWindowHeightWidth");
            domClass.add(query(".cloasedivmobile")[0], "scrollbar_footerVisible");
        }

    });
});
