/*global define */
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
define({
    root: {
        showNullValue: "N/A",
        buttons: {
            okButtonText: "OK",
            print: "Print",
            back: "Back",
            backToMap: "Back to map",
            more: "More",
            less: "Less",
            link: "Link",
            embedding: "Embedding",
            email: "email",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
            facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
            twitter: "Twitter"  // Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
        },
        tooltips: {
            search: "Search",
            route: "Route",
            locate: "Locate",
            share: "Share",
            help: "Help",
            clearEntry: "Clear",
            loadingText: "Loading..."
        },
        titles: {
            directionsDisplayText: "Directions",
            informationPanelTitle: "Information for current map view",
            frequentRoute: "Frequently travelled route",
            webpageDisplayText: "Copy/paste HTML into your web page"
        },
        sentenceFragment: {
            to: "to"
        },
        errorMessages: {
            invalidSearch: "No results found",
            falseConfigParams: "Required configuration key values are either null or not exactly matching with layer attributes. This message may appear multiple times.",
            invalidLocation: "Current location not found.",
            invalidProjection: "Unable to plot current location on the map.",
            widgetNotLoaded: "Unable to load widgets.",
            shareLoadingFailed: "Unable to load share options.",
            shareFailed: "Unable to share.",
            noDirection: "Location could not be found",
            webMapMessages: "Title and/or QueryLayerId parameters in SearchSettings do not match with configured webmap",
            noInfoWindow: "InfoWindow not found for this layer"
        }

    },
    es: true,
    fr: true,
    it: true
});