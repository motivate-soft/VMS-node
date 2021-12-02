var _editIndex = -1;
var _running = false;
var status_interval = 2000;

function init() {
    $("#forms input[type=text]").keypress(function(event) {
        if (event.keyCode == 13) {
            doSearch();
        }
    });
	//setTimeout(get_ServiceStatus, status_interval);
}

function E2GRunning() {
	if (_running) {
		alert('Please stop the Email to GPS Service first');
	}
	return _running;
}

function startserv() {
    $.ajax({
        type: 'POST',
        url: crnmod + '/service',
        data: {"action": "start"},
		success: function(ret) {
			if (ret != 'OK') {
				alert(ret);
			}
		},
	});
}

function stopserv() {

	$("#e2gstatus").html('<font color="#aa0000"><b>Stopping...</b></font>');

    $.ajax({
        type: 'POST',
        url: crnmod + '/service',
        data: {"action": "stop"},
		success: function(ret) {
			//alert(ret);
		},
	});
}

function get_ServiceStatus() {

    $.ajax({
        type: 'POST',
        url: crnmod + '/service',
        data: {"action": "status"},
        success: function(ret) {
        
			var status = '';
			if (ret == '2') {
				_running = true;
				status = '<font color="#aa0000"><b>Stopping...</b></font>';
			}
			else if (ret == '1') {
				_running = true;
				status = '<font color="#00aa00"><b>Running</b></font>';
			}
			else {
				_running = false;
				status = '<font color="#aa0000"><b>Stopped</b></font>';
			}
			$("#e2gstatus").html(status);
			
			if (_running) {
				$("#btnstarts").prop('disabled', true);  
				$("#btnstops").prop('disabled', false);
			}
			else {
				$("#btnstarts").prop('disabled', false);  
				$("#btnstops").prop('disabled', true);
			}
        }
    });    
	setTimeout(get_ServiceStatus, status_interval);

}

function save_validateok() {
    if (validateForm([
                        {id: "fname", type: "val", msg: "Name", min: 1, max: 60},
                        {id: "fpgid", type: "val", msg: "Traccar ID", max: 255},
                        {id: "femail", type: "email", msg: "Email", max: 255},
                        {id: "fpassword", type: "val", msg: "Password", max: 255},
                        {id: "fhost", type: "val", msg: "Host", max: 255},
                        {id: "fport", type: "num", msg: "Port"},
                    ])) {
        return true;
    }
    else
        return false;
}

function doList() {
	setTB('list');
	actList();
	$("#ssbtndiv").css('display', 'block');  
}

function doSearch() {
	actSearch();
}

function doRefresh() {
	actList();
}

function doPage(p) {
	actPage(p);
}

function doAdd() {
	if (!E2GRunning()) {
		$("#ssbtndiv").css('display', 'none');  
		_editIndex = -1;
		actAdd(function() {
			setTB('detail');
			$("#form1 input[type=text]:first").focus();
		});
	}
}

function doEdit(t) {
	if (!E2GRunning()) {
		$("#ssbtndiv").css('display', 'none');  
		_editIndex = $(t).parent().attr('idx');
		actEdit(_editIndex, function() {
			setTB('detail');
			$("#form1 input[type=text]:first").focus();
		});
	}
}

function doSave() {
	if (!E2GRunning()) {
		if (save_validateok()) {
			actSave($("#form1").serialize(), _editIndex, function(ret) {
				if (ret.re != 0) {
					$("#msgpan").html(ret.msg);
				}
				else {
					_editIndex = -1;
					setTB('list');
					doList();
				}
			});
		}
	}
}

function doDelete(t) {
	if (!E2GRunning()) {
		var idx = $(t).parent().attr('idx');
		actDelete(idx, function() {
			doRefresh();
		});
	}
}

function doMassDel() {

	if (!E2GRunning()) {
		var idxs = '';
		$("input[ischk=1]:checked").each(function(){
			if (idxs) idxs += ',';
			idxs += $(this).attr('name').substr(5);
		});
		if (idxs) {
			actDelete(idxs, function() {
				doRefresh();
			});
		}
	}
}

function doBack() {
	actBack();
}

function doCancel() {
	actCancel(function() {
		setTB('list');
		$("#ssbtndiv").css('display', 'block');  
	});
}
