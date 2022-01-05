var gacdao = require(appConfig.lib_path + '/db/dao/gacdao.js');
var emlobj = require(appConfig.lib_path + '/emailobj.js');
//var almobj = require(appConfig.lib_path + '/alarmobj.js');
var BitArray = require('node-bitarray');
const exec = require('child_process').exec;

module.exports = {
    getGac: getGac,
    checkEmail: checkEmail,
    getGPSData: getGPSData,
	saveGPSData: saveGPSData,
}

function getGac(callback) {

    var re = []

    gacdao.getGpsAccs(-1, -1, null, function(err, rows) {

        if (!err && cfn.length(rows) > 0) {

            for (var i in rows) {

                if (cfn.intVal(rows[i].gacSuspend) != 1) {
                    //if (rows[i].gacEmail == 'dof_0043@orbcomm.my') {

                    re.push({
                        idx: rows[i].gacIdx,
                        name: rows[i].gacName,
                        pgid: rows[i].gacPGID,
                        email: rows[i].gacEmail,
                        password: rows[i].gacPassword,
                        host: rows[i].gacHost,
                        port: rows[i].gacPort,
                        tls: cfn.boolVal(rows[i].gacTLS),
                        suspend: rows[i].gacSuspend,
                    });
                }
            }
        }

        callback(re, err);
    });
}

function checkEmail(param, callback) {

	var argvs = param.email + '_-_' +
				param.password + '_-_' +
				param.host + '_-_' +
				param.port + '_-_' +
				((param.tls) ? '1':'0')  + '_-_' +
				param.days;

	//console.log('=>'+'node ' + appConfig.checkMailExec + ' ' + argvs);
	//console.log(cfn.eol());

	exec('node ' + appConfig.checkMailExec + ' ' + argvs, (err, stdout, stderr) => {
		if (err) {
			callback(err, 0);
		}
		else {
			//console.log('=========================');
			//console.log(stdout);
			if (stdout.substr(0,1) == '[') {
				var data = cfn.parseJSON(stdout);
				//console.log(data);

				saveGPSData(data, param, function(scnt) {
					callback(null, scnt);
				});
			}
			else {
				console.log(stdout);
				callback({message:stdout}, 0);
			}
		}
	});	

	
/*

    var imap = new Imap({
        user: param.email,
        password: param.password,
        host: param.host,
        port: param.port,
        tls: param.tls,
    });

    var mcnt = 0;
    var saving = 0;
    imap.once('ready', function() {
        imap.openBox('INBOX', true, function openInbox(err, box) {
            if (err) {
                cfn.logError(err);
            } else {
                imap.search(param.criteria, function(err, results) {
                    //if (param.email == 'dof_0043@orbcomm.my') console.log(results);

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
                                //if (typeof param.onMessage == 'function')
                                //	param.onMessage(re);
                                //console.log(attrs);
                            });
                            msg.once('end', function() {

                                //console.log(ebody);
                                getGPSData(ebody, function(errmsg, re) {

                                    if (errmsg) {
                                        cfn.logError({
                                            message: errmsg + cfn.eol() +
                                                '  Email: ' + param.email + cfn.eol() +
                                                '  UID: ' + euid
                                        });
                                    }

                                    saving++;
                                    emlobj.save({
                                        email: param.email,
                                        uid: euid,
                                        emaildate: edate,
                                        emaildata: ebody,
                                        gpsdata: re,

                                    }, function(added) {
                                        if (added) mcnt++;
                                        saving--;
                                        //almobj.chkStatus(param.email, re);
                                    });
                                });
                            });
                        });

                        f.once('error', function(err) {
                            cfn.logError(err);
                        });

                        f.once('end', function() {
                            imap.end();
                        });
                    }
                });
            }
        });
    });

    imap.once('error', function(err) {
        imap.destroy();
        callback(err, mcnt);
        //imap.end();
    });

    imap.once('end', function() {

        var done = function() {
            imap.destroy();
            callback(null, mcnt);
        }

        var loop = function() {
            if (saving == 0)
                done();
            else
                setTimeout(loop, 500);
        }

        loop();
    });

    imap.connect();
*/
}

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

function saveGPSData(data, param, callback) {

	if (typeof(data) == 'object' && data.length > 0) {
		var mcnt = 0;
		var saved = 0;
	
		var done = function() {
			callback(saved);
		}

		var loop = function() {

			var euid = '' + data[mcnt].uid;
			var edate = data[mcnt].date;
			var ebody = Buffer.from(data[mcnt].buf);
			
			getGPSData(ebody, function(errmsg, re) {

				if (errmsg) {
					cfn.logError({
						message: errmsg + cfn.eol() +
							'  Email: ' + param.email + cfn.eol() +
							'  Bin: ' + data[mcnt].buf + cfn.eol() +
							'  Data: ' + JSON.stringify(re)
					});
				}

				//console.log(ebody);
				//console.log(re);
				//process.exit(0);
				emlobj.save({
					email: param.email,
					uid: euid,
					emaildate: edate,
					emaildata: ebody,
					gpsdata: re,

				}, function(added) {
					mcnt++;
					if (added) saved++;
					//almobj.chkStatus(param.email, re);
//console.log('saving:'+param.email+',uid='+euid);
					
					if (mcnt == data.length)
						done();
					else
						setTimeout(loop, 50);
						
				});
			});

		}

		loop();
	}
	else {
		callback(0);
	}
	
}
