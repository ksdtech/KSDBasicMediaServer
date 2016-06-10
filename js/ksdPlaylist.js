(function(window) {
	// Structure borrowed from: 
	// http://checkman.io/blog/creating-a-javascript-library/
	// This is the "module pattern".
	// Playlist code is much modified from: http://jsfiddle.net/WsXX3/33/
	'use strict';
	function define_library() {
		var Playlist = {};

		// Private variables.
		var playerElem = '';
		var playlistElem = '';
		var curTrackNum = 0;

		// For future reference.
		var privateMethodExample = function() {
			return true;
		}

		//////////////////////////////////////
		// Some utility functions
		Playlist.removeClassFromSiblings = function(elem, className) {
			var siblings = Array.prototype.filter.call(elem.parentNode.children, function(child) {
				return child !== elem;
			});
			for (var sib in siblings) {
				siblings[sib].classList.remove(className);
			}
		}

		Playlist.getIndex = function(elem) {
			// A poor alternative to jquery's index().
			var siblings = elem.parentNode.parentNode.childNodes;
			var n = 0;
			for (var i = 0; i < siblings.length; i++) {
				if (siblings[i] == elem.parentNode) {
					return n;	
				}
				if (siblings[i].nodeType == 1) {
					n++;
				}
			}
			return -1; 
		}
		//////////////////////////////////////


		Playlist.setPlayerAndPlaylist = function(playerID, playlistID){
			// Give the DOM a chance to catch up, in case the player 
			// element was just created.
			setTimeout(function() {
				playerElem = document.getElementById(playerID);
				playlistElem = document.getElementById(playlistID);
				Playlist.initPlaylist();
			}, 0);
		}

		Playlist.loadTrack = function(link) {
			playerElem.setAttribute('src', link.getAttribute('href'));
			var par = link.parentNode;
			par.classList.add('activeTrack');
			Playlist.removeClassFromSiblings(par, 'activeTrack');
			playerElem.load();
		}

		Playlist.runTrack = function() {
			playerElem.play();
		}

		Playlist.initPlaylist = function() {
			// var playerElem = document.getElementById(playerID);
			// var playlistElem = document.getElementById(playlistID);
			curTrackNum = 0;
			var tracks = playlistElem.querySelectorAll('li a');
			var len = tracks.length;
			var link = '';
			Playlist.loadTrack(tracks[curTrackNum]);

			[].forEach.call(playlistElem.querySelectorAll('a'), function (elem) {
				elem.addEventListener('click', function(e) {
					e.preventDefault();
					link = this;
					curTrackNum = Playlist.getIndex(link);
					Playlist.loadTrack(link);
					Playlist.runTrack(playerElem);
				}, false);
			});

			playerElem.addEventListener('ended',function(e){
				curTrackNum++;
				if (curTrackNum == len){
					curTrackNum = 0;
					// This would make the playlist loop.
					// link = playlistElem.find('a')[0];
					return; // We'll return instead.
				} else {
					link = playlistElem.querySelectorAll('a')[curTrackNum]
				}
				Playlist.loadTrack(link);
				Playlist.runTrack(playerElem);
			});
		}

		// Return this library object.
		return Playlist;
	}

	// Define globally if variable name doesn't already exist.
	if (typeof(KSDPlaylist) === 'undefined'){
		window.KSDPlaylist = define_library();
	} else {
		console.log("KSDPlaylist is already defined.");
	}
})(window);