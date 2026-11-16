/* =========================================================
   JA — site motion
   Everything here is progressive: the site works without it.
   ========================================================= */
(() => {
	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
	const $ = (s, r = document) => r.querySelector(s);
	const $$ = (s, r = document) => [...r.querySelectorAll(s)];

	// Footer year
	$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

	/* ---------- page wipe between pages ---------- */
	const wipe = document.createElement("div");
	wipe.className = "wipe";
	wipe.innerHTML = '<svg viewBox="0 0 99.21 94.7"><use href="#mark"/></svg>';
	document.body.appendChild(wipe);
	requestAnimationFrame(() => document.body.classList.add("is-loaded"));
	window.addEventListener("pageshow", (e) => { if (e.persisted) document.body.classList.remove("is-leaving"); });

	if (!reduce) {
		document.addEventListener("click", (e) => {
			const a = e.target.closest("a");
			if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
			const url = new URL(a.href, location.href);
			if (url.origin !== location.origin && url.protocol !== "file:") return;
			if (url.pathname === location.pathname) return; // same page / hash links
			e.preventDefault();
			document.body.classList.add("is-leaving");
			setTimeout(() => (location.href = a.href), 420);
		});
	}

	/* ---------- scramble text ---------- */
	const GLYPHS = "!<>-_\\/[]{}=+*^?#X01";
	function scramble(el, duration = 650) {
		if (reduce) return;
		const final = el.dataset.text || (el.dataset.text = el.textContent);
		const start = performance.now();
		(function frame(now) {
			const t = Math.min(1, (now - start) / duration);
			const settled = Math.floor(final.length * t);
			let out = "";
			for (let i = 0; i < final.length; i++) {
				const c = final[i];
				out += i < settled || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
			}
			el.textContent = out;
			if (t < 1) requestAnimationFrame(frame);
		})(start);
	}
	window.jaScramble = scramble;

	/* ---------- count up ---------- */
	function countUp(el) {
		const target = parseFloat(el.dataset.count);
		const dec = (el.dataset.count.split(".")[1] || "").length;
		if (reduce) { el.textContent = target.toLocaleString("en-US", { minimumFractionDigits: dec }); return; }
		const start = performance.now(), dur = 1100;
		(function frame(now) {
			const t = Math.min(1, (now - start) / dur);
			const eased = 1 - Math.pow(1 - t, 4);
			el.textContent = (target * eased).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
			if (t < 1) requestAnimationFrame(frame);
		})(start);
	}

	/* ---------- reveal on scroll ---------- */
	const revealSel = ".section-head, .row, .build-list li, .snap, .demo, .case-lead, .case-text, .facts > div, .about-lead, .about-small, .contact-big, .how li, .now li, .next";
	const io = new IntersectionObserver((entries) => {
		entries.forEach((en) => {
			if (!en.isIntersecting) return;
			const el = en.target;
			el.classList.add("is-in");
			const h = el.matches(".section-head") ? $("h2", el) : null;
			if (h) scramble(h);
			$$("[data-count]", el).forEach(countUp);
			if (el.matches("[data-count]")) countUp(el);
			io.unobserve(el);
		});
	}, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });

	if (!reduce) {
		$$(revealSel).forEach((el) => {
			el.classList.add("reveal");
			// stagger siblings in lists
			const i = [...el.parentElement.children].indexOf(el);
			if (el.matches(".row, .build-list li, .facts > div, .how li, .now li, .snap")) el.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
			io.observe(el);
		});
	} else {
		$$("[data-count]").forEach(countUp);
	}

	/* ---------- hero letters: knock them and they hollow out ---------- */
	$$(".hero-title > span").forEach((line) => {
		[...line.childNodes].forEach((node) => {
			if (node.nodeType !== 3) return;
			const frag = document.createDocumentFragment();
			[...node.textContent].forEach((ch) => {
				const s = document.createElement("span");
				s.className = "ch";
				s.textContent = ch;
				frag.appendChild(s);
			});
			node.replaceWith(frag);
		});
	});
	if (canHover && !reduce) {
		$$(".hero-title .ch").forEach((ch) => {
			ch.addEventListener("pointerenter", () => {
				ch.classList.add("hit");
				clearTimeout(ch._t);
				ch._t = setTimeout(() => ch.classList.remove("hit"), 1200);
			});
		});
	}

	/* ---------- row titles scramble on hover ---------- */
	if (canHover) $$(".row").forEach((row) => row.addEventListener("pointerenter", () => scramble($(".row-title", row), 380)));

	/* ---------- ticker driven by scroll speed ---------- */
	const track = $(".ticker-track");
	if (track && !reduce) {
		track.parentElement.classList.add("ticker--js");
		let x = 0, dir = 1, boost = 0, lastY = scrollY;
		window.addEventListener("scroll", () => {
			const dy = scrollY - lastY;
			lastY = scrollY;
			if (dy) dir = dy > 0 ? 1 : -1;
			boost = Math.min(30, boost + Math.abs(dy) * 0.25);
		}, { passive: true });
		(function loop() {
			const half = track.scrollWidth / 2;
			x -= (0.6 + boost) * dir;
			boost *= 0.92;
			if (x <= -half) x += half;
			if (x > 0) x -= half;
			track.style.transform = `translate3d(${x}px,0,0)`;
			requestAnimationFrame(loop);
		})();
	}

	/* ---------- scroll progress (case pages) ---------- */
	if (document.body.classList.contains("case")) {
		const bar = document.createElement("div");
		bar.className = "progress";
		document.body.appendChild(bar);
		const upd = () => {
			const max = document.documentElement.scrollHeight - innerHeight;
			bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
		};
		window.addEventListener("scroll", upd, { passive: true });
		upd();
	}

	/* ---------- custom cursor ---------- */
	if (canHover && !reduce) {
		const cur = document.createElement("div");
		cur.className = "cur";
		cur.innerHTML = "<span></span>";
		document.body.appendChild(cur);
		document.body.classList.add("has-cur");
		let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
		window.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
		document.addEventListener("pointerover", (e) => {
			const t = e.target.closest("a, button, input, label, [data-cursor], .ikon");
			cur.classList.toggle("is-big", !!t);
			cur.firstChild.textContent = t?.dataset.cursor || "";
		});
		document.addEventListener("pointerdown", () => cur.classList.add("is-down"));
		document.addEventListener("pointerup", () => cur.classList.remove("is-down"));
		(function loop() {
			cx += (x - cx) * 0.25;
			cy += (y - cy) * 0.25;
			cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
			requestAnimationFrame(loop);
		})();
	}

	/* ---------- homepage: xeroxed preview that trails the cursor ---------- */
	const preview = $(".preview");
	if (preview && canHover) {
		const img = $("img", preview);
		let x = 0, y = 0, px = 0, py = 0;
		window.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
		(function follow() {
			px += (x - px) * 0.16;
			py += (y - py) * 0.16;
			preview.style.left = `${px + 190}px`;
			preview.style.top = `${py}px`;
			requestAnimationFrame(follow);
		})();
		$$(".row").forEach((row) => {
			row.addEventListener("pointerenter", () => {
				const src = row.dataset.img;
				preview.classList.toggle("is-text", !src);
				if (src) img.src = src;
				preview.classList.add("is-on");
			});
			row.addEventListener("pointerleave", () => preview.classList.remove("is-on"));
		});
	}
})();
