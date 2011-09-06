//-----------------------------------------------------------------
// JQuery Mobile onload.

$(document).bind("mobileinit", function(){
//  $.mobile.foo = bar;
//	$.mobile.selectmenu.prototype.options.nativeMenu = false;
});


//$(document).bind("mobileinit", function(){
$(function(){
//$("body").live('pagecreate',function(event){
		//var modules = [Login, Map, Timeline, List, Memo, User, Spot, SpotReview, Review];
	
	var modules = [Login, User, Map, Timeline, List, Memo, Spot, 
	               SpotReview, Review, SpotTags, ClosedDays, Util];

	function init(m) {
		if (m.init != undefined) m.init();
		if (m.onBeforeShow) {
			$(m.ID).bind('pagebeforeshow', function(ev, ui) {
				//try {
					m.onBeforeShow(ev,ui);
				//} catch(e) {
					// TODO: 例外が上がるとJQM(b2)が止まる。
					//alert(e.message+"\n"+e.url+":"+e.line);
				//}
			});
		}
		if (m.onShow) {
			$(m.ID).bind('pageshow', function(ev, ui) {
				//try {
					m.onShow(ev,ui);
				//} catch(e) {
					// TODO: 例外が上がるとJQM(b2)が止まる。
					//alert(e.message+"\n"+e.url+":"+e.line);
				//}
			});
		}
		if (m.onHide) {
			$(m.ID).bind('pagebeforehide', function(ev, ui) {
				//try {
					m.onHide(ev,ui);
					//} catch(e) {
					// TODO: 例外が上がるとJQM(b2)が止まる。
					//alert(e.message+"\n"+e.url+":"+e.line);
					//}
			});
		}
	};
	for (var i=0; i<modules.length; i++) init(modules[i]);

	//$("//div[data-role='dialog']").live('pageshow', function(ev, ui) {
	//	$("#spotTags").selectmenu('refresh');
	//});
	
	

/*
	$("//div[data-role='dialog']/div[0]/a[0]").live('click', function(ev) {
		$.mobile.pageLoading();
		setTimeout(function(ev){
			$("//div[data-role='dialog']").dialog('close');
			//$(".ui-dialog").dialog('close');
		},100);
		return Util.eventBreaker(ev);
	});
*/
/*
	$("//div[data-role='footer']").live('scrollstart',function(ev){
		//$(this).hide(0);
		this.style.display="none";
	}).live('scrollend',function(ev){
		$(this).show();
	});
*/
	
});


function updateOrientation() {
	Map.updateOrientation();
}
//window.onerror = function(msg, url, line) {
	//alert(msg+"\n"+url+":"+line);
//}
