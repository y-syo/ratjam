import express, { Request, Response } from 'express';
import { Database } from "bun:sqlite";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

function getRandomInt(max) {
	return Math.floor(Math.random() * max) % max;
}

function shuffleList(n: number): number[] {
    const list = Array.from({ length: n }, (_, i) => i);
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}


const db = new Database("data.db");

//db.run("CREATE TABLE IF NOT EXISTS paylists (id INTEGER PRIMARY KEY, name TEXT NOT NULL, path TEXT NOT NULL, list TEXT NOT NULL);");
//db.run("INSERT INTO playlists (name, path, list) VALUES ('Sonic', '/assets/covers/sonic_robo_blast2.jpg', '1,3');");

const app = express();

const storage = multer.diskStorage({
	destination: '../frontend/assets/covers/',
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	}
});
const upload = multer({ storage });

const audioFolder = path.join(__dirname, '../data');

/*function refreshDb() {
	//db.run("INSERT INTO playlists (name, path, list) VALUES ('Sonic', '/assets/covers/sonic_robo_blast2.jpg', '');");
}*/

var queue = {};


app.get('/dirlist', (req: Request, res: Response) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Header' , 'authorization');
	const albums = fs.readdirSync(audioFolder).sort();
	res.json(albums);
});


app.get('/songs', (req: Request, res: Response) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Header' , 'authorization');
	const albums = db.query("SELECT * FROM playlists").all()
	res.json(albums);
});


app.get('/stream/:user/:song', (req: Request, res: Response) => {
	let albumId = req.params.song;
	const result = db.query("SELECT list FROM playlists WHERE id = ?1").all(albumId);
	const songs = result[0].list.split(';');

	let userId = req.params.user;
	let rand;
	if (!queue[userId] || queue[userId][0] != albumId || queue[userId][1] == [])
	{
		queue[userId] = [albumId, shuffleList(songs.length).join(';')];
	}
	rand = parseInt(queue[userId][1].split(';')[0]);
	queue[userId] = [albumId, queue[userId][1].split(';').slice(1).join(';')];
	console.log(rand);

	const song = songs[rand];
	const filePath = path.join(audioFolder, song);

	if (!fs.existsSync(filePath))
	{
		console.log(filePath);
		console.log('no audio files found');
		return res.status(404).send('no audio files found');
	}

	const stat = fs.statSync(filePath);
	const fileSize = stat.size;
	const fileExtension = path.extname(song).toLowerCase();

	let mimeType: string;
	switch ([".mp3", ".ogg", ".wav"].indexOf(fileExtension))
	{
		case 0:
			mimeType = 'audio/mpeg';
			break;
		case 1:
			mimeType = 'audio/ogg';
			break;
		case 2:
			mimeType = 'audio/wav';
			break;
		default:
			console.log('error: invalid file type');
			return res.status(500).send('invalid file type');
	}

	res.setHeader('Content-Type', mimeType);
	res.setHeader('Content-Length', fileSize);
	res.setHeader('Accept-Range', 'bytes');

    const range = req.headers.range;
	if (range)
	{
		const [start, end] = range.replace(/bytes=/, "").split("-").map(Number);
		const chunkStart = start || 0;
		const chunkEnd = end || fileSize - 1;

		if (chunkStart >= fileSize)
		{
			console.log('range error');
			return res.status(416).send('Requested range not satisfiable');
		}

		const readStream = fs.createReadStream(filePath, { start: chunkStart, end: chunkEnd });
		res.status(206); // Partial Content response
		res.setHeader('Content-Range', `bytes ${chunkStart}-${chunkEnd}/${fileSize}`);
		readStream.pipe(res);
	}
	else
	{
		const readStream = fs.createReadStream(filePath);
		readStream.pipe(res);
    }
});


app.post('/upload', upload.any(), (req, res) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Header' , 'authorization');

	const pass = req.body.password;
	const metadata: Record<string, any> = {};
	const covers: Record<string, Express.Multer.File> = {};

	for (const key in req.body)
	{
		if (key != "password")
		{
			metadata[key] = JSON.parse(req.body[key]);
		}
	}

	req.files?.forEach(file => {
		const baseKey = file.fieldname.replace("-cover", "");
		covers[baseKey] = file;
	});

	console.log("password: ", pass);
	console.log("metadata: ", metadata);
	console.log("files: ", covers);

	const dbInsert = db.prepare("INSERT INTO playlists (name, path, list) VALUES (?, ?, ?)");

	Object.keys(metadata).forEach(id => {
		let fileList = [];
		fs.readdir(path.join(audioFolder, id), (err, files) => {
			if (err) {
				console.error('Error reading directory:', err);
				return;
			}

			files.forEach(file => {
				fileList.push(path.join(id, file));
			});

			console.log(fileList);
			dbInsert.run(metadata[id].name, covers[id].filename, fileList.join(';'));
			//db.run("INSERT INTO playlists (name, path, list) VALUES ('" + metadata[id].name + "', '" + covers[id].filename + "', '" + fileList.join(';') + "');");
		});
	});

	res.json({status: "ok"});
});


const port = 3000;
app.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});
