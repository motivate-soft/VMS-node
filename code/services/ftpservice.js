var moment = require('moment');
var fs = require('fs');
var FTPClient = require('ftp');
var c = new FTPClient();
var path = require('path')
var parse = require('xml-parser');
const ftp = require("basic-ftp");
const { FileInfo } = require('basic-ftp');

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
    client.ftp.verbose = true
    try {
        await client.access({
            host: ip,
            user: username,
            password: password,
            port: port,
            secure: false
        })
        const ftpList = await client.list(directory);
        for (let index = 0; index < ftpList.length; index++) {
            const fileInfo = new FileInfo(ftpList[index]);
            const file_name = fileInfo.name.name;
            if (ftpList[index].type == 1 && getFileExtension(file_name) === 'xml') {
                xmlFilePaths.push(directory + '/' + file_name);
            } else if (ftpList[index].type == 2) {
                await socket_ftp(ip, username, password, port, directory + '/' + file_name)
            }
        }
    }
    catch(err) {
        if (callback !== '')
            callback({status: false, message: 'Failed, error: ' + err, data: xmlFilePaths})
    }
    if (callback !== '') {
        callback({status: true, message: 'Connected successfully.', data: xmlFilePaths})
    }
    client.close()
}

function read_xml(ip, username, password, port, filePath, res) {
    if (filePath) {
        c.connect({
            host: ip,
            user: username,
            password: password,
            port: port
         });
    
         c.get(filePath, function (err, stream) { //get file from ftp
            if (err) return res.status(200).json({status: false, message: 'Failed'})
            var content = '';
            stream.on('data', function(chunk) {
                content += chunk.toString();
            });
            stream.once('close', function() {
                var obj = parse(content);
                moda.parseResultXML(obj, function(re) {
                    cfn.logInfo('Reading xml file: ' + filePath, true);
                    c.end();
                    console.log(re)
                    return res.status(200).json({status: true, message: 'Reading', data: re})
                });
            });
          })
    }
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

