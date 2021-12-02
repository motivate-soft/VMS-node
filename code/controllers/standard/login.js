var express = require('express');
var login_rt = express.Router();
module.exports = login_rt;

login_rt.get('/', function(req, res) {

	view_login(res, crrf.getLastError());
});

login_rt.post('/', function(req, res){

    var fuser = req.body.fuser;
    var fpass = req.body.fpass;

    gauo.verifyUser(fuser, fpass, function(result, gouidx, msg){

		if (result == 0) {
			var sesid = req.session.id;		
			var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
			seso.create(sesid, gouidx, ip, function(err) {
				if (err)
					res.send({re: 1, msg: err.message});
				else {
					moda.initAuth(gouidx, function(err) {
					
						if(err)
							res.send({re: 1, msg: 'Authentication error!'});
						else
							res.send({re: 0, msg: ''});
					});
				}
			});	
		}
		else
			res.send({re: result, msg: msg});
	
	});
});

function view_login(res, msg) {

    res.render('login', {
                    metatitle: appConfig.tpl.title,
                    copyright: appConfig.tpl.copyright,
                    
                    msg: msg,
                    cptype: '',
                    license: '',
                });
}


