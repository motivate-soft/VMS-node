var util = require('util');

module.exports = {
    set: set,
    getUserIdx: getUserIdx,
}

function set(sesid, useridx, ipaddr, callback) {

    var sql = 'select * from ' + dbu.qTbl('session') + ' where sesSid=' + dbu.qStr(sesid);

    dbo.query(sql, function(err, rows) {

        if (err) {
            if (callback) callback(err);
        }
        else {
                
            var sql = '';
            var now = cfn.dateNow();
			var sess_expired = false;
            
            if (cfn.length(rows) > 0) {

				if (appConfig.sess_timeout > 0 && now > (rows[0].sesLastUpdated + appConfig.sess_timeout)) {
					 console.log('expired');
					 sess_expired = true;
				}
				else {
					sql = 'update ' + dbu.qTbl('session') + ' set ' +
								' sesLastUpdated=' + dbu.qNum(now);
					if (useridx)
						sql += ', sesUserIdx=' + dbu.qNum(useridx);
						
					if (ipaddr)
						sql += ', sesClientIP=' + dbu.qStr(ipaddr);
						
					sql += ' where sesSid=' + dbu.qStr(sesid);
				}
            }
            else {
                sql = 'insert into ' + dbu.qTbl('session') + ' (' +
                            ' sesSid, ' +
                            ' sesUserIdx, ' +
                            ' sesDateCreated, ' +
                            ' sesLastUpdated, ' +
                            ' sesClientIP) ' +
                            ' values (' +
                            dbu.qStr(sesid) + ', ' +
                            dbu.qNum(useridx) + ', ' +
                            dbu.qNum(now) + ', ' +
                            dbu.qNum(now) + ', ' +
                            dbu.qStr(ipaddr) + ')';
            }
            
			if (sess_expired) {
				callback({message: 'Session Expired!'});
			}
			else {
				dbo.exec(sql, function(err) {
					callback(err);
				});
			}
            
        }
    });

};

function getUserIdx(sesid, callback) {

    var sql = 'select * from ' + dbu.qTbl('session') + ' where sesSid=' + dbu.qStr(sesid);

    dbo.query(sql, function(err, rows) {

        if (!err && cfn.length(rows) > 0) {
            callback(null, rows[0].sesUserIdx);
        }
        else callback(err, null);
    
    });

}
