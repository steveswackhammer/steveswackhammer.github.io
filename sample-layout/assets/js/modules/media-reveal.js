const mediaReveal = {
	init() {
		const $panels = document.querySelectorAll('.media-reveal--silo');
		if (!$panels.length) {
			return;
		}

		const observer = new IntersectionObserver((entries, obs) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
					entry.target.classList.add('media-reveal--active');
					obs.unobserve(entry.target);
				}
			});
		}, {
			rootMargin: `0px 0px ${-(window.innerHeight / 2 - 100)}px 0px`,
		});

		$panels.forEach(($el) => observer.observe($el));
	},
};

export { mediaReveal };