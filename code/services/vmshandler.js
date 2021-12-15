var express = require('express');
var vms_rt = express.Router();
module.exports = vms_rt;

var emlobj = require(appConfig.lib_path + '/emailobj.js');
var parse = require('xml-parser');
var md5 = require('md5');
var crc = require('crc');
var moment = require('moment');
var http = require('http');
var fs = require("fs");


vms_rt.post('/', function(req, res) {

	var postData = '';
		
	req.on('data', function(chunk) { 
		postData += chunk;
	});

	req.on('end', function() {
	
		//fs.appendFile('request.txt', '---' + cfn.eol() + postData + cfn.eol() +cfn.eol(), function (err) {});
        cfn.logInfo4vms(postData + cfn.eol(), false);
		//console.log(postData);
		
		processxml(postData, res);
	});
	
});

function processxml(msg, res) {

	if (!msg) {
		res.send('The msg post variable is missing');
		return;
	}
    
	var obj = parse(msg);

	if (!obj.root) {
		res.send('Unidentified Obj=' + obj.root);
		return;
	}

    var cmd = obj.root.attributes.obj;
    var verify = obj.root.attributes.verify;
    var param = {}
    
    for (i in obj.root.children) {
        
        var tmp = obj.root.children[i];
        param[tmp.name] = tmp.content;
    }

	
	// if (verifyxml(msg, verify, param))
		vmsParse(cmd, param, res);
	// else {
	// 	res.send('Authentication failed')
	// }

}

