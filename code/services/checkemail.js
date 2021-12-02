var appConfig = require('../config.js');
var cfn = require(appConfig.lib_path + '/comfunc.js');
var Imap = require('imap');
var log4js = require('log4js');
var util = require('util');
var os = require('os');
var moment = require('moment');
var BitArray = require('node-bitarray');

// ******************************************************************** log4js *************************
log4js.configure({

    appenders: { 
      imap: {  type: "file",
      filename: appConfig.log_path + '/imap.log',
      maxLogSize: 10485760, // 1024*1024*10 = 10M
      backups: 10, 
      compress: true }
    },
    categories: { 
      default: { appenders: [ "imap" ], level: "debug" } 
    }
 
});
var imapLogger = log4js.getLogger("imap");

function logError(err) {

    imapLogger.error(err.message + ((err.stack) ? os.EOL + err.stack: ''));
    util.log(err.message + ((err.stack) ? os.EOL + err.stack: ''));
    
    //if (exit && (exit == true || exit == 1))
        process.exit(0);
}


// ******************************************************************** argv ***************************
if (process.argv.length < 3) process.exit(1);

var param = process.argv[2].split('_-_');
if (param.length < 6) process.exit(1);


// ******************************************************************** func ***************************

function getGPSData(data, callback) {

    if (data && typeof data == 'object') {
        var buf = data;

        if (buf.length < 16) {
            callback('Invalid buffer length! [length:' + buf.length + ']');
            return;
        } else if (buf.length > 16) {

            var start = (buf[buf.length - 1] == 10 && buf[buf.length - 2] == 13) ? buf.length - 18 : buf.length - 16;
            var buf = buf.slice(start, start + 16);
        }

        convData(buf, function(errmsg, re) {

            callback(errmsg, re);
        });
    } else {
        callback('Buffer is null!');
        return;
    }
}

function convData(buf, callback) {

    var bytes = [];
    var re = {};

    try {

        for (i = 0; i < buf.length; i++)
            bytes[i] = BitArray.parse(buf[i], ['asOctet']);
        //console.log(buf);
        //console.log(bytes);

        var day = BitArray.toNumber([bytes[0][7], bytes[0][6], bytes[0][5], bytes[0][4], bytes[0][3]]);
        var mon = BitArray.toNumber([bytes[0][2], bytes[0][1], bytes[1][2], bytes[1][1]]);
        var hour = BitArray.toNumber([bytes[1][7], bytes[1][6], bytes[1][5], bytes[1][4], bytes[1][3]]);
        var year = BitArray.toNumber([bytes[2][7], bytes[2][6], bytes[2][5], bytes[2][4], bytes[2][3], bytes[2][2], bytes[2][1]]);
        var min = BitArray.toNumber([bytes[3][7], bytes[3][6], bytes[3][5], bytes[3][4], bytes[3][3], bytes[3][2]]);
        var sec = BitArray.toNumber([bytes[4][7], bytes[4][6], bytes[4][5], bytes[4][4], bytes[4][3]]);
        var validity = bytes[4][1];
        var latdeg = BitArray.toNumber([bytes[5][7], bytes[5][6], bytes[5][5], bytes[5][4], bytes[5][3], bytes[5][2], bytes[5][1]]);
        var latmin = BitArray.toNumber([bytes[6][7], bytes[6][6], bytes[6][5], bytes[6][4], bytes[6][3], bytes[6][2]]);
        var NS = bytes[6][1];
        var latdotmin = BitArray.toNumber([bytes[8][7], bytes[8][6], bytes[8][5], bytes[8][4], bytes[8][3], bytes[8][2], bytes[8][1],
            bytes[7][7], bytes[7][6], bytes[7][5], bytes[7][4], bytes[7][3], bytes[7][2], bytes[7][1]
        ]);
        var longdeg = BitArray.toNumber([bytes[9][7], bytes[9][6], bytes[9][5], bytes[9][4], bytes[9][3], bytes[9][2], bytes[9][1], bytes[15][3]]);
        var longmin = BitArray.toNumber([bytes[10][7], bytes[10][6], bytes[10][5], bytes[10][4], bytes[10][3], bytes[10][2]]);
        var EW = bytes[10][1];
        var longdotmin = BitArray.toNumber([bytes[12][7], bytes[12][6], bytes[12][5], bytes[12][4], bytes[12][3], bytes[12][2], bytes[12][1],
            bytes[11][7], bytes[11][6], bytes[11][5], bytes[11][4], bytes[11][3], bytes[11][2], bytes[11][1]
        ]);
        var speed = BitArray.toNumber([bytes[13][7], bytes[13][6], bytes[13][5], bytes[13][4], bytes[13][3], bytes[13][2], bytes[13][1], bytes[15][7], bytes[15][6]]);
        var heading = BitArray.toNumber([bytes[14][7], bytes[14][6], bytes[14][5], bytes[14][4], bytes[14][3], bytes[14][2], bytes[14][1], bytes[15][5], bytes[15][4]]);
        var power = bytes[15][1];
        var tamper = bytes[15][2];

        var gTime = cfn.addZero(hour, 2) + cfn.addZero(min, 2) + cfn.addZero(sec, 2);
        var gDate = cfn.addZero(day, 2) + cfn.addZero(mon, 2) + cfn.addZero(year, 2);
        var gLat = cfn.addZero(latdeg, 2) + cfn.addZero(latmin, 2) + '.' + cfn.addZero(latdotmin, 4);
        var gLong = cfn.addZero(longdeg, 3) + cfn.addZero(longmin, 2) + '.' + cfn.addZero(longdotmin, 4);
        var gNS = (NS == 1) ? 'N' : 'S';
        var gEW = (EW == 1) ? 'E' : 'W';

        re = {
            date: gDate,
            time: gTime,
            latitude: gLat,
            NS: gNS,
            longitude: gLong,
            EW: gEW,
            speed: speed,
            heading: heading,
            validity: validity,
            power: power,
            tamper: tamper,

        };

        callback(null, re);

    } catch (err) {
        callback(err.message, null);
    }
}


