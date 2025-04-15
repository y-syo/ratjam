const list = document.getElementById("list");
const applyButton = document.getElementById("send");


const confirmButton = document.getElementById("confirm");
const cancelButton = document.getElementById("cancel");

let files = [];
let fileMap = new Map();
let data = new FormData();

function populateList() {
	list.innerHTML = '';
	files.forEach(file => {
		const li = document.createElement('li');
		const check = document.createElement('input');
		const checkLabel = document.createElement('label');
		const input = document.createElement('input');
		const uplButton = document.createElement("button");
		const hiddenFileInput = document.createElement('input');
		const uplTextDisplay = document.createElement('span');
		
		li.id = file;

		check.type = "checkbox";
		check.name = file;
		check.id = file;

		checkLabel.htmlFor = file;
		checkLabel.textContent = file;

		input.type = "text";
		
		uplButton.textContent = "upload cover";
		uplButton.type = "button";

		hiddenFileInput.type = 'file';
		hiddenFileInput.accept = 'image/*';
		hiddenFileInput.style.display = 'none';

		uplButton.addEventListener('click', () => {
			hiddenFileInput.click();
		});

		hiddenFileInput.addEventListener('change', (event) => {
			const selectedFile = event.target.files[0];
			console.log(event.target.files);
			if (selectedFile) {
				uplTextDisplay.textContent = selectedFile.name;
				fileMap.set(li.id, selectedFile);
			}
		});

		li.append(check);
		li.append(checkLabel);
		li.append(input);
		li.append(uplButton);
		li.append(hiddenFileInput);
		li.append(uplTextDisplay);
		
		list.appendChild(li);
	});
}

async function fetchAlbums() {
	const response = await fetch('http://localhost:3000/dirlist');
	files = await response.json();
	populateList();
}

function packData() {
	const selectors = document.querySelectorAll('li');
	data = new FormData();

	try {
		selectors.forEach(li => {
			if (li.querySelector('input[type="checkbox"]').checked)
			{
				const path = li.id;
				const name = li.querySelector('input[type="text"]').value;
				const cover = fileMap.get(li.id);
				if (!path || !name || !cover)
				{
					throw new Error("error: data uncomplete");
				}

				data.append(path, JSON.stringify({name: name, path: path}));
				data.append(`${path}-cover`, cover);
			}
		});
	} catch (error) {
		console.error(error);
		return ;
	}

	fileMap.clear();

	document.getElementById('popup-overlay').classList.remove('hidden');
	document.getElementById('popup').classList.remove('hidden');
}

async function sendData() {
	const pass = document.getElementById('popup-input').value;

	if (!pass) {
		alert("password required :c");
		return;
	}

	data.append('password', pass);

	try {
		const response = await fetch('http://localhost:3000/upload', {
			method: 'POST',
			body: data,
		});

		if (!response.ok) {
			throw new Error("server responded with status " + response.status);
		}
	} catch (error) {
		console.error("upload failed: " + error);
		alert("upload failed: " + error.message);
		
		document.getElementById('popup-overlay').classList.add('hidden');
		document.getElementById('popup').classList.add('hidden');

		document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
			cb.checked = false;
		});
		return ;
	}

	alert("updated ! :D");

	document.getElementById('popup-overlay').classList.add('hidden');
	document.getElementById('popup').classList.add('hidden');
}

applyButton.addEventListener('click', () => {
	packData();
});

confirmButton.addEventListener('click', () => {
	sendData();
});

cancelButton.addEventListener('click', () => {
	document.getElementById('popup-overlay').classList.add('hidden');
	document.getElementById('popup').classList.add('hidden');
});

fetchAlbums();
