
module.exports = {
	getGpsAccData: getGpsAccData,
	getGpsAccDataForGSM: getGpsAccDataForGSM, 
	getGpsAccDataForAll: getGpsAccDataForAll, 
    getGpsAccs: getGpsAccs,
	getGpsAccsCount: getGpsAccsCount,
	addGpsAcc: addGpsAcc,
	editGpsAcc: editGpsAcc,
	deleteGpsAcc: deleteGpsAcc,
}

function getGpsAccSearch(search) {

	var ftr = '';

	if (search && typeof search == 'object' && cfn.strVal(search) !== '') {

		var searchName = cfn.strVal(search.name) ? search.name : '';
		var searchEmail = cfn.strVal(search.email) ? search.email : '';
		searchEmail = searchEmail.replace('_' , '\\_');
		var searchPGID = cfn.strVal(search.pgid) ? search.pgid : '';

		if (searchName !== '' && searchEmail !== '' && searchPGID !== '')
			ftr += ' where gacName like ' + dbu.qLike(searchName) + ' AND gacEmail like ' + dbu.qLike(searchEmail) + ' ESCAPE \'\\\' ' + ' AND gacPGID like ' + dbu.qLike(searchPGID);
		else if (searchName !== '' && searchEmail !== '')
			ftr += ' where gacName like ' + dbu.qLike(searchName) + ' AND gacEmail like ' + dbu.qLike(searchEmail) + ' ESCAPE \'\\\' ';
		else if (searchName !== '' && searchPGID !== '')
			ftr += ' where gacName like ' + dbu.qLike(searchName) + ' AND gacPGID like ' + dbu.qLike(searchPGID);
		else if (searchEmail !== '' && searchPGID !== '')
			ftr += ' where gacEmail like ' + dbu.qLike(searchEmail) + ' ESCAPE \'\\\' ' + ' AND gacPGID like ' + dbu.qLike(searchPGID);
		else if (searchName !== '')
			ftr += ' where gacName like ' + dbu.qLike(searchName);
		else if (searchEmail !== '')
			ftr += ' where gacEmail like ' + dbu.qLike(searchEmail) + ' ESCAPE \'\\\' ';
		else if (searchPGID !== '')
			ftr += ' where gacPGID like ' + dbu.qLike(searchPGID);
	}

	return ftr;
}

function getGpsAccData(gacidx, callback) {

    var sql = 'select * from ' + dbu.qTbl('gpsacc') + 
            ' where gacIdx=' + dbu.qNum(gacidx);
			
    dbo.query(sql, function(err, rows) {
    
        if (!err && cfn.length(rows) > 0) {
            callback(null, rows);
        }
        else callback(err, null);
        
    });

}

function getGpsAccDataForGSM(callback) {
	var sql = 'select * from ' + dbu.qTbl('gpsacc') + 
            ' where gacDesc <> ""';
			
    dbo.query(sql, function(err, rows) {
    
        if (!err && cfn.length(rows) > 0) {
            callback(null, rows);
        }
        else callback(err, null);
        
    });
}

function getGpsAccDataForAll(callback) {
	var sql = 'select * from ' + dbu.qTbl('gpsacc');
			
    dbo.query(sql, function(err, rows) {
    
        if (!err && cfn.length(rows) > 0) {
            callback(null, rows);
        }
        else callback(err, null);
        
    });
}

function getGpsAccs(offset, length, search, callback) {

    var sql = 'select * from ' + dbu.qTbl('gpsacc');

	sql += getGpsAccSearch(search) + ' order by gacName ';
			
	if (offset > -1 && length > -1)
		sql += ' limit ' + offset + ', ' + length;

    dbo.query(sql, function(err, rows) {
    
        if (!err && cfn.length(rows) > 0) {

			callback(null, rows);
		
        }
        else callback(err, null);
        
    });
}

function getGpsAccsCount(search, callback)	{

	var sql = 'select count(gacIdx) as midx from ' + dbu.qTbl('gpsacc');
            
	sql += getGpsAccSearch(search);

    dbo.query(sql, function(err, rows) {
    
        if (!err && cfn.length(rows) > 0) {
		
			callback(null, rows[0].midx);
        }
        else callback(err, 0);
        
    });
		
}

function addGpsAcc(data, callback) {
            
	var sql = 'insert into ' + dbu.qTbl('gpsacc') + 
				' ( ' +
				'gacName, ' +
				'gacType, '  +
				'gacDateCreated, ' +
				'gacXID, ' +
				'gacPGID, ' +
				'gacEmail, ' +
				'gacPassword, ' +
				'gacHost, ' +
				'gacPort, ' +
				'gacTLS, ' +
				'gacDesc, ' +
				'gacSuspend ' +
				' ) values ( ' +
				dbu.qStr(data.name) + ', ' +
				dbu.qNum(0) + ', ' +
				dbu.qNum(cfn.dateNow()) + ', ' +
				dbu.qNum(0) + ', ' +
				dbu.qStr(data.pgid) + ', ' +
				dbu.qStr(data.email) + ', ' +
				dbu.qStr(data.password) + ', ' +
				dbu.qStr(data.host) + ', ' +
				dbu.qStr(data.port) + ', ' +
				dbu.qStr(data.tls) + ', ' +
				dbu.qStr(data.desc) + ', ' +
				dbu.qNum(data.suspend) + ' ' +
				' ) ';
	
    dbo.exec(sql, function(err) {
        callback(err);
    });

}

function editGpsAcc(idx, data, callback) {

	var sql = 'update ' + dbu.qTbl('gpsacc') + ' set ' +
			' gacName=' + dbu.qStr(data.name) + ', ' + 
			' gacPGID=' + dbu.qStr(data.pgid) + ', ' + 
			' gacEmail=' + dbu.qStr(data.email) + ', ' + 
			' gacPassword=' + dbu.qStr(data.password) + ', ' + 
			' gacHost=' + dbu.qStr(data.host) + ', ' + 
			' gacPort=' + dbu.qStr(data.port) + ', ' + 
			' gacTLS=' + dbu.qStr(data.tls) + ', ' + 
			' gacDesc=' + dbu.qStr(data.desc) + ', ' + 
			' gacSuspend=' + dbu.qNum(data.suspend) + ' ' + 
			' where gacIdx=' + dbu.qNum(idx);
			
    dbo.exec(sql, function(err) {
        callback(err);
    });

}

function deleteGpsAcc(idx, callback) {

	var sql = 'delete from ' + dbu.qTbl('gpsacc') +
			' where gacIdx=' + dbu.qNum(idx);

    dbo.exec(sql, function(err) {
        callback(err);
    });

}

