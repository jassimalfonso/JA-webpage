/* ============================================================
   BACKGROUND SOUND — on by default; /sound turns it off (remembered).
   Browsers only allow sound after a tap or key press, so it starts on the first one.
   - Remembered between pages and visits; picks up where it left off.
   - Steps aside for any demo that makes sound: an unmuted <audio> or
     <video> playing, or a demo's own Web Audio sources running.
     It fades out, waits for quiet, then fades back in.
   - Pauses when the tab is hidden.
   Load before demos.js so demo sound is seen.
   ============================================================ */
(() => {
	const SRC = "./assets/sound/tokyo-night.m4a", LEN = 61.5384615, VOL = 0.24, KEY = "ja-sound", POS = "ja-sound-pos";
	const AC = window.AudioContext || window.webkitAudioContext;
	if (!AC) return;

	/* ---- watch demo sound ---- */
	const media = new Set(), ctxs = new Set();
	const busy = () => media.size > 0 || [...ctxs].some((c) => c.state === "running" && c.__ja > 0);
	const onMedia = (e) => {
		const el = e.target;
		if (!(el instanceof HTMLMediaElement)) return;
		if (!el.paused && !el.ended && !el.muted && el.volume > 0) media.add(el); else media.delete(el);
		check();
	};
	["play", "playing", "pause", "ended", "volumechange", "emptied"].forEach((t) => document.addEventListener(t, onMedia, true));
	const patch = (proto) => {
		if (!proto || Object.prototype.hasOwnProperty.call(proto, "__jaPatched")) return;
		const start = proto.start;
		proto.start = function (...a) {
			const c = this.context;
			if (c && !c.__jaSelf) {
				c.__ja = (c.__ja || 0) + 1;
				if (!ctxs.has(c)) { ctxs.add(c); c.addEventListener("statechange", check); }
				this.addEventListener("ended", () => { c.__ja--; check(); }, { once: true });
				check();
			}
			return start.apply(this, a);
		};
		Object.defineProperty(proto, "__jaPatched", { value: true });
	};
	// some browsers give each source type its own start(), so wrap every one that has it
	["AudioScheduledSourceNode", "AudioBufferSourceNode", "OscillatorNode", "ConstantSourceNode"].forEach((k) => {
		const P = window[k] && window[k].prototype;
		if (P && Object.prototype.hasOwnProperty.call(P, "start")) patch(P);
	});

	/* ---- the player ---- */
	let ctx, gain, buf, src, t0 = 0, on = false, loading;
	const store = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
	const pref = () => { try { return localStorage.getItem(KEY) !== "off"; } catch (e) { return true; } };
	const pos = () => (src && buf ? (ctx.currentTime - t0) % LEN : +(sessionStorage.getItem(POS) || 0));
	const ramp = (v, s) => { const t = ctx.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(v, t + s); };
	const load = () => loading || (loading = fetch(SRC).then((r) => r.arrayBuffer()).then((a) => new Promise((ok, no) => ctx.decodeAudioData(a, ok, no))).then((b) => (buf = b)));
	function ensure() {
		if (ctx) return;
		ctx = new AC(); ctx.__jaSelf = true;
		gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
	}
	function startLoop() {
		if (src || !buf) return;
		// skip the encoder's silent lead-in so the loop joins with no gap
		const d = buf.getChannelData(0); let lead = 0;
		while (lead < d.length && lead < buf.sampleRate * 0.1 && Math.abs(d[lead]) < 1e-4) lead++;
		const s0 = lead / buf.sampleRate, at = pos() % LEN || 0;
		src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.loopStart = s0; src.loopEnd = Math.min(buf.duration, s0 + LEN); src.connect(gain);
		src.start(0, s0 + at); t0 = ctx.currentTime - at;
	}
	let quietTimer, wanted = false;
	function check() {
		if (!ctx) return;
		const should = on && !busy() && !document.hidden;
		clearTimeout(quietTimer);
		if (should === wanted) return;
		if (should) quietTimer = setTimeout(() => { wanted = true; ctx.resume(); startLoop(); ramp(VOL, 1.8); paint(); }, 700);
		else { wanted = false; ramp(0, 0.35); paint(); setTimeout(() => { if (!wanted && ctx.state === "running" && src) ctx.suspend(); }, 450); }
	}
	function turn(v) {
		on = v; store(KEY, v ? null : "off");
		if (v) { ensure(); ctx.resume(); load().then(() => { startLoop(); check(); }).catch(() => { on = false; paint(); }); }
		check(); paint();
	}

	/* ---- the button: /sound in the nav ---- */
	let btn;
	function paint() {
		if (!btn) return;
		btn.setAttribute("aria-pressed", on ? "true" : "false");
		btn.classList.toggle("is-ducked", on && !wanted);
		btn.title = on ? (wanted ? "Background sound on — tap to turn off" : "Background sound waits while a demo plays") : "Turn on background sound";
		if (on && !ctx) btn.title = "Background sound starts when you tap — tap here to start it now";
	}
	function mount() {
		const links = document.querySelector(".nav-links"), theme = links && links.querySelector("[data-theme-toggle]");
		if (!links) return;
		const li = document.createElement("li");
		li.innerHTML = '<button type="button" class="snd" data-sound aria-pressed="false" aria-label="Background sound">/<span class="snd-t">sound</span><span class="snd-i" aria-hidden="true">♪</span><span class="snd-bars" aria-hidden="true"><i></i><i></i><i></i></span></button>';
		theme ? links.insertBefore(li, theme.closest("li")) : links.appendChild(li);
		btn = li.firstChild;
		btn.addEventListener("click", () => (on && !ctx ? turn(true) : turn(!on)));
		paint();
	}
	document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", mount) : mount();

	/* remembered "on": browsers need a tap or key first, so start on the first one */
	if (pref()) {
		on = true;
		const go = (e) => {
			if (e.target.closest && e.target.closest("[data-sound]")) return; // the button handles itself
			["pointerdown", "keydown"].forEach((t) => removeEventListener(t, go, true));
			if (on) turn(true);
		};
		["pointerdown", "keydown"].forEach((t) => addEventListener(t, go, true));
	}
	window.jaSound = { state: () => ({ on, playing: wanted, demoSound: busy() }) };
	document.addEventListener("visibilitychange", check);
	addEventListener("pagehide", () => { try { if (buf) sessionStorage.setItem(POS, String(pos())); } catch (e) {} });
})();
