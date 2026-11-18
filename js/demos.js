/* =========================================================
   JA — interactive demos
   Each case study has <div class="demo" data-demo="name">.
   Every demo is a small rebuild of the real thing, in this site's style.
   ========================================================= */
(() => {
	const $ = (s, r = document) => r.querySelector(s);
	const $$ = (s, r = document) => [...r.querySelectorAll(s)];
	const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
	const fmt = (n) => Math.round(n).toLocaleString("en-US");
	const flash = (el) => { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); };

	function tween(el, from, to, dur = 500, f = fmt) {
		const start = performance.now();
		(function frame(now) {
			const t = Math.min(1, (now - start) / dur);
			el.textContent = f(from + (to - from) * (1 - Math.pow(1 - t, 3)));
			if (t < 1) requestAnimationFrame(frame);
		})(start);
	}

	const demos = {};

	/* =====================================================
	   IKONPLAN — click the plan to place devices; the BoQ keeps up
	   ===================================================== */
	demos.planner = (root) => {
		const ROOMS = [
			{ id: "majlis", name: "Majlis", x: 10, y: 10, w: 280, h: 170 },
			{ id: "living", name: "Living", x: 290, y: 10, w: 300, h: 170 },
			{ id: "kitchen", name: "Kitchen", x: 10, y: 180, w: 200, h: 190 },
			{ id: "master", name: "Master Bed", x: 210, y: 180, w: 380, h: 190 },
		];
		const DEV = [
			{ id: "kp", name: "Keypad", s: "K" },
			{ id: "sp", name: "Speaker", s: "S" },
			{ id: "ms", name: "Motion sensor", s: "M" },
			{ id: "th", name: "Thermostat", s: "T" },
			{ id: "tp", name: "Touch panel", s: "P" },
		];
		let pick = "kp", placed = [], uid = 0;

		root.innerHTML = `
			<div class="pl-tools mono" role="toolbar" aria-label="Devices">
				${DEV.map((d) => `<button data-dev="${d.id}" class="${d.id === pick ? "on" : ""}"><b>${d.s}</b>${d.name}</button>`).join("")}
			</div>
			<div class="pl-grid">
				<svg class="pl-plan" viewBox="0 0 600 380" role="img" aria-label="Sample floor plan. Click to place the chosen device; click a device to remove it.">
					<g class="pl-rooms">${ROOMS.map((r) => `
						<rect class="pl-room" data-room="${r.id}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>
						<text class="pl-label" x="${r.x + 12}" y="${r.y + 22}">${r.name.toUpperCase()}</text>`).join("")}
					</g>
					<g class="pl-ikons"></g>
				</svg>
				<aside class="pl-boq">
					<p class="mono pl-cap">bill of quantities <span>live</span></p>
					<table class="pl-table mono"><tbody></tbody></table>
					<p class="mono pl-cap">by room</p>
					<ul class="pl-rooms-list mono"></ul>
				</aside>
			</div>
			<div class="pl-actions mono">
				<button data-act="recipe">✦ apply room recipe</button>
				<button data-act="clear">clear</button>
				<span class="pl-hint">click the plan to place · click a device to remove it</span>
			</div>`;

		const svg = $(".pl-plan", root), layer = $(".pl-ikons", svg);
		const roomAt = (x, y) => ROOMS.find((r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h);

		function add(dev, x, y, delay = 0) {
			const room = roomAt(x, y);
			if (!room) return;
			const d = DEV.find((v) => v.id === dev);
			const p = { id: ++uid, dev, x, y, room: room.id };
			placed.push(p);
			const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
			g.setAttribute("class", "ikon");
			g.setAttribute("transform", `translate(${x} ${y})`);
			g.dataset.id = p.id;
			g.dataset.cursor = "remove";
			g.innerHTML = `<g class="ikon-in" style="animation-delay:${delay}ms"><rect x="-12" y="-12" width="24" height="24"/><text y="5">${d.s}</text></g>`;
			layer.appendChild(g);
			render();
		}

		function render() {
			const tb = $(".pl-table tbody", root);
			const count = (fn) => placed.filter(fn).length;
			tb.innerHTML = DEV.map((d) => `<tr data-row="${d.id}"><td>${d.s}</td><td>${d.name}</td><td>${count((p) => p.dev === d.id)}</td></tr>`).join("") +
				`<tr class="pl-total"><td></td><td>total</td><td>${placed.length}</td></tr>`;
			$(".pl-rooms-list", root).innerHTML = ROOMS.map((r) => `<li><span>${r.name}</span><b>${count((p) => p.room === r.id)}</b></li>`).join("");
		}

		svg.addEventListener("click", (e) => {
			const ik = e.target.closest(".ikon");
			if (ik) {
				placed = placed.filter((p) => p.id !== +ik.dataset.id);
				ik.classList.add("out");
				setTimeout(() => ik.remove(), 200);
				render();
				return;
			}
			const pt = svg.createSVGPoint();
			pt.x = e.clientX; pt.y = e.clientY;
			const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse());
			add(pick, Math.round(x), Math.round(y));
			const row = $(`[data-row="${pick}"]`, root);
			if (row) flash(row);
		});

		$(".pl-tools", root).addEventListener("click", (e) => {
			const b = e.target.closest("button");
			if (!b) return;
			pick = b.dataset.dev;
			$$(".pl-tools button", root).forEach((x) => x.classList.toggle("on", x === b));
		});

		$(".pl-actions", root).addEventListener("click", (e) => {
			const act = e.target.closest("button")?.dataset.act;
			if (act === "clear") { placed = []; layer.innerHTML = ""; render(); }
			if (act === "recipe") {
				placed = []; layer.innerHTML = "";
				let n = 0;
				ROOMS.forEach((r) => {
					const at = (fx, fy) => [Math.round(r.x + r.w * fx), Math.round(r.y + r.h * fy)];
					[["kp", ...at(0.1, 0.82)], ["sp", ...at(0.35, 0.5)], ["sp", ...at(0.65, 0.5)], ["ms", ...at(0.5, 0.18)], ["th", ...at(0.9, 0.82)]]
						.forEach(([d, x, y]) => add(d, x, y, n++ * 45));
					if (r.w > 290) add("tp", ...at(0.9, 0.18), n++ * 45);
				});
			}
		});
		render();
	};

	/* =====================================================
	   BANKCAL — the real budget maths, and a balance you spend
	   ===================================================== */
	demos.bankcal = (root) => {
		const GOALS = { maintain: 0, lose025: 275, lose05: 550 };
		const FLOOR = { m: 1500, f: 1200 };
		const MEALS = [
			["Karak + paratha", 350], ["Chicken machboos", 750], ["Shawarma", 520],
			["Turon", 220], ["Apple", 80], ["Iced latte", 190],
		];
		const st = { sex: "m", age: 32, height: 173, weight: 83, goal: "lose025", log: [] };

		root.innerHTML = `
			<div class="bc-grid">
				<form class="bc-form mono" onsubmit="return false">
					<p class="pl-cap">1 / open an account</p>
					<div class="bc-seg" role="radiogroup" aria-label="Sex">
						<button type="button" data-sex="m" class="on">male</button><button type="button" data-sex="f">female</button>
					</div>
					<label>age <output data-o="age"></output><input type="range" name="age" min="18" max="70" value="${st.age}"></label>
					<label>height <output data-o="height"></output> cm<input type="range" name="height" min="145" max="200" value="${st.height}"></label>
					<label>weight <output data-o="weight"></output> kg<input type="range" name="weight" min="45" max="140" value="${st.weight}"></label>
					<div class="bc-seg" role="radiogroup" aria-label="Goal">
						<button type="button" data-goal="maintain">maintain</button><button type="button" data-goal="lose025" class="on">−0.25 kg/wk</button><button type="button" data-goal="lose05">−0.5 kg/wk</button>
					</div>
					<dl class="bc-math">
						<div><dt>bmr</dt><dd data-v="bmr">0</dd></div>
						<div><dt>× 1.2 daily life</dt><dd data-v="tdee">0</dd></div>
						<div><dt>− goal</dt><dd data-v="def">0</dd></div>
					</dl>
				</form>
				<div class="bc-right">
					<p class="pl-cap mono">2 / spend it</p>
					<div class="bc-card">
						<span class="mono bc-card-top">today's balance</span>
						<span class="bc-bal"><b data-v="bal">0</b> <small>kcal</small></span>
						<span class="mono bc-card-foot"><span>bankcal</span><span class="bc-state">in credit</span></span>
					</div>
					<div class="bc-chips mono">
						${MEALS.map(([n, k]) => `<button data-meal="${n}" data-k="${k}">${n} <i>−${k}</i></button>`).join("")}
						<button class="dep" data-meal="30 min walk" data-k="-150">30 min walk <i>+150</i></button>
					</div>
					<ol class="bc-receipt mono" aria-live="polite"></ol>
					<div class="bc-foot mono">
						<button data-act="close">close the day →</button>
						<button data-act="reset">reset</button>
					</div>
					<p class="bc-statement mono" hidden></p>
				</div>
			</div>`;

		const v = (k) => $(`[data-v="${k}"]`, root);
		let lastBal = 0;
		const budget = () => {
			const bmr = 10 * st.weight + 6.25 * st.height - 5 * st.age + (st.sex === "m" ? 5 : -161);
			const tdee = bmr * 1.2;
			const auto = Math.max(FLOOR[st.sex], Math.round((tdee - GOALS[st.goal]) / 10) * 10);
			return { bmr, tdee, def: GOALS[st.goal], auto };
		};
		function render() {
			["age", "height", "weight"].forEach((k) => ($(`[data-o="${k}"]`, root).textContent = st[k]));
			const b = budget();
			v("bmr").textContent = fmt(b.bmr);
			v("tdee").textContent = fmt(b.tdee);
			v("def").textContent = fmt(b.def);
			const spent = st.log.reduce((s, x) => s + x.k, 0);
			const bal = b.auto - spent;
			tween(v("bal"), lastBal, bal, 450);
			lastBal = bal;
			const card = $(".bc-card", root);
			card.classList.toggle("is-over", bal < 0);
			$(".bc-state", root).textContent = bal < 0 ? "overdrawn" : "in credit";
			$(".bc-receipt", root).innerHTML = [`<li><span>opening budget</span><b>+${fmt(b.auto)}</b></li>`]
				.concat(st.log.map((x) => `<li class="new"><span>${x.n}</span><b>${x.k > 0 ? "−" : "+"}${fmt(Math.abs(x.k))}</b></li>`)).join("");
		}

		$(".bc-form", root).addEventListener("input", (e) => { if (e.target.name) { st[e.target.name] = +e.target.value; render(); } });
		root.addEventListener("click", (e) => {
			const b = e.target.closest("button");
			if (!b) return;
			if (b.dataset.sex || b.dataset.goal) {
				const key = b.dataset.sex ? "sex" : "goal";
				st[key] = b.dataset[key];
				$$("button", b.parentElement).forEach((x) => x.classList.toggle("on", x === b));
			}
			if (b.dataset.meal) { st.log.push({ n: b.dataset.meal, k: +b.dataset.k }); flash(b); $(".bc-statement", root).hidden = true; }
			if (b.dataset.act === "reset") { st.log = []; $(".bc-statement", root).hidden = true; }
			if (b.dataset.act === "close") {
				const left = budget().auto - st.log.reduce((s, x) => s + x.k, 0);
				const p = $(".bc-statement", root);
				p.hidden = false;
				p.innerHTML = left >= 0
					? `statement: <b>saved ${fmt(left)} kcal</b> ≈ ${fmt(left / 7.7)} g of body fat. nice.`
					: `statement: <b>overspent ${fmt(-left)} kcal</b>. tomorrow's a new balance.`;
				flash(p);
			}
			render();
		});
		render();
	};

	/* =====================================================
	   SCOREBOARD — one handler for every button
	   ===================================================== */
	demos.scoreboard = (root) => {
		const score = { home: 0, away: 0 };
		const plays = [];
		root.innerHTML = `
			<div class="sb">
				${["home", "away"].map((t) => `
				<div class="sb-team" data-team="${t}">
					<span class="mono sb-name">${t}</span>
					<output class="sb-score" data-score="${t}">0</output>
					<div class="sb-btns mono">${[1, 2, 3].map((n) => `<button data-team="${t}" data-pts="${n}">+${n}</button>`).join("")}</div>
				</div>`).join("")}
			</div>
			<div class="pl-actions mono">
				<button data-act="undo">↶ undo</button>
				<button data-act="new">new game</button>
				<span class="sb-log pl-hint"></span>
			</div>`;
		function render() {
			["home", "away"].forEach((t) => ($(`[data-score="${t}"]`, root).textContent = score[t]));
			const lead = score.home === score.away ? null : score.home > score.away ? "home" : "away";
			$$(".sb-team", root).forEach((el) => el.classList.toggle("is-lead", el.dataset.team === lead));
			$(".sb-log", root).textContent = plays.slice(-4).map((p) => `${p.team} +${p.pts}`).join(" · ") || "tap a button to score";
		}
		root.addEventListener("click", (e) => {
			const b = e.target.closest("button");
			if (!b) return;
			if (b.dataset.pts) {
				score[b.dataset.team] += +b.dataset.pts;
				plays.push({ team: b.dataset.team, pts: +b.dataset.pts });
				flash($(`[data-score="${b.dataset.team}"]`, root));
			}
			if (b.dataset.act === "undo" && plays.length) { const p = plays.pop(); score[p.team] -= p.pts; }
			if (b.dataset.act === "new") { score.home = score.away = 0; plays.length = 0; }
			render();
		});
		render();
	};

	/* =====================================================
	   PASSGEN — crypto randomness, length, options, copy
	   ===================================================== */
	demos.passgen = (root) => {
		const SETS = { lower: "abcdefghijklmnopqrstuvwxyz", upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", num: "0123456789", sym: "~!@#$%^&*()_-+={[}]|:;<>.?/" };
		const st = { len: 16, num: true, sym: true };
		root.innerHTML = `
			<div class="pg">
				<button class="pg-out mono" data-i="0" data-cursor="copy" aria-label="Copy password"></button>
				<button class="pg-out mono" data-i="1" data-cursor="copy" aria-label="Copy password"></button>
				<div class="pg-meter"><span></span></div>
				<p class="mono pg-bits"></p>
			</div>
			<div class="pg-ctrl mono">
				<label>length <output>${st.len}</output><input type="range" min="8" max="32" value="${st.len}"></label>
				<label class="tick"><input type="checkbox" data-opt="num" checked> numbers</label>
				<label class="tick"><input type="checkbox" data-opt="sym" checked> symbols</label>
				<button class="pg-go" data-act="go">generate</button>
			</div>`;
		const pool = () => SETS.lower + SETS.upper + (st.num ? SETS.num : "") + (st.sym ? SETS.sym : "");
		function make() {
			const p = pool(), buf = new Uint32Array(st.len);
			crypto.getRandomValues(buf);
			return [...buf].map((n) => p[n % p.length]).join("");
		}
		function generate() {
			$$(".pg-out", root).forEach((el) => {
				el.dataset.text = make();
				el.textContent = el.dataset.text;
				if (window.jaScramble) window.jaScramble(el, 420);
			});
			const bits = Math.round(st.len * Math.log2(pool().length));
			const label = bits < 60 ? "weak" : bits < 80 ? "ok" : bits < 110 ? "strong" : "ridiculous";
			$(".pg-meter span", root).style.width = Math.min(100, bits / 1.4) + "%";
			$(".pg-bits", root).textContent = `${bits} bits of entropy — ${label}`;
		}
		root.addEventListener("input", (e) => {
			if (e.target.type === "range") { st.len = +e.target.value; $("output", root).textContent = st.len; }
			if (e.target.dataset.opt) st[e.target.dataset.opt] = e.target.checked;
			generate();
		});
		root.addEventListener("click", async (e) => {
			const b = e.target.closest("button");
			if (!b) return;
			if (b.dataset.act === "go") generate();
			if (b.classList.contains("pg-out")) {
				try { await navigator.clipboard.writeText(b.dataset.text); } catch (_) {}
				b.classList.add("copied");
				setTimeout(() => b.classList.remove("copied"), 900);
			}
		});
		generate();
	};

	/* =====================================================
	   COUNTER — count people through the door, log each batch
	   ===================================================== */
	demos.counter = (root) => {
		let count = 0, log = [];
		root.innerHTML = `
			<div class="ct">
				<button class="ct-num" data-act="inc" data-cursor="+1" aria-label="Add one">0</button>
				<div class="ct-side mono">
					<button data-act="inc">+1 <i>space</i></button>
					<button data-act="save">save <i>enter</i></button>
					<button data-act="reset">reset</button>
					<p class="pl-cap">previous entries</p>
					<p class="ct-log">—</p>
					<p class="pl-cap">total through the door</p>
					<p class="ct-total">0</p>
				</div>
			</div>`;
		const num = $(".ct-num", root);
		function act(a) {
			if (a === "inc") { count++; flash(num); }
			if (a === "save" && count) { log.push(count); count = 0; }
			if (a === "reset") { count = 0; log = []; }
			num.textContent = count;
			$(".ct-log", root).textContent = log.length ? log.join(" — ") : "—";
			$(".ct-total", root).textContent = log.reduce((s, n) => s + n, 0);
		}
		root.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) act(b.dataset.act); });
		root.tabIndex = 0;
		root.addEventListener("keydown", (e) => {
			if (e.code === "Space") { e.preventDefault(); act("inc"); }
			if (e.code === "Enter") { e.preventDefault(); act("save"); }
		});
	};

	/* =====================================================
	   HOMETOWN — scroll the original page with your pointer
	   ===================================================== */
	demos.scrollframe = (root) => {
		const src = root.dataset.src;
		root.innerHTML = `
			<div class="sf">
				<div class="sf-bar mono"><i></i><i></i><i></i><span>${root.dataset.url || ""}</span></div>
				<div class="sf-view" data-cursor="scroll"><img src="${src}" alt="${root.dataset.alt || ""}"></div>
			</div>
			<p class="pl-hint mono">move your pointer up and down the page to scroll it</p>`;
		const view = $(".sf-view", root), img = $("img", root);
		let target = 0, y = 0, auto = !matchMedia("(hover: hover)").matches;
		view.addEventListener("pointermove", (e) => {
			const r = view.getBoundingClientRect();
			target = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
		});
		let t0 = performance.now();
		(function loop(now) {
			if (auto) target = (Math.sin((now - t0) / 2500) + 1) / 2;
			const max = Math.max(0, img.offsetHeight - view.clientHeight);
			y += (target * max - y) * 0.08;
			img.style.transform = `translateY(${-y}px)`;
			requestAnimationFrame(loop);
		})(t0);
	};

	/* =====================================================
	   THE AFORM SHOW — cut fillers, keep the voice, make the reel
	   f1 = um / uh (safe to cut) · f2 = "like", "you know" (judgement call)
	   hurt = a word an aggressive tool cuts that actually carried meaning
	   ===================================================== */
	demos.aform = (root) => {
		// A real reel from the show. Times are where each word starts and ends (s).
		// kind: w word · f filler (kept by ear, cut by a tool) · s stumble · h cut by a tool, but it carried meaning
		const WORDS = [[0.2,0.75,"Programs","w",0.8],[0.75,0.9,"here","w",0.92],[0.9,1.0,"are","w",0.48],[1.0,1.15,"quite","w",0.26],[1.15,1.25,"a","w",0.2],[1.25,1.85,"surprise,","w",0.55],[1.85,2.0,"you","f",0.47],[2.0,2.2,"know","f",0.33],[2.2,2.3,"when","w",0.52],[2.3,2.5,"you","w",0.4],[2.5,2.62,"get","w",0.11],[2.62,2.75,"off","w",0.42],[2.75,3.0,"the","w",0.16],[3.0,3.25,"plane","w",0.99],[3.25,3.38,"and","w",0.39],[3.38,3.5,"you","w",0.51],[3.5,3.8,"get","w",0.37],[3.8,4.0,"given","w",0.37],[4.0,4.25,"this","w",0.39],[4.25,4.6,"program.","w",0.64],[4.6,4.75,"It's","w",0.14],[4.75,5.0,"like","h",0.35],[5.0,5.5,"goodness,","h",0.41],[5.5,6.0,"that's","s",0.87],[6.0,6.25,"quite—","s",1.0],[6.25,6.5,"that's","w",0.7],[6.5,6.75,"quite,","w",0.6],[6.75,6.9,"you","f",0.42],[6.9,7.0,"know,","f",0.53],[7.0,7.25,"that's","w",0.44],[7.25,7.6,"quite","w",0.54],[7.6,7.75,"a","w",0.11],[7.75,8.0,"quick","w",0.55],[8.0,8.5,"program.","w",0.52],[8.5,9.1,"Yeah.","f",0.4],[9.1,9.25,"But","w",0.54],[9.25,9.5,"what","w",0.49],[9.5,9.85,"happens","w",0.48],[9.85,10.0,"maybe","w",0.51],[10.0,10.5,"halfway","w",0.37],[10.5,10.62,"through","w",0.79],[10.62,10.75,"that,","w",0.59],[10.75,11.0,"maybe","w",0.29],[11.0,11.15,"you","w",0.35],[11.15,11.25,"get","w",0.25],[11.25,11.5,"a","w",0.48],[11.5,12.0,"change","w",0.4],[12.0,12.5,"in","w",0.37],[12.5,13.1,"brief,","w",0.55],[13.2,13.5,"you","w",0.3],[13.5,14.0,"get","w",0.13],[14.0,14.25,"something","w",0.5],[14.25,14.75,"occurs","w",0.63],[14.75,15.0,"that","w",0.26],[15.0,15.25,"actually","w",0.32],[15.25,15.5,"delays","w",0.77],[15.5,15.75,"that","w",0.2],[15.75,16.35,"process.","w",0.17],[16.6,16.75,"And","w",0.38],[16.75,17.0,"I","w",0.76],[17.0,17.25,"think","w",0.28],[17.25,17.4,"at","w",0.38],[17.4,17.5,"the","w",0.23],[17.5,18.1,"outset,","w",0.47],[18.1,18.25,"if","w",0.1],[18.25,18.4,"you","w",0.38],[18.4,18.5,"could","w",0.34],[18.5,18.75,"have","w",0.32],[18.75,19.0,"somebody","w",0.47],[19.0,19.25,"saying","w",0.43],[19.25,19.5,"“Okay,","h",0.47],[19.5,19.62,"we're","w",0.68],[19.62,19.75,"gonna","w",0.74],[19.75,20.0,"give","w",0.47],[20.0,20.6,"you","w",0.25],[20.9,21.0,"x","w",0.49],[21.0,21.15,"amount","w",0.36],[21.15,21.25,"of","w",0.14],[21.25,21.5,"time,”","w",0.47],[21.5,21.75,"or","w",0.3],[21.75,21.9,"“How","w",0.57],[21.9,22.0,"much","w",0.21],[22.0,22.15,"time","w",0.36],[22.15,22.25,"do","w",0.63],[22.25,22.5,"you","w",0.31],[22.5,22.65,"think","w",0.22],[22.65,22.75,"you're","w",0.69],[22.75,23.0,"gonna","w",0.66],[23.0,23.5,"need?”","w",0.54],[23.5,23.75,"So","f",0.75],[23.75,24.25,"maybe,","w",0.7],[24.25,24.5,"you","f",0.72],[24.5,24.75,"know,","f",0.42],[24.75,25.0,"certainly","w",0.58],[25.0,25.07,"I","w",0.1],[25.07,25.15,"don't","w",0.31],[25.15,25.25,"think","w",0.5],[25.25,25.5,"you","w",0.52],[25.5,25.62,"guys","w",0.72],[25.62,25.75,"could","w",0.16],[25.75,26.25,"stomach","w",0.39],[26.25,26.75,"the","w",0.2],[26.75,27.25,"timescales","w",0.64],[27.25,27.4,"that","w",0.24],[27.4,27.5,"you","w",0.27],[27.5,28.0,"get","w",0.53],[28.0,28.25,"in","w",0.67],[28.25,28.5,"Europe","w",0.48],[28.5,28.75,"or","w",0.72],[28.75,29.1,"London.","w",0.39],[29.1,29.25,"But","w",0.33],[29.25,29.75,"maybe","w",0.64],[29.75,29.9,"another","w",0.52],[29.9,30.0,"sort","w",0.24],[30.0,30.25,"of","w",0.29],[30.25,30.6,"30%","w",0.5],[30.6,31.0,"on","w",0.45],[31.0,31.25,"your—","s",0.52],[31.25,31.85,"concept,","w",0.48],[32.0,32.25,"30%","w",0.32],[32.25,32.4,"on","w",0.42],[32.4,32.5,"your","w",0.57],[32.5,33.0,"SD—","w",0.57],[33.0,33.25,"might","w",0.66],[33.25,33.5,"help","w",0.23],[33.5,33.75,"set","w",0.47],[33.75,34.0,"things","w",0.57],[34.0,34.5,"up—","w",0.6],[34.5,34.75,"more","w",0.63],[34.75,34.9,"for","w",0.58],[34.9,35.0,"a","w",0.63],[35.0,35.25,"really","w",0.52],[35.25,35.75,"considered","w",0.4],[35.75,36.0,"DD,","w",0.58],[36.0,36.25,"and","w",0.35],[36.25,36.4,"a","w",0.17],[36.4,36.5,"bit","w",0.4],[36.5,36.75,"more","w",0.46],[36.75,37.0,"time","w",0.39],[37.0,37.1,"for","w",0.26],[37.1,37.25,"you","w",0.38],[37.25,37.5,"to","w",0.31],[37.5,37.75,"work","w",0.44],[37.75,38.0,"on","w",0.31],[38.0,38.3,"design.","w",0.45]].map(([a, b, t, k, lv]) => ({ a, b, t, k, lv }));
		const END = 38.3;
		const MODES = {
			raw: { label: "raw", cut: () => false, len: "38 s", noise: "hum + room", tone: "yes",
				note: "how it comes off the recorder on location: AC hum, a live room, the level sitting low. (the noise is simulated over the finished edit.)" },
			ear: { label: "by ear", cut: () => false, len: "38 s", noise: "clean", tone: "yes",
				note: "what went out: cleaned and levelled. the “you know”s and the restart stay — that's how he talks." },
			blunt: { label: "auto tool", cut: (w) => w.k !== "w", noise: "gated", tone: "no",
				note: "an auto tool strips every filler and stumble — and takes “like goodness” and the “okay” of a quote with them. shorter, choppy, and it stops sounding like him." },
		};
		let mode = "raw";

		root.innerHTML = `
			<div class="af-grid">
				<div>
					<div class="af-modes mono" role="radiogroup" aria-label="Edit">
						${Object.entries(MODES).map(([k, m]) => `<button type="button" data-mode="${k}" class="${k === mode ? "on" : ""}">${m.label}</button>`).join("")}
					</div>
					<div class="af-wave" aria-hidden="true">${WORDS.map((w) => `<i class="${w.k === "w" ? "" : "f"}" style="flex-grow:${(w.b - w.a).toFixed(2)};height:${(10 + w.lv * 90).toFixed(0)}%"></i>`).join("")}</div>
					<p class="af-text">${WORDS.map((w) => `<span class="${w.k === "w" ? "" : "f1"}">${w.t}</span>`).join(" ")}</p>
					<dl class="af-stats mono">
						<div><dt>length</dt><dd data-v="len"></dd></div>
						<div><dt>background</dt><dd data-v="noise"></dd></div>
						<div><dt>sounds like him</dt><dd data-v="tone"></dd></div>
					</dl>
					<p class="af-note mono pl-hint"></p>
				</div>
				<div>
					<div class="af-reel af-reel--video">
						<video playsinline preload="none" poster="./assets/aform/reel-poster.jpg" src="./assets/aform/reel.mp4" aria-label="A reel from The aForm Show"></video>
						<div class="af-reel-top mono"><span>reel</span><span data-v="t">0:00</span></div>
						<span class="af-bar"></span>
					</div>
					<button type="button" class="af-play mono">▶ play the reel, with sound</button>
				</div>
			</div>`;

		const spans = $$(".af-text span", root), bars = $$(".af-wave i", root);
		const video = $("video", root), btn = $(".af-play", root), bar = $(".af-bar", root), clock = $('[data-v="t"]', root);
		const cutLen = () => WORDS.filter((w) => MODES[mode].cut(w)).reduce((s, w) => s + (w.b - w.a), 0);
		function render() {
			WORDS.forEach((w, i) => {
				const c = !!MODES[mode].cut(w);
				spans[i].classList.toggle("cut", c && w.k !== "h");
				spans[i].classList.toggle("hurt", c && w.k === "h");
				bars[i].classList.toggle("cut", c);
			});
			$('[data-v="len"]', root).textContent = mode === "blunt" ? (END - cutLen()).toFixed(0) + " s" : MODES[mode].len;
			$('[data-v="noise"]', root).textContent = MODES[mode].noise;
			$('[data-v="tone"]', root).textContent = MODES[mode].tone;
			$(".af-note", root).textContent = MODES[mode].note;
			$$(".af-modes button", root).forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
			if (chain) chain.apply(mode);
		}

		// ---- sound: the reel's own audio, run through a chain that adds or strips the location ----
		let chain = null;
		function buildChain() {
			const AC = window.AudioContext || window.webkitAudioContext;
			if (!AC) return null;
			try {
				const ctx = new AC(), src = ctx.createMediaElementSource(video);
				const hp = ctx.createBiquadFilter(); hp.type = "highpass";
				const comp = ctx.createDynamicsCompressor();
				const dry = ctx.createGain(), wet = ctx.createGain(), verb = ctx.createConvolver(), out = ctx.createGain(), noise = ctx.createGain();
				const ir = ctx.createBuffer(2, ctx.sampleRate * 1.2, ctx.sampleRate);
				for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.4); }
				verb.buffer = ir;
				src.connect(hp).connect(comp); comp.connect(dry).connect(out); comp.connect(verb).connect(wet).connect(out);
				noise.connect(out); out.connect(ctx.destination);
				// the location: mains hum + harmonics, and an AC fan
				[50, 100, 150, 250].forEach((hz, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = hz; g.gain.value = [0.5, 0.35, 0.22, 0.08][i] * 0.05; o.connect(g).connect(noise); o.start(); });
				const nb = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), nd = nb.getChannelData(0);
				let last = 0; for (let i = 0; i < nd.length; i++) nd[i] = (last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02) * 3.5;
				const fan = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), fg = ctx.createGain();
				fan.buffer = nb; fan.loop = true; fl.type = "lowpass"; fl.frequency.value = 650; fg.gain.value = 0.09;
				fan.connect(fl).connect(fg).connect(noise); fan.start();
				const set = (p, v) => p.setTargetAtTime(v, ctx.currentTime, 0.08);
				const apply = (m) => {
					const raw = m === "raw", blunt = m === "blunt";
					set(hp.frequency, blunt ? 240 : 30);
					set(comp.threshold, blunt ? -46 : raw ? 0 : -20); set(comp.ratio, blunt ? 20 : raw ? 1 : 3);
					comp.attack.value = blunt ? 0.001 : 0.01; comp.release.value = blunt ? 0.04 : 0.2;
					set(dry.gain, raw ? 0.42 : blunt ? 1.5 : 1);
					set(wet.gain, raw ? 0.32 : 0);
					set(noise.gain, raw ? 1 : 0);
				};
				return { ctx, apply };
			} catch (_) { return null; } // e.g. the browser won't route this file through Web Audio: it just plays as-is
		}

		// ---- playback: transcript follows the voice; the tool's cuts are skipped for real ----
		let raf = 0;
		function tick() {
			const t = video.currentTime;
			if (MODES[mode].cut !== MODES.raw.cut) {
				const w = WORDS.find((x) => t >= x.a && t < x.b - 0.02 && MODES[mode].cut(x));
				if (w) { let j = WORDS.indexOf(w); while (WORDS[j + 1] && MODES[mode].cut(WORDS[j + 1])) j++; video.currentTime = WORDS[j].b; }
			}
			let k = -1; for (let i = 0; i < WORDS.length && WORDS[i].a <= t; i++) k = i;
			spans.forEach((s, i) => s.classList.toggle("is-now", i === k));
			bar.style.width = Math.min(100, (t / END) * 100) + "%";
			clock.textContent = "0:" + String(Math.floor(t)).padStart(2, "0");
			raf = requestAnimationFrame(tick);
		}
		function reset() {
			cancelAnimationFrame(raf); btn.textContent = "▶ play the reel, with sound";
			spans.forEach((s) => s.classList.remove("is-now"));
		}
		btn.addEventListener("click", () => {
			if (!video.paused) { video.pause(); return; }
			if (!chain) { chain = buildChain(); if (chain) chain.apply(mode); }
			if (chain && chain.ctx.state === "suspended") chain.ctx.resume();
			if (video.ended || video.currentTime >= END) video.currentTime = 0;
			video.play().catch(() => {});
		});
		video.addEventListener("play", () => { btn.textContent = "■ pause"; cancelAnimationFrame(raf); tick(); });
		video.addEventListener("pause", reset);
		video.addEventListener("ended", () => { reset(); bar.style.width = "0"; clock.textContent = "0:00"; });
		video.addEventListener("click", () => btn.click());
		// switching the edit while it plays changes the sound in place, so you can A/B by ear
		$(".af-modes", root).addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { mode = b.dataset.mode; render(); } });
		new IntersectionObserver((ents) => { if (!ents[0].isIntersecting && !video.paused) video.pause(); }).observe(root);
		render();
	};

	/* =====================================================
	   THE AFORM SHOW — three locations, one sound
	   Each clip is recorded somewhere different. Clean, then level.
	   ===================================================== */
	/* -----------------------------------------------------
	   Room audio engine (Web Audio, nothing downloaded).
	   A synthetic "voice" (buzz through vowel formants, in syllables)
	   is recorded into one of three rooms: echo, AC hum, wind + traffic.
	   The three processing steps change the chain live while it plays.
	   ----------------------------------------------------- */
	function roomAudio(voiceBytes) {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return null;
		const ctx = new AC();
		const master = ctx.createGain();
		master.gain.value = 0.5;
		const limiter = ctx.createDynamicsCompressor();
		limiter.threshold.value = -6; limiter.ratio.value = 12; limiter.attack.value = 0.003; limiter.release.value = 0.1;
		master.connect(limiter).connect(ctx.destination);

		const noiseBuf = (brown) => {
			const b = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), d = b.getChannelData(0);
			let last = 0;
			for (let i = 0; i < d.length; i++) {
				const w = Math.random() * 2 - 1;
				d[i] = brown ? (last = (last + 0.02 * w) / 1.02) * 3.5 : w;
			}
			return b;
		};
		const WHITE = noiseBuf(false), BROWN = noiseBuf(true);
		// a small room: 1.4 s of decaying noise as an impulse response
		const ir = ctx.createBuffer(2, ctx.sampleRate * 1.4, ctx.sampleRate);
		for (let c = 0; c < 2; c++) {
			const d = ir.getChannelData(c);
			for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.6);
		}
		const VOWELS = [[730, 1090, 2440], [530, 1840, 2480], [270, 2290, 3010], [570, 840, 2410], [300, 870, 2240], [640, 1190, 2390]];
		const loop = (buf) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; return s; };
		const ramp = (p, v, t = 0.25) => p.setTargetAtTime(v, ctx.currentTime, t / 3);
		let cur = null, REAL = null;
		const ready = (voiceBytes || Promise.reject()).then((b) => ctx.decodeAudioData(b.slice(0))).then((buf) => { REAL = buf; }).catch(() => {});

		function start(clip, state) {
			stop();
			const now = ctx.currentTime + 0.05, LEN = 7;
			const out = ctx.createGain(); out.connect(master);
			const level = ctx.createGain(); level.connect(out);
			// --- the voice: a real line from the show when it has loaded, a synthetic one until then ---
			let voice, voiceSrcs;
			if (REAL) {
				voice = ctx.createGain(); voice.gain.value = 1.6;
				const line = ctx.createBufferSource(); line.buffer = REAL; line.connect(voice);
				line.window = [13.15, LEN]; // "you get something occurs that actually delays that process…"
				voiceSrcs = [line];
			} else {
				const glottis = ctx.createOscillator(); glottis.type = "sawtooth";
				const voiced = ctx.createGain(); voiced.gain.value = 0;
				const f = VOWELS[0].map((hz, i) => { const b = ctx.createBiquadFilter(); b.type = "bandpass"; b.frequency.value = hz; b.Q.value = 9 - i * 2; return b; });
				const fg = [1, 0.5, 0.25].map((g) => { const n = ctx.createGain(); n.gain.value = g; return n; });
				const voice = ctx.createGain(); voice.gain.value = 3.2;
				f.forEach((b, i) => { glottis.connect(b); b.connect(fg[i]).connect(voiced); });
				voiced.connect(voice);
				const breath = loop(WHITE), hiss = ctx.createBiquadFilter(), cons = ctx.createGain();
				hiss.type = "highpass"; hiss.frequency.value = 3500; cons.gain.value = 0;
				breath.connect(hiss).connect(cons).connect(voice);
				// syllables: pitch drifts like speech, vowels change, words have gaps.
				// Seeded, so every room "says" the exact same sentence — only the room differs.
				let seed = 20261118;
				const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
				let t = now, pitch = 118;
				while (t < now + LEN) {
					const words = 2 + ((rand() * 4) | 0);
					for (let w = 0; w < words && t < now + LEN; w++) {
						const syl = 1 + ((rand() * 3) | 0);
						for (let s = 0; s < syl; s++) {
							const d = 0.12 + rand() * 0.14, v = VOWELS[(rand() * VOWELS.length) | 0];
							pitch = Math.min(150, Math.max(95, pitch + (rand() - 0.55) * 14));
							glottis.frequency.setTargetAtTime(pitch, t, 0.03);
							f.forEach((b, i) => b.frequency.setTargetAtTime(v[i], t, 0.025));
							if (rand() < 0.45) { cons.gain.setValueAtTime(0.25, t); cons.gain.setTargetAtTime(0, t + 0.02, 0.015); }
							voiced.gain.setTargetAtTime(1, t + 0.02, 0.02);
							voiced.gain.setTargetAtTime(0.15, t + d, 0.025);
							t += d + 0.03;
						}
						voiced.gain.setTargetAtTime(0, t, 0.03);
						t += 0.08 + rand() * 0.12;
					}
					t += 0.3 + rand() * 0.35; // end of a phrase
				}

				voiceSrcs = [glottis, breath];
			}
			// --- the room ---
			const dry = ctx.createGain(), wet = ctx.createGain(), verb = ctx.createConvolver();
			verb.buffer = ir;
			const lowcut = ctx.createBiquadFilter(); lowcut.type = "highpass"; lowcut.frequency.value = 20;
			voice.connect(lowcut); lowcut.connect(dry).connect(level); lowcut.connect(verb).connect(wet).connect(level);
			// --- the location's noise ---
			const noiseOut = ctx.createGain(); noiseOut.connect(level);
			const srcs = [...voiceSrcs];
			if (clip.hum) { // 50 Hz mains + harmonics, the AC unit's whine
				[50, 100, 150, 250].forEach((hz, i) => {
					const o = ctx.createOscillator(), g = ctx.createGain();
					o.frequency.value = hz; g.gain.value = [0.5, 0.35, 0.25, 0.08][i];
					o.connect(g).connect(noiseOut); srcs.push(o);
				});
				const fan = loop(BROWN), fl = ctx.createBiquadFilter(), fg2 = ctx.createGain();
				fl.type = "lowpass"; fl.frequency.value = 700; fg2.gain.value = 0.6;
				fan.connect(fl).connect(fg2).connect(noiseOut); srcs.push(fan);
			} else if (clip.echo) { // a quiet office: air handling
				const air = loop(BROWN), al = ctx.createBiquadFilter(), ag = ctx.createGain();
				al.type = "lowpass"; al.frequency.value = 500; ag.gain.value = 0.5;
				air.connect(al).connect(ag).connect(noiseOut); srcs.push(air);
			} else { // site: gusting wind + passing traffic
				const wind = loop(BROWN), wl = ctx.createBiquadFilter(), wg = ctx.createGain(), gust = ctx.createOscillator(), gd = ctx.createGain();
				wl.type = "lowpass"; wl.frequency.value = 380; wg.gain.value = 0.9;
				gust.frequency.value = 0.35; gd.gain.value = 0.7; gust.connect(gd).connect(wg.gain);
				wind.connect(wl).connect(wg).connect(noiseOut);
				const road = loop(WHITE), rl = ctx.createBiquadFilter(), rg = ctx.createGain(), pass = ctx.createOscillator(), pd = ctx.createGain();
				rl.type = "bandpass"; rl.frequency.value = 220; rl.Q.value = 0.7; rg.gain.value = 0.15;
				pass.frequency.value = 0.12; pd.gain.value = 0.14; pass.connect(pd).connect(rg.gain);
				road.connect(rl).connect(rg).connect(noiseOut);
				srcs.push(wind, gust, road, pass);
			}
			const dB = (x) => Math.pow(10, x / 20);
			const apply = (s, fast) => {
				const tc = fast ? 0.01 : 0.35;
				ramp(level.gain, dB((s.lv ? -16 : clip.lufs) + 16) * 0.9, tc);
				ramp(noiseOut.gain, s.nr ? dB(-62 - clip.lufs) * 4 : dB(clip.noise - clip.lufs) * 4, tc);
				ramp(lowcut.frequency, s.nr ? 90 : 20, tc);
				ramp(wet.gain, s.eq ? 0.04 : clip.echo ? 0.75 : 0.12, tc);
				ramp(dry.gain, s.eq ? 1 : clip.echo ? 0.6 : 0.95, tc);
			};
			apply(state, true);
			srcs.forEach((s) => (s.window ? s.start(now, s.window[0], s.window[1]) : s.start(now)));
			const end = setTimeout(() => cur && cur.onend && cur.onend(), (LEN + 0.6) * 1000);
			cur = { srcs, out, apply, end, onend: null };
			return cur;
		}
		function stop() {
			if (!cur) return;
			const c = cur; cur = null;
			clearTimeout(c.end);
			c.out.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
			setTimeout(() => { c.srcs.forEach((s) => { try { s.stop(); } catch (_) {} }); c.out.disconnect(); }, 200);
		}
		return { ctx, ready, start, stop, update: (s) => cur && cur.apply(s) };
	}

	demos.rooms = (root) => {
		const TARGET = -16; // LUFS — a common podcast loudness target
		const CLIPS = [
			{ name: "client office", issue: "echo", lufs: -23, noise: -50, echo: true },
			{ name: "majlis", issue: "ac hum", lufs: -14, noise: -36, hum: true },
			{ name: "site visit", issue: "wind + traffic", lufs: -19, noise: -30 },
		];
		const STEPS = [
			{ id: "nr", label: "clean noise", hint: "hum, wind, traffic down — voice untouched" },
			{ id: "eq", label: "tame the room", hint: "less echo, voices sit in the same space" },
			{ id: "lv", label: "level to −16", hint: "every location as loud as the next" },
		];
		const on = { nr: false, eq: false, lv: false };
		let voiceBytes = null;
		new IntersectionObserver((ents, o) => { if (ents[0].isIntersecting) { voiceBytes = fetch("./assets/aform/voice.m4a").then((r) => r.arrayBuffer()); o.disconnect(); } }, { rootMargin: "600px" }).observe(root);
		const N = 64;
		let seed = 7;
		const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
		// a speech pattern per clip: bursts of words with gaps
		CLIPS.forEach((c) => {
			c.bars = Array.from({ length: N }, (_, i) => {
				const speech = Math.sin(i / 3.1 + c.lufs) + rnd() * 0.9 > 0.35;
				return { speech, v: rnd(), tail: !speech && i > 0 };
			});
		});

		root.innerHTML = `
			<div class="rm-steps mono" role="group" aria-label="Processing">
				${STEPS.map((s, i) => `<button type="button" data-step="${s.id}" aria-pressed="false"><b>${i + 1}</b>${s.label}</button>`).join("")}
				<button type="button" data-step="reset" class="rm-reset">reset</button>
			</div>
			<div class="rm-rows">
				${CLIPS.map((c, k) => `
				<div class="rm-row" data-k="${k}">
					<button type="button" class="rm-play mono" data-play="${k}" aria-label="Play the ${c.name} recording" data-cursor="listen">▶</button>
					<div class="rm-label mono"><b>${c.name}</b><span>${c.issue}</span></div>
					<div class="rm-wave" aria-hidden="true">${c.bars.map(() => "<i></i>").join("")}</div>
					<div class="rm-read mono"><span data-r="lufs"></span><span data-r="noise"></span></div>
				</div>`).join("")}
			</div>
			<div class="rm-foot mono">
				<span>loudness spread between locations <b data-v="spread"></b></span>
				<span class="rm-verdict" data-v="verdict"></span>
			</div>
			<div class="rm-listen mono">
				<button type="button" class="rm-all" data-play="all">▶ play all three in a row</button>
				<span class="rm-sound">🔊 sound on — synthesised voice, not a real recording</span>
			</div>
			<p class="pl-hint mono rm-hint">recorded wherever the guest is. press the steps in any order.</p>`;

		const toH = (db) => Math.max(3, Math.min(100, ((db + 44) / 40) * 100)); // -44..-4 dB fills the bar
		function render() {
			const levels = [];
			CLIPS.forEach((c, k) => {
				const row = $(`.rm-row[data-k="${k}"]`, root);
				const lufs = on.lv ? TARGET : c.lufs;
				const noise = on.nr ? -62 : c.noise;
				levels.push(lufs);
				$$(".rm-wave i", row).forEach((bar, i) => {
					const b = c.bars[i];
					let db;
					if (b.speech) db = lufs + 6 - b.v * 12;
					else if (c.echo && !on.eq && c.bars[i - 1]?.speech) db = lufs - 4 - b.v * 6; // the room ringing after each word
					else db = noise + (c.hum && !on.nr ? 6 * Math.sin(i * 2.1) : 0) + b.v * 4;
					bar.style.height = toH(db) + "%";
					bar.classList.toggle("n", !b.speech);
				});
				$('[data-r="lufs"]', row).textContent = `${lufs} lufs`;
				$('[data-r="noise"]', row).textContent = `noise ${noise} db`;
				row.classList.toggle("is-ok", on.nr && on.eq && on.lv);
			});
			const spread = Math.max(...levels) - Math.min(...levels);
			$('[data-v="spread"]', root).textContent = spread + " db";
			const done = on.nr && on.eq && on.lv;
			$('[data-v="verdict"]', root).textContent = done ? "sounds like one show ✓" : spread > 1 ? "listener reaches for the volume" : "level, but still sounds like three rooms";
			$(".rm-foot", root).classList.toggle("is-ok", done);
			$$(".rm-steps [data-step]", root).forEach((b) => { if (on[b.dataset.step] !== undefined) b.setAttribute("aria-pressed", on[b.dataset.step]); });
			const last = STEPS.filter((s) => on[s.id]).pop();
			$(".rm-hint", root).textContent = last ? last.hint : "recorded wherever the guest is. press the steps in any order.";
		}
		$(".rm-steps", root).addEventListener("click", (e) => {
			const b = e.target.closest("button");
			if (!b) return;
			if (b.dataset.step === "reset") Object.keys(on).forEach((k) => (on[k] = false));
			else on[b.dataset.step] = !on[b.dataset.step];
			render();
			if (audio) audio.update(on); // you hear the step while it plays
		});

		/* --- sound --- */
		let audio = null, playing = null, seqTimer = null;
		function mark(k) {
			playing = k;
			$$(".rm-row", root).forEach((r) => r.classList.toggle("is-playing", +r.dataset.k === k));
			$$("[data-play]", root).forEach((b) => {
				const isAll = b.dataset.play === "all";
				const live = isAll ? seqTimer !== null : +b.dataset.play === k && seqTimer === null;
				b.textContent = isAll ? (live ? "■ stop" : "▶ play all three in a row") : live ? "■" : "▶";
			});
		}
		function stopAll() { clearTimeout(seqTimer); seqTimer = null; if (audio) audio.stop(); mark(null); }
		function play(k, inSeq) {
			if (!audio) { audio = roomAudio(voiceBytes); if (!audio) return; }
			if (audio.ctx.state === "suspended") audio.ctx.resume();
			mark(k);
			audio.ready.then(() => {
				if (playing !== k) return; // stopped while the voice was still loading
				const c = audio.start(CLIPS[k], on);
				c.onend = () => (inSeq ? null : stopAll());
			});
		}
		root.addEventListener("click", (e) => {
			const b = e.target.closest("[data-play]");
			if (!b) return;
			if (b.dataset.play === "all") {
				if (seqTimer !== null) return stopAll();
				let k = 0;
				seqTimer = 0;
				const next = () => {
					if (seqTimer === null) return;
					if (k >= CLIPS.length) return stopAll();
					play(k++, true);
					seqTimer = setTimeout(next, 3200); // 3 s of each room, back to back: hear the jumps
				};
				next();
				return;
			}
			const k = +b.dataset.play;
			if (playing === k && seqTimer === null) return stopAll();
			clearTimeout(seqTimer); seqTimer = null;
			play(k, false);
		});
		// stop when it scrolls out of sight
		new IntersectionObserver((ents) => { if (!ents[0].isIntersecting && playing !== null) stopAll(); }).observe(root);
		render();
	};

	/* =====================================================
	   THE PANEL — the real CH5 panel, live in a frame
	   Rendered at the panel's own size, then scaled to fit, so it looks
	   exactly as it would on the wall / iPad / phone.
	   ===================================================== */
	demos.panel = (root) => {
		const SRC = "./assets/the-panel/demo.html";
		const SIZES = {
			Landscape: { w: 1280, h: 800, label: "wall panel" },
			Portrait: { w: 820, h: 1180, label: "ipad" },
			Phone: { w: 390, h: 844, label: "phone" },
		};
		let layout = innerWidth < 700 ? "Phone" : "Landscape", tour = false, theme = ""; // phones open in the phone layout
		root.innerHTML = `
			<div class="qp-bar mono">
				<div class="qp-seg" role="group" aria-label="Screen">
					${Object.entries(SIZES).map(([k, s]) => `<button type="button" data-layout="${k}" aria-pressed="${k === layout}">${s.label}</button>`).join("")}
				</div>
				<div class="qp-seg" role="group" aria-label="Theme">
					${["", "Washi", "Stone", "Aizome"].map((t) => `<button type="button" data-theme="${t}" aria-pressed="${t === theme}">${t ? t.toLowerCase() : "default"}</button>`).join("")}
				</div>
				<button type="button" class="qp-tour" data-tour aria-pressed="false">▶ guided tour</button>
			</div>
			<div class="qp-stage"><div class="qp-device"><iframe title="The Panel — live Crestron CH5 demo" loading="lazy"></iframe></div></div>
			<p class="pl-hint mono qp-hint">tap anything. drag the floor plan to orbit, scroll or pinch to zoom.</p>`;
		const stage = $(".qp-stage", root), dev = $(".qp-device", root), frame = $("iframe", root);
		function url() {
			const q = new URLSearchParams();
			q.set("layout", layout);
			if (theme) q.set("theme", theme);
			if (tour) q.set("demo", "1");
			return `${SRC}?${q}`;
		}
		function fit() {
			const s = SIZES[layout];
			const maxW = stage.clientWidth, maxH = Math.min(innerHeight * 0.78, 760);
			const k = Math.min(maxW / s.w, maxH / s.h, 1);
			frame.style.width = s.w + "px";
			frame.style.height = s.h + "px";
			frame.style.transform = `scale(${k})`;
			dev.style.width = s.w * k + "px";
			dev.style.height = s.h * k + "px";
		}
		function load() { frame.src = url(); fit(); }
		root.addEventListener("click", (e) => {
			const b = e.target.closest("button");
			if (!b) return;
			if (b.dataset.layout) layout = b.dataset.layout;
			if (b.dataset.theme !== undefined) theme = b.dataset.theme;
			if (b.hasAttribute("data-tour")) tour = !tour;
			$$("[data-layout]", root).forEach((x) => x.setAttribute("aria-pressed", x.dataset.layout === layout));
			$$("[data-theme]", root).forEach((x) => x.setAttribute("aria-pressed", x.dataset.theme === theme));
			$("[data-tour]", root).setAttribute("aria-pressed", tour);
			$("[data-tour]", root).textContent = tour ? "■ stop tour" : "▶ guided tour";
			load();
		});
		new ResizeObserver(fit).observe(stage);
		// only load the panel when it scrolls into view
		new IntersectionObserver((ents, io) => {
			if (ents.some((e) => e.isIntersecting)) { load(); io.disconnect(); }
		}, { rootMargin: "300px" }).observe(stage);
		fit();
	};

	/* ---------- YouTube: a poster until pressed, then the real player ----------
	   Nothing loads from YouTube until a visitor asks for it (privacy-enhanced domain). */
	$$("[data-yt]").forEach((box) => {
		const id = (box.dataset.yt || "").trim();
		if (!id) return; // no video chosen yet: the card links to the channel
		const card = $(".yt-card", box);
		card.removeAttribute("target");
		card.href = `https://www.youtube.com/watch?v=${id}`;
		card.style.backgroundImage = `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`;
		card.classList.add("has-poster");
		$(".mono", card).textContent = "play here ▶ · or open on youtube ↗";
		card.addEventListener("click", (e) => {
			if (e.metaKey || e.ctrlKey) return; // let people open it on YouTube instead
			e.preventDefault();
			const f = document.createElement("iframe");
			f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
			f.title = "The aForm Show on YouTube";
			f.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
			f.allowFullscreen = true;
			box.replaceChildren(f);
		});
	});

	/* ---------- mount ---------- */
	$$("[data-demo]").forEach((el) => {
		const fn = demos[el.dataset.demo];
		const body = $(".demo-body", el) || el;
		if (fn) fn(body);
	});
})();
