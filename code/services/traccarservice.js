var emlobj = require(appConfig.lib_path + '/emailobj.js');
var net = require('net');
var moment = require('moment');

var tcip = '';
var tcport = 0;
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
	test: test,
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

function reload(callback) {

	dbo.getMData('traccar', function(re) {
	
		var tcinfo = cfn.parseJSON(re);
		tcip = tcinfo.ip;
		tcport = tcinfo.port;

		callback();
    });
}

function start() {

	cfn.logInfo('Starting Traccar service -- OK', true);
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
		cfn.logInfo('Traccar service stopped', true);
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
		cfn.logInfo('Traccar service stopped', true);
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
	
	emlobj.getLog4TC(function(re) {
	
		var idx = re.idx;
		var email = cfn.strVal(re.email);
		var pgid = cfn.strVal(re.pgid);
		var gpsdata = cfn.parseJSON(re.gpsdata);
	
		if (!gpsdata.date) {
			emlobj.update4TC(idx);
			next();
		}
		else {
				
			console.log(tcip + ':'+ tcport);
			console.log(re);
			//next();

			var dtutc = datetimetoUTC(gpsdata.date + gpsdata.time);
			
			//if (email == 'dof_0019@orbcomm.my' && tcip && tcport && pgid && gpsdata.date && gpsdata.time && gpsdata.latitude && gpsdata.longitude) {
			if (tcip && tcport && pgid && gpsdata.date && gpsdata.time && gpsdata.latitude && gpsdata.longitude) {

				console.log(cfn.dtNow4Log() + ' ' + 'Posting to traccar - PGID: '+pgid+' to '+tcip+':'+tcport);
				
				var client = new net.Socket();
		
				//tcip = 'www.traccar.org';
				client.connect({host: tcip, port: tcport}, function() {
				//	client.write('$PGID,' + pgid + '*0F\r\n');
					client.write('$PGID,' + pgid + '*0F\r\n' +
			                     '$GPRMC,' + dtutc.time + 
                                    ',A,' +
                                    gpsdata.latitude + ',' + 
                                    gpsdata.NS + ',' +
                                    gpsdata.longitude + ','+ 
                                    gpsdata.EW + ',' +
                                    gpsdata.speed + ',' +
                                    gpsdata.heading + ',' + 
                                    dtutc.date + ',' +
                                    '000.0,E ' + '*68\r\n');
					client.write('\r\n');
				});

				client.on('error', function(err) {
					cfn.logError(err);
					console.log(err);
					if (callback) callback(err);
				});
				
				client.on('data', function(data) {
					console.log('Received: ' + data);
					client.end();
				});

				client.on('close', function() {
					console.log('Connection closed');
					console.log('  -- OK');
					client.destroy();
					emlobj.update4TC(idx);
					next();
				});	
				
			}
            else {
                if (!pgid) 
                    cfn.logInfo('Traccar Service: PGID not found for ' + re.email, true);
                if (!gpsdata.date) 
                    cfn.logInfo('Traccar Service: Invalid GPS data - date is null for: ' + re.email + '[Index:' + idx + ']', true);
                if (!gpsdata.time) 
                    cfn.logInfo('Traccar Service: Invalid GPS data - time is null for: ' + re.email + '[Index:' + idx + ']', true);
                if (!gpsdata.latitude) 
                    cfn.logInfo('Traccar Service: Invalid GPS data - latitude is null for: ' + re.email + '[Index:' + idx + ']', true);
                if (!gpsdata.longitude) 
                    cfn.logInfo('Traccar Service: Invalid GPS data - longitude is null for: ' + re.email + '[Index:' + idx + ']', true);
                emlobj.update4TC(idx);
                next();
            }
		}
	});
}

function test(ip, port, callback) {

	var client = new net.Socket();
	var connected = false;
	var errmsg = '';

	client.connect({host: ip, port: port}, function() {
		connected = true;
		client.write('\r\n');
	});

	client.on('error', function(err) {
		errmsg = err.message;
	});

	client.on('close', function() {
		client.destroy();
		if (errmsg)
			callback(errmsg);
		else
			callback('Connection OK');
	});	
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

