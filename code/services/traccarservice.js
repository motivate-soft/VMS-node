var emlobj = require(appConfig.lib_path + '/emailobj.js');
var gaco = require(appConfig.lib_path + '/gacobj.js');
var net = require('net');
var moment = require('moment');
var request = require('request');
var WebSocket = require('ws');
var async_ = require('async');
const { resolve } = require('path');
var tcip = '';
var tchost = '';
var tchostdisable = false;
var tcport = 5005;
var tcsport = 8082;
var tcemail = '';
var tcpassword = '';
var token = ''
var Position_Data = [];
var Position_ID = []
var Saved_ID = []
var flag = 0;
//var _interval = 20000;				// **** 20 sec
var _interval = 5000;				// **** 1 sec
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
	})
}

function reload(callback) {

	dbo.getMData('traccar', function(re) {
	
		var tcinfo = cfn.parseJSON(re);
		tcip = tcinfo.ip;
		tcport = tcinfo.port;
		tcsport = tcinfo.sport;
		tcemail = tcinfo.email;
		tcpassword = tcinfo.password;
		tchost = tcinfo.host;
		tchostdisable = tcinfo.hostdisable == '1';

		request.post(`http://${tcip}:${tcsport}/api/session`, { form: {
			email: tcemail,
			password: tcpassword
		}}, function (error, response) { 
			if (error) cfn.logInfo('Traccar server session error: ' + error, true);
			else {
				try {
					if (JSON.parse(response.body)['disabled']) {
						cfn.logInfo('Traccar account disabled', true);
						return
					}
					if (!response.headers['set-cookie']) return
					token = response.headers['set-cookie'][0];
					Position_Data = []
					Position_ID = []
					Saved_ID = []

					var socket = new WebSocket(`ws://${tcip}:${tcsport}/api/socket`, [], {
								'headers': { 'Cookie': token }
							});
				
							socket.on('open', function open() {
								// console.log('Succesfully connected to Traccar');
							});
										
							socket.on('message', function(message, flags){
											
								var data_ = JSON.parse(message);
				
								if (data_.devices) {
									// console.log("Device: " + JSON.stringify(data.devices))
								}
								if (data_.positions) {
									next_traccar()
								}
								if (data_.events) {
									// console.log("Events: " + JSON.stringify(data.events))
								}
								// Work your magic here
								// data.positions contains tracker positions
							});
										
							socket.on('disconnect', function(){
								// console.log('disconnected');
							});
				} catch (error_) {
					token = null;
					Position_Data = []
					cfn.logInfo('Incorrect IP or port', true);
				}
			}
		});
		
		callback();
	});

}

function thirdFunction(position, in_, element) {
	return new Promise((resolve, reject) => {
		var email_date = formatDateFromTraccarServer(position['serverTime']);
		var gps_date = formatDateFromTraccarServer(position['deviceTime']);

		var lat_degree = Math.abs(Math.floor(position['latitude'])) * 100;
		var lng_degree = Math.abs(Math.floor(position['longitude'])) * 100;
		var lat_decimal = (Math.abs(position['latitude']) - Math.abs(Math.floor(position['latitude']))) * 60;
		var lng_decimal = (Math.abs(position['longitude']) - Math.abs(Math.floor(position['longitude']))) * 60;
		var lat = lat_degree + lat_decimal;
		var lng = lng_degree + lng_decimal;

		emlobj.save({
			email: element['email'],
			uid: "gsm_" + position['id'],
			emaildate: parseInt(gps_date.getTime()),
			gpsdata: {
				date: cfn.addZero(email_date.getDate(), 2)+cfn.addZero(email_date.getMonth() + 1, 2)+cfn.addZero(Math.floor(email_date.getFullYear() % 100), 2),
				time: cfn.addZero(email_date.getHours(), 2)+cfn.addZero(email_date.getMinutes(), 2)+cfn.addZero(email_date.getSeconds(), 2),
				latitude: cfn.addZero(Math.floor(lat), 4) + '.' + cfn.addZero(Math.ceil((lat - Math.floor(lat)) * 10000), 4),
				NS: parseInt(position['latitude']) > 0 ? 'N' : 'S',
				longitude: cfn.addZero(Math.floor(lng), 5) + '.' + cfn.addZero(Math.ceil((lng - Math.floor(lng)) * 10000), 4),
				EW: parseInt(position['longitude']) > 0 ? 'E' : 'W',
				speed: position['speed'],
				heading: position['course'],
				validity: position['valid'] ? 0 : 1,
				power: position['outdated'] ? 1 : 0,
				tamper: position['attributes']['motion'] ? 0 : 1,
			},
			emaildata: {
				type: "GSM",
				data: JSON.stringify(position)
			},
			type: 1,
			gpssent: 1
		}, function(re_) {
			if (re_) {
				Saved_ID.push(position['id'])
				console.log("ID: ", position['id'], " Time: ", position['deviceTime'])
				console.log(cfn.dtNow4Log() + ' ' + 'Position Data for GSM gotten from Traccar server, Posiiton ID: ', position['id']);
			}
			resolve('Saved')
		});
	})
}

