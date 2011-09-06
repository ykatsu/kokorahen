
//-----------------------------------------------------------------
//Memo tab
function Memo() { }
Memo.ID = "#memo";
Memo.init = function() {
	// nop.
}
Memo.onBeforeShow = function() {
	Util.setNavbar(Memo.ID);

	var list = List.sortNear();
	var ul = $("#memoSpots");
	ul.html("");
	for (var i=0; i<list.length && i<50; i++) {
		ul.append($("<li class='arrow'><a href='javascript:Memo.onItemClick("
				+list[i].id+")'>"+list[i].name+"</a></li>"));
	}
	//jqt.setPageHeight();
}

Memo.onItemClick = function(id) {
	if (id == null) {
		id = document.spot.id.value;
		if (id == "") return;
	}
	var sd = Spot.all[id].data;
	Review.current = {
		id: "", spotId: sd.id, appraise: 0, comment: ""
	};
	Util.changePage(Review.ID);
}
