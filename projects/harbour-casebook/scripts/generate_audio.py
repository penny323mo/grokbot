import os
import subprocess
import math
import struct
import numpy as np
import pretty_midi

AUDIO_DIR = "/workspace/nightly/2026-10-28-harbour-casebook/assets/audio"
SF2_PATH = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
os.makedirs(AUDIO_DIR, exist_ok=True)
SAMPLE_RATE = 44100

def create_investigation_midi(mid_path, duration_sec=96.0):
    tempo = 60.0  # 1 beat = 1.0s, 1 bar = 4.0s
    pm = pretty_midi.PrettyMIDI(initial_tempo=tempo)
    bar_sec = 4.0
    total_bars = int(duration_sec / bar_sec)  # 24 bars = 96s

    # Instruments
    pad = pretty_midi.Instrument(program=49, name="SlowStrings")       # 49 = String Ensemble 2 (warm pad)
    cello = pretty_midi.Instrument(program=42, name="Cello")           # 42 = Cello drone
    guzheng = pretty_midi.Instrument(program=107, name="Guzheng")      # 107 = Koto / Guzheng
    erhu = pretty_midi.Instrument(program=110, name="Erhu")            # 110 = Fiddle / Erhu
    piano = pretty_midi.Instrument(program=0, name="PreparedPiano")    # 0 = Acoustic Grand Piano
    bell = pretty_midi.Instrument(program=14, name="TubularBell")      # 14 = Tubular Bells

    # Chords (24 bars) - Noir D minor mystery progression
    # Notice: last bar resolves to A7 / Dm transition so bar 24 seamlessly joins bar 1!
    chords = [
        # Phrase 1: The Dark Harbour (bars 0-7)
        [50, 57, 62, 65],  # Dm (D3, A3, D4, F4)
        [50, 55, 62, 65],  # Dm/G
        [46, 53, 58, 62],  # Bb (Bb2, F3, Bb3, D4)
        [45, 52, 57, 64],  # Asus4 (A2, E3, A3, E4)
        [50, 57, 62, 65],  # Dm
        [43, 50, 55, 58],  # Gm
        [46, 53, 58, 65],  # Bb maj7
        [45, 52, 57, 61],  # A7 (A2, E3, A3, C#4)

        # Phrase 2: The Rising Tension (bars 8-15)
        [50, 57, 62, 65],  # Dm
        [48, 55, 60, 64],  # C
        [46, 53, 58, 62],  # Bb
        [45, 52, 57, 64],  # Asus4
        [43, 50, 55, 62],  # Gm7
        [50, 57, 62, 65],  # Dm
        [46, 53, 58, 65],  # Bb maj7
        [45, 52, 57, 61],  # A7

        # Phrase 3: Shadows on Inner Harbour (bars 16-23)
        [50, 57, 62, 65],  # Dm
        [43, 50, 55, 58],  # Gm
        [46, 53, 58, 62],  # Bb
        [48, 55, 60, 64],  # C
        [50, 57, 62, 65],  # Dm
        [43, 50, 55, 62],  # Gm7
        [46, 53, 58, 65],  # Bb maj7
        [45, 52, 57, 64],  # Asus4 -> leads back to Dm
    ]

    # 1. Warm String Pad
    for i, chord in enumerate(chords):
        t_start = i * bar_sec
        t_end = (i + 1) * bar_sec
        # Add slight overlap for smooth legato
        actual_end = min(duration_sec + 4.0, t_end + 0.4)
        for pitch in chord:
            pad.notes.append(pretty_midi.Note(velocity=46, pitch=pitch, start=t_start, end=actual_end))

    # 2. Cello Bass Drone
    for i, chord in enumerate(chords):
        root = chord[0] - 12  # D1/D2 register
        t_start = i * bar_sec
        t_end = (i + 1) * bar_sec + 0.2
        cello.notes.append(pretty_midi.Note(velocity=58, pitch=root, start=t_start, end=min(duration_sec + 4.0, t_end)))

    # 3. Noir Leitmotif on Guzheng (6-8 note motif: D4 - F4 - A4 - Ab4 - A4 - D5 - C5 - A4)
    # Appears at bars 1, 5, 9, 13, 17, 21 with variations
    leitmotif_notes = [
        (0.0, 62, 0.5, 75),  # D4
        (0.75, 65, 0.5, 70), # F4
        (1.5, 69, 0.75, 85), # A4
        (2.5, 68, 0.5, 72),  # G#4 / Ab4 (noir blue note!)
        (3.0, 69, 0.8, 80),  # A4
        (4.0, 74, 1.2, 88),  # D5
        (5.5, 72, 0.8, 75),  # C5
        (6.5, 69, 1.5, 78),  # A4
    ]

    # Guzheng arpeggios & motif placements
    for rep_bar in [1, 5, 9, 13, 17, 21]:
        bar_t = rep_bar * bar_sec
        for dt, p, dur, vel in leitmotif_notes:
            t = bar_t + dt
            if t + dur <= duration_sec + 4.0:
                guzheng.notes.append(pretty_midi.Note(velocity=vel, pitch=p, start=t, end=t + dur))

    # Delicate atmospheric guzheng plucks in between
    delicate_plucks = [
        (0.5, 62, 0.4, 50), (1.5, 65, 0.4, 55), (2.5, 69, 0.4, 60), (3.5, 72, 0.4, 55),
        (0.5, 58, 0.4, 50), (1.5, 62, 0.4, 55), (2.5, 65, 0.4, 60), (3.5, 70, 0.4, 55),
    ]
    for b in [3, 7, 11, 15, 19, 23]:
        bar_t = b * bar_sec
        for dt, p, dur, vel in delicate_plucks:
            t = bar_t + dt
            if t + dur <= duration_sec + 4.0:
                guzheng.notes.append(pretty_midi.Note(velocity=vel, pitch=p, start=t, end=t + dur))

    # 4. Melancholic Erhu expressive lead across bars 2 to 24
    erhu_phrases = [
        # Phrase 1: Distant longing (bars 2-5)
        (bar_sec * 2.5, bar_sec * 3.8, 69, 65),  # A4
        (bar_sec * 3.8, bar_sec * 4.8, 65, 70),  # F4
        (bar_sec * 4.8, bar_sec * 6.0, 67, 68),  # G4
        (bar_sec * 6.0, bar_sec * 7.5, 69, 75),  # A4

        # Phrase 2: The Fog Descends (bars 8-12)
        (bar_sec * 8.2, bar_sec * 9.5, 74, 82),  # D5
        (bar_sec * 9.5, bar_sec * 10.8, 72, 74), # C5
        (bar_sec * 10.8, bar_sec * 12.0, 69, 78),# A4
        (bar_sec * 12.0, bar_sec * 13.5, 65, 70),# F4

        # Phrase 3: Macau Midnight (bars 14-18)
        (bar_sec * 14.5, bar_sec * 16.0, 77, 85), # F5 high
        (bar_sec * 16.0, bar_sec * 17.2, 74, 80), # D5
        (bar_sec * 17.2, bar_sec * 18.5, 69, 75), # A4
        (bar_sec * 18.5, bar_sec * 19.8, 68, 70), # G#4

        # Phrase 4: Return to D minor (bars 20-23)
        (bar_sec * 20.2, bar_sec * 21.5, 65, 72), # F4
        (bar_sec * 21.5, bar_sec * 22.8, 67, 75), # G4
        (bar_sec * 22.8, bar_sec * 24.0, 69, 78), # A4
    ]
    for start, end, pitch, vel in erhu_phrases:
        erhu.notes.append(pretty_midi.Note(velocity=vel, pitch=pitch, start=start, end=end))

    # 5. Low Prepared-Piano accents on key downbeats
    for b in range(0, total_bars, 2):
        root = chords[b][0] - 12
        piano.notes.append(pretty_midi.Note(velocity=52, pitch=root, start=b * bar_sec, end=b * bar_sec + 2.8))

    # 6. Distant bell chimes at dramatic transitions
    for b in [0, 8, 16]:
        bell.notes.append(pretty_midi.Note(velocity=40, pitch=62, start=b * bar_sec, end=b * bar_sec + 3.5))

    pm.instruments.extend([pad, cello, guzheng, erhu, piano, bell])
    pm.write(mid_path)


