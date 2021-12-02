var express = require('express');
var gpsacc_rt = express.Router();
module.exports = gpsacc_rt;

var mod_xid = 'gpsacc';

var gaco = require(appConfig.lib_path + '/gacobj.js');

gpsacc_rt.get('/', function(req, res) {

    crrf.sessionValid(req, res, function() {
	
		crrf.setCurrentMod(mod_xid);
		
		view_gpsacc(req, res, '');
    });
});

gpsacc_rt.post('/service', function(req, res){

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
	}
});

gpsacc_rt.post('/', function(req, res){

    crrf.sessionCheck(req, res, function() {

		crrf.setCurrentMod(mod_xid);
	
		var action = req.body.action;
		
		switch(action) {
		
			case 'list':
				list_gpsacc(req, res);
			break;
                
			case 'add':
				addedit_gpsacc(req, res, false);
			break;
                
			case 'edit':
				addedit_gpsacc(req, res, true);
			break;

			case 'delete':
				delete_gpsacc(req, res);
			break;
			
		}
    });
		
});

function view_gpsacc(req, res, msg) {
        
	res.render('gpsacc', cfn.hashConcat([
							crrf.overall_output(), 
							{
								hid0: '',
								msg: '',
								show_subnav: true,
							}
						])
	);
}

function list_gpsacc(req, res) {

    var search = cfn.parseJSON(req.body.search);
	var page = cfn.intVal(req.body.page);

    gaco.getGpsAccList(page, search, function(data, tolfound, msg) {
	
        res.render('gpsacc_list', {
                                    msg: '',
                                    itemlist: data,
                                    tolfound: tolfound,
                                    pagelist: crrf.getPageNum(page, tolfound),
                                });
    });
}

function addedit_gpsacc(req, res, isedit) {

	var idx = cfn.intVal(req.body.idx);
	var step = cfn.intVal(req.body.step);

	if (isedit && idx <= 0) {
		res.send({re: 1, msg: 'Invalid Index!'});
		return;
	}
	
	if (step == 0) {
	
		if (isedit) {
			gaco.getGpsAccData(idx, function(data, msg) {
				res.render('gpsacc_detail', {
											msg: '',
											data: data,
										});
			});
		}
		else
			res.render('gpsacc_detail', {
										msg: '',
										data: {},
									});
	}
	else if (step == 1) {
	
		var fname = cfn.strVal(req.body.fname);
		var fpgid = cfn.strVal(req.body.fpgid);
		var femail = cfn.strVal(req.body.femail);
		var fpassword = cfn.strVal(req.body.fpassword);
		var fhost = cfn.strVal(req.body.fhost);
		var fport = cfn.strVal(req.body.fport);
		var ftls = cfn.strVal(req.body.ftls);
		var fdesc = cfn.strVal(req.body.fdesc);
		var fsuspend = cfn.intVal(req.body.fsuspend);
		
		var chkparam = [
						{type:'str', val:fname, msg:'Name', max:128},
						{type:'str', val:fpgid, msg:'Traccar ID', max:255},
						{type:'email', val:femail, msg:'Email', max:255},
						{type:'str', val:fpassword, msg:'Password', max:255},
						{type:'str', val:fhost, msg:'Host', max:255},
						{type:'num', val:fport, msg:'Port'},
						];
		var emsg = cfn.validCheck(chkparam);		
		
		if (!emsg) {
		
			var pdata = {name: fname, pgid: fpgid, email: femail, password: fpassword, host: fhost, port: fport, tls: ftls, desc:fdesc, suspend: fsuspend};
		
			gaco.addeditGpsAcc((isedit) ? idx: 0, pdata, function(result, msg) {
				
				if (result == true) {
					res.send({re: 0, msg: ''});
				}
				else
					res.send({re: 1, msg: msg});
			});
		}
		
		if (emsg) {
			res.send({re: 1, msg: emsg});
		}
	}
	else {
		res.send({re: 1, msg: 'Invalid Index!'});
    }
}

function delete_gpsacc(req, res) {

	var idx = cfn.strVal(req.body.idx);
    var idxs = cfn.parseJSON(idx);
    
	if (!idxs.length) {
		res.send({re: 1, msg: 'Invalid Index!'});
		return;
	}
    
    var tol_idx = cfn.length(idxs);
    var idx_cnt = 0;
    var msg = '';

    var del_idx = function(idx, callback) {

        gaco.deleteGpsAcc(idx, function(result, msg) {
            if (result != true) 
                msg += ((msg) ? '\n': '') + msg;
                
            idx_cnt++;
            if (idx_cnt < tol_idx) 
                del_idx(idxs[idx_cnt], callback);
            else
                callback();
        });
    }
    
    del_idx(idxs[idx_cnt], function() {
        res.send({re: (msg) ? 1: 0, msg: msg});
    });
	
}

function get_service(req, res) {

	res.send(cfn.strVal(e2g.getStatus()));
	
}

function start_service(req, res) {

    e2g.reload(function(err) {

		if (!err) {
            e2g.start();
			res.send('OK');
		}
		else {
			res.send(err.message);
		}
    });

	
}

function stop_service(req, res) {

	e2g.stop();
	res.send('OK');
	
}
