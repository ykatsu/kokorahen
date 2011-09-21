//iPhoneのセッション消え対策

function PCookie(){}
PCookie.DB_NAME = "PCookie";
PCookie.DB_VER = "1.0";
PCookie.DB_SIZE = 8192;
PCookie.SQL_CREATE = "CREATE TABLE cookies (key TEXT PRIMARY KEY, value TEXT)";
PCookie.SQL_DROP   = "DROP TABLE cookies";
PCookie.SQL_SELECT = "SELECT * FROM cookies";
PCookie.SQL_DELETE = "DELETE FROM cookies";
PCookie.SQL_INSERT = "INSERT INTO cookies VALUES(?,?)";
PCookie.SQL_UPDATE = "UPDATE cookies SET value=? WHERE key=?";

PCookie.names = {
	JSESSIONID:true
};

PCookie.setNames = function(names) {
	PCookie.names = names;
}

PCookie.save = function() {
	if (! openDatabase) return;
		
	var db = openDatabase(PCookie.DB_NAME, PCookie.DB_VER,PCookie.DB_NAME,PCookie.DB_SIZE);
	db.transaction(function(tx){
		tx.executeSql(PCookie.SQL_DELETE, [],
			PCookie.onInsert, PCookie.onInit);
	});
}

PCookie.onInsert = function(tx) {
	var cookies = PCookie.getCookies();
	for (var key in cookies) {
        tx.executeSql(PCookie.SQL_INSERT, [key, cookies[key]],
        		PCookie.onNil, PCookie.onError); 
	}
}
PCookie.onInit = function(tx,err) {
    alert(err.message);
    tx.executeSql(PCookie.SQL_CREATE, [],
    		PCookie.onNil, PCookie.onError); 
    PCookie.onInsert(tx);
}

PCookie.load = function() {
	if (! openDatabase) return;
		
	var db = openDatabase(PCookie.DB_NAME, PCookie.DB_VER,PCookie.DB_NAME,PCookie.DB_SIZE);
	db.transaction(function(tx){
		tx.executeSql(PCookie.SQL_SELECT, [],
			PCookie.onSelect, PCookie.onError);
	});
}

PCookie.onSelect = function(tx, rs) {
	var cookies = PCookie.getCookies();
	for (var i=0; i<rs.rows.length; i++) {
		var row = rs.rows.item(i);
		console.log("===>"+row.key+"="+row.value);
		if (PCookie.names[row.key]) {
			console.log("==-----=>"+row.key+"="+row.value);
			cookies[row.key] = row.value;
		}
	}
	PCookie.putCookies(cookies);
}
PCookie.onError = function(tx, err) {
    alert(err.message);
}
PCookie.onNil = function(tx, err) {}


PCookie.getCookies = function() {
	var cookies = {};
	var parts = document.cookie.split(";");
	for (var i=0; i<parts.length; i++) {
		var kv = parts[i].split("=");
		var k = kv[0].replace(/^[ ]*/,"");
		cookies[k] = kv[1];
	}
	return cookies;
}

PCookie.putCookies = function(cookies) {
	var str = "";
	for (var key in cookies) {
		str += ";"+key+"="+cookies[key];
	}
	if (str != "") {
		document.cookie = str.substr(1)
	}
}

PCookie.setMaxAge = function(name, age) {
	var cookies = PCookie.getCookies();
	if (! cookies[name]) return;
	
	var date = new Date();
	date.setTime(date.getTime() + age*1000);
	document.cookie = name + "=" + cookies[name] 
		+ ";expires=" + date.toGMTString();
}

