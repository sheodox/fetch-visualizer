import fs from 'node:fs';
import path from 'node:path';

const imageDir = './static/photos/';

function processImage(filePath) {
	if (filePath.endsWith('.txt')) {
		return;
	}

	const imageBase64 = fs.readFileSync(path.join(imageDir, filePath)).toString('base64'),
		destPath = filePath + '.txt';

	fs.writeFileSync(path.join(imageDir, destPath), imageBase64);
}

fs.readdirSync(imageDir).map((p) => {
	processImage(p);
});
