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
	const revealSel = ".section-head, .row, .build-list li, .snap, .demo, .case-lead, .case-text, .facts > div, .about-lead, .about-small, .contact-big, .how li, .now li, .next, .approach li, .af-grid";
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
			if (el.matches(".row, .build-list li, .facts > div, .how li, .now li, .snap, .approach li")) el.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
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
				preview.dataset.label = (row.dataset.label || ($(".row-title", row).dataset.text || $(".row-title", row).textContent)) + ".";
				if (src) img.src = src;
				preview.classList.add("is-on");
			});
			row.addEventListener("pointerleave", () => preview.classList.remove("is-on"));
		});
	}
})();

/* =========================================================
   UX: theme, palette, section index, keys, clock, filters
   ========================================================= */
(() => {
	const $ = (s, r = document) => r.querySelector(s);
	const $$ = (s, r = document) => [...r.querySelectorAll(s)];
	const root = document.documentElement;
	const typing = (e) => /input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable;

	/* ---------- ink / paper ---------- */
	const meta = $('meta[name="theme-color"]');
	function setTheme(t, save) {
		if (t === "paper") root.dataset.theme = "paper"; else delete root.dataset.theme;
		if (meta) meta.content = t === "paper" ? "#ecebe6" : "#0d0d0c";
		$$("[data-theme-toggle]").forEach((b) => {
			b.textContent = t === "paper" ? "/ink" : "/paper";
			b.setAttribute("aria-label", t === "paper" ? "Switch to dark" : "Switch to light");
		});
		if (save) try { localStorage.setItem("ja-theme", t); } catch (_) {}
	}
	const current = () => (root.dataset.theme === "paper" ? "paper" : "ink");
	const toggleTheme = () => setTheme(current() === "paper" ? "ink" : "paper", true);
	setTheme(current());
	$$("[data-theme-toggle]").forEach((b) => b.addEventListener("click", toggleTheme));

	/* ---------- hero collage: drag the cut-outs, tap to open ---------- */
	let topZ = 10;
	$$(".cut").forEach((el) => {
		let sx = 0, sy = 0, dx = 0, dy = 0, moved = false, id = null;
		el.addEventListener("pointerdown", (e) => {
			if (e.button !== 0) return;
			id = e.pointerId; moved = false;
			sx = e.clientX - dx; sy = e.clientY - dy;
			el.setPointerCapture(id);
			el.style.zIndex = ++topZ;
		});
		el.addEventListener("pointermove", (e) => {
			if (e.pointerId !== id) return;
			const nx = e.clientX - sx, ny = e.clientY - sy;
			if (!moved && Math.hypot(nx - dx, ny - dy) < 6) return;
			moved = true;
			el.classList.add("is-drag");
			dx = nx; dy = ny;
			el.style.setProperty("--dx", dx + "px");
			el.style.setProperty("--dy", dy + "px");
		});
		const end = (e) => { if (e.pointerId === id) { id = null; el.classList.remove("is-drag"); } };
		el.addEventListener("pointerup", end);
		el.addEventListener("pointercancel", end);
		el.addEventListener("click", (e) => { if (moved) { e.preventDefault(); moved = false; } });
		el.addEventListener("dragstart", (e) => e.preventDefault());
	});
	$$(".cut-wave i").forEach((i, k) => i.style.setProperty("--d", (k * 97) % 900));

	/* ---------- dubai clock ---------- */
	const clocks = $$("[data-clock]");
	if (clocks.length) {
		const f = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit" });
		const tick = () => clocks.forEach((c) => (c.textContent = `dubai ${f.format(new Date())}`));
		tick();
		setInterval(tick, 15000);
	}

	/* ---------- work filter ---------- */
	const filter = $(".work-filter");
	if (filter) {
		const rows = $$(".row");
		$$("button", filter).forEach((b) => {
			const k = b.dataset.kind;
			const n = k === "all" ? rows.length : rows.filter((r) => r.dataset.kind === k).length;
			b.insertAdjacentHTML("beforeend", `<sup>${n}</sup>`);
		});
		filter.addEventListener("click", (e) => {
			const b = e.target.closest("button");
			if (!b) return;
			$$("button", filter).forEach((x) => x.setAttribute("aria-pressed", x === b));
			rows.forEach((r) => {
				const dim = b.dataset.kind !== "all" && r.dataset.kind !== b.dataset.kind;
				r.classList.toggle("is-dim", dim);
				$("a", r).tabIndex = dim ? -1 : 0;
			});
		});
	}

	/* ---------- section index on case pages ---------- */
	if (document.body.classList.contains("case")) {
		const secs = $$("main .section").filter((s) => $(".section-head h2", s));
		if (secs.length > 2) {
			const nav = document.createElement("nav");
			nav.className = "toc";
			nav.setAttribute("aria-label", "On this page");
			secs.forEach((s) => {
				const h = $(".section-head h2", s);
				const name = (h.dataset.text || h.textContent).trim();
				s.id = s.id || name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
				nav.insertAdjacentHTML("beforeend", `<a href="#${s.id}">${name}</a>`);
			});
			document.body.appendChild(nav);
			const links = $$("a", nav);
			const io2 = new IntersectionObserver((ents) => ents.forEach((en) => {
				if (en.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.hash === "#" + en.target.id));
			}), { rootMargin: "-40% 0px -55% 0px" });
			secs.forEach((s) => io2.observe(s));
		}
	}

	/* ---------- home nav: mark the section you're in ---------- */
	const homeLinks = $$('.nav-links a[href^="#"]');
	if (homeLinks.length) {
		const io3 = new IntersectionObserver((ents) => ents.forEach((en) => {
			if (!en.isIntersecting) return;
			homeLinks.forEach((a) => (a.hash === "#" + en.target.id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
		}), { rootMargin: "-45% 0px -50% 0px" });
		homeLinks.forEach((a) => { const t = $(a.hash); if (t) io3.observe(t); });
	}

	/* ---------- command palette ---------- */
	const PAGES = [
		["home", "./index.html"], ["ikonplan", "./ikonplan.html"], ["bankcal", "./bankcal.html"], ["the aform show", "./aform.html"],
		["scoreboard", "./scoreboard.html"], ["passgen", "./passgen.html"], ["counter", "./counter.html"], ["hometown", "./hometown.html"],
	];
	const ACTIONS = [
		["invert colours", toggleTheme, "theme"],
		["linkedin", "https://www.linkedin.com/in/jassimalfonso/", "↗"],
		["github", "https://github.com/jassimalfonso", "↗"],
		["the aform show — listen", "https://linktr.ee/aformshow", "↗"],
		["back to top", () => scrollTo({ top: 0, behavior: "smooth" }), "action"],
	];
	const items = PAGES.map(([n, u]) => ({ n, u, tag: "page" }))
		.concat(ACTIONS.map(([n, a, tag]) => (typeof a === "string" ? { n, u: a, tag, ext: true } : { n, fn: a, tag })));
	const pal = document.createElement("div");
	pal.className = "pal";
	pal.hidden = true;
	pal.innerHTML = `<div class="pal-box" role="dialog" aria-modal="true" aria-label="Go to">
		<input type="text" placeholder="go to…" aria-label="Search pages and actions" autocomplete="off" spellcheck="false">
		<ul class="pal-list" role="listbox"></ul>
		<p class="pal-foot">↑ ↓ to move · enter to open · esc to close</p></div>`;
	document.body.appendChild(pal);
	const input = $("input", pal), list = $(".pal-list", pal);
	let sel = 0, shown = [], lastFocus = null;
	function draw() {
		const q = input.value.trim().toLowerCase();
		shown = items.filter((i) => !q || i.n.includes(q));
		sel = Math.min(sel, Math.max(0, shown.length - 1));
		list.innerHTML = shown.map((i, k) => `<li class="${k === sel ? "on" : ""}" role="option" aria-selected="${k === sel}">${
			i.u ? `<a href="${i.u}"${i.ext ? ' target="_blank" rel="noopener"' : ""}>${i.n}<span>${i.tag}</span></a>`
				: `<button type="button">${i.n}<span>${i.tag}</span></button>`}</li>`).join("") ||
			'<li><button type="button" disabled>nothing here. try “bank”.<span></span></button></li>';
		$$("li", list).forEach((li, k) => {
			li.addEventListener("pointermove", () => { if (sel !== k) { sel = k; draw(); } });
			const b = $("button", li);
			if (b && shown[k]) b.addEventListener("click", () => { close(); shown[k].fn(); });
		});
	}
	function open() { lastFocus = document.activeElement; pal.hidden = false; input.value = ""; sel = 0; draw(); input.focus(); }
	function close() { pal.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
	window.jaPalette = open;
	$$("[data-palette]").forEach((b) => b.addEventListener("click", open));
	pal.addEventListener("click", (e) => { if (e.target === pal) close(); });
	input.addEventListener("input", () => { sel = 0; draw(); });
	pal.addEventListener("keydown", (e) => {
		if (e.key === "Escape") { e.preventDefault(); close(); }
		if (!shown.length) return;
		if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % shown.length; draw(); }
		if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + shown.length) % shown.length; draw(); }
		if (e.key === "Enter") {
			e.preventDefault();
			const it = shown[sel];
			if (it.fn) { close(); it.fn(); } else { $$("li", list)[sel].querySelector("a").click(); close(); }
		}
	});

	/* ---------- global keys ---------- */
	document.addEventListener("keydown", (e) => {
		if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); pal.hidden ? open() : close(); return; }
		if (typing(e) || !pal.hidden || e.metaKey || e.ctrlKey || e.altKey) return;
		if (e.key === "/") { e.preventDefault(); open(); }
		const d = document.body.dataset;
		if (e.target.closest && e.target.closest(".demo")) return;
		if (e.key === "ArrowRight" && d.next) location.href = `./${d.next}.html`;
		if (e.key === "ArrowLeft" && d.prev) location.href = `./${d.prev}.html`;
	});
})();
