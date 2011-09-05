
//-------------------------------------------------------------------
//Review
function Review() { }
Review.ID = "#review";
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
	if (Review.current == null) return;
	var reviewForm = document.review;
	reviewForm.id.value        = Review.current.id;
	reviewForm.spotId.value    = Review.current.spotId;
	reviewForm.comment.value   = Review.current.comment;
	reviewForm.appraise.value  = Review.current.appraise;
	$.fn.raty.start(Review.current.appraise, "#appraise_raty");

	reviewForm.name.value = Spot.all[Review.current.spotId].data.name;
}


Review.write = function() {
	var params = {};
	var elems = document.review.elements;
	for (var i=0; i<elems.length; i++) {
		params[elems[i].name] = elems[i].value;
	}
	var id = Kokorahen.writeReview(params);
	alert("review id="+id);
}
