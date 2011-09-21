
//-------------------------------------------------------------------
//Review
function Review() { }
Review.ID = "#review";
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
	$(Review.PHOTO).attr("src", Review.current.photoUrl);

	reviewForm.name.value = Spot.all[Review.current.spotId].data.name;
	if (Review.current.isNewReview) {
		$("#reviewAddFollowBtn").hide();
	} else {
		$("#reviewAddFollowBtn").show();
	}
}

Review.addFollow = function() {
	UserConf.addFollow(Review.current.username);
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

	var id = Kokorahen.writeReview(params);
	alert("review id="+id);
}
