var emlobj = require(appConfig.lib_path + '/emailobj.js');
var e2glib = require(appConfig.lib_path + '/e2glib.js');
var moment = require('moment');

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
		console.log('Done checking email.');
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

	if (cfn.length(_gpsac) > 0) {

        //gac = _gpsac[_accnt].email;

		//emlobj.getUID(gac, function(uid) {
		//console.log(gac + ': uid = ' + uid);
		
			//cfn.logInfo('Checking email from ' + _gpsac[_accnt].email, true);
			// console.log('Checking email from ' + _gpsac[_accnt].email);
			var yesterday = moment().subtract(1, 'days').format('YYYY/MM/DD');
			
			//e2glib.fetch({
			
			e2glib.checkEmail({
                                email: _gpsac[_accnt].email,
                                password: _gpsac[_accnt].password,
                                host: _gpsac[_accnt].host,
                                port: _gpsac[_accnt].port,
                                tls: _gpsac[_accnt].tls,
                                //criteria: uid + ':*',
                                criteria: [ 'ALL', ['SINCE', yesterday] ],
                            }, function(err, cnt) {
            
                if (err) cfn.logError(err);
                else {
                    if (cnt == 0) {
                        console.log(_gpsac[_accnt].email + ' - No new email.');
					}
                    else {
                        //cfn.logInfo('Fetch completed. UID ' + firstuid + ' - ' + lastuid, true);
                        //console.log('Fetch completed. UID ' + firstuid + ' - ' + lastuid);
                        console.log(_gpsac[_accnt].email + ' - Found ' + cnt + ' new email.');
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
                            /*
                            {
							email: _gpsac[_accnt].email,
							password: _gpsac[_accnt].password,
							host: _gpsac[_accnt].host,
							port: _gpsac[_accnt].port,
							tls: _gpsac[_accnt].tls,
							//criteria: uid + ':*',
							criteria: [ 'ALL', ['SINCE', yesterday] ],
							onMessage: function(re) {
							
											if (firstuid == -1) firstuid = re.uid;
											lastuid = re.uid;
											
											e2glib.getGPSData(re.body, function(errmsg, re2) {
											
												if (errmsg)
													cfn.logError({message: errmsg + cfn.eol() + 
																'  Email: ' + _gpsac[_accnt].email + cfn.eol() +
																'  UID: ' + re.uid});

												emlobj.save({
															   email: _gpsac[_accnt].email,
															   uid: re.uid,
															   emaildate: re.date,
															   emaildata: re.body,
															   gpsdata: re2,

															});
											});
										},
							onEnd: function(err) {
											
											if (err) cfn.logError(err);
											else {
												if (lastuid == -1)
													//cfn.logInfo('No new email.', true);
													console.log('No new email.');
												else
													//cfn.logInfo('Fetch completed. UID ' + firstuid + ' - ' + lastuid, true);
													//console.log('Fetch completed. UID ' + firstuid + ' - ' + lastuid);
													console.log('Done');
											}
											
											if (_running) {
												next();
											}
											else {
												_stopping = false;
												cfn.logInfo('Email to GPS service stopped', true);
												return;
											}
										},
                        });*/
		//});
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

