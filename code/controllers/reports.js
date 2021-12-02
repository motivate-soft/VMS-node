var express = require('express');
var reports_rt = express.Router();
module.exports = reports_rt;

var mod_name = 'reports';

reports_rt.get('/', function(req, res) {

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


