

var JSRPC = {};

JSRPC.toParams = function(args, offset) {
	var params = [];
	for (var i=offset; i<args.length; i++) {
		params.push(args[i]);
	}
	return params;
};

JSRPC.error = function(callback, msg) {
	if (callback == null || callback.fail == null) {
		alert(msg);
	} else {
		callback.fail(msg);
	}
	throw msg;
}

JSRPC.call = function(url, mname, args) {
	var xreq = new XMLHttpRequest();
	xreq.open("POST", url, false);
	xreq.setRequestHeader("Content-Type", "application/json;charset=utf-8");
	xreq.send(JSON.stringify({method:mname, params:JSRPC.toParams(args,0)}));
	if (xreq.status/100 != 2) throw xreq.responseText;
	var res = JSON.parse(xreq.responseText);
	if (res.error) throw res.error;
	return res.result;
};

JSRPC.callAsync = function(url, mname, args) {
	var callback = args[0];
	var xreq = new XMLHttpRequest();
	xreq.open("POST", url, true);
	xreq.setRequestHeader("Content-Type", "application/json;charset=utf-8");
	xreq.onreadystatechange = function (ev) {
		if (xreq.readyState == 4) {
			if(xreq.status == 200) {
				setTimeout(function(){
				 try{
					var res = JSON.parse(xreq.responseText);
					if (res.error) JSRPC.error(callback, res.error);
					if (callback.success) {
						callback.success(res.result, args);
					} else {
						callback(res.result);
					}
				 }catch(err){JSRPC.error(callback, err);}
				},10);
			} else {
				JSRPC.error(callback, "Status:"+xreq.status+"\n"+xreq.responseText);
			}
		}
	}
	xreq.send(JSON.stringify({method:mname, params:JSRPC.toParams(args,1)}));
};

