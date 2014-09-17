/*global define */
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
define([], function () {
    return {

        // This file contains various configuration settings for esri template
        //
        // Use this file to perform the following:
        //
        // 1.  Specify application Name                      - [ Tag(s) to look for: ApplicationName ]
        // 2.  Set path for application icon                 - [ Tag(s) to look for: ApplicationIcon ]
        // 3.  Set path for application favicon              - [ Tag(s) to look for: ApplicationFavicon ]
        // 4.  Set URL for help page                         - [ Tag(s) to look for: HelpURL ]
        // 5.  Set URL for Custom logo                       - [ Tag(s) to look for: CustomLogoUrl ]
        // 5.  Specify header widget settings                - [ Tag(s) to look for: AppHeaderWidgets ]
        // 6.  Set proxy url                                 - [ Tag(s) to look for: ProxyUrl ]
        // 7.  Set settings  for splash screen               - [ Tag(s) to look for: SplashScreen ]
        // 8.  Set Information Tab DisplayText               - [ Tag(s) to look for: InformationDisplayText ]
        // 9.  Set Re Route Display Text                     - [ Tag(s) to look for: ReRouteDisplayText ]
        // 10. Set Frequently route Tab DisplayText          - [ Tag(s) to look for: FrequentRoute ]
        // 11. Specify header widget settings                - [ Tag(s) to look for: AppHeaderWidgets ]
        // 12. Specify URL to ArcGIS Portal REST API         - [ Tag(s) to look for: PortalAPIURL ]
        // 13. Specify URL to Search                         - [ Tag(s) to look for: SearchURL ]
        // 14. Specify the group title that contains basemaps- [ Tag(s) to look for: BasemapGroupTitle ]
        // 15. Specify the group name that contains basemaps - [ Tag(s) to look for: BasemapGroupOwner ]
        // 16. Specify path to display the thumbnail for a   - [ Tag(s) to look for: NoThumbnail ]
        //     basemap when portal does not provide it
        // 17. Specify WebMap Id                             - [ Tag(s) to look for: WebMapId ]
        // 18. Specify Theme                                 - [ Tag(s) to look for: ThemeColor ]
        // 19. Specify URLs for operational layers           - [ Tag(s) to look for: OperationalLayers]
        // 19. Specify search and 511 settings               - [ Tag(s) to look for: SearchAnd511Settings]
        // 20. Customize zoom level for address search       - [ Tag(s) to look for: ZoomLevel ]
        // 21. Set Time interval to refresh all layers on ma - [ Tag(s) to look for: LayersRefreshInterval  ]
        // 22. Customize Info-popup Height                   - [ Tag(s) to look for: InfoPopupHeight ]
        // 23. Customize Info-popup width                    - [ Tag(s) to look for: InfoPopupWidth ]
        // 24. Specify info-popup settings                   - [ Tag(s) to look for: InfoWindowSettings ]
        // 25. Customize address search settings             - [ Tag(s) to look for: LocatorSettings]
        // 26. Specify info-popup settings                   - [ Tag(s) to look for: FrequentRoutesSettings ]
        // 27. Set URL for geometry service                  - [ Tag(s) to look for: GeometryService ]
        // 28. Specify routing service URL                   - [ Tag(s) to look for: RouteTaskService ]
        // 29. Set routing Enable/Disable flag               - [ Tag(s) to look for: RoutingEnabled ]
        // 30. Specify the buffer distance                   - [ Tag(s) to look for: BufferMilesForProximityAnalysis ]
        // 31. Specify a distance to find barriers           - [ Tag(s) to look for: BufferMetersForFindingBarriers ]
        // 32. Specify Buffer Symbology                      - [ Tag(s) to look for: BufferSymbology ]
        // 33. Specify route Symbology                       - [ Tag(s) to look for: RouteSymbology ]
        // 34. Specify URLs for map sharing                  - [ Tag(s) to look for: MapSharingOptions,TinyURLServiceURL, TinyURLResponseAttribute, FacebookShareURL, TwitterShareURL, ShareByMailLink ]


        // GENERAL SETTINGS
        //------------------------------------------------------------------------------------------------------------------------
        // Set application title
        ApplicationName: "",

        // Set application icon path
        ApplicationIcon: "/js/library/themes/images/logo.png",

        // Set application Favicon path
        ApplicationFavicon: "/js/library/themes/images/favicon.ico",

        // Set URL of help page/portal
        HelpURL: "help.htm",

        // Set application logo url
        CustomLogoUrl: "http://nddotfargo.com/uploads/media/nddotlogo.png",

        // Set proxy url
        ProxyUrl: "/proxy/proxy.ashx",

        // Set splash window content - Message that appears when the application starts
        SplashScreen: {
            SplashScreenContent: "<center> Welcome to the <b>Transportation 511</b> application</center><hr><br> The  <b>Transportation 511</b> application is a configuration of ArcGIS and the JavaScript API that allows interested parties to understand the status of the roads across the state.<br><br>Interested parties can monitor the status of incidents, accidents and roadway conditions and understand how they could be impacted.",
            IsVisible: true
        },

        // Set Information Tab DisplayText
        InformationDisplayText: "511 Information",

        // Set Re Route Display Text
        ReRouteDisplayText: "Traffic incidents found on this road.",

        // Set Frequently travelled route Tab DisplayText
        FrequentRoute: "Frequently travelled routes",

        // Set Direction Tab DisplayText
        DirectionsDisplayText: "Directions",

        // Specify URL to ArcGIS Portal REST API. If you are using ArcGIS Online, leave this parameter as is.
        PortalAPIURL: "http://www.arcgis.com/sharing/rest/",
        // Specify the title of group that contains basemaps
        BasemapGroupTitle: "Basemaps",
        // Specify the user name of owner of the group that contains basemaps
        BasemapGroupOwner: "GISITAdmin",
        // Specify path to image used to display the thumbnail for a basemap when portal does not provide it
        NoThumbnail: "js/library/themes/images/not-available.png",

        // If you want to use a WebMap for configuration and setup of the app specify a WebMapId within quotes,          otherwise leave this empty and configure operational layers
        WebMapId: "ec4ac1550d5240eca0997f1e55006e0c",

        ThemeColor: "js/library/themes/styles/orangeTheme.css",

        // Set Legend Visibility
        ShowLegend: "true",

        // SEARCH AND 511 SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Configure search, barrier and info settings to be displayed in search and 511 Info panels:

        // Configure search and 511 settings below.
        // Title: In the case of webmap implementations which use hosted services, the title must match layer name specified in webmap. If using ArcGIS Server operational layers, the title should be the name of the ArcGIS Server Service.
        // QueryLayerId: This is the layer index in the webmap (if using hosted services) or ArcGIS Map/Feature Service and is used for performing queries.
        // SearchDisplayTitle: This text is displayed in search results as the title to group results.
        // SearchDisplayFields: Attribute that will be displayed in the search box when user performs a search.
        // SearchExpression: Configure the query expression to be used for the search.
        // BarrierLayer: Set the value to  "true" or "false" to treat this as a barrier layer to be used for routing and re-routing.
        // BarrierSearchExpression: Configure the query expression to search for barriers along a route.
        // Set this to emtpy "", if all features in the layer should be considered as barriers.
        // InfoLayer: Allowed values are "true" or "false". Configure this to "true" to present this as information in the  511 panel.

        // InfoSearchExpression: Configure the query expression to search features and display in 511 Information panels.
        // Set this to empty "", if all features in the layer should be considered.
        // InfoListText: This text is displayed in the 511 Information Summary panel.
        //               If empty "", then SearchDisplayTitle is used (if configured), otherwise the layer name in the webmap/mapservice is used.
        // InfoDetailFields: Attributes that will be displayed in the 511 Information Details panel.
        //                   If the string is empty "", then SearchDisplayFields will be used (if configured), else displayField property of layer in mapservice will be used.

        SearchAnd511Settings: [
            {
                Title: "Transportation511",
                QueryLayerId: "0",
                SearchDisplayTitle: "Width and Height Restrictions",
                SearchDisplayFields: "${HWYDESC} / ${DELAYDESC} / ${WIDTHREST} / ${HEIGHTREST}",
                SearchExpression: "UPPER(HWYNAME) LIKE UPPER('${0}%') OR UPPER(HWYDESC) LIKE UPPER('${0}%')",
                BarrierLayer: "false",
                BarrierSearchExpression: "",
                InfoLayer: "true",
                InfoSearchExpression: "",
                InfoListText: "",
                InfoDetailFields: "HWY:${HWYNAME}/ MaxHeight:${HEIGHTREST} MaxWidth:${WIDTHREST}"
            }, {
                Title: "Transportation511",
                QueryLayerId: "1",
                SearchDisplayTitle: "WorkZones",
                SearchDisplayFields: "${HWYNAME} / ${DELAYDESC}",
                SearchExpression: "UPPER(HWYNAME) LIKE UPPER('${0}%') OR UPPER(HWYDESC) LIKE UPPER('${0}%')",
                BarrierLayer: "true",
                BarrierSearchExpression: "(STARTDATE >= CURRENT_TIMESTAMP AND ENDDATE <= CURRENT_TIMESTAMP)",
                InfoLayer: "true",
                InfoSearchExpression: "",
                InfoListText: "",
                InfoDetailFields: "Hwy:${HWYNAME} / ${DELAYDESC}"
            }, {
                Title: "Transportation511",
                QueryLayerId: "2",
                SearchDisplayTitle: "Severe Alerts",
                SearchDisplayFields: "${HWYNAME} / ${CONDDESC}",
                SearchExpression: "UPPER(HWYNAME) LIKE UPPER('${0}%') OR UPPER(HWYDESC) LIKE UPPER('${0}%')",
                BarrierLayer: "true",
                BarrierSearchExpression: "(STARTDATE >= CURRENT_TIMESTAMP AND EFFDATE <= CURRENT_TIMESTAMP)",
                InfoLayer: "true",
                InfoSearchExpression: "",
                InfoListText: "",
                InfoDetailFields: "Hwy:${HWYNAME} / ${DELAYDESC}"
            }, {
                Title: "Transportation511",
                QueryLayerId: "3",
                SearchDisplayTitle: "Alerts",
                SearchDisplayFields: "${HWYNAME}",
                SearchExpression: "UPPER(HWYNAME) LIKE UPPER('%${0}%')",
                BarrierLayer: "false",
                BarrierSearchExpression: "",
                InfoLayer: "true",
                InfoSearchExpression: "",
                InfoListText: "",
                InfoDetailFields: "Hwy:${HWYNAME} / ${DELAYDESC}"
            }, {
                Title: "Transportation511",
                QueryLayerId: "4",
                SearchDisplayTitle: "Windspeed",
                SearchDisplayFields: "${STATIONNAME} / ${WINDSPEED}",
                SearchExpression: "UPPER(STATIONNAME) LIKE UPPER('%${0}%')",
                BarrierLayer: "true",
                BarrierSearchExpression: "WINDSPEED > 20",
                InfoLayer: "true",
                InfoSearchExpression: "",
                InfoListText: "",
                InfoDetailFields: "${STATIONNAME} / Wind Speed:${WINDSPEED}"
            }, {
                Title: "Transportation511",
                QueryLayerId: "5",
                SearchDisplayTitle: "Cameras",
                SearchDisplayFields: "${CAMDESC}",
                SearchExpression: "UPPER(CAMDESC) LIKE UPPER('${0}%')",
                BarrierLayer: "false",
                BarrierSearchExpression: "",
                InfoLayer: "true",
                InfoSearchExpression: "",
                InfoListText: "",
                InfoDetailFields: "${CAMDESC}"
            }, {
                Title: "Transportation511",
                QueryLayerId: "6",
                SearchDisplayTitle: "Closed Roads",
                SearchDisplayFields: "${HWYNAME} / ${CONDDESC}",
                SearchExpression: "UPPER(HWYNAME) LIKE UPPER('${0}%') OR UPPER(HWYDESC) LIKE UPPER('${0}%')",
                BarrierLayer: "false",
                BarrierSearchExpression: "",
                InfoLayer: "true",
                InfoSearchExpression: "",
                InfoListText: "",
                InfoDetailFields: "Hwy:${HWYNAME} / ${CONDDESC}"
            }, {
                Title: "Transportation511",
                QueryLayerId: "7",
                SearchDisplayTitle: "RoadConditions",
                SearchDisplayFields: "${HWYNAME} / ${CONDDESC}",
                SearchExpression: "UPPER(HWYNAME) LIKE UPPER('${0}%') OR UPPER(HWYDESC) LIKE UPPER('${0}%')",
                BarrierLayer: "true",
                BarrierSearchExpression: "EFFDATE >= CURRENT_TIMESTAMP",
                InfoLayer: "true",
                InfoSearchExpression: "ACTIVE = 'Yes'",
                InfoListText: "",
                InfoDetailFields: "Condition:${HWYDESC} - ${CONDDESC}"
            }, {
                Title: "Transportation511",
                QueryLayerId: "8",
                SearchDisplayTitle: "LoadRestrictions",
                SearchDisplayFields: "${HWYNAME} / ${RESCODEDES}",
                SearchExpression: "UPPER(HWYNAME) LIKE UPPER('${0}%') OR UPPER(HWYDESC) LIKE UPPER('${0}%')",
                BarrierLayer: "true",
                BarrierSearchExpression: "EFFDATE >= CURRENT_TIMESTAMP",
                InfoLayer: "true",
                InfoSearchExpression: "ACTIVE = 'Yes'",
                InfoListText: "",
                InfoDetailFields: "Restriction:${HWYDESC} - ${RESCODEDES}"
            }
        ],

        // Following zoom level will be set for the map upon searching an address
        ZoomLevel: 12,

        // Following Tolerance will be used to identify features on map click to display InfoWindow
        InfoWindowTolerance: 15,

        // Time interval to refresh all layers on map
        LayersRefreshInterval: 5, // in minutes

        //minimum height should be 250 for the info-popup in pixels
        InfoPopupHeight: 250,

        // Minimum width should be 300 for the info-popup in pixels
        InfoPopupWidth: 350,


        // ADDRESS SEARCH SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Set locator settings such as locator symbol, size, display fields, match score
        // LocatorParameters: Parameters(text, outFields, maxLocations, bbox, outSR) used for address and location search.
        // AddressSearch: Candidates based on which the address search will be performed.
        // AddressMatchScore: Setting the minimum score for filtering the candidate results.
        // MaxResults: Maximum number of locations to display in the results menu.
        LocatorSettings: {
            DefaultLocatorSymbol: "/js/library/themes/images/redpushpin.png",
            MarkupSymbolSize: {
                width: 35,
                height: 35
            },
            DisplayText: "Address",
            LocatorDefaultAddress: "Grandview Ln N, Bismarck, ND, 58503",
            LocatorParameters: {
                SearchField: "SingleLine",
                SearchBoundaryField: "searchExtent"
            },
            LocatorURL: "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
            LocatorOutFields: ["Addr_Type", "Type", "Score", "Match_Addr", "xmin", "xmax", "ymin", "ymax"],
            DisplayField: "${Match_Addr}",
            AddressMatchScore: {
                Field: "Score",
                Value: 80
            },
            FilterFieldName: 'Addr_Type',
            FilterFieldValues: ["StreetAddress", "StreetName", "PointAddress", "POI"],
            MaxResults: 200
        },

        // ------------------------------------------------------------------------------------------------------------------------
        // FREQUENTLY TRAVELLED ROUTES SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------

        // Title should match the service name for ArcGIS Server. If using hosted feature services with a webmap, use the layer title in the webmap.
        // QueryLayerId should be set to the layer index.
        // UniqueRouteField: Specify the field that contains values which uniquely identify routes
        // DisplayField: Attributes to be displayed in list of frequently travelled routes
        FrequentRoutesSettings: {
            Title: "Transportation511",
            QueryLayerId: "9",
            UniqueRouteField: "ROUTEID",
            DisplayField: "Route ID:${ROUTEID} / Highway:${HWYNUM} - ${DIRECTION}",
            FrequentRoutesEnabled: "false"
        },

        // ------------------------------------------------------------------------------------------------------------------------
        // GEOMETRY SERVICE SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------

        // Set geometry service URL
        GeometryService: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer",
        // ------------------------------------------------------------------------------------------------------------------------

        // ------------------------------------------------------------------------------------------------------------------------
        // ROUTING SERVICE SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------

        // Set routing service URL
        // To use ArcGIS Online Routing Service:
        RouteTaskService: "http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",

        // Enable/Disable driving directions facility in the application.Note: If routing is enabled using the World         Route service, credits will be consumed.
        RoutingEnabled: "true",

        // Specify the buffer distance (in miles) to find 511 information along a route. This should typically be set        between 1 to 2 miles.
        BufferMilesForProximityAnalysis: "1",

        // Barriers may lie very close to the route but not exactly on the route. Specify a distance (in meters) to          find barriers that should be
        // considered as occuring on the route. This should typically be set between 1 to 3 meters.
        BufferMetersForFindingBarriers: "2",

        // Set symbology for Buffer
        BufferSymbology: {
            FillSymbolColor: "0,0,255",
            FillSymbolTransparency: "0.10",
            LineSymbolColor: "0,0,255",
            LineSymbolTransparency: "0.30"
        },

        // Set symbology for route
        // ColorRGB: Specify the color as comma separated R,G,B values
        // Transparency: Specify the transparency value between 0:Fully Transparent and 1:Fully Opaque
        // Width: Specify the display width of route in pixels
        // DirectionUnits: Specify unit for Direction Results
        // RouteDragMarkerOutlineColor: Specify Route Drag outline color
        // RouteDragMarkerFillColor: Specify Route Drag fill color
        // RouteDragMarkerWidth: Specify Route Drag width
        RouteSymbology: {
            ColorRGB: "0,0,225",
            Transparency: "0.5",
            Width: "4",
            DirectionUnits: "MILES",
            RouteDragMarkerOutlineColor: "007AC2",
            RouteDragMarkerFillColor: "FFFFFF",
            RouteDragMarkerWidth: 2
        },

        //------------------------------------------------------------------------------------------------------------------------
        // Header Widget Settings
        //------------------------------------------------------------------------------------------------------------------------
        // Set widgets settings such as widget title, widgetPath, mapInstanceRequired to be displayed in header panel
        // Title: Name of the widget, will displayed as title of widget in header panel
        // WidgetPath: path of the widget respective to the widgets package.
        // MapInstanceRequired: true if widget is dependent on the map instance.
        AppHeaderWidgets: [
            {
                WidgetPath: "widgets/locator/locator",
                MapInstanceRequired: true
            }, {
                WidgetPath: "widgets/route/route",
                MapInstanceRequired: true
            }, {
                WidgetPath: "widgets/geoLocation/geoLocation",
                MapInstanceRequired: true
            }, {
                WidgetPath: "widgets/share/share",
                MapInstanceRequired: true
            }, {
                WidgetPath: "widgets/help/help",
                MapInstanceRequired: false
            }
        ],
        // ------------------------------------------------------------------------------------------------------------------------
        // SETTINGS FOR MAP SHARING
        // ------------------------------------------------------------------------------------------------------------------------

        // Set URL for TinyURL service, and URLs for social media
        MapSharingOptions: {
            TinyURLServiceURL: "https://api-ssl.bitly.com/v3/shorten?longUrl=${0}",
            TinyURLResponseAttribute: "data.url",
            FacebookShareURL: "http://www.facebook.com/sharer.php?m2w&u=${0}&t=Transportation%20511",
            TwitterShareURL: "http://mobile.twitter.com/compose/tweet?status=Transportation%20511 ${0}",
            ShareByMailLink: "mailto:%20?subject=Check%20out%20this%20map!&body=${0}"
        }
    };
});
