
//-------------------------------------------------------------------
//Login
function Login() { }
Login.ID = "#login";
Login.user = {username: null};

Login.init = function() {
	//Login.user = Kokorahen.getLoginUser();
	Login.user = __Login_user;
	//if (Login.nickname == null || Login.nickname == "") {
	//	Login.nickname = Login.username;
	//}
}
Login.onShow = function() {
	if (Login.user != null) {
		$.mobile.changePage(Map.ID, "slide");
		//setTimeout(function(){
		//	$.mobile.changePage(Map.ID, "none");
		//},100);
	}
}
Login.login = function(provider) {
	location.href = Kokorahen.login(provider);
}

Login.logout = function() {
	if (Login.user != null) {
		location.href = Kokorahen.logout(Login.user.provider);
	} else {
		location.href = Kokorahen.logout(null);
	}
	Login.user = null;
}
Login.refresh = function() {
	Login.user = Kokorahen.getLoginUser();
}
