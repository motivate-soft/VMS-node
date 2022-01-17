var moment = require('moment');

module.exports = {
	searchStatic: searchStatic,
	saveStatic: saveStatic,
	getStatic: getStatic,
	updateStatic: updateStatic,
}

function searchStatic(criteria, callback) {

    var sql = 'select * from ' + dbu.qTbl('static') + 
            ' where ' + criteria +
            ' order by staticId desc ' +
            ' limit 0, ' + 1;
			
    dbo.query(sql, function(err, rows) {
    
        if (!err) {
            callback(null, rows);
        }
        else callback(err, null);
        
    });

}

function saveStatic(data, callback) {

	searchStatic('staticName=' + dbu.qStr(data.name) + ' and staticUniqueId=' + dbu.qStr(data.uniqueId), function(err, rows) {
		if (cfn.length(rows) == 0 || (dbu.qNum(cfn.dateNow()) - dbu.qNum(rows[0]['staticLastUpdate'])) > 7200000) {
            
			var sql = 'insert into ' + dbu.qTbl('static') + 
						' ( ' +
						'staticName, ' +
						'staticUniqueId, ' +
                        'staticStatus, ' +
                        'staticLastUpdate ' +
						' ) values ( ' +
						dbu.qStr(data.name) + ', ' +
						dbu.qStr(data.uniqueId) + ', ' +
						dbu.qNum(data.status) + ', ' +
						dbu.qNum(cfn.dateNow()) + ' ' +
						' ) ';
					
			dbo.exec(sql, function(err) {
                //console.log('save data: '+data.email);
				callback(err, 1);
			});
		} 
        else {
            //console.log('found');
            callback(null, 0);
        }
	});

}

function getStatic(data, limit, callback) {

    var sql = 'select count(staticId) as midx from ' + dbu.qTbl('static') + 
    ' where staticName=' + dbu.qStr(data.name) + ' and staticUniqueId=' + dbu.qStr(data.uniqueId) + ' and staticStatus=1' +
    ' order by staticId desc ' +
    ' limit 0, ' + limit; // 12 - day, 360 - 1 month

    dbo.query(sql, function(err, rows) {
        if (!err && cfn.length(rows) > 0) {
			callback(rows[0].midx);
        }
        else callback(0);
    });

}

function updateStatic(staticName, staticeUniqueId, callback) {

	var sql = 'update ' + dbu.qTbl('static') +
			' set staticStatus=' + 'staticStatus' + dbu.qNum(1) +
			' where staticName=' + dbu.qStr(staticName) + ' and staticUniqueId=' + dbu.qStr(staticeUniqueId);
			
	dbo.exec(sql, function(err) {
		if (callback) callback(err);
	});

}