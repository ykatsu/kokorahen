
function ClosedDays(xpath, pleceMsg){
	this.xpath = xpath;
	var days = ClosedDays.BASE_DATA;
	var html = "";
	for (var i=0; i<days.length; i++) {
		var name1 = days[i]+"-L";
		var name2 = days[i]+"-D";
		var label = ClosedDays.MAPPING[days[i]]+"曜日";
		if (days[i] == "Fet") {
			html += "<li></li>"
			label = ClosedDays.MAPPING[days[i]]+"日";
		}
		
		html +=
'<li>'			
+'<span class="SpotDaysBtn">'
+'<div data-role="fieldcontain">'
+'<fieldset data-role="controlgroup" data-type=horizontal data-role="fieldcontain">' 
+'<input type="checkbox" name="'+name1+'" id="'+name1+'" onchange="ClosedDays.onChange(event,this)" />'
+'<label for="'+name1+'">昼</label>'
+'<input type="checkbox" name="'+name2+'" id="'+name2+'" onchange="ClosedDays.onChange(event,this)" />'
+'<label for="'+name2+'">夜</label>'
+'</fieldset>'
+'</div>'
+'</span>'+label
+'</li>'
		;
	}
	$(xpath).html(html);
}
ClosedDays.ID = "#spotDaysDialog";
ClosedDays.INSTANCE;

ClosedDays.BASE_DATA = [
	"Mon","Tue","Wen","Thu","Fri","Sat","Sun","Fet"
];
ClosedDays.MAPPING = {
	"月":"Mon", "火":"Tue", "水":"Wen", "木":"Thu",
	"金":"Fri", "土":"Sat", "日":"Sun", "祝":"Fet",
	"Mon":"月", "Tue":"火", "Wen":"水", "Thu":"木",
	"Fri":"金", "Sat":"土", "Sun":"日", "Fet":"祝"
}
	
ClosedDays.init = function() {
	ClosedDays.INSTANCE = new ClosedDays("#spotDaysList");
}
ClosedDays.open = function() {
	Util.dialog(ClosedDays.ID);
}

ClosedDays.onShow = function(ev, ui) {
	var days = ClosedDays.BASE_DATA;
	for (var i=0; i<days.length; i++) {
		var name1 = days[i]+"-L";
		var name2 = days[i]+"-D";
		$("#"+name1).checkboxradio("refresh");
		$("#"+name2).checkboxradio("refresh");
	}
}
ClosedDays.clear = function() {
	var days = ClosedDays.BASE_DATA;
	for (var i=0; i<days.length; i++) {
		$("#"+days[i]+"-L").attr('checked',null);
		$("#"+days[i]+"-D").attr('checked',null);
	}
}
ClosedDays.setValue = function(list) {
	ClosedDays.clear();
	for (var i=0; i<list.length; i++) {
		var item = list[i];
		var day = ClosedDays.MAPPING[item.substr(0,1)];
		if (item.length == 1) {
			$("#"+day+"-L").attr('checked','checked');
			$("#"+day+"-D").attr('checked','checked');
		} else {
			if (item.indexOf("昼")>0) {
				$("#"+day+"-L").attr('checked','checked');
			} else {
				$("#"+day+"-D").attr('checked','checked');
			}
		}
	}
}

ClosedDays.getValue = function() {
	var list = [];
	var days = ClosedDays.BASE_DATA;
	for (var i=0; i<days.length; i++) {
		var name1 = days[i]+"-L";
		var name2 = days[i]+"-D";

		var isL = $("#"+name1).is(':checked');
		var isD = $("#"+name2).is(':checked');

		var youbi = ClosedDays.MAPPING[days[i]];
		if (isL && isD) {
			list.push(youbi);
		} else if (isL && !isD) {
			list.push(youbi+"昼");
		} else if (!isL && isD) {
			list.push(youbi+"夜");
		}
	}
	return list;
}
ClosedDays.onChange = function(ev, _this) {
	ClosedDays.updateLabel();
}
ClosedDays.updateLabel = function() {
	var list = ClosedDays.getValue();
	if (list.length == 0) {
		$("#closedDays .ui-btn-text").text("無休");
	} else {
		$("#closedDays .ui-btn-text").text(list.join(","));
	}
}


/* EOF */

