
//-------------------------------------------------------------------
//Util-Selector
function SpotTags(){}
SpotTags.ID = "#spotTagsDialog";
SpotTags.SELECTOR = "#spotTagsList";
SpotTags.button = null;

SpotTags.init = function() {
	var tagTree = 
	[
		"めし処",[
			"ラーメン",[
				"醤油ラーメン",
				"味噌ラーメン",
				"豚骨ラーメン",
				"塩ラーメン",
				"二郎系",
			],
			"カレー",[
				"インドカレー",
				"アジアンカレー",
				"洋風カレー",
			],
		],
		"飲み処",[
			"酒",[
				"日本酒",
				"焼酎",
				"ワイン",
				"ビール",
				"洋酒",
			],
			"居酒屋",[
				"和風居酒屋",
				"洋風居酒屋",
				"和民",
			],
			"バー"
		],
	];
	SpotTags.selector = 
		new Selector(SpotTags.SELECTOR, tagTree);
}
SpotTags.searchTags = [];
SpotTags.formTags = [];
SpotTags.openMode = null;


SpotTags.onBeforeShow = function() {
	SpotTags.selector.refresh();
}
SpotTags.open = function(btn, placeMsg, mode) {
	SpotTags.button = btn;
	SpotTags.placeMsg = placeMsg;
	SpotTags.openMode  = mode;
	if (mode == "search") {
		SpotTags.selector.setValue(SpotTags.searchTags);
		SpotTags.selector.isSingle = true;
	} else {
		SpotTags.selector.setValue(SpotTags.formTags);
		SpotTags.selector.isSingle = false;
	}

	Util.dialog(SpotTags.ID);
}
SpotTags.onHide = function() {
	var list = SpotTags.selector.getValue();
	if (SpotTags.openMode == "search") {
		SpotTags.searchTags = list;
	} else {
		SpotTags.formTags = list;
	}
	SpotTags.setLabel(SpotTags.button,list,SpotTags.placeMsg);
}
SpotTags.setFormTags = function(list) {
	SpotTags.formTags = list;
}
SpotTags.setLabel = function(btn, list, placeMsg) {
	var label = list.join(",");
	if (label == "") label = placeMsg;
	var span = $(".ui-btn-text",$(btn));
	span.text(label);
}

SpotTags.getSearchTag = function() {
	if (SpotTags.searchTags.length == 0) return null;
	return SpotTags.searchTags[0];
}


//-------------------------------------------------------------------
function Selector(xpath, tree){
	this.xpath = xpath;
	this.mapping = {};
	this.values = {};
	this.isSingle = false;

	var sel = $(xpath);
	var html = 
		this.tree2html(tree,"",0);
	sel.html(html);
	sel.data("Selector", this);
	//$(".ui-icon", sel).live('click',Selector.onClick);
	//$("li", sel).live('click',Selector.onClick);
}

Selector.prototype.tree2html = function(tree, parent, indent) {
	var html = "";
	for (var i=0; i<tree.length; i++) {
		var key = tree[i];
		var val = parent+"/"+key;
		html += "<li data-icon='checkbox-off' val='"+val+"'"
					+" onclick='Selector.onClick(event,this)'"
					+"><a href='#'"
					+" style='margin-left:"+indent+"em;'>"
					+key+"</a></li>";

		if (typeof tree[i+1] == "object") {
			html += this.tree2html(tree[++i], val, indent+1);
		}
		this.mapping[key] = val;
		//this.values[val] = false;
	}
	return html;
}

Selector.prototype.setValue = function(list) {
	this.values = {};
	for (var i=0; i<list.length; i++) {
		var val = this.mapping[list[i]];
		if (val != null) {
			this.values[val] = true;
		}
	}
}
Selector.prototype.clear = function() {
	this.values = {};
}
Selector.prototype.getValue = function() {
	var list = [];
	for (var val in this.values) {
		if (this.values[val]) {
			list.push(val.match(/[^/]*$/)[0]);
		}
	}
	return list;
}

Selector.prototype.refresh = function() {
	var sel = $(this.xpath);
	var lis = $("li", sel);
	var values = this.values;
	lis.each(function(){
		var li = $(this).removeClass( "ui-btn-active");
		var val = li.attr("val");
		var icon = li.find(".ui-icon")
			.removeClass( "ui-icon-checkbox-on")
			.removeClass( "ui-icon-checkbox-off");
		
		var val = li.attr("val");
		if (values[val]) {
			li.addClass( "ui-btn-active" );
			icon.addClass( "ui-icon-checkbox-on" );
		} else {
			icon.addClass( "ui-icon-checkbox-off" );
		}
	});
}

Selector.onClick = function(ev, ui) {
	//var li = $(ev.target).parents("li");
	var li = $(ui);
	var sel = li.parent("ul");
	var val = li.attr("val");
	var _this = sel.data("Selector");

	if (_this.isSingle) {
		var flag = !_this.values[val];
		_this.values = {};
		_this.values[val] = flag;
		_this.refresh();
		return;
	}
	
	var values = _this.values;
	var flag = !values[val];
	values[val] = flag;
	if (flag) {
		// 祖先をtrueにする
		while(val.length > 0) {
			values[val] = true;
			val = val.replace(/[/][^/]*$/,"");
		}
	} else {
		// 子孫をfalseにする
		var prefix = val+"/";
		for (var v in values) {
			if (v.indexOf(prefix) == 0) {
				values[v] = false;
			}
		}
	}
	_this.refresh();	
}
