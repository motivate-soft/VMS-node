var moment = require('moment');
var fs = require('fs');
var FTPClient = require('ftp');
var c = new FTPClient();

var ftpip = '';
var ftpport = 0;
var ftpusername = '';
var ftppassword = '';
//var _interval = 20000;				// **** 20 sec
var _interval = 1000;				// **** 1 sec
var _initstart_interval = 60000;   	// **** 1 min
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
    ftp_connect: ftp_connect
}

function getStatus() {

	if (_stopping) return 2;
	else if (_running) return 1;
	else return 0;
}

function init(callback) {

	reload(function() {
	
		start();
		callback();
    });
}

function ftp_connect(ip, username, password, port, callback) {
    var connected = false;
    var errmsg = '';
    
    c.connect({
        host: ip,
        user: username,
        password: password,
        port: port
      });
    
    c.on('ready', function() {
        connected = true;
        // c.get('/Alfa/file4457.csv', function(err, stream) {
        //      var content = '';
        //      stream.on('data', function(chunk) {
        //          content += chunk.toString();
        //      });
        //      stream.on('end', function() {
        //          // content variable now contains all file content. 
        //      });
        // })
        callback('connected');
    });
    
	c.on('error', function(err) {
        errmsg = err.message;

        console.log(errmsg)
	});

	c.on('close', function() {
		
		if (errmsg)
			callback(errmsg);
		else
			callback('Connection OK');
	});	
}

function reload(callback) {

	dbo.getMData('ftp', function(re) {
	
		var ftpinfo = cfn.parseJSON(re);
		ftpip = ftpinfo.ip;
        ftpport = ftpinfo.port;
        ftpusername = ftpinfo.username;
        ftppassword = ftpinfo.password;

		callback();
    });
}

function start() {

	cfn.logInfo('Connection FTP -- OK', true);
    _running = true;
    _stopping = false;
	
    if (_firsttime) {
        _firsttime = false;
        _sleeping = true;
        setTimeout(run, _initstart_interval);
    }
}

function stop() {

    _running = false;

	if (_sleeping) {
		cfn.logInfo('FTP disconnected', true);
	}
	else {	
		_stopping = true;
	}
}

function next() {

	if (_stopping) {
		_stopping = false;
		_sleeping = false;
		_running = false;
		cfn.logInfo('FTP disconnected', true);
		return;
	}
	else if (_running) {
		_sleeping = true;
		setTimeout(run, _interval);
	}
										
}

function run() {

	if (!_running) return;
	_sleeping = false;
	
	
}

function datetimetoUTC(dt) {

	var re = {};
	
	if (!dt || typeof dt != 'string') return re;
	
	var day = dt.substr(0,2);
	var mth = dt.substr(2,2);
	var yr = dt.substr(4,2);
	var hr = dt.substr(6,2);
	var mn = dt.substr(8,2);
	var sc = dt.substr(10,2);
	
	var mmt = moment('20' + yr + '-' + mth + '-' + day + ' ' + hr + ':' + mn + ':' + sc);
	var mmtutc = mmt.utc();
	
	re['date'] = mmtutc.format('DDMMYY');
	re['time'] = mmtutc.format('HHmmss');
	
	return re;
}

