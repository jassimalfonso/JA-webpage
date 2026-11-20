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
				// a space inside an inline-block span collapses to nothing: keep spaces as plain text
				if (ch === " ") { frag.appendChild(document.createTextNode(" ")); return; }
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
		// crosshair + a small coordinate readout; over something clickable it becomes a target box with a label
		cur.innerHTML = '<i class="ch-x"></i><i class="ch-y"></i><i class="ch-box"></i><b class="ch-read"></b>';
		document.body.appendChild(cur);
		document.body.classList.add("has-cur");
		const read = cur.querySelector(".ch-read");
		const coords = $$("[data-coords]");
		const pad = (n) => String(Math.max(0, Math.round(n))).padStart(4, "0");
		let x = -100, y = -100, queued = false;
		// locked 1:1 to the mouse — no easing, no trail. Drawn once per frame at most.
		const draw = () => {
			queued = false;
			cur.style.transform = `translate3d(${x}px,${y}px,0)`;
			const xy = `x ${pad(x)} · y ${pad(y + scrollY)}`;
			coords.forEach((c) => (c.textContent = xy)); // the numbers live in the masthead, not on the pointer
		};
		window.addEventListener("pointermove", (e) => {
			x = e.clientX; y = e.clientY;
			if (!queued) { queued = true; requestAnimationFrame(draw); }
		}, { passive: true });
		document.addEventListener("pointerover", (e) => {
			const t = e.target.closest("a, button, input, label, [data-cursor], .ikon");
			cur.classList.toggle("is-big", !!t);
			read.textContent = t?.dataset.cursor || ""; // a word only when it helps: open, listen, copy…
		});
		document.addEventListener("pointerdown", () => cur.classList.add("is-down"));
		document.addEventListener("pointerup", () => cur.classList.remove("is-down"));
		document.addEventListener("pointerleave", () => { x = -100; y = -100; draw(); });
	}

	/* ---------- hero figure: the mark as an assembly ---------- */
	const xv = $(".xv");
	if (xv) {
		const read = $("[data-xv-read]", xv);
		let t = 0, target = 0;
		const GAP = 42; // drawing units the wedge travels
		const ease = (k) => 1 - Math.pow(1 - k, 3);
		function frame() {
			t += (target - t) * (reduce ? 1 : 0.09);
			if (Math.abs(target - t) < 0.002) t = target;
			const e = ease(t);
			xv.style.setProperty("--t", e.toFixed(4));
			// solid only in the last few percent: the "click" when parts seat
			xv.style.setProperty("--fill", Math.max(0, (e - 0.94) / 0.06).toFixed(3));
			read.textContent = e > 0.995 ? "assembled ✓" : `gap ${(GAP * (1 - e)).toFixed(1)} mm`;
			if (t !== target) requestAnimationFrame(frame);
		}
		const go = (v) => { const was = target; target = v; if (was === t || Math.abs(v - t) > 0.002) requestAnimationFrame(frame); };
		frame();
		// assemble once on load; after that, scrolling away from the hero takes it apart, coming back puts it together
		let ready = false;
		setTimeout(() => { ready = true; go(scrollPart()); }, reduce ? 0 : 900);
		const hero = xv.closest(".hero");
		const scrollPart = () => 1 - Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * 0.55)));
		window.addEventListener("scroll", () => { if (ready) go(scrollPart()); }, { passive: true });
		// click / tap: replay the assembly
		$(".xv-hit", xv).addEventListener("click", () => { go(0); setTimeout(() => go(scrollPart()), 750); });
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
		// the phone's status bar follows the look too
		const tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.content = t === "paper" ? "#ecebe6" : "#0d0d0c";
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

	/* ---------- nav: always there; turns solid once you scroll off the hero ---------- */
	{
		const update = () => document.body.classList.toggle("nav-solid", scrollY > 60);
		window.addEventListener("scroll", update, { passive: true });
		update();
	}

	/* ---------- silent looping clips: play only while on screen ---------- */
	$$("video[data-loop]").forEach((v) => {
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) { v.controls = true; return; }
		new IntersectionObserver((ents) => { ents[0].isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.25 }).observe(v);
	});

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

	/* ---------- the cases, in order (also feeds the index menu) ---------- */
	const CASES = [
		["ikonplan", "ikonplan"], ["aform", "aform show"], ["thepanel", "the panel."], ["showroom", "the showroom"], ["bankcal", "bankcal"],
		["scoreboard", "scoreboard"], ["passgen", "passgen"], ["counter", "counter"], ["hometown", "hometown"],
	];
	const SECTIONS = []; // this page's sections, for the case bar and the index

	/* ---------- case bar: previous · where you are · next ---------- */
	if (document.body.classList.contains("case")) {
		const here = location.pathname.split("/").pop().replace(".html", "");
		const i = CASES.findIndex(([s]) => s === here);
		$$("main .section").forEach((s) => {
			const h = $(".section-head h2", s);
			if (!h) return;
			const name = (h.dataset.text || h.textContent).trim();
			s.id = s.id || name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
			SECTIONS.push([name, s]);
		});
		if (i >= 0) {
			const [ps, pn] = CASES[(i - 1 + CASES.length) % CASES.length], [ns, nn] = CASES[(i + 1) % CASES.length];
			const bar = document.createElement("nav");
			bar.className = "casebar mono";
			bar.setAttribute("aria-label", "Case studies");
			bar.innerHTML = `
				<a class="cb-side" href="./${ps}.html" rel="prev"><span aria-hidden="true">←</span><span class="cb-name">${pn}</span></a>
				<button type="button" class="cb-mid" data-palette aria-haspopup="dialog" aria-label="Open the index: sections and all cases">
					<span class="cb-count">${String(i + 1).padStart(2, "0")} / ${String(CASES.length).padStart(2, "0")}</span>
					<span class="cb-sec">§ <b>${SECTIONS[0] ? SECTIONS[0][0].toLowerCase() : ""}</b></span>
				</button>
				<a class="cb-side cb-next" href="./${ns}.html" rel="next"><span class="cb-name">${nn}</span><span aria-hidden="true">→</span></a>`;
			document.body.appendChild(bar);
			const sec = $(".cb-sec b", bar);
			const io2 = new IntersectionObserver((ents) => ents.forEach((en) => {
				if (en.isIntersecting) { const f = SECTIONS.find(([, s]) => s === en.target); if (f) sec.textContent = f[0].toLowerCase(); }
			}), { rootMargin: "-40% 0px -55% 0px" });
			SECTIONS.forEach(([, s]) => io2.observe(s));
			// show it once you're past the intro; step aside for the footer
			const hero = $(".hero"), foot = $(".footer");
			let pastHero = false, atFoot = false;
			const sync = () => bar.classList.toggle("is-on", pastHero && !atFoot);
			new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; sync(); }, { rootMargin: "-30% 0px 0px 0px" }).observe(hero);
			new IntersectionObserver(([e]) => { atFoot = e.isIntersecting; sync(); }).observe(foot);
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
		["home", "./index.html"], ["ikonplan", "./ikonplan.html"], ["the aform show", "./aform.html"], ["the panel. — crestron ch5", "./thepanel.html"], ["the showroom — sketch → gui", "./showroom.html"], ["bankcal", "./bankcal.html"],
		["scoreboard", "./scoreboard.html"], ["passgen", "./passgen.html"], ["counter", "./counter.html"], ["hometown", "./hometown.html"],
	];
	const ACTIONS = [
		["contact — say hi", () => (location.href = "./index.html#contact"), "page"],
		["invert colours", toggleTheme, "theme"],
		["linkedin", "https://www.linkedin.com/in/jassimalfonso/", "↗"],
		["github", "https://github.com/jassimalfonso", "↗"],
		["the aform show — listen", "https://linktr.ee/aformshow", "↗"],
		["back to top", () => scrollTo({ top: 0, behavior: "smooth" }), "action"],
	];
	// this page's sections first (jump within the page), then every page, then actions
	const here = "./" + (location.pathname.split("/").pop() || "index.html");
	const items = SECTIONS.map(([n, s]) => ({ n: "§ " + n.toLowerCase(), fn: () => s.scrollIntoView({ behavior: "smooth" }), tag: "this page" }))
		.concat(PAGES.map(([n, u]) => ({ n, u, tag: u === here ? "you're here" : "page" })))
		.concat(ACTIONS.map(([n, a, tag]) => (typeof a === "string" ? { n, u: a, tag, ext: true } : { n, fn: a, tag })));
	const pal = document.createElement("div");
	pal.className = "pal";
	pal.hidden = true;
	pal.innerHTML = `<div class="pal-box" role="dialog" aria-modal="true" aria-label="Index">
		<div class="pal-head"><input type="text" placeholder="index — type to filter…" aria-label="Filter pages, sections and actions" autocomplete="off" spellcheck="false"><button type="button" class="pal-x" aria-label="Close the index">✕</button></div>
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
	const touch = matchMedia("(pointer: coarse)").matches;
	function open() {
		lastFocus = document.activeElement; pal.hidden = false; input.value = ""; sel = 0; draw();
		document.body.style.overflow = "hidden";
		// on a phone, don't pop the keyboard over the list — focus the list; typing is still one tap away
		if (touch) $(".pal-x", pal).focus(); else input.focus();
	}
	function close() { pal.hidden = true; document.body.style.overflow = ""; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
	window.jaPalette = open;
	$$("[data-palette]").forEach((b) => b.addEventListener("click", open));
	pal.addEventListener("click", (e) => { if (e.target === pal || e.target.closest(".pal-x")) close(); });
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
