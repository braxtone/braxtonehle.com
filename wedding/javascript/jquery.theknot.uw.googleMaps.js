// -------------------------------------------------------------------------| $(document).ready
$(document).ready(function () {
    var obj = $.theknot.uw.googleMaps;
    //obj.init();
    //obj.testAddrLookup();
});

// -------------------------------------------------------------------------| Namespace definitions.
$.theknot.uw.googleMaps = function () { };

// -------------------------------------------------------------------------| Body
$.extend($.theknot.uw.googleMaps,
{
    // -----------------------------------------------------| Properties

    fieldSelectors:
    {
        modalContainer: 'div[id=divGoogleMapModal]',
        mapCanvas: 'div[id$=_pnlMapCanvas]',
        closeModalLink: 'a[id=hlnkCloseGoogleMapModal]',
        modalTitleLabel: 'span[id$=_lblModalTitle]',
        modalAddressLabel: 'span[id$=_lblModalAddress]',
        modalLocationLabel: 'span[id$=_lblModalLocation]',

        infoWinTemplateContainer: 'div#googleMapInfoWinTemplate', //'div[id$=_pnlInfoWinTemplate]',

        infoWin:
        {
            mainFieldsContainer: 'div#divMainFields',
            mainTitle: 'span#spnMainTitle',
            mainAddress: 'span#spnMainAddress',
            mainCityStateZip: 'spnMainCityStateZip',
            mainLocation: 'span#spnMainLocation',
            mainDirectionsLabel: 'span#spnMainDirectionsLabel',
            mainToHereLink: 'a#hlnkMainToHereLink',
            mainFromHereLink: 'a#hlnkMainFromHereLink'
        }
    },

    globals:
    {
        geoCoder: null,
        defaultAddr: 'Austin, TX/US',
        defaultOptions:
        {
            zoom: 11,
            scrollwheel: false,
            center: new google.maps.LatLng(30.267153, -97.7430608), // The LatLng for Austin, Tx.
            mapTypeId: google.maps.MapTypeId.ROADMAP
        },
        mapObject: null,

        infoWinContent: null,
        markers: new Array(),
        infoWindows: new Array(),

        mapConfig: function () {
            if (!$.theknot.isNullOrUndef($.theknot.uw.admin)) {
                return $.theknot.uw.admin.commonMemberElements.Site.SiteConfiguration.MapConfiguration;
            }
            else {
                return $.theknot.uw.view.commonGuestviewElements.Site.SiteConfiguration.MapConfiguration;
            }
        },

        numQueriesRun: 0,
        numTimeoutLookups: 0

    },

    uwMarkerListItem: function () {
        var obj =
        {
            key: '',
            title: '',
            address: '',
            typeName: '',
            imageUrl: '',
            marker: ''
        }
        return obj;
    },

    uwInfoWindowListItem: function () {
        var obj =
        {
            key: '',
            infoWindow: '',
            uwInfoWindow: '',
            uwInfoWindowOptions: ''
        }
        return obj;
    },

    isInitialized: false,

    init: function (addr, successCallback, errorCallback) {
        if ($.theknot.isNullOrUndef(successCallback)) { successCallback = null; }
        if (this.isInitialized) {
            if ($.isFunction(successCallback)) {
                successCallback();
            }
            return;
        }

        //alert('$.theknot.uw.googleMaps.init()');

        // We call the "lookupAddress()" method here for two reasons;
        // 1. To test that the geocoding service is functioning (may take some additional friendly steps if it fails in the future).
        // 2. To set the $.theknot.uw.googleMaps.globals.mapObject object (other methods will depend on it being set).
        var obj = $.theknot.uw.googleMaps;

        if ($.theknot.isNullOrUndef(addr) || addr.length == 0) { addr = this.globals.defaultAddr; }


        var setAsInitialized = true;
        if ($(this.fieldSelectors.modalContainer).length != 0) {
            // Okay, we do this here b/c the admin pages that use a modal to show the map
            // will frequently "init" it behind the scenes in order to decide wether or not to
            // display an error msg. Google maps do not do well with having their container hidden.
            // So we don't allow the map to consider itself "inited" until it done so while visible.
            if (!$(this.fieldSelectors.modalContainer).children('.modalPopup').is(':visible')) {
                setAsInitialized = false;
            }
        }

        if (setAsInitialized) {
            this.isInitialized = true;
        }
        this.globals.geoCoder = new google.maps.Geocoder();

        // Need to empty the contents of the mapCanvas or else each call to "init()" will 
        // cause the "Map data ©200x Google" msg to double-up and eventually become all blurry & unreadable.
        $(obj.fieldSelectors.mapCanvas).empty();

        this.lookupAddress(addr,
            function (latLongCoords) {
                // Success Callback.
                obj.globals.defaultOptions.center = latLongCoords;
                obj.globals.mapObject = new google.maps.Map($(obj.fieldSelectors.mapCanvas)[0], obj.globals.defaultOptions);
                if ($.isFunction(successCallback)) {
                    successCallback(latLongCoords);
                }
            },
            function (status) {
                // Error Callback.
                // Just set it to the default LatLng since the address lookup must not be working.
                obj.globals.mapObject = new google.maps.Map($(obj.fieldSelectors.mapCanvas)[0], obj.globals.defaultOptions);
                if ($.isFunction(errorCallback)) {
                    errorCallback(addr, status);
                }
            });

        this.setupEventListeners();

    },

    setModalTitleFields: function (address, title, eventTypeId) {
        if ($.theknot.isNullOrUndef(title) || title.length == 0) {
            title = '';
        }

        var eventTypeName = '';
        var mapConfig = this.globals.mapConfig();

        for (var i = 0; i < mapConfig.MapPointImages.length; ++i) {
            if (mapConfig.MapPointImages[i].Id == eventTypeId) {
                eventTypeName = mapConfig.MapPointImages[i].Name;
                if (eventTypeName == 'Other' || eventTypeName == 'Not Set') {
                    eventTypeName = 'Map of Address';
                }
                break;
            }
        }

        $(this.fieldSelectors.modalTitleLabel).text(eventTypeName);
        $(this.fieldSelectors.modalLocationLabel).text(title);
        $(this.fieldSelectors.modalAddressLabel).text(address);
    },

    setupEventListeners: function () {
        // The close modal button (upper right-hand X) event.
        $(this.fieldSelectors.closeModalLink).click(function () {
            $.theknot.uw.googleMaps.hideMapModal();
        });
    },

    hideMapModal: function () {
        $(this.fieldSelectors.modalContainer).hide();
        this.hideAllMarkers();
        this.closeAllInfoWindows();
    },

    showMapModal: function () {
        if ($.browser.msie) {
            $(this.fieldSelectors.modalContainer).find('table:first').css('top', document.documentElement.scrollTop - 10);
        }
        else {
            $(this.fieldSelectors.modalContainer).find('table:first').css('top', window.scrollY - 10);
        }
        $(this.fieldSelectors.modalContainer).show();
    },

    testAddrLookup: function () {
        var obj = $.theknot.uw.googleMaps;
        this.lookupAddress('7800 Shoal Creek Blvd. Austin, TX/US',
        function (latLongCoords) {
            // Success Callback.
            obj.centerMap(latLongCoords);
            obj.markMapAtPoint(latLongCoords, 'Random point in Austin, Tx.');
        },
        function (status) {
            alert("Unable to find map for the given location.\nMapping service returned the following error: NonInitCall - " + status);
        });
    },

    markMapByAddress: function (address, title, eventTypeId, HtmlInfo, centerMapAtPoint, forceCacheRefresh, elementId, successCallback, errorCallback) {
        var obj = $.theknot.uw.googleMaps;

        if ($.theknot.isNullOrUndef(address)) { return; }
        if ($.theknot.isNullOrUndef(title)) { title = ''; }
        if ($.theknot.isNullOrUndef(eventTypeId)) { eventTypeId = 0; }
        if ($.theknot.isNullOrUndef(HtmlInfo)) { HtmlInfo = ''; }
        if ($.theknot.isNullOrUndef(centerMapAtPoint)) { centerMapAtPoint = true; }
        if ($.theknot.isNullOrUndef(forceCacheRefresh)) { forceCacheRefresh = false; }
        if ($.theknot.isNullOrUndef(elementId)) { elementId = 0; }
        address = address.replace('&#47;', '/');

        //++obj.globals.numQueriesRun;
        /*
        if(obj.globals.numTimeoutLookups > 0) // && (obj.globals.numQueriesRun%2))
        {
        // Quick timeout between queries to avoid the OVER_QUERY_LIMIT error from gmaps when page has more then 4 or 5 locations.
        var msTimeout = 400;
        var start = (new Date()).getTime(); 
        var end = start + msTimeout; 
        while(start <= end){ start = (new Date()).getTime(); }
        //console.log('done');
        }
        */

        this.lookupAddress(address,
            function (latLongCoords, geoCodeResults) {
                // Success Callback.

                obj.markMapAtPoint(latLongCoords, title, eventTypeId, address, HtmlInfo, geoCodeResults, forceCacheRefresh, elementId);
                if (centerMapAtPoint) {
                    obj.centerMap(latLongCoords);
                }
                if ($.isFunction(successCallback)) {
                    successCallback(address, title, eventTypeId, latLongCoords, geoCodeResults);
                }
            },
            function (status) {
                //alert('fail: '+ status);
                // Failure Callback
                // numTimeoutLookups

                if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                    var reRunFormat = "$.theknot.uw.googleMaps.markMapByAddress(unescape('{0}'), unescape('{1}'), '{2}', '{3}', 0, {5}, {6}, {7}, $.theknot.uw.view.mappableAddressViewer.handleGoogleMapZeroResults);";
                    var reRun = $.theknot.formatStr(reRunFormat, escape(address), escape(title), eventTypeId, HtmlInfo, centerMapAtPoint, forceCacheRefresh, elementId, null);
                    ++obj.globals.numTimeoutLookups

                    var randTimeout = Math.floor(Math.random() * 1001);
                    while (randTimeout < 500) { randTimeout = Math.floor(Math.random() * 1001); } // make it at least 500ms
                    window.setTimeout(reRun, randTimeout);

                    /*
                    //++obj.globals.numTimeoutLookups
                    //alert(obj.globals.numTimeoutLookups + '\n' + $.theknot.uw.googleMaps.globals.numTimeoutLookups);
                    
                    if(obj.globals.numTimeoutLookups <= 100)
                    {
                    var msTimeout = 0;
                    var start = (new Date()).getTime(); 
                    var end = start + msTimeout; 
                    while(start <= end){ start = (new Date()).getTime(); }
                    //obj.markMapByAddress(address, title, eventTypeId, HtmlInfo, centerMapAtPoint, forceCacheRefresh, elementId, successCallback, errorCallback)
                        
                    //function(address, title, eventTypeId, HtmlInfo, centerMapAtPoint, forceCacheRefresh, elementId, successCallback, errorCallback)
                    // $.theknot.uw.googleMaps.markMapByAddress('7001 Congress Ave Austin, TX/US', 'InterContinental Stephen F Austin HotelAddress:', '5', '', 1, 0, 2571, null, $.theknot.uw.view.mappableAddressViewer.handleGoogleMapZeroResults);
                    var reRunFormat = "$.theknot.uw.googleMaps.markMapByAddress('{0}', '{1}', '{2}', '{3}', 0, {5}, {6}, {7}, $.theknot.uw.view.mappableAddressViewer.handleGoogleMapZeroResults);";
                    var reRun = $.theknot.formatStr(reRunFormat, address, title, eventTypeId, HtmlInfo, centerMapAtPoint, forceCacheRefresh, elementId, null);
                    //alert(reRun);
                    window.setTimeout('eval("' + reRun +'");', 400);
                    
                    }
                    //$('div#header').html('eval("' + reRun +'");');
                    */
                    return;
                }

                if ($.isFunction(errorCallback)) {
                    errorCallback(address, status);
                }
                else {
                    alert($.theknot.formatStr('Unable to retrieve map for the address "{0}".\nMapping service returned the following error: {1}', address, status));
                }
            });
    },

    centerMap: function (latLng, showInfoWinIfAvail) {
        if ($.theknot.isNullOrUndef(latLng)) { latLng = this.globals.defaultOptions.center; }
        if ($.theknot.isNullOrUndef(showInfoWinIfAvail)) { showInfoWinIfAvail = false; }

        if (this.globals.mapObject == null) {
            this.init();
        }

        this.globals.mapObject.setCenter(latLng);

        /*
        // Have not been able to get this working properly yet.
        if(showInfoWinIfAvail)
        {
        var Key = latLng.toString().replace(/{|\.|,|\s|-|\)|\(/ig, '');
        var marker = this.findMapMarker(Key);
        if(marker != null)
        {
        var MyInfoWindow = this.findInfoWindow(Key);
        if(MyInfoWindow != null)
        {
        MyInfoWindow.uwInfoWindow.uwMapInfoWindow(MyInfoWindow.uwInfoWindowOptions); // Reinitialize the uwInfoWindow (to set it back to the default view)
        MyInfoWindow.infoWindow.open(this.globals.mapObject, marker);
        }
        }
        }
        else
        {
        this.globals.mapObject.setCenter(latLng);
        }
        */
    },

    markMapAtPoint: function (latLng, title, eventTypeId, address, HtmlInfo, geoCodeResults, forceCacheRefresh, elementId) {

        var obj = $.theknot.uw.googleMaps;
        var mapConfig = obj.globals.mapConfig();

        if ($.theknot.isNullOrUndef(title)) { title = ''; }
        if ($.theknot.isNullOrUndef(latLng)) { latLng = obj.globals.defaultOptions.center; }
        if ($.theknot.isNullOrUndef(eventTypeId)) { eventTypeId = 0; }
        if ($.theknot.isNullOrUndef(address)) { address = ''; }
        if ($.theknot.isNullOrUndef(HtmlInfo)) { HtmlInfo = ''; }
        if ($.theknot.isNullOrUndef(geoCodeResults)) { geoCodeResults = null; }
        if ($.theknot.isNullOrUndef(forceCacheRefresh)) { forceCacheRefresh = false; }
        if ($.theknot.isNullOrUndef(elementId)) { elementId = false; }

        address = address.replace('&#47;', '/');

        var imageUrl = '';
        var imageUrlUnchanged = '';
        var imageTypeName = '';
        for (var i = 0; i < mapConfig.MapPointImages.length; ++i) {
            if (mapConfig.MapPointImages[i].Id == eventTypeId) {
                imageUrl = mapConfig.MapPointImages[i].Url;
                imageUrlUnchanged = mapConfig.MapPointImages[i].Url;
                if ((/spacer\.gif/i).test(imageUrl)) {
                    imageUrl = '';
                }
                imageTypeName = mapConfig.MapPointImages[i].Name;
                break;
            }
        }

        if (forceCacheRefresh) {
            this.closeAllInfoWindows();
            this.hideAllMarkers();
            this.clearMarkerAndInfoWindowCache();
        }

        var Key = latLng.toString().replace(/{|\.|,|\s|-|\)|\(/ig, '');

        imageTypeName = (imageTypeName.toLowerCase() == 'other' || imageTypeName.toLowerCase() == 'not set') ? '' : imageTypeName;

        // Do not create an infoWindow if the geoCodeResults are null.
        if (geoCodeResults != null) {
            var infowindow = this.findInfoWindow(Key);

            if (infowindow == null) {
                var uwInfoWinContentTemplate = $(obj.fieldSelectors.infoWinTemplateContainer);
                var uwInfoWinClone = uwInfoWinContentTemplate.clone();
                var uwInfoWinOptions = {
                    key: Key,
                    latLng: latLng,
                    locationName: title,
                    address: address,
                    cityStateZip: '',
                    eventTypeName: imageTypeName,
                    imageUrl: imageUrlUnchanged,
                    geoCodeResults: geoCodeResults,
                    elementId: elementId
                };
                var uwInfoWin = uwInfoWinClone.uwMapInfoWindow(uwInfoWinOptions);

                infowindow = new google.maps.InfoWindow(
                {
                    content: uwInfoWin[0]
                });

                var uwW = new this.uwInfoWindowListItem();
                uwW.key = Key;
                uwW.infoWindow = infowindow;
                uwW.uwInfoWindow = uwInfoWin;
                uwW.uwInfoWindowOptions = uwInfoWinOptions;
                this.globals.infoWindows.push(uwW);
            }
        }


        var markerTitle = $.theknot.formatStr("{0}{1}{2}", imageTypeName, ((imageTypeName == '') ? '' : ' : '), title);
        var marker = $.theknot.uw.googleMaps.findMapMarker(Key);

        if (marker == null) {
            marker = new google.maps.Marker(
            {
                map: obj.globals.mapObject,
                position: latLng,
                title: markerTitle,
                icon: imageUrl,
                clickable: ((geoCodeResults != null) ? true : false)
            });

            var uwM = new this.uwMarkerListItem();
            uwM.key = Key;
            uwM.title = title;
            uwM.address = address;
            uwM.typeName = imageTypeName;
            uwM.imageUrl = imageUrl;
            uwM.marker = marker;
            this.globals.markers.push(uwM);
        }
        else {
            if (marker.marker.icon != imageUrl) {
                marker.marker.setIcon(imageUrl);
            }
            if (marker.marker.title != markerTitle) {
                marker.marker.setTitle(markerTitle);
            }
            marker.marker.setVisible(true);
        }

        if (geoCodeResults != null) {
            google.maps.event.addListener(marker, 'click', function () {
                var obj = $.theknot.uw.googleMaps;
                //var MyUwMark = $.theknot.uw.googleMaps.findMapMarker(key);

                var key = marker.position.toString().replace(/{|\.|,|\s|-|\)|\(/ig, '');

                $.theknot.uw.googleMaps.closeAllInfoWindows();

                var MyInfoWindow = $.theknot.uw.googleMaps.findInfoWindow(key);
                if (MyInfoWindow != null) {
                    MyInfoWindow.uwInfoWindow.uwMapInfoWindow(MyInfoWindow.uwInfoWindowOptions); // Reinitialize the uwInfoWindow (to set it back to the default view)

                    //MyInfoWindow.infoWindow.setSize(new google.maps.Size(400, 400))

                    MyInfoWindow.infoWindow.open(obj.globals.mapObject, marker);
                }
            });
        }
    },

    centerAndMarkMapAtPoint: function (latLng, title, geoCodeResults) {
        if ($.theknot.isNullOrUndef(title)) { title = ''; }
        if ($.theknot.isNullOrUndef(latLng)) { latLng = this.globals.defaultOptions.center; }

        centerMap(latLng);
        markMapAtPoint(latLng, title, geoCodeResults);
    },

    lookupAddress: function (address, successCallback, errorCallback) {
        address = address.replace('&#47;', '/');
        if (!$.theknot.isNullOrUndef(this.globals.geoCoder)) {
            this.globals.geoCoder.geocode({ 'address': address }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if ($.isFunction(successCallback)) {
                        successCallback(results[0].geometry.location, results);
                    }
                }
                else {
                    if ($.isFunction(errorCallback)) {
                        errorCallback(status);
                    }
                    else {
                        if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                            return;
                        }
                        alert("Unable to retrieve map for the given location.\nMapping service returned the following error: " + status);
                    }
                }
            });
        }
    },

    findMapMarker: function (key) {
        var retVal = null;
        var markerList = this.globals.markers;
        if (markerList != null && markerList.length > 0) {
            for (var i = 0; i < markerList.length; ++i) {
                if (markerList[i].key == key) {
                    retVal = markerList[i];
                    break;
                }
            }
        }
        return retVal;
    },

    hideAllMarkers: function () {
        var markerList = this.globals.markers;
        if (markerList != null && markerList.length > 0) {
            for (var i = 0; i < markerList.length; ++i) {
                markerList[i].marker.setVisible(false);
            }
        }
    },

    findInfoWindow: function (key) {
        var retVal = null;
        var infoWindowList = this.globals.infoWindows;
        if (infoWindowList != null && infoWindowList.length > 0) {
            for (var i = 0; i < infoWindowList.length; ++i) {
                if (infoWindowList[i].key == key) {
                    retVal = infoWindowList[i];
                    break;
                }
            }
        }
        return retVal;
    },

    closeAllInfoWindows: function () {
        var infoWindowList = this.globals.infoWindows;
        if (infoWindowList != null && infoWindowList.length > 0) {
            for (var i = 0; i < infoWindowList.length; ++i) {
                infoWindowList[i].infoWindow.close();
            }
        }
    },

    clearMarkerAndInfoWindowCache: function () {
        this.globals.markers = new Array();
        this.globals.infoWindows = new Array();
    },

    showDirections: function (options, callback) {
        var obj = $.theknot.uw.googleMaps;

        if (this.globals.mapObject == null) {
            obj.init();
        }

        dirSvc = new google.maps.DirectionsService();
        dirReq =
        {
            destination: options.destination.address,
            origin: options.origin.address,
            provideRouteAlternatives: false,
            travelMode: google.maps.DirectionsTravelMode.DRIVING
        }

        dirSvc.route(dirReq, function (result, status) {
            switch (status) {
                case google.maps.DirectionsStatus.OK:
                    var dirRend = new google.maps.DirectionsRenderer();
                    dirRend.setMap(obj.globals.mapObject);
                    dirRend.setPanel($('div[id$=_pnlDirections]')[0]);
                    dirRend.setDirections(result);
                    break;

                case google.maps.DirectionsStatus.ZERO_RESULTS:
                    alert('There were no results returned when requesting directions between the two points given.');
                    return;
                    break;
                case google.maps.DirectionsStatus.NOT_FOUND:
                default:
                    alert('Unable to retrieve directions between the two points given.');
                    return;
                    break;
            }

            if ($.isFunction(callback)) {
                callback();
            }
        });

    },

    directionsPopupOptions: function () {
        var obj =
        {
            key: '0',
            width: '0',
            height: '0',
            userId: '0',
            setFocus: true,

            destination:
            {
                elementId: 0,
                eventType: '',
                locationName: '',
                address: ''
            },

            origin:
            {
                elementId: 0,
                eventType: '',
                locationName: '',
                address: ''
            }
        }
        return obj;
    },

    showDirectionsPopup: function (options) {


        var prefix = "";

        if (location.pathname.indexOf("wedding") == 1) {
            prefix = "/wedding";
        }


        var baseUrlFormat = prefix + '/view/mapdirections/?oa={0}&da={1}&uid={2}&nostyle=1&nodoctype=1&contentonly=1';
        var popUrl = prefix + '/view/mapdirections/loading/';
        if (options.userId != '0') {
            popUrl = $.theknot.formatStr(baseUrlFormat,
                escape(options.origin.address),
                escape(options.destination.address),
                options.userId
                );
        }

        var popName = 'MapDirections';
        var width = (options.width != '0') ? options.width : '800';
        var height = (options.height != '0') ? options.height : '600';
        var popPropsFormat = "toolbar=yes,scrollbars=yes,location=no,statusbar=no,menubar=yes,resizable=yes,width={0},height={1}";
        var popProps = $.theknot.formatStr(popPropsFormat, width, height);
        var dirPopup = window.open(popUrl, popName, popProps);


        //        if(dirPopup != null)
        //        {
        //            dirPopup.blur();
        //        }

        return dirPopup;
    }

});

