// -------------------------------------------------------------------------| $(document).ready
$(document).ready(function()
{
    var lib = $.theknot.uw.view.attendantsViewer;
    //lib.breakupLongStrings();
}); 

// -------------------------------------------------------------------------| Namespace definitions.
if(typeof($.theknot.uw.view) === typeof(void(0)))
{
    // For only the attendants viewer, it is also used within the admin part of the site. 
    // In the admin section, the $.theknot.uw.view namespace is not declared - so we go ahead and declare it here.
    $.theknot.uw.view = function(){};
}
$.theknot.uw.view.attendantsViewer = function(){};

// -------------------------------------------------------------------------| Body
$.extend($.theknot.uw.view.attendantsViewer,
{
    // -----------------------------------------------------| Properties
    fieldSelectors : 
    {
        attendantsListItems : 'li[id$=Attendants]',
        attendantFirstName : 'span[id=spnAttendantFirstName]',
        attendantLastName : 'span[id=spnAttendantLastName]',
        attendantDescription : 'span[id=spnAttendantDescription]'
    },
    
    breakupLongStrings : function()
    {
        with(this.fieldSelectors)
        {
            $(attendantsListItems).find(attendantLastName).each(function()
            {
                var matches = $.trim($(this).html()).match(/.*/g);
                var newText = '';
                if(matches.length>1)
                {
                    for(var i=0; i<matches.length; ++i)
                    {
                        newText += $.trim($.theknot.breakupLongTextWithoutSpaces($.trim(matches[i]), 30, '<br />'));
                    }
                    $(this).html(newText);
                }
            });
            
            $(attendantsListItems).find(attendantDescription).each(function()
            {
                var matches = $.trim($(this).html()).match(/.*/g);
                var newText = '';
                if(matches.length>1)
                {
                    for(var i=0; i<matches.length; ++i)
                    {
                        newText += $.trim($.theknot.breakupLongTextWithoutSpaces($.trim(matches[i]), 40, '<br />'));
                    }
                    $(this).html(newText);
                }
            });
        }
    }
});