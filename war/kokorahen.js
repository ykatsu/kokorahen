

//-----------------------------------------------------------------
// JQuery Mobile onload.

$(document).bind("mobileinit", function(){
//  $.mobile.foo = bar;
//	$.mobile.selectmenu.prototype.options.nativeMenu = false;
});


//$(document).bind("mobileinit", function(){
$(function(){
//$("body").live('pagecreate',function(event){
		//var modules = [Login, Map, Timeline, List, Memo, User, Spot, SpotReview, Review];
	$.mobile.pageLoading();
	var modules = [Login, User, Map, Timeline, List, Memo, Spot, 
	               SpotReview, Review, DaysSelector];

	function init(m) {
		if (m.init != undefined) m.init();
		if (m.onBeforeShow) {
			$(m.ID).bind('pagebeforeshow', function(ev, ui) {
				try {
					m.onBeforeShow(ev,ui);
				} catch(e) {
					// TODO: 例外が上がるとJQM(b2)が止まる。
					alert(e.message+"\n"+e.url+":"+e.line);
				}
			});
		}
		if (m.onShow) {
			$(m.ID).bind('pageshow', function(ev, ui) {
				try {
					m.onShow(ev,ui);
				} catch(e) {
					// TODO: 例外が上がるとJQM(b2)が止まる。
					alert(e.message+"\n"+e.url+":"+e.line);
				}
			});
		}
	};
	for (var i=0; i<modules.length; i++) init(modules[i]);

	$("//div[data-role='dialog']").live('pageshow', function(ev, ui) {
		$("#spotTags").selectmenu('refresh');
	});
	
	
	// TODO: JQMがβのせいかFooterの共有が出来ないので自前で対処。
	var footers = $("//div[data-id='tabfooter']");
	footers.html($("#tabfooter").html());

	
	var tagTree = {
		"食事": {
			"ラーメン": null,
			"豚カツ": null,
			"エスニック": {
				"タイ料理": null,
				"台湾料理": null
			}
		},
		"酒": {
			"日本酒": null,
			"ワイン": null,
		}
	};
	Spot.tagsSelector = new Selector("#spotTags", tagTree, "タグを選択(複数可)");

	new DaysSelector("#spotDaysList");
	
	var html = "<option value=''>--:--</option>";
	for (var h=0; h<24; h++) {
		var hh = ("0"+h).match(/[0-9]{2}$/)[0];
		for (var m=0; m<60; m+=30) {
			var hhmm = hh + ":" + ("0"+m).match(/[0-9]{2}$/)[0];
			html += "<option>"+hhmm+"</option>"
		}
	}
	html += "<option>24:00</option>"
	$(".TimeSelector").html(html);
	
});


function updateOrientation() {
	Map.updateOrientation();
}
//window.onerror = function(msg, url, line) {
	//alert(msg+"\n"+url+":"+line);
//}
//-----------------------------------------------------------------
// Map tab
function Map() {};
Map.ID = "#map";
Map.CANVAS = "#mapCanvas";
Map.WAITING = "#waiting";
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
};

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
}
Map.onBalloonClick = function(ev) {
	$(Map.WAITING).show();
	$.mobile.changePage(Spot.ID, "slide");
	return Util.eventBreaker(ev);
}
Map.onMarkerClick = function(ev) {
	$(Map.WAITING).show();
	Map.infobox.close();
	Spot.setCurrent({marker:this});
	//jqt.goTo(Spot.ID, "slideleft");
	$.mobile.changePage(Spot.ID, "slide");

}

Map.updateOrientation = function(ev) {
	var h1 = 43; // $("#mapHeader").height();
	var h2 = 50; //$("#tabbar").height();
	$(Map.CANVAS).height($("html").height() - h1 - h2);
}

