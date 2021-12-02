var express = require('express');
var admin_rt = express.Router();
module.exports = admin_rt;

var mod_name = 'admin';

admin_rt.get('/', function(req, res) {

    crrf.sessionValid(req, res, function() {
	
		crrf.setCurrentMod(mod_name);
        
        res.render('home', cfn.hashConcat([
                                crrf.overall_output(), 
								crrf.modules_list(),
                                {
                                    hid0: '',
                                    msg: '',
                                }
                            ])
        );
    });
});


