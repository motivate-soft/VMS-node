var moment = require('moment');

module.exports = {
	getStaticForGSM: getStaticForGSM,
	getStaticForPGID: getStaticForPGID
}

function getStaticForGSM(data, callback) {

    var sql = 'select count(elgIdx) as midx from ' + dbu.qTbl('emaillog') + 
	' where elgVMS_sent=' + dbu.qNum(1) + ' and elgEmail=' + dbu.qStr(data.email) + ' and elgDate >= ' + dbu.qDate(cfn.strVal(data.fromdate) + ' 00:00:00', 'DD/MM/YYYY HH:mm:ss') + ' and elgUID LIKE ' + dbu.qLike("gsm");

	var sqlForTotalCount = 'select count(elgIdx) as tidx from ' + dbu.qTbl('emaillog') + 
	' where elgEmail=' + dbu.qStr(data.email) + ' and elgDate >= ' + dbu.qDate(cfn.strVal(data.fromdate) + ' 00:00:00', 'DD/MM/YYYY HH:mm:ss') + ' and elgUID LIKE ' + dbu.qLike("gsm");

    dbo.query(sql, function(err, rows) {

		var active_count = 0;
		if (!err && cfn.length(rows) > 0) {
			active_count = rows[0].midx;
        }
		
		dbo.query(sqlForTotalCount, function(err_, rows_) {
			if (!err_ && cfn.length(rows_) > 0) {
				callback({
					tc: rows_[0].tidx,
					ac: active_count
				});
			}
			else callback({
				tc: 0,
				ac: active_count
			});
		});
    });

}

function getStaticForPGID(data, callback) {

    var sql = 'select count(elgIdx) as midx from ' + dbu.qTbl('emaillog') + 
	' where elgVMS_sent=' + dbu.qNum(1) + ' and elgEmail=' + dbu.qStr(data.email) + ' and elgDate >= ' + dbu.qDate(cfn.strVal(data.fromdate) + ' 00:00:00', 'DD/MM/YYYY HH:mm:ss') + ' and elgUID NOT LIKE ' + dbu.qLike("gsm");

	var sqlForTotalCount = 'select count(elgIdx) as tidx from ' + dbu.qTbl('emaillog') + 
	' where elgEmail=' + dbu.qStr(data.email) + ' and elgDate >= ' + dbu.qDate(cfn.strVal(data.fromdate) + ' 00:00:00', 'DD/MM/YYYY HH:mm:ss') + ' and elgUID NOT LIKE ' + dbu.qLike("gsm");

    dbo.query(sql, function(err, rows) {

		var active_count = 0;
		if (!err && cfn.length(rows) > 0) {
			active_count = rows[0].midx;
        }
		
		dbo.query(sqlForTotalCount, function(err_, rows_) {
			if (!err_ && cfn.length(rows_) > 0) {
				callback({
					tc: rows_[0].tidx,
					ac: active_count
				});
			}
			else callback({
				tc: 0,
				ac: active_count
			});
		});
    });

}