Map.onBeforeShow = function(ev) {
	// nop.
}
Map.onShow = function(ev, info){
	// Note: 地図が初期状態で非表示だと誤動作するのでその対処。
	google.maps.event.trigger(Map.map, "resize");
	//Map.map.setCenter(Map.marker.getPosition());
	$(Map.WAITING).hide();
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
/*
	Kokorahen.getAreasAsync({
		success: function(areas) {
			for(var i=0; i<areas.length; i++) {
				var area = areas[i];
				if (!Map.areaFlags[area]) {
					Kokorahen.listSpotAsync(Map.protMarkers, {area: area});
					Map.areaFlags[area] = true;
				}
			}
		},
		fail: function (e) {
			alert(e);
		}
	}, {
		maxLat: Math.max(latNE, latSW),
		minLat: Math.min(latNE, latSW),
		maxLng: Math.max(lngNE, lngSW),
		minLng: Math.min(lngNE, lngSW),
	});
*/
	var areas = Util.getAreas(
			Math.min(latNE, latSW),
			Math.min(lngNE, lngSW),
			Math.max(latNE, latSW),
			Math.max(lngNE, lngSW)
	);
	for(var i=0; i<areas.length; i++) {
		var area = areas[i];
		if (!Map.areaFlags[area]) {
			Kokorahen.listSpotAsync(Map.protMarkers, {area: area});
			Map.areaFlags[area] = true;
		}
	}

};

/**
 * 表示範囲内のマーカー取得コールバック。
 */
Map.protMarkers = {
	success: function(list) {
		var isUpdate = false;
		for (var i=0; i<list.length; i++) {
			if (isUpdate == false && Spot.all[list[i]] == undefined) {
				isUpdate = true;
			}
			Spot.getSpot(list[i]);
		}
		var page = $.mobile.activePage.attr("id");
		if (isUpdate == true && page=="list") {
//try {
			List.onBeforeShow();
//} catch (e) {
//	alert(e);
//}
		}
	},
	fail: function(e) {
		alert(e);
	}
}

//-----------------------------------------------------------------
//Spot
function Spot(data) {
	this.data = data;
	var pos = new google.maps.LatLng(data.lat, data.lng);
	this.marker = new google.maps.Marker({position: pos, map: Map.map,
		//icon:Spot.PIN, shadow:Spot.PIN_SHADOW
		icon:Spot.PIN2, shadow:Spot.PIN2_SHADOW
	});
	this.marker.spot = this;
	google.maps.event.addListener(this.marker, 'click', Spot.onSpotMarkerClick);
}
Spot.ID = "#spot";
Spot.HOME_IMG = "/images/Home.png";
Spot.current = null;
Spot.tagsSelector = null;

//ピンイメージ。
Spot.PIN = new google.maps.MarkerImage(
	"http://maps.google.co.jp/mapfiles/ms/icons/blue-pushpin.png", // url
	new google.maps.Size(32,32), // size
	new google.maps.Point(0,0),  // origin
	new google.maps.Point(10,30) // anchor
);
//ピンの影イメージ
Spot.PIN_SHADOW = new google.maps.MarkerImage(
 "http://maps.google.co.jp/mapfiles/ms/icons/pushpin_shadow.png", // url
 new google.maps.Size(32,32), // size
 new google.maps.Point(0,0),  // origin
 new google.maps.Point(8,31) // anchor
);
//ピンイメージ。
Spot.PIN2 = new google.maps.MarkerImage(
	"/images/pin-blue.png", // url
	new google.maps.Size(24,24), // size
	new google.maps.Point(0,0),  // origin
	new google.maps.Point(12,24) // anchor
);
//ピンの影イメージ
Spot.PIN2_SHADOW = new google.maps.MarkerImage(
 "/images/pin-shadow.png", // url
 new google.maps.Size(40,24), // size
 new google.maps.Point(0,0),  // origin
 new google.maps.Point(14,24) // anchor
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

	// 補助マップのスクロールで親ページがスクロールしないようにしている。
	$('#mapCanvas2').bind('touchmove', Util.eventBreaker);
	$('#mapCanvas2').bind('mousemove', Util.eventBreaker);

}

