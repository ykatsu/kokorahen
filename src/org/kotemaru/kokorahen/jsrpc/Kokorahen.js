

var Kokorahen = {};

Kokorahen.__makeUrl = function(mname, args, offset) {
	var url = "/classes/org/kotemaru/kokorahen/jsrpc/Kokorahen."+mname;
	for (var i=offset; i<args.length; i++) {
		url += (i==offset ? '?' : '&');
		var n = i-offset;
		if (typeof args[i] == "object") {
			url += "a"+n+"="+encodeURI(JSON.stringify(args[i]));
		} else {
			url += "a"+n+"="+encodeURI(args[i]);
		}
	}
	return url;
};

Kokorahen.__call = function(mname, args) {
	var url = Kokorahen.__makeUrl(mname, args, 0);
	var xreq = new XMLHttpRequest();
	xreq.open("GET", url, false);
	xreq.send();
	if (xreq.status/100 != 2) throw xreq.responseText;
	var res = JSON.parse(xreq.responseText);
	if (res.error) RPJS.errorHandler(res.error);
	return res.result;
};

Kokorahen.__callAsync = function(mname, args) {
	var callback = args[0];
	var url = Kokorahen.__makeUrl(mname, args, 1);
	var xreq = new XMLHttpRequest();
	xreq.open("GET", url, true);
	xreq.onreadystatechange = function (ev) {
		if (xreq.readyState == 4) {
			if(xreq.status == 200) {
				setTimeout(function(){
				 try{
					var res = JSON.parse(xreq.responseText);
					if (res.error) RPJS.errorHandler(res.error,callback);
					callback.send(res.result);
 				 }catch(err){callback._throw(err);}
				},10);
			} else {
				callback._throw(err);
			}
		}
	}
	xreq.send();
};


Kokorahen.getAreas = function(params){
	return Kokorahen.__call("getAreas", arguments);
}
Kokorahen.getAreasAsync = function(_callback ,params){
	return Kokorahen.__callAsync("getAreas", arguments);
}
Kokorahen.getImage = function(id){
	return Kokorahen.__call("getImage", arguments);
}
Kokorahen.getImageAsync = function(_callback ,id){
	return Kokorahen.__callAsync("getImage", arguments);
}
Kokorahen.listMemo = function(params){
	return Kokorahen.__call("listMemo", arguments);
}
Kokorahen.listMemoAsync = function(_callback ,params){
	return Kokorahen.__callAsync("listMemo", arguments);
}
Kokorahen.listSpot = function(params){
	return Kokorahen.__call("listSpot", arguments);
}
Kokorahen.listSpotAsync = function(_callback ,params){
	return Kokorahen.__callAsync("listSpot", arguments);
}
Kokorahen.writeImage = function(params){
	return Kokorahen.__call("writeImage", arguments);
}
Kokorahen.writeImageAsync = function(_callback ,params){
	return Kokorahen.__callAsync("writeImage", arguments);
}
Kokorahen.writeMemo = function(map){
	return Kokorahen.__call("writeMemo", arguments);
}
Kokorahen.writeMemoAsync = function(_callback ,map){
	return Kokorahen.__callAsync("writeMemo", arguments);
}
Kokorahen.writeSpot = function(map){
	return Kokorahen.__call("writeSpot", arguments);
}
Kokorahen.writeSpotAsync = function(_callback ,map){
	return Kokorahen.__callAsync("writeSpot", arguments);
}
