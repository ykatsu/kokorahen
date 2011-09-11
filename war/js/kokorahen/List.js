
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
	Map.onTagChange();
	Util.setNavbar(List.ID);

	var list = List.sortNear();
	var div = $("#listSpots");

	if (list.length == 0) {
		div.html("周辺にSpotは有りません。");
		return;
	}
	
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
	Util.changePage(SpotInfo.ID);
}
