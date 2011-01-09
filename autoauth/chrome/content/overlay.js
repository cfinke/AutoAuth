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
		
		if ( Math.round(new Date().getTime() / 1000) - this.prefs.getIntPref("lastAuth") <= 3) {
			return;
		} 
		
		if (document.getElementById("loginTextbox") && document.getElementById("password1Textbox")){
			if (!document.getElementById("loginContainer").hidden){
				if ((document.getElementById("loginTextbox").getAttribute("value") != '') && (document.getElementById("password1Textbox").getAttribute("value") != '')){
					this.prefs.setIntPref("lastAuth", Math.round(new Date().getTime() / 1000));
					if (typeof commonDialogOnAccept != 'undefined') {
						commonDialogOnAccept();
					}
					else {
						document.getElementById("commonDialog").acceptDialog();
					}
					
					window.close();
				}
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
							button.setAttribute("label", this.strings.getString("autoauth.autoFillWith"));
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
			}
		}
	},
	
	fillIn : function (username, password) {
		document.getElementById("loginTextbox").value = username;
		document.getElementById("password1Textbox").value = password;
		document.getElementById("checkbox").checked = true;
		onCheckboxClick(document.getElementById("checkbox"));
		
		commonDialogOnAccept();
		window.close();
	}
};