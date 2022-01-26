var express = require('express');
var tcsetting_rt = express.Router();
module.exports = tcsetting_rt;

var mod_xid = 'tcsetting';

tcsetting_rt.get('/', function(req, res) {

    crrf.sessionValid(req, res, function() {

		crrf.setCurrentMod(mod_xid);
		
		view_tcsetting(req, res, crrf.getLastError());
    });
});

tcsetting_rt.post('/service', function(req, res){

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
		break;

		case 'test':
			test_connection(req, res);
		break;
	}
});

tcsetting_rt.post('/', function(req, res){

    crrf.sessionCheck(req, res, function() {
		
		crrf.setCurrentMod(mod_xid);
	
		var fip = req.body.fip;
		var fhost = req.body.fhost;
		var fport = req.body.fport;
		var fsport = req.body.fsport;
		var femail = req.body.femail;
		var fpassword = req.body.fpassword;
		var fhostdisable = cfn.strVal(req.body.fhostdisable);

		// if (fhostdisable == '1') {
		// 	fhost = fip
		// }
		
		var emsg = cfn.validCheck([
								{type:'str', val:fip, msg:'Host for Server'},
								{type:'str', val:fhost, msg:'Host for Socket'},
								{type:'num', val:fport, msg:'Socket Port'},
								{type:'num', val:fsport, msg:'Server Port'},
							]);
		
		if (!emsg) {
		
			var savedata = JSON.stringify({ip: fip, port: fport, host: fhost, sport: fsport, email: femail, password: fpassword, hostdisable: fhostdisable});
			
			dbo.setMData('traccar', savedata, function(err) {
			
				if (!err) {
				
					res.send({re: 0, msg: 'Traccar setting saved.'});
				}
				else
					res.send({re: 1, msg: err.message});
			
			});
		}
		else res.send({re: 1, msg: emsg});
    });
		
});

function view_tcsetting(req, res, msg) {

	dbo.getMData('traccar', function(re) {
	
		var tcinfo = cfn.parseJSON(re);

		if (tcinfo.hostdisable == '1') {
			tcinfo.hostdisable = 'checked'
		}

		res.render('tcsetting', cfn.hashConcat([
								crrf.overall_output(), 
								{
									hid0: '',
									msg: '',
									show_subnav: true,
									data: tcinfo, 
								}
							])
		);
	});
}

function get_service(req, res) {

	res.send(cfn.strVal(tcs.getStatus()));
	
}

function start_service(req, res) {

    tcs.reload(function(err) {

		if (!err) {
            tcs.start();
			res.send('OK');
		}
		else {
			res.send(err.message);
		}
    });

	
}

function stop_service(req, res) {

	tcs.stop();
	res.send('OK');
	
}

function test_connection(req, res) {

	var ip = req.body.ip;
	var port = req.body.port;

	tcs.test(ip, port, function(re) {
		res.send(re);
	});
	
}
