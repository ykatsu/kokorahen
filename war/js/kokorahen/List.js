
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
	var curPos = Map.marker.getPosition();
	var range = 0.05;
	var params =  {
			tag: SpotTags.getSearchTag(), 
			limit: Spot.LIMIT,
			latMin : curPos.lat()-range,
			lngMin : curPos.lng()-range,
			latMax : curPos.lat()+range,
			lngMax : curPos.lng()+range
	};
	params.areas = List.getAreas(params);
	Kokorahen.getSpotsAsync(List.onloadGetSpots, params);
}

List.onloadGetSpots = {
	success: function(list, args){
		var curPos = Map.marker.getPosition();
		var spots = [];
		for (var i=0; i<list.length; i++) {
			var spot = Spot.getSpot(list[i]);
			spot._distance =
				List.compDistance(curPos, spot.marker.getPosition());
			spots.push(Spot.getSpot(list[i]));
		}
		
		spots.sort(function(a,b){
			if (a._distance == b._distance) return 0;
			return (a._distance > b._distance) ? 1 : -1;
		});
		List.listview(spots);
	}
}

List.onBeforeShow = function() {
	Map.onTagChange();
	Util.setNavbar(List.ID);
	List.sortNear();
}

List.listview = function(spots) {
	var div = $("#listSpots");

	if (spots.length == 0) {
		div.html("周辺にSpotは有りません。");
		return;
	}
	
	var ul = $('<ul data-role="listview" data-inset="true" ></ul>');
	div.html("");
	div.append(ul);

	for (var i=0; i<spots.length; i++) {
		ul.append($("<li ><a href='javascript:List.onItemClick("
			+spots[i].data.id+")'>"+spots[i].data.name+"</a></li>"));
	}
	
	//jqt.setPageHeight();
	ul.listview();
}

List.onItemClick = function(id) {
	SpotInfo.setCurrent(Spot.all[id]);
	Util.changePage(SpotInfo.ID);
}

List.getAreas = function(params, range){
	var latMin = params.latMin;
	var lngMin = params.lngMin;
	var latMax = params.latMax;
	var lngMax = params.lngMax;
	
	
	if (undefined === range) {
		var w = lngMax - lngMin;
		range = 0;
		for (var i=1; i<Spot.AREA_RANGE.length; i++) {
			if (w < Spot.AREA_RANGE[i].width) range = i;
		}
	}

	var list = [];
	var mode = Spot.AREA_RANGE[range].mode;
	var len = Spot.AREA_RANGE[range].len;
	
	latMin = Math.floor(latMin*mode);
	lngMin = Math.floor(lngMin*mode);
	latMax = Math.floor(latMax*mode);
	lngMax = Math.floor(lngMax*mode);

	for (var lat = latMin; lat<=latMax; lat+=1) {
		for (var lng = lngMin; lng<=lngMax; lng+=1) {
			var area =
				Util.toZeroPrefix((lat/mode),len)+","+
				Util.toZeroPrefix((lng/mode),len);
			list.push(area);
			if (list.length>100) return list;
		}
	}
	return list;
	
}
