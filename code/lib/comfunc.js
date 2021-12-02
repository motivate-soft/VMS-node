var util = require('util');
var os = require('os');
var moment = require('moment');

module.exports = {
    logInfo: logInfo,
    logError: logError,
    logInfo4vms: logInfo4vms,
    logError4vms: logError4vms,
    strVal: strVal,
    intVal: intVal,
    boolVal: boolVal,
    length: length,
	dateNow: dateNow,
	dtNow4Log: dtNow4Log,
	eol: eol,
	addZero: addZero,
    hashConcat: hashConcat,
	parseJSON: parseJSON,
	validCheck: validCheck,
	dmy2ymd: dmy2ymd,
}

function logInfo(msg, screen) {

    appLogger.info(msg);
    
    if (screen)
        util.log(msg);

}

function logError(err, exit) {

    appLogger.error(err.message + ((err.stack) ? os.EOL + err.stack: ''));
    util.log(err.message + ((err.stack) ? os.EOL + err.stack: ''));
    
    if (exit && (exit == true || exit == 1))
        process.exit(1);
}

function logInfo4vms(msg, screen) {

    vmsLogger.info(msg);
    
    if (screen)
        util.log(msg);

}

function logError4vms(err, exit) {

    vmsLogger.error(err.message + ((err.stack) ? os.EOL + err.stack: ''));
    util.log(err.message + ((err.stack) ? os.EOL + err.stack: ''));
    
    if (exit && (exit == true || exit == 1))
        process.exit(1);
}

function strVal(val) {
    
    return (val) ? val.toString(): "";
}

function intVal(val) {
    
    return (val && !isNaN(val)) ? Number(val): 0; 
}

function boolVal(val) {
    
    return (intVal(val) == 1) ? true: false; 
}

function length(val) {

    return (val && val.length) ? val.length: 0; 
}

function dateNow() {
    
    return Number(moment());
}

function dtNow4Log() {
    
    return moment().format("DD/MM HH:mm:ss");
}

function eol() {

	return os.EOL;
}

function addZero(val, maxlen) {

	var str = strVal(val);
	
	return Array((maxlen + 1) - str.length).join('0') + str;
}

function hashConcat(src) {

    var re = {};
    
    for (var i=0; i < src.length; i++) {

        for (var k in src[i]){
           
            re[k] = src[i][k];
        }
    }
    
    return re;
}

function parseJSON(str) {

    try {
        var re = JSON.parse(str);

        if (re && typeof re === "object" && re !== null) {
            return re;
        }
    }
    catch (e) { }

    return {};
};

function validCheck(params) {

	var userreg = /^\w*[A-Za-z0-9_\.]\w*$/;
    var passreg = /^\w*[A-Za-z0-9]\w*$/;
    var emailreg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    var datereg = /^(((((0?[1-9])|(1\d)|(2[0-8]))[\/-]((0?[1-9])|(1[0-2])))|((31[\/-]((0?[13578])|(1[02])))|((29|30)[\/-]((0?[1,3-9])|(1[0-2])))))[\/-]((20[0-9][0-9])|(19[0-9][0-9])))|((29[\/-]0?2[\/-](19|20)(([02468][048])|([13579][26]))))$/;
    var timereg = /^(([0-1]?[0-9])|([2][0-3])):([0-5]?[0-9])?$/;
    var pricereg = /^\d{1,11}(\.\d{1,2})?$/;
    var alphnureg = /^\w*[A-Za-z0-9]\w*$/;
    var filereg = /^\w[\w-_\.]*$/;

    re = '';
    
    if (typeof params == 'object') {
    
        if (!params.length)
            var params = [params];
	
		var v;
		for (var i in params) {
		
			v = params[i];
		
            if (v.type == 'str' && !v.val) 
				re += ((re) ? '<br>': '') + 'Invalid ' + v.msg;
            else if (v.type == 'num' && isNaN(v.val))
				re += ((re) ? '<br>': '') + 'Invalid ' + v.msg;
            else if (v.type == 'user' && !userreg.test(v.val))
				re += ((re) ? '<br>': '') + 'Invalid ' + v.msg;
            else if (v.type == 'pass' && !passreg.test(v.val))
				re += ((re) ? '<br>': '') + 'Invalid ' + v.msg;
            else if (v.type == 'comp' && v.val != v.val2)            
				re += ((re) ? '<br>': '') + v.msg + ' doesn\'t match';
            else if (v.type == 'email' && !emailreg.test(v.val))
				re += ((re) ? '<br>': '') + 'Invalid ' + v.msg;
            else if (v.type == 'date' && !datereg.test(v.val))
				re += ((re) ? '<br>': '') + 'Invalid ' + v.msg;
            else if (v.type == 'time' && !timereg.test(v.val))
				re += ((re) ? '<br>': '') + 'Invalid ' + v.msg;
            else if (v.type == 'price' && !pricereg.test(v.val))
				re += ((re) ? '<br>': '') + 'Invalid ' + v.msg;
            else if (v.type == 'alphnu' && !alphnureg.test(v.val))
				re += ((re) ? '<br>': '') + 'Invalid ' + v.msg;
            else if (v.type == 'file' && !filereg.test(v.val))
				re += ((re) ? '<br>': '') + 'Invalid ' + v.msg;
            
            if (v.type == 'num' || v.type == 'price') {
                if (v.min && !isNaN(v.min) && intVal(v.val) < v.min)
					re += ((re) ? '<br>': '') + v.msg + ' out of range';
                else if (v.max && !isNaN(v.max) && intval(v.val) > v.max)
					re += ((re) ? '<br>': '') + v.msg + ' out of range';
            }
            else {
                if (v.min && !isNaN(v.min) && strVal(v.val).length < v.min)
					re += ((re) ? '<br>': '') + v.msg + ' out of range';
                else if (v.max && !isNaN(v.max) && strVal(v.val).length > v.max)
					re += ((re) ? '<br>': '') + v.msg + ' out of range';
            }
        }
    }
    
    return re;
}

function dmy2ymd(val) {

	var re = '';

    if (typeof val == 'string') {
	
		var spr = (val.indexOf('/') > 0) ? '/': '-';
        var ary = val.split(/[\/-]+/);

        re = ary[2] + spr + ary[1] + spr + ary[0];
    }
	
	return re;
}