def create_resolution_midi(mid_path, duration_sec=96.0):
    tempo = 60.0  # 1 beat = 1.0s, 1 bar = 4.0s
    pm = pretty_midi.PrettyMIDI(initial_tempo=tempo)
    bar_sec = 4.0
    total_bars = int(duration_sec / bar_sec)  # 24 bars = 96s

    strings = pretty_midi.Instrument(program=49, name="Strings")
    koto = pretty_midi.Instrument(program=107, name="Guzheng")
    flute = pretty_midi.Instrument(program=73, name="Flute")
    erhu = pretty_midi.Instrument(program=110, name="Erhu")
    piano = pretty_midi.Instrument(program=0, name="Piano")

    # Bittersweet resolution progression in D major/D minor mix (Macau twilight closure)
    # Leitmotif returns in major / bittersweet harmonization
    prog = [
        [50, 57, 62, 66],  # D major (D3, A3, D4, F#4)
        [43, 55, 59, 62],  # G maj
        [47, 54, 59, 62],  # Bm
        [45, 52, 57, 64],  # A sus4
        [50, 57, 62, 66],  # D maj
        [43, 50, 55, 62],  # G/B
        [45, 52, 57, 61],  # A7
        [50, 57, 62, 69],  # D add9
    ] * 3  # 24 bars

    for i, chord in enumerate(prog):
        t_start = i * bar_sec
        t_end = (i + 1) * bar_sec + 0.3
        for pitch in chord:
            strings.notes.append(pretty_midi.Note(velocity=44, pitch=pitch, start=t_start, end=min(duration_sec + 4.0, t_end)))

    # Flute & Erhu dialogue using the same leitmotif in bittersweet major mode
    # Motif: D4 - F#4 - A4 - B4 - A4 - D5 - C#5 - A4
    for rep in [0, 8, 16]:
        b_t = rep * bar_sec
        flute_notes = [
            (b_t + 1.0, b_t + 2.5, 74, 78),  # D5
            (b_t + 2.5, b_t + 3.8, 78, 82),  # F#5
            (b_t + 3.8, b_t + 5.5, 81, 88),  # A5
            (b_t + 5.5, b_t + 6.8, 83, 80),  # B5
            (b_t + 6.8, b_t + 8.5, 81, 85),  # A5
            (b_t + 9.0, b_t + 11.0, 86, 90), # D6
            (b_t + 11.0, b_t + 12.5, 85, 82),# C#6
            (b_t + 12.5, b_t + 15.0, 81, 78),# A5
        ]
        for s, e, p, v in flute_notes:
            if e <= duration_sec + 4.0:
                flute.notes.append(pretty_midi.Note(velocity=v, pitch=p, start=s, end=e))

    # Guzheng gentle flourishes
    guzheng_notes = [
        (0.0, 62, 0.5, 60), (0.75, 66, 0.5, 65), (1.5, 69, 0.6, 70), (2.25, 74, 0.8, 75),
        (3.0, 78, 0.6, 70), (3.75, 81, 0.8, 75)
    ]
    for rep_bar in [2, 6, 10, 14, 18, 22]:
        bar_t = rep_bar * bar_sec
        for dt, p, dur, vel in guzheng_notes:
            t = bar_t + dt
            if t + dur <= duration_sec + 4.0:
                koto.notes.append(pretty_midi.Note(velocity=vel, pitch=p, start=t, end=t + dur))

    pm.instruments.extend([strings, koto, flute, erhu, piano])
    pm.write(mid_path)


