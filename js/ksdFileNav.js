(function(window) {
	// Structure borrowed from: 
	// http://checkman.io/blog/creating-a-javascript-library/
	// This is the "module pattern".
	'use strict';
	function define_library() {
		var FileNav = {};

		// Private variables.
		var rootFolder = '';
		var navbar = '';
		var dirName = '';
		var mediaContainer = '';
		var dirList = '';
		var fileList = '';
		var playerHolderID = 'playerPlaceholder';

		// Handle the back button.
		window.addEventListener("popstate", function(e) {
			FileNav.loadAndDisplayNewListing(getURLFromSearchPath());
		});

		// A 'private' method.
		function getURLFromSearchPath() {
			var url = rootFolder;

			var poppedSearch = location.search.split('?path=')
			if (poppedSearch.length > 1) {
				url = poppedSearch[1];
			}

			return url;
		}

		function buildIndexHREF(url, name, type) {
			var href = document.createElement('a');
			var hrefText = document.createTextNode(name);
			href.setAttribute('href', url);
			href.appendChild(hrefText);

			if (type == 'directory') {
				href.onclick = function(){
					KSDFileNav.clickDirectoryLink(url);
					return false;
				};
			}

			return href;
		}

		function writeIndexLink(linkObj) {
			var targetURL = linkObj.baseURL+'/' + encodeURIComponent(linkObj.name);
			var href = buildIndexHREF(targetURL, linkObj.name, linkObj.type);

			var listItem = document.createElement('li');
			listItem.appendChild(href);
			if (linkObj.type == 'directory') {
				listItem.classList.add('directory');
				dirList.appendChild(listItem);
			} else {
				fileList.appendChild(listItem);
			}
		}

		// Iterate over the nginx-generated json index, and write 
		// links into the DOM.
		function iterateIndexList(indexJSON, baseURL) {
			// Clear the page.
			mediaContainer.classList.add('hidden');
			dirList.innerHTML = '';
			fileList.innerHTML = '';
			document.getElementById(playerHolderID).innerHTML = '';

			var files = []
			// First pass, only print directories.
			for (var i = 0; i < indexJSON.length; i++) {
				// Add the baseURL to each element.
				indexJSON[i]['baseURL'] = baseURL;
				if (indexJSON[i].type != "directory") {
					files.push(indexJSON[i])
					continue;
				}
				writeIndexLink(indexJSON[i]);
			}
			// Second pass, list out everything else.
			var videoDir = false;
			for (var i = 0; i < files.length; i++) {
				var fileExt = files[i].name.substring(files[i].name.length - 3);
				if (fileExt == 'mp3') {
					writeIndexLink(files[i]);
				} else if (fileExt == 'mp4') {
					writeIndexLink(files[i]);
					videoDir = true;
				} else {
					console.log('File ' + files[i].name + ' is neither .mp3 or .mp4.');
				}
			}

			if (files.length > 0) {
				mediaContainer.classList.remove('hidden');
				if (videoDir == true) {
					constructVideoPlayer();
				} else {
					constructAudioPlayer();
				}				
			}
		}

		function constructVideoPlayer() {
			// Initialize the playlist.
			if (typeof(KSDPlaylist) != 'undefined') {
				document.getElementById(playerHolderID).innerHTML = '<video id="videoplayer" controls poster="poster.png"><source src="" type="video/mp4"></video>';
				KSDPlaylist.setPlayerAndPlaylist('videoplayer', 'fileList');
			} else {
				console.log("KSDPlaylist is undefined.")
			}
		}

		function constructAudioPlayer() {
			// Initialize the playlist.
			if (typeof(KSDPlaylist) != 'undefined') {
				document.getElementById(playerHolderID).innerHTML = '<audio id="audioplayer" controls><source type="audio/mp3" src=""></audio>';
				KSDPlaylist.setPlayerAndPlaylist('audioplayer', 'fileList');
			} else {
				console.log("KSDPlaylist is undefined.")
			}
		}

		// The initial starting point, after setRootNavTitleAndList() 
		// has been run.
		FileNav.initialLaunch = function() {
			console.log(getURLFromSearchPath());
			KSDFileNav.loadAndDisplayNewListing(getURLFromSearchPath());
		}

		FileNav.clickDirectoryLink = function(url) {
			FileNav.loadAndDisplayNewListing(url);
			history.pushState(null, null, '?path=' + url);
		}

		// Retrieve the nginx-generated json index, pass it on to be rendered.
		FileNav.loadAndDisplayNewListing = function(url) {
			FileNav.writePageTitleAndNav(url);
			dirList.innerHTML = "<li>Loading...</li>";

			var request = new XMLHttpRequest();
			// url = url.replace(/#/g, '%23');
			console.log(url);
			request.open('GET', url, true);
			// request.open('GET', 'Media/Audio/Genre%20Books%20-%20Leveled/MTH%20Collection/MTH%20%231%20Dinosaurs%20Before%20Dark/', true)

			request.onload = function() {
				console.log(url);
				if (this.status >= 200 && this.status < 400) {
					// Success!
					var data = JSON.parse(this.response);
					iterateIndexList(data, url);
				} else {
					// We reached our target server, but it returned an error
					console.log('Server returned an error accessing ' + url + '.');
					var href = buildIndexHREF(rootFolder, 'the beginning', 'directory');

					// Verbosely build up the error message.
					var msg = document.createElement('li');
					var errSpan = document.createElement('span');
					errSpan.classList.add('error');
					errSpan.appendChild(document.createTextNode('Error: '));
					msg.appendChild(errSpan);
					var msg1Span = document.createElement('span');
					msg1Span.appendChild(document.createTextNode('Unable to load this directory; you may have used an outdated bookmark, or the directory may have been moved. Please return to '));
					msg.appendChild(msg1Span);
					msg.appendChild(href);
					var msg2Span = document.createElement('span');
					msg2Span.appendChild(document.createTextNode(' and try again.'));
					msg.appendChild(msg2Span);

					FileNav.displayErrorToUser(msg, dirList);
				}
			};

			request.onerror = function() {
				// There was a connection error of some sort
				console.log("Error connecting to server.");
				var msg = document.createElement('li');
				var errSpan = document.createElement('span');
				errSpan.classList.add('error');
				errSpan.appendChild(document.createTextNode('Error: '));
				msg.appendChild(errSpan);
				var msg1Span = document.createElement('span');
				msg1Span.appendChild(document.createTextNode('Unable to reach server; please contact your system administrator.'));
				msg.appendChild(msg1Span);

				FileNav.displayErrorToUser(msg, dirList);
			};

			request.send();
		}

		FileNav.displayErrorToUser = function(errMessage, elem) {
			elem.innerHTML = '';
			elem.appendChild(errMessage);
		}

		FileNav.setRootNavTitleAndList = function(rootDir, navEl, titleEl, dirListEl, mediaCont, fileListEl) {
			rootFolder = rootDir;
			navbar = document.getElementById(navEl);
			dirName = document.getElementById(titleEl);
			dirList = document.getElementById(dirListEl);
			mediaContainer = document.getElementById(mediaCont);
			fileList = document.getElementById(fileListEl);
		}

		FileNav.updateTitle = function(title) {
			var titleNode = document.createElement('h2');
			titleNode.appendChild(document.createTextNode(title));
			dirName.innerHTML = '';
			dirName.appendChild(titleNode);
		}

		FileNav.updateNavbar = function(navList) {
			navbar.innerHTML = '&nbsp;'; // Clear the navbar.

			var rebuiltNavList = [];
			for (var i = 0; i < navList.length; i++) {
				rebuiltNavList.push(encodeURIComponent(navList[i]));
				var rebuiltNavURL = rebuiltNavList.join('/');

				var navName = navList[i];
				var href = buildIndexHREF(rebuiltNavURL, navName, 'directory');

				var navItem = document.createElement('span');
				navItem.appendChild(href);
				navbar.appendChild(navItem);
				// navbar.insertAdjacentHTML('beforeend', '<span>' + href + '</span>');
				if (i < navList.length - 1) {
					// navbar.insertAdjacentHTML('beforeend', '<span> / </span>');
					var navDivider = document.createElement('span');
					navDivider.appendChild(document.createTextNode(' / '));
					navbar.appendChild(navDivider);
				}
			}
		}

		FileNav.writePageTitleAndNav = function(url) {
			var navList = decodeURIComponent(url).split('/');
			// var title = navList[navList.length-1]
			var title = navList.pop();
			FileNav.updateTitle(title);
			FileNav.updateNavbar(navList);
		}


		// Return this library object.
		return FileNav;
	}

	// Define globally if variable name doesn't already exist.
	if (typeof(KSDFileNav) === 'undefined'){
		window.KSDFileNav = define_library();
	} else {
		console.log("KSDFileNav is already defined.");
	}
})(window);