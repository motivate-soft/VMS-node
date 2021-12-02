var util = require('util');
var fs = require('fs');

var _lasterror = '',
	_currentmod = '',
	_currentusername = '';

module.exports = {
	addModuleRoute: addModuleRoute,
    sessionValid: sessionValid,
	sessionCheck: sessionCheck,
    getLastError: getLastError,
    getPageOffset: getPageOffset,
	setCurrentMod: setCurrentMod,
	getCurrentMod: getCurrentMod,
    overall_output: overall_output,
	modules_list: modules_list,
	getPageNum: getPageNum,
}

function addModuleRoute(app) {

	var modules = moda.getModules();
	
	for (var i in modules) {

        if (modules[i].xid != 'home' && modules[i].xid != 'login' && modules[i].xid != 'logout') {
          
            try {
                if (fs.statSync(appConfig.controller_path + modules[i].path + '.js')) {
                    app.use(modules[i].path, require(appConfig.controller_path + modules[i].path));
                }
            }
            catch (e) {
                    cfn.logError({message: 'Error loading module: ' + modules[i].xid}, false);
                cfn.logError(e, true);
            }
        }

        if (cfn.length(modules[i].sub) > 0) {
        
            for (var j in modules[i].sub) {
                try {
                    if (fs.statSync(appConfig.controller_path + modules[i].path + modules[i].sub[j].path + '.js')) {
                        app.use(modules[i].sub[j].path, require(appConfig.controller_path + modules[i].path + modules[i].sub[j].path));
                    }
                }
                catch (e) {
                    cfn.logError({message: 'Error loading module: ' + modules[i].sub[j].xid}, false);
                    cfn.logError(e, true);
                }
            }
        }
        
	}
}

function sessionValid(req, res, callback) {

	var sess = req.session;

    seso.check(req.session.id, function(err) {
        if (err) {
            _lasterror = err.message;
            res.redirect('/login');
        }
        else {
			gauo.getUsername(seso.getUserIdx(), function(username) {
				_currentusername = username;
				callback();
			});
		}
    });
}

function sessionCheck(req, res, callback) {

	var sess = req.session;

    seso.check(req.session.id, function(err) {
        if (err) {
            res.send('Session Expired');
        }
        else {
			callback();
		}
    });
}

function getLastError() {
    
    var err = _lasterror;
    _lasterror = '';
    
    return err;
}

function getPageOffset(page) {

	var offset = -1;
	var length = -1;

	if (page != -1) {
    
		offset = ((page - 1) * appConfig.item_rpp);
		length = appConfig.item_rpp;
	}
    
    return {offset: offset, length: length};
    
}

function setCurrentMod(mod) {
	
	_currentmod = moda.getModule(mod);
}

function getCurrentMod() {

	return _currentmod;
}

function overall_output() {

	var topnav = [];
	var subnav = [];
	
	var modules = moda.getModules();
	
	for (var i in modules) {
	
		topnav.push({
					name: modules[i].name,
					link: modules[i].path,
					image: modules[i].image,
					xid: modules[i].xid,
				});
				
		if (_currentmod.parent && _currentmod.parent.xid == modules[i].xid) {
			for (var j in modules[i].sub) {
			
				subnav.push({
							name: modules[i].sub[j].name,
							link: modules[i].sub[j].path,
							image: modules[i].sub[j].image,
							xid: modules[i].sub[j].xid,
						});
			}
		}
	}

	var re = {
				metatitle: appConfig.tpl.title,
				copyright: appConfig.tpl.copyright,
				kpss: appConfig.kpss,
				kpss_interval: appConfig.kpss_interval,
				mod: _currentmod,
				topnav: topnav,
				subnav: subnav,
				username: _currentusername,
			};
	
    return re;
}

function modules_list() {

	var modules = moda.getModules();
	var modlist = [];
	
	for (var i in modules) {
	
		var sublist = [];
		
		if ((_currentmod.xid == 'home' || modules[i].xid == _currentmod.xid) && modules[i].xid != 'home') {
		
			if (cfn.length(modules[i].sub) > 0) {

				for (var j in modules[i].sub) {
					sublist.push({
								name: modules[i].sub[j].name,
								link: modules[i].sub[j].path,
								image: modules[i].sub[j].image,
								xid: modules[i].sub[j].xid,
							});
				}
			}
			
			modlist.push({
							name: modules[i].name,
							link: modules[i].path,
							image: modules[i].image,
							xid: modules[i].xid,
							sublist: sublist,
						});
		}
	}

	var re = {modlist: modlist};
	
    return re;
	
}

function getPageNum(page, tolrecord) {

	var pages = [];
	var maxpage = 10;

	if (tolrecord <= appConfig.item_rpp) {
		
		pages.push({
					page: '1',
					css: 'act',
					pagestr: '1',
					spacing: '',
				});
	}
	else {
	
		var tolpage = Math.ceil(tolrecord / (appConfig.item_rpp));
		var pageinc = (Math.ceil(page / maxpage) - 1) * maxpage;

		var startpage = pageinc + 1;
		var endpage = pageinc + maxpage;

		if (page == startpage && startpage > 1) {
			startpage--;
			endpage--;
		}    
		else if (page == endpage && endpage < tolpage) {
			startpage++;
			endpage++;
		}    

		if (page != 1) {
			pages.push({
							page: (page - 1),
							css: '',
							pagestr: 'Previous',
							spacing: '&nbsp;&nbsp;',
						});	
		}

		for (i = startpage; i <= endpage; i++) {

			pages.push({
							page: i,
							css: (i == page) ? 'act': '',
							pagestr: i,
							spacing: '&nbsp;&nbsp;',
						});	
		
			if (i == tolpage) break;
		}

		if (page < tolpage) {
			pages.push({
							page: (page + 1),
							css: '',
							pagestr: 'Next',
							spacing: '',
						});	
		}

	}
	
	return pages;
}

