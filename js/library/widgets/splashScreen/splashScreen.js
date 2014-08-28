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
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/dom-attr",
    "dojo/on",
    "dojo/text!./templates/splashScreenTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/dom-class",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "../scrollBar/scrollBar"
], function (declare, domConstruct, domStyle, lang, topic, domAttr, on, template, _WidgetBase, _TemplatedMixin, domClass, _WidgetsInTemplateMixin, sharedNls, ScrollBar) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        splashScreenScrollbar: null,
        splashScreenContent: null,

        /**
        * create share widget
        *
        * @class
        * @name widgets/splashScreen/splashScreen
        */
        postCreate: function () {
            this.inherited(arguments);
            domConstruct.create("div", { "class": "customButtonInner", "innerHTML": sharedNls.buttons.okButtonText }, this.customButton);
            this.own(on(this.customButton, "click", lang.hitch(this, function () {
                this._hideSplashScreenDialog();
            })));
            this.domNode = domConstruct.create("div", { "class": "esriGovtLoadSpashScreen" }, dojo.body());
            this.domNode.appendChild(this.splashScreenScrollBarOuterContainer);
            domConstruct.create("div", { "class": "esriCTLoadingIndicator", "id": "splashscreenlodingIndicator" }, this.splashScreenScrollBarOuterContainer);
            topic.subscribe("setSplashScreenScrollbar", lang.hitch(this, function () {
                this.setSplashScreenScrollbar();
            }));
        },

        showSplashScreenDialog: function () {
            domStyle.set(this.domNode, "display", "block");
            this.splashScreenContent = domConstruct.create("div", { "class": "esriGovtSplashContent" }, this.splashScreenScrollBarContainer);
            domAttr.set(this.splashScreenContent, "innerHTML", dojo.configData.SplashScreen.SplashScreenContent);
            this.setSplashScreenScrollbar();
        },

        setSplashScreenScrollbar: function () {
            if (domStyle.get(this.domNode, "display") === "block") {
                if (this.splashScreenScrollbar) {
                    domClass.add(this.splashScreenScrollbar._scrollBarContent, "esriCTZeroHeight");
                    this.splashScreenScrollbar.removeScrollBar();
                }
                this.splashScreenScrollBarContainer.style.height = (this.splashScreenDialogContainer.offsetHeight - 70) + "px";
                if ((this.splashScreenDialogContainer.offsetHeight - 70) > document.documentElement.clientHeight) {
                    var h = document.documentElement.clientHeight - (this.splashScreenDialogContainer.offsetHeight);
                    this.splashScreenScrollBarContainer.style.height = (this.splashScreenDialogContainer.offsetHeight - 70 - h) + "px";
                } else {
                    this.splashScreenScrollBarContainer.style.height = (this.splashScreenDialogContainer.offsetHeight - 70) + "px";
                }
                this.splashScreenScrollbar = new ScrollBar({ domNode: this.splashScreenScrollBarContainer });
                if (dojo.window.getBox().w >= 680) {
                    domClass.replace(this.splashScreenScrollbar._scrollBarContent, "scrollbar_content_splashScreen", "scrollbar_content");
                }
                this.splashScreenScrollbar.setContent(this.splashScreenContent);
                this.splashScreenScrollbar.createScrollBar();
            }
        },

        _hideSplashScreenDialog: function () {
            domStyle.set(this.domNode, "display", "none");
        }
    });
});
