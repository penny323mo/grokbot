import os
import subprocess
import math
import wave
import struct
import random
import pretty_midi

AUDIO_DIR = "/workspace/nightly/2026-10-28-harbour-casebook/assets/audio"
SF2_PATH = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
os.makedirs(AUDIO_DIR, exist_ok=True)

def compose_investigation_midi(mid_path):
    pm = pretty_midi.PrettyMIDI(initial_tempo=64.0) # Slow, atmospheric noir 64 BPM
    bar_sec = 60.0 / 64.0 * 4.0 # 3.75s per bar. 26 bars = 97.5 seconds
    
    guzheng = pretty_midi.Instrument(program=107, name="Guzheng")
    erhu = pretty_midi.Instrument(program=110, name="Erhu")
    strings = pretty_midi.Instrument(program=48, name="Pad")
    piano = pretty_midi.Instrument(program=0, name="Piano")
    
    # 26 bars chord progression (Dm - Bb - Gm - A - Dm - C - Bb - A ...)
    chords = [
        [50, 57, 62, 65], # Dm
        [46, 53, 58, 62], # Bb
        [43, 50, 55, 58], # Gm
        [45, 52, 57, 64], # Asus4
        [50, 57, 62, 65], # Dm
        [46, 53, 58, 65], # Bb maj7
        [43, 50, 55, 62], # Gm7
        [45, 52, 57, 61], # A7
        [50, 57, 62, 65], # Dm
        [48, 55, 60, 64], # C
        [46, 53, 58, 62], # Bb
        [45, 52, 57, 64], # A
        [50, 57, 62, 65], # Dm
        [43, 50, 55, 58], # Gm
        [46, 53, 58, 62], # Bb
        [45, 52, 57, 61], # A7
        [50, 57, 62, 65], # Dm
        [46, 53, 58, 65], # Bb
        [48, 55, 60, 64], # C
        [50, 57, 62, 65], # Dm
        [43, 50, 55, 58], # Gm
        [46, 53, 58, 62], # Bb
        [45, 52, 57, 61], # A7
        [50, 57, 62, 65], # Dm
        [46, 53, 58, 62], # Bb
        [50, 57, 62, 65], # Dm final fade
    ]
    
    for i, chord in enumerate(chords):
        t_start = i * bar_sec
        t_end = (i + 1) * bar_sec
        for pitch in chord:
            strings.notes.append(pretty_midi.Note(velocity=42, pitch=pitch, start=t_start, end=t_end))
            
    # Piano low accents on downbeats
    for i in range(len(chords)):
        root = chords[i][0] - 12
        piano.notes.append(pretty_midi.Note(velocity=48, pitch=root, start=i * bar_sec, end=i * bar_sec + 2.5))
        
    # Guzheng delicate arpeggio figures throughout 26 bars
    guzheng_pattern = [
        (0.0, 62, 0.4, 65), (0.5, 65, 0.4, 60), (1.0, 69, 0.5, 70), (2.0, 74, 0.6, 75), (2.5, 72, 0.4, 60), (3.0, 69, 0.6, 68),
        (0.0, 58, 0.4, 65), (0.5, 62, 0.4, 60), (1.0, 65, 0.5, 70), (2.0, 70, 0.6, 75), (2.5, 69, 0.4, 60), (3.0, 65, 0.6, 68),
        (0.0, 55, 0.4, 65), (0.5, 58, 0.4, 60), (1.0, 62, 0.5, 70), (2.0, 67, 0.6, 75), (2.5, 65, 0.4, 60), (3.0, 62, 0.6, 68),
        (0.0, 57, 0.4, 65), (0.5, 61, 0.4, 60), (1.0, 64, 0.5, 70), (2.0, 69, 0.6, 75), (2.5, 67, 0.4, 60), (3.0, 64, 0.6, 68),
    ]
    for rep in range(7):
        offset = rep * 4 * bar_sec
        if offset >= 26 * bar_sec: break
        for dt, p, dur, vel in guzheng_pattern:
            if offset + dt + dur <= 26 * bar_sec:
                pitch = p
                if rep in [2, 5] and p == 74: pitch = 77
                guzheng.notes.append(pretty_midi.Note(velocity=vel, pitch=pitch, start=offset + dt, end=offset + dt + dur))

    # Erhu expressive lead melody (noir, melancholy, long phrases across 97 seconds)
    erhu_melody = [
        # Phrase 1 (bars 0-8)
        (bar_sec * 0.8, bar_sec * 2.2, 69, 68), # A
        (bar_sec * 2.2, bar_sec * 3.4, 65, 72), # F
        (bar_sec * 3.4, bar_sec * 4.5, 67, 68), # G
        (bar_sec * 4.5, bar_sec * 6.0, 69, 75), # A
        (bar_sec * 6.0, bar_sec * 7.2, 74, 80), # D high
        (bar_sec * 7.2, bar_sec * 8.5, 72, 70), # C
        # Phrase 2 (bars 8-16)
        (bar_sec * 9.0, bar_sec * 10.5, 72, 72), # C
        (bar_sec * 10.5, bar_sec * 11.8, 74, 80), # D
        (bar_sec * 11.8, bar_sec * 13.0, 77, 85), # F high
        (bar_sec * 13.0, bar_sec * 14.5, 74, 76), # D
        (bar_sec * 14.5, bar_sec * 15.5, 69, 70), # A
        (bar_sec * 15.5, bar_sec * 16.8, 62, 65), # D low
        # Phrase 3 (bars 17-25)
        (bar_sec * 17.5, bar_sec * 18.8, 65, 70), # F
        (bar_sec * 18.8, bar_sec * 20.0, 67, 72), # G
        (bar_sec * 20.0, bar_sec * 21.5, 69, 76), # A
        (bar_sec * 21.5, bar_sec * 23.0, 72, 78), # C
        (bar_sec * 23.0, bar_sec * 24.5, 69, 72), # A
        (bar_sec * 24.5, bar_sec * 25.8, 62, 60), # D final fade
    ]
    for start, end, pitch, vel in erhu_melody:
        erhu.notes.append(pretty_midi.Note(velocity=vel, pitch=pitch, start=start, end=end))
        
    pm.instruments.extend([strings, guzheng, erhu, piano])
    pm.write(mid_path)

