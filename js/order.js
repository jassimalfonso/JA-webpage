/* Applies projects.js to the page before anything else runs: order, numbers, featured. */
(() => {
	const cfg = window.JA_PROJECTS; if (!cfg || !Array.isArray(cfg.order)) return;
	const slugOf = (a) => (a.getAttribute("href") || "").split("/").pop().replace(".html", "");
	const pos = (s) => { const i = cfg.order.indexOf(s); return i < 0 ? 999 : i; };
	const no = (i) => String(i + 1).padStart(2, "0");
	const feat = (cfg.featured || []).filter((s) => cfg.order.includes(s)).sort((a, b) => pos(a) - pos(b));

	// ---- home: work list ----
	const list = document.querySelector(".work-list");
	if (list) {
		const rows = [...list.querySelectorAll("li.row")].map((li) => ({ li, s: slugOf(li.querySelector("a")) })).sort((a, b) => pos(a.s) - pos(b.s));
		// featured first, then the rest; numbers always follow the order list
		rows.sort((a, b) => (feat.includes(b.s) - feat.includes(a.s)) || (pos(a.s) - pos(b.s)));
		rows.forEach(({ li, s }) => {
			list.appendChild(li);
			li.querySelector(".row-no").textContent = no(Math.min(pos(s), rows.length - 1));
			const on = feat.includes(s), flag = li.querySelector(".flag"), desc = li.querySelector(".row-desc");
			li.classList.toggle("row--feature", on);
			if (on && !flag) desc.insertAdjacentHTML("beforeend", ' <b class="flag mono">featured</b>');
			if (!on && flag) flag.remove();
		});
		// ---- home: featured cards, built from the rows ----
		const row = document.querySelector(".feat-row");
		if (row) {
			row.innerHTML = feat.map((s) => {
				const li = rows.find((r) => r.s === s).li, q = (c) => li.querySelector(c);
				const line = q(".row-desc").cloneNode(true); line.querySelector(".flag")?.remove();
				return `<a class="feat-card" href="./${s}.html"><span class="feat-img"><img src="${li.dataset.img || q(".row-thumb")?.getAttribute("src") || ""}" alt="" width="640" height="400"></span>
					<span class="feat-meta mono"><span>${no(pos(s))}</span><span>${q(".row-tags").textContent}</span></span>
					<span class="feat-name">${q(".row-title").textContent}</span><span class="feat-line">${line.textContent.trim()}</span><span class="feat-go mono">open the case →</span></a>`;
			}).join("");
			row.style.setProperty("--n", Math.min(4, Math.max(1, feat.length)));
			const c = document.querySelector(".feat-count"); if (c) c.textContent = "01 / " + no(feat.length - 1);
			if (!feat.length) row.closest(".feat").hidden = true;
		}
	}

	// ---- case pages: number, previous / next, the list of cases ----
	if (document.body.classList.contains("case")) {
		const here = location.pathname.split("/").pop().replace(".html", "") , i = pos(here), n = cfg.order.length;
		if (i > 900) return;
		const k = document.querySelector(".case-kicker"); if (k) k.textContent = k.textContent.replace(/challenge \d+/, "challenge " + no(i));
		const ol = document.querySelector(".case-list"), names = {};
		if (ol) {
			[...ol.children].map((li) => ({ li, s: slugOf(li.querySelector("a")) })).sort((a, b) => pos(a.s) - pos(b.s)).forEach(({ li, s }, j) => {
				ol.appendChild(li); li.querySelector(".cl-no").textContent = no(j); names[s] = li.querySelector(".cl-name").textContent;
			});
		}
		const set = (sel, s) => { const a = document.querySelector(sel); if (a && names[s]) { a.href = `./${s}.html`; a.querySelector("b").textContent = names[s]; } };
		set(".cn-prev", cfg.order[(i - 1 + n) % n]); set(".cn-next", cfg.order[(i + 1) % n]);
		// a way straight to the live demo from the top of the case
		const demo = document.querySelector("[data-demo]"), links = document.querySelector(".case-links");
		if (demo && links) {
			const a = document.createElement("a"); a.href = "#try"; a.textContent = "try it ↓"; a.className = "try-jump";
			a.addEventListener("click", (e) => { e.preventDefault(); (demo.closest("section") || demo).scrollIntoView({ behavior: "smooth", block: "start" }); });
			links.prepend(a, " ");
		}
	}
})();
