const rotation = {

	init() {
		rotation.bindUIActions();
		rotation.updateValue();
	},

	bindUIActions() {
		document.addEventListener('scroll', () => {
			rotation.updateValue();
		});
	},
	updateValue() {
		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const scrollTop = window.scrollY;
		const docHeight = document.documentElement.scrollHeight - window.innerHeight;
		const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
		const degrees = Math.round(scrollPercent * 360);

		if(!prefersReducedMotion.matches) {
			document.documentElement.style.setProperty("--rotate-deg", `${degrees}deg`);
		}
	}
};

export { rotation };
