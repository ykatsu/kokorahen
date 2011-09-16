
function UserConf() { }
UserConf.ID = "#userConf"
UserConf.LIST_ID = "#userFollowList";

UserConf.init = function()  {
	// nop.
}
UserConf.onBeforeShow = function() {
	Util.setNavbar(User.ID);

	if (Login.user == null) return;
	var form = document.userConf;
	form.username.value = Login.user.username;
	form.nickname.value = Login.user.nickname;
	form.autoTwit.selectedIndex = Login.user.autoTwit ? 1 : 0;
	$(form.autoTwit).slider("refresh");

	var list = Login.user.follows;
	var div = $(UserConf.LIST_ID);
	if (list.length == 0) {
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

UserConf.getListItem = function(username) {
	var nickname = Login.user.followsNickname[username];
	var html =
"<li><a href='javascript:UserConf.onFollowUserClick("+username+")'"
+">"+nickname+"</a></li>";
	return html;
}


UserConf.addFollow = function(username) {
	if (Login.user.follows.indexOf(username) >= 0) {
		alert("既にフォローしてます。");
		return;
	}
	Login.user.follows.push(username);
	Kokorahen.writeUser(Login.user);
	Login.refresh();
}
