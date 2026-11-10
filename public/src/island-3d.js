/* Original Three.js low-poly island; collision comes from the isolated 3D world grid. */
(function (global) {
  "use strict";
  const MAP_SCALE = 40,
    KEY = "zhuyin-island-explore-v1-";
  const HAIR = ["short", "bob", "tuft"],
    COLORS = ["#ee8f83", "#7cbad0", "#a591c4", "#e8b95e"],
    ACCESSORIES = ["none", "bow", "star"];
  const COPY = {
    rabbit: "我是小兔，一起來看看注音卡吧！",
    owl: "我是貓頭鷹，我們一起認識注音。",
    fox: "我是小狐狸，來和我拼一拼！",
    panda: "我是小熊貓，我們一起看圖認字。",
    dog: "嗨！沿著小路走，去看看島上的朋友吧。",
  };
  let active = null;
  const q = (s, r) => r.querySelector(s),
    clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const coord = (p) => ({
    x: (p.x - 600) / MAP_SCALE,
    z: (p.y - 400) / MAP_SCALE,
  });
  const worldPoint = (x, z) => ({
    x: x * MAP_SCALE + 600,
    y: z * MAP_SCALE + 400,
  });
  const appearance = (a = {}) => ({
    hair: HAIR.includes(a.hair) ? a.hair : "short",
    color: COLORS.includes(a.color) ? a.color : COLORS[0],
    accessory: ACCESSORIES.includes(a.accessory) ? a.accessory : "none",
  });
  function getSaved(id) {
    const data = global.IslandExplore?.snapshot(id);
    return data?.status === "unavailable"
      ? {
          position: { x: 620, y: 420 },
          facing: "down",
          appearance: appearance(),
          readOnly: true,
        }
      : {
          position: data?.position || { x: 620, y: 420 },
          facing: data?.facing || "down",
          appearance: appearance(data?.appearance),
          readOnly: false,
        };
  }
  function save(s) {
    if (!s.dirty || s.readOnly) return;
    try {
      const snap = global.IslandExplore?.snapshot(s.childId);
      if (snap?.status === "unavailable") {
        s.readOnly = true;
        notice(s, "原有角色資料無法讀取，已保留原始資料。");
        return;
      }
      const raw = localStorage.getItem(KEY + s.childId);
      const old =
        raw === null
          ? {
              version: 1,
              position: { x: 620, y: 420 },
              facing: "down",
              appearance: appearance(),
            }
          : JSON.parse(raw);
      if (
        old?.version !== 1 ||
        !old.position ||
        !old.appearance ||
        !HAIR.includes(old.appearance.hair) ||
        !COLORS.includes(old.appearance.color) ||
        !ACCESSORIES.includes(old.appearance.accessory) ||
        !Number.isFinite(old.position.x) ||
        !Number.isFinite(old.position.y) ||
        !["up", "down", "left", "right"].includes(old.facing)
      ) {
        s.readOnly = true;
        notice(s, "原有角色資料無法讀取，已保留原始資料。");
        return;
      }
      old.position = { ...old.position, ...s.position };
      old.facing = s.facing;
      localStorage.setItem(KEY + s.childId, JSON.stringify(old));
      s.dirty = false;
    } catch (_) {
      s.readOnly = true;
      notice(s, "無法儲存位置；本次使用暫時狀態。");
    }
  }
  function notice(s, text) {
    const e = q(".island3d-notice", s.root);
    if (e) e.textContent = text;
  }
  function refresh() {
    const s = active;
    if (!s) return;
    const profile = s.opts.getProfile?.() || {};
    const balance = s.opts.getBalance?.();
    q(".island3d-hud", s.root).textContent =
      `${profile.name || "島上朋友"}  ⭐ ${profile.stars ?? 0}  🎟️ ${Number.isFinite(balance) ? balance : "—"}`;
  }
  function markup() {
    return `<div class="island3d-bar"><div><b>🌿 立體探索</b><span> 用方向鍵、搖桿或點地圖走動</span></div><div class="island3d-hud" aria-live="polite"></div><div class="island3d-toolbar"><button data-3d-action="home">⌂ 廣場</button><button data-3d-action="rotate">↻ 轉鏡頭</button><button data-3d-action="camera-reset">◎ 鏡頭回正</button><button data-3d-action="zoom">＋ 視野</button><button data-3d-action="wave">👋 揮手</button><button data-3d-action="appearance">✿ 裝扮</button><button data-3d-action="stick" aria-pressed="true">◉ 隱藏搖桿</button><button data-3d-action="motion" aria-pressed="false">減少動態</button><button data-3d-action="map">▦ 大地圖</button><label>畫質 <select data-3d-quality><option value="auto">自動</option><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select></label><button data-3d-action="fallback">2D 模式</button></div></div><div class="island3d-appearance" hidden><label>髮型 <select data-3d-appearance="hair"><option value="short">短髮</option><option value="bob">圓圓髮</option><option value="tuft">翹翹髮</option></select></label><label>衣服 <select data-3d-appearance="color"><option value="#ee8f83">珊瑚粉</option><option value="#7cbad0">天空藍</option><option value="#a591c4">薰衣草紫</option><option value="#e8b95e">陽光黃</option></select></label><label>裝飾 <select data-3d-appearance="accessory"><option value="none">無</option><option value="bow">蝴蝶結</option><option value="star">星星</option></select></label></div><div class="island3d-viewport" tabindex="0" aria-label="立體動物島，方向鍵或 WASD 移動，Enter 互動"><canvas class="island3d-canvas"></canvas><div class="island3d-labels" aria-hidden="true"></div><canvas class="island3d-minimap" width="240" height="160" aria-label="島嶼小地圖"></canvas><button class="island3d-map-open" data-3d-action="map" aria-label="開啟大地圖">▦</button><div class="island3d-stick" aria-label="移動搖桿"><span></span></div><div class="island3d-near" hidden><span></span><button data-3d-action="interact">互動</button></div><div class="island3d-dialog" hidden role="dialog" aria-label="動物朋友的話"><strong></strong><p></p><button data-3d-action="speak">🔊 聽一聽</button><button data-3d-action="learn">一起學習</button><button data-3d-action="close">再逛逛</button></div></div><div class="island3d-map" hidden role="dialog" aria-label="島嶼大地圖"><div><b>島嶼大地圖</b><button data-3d-action="close-map">關閉</button></div><p>點選目的地，角色會沿著小路前往。</p><canvas class="island3d-large-map" width="600" height="400" aria-label="島嶼地圖，可點選目的地"></canvas><div class="island3d-map-list"></div></div><p class="island3d-notice" role="status" aria-live="polite">靠近動物朋友或設施後按互動。</p>`;
  }
  function material(s, c) {
    return new s.T.MeshLambertMaterial({ color: c });
  }
  function mesh(s, geo, color, x, y, z, parent = s.scene) {
    const o = new s.T.Mesh(geo, material(s, color));
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function box(s, color, w, h, d, x, y, z, parent) {
    return mesh(s, new s.T.BoxGeometry(w, h, d), color, x, y, z, parent);
  }
  function cylinder(s, color, r1, r2, h, x, y, z, parent, segments = 8) {
    return mesh(
      s,
      new s.T.CylinderGeometry(r1, r2, h, segments),
      color,
      x,
      y,
      z,
      parent,
    );
  }
  function sphere(s, color, r, x, y, z, parent) {
    return mesh(s, new s.T.SphereGeometry(r, 10, 7), color, x, y, z, parent);
  }
  function tree(s, x, z) {
    const g = new s.T.Group();
    g.position.set(x, 0, z);
    s.scene.add(g);
    cylinder(s, 0x986d51, 0.16, 0.22, 1.5, 0, 0.75, 0, g);
    for (let i = 0; i < 3; i++) {
      const crown = mesh(
        s,
        new s.T.ConeGeometry(1.05 - i * 0.12, 1.45, 7),
        [0x76b87c, 0x8acb8c, 0xa4d797][i],
        0,
        1.45 + i * 0.55,
        0,
        g,
      );
      crown.rotation.y = 0.35;
    }
    return g;
  }
  function person(s, ap, animal) {
    const T = s.T,
      g = new T.Group();
    const skin = animal
      ? {
          rabbit: 0xf5e7d8,
          owl: 0xc4987b,
          fox: 0xe5a075,
          panda: 0xfaf4e9,
          dog: 0xd1ac84,
        }[animal]
      : 0xf7caad;
    const shirt = animal ? skin : ap.color;
    const body = box(s, shirt, 0.68, 0.9, 0.4, 0, 1.05, 0, g);
    const head = sphere(s, skin, 0.51, 0, 1.85, 0, g);
    head.scale.set(1, 0.94, 0.9);
    if (!animal) {
      const hair = sphere(s, 0x4a3840, 0.525, 0, 2.02, -0.04, g);
      hair.scale.set(1, 0.65, 0.9);
      if (ap.hair === "bob")
        box(s, 0x4a3840, 0.99, 0.45, 0.34, 0, 1.78, -0.32, g);
      if (ap.hair === "tuft") {
        const tuft = mesh(
          s,
          new T.ConeGeometry(0.13, 0.38, 5),
          0x4a3840,
          0.12,
          2.47,
          0,
          g,
        );
        tuft.rotation.z = -0.3;
      }
      if (ap.accessory !== "none")
        sphere(
          s,
          ap.accessory === "star" ? 0xffd15a : 0xf48da6,
          0.13,
          0.36,
          2.23,
          0.16,
          g,
        );
    } else {
      for (const x of [-0.31, 0.31]) {
        if (animal === "fox" || animal === "owl") {
          const ear = mesh(s, new T.ConeGeometry(.19,.36,4), skin, x, 2.27, 0, g);
          ear.rotation.z = x < 0 ? .2 : -.2;
        } else {
          const ear = sphere(s, animal === "panda" ? 0x34363b : skin, .17, x, animal === "dog" ? 1.95 : 2.27, 0, g);
          ear.scale.set(1, animal === "rabbit" ? 2 : animal === "dog" ? 1.65 : 1, 1);
        }
      }
      if (animal === "owl" || animal === "panda") {
        for (const x of [-.18,.18]) {
          const patch = sphere(s, animal === "owl" ? 0xf7eacb : 0x33363a, .19, x, 1.87, .39, g);
          patch.scale.set(1,1.12,.68);
        }
      }
      if (animal === "fox" || animal === "dog") {
        const muzzle = sphere(s, animal === "fox" ? 0xffe3c6 : 0xe9c9a5, .22, 0, 1.7, .4, g);
        muzzle.scale.set(1,.7,.8);
        sphere(s, 0x43373b, .06, 0, 1.76, .57, g);
      }
      if (animal === "owl") {
        const beak = mesh(s, new T.ConeGeometry(.09,.2,4), 0xe9b65c, 0, 1.7, .53, g);
        beak.rotation.x = Math.PI / 2;
      }
    }
    for (const x of [-0.18, 0.18])
      sphere(s, animal === "panda" ? 0xffffff : 0x44343b, 0.048, x, 1.87, animal === "owl" || animal === "panda" ? .54 : .455, g);
    const arms = [],
      legs = [];
    for (const x of [-0.48, 0.48]) {
      const pivot = new T.Group();
      pivot.position.set(x, 1.35, 0);
      g.add(pivot);
      box(s, skin, 0.19, 0.65, 0.19, 0, -0.25, 0, pivot);
      arms.push(pivot);
    }
    for (const x of [-0.22, 0.22]) {
      const pivot = new T.Group();
      pivot.position.set(x, 0.65, 0);
      g.add(pivot);
      box(s, animal ? skin : 0x625967, 0.24, 0.55, 0.24, 0, -0.23, 0, pivot);
      legs.push(pivot);
    }
    g.userData = { arms, legs, body, head };
    return g;
  }
  function landmark(s, o) {
    const T = s.T,
      p = coord({ x: o.x + o.w / 2, y: o.y + o.h / 2 }),
      g = new T.Group();
    g.position.set(p.x, 0, p.z);
    g.userData.entryId = o.id;
    s.scene.add(g);
    const w = o.w / 40,
      d = o.h / 40;
    if (o.id.startsWith("tree")) {
      s.scene.remove(g);
      return tree(s, p.x, p.z);
    }
    if (o.id === "pond") {
      cylinder(s, 0x7cc9d0, 1.2, 1.3, 0.12, 0, 0.09, 0, g, 14);
      g.scale.set(w / 2.6, 1, d / 2.6);
      return g;
    }
    box(
      s,
      o.id === "village" ? 0xeeb99a : o.id === "garden" ? 0xd2e9b3 : 0xf4ddba,
      w,
      0.32,
      d,
      0,
      0.16,
      0,
      g,
    );
    if (["village", "garden", "phonetic", "picture"].includes(o.id)) {
      box(
        s,
        o.id === "village" ? 0xf2c9a6 : o.id === "phonetic" ? 0xc5deeb : o.id === "picture" ? 0xf1d0d9 : 0xf0d0bd,
        w * 0.75,
        1.8,
        d * 0.7,
        0,
        1.1,
        0,
        g,
      );
      const roof = mesh(
        s,
        new T.ConeGeometry(w * 0.65, 1.3, 4),
        0xd88274,
        0,
        2.65,
        0,
        g,
      );
      roof.rotation.y = Math.PI / 4;
      box(s, 0xa9765d, 0.65, 1, 0.12, 0, 0.9, d * 0.36, g);
      box(s, 0x9dd9df, 0.55, 0.55, 0.1, -0.8, 1.55, d * 0.36, g);
      if (o.id === "village") {
        box(s, 0xf3dec1, .8, 1.6, .8, .9, 3.05, -.2, g);
        const cap = mesh(s, new T.ConeGeometry(.65,.8,4), 0xd88274, .9, 4.2, -.2, g);
        cap.rotation.y = Math.PI / 4;
        const clock = cylinder(s, 0xfff7df, .25, .25, .08, .9, 3.3, .22, g, 12);
        clock.rotation.x = Math.PI / 2;
      }
    } else if (o.id === "forest") {
      for (const [x,z] of [[-.55,-.25],[.5,-.15],[0,.35]]) {
        cylinder(s, 0x986d51, .1, .13, .8, x, .7, z, g);
        mesh(s, new T.ConeGeometry(.42, 1.1, 6), 0x6eae79, x, 1.55, z, g);
      }
    } else if (o.id === "carousel") {
      cylinder(s, 0xebaaa1, 1.6, 1.6, 0.3, 0, 0.5, 0, g, 12);
      cylinder(s, 0xe6bf83, 0.09, 0.09, 2.4, 0, 1.8, 0, g);
      mesh(s, new T.ConeGeometry(1.7, 0.85, 12), 0xf1a595, 0, 3, 0, g);
      for (let a = 0; a < 4; a++) {
        const t = (a * Math.PI) / 2;
        sphere(s, 0xffead8, 0.32, Math.cos(t), 1.25, Math.sin(t), g);
      }
    } else if (o.id === "coaster") {
      const curve = new T.CatmullRomCurve3([
        new T.Vector3(-1.8, 0.5, 0),
        new T.Vector3(-1.1, 2, 0),
        new T.Vector3(0, 0.7, 0),
        new T.Vector3(1.2, 1.7, 0),
        new T.Vector3(1.8, 0.5, 0),
      ]);
      mesh(
        s,
        new T.TubeGeometry(curve, 30, 0.1, 6, false),
        0xbc7e68,
        0,
        0,
        0,
        g,
      );
      box(s, 0x71b5ca, 0.8, 0.45, 0.65, 0, 1.15, 0, g);
    } else if (o.id === "ferris") {
      const wheel = new T.TorusGeometry(1.45, 0.12, 6, 18);
      mesh(s, wheel, 0xe8a47f, 0, 2.2, 0, g);
      for (let a = 0; a < 6; a++) {
        const t = (a * Math.PI) / 3;
        box(
          s,
          0xa5cfe0,
          0.4,
          0.5,
          0.4,
          1.45 * Math.cos(t),
          2.2 + 1.45 * Math.sin(t),
          0,
          g,
        );
      }
      box(s, 0xbd8f70, 0.2, 2.1, 0.2, 0, 1.1, -0.1, g);
    } else if (o.id === "bumper") {
      for (const x of [-0.75, 0.75])
        box(s, x < 0 ? 0xe99884 : 0x81bdcf, 0.8, 0.35, 0.7, x, 0.55, 0, g);
      for (const x of [-1.5, 1.5])
        box(s, 0xbca789, 0.12, 0.55, d * 0.8, x, 0.5, 0, g);
    } else if (o.id === "pirate") {
      for (const x of [-1.3, 1.3]) {
        const beam = box(s, 0xab7c5e, 0.15, 2.9, 0.15, x, 1.6, 0, g);
        beam.rotation.z = x < 0 ? -0.4 : 0.4;
      }
      box(s, 0xbb795e, 2.1, 0.5, 0.8, 0, 0.95, 0, g);
      box(s, 0xf2e2bd, 0.15, 1.6, 0.1, 0, 1.9, 0, g);
    } else if (o.id === "train") {
      for (let i = 0; i < 3; i++)
        box(
          s,
          [0xe59780, 0x8bc6ca, 0xf2cf7d][i],
          0.8,
          0.55,
          0.7,
          -1.1 + i,
          0.55,
          0,
          g,
        );
    }
    return g;
  }
  function populate(s) {
    const T = s.T;
    s.scene.background = new T.Color(0xbde7ed);
    s.scene.fog = new T.Fog(0xbde7ed, 28, 85);
    s.scene.add(new T.HemisphereLight(0xffffff, 0x78a37b, 2.2));
    const sun = new T.DirectionalLight(0xfff1d0, 2);
    sun.position.set(8, 22, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -22;
    sun.shadow.camera.right = 22;
    sun.shadow.camera.top = 22;
    sun.shadow.camera.bottom = -22;
    s.scene.add(sun);
    s.sun = sun;
    box(s, 0x86ced0, 34, 0.4, 24, 0, -0.55, 0);
    box(s, 0xedd7a4, 29, 0.55, 19, 0, -0.25, 0);
    box(s, 0xa7d58c, 28.2, 0.35, 18.2, 0, 0.02, 0);
    box(s, 0xf0dfba, 24, 0.12, 2.5, 0, 0.26, -2.5);
    box(s, 0xf0dfba, 2.8, 0.12, 13, -1, 0.27, 0);
    cylinder(s, 0xf4e5c8, 2.2, 2.2, 0.12, 0.5, 0.28, 0.5, undefined, 24);
    cylinder(s, 0x94cbd0, 0.62, 0.62, 0.35, -2, 0.5, 0.5, undefined, 12);
    cylinder(s, 0x72bbc7, 0.5, 0.5, 0.15, -2, 0.75, 0.5, undefined, 12);
    for (const o of s.world.obstacles) if (o.id !== "fountain") landmark(s, o);
    for (const e of s.world.entrances) {
      const p = coord(e);
      const marker = cylinder(
        s,
        0xfff3cb,
        0.4,
        0.4,
        0.08,
        p.x,
        0.37,
        p.z,
        undefined,
        12,
      );
      marker.userData.entryId = e.id;
    }
    for (let i = 0; i < 11; i++) {
      const x = -12 + i * 2.25,
        z = i % 2 ? 7 : -7;
      box(s, 0xffffff, 0.17, 0.22, 0.17, x, 0.4, z);
      sphere(s, i % 2 ? 0xf4ce72 : 0xf2a3a0, 0.12, x, 0.58, z);
    }
    for (const [x,z] of [[-6,-1],[3,-1],[-3,5],[8,2]]) {
      cylinder(s, 0x8f8069, .08, .12, 1.7, x, .95, z);
      sphere(s, 0xffe6a5, .22, x, 1.9, z);
    }
    s.avatar = person(s, s.appearance);
    s.scene.add(s.avatar);
    s.npcs = s.world.npcWaypoints.map((n) => {
      const actor = person(s, appearance(), n.id),
        p = coord(n.points[0]);
      actor.position.set(p.x, 0, p.z);
      s.scene.add(actor);
      return { ...n, actor, base: { ...p } };
    });
  }
  function actorPose(actor, walking, t, action, reduced) {
    const d = walking && !reduced ? Math.sin(t * 9) * 0.55 : 0;
    actor.userData.legs[0].rotation.x = d;
    actor.userData.legs[1].rotation.x = -d;
    actor.userData.arms[0].rotation.x = -d;
    actor.userData.arms[1].rotation.x =
      action === "wave" && !reduced ? Math.sin(t * 6) * 0.65 - 0.8 : d;
  }
  function drawMap(s, canvas) {
    const ctx = canvas.getContext("2d"),
      w = canvas.width,
      h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#b0dcd7";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#b6d69d";
    ctx.fillRect(w * 0.035, h * 0.05, w * 0.93, h * 0.9);
    for (const e of s.world.entrances) {
      ctx.fillStyle = e.kind === "ride" ? "#dc927e" : "#d5b977";
      ctx.beginPath();
      ctx.arc((e.x / 1200) * w, (e.y / 800) * h, 4, 0, Math.PI * 2);
      ctx.fill();
      if (w >= 500) {
        ctx.fillStyle = "#254c40";
        ctx.font = "14px sans-serif";
        ctx.fillText(e.label, (e.x / 1200) * w + 7, (e.y / 800) * h - 5);
      }
    }
    for (const peer of s.peers.values()) {
      const pos = worldPoint(peer.x, peer.z);
      ctx.fillStyle = "#8266b2";
      ctx.beginPath();
      ctx.arc((pos.x / 1200) * w, (pos.y / 800) * h, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#2c6855";
    ctx.beginPath();
    ctx.arc(
      (s.position.x / 1200) * w,
      (s.position.y / 800) * h,
      5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  function updateNear(s) {
    let target = null,
      dist = Infinity;
    for (const e of s.world.entrances) {
      const d = Math.hypot(s.position.x - e.x, s.position.y - e.y);
      if (d < 70 && d < dist) {
        target = { kind: "entry", item: e };
        dist = d;
      }
    }
    for (const n of s.npcs) {
      const w = worldPoint(n.actor.position.x, n.actor.position.z),
        d = Math.hypot(s.position.x - w.x, s.position.y - w.y);
      if (d < 70 && d < dist) {
        target = { kind: "npc", item: n };
        dist = d;
      }
    }
    s.near = target;
    const el = q(".island3d-near", s.root);
    el.hidden = !target;
    if (target)
      q("span", el).textContent =
        target.kind === "entry"
          ? target.item.label +
            (target.item.kind === "ride" ? " · 🎟️ 1 張" : "")
          : "和" + target.item.label + "打招呼";
  }
  function paint(s, now) {
    if (active !== s || document.hidden) return;
    s.raf = requestAnimationFrame((t) => paint(s, t));
    const rawDelta = now - (s.last || now);
    if (s.autoDegraded && rawDelta > 150) s.slowMs = (s.slowMs || 0) + rawDelta;
    else s.slowMs = 0;
    if (s.slowMs > 15000) {
      fallback(s, "畫面效能不足，已回到 2D。");
      return;
    }
    const dt = Math.min(rawDelta / 1000, 0.05);
    s.last = now;
    if (s.quality === "auto" && !s.autoDegraded && dt > 0) {
      s.sampleSeconds = (s.sampleSeconds || 0) + dt;
      s.sampleFrames = (s.sampleFrames || 0) + 1;
      if (s.sampleSeconds >= 6 && s.sampleFrames >= 30) {
        if (s.sampleSeconds / s.sampleFrames > 1 / 28) {
          setQuality("low");
          s.quality = "auto";
          s.autoDegraded = true;
          notice(s, "畫面速度較慢，已自動降低畫質。");
        }
        s.sampleSeconds = 0;
        s.sampleFrames = 0;
      }
    }
    let dx = s.input.x,
      dy = s.input.y;
    if (s.path.length && !dx && !dy && !s.dialog) {
      const target = s.path[0],
        d = Math.hypot(target.x - s.position.x, target.y - s.position.y);
      if (d < 5) {
        s.path.shift();
        if (!s.path.length) {
          notice(s, "已抵達目的地，靠近後可以互動。");
          save(s);
        }
      } else {
        dx = (target.x - s.position.x) / d;
        dy = (target.y - s.position.y) / d;
      }
    }
    const d = Math.hypot(dx, dy);
    const moving = d > 0 && !s.dialog;
    if (moving) {
      dx /= d;
      dy /= d;
      const next = s.world.move(s.position, dx * 145 * dt, dy * 145 * dt);
      if (next.x !== s.position.x || next.y !== s.position.y) s.dirty = true;
      s.position = next;
      s.facing =
        Math.abs(dx) > Math.abs(dy)
          ? dx < 0
            ? "left"
            : "right"
          : dy < 0
            ? "up"
            : "down";
    }
    const p = coord(s.position);
    s.avatar.position.set(
      p.x,
      s.action === "joy" && !s.reduced
        ? Math.abs(Math.sin(now / 180)) * 0.18
        : 0,
      p.z,
    );
    s.avatar.rotation.y = {
      down: 0,
      up: Math.PI,
      left: -Math.PI / 2,
      right: Math.PI / 2,
    }[s.facing];
    actorPose(s.avatar, moving, now / 1000, s.action, s.reduced);
    for (const n of s.npcs) {
      const near =
        Math.hypot(n.actor.position.x - p.x, n.actor.position.z - p.z) < 2;
      if (!s.reduced && !near && !s.dialog)
        n.actor.position.x = n.base.x + Math.sin(now / 2500 + n.base.z) * 0.32;
      const wave = near && Math.floor(now / 1000) % 7 < 2;
      actorPose(n.actor, !near && !s.reduced, now / 1000, wave ? "wave" : "idle", s.reduced);
    }
    for (const peer of s.peers.values()) {
      peer.actor.position.x +=
        (peer.x - peer.actor.position.x) * Math.min(1, dt * 9);
      peer.actor.position.z +=
        (peer.z - peer.actor.position.z) * Math.min(1, dt * 9);
      const action = peer.gestureUntil && now > peer.gestureUntil ? "idle" : peer.action;
      peer.actor.position.y = action === "joy" && !s.reduced ? Math.abs(Math.sin(now / 180)) * .18 : 0;
      peer.actor.rotation.y =
        { down: 0, up: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 }[
          peer.direction
        ] || 0;
      actorPose(
        peer.actor,
        action === "walk",
        now / 1000,
        action,
        s.reduced,
      );
    }
    const angle = s.cameraAngle,
      off = s.zoom;
    s.camera.position.set(
      p.x + Math.sin(angle) * off,
      off * 1.12,
      p.z + Math.cos(angle) * off,
    );
    s.camera.lookAt(p.x, 0.6, p.z);
    s.renderer.render(s.scene, s.camera);
    drawMap(s, s.minimap);
    if (!q(".island3d-map", s.root).hidden)
      drawMap(s, q(".island3d-large-map", s.root));
    for (const peer of s.peers.values()) {
      const v = new s.T.Vector3(
        peer.actor.position.x,
        2.8,
        peer.actor.position.z,
      ).project(s.camera);
      peer.label.style.transform = `translate(${((v.x + 1) * s.viewport.clientWidth) / 2}px,${((1 - v.y) * s.viewport.clientHeight) / 2}px)`;
      peer.label.hidden =
        v.z < -1 || v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1;
    }
    updateNear(s);
    if (now - s.lastEmit > 100) {
      s.lastEmit = now;
      s.opts.onPosition?.({
        x: p.x,
        z: p.z,
        direction: s.facing,
        action: moving ? "walk" : "idle",
      });
    }
    s.avatar.userData.moving = moving;
    s.root.dataset.x = s.position.x.toFixed(1);
    s.root.dataset.y = s.position.y.toFixed(1);
    s.root.dataset.facing = s.facing;
  }
  function setDestination(s, p) {
    const target = s.world.safePosition(p),
      path = s.world.findPath(s.position, target);
    s.path = path;
    s.input = { x: 0, y: 0 };
    notice(s, path.length ? "走向目的地。" : "已經到達或無法前往。");
  }
  function resetPlaza(options = {}) {
    const s = active;
    if (!s) return;
    s.path = [];
    s.input = { x: 0, y: 0 };
    s.position = { ...s.world.spawn };
    s.dirty = true;
    save(s);
    notice(s, "回到中央廣場了。");
    if (!options.silent) s.opts.onPlaza?.();
  }
  function gesture(action) {
    const s = active;
    if (!s || !["wave", "joy"].includes(action)) return;
    s.action = action;
    s.opts.onGesture?.(action);
    clearTimeout(s.gestureTimer);
    s.gestureTimer = setTimeout(() => {
      if (active === s) s.action = "idle";
    }, 1800);
  }
  function getAppearance() {
    return active ? { ...active.appearance } : null;
  }
  function moveTo(destinationId) {
    const s = active;
    if (s && destinationId === "plaza") {
      resetPlaza({ silent: true });
      return true;
    }
    const entrance = s?.world.entrances.find((e) => e.id === destinationId);
    if (!entrance) return false;
    s.path = [];
    s.input = { x: 0, y: 0 };
    s.position = s.world.safePosition(entrance);
    s.dirty = true;
    save(s);
    return true;
  }
  function snapshot(childId) {
    if (!/^child-[1-3]$/.test(childId || "")) return null;
    if (active?.childId === childId) save(active);
    if (active?.childId === childId && active.readOnly)
      return { status: "unavailable", readOnly: true };
    return (
      global.IslandExplore?.snapshot(childId) ?? {
        status: "unavailable",
        readOnly: true,
      }
    );
  }
  function changeAppearance(s, field, value) {
    const next = appearance({ ...s.appearance, [field]: value });
    if (next[field] !== value) return;
    const oldActor = s.avatar;
    s.avatar = person(s, next);
    s.avatar.position.copy(oldActor.position);
    s.scene.add(s.avatar);
    s.scene.remove(oldActor);
    oldActor.traverse((o) => {
      o.geometry?.dispose();
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else o.material?.dispose();
    });
    s.appearance = next;
    try {
      const snap = global.IslandExplore?.snapshot(s.childId);
      if (s.readOnly || snap?.status === "unavailable")
        throw new Error("readonly");
      const raw = localStorage.getItem(KEY + s.childId);
      const record =
        raw === null
          ? {
              version: 1,
              position: { ...s.position },
              facing: s.facing,
              appearance: next,
            }
          : JSON.parse(raw);
      if (
        record.version !== 1 ||
        !record.position ||
        !record.appearance ||
        !Number.isFinite(record.position.x) ||
        !Number.isFinite(record.position.y) ||
        !["up", "down", "left", "right"].includes(record.facing) ||
        !HAIR.includes(record.appearance.hair) ||
        !COLORS.includes(record.appearance.color) ||
        !ACCESSORIES.includes(record.appearance.accessory)
      )
        throw new Error("readonly");
      record.appearance = { ...record.appearance, ...next };
      localStorage.setItem(KEY + s.childId, JSON.stringify(record));
    } catch (_) {
      s.readOnly = true;
      notice(s, "原有角色資料無法讀取或寫入，已保留原始資料。");
    }
    s.opts.onAppearance?.({ ...next });
  }
  function resize(s) {
    const r = s.viewport.getBoundingClientRect();
    if (!r.width || !r.height) return;
    s.camera.aspect = r.width / r.height;
    s.camera.updateProjectionMatrix();
    s.renderer.setSize(r.width, r.height, false);
  }
  function setQuality(level) {
    const s = active;
    if (!s) return;
    const ql = ["high", "medium", "low"].includes(level) ? level : "medium";
    s.quality = level;
    if (level === "auto") {
      s.autoDegraded = false;
      s.sampleSeconds = 0;
      s.sampleFrames = 0;
    }
    const ratio = ql === "high" ? 2 : ql === "medium" ? 1.5 : 1;
    s.renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, ratio));
    s.renderer.shadowMap.enabled = ql !== "low";
    resize(s);
  }
  function interact(s) {
    if (!s.near) return;
    const n = s.near;
    if (n.kind === "entry") {
      save(s);
      if (n.item.kind === "ride") s.opts.ride?.(n.item.id);
      else s.opts.navigate?.(n.item.view);
      return;
    }
    s.dialog = n.item;
    s.path = [];
    s.input = { x: 0, y: 0 };
    const d = q(".island3d-dialog", s.root);
    q("strong", d).textContent = n.item.label;
    q("p", d).textContent = COPY[n.item.id];
    d.hidden = false;
    q('[data-3d-action="close"]', d).focus();
  }
  function fallback(s, reason) {
    if (active !== s) return;
    leave();
    s.opts.onFallback?.(reason);
  }
  function mount(root, opts = {}) {
    leave();
    if (
      !root ||
      !global.THREE ||
      !global.IslandWorld3D ||
      !/^child-[1-3]$/.test(opts.childId || "")
    ) {
      opts.onFallback?.("立體模式無法啟用，已回到 2D。");
      return false;
    }
    const canvas = document.createElement("canvas");
    let context;
    try {
      context = canvas.getContext("webgl2", { antialias: true, alpha: false });
    } catch (_) {}
    if (!context) {
      opts.onFallback?.("裝置無法啟用 WebGL2，已回到 2D。");
      return false;
    }
    const saved = getSaved(opts.childId),
      s = {
        root,
        opts,
        childId: opts.childId,
        T: global.THREE,
        world: global.IslandWorld3D,
        position: global.IslandWorld3D.safePosition(saved.position),
        facing: saved.facing,
        appearance: saved.appearance,
        readOnly: saved.readOnly,
        path: [],
        input: { x: 0, y: 0 },
        dialog: null,
        peers: new Map(),
        abort: new AbortController(),
        cameraAngle: 0.65,
        zoom: 13,
        last: 0,
        lastEmit: 0,
        action: "idle",
        reduced:
          !!opts.getSettings?.()?.reducedMotion ||
          !!global.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
      };
    try {
      root.classList.add("island3d-root");
      root.innerHTML = markup();
      s.viewport = q(".island3d-viewport", root);
      const placeholder = q(".island3d-canvas", root);
      canvas.className = "island3d-canvas";
      placeholder.replaceWith(canvas);
      s.canvas = canvas;
      s.minimap = q(".island3d-minimap", root);
      for (const control of root.querySelectorAll("[data-3d-appearance]"))
        control.value = s.appearance[control.dataset["3dAppearance"]];
      q(".island3d-large-map", root).addEventListener(
        "click",
        (e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setDestination(s, {
            x: ((e.clientX - rect.left) / rect.width) * 1200,
            y: ((e.clientY - rect.top) / rect.height) * 800,
          });
          q(".island3d-map", root).hidden = true;
        },
        { signal: s.abort.signal },
      );
      s.renderer = new s.T.WebGLRenderer({ canvas, context, antialias: true });
      s.renderer.outputColorSpace = s.T.SRGBColorSpace;
      s.renderer.shadowMap.type = s.T.PCFSoftShadowMap;
      s.scene = new s.T.Scene();
      s.camera = new s.T.PerspectiveCamera(42, 1, 0.1, 100);
      active = s;
      refresh();
      q('[data-3d-action="motion"]', root).setAttribute(
        "aria-pressed",
        String(s.reduced),
      );
      populate(s);
      setQuality("auto");
      const signal = s.abort.signal;
      for (const e of s.world.entrances) {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.destination = e.id;
        b.textContent = e.label + (e.kind === "ride" ? " · 🎟️ 1 張" : "");
        q(".island3d-map-list", root).append(b);
      }
      root.addEventListener(
        "click",
        (e) => {
          const dest = e.target.closest("[data-destination]");
          if (dest) {
            const entry = s.world.entrances.find(
              (x) => x.id === dest.dataset.destination,
            );
            if (entry) setDestination(s, entry);
            q(".island3d-map", root).hidden = true;
            return;
          }
          const b = e.target.closest("[data-3d-action]");
          if (!b) return;
          switch (b.dataset["3dAction"]) {
            case "home":
              resetPlaza();
              break;
            case "camera-reset":
              s.cameraAngle = 0.65;
              s.zoom = 13;
              break;
            case "motion": {
              const system = !!global.matchMedia?.(
                "(prefers-reduced-motion: reduce)",
              ).matches;
              s.reduced = system || !s.reduced;
              b.setAttribute("aria-pressed", String(s.reduced));
              notice(
                s,
                system
                  ? "裝置已要求減少動態。"
                  : s.reduced
                    ? "已減少動態。"
                    : "已恢復一般動態。",
              );
              break;
            }
            case "rotate":
              s.cameraAngle += Math.PI / 4;
              break;
            case "zoom":
              s.zoom = s.zoom === 13 ? 9 : s.zoom === 9 ? 17 : 13;
              break;
            case "stick": {
              const stick = q(".island3d-stick", root);
              stick.hidden = !stick.hidden;
              b.setAttribute("aria-pressed", String(!stick.hidden));
              b.textContent = stick.hidden ? "◉ 顯示搖桿" : "◉ 隱藏搖桿";
              s.input = { x: 0, y: 0 };
              break;
            }
            case "appearance":
              q(".island3d-appearance", root).hidden = !q(
                ".island3d-appearance",
                root,
              ).hidden;
              break;
            case "wave":
              gesture("wave");
              break;
            case "map":
              q(".island3d-map", root).hidden = false;
              break;
            case "close-map":
              q(".island3d-map", root).hidden = true;
              break;
            case "fallback":
              fallback(s, "已切換回 2D。");
              break;
            case "interact":
              interact(s);
              break;
            case "close":
              s.dialog = null;
              s.opts.stopSpeech?.();
              q(".island3d-dialog", root).hidden = true;
              s.viewport.focus();
              break;
            case "speak":
              s.opts.speak?.(COPY[s.dialog?.id] || "");
              break;
            case "learn": {
              const view = s.dialog?.view;
              s.opts.stopSpeech?.();
              s.dialog = null;
              save(s);
              if (view) s.opts.navigate?.(view);
              break;
            }
          }
        },
        { signal },
      );
      root.addEventListener(
        "change",
        (e) => {
          if (e.target.matches("[data-3d-quality]")) setQuality(e.target.value);
          if (e.target.matches("[data-3d-appearance]"))
            changeAppearance(
              s,
              e.target.dataset["3dAppearance"],
              e.target.value,
            );
        },
        { signal },
      );
      canvas.addEventListener(
        "pointerdown",
        () => s.viewport.focus({ preventScroll: true }),
        { signal },
      );
      canvas.addEventListener(
        "click",
        (e) => {
          if (s.dialog) return;
          const rect = canvas.getBoundingClientRect(),
            mouse = new s.T.Vector2(
              ((e.clientX - rect.left) / rect.width) * 2 - 1,
              -((e.clientY - rect.top) / rect.height) * 2 + 1,
            ),
            ray = new s.T.Raycaster();
          ray.setFromCamera(mouse, s.camera);
          const hits = ray.intersectObjects(s.scene.children, true);
          let entryId = null;
          for (const hit of hits) {
            let obj = hit.object;
            while (obj && !obj.userData.entryId) obj = obj.parent;
            if (obj?.userData.entryId) {
              entryId = obj.userData.entryId;
              break;
            }
          }
          const entry = s.world.entrances.find((x) => x.id === entryId);
          if (entry) {
            setDestination(s, entry);
            return;
          }
          const point = new s.T.Vector3(),
            plane = new s.T.Plane(new s.T.Vector3(0, 1, 0), -0.35);
          if (ray.ray.intersectPlane(plane, point))
            setDestination(s, worldPoint(point.x, point.z));
        },
        { signal },
      );
      s.viewport.addEventListener(
        "keydown",
        (e) => {
          const k = e.key.toLowerCase();
          if (k === "escape") {
            if (s.dialog) {
              s.dialog = null;
              q(".island3d-dialog", root).hidden = true;
              s.opts.stopSpeech?.();
            }
            q(".island3d-map", root).hidden = true;
            return;
          }
          if (e.target.closest("input,select,textarea,button")) return;
          const dir = {
            arrowup: [0, -1],
            w: [0, -1],
            arrowdown: [0, 1],
            s: [0, 1],
            arrowleft: [-1, 0],
            a: [-1, 0],
            arrowright: [1, 0],
            d: [1, 0],
          }[k];
          if (dir && !s.dialog) {
            e.preventDefault();
            s.path = [];
            s.input = { x: dir[0], y: dir[1] };
          } else if ((k === "enter" || k === " ") && !s.dialog) {
            e.preventDefault();
            interact(s);
          }
        },
        { signal },
      );
      s.viewport.addEventListener(
        "keyup",
        (e) => {
          if (
            [
              "arrowup",
              "arrowdown",
              "arrowleft",
              "arrowright",
              "w",
              "a",
              "s",
              "d",
            ].includes(e.key.toLowerCase())
          ) {
            s.input = { x: 0, y: 0 };
            save(s);
          }
        },
        { signal },
      );
      const stick = q(".island3d-stick", root),
        knob = q("span", stick);
      function drag(e) {
        const r = stick.getBoundingClientRect(),
          x = e.clientX - r.left - r.width / 2,
          y = e.clientY - r.top - r.height / 2,
          n = Math.hypot(x, y),
          limit = r.width * 0.3,
          k = n > limit ? limit / n : 1;
        s.path = [];
        s.input = n < 5 ? { x: 0, y: 0 } : { x: x / limit, y: y / limit };
        knob.style.transform = `translate(${x * k}px,${y * k}px)`;
      }
      stick.addEventListener(
        "pointerdown",
        (e) => {
          if (s.pointer != null) return;
          e.preventDefault();
          s.pointer = e.pointerId;
          stick.setPointerCapture(e.pointerId);
          drag(e);
        },
        { signal },
      );
      stick.addEventListener(
        "pointermove",
        (e) => {
          if (s.pointer === e.pointerId) drag(e);
        },
        { signal },
      );
      function release(e) {
        if (s.pointer !== e.pointerId) return;
        s.pointer = null;
        if (stick.hasPointerCapture(e.pointerId))
          stick.releasePointerCapture(e.pointerId);
        s.input = { x: 0, y: 0 };
        knob.style.transform = "";
        save(s);
      }
      function clearStick() {
        if (s.pointer != null) release({ pointerId: s.pointer });
        else { s.input = { x: 0, y: 0 }; knob.style.transform = ""; }
      }
      for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
        stick.addEventListener(name, release, { signal });
      canvas.addEventListener(
        "webglcontextlost",
        (e) => {
          e.preventDefault();
          fallback(s, "立體畫面中斷，已回到 2D。");
        },
        { signal },
      );
      document.addEventListener(
        "visibilitychange",
        () => {
          if (document.hidden) {
            cancelAnimationFrame(s.raf);
            s.raf = 0;
            s.last = 0;
            clearStick();
            s.path = [];
            save(s);
            s.opts.stopSpeech?.();
          } else if (active === s && !s.raf)
            s.raf = requestAnimationFrame((t) => paint(s, t));
        },
        { signal },
      );
      global.addEventListener("resize", () => resize(s), { signal });
      global.addEventListener(
        "blur",
        () => {
          clearStick();
          save(s);
        },
        { signal },
      );
      if (global.ResizeObserver) {
        s.observer = new ResizeObserver(() => resize(s));
        s.observer.observe(s.viewport);
      }
      resize(s);
      if (s.readOnly) notice(s, "原有角色資料無法讀取，已保留原始資料。");
      s.raf = requestAnimationFrame((t) => paint(s, t));
      return true;
    } catch (e) {
      if (active === s) leave();
      else
        try {
          s.renderer?.dispose();
        } catch (_) {}
      opts.onFallback?.("立體模式初始化失敗，已回到 2D。");
      return false;
    }
  }
  function setPeers(list) {
    const s = active;
    if (!s) return;
    const seen = new Set();
    for (const p of Array.isArray(list) ? list.slice(0, 3) : []) {
      if (
        typeof p.sessionId !== "string" ||
        p.sessionId.length > 100 ||
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.z) ||
        Math.abs(p.x) > 14 ||
        Math.abs(p.z) > 9
      )
        continue;
      seen.add(p.sessionId);
      let peer = s.peers.get(p.sessionId);
      const safeAppearance = appearance(p.appearance);
      const appearanceKey = JSON.stringify(safeAppearance);
      if (!peer) {
        const actor = person(s, safeAppearance);
        actor.position.set(p.x, 0, p.z);
        s.scene.add(actor);
        const label = document.createElement("span");
        label.className = "island3d-peer-label";
        q(".island3d-labels", s.root).append(label);
        peer = { actor, label, x: p.x, z: p.z, appearanceKey };
        s.peers.set(p.sessionId, peer);
      } else if (peer.appearanceKey !== appearanceKey) {
        const old = peer.actor;
        peer.actor = person(s, safeAppearance);
        peer.actor.position.copy(old.position);
        s.scene.add(peer.actor);
        s.scene.remove(old);
        old.traverse((o) => {
          o.geometry?.dispose();
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material?.dispose();
        });
        peer.appearanceKey = appearanceKey;
      }
      peer.label.textContent = `小夥伴 ${seen.size}`;
      peer.x = p.x;
      peer.z = p.z;
      peer.direction = ["up", "down", "left", "right"].includes(p.direction)
        ? p.direction
        : "down";
      const action = ["idle", "walk", "wave", "joy"].includes(p.action) ? p.action : "idle";
      if (peer.action !== action) {
        peer.action = action;
        peer.gestureUntil = ["wave", "joy"].includes(action) ? performance.now() + 1800 : 0;
      }
    }
    for (const [id, p] of s.peers)
      if (!seen.has(id)) {
        s.scene.remove(p.actor);
        p.actor.traverse((o) => {
          o.geometry?.dispose();
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material?.dispose();
        });
        p.label.remove();
        s.peers.delete(id);
      }
  }
  function leave() {
    const s = active;
    if (!s) return;
    active = null;
    cancelAnimationFrame(s.raf);
    clearTimeout(s.gestureTimer);
    s.abort.abort();
    s.observer?.disconnect();
    s.opts.stopSpeech?.();
    save(s);
    s.scene?.traverse((o) => {
      o.geometry?.dispose();
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else o.material?.dispose();
    });
    s.renderer?.dispose();
  }
  global.Island3D = Object.freeze({
    mount,
    leave,
    setPeers,
    setQuality,
    gesture,
    resetPlaza,
    getAppearance,
    refresh,
    moveTo,
    snapshot,
  });
})(globalThis);
