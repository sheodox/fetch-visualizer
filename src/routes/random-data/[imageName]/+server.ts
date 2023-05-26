import fs from 'node:fs/promises';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import { images } from '$lib/images';
import type { RequestHandler } from './$types';

const photoPath = process.env.NODE_ENV === 'production' ? 'photos' : 'static/photos';

export const GET = (async ({ params }) => {
	if (!images.some((img) => img.fileName === params.imageName)) {
		throw error(404);
	}

	const imageBuffer = await fs.readFile(path.join(process.cwd(), photoPath, params.imageName));

	return new Response(imageBuffer);
}) satisfies RequestHandler;
