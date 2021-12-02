
module.exports = {
	saveLog: saveLog,
}

function saveLog(data, callback) {

	var sql = 'insert into ' + dbu.qTbl('gpslog') + 
				' ( ' +
				'glgEmail, ' +
				'glgUID, ' +
				'glgReceiveDate, ' +
				'glgEmailDate, ' +
				'glgData, ' +
				'glgResult ' +
				' ) values ( ' +
				dbu.qStr(data.email) + ', ' +
				dbu.qNum(data.UID) + ', ' +
				dbu.qNum(cfn.dateNow()) + ', ' +
				dbu.qDate(data.emaildate) + ', ' +
				dbu.qJson(data.emaildata) + ', ' +
				dbu.qJson(data.result) + ' ' +
				' ) ';
	
    dbo.exec(sql, function(err) {
        callback(err);
    });

}
