
function User() { }
User.ID = "#user";
User.PHOTO = "#userPhoto";
User.all = {};
	
User.init = function()  {
	//$(".UserPhoto").error(function(ev){
	//	$(this).attr("src","/images/user.png");
	//});
}
User.onBeforeShow = function() {
	Util.setNavbar(User.ID);

	if (Login.user == null) return;
	//document.user.userId.value = Login.user.userId;
	//document.user.googleName.value = Login.user.googleName;
	//document.user.twitterName.value = Login.user.twitterName;
	document.user.nickname.value = Login.user.nickname;
	$(User.PHOTO).attr("src", Login.user.photoUrl);
}
User.setDefaultPhoto = function(img)  {
	img.src = "/images/user.png";
}

User.getUser = function(name) {
	if (User.all[name] != null) return User.all[name];
	var user = Kokorahen.getUserModelPublic(name);
	User.all[name] = user;
	return user;
}