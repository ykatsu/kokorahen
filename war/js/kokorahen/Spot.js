
//-----------------------------------------------------------------
//Spot
function Spot(data) {
	this.data = data;
	var pos = new google.maps.LatLng(data.lat, data.lng);
	var level = Math.floor(data.appraise);
	if (level < 0) level = 0;
	this.marker = new google.maps.Marker({position: pos, map: Map.map,
		icon:Spot.PIN[level] , shadow:Spot.PIN_SHADOW
	});
	this.marker.spot = this;
	this.marker.setVisible(false);
	google.maps.event.addListener(this.marker, 'click', Spot.onSpotMarkerClick);
}


Spot.makePinImg = function(color) {
	return new google.maps.MarkerImage(
		"/images/pin-"+color+".png", // url
		new google.maps.Size(24,24), // size
		new google.maps.Point(0,0),  // origin
		new google.maps.Point(12,24) // anchor
	);
}
//ピンイメージ。
Spot.PIN = [
	Spot.makePinImg("blue"),
	Spot.makePinImg("blue"),
	Spot.makePinImg("green"),
	Spot.makePinImg("orange"),
	Spot.makePinImg("red"),
	Spot.makePinImg("red")
];
//ピンの影イメージ
Spot.PIN_SHADOW = new google.maps.MarkerImage(
 "/images/pin-shadow.png", // url
 new google.maps.Size(40,24), // size
 new google.maps.Point(0,0),  // origin
 new google.maps.Point(14,24) // anchor
);


Spot.init = function() {
	// nop.
}
Spot.onSpotMarkerClick = function(ev) {
	SpotInfo.setCurrent(this.spot);
	if (SpotInfo.current == null) return;
	var addr = SpotInfo.current.data.address.replace(/^日本,/,"");
	var msg = "<div class='BalloonLine1'>"+SpotInfo.current.data.name+"</div>"
		+"<div class='BalloonLine2'>"+addr+"</div>";
	Map.infobox.open(this, msg);
}

//--------------------------------------------------------------
// Spot Cache
Spot.all = {};
Spot.list = [];
Spot.areaFlags = {};
Spot.currentRange = 0;
Spot.LIMIT = 30;

Spot.getSpot = function(data) {
	if (Spot.all[data.id]) return Spot.all[data.id];
	var spot = new Spot(data);
	Spot.all[data.id] = spot;
	Spot.list.push(spot);
	return spot;
}
Spot.clearCache= function() {
	for (var id in Spot.all) {
		Spot.all[id].marker.setMap(null);
		Spot.all[id].marker = undefined;
		delete Spot.all[id];
	}
	delete Spot.list;
	Spot.list = [];
	Spot.areaFlags = {};
}

Spot.load = function(map) {
	var areas = Spot.getAreas(map);
	var range = areas[0].length;
	if (Spot.currentRange != range) {
		Spot.clearCache();
		Spot.currentRange = range;
	}
	
	var alive = 0;
	for (var i=0; i<areas.length; i++) {
		if (Spot.areaFlags[areas[i]]) {
			areas[i] = null;
		} else{
			alive++;
		}
	}
	if (alive == 0) return;
	
	Kokorahen.listSpotAsync(Spot.onload, {
		areas: areas, tag:Spot.searchTag, limit: Spot.LIMIT+1, range: range
	});
	
	// TODO:なんだっけ？
	//$("//a[target='_blank']").attr("href","#");
};


/**
 * 表示範囲内のマーカー取得コールバック。
 */
Spot.onload = {
	success: function(data, args) {
		// レンジが変更されていたら処理中止
		if (data.length <= 0) return;
		if (Spot.currentRange != data[0].area.length) return; 

		for (var j=0; j<data.length; j++) {
			var area = data[j].area;
			var list = data[j].spots;
			Spot.areaFlags[area] = true;
			for (var i=0; i<list.length; i++) {
				Spot.getSpot(list[i]);
			}
		}
		Spot.visible(Spot.LIMIT);
	},
	fail: function(e) {
		alert(e.stack);
	}
}

Spot.visible = function(limit) {
	// マップの表示範囲取得。
	var rect = Map.map.getBounds();
	if (rect == null) return;
	var latNE = rect.getNorthEast().lat();
	var lngNE = rect.getNorthEast().lng();
	var latSW = rect.getSouthWest().lat();
	var lngSW = rect.getSouthWest().lng();

	// サーバーから表示範囲内のマーカー取得。非同期。
	var latMin = Math.min(latNE, latSW);
	var lngMin = Math.min(lngNE, lngSW);
	var latMax = Math.max(latNE, latSW);
	var lngMax = Math.max(lngNE, lngSW);

	function inBounds(spot) {
		return (latMin <= spot.data.lat && spot.data.lat < latMax
			&& lngMin <= spot.data.lng && spot.data.lng < lngMax);
	}
	
	
	var spots = Spot.list;
	for (var i=0; i<spots.length; i++) {
		spots[i].inBounds = inBounds(spots[i]);
	}
console.log("--->"+spots.length);
	spots.sort(function(a,b){
		var ap = a.data.appraise + (a.inBounds?1000.0:0.0);
		var bp = b.data.appraise + (b.inBounds?1000.0:0.0);
		if (ap == bp) return 0;
		return (ap < bp) ? 1 : -1;
	});
	//console.log("----->"+spots.length);
	if (Spot.currentRange >= (7*2+1)) limit = 1000;
	for (var i=0; i<limit && i<spots.length; i++) {
		if (! spots[i].inBounds) break;
		spots[i].marker.setVisible(true);
	}
	if (i<spots.length) {
		for (; i<spots.length; i++) {
			spots[i].marker.setVisible(false);
		}
		return false;
	}
	return true;
}

Spot.AREA_RANGE = [
	{width:5.0,    mode:1,      len:3}, // 100Km
	{width:0.5,    mode:10,     len:5}, // 10Km
	{width:0.05,   mode:100,    len:6}, // 1Km
	{width:0.004,  mode:1000,   len:7}, // 100m
	{width:0.0005, mode:10000,  len:8}  // 10m
];


Spot.getAreas = function(map, range){
	// マップの表示範囲取得。
	var rect = map.getBounds();
	if (rect == null) return;
	var latNE = rect.getNorthEast().lat();
	var lngNE = rect.getNorthEast().lng();
	var latSW = rect.getSouthWest().lat();
	var lngSW = rect.getSouthWest().lng();
	// サーバーから表示範囲内のマーカー取得。非同期。
	var minLat = Math.min(latNE, latSW);
	var minLng = Math.min(lngNE, lngSW);
	var maxLat = Math.max(latNE, latSW);
	var maxLng = Math.max(lngNE, lngSW);
	
	
	if (undefined === range) {
		var w = maxLng - minLng;
		range = 0;
		for (var i=1; i<Spot.AREA_RANGE.length; i++) {
			if (w < Spot.AREA_RANGE[i].width) range = i;
		}
	}

	var list = [];
	var mode = Spot.AREA_RANGE[range].mode;
	var len = Spot.AREA_RANGE[range].len;
	
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
	
	/*
	if (list.length <= 1) return list;
	// center sort.
	var res = [];
	var center = Math.floor(list.length/2);
	for (var i=0; i<center; i++) {
		res.push(list[center-i]);
		if (list.length > center+i+1) res.push(list[center+i+1]);
	}
	
	return res;
	*/
}
