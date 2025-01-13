const audioPlayer = document.getElementById("audioPlayer");
const queue = document.getElementById("queue");

let songs = [];
let currentIndex = 0;

async function fetchAlbums() {
	const response = await fetch('http://localhost:3000/songs');
	songs = await response.json();
	populateQueue();
	loadSong(0);
}

function populateQueue() {
	queue.innerHTML = '';
	songs.forEach((song, index) => {
		const li = document.createElement('li');
		const img = document.createElement("img");
		//li.textContent = song;
		li.dataset.index = index;
		li.addEventListener('click', () => loadSong(index));
		img.src = "assets/covers/" + song + ".jpg";
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
		audioPlayer.src = `http://localhost:3000/stream/${encodeURIComponent(songs[index])}`;
		audioPlayer.play();
		updatePlaylistUI();
	}
}

function updatePlaylistUI() {
	const items = queue.querySelectorAll('li');
	title.textContent = songs[currentIndex];
	items.forEach(item => item.classList.remove('active'));
	items.forEach(item => item.classList.add('inactive'));
	if (items[currentIndex])
	{
		items[currentIndex].classList.remove('inactive');
		items[currentIndex].classList.add('active');
	}
}

audioPlayer.addEventListener('ended', () => {
	//currentIndex = (currentIndex + 1) % songs.length;
	loadSong(currentIndex);
});

fetchAlbums();
