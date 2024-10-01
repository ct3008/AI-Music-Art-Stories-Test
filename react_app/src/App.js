import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { findSignificantPoints } from './significantPointsUtil'; // Adjust the path if needed

function App() {
    const [audioFile, setAudioFile] = useState(null);
    const [threshold, setThreshold] = useState(70);
    const [audioUrl, setAudioUrl] = useState(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [beats, setBeats] = useState([]);
    const [lowEnergyBeats, setLowEnergyBeats] = useState([]);
    const [significantPoints, setSignificantPoints] = useState([]);
    const [playheadPosition, setPlayheadPosition] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const audioRef = useRef(null);
    const canvasRef = useRef(null);
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
        if (file) {
            setAudioFile(file);
            const url = URL.createObjectURL(file);
            setAudioUrl(url);
            const audio = new Audio(url);
            audio.onloadedmetadata = () => {
                setAudioDuration(audio.duration);
            };
        }
    };

    const processAudio = async () => {
        if (!audioFile) {
            alert("Please select an audio file first.");
            return;
        }
    
        const formData = new FormData();
        formData.append('audioFile', audioFile);
        formData.append('threshold', threshold);
    
        try {
            setLoading(true);
            setError(null);

            const response = await axios.post('/upload_audio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                const { waveformData, detectedBeats, low_energy_timestamps, duration } = response.data;
                console.log("waveformData", waveformData);

                // Set local states
                setBeats(detectedBeats);
                setLowEnergyBeats(low_energy_timestamps);
                console.log("HERE HERE 2");

                // Calculate significant points
                const significantPoints = findSignificantPoints(detectedBeats, low_energy_timestamps, duration);
                setSignificantPoints(significantPoints);
                console.log("HERE HERE 3");

                // Display beats and low-energy beats
                displayBeats(waveformData, duration, detectedBeats, low_energy_timestamps);
                setAudioDuration(duration);
            } else {
                setError("Error processing the audio file.");
            }
        } catch (err) {
            setError("There was an error uploading the file.");
        } finally {
            setLoading(false);
        }
    };

    const displayBeats = (waveformData, duration, beats, lowEnergyBeats) => {
        const canvas = canvasRef.current;
        canvas.width = duration * 100;
        canvas.height = 200;
        console.log("HERE HERE 4");
        drawWaveform(waveformData, beats, lowEnergyBeats, canvas, duration);
    };

    const drawWaveform = (data, beats, lowEnergyBeats, canvas, duration) => {
      console.log("HERE HERE 5");
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;

        // Draw waveform
        console.log("DATA");
        console.log(data);
        

        data.forEach((point, index) => {
            const x = (index / data.length) * width;
            const y = ((1 - point) / 2) * height;
            ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw detected beats
        beats.forEach((beat) => {
            const x = (beat / duration) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.strokeStyle = 'blue'; // Beat color
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        console.log("HERE HERE 6,", beats);

        // Draw low-energy beats
        lowEnergyBeats.forEach((beat) => {
            const x = (beat.time / duration) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.strokeStyle = 'red'; // Low-energy beat color
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        console.log("HERE HERE 7: ", lowEnergyBeats);
    };

    const playAudio = () => {
        if (audioUrl && audioRef.current) {
            audioRef.current.play().catch(error => {
                console.error("Error playing audio:", error);
            });
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

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
            <h1>Audio Beat & Lyrics Analyzer</h1>
            <input type="file" accept="audio/*" onChange={handleFileChange} />

            {/* <AudioUpload file={audioFile} /> */}

            <input
                type="number"
                placeholder="Threshold (0-100)"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                style={{ margin: '10px 0' }}
            />
            <button onClick={processAudio} style={{ marginRight: '10px' }}>
                {loading ? "Processing..." : "Process Audio"}
            </button>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Canvas to display waveform */}
            <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#f0f0f0', marginTop: '20px', overflow: 'hidden' }}>
                <canvas ref={canvasRef} style={{ position: 'absolute', width: '100%', height: '100%' }} />
                {/* Playhead */}
                <div style={{ position: 'absolute', top: 0, left: `${playheadPosition}%`, width: '2px', height: '100%', backgroundColor: 'red', zIndex: 2 }} />
            </div>

            <button onClick={playAudio} style={{ marginTop: '20px' }}>Play</button>
            <audio ref={audioRef} src={audioUrl} controls onEnded={() => setIsPlaying(false)} />

            <h3>Significant Points (Low-Energy Beats):</h3>
            <ul>
                {significantPoints.map((point, index) => (
                    <li key={index}>Significant point at {point.toFixed(2)} seconds</li>
                ))}
            </ul>
        </div>
    );
}

export default App;



// import React, { useState, useRef, useEffect } from 'react';
// import axios from 'axios';
// import AudioUpload from './AudioUpload';

// function App() {
//   const [audioFile, setAudioFile] = useState(null);
//   const [threshold, setThreshold] = useState(70);
//   const [audioUrl, setAudioUrl] = useState(null);
//   const [output, setOutput] = useState('');
//   const [audioDuration, setAudioDuration] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [beats, setBeats] = useState([]);
//   const [playheadPosition, setPlayheadPosition] = useState(0);
//   const [significantPoints, setSignificantPoints] = useState([]);

//   const audioRef = useRef(null);
//   const canvasRef = useRef(null);
//   const playheadIntervalRef = useRef(null);

//   // Cleanup playhead interval on unmount
//   useEffect(() => {
//     return () => {
//       if (playheadIntervalRef.current) {
//         clearInterval(playheadIntervalRef.current);
//       }
//     };
//   }, []);

//   const handleFileChange = (file) => {
//     setAudioFile(file);
//     if (file) {
//       const url = URL.createObjectURL(file);
//       setAudioUrl(url);
//       const audio = new Audio(url);
//       audio.onloadedmetadata = () => {
//         setAudioDuration(audio.duration);
//       };
//     }
//   };

//   // Process audio file and draw beats
//   const processAudio = async () => {
//     if (!audioFile) {
//       alert("Please select an audio file first.");
//       return;
//     }

//     const formData = new FormData();
//     formData.append('audioFile', audioFile);
//     formData.append('threshold', threshold);

//     try {
//       const response = await axios.post('/process_audio', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
//       const { waveformData, detectedBeats, duration } = response.data;
//       displayBeats(waveformData, duration);
//       setBeats(detectedBeats);
//       setAudioDuration(duration);
//     } catch (error) {
//       console.error("Error processing audio: ", error);
//     }
//   };

//   const displayBeats = (waveformData, duration) => {
//     const canvas = canvasRef.current;
//     canvas.width = duration * 20; // 20 pixels per second
//     canvas.height = 200; // Set a fixed height
//     drawWaveform(waveformData, canvas);
//   };

//   const drawWaveform = (data, canvas) => {
//     const ctx = canvas.getContext('2d');
//     const width = canvas.width;
//     const height = canvas.height;
//     ctx.clearRect(0, 0, width, height);
//     ctx.beginPath();
//     ctx.moveTo(0, height / 2);
//     ctx.strokeStyle = '#000000';
//     ctx.lineWidth = 1;
    
//     data.forEach((point, index) => {
//       const x = (index / data.length) * width;
//       const y = ((1 - point) / 2) * height;
//       ctx.lineTo(x, y);
//     });
    
//     ctx.stroke();
//   };

//   const playAudio = () => {
//     if (audioRef.current) {
//       audioRef.current.play();
//       setIsPlaying(true);
//       movePlayhead();
//     }
//   };

//   const movePlayhead = () => {
//     if (playheadIntervalRef.current) {
//       clearInterval(playheadIntervalRef.current);
//     }
//     setPlayheadPosition(0);

//     playheadIntervalRef.current = setInterval(() => {
//       if (audioRef.current && !audioRef.current.paused && !audioRef.current.ended) {
//         let newPosition = (audioRef.current.currentTime / audioDuration) * 100;
//         setPlayheadPosition(newPosition);
//       }
//     }, 50);
//   };

//   // Receive significant points from AudioUpload
//   const handleSignificantPoints = (points) => {
//     setSignificantPoints(points);
//   };

//   return (
//     <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
//       <h1>Audio Beat & Lyrics Analyzer</h1>

//       {/* AudioUpload Component */}
//       <AudioUpload onFileChange={handleFileChange} onSignificantPoints={handleSignificantPoints} />

//       <input
//         type="number"
//         placeholder="Threshold (0-100)"
//         min="0"
//         max="100"
//         value={threshold}
//         onChange={(e) => setThreshold(parseInt(e.target.value))}
//         style={{ margin: '10px 0' }}
//       />
//       <button onClick={processAudio} style={{ marginRight: '10px' }}>Process Audio</button>

//       {/* Canvas to display waveform */}
//       <div 
//         style={{
//           position: 'relative',
//           width: '100%',
//           height: '200px',
//           backgroundColor: '#f0f0f0',
//           marginTop: '20px',
//           overflow: 'hidden'
//         }}
//       >
//         <canvas ref={canvasRef} style={{ position: 'absolute', width: '100%', height: '100%' }} />
        
//         {/* Detected beats (from backend) */}
//         {beats.map((beat, index) => (
//           <div
//             key={index}
//             style={{
//               position: 'absolute',
//               top: 0,
//               left: `${(beat / audioDuration) * 100}%`,
//               width: '2px',
//               height: '100%',
//               backgroundColor: 'blue',
//               zIndex: 1
//             }}
//           />
//         ))}

//         {/* Playhead */}
//         <div
//           style={{
//             position: 'absolute',
//             top: 0,
//             left: `${playheadPosition}%`,
//             width: '2px',
//             height: '100%',
//             backgroundColor: 'red',
//             zIndex: 2
//           }}
//         />
//       </div>

//       <button onClick={playAudio} style={{ marginTop: '20px' }}>Play</button>
//       <audio ref={audioRef} src={audioUrl} controls onEnded={() => setIsPlaying(false)} />

//       {/* Display significant points (low-energy beats) */}
//       <h3>Significant Points (Low-Energy Beats):</h3>
//       <ul>
//         {significantPoints.map((point, index) => (
//           <li key={index}>Significant point at {point.toFixed(2)} seconds</li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default App;




// import React, { useState, useRef, useEffect } from 'react';
// import axios from 'axios';

// function App() {
//   const [audioFile, setAudioFile] = useState(null);
//   const [threshold, setThreshold] = useState(70);
//   const [audioUrl, setAudioUrl] = useState(null);
//   const [output, setOutput] = useState('');
//   const [audioDuration, setAudioDuration] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [beats, setBeats] = useState([]);
//   const [playheadPosition, setPlayheadPosition] = useState(0);

//   const audioRef = useRef(null);
//   const canvasRef = useRef(null);
//   const beatContainerRef = useRef(null);
//   const playheadIntervalRef = useRef(null);

//   useEffect(() => {
//     return () => {
//       if (playheadIntervalRef.current) {
//         clearInterval(playheadIntervalRef.current);
//       }
//     };
//   }, []);

//   const handleFileChange = (event) => {
//     const file = event.target.files[0];
//     setAudioFile(file);
//     if (file) {
//       const url = URL.createObjectURL(file);
//       setAudioUrl(url);
//       const audio = new Audio(url);
//       audio.onloadedmetadata = () => {
//         setAudioDuration(audio.duration);
//       };
//     }
//   };

//   const processAudio = async () => {
//     if (!audioFile) {
//       alert("Please select an audio file first.");
//       return;
//     }

//     const formData = new FormData();
//     formData.append('audioFile', audioFile);
//     formData.append('threshold', threshold);

//     try {
//       const response = await axios.post('/process_audio', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
//       const { waveformData, detectedBeats, duration } = response.data;
      
//       displayBeats(waveformData, duration);
//       setBeats(detectedBeats);
//       setAudioDuration(duration);
//     } catch (error) {
//       console.error("Error processing audio: ", error);
//     }
//   };

//   const displayBeats = (waveformData, duration) => {
//     const canvas = canvasRef.current;
//     canvas.width = duration * 20; // 20 pixels per second
//     canvas.height = 200; // Set a fixed height
//     drawWaveform(waveformData, canvas);
//   };

//   const drawWaveform = (data, canvas) => {
//     const ctx = canvas.getContext('2d');
//     const width = canvas.width;
//     const height = canvas.height;
//     ctx.clearRect(0, 0, width, height);
//     ctx.beginPath();
//     ctx.moveTo(0, height / 2);
//     ctx.strokeStyle = '#000000';
//     ctx.lineWidth = 1;
    
//     data.forEach((point, index) => {
//       const x = (index / data.length) * width;
//       const y = ((1 - point) / 2) * height;
//       ctx.lineTo(x, y);
//     });
    
//     ctx.stroke();
//   };

//   const playAudio = () => {
//     if (audioRef.current) {
//       audioRef.current.play();
//       setIsPlaying(true);
//       movePlayhead();
//     }
//   };

//   const movePlayhead = () => {
//     if (playheadIntervalRef.current) {
//       clearInterval(playheadIntervalRef.current);
//     }
//     setPlayheadPosition(0);

//     playheadIntervalRef.current = setInterval(() => {
//       if (audioRef.current && !audioRef.current.paused && !audioRef.current.ended) {
//         let newPosition = (audioRef.current.currentTime / audioDuration) * 100;
//         setPlayheadPosition(newPosition);
//       }
//     }, 50);
//   };

//   const getLyrics = async () => {
//     if (!audioFile) {
//       alert("Please select an audio file first.");
//       return;
//     }

//     const formData = new FormData();
//     formData.append('audioFile', audioFile);

//     try {
//       const response = await axios.post('/get_lyrics', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
//       setOutput(JSON.stringify(response.data, null, 2));
//     } catch (error) {
//       console.error('Error:', error);
//       setOutput('Failed to fetch data.');
//     }
//   };

//   return (
//     <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
//       <h1>BEAT & LYRICS TEST</h1>
//       <input type="file" accept=".mp3" onChange={handleFileChange} />
//       <input
//         type="number"
//         placeholder="Threshold (0-100)"
//         min="0"
//         max="100"
//         value={threshold}
//         onChange={(e) => setThreshold(parseInt(e.target.value))}
//         style={{ margin: '0 10px' }}
//       />
//       <button onClick={processAudio} style={{ marginRight: '10px' }}>Process Audio</button>
//       <div 
//         ref={beatContainerRef} 
//         style={{
//           position: 'relative',
//           width: '100%',
//           height: '200px',
//           backgroundColor: '#f0f0f0',
//           marginTop: '20px',
//           overflow: 'hidden'
//         }}
//       >
//         <canvas 
//           ref={canvasRef} 
//           style={{
//             position: 'absolute',
//             top: 0,
//             left: 0,
//             width: '100%',
//             height: '100%'
//           }}
//         />
//         {beats.map((beat, index) => (
//           <div
//             key={index}
//             style={{
//               position: 'absolute',
//               top: 0,
//               left: `${(beat / audioDuration) * 100}%`,
//               width: '2px',
//               height: '100%',
//               backgroundColor: 'blue',
//               zIndex: 1
//             }}
//           />
//         ))}
//         <div
//           style={{
//             position: 'absolute',
//             top: 0,
//             left: `${playheadPosition}%`,
//             width: '2px',
//             height: '100%',
//             backgroundColor: 'red',
//             zIndex: 2
//           }}
//         />
//       </div>
//       <div style={{ marginTop: '20px' }}>
//         <button onClick={playAudio} style={{ marginRight: '10px' }}>Play</button>
//         <audio 
//           ref={audioRef} 
//           src={audioUrl} 
//           controls 
//           onEnded={() => {
//             clearInterval(playheadIntervalRef.current);
//             setPlayheadPosition(0);
//           }} 
//           onPause={() => {
//             clearInterval(playheadIntervalRef.current);
//             setIsPlaying(false);
//           }}
//           onPlay={() => {
//             setIsPlaying(true);
//             movePlayhead();
//           }}
//         />
//       </div>
//       <button onClick={getLyrics} style={{ marginTop: '20px' }}>Get Lyrics</button>
//       <pre style={{ marginTop: '20px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{output}</pre>
//     </div>
//   );
// }

// export default App;

