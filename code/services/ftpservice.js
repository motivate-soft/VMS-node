var emlobj = require(appConfig.lib_path + '/emailobj.js');
var e2glib = require(appConfig.lib_path + '/e2glib.js');
var moment = require('moment');
var fs = require('fs');
var FTPClient = require('ftp');

var path = require('path')
var parse = require('xml-parser');
const ftp = require("basic-ftp");
const { FileInfo } = require('basic-ftp');

var _interval = 300000;				// **** 1hour 300000
var _running = false;
var _sleeping = false;
var _stopping = false;
var _firsttime = true;

var ftpip, ftpport, ftppassword, ftpusername;

const Remote_READ_Directory_Name = "ESN";
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
    heading: 0, // 000 = N, 001 = NE, 010 = E, 011 = SE, 100 = S, 101 = SW, 110 = W, 111 = NW,
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
async function ftp_connect_for_service(ip, username, password, port, callback) {
    xmlFilePaths = [];
    await socket_ftp(ip, username, password, port, "");
    
    xmlFilePaths.forEach(async (filePath, index) => {
        await read_xml(ip, username, password, port, filePath);
    });

    callback({status: true, data: xmlFilePaths})
}

async function ftp_connect(ip, username, password, port, callback) {
    xmlFilePaths = [];
    await socket_ftp(ip, username, password, port, '', callback);
}

const client = new ftp.Client()
async function socket_ftp(ip, username, password, port, directory, callback = '') {
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
                xmlFilePaths.push(file_name);
                await downloadFile(ip, username, password, port, 'excel/'+file_name, directory + '/' + file_name)
            } else if (ftpList[index].type == 2) {
                if (file_name == Remote_READ_Directory_Name) {
                    continue;
                }
                await socket_ftp(ip, username, password, port, directory + '/' + file_name)
            }
        }
    }
    catch(err) {
        if (callback !== '')
        {
            callback({status: false, message: 'Failed, error: ' + err, data: xmlFilePaths})
        }
    }
    if (callback !== '') {
        try {
            if (xmlFilePaths.length == 0)
                callback({status: true, message: 'No data', data: xmlFilePaths})
            else
                callback({status: true, message: 'Connected successfully.', data: xmlFilePaths})
        } catch (error) {
            
        }
    }
}
async function downloadFile(ip, username, password, port, dest_path, from_path) {
    try {
        await client.access({
            host: ip,
            user: username,
            password: password,
            port: port,
            secure: false
        });
        await client.downloadTo(dest_path, from_path);
        await client.remove(from_path, true);
    }
    catch(err) {
        console.log(err)
    }
}

