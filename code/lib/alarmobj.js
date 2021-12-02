var almdao = require(appConfig.lib_path + '/db/dao/alarmdao.js');

module.exports = {
	getStatus: getStatus,
	chkStatus: chkStatus,
	addAlarm: addAlarm,
	setRTN: setRTN,
}

function getStatus(email, callback) {

    almdao.getStatus(function(err, rows) {

        var re = {};
        
		if (!err) {

            for (i in rows) {
				re[rows[i].algAlmCode] = 1;
			}
		}
		else 
			cfn.logError(err)
            
        callback(re);
            
    });

}

function chkStatus(email, data, callback) {

	/*
	The Current assigned events are:-
	General Reporting (1xx)
	101 – Position Report
	Alert Events (2xx)
	201 – Panic Event
	202 – Incoming Power Fail Event
	203 – Antenna Blocked
	204 – Antenna Unblocked (deprecated, use 263)
	205 – MTU Tamper Alarm
	261 – Panic Event Restored
	262 – Incoming Power Fail Restored
	263 – Antenna Unblocked
	265 – MTU Tamper Alarm Restored	
	*/
	getStatus(email, function(alm) {
		if (data.supply && alm['202'])
		if (data.temper)

	}

}

function addAlarm(data, callback) {

    almdao.addAlarm(data, function(err) {
    
        if (err) cfn.logError(err);
        
        if (callback) callback();
    });
}

function setRTN(email, code, callback) {

	almdao.setRTN(email, almcode, callback);

}