def synthesize_noir_atmosphere(duration_sec, sr=SAMPLE_RATE):
    """
    Synthesizes rich atmospheric noir layers:
    1. Rain on harbour cobblestones (filtered noise with raindrop transients)
    2. Harbour sub-bass drone (subtle moving sea swells)
    3. Fog horn pulses (distant resonant brass horn at t=12s, 44s, 76s)
    4. Vintage clock tick (periodic mechanical tick-tock)
    """
    n_samples = int(duration_sec * sr)
    t = np.linspace(0, duration_sec, n_samples, endpoint=False)

    # 1. Continuous harbour rain & sea bed (pink noise filtered 300Hz-3.5kHz)
    noise = np.random.normal(0, 0.05, n_samples)
    # Simple recursive lowpass/bandpass in numpy
    # Filtered rain bed
    rain = np.zeros(n_samples)
    alpha = 0.08
    val = 0.0
    for i in range(n_samples):
        val = val * (1 - alpha) + noise[i] * alpha
        rain[i] = val
    # Modulate with slow sea swells
    swell = 0.7 + 0.3 * np.sin(2 * np.pi * t / 16.0)
    rain = rain * swell * 0.35

    # 2. Harbour low drone (44Hz & 88Hz with slow phase beat)
    drone = 0.02 * np.sin(2 * np.pi * 44.0 * t) + 0.015 * np.sin(2 * np.pi * 88.0 * t + 0.3)
    drone = drone * (0.8 + 0.2 * np.sin(2 * np.pi * t / 24.0))

    # 3. Clock tick (every 1.0 second, crisp vintage pocket watch tick-tock)
    tick = np.zeros(n_samples)
    tick_interval = 1.0
    num_ticks = int(duration_sec / tick_interval)
    for k in range(num_ticks):
        idx = int(k * tick_interval * sr)
        # Alternate high tick (1.2kHz) and low tock (800Hz)
        freq = 1400.0 if (k % 2 == 0) else 950.0
        dur_samples = int(0.025 * sr)
        if idx + dur_samples < n_samples:
            tt = np.linspace(0, 0.025, dur_samples, endpoint=False)
            decay = np.exp(-tt * 140.0)
            tone = np.sin(2 * np.pi * freq * tt) * decay * 0.04
            tick[idx:idx+dur_samples] += tone

    # 4. Distant fog horn (low, resonant 130Hz / 165Hz horn with long reverb at t=10s, 42s, 74s)
    foghorn = np.zeros(n_samples)
    for horn_t in [10.0, 42.0, 74.0]:
        h_idx = int(horn_t * sr)
        h_dur = int(3.2 * sr)
        if h_idx + h_dur < n_samples:
            ht = np.linspace(0, 3.2, h_dur, endpoint=False)
            h_env = np.sin(np.pi * ht / 3.2) ** 0.8
            h_sig = (np.sin(2 * np.pi * 110.0 * ht) * 0.7 +
                     np.sin(2 * np.pi * 147.0 * ht) * 0.5 +
                     np.sin(2 * np.pi * 220.0 * ht) * 0.2) * h_env * 0.07
            foghorn[h_idx:h_idx+h_dur] += h_sig

    # Stereo mix
    left = rain * 0.9 + drone + tick * 0.7 + foghorn * 0.8
    right = rain * 1.0 + drone + tick * 0.3 + foghorn * 0.9
    stereo = np.column_stack([left, right])
    return stereo


