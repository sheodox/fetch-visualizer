<style>
	.fetch-visualizer {
		position: fixed;
		right: 2rem;
		bottom: 2rem;
		background: #2a2f37;
		border-radius: 10px;
		padding: 10px;
		gap: 10px;
		display: flex;
	}
	p {
		color: white;
		text-align: center;
		margin: 0;
		font-family: monospace;
	}
	.count {
		font-weight: bold;
		font-size: 10px;
	}
	.label {
		font-size: 12px;
	}
</style>

<div class="fetch-visualizer">
	<div>
		<p class="label">Upload</p>
		<canvas bind:this={requestCanvas} {...CANVAS_DIMENSIONS} />
		<p class="count">{requestCount}</p>
	</div>
	<div>
		<p class="label">Download</p>
		<canvas bind:this={responseCanvas} {...CANVAS_DIMENSIONS} />
		<p class="count">{responseCount}</p>
	</div>
</div>

<slot />

<script lang="ts">
	import { setContext, onMount, onDestroy } from 'svelte';

	const CANVAS_SIZE = 100,
		CANVAS_CAPACITY = CANVAS_SIZE * CANVAS_SIZE,
		CANVAS_DIMENSIONS = { height: CANVAS_SIZE, width: CANVAS_SIZE },
		RGB_ON = 255,
		RGB_OFF = 0,
		// pixels of padding around the completion percentage, used when sizing
		// the black rectangle backdrop for the text
		PROGRESS_TEXT_PADDING = 4;

	setContext('fetch', fetchFn);

	let requestCanvas: HTMLCanvasElement, responseCanvas: HTMLCanvasElement;

	// keep track of if we're showing something, so each visualization
	// can wait its turn
	const animating = {
		response: false,
		request: false
	};
	// queues of promise resolve functions, used so each fetch can await their turn
	// to visualize before executing a fetch or returning the response
	let requestsAwaitingAnimation = [] as ((value?: unknown) => void)[];
	let responsesAwaitingAnimation = [] as ((value?: unknown) => void)[];
	let queueCheckAnimationFrame: ReturnType<typeof requestAnimationFrame>;

	// keep a count of how many request/response bodies are awaiting visualization
	$: requestCount = (animating.request ? 1 : 0) + requestsAwaitingAnimation.length;
	$: responseCount = (animating.response ? 1 : 0) + responsesAwaitingAnimation.length;

	onMount(() => {
		const tryVisualizing = () => {
			// if there's nothing being animated right now, but something is waiting, start it
			if (!animating.request && requestsAwaitingAnimation.length) {
				requestsAwaitingAnimation.shift()?.();
			}
			if (!animating.response && responsesAwaitingAnimation.length) {
				responsesAwaitingAnimation.shift()?.();
			}

			queueCheckAnimationFrame = requestAnimationFrame(tryVisualizing);
		};
		tryVisualizing();
	});

	onDestroy(() => {
		// need to check this, otherwise svetltekit was blowing up, not using sveltekit's `browser` import
		// so it can stay compatible with regular svelte apps
		typeof cancelAnimationFrame === 'function' && cancelAnimationFrame(queueCheckAnimationFrame);
	});

	$: requestContext = requestCanvas?.getContext('2d');
	$: responseContext = responseCanvas?.getContext('2d');

	// types were taken from fetch's types
	async function fetchFn(
		input: RequestInfo | URL,
		init?: RequestInit | undefined
	): Promise<Response> {
		// there won't be a body on get requests, skip those
		if (!init?.method || init.method !== 'GET') {
			// wait until it's this fetch's turn to visualize its request
			await new Promise((resolve) => {
				requestsAwaitingAnimation = [...requestsAwaitingAnimation, resolve];
			});
			animating.request = true;
			await visualizeData(init?.body, requestContext);
			animating.request = false;
		}
		const response = await fetch(input, init);

		// read the response as an arrayBuffer so we can convert to binary for the visualization,
		// but then make a new  response to treat this like any other call to fetch
		const responseBodyArrBuffer = await response.arrayBuffer(),
			responseBody = new Uint8ClampedArray(responseBodyArrBuffer).join('');

		// wait for our turn to visualize the response body
		await new Promise((resolve) => {
			responsesAwaitingAnimation = [...responsesAwaitingAnimation, resolve];
		});
		animating.response = true;
		await visualizeData(responseBody, responseContext);
		animating.response = false;

		// give back a new response, we've already consumed the body
		// on the original and this avoids assuming content type
		return new Response(responseBodyArrBuffer, {
			headers: response.headers,
			status: response.status,
			statusText: response.statusText
		});
	}

	function awaitFrame() {
		return new Promise((resolve) => {
			requestAnimationFrame(resolve);
		});
	}

	// take the data and draw it on the canvas given the provided 2d context
	async function visualizeData(
		data: BodyInit | null | undefined,
		ctx: CanvasRenderingContext2D | null
	) {
		if (!data || !ctx) {
			return;
		}
		const clearCanvas = () => ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE),
			fontSize = 10;
		ctx.font = `${fontSize}px monospace`;
		ctx.strokeStyle = 'black';

		clearCanvas();

		const bodyStr = data.toString();

		// convert the data to a long string of 0s and 1s
		const binaryRepresentation = [...bodyStr]
			.map((char) => char.charCodeAt(0).toString(2))
			.join('');

		// figure out how many separate frames we need to display the full binary representation
		// on the canvas, given each canvas can hold CANVAS_CAPACITY number of pixels
		const numFrames = Math.ceil(binaryRepresentation.length / CANVAS_CAPACITY);

		// reuse this so we do less GC?
		const img = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);

		// for every frame we need
		for (let i = 0; i < numFrames; i++) {
			const startIndex = i * CANVAS_CAPACITY,
				// get the substring of the data as binary that will be shown on this frame
				frameBytes = binaryRepresentation.substring(startIndex, startIndex + CANVAS_CAPACITY);

			// for every pixel in the frame
			for (let j = 0; j < frameBytes.length; j++) {
				// if it's 1, then show a white pixel, else black
				const color = frameBytes[j] === '1' ? RGB_ON : RGB_OFF,
					// image data has 4 array positions for each pixel's RGBA,
					// so the start of pixel `j` is at the index `j * 4`
					imageDataIndexBase = j * 4;
				img.data[imageDataIndexBase] = color; // R
				img.data[imageDataIndexBase + 1] = color; // G
				img.data[imageDataIndexBase + 2] = color; // B
				img.data[imageDataIndexBase + 3] = 255; // A
			}

			ctx.putImageData(img, 0, 0);

			const completion = Math.floor(100 * (i / numFrames)) + '%',
				textSize = ctx.measureText(completion),
				textX = 50 - textSize.width / 2,
				textY = 55;

			// show the progress as text centered on the canvas, with a black rectangle behind it
			// so the text is legible
			ctx.fillStyle = 'black';
			ctx.fillRect(
				textX - PROGRESS_TEXT_PADDING,
				textY - fontSize - PROGRESS_TEXT_PADDING,
				textSize.width + 2 * PROGRESS_TEXT_PADDING,
				fontSize + 2 * PROGRESS_TEXT_PADDING
			);
			ctx.fillStyle = 'white';
			ctx.fillText(completion, textX, textY);

			// let this display for one frame before drawing the next
			await awaitFrame();
		}

		clearCanvas();
	}
</script>
