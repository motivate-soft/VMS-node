const Client = require("ftp");

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

function FTPConnecting() {
	if (_running) {
		alert('Please disconnect the FTP first');
		
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

	$("#ftpstatus").html('<font color="#aa0000"><b>Stopping...</b></font>');

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
			$("#ftpstatus").html(status);
			
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

}

function doFTP() {
	if (save_validateOK()) {
		$("#dlgtest").dialog({
			title: 'Connection',
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

        var ip = $("#ftpip").val();
        var username = $("#ftpusername").val();
        var password = $("#ftppassword").val();
		var port = $("#ftpport").val();
		var xhr = $.ajax({
			type: 'POST',
			url: crnmod + '/service',
			data: {"action": "connect", "ip": ip, "port": port, "username": username, "password": password},
			beforeSend: function(){
				$("#dlgtest").dialog('open').html("<p>Connecting to " + ip + ":" + port + "...</p>");
			},
			success: function(ret) {
				$("#f1content").empty();
				$('#dlgtest').html("<p>" + ret.message + "</p>");
                if (ret.status && ret.data && ret.data != '[]')
                {
					$("#connectftp").prop('disabled', true);
					
					var xmlData = [];
                    
					ret.data.forEach((filePath, in_) => {
						var xhr1 = $.ajax({
							type: 'POST',
							url: crnmod + '/service',
							data: {"action": "read_xml", "ip": ip, "port": port, "username": username, "password": password, "file": filePath },
							beforeSend: function(){
								$("#dlgtest").dialog('open').html("<p>Reading " + filePath + "...</p>");
							},
							success: function(ret1) {
								xmlData.push(
									{
										path: filePath,
										type: ret1.message
									}
								)
							},
							async: false
						});
					});

					var xhr1 = $.ajax({
						type: 'POST',
						url: crnmod + '/',
						data: {"action": "list", "data": JSON.stringify(xmlData)},
						beforeSend: function(){
							$('#dlgtest').html("<p>" + ret.message + "</p>");
						},
						success: function(ret) {
							$("#f1content").html(ret);
						}
					});
                }
			}
		});
	}
}

function save_validateOK() {

    if (validateForm([
                        {id: "ftpip", type: "val", msg: "Host"},
                        {id: "ftpusername", type: "val", msg: "Username"},
                        {id: "ftpport", type: "num", msg: "Port"},
                    ])) {
		return true;
    }
    else
        return false;

}

function doSubmit() {

	if (!FTPConnecting()) {
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

function doParse(filePath) {
    var ip = $("#ftpip").val();
    var username = $("#ftpusername").val();
    var password = $("#ftppassword").val();
    var port = $("#ftpport").val();
    var xhr = $.ajax({
        type: 'POST',
        url: crnmod + '/service',
        data: {"action": "read_xml", "ip": ip, "port": port, "username": username, "password": password, "file": filePath },
        beforeSend: function(){
            // $("#dlgtest").dialog('open').html("<p>Reading " + filePath + "...</p>");
        },
        success: function(ret) {
            // $('#dlgtest').html("<p>" + ret.message + "</p><p>" + JSON.stringify(ret.data) + "</p>");
        }
    });
}

