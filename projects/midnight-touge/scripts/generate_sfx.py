#!/usr/bin/env python3
"""
Generate realistic mechanical SFX for Midnight Touge:
- tyre_squeal (asphalt friction / rubber tear)
- turbo_bov (compressor surge & wastegate blowoff)
- gear_shift (heavy mechanical dog-ring clunk)
- wall_scrape (guardrail metallic grinding & sparks)
- countdown_beep & countdown_go
- menu_click & drift_award
"""
import os
import subprocess
import numpy as np

SR = 44100

def save_wav_and_mp3(samples, name):
    wav_path = f"assets/audio/{name}.wav"
    mp3_path = f"assets/audio/{name}.mp3"
    ogg_path = f"assets/audio/{name}.ogg"

    # Normalize to -1.0 dB
    peak = np.max(np.abs(samples))
    if peak > 0:
        samples = samples / peak * 0.89

    int_samples = (samples * 32767).astype(np.int16)
    import wave
    with wave.open(wav_path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(int_samples.tobytes())

    # Encode to mp3 & ogg
    subprocess.run(["ffmpeg", "-y", "-i", wav_path, "-b:a", "128k", mp3_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    subprocess.run(["ffmpeg", "-y", "-i", wav_path, "-c:a", "libvorbis", "-q:a", "4", ogg_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    os.remove(wav_path)
    print(f"Generated {name}.mp3 and .ogg")

def gen_tyre_squeal():
    # 1.5s loopable tyre squeal (dual resonant formant noise + harmonic whine)
    dur = 1.6
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    # Band-limited noise modulated around 850Hz and 1250Hz
    noise = np.random.uniform(-1, 1, len(t))
    # Frequency modulation with slight jitter
    f1 = 820 + 40 * np.sin(2 * np.pi * 7 * t) + 20 * np.random.randn(len(t))
    f2 = 1280 + 60 * np.sin(2 * np.pi * 11 * t)
    squeal = 0.5 * np.sin(2 * np.pi * f1 * t) + 0.3 * np.sin(2 * np.pi * f2 * t)
    # Add scratchy noise burst
    grain = noise * (0.3 + 0.1 * np.sin(2 * np.pi * 33 * t))
    total = (squeal + grain)
    # Envelope: gentle attack, sustain, gentle release
    env = np.ones_like(t)
    fade = int(SR * 0.1)
    env[:fade] = np.linspace(0, 1, fade)
    env[-fade:] = np.linspace(1, 0, fade)
    save_wav_and_mp3(total * env, "tyre_squeal")

def gen_turbo_bov():
    # 0.8s compressor surge / flutter "stututu"
    dur = 0.85
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    # Rapid pressure pulses: 18 Hz fluttering
    pulses = np.exp(-4 * t) * (1.0 + 0.8 * np.sin(2 * np.pi * 19 * t))
    noise = np.random.randn(len(t))
    # Resonant air hiss that drops in pitch
    pitch_sweep = 2400 * np.exp(-3.5 * t) + 400
    air = np.sin(2 * np.pi * pitch_sweep * t) * 0.4 + noise * 0.6
    total = air * pulses
    save_wav_and_mp3(total, "turbo_bov")

def gen_gear_shift():
    # 0.25s mechanical dog-box clunk
    dur = 0.25
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    clunk = np.sin(2 * np.pi * 130 * np.exp(-15 * t) * t) * np.exp(-22 * t)
    click = np.random.randn(len(t)) * np.exp(-60 * t) * 0.6
    total = clunk + click
    save_wav_and_mp3(total, "gear_shift")

def gen_wall_scrape():
    # 0.6s guardrail metal grating
    dur = 0.65
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    grate = np.random.uniform(-1, 1, len(t))
    # Metallic ringing frequencies: 1750 Hz & 3200 Hz
    ring = 0.4 * np.sin(2 * np.pi * 1750 * t) + 0.3 * np.sin(2 * np.pi * 3200 * t)
    env = np.exp(-3 * t)
    total = (grate * 0.7 + ring * 0.5) * env
    save_wav_and_mp3(total, "wall_scrape")

def gen_beeps():
    # Low beep for 3, 2, 1
    t = np.linspace(0, 0.18, int(SR * 0.18), endpoint=False)
    beep = np.sin(2 * np.pi * 440 * t) * np.exp(-8 * t)
    save_wav_and_mp3(beep, "countdown_beep")

    # High beep for GO!
    t_go = np.linspace(0, 0.45, int(SR * 0.45), endpoint=False)
    beep_go = np.sin(2 * np.pi * 880 * t_go) * np.exp(-5 * t_go)
    save_wav_and_mp3(beep_go, "countdown_go")

def gen_ui():
    t = np.linspace(0, 0.08, int(SR * 0.08), endpoint=False)
    click = (np.sin(2 * np.pi * 1200 * t) + np.random.randn(len(t)) * 0.2) * np.exp(-40 * t)
    save_wav_and_mp3(click, "menu_click")

    # Drift chime
    t_d = np.linspace(0, 0.35, int(SR * 0.35), endpoint=False)
    chime = (np.sin(2 * np.pi * 1046.5 * t_d) + 0.5 * np.sin(2 * np.pi * 2093 * t_d)) * np.exp(-7 * t_d)
    save_wav_and_mp3(chime, "drift_award")

if __name__ == "__main__":
    gen_tyre_squeal()
    gen_turbo_bov()
    gen_gear_shift()
    gen_wall_scrape()
    gen_beeps()
    gen_ui()
    print("All SFX successfully generated!")
