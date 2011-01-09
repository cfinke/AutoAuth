var AUTOAUTH = {
	strings : {
		_backup : null,
		_main : null,

		initStrings : function () {
			if (!this._backup) { this._backup = document.getElementById("autoauth-backup-bundle"); }
			if (!this._main) { this._main = document.getElementById("autoauth-bundle"); }
		},

		getString : function (key) {
			this.initStrings();

			var rv = "";

			try {
				rv = this._main.getString(key);
			} catch (e) {
			}

			if (!rv) {
				try {
					rv = this._backup.getString(key);
				} catch (e) {
				}
			}

			return rv;
		},

		getFormattedString : function (key, args) {
			this.initStrings();

			var rv = "";

			try {
				rv = this._main.getFormattedString(key, args);
			} catch (e) {
			}

			if (!rv) {
				try {
					rv = this._backup.getFormattedString(key, args);
				} catch (e) {
				}
			}

			return rv;
		}
	},
	
	lastAuth : 0,
	prefs : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.autoAuth."),
	
	load : function () {
		removeEventListener("load", AUTOAUTH.load, false);
		
		addEventListener("DOMWillOpenModalDialog", AUTOAUTH.handleEvent, true);
		
		addEventListener("unload", AUTOAUTH.unload, false);
	},
	
	unload : function () {
		removeEventListener("unload", AUTOAUTH.unload, false);
		
		removeEventListener("DOMWillOpenModalDialog", AUTOAUTH.handleEvent, true);
	},
	
	handleEvent : function (e) {
		switch (e.type) {
			case "DOMWillOpenModalDialog":
				setTimeout(AUTOAUTH.autoAccept, 500);
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