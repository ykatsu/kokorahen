
function User() { }
User.ID = "#user"
User.PHOTO = "#userPhoto"
User.init = function()  {
	//$(".UserPhoto").error(function(ev){
	//	$(this).attr("src","/images/user.png");
	//});
}
User.onBeforeShow = function() {
	Util.setNavbar(User.ID);

	if (Login.user == null) return;
	document.user.username.value = Login.user.username;
	document.user.nickname.value = Login.user.nickname;
	$(User.PHOTO).attr("src", Login.user.photoUrl);
}
User.setDefaultPhoto = function(img)  {
	img.src = "/images/user.png";
}
