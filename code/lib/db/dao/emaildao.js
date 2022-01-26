
module.exports = {
	getMaxUID: getMaxUID,
	searchLog: searchLog,
	saveLog: saveLog,
	getLog: getLog,
	getLogCount: getLogCount,
	getLogVMS: getLogVMS,
	updateVMS: updateVMS,
	getLog4TC: getLog4TC,
	update4TC: update4TC,
}

function getMaxUID(email, callback) {

    var sql = 'select max(elgUID) as muid from ' + dbu.qTbl('emaillog') + 
            ' where elgEmail=' + dbu.qStr(email);
			
    dbo.query(sql, function(err, rows) {
    
        if (!err) {
            callback(null, rows);
        }
        else callback(err, null);
        
    });

}

async function searchLog(criteria, callback) {

    var sql = 'select * from ' + dbu.qTbl('emaillog') + 
            ' where ' + criteria;
			
    await dbo.query(sql, function(err, rows) {
    
        if (!err) {
            callback(null, rows);
        }
        else callback(err, null);
        
    });

}

function saveLog(data, callback) {

	searchLog(' elgEmail=' + dbu.qStr(data.email) + ' and elgUID=' + dbu.qStr(data.uid), function(err, rows) { // + ' and elgEmailData=' + dbu.qJson(data.emaildata) +
	
        //console.log(rows);
        //callback(err, 1);
		if (cfn.length(rows) == 0) {
			var data_type = data.type ? dbu.qNum(data.type) : 0;
			var gps_sent = data.gpssent ? dbu.qNum(data.gpssent) : 0;

			var sql = 'insert into ' + dbu.qTbl('emaillog') + 
						' ( ' +
						'elgEmail, ' +
						'elgUID, ' +
						'elgDate, ' +
						'elgEmailDate, ' +
						'elgEmailData, ' +
						'elgGPSData, ' +
						'elgGPS_sent, ' +
						'elgVMS_sent, ' +
						'elgRemark, ' +
						'elgType ' +
						' ) values ( ' +
						dbu.qStr(data.email) + ', ' +
						dbu.qStr(data.uid) + ', ' +
						dbu.qNum(cfn.dateNow()) + ', ' +
						dbu.qDate(data.emaildate) + ', ' +
						dbu.qJson(data.emaildata) + ', ' +
						dbu.qJson(data.gpsdata) + ', ' +
						dbu.qNum(gps_sent) + ', ' +
						dbu.qNum(0) + ', ' +
						dbu.qStr(data.remark) + ', ' +
						data_type + ' ' +
						' ) ';

			//allback(null, 1);
					
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

function getLogSearch(search) {

	var ftr = '';
	
	if (search && typeof search == 'object') {

		var searchEmail = cfn.strVal(search.email) ? search.email : '';
		searchEmail = searchEmail.replace('_' , '\\_');
		var searchDateFr = cfn.strVal(search.datefr) ? search.datefr : '';
		var searchDateTo = cfn.strVal(search.dateto) ? search.dateto : '';

		if (searchEmail !== '' && searchDateFr !== '' && searchDateTo !== '') {
			ftr += ' where elgEmail like ' + dbu.qLike(searchEmail) + ' ESCAPE \'\\\' ' + ' AND elgEmailDate >= ' + dbu.qDate(search.datefr + ' 00:00:00', 'DD/MM/YYYY HH:mm:ss') + ' AND elgEmailDate <= ' + dbu.qDate(search.dateto + ' 23:59:59', 'DD/MM/YYYY HH:mm:ss');
		}
		else if (searchEmail !== '' && searchDateFr !== '') {
			ftr += ' where elgEmail like ' + dbu.qLike(searchEmail) + ' ESCAPE \'\\\' ' + ' AND elgEmailDate >= ' + dbu.qDate(search.datefr + ' 00:00:00', 'DD/MM/YYYY HH:mm:ss');
		}
		else if (searchEmail !== '' && searchDateTo !== '') {
			ftr += ' where elgEmail like ' + dbu.qLike(searchEmail) + ' ESCAPE \'\\\' ' + ' AND elgEmailDate <= ' + dbu.qDate(search.dateto + ' 23:59:59', 'DD/MM/YYYY HH:mm:ss');
		}
		else if (searchDateFr !== '' && searchDateTo !== '') {
			ftr += ' where elgEmailDate >= ' + dbu.qDate(search.datefr + ' 00:00:00', 'DD/MM/YYYY HH:mm:ss') + ' AND elgEmailDate <= ' + dbu.qDate(search.dateto + ' 23:59:59', 'DD/MM/YYYY HH:mm:ss');
		}
		else if (searchEmail !== '') {
			ftr += ' where elgEmail like ' + dbu.qLike(searchEmail) + ' ESCAPE \'\\\' ';
		}
		else if (searchDateFr !== '') {
			ftr += ' where elgEmailDate >= ' + dbu.qDate(search.datefr + ' 00:00:00', 'DD/MM/YYYY HH:mm:ss');
		}
		else if (searchDateTo !== '') {
			ftr += ' where elgEmailDate <= ' + dbu.qDate(search.dateto + ' 23:59:59', 'DD/MM/YYYY HH:mm:ss');
		}
	}

	return ftr;
}

function getLog(offset, length, search, callback) {

    var sql = 'select * from ' + dbu.qTbl('emaillog'); //  + ' where elgType = ' + dbu.qNum(0)

	sql += getLogSearch(search) + ' order by elgEmailDate DESC';
			
	if (offset > -1 && length > -1)
		sql += ' limit ' + offset + ', ' + length;
	
    dbo.query(sql, function(err, rows) {
    
        if (!err && cfn.length(rows) > 0) {

			callback(null, rows);
		
        }
        else callback(err, null);
        
    });
}

function getLogCount(search, callback)	{

	var sql = 'select count(elgIdx) as midx from ' + dbu.qTbl('emaillog'); // + ' where elgType = ' + dbu.qNum(0)
            
	sql += getLogSearch(search);

    dbo.query(sql, function(err, rows) {
    
        if (!err && cfn.length(rows) > 0) {
		
			callback(null, rows[0].midx);
        }
        else callback(err, 0);
        
    });
		
}

function getLogVMS(limit, callback) {

    var sql = 'select * from ' + dbu.qTbl('emaillog') + 
			' left join ' +  dbu.qTbl('gpsacc') + 
			' on elgEmail=gacEmail ' +
			' where elgVMS_sent=' + dbu.qNum(0) +
			// ' where elgType = ' + dbu.qNum(0) +
            //' where elgEmail=' + dbu.qStr('dof_0055@orbcomm.my') +
            ' order by elgIdx desc ' +
            //' order by elgEmailDate desc ' +
            ' limit ' + limit;

    dbo.query(sql, function(err, rows) {
        callback(err, rows);
    });

}

//function updateVMS(idxs, callback) {
function updateVMS(fridx, toidx, callback) {

    //for (i in idxs) {

		var sql = 'update ' + dbu.qTbl('emaillog') +
				' set elgVMS_sent=' + dbu.qNum(1) +
				//' where elgIdx=' + dbu.qNum(idxs[i]);
				' where elgIdx>=' + dbu.qNum(fridx) +
				' and elgIdx<=' + dbu.qNum(toidx);
				
		dbo.exec(sql, function(err) {
			if (callback) callback(err);
		});

    //}
}

function getLog4TC(callback) {

    var sql = 'select * from ' + dbu.qTbl('emaillog') + 
			' left join ' +  dbu.qTbl('gpsacc') + 
			' on elgEmail=gacEmail ' +
			' where elgGPS_sent=' + dbu.qNum(0) +
            //' order by elgIdx ' +
            ' order by elgEmailDate desc ' +
            ' limit 1 ';
			
    dbo.query(sql, function(err, rows) {
        callback(err, rows);
    });

}

function update4TC(idx, callback) {

	var sql = 'update ' + dbu.qTbl('emaillog') +
			' set elgGPS_sent=' + dbu.qNum(1) +
			' where elgIdx=' + dbu.qNum(idx);
			
	dbo.exec(sql, function(err) {
		if (callback) callback(err);
	});

}