Spot.all = {};
Spot.getSpot = function(data) {
	if (Spot.all[data.id]) return Spot.all[data.id];
	var spot = new Spot(data);
	Spot.all[data.id] = spot;
	return spot;
}

Spot.onSpotMarkerClick = function(ev) {
	Spot.setCurrent(this.spot);
	if (Spot.current == null) return;
	var addr = Spot.current.data.address.replace(/^日本,/,"");
	var msg = "<div class='BalloonLine1'>"+Spot.current.data.name+"</div>"
		+"<div class='BalloonLine2'>"+addr+"</div>";
	Map.infobox.open(this, msg);
}
Spot.onMap2Click = function(ev) {
	Spot.marker2.setPosition(ev.latLng);
	Spot.marker2.setVisible(true);
	Spot.setSpotPos(marker2.getPosition());
}


Spot.setCurrent = function(cur){
	Spot.current = cur;
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
		//spotForm.closedDay.value = "";
		spotForm.email.value = "";
		spotForm.url.value = "";
		spotForm.comment.value = "";

		$(spotForm.tags).val([]);
		spotForm.image.value = "";

		Spot.setSpotPos(pos);

		$(".SpotReviewBtn").hide();

	} else {
		pos = new google.maps.LatLng(sd.lat, sd.lng);

		spotForm.id.value = sd.id;
		spotForm.lat.value = sd.lat;
		spotForm.lng.value = sd.lng;
		spotForm.address.value = sd.address;
		spotForm.name.value = sd.name;
		spotForm.openHours.value = sd.openHours;
		//spotForm.closedDay.value = sd.closedDay;
		spotForm.email.value = sd.email;
		spotForm.url.value = sd.url;
		spotForm.comment.value = sd.comment;
		Spot.tagsSelector.setValue(sd.tags);
		//spotForm.tags.value = sd.tags.join(",");
		spotForm.image.value = sd.image;
		if (sd.image != null && sd.image != "") {
			spotImage.attr("src", sd.image);
		}
		$(".SpotReviewBtn").show();
	}

	Spot.marker2.setPosition(pos);
	//Spot.marker2.setVisible(true);
	//Spot.map.setCenter(pos);
};

Spot.onBeforeShow = function(ev, info){
	// Note:このタイミングでないとselectmenuの準備まに合わず。
	$(document.spot.tags).selectmenu('refresh');
	Selector.setup();
};

Spot.onShow = function(ev, info){
	// Note: 地図が初期状態で非表示だと誤動作するのでその対処。
	google.maps.event.trigger(Spot.map, "resize");
	Spot.marker2.setVisible(true);
	Spot.map.setCenter(Spot.marker2.getPosition());
};

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
	params.tags = Spot.tagsSelector.getValue().join(",");
	var id = Kokorahen.writeSpot(params);
	alert("sopt id="+id);
}

//-----------------------------------------------------------------
//SpotReview
function SpotReview() { }
SpotReview.ID = "#spotReview";
SpotReview.LIST_ID = "#spotReviewList";

SpotReview.init = function() {
	// nop.
}
SpotReview.onBeforeShow = function(ev, info){
	SpotReview.load(Spot.current.data.id);
}

SpotReview.load = function(spotId) {
	$(SpotReview.LIST_ID).html("");
	Kokorahen.listReviewAsync({
		success: function(list) {
			var div = $("#spotReviewList");
			var ul = $('<ul data-role="listview" data-inset="true" ></ul>');
			div.html("");
			div.append(ul);
			
			for (var i=0; i<list.length; i++) {
				ul.append($(SpotReview.getListItem(list[i])));
				Review.all[list[i].id] = list[i];
			}
			//jqt.setPageHeight();
			ul.listview();
		},
		fail: function(e) {
			alert(e);
		}
	}, spotId);
}

SpotReview.getListItem = function(data) {
	var spot = Spot.all[data.spotId];
	if (spot != null) spot = spot.data.name;
	var html =
"<li><a href='javascript:SpotReview.onReviewClick("+data.id+")'>"
	+"<div style='font-size:50%;'>"+data.nickname+" @"+spot+"</div>"
	+"<div>"+data.comment+"</div>"
"</a></li>";
	return html;
}

