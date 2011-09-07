
//-------------------------------------------------------------------
//Util
function Util() {}
Util.navbar = null;

Util.init = function() {
	Util.navbar = $("#navbar")[0];
	Util.setNavbar(Map.ID);
	$("#navbar a").live('click', function(){
		$("a",Util.navbar).removeClass("ui-btn-active");
		$(this).addClass("ui-btn-active");
	})
}
Util.setNavbar = function(id) {
	// TODO: JQMがβのせいかFooterの共有が出来ないので自前で対処。
	$(id).find("[data-role='footer']").append(Util.navbar);
	$.mobile.silentScroll(0);
}

Util.changePage = function(id) {
	$.mobile.pageLoading();
	setTimeout(function(){
		//jqt.goTo(Spot.ID, "slideleft");
		$.mobile.changePage(id, "slide");
	},100);
}
Util.backPage = function() {
	$.mobile.pageLoading();
	setTimeout(function(){
		history.back();
	},100);
}
Util.dialog = function(id) {
	$.mobile.pageLoading();
	Util.dialogOwner = $.mobile.activePage[0];
	Util.currentScrollTop = $(document.body).scrollTop()
	setTimeout(function(){
		$.mobile.changePage(id, "pop");
	},100);
}
Util.dialogFinally = function(id) {
	if (Util.dialogOwner == $.mobile.activePage[0]) {
		$.mobile.silentScroll(Util.currentScrollTop);
	}
	Util.dialogOwner = null;
}


Util.getAreas = function(minLat, minLng, maxLat, maxLng){
	var list = [];

	var mode = 100; // 1Km
	var len = 6;
	var w = maxLng - minLng;
	if (w > 0.05) { // >5Km
		mode = 10; // 10Km
		len = 5;
	} else if (w < 0.004) { // <400m
		mode = 1000; // <100m
		len = 7;
	}
	if (w < 0.0009) { // <90m
		mode = 10000; // <10m
		len = 8;
	}
	if (w > 0.5) { // >50Km
		mode = 1; // 100Km
		len = 3;
	}
//console.log("====>"+w+":"+len);
	minLat = Math.floor(minLat*mode);
	minLng = Math.floor(minLng*mode);
	maxLat = Math.floor(maxLat*mode);
	maxLng = Math.floor(maxLng*mode);

	for (var lat = minLat; lat<=maxLat; lat+=1) {
		for (var lng = minLng; lng<=maxLng; lng+=1) {
			var area =
				Util.toZeroPrefix((lat/mode),len)+","+
				Util.toZeroPrefix((lng/mode),len);
			list.push(area);
			if (list.length>100) return list;
		}
	}
	return list;
}
Util.toZeroPrefix = function(val, len) {
	var str = "00"+ val;
	var idx = str.indexOf(".");
	if (idx == -1) {
		str += ".0000000";
		idx = str.indexOf(".");
	} else {
		str += "0000000";
	}
	return str.substr(idx-3,len);
}
Util.eventBreaker = function(ev) {
	if (ev == undefined) return;
	if (ev.stopPropagation) ev.stopPropagation();
	if (ev.stopPropagation) ev.preventDefault();
	return false;
}