def compose_resolution_midi(mid_path):
    pm = pretty_midi.PrettyMIDI(initial_tempo=70.0) # Lyrical, vindicating 70 BPM
    bar_sec = 60.0 / 70.0 * 4.0 # ~3.43s per bar. 28 bars = 96.0 seconds
    
    strings = pretty_midi.Instrument(program=48, name="Strings")
    koto = pretty_midi.Instrument(program=107, name="Guzheng")
    flute = pretty_midi.Instrument(program=73, name="Flute")
    
    prog = [
        [50, 57, 62, 66], # D
        [43, 55, 59, 62], # G
        [47, 54, 59, 62], # Bm
        [45, 52, 57, 64], # A
        [50, 57, 62, 66], # D
        [43, 55, 59, 66], # G maj7
        [45, 52, 57, 64], # A
        [50, 57, 62, 69], # D add9
    ] * 4 # 32 bars, trim to 28
    prog = prog[:28]
    
    for i, chord in enumerate(prog):
        t_start = i * bar_sec
        t_end = (i + 1) * bar_sec
        for pitch in chord:
            strings.notes.append(pretty_midi.Note(velocity=48, pitch=pitch, start=t_start, end=t_end))
            
    # Uplifting flute melody across 96 seconds
    flute_notes = [
        # Theme A
        (0.5 * bar_sec, 1.8 * bar_sec, 74, 75), # D
        (1.8 * bar_sec, 2.8 * bar_sec, 78, 80), # F#
        (2.8 * bar_sec, 3.8 * bar_sec, 79, 85), # G
        (3.8 * bar_sec, 5.2 * bar_sec, 81, 88), # A
        (5.2 * bar_sec, 6.4 * bar_sec, 86, 92), # D high
        (6.4 * bar_sec, 7.5 * bar_sec, 81, 80), # A
        (7.5 * bar_sec, 8.8 * bar_sec, 74, 85), # D
        # Theme B (higher register)
        (9.5 * bar_sec, 10.8 * bar_sec, 78, 76), # F#
        (10.8 * bar_sec, 12.0 * bar_sec, 81, 82), # A
        (12.0 * bar_sec, 13.5 * bar_sec, 83, 86), # B
        (13.5 * bar_sec, 15.0 * bar_sec, 86, 92), # D high
        (15.0 * bar_sec, 16.5 * bar_sec, 88, 90), # E high
        (16.5 * bar_sec, 18.0 * bar_sec, 86, 85), # D high
        # Theme C (resolve & return)
        (19.0 * bar_sec, 20.5 * bar_sec, 81, 78), # A
        (20.5 * bar_sec, 22.0 * bar_sec, 79, 82), # G
        (22.0 * bar_sec, 23.5 * bar_sec, 78, 80), # F#
        (23.5 * bar_sec, 25.0 * bar_sec, 74, 85), # D
        (25.0 * bar_sec, 27.5 * bar_sec, 62, 70), # D low resolve
    ]
    for start, end, pitch, vel in flute_notes:
        flute.notes.append(pretty_midi.Note(velocity=vel, pitch=pitch, start=start, end=end))
        
    pm.instruments.extend([strings, koto, flute])
    pm.write(mid_path)

