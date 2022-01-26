var staticdao = require(appConfig.lib_path + '/db/dao/staticdao.js');
var gaco = require(appConfig.lib_path + '/gacobj.js');
var request = require('request');

var tcip = '';
var tcport = 5005;
var tcsport = 8082;
var tcemail = '';
var tcpassword = '';
var token = ''
var _interval = 120000 * 60;   			// **** 2 hours, (1000 * 60 * 60) * 2
var _initstart_interval = 3000;   	// **** 3 sec
var _running = false;
var _sleeping = false;
var _stopping = false;
var _firsttime = true;
var Traccar_Devices = [];
let static_data = [];

module.exports = {
    getStatus: getStatus
}

function getStatus(callback) {
    gaco.getGPSList( function(data, msg) {
        static_data = []
        Object.assign([], data).forEach(async (device, id_) => {
            var result = await calcActiveStatusForPGID(device)

            if (result == 'saved' && id_ === Object.assign([], data).length - 1)
            {
                callback(static_data)
            }
        });
    });
}

function calcActiveStatusForPGID(device) {
    return new Promise((resolve, reject) => {
        var curr_date = new Date();
        var year_date = new Date(curr_date.getFullYear(), 0, 1, 8, 0, 0);
        var month_ago = new Date(curr_date.getFullYear(), curr_date.getMonth(), 1, 8, 0, 0)
        var yesterday = new Date(curr_date.getFullYear(), curr_date.getMonth(), curr_date.getDate(), 8, 0, 0)

        year_date =  '' + year_date.getDate() + '/' + year_date.getMonth() + 1 + '/' + year_date.getFullYear()
        month_ago =  '' + month_ago.getDate() + '/' + month_ago.getMonth() + 1 + '/' + month_ago.getFullYear()
        yesterday =  '' + yesterday.getDate() + '/' + yesterday.getMonth() + 1 + '/' + yesterday.getFullYear()

        staticdao.getStaticForPGID({
            email: device['email'],
            fromdate: year_date,
        }, function(re) {
            const year_report = (re && parseInt(re['tc']) > 0) ? Math.floor(parseInt(re['ac']) / parseInt(re['tc']) * 1000) / 10: 0

            staticdao.getStaticForPGID({
                email: device['email'],
                fromdate: month_ago,
            }, function(re_) {
                const month_report = (re_ && parseInt(re_['tc']) > 0) ? Math.floor(parseInt(re_['ac']) / parseInt(re_['tc']) * 1000) / 10 : 0

                staticdao.getStaticForPGID({
                    email: device['email'],
                    fromdate: yesterday,
                }, async function(re__) {
                    const date_report = (re__ && parseInt(re__['tc']) > 0) ? Math.floor(parseInt(re__['ac']) / parseInt(re__['tc']) * 1000) / 10 : 0

                    static_data.push({
                        id: device['id'],
                        name: device['name'],
                        uniqueId: device['pgid_origin'],
                        oneDay: date_report,
                        oneMonth: month_report,
                        oneYear: year_report
                    })

                  //  if (device['pgid'] && device['pgid'] != '') {
                        staticdao.getStaticForGSM({
                            email: device['email'],
                            fromdate: year_date,
                        }, function(re) {
                            const year_report = (re && parseInt(re['tc']) > 0) ? Math.floor(parseInt(re['ac']) / parseInt(re['tc']) * 1000) / 10: 0
                
                            staticdao.getStaticForGSM({
                                email: device['email'],
                                fromdate: month_ago,
                            }, function(re_) {
                                const month_report = (re_ && parseInt(re_['tc']) > 0) ? Math.floor(parseInt(re_['ac']) / parseInt(re_['tc']) * 1000) / 10 : 0
                
                                staticdao.getStaticForGSM({
                                    email: device['email'],
                                    fromdate: yesterday,
                                }, function(re__) {
                                    const date_report = (re__ && parseInt(re__['tc']) > 0) ? Math.floor(parseInt(re__['ac']) / parseInt(re__['tc']) * 1000) / 10 : 0
                                    
                                    if (device['pgid'] && device['pgid'] != '') {
                                        static_data.push({
                                            id: device['id'],
                                            name: device['name'],
                                            uniqueId: device['pgid'],
                                            oneDay: date_report,
                                            oneMonth: month_report,
                                            oneYear: year_report
                                        })
                                    }
                                    resolve('saved')
                                    
                                })
                                
                            })
                            
                        })
                    //} 
                    
                })
                
            })
            
        })
    })
}