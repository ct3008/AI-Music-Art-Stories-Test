from flask import Flask, request, jsonify
import numpy as np
from scipy.io import wavfile
from pydub import AudioSegment
import io
import librosa
import os

app = Flask(__name__)

@app.route('/upload_audio', methods=['POST'])
def upload_audio():
    file = request.files['audioFile']
    if file:
        file_path = os.path.join('.', file.filename)
        file.save(file_path)

        # Load the audio file
        y, sr = librosa.load(file_path, sr=None)

        # Calculate RMS energy and onset detection
        rms = librosa.feature.rms(y=y)[0]
        smoothed_rms = np.convolve(rms, np.ones(10)/10, mode='same')
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
        onset_strengths = [onset_env[int(frame)] for frame in onset_frames if int(frame) < len(onset_env)]
        onset_times = librosa.frames_to_time(onset_frames, sr=sr)
        onset_strength_pairs = list(zip(onset_times, onset_strengths))

        # Sort by strength and select top onsets
        sorted_onsets = sorted(onset_strength_pairs, key=lambda x: x[1], reverse=True)
        top_onsets = sorted_onsets[:30]
        top_onset_times = [time for time, strength in top_onsets]

        # Detect low-energy periods
        threshold = np.percentile(smoothed_rms, 10)  # 10th percentile as threshold
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

        low_energy_before_onset.sort(key=lambda x: x['strength'])
        duration = librosa.get_duration(y=y, sr=sr)

        # Convert the audio file to WAV and read the data for beat detection
        wav_io = io.BytesIO()
        audio = AudioSegment.from_file(file_path)
        audio.export(wav_io, format='wav')
        wav_io.seek(0)

        # Read WAV file
        sample_rate, data = wavfile.read(wav_io)

        # Convert to mono if stereo
        if len(data.shape) > 1:
            data = np.mean(data, axis=1)

        # Normalize data
        data = data / np.max(np.abs(data))
        waveform_data = data[::100].tolist()
        

        # Detect beats
        
        threshold=request.form.get('threshold', default=0.7, type=float)
        print("THRESH: ", threshold/100)
        beats = detect_beats(data, sample_rate, threshold=threshold/100)  # Adjust threshold as needed

        os.remove(file_path)  # Clean up the audio file
        print(low_energy_before_onset[:5], beats[:5])

        return jsonify({
            "success": True,
            'waveformData': waveform_data,
            "low_energy_timestamps": low_energy_before_onset,
            "top_onset_times": top_onset_times,
            "detectedBeats": beats,
            "duration": duration
        })
    
    return jsonify({"success": False, "error": "No file provided"}), 400

@app.route('/process_audio', methods=['POST'])
def process_audio():
    if 'audioFile' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audioFile']
    threshold = float(request.form.get('threshold', 70)) / 100

    # Convert MP3 to WAV
    audio = AudioSegment.from_mp3(audio_file)
    wav_io = io.BytesIO()
    audio.export(wav_io, format="wav")
    wav_io.seek(0)

    # Read WAV file
    sample_rate, data = wavfile.read(wav_io)
    
    # Convert to mono if stereo
    if len(data.shape) > 1:
        data = np.mean(data, axis=1)

    # Normalize data
    data = data / np.max(np.abs(data))

    # Detect beats
    beats = detect_beats(data, sample_rate, threshold)

    # Generate waveform data (downsampled for efficiency)
    waveform_data = data[::100].tolist()
    print("---------------HELLO--------------")
    print(waveform_data[:5], beats[:5])

    return jsonify({
        'waveformData': waveform_data,
        'detectedBeats': beats,
        'duration': len(data) / sample_rate
    })

def detect_beats(data, sample_rate, threshold):
    beats = []
    min_samples_between_beats = sample_rate // 2
    last_beat_index = -min_samples_between_beats

    for i in range(len(data)):
        if abs(data[i]) > threshold:
            if i - last_beat_index > min_samples_between_beats:
                beats.append(i / sample_rate)
                last_beat_index = i

    return beats

@app.route('/get_lyrics', methods=['POST'])
def get_lyrics():
    if 'audioFile' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audioFile']

    # Convert MP3 to WAV
    audio = AudioSegment.from_mp3(audio_file)
    wav_io = io.BytesIO()
    audio.export(wav_io, format="wav")
    wav_io.seek(0)

    # Load audio file
    y, sr = librosa.load(wav_io)

    # Extract MFCC features
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)

    # Here you would typically use a pre-trained model to generate lyrics
    # For this example, we'll just return a placeholder response
    return jsonify({
        'lyrics': 'This is where the generated lyrics would appear.',
        'confidence': 0.85
    })

if __name__ == '__main__':
    app.run(debug=True, port=5004)