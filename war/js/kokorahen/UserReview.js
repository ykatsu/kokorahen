
//-----------------------------------------------------------------
//UserReview
function UserReview() { }
UserReview.ID = "#userReview";
UserReview.LIST_ID = "#userReviewList";
UserReview.PHOTO = "#userReviewPhoto";
UserReview.LIMIT = 30;
UserReview.user = null;

UserReview.init = function() {
	// nop.
}

UserReview.onBeforeShow = function(ev, info){
	$(UserReview.PHOTO).attr("src", UserReview.user.photoUrl);
	var form = document.userReview;
	$(form.nickname).val(UserReview.user.nickname);
	$(form.comment).val(UserReview.user.comment);
	UserReview.load(UserReview.user);
}

UserReview.setUsername = function(name){
	UserReview.user = User.getUser(name);
}


UserReview.load = function(user) {
	$(UserReview.LIST_ID).html("");
	Kokorahen.listTimelineAsync({
		success: function(list) {
			var div = $(UserReview.LIST_ID);
			if (list.length == 0) {
				div.html("まだレビューはありません。");
				return;
			}

			var ul = $('<ul data-role="listview" data-inset="true" ></ul>');
			div.html("");
			div.append(ul);
			
			for (var i=0; i<list.length; i++) {
				ul.append($(UserReview.getListItem(list[i])));
				Review.all[list[i].id] = list[i];
			}
			//jqt.setPageHeight();
			ul.listview();
		},
		fail: function(e) {
			alert(e);
		}
	}, {username:UserReview.user.username, limit:UserReview.LIMIT});
}

UserReview.getListItem = function(data) {
	var html =
"<li><a href='javascript:UserReview.onReviewClick("+data.id+")'>"
	+"<div style='font-size:50%;'>"+data.nickname+" @"+data.spotName+"</div>"
	+"<span>"+data.comment+"</span>"
"</a></li>";
	return html;
}

UserReview.onReviewClick = function(reviewId) {
	if (reviewId == null) {
		var spotId = document.spot.id.value;
		if (spotId == "") return;
		var sd = Spot.all[spotId].data;
		Review.current = {
			id: "", spotId: sd.id, appraise: 0, comment: "",
			nickname: Login.user.nickname, isNewReview:true
		};
	} else {
		Review.current = Review.all[reviewId];
	}
	Util.changePage(Review.ID);
}
