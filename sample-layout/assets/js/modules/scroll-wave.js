const scrollWave = {
	init() {
		const $wave = document.getElementById('scroll-wave');
		if($wave) {
			scrollWave.bindUIActions();
			scrollWave.updateScroll();
		}
	},
	bindUIActions() {
		document.addEventListener('scroll', () => {
			scrollWave.updateScroll();
		});
	},
	updateScroll() {
		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const $wave = document.getElementById('scroll-wave');

		let rect = $wave.getBoundingClientRect(),
				visibleHeight = window.innerHeight;
		
		let progress = Math.max(-1, Math.min(2, 1 - rect.top / (visibleHeight - rect.height)));
		progress = ((progress / 1000) * 100) + '%';

		if(!prefersReducedMotion.matches) {
			document.documentElement.style.setProperty('--scroll', progress);
		}
	}
};

export { scrollWave };