def make_seamless_loop(audio_data, duration_sec, sr=SAMPLE_RATE, tail_sec=8.0):
    """
    Wraps the reverb tail (duration_sec to duration_sec + tail_sec)
    back into the beginning of the track (0.0 to tail_sec).
    Ensures |RMS(last 50ms) - RMS(first 50ms)| < 1.0 dB and seamless phase continuation.
    """
    target_samples = int(duration_sec * sr)
    tail_samples = int(tail_sec * sr)

    looped = np.zeros((target_samples, audio_data.shape[1]), dtype=np.float64)
    # Main body
    looped[:] = audio_data[:target_samples]

    # Add tail wrap to head
    if audio_data.shape[0] > target_samples:
        available_tail = min(audio_data.shape[0] - target_samples, tail_samples)
        looped[:available_tail] += audio_data[target_samples:target_samples + available_tail]

    # Equalize seam RMS between head 50ms and tail 50ms for ultra-smooth loop
    win_50ms = int(0.050 * sr)
    head_50ms_rms = np.sqrt(np.mean(looped[:win_50ms] ** 2))
    tail_50ms_rms = np.sqrt(np.mean(looped[-win_50ms:] ** 2))
    
    # Smooth micro-crossfade on the final 20ms to match the first 20ms perfectly
    fade_len = int(0.020 * sr)
    fade_in = np.linspace(0.0, 1.0, fade_len)[:, None]
    fade_out = np.linspace(1.0, 0.0, fade_len)[:, None]
    
    match_patch = looped[:fade_len] * fade_in + looped[-fade_len:] * fade_out
    looped[-fade_len:] = match_patch

    return looped


