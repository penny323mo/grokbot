/** Audio toggles: independent music/SFX, return ON state, persist to localStorage, mute gains. */
import assert from 'node:assert';
import test from 'node:test';

const store = {};
globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } };
class FakeAudio { constructor(src) { this.src = src; this.volume = 1; this.paused = true; } play() { this.paused = false; return Promise.resolve(); } pause() { this.paused = true; } }
globalThis.Audio = FakeAudio;
class FakeGain { constructor() { this.gain = { value: 1 }; } connect() {} }
class FakeCtx { constructor() { this.state = 'suspended'; this.destination = {}; } createGain() { return new FakeGain(); } resume() { this.state = 'running'; } createBuffer() { return {}; } createBufferSource() { return { connect() {}, start() {} }; } }
globalThis.window = { AudioContext: FakeCtx };
const { SoundEngine } = await import('../js/audio.js');

test('unlock resumes context and starts music', () => {
  const s = new SoundEngine();
  s.unlock();
  assert.equal(s.ctx.state, 'running');
  assert.ok(s.bgmAudio && !s.bgmAudio.paused);
});

test('toggles are independent, return ON state, mute gain/element, persist', () => {
  const s = new SoundEngine();
  s.unlock();
  assert.equal(s.toggleMusic(), false);
  assert.equal(s.musicGain.gain.value, 0);
  assert.ok(s.bgmAudio.paused);
  assert.equal(s.sfxOn, true);
  assert.ok(s.sfxGain.gain.value > 0);
  assert.equal(s.toggleSfx(), false);
  assert.equal(s.sfxGain.gain.value, 0);
  assert.deepEqual(JSON.parse(store.lantern_watch_audio_settings), { musicMuted: true, sfxMuted: true });
  const s2 = new SoundEngine();
  assert.equal(s2.musicOn, false); assert.equal(s2.sfxOn, false);
  assert.equal(s2.toggleMusic(), true);
  assert.ok(s2.bgmAudio && !s2.bgmAudio.paused, 'turning music on starts playback even if never started');
  assert.ok(s2.musicGain.gain.value > 0);
});

test('battle scene plays battle-bgm (cache-busted), other screens go back to town track', () => {
  store.lantern_watch_audio_settings = JSON.stringify({ musicMuted: false, sfxMuted: false });
  const s = new SoundEngine();
  s.setScene('battle');            // before unlock: only remembered
  assert.equal(s.bgmAudio, null);
  s.unlock();
  assert.match(s.bgmAudio.src, /assets\/audio\/battle-bgm\.mp3\?v=/);
  assert.ok(!s.bgmAudio.paused && s.bgmAudio.loop);
  s.setScene('town');
  assert.match(s.bgmAudio.src, /bgm_town\.mp3/);
  s.setScene('battle');
  assert.match(s.bgmAudio.src, /battle-bgm\.mp3/);
  assert.equal(s.toggleMusic(), false);
  s.setScene('town');              // scene change while muted: no playback
  assert.equal(s.bgmAudio, null);
  assert.equal(s.toggleMusic(), true);
  assert.match(s.bgmAudio.src, /bgm_town\.mp3/);
});
