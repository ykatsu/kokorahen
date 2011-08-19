var jqt = $.jQTouch({
	useFastTouch: true
});

$(function(){
	initMap();

	// custom event listener setup.
	$('#spot').bind('pageAnimationEnd', onShowSpot);
	$('#list').bind('pageAnimationEnd', onShowList);
	$('#memo').bind('pageAnimationEnd', onShowMemo);
	$('#review').bind('pageAnimationEnd', onShowReview);
	$('#timeline').bind('pageAnimationEnd', onShowTimeline);

	// 補助マップのスクロールで親ページがスクロールしないようにしている。
	function eventBreaker(ev) {
		ev.preventDefault();
		return false;
	}
	$('#mapCanvas2').bind('touchmove', eventBreaker);
	$('#mapCanvas2').bind('mousemove', eventBreaker);


	$('#appraise_raty').raty({
		click: function(score, evt) {
			//$("#appraise").val(score);
			document.review.appraise.value = score;
		},
		size:48,
		path: "/images",
		starHalf:   'star-half-big.png',
		starOff:    'star-off-big.png',
		starOn:     'star-on-big.png'
	});

});


var map;
var map2;
var marker;
var currentMarker;
var balloon;
var infobox;
var reviews = {};
var currentReview;

function initMap() {

	updateOrientation();

	// デフォルト中心、皇居
	var center = new google.maps.LatLng(35.684699,139.753897);

	// マップ生成
	var mapopts = {
		zoom: 14,
		center: center,
		scaleControl: true,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	map = new google.maps.Map(document.getElementById("mapCanvas"),mapopts);
	var mapopts2 = {
			zoom: 18,
			center: center,
			scaleControl: false, disableDefaultUI: true,
			mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	map2 = new google.maps.Map(document.getElementById("mapCanvas2"),mapopts2);

	// バルーン生成。
	balloon = new google.maps.InfoWindow({
		content: $("#balloon").html(),
		maxWidth: 200
	});
	infobox = new InfoBox(map);

	// 現在位置マーカー生成
	marker = new google.maps.Marker({position: center, map: map });
	marker2 = new google.maps.Marker({position: center, map: map2 });

	// マップ、バルーンのイベントハンドラ設定。
	google.maps.event.addListener(map, 'click', onMapClick);
	google.maps.event.addListener(map, 'idle', onMapIdol);
	google.maps.event.addListener(marker, 'click', onMarkerClick);
	google.maps.event.addListener(map2, 'click', onMap2Click);
	// google.maps.event.addListener(balloon, 'domready',
	// onLoadBalloon);
	// google.maps.event.addListener(balloon, 'click', onBalloonClick);
	infobox.addEventListener('click', onBalloonClick, false);

	// GPSから現在位置取得、
	navigator.geolocation.getCurrentPosition(geoUpdate,
			function(e){alert("現在位置が取得できません。\n"+e.message)});
}
/**
 * GPS取得イベント処理。
 * <li>navigator.geolocation.watchPosition()
 */
function geoUpdate(position) {
	var lat = position.coords.latitude;
	var lng = position.coords.longitude;
	// 地図の中央にGPS位置を設定。
	center = new google.maps.LatLng(lat, lng);
	map.setCenter(center);
	marker.setPosition(center);
	// グルグルを消す
	// waitingIcon(false);
	// 現在位置マーカーをGPS位置に移動。
	// onMapClick({latLng: center});
}

/**
 * マップクリックイベント処理。
 */
function onMapClick(ev) {
	// 現在位置マーカをクリック位置に移動。
	marker.setPosition(ev.latLng);
	marker.setVisible(true);
}
function onMarkerClick(ev) {
	currentMarker = this;
	jqt.goTo("#spot", "slideleft");
}
function onSpotMarkerClick(ev) {
	currentMarker = this;
	// balloon.open(map, this);
	var sd = currentMarker.spotData;
	infobox.open(currentMarker, sd.name);
}
function onListClick(id) {
	currentMarker = markers[id];
	jqt.goTo("#spot", "slideleft");
}
function onMemoClick(id) {
	currentMarker = markers[id];
	currentReview = null;
	jqt.goTo("#review", "slideleft");
}
function onReviewClick(id) {
	currentReview = reviews[id];
	jqt.goTo("#review", "slideleft");
}

function onBalloonClick(ev) {
	jqt.goTo("#spot", "slideleft");
	ev.preventDefault();
	return false;
}


function onMap2Click(ev) {
	marker2.setPosition(ev.latLng);
	marker2.setVisible(true);
	setSpotPos(marker2.getPosition());
}

function updateOrientation() {
	// alert(""+$("html").height());

	var h1 = 45; // $("#mapHeader").height();
	var h2 = $("#tabbar").height();
	$("#mapCanvas").height($("html").height() - h1 - h2);
	// window.setTimeout(function(){
	// window.scrollTo(0, 1)
	// $("#map").height($("body").height()-45);
	// }, 100);
}

function onShowSpot(ev, info){
	if ($('#spot').is(':hidden')) return;

	var pos;
	google.maps.event.trigger(map2, "resize");

	var spotForm = document.spot;
	$("#spotImage").attr("src", "/images/Home.png");

	var sd = currentMarker.spotData;
	if (sd == null) {
		pos = currentMarker.getPosition();

		spotForm.id.value = "";
		spotForm.lat.value = "";
		spotForm.lng.value = "";
		spotForm.address.value = "";
		spotForm.name.value = "";
		spotForm.openHours.value = "";
		spotForm.closedDay.value = "";
		spotForm.email.value = "";
		spotForm.url.value = "";
		spotForm.comment.value = "";
		spotForm.tags.value = "";
		spotForm.image.value = "";
		// $("#spotImage").attr("src", "/images/Home.png");

		setSpotPos(pos);
	} else {
		pos = new google.maps.LatLng(sd.lat, sd.lng);

		spotForm.id.value = sd.id;
		spotForm.lat.value = sd.lat;
		spotForm.lng.value = sd.lng;
		spotForm.address.value = sd.address;
		spotForm.name.value = sd.name;
		spotForm.openHours.value = sd.openHours;
		spotForm.closedDay.value = sd.closedDay;
		spotForm.email.value = sd.email;
		spotForm.url.value = sd.url;
		spotForm.comment.value = sd.comment;
		spotForm.tags.value = sd.tags.join(",");
		spotForm.image.value = sd.image;
		if (sd.image != null && sd.image != "") {
			$("#spotImage").attr("src", sd.image);
		}

		Kokorahen.listReviewAsync({
			send: function(list) {
				var ul = $("#spotReview");
				ul.html("");
				for (var i=0; i<list.length; i++) {
					ul.append($("<li class='arrow'><a href='javascript:onReviewClick("
							+list[i].id+")'>"
							+list[i].comment+"</a></li>"));
					reviews[list[i].id] = list[i];
				}
				jqt.setPageHeight();
			},
			_throw: function(e) {
				alert(e.message);
			}
		},sd.id);

	}

	marker2.setPosition(pos);
	marker2.setVisible(true);
	map2.setCenter(pos);

};
function setSpotPos(pos){
	var spotForm = document.spot;
	spotForm.lat.value = pos.lat();
	spotForm.lng.value = pos.lng();

	// 座標から住所を取得しinputタグに設定。
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({latLng: pos}, function(results, status){
		var addr = "???";
		if(status == google.maps.GeocoderStatus.OK){
			addr = results[0].formatted_address;
		}
		spotForm.address.value = addr;
	});
};


function writeSpot() {
	var params = {};
	var elems = document.spot.elements;
	for (var i=0; i<elems.length; i++) {
		params[elems[i].name] = elems[i].value;
	}
	var id = Kokorahen.writeSpot(params);
	alert("sopt id="+id);
}
function writeReview() {
	var params = {};
	var elems = document.review.elements;
	for (var i=0; i<elems.length; i++) {
		params[elems[i].name] = elems[i].value;
	}
	var id = Kokorahen.writeReview(params);
	alert("review id="+id);
}

// ピンイメージ。
var pinImage = new google.maps.MarkerImage(
	"http://maps.google.co.jp/mapfiles/ms/icons/blue-pushpin.png", // url
	new google.maps.Size(32,32), // size
	new google.maps.Point(0,0),  // origin
	new google.maps.Point(10,30) // anchor
);
// ピンの影イメージ
var pinShadowImage = new google.maps.MarkerImage(
    "http://maps.google.co.jp/mapfiles/ms/icons/pushpin_shadow.png", // url
    new google.maps.Size(32,32), // size
    new google.maps.Point(0,0),  // origin
    new google.maps.Point(8,31) // anchor
);
var markers = {}; // マーカーの一覧。
var areaFlags = {}; // 取得済みエリアの一覧。

/**
 * マップクリックイベント処理。
 */
function onMapIdol() {

	// マップの表示範囲取得。
	var rect = map.getBounds();
	if (rect == null) return;
	var latNE = rect.getNorthEast().lat();
	var lngNE = rect.getNorthEast().lng();
	var latSW = rect.getSouthWest().lat();
	var lngSW = rect.getSouthWest().lng();

	// サーバーから表示範囲内のマーカー取得。非同期。
	Kokorahen.getAreasAsync({
		send: function(areas) {
			for(var i=0; i<areas.length; i++) {
				var area = areas[i];
				if (!areaFlags[area]) {
					Kokorahen.listSpotAsync(protMarkers, {area: area});
					areaFlags[area] = true;
				}
			}
		},
		_throw: function (e) {
			alert(e);
		}
	}, {
		maxLat: Math.max(latNE, latSW),
		minLat: Math.min(latNE, latSW),
		maxLng: Math.max(lngNE, lngSW),
		minLng: Math.min(lngNE, lngSW),
	});

};

/**
 * 表示範囲内のマーカー取得コールバック。
 */
var protMarkers = {
	send: function(list) {
		var isUpdate = false;
		// for (var key in markers) markers[key].setVisible(false);
		for (var i=0; i<list.length; i++) {
			var id = list[i].id;
			if (markers[id] == null) {
				// まだ無い場合は青ピンマーカーを生成する。
				var pos = new google.maps.LatLng(list[i].lat, list[i].lng);
				var m = new google.maps.Marker({position: pos, map: map,
						icon:pinImage, shadow:pinShadowImage
				});
				google.maps.event.addListener(m, 'click', onSpotMarkerClick);
				m.spotData = list[i];
				markers[id] = m;
				isUpdate = true;
			} else {
				// 既に有る場合は表示を有効にする。
				markers[id].setVisible(true);
			}
		}
		if (isUpdate === true) {
			onShowList();
			onShowMemo();
		}
	},
	_throw: function(e) {
		alert(e);
	}
}


//直線距離
//google.maps.geometry.spherical.computeDistanceBetween(from:LatLng, to:LatLng, radius?:number)
compDistance = google.maps.geometry.spherical.computeDistanceBetween;
function sortNear() {
	var list = [];
	var curPos = marker.getPosition();
	for (var id in markers) {
		var sd = markers[id].spotData;
		sd._distance = compDistance(curPos, markers[id].getPosition());
		list.push(sd);
	}
	list.sort(function(a,b){
		if (a._distance === b._distance) return 0;
		return (a._distance > b._distance) ? 1 : -1;
	});
	return list;
}

function onShowList() {
	if ($('#list').is(':hidden')) return;

	var list = sortNear();
	var ul = $("#listSpots");
	ul.html("");
	for (var i=0; i<list.length && i<50; i++) {
		ul.append($("<li class='arrow'><a href='javascript:onListClick("+list[i].id+")'>"+list[i].name+"</a></li>"));
	}
}

function onShowMemo() {
	if ($('#memo').is(':hidden')) return;

	var list = sortNear();
	var ul = $("#memoSpots");
	ul.html("");
	for (var i=0; i<list.length && i<50; i++) {
		ul.append($("<li class='arrow'><a href='javascript:onMemoClick("+list[i].id+")'>"+list[i].name+"</a></li>"));
	}
}

function onShowReview() {
	if ($('#review').is(':hidden')) return;

	var reviewForm = document.review;

	if (currentReview === null) {
		var sd = currentMarker.spotData;
		if (sd == null) return;
		reviewForm.name.value = sd.name;
		reviewForm.spotId.value = sd.id;
	} else {
		reviewForm.id.value = currentReview.id;
		reviewForm.spotId.value = currentReview.spotId;
		reviewForm.comment.value = currentReview.comment;
		reviewForm.appraise.value = currentReview.appraise;
		$.fn.raty.start(currentReview.appraise, "#appraise_raty");

		reviewForm.name.value = markers[currentReview.spotId].spotData.name;
	}


}

function onShowTimeline() {
	if ($('#timeline').is(':hidden')) return;


	Kokorahen.listTimelineAsync({
		send: function(list) {
			var ul = $("#listTimeline");
			ul.html("");
			for (var i=0; i<list.length && i<50; i++) {
				ul.append($("<li class='arrow'><a href='javascript:onListClick("+list[i].id+")'>"+list[i].comment+"</a></li>"));
			}
			jqt.setPageHeight();
		},
		_throw: function(){
			alert(e.message);
		}
	});
}



