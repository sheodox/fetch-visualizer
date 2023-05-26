import fs from 'node:fs/promises';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import { images } from '$lib/images';
import type { RequestHandler } from './$types';

export const GET = (async ({ params }) => {
	const img = images.find((img) => img.fileName === params.imageName);
	if (!img) {
		throw error(404);
	}

	return new Response(
		await fs.readFile(path.join(process.cwd(), 'static/photos', params.imageName))
	);
}) satisfies RequestHandler;
