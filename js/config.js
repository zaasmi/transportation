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

        // ------------------------------------------------------------------------------------------------------------------------
        // GENERAL SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Set application title
        ApplicationName: "Transportation 511",

        // Set application icon path
        ApplicationIcon: "",

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
            SplashScreenContent: "An application that allows the public to find information about road conditions, 511 alerts, traffic incidents, et al.",
            IsVisible: true
        },

        // Set Information Tab DisplayText
        InformationDisplayText: "511 Information",

        // Set Re Route Display Text
        ReRouteDisplayText: "Traffic incidents found on this road",

        // Set Frequently travelled route Tab DisplayText
        FrequentRoute: "Frequently travelled route",

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

        // Specify URL to ArcGIS Portal REST API
        PortalAPIURL: "http://www.arcgis.com/sharing/rest/",
        // Specify URL to Search
        SearchURL: "http://www.arcgis.com/sharing/rest/search?q=group:",
        // Specify the title of group that contains basemaps
        BasemapGroupTitle: "Basemaps", //CyberTech Systems and Software Limited
        // Specify the user name of owner of the group that contains basemaps
        BasemapGroupOwner: "GISITAdmin", //cybertechagol
        // Specify path to image used to display the thumbnail for a basemap when portal does not provide it
        NoThumbnail: "js/library/themes/images/not-available.png",

        // Initial map extent. Use comma (,) to separate values and dont delete the last comma
        // The coordinates must be specified in the basemap's coordinate system, usually WKID:102100, unless a custom basemap is used
        DefaultExtent: "-12001000, 5691000, -10330000, 6354000",

        // Choose if you want to use WebMap or Map Services for operational layers. If using WebMap, specify WebMapId within quotes, otherwise leave this empty and configure operational layers
        WebMapId: "",

        ThemeColor: "js/library/themes/styles/blueTheme.css",
        // OPERATIONAL DATA SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------

        // Configure operational layers:

        // Configure operational layers  below. The order of displaying layers is reversed on map. The last configured layer is displayed on top.
        // ServiceURL: URL of the layer.
        // LoadAsServiceType: Field to specify if the operational layers should be added as dynamic map service layer or feature layer.
        //                    Supported service types are 'dynamic' or 'feature'.
        OperationalLayers: [
            {
                ServiceURL: "http://50.18.115.76:6080/arcgis/rest/services/RoadConditions/MapServer/11",
                LoadAsServiceType: "dynamic"
            }, {
                ServiceURL: "http://50.18.115.76:6080/arcgis/rest/services/RoadConditions/MapServer/10",
                LoadAsServiceType: "dynamic"
            }, {
                ServiceURL: "http://50.18.115.76:6080/arcgis/rest/services/RoadConditions/MapServer/9",
                LoadAsServiceType: "dynamic"
            }, {
                ServiceURL: "http://50.18.115.76:6080/arcgis/rest/services/RoadConditions/MapServer/8",
                LoadAsServiceType: "dynamic"
            }, {
                ServiceURL: "http://50.18.115.76:6080/arcgis/rest/services/RoadConditions/MapServer/7",
                LoadAsServiceType: "dynamic"
            }, {
                ServiceURL: "http://50.18.115.76:6080/arcgis/rest/services/RoadConditions/MapServer/6",
                LoadAsServiceType: "dynamic"
            }, {
                ServiceURL: "http://50.18.115.76:6080/arcgis/rest/services/RoadConditions/MapServer/5",
                LoadAsServiceType: "dynamic"
            }, {
                ServiceURL: "http://50.18.115.76:6080/arcgis/rest/services/RoadConditions/MapServer/4",
                LoadAsServiceType: "dynamic"
            }, {
                ServiceURL: "http://50.18.115.76:6080/arcgis/rest/services/RoadConditions/MapServer/3",
                LoadAsServiceType: "dynamic"
            }, {
                ServiceURL: "http://50.18.115.76:6080/arcgis/rest/services/RoadConditions/MapServer/2",
                LoadAsServiceType: "dynamic"
            }, {
                ServiceURL: "http://50.18.115.76:6080/arcgis/rest/services/RoadConditions/MapServer/1",
                LoadAsServiceType: "dynamic"
            }, {
                ServiceURL: "http://50.18.115.76:6080/arcgis/rest/services/RoadConditions/MapServer/0",
                LoadAsServiceType: "dynamic"
            }
        ],

        // ------------------------------------------------------------------------------------------------------------------------
        // SEARCH AND 511 SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Configure search, barrier and info settings to be displayed in search and 511 Info panels:

        // Configure search and 511 settings below.
        // Title: In case of webmap implementations, it must match layer name specified in webmap and in case of operational layers
        //        it should be the name of Map/Feature Service.
        // QueryLayerId: This is the layer index in the webmap or ArcGIS Map/Feature Service and is used for performing queries.
        // SearchDisplayTitle: This text is displayed in search results as the title to group results.
        // SearchDisplayFields: Attribute that will be displayed in the search box when user performs a search.
        // SearchExpression: Configure the query expression to be used for search.
        // BarrierLayer: Configure "true" or "false" to treat this as a barrier layer to be used for routing and re-routing.
        // BarrierSearchExpression: Configure the query expression to search barriers in the layer.
        //                          Set this to emtpy "", if all features in the layer should be considered as barriers.
        // InfoLayer: Allowed values are "true" or "false". Configure this to "true" to consider this as 511 Information layer
        //            and display in 511 Information panels.
        // InfoSearchExpression: Configure the query expression to search features and display in 511 Information panels.
        //                       Set this to empty "", if all features in the layer should be considered.
        // InfoListText: This text is displayed in 511 Information Summary panel.
        //               If empty "", then SearchDisplayTitle is used (if configured), else layer name in the webmap/mapservice is used.
        // InfoDetailFields: Attributes that will be displayed in the 511 Information Details panel.
        //                   If empty "", then SearchDisplayFields will be used (if configured), else displayField property of layer in mapservice will be used.

        SearchAnd511Settings: [
            {
                Title: "RoadConditions",
                QueryLayerId: "0",
                SearchDisplayTitle: "Width Height Restrictions - Workzones",
                SearchDisplayFields: "${HwyDesc} / ${DelayDesc} / ${WidthRestriction} / ${HeightRestriction}",
                SearchExpression: "UPPER(HwyName) LIKE UPPER('${0}%') OR UPPER(HwyDesc) LIKE UPPER('${0}%')",
                BarrierLayer: "true",
                BarrierSearchExpression: "(UPPER(TravelSpeeds) <> UPPER('NORMAL')) AND (ExpectedStartDate >= DATE '${0}' AND ExpectedEndDate <= DATE '${0}')",
                InfoLayer: "true",
                InfoSearchExpression: "",
                InfoListText: "",
                InfoDetailFields: "MaxHeight:${HwyDesc} MaxWidth:${WidthRestriction}"
            }, {
                Title: "RoadConditions",
                QueryLayerId: "1",
                SearchDisplayTitle: "Severe Alerts",
                SearchDisplayFields: "${HwyName} / ${ConditionDesc}",
                SearchExpression: "UPPER(HwyName) LIKE UPPER('${0}%') OR UPPER(HwyDesc) LIKE UPPER('${0}%')",
                BarrierLayer: "true",
                BarrierSearchExpression: "(Active = 1) AND (EventStartDateTime >= DATE '${0}' AND EffectiveUntil <= DATE '${0}')",
                InfoLayer: "true",
                InfoSearchExpression: "",
                InfoListText: "",
                InfoDetailFields: "Hwy:${HwyName} / ${ConditionDesc}"
            }, {
                Title: "RoadConditions",
                QueryLayerId: "2",
                SearchDisplayTitle: "Alerts",
                SearchDisplayFields: "${HwyName} / ${ConditionDesc}",
                SearchExpression: "UPPER(HwyName) LIKE UPPER('${0}%') OR UPPER(HwyDesc) LIKE UPPER('${0}%')",
                BarrierLayer: "true",
                BarrierSearchExpression: "(UPPER(MapIconID) <> UPPER('INFORMATIONAL-GREY')) AND (EventStartDateTime >= DATE '${0}' AND EffectiveUntil <= DATE '${0}')",
                InfoLayer: "true",
                InfoSearchExpression: "",
                InfoListText: "",
                InfoDetailFields: ""
            }, {
                Title: "RoadConditions",
                QueryLayerId: "3",
                SearchDisplayTitle: "Video Cameras",
                SearchDisplayFields: "${Description}",
                SearchExpression: "UPPER(Description) LIKE UPPER('%${0}%')",
                BarrierLayer: "false",
                BarrierSearchExpression: "",
                InfoLayer: "true",
                InfoSearchExpression: "",
                InfoListText: "",
                InfoDetailFields: ""
            }, {
                Title: "RoadConditions",
                QueryLayerId: "4",
                SearchDisplayTitle: "Cameras",
                SearchDisplayFields: "${Description}",
                SearchExpression: "UPPER(Description) LIKE UPPER('%${0}%')",
                BarrierLayer: "false",
                BarrierSearchExpression: "",
                InfoLayer: "true",
                InfoSearchExpression: "",
                InfoListText: "",
                InfoDetailFields: ""
            }, {
                Title: "RoadConditions",
                QueryLayerId: "5",
                SearchDisplayTitle: "WindSpeed",
                SearchDisplayFields: "${place_name} / ${wind}",
                SearchExpression: "UPPER(place_name) LIKE UPPER('${0}%')",
                BarrierLayer: "true",
                BarrierSearchExpression: "wind_speed > 20",
                InfoLayer: "true",
                InfoSearchExpression: "wind_speed > 20",
                InfoListText: "",
                InfoDetailFields: "${place_name} / Windspeed:${wind}"
            }, {
                Title: "RoadConditions",
                QueryLayerId: "6",
                SearchDisplayTitle: "WorkZones-Point",
                SearchDisplayFields: "${HwyName} / ${DelayDesc}",
                SearchExpression: "UPPER(HwyName) LIKE UPPER('${0}%') OR UPPER(HwyDesc) LIKE UPPER('${0}%')",
                BarrierLayer: "true",
                BarrierSearchExpression: "(UPPER(Active) = UPPER('Active')) AND (ExpectedStartDate >= DATE '${0}' AND ExpectedEndDate <= DATE '${0}')",
                InfoLayer: "true",
                InfoSearchExpression: "UPPER(Active) = UPPER('active')",
                InfoListText: "",
                InfoDetailFields: "Hwy:${HwyName}"
            }, {
                Title: "RoadConditions",
                QueryLayerId: "7",
                SearchDisplayTitle: "WorkZones-Line",
                SearchDisplayFields: "${HwyName} / ${DelayDesc}",
                SearchExpression: "UPPER(HwyName) LIKE UPPER('${0}%') OR UPPER(HwyDesc) LIKE UPPER('${0}%')",
                BarrierLayer: "true",
                BarrierSearchExpression: "(UPPER(Active) = UPPER('active')) AND (ExpectedStartDate >= DATE '${0}' AND ExpectedEndDate <= DATE '${0}')",
                InfoLayer: "true",
                InfoSearchExpression: "UPPER(Active) = UPPER('active')",
                InfoListText: "",
                InfoDetailFields: "Delay:${DelayDesc}"
            }, {
                Title: "RoadConditions",
                QueryLayerId: "8",
                SearchDisplayTitle: "RoadConditions",
                SearchDisplayFields: "${HwyName} / ${ConditionDesc}",
                SearchExpression: "UPPER(HwyName) LIKE UPPER('${0}%') OR UPPER(HwyDesc) LIKE UPPER('${0}%')",
                BarrierLayer: "true",
                BarrierSearchExpression: "(UPPER(ConditionCategory ) <> UPPER('RedWhite')) AND (EffectiveUntil > DATE '${0}') ",
                InfoLayer: "true",
                InfoSearchExpression: "",
                InfoListText: "",
                InfoDetailFields: "Condition:${ConditionDesc}"
            }, {
                Title: "RoadConditions",
                QueryLayerId: "9",
                SearchDisplayTitle: "Load Restrictions",
                SearchDisplayFields: "${HwyName} / ${HwyDesc}",
                SearchExpression: "UPPER(HwyName) LIKE UPPER('${0}%') OR UPPER(HwyDesc) LIKE UPPER('${0}%')",
                BarrierLayer: "true",
                BarrierSearchExpression: "InEffect = 'Y'",
                InfoLayer: "true",
                InfoSearchExpression: "InEffect = 'Y'",
                InfoListText: "Load Restrictions",
                InfoDetailFields: "Code:${Restriction_Code} / Desc:${Restriction_Code_Desc}"
            }, {
                Title: "RoadConditions",
                QueryLayerId: "10",
                SearchDisplayTitle: "State Routes",
                SearchDisplayFields: "${HWY_CHAR} / ${DIRECTION}",
                SearchExpression: "UPPER(HWY_CHAR) LIKE UPPER('${0}%') OR UPPER(HWY_DIR) LIKE UPPER('${0}%')",
                BarrierLayer: "false",
                BarrierSearchExpression: "",
                InfoLayer: "false",
                InfoSearchExpression: "",
                InfoListText: "",
                InfoDetailFields: ""
            }
        ],

        // Following zoom level will be set for the map upon searching an address
        ZoomLevel: 12,

        // Time interval to refresh all layers on map
        LayersRefreshInterval: 5, // in minutes

        //minimum height should be 250 for the info-popup in pixels
        InfoPopupHeight: 250,

        // Minimum width should be 300 for the info-popup in pixels
        InfoPopupWidth: 300,

        // ------------------------------------------------------------------------------------------------------------------------
        // INFO-WINDOW SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Configure info-popup settings. The Title and QueryLayerId fields should be the same as configured in "Title" and "QueryLayerId" fields in SearchAnd511Settings.
        // Title: In case of webmap implementations, it must match layer name specified in webmap and in case of operational layers
        // it should be the name of Map/Feature Service.
        // QueryLayerId: Layer index used for performing queries.
        // InfoWindowHeader: Specify field for the info window header
        // InfoWindowContent: Specify field to be displayed in callout bubble for mobile devices
        // ShowAllFields: When set to true, infowindow will display all fields from layer and InfoWindowData section is ignored
        //                When set to false, only fields configured in InfoWindowData section will be displayed
        // InfoWindowData: Set the content to be displayed in the info-Popup. Define labels and field values.
        //                 These fields should be present in the layer referenced by 'QueryLayerId' specified under section 'SearchSettings'
        // DisplayText: Caption to be displayed instead of field alias names. Set this to empty string ("") if you wish to display field alias names as captions.
        // FieldName: Field used for displaying the value
        InfoWindowSettings: [
            {
                Title: "RoadConditions",
                QueryLayerId: "0",
                InfoWindowHeaderField: "${HwyName}",
                InfoWindowContent: "${HwyDesc}",
                ShowAllFields: "false",
                InfoWindowData: [
                    {
                        DisplayText: "ROUTE ID:",
                        FieldName: "${ROUTE_ID}"
                    }, {
                        DisplayText: "Highway Name:",
                        FieldName: "${HwyName}"
                    }, {
                        DisplayText: "Project Location:",
                        FieldName: "${ProjectLocation}"
                    }, {
                        DisplayText: "Work Type:",
                        FieldName: "${WorkType}"
                    }, {
                        DisplayText: "Delay:",
                        FieldName: "${DelayDesc}"
                    }, {
                        DisplayText: "Travel Speeds:",
                        FieldName: "${TravelSpeeds}"
                    }, {
                        DisplayText: "Comments:",
                        FieldName: "${Comments}"
                    }, {
                        DisplayText: "Width Restriction:",
                        FieldName: "${WidthRestriction}"
                    }, {
                        DisplayText: "Height Restriction:",
                        FieldName: "${HeightRestriction}"
                    }, {
                        DisplayText: "Expected Start Date:",
                        FieldName: "${ExpectedStartDate}"
                    }, {
                        DisplayText: "Expected End Date:",
                        FieldName: "${ExpectedEndDate}"
                    }
                ]
            },
            {
                Title: "RoadConditions",
                QueryLayerId: "1",
                InfoWindowHeaderField: "${HwyName}",
                InfoWindowContent: "${HwyDesc}",
                ShowAllFields: "false",
                InfoWindowData: [
                    {
                        DisplayText: "Comment:",
                        FieldName: "${Comment}"
                    }, {
                        DisplayText: "Condition Desc:",
                        FieldName: "${ConditionDesc}"
                    }
                ]
            }, {
                Title: "RoadConditions",
                QueryLayerId: "2",
                InfoWindowHeaderField: "${HwyName}",
                InfoWindowContent: "${HwyDesc}",
                ShowAllFields: "false",
                InfoWindowData: [
                    {
                        DisplayText: "Comment:",
                        FieldName: "${Comment}"
                    }, {
                        DisplayText: "Condition Desc:",
                        FieldName: "${ConditionDesc}"
                    }
                ]
            },
            {
                Title: "RoadConditions",
                QueryLayerId: "3",
                InfoWindowHeaderField: "${Description}",
                InfoWindowContent: "${Description}",
                ShowAllFields: "false",
                InfoWindowData: [
                    {
                        DisplayText: "",
                        FieldName: "${Link}"
                    }
                ]
            },
            {
                Title: "RoadConditions",
                QueryLayerId: "4",
                InfoWindowHeaderField: "${Description}",
                InfoWindowContent: "${Description}",
                ShowAllFields: "false",
                InfoWindowData: [
                    {
                        DisplayText: "",
                        FieldName: "${Link}"
                    }
                ]
            }, {
                Title: "RoadConditions",
                QueryLayerId: "5",
                InfoWindowHeaderField: "${place_name}", //5
                InfoWindowContent: "${state}",
                ShowAllFields: "false",
                InfoWindowData: [
                    {
                        DisplayText: "Wind:",
                        FieldName: "${wind}"
                    }, {
                        DisplayText: "Temperature:",
                        FieldName: "${temperature}"
                    }
                ]
            },
            {
                Title: "RoadConditions",
                QueryLayerId: "6",
                InfoWindowHeaderField: "${HwyName}",
                InfoWindowContent: "${HwyDesc}",
                ShowAllFields: "false",
                InfoWindowData: [
                    {
                        DisplayText: "Comments:",
                        FieldName: "${Comments}"
                    }, {
                        DisplayText: "Delay Desc:",
                        FieldName: "${DelayDesc}"
                    }
                ]
            },
            {
                Title: "RoadConditions",
                QueryLayerId: "7",
                InfoWindowHeaderField: "${HwyName}",
                InfoWindowContent: "${HwyDesc}",
                ShowAllFields: "false",
                InfoWindowData: [
                    {
                        DisplayText: "Work Type:",
                        FieldName: "${WorkType}"
                    }, {
                        DisplayText: "Comments:",
                        FieldName: "${Comments}"
                    }
                ]
            },
            {
                Title: "RoadConditions",
                QueryLayerId: "8",
                InfoWindowHeaderField: "${SegmentName}",
                InfoWindowContent: "${HwyDesc}",
                ShowAllFields: "false",
                InfoWindowData: [
                    {
                        DisplayText: "Condition Category:",
                        FieldName: "${ConditionCategory}"
                    }, {
                        DisplayText: "Condition Desc:",
                        FieldName: "${ConditionDesc}"
                    }
                ]
            },
            {
                Title: "RoadConditions",
                QueryLayerId: "9",
                InfoWindowHeaderField: "${SegmentName}",
                InfoWindowContent: "${HwyDesc}",
                ShowAllFields: "false",
                InfoWindowData: [
                    {
                        DisplayText: "Restriction Code:",
                        FieldName: "${Restriction_Code}"
                    }, {
                        DisplayText: "Restriction Desc:",
                        FieldName: "${Restriction_Code_Desc}"
                    }
                ]
            }
        ],

        // ------------------------------------------------------------------------------------------------------------------------
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

        // LayerURL: URL for the layer (should include the layer id)
        // UniqueRouteField: Specify the field that contains values which uniquely identify routes
        // DisplayField: Attributes to be displayed in list of frequently travelled routes
        FrequentRoutesSettings: {
            Title: "RoadConditions",
            QueryLayerId: "10",
            UniqueRouteField: "ROUTE_ID",
            DisplayField: "${ROUTE_ID} / ${HWY_NUM} - ${DIRECTION}",
            FrequentRoutesEnabled: "true"
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
        // To use ArcGIS Online Routing Service, change it to http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World
        RouteTaskService: "http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",

        // Enable/Disable driving directions facility in the application.
        RoutingEnabled: "true",

        // Specify the buffer distance (in miles) to find 511 information along a route. This should typically be set between 1 to 10 miles.
        BufferMilesForProximityAnalysis: "5",

        // Barriers may lie very close to the route but not exactly on the route. Specify a distance (in meters) to find barriers that are to be
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
        RouteSymbology: {
            ColorRGB: "0,0,225",
            Transparency: "0.5",
            Width: "4",
            DirectionUnits: "MILES",
            RouteCircleColor: "007AC2",
            RouteCircleFillColor: "FFFFFF",
            RouteCircleWidth: 2,
            CartographicLineColor: "0,0,225",
            CartographicTransparency: "0",
            CartographicLineWidth: 512
        },


        // ------------------------------------------------------------------------------------------------------------------------
        // SETTINGS FOR MAP SHARING
        // ------------------------------------------------------------------------------------------------------------------------

        // Set URL for TinyURL service, and URLs for social media
        MapSharingOptions: {
            TinyURLServiceURL: "https://api-ssl.bitly.com/v3/shorten?longUrl=${0}",
            TinyURLResponseAttribute: "data.url",
            FacebookShareURL: "http://www.facebook.com/sharer.php?u=${0}&t=Transportation%20511",
            TwitterShareURL: "http://mobile.twitter.com/compose/tweet?status=Transportation%20511 ${0}",
            ShareByMailLink: "mailto:%20?subject=Check%20out%20this%20map!&body=${0}"
        }
    };
});
