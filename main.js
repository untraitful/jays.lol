/* =========================================================
   CONFIG — all copy, links and image paths live here.
   Colours live in styles.css (:root).
   ========================================================= */
const CONFIG = {
	name: "jay",
	city: "Detroit",
	status: "open to work",
	email: "jrougew@gmail.com",
	bio: [
		"i attempt to build things that work. every once in a while, they do.",
		"current project: a homelab.",
	],

	images: {
		portrait: "images/pfp.jpg",
		/* full-bleed photo strip — add { src, alt, caption } entries to show it, e.g.
		   { src: "images/strip-1.jpg", alt: "street at night, lit by a camera flash", caption: "fig. 01" } */
		strip: [],
	},
	portraitCaption: "// somewhere in the city",

	links: {
		chat: "#contact",
	},

	socials: [
		{ label: "email", href: "mailto:jrougew@gmail.com", icon: "mail" },
		{ label: "github", href: "https://github.com/untraitful", icon: "github" },
	],

	ticker: {
		top: ["open to work", "rust", "linux", "self-hosted", "privacy first", "terminal native"],
		bottom: ["stay curious", "ship small things", "read the manual", "made in detroit", "no trackers"],
	},

	wordmark: ["Jay & Co.", "Est. MMXXVI"],

	about: {
		left: "No. 001\nPrinted on recycled pixels",
		right: "Hand-set in\nmonospace",
		statement: "I build things, break them, and build them again until they work. Right now that means a homelab in Detroit.",
	},

	divider: "+ Dispatches + Field notes + Logs +",

	projects: [
		{
			name: "homelab",
			desc: "self-hosted servers at home. a permanent work in progress.",
			tags: ["linux", "self-hosted"],
			year: 2026,
			links: [],
		},
	],

	/* href is optional — posts without one render as plain lines */
	posts: [
		{ date: "2026-10-12", title: "working-on-the-site.md", read: "1 min" },
	],

	contact: {
		title: "Say hello!",
		lede: "Projects, work, or just a good link — my inbox is open.",
		signoff: "— end of transmission —",
	},

	/* accent options for the tweak panel (CSS var names from :root) */
	accents: [
		{ id: "red", label: "orange-red", color: "var(--red)" },
		{ id: "green", label: "green", color: "var(--green)" },
		{ id: "yellow", label: "yellow", color: "var(--yellow)" },
	],

	/* default tweak state; "dither" is off | portrait | all */
	defaults: { dither: "portrait", accent: "red", frame: true },
};

/* =========================================================
   helpers
   ========================================================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const root = document.documentElement;
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const store = {
	get(key, fallback) {
		try {
			const raw = localStorage.getItem(`portfolio:${key}`);
			return raw === null ? fallback : JSON.parse(raw);
		} catch {
			return fallback;
		}
	},
	set(key, value) {
		try {
			localStorage.setItem(`portfolio:${key}`, JSON.stringify(value));
		} catch {
			/* storage unavailable — settings just won't persist */
		}
	},
};

const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

const el = (tag, attrs = {}, children = []) => {
	const node = document.createElement(tag);
	for (const [k, v] of Object.entries(attrs)) {
		if (k === "class") node.className = v;
		else if (k === "text") node.textContent = v;
		else node.setAttribute(k, v);
	}
	for (const child of [].concat(children)) node.append(child);
	return node;
};

const icon = (id) => {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("aria-hidden", "true");
	svg.setAttribute("focusable", "false");
	const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
	use.setAttribute("href", `#i-${id}`);
	svg.append(use);
	return svg;
};

const isExternal = (href) => /^https?:\/\//.test(href);

/* =========================================================
   copy binding & rendering
   ========================================================= */
