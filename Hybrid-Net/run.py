# import torch as th
# import torch.nn.functional as F
# from librosa.feature import tempo
# from audio import read_wav
# from spec import get_specs, get_spec, istft, get_mixed_spec
from models.beat_net import BeatNet  # Import your model class
# from models.unet import UNet
# from utils import build_masked_stft, get_chord_name, get_segment_name, get_lyrics


# def predict_beats(waveform, sample_rate, config, device='cpu'):
#     """
#     Predict beats and tempo from the audio waveform using a BeatNet model.
    
#     Parameters:
#         waveform (Tensor): The audio waveform.
#         sample_rate (int): The sample rate of the audio.
#         config (dict): Configuration dictionary with parameters.
#         device (str): Device to run the model on ('cpu' or 'cuda').

#     Returns:
#         dict: A dictionary containing beat predictions, tempo, and other analysis results.
#     """
#     # Initialize models
#     beat_net = BeatNet()  # Instantiate the model directly
#     print(beat_net)
#     beat_net.to(device)   # Move model to the specified device

#     # Obtain spectrograms
#     spec_cfg = config['spec']
#     inst_specs = get_specs([waveform], spec_cfg)  # Assuming waveform is already separated

#     # Beat prediction
#     with th.no_grad():
#         beat_features = inst_specs[:, :, :, :spec_cfg['n_fft'] // 2].unsqueeze(0)  # B, S, C, T, F
#         beat_features_mag = th.abs(beat_features)
#         beat_pred, _ = beat_net(beat_features_mag)  # Forward pass through the model
    
#     # Calculate tempo
#     beats = beat_pred.squeeze(0).numpy()
#     bpm = tempo(onset_envelope=beats, hop_length=config['tempo']['hop_length']).tolist()
    
#     return {
#         'bpm': bpm,
#         'beat': beats.tolist(),
#     }

# def separate(waveform, sample_rate, device='cpu'):
#     assert sample_rate == sample_rate
#     wav_len = waveform.shape[-1]

#     spec_config= {
#         'n_fft': 2048,
#         'hop_length': 512,
#         'n_time': 100,
#     }
    
#     unet = UNet()
#     unet.to(device)  # Move model to the specified device

#     n_fft = spec_config['n_fft']
#     hop_length = spec_config['hop_length']
#     n_time = spec_config['n_time']
#     split_len = (n_time - 5) * hop_length + n_fft

#     output_waveforms = [[] for _ in range(4)]
#     for i in range(0, wav_len, split_len):
#         with th.no_grad():
#             x = waveform[:, i:i + split_len].to(device)
#             pad_num = 0
#             if x.shape[-1] < split_len:
#                 pad_num = split_len - (wav_len - i)
#                 x = F.pad(x, (0, pad_num))
#             spec_config['pad'] = pad_num
#             # separator
#             z = get_spec(x, spec_config).to(device)
#             mag_z = th.abs(z).unsqueeze(0)
#             print(mag_z.shape)
#             masks = unet(mag_z)
#             masks = masks.squeeze(0)
#             _masked_stfts = build_masked_stft(masks, z, n_fft=n_fft)
#             # build waveform
#             for j, _masked_stft in enumerate(_masked_stfts):
#                 _waveform = istft(_masked_stft, n_fft=n_fft, hop_length=hop_length, pad=True)
#                 if pad_num > 0:
#                     _waveform = _waveform[:, :-pad_num]
#                 output_waveforms[j].append(_waveform)

#     inst_waveforms = []
#     for waveform_list in output_waveforms:
#         inst_waveforms.append(th.cat(waveform_list, dim=-1))
#     return th.stack(inst_waveforms, dim=0)

# # Example usage
# if __name__ == "__main__":
#     # Load your audio file as waveform
#     waveform, sample_rate = read_wav('/Users/Claudia/Desktop/suzume/iseeu6/iseeu.wav', sample_rate=44100, n_channel=2, device='cpu')
    
#     inst_waveforms = separate(waveform, sample_rate)
#     config = {
#         'spec': {
#             'n_fft': 2048,
#             'hop_length': 512,
#             'n_time': 100,
#         },
#         'tempo': {
#             'hop_length': 512,
#         }
#     }
#     other_spec = get_mixed_spec(inst_waveforms[1:], config['spec'])
#     vocal_waveform = inst_waveforms[0].numpy()
    
    
#     # Predict beats
#     results = predict_beats(waveform, sample_rate, config, device='cpu')
    
#     print(results)


import torchaudio as ta
import torch as th
import torch.nn.functional as F
from librosa.feature import tempo

from audio import read_wav
from spec import get_spec
from models import get_model

class AITabTranscription(object):
    def __init__(self, config):
        self.config = config
        self.sample_rate = self.config['sample_rate']
        self.spec_cfg = self.config['spec']
        self.tempo_cfg = self.config['tempo']
        self.beat_cfg = self.config['beat']

    def transcribe(self, wav_fp, device='cpu'):
        waveform, sample_rate = read_wav(wav_fp, sample_rate=self.sample_rate, n_channel=2, device=device)

        # Load model
        beat_net = BeatNet()
        # beat_net.train()
        
        # Get spectrogram
        spec = get_spec(waveform, self.spec_cfg)
        # print(spec)
        print(spec.shape)

        with th.no_grad():
            # Predict beat
            # shape: (batch, source, channel, time, freq)
            beat_features = spec[:, :, :, :self.spec_cfg['n_fft'] // 2].unsqueeze(0)  # B, S, C, T, F
            beat_features_mag = th.abs(beat_features)
            print(beat_features_mag.shape)
            beat_pred, beat_logist = beat_net(beat_features_mag)

        # Extract beat and BPM
        beats = beat_pred.squeeze(0).numpy()
        bpm = tempo(onset_envelope=beats, hop_length=self.tempo_cfg['hop_length']).tolist()

        return {'bpm': bpm, 'beat': beats.tolist()}

config = {
    'sample_rate': 44100,
    'spec': {
        'n_fft': 2048,
        'hop_length': 512,
        'pad': 0,
    },
    'tempo': {
        'hop_length': 512,
    },
    'beat': {
        'model_name': 'beat',
        'model_path': './models/beat_net.py',
        'model': {
            # Example, update based on your model configuration
        }
    }
}

# Initialize the transcription object
transcription = AITabTranscription(config)

# Run the transcription on an audio file to get beat analysis
result = transcription.transcribe('/Users/Claudia/Desktop/suzume/iseeu6/iseeu.wav', device='cpu')

# Print the beat information
print("Beat Information:", result['beat'])
print("BPM:", result['bpm'])
