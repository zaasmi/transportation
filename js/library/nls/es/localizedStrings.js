﻿/*global define */
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
        showNullValue: "@es@ N/A",
        buttons: {
            okButtonText: "@es@ OK",
            print: "@es@ Print",
            back: "@es@ Back",
            more: "@es@ More",
            less: "@es@ Less",
            link: "@es@ Link",
            email: "correo electrónico",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
            Facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
            Twitter: "Twitter"  // Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
        },
        tooltips: {
            search: "Buscar",
            route: "@es@ Route",
            locate: "Ubicación actual",
            share: "Compartir",
            help: "Ayuda",
            clearEntry: "@es@ Clear"
        },
        titles: {
            directionsDisplayText: "@es@ Directions",
            informationPanelTitle: "@es@ Information for current map view",
            frequentRoute: "@es@ Frequently travelled route",
            webpageDisplayText: "@es@ Copy/paste HTML into your web page"
        },
        sentenceFragment: {
            to: "@es@ to"
        },
        errorMessages: {
            invalidSearch: "No hay resultados",
            falseConfigParams: "Valores clave de configuración requeridos son null o no coincida exactamente con los atributos de capa, este mensaje puede aparecer varias veces."
            invalidLocation: "@es@ Current location not found.",
            invalidProjection: "@es@ Unable to plot current location on the map.",
            widgetNotLoaded: "@es@ Unable to load widgets.",
            shareLoadingFailed: "@es@ Unable to load share options.",
            shareFailed: "@es@ Unable to share.",
            noDirection: "@es@ No direction found"
        },
        notUsed: {
            addressDisplayText: "@es@ Address",
            backToMap: "@es@ Back to map"
        }
});