SpotReview.onReviewClick = function(reviewId) {
	if (reviewId == null) {
		var spotId = document.spot.id.value;
		if (spotId == "") return;
		var sd = Spot.all[spotId].data;
		Review.current = {
			id: "", spotId: sd.id, appraise: 0, comment: ""
		};
	} else {
		Review.current = Review.all[reviewId];
	}
	$.mobile.changePage(Review.ID, "slide");
}


//-----------------------------------------------------------------
//List tab

function List() {}
List.ID = "#list";
List.init = function()  {
	// nop.
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
		if (a._distance == b._distance) return 0;
		return (a._distance > b._distance) ? 1 : -1;
	});
	return list;
}

List.onBeforeShow = function() {
	var list = List.sortNear();
	var div = $("#listSpots");
	var ul = $('<ul data-role="listview" data-inset="true" ></ul>');
	div.html("");
	div.append(ul);
	
	for (var i=0; i<list.length && i<50; i++) {
		ul.append($("<li ><a href='javascript:List.onItemClick("
			+list[i].id+")'>"+list[i].name+"</a></li>"));
	}
	//jqt.setPageHeight();
	ul.listview();
}

List.onItemClick = function(id) {
	Spot.setCurrent(Spot.all[id]);
	$.mobile.changePage(Spot.ID, "slide");
}

//-----------------------------------------------------------------
//Timeline tab
function Timeline() {}
Timeline.ID = "#timeline";
Timeline.init = function() {
	// nop.
}
Timeline.onBeforeShow = function() {
	Kokorahen.listTimelineAsync({
		success: function(list) {
			var div = $("#timeLineList");
			var ul = $('<ul data-role="listview" data-inset="true" ></ul>');
			div.html("");
			div.append(ul);

			ul.html("");
			for (var i=0; i<list.length && i<50; i++) {
				ul.append($(Timeline.getListItem(list[i])));
				Review.all[list[i].id] = list[i];
			}
			//jqt.setPageHeight();
			ul.listview();
		},
		fail: function(e){
			alert(e);
		}
	});
}

Timeline.getListItem = function(data) {
	var spot = Spot.all[data.spotId];
	if (spot != null) spot = spot.data.name;
	var html =
"<li><a href='javascript:Timeline.onItemClick("+data.id+")'>"
	+"<span style='font-size:50%;'>"+data.nickname+" @"+spot+"</span>"
	+"<br/><span>"+data.comment+"</span>"
"</a></li>";
	return html;
}

Timeline.onItemClick = function(id) {
	Review.current = Review.all[id];
	$.mobile.changePage(Review.ID, "slide");
}



//-----------------------------------------------------------------
//Memo tab
function Memo() { }
Memo.ID = "#memo";
Memo.init = function() {
	// nop.
}
Memo.onBeforeShow = function() {
	var list = List.sortNear();
	var ul = $("#memoSpots");
	ul.html("");
	for (var i=0; i<list.length && i<50; i++) {
		ul.append($("<li class='arrow'><a href='javascript:Memo.onItemClick("
				+list[i].id+")'>"+list[i].name+"</a></li>"));
	}
	//jqt.setPageHeight();
}

Memo.onItemClick = function(id) {
	if (id == null) {
		id = document.spot.id.value;
		if (id == "") return;
	}
	var sd = Spot.all[id].data;
	Review.current = {
		id: "", spotId: sd.id, appraise: 0, comment: ""
	};
	$.mobile.changePage(Review.ID, "slide");
}

//-----------------------------------------------------------------
//Timeline tab
function User() { }
User.ID = "#user"
User.init = function()  {
	// nop.
}
User.onBeforeShow = function() {
	if (Login.user == null) return;
	document.user.username.value = Login.user.username;
	document.user.nickname.value = Login.user.nickname;
}

