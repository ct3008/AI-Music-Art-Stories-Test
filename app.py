import os
import librosa
import numpy as np
from flask import Flask, jsonify, request, render_template

app = Flask(__name__, template_folder='./templates', static_folder='./static')

motion_magnitudes = {
    "zoom_in": {"none": 1.00, "weak": 1.02, "normal": 1.04, "strong": 3, "vstrong": 6},
    "zoom_out": {"none": 1.00, "weak": 0.98, "normal": 0.96, "strong": 0.4, "vstrong": 0.1},
    "rotate_up": {"none": 0, "weak": 0.5, "normal": 1, "strong": 3, "vstrong": 6},
    "rotate_down": {"none": 0, "weak": -0.5, "normal": -1, "strong": -3, "vstrong": -6},
    "rotate_right": {"none": 0, "weak": 0.5, "normal": 1, "strong": 3, "vstrong": 6},
    "rotate_left": {"none": 0, "weak": -0.5, "normal": -1, "strong": -3, "vstrong": -6},
    "rotate_cw": {"none": 0, "weak": 0.5, "normal": 1, "strong": 3, "vstrong": 6},
    "rotate_ccw": {"none": 0, "weak": -0.5, "normal": -1, "strong": -3, "vstrong": -6},
    "spin_cw": {"none": 0, "weak": 0.5, "normal": 1, "strong": 3, "vstrong": 6},
    "spin_ccw": {"none": 0, "weak": -0.5, "normal": -1, "strong": -3, "vstrong": -6},
    "pan_up": {"none": 0, "weak": 0.5, "normal": 1, "strong": 3, "vstrong": 6},
    "pan_down": {"none": 0, "weak": -0.5, "normal": -1, "strong": -3, "vstrong": -6},
    "pan_right": {"none": 0, "weak": 0.5, "normal": 1, "strong": 3, "vstrong": 6},
    "pan_left": {"none": 0, "weak": -0.5, "normal": -1, "strong": -3, "vstrong": -6}
}

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

def split_and_pair_values(data):
    motions = data['motion'].strip().split(',')
    strengths = data['strength'].strip().split(',')
    speeds = data['speed'].strip().split(',')
    return list(zip(motions, strengths, speeds))

def get_motion_data(form_data, trans_data, time_intervals):
    motion_data = []

    for i in range(len(time_intervals) - 1):
        start = float(time_intervals[i])
        end = float(time_intervals[i + 1])
        if (time_intervals[i] >= time_intervals[i + 1]):
            break
        segment_motion_data = []

        # Check for transitions
        for interval, data in trans_data.items():
            interval_start, interval_end = map(float, interval.split('-'))
            if start <= interval_start < end or start < interval_end <= end:
                segment_motion_data.extend(split_and_pair_values(data))
                break  # Only take the transition motion

        # If no transition, default to closest form_data motion
        if not segment_motion_data:
            closest_form_data = get_closest_form_data(start, form_data)
            if closest_form_data:
                segment_motion_data.extend(split_and_pair_values(closest_form_data))

        motion_data.append(segment_motion_data)

    return motion_data


def get_closest_form_data(time, form_data):
    closest_time = min((float(t) for t in form_data.keys() if float(t) >= time), default=None)
    if closest_time is not None:
        return form_data[f"{closest_time:.2f}"]
    else:
        closest_time = min((float(t) for t in form_data.keys() if float(t) <= time), default=None)
        return form_data[f"{closest_time:.2f}"]



def get_motion_and_speed(time, form_data):
    motion_options = ["zoom_in", "zoom_out", "pan_right", "pan_left", "pan_up", "pan_down", "spin_cw", "spin_ccw", 
                      "rotate_up", "rotate_down", "rotate_right", "rotate_left", "rotate_cw", "rotate_ccw", "none"]
    speed_options = ["vslow", "slow", "normal", "fast", "vfast"]
    strength_options = ["weak", "normal", "strong", "vstrong"]

    form_entry = form_data.get(time, {})
    motion = form_entry.get('motion', 'none')
    speed = form_entry.get('speed', 'normal')
    strength = form_entry.get('strength', 'normal')

    if motion not in motion_options:
        print(f"Invalid motion option for time {time}. Using default 'none'.")
        motion = 'none'

    motions = [(motion, speed, strength)]
    return motions

