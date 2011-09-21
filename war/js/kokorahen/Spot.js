
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
Spot.currentAreas = null;
Spot.currentZoom = 0;
Spot.LIMIT = 30;
Spot.visibleStack = 0;


Spot.getSpotForId = function(id) {
	if (Spot.all[id]) return Spot.all[id];
	var data = kokorahen.getSpot(id);
	if (data == null) return null;
	return Spot.getSpot(data);
}

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
Spot.onZoomChanged = function(zoom) {
	Spot.currentZoom = zoom;
	Spot.currentAreas = null;
	//console.log("==========>zoom="+zoom);
}
Spot.onCenterChanged = function() {
	Spot.currentAreas = null;
}

Spot.load = function(map) {
	var areas = Spot.getAreas(map);
	var range = areas[0].length;
	if (Spot.currentRange != range) {
		Spot.clearCache();
		Spot.currentRange = range;
	}
/*
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
*/
/*
	console.log(areas);
	Spot.currentAreas = areas;
	Spot.visibleStack = 0;
	setTimeout(function(){
		Spot.loadDelay(areas, 0, 1, Spot.currentZoom);
	}, 200);
*/

	Spot.currentAreas = areas;
	setTimeout(function(){
		if (Spot.currentAreas != areas) return;
		console.log("==========>POST="+areas);

		var params =  {
				areas: areas, tag: SpotTags.getSearchTag(), 
				limit: Spot.LIMIT, range: Spot.currentRange
		};
		Spot.getBounds(Map.map, params);
		Kokorahen.getSpotsAsync(Spot.onloadGetSpots, params);
	}, 200);
	
	
	// TODO:なんだっけ？
	//$("//a[target='_blank']").attr("href","#");
};
Spot.onloadGetSpots = {
		success: function(list, args) {
			if (args[1].areas != Spot.currentAreas) return;
			
			
			for (var i=0; i<list.length; i++) {
				Spot.getSpot(list[i]);
			}
			Spot.visibleDelay();
		},
		fail: function(e) {
			alert(e.stack);
		}
}


Spot.loadDelay = function(areas, i, n, zoom) {
	if (i >= areas.length) {
		Spot.visible();
		return;
	}
	if (Spot.currentAreas != areas || Spot.currentZoom != zoom) {
		console.log("==========>CANCEL:"+i+":"+areas.length);
		return; 
	}

	var _areas = [];
	for (; i<areas.length; i++) {
		if (! Spot.areaFlags[areas[i]]) {
			_areas.push(areas[i]);
			if (_areas.length >= n) break;
		}
	}
	if (_areas.length == 0) {
		Spot.visible();
		return;
	}

	var limit = Spot.LIMIT;
	if (Spot.currentRange >= 20) limit = 999;
	console.log("==========>POST:"+_areas);
	Kokorahen.listSpotAsync(Spot.onload, {
		areas: _areas, tag:Spot.searchTag, 
		limit: limit, range: Spot.currentRange
	})
		
	setTimeout(function(){
		Spot.loadDelay(areas, i+1, (n+1)*(n+1),zoom);
	}, 500);

}

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
		Spot.visibleDelay();
	},
	fail: function(e) {
		alert(e.stack);
	}
}

Spot.visibleDelay = function() {
	Spot.visibleStack++;
	setTimeout(function(){
		if (--Spot.visibleStack <= 0) {
			Spot.visible();
			Spot.visibleStack = 0;
		}
		//console.log("-->"+Spot.visibleStack);
	}, 200);
}


Spot.visible = function(limit) {
	if (undefined === limit) limit = Spot.LIMIT;
		
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
//console.log("--->"+spots.length);
	spots.sort(function(a,b){
		var ap = a.data.appraise + (a.inBounds?1000.0:0.0);
		var bp = b.data.appraise + (b.inBounds?1000.0:0.0);
		if (ap == bp) return 0;
		return (ap < bp) ? 1 : -1;
	});
	//console.log("----->"+spots.length);
	if (Spot.currentZoom >= 20) limit = 1000;
	for (var i=0; i<limit && i<spots.length; i++) {
		if (! spots[i].inBounds) break;
		spots[i].marker.setVisible(true);
	}
	console.log("----->visible="+i+":"+limit+":"+spots.length);

	if (i<spots.length) {
		for (; i<spots.length; i++) {
			if (spots[i].inBounds) spots[i].marker.setVisible(false);
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
	//return list;
	

	if (list.length <= 1) return list;
	// center sort.
	var res = [];
	var center = Math.floor(list.length/2);
	for (var i=0; i<=center; i++) {
		if (0 <= center-i-1) res.push(list[center-i-1]);
		if (list.length > center+i) res.push(list[center+i]);
	}
//console.log("===>"+list);	
//console.log("--->"+res);	
	return res;

}

Spot.getBounds = function(map, params){
	// マップの表示範囲取得。
	var rect = map.getBounds();
	if (rect == null) return null;
	var latNE = rect.getNorthEast().lat();
	var lngNE = rect.getNorthEast().lng();
	var latSW = rect.getSouthWest().lat();
	var lngSW = rect.getSouthWest().lng();

	params.latMin = Math.min(latNE, latSW);
	params.lngMin = Math.min(lngNE, lngSW);
	params.latMax = Math.max(latNE, latSW);
	params.lngMax = Math.max(lngNE, lngSW);
	return params;
}	
