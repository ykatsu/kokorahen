
//-----------------------------------------------------------------
//PicasaAlbum tab
function PicasaAlbum() {}
PicasaAlbum.ID = "#picasaAlbum";
PicasaAlbum.ALBUMS_DIV = "#picasaAlbumDiv";
PicasaAlbum.PHOTOS_DIV = "#picasaPhotoDiv";
PicasaAlbum.BACK_BTN = "#picasaAlbumBack";
PicasaAlbum.AREAT_DIV = "#picasaAreatDiv";
PicasaAlbum.albumid = null;
PicasaAlbum.target = null;

PicasaAlbum.init = function() {
}
PicasaAlbum.go = function(tgt) {
	PicasaAlbum.target = tgt;
	PicasaAlbum.albumid = null;
	Util.changePage(PicasaAlbum.ID);
}

PicasaAlbum.onBeforeShow = function() {
	$(PicasaAlbum.ALBUMS_DIV).hide();
	$(PicasaAlbum.PHOTOS_DIV).hide();
	$(PicasaAlbum.BACK_BTN).hide();
	if (Login.user.googleUser == null 
			|| Login.user.googleUser=="") {
		$(PicasaAlbum.AREAT_DIV).show();
		return;
	}
	
	$(PicasaAlbum.AREAT_DIV).hide();
	if (PicasaAlbum.albumid == null) {
		PicasaAlbum.showAlbums();
	} else {
		PicasaAlbum.showPhotos(PicasaAlbum.albumid);
	}
}
PicasaAlbum.showAlbums = function() {
	PicasaAlbum.albumid = null;
	Picasa.listAlbum(Login.user.googleUser, function(list) {
		var html = "";
		for (var i=0; i<list.length; i++) {
			html += "<img class='ui-shadow ui-btn-up-c' src='"
				+list[i].thumbnail+"' "
				+"onclick='PicasaAlbum.showPhotos(\""+list[i].albumid+"\")'/>";
		}
		$(PicasaAlbum.ALBUMS_DIV+" div").html(html);
		$(PicasaAlbum.ALBUMS_DIV).show(1000);
		$(PicasaAlbum.PHOTOS_DIV).hide(1000);
		$(PicasaAlbum.BACK_BTN).hide();
	});
}

PicasaAlbum.showPhotos = function(albumid) {
	PicasaAlbum.albumid = albumid;
	Picasa.listPhoto(Login.user.googleUser, albumid, function(list) {
		var html = "";
		for (var i=0; i<list.length; i++) {
			html += "<span class='ui-shadow ui-btn-up-c' ><p><img src='"
				+list[i].thumbnail+"' "
				+"onclick='PicasaAlbum.onItemClick(\""+list[i].thumb2+"\")'/>"
				+"</p></span>";
		}
		$(PicasaAlbum.PHOTOS_DIV+" div").html(html);	
		$(PicasaAlbum.ALBUMS_DIV).hide(1000);
		$(PicasaAlbum.PHOTOS_DIV).show(1000);
		$(PicasaAlbum.BACK_BTN).show();
	});
}


PicasaAlbum.onItemClick = function(url) {
	$(PicasaAlbum.target).val(url);
	$(PicasaAlbum.target).attr('src', url);
	$(PicasaAlbum.ID).dialog("close");
}
