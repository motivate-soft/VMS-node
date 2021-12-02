var util = require('util');

var dbengine,
    dbcon;

switch(appConfig.db_type) {

    case 'sqlite':
        dbengine = require('sqlite3').verbose();
    break;
} 

module.exports = {
    connect: connect,
    init: init,
    exec: exec,
    query: query,
    getMData: getMData,
    setMData: setMData,
}

function connect(callback) {

    switch(appConfig.db_type) {
    
        case 'sqlite':
        
            dbcon = new dbengine.Database(appConfig.db_path + '/' + appConfig.db_name, function(err) {
            
                if (err) 
                    cfn.logError(err, true);
                else if (callback)
                    callback();
            });
        break;
    }
};

function init(callback) {

    switch(appConfig.db_type) {
    
        case 'sqlite':
        
            var sqlTables = require(appConfig.lib_path + '/db/sql/sqlite.js');
            var tbls = [];
            
            dbcon.each("SELECT name FROM sqlite_master WHERE type='table';", function(err, row) {
            
                if (err) cfn.logError(err, true);
                else 
                    tbls.push(row.name);
                
            }, function() {

                var tol = Object.keys(sqlTables).length;
                var proc_cnt = 1;
                var haserr = false;
                
                var finalize = function(err) {
                    
                    if (err) haserr = true;
                    
                    if (proc_cnt == tol) {
                        if (haserr)
                            process.exit(1);
                            
                        if (callback)
                            callback();
                    }
                    else
                        proc_cnt++;
                }
            
                for (var tbl in sqlTables) {

                    if (sqlTables[tbl].drop || tbls.indexOf(tbl) == -1) {
                    
                        if (sqlTables[tbl].drop) {
                            recreateTable(sqlTables[tbl], function(err) {
                                
                                finalize(err);
                            });
                        }
                        else {
                            createTable(sqlTables[tbl], function(err) {

                                finalize(err);
                            });
                        }
                    }
                    else finalize();
                    
                }

            });
            
        break;
    }
}

function exec(sql, callback) {

    switch(appConfig.db_type) {

        case 'sqlite':
        
            dbcon.run(sql, function(err) {
            
                if (err) cfn.logError(err);(err);
                
                if (callback)
                    callback(err);
            });
        break;
    }
}

function query(sql, callback) {

    switch(appConfig.db_type) {

        case 'sqlite':

            dbcon.all(sql, function(err, rows) {
                
                if (err) cfn.logError(err);(err);
                
                if (callback) {
                    callback(err, rows);
				}
            });
        break;
    }
}

function getMData(field, callback) {

    var sql = 'select * from ' + dbu.qTbl('mdata') + ' where mdField=' + dbu.qStr(field);
    
    query(sql, function(err, rows) {

        var re = '';
        
        if (!err && cfn.length(rows) > 0)
            re = rows[0].mdValue;

        if (callback)
            callback(re);
    });

}

function setMData(field, value, callback) {

    var sql = 'select * from ' + dbu.qTbl('mdata') + ' where mdField=' + dbu.qStr(field);

    query(sql, function(err, rows) {

        if (err) {
            if (callback) callback(err);
        }
        else {
                
            var sql = (cfn.length(rows) > 0) ?
                        'update ' + dbu.qTbl('mdata') + ' set ' +
                            ' mdValue=' + dbu.qStr(value) +
                            ' where mdField=' + dbu.qStr(field)
                    :
                        'insert into ' + dbu.qTbl('mdata') + 
							' ( ' +
							'mdField, ' +
							'mdValue '  +
							') values ( ' +
                            dbu.qStr(field) + ', ' +
                            dbu.qStr(value) + ')';

            exec(sql, function(err) {
                if (callback) callback(err);
            });
            
        }
    });
    
}

function createTable(tbl, callback) {
    
    exec(tbl.sql.replace('#name#', dbu.qTbl(tbl.name)), function(err) {
    
        if (!err && tbl.insert) {
            
            var insert_sql = tbl.insert.replace('#name#', dbu.qTbl(tbl.name))
                                        .replace(/#now#/g, cfn.dateNow());
            
            exec(insert_sql, function(err) {
                if (callback)
                    callback(err);
            });
        }
        else if (callback)
                callback(err);
    });
    
}

function dropTable(tbl, callback) {

    switch(appConfig.db_type) {

        case 'sqlite':
        
            exec('DROP TABLE IF EXISTS ' + dbu.qTbl(tbl), function(err) {
                if (callback)
                    callback(err);
            });
        break;
    }
    
}

function recreateTable(tbl, callback) {
    
    dropTable(tbl.name, function(err) {
        if (!err && tbl.sql) {
            createTable(tbl, function(err) {
                if (callback)
                    callback(err);
            });
        }
		else if (callback)
			callback(err);
    });
    
}