def parse_input_data(form_data, trans_data, song_duration):
    trans_data = {k: v for k, v in trans_data.items() if v.get('transition', True)}
    scene_change_times = sorted(list(map(float,form_data.keys())))
    print(scene_change_times)

    print(trans_data.keys())
    transition_times = list(map(float, [time.split('-')[0] for time in trans_data.keys()] + [time.split('-')[1] for time in trans_data.keys()] + list(form_data.keys())))
    print(transition_times)
    time_intervals = sorted(set(scene_change_times + transition_times))
    time_intervals = [0] + [float(i) for i in time_intervals] + [float(round(song_duration + 0.5, 2))]
    interval_strings = [f"{time_intervals[i]}-{time_intervals[i+1]}" for i in range(len(time_intervals) - 1)]
    motion_data = get_motion_data(form_data, trans_data, time_intervals)
    interval_strings = [f"{time_intervals[i]}-{time_intervals[i+1]}" for i in range(len(time_intervals) - 1)]

    for interval, motions in zip(interval_strings, motion_data):
        print(f"Interval: {interval}, Motions: {motions}")

    print("TIME INTERVAL", time_intervals)

    for key, value in form_data.items():
        time_intervals.append(float(key))
    
    for key in trans_data.keys():
        start, end = map(float, key.split('-'))
        time_intervals.extend([start, end])
    
    time_intervals = sorted(set(time_intervals))
    time_intervals = [str(i) for i in time_intervals]
    print(time_intervals)
    
    return song_duration, scene_change_times, transition_times, time_intervals, interval_strings, motion_data

def calculate_frames(scene_change_times, time_intervals, motion_data, total_song_len, final_anim_frames):
    frame_data = {
        "zoom": [],
        "translation_x": [],
        "translation_y": [],
        "angle": [],
        "rotation_3d_x": [],
        "rotation_3d_y": [],
        "rotation_3d_z": []
    }
    tmp_times = scene_change_times.copy()

    speed_multiplier = {"vslow": 0.25, "slow": 0.5, "normal": 1, "fast": 2.5, "vfast": 6}
    frame_rate = 15

    current_frame = 0
    animation_prompts = []
    
    print(motion_data)
    for interval, motions in zip(time_intervals, motion_data):
        _, strength, speed = motions[0]
        start_time, end_time = map(float, interval.split('-'))
        if tmp_times:
            print(int(tmp_times[0]))
        if tmp_times != [] and int(tmp_times[0]) <= end_time and int(tmp_times[0]) >= start_time:
            new_frame = round(current_frame + (int(tmp_times[0]) - start_time) * 15 * speed_multiplier[speed])
            print("----------------END FRAME:---------------", new_frame)
            if new_frame not in final_anim_frames:
				
                final_anim_frames.append(new_frame)
            tmp_times.pop(0)
        duration = (end_time - start_time) * frame_rate
        adjusted_duration = round(duration * speed_multiplier[speed])
        end_frame = current_frame + adjusted_duration
        for motion, strength, speed in motions:
            animation_prompts.append((start_time, end_time, current_frame, end_frame))
            
            if motion == "zoom_in":
                frame_data["zoom"].append((current_frame, end_frame, adjusted_duration, motion_magnitudes[motion][strength]))
            elif motion == "zoom_out":
                frame_data["zoom"].append((current_frame, end_frame, adjusted_duration, motion_magnitudes[motion][strength]))
            elif motion == "pan_right":
                frame_data["translation_x"].append((current_frame, end_frame, adjusted_duration, motion_magnitudes[motion][strength]))
            elif motion == "pan_left":
                frame_data["translation_x"].append((current_frame, end_frame, adjusted_duration, motion_magnitudes[motion][strength]))
            elif motion == "pan_up":
                frame_data["translation_y"].append((current_frame, end_frame, adjusted_duration, motion_magnitudes[motion][strength]))
            elif motion == "pan_down":
                frame_data["translation_y"].append((current_frame, end_frame, adjusted_duration, motion_magnitudes[motion][strength]))
            elif motion == "spin_cw":
                frame_data["angle"].append((current_frame, end_frame, adjusted_duration, motion_magnitudes[motion][strength]))
            elif motion == "spin_ccw":
                frame_data["angle"].append((current_frame, end_frame, adjusted_duration, motion_magnitudes[motion][strength]))
            elif motion == "rotate_up":
                frame_data["rotation_3d_x"].append((current_frame, end_frame, adjusted_duration, motion_magnitudes[motion][strength]))
            elif motion == "rotate_down":
                frame_data["rotation_3d_x"].append((current_frame, end_frame, adjusted_duration, motion_magnitudes[motion][strength]))
            elif motion == "rotate_right":
                frame_data["rotation_3d_y"].append((current_frame, end_frame, adjusted_duration, motion_magnitudes[motion][strength]))
            elif motion == "rotate_left":
                frame_data["rotation_3d_y"].append((current_frame, end_frame, adjusted_duration, motion_magnitudes[motion][strength]))
            elif motion == "rotate_cw":
                frame_data["rotation_3d_z"].append((current_frame, end_frame, adjusted_duration, motion_magnitudes[motion][strength]))
            elif motion == "rotate_ccw":
                frame_data["rotation_3d_z"].append((current_frame, end_frame, adjusted_duration, motion_magnitudes[motion][strength]))


        current_frame = end_frame

        if str(end_time) == str(total_song_len) and end_frame not in final_anim_frames and (end_frame - 1) not in final_anim_frames:
            final_anim_frames.append(end_frame)
        

    return frame_data, animation_prompts

