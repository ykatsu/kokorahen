
//-----------------------------------------------------------------
//PicasaPhoto tab
function PicasaPhoto() {}
PicasaPhoto.ID = "#picasaPhoto";
PicasaPhoto.LIST = "#picasaPhotoList";
PicasaPhoto.albumid = null;
PicasaPhoto.target = null;

PicasaPhoto.init = function() {
}
PicasaPhoto.go = function(id) {
	PicasaPhoto.albumid = id;
	Util.changePage(PicasaPhoto.ID);
}

PicasaPhoto.onBeforeShow = function() {
	Picasa.listPhoto("kotemaru27", PicasaPhoto.albumid, function(list) {
		var html = "";
		for (var i=0; i<list.length; i++) {
			html += "<span class='ui-shadow ui-btn-up-c' ><p><img src='"
				+list[i].thumbnail+"' "
				+"onclick='PicasaPhoto.onItemClick(\""+list[i].thumbnail+"\")'/>"
				+"</p></span>";
		}
		$(PicasaPhoto.LIST).html(html);	
	});
}


PicasaPhoto.onItemClick = function(url) {
	$(PicasaPhoto.target).val(url);
}