def render_tracks():
    # 1. Synthesize subtle harbour bed with sox (SPEC §5: synthesised water/wind with sox, very subtle)
    harbour_bed_wav = "/tmp/harbour_bed.wav"
    subprocess.run([
        "sox", "-n", "-r", "44100", "-c", "2", harbour_bed_wav,
        "synth", "98", "brownnoise", "band", "-n", "380", "220", "tremolo", "0.1", "35", "vol", "0.04"
    ], check=True)
    
    # 2. Render investigation with fluidsynth, then mix with harbour bed
    inv_mid = "/tmp/inv.mid"
    inv_music_wav = "/tmp/inv_music.wav"
    inv_mixed_wav = "/tmp/inv_mixed.wav"
    compose_investigation_midi(inv_mid)
    subprocess.run([
        "fluidsynth", "-ni", "-F", inv_music_wav, "-r", "44100", SF2_PATH, inv_mid
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # Mix music + subtle harbour bed with ffmpeg
    subprocess.run([
        "ffmpeg", "-y", "-i", inv_music_wav, "-i", harbour_bed_wav,
        "-filter_complex", "amix=inputs=2:duration=first:weights=1 0.4",
        inv_mixed_wav
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    subprocess.run([
        "ffmpeg", "-y", "-i", inv_mixed_wav, "-c:a", "libvorbis", "-q:a", "3", f"{AUDIO_DIR}/investigation.ogg"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run([
        "ffmpeg", "-y", "-i", inv_mixed_wav, "-c:a", "libmp3lame", "-q:a", "4", f"{AUDIO_DIR}/investigation.mp3"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 3. Render resolution (approx 96s)
    res_mid = "/tmp/res.mid"
    res_wav = "/tmp/res.wav"
    compose_resolution_midi(res_mid)
    subprocess.run([
        "fluidsynth", "-ni", "-F", res_wav, "-r", "44100", SF2_PATH, res_mid
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run([
        "ffmpeg", "-y", "-i", res_wav, "-c:a", "libvorbis", "-q:a", "3", f"{AUDIO_DIR}/resolution.ogg"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run([
        "ffmpeg", "-y", "-i", res_wav, "-c:a", "libmp3lame", "-q:a", "4", f"{AUDIO_DIR}/resolution.mp3"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print("Rendered investigation (97.5s with harbour bed) and resolution (96s) to OGG & MP3.")

if __name__ == '__main__':
    render_tracks()
