var express = require('express');
var home_rt = express.Router();
module.exports = home_rt;

var mod_xid = 'home';

home_rt.get('/', function(req, res) {

    crrf.sessionValid(req, res, function() {
	
		crrf.setCurrentMod(mod_xid);
        
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


