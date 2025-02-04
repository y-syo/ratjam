const audioPlayer = document.getElementById("audioPlayer");
const skipButton = document.getElementById("skip");
const queue = document.getElementById("queue");

let songs = [];
let currentIndex = 0;

async function fetchAlbums() {
	const response = await fetch('http://localhost:3000/songs');
	songs = await response.json();
	console.log(songs);
	populateQueue();
	loadSong(0);
}

function populateQueue() {
	queue.innerHTML = '';
	songs.forEach((song, index) => {
		const li = document.createElement('li');
		const img = document.createElement("img");
		li.textContent = song.name;
		li.dataset.index = index;
		li.addEventListener('click', () => loadSong(index));
		console.log(song.path);
		img.src = "assets/covers/" + song.path;
		img.alt = "cover";
		img.classList.add("cover");
		li.append(img);
		queue.appendChild(li);
	});
	updatePlaylistUI();
}

function loadSong(index) {
	if (index >= 0 && index < songs.length)
	{
		currentIndex = index;
		audioPlayer.src = `http://localhost:3000/stream/${encodeURIComponent(songs[index].id)}`;
		audioPlayer.play();
		updatePlaylistUI();
	}
}

function updatePlaylistUI() {
	const items = queue.querySelectorAll('li');
	title.textContent = songs[currentIndex].name;
	items.forEach(item => item.classList.remove('active'));
	items.forEach(item => item.classList.add('inactive'));
	if (items[currentIndex])
	{
		items[currentIndex].classList.remove('inactive');
		items[currentIndex].classList.add('active');
	}
}

audioPlayer.addEventListener('ended', () => {
	loadSong(currentIndex);
});

skipButton.addEventListener('click', () => {
	loadSong(currentIndex);
});

fetchAlbums();
