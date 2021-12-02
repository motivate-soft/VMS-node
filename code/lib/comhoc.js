var moment = require('moment');

module.exports = {
	bool: bool,
	check: check,
	date: date,
	time: time,
	datetime: datetime,
}

function bool(val) {

	return (cfn.intVal(val) == 1) ? '&radic;': "&nbsp;";
}

function check(val) {

	return (cfn.intVal(val) == 1) ? 'checked': "";
}

function date(val) {

	return moment(val).format("DD/MM/YYYY");
}

function time(val) {

	return moment(val).format("HH:mm:ss");
}

function datetime(val) {

	return moment(val).format("DD/MM/YYYY HH:mm:ss");
}