function bindCopy() {
	$$("[data-bind]").forEach((node) => {
		const value = getPath(CONFIG, node.dataset.bind);
		if (typeof value !== "string") return;
		// "\n" in config becomes a line break
		node.replaceChildren(...value.split("\n").flatMap((line, i) => (i ? [el("br"), line] : [line])));
	});

	$$("[data-href]").forEach((node) => {
		const key = node.dataset.href;
		const href = key === "mailto" ? `mailto:${CONFIG.email}` : CONFIG.links[key];
		if (href) node.setAttribute("href", href);
	});

	const portrait = $('[data-src="portrait"]');
	if (portrait) {
		portrait.alt = `Portrait of ${CONFIG.name}`;
		portrait.src = CONFIG.images.portrait;
	}
	document.title = `${CONFIG.name} — portfolio`;
}

function renderTickers() {
	$$("[data-ticker]").forEach((track) => {
		const phrases = CONFIG.ticker[track.dataset.ticker] || [];
		const text = phrases.map((p) => `${p.toUpperCase()}!`).join(" ") + " ";
		// enough repetitions to cover ultra-wide screens; two identical groups loop seamlessly
		const group = () => el("span", { class: "ticker__group", text: text.repeat(4) });
		track.replaceChildren(group(), group());
		track.style.setProperty("--ticker-dur", `${Math.max(30, text.length * 0.9)}s`);
	});
}

function renderSocials() {
	$$("[data-socials]").forEach((list) => {
		const iconsOnly = list.dataset.socials === "icons";
		list.replaceChildren(
			...CONFIG.socials.map((s) => {
				const attrs = { href: s.href };
				if (isExternal(s.href)) Object.assign(attrs, { target: "_blank", rel: "noopener noreferrer" });
				if (iconsOnly) attrs["aria-label"] = s.label;
				const link = el("a", attrs, iconsOnly ? icon(s.icon) : s.label);
				return el("li", {}, link);
			}),
		);
	});
}

function renderProjects() {
	const list = $("[data-projects]");
	if (!list) return;
	$("[data-projects-total]").textContent = `total ${CONFIG.projects.length}`;
	list.replaceChildren(
		...CONFIG.projects.map((p) => {
			const links = p.links.map((l) => {
				const attrs = { href: l.href, "aria-label": `${p.name} ${l.label}` };
				if (isExternal(l.href)) Object.assign(attrs, { target: "_blank", rel: "noopener noreferrer" });
				return el("a", attrs, `[${l.label}]`);
			});
			return el("li", { class: "ls__row" }, [
				el("span", { class: "ls__perm muted", "aria-hidden": "true", text: "drwxr-xr-x" }),
				el("h3", { class: "ls__name", text: p.name }),
				el("p", { class: "ls__desc", text: p.desc }),
				el("p", { class: "ls__tags" }, [el("span", { class: "sr-only", text: "tags: " }), p.tags.join(" · ")]),
				el("p", { class: "ls__year muted", text: String(p.year) }),
				el("p", { class: "ls__links" }, links),
			]);
		}),
	);
}

function renderPosts() {
	const list = $("[data-posts]");
	if (!list) return;
	list.replaceChildren(
		...CONFIG.posts.map((post) =>
			el("li", {}, el(post.href ? "a" : "div", post.href ? { href: post.href, class: "post" } : { class: "post" }, [
				el("time", { datetime: post.date, text: post.date }),
				el("span", { class: "post__title", text: post.title }),
				el("span", { class: "muted", text: post.read || "" }),
			])),
		),
	);
}

function renderStrip() {
	const grid = $("[data-strip]");
	if (!grid) return;
	if (!CONFIG.images.strip.length) {
		grid.closest(".strip").hidden = true;
		return;
	}
	grid.replaceChildren(
		...CONFIG.images.strip.map((img, i) => {
			const photo = el("img", { class: "photo", src: img.src, alt: img.alt, loading: "lazy", decoding: "async" });
			photo.addEventListener("error", () => {
				// missing file → draw a stand-in so the layout still works
				photo.src = placeholderScene(i, 900, 640);
			}, { once: true });
			return el("figure", { class: "strip__fig", "data-dither-target": "strip" }, [
				photo,
				el("canvas", { class: "dither", "aria-hidden": "true" }),
				el("figcaption", { text: img.caption }),
			]);
		}),
	);
}

