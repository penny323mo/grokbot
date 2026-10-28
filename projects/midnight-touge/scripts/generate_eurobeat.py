#!/usr/bin/env python3
"""
Original 155 BPM Eurobeat Soundtrack Generator: "Kirine Drift (霧嶺疾走)"
Composed with pretty_midi and synthesized with FluidSynth + FluidR3_GM.
"""
import os
import subprocess
import numpy as np
import pretty_midi

BPM = 155.0
BEAT = 60.0 / BPM       # ~0.3871 s
BAR = BEAT * 4          # ~1.5484 s
SIXTEENTH = BEAT / 4    # ~0.0968 s

# Chord Progression in D Minor:
# Dm -> Bb -> C -> Am (Classic Super Eurobeat vi - IV - V - iii progression)
# Roots: D3 (50), Bb2 (46), C3 (48), A2 (45)
CHORDS = [
    # Dm
    {"root": 50, "notes": [50, 53, 57, 62]},
    {"root": 50, "notes": [50, 53, 57, 62]},
    # Bb
    {"root": 46, "notes": [46, 50, 53, 58]},
    {"root": 46, "notes": [46, 50, 53, 58]},
    # C
    {"root": 48, "notes": [48, 52, 55, 60]},
    {"root": 48, "notes": [48, 52, 55, 60]},
    # Am
    {"root": 45, "notes": [45, 48, 52, 57]},
    {"root": 47, "notes": [47, 50, 53, 57]},  # turn around (or A7 / C#dim)
]

def create_eurobeat_midi(filename="eurobeat_kirine.mid", total_bars=48):
    pm = pretty_midi.PrettyMIDI(initial_tempo=BPM)

    # 1. Drums (Channel 10)
    drums = pretty_midi.Instrument(program=0, is_drum=True, name="Eurobeat Drums")
    
    # 2. Bass (Synth Bass 1 - Program 38)
    bass = pretty_midi.Instrument(program=38, name="Eurobeat Gallop Bass")
    
    # 3. Synth Brass Stabs (Program 62)
    brass = pretty_midi.Instrument(program=62, name="Eurobeat Brass Stabs")
    
    # 4. Lead Synth (Saw Lead - Program 81)
    lead = pretty_midi.Instrument(program=81, name="Soaring Saw Lead")
    
    # 5. Fast Arpeggio (Square Lead / Crystal - Program 80 or 98)
    arp = pretty_midi.Instrument(program=80, name="Eurobeat Arpeggiator")

    # Drum MIDI notes:
    # 36: Bass Drum 1
    # 38: Acoustic Snare, 40: Electric Snare
    # 42: Closed Hi-Hat, 46: Open Hi-Hat
    # 49: Crash Cymbal 1, 51: Ride Cymbal

    # Construct the song bar by bar
    for b in range(total_bars):
        bar_start = b * BAR
        chord_idx = b % len(CHORDS)
        chord = CHORDS[chord_idx]
        root = chord["root"]
        triad = chord["notes"]

        is_intro = b < 8
        is_break = 24 <= b < 28

        # --- DRUMS ---
        # Crash on bar 0, 8, 24, 28, 40
        if b in [0, 8, 28, 40]:
            drums.notes.append(pretty_midi.Note(velocity=115, pitch=49, start=bar_start, end=bar_start + BEAT))

        # Four-on-the-floor Kick
        for step in range(4):
            t_kick = bar_start + step * BEAT
            drums.notes.append(pretty_midi.Note(velocity=118, pitch=36, start=t_kick, end=t_kick + 0.15))

        # Snare on 2 and 4 (except intro first 4 bars)
        if b >= 4 and not is_break:
            for step in [1, 3]:
                t_snare = bar_start + step * BEAT
                drums.notes.append(pretty_midi.Note(velocity=112, pitch=40, start=t_snare, end=t_snare + 0.15))

        # 16th-note Hi-Hats: alternating closed and accented open on off-beats
        for step in range(16):
            t_hat = bar_start + step * SIXTEENTH
            if step % 2 == 1:
                # Open hi-hat on upbeat
                drums.notes.append(pretty_midi.Note(velocity=95, pitch=46, start=t_hat, end=t_hat + SIXTEENTH * 0.9))
            else:
                drums.notes.append(pretty_midi.Note(velocity=75, pitch=42, start=t_hat, end=t_hat + SIXTEENTH * 0.7))

        # --- BASS (Classic 16th-note octaves) ---
        for step in range(16):
            t_b = bar_start + step * SIXTEENTH
            # Accent rhythm: root on 0, 3, 6, 8, 10, 12, 14
            octave_shift = 12 if (step % 2 == 1) else 0
            vel = 110 if step in [0, 4, 8, 12] else 90
            bass.notes.append(pretty_midi.Note(velocity=vel, pitch=root + octave_shift - 12, start=t_b, end=t_b + SIXTEENTH * 0.85))

        # --- BRASS STABS ---
        # Punchy syncopated off-beat hits (beats: 1.5, 2.5, 3.5, 4)
        stab_steps = [2, 6, 10, 14] if (b % 2 == 0) else [2, 5, 8, 12]
        for s in stab_steps:
            t_stab = bar_start + s * SIXTEENTH
            for n in triad:
                brass.notes.append(pretty_midi.Note(velocity=100, pitch=n + 12, start=t_stab, end=t_stab + SIXTEENTH * 1.4))

        # --- ARPEGGIO ---
        # Rapid 16th rolling arp
        for step in range(16):
            t_arp = bar_start + step * SIXTEENTH
            note_pick = triad[step % len(triad)] + 12
            arp.notes.append(pretty_midi.Note(velocity=78, pitch=note_pick, start=t_arp, end=t_arp + SIXTEENTH * 0.8))

        # --- LEAD SYNTH MELODY ---
        # Fast soaring melody in D minor
        # Intro melody (bars 0-7)
        if b < 8:
            lead_riff = [
                (0, 74, 2), (2, 72, 2), (4, 74, 4),
                (8, 77, 2), (10, 76, 2), (12, 74, 4)
            ] if b % 2 == 0 else [
                (0, 72, 2), (2, 70, 2), (4, 72, 4),
                (8, 69, 2), (10, 70, 2), (12, 72, 4)
            ]
            for s, pitch, dur in lead_riff:
                t_n = bar_start + s * SIXTEENTH
                lead.notes.append(pretty_midi.Note(velocity=105, pitch=pitch, start=t_n, end=t_n + dur * SIXTEENTH * 0.95))

        # Main Verse & Chorus Melody (bars 8-23 and 28-47)
        elif not is_break:
            phrase_b = (b - 8) % 8
            if phrase_b == 0:
                notes_data = [(0, 74, 3), (3, 74, 3), (6, 76, 2), (8, 77, 4), (12, 79, 4)]
            elif phrase_b == 1:
                notes_data = [(0, 81, 4), (4, 79, 2), (6, 77, 2), (8, 76, 4), (12, 74, 4)]
            elif phrase_b == 2:
                notes_data = [(0, 77, 3), (3, 77, 3), (6, 79, 2), (8, 81, 4), (12, 82, 4)]
            elif phrase_b == 3:
                notes_data = [(0, 84, 4), (4, 82, 2), (6, 81, 2), (8, 79, 4), (12, 77, 4)]
            elif phrase_b == 4:
                notes_data = [(0, 76, 3), (3, 76, 3), (6, 77, 2), (8, 79, 4), (12, 81, 4)]
            elif phrase_b == 5:
                notes_data = [(0, 79, 4), (4, 77, 2), (6, 76, 2), (8, 74, 4), (12, 72, 4)]
            elif phrase_b == 6:
                notes_data = [(0, 74, 2), (2, 76, 2), (4, 77, 4), (8, 79, 2), (10, 81, 2), (12, 82, 4)]
            else: # phrase_b == 7 (turnaround)
                notes_data = [(0, 81, 2), (2, 79, 2), (4, 77, 2), (6, 76, 2), (8, 74, 4), (12, 76, 4)]

            for s, pitch, dur in notes_data:
                t_n = bar_start + s * SIXTEENTH
                lead.notes.append(pretty_midi.Note(velocity=115, pitch=pitch, start=t_n, end=t_n + dur * SIXTEENTH * 0.95))

    pm.instruments.extend([drums, bass, brass, lead, arp])
    pm.write(filename)
    total_time = total_bars * BAR
    print(f"Generated MIDI: {filename} ({total_bars} bars, {total_time:.2f}s, {BPM} BPM)")
    return total_time

