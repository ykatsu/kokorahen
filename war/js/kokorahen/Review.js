
//-------------------------------------------------------------------
//Review
function Review() { }
Review.ID = "#review";
Review.USER_PHOTO = "#reviewUserPhoto"
Review.PHOTO = "#reviewPhoto"
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
	var reviewForm = document.review;
	if (Review.current == null) return;
	reviewForm.id.value        = Review.current.id;
	reviewForm.nickname.value  = Review.current.nickname;
	reviewForm.spotId.value    = Review.current.spotId;
	reviewForm.comment.value   = Review.current.comment;
	reviewForm.appraise.value  = Review.current.appraise;
	$.fn.raty.start(Review.current.appraise, "#appraise_raty");
	
	if (Review.current.userPhotoUrl == null) Review.current.photoUrl = "/images/user.png";
	$(Review.USER_PHOTO).attr("src", Review.current.userPhotoUrl);
	if (Review.current.photoUrl == null) Review.current.photoUrl = "/images/noimage.gif";
	$(Review.PHOTO).attr("src", Review.current.photoUrl);
		

	reviewForm.name.value = Spot.all[Review.current.spotId].data.name;
	if (Review.current.isNewReview) {
		$("#reviewAddFollowBtn").hide();
		$("#reviewMoreUserBtn").hide();
		$("#reviewMoreSpotBtn").hide();
	} else {
		$("#reviewAddFollowBtn").show();
		$("#reviewMoreUserBtn").show();
		$("#reviewMoreSpotBtn").show();
	}
}

Review.addFollow = function() {
	UserConf.addFollow(Review.current.userId);
}
Review.moreUser = function() {
	UserReview.setUsername(Review.current.userId);
	Util.changePage(UserReview.ID);
}
Review.moreSpot = function() {
	SpotInfo.setCurrent(Spot.getSpotForId(Review.current.spotId));
	Util.changePage(SpotReview.ID);
}

Review.write = function() {
	var params = {};
	var elems = document.review.elements;
	for (var i=0; i<elems.length; i++) {
		params[elems[i].name] = elems[i].value;
	}
	var sd = Spot.all[Review.current.spotId].data;
	params.lat = sd.lat;
	params.lng = sd.lng;
	params.tags = sd.tags;
	params.photoUrl = $(Review.PHOTO).attr("src");
	if (params.photoUrl.match(/^[/]images/)) params.photoUrl = null;

	var id = Kokorahen.writeReview(params);
	alert("review id="+id);
}
