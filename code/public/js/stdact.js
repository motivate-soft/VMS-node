var _searchOn = false;
var _searchParams = '';
var _pageNo = 1;

function getSearchParams() {

	var re = '';

	if ($("#panel_search").css('display') == 'block') {

		$("#search_form :input").each(function(k, v) {
		
			if ($(v).val()) {
				re += (re) ? ',': '';
				re += addJsonStr($(v).attr('id').substring(1), $(v).val());
			}
		});
	}
	
	return re;

}

function showTB(btn) {

	for (i in btn) {
		$("#tb_" + btn[i]).css('display', 'block');
	}
	
}

function hideTB(btn) {

	for (i in btn) {
		$("#tb_" + btn[i]).css('display', 'none');
	}
	
}

function setTB(act) {

	switch (act) {
	
		case 'list':
				showTB(['Back', 'Add', 'Delete', 'Refresh', 'Search']);
				hideTB(['Save', 'Cancel']);
		break;

		case 'detail':
				hideTB(['Back', 'Add', 'Delete', 'Refresh', 'Search']);
				showTB(['Save', 'Cancel']);
		break
		
	}
}

function openSearch() {

	_searchOn = true;
	$("#panel_search").css('display', 'block');
	$("#search_form :input").first().focus();
}

function closeSearch() {

	_searchOn = false;
	_searchParams = '';
	$("#panel_search").css('display', 'none');
}

function actAjax(data, callback) {

    $.ajax({
        type: 'POST',
        url: crnmod,
        data: data,
        beforeSend: showOverlay("f1content"),
        complete: hideOverlay("f1content"),
        success: function(ret) {
        
            if (callback) callback(ret);
        }
    });    
}

function actList(callback) {

    var params = {"action": "list", "page": _pageNo};
	
	if (_searchOn && _searchParams) 
        params['search'] = _searchParams;

    actAjax(params, function(ret) {

		$("#f1content").html(ret);

        if (callback) callback();
    });
}

function actSearch(callback) {

	_pageNo = 1;
	
    var search = getSearchParams();

    _searchParams = '{' + search + '}';
	
	actList(callback);
}

function actPage(p, callback) {

	_pageNo = p;
	actList(callback);
}

function actAdd(callback) {

    actAjax({"action": "add", "step": 0}, function(ret) {

        $("#f1content").html(ret);
        
        if (callback) callback();
    });

}

function actEdit(idx, callback) {

    actAjax({"action": "edit", "step": 0, "idx": idx}, function(ret) {

        $("#f1content").html(ret);
        
        if (callback) callback();
    });

}

function actSave(data, idx, callback) {

	var params = '&action=' + ((idx != -1) ? 'edit&idx=' + idx: 'add') + '&step=1';
	
    actAjax(data + params, function(ret) {
	
        if (callback) callback(ret);
    });
}

function actDelete(idx, callback) {

    if (idx) {
        $("#dlgdelete").dialog({
            resizable: false,
            modal: true,
            buttons: {
                "Confirm": function() {
				
                    $("#dlgdelete").dialog( "close" );
                    
					actAjax({"action": "delete", "idx": '[' + idx + ']'}, function(ret) {

                        if (ret.msg)
                            alert(ret.msg);
                    
						if (callback) callback();
					});
                },
                Cancel: function() {
                    $( this ).dialog( "close" );
                }
            },
        });
    }
}

function actRename(t, validchk, callback) {

    var idx = $(t).parent().attr('idx');
    var crnname = $(t).parent().find("td").eq(1).html(); 

    $("#frename").val(crnname);
    $("#dlgrename").dialog({
        resizable: false,
        height: 140,
        modal: true,
        buttons: {
            "Submit": function() {
                if ($("#frename").val() == crnname) {
                    $( this ).dialog( "close" );
                    if (callback)
                        callback();
                }
                else if (validchk()) {
                              
                    var params = {"action": "rename", "idx": idx, "fnewname": $("#frename").val()};
                    
                    actAjax(params, function(ret) {

                            if (ret.msg)
                                alert(ret.msg);

                            if (ret.re == 0) {
								$("#dlgrename").dialog( "close" );
                                
								if (callback)
									callback($("#frename").val());
                            }
                    });
                }
            },
            Cancel: function() {
                $( this ).dialog( "close" );
            }
        },
        focus: function() {
            $("#frename").keypress(function(event) {
                if (event.keyCode == 13) {
                    $(".ui-dialog-buttonpane button:first").click();
                }
            });
        }
    });    
    
}

function actBack(callback) {
    window.location.href = parentnav;
	if (callback) callback();
}

function actCancel(callback) {

    actList();
	if (callback) callback();
}
