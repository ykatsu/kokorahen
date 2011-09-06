
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
Spot.MAP = "#mapCanvas2";
Spot.MAP_MASK = "#mapCanvas2Mask";
Spot.HOME_IMG = "/images/Home.png";
Spot.current = null;

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
			zoom: 18, noClear: true,
			center: Map.DEFAULT_CENTER,
			scaleControl: false, disableDefaultUI: true,
			mapTypeId: google.maps.MapTypeId.ROADMAP
	}

	Spot.map = new google.maps.Map(document.getElementById("mapCanvas2"),mapopts2);
	Spot.marker2 = new google.maps.Marker({
		position: Map.DEFAULT_CENTER, map: Spot.map,
		draggable: true
	});
	google.maps.event.addListener(Spot.map, 'idle', Spot.onMap2Idle);
	google.maps.event.addListener(Spot.map, 'click', Spot.onMap2Click);

	$(Spot.MAP_MASK).click( function(){
		$(document.spot.address).focus();
	});
	$(Spot.ID).click( function(){
		$(document.spot).blur();
	});

	var form = document.spot;
	$(form.address).focus( function(){
		$(Spot.MAP_MASK).hide();
	}).blur( function(){
		$(Spot.MAP_MASK).show();
	});


	$(form.timeLunchMax).focus(function(ev) {
		var min = $(form.timeLunchMin);
		var max = $(this);
		if (min.val() > max.val()) {
			max.val(min.val());
			//max.selectmenu("refresh");
			max.blur();
			max.focus();
		}
	});
	$(form.timeDinnerMax).focus(function(ev) {
		var min = $(form.timeDinnerMin);
		var max = $(this);
		if (min.val() > max.val()) {
			max.val(min.val());
			//max.selectmenu("refresh");
			max.blur();
			max.focus();
		}
	});

	function getTimeHtml(start, end) {
		var html = "";
		for (var h=start; h<=end; h++) {
			var hh = ("0"+h).match(/[0-9]{2}$/)[0];
			for (var m=0; m<60; m+=30) {
				var hhmm = hh + ":" + ("0"+m).match(/[0-9]{2}$/)[0];
				html += "<option>"+hhmm+"</option>"
			}
		}
		return html;
	}
	
	var optNil = "<option value=''>--:--</option>";
	var opt0_6   = getTimeHtml(0,6);
	var opt7_13  = getTimeHtml(7,13);
	var opt14_23 = getTimeHtml(14,23);
	var opt24_30 = getTimeHtml(24,30);

	var lunch = optNil+opt7_13+opt14_23+opt0_6;
	var dinner = optNil+opt14_23+opt24_30+opt7_13;
	$(form.timeLunchMin).html(lunch);
	$(form.timeLunchMax).html(lunch);
	$(form.timeDinnerMin).html(dinner);
	$(form.timeDinnerMax).html(dinner);

}

Spot.all = {};
Spot.isMapFocus = false;

Spot.getSpot = function(data) {
	if (Spot.all[data.id]) return Spot.all[data.id];
	var spot = new Spot(data);
	Spot.all[data.id] = spot;
	return spot;
}
Spot.clearCache = function() {
	for (var id in Spot.all) {
		Spot.all[id].marker.setMap(null);
		Spot.all[id].marker = undefined;
		delete Spot.all[id];
	}
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
	Spot.setSpotPos(Spot.marker2.getPosition());
	//Spot.map.setCenter(Spot.marker2.getPosition());
}
Spot.onMap2Idle = function(ev) {
	$("//a[target='_blank']").attr("href","#");
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

		for (var i=0; i<spotForm.length; i++) {
			spotForm[i].value = "";
		}
		SpotTags.setFormTags([]);
		ClosedDays.clear();
		Spot.setSpotPos(pos);

		$("#spotReviewBtn").hide();

	} else {
		pos = new google.maps.LatLng(sd.lat, sd.lng);

		for (var key in sd) {
			if (spotForm[key]) spotForm[key].value = sd[key];
		}
		SpotTags.setFormTags(sd.tags);
		ClosedDays.setValue(sd.closedDay.split(","));
	
		if (sd.image != null && sd.image != "") {
			spotImage.attr("src", sd.image);
		}
		$("#spotReviewBtn").show();
	}

	Spot.marker2.setPosition(pos);
	//Spot.marker2.setVisible(true);
	//Spot.map.setCenter(pos);
};

//Spot.onBeforeShow = function(ev, info){
	//Util.dialogFinally();
//}

Spot.onShow = function(ev, info){
	Util.dialogFinally();
	// Note: 地図が初期状態で非表示だと誤動作するのでその対処。
	google.maps.event.trigger(Spot.map, "resize");
	Spot.marker2.setVisible(true);
	Spot.map.setCenter(Spot.marker2.getPosition());
	SpotTags.setLabel($("#spotTags")[0],SpotTags.formTags,"ジャンル選択");
	ClosedDays.updateLabel();
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
		spotForm.address.scrollLeft = 1000;
	});
};

Spot.write = function(){
	var params = {};
	var elems = document.spot.elements;
	for (var i=0; i<elems.length; i++) {
		params[elems[i].name] = elems[i].value;
	}
	params.tags = SpotTags.formTags;
	params.closedDay = ClosedDays.getValue().join(",");
	var id = Kokorahen.writeSpot(params);
	alert("sopt id="+id);

	if (params.id == "") {
		Map.clearSpot();
	}
}