/* procedural "city at night" placeholder for missing images */
function placeholderScene(seed, w, h) {
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	const ctx = c.getContext("2d");
	let s = seed * 9301 + 49297;
	const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);

	const sky = ctx.createLinearGradient(0, 0, 0, h);
	sky.addColorStop(0, ["#1b2340", "#3a2a2a", "#22303a"][seed % 3]);
	sky.addColorStop(1, ["#e8552e", "#f5e94b", "#3cb44b"][seed % 3]);
	ctx.fillStyle = sky;
	ctx.fillRect(0, 0, w, h);

	ctx.fillStyle = "rgba(255,255,240,0.9)";
	ctx.beginPath();
	ctx.arc(w * (0.2 + rand() * 0.6), h * (0.2 + rand() * 0.2), h * 0.09, 0, Math.PI * 2);
	ctx.fill();

	let x = 0;
	while (x < w) {
		const bw = 40 + rand() * 110;
		const bh = h * (0.25 + rand() * 0.5);
		ctx.fillStyle = `hsl(0 0% ${6 + rand() * 14}%)`;
		ctx.fillRect(x, h - bh, bw, bh);
		ctx.fillStyle = "rgba(255,240,200,0.75)";
		for (let wy = h - bh + 12; wy < h - 12; wy += 18) {
			for (let wx = x + 8; wx < x + bw - 10; wx += 14) {
				if (rand() > 0.62) ctx.fillRect(wx, wy, 6, 9);
			}
		}
		x += bw + 2;
	}
	return c.toDataURL("image/jpeg", 0.85);
}

/* =========================================================
   1-bit Floyd–Steinberg dithering on <canvas>
   ========================================================= */
const DARK = [11, 11, 11];
const LIGHT = [234, 234, 234];

function ditherInto(img, canvas, cellSize = 2) {
	const box = canvas.parentElement.getBoundingClientRect();
	if (!box.width || !box.height || !img.naturalWidth) return false;

	const w = Math.max(40, Math.round(box.width / cellSize));
	const h = Math.max(40, Math.round(box.height / cellSize));
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });

	// object-fit: cover crop
	const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
	const sw = w / scale;
	const sh = h / scale;
	const sx = (img.naturalWidth - sw) / 2;
	const sy = (img.naturalHeight - sh) / 2;
	ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

	let data;
	try {
		data = ctx.getImageData(0, 0, w, h);
	} catch {
		// tainted canvas (e.g. opened via file://) — fall back to the CSS-filtered photo
		return false;
	}

	const px = data.data;
	const lum = new Float32Array(w * h);
	for (let i = 0; i < w * h; i++) {
		const l = 0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2];
		// punchy contrast curve around mid-grey
		lum[i] = Math.min(255, Math.max(0, (l - 128) * 1.35 + 128 + 8));
	}

	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = y * w + x;
			const old = lum[i];
			const val = old < 128 ? 0 : 255;
			const err = old - val;
			lum[i] = val;
			if (x + 1 < w) lum[i + 1] += (err * 7) / 16;
			if (y + 1 < h) {
				if (x > 0) lum[i + w - 1] += (err * 3) / 16;
				lum[i + w] += (err * 5) / 16;
				if (x + 1 < w) lum[i + w + 1] += err / 16;
			}
		}
	}

	for (let i = 0; i < w * h; i++) {
		const c = lum[i] ? LIGHT : DARK;
		px[i * 4] = c[0];
		px[i * 4 + 1] = c[1];
		px[i * 4 + 2] = c[2];
		px[i * 4 + 3] = 255;
	}
	ctx.putImageData(data, 0, 0);
	return true;
}

function applyDither(mode) {
	$$("[data-dither-target]").forEach((target) => {
		const on = mode === "all" || (mode === "portrait" && target.dataset.ditherTarget === "portrait");
		const img = $("img", target);
		const canvas = $("canvas", target);
		if (!on) {
			target.classList.remove("is-dithered");
			return;
		}
		const run = () => target.classList.toggle("is-dithered", ditherInto(img, canvas));
		if (img.complete && img.naturalWidth) run();
		else img.addEventListener("load", run, { once: true });
	});
}

