const filterMenu = {

	config: {
		filter: 'data-product-category',									// The property to filter results with
		menu: 'data-filters-menu',												// The menu containing the filter controls
		menuVisibilityClass: 'show',											// The active class to toggle the menu's visibility
		item: 'data-filters-item', 												// The filter control (link)
		valueAttr: 'data-filter-value', 									// Data attribute on <a> to specify filter value
		panel: 'data-filters-panel',											// The id of the panel where the results are displayed
		title: 'data-filters-title',											// The id of title element
		filterActive: 'filter-active',										// The class added when a filter control is selected
		resultHidden: 'hide',															// The class added to a result to hide it
		subfilterGroup: 'data-product-subfilters',        // Container of all subfilter blocks
		subfilterCategory: 'data-subfilters-category',    // Which main category the subfilters belong to
		subfilterItem: 'data-subfilters-item',            // The button to activate subfilter
		productSubcategory: 'data-product-subcategory',   // The attribute on each product result for subfiltering
    noScrollClass: 'no-scroll',
  	mq: window.matchMedia('(max-width: 47.999em)'),
	},

	elem: {
		$menus: document.querySelectorAll('[data-filters-menu]')
	},

	state: {
		selectedSubfilters: {},
		scrollPosition: 0,
		scrollAfterClose: false,
	},

	init() {
		// Give every result a unique view-transition-name to animate each card individually
		document.querySelectorAll('[' + filterMenu.config.filter + ']').forEach(($el, i) => {
			$el.style.viewTransitionName = `product-card-${i}`;
		});

		filterMenu.elem.$menus.forEach((element) => {
			filterMenu.setupMenu(element);
			filterMenu.setupSubfilters();
		});

		filterMenu.selectViaUrl();
		filterMenu.bindUIActions();
	},

	bindUIActions() {
		window.addEventListener('popstate', filterMenu.selectViaUrl);

		document.querySelectorAll('.js-subfilters-menu-trigger').forEach(($el) => {
			$el.addEventListener('click', filterMenu.toggleSubfilters);
		});

		document.querySelectorAll('.js-filters-menu-trigger').forEach(($el) => {
			$el.addEventListener('click', filterMenu.toggleSubfilters);
		});

		document.querySelectorAll('.js-subfilters-menu-close').forEach(($el) => {
			$el.addEventListener('click', filterMenu.toggleSubfilters);
		});

		document.body.addEventListener('keyup', (e) => {
			if (e.key === 'Escape') {
				filterMenu.hideMenu();
			}
		});

		filterMenu.config.mq.addEventListener('change', filterMenu.manageFilterMenu);
	},

	isOverlayOpen() {
		return !!document.querySelector('.js-subfilters-menu.' + filterMenu.config.menuVisibilityClass);
	},

	scrollToFilters($target) {
		if (!$target) return;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		$target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
	},

	/**
	 * Run DOM update inside a View Transition (when supported)
	 */
	transition(update) {
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const overlayOpen = document.querySelector('.js-subfilters-menu.' + filterMenu.config.menuVisibilityClass);

		if (!document.startViewTransition || reduceMotion || overlayOpen) {
			update();
			return Promise.resolve();
		}

		return document.startViewTransition(update).updateCallbackDone;
	},

	setActive($btn, isActive) {
		$btn.classList.toggle(filterMenu.config.filterActive, isActive);
		$btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
	},

	announceResults() {
		const $status = document.getElementById('filter-status');
		if (!$status) return;

		const count = document.querySelectorAll(
			'[' + filterMenu.config.filter + ']:not(.' + filterMenu.config.resultHidden + ')'
		).length;

		$status.textContent = `Showing ${count} product${count === 1 ? '' : 's'}`;
	},

	handleChange(value, $item, panel, title, eventType = 'click') {
		const $menu = $item.closest('[' + filterMenu.config.menu + ']');
		const overlayOpen = filterMenu.isOverlayOpen();

		filterMenu.transition(() => {
			filterMenu.applyChange(value, $item, panel, title, eventType);
			filterMenu.announceResults();
		}).then(() => {

			if (overlayOpen) {
				filterMenu.state.scrollAfterClose = true;
				return;
			}

			filterMenu.scrollToFilters($menu.querySelector(title));
		});
	},

	applyChange(value, $item, panel, title, eventType = 'click') {
		const $menu = $item.closest('[' + filterMenu.config.menu + ']');
		const $filtered = document.querySelectorAll('[' + filterMenu.config.filter + ']');
		const $activeFilter = $menu.querySelectorAll('.' + filterMenu.config.filterActive);
		const $clearBtn = document.querySelectorAll('.js-clear-filters');
		const $clearSubfiltersBtn = document.querySelectorAll('.js-clear-subfilters');
		const $subfilterMenuTrigger = document.querySelectorAll('.js-subfilters-menu-trigger');
		const $subfilters = document.querySelectorAll('[' + filterMenu.config.subfilterGroup + ']');

		// Remove previous active states
		$activeFilter.forEach(($el) => filterMenu.setActive($el, false));
		filterMenu.setActive($item, true);

		filterMenu.state.selectedSubfilters[value] = new Set();

		// Update panel title
		const $panelTitle = $menu.querySelector(title);
		if ($panelTitle) $panelTitle.innerText = 'View ' + value;

		// Update URL
		if (eventType !== 'poppedchange' && value !== 'All Products') {
			const selectedSet = filterMenu.state.selectedSubfilters[value];
			let subfilters = selectedSet ? Array.from(selectedSet).join(',') : '';
			let newHash = value.replace(/\s+/g, '-').toLowerCase();
			let newUrl = `${window.location.pathname}`;
			
			if (subfilters.length > 0) {
			  newUrl += `?subfilters=${subfilters}`;
			}

			newUrl += `#${newHash}`;

			if (newUrl !== location.pathname + location.search + location.hash) {
				history.pushState(null, null, newUrl);
			}
		}

		// Show all?
		if (value === 'All Products') {
			const $panelTitle = $menu.querySelector(title);
			if ($panelTitle) $panelTitle.innerText = 'View ' + value;

			// Clear query string and hash
			if (eventType !== 'poppedchange') {
				history.pushState(null, null, window.location.pathname);
			}

			$filtered.forEach(($el) => {
				$el.removeAttribute('aria-hidden');
				$el.classList.remove(filterMenu.config.resultHidden);
			});

			// Hide clear buttons
			$clearBtn.forEach(($el) => {
				$el.classList.add('hide');
			});

			// Hide subfilter trigger
			$subfilterMenuTrigger.forEach(($el) => {
				$el.classList.remove('hide');
			});

			// Hide subfilters
			$subfilters.forEach(($el) => {
				const $category = $el.querySelectorAll('[' + filterMenu.config.subfilterCategory + ']');
				$category.forEach(($el) => {
					$el.classList.add('hide');
				});
			});

			return;
		}

		// Hide all results
		$filtered.forEach(($el) => {
			$el.setAttribute('aria-hidden', 'true');
			$el.classList.add(filterMenu.config.resultHidden);
		});

		$clearBtn.forEach(($el) => {
			$el.classList.remove('hide');
		});

		// Show matching results
		document.querySelectorAll('[' + filterMenu.config.filter + '="' + value + '"]').forEach(($el) => {
			$el.removeAttribute('aria-hidden');
			$el.classList.remove(filterMenu.config.resultHidden);
		});

		// Show relevant subfilter group
		const $subfilterGroups = document.querySelectorAll('[' + filterMenu.config.subfilterGroup + '] > [' + filterMenu.config.subfilterCategory + ']');

		$clearSubfiltersBtn.forEach(($el) => {
			$el.classList.add('hide');
		});

		$subfilterMenuTrigger.forEach(($el) => {
			$el.classList.add('hide');
		});

		$subfilterGroups.forEach(($group) => {
		  const category = $group.getAttribute(filterMenu.config.subfilterCategory);
		  if (category === value) {
		    $group.classList.remove('hide');

    		if ($panelTitle) {
    			$panelTitle.innerText = 'Filter ' + value;
    		}

    		$subfilterMenuTrigger.forEach(($el) => {
    			if(!$el.classList.contains('close-trigger')) {
    				$el.innerText = 'Filter ' + value;
    			}
    			$el.classList.remove('hide');
    		});

		  } else {
		    $group.classList.add('hide');
		  }
		});
	},

	handleSubfilterChange(category, eventType = 'click') {
		filterMenu.transition(() => {
			filterMenu.applySubfilterChange(category, eventType);
			filterMenu.announceResults();
		});
	},

	applySubfilterChange(category, eventType = 'click') {
		const $products = document.querySelectorAll(`[${filterMenu.config.filter}="${category}"]`);
		const selectedSet = filterMenu.state.selectedSubfilters[category];
		const $buttons = document.querySelectorAll(`[${filterMenu.config.subfilterCategory}="${category}"] [${filterMenu.config.subfilterItem}]`);
		const $clearBtn = document.querySelectorAll('.js-clear-subfilters');


		// If 'all' is selected, reset the set and show all
		if (selectedSet.has('all')) {
			filterMenu.state.selectedSubfilters[category] = new Set();

			// Update URL without subfilters
			let newHash = category.replace(/\s+/g, '-').toLowerCase();
			let newUrl = `${window.location.pathname}#${newHash}`;
			if (newUrl !== location.pathname + location.search + location.hash) {
				history.pushState(null, null, newUrl);
			}

			// Hide clear button
			$clearBtn.forEach(($el) => {
				filterMenu.setActive($btn, false);
			});

			$buttons.forEach(($btn) => {
				$btn.classList.remove(filterMenu.config.filterActive);
			});

			$products.forEach(($el) => {
				$el.removeAttribute('aria-hidden');
				$el.classList.remove(filterMenu.config.resultHidden);
			});
			return;
		}

		// Update URL
		if (eventType !== 'poppedchange') {
			const selectedSet = filterMenu.state.selectedSubfilters[category];
			let subfilters = selectedSet ? Array.from(selectedSet).join(',') : '';
			let newHash = category.replace(/\s+/g, '-').toLowerCase();
			let newUrl = `${window.location.pathname}`;
			
			if (subfilters.length > 0) {
			  newUrl += `?subfilters=${subfilters}`;
			}

			newUrl += `#${newHash}`;
			
			if (newUrl !== location.pathname + location.search + location.hash) {
				history.pushState(null, null, newUrl);
			}
		}


		// Update active states
		$buttons.forEach(($btn) => {
			const val = $btn.getAttribute(filterMenu.config.subfilterItem);
			filterMenu.setActive($btn, selectedSet.has(val));
		});

		// If nothing selected, show all
		if (selectedSet.size === 0) {
			$products.forEach(($el) => {
				$el.removeAttribute('aria-hidden');
				$el.classList.remove(filterMenu.config.resultHidden);
			});

			// Hide clear button
			$clearBtn.forEach(($el) => {
				$el.classList.add('hide');
			});
			
			return;
		}

		// Show clear button
		$clearBtn.forEach(($el) => {
			$el.classList.remove('hide');
		});

		// Otherwise, show only matching products
		$products.forEach(($el) => {
			const sub = $el.getAttribute(filterMenu.config.productSubcategory);
			const shouldShow = selectedSet.has(sub);

			$el.setAttribute('aria-hidden', !shouldShow);
			$el.classList.toggle(filterMenu.config.resultHidden, !shouldShow);
		});
	},

	toggleSubfilters() {
		const $nav = document.querySelector('.js-subfilters-menu');
		if (!$nav) return;

		if ($nav.classList.contains(filterMenu.config.menuVisibilityClass)) {
			filterMenu.hideMenu();
		} else {
			filterMenu.showMenu();
		}
	},

	hideMenu() {
		const $filtersNav = document.querySelectorAll('.js-subfilters-menu');
		const isOpen = [...$filtersNav].some(($el) => $el.classList.contains(filterMenu.config.menuVisibilityClass));

		if (!isOpen) return;

		document.body.classList.remove(filterMenu.config.noScrollClass);
		document.body.style.position = '';
		document.body.style.top = '';
		document.body.style.width = '';
		window.scrollTo(0, filterMenu.state.scrollPosition);

		$filtersNav.forEach(($el) => {
			$el.classList.remove(filterMenu.config.menuVisibilityClass);
		});

		// Sync state + return focus to the button that opened the menu
		document.querySelectorAll('.js-filters-menu-trigger, .js-subfilters-menu-trigger').forEach(($el) => {
			$el.setAttribute('aria-expanded', 'false');
		});
		
		const $trigger = document.querySelector('.js-filters-menu-trigger');
		$trigger?.focus({ preventScroll: true });

		if (filterMenu.state.scrollAfterClose && filterMenu.config.mq.matches) {
			filterMenu.scrollToFilters($trigger);
		}
		filterMenu.state.scrollAfterClose = false;
	},

	showMenu() {
		const $filtersNav = document.querySelectorAll('.js-subfilters-menu');

		filterMenu.state.scrollPosition = window.scrollY || window.pageYOffset;
		document.body.style.position = 'fixed';
		document.body.style.top = `-${filterMenu.state.scrollPosition}px`;
		document.body.style.width = '100%'; // Prevent horizontal scroll
		document.body.classList.add(filterMenu.config.noScrollClass);

		$filtersNav.forEach(($el) => {
			$el.classList.add(filterMenu.config.menuVisibilityClass);
		});

		// Sync state + move focus to overlay
		document.querySelectorAll('.js-filters-menu-trigger, .js-subfilters-menu-trigger').forEach(($el) => {
			$el.setAttribute('aria-expanded', 'true');
		});
		document.querySelector('.js-subfilters-menu .close-trigger')?.focus();
	},

	selectViaUrl(e) {
		const hash = window.location.hash;

		if (!hash.length) {
			if (!e) return;

			filterMenu.elem.$menus.forEach(($menu) => {
				const $all = $menu.querySelector(`[${filterMenu.config.valueAttr}="All Products"]`);
				const $item = $all?.closest(`[${filterMenu.config.item}]`);
				if (!$item) return;

				filterMenu.transition(() => {
					filterMenu.applyChange(
						'All Products',
						$item,
						'#' + $menu.getAttribute(filterMenu.config.panel),
						'.' + $menu.getAttribute(filterMenu.config.title),
						'poppedchange'
					);
					filterMenu.announceResults();
				});
			});
			return;
		}

		const hashPart = hash.substring(1);
		const value = hashPart.replace(/-/g, ' ').toLowerCase();

		const params = new URLSearchParams(window.location.search);
		const subfiltersRaw = params.get('subfilters');
		const subfilters = subfiltersRaw ? subfiltersRaw.split(',') : [];

		filterMenu.elem.$menus.forEach(($menu) => {
			const $items = $menu.querySelectorAll(`[${filterMenu.config.item}]`);

			$items.forEach(($item) => {
				const $link = $item.querySelector(`[${filterMenu.config.valueAttr}]`);
				if ($link && $link.getAttribute(filterMenu.config.valueAttr).toLowerCase() === value) {
					const category = $link.getAttribute(filterMenu.config.valueAttr);

					filterMenu.transition(() => {
						filterMenu.applyChange(category, $item, '#' + $menu.getAttribute(filterMenu.config.panel), '.' + $menu.getAttribute(filterMenu.config.title), 'poppedchange');

						const $buttons = document.querySelectorAll(`[${filterMenu.config.subfilterCategory}="${category}"] [${filterMenu.config.subfilterItem}]`);
						filterMenu.state.selectedSubfilters[category] = new Set(subfilters);

						$buttons.forEach(($btn) => {
							const val = $btn.getAttribute(filterMenu.config.subfilterItem);
							filterMenu.setActive($btn, subfilters.includes(val));
						});

						filterMenu.applySubfilterChange(category, 'poppedchange');
						filterMenu.announceResults();
					});
				}
			});
		});
	},

	setupMenu($menu) {
		const panel = $menu.getAttribute(filterMenu.config.panel) ? '#' + $menu.getAttribute(filterMenu.config.panel) : false;
		const title = $menu.getAttribute(filterMenu.config.title) ? '.' + $menu.getAttribute(filterMenu.config.title) : false;

		if (!panel || !title) {
			console.warn('Results panel or title ID missing!');
			return false;
		}

		const $items = $menu.querySelectorAll('[' + filterMenu.config.item + ']');

		$items.forEach(($item) => {
			const $link = $item.querySelector('[' + filterMenu.config.valueAttr + ']');
			
			if (!$link) { 
				return;
			}
			
			$item.addEventListener('click', (e) => {
				e.preventDefault();
				const value = $link.getAttribute(filterMenu.config.valueAttr);
				filterMenu.handleChange(value, $item, panel, title);
			});
		});
	},

	setupSubfilters() {
	  const $groups = document.querySelectorAll(`[${filterMenu.config.subfilterGroup}] > [${filterMenu.config.subfilterCategory}]`);

	  $groups.forEach(($group) => {
	    const category = $group.getAttribute(filterMenu.config.subfilterCategory);
	    const $buttons = $group.querySelectorAll(`[${filterMenu.config.subfilterItem}]`);

	    if (!filterMenu.state.selectedSubfilters[category]) {
	      filterMenu.state.selectedSubfilters[category] = new Set();
	    }

	    $buttons.forEach(($btn) => {
	      const subValue = $btn.getAttribute(filterMenu.config.subfilterItem);

	      $btn.addEventListener('click', () => {
	        const selectedSet = filterMenu.state.selectedSubfilters[category];

	        if (selectedSet.has(subValue)) {
	          selectedSet.delete(subValue);
	          filterMenu.setActive($btn, false);
	        } else {
	          selectedSet.add(subValue);
	          filterMenu.setActive($btn, true);
	        }

	        filterMenu.handleSubfilterChange(category);
	      });
	    });
	  });
	},

	manageFilterMenu() {
		if(!filterMenu.config.mq.matches) {
			filterMenu.hideMenu();
		}
	}
};

export { filterMenu };