import os
import librosa
import numpy as np
from flask import Flask, jsonify, request, render_template

app = Flask(__name__, template_folder='./templates', static_folder='./static')

# API Route

@app.route('/')
def homepage():
    return render_template('waveform.html')

@app.route('/upload_audio', methods=['POST'])
def upload_audio():
    file = request.files['audioFile']
    if file:
        # Save the audio file temporarily
        file_path = os.path.join('.', file.filename)
        file.save(file_path)

        # Load the audio file using librosa
        y, sr = librosa.load(file_path, sr=None)

        # Calculate RMS energy
        rms = librosa.feature.rms(y=y)[0]

        # Smooth RMS energy to remove minor fluctuations
        smoothed_rms = np.convolve(rms, np.ones(10)/10, mode='same')

        # Perform onset detection
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)

        # Map onset frames to onset strengths
        onset_strengths = [onset_env[int(frame)] for frame in onset_frames if int(frame) < len(onset_env)]

        # Pair onset times with their strengths
        onset_times = librosa.frames_to_time(onset_frames, sr=sr)
        onset_strength_pairs = list(zip(onset_times, onset_strengths))

        # Sort by strength, largest to smallest
        sorted_onsets = sorted(onset_strength_pairs, key=lambda x: x[1], reverse=True)

        # Keep only the top 30 values
        top_onsets = sorted_onsets[:30]

        # Extract times from sorted onsets
        top_onset_times = [time for time, strength in top_onsets]

        # Determine a threshold for major dips
        threshold = np.percentile(smoothed_rms, 10)  # 10th percentile as threshold

        # Find major low-energy periods before onsets
        low_energy_before_onset = []
        for i in range(1, len(onset_frames)):
            start = onset_frames[i-1]
            end = onset_frames[i]
            rms_segment = smoothed_rms[start:end]
            min_rms = np.min(rms_segment)
            if min_rms < threshold:
                low_energy_before_onset.append({
                    'time': librosa.frames_to_time(start, sr=sr),
                    'strength': min_rms
                })

        # Sort low-energy periods by strength (smallest to largest)
        low_energy_before_onset.sort(key=lambda x: x['strength'])

        duration = librosa.get_duration(y=y, sr=sr)

        os.remove(file_path)  # Clean up the audio file
        print(low_energy_before_onset)
        return jsonify({
            "success": True,
            "low_energy_timestamps": low_energy_before_onset,
            "top_onset_times": top_onset_times,
            "duration": duration
        })
    return jsonify({"success": False, "error": "No file provided"}), 400

@app.route('/upload_audio_large', methods=['POST'])
def upload_audio_large():
    file = request.files['audioFile']
    if file:
        # Save the audio file temporarily
        file_path = os.path.join('.', file.filename)
        file.save(file_path)

        # Load the audio file using librosa
        y, sr = librosa.load(file_path, sr=None)

        # Calculate RMS energy
        rms = librosa.feature.rms(y=y)[0]

        # Smooth RMS energy to remove minor fluctuations
        smoothed_rms = np.convolve(rms, np.ones(10)/10, mode='same')

        # Perform onset detection
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)

        # Map onset frames to onset strengths
        onset_strengths = [onset_env[int(frame)] for frame in onset_frames if int(frame) < len(onset_env)]

        # Pair onset times with their strengths
        onset_times = librosa.frames_to_time(onset_frames, sr=sr)
        onset_strength_pairs = list(zip(onset_times, onset_strengths))

        # Sort by strength, largest to smallest
        sorted_onsets = sorted(onset_strength_pairs, key=lambda x: x[1], reverse=True)

        # Keep only the top 30 values
        top_onsets = sorted_onsets[:30]

        # Extract times from sorted onsets
        top_onset_times = [time for time, strength in top_onsets]

        # Determine a threshold for major dips
        threshold = np.percentile(smoothed_rms, 10)  # 10th percentile as threshold

        # Find major low-energy periods before onsets
        low_energy_before_onset = []
        for i in range(1, len(onset_frames)):
            start = onset_frames[i-1]
            end = onset_frames[i]
            rms_segment = smoothed_rms[start:end]
            if np.min(rms_segment) < threshold:
                low_energy_before_onset.append(librosa.frames_to_time(start, sr=sr))

        duration = librosa.get_duration(y=y, sr=sr)

        os.remove(file_path)  # Clean up the audio file
        return jsonify({"success": True, "low_energy_timestamps": low_energy_before_onset, "top_onset_times": top_onset_times, "duration": duration})
    return jsonify({"success": False, "error": "No file provided"}), 400

if __name__ == "__main__":
    app.run(debug=True, port=5003)