function verifyxml(msg, verify, param) {

	var re = true;

	var s = msg.substring(msg.indexOf('<applid>'));
	var pwd = 'p4s5vv123'; // fgc82f2j11p

	// p4s5vv123

	var _crc = crc.crc16ccitt(s).toString(16);
	var _verify = md5(param.datetime + pwd + param.serial + _crc)
	
	return (_verify == verify);
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

function vmsParse(cmd, param, res) {

	var dt = moment.utc().format('DDMMYYHHmmss');
	var pwd = 'p4s5vv123';
	//var pwd = '88';
	var did = cfn.intVal(param.did);
	//did = (did == 999999999999) ? 0: (did + 1);
	var limit = cfn.intVal(param.limit);

    if (cmd == 'test') {
		// ************************************************** temp stop dof ******************************
		var msg = '<applid>Orb_gate</applid>' +
					'<datetime>' + dt + '</datetime>' +
					'<serial>' + param.serial + '</serial>' +
					'<xcode>101</xcode>' +
					'</vessel>';
					
		var _crc = crc.crc16ccitt(msg).toString(16);
		_crc = cfn.addZero(_crc, 4);
		var verify = md5(dt + pwd + param.serial + _crc)
		
		//vmsResponse('<vessel obj="data" verify="' + verify + '">' + msg);
		res.header('Content-Type','text/xml').send('<vessel obj="data" verify="' + verify + '">' + msg)
    
	}
	// Event 100, 101
	else if (cmd == 'request') {
        //console.log('Request from DOF: limit=' + limit);
        console.log(cfn.dtNow4Log() + ' ' + 'Request: limit=' + limit);
		emlobj.getLogVMS(limit, function(re) {
		//emlobj.getLogVMS(1, function(re) {
			
			//fs.appendFile('rows.txt', dbu.qJson(re), function (err) {});
			
			if (cfn.length(re) > 0) {

				var data = '';
				//var idxs = [];
                var fstidx = -1;
                var lstidx = -1;
				
				for (i in re) {
                
					var idx = re[i].idx;
					var email = cfn.strVal(re[i].email);
					var gpsdata = cfn.parseJSON(re[i].gpsdata);
                    
					//idxs.push(re[i].idx);
                    if (fstidx == -1) fstidx = idx;
                    else { if (idx < fstidx) fstidx = idx; }
                    
                    if (lstidx == -1) lstidx = idx;
                    else { if (idx > lstidx) lstidx = idx; }
                
                    
                    if (!gpsdata.date) {
                        //emlobj.updateVMS([idx]);
                        //emlobj.updateVMS(idx, idx);
                        continue;
                    }
                    else {
                        var dtutc = datetimetoUTC(gpsdata.date + gpsdata.time);
						if (dtutc.date == 'Invalid date') {
							continue;
						}
						else {
							did = (did == 999999999999) ? 0: (did + 1);
							
							var msg = '<applid>Orb_gate</applid>' +
									'<datetime>' + dt + '</datetime>' +
									'<xcode>100</xcode>' +
									'<did>' + cfn.addZero(did, 12) + '</did>' +
									'<serial>' + param.serial + '</serial>' +
									'<event>100</event>' +
									'<channel>ORBC</channel>' +
									//'<id>' + email.substring(0,email.indexOf('@')) + '</id>' +
									'<id>' + re[i].name + '</id>' +
									'<unit>' + re[i].pgid + '</unit>' +
									'<gpsfix>Y</gpsfix>' +
									'<lat>' + gpsdata.latitude + '</lat>' +
									'<lon>' + gpsdata.longitude + '</lon>' +
									'<utcdate>' + dtutc.date + '</utcdate>' +
									'<utctime>' + dtutc.time + '.000</utctime>' +
									'<speed>' + gpsdata.speed + '</speed>' +
									'<heading>' + gpsdata.heading + '</heading>' +
									'</vessel>';

							var _crc = crc.crc16ccitt(msg).toString(16);
							_crc = cfn.addZero(_crc, 4);
							var verify = md5(dt + pwd + param.serial + _crc);

							//console.log('crc=' + _crc);
							//console.log('datetime=' + dt);
							//console.log('serial=' + param.serial);
							//console.log('verify=' + verify);
							//console.log(msg);
							//res.send('<vessel obj="data" verify="' + verify + '">' + msg);
							data += '<vessel obj="data" verify="' + verify + '">' + msg;
							//emlobj.updateVMS([idx]);
							
							//if (i == 5) break;
						}
                    }
				}
				//fs.appendFile('request.txt', data + cfn.eol(), function (err) {});
                
                console.log(cfn.dtNow4Log() + ' ' + 'Data sent. Index=' + fstidx + '-' + lstidx);
                
                emlobj.updateVMS(fstidx, lstidx, function(err) {
                //emlobj.updateVMS(idxs, function(err) {
					res.header('Content-Type','text/xml').send(data);
					cfn.logInfo4vms(data.replace(/<\/vessel>/g, '</vessel>\n\r') + cfn.eol(), false);
				});
			}
			else {

				var msg = '<applid>Orb_gate</applid>' +
							'<datetime>' + dt + '</datetime>' +
							'<serial>' + param.serial + '</serial>' +
							'<xcode>101</xcode>' +
							'</vessel>';
							
				var _crc = crc.crc16ccitt(msg).toString(16);
				_crc = cfn.addZero(_crc, 4);
				var verify = md5(dt + pwd + param.serial + _crc)
				
				//vmsResponse('<vessel obj="data" verify="' + verify + '">' + msg);
				res.header('Content-Type','text/xml').send('<vessel obj="data" verify="' + verify + '">' + msg)
			}
		});
	}
	else if (cmd == 'cmd' || cmd == 'cmdstatus' || cmd == 'cmdcancel') {
		console.log(cfn.dtNow4Log() + ' ' + 'Request: cmd=' + cmd);
	} else {
		var msg = '<applid>Orb_gate</applid>' +
							'<datetime>' + dt + '</datetime>' +
							'<serial>' + param.serial + '</serial>' +
							'<xcode>201</xcode>' +
							'</vessel>';
							
		var _crc = crc.crc16ccitt(msg).toString(16);
		_crc = cfn.addZero(_crc, 4);
		var verify = md5(dt + pwd + param.serial + _crc)
		
		//vmsResponse('<vessel obj="data" verify="' + verify + '">' + msg);
		res.header('Content-Type','text/xml').send('<vessel obj="status" verify="' + verify + '">' + msg)
	}
}

function vmsResponse(msg) {

	var options = {
		host: '', // <<<------------------------------------------ need url ##########@########@#@#@#@#@##
		port: 80,
		path: '',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(msg)
		}
	};

	var httpreq = http.request(options, function (response) {
		response.setEncoding('utf8');
		response.on('data', function (chunk) {
			//console.log("body: " + chunk);
		});
		response.on('end', function() {
			//
		})
	});

	req.on('error', (e) => {
		console.log(`problem with request: ${e.message}`);
	});
	
	httpreq.write(msg);
	httpreq.end();
}