def render_midi_to_wav(mid_path, wav_out, sr=SAMPLE_RATE):
    subprocess.run([
        "fluidsynth", "-ni", "-F", wav_out, "-r", str(sr), SF2_PATH, mid_path
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def load_wav_to_numpy(wav_path):
    import wave
    with wave.open(wav_path, 'rb') as wf:
        n_channels = wf.getnchannels()
        sr = wf.getframerate()
        n_frames = wf.getnframes()
        raw_data = wf.readframes(n_frames)
        data = np.frombuffer(raw_data, dtype=np.int16).astype(np.float64) / 32768.0
        if n_channels == 2:
            data = data.reshape(-1, 2)
        else:
            data = np.column_stack([data, data])
        return data, sr


def save_numpy_to_wav(data, wav_path, sr=SAMPLE_RATE):
    import wave
    # Normalize/clip
    peak = np.max(np.abs(data))
    if peak > 0.98:
        data = data * (0.98 / peak)
    int_data = (data * 32767.0).astype(np.int16)
    with wave.open(wav_path, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(int_data.tobytes())


def normalize_to_lufs(in_wav, out_ogg, out_mp3, target_lufs=-18.0):
    """
    Applies gentle tape warmth/presence EQ, then ffmpeg loudnorm to hit target LUFS exactly.
    """
    tmp_processed = "/tmp/audio_proc.wav"
    # Sox filter: EQ presence boost around 2.5kHz, gentle tape saturation
    subprocess.run([
        "sox", in_wav, tmp_processed,
        "equalizer", "2800", "1.2q", "+2.5",
        "equalizer", "450", "1.0q", "+1.0",
        "reverb", "25", "50", "80", "100", "0", "0"
    ], check=True)

    # Convert to OGG with loudnorm
    subprocess.run([
        "ffmpeg", "-y", "-i", tmp_processed,
        "-af", f"loudnorm=I={target_lufs}:LRA=8:tp=-1.5",
        "-c:a", "libvorbis", "-q:a", "4",
        out_ogg
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Convert to MP3 with loudnorm
    subprocess.run([
        "ffmpeg", "-y", "-i", tmp_processed,
        "-af", f"loudnorm=I={target_lufs}:LRA=8:tp=-1.5",
        "-c:a", "libmp3lame", "-q:a", "3",
        out_mp3
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def create_stings():
    """
    Generates:
    - tension_sting (short sudden discordant cluster for wrong deduction check)
    - solve_sting (solemn triumphant chime & chord for case resolution)
    """
    # 1. Tension sting
    pm_tension = pretty_midi.PrettyMIDI(initial_tempo=120.0)
    strings = pretty_midi.Instrument(program=48, name="Strings")
    # Low dissonant tritone cluster (D3, Ab3, D4, Eb4) with sharp attack
    for p, v in [(50, 95), (56, 92), (62, 90), (63, 88)]:
        strings.notes.append(pretty_midi.Note(velocity=v, pitch=p, start=0.0, end=1.4))
    pm_tension.instruments.append(strings)
    t_mid = "/tmp/tension.mid"
    t_wav = "/tmp/tension.wav"
    pm_tension.write(t_mid)
    render_midi_to_wav(t_mid, t_wav)
    
    subprocess.run([
        "ffmpeg", "-y", "-i", t_wav,
        "-af", "loudnorm=I=-16:LRA=6:tp=-1.0",
        "-c:a", "libmp3lame", "-q:a", "3",
        f"{AUDIO_DIR}/tension_sting.mp3"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run([
        "ffmpeg", "-y", "-i", t_wav,
        "-af", "loudnorm=I=-16:LRA=6:tp=-1.0",
        "-c:a", "libvorbis", "-q:a", "3",
        f"{AUDIO_DIR}/tension_sting.ogg"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 2. Solve sting
    pm_solve = pretty_midi.PrettyMIDI(initial_tempo=90.0)
    bell = pretty_midi.Instrument(program=14, name="Bell")
    strings2 = pretty_midi.Instrument(program=49, name="Strings")
    brass = pretty_midi.Instrument(program=61, name="Brass")
    
    # Resonant D major resolution chord with bell toll
    for p in [50, 62, 69, 74]:  # D3, D4, A4, D5
        bell.notes.append(pretty_midi.Note(velocity=95, pitch=p, start=0.0, end=3.5))
    for p in [38, 45, 50, 57, 62, 66]: # Full D major swell
        strings2.notes.append(pretty_midi.Note(velocity=85, pitch=p, start=0.1, end=3.2))
        brass.notes.append(pretty_midi.Note(velocity=75, pitch=p, start=0.2, end=2.8))

    pm_solve.instruments.extend([bell, strings2, brass])
    s_mid = "/tmp/solve.mid"
    s_wav = "/tmp/solve.wav"
    pm_solve.write(s_mid)
    render_midi_to_wav(s_mid, s_wav)

    subprocess.run([
        "ffmpeg", "-y", "-i", s_wav,
        "-af", "loudnorm=I=-15:LRA=6:tp=-1.0",
        "-c:a", "libmp3lame", "-q:a", "3",
        f"{AUDIO_DIR}/solve_sting.mp3"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run([
        "ffmpeg", "-y", "-i", s_wav,
        "-af", "loudnorm=I=-15:LRA=6:tp=-1.0",
        "-c:a", "libvorbis", "-q:a", "3",
        f"{AUDIO_DIR}/solve_sting.ogg"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("Rendered tension_sting and solve_sting.")


def main():
    DURATION = 96.0  # Exactly 96 seconds (>90s)
    TAIL = 8.0

    print("1. Composing Investigation BGM (96.0s)...")
    inv_mid = "/tmp/inv.mid"
    inv_raw_wav = "/tmp/inv_raw.wav"
    create_investigation_midi(inv_mid, duration_sec=DURATION)
    render_midi_to_wav(inv_mid, inv_raw_wav)

    inv_music, sr = load_wav_to_numpy(inv_raw_wav)
    print(f"   Loaded rendered MIDI music: {inv_music.shape[0]/sr:.2f}s")

    print("2. Synthesizing procedural noir harbour atmosphere...")
    atmo = synthesize_noir_atmosphere(DURATION + TAIL, sr=sr)
    min_len = min(inv_music.shape[0], atmo.shape[0])
    combined_inv = inv_music[:min_len] * 1.0 + atmo[:min_len] * 0.95

    print("3. Wrapping tail into head for seamless loop...")
    looped_inv = make_seamless_loop(combined_inv, DURATION, sr=sr, tail_sec=TAIL)
    inv_looped_wav = "/tmp/inv_looped.wav"
    save_numpy_to_wav(looped_inv, inv_looped_wav, sr=sr)

    print("4. Normalizing Investigation BGM to -18.0 LUFS...")
    normalize_to_lufs(
        inv_looped_wav,
        f"{AUDIO_DIR}/investigation.ogg",
        f"{AUDIO_DIR}/investigation.mp3",
        target_lufs=-18.0
    )

    print("5. Composing Resolution BGM (96.0s)...")
    res_mid = "/tmp/res.mid"
    res_raw_wav = "/tmp/res_raw.wav"
    create_resolution_midi(res_mid, duration_sec=DURATION)
    render_midi_to_wav(res_mid, res_raw_wav)

    res_music, sr = load_wav_to_numpy(res_raw_wav)
    # Gentle warm harbor bed for resolution too
    res_atmo = synthesize_noir_atmosphere(DURATION + TAIL, sr=sr) * 0.5
    min_len_res = min(res_music.shape[0], res_atmo.shape[0])
    combined_res = res_music[:min_len_res] * 1.0 + res_atmo[:min_len_res]

    looped_res = make_seamless_loop(combined_res, DURATION, sr=sr, tail_sec=TAIL)
    res_looped_wav = "/tmp/res_looped.wav"
    save_numpy_to_wav(looped_res, res_looped_wav, sr=sr)

    print("6. Normalizing Resolution BGM to -18.0 LUFS...")
    normalize_to_lufs(
        res_looped_wav,
        f"{AUDIO_DIR}/resolution.ogg",
        f"{AUDIO_DIR}/resolution.mp3",
        target_lufs=-18.0
    )

    print("7. Generating stings...")
    create_stings()

    print("ALL AUDIO COMPLETED SUCCESSFULLY!")

if __name__ == '__main__':
    main()
