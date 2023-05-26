<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 1rem;
		max-width: 50rem;
		margin: 0 auto;
		gap: 10px;
		line-height: 1.5;
	}
</style>

<FetchVisualizer>
	<main>
		<slot />
	</main>
</FetchVisualizer>

<script>
	import FetchVisualizer from '$lib/FetchVisualizer.svelte';
	import '$lib/style.scss';
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/600.css';
</script>
