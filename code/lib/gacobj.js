var gacdao = require(appConfig.lib_path + '/db/dao/gacdao.js');

module.exports = {
	getGpsAccList: getGpsAccList,
	getGpsAccData: getGpsAccData,
	addeditGpsAcc: addeditGpsAcc,
	deleteGpsAcc: deleteGpsAcc,
	getGPSListForGSM: getGPSListForGSM,
	getGPSList: getGPSList
}

function getGpsAccList(page, search, callback) {

	var tolrecord = 0;
    var pol = crrf.getPageOffset(page);

	gacdao.getGpsAccsCount(search, function(err, count) {
	
		if (!err) {
			
			tolrecord = count;
			
			gacdao.getGpsAccs(pol.offset, pol.length, search, function(err, rows) {
				
				var re = [];

				if (!err && cfn.length(rows) > 0) {
				
					for (var i in rows) {
						re.push({
							idx: rows[i].gacIdx,
							name: rows[i].gacName,
							pgid: rows[i].gacPGID,
							email: rows[i].gacEmail,
							regdate: rows[i].gacRegDate,
							xid: rows[i].gacXID,
							desc: rows[i].gacDesc,
							suspend: choc.bool(rows[i].gacSuspend),
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

function getGpsAccData(idx, callback) {

	gacdao.getGpsAccData(idx, function(err, rows) {

		if (!err) {

			var re = {
						idx: rows[0].gacIdx,
						name: rows[0].gacName,
						pgid: rows[0].gacPGID,
						email: rows[0].gacEmail,
						password: rows[0].gacPassword,
						host: rows[0].gacHost,
						port: rows[0].gacPort,
						tls: choc.check(rows[0].gacTLS),
						regdate: rows[0].gacRegDate,
						xid: rows[0].gacXID,
						desc: rows[0].gacDesc,
						suspend: choc.check(rows[0].gacSuspend),
					}
			callback(re, null);
		}
		else 
			callback({}, err.message);
	});
}

function getGPSListForGSM(callback) {

	gacdao.getGpsAccDataForGSM(function(err, rows) {
				
		var re = [];

		if (!err && cfn.length(rows) > 0) {
		
			for (var i in rows) {
				re.push({
					idx: rows[i].gacIdx,
					name: rows[i].gacName,
					pgid: rows[i].gacDesc,
					email: rows[i].gacEmail,
					pgid_origin: rows[i].gacPGID,
				});
			}
		}
		
		if (err) 
			callback(re, err.message);
		else
			callback(re, null);
	});
	
}

function getGPSList(callback) {

	gacdao.getGpsAccDataForAll(function(err, rows) {
		
		var re = [];

		if (!err && cfn.length(rows) > 0) {
		
			for (var i in rows) {
				re.push({
					idx: rows[i].gacIdx,
					name: rows[i].gacName,
					pgid: rows[i].gacDesc,
					email: rows[i].gacEmail,
					pgid_origin: rows[i].gacPGID,
				});
			}
		}
		
		if (err) 
			callback(re, err.message);
		else
			callback(re, null);
	});
	
}


function addeditGpsAcc(idx, data, callback) {

	if (idx > 0) {
		gacdao.editGpsAcc(idx, data, function(err) {
			if (err) 
				callback(false, err.message);
			else
				callback(true, null);
		});
	}
	else {
		gacdao.addGpsAcc(data, function(err) {
			if (err) 
				callback(false, err.message);
			else
				callback(true, null);
		});
	}
}

function deleteGpsAcc(idx, callback) {

    gacdao.deleteGpsAcc(idx, function(err) {
        if (err) 
            callback(false, err.message);
        else
            callback(true, null);
    });
}
