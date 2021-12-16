var emlobj = require(appConfig.lib_path + '/emailobj.js');
var e2glib = require(appConfig.lib_path + '/e2glib.js');
var moment = require('moment');
var fs = require('fs');
var FTPClient = require('ftp');

var path = require('path')
var parse = require('xml-parser');
const ftp = require("basic-ftp");
const { FileInfo } = require('basic-ftp');
// const MessageService = require('../models/message.service');

var _gpsac = [];
var _accnt = 0;
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
    goodBattery: 0, // 0 - not ok, 1 - ok
    gpsDataValid: 0, // 0 - false, 1 - true
    dryContactStatus_1: 0, // 0-closed, 1-open
    dryContactStatus_2: 0, // 0-closed, 1-open
    motion: 0, // 1 = Device was In-Motion when msg was transmitted 0 = Device was At Rest when msg was transmitted
    latitude: 0,
    latHemisphere: 'N', // 'SOUTHERN'
    longitude: 0,
    lngHemisphere: 'E', // 'WESTERN'
    subtype: '', // for location message, 0 - non, 1 - Device Turned On, 2-Change of Location alert, 3-Input Status Changed, 4-Undesired input State, 5-Re-counter
    reserverdInSMARTOne: 0, // 0-false, 1-true
    heading: '', // 000 = N, 001 = NE, 010 = E, 011 = SE, 100 = S, 101 = SW, 110 = W, 111 = NW,
    speed: 0
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
        var c = new FTPClient();
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
                            c.destroy()
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

                        if (obj.root && obj.root.children)
                            moda.parseResultXML(obj, function(re) {
                                cfn.logInfo('Reading xml file: ' + filePath, true);
                                var byteArray = hexStringToByte(re.payloadValue);
                                const esn_num = re.esn;
                                const messageId = re.messageId;
                                const raw_data = re.payloadValue;
                                const timeStamp = re.timeStamp;
                                console.info("Encoded value: ", re.payloadValue)
                                if (re.payloadValue && byteArray.length > 0) {
                                    var firstBinary = dec2bin(byteArray[0], 8);
                                    console.log("Byte 0: ", firstBinary)
                                    /*
                                    * STANDARD MESSAGE TYPE
                                    */
                                    if (parseInt(firstBinary.slice(6), 2) === 0) {
                                        Stand_Message_Decoding.type = 'Standard Message';
                                        Stand_Message_Decoding.level = parseInt(firstBinary.slice(6), 2); // 1:0
                                        Stand_Message_Decoding.goodBattery = parseInt(firstBinary.slice(5, 6), 2); // 2
                                        Stand_Message_Decoding.gpsDataValid =  parseInt(firstBinary.slice(4, 5), 2); // 3
                                        Stand_Message_Decoding.dryContactStatus_1 =  parseInt(firstBinary.slice(3, 4), 2); // 4
                                        Stand_Message_Decoding.dryContactStatus_2 =  parseInt(firstBinary.slice(2, 3), 2); // 5
                                        Stand_Message_Decoding.motion = parseInt(firstBinary.slice(1, 2), 2); // 6
                                        Stand_Message_Decoding.reserverdInSMARTOne = parseInt(firstBinary.slice(0, 1), 2); // 7
                                        // Stand_Message_Decoding.gpsFailCounter = parseInt(firstBinary.slice(0, 2), 2) // 7:6
            
                                        var lat = Math.floor((byteArray[1] * 65536 + byteArray[2] * 256 + byteArray[3]) * 90 / 8388608 * 1000000) / 1000000;
                                        // 2 ^ 16 = 65536, 2 ^ 8 = 256, 2 ^ 23 = 8388608
                                        if (lat > 90) {
                                            lat -= 180;
                                        }
                                        Stand_Message_Decoding.latitude = lat;
                                        Stand_Message_Decoding.latHemisphere = lat > 0 ? 'N' : 'S';
            
                                        var lng = Math.floor((byteArray[4] * 65536 + byteArray[5] * 256 + byteArray[6]) * 180 / 8388608 * 1000000) / 1000000;
                                        if (lng > 180) {
                                            lng -= 360
                                        }
                                        Stand_Message_Decoding.longitude = lng;
                                        Stand_Message_Decoding.lngHemisphere = lng > 0 ? 'E' : 'W';
            
                                        var seventhBinary = dec2bin(byteArray[7], 8);
                                        console.log("Byte 7: ", seventhBinary)
                                        var heading = 'N';
                                        switch (parseInt(seventhBinary.slice(5, 7), 2)) {
                                            case 0:
                                                heading = 'N'
                                                break;
                                            case 1:
                                                heading = 'NE'
                                                break;
                                            case 2:
                                                heading = 'E'
                                                break;
                                            case 3:
                                                heading = 'SE'
                                                break;
                                            case 4:
                                                heading = 'S'
                                                break;
                                            case 5:
                                                heading = 'SW'
                                                break;
                                            case 6:
                                                heading = 'W'
                                                break;
                                            case 7:
                                                heading = 'NW'
                                                break;
                                            default:
                                                break;
                                        }
                                        Stand_Message_Decoding.heading = heading;
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
                                            case 6:
                                                subtype = 'Speed & heading'
                                                break;
                                            default:
                                                break;
                                        }
                                        Stand_Message_Decoding.subtype = subtype;
            
                                        var eighthBinary = dec2bin(byteArray[8], 8);
                                        console.log("Byte 8: ", eighthBinary);
                                        Stand_Message_Decoding.speed = parseInt(eighthBinary.slice(0, 7), 2)

                                        _gpsac = [];
        
                                        var current_time = new Date();
                                        emlobj.save({
                                            email: ""+ esn_num+"_ftp@"+ip,
                                            uid: messageId,
                                            emaildate: new Date(timeStamp).getTime(),
                                            gpsdata: {
                                                date: cfn.addZero(current_time.getUTCDate(), 2)+cfn.addZero(current_time.getUTCMonth(), 2)+cfn.addZero(current_time.getUTCFullYear(), 4),
                                                time: cfn.addZero(current_time.getUTCHours(), 2)+cfn.addZero(current_time.getUTCMinutes(), 2)+cfn.addZero(current_time.getUTCSeconds(), 2),
                                                latitude: Stand_Message_Decoding.latitude,
                                                NS: Stand_Message_Decoding.latHemisphere,
                                                longitude: Stand_Message_Decoding.longitude,
                                                EW: Stand_Message_Decoding.lngHemisphere,
                                                speed: Stand_Message_Decoding.speed,
                                                heading: Stand_Message_Decoding.heading,
                                                validity: Stand_Message_Decoding.gpsDataValid,
                                                power: Stand_Message_Decoding.goodBattery,
                                                tamper: Stand_Message_Decoding.motion,
                                            },
                                            emaildata: {
                                                type: "Hex",
                                                data: raw_data
                                            },
                                        });

                                        c.destroy()
                                        try {
                                            callback({status: true, message: subtype, data: "Successfully pushed decode value to Database server."})
                                        } catch (error) {
                                            return {status: true, message: subtype, data: "Successfully pushed decode value to Database server."}
                                        }
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
                                        
                                        emlobj.save({
                                            email: ""+ esn_num+"_ftp@"+ip,
                                            uid: messageId,
                                            emaildate: new Date(timeStamp).getTime(),
                                            gpsdata: Nonstandard_Message_Decoding,
                                            emaildata: {
                                                type: "Hex",
                                                data: raw_data
                                            },
                                            type: 1
                                        });

                                        c.destroy()
                                        try {
                                            callback({status: true, message: message_type, data: "Successfully pushed decode value to Database server."})
                                        } catch (error) {
                                            return {status: true, message: message_type, data: "Successfully pushed decode value to Database server."}
                                        }
                                        
                                    }
                                    else if (parseInt(firstBinary.slice(6), 2) === 3 && parseInt(firstBinary.slice(0, 6), 2) == 24) {
                                        Accumulated_Message_Decoding.level = 3;
                                        
                                        Accumulated_Message_Decoding.accumTimeForInput1 = (byteArray[1] * 256 + byteArray[2]) == 65535 ? -1 : (byteArray[1] * 256 + byteArray[2]);
                                        Accumulated_Message_Decoding.accumTimeForInput2 = (byteArray[3] * 256 + byteArray[4]) == 65535 ? -1 : (byteArray[1] * 256 + byteArray[2]);
                                        Accumulated_Message_Decoding.accumTimeForVibOfSMARTONE = (byteArray[5] * 256 + byteArray[6]) == 65535 ? -1 : (byteArray[1] * 256 + byteArray[2]);
                                        Accumulated_Message_Decoding.numOfOpenOrCloseOfInput1 = byteArray[7] == 255 ? -1 : byteArray[7];
                                        Accumulated_Message_Decoding.numOfOpenOrCloseOfInput2 = byteArray[8] == 255 ? -1 : byteArray[7];
                                        
                                        // c.mkdir('read/'+re.esn, ()=> {
                                        //     c.put(content, 'read/'+re.esn + '/' + path.basename(filePath), () => {

                                                
                                        //     });
                                        // });

                                        emlobj.save({
                                            email: ""+ esn_num+"_ftp@"+ip,
                                            uid: messageId,
                                            emaildate: new Date(timeStamp).getTime(),
                                            gpsdata: Accumulated_Message_Decoding,
                                            emaildata: {
                                                type: "Hex",
                                                data: raw_data
                                            },
                                            type: 2
                                        });

                                        c.destroy()

                                        try {
                                            callback({status: true, message: 'Accumulate/Count Message', data: "Successfully pushed decode value to Database server."})
                                        } catch (error) {
                                            return {status: true, message: 'Accumulate/Count Message', data: "Successfully pushed decode value to Database server."}
                                        }
                                    }
                                    else {
                                        // c.destroy()
                                        c.destroy()
                                        try {
                                            callback({status: true, message: 'Unknown message, it maybe test file', data: re})
                                        } catch (error) {
                                            return {status: true, message: 'Unknown message, it maybe test file', data: re}
                                        }
                                    }
                                    
                                } else {
                                    callback({status: false, message: 'Incorrect file', data: err})
                                }
                            });
                        else {
                            callback({status: false, message: 'Incorrect file', data: err})
                        }
                    });
                  })
            }
            catch(e){
                c.destroy()
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

