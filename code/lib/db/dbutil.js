var moment = require('moment');

var dbTableQuot = '`',
	dbStringQuot = "'",
    dbWildcard = '%',
    dbDateSeparator = '/',
    dbNull = 'null';

module.exports = {
    setDBVar: setDBVar,
    qTbl: qTbl,
    qEsc: qEsc,
    qStr: qStr,
    qLike: qLike,
    qNum: qNum,
    qDate: qDate,
    qBool: qBool,
	qJson: qJson,
}

function setDBVar(dbvar, val) {

    switch(dbvar) {
    
        case 'TableQuot':
                dbTableQuot = val;
        break
        case 'StringQuot':
                dbStringQuot = val;
        break
        case 'Wildcard':
                dbWildcard = val;
        break
        case 'DateSeparator':
                dbDateSeparator = val;
        break
        case 'Null':
                dbNull = val;
        break
    }

}

function qTbl(val) {

	return dbTableQuot + val + dbTableQuot;

}

function qEsc(val) {

    return (typeof val == 'string') ? 
		val.replace(dbStringQuot, dbStringQuot + dbStringQuot):
		'';
}

function qStr(val) {

    if (val)
        return dbStringQuot + qEsc(val) + dbStringQuot;
    else
        return dbStringQuot + dbStringQuot;

}

function qLike(val) {

    if (val)
        return dbStringQuot + dbWildcard + qEsc(val) + dbWildcard + dbStringQuot;
    else 
        return dbStringQuot + dbStringQuot;

}

function qNum(val) {

    if (!isNaN(val))
        return val;
    else
        return 0;

}

function qDate(val, format) {

	if (format)
		return moment(val, format).format('x');
	else
		return moment(val).format('x');
}

function qBool(val) {

    if (val && val == true) 
        return 1;
    else 
        return 0;

}

function qJson(val) {

	return dbStringQuot + JSON.stringify(val) + dbStringQuot;
}
