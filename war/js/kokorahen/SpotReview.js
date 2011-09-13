
//-----------------------------------------------------------------
//SpotReview
function SpotReview() { }
SpotReview.ID = "#spotReview";
SpotReview.LIST_ID = "#spotReviewList";

SpotReview.init = function() {
	// nop.
}
SpotReview.onBeforeShow = function(ev, info){
	SpotReview.load(SpotInfo.current.data.id);
}

SpotReview.load = function(spotId) {
	$(SpotReview.LIST_ID).html("");
	Kokorahen.listReviewAsync({
		success: function(list) {
			var div = $(SpotReview.LIST_ID);
			if (list.length == 0) {
				div.html("まだレビューはありません。");
				return;
			}

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
	Util.changePage(Review.ID);
}
