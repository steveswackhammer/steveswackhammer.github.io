const wavePrimary = {

	config: {
		selector: '.js-wave-primary',
		activeClass: 'is-animated',
	},

	init() {
		const $waves = document.querySelectorAll(wavePrimary.config.selector);
		if (!$waves.length) {
			return;
		}

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return;
		}

		const observer = new IntersectionObserver(wavePrimary.animateWave, {
			threshold: 0.5,
		});

		const $targets = new Set();

		$waves.forEach(($wave) => $targets.add($wave.closest('svg') || $wave));
		$targets.forEach(($target) => observer.observe($target));
	},

	animateWave(entries, observer) {
		entries.forEach((entry) => {
			if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
				const $target = entry.target;
				const $paths = $target.matches(wavePrimary.config.selector)
					? [$target]
					: $target.querySelectorAll(wavePrimary.config.selector);

				$paths.forEach(($path) => $path.classList.add(wavePrimary.config.activeClass));
				observer.unobserve($target);
			}
		});
	},
};

export { wavePrimary };