/* =========================================================
   live clock  [ 12.10.2026 14 33 ]
   ========================================================= */
function startClock() {
	const node = $("[data-clock]");
	if (!node) return;
	const pad = (n) => String(n).padStart(2, "0");
	let tick = false;
	const update = () => {
		const d = new Date();
		const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
		node.dateTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
		tick = !tick;
		const sep = root.dataset.motion === "on" && tick ? " " : ":";
		node.textContent = `${date} ${pad(d.getHours())}${sep}${pad(d.getMinutes())}`;
	};
	update();
	setInterval(update, 1000);
}

/* =========================================================
   scroll-spy for the breadcrumb nav
   ========================================================= */
function scrollSpy() {
	const links = $$(".crumbs a");
	const sections = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
	const setActive = (id) => {
		links.forEach((a) => {
			if (a.hash === `#${id}`) a.setAttribute("aria-current", "location");
			else a.removeAttribute("aria-current");
		});
	};
	const visible = new Map();
	const io = new IntersectionObserver((entries) => {
		entries.forEach((e) => visible.set(e.target.id, e.isIntersecting));
		const current = sections.find((s) => visible.get(s.id));
		if (current) setActive(current.id);
	}, { rootMargin: "-35% 0px -55% 0px" });
	sections.forEach((s) => io.observe(s));
}

/* =========================================================
   tweak panel
   ========================================================= */
function tweaks() {
	const btn = $("[data-tweak-btn]");
	const panel = $("[data-tweak-panel]");
	const swatches = $("[data-accents]");

	swatches.replaceChildren(
		...CONFIG.accents.map((a) =>
			el("label", { title: a.label }, [
				el("input", { type: "radio", name: "accent", value: a.id }),
				el("span", { class: "swatch", "aria-hidden": "true", style: `background:${a.color}` }),
				el("span", { class: "sr-only", text: a.label }),
			]),
		),
	);

	const state = {
		dither: store.get("dither", CONFIG.defaults.dither),
		accent: store.get("accent", CONFIG.defaults.accent),
		frame: store.get("frame", CONFIG.defaults.frame),
		motion: store.get("motion", !reducedMotionQuery.matches),
	};

	const apply = () => {
		root.dataset.accent = state.accent;
		root.dataset.frame = state.frame ? "on" : "off";
		root.dataset.motion = state.motion ? "on" : "off";
		applyDither(state.dither);
		panel.querySelectorAll("input").forEach((input) => {
			if (input.type === "radio") input.checked = state[input.name] === input.value;
			else input.checked = Boolean(state[input.name]);
		});
	};

	panel.addEventListener("change", (e) => {
		const input = e.target;
		state[input.name] = input.type === "checkbox" ? input.checked : input.value;
		store.set(input.name, state[input.name]);
		apply();
	});

	// follow OS changes unless the visitor chose explicitly
	reducedMotionQuery.addEventListener?.("change", (e) => {
		if (store.get("motion", null) === null) {
			state.motion = !e.matches;
			apply();
		}
	});

	const open = (show) => {
		panel.hidden = !show;
		btn.setAttribute("aria-expanded", String(show));
		if (show) ($("input:checked", panel) || $("input", panel)).focus();
	};
	btn.addEventListener("click", () => open(panel.hidden));
	$("[data-tweak-close]").addEventListener("click", () => {
		open(false);
		btn.focus();
	});
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && !panel.hidden) {
			open(false);
			btn.focus();
		}
	});
	document.addEventListener("pointerdown", (e) => {
		if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) open(false);
	});

	// re-dither at the new size after the viewport width changes
	let t;
	let lastWidth = window.innerWidth;
	window.addEventListener("resize", () => {
		if (window.innerWidth === lastWidth) return;
		lastWidth = window.innerWidth;
		clearTimeout(t);
		t = setTimeout(() => applyDither(state.dither), 150);
	});

	apply();
}

/* =========================================================
   boot
   ========================================================= */
root.dataset.js = "";
bindCopy();
renderTickers();
renderSocials();
renderProjects();
renderPosts();
renderStrip();
startClock();
scrollSpy();
tweaks();
