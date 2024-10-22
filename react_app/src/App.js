import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { findSignificantPoints } from './significantPointsUtil'; // Adjust the path if needed

function App() {
    const [audioFile, setAudioFile] = useState(null);
    const [threshold, setThreshold] = useState(70);
    const [audioUrl, setAudioUrl] = useState(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [waveformData, setWaveformData] = useState([]);
    const [beats, setBeats] = useState([]);
    const [lowEnergyBeats, setLowEnergyBeats] = useState([]);
    const [significantPoints, setSignificantPoints] = useState([]);
    const [playheadPosition, setPlayheadPosition] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showBeats, setShowBeats] = useState(true);
    const [showLowEnergyBeats, setShowLowEnergyBeats] = useState(true);
    const [showSignificantPoints, setShowSignificantPoints] = useState(true);

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

    useEffect(() => {
      // This will run whenever showBeats, showLowEnergyBeats, or showSignificantPoints changes
      updateDisplay(showBeats, showLowEnergyBeats, showSignificantPoints);
    }, [showBeats, showLowEnergyBeats, showSignificantPoints]);

    useEffect(() => {
      if (audioRef.current) {
          const audioElement = audioRef.current;

          const handleEnded = () => setIsPlaying(false);  // Reset isPlaying when audio ends

          audioElement.addEventListener('ended', handleEnded);

          // Cleanup the event listener when the component unmounts
          return () => {
              audioElement.removeEventListener('ended', handleEnded);
          };
      }
    }, [audioUrl]);

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

    const togglePlayPause = () => {
      if (audioUrl && audioRef.current) {
          if (isPlaying) {
              // Pause the audio and clear the playhead interval
              audioRef.current.pause();
              clearInterval(playheadIntervalRef.current);
              setIsPlaying(false);
          } else {
              // Play the audio and start moving the playhead
              audioRef.current.play().catch(error => {
                  console.error("Error playing audio:", error);
              });
              setIsPlaying(true);
              startPlayheadMovement();
          }
      }
    };

    const startPlayheadMovement = () => {
      if (playheadIntervalRef.current) {
          clearInterval(playheadIntervalRef.current);
      }

      playheadIntervalRef.current = setInterval(() => {
          if (audioRef.current) {
              const currentTime = audioRef.current.currentTime;
              const duration = audioRef.current.duration;

              if (!isNaN(duration)) {
                  const newPosition = (currentTime / duration) * 100;
                  setPlayheadPosition(newPosition);
              }
          }
      }, 50);  // Update every 50ms
    };

    useEffect(() => {
      if (audioRef.current) {
          const audioElement = audioRef.current;

          const handleEnded = () => {
              setIsPlaying(false);
              setPlayheadPosition(0);  // Reset the playhead when the audio ends
              clearInterval(playheadIntervalRef.current);
          };

          audioElement.addEventListener('ended', handleEnded);

          // Cleanup the event listener when the component unmounts
          return () => {
              audioElement.removeEventListener('ended', handleEnded);
          };
      }
    }, [audioUrl]);

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
                setWaveformData(waveformData); 
                setBeats(detectedBeats);
                setLowEnergyBeats(low_energy_timestamps);
                // console.log("det beats: ", detectedBeats);
                const significantPoints = findSignificantPoints(detectedBeats, low_energy_timestamps, duration);
                setSignificantPoints(significantPoints);
                console.log("sig points: ", significantPoints);

                displayBeats(waveformData, duration, detectedBeats, low_energy_timestamps, significantPoints);
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

    const displayBeats = (waveformData, duration, beats, lowEnergyBeats, significantPoints) => {
        const canvas = canvasRef.current;
        canvas.width = duration * 100;
        canvas.height = 200;
        drawWaveform(waveformData, beats, lowEnergyBeats, significantPoints, canvas, duration);
    };

    const drawWaveform = (data, beats, lowEnergyBeats, significantPoints, canvas, duration) => {
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
  
      // Draw waveform
      data.forEach((point, index) => {
          const x = (index / data.length) * width;
          const y = ((1 - point) / 2) * height;
          ctx.lineTo(x, y);
      });
      ctx.stroke();
  
      // Draw detected beats if checked
      if (showBeats) {
          beats.forEach((beat) => {
              const x = (beat.time / duration) * width;
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, height);
              ctx.strokeStyle = 'blue'; // Beat color
              ctx.lineWidth = 4;
              ctx.stroke();
          });
      }
  
      // Draw low-energy beats if checked
      if (showLowEnergyBeats) {
          lowEnergyBeats.forEach((beat) => {
              const x = (beat.time / duration) * width;
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, height);
              ctx.strokeStyle = 'red'; // Low-energy beat color
              ctx.lineWidth = 4;
              ctx.stroke();
          });
      }
  
      // Draw significant points if checked
      if (showSignificantPoints) {
          significantPoints.forEach((point) => {
              const x = (point / duration) * width;
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, height);
              ctx.strokeStyle = 'green'; // Significant point color
              ctx.lineWidth = 4;
              ctx.stroke();
          });
      }
    };
  

    // const playAudio = () => {
    //     if (audioUrl && audioRef.current) {
    //         audioRef.current.play().catch(error => {
    //             console.error("Error playing audio:", error);
    //         });
    //         setIsPlaying(true);
    //         movePlayhead();
    //     }
    // };

    // const movePlayhead = () => {
    //     if (playheadIntervalRef.current) {
    //         clearInterval(playheadIntervalRef.current);
    //     }
    //     setPlayheadPosition(0);

    //     playheadIntervalRef.current = setInterval(() => {
    //         if (audioRef.current && !audioRef.current.paused && !audioRef.current.ended) {
    //             let newPosition = (audioRef.current.currentTime / audioDuration) * 100;
    //             setPlayheadPosition(newPosition);
    //         }
    //     }, 50);
    // };

    const updateDisplay = () => {
      displayBeats(
          waveformData,
          audioDuration,
          showBeats ? beats : [],                 // Show beats if enabled
          showLowEnergyBeats ? lowEnergyBeats : [],  // Show low-energy beats if enabled
          showSignificantPoints ? significantPoints : []  // Show significant points if enabled
      );
    };

    return (
      <div style={{ fontFamily: 'Arial, sans-serif', padding: '30px', margin: 'auto', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', borderRadius: '10px', backgroundColor: '#fff' }}>
          <h1 style={{ textAlign: 'center', color: '#333' }}>Audio Beat & Lyrics Analyzer</h1>
          
          {/* File Input */}
          <div style={{ marginBottom: '20px' }}>
              <label htmlFor="audio-upload" style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Select Audio File</label>
              <input 
                  id="audio-upload" 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleFileChange} 
                  style={{ display: 'block', width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }} 
              />
          </div>
  
          {/* Threshold Input */}
          <div style={{ marginBottom: '20px' }}>
              <label htmlFor="threshold-input" style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Threshold (0-100)</label>
              <input
                  id="threshold-input"
                  type="number"
                  placeholder="Threshold (0-100)"
                  min="0"
                  max="100"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  style={{ display: 'block', width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
              />
          </div>
  
          {/* Process Audio Button */}
          <button 
              onClick={processAudio} 
              style={{ 
                  width: '100%', padding: '12px 0', backgroundColor: '#4CAF50', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer',
                  transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45A049'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
          >
              {loading ? "Processing..." : "Process Audio"}
          </button>
  
          {/* Error Message */}
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
  
          {/* Checkbox Controls */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '14px', cursor: 'pointer' }}>
                  <input
                      type="checkbox"
                      checked={showBeats}
                      onChange={() => {
                          setShowBeats(prevState => !prevState);
                          updateDisplay();
                      }}
                      style={{ marginRight: '8px' }}
                  />
                  Show Beats
              </label>
  
              <label style={{ fontSize: '14px', cursor: 'pointer' }}>
                  <input
                      type="checkbox"
                      checked={showLowEnergyBeats}
                      onChange={() => {
                          setShowLowEnergyBeats(prevState => !prevState);
                          updateDisplay();
                      }}
                      style={{ marginRight: '8px' }}
                  />
                  Show Low-Energy Beats
              </label>
  
              <label style={{ fontSize: '14px', cursor: 'pointer' }}>
                  <input
                      type="checkbox"
                      checked={showSignificantPoints}
                      onChange={() => {
                          setShowSignificantPoints(prevState => !prevState);
                          updateDisplay();
                      }}
                      style={{ marginRight: '8px' }}
                  />
                  Show Significant Points
              </label>
          </div>
  
          {/* Waveform Display */}
          <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#f0f0f0', marginTop: '20px', overflow: 'hidden', borderRadius: '10px', border: '1px solid #ddd' }}>
              <canvas ref={canvasRef} style={{ position: 'absolute', width: '100%', height: '100%' }} />
              <div style={{ position: 'absolute', top: 0, left: `${playheadPosition}%`, width: '2px', height: '100%', backgroundColor: 'red', zIndex: 2 }} />
          </div>
  
          {/* Play Button */}
          <button 
              onClick={togglePlayPause} 
              style={{ 
                  width: '100%', padding: '12px 0', backgroundColor: isPlaying ? '#FF5722' : '#4CAF50', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '16px', marginTop: '20px', cursor: 'pointer',
                  transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = isPlaying ? '#E64A19' : '#45A049'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = isPlaying ? '#FF5722' : '#4CAF50'}
          >
              {isPlaying ? "Pause" : "Play"}
          </button>
  
          {/* Hidden Audio Element */}
          <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              style={{ display: 'none' }}  // Hide native audio controls
          />
      </div>
  );
  
}

export default App;

