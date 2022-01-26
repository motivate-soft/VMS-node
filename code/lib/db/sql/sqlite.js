module.exports = {
        mdata: {
                name : 'mdata',
                drop: 0,
                sql : 'CREATE TABLE #name# (' +
                        'mdIdx      INTEGER, ' +
                        'mdField    TEXT DEFAULT NULL, ' +
                        'mdValue    TEXT DEFAULT NULL, ' +
                        'mdRef      TEXT DEFAULT NULL, ' +
                        'PRIMARY KEY (mdIdx)' +
                        ');',
                insert: '',
                },
                
        group: {
                name : 'group',
                drop: 0,
                sql : 'CREATE TABLE #name# (' +
                        'grpIdx 		INTEGER, ' +
                        'grpName 		TEXT NOT NULL, ' +
                        'grpType		INTEGER NOT NULL, ' +		// reserved
                        'grpDateCreated INTEGER NOT NULL, ' +
                        'grpXID	        TEXT DEFAULT NULL, ' +		// reserved
                        'grpDesc        TEXT DEFAULT NULL, ' +
                        'grpSuspend 	INTEGER NOT NULL DEFAULT "0", ' +
                        'PRIMARY KEY (grpIdx) ' +
                        ');',
                insert : 'INSERT INTO #name# VALUES ' +
                        ' (1, "Administrators", 0, #now#, "", "", 0) '
                },
                
        user: {
                name : 'user',
                drop: 0,
                sql : 'CREATE TABLE #name# (' +
                        'usrIdx 		INTEGER, ' +
                        'usrName 		TEXT NOT NULL, ' +
                        'usrPassword    TEXT NOT NULL, ' +
                        'usrType		INTEGER NOT NULL, ' +		// reserved
                        'usrGrpIdx      INTEGER NOT NULL, ' +
                        'usrDateCreated INTEGER NOT NULL, ' +
                        'usrXID	        TEXT DEFAULT NULL, ' +		// reserved
                        'usrFullname    TEXT DEFAULT NULL, ' +
                        'usrEmail       TEXT DEFAULT NULL, ' +
                        'usrContactNo1  TEXT DEFAULT NULL, ' +
                        'usrContactNo2  TEXT DEFAULT NULL, ' +
                        'usrDesc        TEXT DEFAULT NULL, ' +
                        'usrSuspend 	INTEGER NOT NULL DEFAULT "0", ' +
                        'PRIMARY KEY (usrIdx) ' +
                        ');',
                insert : 'insert into #name# values ' +
                        ' (1, "admin", "21232f297a57a5a743894a0e4a801fc3", 0, 1, #now#, "", "admin", "admin@hostname.com", "", "", "", 0) '
                },
                
        session: {
                name : 'session',
                drop: 0,
                sql : 'CREATE TABLE #name# (' +
                        'sesIdx         INTEGER, ' +
                        'sesSid         TEXT NOT NULL, ' +
                        'sesUserIdx     INTEGER NOT NULL, ' +
                        'sesDateCreated INTEGER NOT NULL DEFAULT "0", ' +
                        'sesLastUpdated INTEGER NOT NULL DEFAULT "0", ' +
                        'sesClientIP    TEXT NOT NULL, ' +
                        'PRIMARY KEY (sesIdx)' +
                        ');',
                insert: '',
                },
                                
        auth: {
                name : 'auth',
                drop: 0,
                sql : 'CREATE TABLE #name# (' +
                        'authGouIdx 	INTEGER, ' +
                        'authGouType 	INTEGER, ' +		// 0 = group, 1 = user
                        'authData    	TEXT NOT NULL, ' +
                        'PRIMARY KEY (authGouIdx) ' +
                        ');',
                insert : '',
                },

        gpsacc: {
                name : 'gpsacc',
                drop: 0,
                sql : 'CREATE TABLE #name# (' +
                        'gacIdx 		INTEGER, ' +
                        'gacName 		TEXT NOT NULL, ' +
                        'gacType		INTEGER NOT NULL, ' +		// reserved
                        'gacDateCreated INTEGER NOT NULL, ' +
                        'gacXID	        TEXT DEFAULT NULL, ' +		// reserved
                        'gacPGID	    TEXT DEFAULT NULL, ' +
                        'gacEmail		TEXT DEFAULT NULL, ' +
                        'gacPassword	TEXT NOT NULL, ' +
                        'gacHost		TEXT NOT NULL, ' +
                        'gacPort		TEXT NOT NULL, ' +
                        'gacTLS			INTEGER NOT NULL,' +
                        'gacDesc		TEXT DEFAULT NULL, ' +
                        'gacSuspend 	INTEGER NOT NULL DEFAULT "0", ' +
                        'PRIMARY KEY (gacIdx) ' +
                        ');',
                insert : '',
                },

        emaillog: {
                name : 'emaillog',
                drop: 0,
                sql : 'CREATE TABLE #name# (' +
                        'elgIdx 		INTEGER, ' +
                        'elgEmail		TEXT NOT NULL, ' +
                        'elgUID 		TEXT NOT NULL, ' +
                        'elgDate 		INTEGER NOT NULL, ' +
                        'elgEmailDate   INTEGER NOT NULL, ' +
                        'elgEmailData 	TEXT NOT NULL, ' +
                        'elgGPSData		TEXT DEFAULT NULL, ' +
                        'elgVMS_sent 	INTEGER NOT NULL DEFAULT 0, ' +
                        'elgGPS_sent 	INTEGER NOT NULL DEFAULT 0, ' +
                        'elgRemark		TEXT DEFAULT NULL, ' +
                        'elgType	INTEGER DEFAULT 0, ' +
                        'PRIMARY KEY (elgIdx) ' +
                        ');',
                insert : '',
                },

        /*eventcode: {
                name : 'eventcode',
                drop: 0,
                sql : 'CREATE TABLE #name# (' +
                        'evcIdx 		INTEGER, ' +
                        'evcEmail		TEXT NOT NULL, ' +
                        'evcPower 		INTEGER NOT NULL, ' +
                        'evcAlmCode   	INTEGER NOT NULL, ' +
                        'evcTamper 		INTEGER DEFAULT 0, ' +
                        'algRTNDate 	INTEGER DEFAULT NULL, ' +
                        'PRIMARY KEY (algIdx) ' +
                        ');',
                insert : '',
                },
				
        /*alarmlog: {
                name : 'alarmlog',
                drop: 0,
                sql : 'CREATE TABLE #name# (' +
                        'algIdx 		INTEGER, ' +
                        'algEmail		TEXT NOT NULL, ' +
                        'algDate 		INTEGER NOT NULL, ' +
                        'algAlmCode   	INTEGER NOT NULL, ' +
                        'algRTN 		INTEGER DEFAULT 0, ' +
                        'algRTNDate 	INTEGER DEFAULT NULL, ' +
                        'PRIMARY KEY (algIdx) ' +
                        ');',
                insert : '',
                },*/
                
        /*emaillog2: {
                name : 'emaillog2',
                drop: 0,
                sql : 'CREATE TABLE #name# (' +
                        'elgIdx 		INTEGER, ' +
                        'elgEmail		TEXT NOT NULL, ' +
                        'elgUID 		INTEGER NOT NULL, ' +
                        'elgDate 		INTEGER NOT NULL, ' +
                        'elgEmailDate   INTEGER NOT NULL, ' +
                        'elgEmailData 	TEXT NOT NULL, ' +
                        'elgGPSData		TEXT DEFAULT NULL, ' +
                        'elgVMS_sent 	INTEGER NOT NULL DEFAULT 0, ' +
                        'elgGPS_sent 	INTEGER NOT NULL DEFAULT 0, ' +
                        'elgRemark		TEXT DEFAULT NULL, ' +
                        'PRIMARY KEY (elgIdx) ' +
                        ');',
                insert : '',
                },*/
                
}