def render_audio():
    midi_file = "assets/audio/eurobeat_kirine.mid"
    wav_file = "assets/audio/eurobeat_kirine_raw.wav"
    ogg_file = "assets/audio/eurobeat_kirine.ogg"
    mp3_file = "assets/audio/eurobeat_kirine.mp3"
    
    # 48 bars at 155 BPM = ~74.32 seconds (perfect loopable eurobeat track)
    total_sec = create_eurobeat_midi(midi_file, total_bars=48)
    
    sf2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
    cmd_synth = [
        "fluidsynth", "-ni", "-F", wav_file, "-r", "44100", sf2, midi_file
    ]
    print("Running FluidSynth rendering...")
    subprocess.run(cmd_synth, check=True)

    # Master with ffmpeg: normalize loudness to -16 LUFS, subtle compression & clean seam
    print("Mastering to OGG and MP3...")
    cmd_ogg = [
        "ffmpeg", "-y", "-i", wav_file,
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=10",
        "-c:a", "libvorbis", "-q:a", "6", ogg_file
    ]
    subprocess.run(cmd_ogg, check=True)

    cmd_mp3 = [
        "ffmpeg", "-y", "-i", wav_file,
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=10",
        "-c:a", "libmp3lame", "-b:a", "192k", mp3_file
    ]
    subprocess.run(cmd_mp3, check=True)

    # Clean up raw wav
    if os.path.exists(wav_file):
        os.remove(wav_file)

    print(f"Mastered Eurobeat Soundtrack created: {ogg_file} and {mp3_file}")

if __name__ == "__main__":
    render_audio()
