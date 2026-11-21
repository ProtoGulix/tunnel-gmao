import test from 'node:test';
import assert from 'node:assert/strict';
import { sparklinePoints, stackShares, smoothPath, segmentDisplay } from './miniSeries.js';

test('mini-courbe : une série d\'un seul point n\'a pas de courbe', () => {
  assert.equal(sparklinePoints([12], 100, 20), null);
  assert.equal(sparklinePoints([null, 12, null], 100, 20), null);
  assert.equal(sparklinePoints([], 100, 20), null);
});

test('mini-courbe : extrémités sur les bords, plus haut = plus haut à l\'écran', () => {
  const pts = sparklinePoints([0, 10, 5], 100, 20, 0);
  assert.deepEqual(pts[0], { x: 0, y: 20 });
  assert.deepEqual(pts[1], { x: 50, y: 0 });
  assert.deepEqual(pts[2], { x: 100, y: 10 });
});

test('mini-courbe : un mois vide est sauté sans décaler les autres', () => {
  const pts = sparklinePoints([1, null, 3], 100, 20, 0);
  assert.equal(pts.length, 2);
  assert.equal(pts[1].x, 100);
});

test('mini-courbe : série plate au milieu de la hauteur', () => {
  const pts = sparklinePoints([4, 4, 4], 100, 20, 2);
  assert.ok(pts.every((p) => p.y === 10));
});

test('barre empilée : parts en % du total', () => {
  const parts = stackShares([{ key: 'a', value: 25 }, { key: 'b', value: 75 }], 100);
  assert.deepEqual(parts.map((p) => p.share), [25, 75]);
});

test('barre empilée : total nul, aucune part', () => {
  const parts = stackShares([{ key: 'a', value: 0 }], 0);
  assert.equal(parts[0].share, 0);
});

test('barre empilée : somme supérieure au total, la barre ne déborde pas', () => {
  const parts = stackShares([{ key: 'a', value: 60 }, { key: 'b', value: 60 }], 100);
  assert.equal(parts[0].share + parts[1].share, 100);
});

test('barre empilée : valeur absente comptée comme 0', () => {
  const parts = stackShares([{ key: 'a' }, { key: 'b', value: 50 }], 50);
  assert.deepEqual(parts.map((p) => p.share), [0, 100]);
});

test('courbe lissée : passe par les points, moins de deux points = vide', () => {
  assert.equal(smoothPath([{ x: 0, y: 0 }]), '');
  const d = smoothPath([{ x: 0, y: 20 }, { x: 50, y: 0 }, { x: 100, y: 10 }]);
  assert.ok(d.startsWith('M0,20 C'));
  assert.ok(d.includes('50,0') && d.endsWith('100,10'));
});

test('courbe lissée : sans dépassement, extremum et palier à plat', () => {
  // y minimal au milieu : les points de contrôle ne descendent pas sous cette valeur
  const d = smoothPath([{ x: 0, y: 10 }, { x: 50, y: 0 }, { x: 100, y: 10 }]);
  const ys = d.match(/-?\d+(\.\d+)?,(-?\d+(\.\d+)?)/g).map((c) => Number(c.split(',')[1]));
  assert.ok(ys.every((y) => y >= 0 && y <= 10));
  // série plate : tout reste sur la même ordonnée
  const flat = smoothPath([{ x: 0, y: 5 }, { x: 50, y: 5 }, { x: 100, y: 5 }]);
  assert.ok(flat.match(/,(-?\d+(\.\d+)?)/g).every((c) => c === ',5'));
});

test('segment de barre : détail, part seule ou rien selon la largeur', () => {
  assert.equal(segmentDisplay(60), 'full');
  assert.equal(segmentDisplay(10), 'share');
  assert.equal(segmentDisplay(2), 'none');
});
