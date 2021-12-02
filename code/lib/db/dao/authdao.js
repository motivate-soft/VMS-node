var util = require('util');

module.exports = {
	get: get,
	set: set,
}

function get(gouidx, callback) {

    sql = 'select * from ' + dbu.qTbl('auth') +
            ' where authGouIdx=' + dbu.qNum(gouidx);

    dbo.query(sql, function(err, rows) {
    
        if (!err && cfn.length(rows) > 0) {
            callback(null, rows);
        }
        else callback(err, null);
        
    });
}

function set(gouidx, data, callback) {

	get(gouidx, function(err, rows) {

        if (err) 
            callback(err, null);
        else {

            if (cfn.length(rows) > 0) {

				sql = 'update ' + dbu.qTbl('auth') + ' set' +
						' authData=' + dbu.qJson(data) + ' ' +
						' where authGouIdx=' + dbu.qNum(gouidx);
            }
            else {
				sql = ' insert into ' + dbu.qTbl('auth') + ' (' +
						' authGouIdx, ' +
						' authData) ' +
						' values (' +
						dbu.qNum(gouidx) + ', ' +
						dbu.qJson(data) + ')';
			}

            dbo.exec(sql, function(err) {
                callback(err);
            });
            
		}
		
	});

}
