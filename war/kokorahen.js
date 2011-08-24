var jqt = $.jQTouch({
	useFastTouch: true
});

$(function(){
	Login.init();

	Map.init();
	Timeline.init();
	List.init();
	Memo.init();
	User.init();
	Spot.init();
	Review.init();
});

function updateOrientation() {
	Map.updateOrientation();
}

//-----------------------------------------------------------------
// Map tab
function Map() {};
Map.ID = "#map";
Map.CANVAS = "#mapCanvas";
Map.map = null;
Map.marker = null;
Map.markers = null;
Map.areaFlags = {};
Map.DEFAULT_CENTER = new google.maps.LatLng(35.684699,139.753897);

Map.options = {
	zoom: 14,
	center: Map.DEFAULT_CENTER ,
	scaleControl: true,
	mapTypeId: google.maps.MapTypeId.ROADMAP
}

Map.init = function() {
	with (Map) {
		Map.updateOrientation();

		// マップ生成
		Map.map = new google.maps.Map($(Map.CANVAS)[0], options);

		// バルーン生成。
		Map.infobox = new InfoBox(Map.map);

		// 現在位置マーカー生成
		marker = new google.maps.Marker({position: Map.DEFAULT_CENTER, map: Map.map });

		// マップ、バルーンのイベントハンドラ設定。
		google.maps.event.addListener(Map.map, 'click', Map.onMapClick);
		google.maps.event.addListener(Map.map, 'idle', Map.onMapIdol);
		google.maps.event.addListener(Map.marker, 'click', Map.onMarkerClick);
		Map.infobox.addEventListener('click', Map.onBalloonClick, false);
	}

	$('#map').bind('pageAnimationEnd', Map.onShow);
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
		alert("現在位置が取得できません。\n"+e.message)
	});
}

Map.onMapClick = function(ev) {
	// 現在位置マーカをクリック位置に移動。
	Map.marker.setPosition(ev.latLng);
	Map.marker.setVisible(true);
}
Map.onBalloonClick = function(ev) {
	jqt.goTo("#spot", "slideleft");
	ev.preventDefault();
	return false;
}
Map.onMarkerClick = function(ev) {
	Spot.current = {marker:this};
	jqt.goTo("#spot", "slideleft");
}

Map.updateOrientation = function(ev) {
	var h1 = 45; // $("#mapHeader").height();
	var h2 = $("#tabbar").height();
	$(Map.CANVAS).height($("html").height() - h1 - h2);
}

Map.onShow = function(ev) {
	// nop.
}

/**
 * マップクリックイベント処理。
 */
