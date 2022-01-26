var express = require('express');
var datalog_rt = express.Router();
module.exports = datalog_rt;

var mod_xid = 'activedevicelog';
datalog_rt.get('/', function(req, res) {

    crrf.sessionValid(req, res, function() {
	
		crrf.setCurrentMod(mod_xid);
		
		view_datalog(req, res, '');
    });
});

datalog_rt.post('/', function(req, res){

    crrf.sessionCheck(req, res, function() {
		
		crrf.setCurrentMod(mod_xid);
        
        staticService.getStatus(function(re) {
            res.render('activedevice_list', {
                msg: '',
                itemlist: re
            });
        })
    });
		
});

function view_datalog(req, res, msg) {
        
	res.render('activedevicelog', cfn.hashConcat([
							crrf.overall_output(), 
							{
								hid0: '',
								msg: '',
								show_subnav: true,
							}
						])
	);
}