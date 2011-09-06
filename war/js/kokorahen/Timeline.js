
//-----------------------------------------------------------------
//Timeline tab
function Timeline() {}
Timeline.ID = "#timeline";
Timeline.init = function() {
	// nop.
}
Timeline.onBeforeShow = function() {
	Util.setNavbar(Timeline.ID);

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
	Util.changePage(Review.ID);
}

