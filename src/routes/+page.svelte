<svelte:head>
	<title>Fetch Visualizer</title>
</svelte:head>

<header>
	<h1>Fetch Visualizer</h1>
	<a href="https://github.com/sheodox/fetch-visualizer"
		><i class="fab fa-github" /><span class="sr-only">Github</span></a
	>
</header>

<p>
	Do you miss the days when you could hear your hard drive working whenever something was loading?
	Now you can get that back, but with a modern update. It's annoying when websites make noise, why
	not use a visual indicator!
</p>
<p>
	Fetch Visualizer is a <a href="https://svelte.dev/docs">Svelte</a> component that wraps your
	<code>fetch</code> calls, and all request and response data must first be shown on a canvas as a grid
	of pixels, each being either white or black to represent the binary representation of the data. Yes,
	finally the world of programming didn't have to stop at tying racing game physics to framerate, now
	we can tie your internet speed to your framerate too!
</p>

<p>
	Wrap your code in a <code>&lt;FetchVisualizer&gt; &lt;slot /&gt; &lt;/FetchVisualizer&gt;</code>,
	then use the fetch you get from context at <code>const fetch = getContext('fetch')</code> inside a
	child component.
</p>

<h2>Try it out!</h2>
<button on:click={doFetching}>Post random data</button>
<button on:click={getImage} disabled={fetchingImage}>Fetch an image (could take minutes)</button>

{#if imageSrc}
	<a href={imageHref}>{imageCredit}</a>
	<img src={imageSrc} alt="stock photograph" />
{/if}

<script lang="ts">
	import { getContext } from 'svelte';
	const fetch = getContext<(typeof globalThis)['fetch']>('fetch'),
		requestRandomCharacters = 200_000;

	let imageSrc = '',
		imageCredit = '',
		imageHref = '',
		fetchingImage = false;

	async function doFetching() {
		await fetch(`/random-data`, {
			method: 'POST',
			body: randomData()
		});
	}

	function randomData() {
		let data = '';
		for (let i = 0; i < requestRandomCharacters; i++) {
			data += String.fromCharCode('A'.charCodeAt(0) + Math.floor(Math.random() * 26));
		}

		return data;
	}

	async function getImage() {
		fetchingImage = true;
		imageSrc = '';
		const res = await fetch('/random-data');

		const imageMetadata = await res.json();
		imageCredit = imageMetadata.credit;
		imageHref = imageMetadata.href;

		const imageRes = await fetch(`/random-data/${imageMetadata.fileName}`);
		// purposely not setting imageSrc to the url we fetch so it is visualized
		imageSrc = URL.createObjectURL(await imageRes.blob());
		fetchingImage = false;
	}
</script>
