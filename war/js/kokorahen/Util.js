
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

Util.AREA_RANGE = [
	{width:5.0,    mode:1,      len:3}, // 100Km
	{width:0.5,    mode:10,     len:5}, // 10Km
	{width:0.05,   mode:100,    len:6}, // 1Km
	{width:0.004,  mode:1000,   len:7}, // 100m
	{width:0.0005, mode:10000,  len:8}  // 10m
];

Util.getAreasOld = function(minLat, minLng, maxLat, maxLng){
	var w = maxLng - minLng;
	var range = 0;

	for (var i=1; i<Util.AREA_RANGE.length; i++) {
		if (w < Util.AREA_RANGE[i].width) range = i;
	}
	return Util.getAreas(minLat, minLng, maxLat, maxLng, range);
}

Map.getBounds = function(map) {
	// マップの表示範囲取得。
	var rect = map.getBounds();
	if (rect == null) return;
	var latNE = rect.getNorthEast().lat();
	var lngNE = rect.getNorthEast().lng();
	var latSW = rect.getSouthWest().lat();
	var lngSW = rect.getSouthWest().lng();

	// サーバーから表示範囲内のマーカー取得。非同期。
	return {
	latMin : Math.min(latNE, latSW),
	lngMin : Math.min(lngNE, lngSW),
	latMax : Math.max(latNE, latSW),
	lngMax : Math.max(lngNE, lngSW)
	};
}

Util.getAreas = function(minLat, minLng, maxLat, maxLng, range){
	var list = [];
	var mode = Util.AREA_RANGE[range].mode;
	var len = Util.AREA_RANGE[range].len;
	
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

	if (list.length <= 1) return list;
	// center sort.
	var res = [];
	var center = Math.floor(list.length/2);
	for (var i=0; i<center; i++) {
		res.push(list[center-i]);
		if (list.length > center+i+1) res.push(list[center+i+1]);
	}
	
	return res;
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