async function uploadFile(ip, username, password, port, dest_path, file_name, from_path) {
    const client1 = new ftp.Client()
    try {
        
        await client1.access({
            host: ip,
            user: username,
            password: password,
            port: port,
            secure: false
        });
        await client1.ensureDir(dest_path)
        await client1.uploadFrom(from_path, file_name);
    }
    catch(err) {
        console.log(err)
    }
    client1.close()
}
async function read_xml(ip, username, password, port, filePath, callback = '' ) {
    console.log(filePath)
    if (filePath) {
        try {
            fs.readFile('./excel/'+filePath, 'utf8', function(err, data){

                if(err) {
                    if (callback !== '')
                    callback({status: false, message: 'failed: ' + err})
                    return;
                }

                var obj = parse(data);

                if (obj.root && obj.root.children)
                    moda.parseResultXML(obj, async function(re) {
                        // cfn.logInfo('Reading xml file: ' + filePath, true);
                        var byteArray = hexStringToByte(re.payloadValue);
                        // var find = '0-';
                        // var re = new RegExp(find, 'g');
                        let esn_num = "" + re.esn
                        // esn_num = esn_num.replace(/0-/g, "")
                        if (esn_num == "") {
                            if (callback !== '')
                            callback({status: false, message: 'ESN lable does not exist.'})
                            return                
                        }

                        await uploadFile(ip, username, password, port, Remote_READ_Directory_Name + "/"+esn_num, filePath, './excel/'+filePath)

                        const messageId = re.messageId;
                        const raw_data = re.payloadValue;
                        const timeStamp = re.timeStamp;
                        const unixTime = re.unixTime;
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
                                Stand_Message_Decoding.latHemisphere = 'N'
                                if (lat > 90) {
                                    lat -= 180;
                                    Stand_Message_Decoding.latHemisphere = 'S'
                                }
                                Stand_Message_Decoding.latitude = Math.abs(lat) * 100;
                                // Stand_Message_Decoding.latHemisphere = lat > 0 ? 'N' : 'S';

                                var lng = Math.floor((byteArray[4] * 65536 + byteArray[5] * 256 + byteArray[6]) * 180 / 8388608 * 10000000) / 10000000;
                                Stand_Message_Decoding.lngHemisphere = 'E'
                                if (lng > 180) {
                                    lng -= 360
                                    Stand_Message_Decoding.lngHemisphere = 'W'
                                }
                                Stand_Message_Decoding.longitude = Math.abs(lng) * 100;

                                // Stand_Message_Decoding.lngHemisphere = lng > 0 ? 'E' : 'W';

                                var seventhBinary = dec2bin(byteArray[7], 8);
                                console.log("Byte 7: ", seventhBinary)
                                var heading = 0;
                                switch (parseInt(seventhBinary.slice(5, 7), 2)) {
                                    case 0:
                                        heading = 0
                                        break;
                                    case 1:
                                        heading = 45
                                        break;
                                    case 2:
                                        heading = 90
                                        break;
                                    case 3:
                                        heading = 135
                                        break;
                                    case 4:
                                        heading = 180
                                        break;
                                    case 5:
                                        heading = 225
                                        break;
                                    case 6:
                                        heading = 270
                                        break;
                                    case 7:
                                        heading = 315
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
                                current_time.setTime(unixTime);
                                var timeStamps = timeStamp.split(" ");
                                var dateString = timeStamps[0];
                                var timeString = timeStamps[1];
                                var dateParts = dateString.split("/");
                                var timeParts = timeString.split(":");
                                var email_date = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0], +timeParts[0] + 8, +timeParts[1], +timeParts[2]);
                                emlobj.save({
                                    email: ""+ esn_num+"_ftp@orbcomm.us",
                                    uid: messageId,
                                    emaildate: parseInt(email_date.getTime()),
                                    gpsdata: {
                                        date: cfn.addZero(email_date.getDate(), 2)+cfn.addZero(email_date.getMonth() + 1, 2)+cfn.addZero(Math.floor(email_date.getFullYear() % 100), 2),
                                        time: cfn.addZero(email_date.getHours(), 2)+cfn.addZero(email_date.getMinutes(), 2)+cfn.addZero(email_date.getSeconds(), 2),
                                        latitude: cfn.addZero(Math.floor(Stand_Message_Decoding.latitude), 4) + '.' + cfn.addZero(Math.ceil((Stand_Message_Decoding.latitude - Math.floor(Stand_Message_Decoding.latitude)) * 10000), 4),
                                        NS: Stand_Message_Decoding.latHemisphere,
                                        longitude: cfn.addZero(Math.floor(Stand_Message_Decoding.longitude), 5) + '.' + cfn.addZero(Math.ceil((Stand_Message_Decoding.longitude - Math.floor(Stand_Message_Decoding.longitude)) * 10000), 4),
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

                                
                                try {
                                    if (callback !== '')
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
                                
                                // emlobj.save({
                                //     email: ""+ esn_num+"_ftp@"+ip,
                                //     uid: messageId,
                                //     emaildate: new Date(timeStamp).getTime(),
                                //     gpsdata: Nonstandard_Message_Decoding,
                                //     emaildata: {
                                //         type: "Hex",
                                //         data: raw_data
                                //     },
                                //     type: 1
                                // });

                                
                                try {
                                    if (callback !== '')
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

                                try {
                                    if (callback !== '')
                                    callback({status: true, message: 'Accumulate/Count Message', data: "Successfully pushed decode value to Database server."})
                                } catch (error) {
                                    return {status: true, message: 'Accumulate/Count Message', data: "Successfully pushed decode value to Database server."}
                                }
                            }
                            else {
                                // 
                                
                                try {
                                    if (callback !== '')
                                    callback({status: true, message: 'Unknown message, it maybe test file', data: re})
                                } catch (error) {
                                    return {status: true, message: 'Unknown message, it maybe test file', data: re}
                                }
                            }
                            
                        } else {
                            if (callback !== '')
                            callback({status: false, message: 'Incorrect file', data: err})
                        }
                    });
                else {
                    if (callback !== '')
                    callback({status: false, message: 'Incorrect file', data: err})
                }
            })
            
        } catch (error) {
            if (callback !== '')
                callback({status: false, message: 'Not found file'})
        }
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
        setTimeout(run, 3000);
    } else {
        run()
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
        setTimeout(run, 3000);
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
    
    dbo.getMData('ftp', function(re) {
	
		var ftpinfo = cfn.parseJSON(re);
		ftpip = ftpinfo.ip;
        ftpport = ftpinfo.port;
        ftpusername = ftpinfo.username;
        ftppassword = ftpinfo.password;

        ftp_connect_for_service(ftpip, ftpusername, ftppassword, ftpport, function(re){
            if (!re.status) {
                console.log(cfn.dtNow4Log() + ' ' + re.message);
                return;
            } else {
                if (re.data.length == 0) {
                    console.log(cfn.dtNow4Log() + ' ' + ' - Not found files uploaded to FTP.');
                    xmlFilePaths = [];
                } else {
                    console.log(cfn.dtNow4Log() + ' ' + ' - Found ' + re.data.length + ' new files.');
                    xmlFilePaths = [];
                }
            }
        })

        if (_running) {
            next()
        }
        else {
            _stopping = false;
            cfn.logInfo('FTP connection stopped', true);
            return;
        }

    });
	
}

function getFileExtension(fileName) {
    return path.extname(fileName).slice(1)
}
