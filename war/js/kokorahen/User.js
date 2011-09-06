
function User() { }
User.ID = "#user"
User.init = function()  {
	// nop.
}
User.onBeforeShow = function() {
	Util.setNavbar(User.ID);

	if (Login.user == null) return;
	document.user.username.value = Login.user.username;
	document.user.nickname.value = Login.user.nickname;
}
