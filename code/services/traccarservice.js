var emlobj = require(appConfig.lib_path + '/emailobj.js');
var gaco = require(appConfig.lib_path + '/gacobj.js');
var net = require('net');
var moment = require('moment');
var request = require('request');
var WebSocket = require('ws');
var tcip = '';
var tcport = 5005;
var tcsport = 8082;
var tcemail = '';
var tcpassword = '';
var token = ''
//var _interval = 20000;				// **** 20 sec
var _interval = 1000;				// **** 1 sec
var _initstart_interval = 10000;   	// **** 1 min
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
		tcsport = tcinfo.sport;
		tcemail = tcinfo.email;
		tcpassword = tcinfo.password;

		request.post(`http://${tcip}:${tcsport}/api/session`, { form: {
			email: tcemail,
			password: tcpassword
		}}, function (error, response) { 
			if (error) cfn.logInfo('Traccar server session error: ' + error, true);
			else {
				if (!response.headers['set-cookie']) return
				token = response.headers['set-cookie'][0];
				request.get(`http://${tcip}:${tcsport}/api/devices`, { auth: {
					username: tcemail,
					password: tcpassword
				}, headers: { 'Cookie': token } }, function(err, res) {
					if (!err) {

						const Traccar_Devices = JSON.parse(res.body);

						if (tcip && tcport && tcsport) {
							// console.log(cfn.dtNow4Log() + ' ' + 'Posting to traccar - GSM: '+ gsm +' to '+tcip+':'+tcsport + '/api/socket');
				
							var socket = new WebSocket(`ws://${tcip}:${tcsport}/api/socket`, [], {
								'headers': { 'Cookie': token }
							});
				
							socket.on('open', function open() {
								console.log('Succesfully connected to Traccar');
							});
										
							socket.on('message', function(message, flags){

								gaco.getGPSListForGSM(function(data, msg) {
	
									Object.assign([], data).forEach(element => {
										var filtered_device = Traccar_Devices.filter(function(f, in_) {
											return f['uniqueId'] == element['pgid']
										})
										if (filtered_device && Object.assign([], filtered_device).length > 0) {
											var positionId = filtered_device[0]['positionId'];

											if (positionId > 0) {
												request.get(`http://${tcip}:${tcsport}/api/positions?id=${positionId}`, { auth: {
													username: tcemail,
													password: tcpassword
												}, headers: { 'Cookie': token } }, function(err_, res_pos) {

													console.log(cfn.dtNow4Log() + ' ' + 'Position Data for GSM gotten from Traccar server, Posiiton ID: ', positionId);
													const Position_Data = JSON.parse(res_pos.body);

													Position_Data.forEach(position => {
														var email_date = formatDateFromTraccarServer(position['serverTime']);
														var gps_date = formatDateFromTraccarServer(position['deviceTime']);

														var lat = Math.floor(Math.abs(position['latitude']) * 100 * 1000000) / 1000000;
														var lng = Math.floor(Math.abs(position['longitude']) * 100 * 10000000) / 10000000;

														emlobj.save({
															email: element['email'],
															uid: "gsm_" + position['id'],
															emaildate: parseInt(email_date.getTime()),
															gpsdata: {
																date: cfn.addZero(gps_date.getDate(), 2)+cfn.addZero(gps_date.getMonth() + 1, 2)+cfn.addZero(Math.floor(gps_date.getFullYear() % 100), 2),
																time: cfn.addZero(gps_date.getHours(), 2)+cfn.addZero(gps_date.getMinutes(), 2)+cfn.addZero(gps_date.getSeconds(), 2),
																latitude: cfn.addZero(Math.floor(lat), 4) + '.' + cfn.addZero(Math.ceil((lat - Math.floor(lat)) * 10000), 4),
																NS: parseInt(position['latitude']) > 0 ? 'N' : 'S',
																longitude: cfn.addZero(Math.floor(lng), 5) + '.' + cfn.addZero(Math.ceil((lng - Math.floor(lng)) * 10000), 4),
																EW: parseInt(position['longitude']) > 0 ? 'E' : 'W',
																speed: position['speed'],
																heading: position['course'],
																validity: position['valid'] ? 1 : 0,
																power: position['outdated'] ? 1 : 0,
																tamper: position['attributes']['motion'] ? 1 : 0,
															},
															emaildata: {
																type: "GSM",
																data: JSON.stringify(position)
															},
															type: 1
														});
													});
												});
											}
										}
									});
								});
											
								var data = JSON.parse(message);
				
								if (data.devices) {
									// console.log("Device: " + JSON.stringify(data.devices))
								}
								if (data.positions) {
									// console.log("Positions: " + JSON.stringify(data.positions))
								}
								if (data.events) {
									// console.log("Events: " + JSON.stringify(data.events))
								}
								// Work your magic here
								// data.positions contains tracker positions
							});
										
							socket.on('disconnect', function(){
								console.log('disconnected');
							});
									
						}
					}
				})
			}
		});
		
		callback();
	});

}

function formatDateFromTraccarServer(str_date) {
	var timeStamps = str_date.split("T");
	var dateString = timeStamps[0];
	var timeString = timeStamps[1].split(".")[0];
	var dateParts = dateString.split("-");
	var timeParts = timeString.split(":");
	return new Date(+dateParts[0], dateParts[1] - 1, +dateParts[2], +timeParts[0], +timeParts[1], +timeParts[2]);
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
		_stopping = false;
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
		var gsm = cfn.strVal(re.gsm);
		var type = cfn.strVal(re.type);
		var pgid = cfn.strVal(re.pgid);
		var gpsdata = cfn.parseJSON(re.gpsdata);

		if ( type == 1 && gsm && gsm != '') {
			pgid = gsm
		}

		if (!gpsdata.date) {
			emlobj.update4TC(idx);
			next();
		}
		else {
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
					emlobj.update4TC(idx);
				});

				client.on('error', function(err) {
					cfn.logError(err);
					console.log(err);
					// if (callback) callback(err);
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

	try {
		client.connect({host: ip, port: port}, function() {
			connected = true;
			client.write('\r\n');
		});
	
		client.on('error', function(err) {
			errmsg = err.message;
		});
	
		client.on('close', function() {
			client.destroy();
			if (errmsg) {
				callback(errmsg);
			}
			else {
				callback('Connection OK');
			}
		});	
	} catch (error) {
		callback(JSON.stringify(error));
		client.close()
	}
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

