
module.exports = {
	getStatus: getStatus,
	addAlarm: addAlarm,
	setRTN: setRTN,
}

function getStatus(email, callback) {

    var sql = 'select * from ' + dbu.qTbl('alarmlog') + 
            ' where algEmail=' + dbu.qStr(data.email) +
			' and algRTN=' + dbu.qInt(0);
			
    dbo.query(sql, function(err, rows) {
    
        if (!err) {
            callback(null, rows);
        }
        else callback(err, null);
        
    });
}

function addAlarm(data, callback) {

	var sql = 'insert into ' + dbu.qTbl('alarmlog') + 
				' ( ' +
				'algEmail, ' +
				'algDate, ' +
				'algAlmCode, ' +
				'algRTN, ' +
				'algRTNDate ' +
				' ) values ( ' +
				dbu.qStr(data.email) + ', ' +
				dbu.qNum(cfn.dateNow()) + ', ' +
				dbu.qNum(data.almcode) + ', ' +
				dbu.qNum(0) + ', ' +
				+ ' null ' +
				' ) ';
	
	dbo.exec(sql, function(err) {
		callback(err);
	});

}

function setRTN(email, almcode, callback) {

	var sql = 'update ' + dbu.qTbl('alarmlog') +
			' set algRTN=' + dbu.qNum(1) + ', ' +
			' algRTNDate=' + dbu.qDate(cfn.dateNow()) +
			' where algEmail=' + dbu.qStr(email) +
			' and algAlmCode=' + dbu.qNum(almcode);
			
	dbo.exec(sql, function(err) {
		if (callback) callback(err);
	});
}
