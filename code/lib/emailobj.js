var emaildao = require(appConfig.lib_path + '/db/dao/emaildao.js');

module.exports = {
	getUID: getUID,
    save: save,
	getLogList: getLogList,
    getLogVMS: getLogVMS,
	updateVMS: updateVMS,
    getLog4TC: getLog4TC,
	update4TC: update4TC,
}

function getUID(email, callback) {

    emaildao.getMaxUID(email, function(err, rows) {
    
        if (err) cfn.logError(err);
            
        var re = (rows.length == 0) ? 0: cfn.intVal(rows[0].muid);
        
        re++;
        callback(re);
    });
}

function save(data, callback) {

    emaildao.saveLog(data, function(err, added) {
    
        if (err) cfn.logError(err, added);
        
        if (callback) callback(added);
    });
}

function getLogList(page, search, callback) {

	var tolrecord = 0;
    var pol = crrf.getPageOffset(page);

	var tohex = function(val) {
		var json = cfn.parseJSON(val);
		var ary = json.data;
		var re = '';
		for (i in ary) {
			var hex = Number(ary[i]).toString(16).toUpperCase();
			if (hex.length < 2) hex = '0' + hex;
			re += hex + ' ';
		}
		return re;
	}

	var gpsstr = function(val) {
		var json = cfn.parseJSON(val);
		var re = 'Date Time: ' + 
			json.date + ' ' + json.time + '<br>' +
			'Lat / Long: '+
			json.latitude + ' ' + json.NS + ' / ' + json.longitude + ' ' + json.EW + '<br>' +
			'Speed / Heading: ' + json.speed + ' / ' + json.heading + '<br>' +
			'Validity / Supply: ' + json.validity + ' / ' + ((json.power) ? json.power: json.input_supply) + '<br>' +
			'Tamper: ' + ((json.tamper) ? json.tamper: json.temper_longitude);

			//'Validity / Input Supply: ' + json.validity + ' / ' + json.input_supply + '<br>' +
			//'Temper: ' + json.temper_longitude;
		return re;
	}
	
	emaildao.getLogCount(search, function(err, count) {
	
		if (!err) {
			
			tolrecord = count;
			
			emaildao.getLog(pol.offset, pol.length, search, function(err, rows) {
				
				var re = [];

				if (!err && cfn.length(rows) > 0) {
				
					for (var i in rows) {
						re.push({
                            idx: rows[i].elgIdx,
							email: rows[i].elgEmail,
							uid: rows[i].elgUID,
							date: choc.datetime(rows[i].elgDate),
							emaildate: choc.datetime(rows[i].elgEmailDate),
							emaildata: (rows[i].elgEmailData) ? tohex(rows[i].elgEmailData): '&nbsp;',
							gpsdata: gpsstr(rows[i].elgGPSData),
							vmssent: rows[i].elgVMS_sent,
							gpssent: rows[0].elgGPS_sent,
						});
					}
				}
				
				if (err) 
					callback(re, tolrecord, err.message);
				else
					callback(re, tolrecord, null);
			});
		}
		else
			callback([], 0, err.message);
	});
	
}

function getLogVMS(limit, callback) {

    emaildao.getLogVMS(limit, function(err, rows) {

        var re = [];
		var cnt = 0;

		if (!err) {

            for (i in rows) {
                re.push({
					idx: rows[i].elgIdx,
					name: rows[i].gacName,
					pgid: rows[i].gacPGID,
					email: rows[i].elgEmail,
					uid: rows[i].elgUID,
					date: rows[i].elgDate,
					emaildate: rows[i].elgEmailDate,
					emaildata: rows[i].elgEmailData,
					gpsdata: rows[i].elgGPSData,
					vmssent: rows[i].elgVMS_sent,
				});
				cnt++;
            }
		}
		else 
			cfn.logError(err);
            
		var loop = function() { 
			if (cnt >= cfn.length(rows))
				callback(re);
			else
				setTimeout(loop, 1);
		}
		
		loop();
            
    });

}

function updateVMS(fridx, toidx, callback) {
//function updateVMS(idxs, callback) {

	emaildao.updateVMS(fridx, toidx, callback);
	//emaildao.updateVMS(idxs, callback);
}

function getLog4TC(callback) {

    emaildao.getLog4TC(function(err, rows) {

        var re = {};
        
		if (!err) {

			if (cfn.length(rows) > 0) {
				re = {
						idx: rows[0].elgIdx,
						pgid: rows[0].gacPGID,
						email: rows[0].elgEmail,
						uid: rows[0].elgUID,
						date: rows[0].elgDate,
						emaildate: rows[0].elgEmailDate,
						emaildata: rows[0].elgEmailData,
						gpsdata: rows[0].elgGPSData,
						gpssent: rows[0].elgGPS_sent,
					};
			}
		}
		else 
			cfn.logError(err)
            
        callback(re);
            
    });

}

function update4TC(idx, callback) {

	emaildao.update4TC(idx, callback);
}