//-------------------------------------------------------------------
//Review
function Review() { }
Review.ID = "#review";
Review.all = {};
Review.current = null;
Review.init = function() {
	// ☆選択初期化
	$('#appraise_raty').raty({
		click: function(score, evt) {
			document.review.appraise.value = score;
		},
		size: 60,
		path: "/images",
		starHalf:   'star-half-big.png',
		starOff:    'star-off-big.png',
		starOn:     'star-on-big.png'
	});

}

Review.onBeforeShow = function() {
	if (Review.current == null) return;
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
Login.ID = "#login";
Login.user = {username: null};

Login.init = function() {
	Login.user = Kokorahen.getLoginUser();
	//if (Login.nickname == null || Login.nickname == "") {
	//	Login.nickname = Login.username;
	//}
}
Login.onBeforeShow = function() {
	if (Login.user != null) {
		$.mobile.changePage(Map.ID);
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
	Login.user = null;
}

//-------------------------------------------------------------------
//Util
function Util() {}

Util.getAreas = function(minLat, minLng, maxLat, maxLng){
	var list = [];

	var mode = 100; // 1Km
	var len = 6;
	var w = maxLat - minLat;
	if (w > 0.05) { // >5Km
		mode = 10; // 10Km
		len = 5;
	} else if (w < 0.01) { // <1Km
		mode = 1000;
		len = 7;
	}

	minLat = Math.floor(minLat*mode);
	minLng = Math.floor(minLng*mode);
	maxLat = Math.floor(maxLat*mode);
	maxLng = Math.floor(maxLng*mode);

	for (var lat = minLat; lat<=maxLat; lat+=1) {
		for (var lng = minLng; lng<=maxLng; lng+=1) {
			var area =
				Util.toZeroPrefix("00",(lat/mode),len)+","+
				Util.toZeroPrefix("00",(lng/mode),len);
			list.push(area);
			if (list.length>100) return list;
		}
	}
	return list;
}
Util.toZeroPrefix = function(zeros, val, len) {
	var str = zeros + val;
	return str.substr(str.length-len);
}
Util.eventBreaker = function(ev) {
	if(ev.stopPropagation) ev.stopPropagation();
	ev.preventDefault();
	return false;
}

//-------------------------------------------------------------------
//Util-Selector
function Selector(xpath, tree, pleceMsg){
	this.xpath = xpath;
	this.mapping = {};

	var sel = $(xpath);
	var html = "<option value=''>"+pleceMsg+"</option>"
		+ this.tree2html(tree,"",0);
	sel.html(html);
	sel.data("Selector", this);
}
Selector.isSetuped = false;
Selector.SPACE="                 ";

Selector.prototype.tree2html = function(tree, parent, indent) {
	var html = "";
	var spc = Selector.SPACE.substr(0, indent);
	for (var key in tree) {
		var val = parent+"/"+key;
		html += "<option value='"+val+"'>"+spc+key+"</option>"
		if (tree[key] != null) {
			html += this.tree2html(tree[key], parent+"/"+key, indent+1);
		}
		this.mapping[key] = val;
	}
	return html;
}

Selector.prototype.setValue = function(vals) {
	var sel = $(this.xpath);
	var list = [];
	for (var i=0; i<vals.length; i++) {
		var val = this.mapping[vals[i]];
		if (val != null) list.push(val);
	}
	sel.val(list);
	//sel.selectmenu("refresh");	
}
Selector.prototype.getValue = function() {
	var sel = $(this.xpath);
	var vals = sel.val();
	var list = [];
	for (var i=0; i<vals.length; i++) {
		var val = vals[i].match(/[^/]*$/)[0];
		list.push(val);
	}
	return list;
}
Selector.onChangeWithParent = function(ev, _this) {
	var sel = $(_this);
	var vals = sel.val();
	if (vals == null) return;
	var keys = {};

	for (var i=0; i<vals.length; i++) {
		var val = vals[i];
		while(val.length > 0) {
			keys[val] = true;
			val = val.replace(/[/][^/]*$/,"");
		}
	}

	var list = [];
	for (var k in keys) {
		list.push(k);
	}
	//alert(list);
	sel.val(list);	
	sel.selectmenu("refresh");	
}
Selector.onChangeIntensive = function(ev, _this) {
	var sel = $(_this);
	var vals = sel.val();
	if (vals == null) return;
	var keys = {};

	for (var i=0; i<vals.length; i++) {
		keys[vals[i]] = true;
	}
	for (var i=0; i<vals.length; i++) {
		var val = vals[i].replace(/[/][^/]*$/,"");
		while (val.length > 1) {
			if (keys[val]) {
				keys[vals[i]] = false;
				break;
			}
			val = val.replace(/[/][^/]*$/,"");
		}
	}
	keys[""] = false;
	
	var list = [];
	for (var k in keys) {
		if (keys[k]) list.push(k);
	}

	//alert(list);
	sel.val(list);	
	sel.selectmenu("refresh");	
}

Selector.setup = function() {
	if (Selector.isSetuped) return;

	var atags = $("a.ui-link-inherit");
	atags.each(function(i) {
		var atag = $(this);
		var text = atag.text();
		var indent = text.match(/^[ ]*/)[0];
		if (indent.length == 0) return;
		atag.css("margin-left",indent.length+"em");
		atag.text(text.replace(/^[ ]*/,""));
	});
	Selector.isSetuped = true;
}
//-------------------------------------------------------------------
//Util-DaysSelector
function DaysSelector(xpath, pleceMsg){
	this.xpath = xpath;
	var days = DaysSelector.BASE_DATA;
	var html = "";
	for (var i=0; i<days.length; i++) {
		var name1 = days[i].id+"-L";
		var name2 = days[i].id+"-D";

		html +=
'<li>'			
+'<span class="SpotDaysBtn">'
+'<div data-role="fieldcontain">'
+'<fieldset data-role="controlgroup" data-type=horizontal data-role="fieldcontain">' 
+'<input type="checkbox" name="'+name1+'" id="'+name1+'" onchange="DaysSelector.onChange(event,this)" />'
+'<label for="'+name1+'">昼</label>'
+'<input type="checkbox" name="'+name2+'" id="'+name2+'" onchange="DaysSelector.onChange(event,this)" />'
+'<label for="'+name2+'">夜</label>'
+'</fieldset>'
+'</div>'
+'</span>'+days[i].label
+'</li>'
		;
	}
	$(xpath).html(html);
}
DaysSelector.ID = "#spotDaysDialog";

DaysSelector.BASE_DATA = [
                      	{label:"月曜日", id:"Mon"},
                      	{label:"火曜日", id:"Tue"},
                      	{label:"水曜日", id:"Wen"},
                      	{label:"木曜日", id:"Thu"},
                      	{label:"金曜日", id:"Fri"},
                      	{label:"土曜日", id:"Sat"},
                      	{label:"日曜日", id:"Sun"},
                      	{label:"祝日",   id:"Fet"}
];

DaysSelector.onShow = function(ev, ui) {
	var days = DaysSelector.BASE_DATA;
	for (var i=0; i<days.length; i++) {
		var name1 = days[i].id+"-L";
		var name2 = days[i].id+"-D";
		$("#"+name1).checkboxradio("refresh");
		$("#"+name2).checkboxradio("refresh");
	}
}

DaysSelector.onChange = function(ev, _this) {
	var label = "";
	var days = DaysSelector.BASE_DATA;
	for (var i=0; i<days.length; i++) {
		var name1 = days[i].id+"-L";
		var name2 = days[i].id+"-D";

		var isL = $("#"+name1).is(':checked');
		var isD = $("#"+name2).is(':checked');

		if (isL || isD) {
			label += ","+days[i].label.substr(0,1);
		}
		if (isL && !isD) {
			label += "昼";
		} else if (!isL && isD) {
			label += "夜";
		}
	}

	if (label.length == 0) {
		label = ",無休"
	}
	
	$("#spotDays .ui-btn-text").text(label.substr(1));
}


/* EOF */

