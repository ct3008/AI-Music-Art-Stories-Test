import React, { useState } from 'react';
import axios from 'axios';
import { findSignificantPoints } from './significantPointsUtil'; // Adjust the path if needed

const AudioUpload = ({file}) => {
    // const [file, setFile] = useState(null);
    const [significantPoints, setSignificantPoints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [beats, setBeats] = useState([]); // Store the beats if you're extracting them
    const [lowEnergyBeats, setLowEnergyBeats] = useState([]); // Store low-energy beats

    const handleFileChange = (event) => {
		// console.log("file: ", event.target.files[0]);
		console.log("FILE: ", file);
        // setFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please upload an audio file.");
            return;
        }

        const formData = new FormData();
        formData.append('audioFile', file);

        try {
            setLoading(true);
            setError(null);

            const response = await axios.post('/upload_audio', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                const { detectedBeats, low_energy_timestamps, duration } = response.data; // Assuming your API returns these
				// console.log("beats: ", detectedBeats);
				// console.log("lowenergy: ", low_energy_timestamps);
                // Set local states
                setBeats(detectedBeats);
                setLowEnergyBeats(lowEnergyBeats);

                // Calculate significant points
                const significantPoints = findSignificantPoints(detectedBeats, lowEnergyBeats, duration);
				console.log("sig out");
                setSignificantPoints(significantPoints);
            } else {
                setError("Error processing the audio file.");
            }
        } catch (err) {
            setError("There was an error uploading the file.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Upload an Audio File</h2>
            {/* <input type="file" accept="audio/*" onChange={handleFileChange} /> */}
            <button onClick={handleUpload} disabled={loading}>
                {loading ? "Processing..." : "Upload"}
            </button>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <h3>Significant Points (Low-Energy Beats):</h3>
            <ul>
                {significantPoints.map((point, index) => (
                    <li key={index}>Significant point at {point.toFixed(2)} seconds</li>
                ))}
            </ul>
        </div>
    );
};

export default AudioUpload;


// import React, { useState } from 'react';
// import axios from 'axios';

// const AudioUpload = ({ onFileChange, onSignificantPoints }) => {
//   const [file, setFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const handleFileChange = (event) => {
//     const selectedFile = event.target.files[0];
//     setFile(selectedFile);
//     onFileChange(selectedFile);
//   };

//   const handleUpload = async () => {
//     if (!file) {
//       setError("Please upload an audio file.");
//       return;
//     }

//     const formData = new FormData();
//     formData.append('audioFile', file);

//     try {
//       setLoading(true);
//       setError(null);

//       const response = await axios.post('/upload_audio', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data'
//         }
//       });

//       if (response.data.success) {
//         const significantPoints = response.data.low_energy_timestamps.map(point => point.time);
//         onSignificantPoints(significantPoints);
//       } else {
//         setError("Error processing the audio file.");
//       }
//     } catch (err) {
//       setError("There was an error uploading the file.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <h2>Upload an Audio File</h2>
//       <input type="file" accept="audio/*" onChange={handleFileChange} />
//       <button onClick={handleUpload} disabled={loading}>
//         {loading ? "Processing..." : "Upload"}
//       </button>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//     </div>
//   );
// };

// export default AudioUpload;
