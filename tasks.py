import time  # Simulating long tasks
from redis import Redis
from queue_config import queue
import os
from rq import get_current_job
import replicate
from helpers import (  # Adjust the import paths as needed
    parse_input_data,
    calculate_frames,
    build_transition_strings,
    generate_image_prompts,
    create_deforum_prompt
)

# Redis connection
# redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
# redis_conn = Redis.from_url(redis_url)

# # Create an RQ queue
# queue = Queue(connection=redis_conn)

# def long_running_task(data):
    
    

def long_running_task(data):
    job = get_current_job()
    # Extract the data from the input
    # api_key = os.getenv("REPLICATE_API_KEY")  # Store your API key in environment variables
    print("Long running running")
    api_key = data['api_key']
    api = replicate.Client(api_token=api_key)
    print("API: ", api_key)
    timestamps_scenes = data['timestamps_scenes']
    form_data = data['form_data']
    transitions_data = data['transitions_data']
    song_len = data['song_len']
    motion_mode = data['motion_mode']
    seed = data['seed']

    # Processing the data
    song_duration, scene_change_times, transition_times, time_intervals, interval_strings, motion_data = parse_input_data(form_data, transitions_data, song_len)
    final_anim_frames = [0]
    if round(song_len, 2) not in scene_change_times:
        scene_change_times.append(round(song_len, 2))
    
    frame_data, animation_prompts = calculate_frames(scene_change_times, interval_strings, motion_data, song_duration, final_anim_frames)
    motion_strings = build_transition_strings(frame_data)
    prompts = generate_image_prompts(form_data, final_anim_frames)

    # Create the Deforum prompt
    deforum_prompt = create_deforum_prompt(motion_strings, final_anim_frames, motion_mode, prompts, seed)
    
    # Run the API
    # output = api.run(
    #     "deforum-art/deforum-stable-diffusion:1a98303504c7d866d2b198bae0b03237eab82edc1491a5306895d12b0021d6f6",
    #     input=deforum_prompt
    # )
    output = "https://replicate.delivery/yhqm/u7FcIvDd32bjK5ccA5v0FmQ8LesqmftC6MrUbrRMTZECkyPTA/out.mp4"


    # Compile the response
    response = {
        'timestamps_scenes': timestamps_scenes,
        'form_data': form_data,
        'transitions_data': transitions_data,
        'song_len': song_len,
        'animation_prompts': animation_prompts,
        'motion_prompts': motion_strings,
        'prompts': prompts,
        'output': output
    }
    return response

    # # Perform task
    # return {"result": "Task completed"}
