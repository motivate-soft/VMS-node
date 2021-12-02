var util = require('util');
var sesdao = require(appConfig.lib_path + '/db/dao/sesdao.js');

var _sesid,
    _useridx;

module.exports = {
	create: create,
	update: update,
	check: check,
	close: close,
    setSid: setSid,
    getSid: getSid,
    getUserIdx: getUserIdx,
}

function create(sesid, gouidx, ipaddr, callback) {

    sesdao.set(sesid, gouidx, ipaddr, function(err) {
	
		if (!err) {
			_sesid = sesid;
			_useridx = gouidx;
		}
		
        if (callback)
            callback(err);
    });
}

function check(sesid, callback) {

    if (sesid == _sesid) {
        update(sesid, function(err) {
			callback(err);
        });
    }
    else if (callback) {
        callback({message: 'Session Expired!'});
    }
}

function update(sesid, callback) {

    sesdao.set(sesid, null, null, function(err) {
	
		callback(err);
    });
}

function close() {

    _sesid = '';
    _useridx = 0;
}

function setSid(sess, callback) {

    _sesid = sess.id;
}

function getSid() {

    return cfn.strVal(_sesid);
}

function getUserIdx() {

    return cfn.intVal(_useridx);
}
