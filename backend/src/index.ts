import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Database } from "bun:sqlite";

function getRandomInt(max) {
	return Math.floor(Math.random() * max) % max;
}

const db = new Database("data.db");

//db.run("CREATE TABLE IF NOT EXISTS paylists (id INTEGER PRIMARY KEY, name TEXT NOT NULL, path TEXT NOT NULL, list TEXT NOT NULL);");
//db.run("INSERT INTO playlists (name, path, list) VALUES ('Sonic', '/assets/covers/sonic_robo_blast2.jpg', '1,3');");

const app = express();

const audioFolder = path.join(__dirname, '../data');

var dict = {};


app.get('/songs', (req: Request, res: Response) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Header' , 'authorization');
	/*const songs = fs.readdirSync(audioFolder).filter(file => {
		return [".mp3", ".ogg", ".wav"].includes(path.extname(file).toLowerCase());
	});*/
	//const albums = fs.readdirSync(audioFolder).sort();
	const albums = db.query("SELECT * FROM playlists").all()
	res.json(albums);
});

app.get('/stream/:song', (req: Request, res: Response) => {
	//const song = req.params.song;
	//const filePath = path.join(audioFolder, song);
	let albumId = req.params.song;
	const result = db.query("SELECT list FROM playlists WHERE id = ?1").all(albumId);
	const songs = result[0].list.split(';');
	/*const songs = fs.readdirSync(path.join(audioFolder, album)).sort().filter(file => {
		return [".mp3", ".ogg", ".wav"].includes(path.extname(file).toLowerCase());
	});*/
	const rand = getRandomInt(songs.length);
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

const port = 3000;
app.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});
