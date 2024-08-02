# --------------- 
# import librosa
# import numpy as np
# import soundfile as sf

# # Load the audio file
# y, sr = librosa.load('/Users/Claudia/Desktop/suzume/iseeu6/suzume.mp3', sr=None)

# # Perform harmonic-percussive source separation
# harmonic, percussive = librosa.effects.hpss(y)

# # Save the separated harmonic (vocal) and percussive (instrumental) components
# sf.write('/Users/Claudia/Desktop/suzume/iseeu6/suzume_harmonic.wav', harmonic, sr)
# sf.write('/Users/Claudia/Desktop/suzume/iseeu6/suzume_percussive.wav', percussive, sr)

# # Alternatively, you can save the instrumental by subtracting harmonic from the original signal
# instrumental = y - harmonic
# sf.write('/Users/Claudia/Desktop/suzume/iseeu6/suzume_instrumental.wav', instrumental, sr)


# ------------- Find onset of dip in energy -------------------
import librosa
import numpy as np
import matplotlib.pyplot as plt

# Load the audio file
# y, sr = librosa.load('/Users/Claudia/Desktop/suzume/iseeu6/iseeu.wav', sr=None)
y, sr = librosa.load('/Users/Claudia/Desktop/suzume/iseeu6/suzume.mp3', sr=None)

# Calculate RMS energy
rms = librosa.feature.rms(y=y)[0]

# Smooth RMS energy to remove minor fluctuations
smoothed_rms = np.convolve(rms, np.ones(10)/10, mode='same')

# Perform onset detection
onset_env = librosa.onset.onset_strength(y=y, sr=sr)
onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)

# Convert frame indices to time
frames = range(len(rms))
times = librosa.frames_to_time(frames, sr=sr)
onset_times = librosa.frames_to_time(onset_frames, sr=sr)

# Determine a threshold for major dips
threshold = np.percentile(smoothed_rms, 10)  # 10th percentile as threshold

# Find major low-energy periods before onsets
low_energy_before_onset = []
for i in range(1, len(onset_frames)):
    start = onset_frames[i-1]
    end = onset_frames[i]
    rms_segment = smoothed_rms[start:end]
    if np.min(rms_segment) < threshold:
        low_energy_before_onset.append({
            'time': librosa.frames_to_time(start, sr=sr),
            'strength': np.min(rms_segment)
        })

# Plot the RMS energy and major dips
plt.figure(figsize=(14, 5))
plt.semilogy(times, smoothed_rms, label='Smoothed RMS Energy')
plt.vlines(onset_times, 0, np.max(smoothed_rms), color='r', alpha=0.9, linestyle='--', label='Onsets')
for onset in low_energy_before_onset:
    plt.scatter(onset['time'], onset['strength'], color='b', marker='o', label='Major Dips')
plt.xlabel('Time (s)')
plt.ylabel('RMS Energy')
plt.title('Smoothed RMS Energy and Major Dips')
plt.legend()
plt.show()

print(f"Low energy before onsets: {low_energy_before_onset}")




#----------------------------------------------------------------

# import librosa
# import wave
# audio_file = librosa.load('/Users/Claudia/Desktop/suzume/iseeu6/iseeu.wav')
# y, sr = audio_file
# # tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)

# start_time = 15  # for example, start at 30 seconds
# end_time = 20    # for example, end at 60 seconds

# # Convert times to sample indices
# start_sample = int(start_time * sr)
# end_sample = int(end_time * sr)

# y_segment = y[start_sample:end_sample]

# # Apply beat tracking to the segment
# tempo, beats = librosa.beat.beat_track(y=y_segment, sr=sr)
# beats = librosa.frames_to_time(beats, sr=sr)

# print(f"Tempo: {tempo}")
# print(f"Beats: {beats}")

#----------------------------------------------------------------

# import librosa
# import wave
# import numpy as np
# import matplotlib.pyplot as plt
# audio_file = librosa.load('/Users/Claudia/Desktop/suzume/iseeu6/iseeu.wav')
# y, sr = audio_file
# tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
# # print('Estimated tempo: {:.2f} beats per minute'.format(tempo))

# beat_times = librosa.frames_to_time(beat_frames, sr=sr)
# print(beat_times)

# wav_obj = wave.open('/Users/Claudia/Desktop/suzume/iseeu6/iseeu.wav', 'rb')
# sample_freq = wav_obj.getframerate()
# n_samples = wav_obj.getnframes()
# t_audio = n_samples/sample_freq
# n_channels = wav_obj.getnchannels()
# signal_wave = wav_obj.readframes(n_samples)
# signal_array = np.frombuffer(signal_wave, dtype=np.int16)
# l_channel = signal_array[0::2]
# r_channel = signal_array[1::2]
# times = np.linspace(0, n_samples/sample_freq, num=n_samples)
# plt.figure(figsize=(15, 5))
# plt.plot(times, l_channel)
# plt.title('Left Channel')
# plt.ylabel('Signal Value')
# plt.xlabel('Time (s)')
# plt.xlim(0, t_audio)
# plt.show()