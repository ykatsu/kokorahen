
Loader = {};
Loader.load = function(modules) {
	
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

};

