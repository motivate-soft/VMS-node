var util = require('util');
var md5 = require('md5');
var gaudao = require(appConfig.lib_path + '/db/dao/gaudao.js');

module.exports = {
    verifyUser: verifyUser,
	setUserPass: setUserPass,
	getUsername: getUsername,
	getUserGroup: getUserGroup,
}

function verifyUser(user, pass, callback) {

    gaudao.getUserIdx(user, function(err, rows) {
    
		if (err) {
			callback(1, null, err.message);
		}
        else if (cfn.length(rows) > 0) {

			var usridx = rows[0].usrIdx;
		
			gaudao.getUserGroupData(usridx, function(err, rows) {

				if (err) {
					callback(1, null, err.message);
				}
				else if (rows[0].usrPassword != md5(pass)) {
					callback(1, null, 'Invalid usernamd or password!');
				}
				else if (rows[0].grpSuspend || rows[0].usrSuspend) {
					callback(2, null, 'Your account has been suspended!');
				}
				else  {
					callback(0, usridx, '');
				}
			});
		}
    });
}

function setUserPass(usridx, oldpass, newpass, callback) {

	gaudao.chkUserPass(usridx, md5(oldpass), function(err, rows) {
	
		if (err) {
			callback(false, err.message);
		}
        else if (cfn.length(rows) > 0) {

			gaudao.setUserPass(usridx, md5(newpass), function(err) {
				if (err) 
					callback(false, err.message);
				else
					callback(true, null);
			}); 
		}
		else {
			callback(false, 'Invalid Old Password!');
		}
		
    });
}

function getUsername(usridx, callback) {

	gaudao.getUsername(usridx, function(err, rows) {
    
		if (!err && cfn.length(rows) > 0) {

			callback(rows[0].usrName);
		}
		else {
			callback('');
		}
		
    });
}

function getUserGroup(usridx, callback) {

	gaudao.getUserGroup(usridx, function(err, rows) {
    
		if (!err && cfn.length(rows) > 0) {

			callback(rows[0].usrGrpIdx);
		}
		else {
			callback(-1);
		}
		
    });
}

