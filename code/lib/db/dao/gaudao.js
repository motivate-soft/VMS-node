var util = require('util');
var moment = require('moment');

module.exports = {
    getUserData: getUserData,
    getUserGroupData: getUserGroupData,
	chkUserPass: chkUserPass,
	setUserPass: setUserPass,
	getUserIdx: getUserIdx,
	getUsername: getUsername,
	getUserGroup: getUserGroup,
}

function getUserData(usridx, callback) {

    var sql = 'select * from ' + dbu.qTbl('user') + 
            ' where usrIdx=' + dbu.qNum(usridx);
			
    dbo.query(sql, function(err, rows) {
    
        if (!err && cfn.length(rows) > 0) {
            callback(null, rows);
        }
        else callback(err, null);
        
    });

}

function getUserGroupData(usridx, callback) {

    var sql = 'select * from ' + dbu.qTbl('user') + 
            ' left join ' + dbu.qTbl('group') +
            ' on usrGrpIdx=grpIdx ' +
            ' where usrIdx=' + dbu.qNum(usridx);
			
    dbo.query(sql, function(err, rows) {
    
        if (!err && cfn.length(rows) > 0) {
            callback(null, rows);
        }
        else callback(err, null);
        
    });

}

function chkUserPass(usridx, pass, callback) {

    var sql = 'select usrIdx from ' + dbu.qTbl('user') +
            ' where usrIdx=' + dbu.qNum(usridx) +
            ' and usrPassword=' + dbu.qStr(pass);
			
    dbo.query(sql, function(err, rows) {
    
        if (!err && cfn.length(rows) > 0) {
            callback(null, rows);
        }
        else callback(err, null);
        
    });
}

function setUserPass(usridx, newpass, callback) {
            
	var sql = 'update ' + dbu.qTbl('user') + 
			' set usrPassword=' + dbu.qStr(newpass) +
			' where usrIdx=' + dbu.qNum(usridx);
			
    dbo.exec(sql, function(err) {
        callback(err);
    });

}

function getUserIdx(usrname, callback) {

    var sql = 'select usrIdx from ' + dbu.qTbl('user') + 
			' where usrName=' + dbu.qStr(usrname);

    dbo.query(sql, function(err, rows) {
    
        if (!err && cfn.length(rows) > 0) {
            callback(null, rows);
        }
        else callback(err, null);
        
    });
}

function getUsername(usridx, callback) {

    var sql = 'select usrName from ' + dbu.qTbl('user') + 
			' where usrIdx=' + dbu.qNum(usridx);

    dbo.query(sql, function(err, rows) {
    
        if (!err && cfn.length(rows) > 0) {
            callback(null, rows);
        }
        else callback(err, null);
        
    });
}

function getUserGroup(usridx, callback) {

    var sql = 'select usrGrpIdx from ' + dbu.qTbl('user') + 
			' where usrIdx=' + dbu.qNum(usridx);

    dbo.query(sql, function(err, rows) {
    
        if (!err && cfn.length(rows) > 0) {
            callback(null, rows);
        }
        else callback(err, null);
        
    });
}

