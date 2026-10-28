#!/usr/bin/env bash
set -e

# 《濠江疑案》BGM Audio Validation Script
# Checks duration (>= 90s), integrated loudness (~ -18 LUFS), seamless loop RMS diff (< 3dB), and min dBFS (>-45dBFS)

cd "$(dirname "$0")/.."

python3 - << 'EOF'
import sys, math, subprocess, numpy as np

def check_file(path):
    print(f"=== Checking {path} ===")
    res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path], capture_output=True, text=True)
    duration = float(res.stdout.strip())
    
    res2 = subprocess.run(["ffmpeg", "-nostats", "-i", path, "-filter_complex", "ebur128", "-f", "null", "-"], capture_output=True, text=True)
    lufs = None
    for line in res2.stderr.splitlines():
        if "I:" in line and "LUFS" in line:
            parts = line.split()
            for i, p in enumerate(parts):
                if p == "I:":
                    lufs = float(parts[i+1])
                    break
    
    res3 = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "44100", "-"], capture_output=True)
    raw = np.frombuffer(res3.stdout, dtype=np.int16).astype(np.float64) / 32768.0
    sr = 44100
    
    w50 = int(0.05 * sr)
    rms_head = np.sqrt(np.mean(raw[:w50] ** 2))
    rms_tail = np.sqrt(np.mean(raw[-w50:] ** 2))
    diff_db = abs(20 * math.log10((rms_tail + 1e-12) / (rms_head + 1e-12)))
    
    w1s = int(1.0 * sr)
    min_rms = 1.0
    for start in range(0, len(raw) - w1s, int(0.5 * sr)):
        window = raw[start:start+w1s]
        w_rms = np.sqrt(np.mean(window ** 2))
        if w_rms < min_rms:
            min_rms = w_rms
    min_dbfs = 20 * math.log10(min_rms + 1e-12)
    
    print(f"  Duration: {duration:.2f}s (required >= 90s)")
    print(f"  Integrated LUFS: {lufs:.2f} LUFS (required ~-18 LUFS)")
    print(f"  Seam RMS diff: {diff_db:.2f} dB (required < 3.0 dB)")
    print(f"  Min 1s-window dBFS: {min_dbfs:.2f} dBFS (required > -45 dBFS)")
    
    ok = (duration >= 90.0) and (-21.0 <= lufs <= -16.0) and (diff_db < 3.0) and (min_dbfs > -45.0)
    res_str = "PASS" if ok else "FAIL"
    print(f"  Result: {res_str}")
    return ok

files = ["assets/audio/investigation.ogg", "assets/audio/investigation.mp3", "assets/audio/resolution.ogg", "assets/audio/resolution.mp3"]
results = [check_file(f) for f in files]
if not all(results):
    print("AUDIO CHECK FAILED!")
    sys.exit(1)
print("ALL BGM TRACKS PASSED AUDIO CHECK!")
EOF
