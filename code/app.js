var fs = require('fs');
var util = require('util');
var log4js = require('log4js');
var parse = require('xml-parser');
var express = require('express');
var session = require('express-session');
var bodyParser = require("body-parser");
var ejs = require('ejs');
var app = express();


global.appConfig = require('./config.js');

log4js.configure({
    appenders: {
      app: { type: "file",
      filename: appConfig.log_path + '/app.log',
      maxLogSize: 10485760, // 1024*1024*10 = 10M
      backups: 10,
      compress: true }
    },           
    categories: {
       default: { appenders: [ "app" ], level: "debug" }    
    }
}) ;

log4js.configure({
    appenders: {   
      vms: { type: "file",
      filename: appConfig.log_path + '/vms.log',
      maxLogSize: 10485760, // 1024*1024*10 = 10M
      backups: 10,
      compress: true }
    },             
    categories: {
      default: { appenders: [ "vms" ], level: "debug" }
    } 
}); 
global.appLogger = log4js.getLogger("app");
global.vmsLogger = log4js.getLogger("vms");

global.cfn = require(appConfig.lib_path + '/comfunc.js');
global.dbu = require(appConfig.lib_path + '/db/dbutil.js');
global.dbo = require(appConfig.lib_path + '/db/dbobj.js');
global.seso = require(appConfig.lib_path + '/sesobj.js');
global.gauo = require(appConfig.lib_path + '/gauobj.js');
global.moda = require(appConfig.lib_path + '/modaobj.js');
global.crrf = require(appConfig.lib_path + '/comrrf.js');
global.choc = require(appConfig.lib_path + '/comhoc.js');
global.e2g = require(appConfig.service_path + '/emailtogps.js');
global.vms = require(appConfig.service_path + '/vmshandler.js');
global.tcs = require(appConfig.service_path + '/traccarservice.js');
global.ftpService = require(appConfig.service_path + '/ftpservice.js');
global.staticService = require(appConfig.service_path + '/staticservice.js');

function initDB(callback) {
    dbo.connect(function() {
        dbo.init(function() {
            cfn.logInfo('Initializing database -- OK', true);
            callback();
        });
    });
}

function loadMod(callback) {
    try {
        var xml = fs.readFileSync(appConfig.mod_file, 'utf8');
        var obj = parse(xml);
        moda.parse(obj, function() {
            cfn.logInfo('Loading modules -- OK', true);
            callback();
        });
    } catch(err) {
        cfn.logError(err, true);
    }
}

function startHTTP(callback) {

    app.use(session({ 
                secret: 'scary lemon', 
                resave: false, 
                saveUninitialized: true, 
                cookie: { }
            }));
            
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(express.static(appConfig.public_path));
    app.set('views', appConfig.views_path);
    app.set('view engine', 'ejs');
    
    app.use('/login', require(appConfig.controller_path + '/standard/login'));
    app.use('/logout', require(appConfig.controller_path + '/standard/logout'));
    app.use('/home', require(appConfig.controller_path + '/standard/home'));

	crrf.addModuleRoute(app);
    
    app.get('/', function (req, res) {
        if (seso.getUserIdx() > 0) {
			res.redirect(appConfig.def_homepage);
        }
        else
            res.redirect('/login');
    });

	if (appConfig.kpss) {
		app.get('/kpss', function (req, res) {
			seso.check(req.session.id, function(err) {
				if (!err)
					res.send('OK')
				else
					console.log(err.message);
			});
		});
	}
	
    app.use(function(err, req, res, next) {
        if (err) {
            cfn.logError(err);
            res.status(500).send(err.message);
        }
    });

    var server = app.listen(3000, function () {
        var host = server.address().address;
        var port = server.address().port;

        cfn.logInfo('Starting HTTP server [Port:' + port + ']  -- OK', true);
        callback();
    });
}

function startVMS(callback) {

    app.use('/vms', vms);
    /*
	app.use('/vms', function(req, res, next) {
		var postData='';
		console.log(req.get('Content-Type'));
		req.on('data', function(chunk) { 
			postData += chunk;
		});

		req.on('end', function() {
			req.rawBody = postData;
			console.log('ended buffering. result: ' + req.rawBody);
			res.send('okok');
		});

	});*/
	
	cfn.logInfo('Starting VMS service  -- OK', true);
    callback();
	
	
}

function startTraccar(callback) {

    tcs.init(function(err) {
    
		if (!err) {
			//tcs.stop();
            callback();
		}
		else
			cfn.logError(err, true);
    
    });
	
}


function startE2g(callback) {

    e2g.init(function(err) {
    
		if (!err) {
			//e2g.stop();
			callback();
		}
		else
			cfn.logError(err, true);
    });

}

function startFTP(callback) {

    ftpService.init(function(err) {
    
		if (!err) {
            callback();
		}
		else
			cfn.logError(err, true);
    
    });
	
}

var process = [initDB, loadMod, startHTTP, startVMS, startTraccar, startE2g, startFTP];
//var process = [initDB, loadMod, startHTTP, startTraccar, startE2g];
var proc_cnt = 0;

function runProcess(callback) {
    
    if (proc_cnt < process.length) {
    
        process[proc_cnt](function() {
            proc_cnt++;        
            runProcess();
        });
    }
    else cfn.logInfo('Application Started Now', true);
}

runProcess();
