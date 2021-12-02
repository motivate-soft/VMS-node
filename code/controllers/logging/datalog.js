var express = require('express');
var datalog_rt = express.Router();
module.exports = datalog_rt;

var mod_xid = 'datalog';

var emlobj = require(appConfig.lib_path + '/emailobj.js');

datalog_rt.get('/', function(req, res) {

    crrf.sessionValid(req, res, function() {
	
		crrf.setCurrentMod(mod_xid);
		
		view_datalog(req, res, '');
    });
});

datalog_rt.post('/', function(req, res){

    crrf.sessionCheck(req, res, function() {

		crrf.setCurrentMod(mod_xid);
	
		var action = req.body.action;
		
		switch(action) {
		
			case 'list':
				list_datalog(req, res);
			break;
                
		}
    });
		
});

function view_datalog(req, res, msg) {
        
	res.render('datalog', cfn.hashConcat([
							crrf.overall_output(), 
							{
								hid0: '',
								msg: '',
								show_subnav: true,
							}
						])
	);
}

function list_datalog(req, res) {

    var search = cfn.parseJSON(req.body.search);
	var page = cfn.intVal(req.body.page);

    emlobj.getLogList(page, search, function(data, tolfound, msg) {
	
        res.render('datalog_list', {
                                    msg: '',
                                    itemlist: data,
                                    tolfound: tolfound,
                                    pagelist: crrf.getPageNum(page, tolfound),
                                });
    });
}

