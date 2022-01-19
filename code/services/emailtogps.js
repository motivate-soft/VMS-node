var emlobj = require(appConfig.lib_path + '/emailobj.js');
var e2glib = require(appConfig.lib_path + '/e2glib.js');
var moment = require('moment');
const exec = require('child_process').exec;

var _gpsac = [];
var _accnt = 0;
//var _interval = 900000;   		// **** 15 min, (1000 * 60) * 15
var _interval = 120000;   			// **** 2 min, (1000 * 60) * 2
//var _initstart_interval = 60000;  // **** 1 min
var _initstart_interval = 3000;   	// **** 3 sec
var _running = false;
var _sleeping = false;
var _stopping = false;
var _firsttime = true;

module.exports = {
	getStatus: getStatus,
	init: init,
    reload: reload,
	start: start,
    stop: stop,
}

function getStatus() {

	if (_stopping) return 2;
	else if (_running) return 1;
	else return 0;
}

function init(callback) {

	appConfig.checkMailExec = appConfig.service_path + '/checkemail.js';
	
    reload(function(err) {

		if (!err) {
            start();
			callback();
		}
		else
			callback(err);
    });
}

function reload(callback) {

    _gpsac = [];
    
    e2glib.getGac(function(re, err) {
    
		if (!err) {
             _gpsac = re;
			callback();
		}
		else
			callback(err);
    });
}

function start() {

	cfn.logInfo('Starting Email to GPS service -- OK', true);
    _running = true;
    _stopping = false;
	
	_accnt = 0;
    
    if (_firsttime) {
        _firsttime = false;
        _sleeping = true;
        setTimeout(run, _initstart_interval);
    }
	else {
		run();
	}
    
}

function stop() {

    _running = false;

	if (_sleeping) {
		cfn.logInfo('Email to GPS service stopped', true);
	}
	else {	
		_stopping = true;
	}
}

function next() {

	if (_accnt >= (_gpsac.length - 1)) {
		console.log(cfn.dtNow4Log() + ' ' + 'Done checking email.');
		_accnt = 0;
		_sleeping = true;
		setTimeout(run, _interval);
	}
	else {
		//console.log('  - next');
		_accnt++;
		_sleeping = true;
		setTimeout(run, 3000);
	}
}

function run() {

	if (!_running) return;
	_sleeping = false;
	//console.log('accnt = ' + _accnt + ' / ' + _gpsac.length);

	let email = "" + _gpsac[_accnt].email
	
	if (cfn.length(_gpsac) > 0 && email.search(/ftp@/g) < 0 && email.search(/gsm@/g) < 0) { // 

		//cfn.logInfo('Checking email from ' + _gpsac[_accnt].email, true);
		//console.log('Checking email from ' + _gpsac[_accnt].email);
		var days = 22; //check total day email in mailbox 20170913

		e2glib.checkEmail({
							email: _gpsac[_accnt].email,
							password: _gpsac[_accnt].password,
							host: _gpsac[_accnt].host,
							port: _gpsac[_accnt].port,
							tls: _gpsac[_accnt].tls,
							days: days,
						}, function(err, cnt) {
		
			if (err) cfn.logError(err);
			else {
				if (cnt == 0) {
					console.log(cfn.dtNow4Log() + ' ' + _gpsac[_accnt].email + ' - No new email.');
				}
				else {
					//cfn.logInfo('Fetch completed. UID ' + firstuid + ' - ' + lastuid, true);
					//console.log('Fetch completed. UID ' + firstuid + ' - ' + lastuid);
					console.log(cfn.dtNow4Log() + ' ' + _gpsac[_accnt].email + ' - Found ' + cnt + ' new email.');
				}
			}
			
			if (_running) {
				next();
			}
			else {
				_stopping = false;
				cfn.logInfo('Email to GPS service stopped', true);
				return;
			}
			
		});
                            
	}
	else {
		if (_running) {
			next();
		}
		else {
			_stopping = false;
			cfn.logInfo('Email to GPS service stopped', true);
			return;
		}
	}
    
}

