/**
konohen メインページ.js
@auther kotemaru@kotemaru.org
*/

$(function(){
	initMap();
});


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

var map;
var marker; // 現在位置マーカー 
var center;
var balloon; // バルーン
var balloonMarker; // バルーンを出してるマーカー
var markers = {}; // マーカーの一覧。

/**
 * マップ初期化
 */
function initMap() {
	// デフォルト中心、皇居
	center = new google.maps.LatLng(35.684699,139.753897);

	// マップ生成
	var mapopts = {
		zoom: 14,
		center: center,
		scaleControl: true,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	map = new google.maps.Map(document.getElementById("mapCanvas"),mapopts);

	// カスタムボタン追加。
	map.controls[google.maps.ControlPosition.TOP_RIGHT].push(
$("<div id='menuButton'>検索条件</div>")[0]);

	// 現在位置マーカー生成
	marker = new google.maps.Marker({position: center, map: map});

	// バルーン生成。
	balloon = new google.maps.InfoWindow({
		content: $("#balloon").html().replace(/[$][{]formName[}]/g,"balloonForm"),
		size: new google.maps.Size(100, 80)
	});

	// マップ、バルーンのイベントハンドラ設定。
	google.maps.event.addListener(map, 'click', onMapClick);
	google.maps.event.addListener(balloon, 'domready', onLoadBalloon);

	// GPSから現在位置取得、
	navigator.geolocation.watchPosition(geoUpdate, 
			function(e){waitingIcon(false);});
	//waitingIcon(true);
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
	waitingIcon(false);
	// 現在位置マーカーをGPS位置に移動。
	onMapClick({latLng: center});
}

/**
 * マップクリックイベント処理。
 */
function onMapClick(ev) {
	// 現在位置マーカをクリック位置に移動。
	marker.setPosition(ev.latLng);
	marker.setVisible(true);
	// 現在位置マーカのバルーンを表示
	balloonMarker = marker;
	balloon.open(map,marker);

	// マップの表示範囲取得。
	var rect = map.getBounds();
	if (rect == null) return;
	var latNE = rect.getNorthEast().lat();
	var lngNE = rect.getNorthEast().lng();
	var latSW = rect.getSouthWest().lat();
	var lngSW = rect.getSouthWest().lng();

	// サーバーから表示範囲内のマーカー取得。非同期。
	IchiMemo.listAsync(protMarkers, {
		username:"kotemaru27@gmail.com",
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
		//for (var key in markers) markers[key].setVisible(false);
		for (var i=0; i<list.length; i++) {
			var id = list[i].id;
			if (markers[id] == null) {
				// まだ無い場合は青ピンマーカーを生成する。
				var pos = new google.maps.LatLng(list[i].lat, list[i].lng);
				var m = new google.maps.Marker({position: pos, map: map,
						icon:pinImage, shadow:pinShadowImage
				});
				google.maps.event.addListener(m, 'click', onMarkerClick);
				m.masterData = list[i];
				markers[id] = m;
			} else {
				// 既に有る場合は表示を有効にする。
				markers[id].setVisible(true);
			}
		}
	},
	_throw: function(e) {
		alert(e);
	}
}

/**
 * マーカークリックイベント処理。
 */
function onMarkerClick(ev) {
	// 現在位置マーカーを消す
	marker.setVisible(false);
	// バルーンを表示する。
	balloonMarker = this;
	balloon.open(map,this);
}


/**
 * バルーン表示完了イベント処理。
 */
function onLoadBalloon(ev) {
	var form = document.getElementById("balloonForm");
	var pos = balloonMarker.getPosition();
	form.lat.value = pos.lat();
	form.lng.value = pos.lng();

	// 座標から住所を取得しinputタグに設定。
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({latLng: pos}, function(results, status){
		if(status == google.maps.GeocoderStatus.OK){
			form.address.value = results[0].formatted_address;
		} else {
			form.address.value = "???"; // error
		}
	});

	var img = document.getElementById("balloonImg");
	if (balloonMarker.masterData) {
		// 登録済マーカーならパラメータをformに復元。
		var md = balloonMarker.masterData;
		form.id.value = md.id;
		form.comment.value = md.comment;
		form.tags.value = md.tags;
		var img = document.getElementById("balloonImg");
		img.src = "/image?id="+md.images[0];
		//$("#balloonImgInput").hide();
		$("input[name='level']").val([md.level]);
		$("input[name='appraise']").val([md.appraise]);
	} else {
		// 新規マーカーならパラメータを初期化。
		form.comment.value = "";
		form.tags.value = "";
		img.src = "http://maps.google.co.jp/mapfiles/ms/icons/blue-pushpin.png";
		$("#balloonImgInput").show();
	}

}

/**
 * 画像選択イベント処理。
 */
function onImageSelect(_this, ev) {
	// 選択画像を読み込んでプレビューする。
	// HTML5機能。IE,safari 未対応。
	var reader = new FileReader();
	reader.onload = function(e) {
		var img = document.getElementById("balloonImg");
		img.src = reader.result;
	};
	reader.readAsDataURL(_this.files[0]); 	
}


/**
 * グルグル表示／非表示
 */
function waitingIcon(b) {
	if (b) {
		$("#waitingIcon").show();
	} else {
		$("#waitingIcon").hide();
	}
}

/* EOF */