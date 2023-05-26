import fs from 'node:fs/promises';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import { images } from '$lib/images';
import type { RequestHandler } from './$types';

export const GET = (async ({ params }) => {
	if (!images.some((img) => img.fileName === params.imageName)) {
		throw error(404);
	}

	const imageBuffer = await fs.readFile(
		path.join(process.cwd(), 'static/photos', params.imageName)
	);

	return new Response(imageBuffer);
}) satisfies RequestHandler;
