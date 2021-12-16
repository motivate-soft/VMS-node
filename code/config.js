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

    // mysqldb: {
    //     host: "localhost", // 139.162.39.237
    //     port: 3306,
    //     user: "root", // dinhlong
    //     password: "", // stm32f
    //     database: "smartc"
    // },

    item_rpp: 30,
	
	
}
