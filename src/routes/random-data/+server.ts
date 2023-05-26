import { randomBytes } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { images } from '$lib/images';
import type { RequestHandler } from './$types';

export const POST = (async () => {
	return json({
		data: randomBytes(200_000),
		time: new Date().toLocaleString()
	});
}) satisfies RequestHandler;

export const GET = (async () => {
	const imgMetadata = images[Math.floor(Math.random() * images.length)];

	return json(imgMetadata);
}) satisfies RequestHandler;