def build_transition_strings(frame_data):
    motion_defaults = {
        "zoom": 1.0,
        "translation_x": 0,
        "translation_y": 0,
        "angle": 0,
        "rotation_3d_x": 0,
        "rotation_3d_y": 0,
        "rotation_3d_z": 0
    }
    motion_strings = {motion: [] for motion in frame_data}

    for motion, frames in frame_data.items():
        previous_end_frame = None
        for (start_frame, end_frame, duration, value) in frames:
            pre_frame = start_frame - 1
            post_frame = end_frame + 1

            if previous_end_frame is not None and previous_end_frame == start_frame:
                start_frame = start_frame + 2
            else:
                if pre_frame >= 0:
                    motion_strings[motion].append(f"{pre_frame}:({motion_defaults[motion]})")
                    
            motion_strings[motion].append(f"{start_frame}:({value})")
            motion_strings[motion].append(f"{end_frame}:({value})")
            
            if post_frame >= 0:
                motion_strings[motion].append(f"{post_frame}:({motion_defaults[motion]})")
                
            previous_end_frame = end_frame

    for motion in motion_strings:
        if not any(s.startswith('0:') for s in motion_strings[motion]):
            motion_strings[motion].insert(0, f"0:({motion_defaults[motion]})")

    return motion_strings

@app.route('/process-data', methods=['POST'])
def process_data():
    data = request.json
    timestamps_scenes = data['timestamps_scenes']
    form_data = data['form_data']
    transitions_data = data['transitions_data']
    song_len = data['song_len']

    # Here you can integrate your Python logic with the received data
    # Example: processed_data = your_function(timestamps_scenes, form_data, transitions_data)

    print("FORM: ")
    print(form_data)
    print("TRANS: ")
    print(transitions_data)

    song_duration, scene_change_times, transition_times, time_intervals, interval_strings, motion_data = parse_input_data(form_data, transitions_data, song_len)
    final_anim_frames = []
    final_anim_frames.append(0)
    # Calculate frames and generate prompts
    frame_data, animation_prompts = calculate_frames(scene_change_times, interval_strings, motion_data, song_duration, final_anim_frames)
    motion_strings = build_transition_strings(frame_data)

    print("FRAME")
    print(frame_data)
    print("ANIM")
    print(animation_prompts)

    motion_strings = build_transition_strings(frame_data)

    # Print the final list of frame transitions for each motion type
    print("\nFinal List of Frame Transitions for Each Motion Type:")
    for motion, transitions in motion_strings.items():
        print(f"{motion}: {', '.join(transitions)}")

    final_scene_times = scene_change_times
    final_scene_times.insert(0, '0')
    final_scene_times.append(song_duration)
    print(final_anim_frames)
    print(final_scene_times)
    # Print the animation prompts
    print("\nAnimation Prompts:")
    animation_prompts = ""

    for i in range(len(final_anim_frames) - 1):
        animation_prompts += f"{final_anim_frames[i]}: | "
        print(f"Start Time: {final_scene_times[i]}, End Time: {final_scene_times[i+1]}, Start Frame: {final_anim_frames[i]}, End Frame: {final_anim_frames[i+1]}")

    animation_prompts = animation_prompts[:-2]
    print(animation_prompts)
    # For demonstration, we'll just return the received data
    response = {
        'timestamps_scenes': timestamps_scenes,
        'form_data': form_data,
        'transitions_data': transitions_data,
        'song_len': song_len,
        'animation_prompts': animation_prompts,
        'motion_prompts': motion_strings
        # 'processed_data': processed_data
    }

    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True, port=5003)
