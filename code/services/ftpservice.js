var moment = require('moment');
var fs = require('fs');
var FTPClient = require('ftp');
var c = new FTPClient();
var path = require('path')
var parse = require('xml-parser');
const ftp = require("basic-ftp");
const { FileInfo } = require('basic-ftp');
const MessageService = require('../models/message.service');

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

let Stand_Message_Decoding = {
    type: 'Standard message type',
    level: 0,
    goodBattery: 'ok', // 0 - not ok, 1 - ok
    gpsDataValid: false, // 0 - false, 1 - true
    gpsFailCounter: 0,
    latitude: 0,
    latHemisphere: 'NORTHERN', // 'SOUTHERN'
    longitude: 0,
    lngHemisphere: 'EASTERN', // 'WESTERN'
    input1ChangeTriggerdMessage: 'received', // 0 - not received, 1 - received
    input1State: 'closed', // 0 === closed, 1 - open
    input2ChangeTriggerMessage: 0, // 0 - not received, 1- received
    input2State: 'open', // 0 === closed, 1 - open
    subtype: '', // for location message, 0 - non, 1 - Device Turned On, 2-Change of Location alert, 3-Input Status Changed, 4-Undesired input State, 5-Re-counter
    reserverdInSMARTOne: false, // 0-false, 1-true
    vibrationTrigged: 1,
    vibrationState: false, // 0 - false, 1 - true
    gpsFrom3DFix: false, // 0 - false, 1 - true
    isRestWhenTransmitted: false, // 0 - false, 1 - true
    highConfidenceGPS: false // 0 - false, 1 - true
}

let Nonstandard_Message_Decoding = {
    type: 'Diagnostic Message', // 21-Diagnostic, 22-Replace Battery, 23-Contact Service Provider
    level: 0,
    numOfTransmissions: 0,
    goodBattery: false, // 0-false, 1-true
    gpsSystemOk: false, // 0-false, 1-true
    transmitterOk: false, // 0-false, 1-true
    schedulerSubsystemOk: false, // 0-false, 1-true
    minIntervalBetweenTransmission: 0, // seconds
    maxIntervalBetweenTransmission: 0, // seconds
    unsgdBinaryCountInMeanGPS: 0, // Unsigned binary count in seconds for mean GPS search to acquire
    unsgdBinaryCountInFailedGPS: 0, // Unsigned binary count of failed GPS atempts since last Diagnostic Message
    noOfTransmissions: 0 // # of transmissions since last Diagnostic message
}

let Accumulated_Message_Decoding = {
    type: 'Accumulate/Count Message', // 24
    level: 0,
    accumTimeForInput1: 0, // -1 == Turned off, unit - minute
    accumTimeForInput2: 0, // -1 == Turned off, unit - minute
    accumTimeForVibOfSMARTONE: 0, // -1 == Turned off, unit - minute
    numOfOpenOrCloseOfInput1: 0, // -1 == Turned off
    numOfOpenOrCloseOfInput2: 0, // -1 == Turned off
}

