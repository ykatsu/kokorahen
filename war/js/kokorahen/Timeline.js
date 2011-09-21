
//-----------------------------------------------------------------
//Timeline tab
function Timeline() {}
Timeline.ID = "#timeline";
Timeline.FOLLOW_ONLY = "#tlFollowOnly";
Timeline.NEAR_ONLY = "#tlNearOnly";
Timeline.LIMIT = 30;
Timeline.init = function() {
	
	//$(Timeline.FOLLOW_ONLY).change(Timeline.reload);
	//$(Timeline.NEAR_ONLY).change(Timeline.reload);
	$(document.timeline.only).change(Timeline.reload);
}

Timeline.onBeforeShow = function() {
	Util.setNavbar(Timeline.ID);
	Timeline.reload();
}
Timeline.reload = function(ev) {
	params = {
		tag: SpotTags.getSearchTag(), 
		limit: Timeline.LIMIT
	};
/*
	if ($(Timeline.FOLLOW_ONLY).attr("checked")) {
		params.follows = Login.user.follows;
	}
	if ($(Timeline.NEAR_ONLY).attr("checked")) {
		var curPos = Map.marker.getPosition();
		params.lat = curPos.lat();
		params.lng = curPos.lng();
	}
*/
	if ($(Timeline.FOLLOW_ONLY).attr('checked') == "checked") {
		params.follows = Login.user.follows;
	} else {
		var curPos = Map.marker.getPosition();
		params.lat = curPos.lat();
		params.lng = curPos.lng();
	}
	var searchVal = $(document.timeline.search).val();
	if (searchVal != "") {
		params.search = searchVal;
	}
	
	Kokorahen.listTimelineAsync(Timeline.onTimeline, params);
}
Timeline.onTimeline = {
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
		alert(e.stack);
	}
};

Timeline.getListItem = function(data) {
	var appraise = Math.floor(data.appraise);
	if (appraise<=0) appraise = 1;
	var photo = data.photoUrl;
	if (photo == null || photo == "") photo = "/images/user.png";

	var html =
"<li><a href='javascript:Timeline.onItemClick("+data.id+")'>"
	+"<img class='UserPhoto' src='"+photo+"' onerror='User.setDefaultPhoto(this)' />"
	+"<img class='FaceMark' src='/images/face-"+appraise+".png' />"
	+"<span style='font-size:50%;'>"+data.nickname+" @"+data.spotName+"</span>"
	+"<br/><span>"+data.comment+"</span>"
"</a></li>";
	return html;
}

Timeline.onItemClick = function(id) {
	Review.current = Review.all[id];
	Util.changePage(Review.ID);
}

