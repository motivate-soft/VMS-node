var express = require('express');
var ftp_rt = express.Router();
module.exports = ftp_rt;
var mod_xid = 'ftp';

ftp_rt.get('/', function(req, res) {

    crrf.sessionValid(req, res, function() {
	
		crrf.setCurrentMod(mod_xid);
		
		view_ftp(req, res, '');
    });
});

ftp_rt.post('/service', function(req, res){

	var action = req.body.action;
	
	switch(action) {

		case 'status':
			get_service(req, res);
		break;

		case 'start':
			start_service(req, res);
		break;

		case 'stop':
			stop_service(req, res);

		case 'connect':
			ftp_connection(req, res);

		case 'read_xml':
			read_xml(req, res);

		break;
	}
});

ftp_rt.post('/', function(req, res){

    crrf.sessionCheck(req, res, function() {
		
		crrf.setCurrentMod(mod_xid);

		var action = req.body.action;
		if (action && action == 'list') {
			var data = cfn.parseJSON(req.body.data);
			
			res.render('ftpfile_list', {
				msg: '',
				itemlist: data
			});
			
		}
		else {
			var ftpip = req.body.ftpip;
			var ftpusername = req.body.ftpusername;
			var ftppassword = req.body.ftppassword;
			var ftpport = req.body.ftpport;
			
			var emsg = cfn.validCheck([
									{type:'str', val:ftpip, msg:'IP Address'},
									{type:'str', val:ftpusername, msg:'Username'},
									{type:'num', val:ftpport, msg:'Port'},
								]);
			
			if (!emsg) {
			
				var savedata = JSON.stringify({ip: ftpip, username: ftpusername, password: ftppassword, port: ftpport});
				
				dbo.setMData('ftp', savedata, function(err) {
				
					if (!err) {
					
						res.send({re: 0, msg: 'FTP setting saved.'});
					}
					else
						res.send({re: 1, msg: err.message});
				
				});
			}
			else res.send({re: 1, msg: emsg});
		}
    });
		
});

function view_ftp(req, res, msg) {

	dbo.getMData('ftp', function(re) {
	
		var ftpInfo = cfn.parseJSON(re);

		res.render('ftp', cfn.hashConcat([
				crrf.overall_output(), 
				{
					hid0: '',
					msg: '',
					show_subnav: true,
					data: ftpInfo
				}
			])
		);
	});

}

function get_service(req, res) {

	res.send(cfn.strVal(ftpService.getStatus()));
	
}

function start_service(req, res) {

    ftpService.reload(function(err) {

		if (!err) {
            ftpService.start();
			res.send('OK');
		}
		else {
			res.send(err.message);
		}
    });

	
}

function stop_service(req, res) {

	ftpService.stop();
	res.send('OK');
	
}

function ftp_connection(req, res) {

	var ip = req.body.ip;
	var username = req.body.username;
	var password = req.body.password;
	var port = req.body.port;

	ftpService.ftp_connect(ip, username, password, port, function(re) {
		res.statusCode = 200;
		res.send(re);
	});
	
}

function read_xml(req, res) {
	var ip = req.body.ip;
	var username = req.body.username;
	var password = req.body.password;
	var port = req.body.port;
	var filePath = req.body.file;

	ftpService.read_xml(ip, username, password, port, filePath, function(re) {
		res.statusCode = 200;
		res.send(re);
	});
}