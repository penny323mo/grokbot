import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRain, smgLine, SMG } from '../js/rain.js';
import { applyParts, busSourceParts, partsHaveLinks, smgSourceParts, walkSourceParts } from '../js/sources.js';
import { renderProfile } from '../js/profile.js';

test('SMG stays unavailable without claiming the service is down, and rain copy is not a safety promise', () => {
  assert.equal(SMG.status, 'unavailable');
  assert.equal(SMG.reason, 'no_cors');
  assert.equal(SMG.probe.directoryHttp, 200);
  assert.equal(SMG.probe.accessControlAllowOrigin, null);
  const line = smgLine();
  assert.match(line.text, /HTTP 200/);
  assert.match(line.text, /CORS/);
  assert.equal(line.href, 'https://xml.smg.gov.mo/');
  assert.doesNotMatch(line.text, /停咗|氣溫\s*\d|濕滑|安全|危險/);

  const wet = parseRain({
    minutely_15: {
      time: ['2026-11-17T10:00', '2026-11-17T10:15'],
      precipitation: [0.4, 0.2]
    }
  });
  assert.equal(wet.show, true);
  assert.equal(wet.official, false);
  assert.match(wet.message, /Open-Meteo/);
  assert.doesNotMatch(wet.message, /濕滑|安全|危險|應該搭/);

  const dry = parseRain({
    minutely_15: {
      time: ['2026-11-17T10:00'],
      precipitation: [0]
    }
  });
  assert.equal(dry.show, false);

  const missing = parseRain(null);
  assert.equal(missing.available, false);
  assert.match(missing.note, /讀唔到/);
});

test('source lines keep hyperlinks, including after a DOM rewrite', () => {
  const walk = walkSourceParts({
    provider: 'valhalla',
    sourceUrl: 'https://valhalla1.openstreetmap.de',
    provenance: { retrievedAt: Date.parse('2026-11-17T10:05:00+08:00'), freshness: 'stale', observedAt: null }
  });
  const bus = busSourceParts({
    provenance: { retrievedAt: '2026-11-16T01:01:58+08:00', freshness: 'dated' }
  });
  const smg = smgSourceParts(smgLine());
  assert.equal(partsHaveLinks(walk), true);
  assert.equal(partsHaveLinks(bus), true);
  assert.equal(partsHaveLinks(smg), true);
  assert.ok(walk.some((p) => p.href === 'https://www.openstreetmap.org/copyright'));
  assert.ok(bus.some((p) => p.href === 'https://bis.dsat.gov.mo/macauweb/'));
  assert.match(walk.map((p) => p.text).join(''), /過時/);
  assert.match(bus.map((p) => p.text).join(''), /唔係即時到站/);

  const parent = fakeParent();
  applyParts(fakeDoc(), parent, walk);
  const link = parent.childNodes.find((n) => n.tag === 'a');
  assert.equal(link.href, 'https://www.openstreetmap.org/copyright');
  assert.equal(link.textContent, 'OpenStreetMap');
});

test('elevation profile needs route samples and does not accept two endpoint heights', () => {
  const thin = renderProfile({ ok: true, elevationSamples: [14, 75] });
  assert.equal(thin.available, false);
  assert.equal(thin.svg, '');

  const drawn = renderProfile({
    ok: true,
    role: 'flatter',
    elevationSamples: [14, 20, 28, 40, 55]
  });
  assert.equal(drawn.available, true);
  assert.match(drawn.svg, /<path/);
  assert.match(drawn.label, /唔係官方高程/);
  assert.doesNotMatch(drawn.svg, /分鐘/);
});

function fakeDoc() {
  return {
    createElement() {
      const node = { tag: 'a', href: '', textContent: '', childNodes: [] };
      node.appendChild = (child) => { node.childNodes.push(child); };
      return node;
    },
    createTextNode(text) {
      return { type: 'text', text };
    }
  };
}

function fakeParent() {
  return {
    childNodes: [],
    replaceChildren() { this.childNodes = []; },
    appendChild(node) { this.childNodes.push(node); }
  };
}
