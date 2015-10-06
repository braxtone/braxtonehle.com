// -------------------------------------------------------------------------| $(document).ready
$(document).ready(function () {
    //    var obj = $.theknot.uw.view.rsvpResponder;
    //    obj.SetupEvents();
    //   obj.Onload_EnsureDefaultValuesAreSet();
    //obj.SetupDynamicSelectWidthsForIe();
    if ($("div.formRSVPInfo").length) {
        if (!$("table[id$=_tblNoMatchFields]").find("td.entree").length) {
            $("div.formRSVPInfo").css("max-width", "370px");
        } else {
            $("div.formRSVPInfo").addClass("form_RSVPInfo");
        }
    }

    var radioContainer = $(".radio-container");
    radioContainer.each(function () {
        var $this = $(this),
            radioCheck = $this.find("input[value=true]").attr("checked");
        if (!radioCheck) {
            $this.parents(".radio").next(".entree").find("select").attr("disabled", "disabled");
        }
    });

    radioContainer.find("input:radio").click(function () {
        var $this = $(this),
            $select = $this.parents(".radio").next(".entree").find("select"),
            $value = $this.val();
        if ($value == "true" && $this.attr("checked")) {
            $select.removeAttr("disabled");
        } else {
            $select.attr("disabled", "disabled");
        }
    });

}); 

// -------------------------------------------------------------------------| Namespace definitions.
$.theknot.uw.view.rsvpResponder = function(){};