// ******************************************************************** imap ***************************
var imap = new Imap({
	user: param[0],
	password: param[1],
	host: param[2],
	port: param[3],
	tls: (param[4] == '1'),
});

var days = moment().subtract(param[5], 'days').format('YYYY/MM/DD');

var mcnt = 0;
var saving = 0;
var result = [];
    
imap.once('ready', function() {
	imap.openBox('INBOX', true, function openInbox(err, box) {
		if (err) {
			logError(err);
		} else {
			imap.search([ 'ALL', ['SINCE', days] ], function(err, results) {

				if (results.length == 0) {
					imap.end();
				} else {

					var f = imap.fetch(results, {
						bodies: ['HEADER.FIELDS (FROM)', 'TEXT']
					});

					f.on('message', function(msg, seqno) {

						var ebody = '';
						var euid = '';
						var edate = '';

						msg.on('body', function(stream, info) {
							//imap.end();

							var buffer = Buffer.from('')
							stream.on('data', function(chunk) {
								if (info.which === 'TEXT')
									buffer = Buffer.concat([buffer, chunk]);;
							});
							stream.once('end', function() {
								if (info.which === 'TEXT') {
									ebody = buffer;
								}
							});
						});
						msg.once('attributes', function(attrs) {
							euid = attrs.uid;
							edate = attrs.date;
							//console.log(attrs);
						});
						msg.once('end', function() {

							mcnt++;
							result.push({uid: euid,
										date: edate,
										buf:ebody});
						});
					});

					f.once('error', function(err) {
						logError(err);
					});

					f.once('end', function() {
						//console.log(result);
						imap.end();
					});
				}
			});
		}
	});
});

imap.once('error', function(err) {
    if (err.code == 'ECONNRESET') {
        //console.log('Connection ended');
	}
    else
        logError(err);
});

imap.once('end', function() {
	//console.log('Connection ended');
	//console.log(result);
	console.log(JSON.stringify(result));  // 2021 05 console log disable
	/*
	var json = JSON.stringify(result);
	var data = JSON.parse(json);
	console.log(data[1].buf);
	var buf = Buffer.from(data[1].buf);
	console.log(buf[15]);
	*/
});

imap.connect();

// ******************************************************************** timeout ************************

var timeout_interval = 7000; 	//3 sec; 8000=8s for collect 100mail 20170917

function doTimeout() {
	//console.log(JSON.stringify(result));
	//process.exit(0);
	imap.destroy();
}

setTimeout(doTimeout, timeout_interval);

