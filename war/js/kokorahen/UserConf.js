
function UserConf() { }
UserConf.ID = "#userConf"
UserConf.LIST_ID = "#userFollowList";
UserConf.PHOTO = "#userConfPhoto";

UserConf.init = function()  {
	// nop.
}
UserConf.onBeforeShow = function() {
	//Util.setNavbar(User.ID);

	if (Login.user == null) return;
	var form = document.userConf;
	form.userId.value = Login.user.userId;
	form.googleUser.value = Login.user.googleUser;
	form.twitterUser.value = Login.user.twitterUser;
	form.nickname.value = Login.user.nickname;
	form.autoTwit.selectedIndex = Login.user.autoTwit ? 1 : 0;
	$(form.autoTwit).slider("refresh");
	$(UserConf.PHOTO).attr("src", Login.user.photoUrl);

	var list = Login.user.follows;
	var div = $(UserConf.LIST_ID);
	if (list == null || list.length == 0) {
		div.html("フォローユーザはいません。");
		return;
	}

	var ul = $('<ul data-role="listview" data-inset="true" ></ul>');
	div.html("");
	div.append(ul);
	
	for (var i=0; i<list.length; i++) {
		ul.append($(UserConf.getListItem(list[i])));
	}
	//jqt.setPageHeight();
	ul.listview();
}
UserConf.write = function() {
	var form = document.userConf;
	Login.user.googleUser = form.googleUser.value;
	Login.user.twitterUser = form.twitterUser.value;
	Login.user.nickname = form.nickname.value;
	Login.user.autoTwit = (form.autoTwit.selectedIndex != 0);
	Login.user.comment = form.comment.value;
	
	Login.user.photoUrl = $(UserConf.PHOTO).attr("src");
	if (Login.user.photoUrl.match(/^[/]images/)) Login.user.photoUrl = null;
	
	Kokorahen.writeUser(Login.user);
	Login.refresh();
}

UserConf.getListItem = function(userId) {
	var nickname = Login.user.followsNickname[userId];
	var html =
"<li><a href='javascript:UserConf.onFollowUserClick("+userId+")'"
+">"+nickname+"</a></li>";
	return html;
}


UserConf.addFollow = function(userId) {
	if (Login.user.follows.indexOf(userId) >= 0) {
		alert("既にフォローしてます。");
		return;
	}
	Login.user.follows.push(userId);
	Kokorahen.writeUser(Login.user);
	Login.refresh();
}

