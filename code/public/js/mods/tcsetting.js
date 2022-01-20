var _editIndex = -1;
var _running = false;
var status_interval = 2000;

function init() {
    $("input[type=text]:first").focus();
    $("#form1 input[type=text]").keypress(function(event) {
        if (event.keyCode == 13) {
            doSubmit();
        }
    });    
}

function TCSRunning() {
	if (_running) {
		alert('Please stop the Traccar Service first');
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

	$("#tcsstatus").html('<font color="#aa0000"><b>Stopping...</b></font>');

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
			$("#tcsstatus").html(status);
			
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

function doTest() {

	if (save_validateOK()) {
		$("#dlgtest").dialog({
			title: 'Test Connection',
			modal: true,
			autoOpen: false,
			close: function(event, ui) {
				xhr.abort();
			},
            buttons: {
                Close: function() {
                    $( this ).dialog( "close" );
                }
            },
		});

		var ip = $("#fip").val();
		var port = $("#fport").val();
		var xhr = $.ajax({
			type: 'POST',
			url: crnmod + '/service',
			data: {"action": "test", "ip": ip, "port": port},
			beforeSend: function(){
				$("#dlgtest").dialog('open').html("<p>Connecting to " + ip + ":" + port + "...</p>");
			},
			success: function(ret) {
				$('#dlgtest').html("<p>" + ret + "</p>");
			}
		});
	}
}

function save_validateOK() {

    if (validateForm([
						{id: "fip", type: "val", msg: "Host for Server"},
						{id: "fsport", type: "num", msg: "Server Port"},
						{id: "fport", type: "num", msg: "Socket Port"},
						{id: "fhost", type: "val", msg: "Host for Socket"},
                    ])) {
		return true;
    }
    else
        return false;

}

function doSubmit() {

	if (!TCSRunning()) {
		if (save_validateOK()) {

			actAjax($("#form1").serialize(), function(ret) {
			
				$("#msgpan").html(ret.msg);
				$("input[type=text]:first").focus();
					
			});
		}
	}
}

function doBack() {
	actBack();
}


