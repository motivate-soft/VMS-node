module.exports = {
    
    lib_path: __dirname + '/lib',
    db_path: __dirname + '/db',
    log_path: __dirname + '/logs',
    controller_path: __dirname + '/controllers',
    public_path: __dirname + '/public',
    views_path: __dirname + '/views',
    service_path: __dirname + '/services',
    
    mod_file: __dirname + '/mod.xml',

    db_type: 'sqlite',
    db_host: '',
    db_name: 'lemvc.db',
    db_user: '',
    db_pass: '',
    
    sess_timeout: 0, //(60000*30),

    def_homepage: '/home',
    
    tpl: {
        title: 'VMS Config',
        copyright: 'Copyright & Copy; 2016 Fraser Technologies Sdn Bhd',
    },

    item_rpp: 30,
	
	
}
