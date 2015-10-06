// -------------------------------------------------------------------------| $(document).ready
$(document).ready(function()
{
    var obj = $.theknot.uw.view.mappableAddressViewer;
    obj.setupEvents();
  
}); 

// -------------------------------------------------------------------------| Namespace definitions.
$.theknot.uw.view.mappableAddressViewer = function(){};

// -------------------------------------------------------------------------| Body
$.extend( $.theknot.uw.view.mappableAddressViewer,
{
    // -----------------------------------------------------| Properties

    fieldSelectors:
    {
        mainContainer: 'div[id$=_divMappableAddressViewer]',
        locationLabel: 'span[id$=_lblLocationName]',
        addressLabel: 'span[id$=_lblAddress]',
        cityStateZipLabel: 'span[id$=_lblCityStateZip]',
        eventTypeHidden: 'input[id$=_hidEventType]',
        viewMapButton: 'a[id$=_hlnkViewMap]',
        elementId: 'input:hidden[id$=_hidElmementId]'
    },

    setupEvents: function () {
        $( this.fieldSelectors.viewMapButton ).click( function () {
            var obj = $.theknot.uw.view.mappableAddressViewer;
            var startPoint = $( this ).parents( obj.fieldSelectors.mainContainer );
            var locationName = startPoint.find( obj.fieldSelectors.locationLabel ).text();
            var address1 = startPoint.find( obj.fieldSelectors.addressLabel ).text();
            var cityStateZip = startPoint.find( obj.fieldSelectors.cityStateZipLabel ).text();
            var eventTypeId = startPoint.find( obj.fieldSelectors.eventTypeHidden ).val();
            var address = $.theknot.formatStr( "{0} {1}", address1, cityStateZip );

            var elementId = startPoint.find( obj.fieldSelectors.elementId ).val();

            if ( $( 'div[id=divGoogleMapModal]' ).length == 0 ) {
                $.theknot.uw.googleMaps.closeAllInfoWindows();
                $.theknot.uw.googleMaps.lookupAddress( address, function ( latLng ) {
                    $.theknot.uw.googleMaps.centerMap( latLng, true );

                    var mapTop = $( 'div[id$=_pnlMapCanvas]' ).offset().top;
                    var scrollPoint = $( window ).scrollTop();
                    if ( mapTop < scrollPoint ) {
                        $( "html, body" ).animate( { scrollTop: mapTop - 10 }, "slow" );
                    }

                }, null );
            }
            else {
                $.theknot.uw.googleMaps.showMapModal();

                $.theknot.uw.googleMaps.init( address,
                function () {
                    $.theknot.uw.googleMaps.markMapByAddress( address, locationName, eventTypeId, '', true, false, elementId,
                    function ( address, title, eventTypeId, latLongCoords ) {
                        $.theknot.uw.googleMaps.setModalTitleFields( address, title, eventTypeId );
                    },
                    function ( address, status ) {
                        // Error callback.
                        //obj.handleGoogleMapZeroResults(address, status, jqInitiatingObj);
                        $.theknot.uw.googleMaps.hideMapModal();
                        alert( 'Unable to retrieve map for the listed address.' );
                    } );
                    //handle google map layout issue on ie8
                    if ( $.browser.msie ) {
                        if ( $.browser.version == "8.0" ) {
                            setTimeout('$( "div.mapCanvas > div" ).css( { "width": "529px", "height": "499px" } );',2000);     
                        }
                    }
                },
                function ( address, status ) {
                    $.theknot.uw.googleMaps.hideMapModal();
                    alert( 'Unable to retrieve map for the listed address.' );
                } );

            }
        } );
    },

    handleGoogleMapZeroResults: function ( address, status, jqInitiatingObj ) {
        // right now we do nothing for this.
        /*
        var obj = $.theknot.uw.admin.mappableAddress;
        var jqStartPoint = null; 
        if($.theknot.isNullOrUndef(jqInitiatingObj))
        {
        jqStartPoint = $(obj.fieldSelectors.fieldsContainer).eq(1);
        }
        else
        {
        jqStartPoint = jqInitiatingObj.parents().find(obj.fieldSelectors.fieldsContainer).eq(1);
        }
        
        if(status == 'ZERO_RESULTS')
        {
        $.theknot.uw.googleMaps.hideMapModal();
        obj.showErrorMessage($.theknot.formatStr(obj.errorMessages.zeroResultsHtmlFormat, address), jqStartPoint);
        jqStartPoint.find(obj.fieldSelectors.previewLink).hide();
        jqStartPoint.find(obj.fieldSelectors.includeCheckBox)[0].checked=false;
        }
        else //if(status == 'INVALID_REQUEST')
        {
        $.theknot.uw.googleMaps.hideMapModal();
        obj.showErrorMessage(obj.errorMessages.genericMapErrorHtml, jqStartPoint);
        jqStartPoint.find(obj.fieldSelectors.previewLink).hide();
        jqStartPoint.find(obj.fieldSelectors.includeCheckBox)[0].checked=false;
            
        }
        */
    }

} );