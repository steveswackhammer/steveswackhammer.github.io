import { filterMenu } from './modules/filter-menu.js';
import { mediaReveal } from './modules/media-reveal.js';
import { rotation } from './modules/rotation.js';
import { scrollWave } from './modules/scroll-wave.js';
import { shakeItUp } from './modules/shake-it-up.js';
import { wavePrimary } from './modules/wave-primary.js';

const ready = function ready(callbackFunc) {
	// Document is ready; call the callback function
	if (document.readyState !== 'loading') {
		callbackFunc();
		// Modern browsers
	} else if (document.addEventListener) {
		document.addEventListener('DOMContentLoaded', callbackFunc, false);
		// Old IE browsers (IE <= 8)
	} else {
		document.attachEvent('onreadystatechange', function () {
			if (document.readyState === 'complete') {
				callbackFunc();
			}
		});
	}
};

const main = {
	init() {
		main.runPageScripts();
	},
	runPageScripts() {
		filterMenu.init();
		mediaReveal.init();
		rotation.init();
		scrollWave.init();
		shakeItUp.init();
		wavePrimary.init();
		this.bindUIActions();
	},
	bindUIActions() {}
};

ready(function () {
	main.init();
});