function formatDateFromTraccarServer(str_date) {
	var timeStamps = str_date.split("T");
	var dateString = timeStamps[0];
	var timeString = timeStamps[1].split(".")[0];
	var dateParts = dateString.split("-");
	var timeParts = timeString.split(":");
	return new Date(+dateParts[0], dateParts[1] - 1, +dateParts[2], +timeParts[0] + 8, +timeParts[1], +timeParts[2]);
}

function start() {

	cfn.logInfo('Starting Traccar service -- OK', true);
	_running = true;
	_stopping = false;

	if (_firsttime) {
		_firsttime = false;
		_sleeping = true;
		setTimeout(run, _initstart_interval);
		if (token && token != '') {
			setTimeout(run_traccar, _initstart_interval);
		} else {
			reload(function() {
				setTimeout(run_traccar, _initstart_interval);
			})
		}
	}
	else {
		run();
		run_traccar()
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

function next_traccar() {

	if (_stopping) {
		_stopping = false;
		_sleeping = false;
		_running = false;
		return;
	}
	else if (_running) {
		_sleeping = true;
		setTimeout(run_traccar, 10000);
	}
										
}

function run_traccar() {
	if (!_running) return;
	_sleeping = false;

	if (token && Position_Data.length == 0) { //  && Position_Data.length == 0
		request.get(`http://${tcip}:${tcsport}/api/devices`, { auth: {
					username: tcemail,
					password: tcpassword
		}, headers: { 'Cookie': token } }, function(err, res) {
			if (!err) {
				try {
					const Traccar_Devices = JSON.parse(res.body);

					if (tcip && tcport && tcsport) {

						gaco.getGPSListForGSM( function(data, msg) {

							request.get(`http://${tcip}:${tcsport}/api/positions`, { auth: {
								username: tcemail,
								password: tcpassword
							}, headers: { 'Cookie': token } }, async function(err_, res_pos) {

								Position_Data = JSON.parse(res_pos.body);

								Object.assign([], data).forEach(async (element, in_d) => {
									var filtered_device = Traccar_Devices.filter(function(f, in_) {
										return f['uniqueId'] == element['pgid']
									})
									if (filtered_device && Object.assign([], filtered_device).length > 0) {
										var deviceID = filtered_device[0]['id'];
										var device_email = element['email'];
										
										async_.forEachOf(Position_Data, async (position, in_, inner_callback) => {

											if (device_email.search(/ftp@/g) < 0 && position['deviceId'] === deviceID && filtered_device[0]['status'] == 'online' && Position_ID.indexOf(position['id']) < 0 && Saved_ID.indexOf(position['id']) < 0) {
												Position_ID.push(position['id'])
												await thirdFunction(position, in_, element)
											}
										
										}, err => {
											if (err) console.log(err.message)
										})
							
									}
									if (in_d == Object.assign([], data).length - 1)
									{
										// Position_ID = []
										Position_Data = []
									}
								});
								
							});
							
						});
								
					}
				} catch (error) {
					cfn.logInfo('Incorrect account or address for traccar', true);					
				}
			}
		})
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
		var uid = cfn.strVal(re.uid);

		if ( uid.search(/gsm_@/g) > 0) {
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
			if (tcip && tcport && pgid && gpsdata.date && gpsdata.time && gpsdata.latitude && gpsdata.longitude ) { // && uid.search(/gsm_@/g) < 0
				
				var client = new net.Socket();
		
				//tcip = 'www.traccar.org';
				var hostforsocket = tchost
				if (tchostdisable) {
					hostforsocket = tcip
				}
				console.log(cfn.dtNow4Log() + ' ' + 'Posting to traccar - PGID: '+pgid+' to '+hostforsocket+':'+tcport);
				client.connect({host: hostforsocket, port: tcport}, function() {
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
					// console.log('Connection closed');
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

