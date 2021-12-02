var express = require('express');
var logout_rt = express.Router();
module.exports = logout_rt;

logout_rt.get('/', function(req, res) {
	
    req.session.destroy();
    seso.close();
    res.redirect('/login');
});


