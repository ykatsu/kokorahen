
//-----------------------------------------------------------------
// Map tab
function Map() {};
Map.ID = "#map";
Map.CANVAS = "#mapCanvas";
Map.map = null;
Map.marker = null;
Map.markers = null;
Map.DEFAULT_CENTER = new google.maps.LatLng(35.684699,139.753897);
Map.searchTag = null;

Map.options = {
	zoom: 14,
	center: Map.DEFAULT_CENTER ,
	scaleControl: true,
	mapTypeId: google.maps.MapTypeId.ROADMAP
};

Map.init = function() {
	with (Map) {
		Map.updateOrientation();

		// マップ生成
		Map.map = new google.maps.Map($(Map.CANVAS)[0], options);

		// バルーン生成。
		Map.infobox = new InfoBox(Map.map);

		// 現在位置マーカー生成
		Map.marker = new google.maps.Marker({
			position: Map.DEFAULT_CENTER, map: Map.map 
		});

		// マップ、バルーンのイベントハンドラ設定。
		google.maps.event.addListener(Map.map, 'click', Map.onMapClick);
		google.maps.event.addListener(Map.map, 'idle', Map.onMapIdol);
		google.maps.event.addListener(Map.marker, 'click', Map.onMarkerClick);
		Map.infobox.addEventListener('click', Map.onBalloonClick, false);
		Map.setCenterFromGPS();
	}
}
/**
 * GPS取得イベント処理。
 * <li>navigator.geolocation.watchPosition()
 */
Map.setCenterFromGPS = function() {
	// GPSから現在位置取得、
	navigator.geolocation.getCurrentPosition(function(position){
		var lat = position.coords.latitude;
		var lng = position.coords.longitude;
		// 地図の中央にGPS位置を設定。
		var center = new google.maps.LatLng(lat, lng);
		Map.map.setCenter(center);
		Map.marker.setPosition(center);
	}, function(e){
		alert("現在位置が取得できません。\n"+e.message);
	});
}

Map.onMapClick = function(ev) {
	// 現在位置マーカをクリック位置に移動。
	Map.marker.setPosition(ev.latLng);
	Map.marker.setVisible(true);
	Map.infobox.close();
}
Map.onBalloonClick = function(ev) {
	Util.changePage(SpotInfo.ID);
	return Util.eventBreaker(ev);
}

Map.onMarkerClick = function(ev) {
	SpotInfo.setCurrent({marker:Map.marker});
	Map.infobox.close();
	Util.changePage(SpotInfo.ID);
	return Util.eventBreaker(ev);
}

Map.updateOrientation = function(ev) {
	var h1 = 43; // $("#mapHeader").height();
	var h2 = 50; //$("#tabbar").height();
	$(Map.CANVAS).height($("html").height() - h1 - h2);
}

Map.onBeforeShow = function(ev) {
	Map.onTagChange();
	//Spot.visible(Map.LIMIT);
	Util.setNavbar(Map.ID);
}
Map.onTagChange = function() {
	var tag = SpotTags.getSearchTag();
	if (tag != Map.searchTag) {
		// reload.
		Map.searchTag = tag;
		Map.clearSpot();
		Map.loadSpot();
		var label = (tag==null) ? "ジャンル" : tag;
		$(".TagSelectBtn .ui-btn-text").text(label);
	}
}

Map.onShow = function(ev, info){
	// Note: 地図が初期状態で非表示だと誤動作するのでその対処。
	google.maps.event.trigger(Map.map, "resize");
	//Map.map.setCenter(Map.marker.getPosition());
}

/**
 * マップクリックイベント処理。
 */
Map.onMapIdol = function(ev) {
	Spot.load(Map.map);
	Map.infobox.close();
}
