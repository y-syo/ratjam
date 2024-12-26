import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const app = express();

const audioFolder = path.join(__dirname, '../data');

app.get('/songs', (req: Request, res: Response) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Header' , 'authorization');
	const songs = fs.readdirSync(audioFolder).filter(file => {
		return [".mp3", ".ogg", ".wav"].includes(path.extname(file).toLowerCase());
	});
	res.json(songs);
});

app.get('/stream/:song', (req: Request, res: Response) => {
	const song = req.params.song;
	const filePath = path.join(audioFolder, song);

	if (!fs.existsSync(filePath))
	{
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
			return ;
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
