"use strict";
const assert = require("node:assert/strict");
const world = require("../public/src/island-world-3d.js");
const old = require("../public/src/island-world.js");
const rideIds = ["carousel", "coaster", "ferris", "bumper", "pirate", "train"];
assert.deepEqual(
  world.entrances
    .filter((e) => e.kind === "ride")
    .map((e) => e.id)
    .sort(),
  [...rideIds].sort(),
);
assert.equal(
  old.entrances.filter((e) => e.kind === "ride").length,
  2,
  "2D entrances unchanged",
);
const learning = [
  ["phonetic", "learnView"],
  ["forest", "spellView"],
  ["picture", "wordView"],
];
for (const [id, view] of learning) {
  const destination = world.entrances.find((e) => e.id === id);
  assert(destination && destination.view === view, `${id} learning route exists`);
  for (const other of world.entrances.filter((e) => e.id !== id)) {
    assert(world.findPath(destination, other).length > 0, `${id} to ${other.id} is reachable`);
  }
}
assert(world.isWalkable(world.spawn.x, world.spawn.y));
assert(!world.isWalkable(520, 420), "fountain blocks the player");
for (const e of world.entrances) {
  assert(world.isWalkable(e.x, e.y), `${e.id} entrance is walkable`);
  const route = world.findPath(world.spawn, e);
  assert(route.length, `${e.id} has a path`);
  let previous = world.spawn;
  for (const point of route) {
    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(point.x - previous.x, point.y - previous.y) / 4),
    );
    for (let i = 0; i <= steps; i++)
      assert(
        world.isWalkable(
          previous.x + ((point.x - previous.x) * i) / steps,
          previous.y + ((point.y - previous.y) * i) / steps,
        ),
        `${e.id} route crosses an obstacle`,
      );
    previous = point;
  }
}
for (const npc of world.npcWaypoints)
  for (const p of npc.points)
    assert(world.isWalkable(p.x, p.y), `${npc.id} waypoint walkable`);
for (const o of world.obstacles) {
  const start = world.safePosition({ x: o.x - 30, y: o.y + o.h / 2 }),
    after = world.move(start, o.w + 100, 0);
  assert(
    world.isWalkable(after.x, after.y),
    `${o.id} movement remains walkable`,
  );
}
console.log(
  "PASS IslandWorld3D: six rides, 11 reachable entrances including three learning areas, safe sampled paths and 2D isolation",
);
