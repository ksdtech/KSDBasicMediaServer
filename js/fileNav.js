// Handle the back button.
window.addEventListener("popstate", function(e) {
	loadAndDisplayNewListing(getURLFromSearchPath());
});


function clickDirectoryLink(URL) {
	loadAndDisplayNewListing(URL);
	history.pushState(null, null, '?path=' + URL);
}


function getURLFromSearchPath() {
	var URL = rootFolderGlobal;

	var poppedSearch = location.search.split('?path=')
	if (poppedSearch.length > 1) {
		URL = poppedSearch[1];
	}

	return URL;
}

function buildIndexHREF(URL, name, type) {
	var href = '<a href="'+ URL + '">' + name + '</a>';

	if (type == 'directory') {
		href = '<a href="javascript:void(0)" onclick="clickDirectoryLink(\'' + URL + '\');">'+name+'</a>';				
	}

	return href;
}


function updateTitle(title) {
	document.getElementById('dirName').innerHTML = '<h2>' + title + '</h2>';
}


function updateNavbar(navList) {
	document.getElementById('navbar').innerHTML = '&nbsp;'; // Clear the navbar.

	var rebuiltNavList = [];
	for (var i = 0; i < navList.length; i++) {
		rebuiltNavList.push(encodeURIComponent(navList[i]));
		var rebuiltNavURL = rebuiltNavList.join('/');

		var navName = navList[i];
		var href = buildIndexHREF(rebuiltNavURL, navName, 'directory');

		document.getElementById('navbar').insertAdjacentHTML('beforeend', '<span>' + href + '</span>');
		if (i < navList.length - 1) {
			document.getElementById('navbar').insertAdjacentHTML('beforeend', '<span> >> </span>');
		}
	}
}

function writePageTitleAndNav(url) {
	var navList = decodeURIComponent(url).split('/');

	var title = navList.pop();
	updateTitle(title);
	updateNavbar(navList);
}


function writeIndexLink(linkObj) {
	var targetURL = linkObj.baseURL+'/' + encodeURIComponent(linkObj.name);
	href = buildIndexHREF(targetURL, linkObj.name, linkObj.type);

	if (linkObj.type == 'directory') {
		document.getElementById('dirList').insertAdjacentHTML('beforeend', '<li class="directory">'+href+'</li>');
	} else {
		document.getElementById('fileList').insertAdjacentHTML('beforeend', '<li>'+href+'</li>');
	}
}


// Iterate over the nginx-generated json index, and write 
// links into the DOM.
function iterateIndexList(indexJSON, baseURL) {
	// Clear the page.
	document.getElementById('dirList').innerHTML = '';
	document.getElementById('playerPlaceholder').innerHTML = '';
	document.getElementById('fileList').innerHTML = '';

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
	for (var i = 0; i < files.length; i++) {
		writeIndexLink(files[i]);
	}

	if (files.length > 0) {
		var fileExt = files[0].name.substring(files[0].name.length - 3);
		if (fileExt == 'mp3') {
			constructAudioPlayer();
		} else {
			constructVideoPlayer();
		}
	}
}


function constructVideoPlayer() {
	document.getElementById('playerPlaceholder').innerHTML('<video id="videoplayer" controls poster="poster.png"><source src="" type="video/mp4"></video>');
	// Initialize the playlist.
	initPlaylist($('#videoplayer'), $('#fileList'))
}


function constructAudioPlayer() {
	// Create the audio player.
	document.getElementById('playerPlaceholder').innerHTML('<audio id="audioplayer" controls><source type="audio/mp3" src=""></audio>');
	// Initialize the playlist.
	initPlaylist($('#audioplayer'), $('#fileList'))
}


// Retrieve the nginx-generated json index, pass it on to be rendered.
function loadAndDisplayNewListing(url) {
	writePageTitleAndNav(url);
	document.getElementById('dirList').innerHTML("<p>Loading...</p>");

	$.getJSON(url, function(data){
		iterateIndexList(data, url);
	})
}


// The Playlist Stuff. Derived from http://jsfiddle.net/WsXX3/33/
function initPlaylist(playerElem, playlistElem) {
	curTrackNum = 0;
	tracks = playlistElem.find('li a');
	len = tracks.length;
	loadTrack($(tracks[curTrackNum]), playerElem[0], playerElem);

	playlistElem.find('a').click(function(e){
		e.preventDefault();
		link = $(this);
		curTrackNum = link.parent().index();
		loadTrack($(link), playerElem[0], playerElem);
		runTrack(playerElem);
	});

	playerElem[0].addEventListener('ended',function(e){
		curTrackNum++;
		if(curTrackNum == len){
			curTrackNum = 0;
			// This would make the playlist loop.
			// link = playlistElem.find('a')[0];
			return; // We'll return instead.
		}else{
			link = playlistElem.find('a')[curTrackNum];
		}
		loadTrack($(link),playerElem[0], playerElem);
		runTrack(playerElem);
	});
}

function loadTrack(link, player, playerElem) {
	player.src = link.attr('href');
	par = link.parent();
	par.addClass('activeTrack').siblings().removeClass('activeTrack');
	playerElem[0].load();
}

function runTrack(playerElem) {
	playerElem[0].play();
}




// Zepto... is semi-equivalent to: $(document).ready(function() {
// Zepto(function($){
// 	console.log('Ready to Zepto!')

// 	loadAndDisplayNewListing(getURLFromSearchPath());
// });
function launchNav() {
	console.log("Launching Navigation...");
	loadAndDisplayNewListing(getURLFromSearchPath());
}

function ready(fn) {
	if (document.readyState != 'loading'){
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

ready(launchNav);