(function ($) {
    // -------------------------------------------------------------------------| $.fn.uwMapInfoWindow()
    $.fn.uwMapInfoWindow = function (options) {
        // Extend the "defaults" with the options object what was passed in.
        var opts = $.extend({}, $.fn.uwMapInfoWindow.defaultOptions, options);
        return this.each(function () {
            $(this).attr('id', 'uwMapInfoWindow_' + opts.key);
            var Container = $(this);
            var MyInfoWindow = $.theknot.uw.googleMaps.findInfoWindow(opts.key);
            var MyMarker = $.theknot.uw.googleMaps.findMapMarker(opts.key);

            var mainFields = $(this).find(opts.fields.mainFieldsContainer);
            var directionFields = $(this).find(opts.fields.dir.mainContainer);
            var statics = directionFields.find(opts.fields.dir.staticAddressContainer);
            var dynamics = directionFields.find(opts.fields.dir.dynamicAddressContainer);
            var dynamicsDivider = directionFields.find(opts.fields.dir.divider);
            var selPoints = directionFields.find(opts.fields.dir.pointOnMapSelect);

            dynamics.find(opts.fields.dir.streetAddressTextBox).val('');

            var fadeSpeed = ($.browser.msie) ? 0 : 0; // As usual, fades with text look like poop in IE, so if you want fades set ie's to zero.
            var hasSelPointsDropDown = true;
            var isAdminPage = (self.location.pathname.toLowerCase().indexOf('/admin/edit/') > -1);
            _removeThisAddressFromSelect(); // will remove the current address from the drop down & set hasSelPointsDropDown to false if there are no others.

            var directionsHeight = (isAdminPage) ? '240px' : '260px';
            if (!hasSelPointsDropDown) {
                // Shrink the height a little bit if we do not have the "selPoints" drop down.
                directionsHeight = (isAdminPage) ? '180px' : '200px';
            }

            if (MyInfoWindow != null) {
                // If MyInfoWindow is null, then this is the first time that the window has been opened
                // and we don't need to worry about resetting the size or re-centering (which would fail anyhow).
                $.theknot.uw.googleMaps.centerMap(MyInfoWindow.uwInfoWindowOptions.latLng);
                _setInfoWindowSize(Container.data('origWidth'), Container.data('origHeight'));
            }
            else {
                Container.data('origWidth', Container.css('width'));
                Container.data('origHeight', Container.css('height'));
            }

            mainFields.show();
            directionFields.hide();

            if (opts.eventTypeName == '') {
                $(this).find(opts.fields.mainEventTypeName).html(opts.locationName);
                $(this).find(opts.fields.mainLocationName).hide();
            }
            else {
                $(this).find(opts.fields.mainEventTypeName).html(opts.eventTypeName);
                $(this).find(opts.fields.mainLocationName).html(opts.locationName);
            }

            $(this).find(opts.fields.mainAddress).html(opts.address);
            $(this).find(opts.fields.mainCityStateZip).hide();

            $(this).find('a').unbind('focus').focus(function () {
                $(this).blur();
            });

            dynamics.find(opts.fields.dir.pointOnMapSelect).unbind("focus").focus(function () {
                dynamics.find(opts.fields.dir.pointOnMapRadio).attr('checked', true);
                dynamics.find(opts.fields.dir.streetAddressRadio).attr('checked', false);
            });

            dynamics.find(opts.fields.dir.streetAddressTextBox).unbind("focus").focus(function () {
                dynamics.find(opts.fields.dir.streetAddressRadio).attr('checked', true);
                dynamics.find(opts.fields.dir.pointOnMapRadio).attr('checked', false);
            });

            // "To Here" click.
            $(this).find(opts.fields.mainToHereLink).unbind("click").click(function () {
                Container.data(opts.constants.dirModeKey, opts.constants.dirModes.to);
                mainFields.fadeOut(fadeSpeed, function () {
                    dynamics.insertBefore(dynamicsDivider);
                    statics.insertAfter(dynamicsDivider);

                    directionFields.find(opts.fields.dir.staticLabel).text('Ending At:');
                    directionFields.find(opts.fields.dir.dynamicLabel).text('Starting At:');

                    if (opts.eventTypeName == '') {
                        directionFields.find(opts.fields.dir.staticEventType).html(opts.locationName);
                        directionFields.find(opts.fields.dir.staticLocation).hide();
                    }
                    else {
                        directionFields.find(opts.fields.dir.staticEventType).html(opts.eventTypeName);
                        directionFields.find(opts.fields.dir.staticLocation).html(opts.locationName);
                    }

                    directionFields.find(opts.fields.dir.staticAddress).html(opts.address);

                    _setInfoWindowSize(null, directionsHeight, function () {
                        directionFields.fadeIn(fadeSpeed);
                    });
                });
            });

            // "From Here" click.
            $(this).find(opts.fields.mainFromHereLink).unbind("click").click(function () {
                Container.data(opts.constants.dirModeKey, opts.constants.dirModes.from);

                directionFields.find(opts.fields.dir.staticLabel).text('Starting At:');
                directionFields.find(opts.fields.dir.dynamicLabel).text('Ending At:');

                mainFields.fadeOut(fadeSpeed, function () {
                    dynamics.insertAfter(dynamicsDivider);
                    statics.insertBefore(dynamicsDivider);

                    directionFields.find(opts.fields.dir.staticLabel).text('Starting At:');
                    directionFields.find(opts.fields.dir.dynamicLabel).text('Ending At:');

                    if (opts.eventTypeName == '') {
                        directionFields.find(opts.fields.dir.staticEventType).html(opts.locationName);
                        directionFields.find(opts.fields.dir.staticLocation).hide();
                    }
                    else {
                        directionFields.find(opts.fields.dir.staticEventType).html(opts.eventTypeName);
                        directionFields.find(opts.fields.dir.staticLocation).html(opts.locationName);
                    }

                    directionFields.find(opts.fields.dir.staticAddress).html(opts.address);

                    _setInfoWindowSize(null, directionsHeight, function () {
                        directionFields.fadeIn(fadeSpeed);
                    });
                });
            });

            // "Go Back" click.
            $(this).find(opts.fields.goBackLink).unbind("click").click(function () {
                directionFields.fadeOut(fadeSpeed, function () {
                    $.theknot.uw.googleMaps.centerMap(MyInfoWindow.uwInfoWindowOptions.latLng);
                    _setInfoWindowSize(Container.data('origWidth'), Container.data('origHeight'), function () {
                        mainFields.fadeIn(fadeSpeed);
                    });
                });
            });

            function preparePop() {
                var popOptions = new $.theknot.uw.googleMaps.directionsPopupOptions();
                popOptions.width = '1000';
                popOptions.height = '800';
                popOptions.setFocus = false;
                return $.theknot.uw.googleMaps.showDirectionsPopup(popOptions);
            }

            // "Get directions" click.
            $(this).find(opts.fields.dir.getDirectionsLink).unbind("click").click(function () {
                var dirSvc = null;
                var dirReq = null;
                var val = null;

                showCheckingDirections();

                switch (directionFields.find(opts.fields.dir.checkedRadio).val()) {
                    case "0":
                        // Marker on map
                        val = $.trim(selPoints[0].options[selPoints[0].selectedIndex].value);
                        var text = $.trim(selPoints[0].options[selPoints[0].selectedIndex].text);
                        var id = selPoints[0].options[selPoints[0].selectedIndex].id;

                        if (val.length == 0) {
                            alert('You must select an option from the "Marker on map" field in order to get directions.');
                            hideCheckingDirections();
                            return;
                        }

                        break;
                    case "1":
                        // Street Address
                        val = $.trim(directionFields.find(opts.fields.dir.streetAddressTextBox).val());
                        if (val.length == 0) {
                            alert('You must enter a value into the "Street address with city & state" field in order to get directions.');
                            hideCheckingDirections();
                            return;
                        }

                        break;
                    default:
                        alert('You must select either "Marker on map" or "Street address with city & state".');
                        hideCheckingDirections();
                        return;
                        break;
                }

                var destination = ((Container.data(opts.constants.dirModeKey) == opts.constants.dirModes.to) ? opts.address : val);
                var origin = ((Container.data(opts.constants.dirModeKey) == opts.constants.dirModes.to) ? val : opts.address);

                dirSvc = new google.maps.DirectionsService();
                dirReq =
                {
                    destination: destination,
                    origin: origin,
                    provideRouteAlternatives: false,
                    travelMode: google.maps.DirectionsTravelMode.DRIVING
                }

                var prepPop = preparePop();

                dirSvc.route(dirReq, function (result, status) {
                    switch (status) {
                        case google.maps.DirectionsStatus.OK:
                            if (result.routes[0].legs[0].steps.length == 1) {
                                if (result.routes[0].legs[0].start_geocode.geometry.location.equals(result.routes[0].legs[0].end_geocode.geometry.location)) {
                                    // Nice try McQ...
                                    if (prepPop != null) { prepPop.close(); }
                                    alert('Unable to show directions for this request as the start and end points are the same.\nPlease choose a different start or end point.');
                                    hideCheckingDirections();
                                    return false;
                                }
                            }

                            // Assume success at this point...
                            directionFields.find(opts.fields.dir.checkingDirectionsContainer).fadeOut('fast', function () {
                                directionFields.find(opts.fields.dir.foundDirectionsContainer).fadeIn('fast', function () {
                                    var objCommon = (isAdminPage) ? $.theknot.uw.admin.commonMemberElements : $.theknot.uw.view.commonGuestviewElements;

                                    var dirOpts = new $.theknot.uw.googleMaps.directionsPopupOptions();
                                    dirOpts.width = '1000';
                                    dirOpts.height = '800';
                                    dirOpts.key = opts.key;
                                    dirOpts.userId = objCommon.Site.UserId;
                                    dirOpts.destination.address = destination;
                                    dirOpts.origin.address = origin;

                                    var dirPop = $.theknot.uw.googleMaps.showDirectionsPopup(dirOpts);
                                    if (dirPop == null) {
                                        alert('We were unable to open your directions in a new window.\nPlease make sure that the popup was not blocked by your browser or other popup blocking software and try again.');
                                    }

                                    $('div#falseFader').hide();
                                    $('div#falseFader').fadeIn(1000, function () {
                                        directionFields.find(opts.fields.dir.foundDirectionsContainer).fadeOut('fast', function () {
                                            directionFields.find(opts.fields.dir.linksContainer).show();
                                        });
                                    });


                                });
                            });

                            break;
                        case google.maps.DirectionsStatus.ZERO_RESULTS:
                            if (prepPop != null) { prepPop.close(); }
                            alert('There were no results returned when requesting directions between the two points given.');
                            hideCheckingDirections();
                            return;
                            break;
                        case google.maps.DirectionsStatus.NOT_FOUND:
                        default:
                            if (prepPop != null) { prepPop.close(); }
                            alert('Unable to retrieve directions between the two points given.');
                            hideCheckingDirections();
                            break;
                    }
                });
            });

            function _setInfoWindowSize(newWidth, newHeight, callback) {
                MyInfoWindow.infoWindow.close();


                if ($.theknot.isNullOrUndef(newWidth)) { newWidth = Container.css('width'); }
                if ($.theknot.isNullOrUndef(newHeight)) { newHeight = Container.css('height'); }

                Container.width(newWidth);
                Container.height(newHeight);


                MyInfoWindow.infoWindow = new google.maps.InfoWindow(
                {
                    content: Container[0]
                });

                google.maps.event.addListener(MyInfoWindow.infoWindow, 'domready', function () {
                    if ($.isFunction(callback)) {
                        callback();
                    }
                });

                MyInfoWindow.infoWindow.open($.theknot.uw.googleMaps.globals.mapObject, MyMarker.marker);
            }

            function _removeThisAddressFromSelect() {
                for (var i = 0; i < selPoints[0].options.length; ++i) {
                    if (selPoints[0].options[i].id == opts.elementId) {
                        selPoints[0].remove(i);
                        break;
                    }
                }

                if (selPoints[0].options.length == 1) {
                    selPoints.parents('tr').hide();
                    selPoints.parents('tr').next().hide(); // hide the 15px spacer after the field also.
                    dynamics.find(opts.fields.dir.streetAddressRadio).attr('checked', true);
                    dynamics.find(opts.fields.dir.pointOnMapRadio).attr('checked', false);
                    hasSelPointsDropDown = false;
                }
                else {
                    dynamics.find(opts.fields.dir.pointOnMapRadio).attr('checked', true);
                    dynamics.find(opts.fields.dir.streetAddressRadio).attr('checked', false);
                }
            }

            function showCheckingDirections() {
                directionFields.find(opts.fields.dir.linksContainer).hide();
                directionFields.find(opts.fields.dir.checkingDirectionsContainer).show();
            }

            function hideCheckingDirections() {
                directionFields.find(opts.fields.dir.checkingDirectionsContainer).hide();
                directionFields.find(opts.fields.dir.linksContainer).show();
            }

        });

    };



    $.fn.uwMapInfoWindow.defaultOptions =
    {
        key: '',
        latLng: '',
        locationName: '',
        address: '',
        cityStateZip: '',
        eventTypeName: '',
        imageUrl: '',
        gecodeResults: '',
        elementId: 0,

        fields:
        {
            mainFieldsContainer: 'div#divMainFields',
            mainLocationName: 'span#spnMainLocationName',
            mainAddress: 'span#spnMainAddress',
            mainCityStateZip: 'span#spnMainCityStateZip',
            mainEventTypeName: 'span#spnMainEventTypeName',
            mainDirectionsLabel: 'span#spnMainDirectionsLabel',
            mainToHereLink: 'a#hlnkMainToHereLink',
            mainFromHereLink: 'a#hlnkMainFromHereLink',
            mainTypeImage: 'img#imgMainTypeImage',
            mainTypeTitle: 'span#spnMainEventTypeTitle',
            goBackLink: 'a#hlnkGoBack',

            dir:
            {
                divider: 'div#divDirectionsDivider',
                mainContainer: 'div#divDirections',
                staticAddressContainer: 'div#divStaticAddress',
                staticLabel: 'span#spnStaticLabel',
                staticAddress: 'span#spnStaticAddress',
                staticLocation: 'span#spnStaticLocationName',
                staticEventType: 'span#spnStaticEventType',
                dynamicAddressContainer: 'div#divDynamicAddress',
                dynamicLabel: 'span#spnDynamicLabel',
                pointOnMapSelect: 'select[id$=_selPointOnMap]',
                pointOnMapRadio: 'input:radio[id=rdoAddressLookupType1]',
                streetAddressTextBox: 'input#txtStreetAddress',
                streetAddressRadio: 'input:radio[id=rdoAddressLookupType2]',
                bothRadios: 'input:radio[name=AddressLookupType]',
                checkedRadio: 'input:radio[name=AddressLookupType]:checked',
                getDirectionsLink: 'a#hlnkGetDirections',
                linksContainer: 'div#divLinksContainer',
                checkingDirectionsContainer: 'div#divCheckingDirectionsContainer',
                foundDirectionsContainer: 'div#divFoundDirectionsContainer',
                openDirectionsLink: 'a#hlnkOpenDirections'
            }
        },

        constants:
        {
            dirModeKey: 'dirMode',
            dirModes:
            {
                to: 'to',
                from: 'from'
            }
        }
    };

})(jQuery);