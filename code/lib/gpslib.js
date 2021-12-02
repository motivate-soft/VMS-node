var BitArray = require('node-bitarray');

module.exports = {
	convData: convData,
	pushData: pushData,
}

function convData(buf, callback) {

	var bytes = [];
	var re = {};
	
	try {
	
		for (i = 0; i < buf.length; i++) 
			bytes[i] = BitArray.parse(buf[i],['asOctet']);
		console.log(buf);
		//console.log(bytes);

		var day = BitArray.toNumber([bytes[0][7], bytes[0][6], bytes[0][5], bytes[0][4], bytes[0][3]]);
		var mon = BitArray.toNumber([bytes[0][2], bytes[0][1], bytes[1][2], bytes[1][1]]);
		var hour = BitArray.toNumber([bytes[1][7], bytes[1][6], bytes[1][5], bytes[1][4], bytes[1][3]]);
		var year = BitArray.toNumber([bytes[2][7], bytes[2][6], bytes[2][5], bytes[2][4], bytes[2][3], bytes[2][2], bytes[2][1]]);
		var min = BitArray.toNumber([bytes[3][7], bytes[3][6], bytes[3][5], bytes[3][4], bytes[3][3], bytes[3][2]]);
		var sec = BitArray.toNumber([bytes[4][7], bytes[4][6], bytes[4][5], bytes[4][4], bytes[4][3]]);
		var validity = bytes[4][1];
		var latdeg = BitArray.toNumber([bytes[5][7], bytes[5][6], bytes[5][5], bytes[5][4], bytes[5][3], bytes[5][2], bytes[5][1]]);
		var latmin = BitArray.toNumber([bytes[6][7], bytes[6][6], bytes[6][5], bytes[6][4], bytes[6][3], bytes[6][2]]);
		var NS = bytes[6][1];
		var latdotmin = BitArray.toNumber([bytes[8][7], bytes[8][6], bytes[8][5], bytes[8][4], bytes[8][3], bytes[8][2], bytes[8][1],
													bytes[7][7], bytes[7][6], bytes[7][5], bytes[7][4], bytes[7][3], bytes[7][2], bytes[7][1]]);
		var longdeg = BitArray.toNumber([bytes[9][7], bytes[9][6], bytes[9][5], bytes[9][4], bytes[9][3], bytes[9][2], bytes[9][1], bytes[15][3]]);
		var longmin = BitArray.toNumber([bytes[10][7], bytes[10][6], bytes[10][5], bytes[10][4], bytes[10][3], bytes[10][2]]);
		var EW = bytes[10][1];
		var longdotmin = BitArray.toNumber([bytes[12][7], bytes[12][6], bytes[12][5], bytes[12][4], bytes[12][3], bytes[12][2], bytes[12][1],
													bytes[11][7], bytes[11][6], bytes[11][5], bytes[11][4], bytes[11][3], bytes[11][2], bytes[11][1]]);
		var speed = BitArray.toNumber([bytes[13][7], bytes[13][6], bytes[13][5], bytes[13][4], bytes[13][3], bytes[13][2], bytes[13][1], bytes[15][7], bytes[15][6]]);
		var heading = BitArray.toNumber([bytes[14][7], bytes[14][6], bytes[14][5], bytes[14][4], bytes[14][3], bytes[14][2], bytes[14][1], bytes[15][5], bytes[15][4]]);
		var input_supply = bytes[15][1];
		var temper_longitude = bytes[15][2];
				
		var gTime = cfn.addZero(hour, 2) + cfn.addZero(min, 2) + cfn.addZero(sec, 2);
		var gDate = cfn.addZero(day, 2) + cfn.addZero(mon, 2) + cfn.addZero(year, 2);
		var gLat = cfn.addZero(latdeg, 2) + cfn.addZero(latmin, 2) + '.' + cfn.strVal(latdotmin);
		var gLong = cfn.addZero(longdeg, 2) + cfn.addZero(longmin, 2) + '.' + cfn.strVal(longdotmin);
		var gNS = (NS == 1) ? 'N': 'S';
		var gEW = (EW == 1) ? 'E': 'W';				
		
		re = {
				date: gDate,
				time: gTime,
				latitude: gLat,
				NS: gNS,
				longitude: gLong,
				EW: gEW,
				speed: speed,
				heading: heading,
				validity: validity,
				input_supply: input_supply,
				temper_longitude: temper_longitude,
				
			};

		//console.log(re);
		
	} catch(err) {
		callback(err.message, null);
		return;
	}

	callback(null, re);
	
}

function pushData(data, callback) {
	//console.log(data);
	dbo.getMData('traccar', function(re) {
	
		var tcinfo = cfn.parseJSON(re);
		var ip = tcinfo.ip;
		var port = tcinfo.port;
		//console.log(ip + ':'+port);
		
		if (ip != '' && port != '') {

			var net = require('net');
			var client = new net.Socket();
	
			client.connect(port, ip, function() {
				client.write('$PGID,' + data.pgid + '*0F\r\n');
				client.write('$GPRMC,' + data.time + 
										',A,' +
										data.latitude + ',' + 
										data.NS + ',' +
										data.longitude + ','+ 
										data.EW + ',' +
										'000.0' + ',' +
										'000.0' + ',' + 
										data.date + ',' +
										'010,3,E ' + '*68\r\n');
				client.write('\r\n');
			});

			client.on('error', function(err) {
			  cfn.logError(err);
			  if (callback) callback(err);
			});
			
			client.on('data', function(data) {
				//console.log('Received: ' + data);
			});

			client.on('close', function() {
				//console.log('Connection closed');
				client.destroy();
			});	
			
		}
		else {
			var err = {message: ' Invalid Traccar IP or port [IP:' + ip + ', port: ' + port + ']'};
			cfn.logError(err);
			if (callback) callback(err);
		}
	});
}
