var express = require('express');
var chgpass_rt = express.Router();
module.exports = chgpass_rt;

var mod_xid = 'chgpass';

chgpass_rt.get('/', function(req, res) {

    crrf.sessionValid(req, res, function() {

		crrf.setCurrentMod(mod_xid);
		
		view_chgpass(req, res, crrf.getLastError());
    });
});

chgpass_rt.post('/', function(req, res){

    crrf.sessionValid(req, res, function() {
		
		crrf.setCurrentMod(mod_xid);
	
		var foldpass = req.body.foldpass;
		var fnewpass = req.body.fnewpass;
		var fconpass = req.body.fconpass;
		
		var emsg = cfn.validCheck([
								{type:'pass', val:foldpass, msg:'Old Password'},
								{type:'pass', val:fnewpass, msg:'New Password', min:4, max:15},
								{type:'comp', val:fnewpass, msg:'New Password', val2: fconpass},
							]);
		
		if (!emsg) {
			gauo.setUserPass(seso.getUserIdx(), foldpass, fnewpass, function(result, msg){
			
				if (result == true) {
				
					res.send({re: 0, msg: 'Your password has been changed.'});
				}
				else
					res.send({re: result, msg: msg});
			
			});
		}
		else res.send({re: 1, msg: emsg});
    });
		
});

function view_chgpass(req, res, msg) {

	res.render('chgpass', cfn.hashConcat([
							crrf.overall_output(), 
							{
								hid0: '',
								msg: '',
								show_subnav: true,
							}
						])
	);
}


