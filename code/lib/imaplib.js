var Imap = require('imap');
var inspect = require('util').inspect;

module.exports = {
	fetch: fetch,
}

function fetch(opt, callback) {

    var imap = new Imap({
        user: opt.email,
        password: opt.password,
        host: opt.host,
        port: opt.port,
        tls: opt.tls,
    });
    
	var re = {
				uid: null,
				body: null,
				date: null,
			};
	
    imap.once('ready', function() {
        imap.openBox('INBOX', true, function openInbox(err, box) {
			if (err) {
				cfn.logError(err);
			}
			else {
				//var f = imap.seq.fetch(opt.uid, { bodies: ['HEADER.FIELDS (FROM)','TEXT'] });
				var f = imap.seq.fetch('1', { bodies: ['HEADER.FIELDS (FROM)','TEXT'] });
				
				f.on('message', function(msg, seqno) {

					var content = '';
					msg.on('body', function(stream, info) {
					
						var buffer = Buffer.from('')
						stream.on('data', function(chunk) {
							if (info.which === 'TEXT') 
								buffer = Buffer.concat([buffer, chunk]);;
						});
						stream.once('end', function() {
							if (info.which === 'TEXT') 
								re.body = buffer;
						});
					});
					msg.once('attributes', function(attrs) {
						re.uid = attrs.uid;
						re.date = attrs.date;
					});
				});
				
				f.once('error', function(err) {
					cfn.logError(err);
				});
				
				f.once('end', function() {
					imap.end();
				});
			}
		});
    });

    imap.once('error', function(err) {
        cfn.logError({message: 'Imap Error! [User: ' + opt.email + ', UID: ' + opt.uid + ']'});
        callback(err, re);
    });

    imap.once('end', function() {
		imap.destroy();
        callback(null, re);
    });

    imap.connect();

}

