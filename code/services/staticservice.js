var staticdao = require(appConfig.lib_path + '/db/dao/staticdao.js');
var request = require('request');

var tcip = '';
var tcport = 5005;
var tcsport = 8082;
var tcemail = '';
var tcpassword = '';
var token = ''
var _interval = 120000 * 60;   			// **** 2 hours, (1000 * 60 * 60) * 2
var _initstart_interval = 3000;   	// **** 3 sec
var _running = false;
var _sleeping = false;
var _stopping = false;
var _firsttime = true;
var Traccar_Devices = [];

module.exports = {
	init: init,
    start: start,
    getStatus: getStatus
}

function init(callback) {

	dbo.getMData('traccar', function(re) {
	
		var tcinfo = cfn.parseJSON(re);
		tcip = tcinfo.ip;
		tcport = tcinfo.port;
		tcsport = tcinfo.sport;
		tcemail = tcinfo.email;
		tcpassword = tcinfo.password;

		request.post(`http://${tcip}:${tcsport}/api/session`, { form: {
			email: tcemail,
			password: tcpassword
		}}, function (error, response) { 
			if (error) cfn.logInfo('Traccar server session error: ' + error, true);
			else {
				if (JSON.parse(response.body)['disabled']) {
					cfn.logInfo('Traccar account disabled', true);
					return
				}
				if (!response.headers['set-cookie']) return
                token = response.headers['set-cookie'][0];
                
                start()
            }
        })
    })
}

function start() {
    cfn.logInfo('Calculating the active status device -- OK', true);
    _running = true;
    _stopping = false;
    
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
		cfn.logInfo('Calculating active device', true);
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
		cfn.logInfo('Calculating active devices stopped', true);
		return;
	}
	else if (_running) {
		_sleeping = true;
		setTimeout(run, _interval);
	}
}

function run() {
    if (token && tcemail && tcpassword && token != '') {
        request.get(`http://${tcip}:${tcsport}/api/devices`, { auth: {
            username: tcemail,
            password: tcpassword
        }, headers: { 'Cookie': token } }, function(err, res) {
            if (!err) {

                Traccar_Devices = JSON.parse(res.body);

                Object.assign([], Traccar_Devices).forEach(device => {
                    staticdao.saveStatic({
                        name: device['name'],
                        uniqueId: device['uniqueId'],
                        status: device['status'] == 'online' ? 1 : 0
                    }, function(re) {})
                });
            }
        });
    }
}

function getStatus(callback) {
    if (Traccar_Devices.length > 0) {
        let data = [];
        Object.assign([], Traccar_Devices).forEach((device, id_) => {
            staticdao.getStatic({
                name: device['name'],
                uniqueId: device['uniqueId'],
            }, 360, function(re) {
                const monthly_report = re

                staticdao.getStatic({
                    name: device['name'],
                    uniqueId: device['uniqueId'],
                }, 12, function(re_) {
                    const dayly_report = re_

                    data.push({
                        id: device['id'],
                        name: device['name'],
                        uniqueId: device['uniqueId'],
                        oneDay: monthly_report,
                        oneMonth: dayly_report
                    })  
                    if (id_ === Traccar_Devices.length - 1)
                        callback(data)
                })
            })
        });
    }
}