// -------------------------------------------------------------------------| Body
$.extend($.theknot.uw.view.rsvpResponder,
{
    // -----------------------------------------------------| Properties
    fieldSelectors : 
    {
        attendanceRadio : 'input:radio[name=rdoWillAttend]',
        selectedAttendanceRadio : 'input:radio[name=rdoWillAttend]:checked',
        primaryFirstName : 'input#txtPrimaryFirstName',
        primaryLastName : 'input#txtPrimaryLastName',
        primaryOptionSelect : 'select[id$=selPrimaryRSVPOptions]',
        numberInParty : 'input#txtNumberInParty',
        
        primaryOptionsLabel : 'div#divPrimaryRSVPOptionsLabel',
        promaryOptionsContainer : 'div#divPrimaryRSVPOptionsContainer',
        primaryEmailAddr : 'input#txtPrimaryEmail',
        GuestInfoTargetContainer : 'div#divAdditionalGuestInfoTarget',
        GuestInfoTemplateContainer : 'div#divAdditionalGuestInfoTemplate',
        AdditionalGuestInfoTable : 'table#tblAdditionalGuestInfo',
        AdditionalGuestNumberLabel : 'span#spnAdditionalGuestNumber',
        AdditionalGuestOptionsContiner : 'div#divAdditionalGuestOptionsContiner',
        AdditionalGuestOptionsLabel : 'div#divAdditionalGuestOptionsLabel',
        
        rsvpSentContainer : 'div#divRSVPSent',
        loadingImage : 'div#divRSVPLoadingImg',
        
        SubmitButton : 'img#imgSubmitRSVP',
        errorMessageContainer : 'div#divErrorMessages',
        masterContainer : 'div#divRSVPResponderParent'
        
    },
    
    WebServiceUrl : '/view/webservices/RsvpResponder.ashx',
    
    ShowErrorMessage : function(message)
    {
        $(this.fieldSelectors.errorMessageContainer).html(message);
    },
    
    SetupDynamicSelectWidthsForIe : function()
    {
        /*
        if($.browser.msie)
        {
            $('select').mouseover(function()
            {
                $(this).data("origWidth", $(this).css("width")).css("width", "auto");
            });
            
            $('select').mouseout(function()
            {
                $(this).css("width", $(this).data("origWidth"));
            });
        }
        */
    },
    
    SetupEvents : function()
    {
        $(this.fieldSelectors.numberInParty).keyup(function()
        {
            $.theknot.uw.view.rsvpResponder.ValidateNumberInParty();
        });
        
        $(this.fieldSelectors.numberInParty).change(function()
        {
            if($.trim($(this).val()).length == 0)
            {
                $(this).val('0');
                $(this).keyup();
            }
        });
        
//        if($.browser.msie)
//        {
//            $(this.fieldSelectors.attendanceRadio).click(function()
//            {
//                $($.theknot.uw.view.rsvpResponder.fieldSelectors.numberInParty).focus();
//            });
//        }
        
        $(this.fieldSelectors.attendanceRadio).change(function()
        {
            $.theknot.uw.view.rsvpResponder.setFieldsAccordingToRadioSelection();
        });
        
//         $(this.fieldSelectors.SubmitButton).parent('a').focus(function()
//         {
//            $(this).blur();
//         });
        
        $(this.fieldSelectors.SubmitButton).click(function()
        {
            $(this).parent('a').blur();
            var me = $.theknot.uw.view.rsvpResponder;
            $(me.fieldSelectors.errorMessageContainer).html('');
            var isValid = false;
            isValid = me.validatePrimaryFields();
            if($(me.fieldSelectors.GuestInfoTargetContainer).find('table').length > 0)
            {
                isValid = me.validateGuestFields();
            }
            if(isValid)
            {
                $(me.fieldSelectors.SubmitButton).hide();
                $(me.fieldSelectors.loadingImage).show();
                
                me.SubmitRSVP(
                    function()
                    {
                        // Success
                        $($.theknot.uw.view.rsvpResponder.fieldSelectors.masterContainer).hide();
                        $($.theknot.uw.view.rsvpResponder.fieldSelectors.rsvpSentContainer).show();
                    },
                    function()
                    {
                        // Error
                        $($.theknot.uw.view.rsvpResponder.fieldSelectors.SubmitButton).show();
                    },
                    function()
                    {
                        // Complete
                        $($.theknot.uw.view.rsvpResponder.fieldSelectors.loadingImage).hide();
                    }
                );
            }
        });
    },
    
    Onload_EnsureDefaultValuesAreSet : function()
    {
        $(this.fieldSelectors.numberInParty).val("0");
        $(this.fieldSelectors.primaryOptionSelect).attr('id', 'selPrimaryRSVPOptions')
        $(this.fieldSelectors.primaryOptionSelect)[0].selectedIndex = 0;
        this.removeAllGuestFields();
        if($(this.fieldSelectors.selectedAttendanceRadio).val()*1)
        {
            $(this.fieldSelectors.attendanceRadio + '[value=0]').click();
            this.setFieldsAccordingToRadioSelection();
        }
    },
    
    ShowPrimaryRSVPOptions : function()
    {
        var me = $.theknot.uw.view.rsvpResponder;
        if($(me.fieldSelectors.primaryOptionSelect)[0].options.length>1)
        {
            $(me.fieldSelectors.primaryOptionsLabel).show();
            $(me.fieldSelectors.promaryOptionsContainer).show();
        }
    },
    
    HidePrimaryRSVPOptions : function()
    {
        $($.theknot.uw.view.rsvpResponder.fieldSelectors.primaryOptionsLabel).hide();
        $($.theknot.uw.view.rsvpResponder.fieldSelectors.promaryOptionsContainer).hide();
    },
    
    ValidateNumberInParty : function()
    {
        var txtBox = $(this.fieldSelectors.numberInParty);
        txtBox.val($.trim(txtBox.val()));
        var val = txtBox.val();
        
        if(val.length > 0)
        {
            if(isNaN(val))
            {
                alert('Please enter a valid number.');
                if(($(this.fieldSelectors.selectedAttendanceRadio).val()*1))
                {
                    txtBox.val('1');
                }
                else
                {
                    txtBox.val('0');
                }
                txtBox.focus();
                return;
            }
            
            if(val > 0)
            {
                if(!($(this.fieldSelectors.selectedAttendanceRadio).val()*1))
                {
                    $(this.fieldSelectors.attendanceRadio + '[value=1]').click();
                }
                this.setFieldsAccordingToRadioSelection();
            }
            else
            {
                if(($(this.fieldSelectors.selectedAttendanceRadio).val()*1))
                {
                    $(this.fieldSelectors.attendanceRadio + '[value=0]').click();
                    this.setFieldsAccordingToRadioSelection();
                }
            }
        }
        else
        {
            //txtBox.val('0');
        }
    },
    
    setFieldsAccordingToRadioSelection : function()
    {
        var me = $.theknot.uw.view.rsvpResponder;
        var selectedRadio = $(me.fieldSelectors.selectedAttendanceRadio);
        var val = selectedRadio.val()*1;
        var NumberTextBox = $(me.fieldSelectors.numberInParty);
        var NumberVal = $.trim(NumberTextBox.val());
        
        if(val == 1)
        {
            if(NumberVal == '' || NumberVal == 0)
            {
                NumberTextBox.val("1");
                NumberVal = 1;
            }
            me.ShowPrimaryRSVPOptions();
            
            var currNumberOfGuests = $(me.fieldSelectors.GuestInfoTargetContainer).find('table').length;
            if(currNumberOfGuests > (NumberVal-1))
            {
                me.removeExcessGuestFields(NumberVal-1);
            }
            else
            {
                me.cloneGuestInfoFields(currNumberOfGuests+1, NumberVal-1);
            }
            return;
        }
        else
        {
            if(NumberVal == '' || NumberVal <= 1)
            {
                NumberTextBox.val("0");
                me.HidePrimaryRSVPOptions();
                me.removeAllGuestFields();
            }
            else
            {
                if(NumberVal > 1)
                {
                    if(confirm("Press OK to confirm that you DO NOT plan to attend"))
                    {
                        NumberTextBox.val("0");
                        me.HidePrimaryRSVPOptions();
                        me.removeAllGuestFields();
                    }
                    else
                    {
                        selectedRadio.blur();
                        selectedRadio.siblings('input:radio').attr('checked', 'checked');
                    }
                }
            }
        }
    },
    
    cloneGuestInfoFields : function(startIdx, totalGuests)
    {
        for(var i=startIdx; i<=totalGuests; ++i)
        {
            var tblClone = $(this.fieldSelectors.AdditionalGuestInfoTable).clone();
            tblClone.attr('id', tblClone.attr('id') + i);
            tblClone.find('input').each(function(){ $(this).attr('id', $(this).attr('id')+i); $(this).val(''); });
            tblClone.find(this.fieldSelectors.AdditionalGuestNumberLabel).html(i);
            
            if($(this.fieldSelectors.primaryOptionSelect)[0].options.length>1)
            {
                var clonedOptions = $(this.fieldSelectors.primaryOptionSelect).clone();
                clonedOptions.attr('id', 'selAdditionalGuestRSVPOptions' + i);
                tblClone.find(this.fieldSelectors.AdditionalGuestOptionsContiner).append(clonedOptions);
                tblClone.find(this.fieldSelectors.AdditionalGuestOptionsContiner).show();
                tblClone.find(this.fieldSelectors.AdditionalGuestOptionsLabel).show();
            }
            
            $(this.fieldSelectors.GuestInfoTargetContainer).append(tblClone);
            //this.SetupDynamicSelectWidthsForIe();
        }
    },
    
    removeAllGuestFields : function()
    {
        $(this.fieldSelectors.GuestInfoTargetContainer).empty();
    },
    
    removeExcessGuestFields : function(totalGuests)
    {
        var idx = 1;
        $(this.fieldSelectors.GuestInfoTargetContainer).find('table').each(function()
        {
            if(idx>totalGuests)
            {
                $(this).remove();
            }
            else
            {
                ++idx;
            }
        });
    },
    
    validatePrimaryFields : function()
    {
        var fields = 
        {
            first : new $.theknot.InputField(this.fieldSelectors.primaryFirstName, 'First Name', /first\s{1}name/i, true, 'Please supply your first name.'),
            first_validchars : new $.theknot.InputField(this.fieldSelectors.primaryFirstName, 'First Name', /[^a-zA-Z- ]/, true, "Please enter valid characters for your first name."),
            
            last : new $.theknot.InputField(this.fieldSelectors.primaryLastName, 'Last Name', /last\s{1}name/i, true, 'Please supply your last name.'),
            last_validchars : new $.theknot.InputField(this.fieldSelectors.primaryLastName, 'Last Name', /[^a-zA-Z- ]/, true, "Please enter valid characters for your last name.")//,
        };
        
        for(var idx in fields)
        {
            fields[idx].validate();
            if(!fields[idx].isvalid)
            {
                this.ShowErrorMessage(fields[idx].error);
                return false;
            }
        }
        
        
        if(!$.theknot.isValidEmailAddress($(this.fieldSelectors.primaryEmailAddr).val()))
        {
            this.ShowErrorMessage('Please supply a valid email address.');
            return false;
        }
        
        return true;
    },
    
    validateGuestFields : function()
    {
        var isDirty = false;
        var allFieldsValidField = false;
       
        $(this.fieldSelectors.GuestInfoTargetContainer).find('table').each(function()
        {
            if(!isDirty)
            {
                var me = $.theknot.uw.view.rsvpResponder;
                var fields = 
                {
                    first : new $.theknot.InputField($(this).find('input[id^=txtAdditionalGuestFirstName]'), 'Guest First Name', /first\s{1}name/i, true, 'Please supply a first name for each guest that will be attending with you.'),
                    first_validchars : new $.theknot.InputField($(this).find('input[id^=txtAdditionalGuestFirstName]'), 'First Name', /[^a-zA-Z- ]/, true, "Please enter valid characters for each guest's first name."),
                    
                    last : new $.theknot.InputField($(this).find('input[id^=txtAdditionalGuestLastName]'), 'Guest Last Name', /last\s{1}name/i, true, 'Please supply a last name for each guest that will be attending with you.'),
                    last_validchars : new $.theknot.InputField($(this).find('input[id^=txtAdditionalGuestLastName]'), 'Guest Last Name', /[^a-zA-Z- ]/, true, "Please enter valid characters for  each guest's last name.")//,
                };
                
                for(var idx in fields)
                {
                    fields[idx].validate();
                    if(!fields[idx].isvalid)
                    {
                        me.ShowErrorMessage(fields[idx].error);
                        allFieldsValidField = false;
                        isDirty = true;
                        break;
                    }
                    else
                    {
                        allFieldsValidField = true;
                    }
                }
            }
  
        });
        return allFieldsValidField;
        
    },
    
    SubmitRSVP : function(successCallback, errorCallback, completeCallback)
    {
        var queryString = $.theknot.formatStr('uid={0}&sid={1}', 
            $.theknot.uw.view.commonGuestviewElements.Site.UserId,
            $.theknot.uw.view.commonGuestviewElements.Site.Id
        );
        
        $(this.fieldSelectors.masterContainer).find('input').each(function()
        {
            if(this.type == 'radio')
            {
                return;
            }
            queryString = $.theknot.formatStr("{0}&{1}={2}", queryString, $(this).attr('id'), $(this).val());
        });
        
        $(this.fieldSelectors.masterContainer).find('select').each(function()
        {
            queryString = $.theknot.formatStr("{0}&{1}={2}", queryString, $(this).attr('id'), $(this).val());
        });
        
        var willAttendValue = $(this.fieldSelectors.selectedAttendanceRadio).val();
        queryString = $.theknot.formatStr("{0}&rdoWillAttend={1}", queryString, willAttendValue);
            
        $.ajax(
		{
			type: 'POST',
			url: this.WebServiceUrl,
			data: queryString,
            dataType: 'json',   
            contentType: 'application/x-www-form-urlencoded; charset=ISO-8859-1',
            cache: false,
            async: true,
            success: function(data, textStatus)
            {
                if(!$.theknot.isNullOrUndef(data) && !$.theknot.isNullOrUndef(data.error)) 
                {
                    $.theknot.uw.view.rsvpResponder.ShowErrorMessage("An error occured while submiting your RSVP response.<br />Please try your request again later.");
                    if($.isFunction(errorCallback))
			        {
			           errorCallback();
			        }
                }
                else
                {
                    // only call the "successCallback" if it was "really" a success (no "error" object in returned data). 
                    if($.isFunction(successCallback))
			        {
			            successCallback();
			        }
                }
            },

			error: function(XMLHttpRequest, data, textStatus, errorThrown)
			{
                $.theknot.uw.view.rsvpResponder.ShowErrorMessage("An unexpected error occured while submiting your RSVP response.<br />Please try your request again later.");
		        if($.isFunction(errorCallback))
		        {
		            errorCallback();
		        }
			},

			complete: function(XMLHttpRequest, textStatus)
			{
			    if($.isFunction(completeCallback))
	            {
	                completeCallback();
	            }
			}
			
		});
    }
    
});