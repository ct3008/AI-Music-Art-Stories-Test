import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [threshold, setThreshold] = useState(70);
  const [audioUrl, setAudioUrl] = useState(null);
  const [output, setOutput] = useState('');
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beats, setBeats] = useState([]);
  const [playheadPosition, setPlayheadPosition] = useState(0);

  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const beatContainerRef = useRef(null);
  const playheadIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (playheadIntervalRef.current) {
        clearInterval(playheadIntervalRef.current);
      }
    };
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setAudioFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
      };
    }
  };

  const processAudio = () => {
    if (!audioFile) {
      alert("Please select an audio file first.");
      return;
    }

    const audioContext = new AudioContext();
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const buffer = await audioContext.decodeAudioData(event.target.result);
        const channelData = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;
        displayBeats(channelData, buffer);
        const detectedBeats = detectBeats(channelData, sampleRate, threshold);
        setBeats(detectedBeats);
      } catch (error) {
        console.error("Error decoding audio data: " + error);
      }
    };

    reader.readAsArrayBuffer(audioFile);
  };

  const detectBeats = (data, sampleRate, threshold) => {
    const beats = [];
    let minSamplesBetweenBeats = sampleRate / 2;
    let lastBeatIndex = -minSamplesBetweenBeats;

    threshold = threshold / 100;

    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) > threshold) {
        if (i - lastBeatIndex > minSamplesBetweenBeats) {
          beats.push(i / sampleRate);
          lastBeatIndex = i;
        }
      }
    }
    return beats;
  };

  const displayBeats = (data, buffer) => {
    const canvas = canvasRef.current;
    const durationInSeconds = buffer.duration;
    canvas.width = durationInSeconds * 20; // 20 pixels per second
    canvas.height = 200; // Set a fixed height
    drawWaveform(data, canvas, durationInSeconds);
    setAudioDuration(durationInSeconds);
  };

  const drawWaveform = (data, canvas, duration) => {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    const step = Math.ceil(data.length / width);
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const y1 = ((1 - min) / 2) * height;
      const y2 = ((1 - max) / 2) * height;
      ctx.moveTo(i, y1);
      ctx.lineTo(i, y2);
    }
    ctx.stroke();
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      movePlayhead();
    }
  };

  const movePlayhead = () => {
    if (playheadIntervalRef.current) {
      clearInterval(playheadIntervalRef.current);
    }
    setPlayheadPosition(0);

    playheadIntervalRef.current = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused && !audioRef.current.ended) {
        let newPosition = (audioRef.current.currentTime / audioDuration) * 100;
        setPlayheadPosition(newPosition);
      }
    }, 50);
  };

  const getLyrics = async () => {
    if (!audioFile) {
      alert("Please select an audio file first.");
      return;
    }

    const formData = new FormData();
    formData.append('audioFile', audioFile);

    try {
      const response = await fetch('/upload_audio', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setOutput(JSON.stringify(data.output, null, 2));
      } else {
        setOutput('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      setOutput('Failed to fetch data.');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1>BEAT & LYRICS TEST</h1>
      <input type="file" accept=".mp3" onChange={handleFileChange} />
      <input
        type="number"
        placeholder="Threshold (0-100)"
        min="0"
        max="100"
        value={threshold}
        onChange={(e) => setThreshold(parseInt(e.target.value))}
        style={{ margin: '0 10px' }}
      />
      <button onClick={processAudio} style={{ marginRight: '10px' }}>Process Audio</button>
      <div 
        ref={beatContainerRef} 
        style={{
          position: 'relative',
          width: '100%',
          height: '200px',
          backgroundColor: '#f0f0f0',
          marginTop: '20px',
          overflow: 'hidden'
        }}
      >
        <canvas 
          ref={canvasRef} 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />
        {beats.map((beat, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: `${(beat / audioDuration) * 100}%`,
              width: '2px',
              height: '100%',
              backgroundColor: 'blue',
              zIndex: 1
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${playheadPosition}%`,
            width: '2px',
            height: '100%',
            backgroundColor: 'red',
            zIndex: 2
          }}
        />
      </div>
      <div style={{ marginTop: '20px' }}>
        <button onClick={playAudio} style={{ marginRight: '10px' }}>Play</button>
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          controls 
          onEnded={() => {
            clearInterval(playheadIntervalRef.current);
            setPlayheadPosition(0);
          }} 
          onPause={() => {
            clearInterval(playheadIntervalRef.current);
            setIsPlaying(false);
          }}
          onPlay={() => {
            setIsPlaying(true);
            movePlayhead();
          }}
        />
      </div>
      <button onClick={getLyrics} style={{ marginTop: '20px' }}>Get Lyrics</button>
      <pre style={{ marginTop: '20px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{output}</pre>
    </div>
  );
}

export default App;