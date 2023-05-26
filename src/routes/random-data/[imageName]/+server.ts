import { error } from '@sveltejs/kit';
import { images } from '$lib/images';
import type { RequestHandler } from './$types';

export const GET = (async ({ params }) => {
	const img = images.find((img) => img.fileName === params.imageName);
	if (!img) {
		throw error(404);
	}

	return new Response(img.image);
}) satisfies RequestHandler;