Map.onMapIdol = function(ev) {
	// マップの表示範囲取得。
	var rect = Map.map.getBounds();
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
				if (!Map.areaFlags[area]) {
					Kokorahen.listSpotAsync(Map.protMarkers, {area: area});
					Map.areaFlags[area] = true;
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
Map.protMarkers = {
	send: function(list) {
		var isUpdate = false;
		for (var i=0; i<list.length; i++) {
			if (isUpdate === false && Spot.all[list[i]] === undefined) {
				isUpdate = true;
			}
			Spot.getSpot(list[i]);
		}
		if (isUpdate === true) {
			List.onShow();
		}
	},
	_throw: function(e) {
		alert(e);
	}
}

//-----------------------------------------------------------------
// Spot
function Spot(data) {
	this.data = data;
	var pos = new google.maps.LatLng(data.lat, data.lng);
	this.marker = new google.maps.Marker({position: pos, map: Map.map,
		icon:Spot.PIN, shadow:Spot.PIN_SHADOW
	});
	this.marker.spot = this;
	google.maps.event.addListener(this.marker, 'click', Spot.onSpotMarkerClick);
}
Spot.ID = "#spot";
Spot.HOME_IMG = "/images/Home.png";
Spot.current = null;

// ピンイメージ。
Spot.PIN = new google.maps.MarkerImage(
	"http://maps.google.co.jp/mapfiles/ms/icons/blue-pushpin.png", // url
	new google.maps.Size(32,32), // size
	new google.maps.Point(0,0),  // origin
	new google.maps.Point(10,30) // anchor
);
// ピンの影イメージ
Spot.PIN_SHADOW = new google.maps.MarkerImage(
    "http://maps.google.co.jp/mapfiles/ms/icons/pushpin_shadow.png", // url
    new google.maps.Size(32,32), // size
    new google.maps.Point(0,0),  // origin
    new google.maps.Point(8,31) // anchor
);

Spot.init = function() {
	var mapopts2 = {
			zoom: 18,
			center: Map.DEFAULT_CENTER,
			scaleControl: false, disableDefaultUI: true,
			mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	Spot.map = new google.maps.Map(document.getElementById("mapCanvas2"),mapopts2);
	Spot.marker2 = new google.maps.Marker({position: Map.DEFAULT_CENTER, map: Spot.map });
	google.maps.event.addListener(Spot.map, 'click', Spot.onMap2Click);

	$('#spot').bind('pageAnimationEnd', Spot.onShow);

	// 補助マップのスクロールで親ページがスクロールしないようにしている。
	function eventBreaker(ev) {
		ev.preventDefault();
		return false;
	}
	$('#mapCanvas2').bind('touchmove', eventBreaker);
	$('#mapCanvas2').bind('mousemove', eventBreaker);

}

Spot.all = {};
Spot.getSpot = function(data) {
	if (Spot.all[data.id]) return Spot.all[id];
	var spot = new Spot(data);
	Spot.all[data.id] = spot;
	return spot;
}

Spot.onSpotMarkerClick = function(ev) {
	Spot.current = this.spot;
	if (Spot.current === null) return;
	Map.infobox.open(this, Spot.current.data.name);
}
Spot.onMap2Click = function(ev) {
	Spot.marker2.setPosition(ev.latLng);
	Spot.marker2.setVisible(true);
	Spot.setSpotPos(marker2.getPosition());
}


Spot.onShow = function(ev, info){
	if ($(Spot.ID).is(':hidden')) return;

	google.maps.event.trigger(Spot.map, "resize");

	var pos;

	var spotForm = document.spot;
	var spotImage = $("#spotImage");
	spotImage.attr("src", Spot.HOME_IMG);

	var sd = Spot.current.data;
	if (sd == null) {
		pos = Spot.current.marker.getPosition();

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

		Spot.setSpotPos(pos);
		$("#spotReview").html("");

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
			spotImage.attr("src", sd.image);
		}

		Spot.loadReview(sd.id);
	}

	Spot.marker2.setPosition(pos);
	Spot.marker2.setVisible(true);
	Spot.map.setCenter(pos);
};


Spot.loadReview = function(spotId) {
	Kokorahen.listReviewAsync({
		send: function(list) {
			var ul = $("#spotReview");
			ul.html("");
			for (var i=0; i<list.length; i++) {
				ul.append($("<li class='arrow'><a href='javascript:Spot.onReviewClick("
						+list[i].id+")'>"
						+list[i].comment+"</a></li>"));
				Review.all[list[i].id] = list[i];
			}
			jqt.setPageHeight();
		},
		_throw: function(e) {
			alert(e.message);
		}
	}, spotId);
}
Spot.onReviewClick = function(reviewId) {
	if (reviewId === null) {
		var spotId = document.spot.id.value;
		if (spotId == "") return;
		var sd = Spot.all[spotId].data;
		Review.current = {
			id: "", spotId: sd.id, appraise: 0, comment: ""
		};
	} else {
		Review.current = Review.all[reviewId];
	}
	jqt.goTo("#review", "slideleft");
}

Spot.setSpotPos = function(pos){
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

Spot.write = function(){
	var params = {};
	var elems = document.spot.elements;
	for (var i=0; i<elems.length; i++) {
		params[elems[i].name] = elems[i].value;
	}
	var id = Kokorahen.writeSpot(params);
	alert("sopt id="+id);
}


//-----------------------------------------------------------------
// List tab

function List() {}
List.init = function()  {
	$('#list').bind('pageAnimationEnd', List.onShow);
}
//直線距離計算関数
List.compDistance = google.maps.geometry.spherical.computeDistanceBetween;

List.sortNear = function() {
	var list = [];
	var curPos = Map.marker.getPosition();
	for (var id in Spot.all) {
		var sd = Spot.all[id].data;
		sd._distance = List.compDistance(curPos, Spot.all[id].marker.getPosition());
		list.push(sd);
	}
	list.sort(function(a,b){
		if (a._distance === b._distance) return 0;
		return (a._distance > b._distance) ? 1 : -1;
	});
	return list;
}

List.onShow = function() {
	if ($('#list').is(':hidden')) return;

	var list = List.sortNear();
	var ul = $("#listSpots");
	ul.html("");
	for (var i=0; i<list.length && i<50; i++) {
		ul.append($("<li class='arrow'><a href='javascript:List.onItemClick("
			+list[i].id+")'>"+list[i].name+"</a></li>"));
	}
	jqt.setPageHeight();
}

List.onItemClick = function(id) {
	Map.spot = Spot.all[id];
	jqt.goTo("#spot", "slideleft");
}

//-----------------------------------------------------------------
// Timeline tab
function Timeline() {}
Timeline.init = function() {
	$('#timeline').bind('pageAnimationEnd', Timeline.onShow);
}
Timeline.onShow = function() {
	if ($('#timeline').is(':hidden')) return;

	Kokorahen.listTimelineAsync({
		send: function(list) {
			var ul = $("#listTimeline");
			ul.html("");
			for (var i=0; i<list.length && i<50; i++) {
				ul.append($(Timeline.getListItem(list[i])));
				Review.all[list[i].id] = list[i];
			}
			jqt.setPageHeight();
		},
		_throw: function(e){
			alert(e.message);
		}
	});
}
Timeline.getListItem = function(data) {
	var spot = Spot.all[data.spotId];
	if (spot != null) spot = spot.data.name;
	var html =
"<li class='arrow'><a href='javascript:Timeline.onItemClick("+data.id+")'>"
	+"<div style='font-size:50%;'>"+data.nickname+" @"+spot+"</div>"
	+"<div>"+data.comment+"</div>"
"</a></li>";
	return html;

}

Timeline.onItemClick = function(id) {
	Review.current = Review.all[id];
	jqt.goTo("#review", "slideleft");
}



//-----------------------------------------------------------------
// Memo tab
function Memo() { }
Memo.init = function() {
	$('#memo').bind('pageAnimationEnd', Memo.onShow);
}
Memo.onShow = function() {
	if ($('#memo').is(':hidden')) return;

	var list = List.sortNear();
	var ul = $("#memoSpots");
	ul.html("");
	for (var i=0; i<list.length && i<50; i++) {
		ul.append($("<li class='arrow'><a href='javascript:Memo.onItemClick("
				+list[i].id+")'>"+list[i].name+"</a></li>"));
	}
	jqt.setPageHeight();
}

Memo.onItemClick = function(id) {
	if (id === null) {
		id = document.spot.id.value;
		if (id == "") return;
	}
	var sd = Spot.all[id].data;
	Review.current = {
		id: "", spotId: sd.id, appraise: 0, comment: ""
	};
	jqt.goTo("#review", "slideleft");
}

//-----------------------------------------------------------------
// Timeline tab
function User() {

}
User.init = function()  {
	$('#user').bind('pageAnimationEnd', User.onShow);
}
User.onShow = function() {
	document.user.username.value = Login.user.username;
	document.user.nickname.value = Login.user.nickname;
}

//-------------------------------------------------------------------
// Review
function Review() { }
Review.all = {};
Review.current = null;
Review.init = function() {
	// ☆選択初期化
	$('#appraise_raty').raty({
		click: function(score, evt) {
			document.review.appraise.value = score;
		},
		size: 48,
		path: "/images",
		starHalf:   'star-half-big.png',
		starOff:    'star-off-big.png',
		starOn:     'star-on-big.png'
	});

	$('#review').bind('pageAnimationEnd', Review.onShow);
}

Review.onShow = function() {
	if ($('#review').is(':hidden')) return;

	if (Review.current === null) return;
	var reviewForm = document.review;
	reviewForm.id.value        = Review.current.id;
	reviewForm.spotId.value    = Review.current.spotId;
	reviewForm.comment.value   = Review.current.comment;
	reviewForm.appraise.value  = Review.current.appraise;
	$.fn.raty.start(Review.current.appraise, "#appraise_raty");

	reviewForm.name.value = Spot.all[Review.current.spotId].data.name;
}


Review.write = function() {
	var params = {};
	var elems = document.review.elements;
	for (var i=0; i<elems.length; i++) {
		params[elems[i].name] = elems[i].value;
	}
	var id = Kokorahen.writeReview(params);
	alert("review id="+id);
}

//-------------------------------------------------------------------
//Login
function Login() { }
Login.user = {username: null};

Login.init = function() {
	var url = "http://"+location.host;
	Login.user = Kokorahen.getLoginUser();
	if (Login.user == null) {
		jqt.goTo("#login");
	}

	if (Login.nickname == null || Login.nickname == "") {
		Login.nickname = Login.username;
	}

}

Login.login = function(provider) {
	location.href = Kokorahen.login(provider);
}

Login.logout = function() {
	if (Login.user != null) {
		location.href = Kokorahen.logout(Login.user.provider);
	} else {
		location.href = Kokorahen.logout(null);
	}
}


/* EOF */

