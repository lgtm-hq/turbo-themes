var TurboHomepageShowcase = (function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region assets/js/homepage-showcase.ts
	/**
	* Homepage showcase interactions.
	*
	* Spotlight drift, comet-card tilt, text mask, scroll reveals, theme marquee
	* pause, and the interactive preview card. Pure state transitions are exported
	* for unit testing; DOM wiring stays thin and is initialized on
	* DOMContentLoaded.
	*/
	/** Fallback icon used when a theme has no dedicated icon entry. */
	var DEFAULT_THEME_ICON = "catppuccin-logo-macchiato.png";
	/** Maximum spotlight drift, in pixels, before the direction flips. */
	var SPOTLIGHT_LIMIT = 100;
	/** Pixels the spotlight drifts per animation frame. */
	var SPOTLIGHT_STEP = .15;
	/** Maximum comet-card tilt, in degrees, on each axis. */
	var MAX_TILT_DEGREES = 14;
	/** Progress percentage the preview card animates to. */
	var PROGRESS_TARGET = 92;
	/** Tilt targets when the pointer is not over the comet card. */
	var RESTING_TILT_TARGETS = {
		rotateX: 0,
		rotateY: 0,
		glareX: 50,
		glareY: 50
	};
	/**
	* Check whether the user prefers reduced motion.
	*
	* @param source - Object exposing matchMedia (usually window).
	* @returns True when reduced motion is requested.
	*/
	function prefersReducedMotion(source) {
		return source.matchMedia("(prefers-reduced-motion: reduce)").matches;
	}
	/**
	* Advance the spotlight drift by one frame, bouncing at the limits.
	*
	* @param state - Current offset and direction.
	* @param step - Pixels to drift this frame.
	* @param limit - Absolute offset at which the direction flips.
	* @returns The next spotlight state.
	*/
	function stepSpotlight(state, step = SPOTLIGHT_STEP, limit = 100) {
		const offset = state.offset + state.direction * step;
		let direction = state.direction;
		if (offset > limit) direction = -1;
		if (offset < -limit) direction = 1;
		return {
			offset,
			direction
		};
	}
	/**
	* Compute tilt and glare targets for a pointer position over the card.
	*
	* @param clientX - Pointer x coordinate in viewport space.
	* @param clientY - Pointer y coordinate in viewport space.
	* @param rect - Card bounding box.
	* @param maxTilt - Maximum tilt in degrees on each axis.
	* @returns Rotation and glare targets.
	*/
	function computeTiltTargets(clientX, clientY, rect, maxTilt = 14) {
		const xPct = (clientX - rect.left) / rect.width - .5;
		return {
			rotateX: -((clientY - rect.top) / rect.height - .5) * maxTilt,
			rotateY: xPct * maxTilt,
			glareX: (clientX - rect.left) / rect.width * 100,
			glareY: (clientY - rect.top) / rect.height * 100
		};
	}
	/**
	* Move a value a fraction of the way toward a target (ease-out step).
	*
	* @param current - Current value.
	* @param target - Target value.
	* @param rate - Fraction of the remaining distance to cover (0..1).
	* @returns The eased value.
	*/
	function approach(current, target, rate) {
		return current + (target - current) * rate;
	}
	/**
	* Convert a pointer position into percentages within a bounding box.
	*
	* @param clientX - Pointer x coordinate in viewport space.
	* @param clientY - Pointer y coordinate in viewport space.
	* @param rect - Element bounding box.
	* @returns X/Y position as percentages (0..100).
	*/
	function pointerPercent(clientX, clientY, rect) {
		return {
			x: (clientX - rect.left) / rect.width * 100,
			y: (clientY - rect.top) / rect.height * 100
		};
	}
	/**
	* Decide the marquee row's animation-play-state for a hover state.
	*
	* @param isHovering - Whether the pointer is over the row.
	* @returns 'paused' while hovering, 'running' otherwise.
	*/
	function marqueePlayState(isHovering) {
		return isHovering ? "paused" : "running";
	}
	/**
	* Activate the tab and panel matching a target and deactivate the rest.
	*
	* @param tabs - Preview tab buttons (data-preview-tab).
	* @param panels - Preview panels (data-preview-panel).
	* @param target - The data-preview-tab value to activate.
	*/
	function applyTabSelection(tabs, panels, target) {
		for (const tab of tabs) {
			const isActive = tab.getAttribute("data-preview-tab") === target;
			tab.classList.toggle("active", isActive);
			tab.setAttribute("aria-selected", isActive ? "true" : "false");
		}
		for (const panel of panels) {
			const isActive = panel.getAttribute("data-preview-panel") === target;
			panel.classList.toggle("is-active", isActive);
			panel.hidden = !isActive;
		}
	}
	/**
	* Resolve the display name and icon URL for a theme from page metadata.
	*
	* @param theme - Theme identifier (e.g. 'catppuccin-mocha').
	* @param meta - Theme metadata injected by the page.
	* @returns Display name and fully-qualified icon source.
	*/
	function resolveThemeDisplay(theme, meta) {
		const name = meta.themeFullNames[theme] ?? meta.themeNames[theme] ?? theme;
		const icon = meta.themeIcons[theme] ?? "catppuccin-logo-macchiato.png";
		return {
			name,
			iconSrc: `${meta.baseUrl}/assets/img/${icon}`
		};
	}
	/**
	* Render the progress bar at a given percentage.
	*
	* @param elements - Progress bar elements.
	* @param percent - Percentage to render (0..100).
	*/
	function renderProgress(elements, percent) {
		elements.fill.style.width = `${percent}%`;
		elements.value.textContent = `${percent}%`;
		elements.bar?.setAttribute("aria-valuenow", String(percent));
	}
	/**
	* Animate the progress bar from zero to its target.
	*
	* With reduced motion the target renders immediately; otherwise the target
	* render is deferred via the scheduler so the CSS transition can play.
	*
	* @param elements - Progress bar elements.
	* @param options - Target percentage, reduced-motion flag, and scheduler.
	*/
	function animateProgress(elements, options) {
		const { target, reducedMotion } = options;
		renderProgress(elements, 0);
		if (reducedMotion) {
			renderProgress(elements, target);
			return;
		}
		(options.schedule ?? ((callback) => {
			requestAnimationFrame(() => {
				requestAnimationFrame(callback);
			});
		}))(() => {
			renderProgress(elements, target);
		});
	}
	/**
	* Start the spotlight drift animation.
	*
	* @param reducedMotion - Whether the user prefers reduced motion.
	*/
	function initSpotlight(reducedMotion) {
		const root = document.getElementById("showcase-spotlight");
		if (!root || reducedMotion) return;
		const left = root.querySelector(".showcase-spotlight-left");
		const right = root.querySelector(".showcase-spotlight-right");
		if (!left || !right) return;
		let state = {
			offset: 0,
			direction: 1
		};
		const tick = () => {
			state = stepSpotlight(state);
			left.style.transform = `translateX(${state.offset}px)`;
			right.style.transform = `translateX(${-state.offset}px)`;
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	}
	/**
	* Wire the comet-card tilt and glare animation.
	*
	* @param reducedMotion - Whether the user prefers reduced motion.
	*/
	function initCometCard(reducedMotion) {
		const card = document.getElementById("showcase-comet-card");
		const glare = document.getElementById("showcase-comet-glare");
		if (!card || reducedMotion) return;
		let current = { ...RESTING_TILT_TARGETS };
		let targets = { ...RESTING_TILT_TARGETS };
		card.addEventListener("mousemove", (event) => {
			targets = computeTiltTargets(event.clientX, event.clientY, card.getBoundingClientRect());
		});
		card.addEventListener("mouseleave", () => {
			targets = { ...RESTING_TILT_TARGETS };
		});
		const animate = () => {
			current = {
				rotateX: approach(current.rotateX, targets.rotateX, .12),
				rotateY: approach(current.rotateY, targets.rotateY, .12),
				glareX: approach(current.glareX, targets.glareX, .15),
				glareY: approach(current.glareY, targets.glareY, .15)
			};
			card.style.transform = `perspective(900px) rotateX(${current.rotateX}deg) rotateY(${current.rotateY}deg) scale3d(1.02,1.02,1.02)`;
			if (glare) glare.style.background = `radial-gradient(circle at ${current.glareX}% ${current.glareY}%, color-mix(in srgb, var(--turbo-text-primary) 35%, transparent) 0%, transparent 65%)`;
			requestAnimationFrame(animate);
		};
		animate();
	}
	/**
	* Wire the hover-following text mask.
	*
	* @param reducedMotion - Whether the user prefers reduced motion.
	*/
	function initTextMask(reducedMotion) {
		const wrap = document.getElementById("showcase-text-mask");
		if (!wrap || reducedMotion) return;
		wrap.addEventListener("mousemove", (event) => {
			const { x, y } = pointerPercent(event.clientX, event.clientY, wrap.getBoundingClientRect());
			wrap.style.setProperty("--mx", `${x}%`);
			wrap.style.setProperty("--my", `${y}%`);
			wrap.classList.add("is-hovering");
		});
		wrap.addEventListener("mouseleave", () => {
			wrap.classList.remove("is-hovering");
			wrap.style.setProperty("--mx", "50%");
			wrap.style.setProperty("--my", "50%");
		});
	}
	/**
	* Reveal elements on scroll, or immediately with reduced motion.
	*
	* @param reducedMotion - Whether the user prefers reduced motion.
	*/
	function initScrollReveal(reducedMotion) {
		if (!("IntersectionObserver" in window)) return;
		const items = document.querySelectorAll("[data-showcase-reveal]");
		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) if (entry.isIntersecting) {
				entry.target.classList.add("is-visible");
				observer.unobserve(entry.target);
			}
		}, {
			threshold: .15,
			rootMargin: "0px 0px -40px 0px"
		});
		for (const el of items) if (reducedMotion) el.classList.add("is-visible");
		else observer.observe(el);
	}
	/** Pause marquee rows on hover and resume on leave. */
	function initMarqueePause() {
		for (const row of document.querySelectorAll(".showcase-marquee-row")) {
			row.addEventListener("mouseenter", () => {
				row.style.animationPlayState = marqueePlayState(true);
			});
			row.addEventListener("mouseleave", () => {
				row.style.animationPlayState = marqueePlayState(false);
			});
		}
	}
	/**
	* Wire the interactive preview card: tabs, progress bar, buttons, and
	* theme-change updates.
	*
	* @param reducedMotion - Whether the user prefers reduced motion.
	*/
	function initPreviewCard(reducedMotion) {
		const tabs = Array.from(document.querySelectorAll(".showcase-preview-tab"));
		const panels = Array.from(document.querySelectorAll(".showcase-preview-panel"));
		const toast = document.getElementById("showcase-preview-toast");
		let toastTimer;
		const progressFill = document.getElementById("showcase-progress-fill");
		const progressValue = document.getElementById("showcase-progress-value");
		const progressBar = document.getElementById("showcase-progress-bar");
		const progressElements = progressFill && progressValue ? {
			fill: progressFill,
			value: progressValue,
			bar: progressBar
		} : null;
		const showToast = (message) => {
			if (!toast) return;
			toast.textContent = message;
			toast.hidden = false;
			clearTimeout(toastTimer);
			toastTimer = setTimeout(() => {
				toast.hidden = true;
			}, 1600);
		};
		const runProgress = () => {
			if (!progressElements) return;
			animateProgress(progressElements, {
				target: 92,
				reducedMotion
			});
		};
		for (const tab of tabs) tab.addEventListener("click", () => {
			const target = tab.getAttribute("data-preview-tab");
			if (!target) return;
			applyTabSelection(tabs, panels, target);
			if (target === "overview") runProgress();
		});
		const codeBtn = document.getElementById("showcase-preview-code");
		if (codeBtn) codeBtn.addEventListener("click", () => {
			const snippet = "background: var(--turbo-bg-surface);\ncolor: var(--turbo-text-primary);";
			if (typeof navigator.clipboard?.writeText === "function") navigator.clipboard.writeText(snippet).then(() => {
				showToast("Copied CSS snippet");
			});
			else showToast(snippet);
		});
		const primaryBtn = document.getElementById("showcase-preview-primary");
		if (primaryBtn) primaryBtn.addEventListener("click", () => {
			primaryBtn.classList.add("is-pressed");
			showToast("Primary action");
			setTimeout(() => {
				primaryBtn.classList.remove("is-pressed");
			}, 300);
		});
		const outlineBtn = document.getElementById("showcase-preview-outline");
		if (outlineBtn) outlineBtn.addEventListener("click", () => {
			outlineBtn.classList.toggle("is-active");
			showToast(outlineBtn.classList.contains("is-active") ? "Outline active" : "Outline default");
		});
		document.addEventListener("showcase-theme-change", (event) => {
			const theme = event.detail?.theme;
			const meta = window.__showcaseMeta;
			if (!theme || !meta) return;
			const display = resolveThemeDisplay(theme, meta);
			const nameEl = document.getElementById("showcase-preview-theme-name");
			const iconEl = document.getElementById("showcase-preview-theme-icon");
			if (nameEl) nameEl.textContent = display.name;
			if (iconEl instanceof HTMLImageElement) iconEl.src = display.iconSrc;
			if (document.querySelector("[data-preview-panel=\"overview\"]")?.classList.contains("is-active")) runProgress();
		});
		const currentTheme = document.documentElement.getAttribute("data-theme") ?? "catppuccin-mocha";
		document.dispatchEvent(new CustomEvent("showcase-theme-change", { detail: { theme: currentTheme } }));
		runProgress();
	}
	/** Initialize every showcase interaction on the current document. */
	function initShowcase() {
		const reducedMotion = prefersReducedMotion(window);
		initSpotlight(reducedMotion);
		initCometCard(reducedMotion);
		initTextMask(reducedMotion);
		initScrollReveal(reducedMotion);
		initMarqueePause();
		initPreviewCard(reducedMotion);
	}
	if (typeof document !== "undefined" && typeof window !== "undefined") document.addEventListener("DOMContentLoaded", () => {
		initShowcase();
	});
	//#endregion
	exports.DEFAULT_THEME_ICON = DEFAULT_THEME_ICON;
	exports.MAX_TILT_DEGREES = MAX_TILT_DEGREES;
	exports.PROGRESS_TARGET = PROGRESS_TARGET;
	exports.RESTING_TILT_TARGETS = RESTING_TILT_TARGETS;
	exports.SPOTLIGHT_LIMIT = SPOTLIGHT_LIMIT;
	exports.SPOTLIGHT_STEP = SPOTLIGHT_STEP;
	exports.animateProgress = animateProgress;
	exports.applyTabSelection = applyTabSelection;
	exports.approach = approach;
	exports.computeTiltTargets = computeTiltTargets;
	exports.initShowcase = initShowcase;
	exports.marqueePlayState = marqueePlayState;
	exports.pointerPercent = pointerPercent;
	exports.prefersReducedMotion = prefersReducedMotion;
	exports.renderProgress = renderProgress;
	exports.resolveThemeDisplay = resolveThemeDisplay;
	exports.stepSpotlight = stepSpotlight;
	return exports;
})({});

//# sourceMappingURL=homepage-showcase.js.map