module.exports = {
	getStatus: getStatus,
	init: init,
	reload: reload,
	start: start,
    stop: stop,
    ftp_connect: ftp_connect,
    read_xml: read_xml
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
let xmlFilePaths = [];
async function ftp_connect(ip, username, password, port, callback) {
    xmlFilePaths = [];
    await socket_ftp(ip, username, password, port, "", callback);
}

async function socket_ftp(ip, username, password, port, directory, callback = '') {
    const client = new ftp.Client()
    client.ftp.verbose = false;
    try {
        await client.access({
            host: ip,
            user: username,
            password: password,
            port: port,
            secure: false
        });
        const ftpList = await client.list(directory);

        for (let index = 0; index < ftpList.length; index++) {
            const fileInfo = new FileInfo(ftpList[index]);
            const file_name = fileInfo.name.name;
            if (ftpList[index].type == 1 && getFileExtension(file_name) === 'xml') {
                xmlFilePaths.push(directory + '/' + file_name);
                client.close();
            } else if (ftpList[index].type == 2) {
                if (file_name == 'read') {
                    continue;
                }
                client.close()
                await socket_ftp(ip, username, password, port, directory + '/' + file_name)
            }
        }
    }
    catch(err) {
        if (callback !== '')
        {
            client.close()
            callback({status: false, message: 'Failed, error: ' + err, data: xmlFilePaths})
        }
    }
    if (callback !== '') {
        client.close()
        try {
            callback({status: true, message: 'Connected successfully.', data: xmlFilePaths})
        } catch (error) {
            
        }
    }
}

async function read_xml(ip, username, password, port, filePath, callback ) {
    if (filePath) {
        c.connect({
            host: ip,
            user: username,
            password: password,
            port: port
         });

         c.on('error',console.dir)

         c.on('ready', () => {
            try {
                c.get(filePath, function (err, stream) { //get file from ftp
                    if (err) {
                        try {
                            callback({status: false, message: 'Failed', data: err})
                        } catch (error) {
                            return {status: false, message: 'Failed', data: err}
                        }
                        return
                    }
                    var content = '';
                    stream.on('data', function(chunk) {
                        content += chunk.toString();
                    });
                    stream.once('close', function() {
                        var obj = parse(content);
                        moda.parseResultXML(obj, function(re) {
                            cfn.logInfo('Reading xml file: ' + filePath, true);
                            var byteArray = hexStringToByte(re.payloadValue);
                            console.info("Encoded value: ", re.payloadValue)
                            if (byteArray.length > 0) {
                                var firstBinary = dec2bin(byteArray[0], 8);
                                console.log("Byte 0: ", firstBinary)
                                /*
                                * STANDARD MESSAGE TYPE
                                */
                                if (parseInt(firstBinary.slice(6), 2) === 0) {
                                    Stand_Message_Decoding.type = 'Standard Message';
                                    Stand_Message_Decoding.level = parseInt(firstBinary.slice(6), 2); // 1:0
                                    Stand_Message_Decoding.goodBattery = parseInt(firstBinary.slice(5, 6), 2) == 0 ? 'not ok' : 'ok'; // 2
                                    Stand_Message_Decoding.gpsDataValid =  parseInt(firstBinary.slice(4, 5), 2) != 0; // 3
                                    Stand_Message_Decoding.gpsFailCounter = parseInt(firstBinary.slice(0, 2), 2) // 7:6
        
                                    var lat = Math.floor((byteArray[1] * 65536 + byteArray[2] * 256 + byteArray[3]) * 90 / 8388608 * 1000000) / 1000000;
                                    // 2 ^ 16 = 65536, 2 ^ 8 = 256, 2 ^ 23 = 8388608
                                    if (lat > 90) {
                                        lat -= 180;
                                    }
                                    Stand_Message_Decoding.latitude = lat;
                                    Stand_Message_Decoding.latHemisphere = lat > 0 ? 'NORTHERN' : 'SOUTHERN';
        
                                    var lng = Math.floor((byteArray[4] * 65536 + byteArray[5] * 256 + byteArray[6]) * 180 / 8388608 * 1000000) / 1000000;
                                    if (lng > 180) {
                                        lng -= 360
                                    }
                                    Stand_Message_Decoding.longitude = lng;
                                    Stand_Message_Decoding.lngHemisphere = lng > 0 ? 'EASTERN' : 'WESTERN';
        
                                    var seventhBinary = dec2bin(byteArray[7], 8);
                                    console.log("Byte 7: ", seventhBinary)
                                    Stand_Message_Decoding.input1ChangeTriggerdMessage = parseInt(seventhBinary.slice(7), 2) == 0 ? 'not received' : 'received';
                                    Stand_Message_Decoding.input1State = parseInt(seventhBinary.slice(6, 7), 2) == 0 ? 'closed' : 'open';
                                    Stand_Message_Decoding.input2ChangeTriggerMessage = parseInt(seventhBinary.slice(5, 6), 2) == 0 ? 'not received' : 'received';
                                    Stand_Message_Decoding.input2State = parseInt(seventhBinary.slice(4, 5), 2) == 0 ? 'closed' : 'open';
                                    var subtype = 'Location'
                                    switch (parseInt(seventhBinary.slice(0, 4), 2)) {
                                        case 1:
                                            subtype = 'Device Turned On'
                                            break;
                                        case 2:
                                            subtype = 'Change of Location alert'
                                            break;
                                        case 3:
                                            subtype = 'Input Status Changed'
                                            break;
                                        case 4:
                                            subtype = 'Undesired input State'
                                            break;
                                        case 5:
                                            subtype = 'Re-counter'
                                            break;
                                        default:
                                            break;
                                    }
                                    Stand_Message_Decoding.subtype = subtype;
        
                                    var eighthBinary = dec2bin(byteArray[8], 8);
                                    console.log("Byte 8: ", eighthBinary);
                                    Stand_Message_Decoding.reserverdInSMARTOne = parseInt(eighthBinary.slice(5), 2) != 0;
                                    Stand_Message_Decoding.vibrationTrigged = parseInt(eighthBinary.slice(4, 5), 2);
                                    Stand_Message_Decoding.vibrationState = parseInt(eighthBinary.slice(3, 4), 2) != 0;
                                    Stand_Message_Decoding.gpsFrom3DFix = parseInt(eighthBinary.slice(2, 3), 2) != 0;
                                    Stand_Message_Decoding.isRestWhenTransmitted = parseInt(eighthBinary.slice(1, 2), 2) != 0;
                                    Stand_Message_Decoding.highConfidenceGPS = parseInt(eighthBinary.slice(0, 1), 2) != 0;
        
                                    console.dir(Stand_Message_Decoding);

                                    c.mkdir('read/'+re.esn, ()=> {
                                        c.put(content, 'read/'+re.esn + '/' + path.basename(filePath), () => {
                                            MessageService.create({
                                                messageId: re.messageId,
                                                esn: re.esn,
                                                timeStamp: re.timeStamp,
                                                unixTime: re.unixTime,
                                                encodeValue: re.payloadValue,
                                                decodeValue: JSON.stringify(Stand_Message_Decoding),
                                                level: Stand_Message_Decoding.level,
                                                type: subtype
                                            }).then(() => {
                                                try {
                                                    callback({status: true, message: subtype, data: "Successfully pushed decode value to Database server."})
                                                } catch (error) {
                                                    return {status: true, message: subtype, data: "Successfully pushed decode value to Database server."}
                                                }
                                            }).catch((err) => {
                                                try {
                                                    callback({status: true, message: subtype, data: err})
                                                } catch (error) {
                                                    return {status: true, message: subtype, data: err}
                                                }
                                            })
                                        })
                                    })
                                }
                                else if (parseInt(firstBinary.slice(6), 2) === 3 && parseInt(firstBinary.slice(0, 6), 2) != 24) {
                                    Nonstandard_Message_Decoding.level = 3;
                                    var message_type = ''
                                    switch (parseInt(firstBinary.slice(0, 6), 2)) {
                                        case 21:
                                            message_type = 'Diagnostic'
                                            break;
                                        case 22:
                                            message_type = 'Replace Battery';
                                            break;
                                        case 23:
                                            message_type = 'Contact Service Provider';
                                            break;
                                        default:
                                            break;
                                    }
                                    Nonstandard_Message_Decoding.type = message_type;
                                    
                                    var binaryvalue = dec2bin(byteArray[1], 8);
                                    Nonstandard_Message_Decoding.numOfTransmissions = parseInt(binaryvalue.slice(4), 2);
                                    Nonstandard_Message_Decoding.goodBattery = parseInt(binaryvalue.slice(3, 4), 2) != 0;
                                    Nonstandard_Message_Decoding.gpsSystemOk = parseInt(binaryvalue.slice(2, 3), 2) != 0;
                                    Nonstandard_Message_Decoding.transmitterOk = parseInt(binaryvalue.slice(1, 2), 2) != 0;
                                    Nonstandard_Message_Decoding.schedulerSubsystemOk = parseInt(binaryvalue.slice(0, 1), 2) != 0;
        
                                    Nonstandard_Message_Decoding.minIntervalBetweenTransmission = byteArray[2] * 5;
                                    Nonstandard_Message_Decoding.maxIntervalBetweenTransmission = byteArray[3] * 5;
                                    Nonstandard_Message_Decoding.unsgdBinaryCountInMeanGPS = byteArray[4];
                                    Nonstandard_Message_Decoding.unsgdBinaryCountInFailedGPS = byteArray[5] * 256 + byteArray[6];
                                    Nonstandard_Message_Decoding.noOfTransmissions = byteArray[7] * 256 + byteArray[8];
                                    
                                    c.mkdir('read/'+re.esn, ()=> {
                                        c.put(content, 'read/'+re.esn + '/' + path.basename(filePath), () => {
                                            MessageService.create({
                                                messageId: re.messageId,
                                                esn: re.esn,
                                                timeStamp: re.timeStamp,
                                                unixTime: re.unixTime,
                                                encodeValue: re.payloadValue,
                                                decodeValue: JSON.stringify(Nonstandard_Message_Decoding),
                                                level: Nonstandard_Message_Decoding.level,
                                                type: message_type
                                            }).then(() => {
                                                try {
                                                    callback({status: true, message: message_type, data: "Successfully pushed decode value to Database server."})
                                                } catch (error) {
                                                    return {status: true, message: message_type, data: "Successfully pushed decode value to Database server."}
                                                }
                                            }).catch((err) => {
                                                try {
                                                    callback({status: true, message: message_type, data: err})
                                                } catch (error) {
                                                    return {status: true, message: message_type, data: err}
                                                }
                                            })
                                        });
                                    });
                                    
                                }
                                else if (parseInt(firstBinary.slice(6), 2) === 3 && parseInt(firstBinary.slice(0, 6), 2) == 24) {
                                    Accumulated_Message_Decoding.level = 3;
                                    
                                    Accumulated_Message_Decoding.accumTimeForInput1 = (byteArray[1] * 256 + byteArray[2]) == 65535 ? -1 : (byteArray[1] * 256 + byteArray[2]);
                                    Accumulated_Message_Decoding.accumTimeForInput2 = (byteArray[3] * 256 + byteArray[4]) == 65535 ? -1 : (byteArray[1] * 256 + byteArray[2]);
                                    Accumulated_Message_Decoding.accumTimeForVibOfSMARTONE = (byteArray[5] * 256 + byteArray[6]) == 65535 ? -1 : (byteArray[1] * 256 + byteArray[2]);
                                    Accumulated_Message_Decoding.numOfOpenOrCloseOfInput1 = byteArray[7] == 255 ? -1 : byteArray[7];
                                    Accumulated_Message_Decoding.numOfOpenOrCloseOfInput2 = byteArray[8] == 255 ? -1 : byteArray[7];
                                    
                                    c.mkdir('read/'+re.esn, ()=> {
                                        c.put(content, 'read/'+re.esn + '/' + path.basename(filePath), () => {
                                            MessageService.create({
                                                messageId: re.messageId,
                                                esn: re.esn,
                                                timeStamp: re.timeStamp,
                                                unixTime: re.unixTime,
                                                encodeValue: re.payloadValue,
                                                decodeValue: JSON.stringify(Accumulated_Message_Decoding),
                                                level: Accumulated_Message_Decoding.level,
                                                type: 'Accumulate/Count Message'
                                            }).then(() => {
                                                try {
                                                    callback({status: true, message: 'Accumulate/Count Message', data: "Successfully pushed decode value to Database server."})
                                                } catch (error) {
                                                    return {status: true, message: 'Accumulate/Count Message', data: "Successfully pushed decode value to Database server."}
                                                }
                                            }).catch((err) => {
                                                try {
                                                    callback({status: true, message: 'Accumulate/Count Message', data: err})
                                                } catch (error) {
                                                    return {status: true, message: 'Accumulate/Count Message', data: err}
                                                }
                                            })
                                        });
                                    });
                                }
                                else {
                                    // c.destroy()
                                    try {
                                        callback({status: true, message: 'Unknown message, it maybe test file', data: re})
                                    } catch (error) {
                                        return {status: true, message: 'Unknown message, it maybe test file', data: re}
                                    }
                                }
                                
                            }
                        });
                    });
                  })
            }
            catch(e){
                throw new Error('Cloud not upload file, Please make sure FTP user has write permissions.')
            }
        });
    } else {
        return {}
    }
}

function dec2bin(dec, length){
    var out = "";
    while(length--)
      out += (dec >> length ) & 1;    
    return out;  
}

function hexStringToByte(str) {
    if (!str) {
      return new Uint8Array();
    }
    
    var a = [];
    for (var i = 2, len = str.length; i < len; i+=2) {
      a.push(parseInt(str.substr(i,2), 16));
    }
    
    return new Uint8Array(a);
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

function getFileExtension(fileName) {
    return path.extname(fileName).slice(1)
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

