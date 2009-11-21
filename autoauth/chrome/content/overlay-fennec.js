var AUTOAUTH = {
	get strings() { return document.getElementById("autoauth-bundle"); },
	
	lastAuth : 0,
	prefs : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.autoAuth."),
	
	load : function () {
		window.addEventListener("DOMWillOpenModalDialog", AUTOAUTH.handleEvent, true);
	},
	
	handleEvent : function (e) {
		switch (e.type) {
			case "DOMWillOpenModalDialog":
				setTimeout(function(e) { AUTOAUTH.autoAccept(); }, 500);
			break;
		}
	},
	
	autoAccept : function () {
		if ( Math.round(new Date().getTime() / 1000) - AUTOAUTH.prefs.getIntPref("lastAuth") <= 3) {
			return;
		} 
		
		if (document.getElementById("prompt-password-dialog")) {
			if ((document.getElementById("prompt-password-user").value != '') && (document.getElementById("prompt-password-password").value != '')){
				AUTOAUTH.prefs.setIntPref("lastAuth", Math.round(new Date().getTime() / 1000));
				document.getElementById("cmd_ok").doCommand();
			}
		}
	},
	
	log : function(m) {
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage("AUTOAUTH: " + m);
	}
};

addEventListener("load", AUTOAUTH.load, true);