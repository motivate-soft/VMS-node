var util = require('util');
var sesdao = require(appConfig.lib_path + '/db/dao/sesdao.js');
var authdao = require(appConfig.lib_path + '/db/dao/authdao.js');

var _modules,
    _auth;

module.exports = {
	parse: parse,
	parseResultXML: parseResultXML,
    getModules: getModules,
    getModule: getModule,
	initAuth: initAuth,
	getGouAuth: getGouAuth,
	getCrnAuth: getCrnAuth,
}

function parse(obj, callback) {

    try {
        
        _modules = [];
		var chlds = obj.root.children;
		
        for (var i=0; i < chlds.length; i++) {

            var act = [];
            var sub = [];
            if (chlds[i].children) {
                
                for (var j=0; j < chlds[i].children.length; j++) {
                
                    if (chlds[i].children[j].name == 'action') {
                        act.push({
                                    name: chlds[i].children[j].attributes.name,
                                    xid: chlds[i].children[j].attributes.xid,
                                });
                    }
                    else if (chlds[i].children[j].name == 'sub') {
						
						var subchlds = chlds[i].children[j].children;
						var subact = [];
						
						if (subchlds) {
							
							for (var k=0; k < subchlds.length; k++) {
							
								if (subchlds[k].name == 'action') {
									subact.push({
												name: subchlds[k].attributes.name,
												xid: subchlds[k].attributes.xid,
											});
								}
							}
						}
						
                        sub.push({
									name: chlds[i].children[j].attributes.name,
									path: chlds[i].children[j].attributes.path,
									xid: chlds[i].children[j].attributes.xid,
									image: chlds[i].children[j].attributes.image,
									action: subact,
                                });
					}
					
                }
            }
            
            _modules.push({
                            name: chlds[i].attributes.name,
                            path: chlds[i].attributes.path,
                            xid: chlds[i].attributes.xid,
                            image: chlds[i].attributes.image,
                            action: act,
                            sub: sub,
                        });
		}
        
        callback();
        
    } catch(err) {
        cfn.logError(err, true);
    }
}

function parseResultXML(obj, callback) {

    try {
		var chlds = obj.root.children;

		var esn_number,
			unixTime,
			gps,
			messageId,
			timeStamp,
			payloadLength,
			payloadSource,
			payloadEncoding,
			payloadValue
		
			messageId = obj.root.attributes.messageID;
			timeStamp = obj.root.attributes.timeStamp;

        for (var i=0; i < chlds.length; i++) {
            if (chlds[i].children) {
                
                for (var j=0; j < chlds[i].children.length; j++) {
                
                    if (chlds[i].children[j].name == 'esn') {
						esn_number = chlds[i].children[j].content;
                    }
                    else if (chlds[i].children[j].name == 'unixTime') {
						unixTime = chlds[i].children[j].content
					}
					else if (chlds[i].children[j].name == 'gps') {
						gps = chlds[i].children[j].content;
					}
					else if (chlds[i].children[j].name == 'payload') {
						payloadLength = chlds[i].children[j].attributes.length;
						payloadSource = chlds[i].children[j].attributes.source;
						payloadEncoding = chlds[i].children[j].attributes.encoding;
						payloadValue = chlds[i].children[j].content;
					}
					
                }
            }
		}

		var result = {
			messageId: messageId,
			timeStamp: timeStamp,
			esn: esn_number,
			unixTime: unixTime,
			gps: gps,
			payloadLength: payloadLength,
			payloadSource: payloadSource,
			payloadEncoding: payloadEncoding,
			payloadValue: payloadValue
		};
        
        callback(result);
        
    } catch(err) {
        cfn.logError(err, true);
    }
}

function getModules() {

    return _modules;
}

function getModule(mod) {

	for (var i in _modules) {
	
		var parent = cfn.hashConcat([ _modules[i] ]);
	
		if (_modules[i].xid == mod) {
		
			return parent;
		}
		else {

			for (var j in _modules[i].sub) {

				if (_modules[i].sub[j].xid == mod) {

					parent.sub = [];
					var re = cfn.hashConcat([ _modules[i].sub[j], {sub: []}, {parent: parent} ]);
					delete re.parent.parent;
					delete re.parent.sub;
					
					return re;
				}
			}

		}
		
	}
}

function initAuth(gouidx, callback) {

    _auth = {};

	getGouAuth(gouidx, function(err, data) {
	
		if (!err && typeof data == 'String' && data != '') {
		
			_auth = cfn.parseJSON(strdata);
			callback(null);
		}
		else callback(err);
	});
}

function getGouAuth(gouidx, callback) {

	gauo.getUserGroup(gouidx, function(grpidx) {
	
		if (grpidx == -1) 
			callback({message: 'Invalid group index!'}, null);
		else {
		
			var re = '';
			
			authdao.get(grpidx, function(err, rows) {
				
				if (err)
					callback(err, null);
				else {
					if (cfn.length(rows) > 0 && rows[0].data != '')
						re = rows[0].data;
						
					authdao.get(gouidx, function(err, rows) {
						
						if (err)
							callback(err, null);
						else {
							if (cfn.length(rows) > 0 && rows[0].data != '')
								re = rows[0].data;

							callback(null, re);
						}
					});
						
				}
				
			});
		
		}
	});
}

function getCrnAuth() {

	return _auth;
}
