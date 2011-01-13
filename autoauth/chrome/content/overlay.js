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
	
	prefs : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.autoAuth."),
	
	get lastAuthJSON () {
		var authText = AUTOAUTH.prefs.getCharPref("lastAuthJSON");
		
		try {
			var authJSON = JSON.parse(authText);
		} catch (e) { }
		
		if (!authJSON) {
			authJSON = {};
		}
		else {
			var now = Math.round(new Date().getTime() / 1000);
			
			for (i in authJSON) {
				if (now - authJSON[i] > 3) {
					delete authJSON[i];
				}
			}
			
			AUTOAUTH.prefs.setCharPref("lastAuthJSON", JSON.stringify(authJSON));
		}
		
		return authJSON;
	},
	
	mobileLoad : function () {
		removeEventListener("load", AUTOAUTH.mobileLoad, false);
		
		addEventListener("DOMWillOpenModalDialog", AUTOAUTH.mobileHandleEvent, true);
		
		addEventListener("unload", AUTOAUTH.mobileUnload, false);
	},
	
	mobileUnload : function () {
		removeEventListener("unload", AUTOAUTH.mobileUnload, false);
		
		removeEventListener("DOMWillOpenModalDialog", AUTOAUTH.mobileHandleEvent, true);
	},
	
	mobileHandleEvent : function (e) {
		switch (e.type) {
			case "DOMWillOpenModalDialog":
				setTimeout(AUTOAUTH.mobileAutoAccept, 500);
			break;
		}
	},
	
	mobileAutoAccept : function () {
		var now = Math.round(new Date().getTime() / 1000);
		
		var authKey = btoa(document.getElementById("prompt-password-message").textContent);
		
		var lastAuthJSON = AUTOAUTH.lastAuthJSON;
		
		if (authKey in lastAuthJSON && (now - lastAuthJSON[authKey] <= 3)) {
			return;
		}
		
		if (document.getElementById("prompt-password-dialog")) {
			if ((document.getElementById("prompt-password-user").value != '') && (document.getElementById("prompt-password-password").value != '')){
				lastAuthJSON[authKey] = now;
				AUTOAUTH.prefs.setCharPref("lastAuthJSON", JSON.stringify(lastAuthJSON));
				
				document.getElementById("cmd_ok").doCommand();
			}
		}
	},
	
	load : function () {
		removeEventListener("load", AUTOAUTH.load, false);
		
		var now = Math.round(new Date().getTime() / 1000);
		
		try {
			var args = window.arguments[0].QueryInterface(Ci.nsIWritablePropertyBag2).QueryInterface(Ci.nsIWritablePropertyBag);
			var authKey = args.getProperty("text");
			
			if (args.getProperty("promptType") != "promptUserAndPass") {
				return;
			}
		} catch (e) {
			// Firefox < 4
			var args = window.arguments[0].QueryInterface(Ci.nsIDialogParamBlock);
			var authKey = args.GetString(0);
			
			if (args.GetInt(3) != 2 || args.GetInt(4) == 1) {
				return;
			}
		}
		
		
		var lastAuthJSON = AUTOAUTH.lastAuthJSON;
		
		if (authKey in lastAuthJSON && (now - lastAuthJSON[authKey] <= 3)) {
			return;
		}
		
		if ((document.getElementById("loginTextbox").getAttribute("value") != '') && (document.getElementById("password1Textbox").getAttribute("value") != '')){
			lastAuthJSON[authKey] = now;
			AUTOAUTH.prefs.setCharPref("lastAuthJSON", JSON.stringify(lastAuthJSON));
			
			if (typeof commonDialogOnAccept != 'undefined') {
				commonDialogOnAccept();
			}
			else {
				document.getElementById("commonDialog").acceptDialog();
			}
			
			window.close();
		}
		/*
		else {
			var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"];

			if (passwordManager != null) {
				var matches = document.getElementById("info.box").getElementsByTagName("description")[0].firstChild.nodeValue.match(/(https?):\/\/([a-z0-9\.-]+)(:([0-9]+))?$/i);
				var protocol = matches[1];
				var host = matches[2];
				var port = matches[4];

				if (!port) {
					if (protocol == 'https') {
						port = 443;
					} else {
						port = 80;
					}
				}

				var possibleMatches = [];
				var hostREs = [];

				var hostParts = host.split('.');
				hostParts.shift();

				while (hostParts.length > 1) {
					var hostRE = hostParts.join("\.");
					hostRE = hostRE.replace(/-/g, "\-");

					hostREs.push(hostRE);

					hostParts.shift();
					possibleMatches.push([]);
				}

				passwordManager = passwordManager.createInstance();
				passwordManager.QueryInterface(Components.interfaces.nsIPasswordManager);

				var enumerator = passwordManager.enumerator;
				var nextPassword, host, username, password;
				var showList = false;

				passwordEntries : while(enumerator.hasMoreElements()) {
					try {
						nextPassword = enumerator.getNext().QueryInterface(Components.interfaces.nsIPassword);

						if (nextPassword.host.indexOf("://") == -1){
							for (var i = 0; i < hostREs.length; i++){
								if (nextPassword.host.match(hostREs[i])){
									var host = nextPassword.host;//.split('//')[1];
									possibleMatches[i].push({ 'username' : nextPassword.user, 'password' : nextPassword.password, 'host' : host.split(" ")[0] });
									var showList = true;
									continue passwordEntries;
								}
							}
						}	
					} catch (e) {
					}
				}
				
				if (showList) {
					var box = document.createElement("hbox");

					var button = document.createElement("button");
					button.setAttribute("label", AUTOAUTH.strings.getString("autoauth.autoFillWith"));
					button.setAttribute("onclick",'AUTOAUTH.fillIn(document.getElementById("autoauth-list").selectedItem.username, document.getElementById("autoauth-list").selectedItem.password);');

					var list = document.createElement("menulist");
					list.setAttribute("id","autoauth-list");
					var popup = document.createElement("menupopup");
					var done = false;
				
					for (var i = 0; i < possibleMatches.length; i++){
						for (var j = 0; j < possibleMatches[i].length; j++){
							var item = document.createElement("menuitem");
							item.setAttribute("label", possibleMatches[i][j].username + "@" + possibleMatches[i][j].host);
							item.username = possibleMatches[i][j].username;
							item.password = possibleMatches[i][j].password;
	
							popup.appendChild(item);
						
							done = true;
						}
					
						if (done) break;
					}

					list.appendChild(popup);
					box.appendChild(button);
					box.appendChild(list);

					document.getElementById("loginContainer").parentNode.appendChild(box);
				}
			}
		}
		*/
	},
	
	log : function (msg) {
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage("AUTOAUTH: " + msg);
	}/*,
	
	fillIn : function (username, password) {
		document.getElementById("loginTextbox").value = username;
		document.getElementById("password1Textbox").value = password;
		document.getElementById("checkbox").checked = true;
		onCheckboxClick(document.getElementById("checkbox"));
		
		commonDialogOnAccept();
		window.close();
	}*/
};