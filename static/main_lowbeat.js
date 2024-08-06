const player = document.getElementById('audioPlayer');

const textContainer = document.querySelector('.textContainer');



var playheadInterval;

let audioDuration;

let lowEnergyBeats = {};

let significantPoints = [];

let motion_mode = "3D";

function movePlayhead(audioPlayer) {
    const playhead = document.getElementById('playhead');
    const containerWidth = document.getElementById('beatContainer').offsetWidth; // Width of the container
    const duration = audioDuration;// Duration of the audio in seconds

    console.log(containerWidth, duration);

    // Calculate pixels per second
    const pixelsPerSecond = containerWidth / duration;

    clearInterval(playheadInterval);
    playhead.style.left = '0px'; // Reset position at the start

    playheadInterval = setInterval(function () {
        if (!audioPlayer.paused && !audioPlayer.ended) {
            // Calculate new position based on pixels per second
            let newPosition = parseFloat(playhead.style.left, 10) + (pixelsPerSecond * 0.1); // Multiply by 0.05 because the interval is 50 milliseconds
            playhead.style.left = `${newPosition}px`;
        }
    }, 100); // Update every 50 milliseconds
}


// Ensure you have a function to clear the interval when the audio stops or ends
document.getElementById('audioPlayer').addEventListener('ended', function () {
    clearInterval(playheadInterval);
    document.getElementById('playhead').style.left = '0px'; // Optionally reset the playhead
});

document.getElementById('audioPlayer').addEventListener('pause', function () {
    clearInterval(playheadInterval);
});

function playAudio() {
    var file = document.getElementById("audioFile").files[0];
    if (file) {
        var audioPlayer = document.getElementById("audioPlayer");
        audioPlayer.src = URL.createObjectURL(file);
        audioPlayer.style.display = "block";
        audioPlayer.addEventListener('loadedmetadata', function () {
            audioDuration = audioPlayer.duration; // Set the duration once metadata is loaded
            console.log("Audio Duration: " + audioDuration + " seconds"); // Optional: Log duration to console
            movePlayhead(audioPlayer);
        });
        audioPlayer.play();
    } else {
        alert("Please upload an MP3 file first.");
    }
}

function finalizeTimestamps(name) {
    const timestampsContainer = document.getElementById('timestampsContainer');
    timestampsContainer.innerHTML = ''; // Clear previous timestamps

    significantPoints.forEach(time => {
        const timestampElement = document.createElement('div');
        timestampElement.textContent = `Time: ${time.toFixed(2)} seconds`;
        timestampsContainer.appendChild(timestampElement);
    });

    const roundedSignificantPoints = significantPoints.map(point => point.toFixed(2));
    const timestamps = [0, ...roundedSignificantPoints, audioDuration.toFixed(2)].map(Number);

    const sectionsCount = significantPoints.length; // Define sectionsCount based on the timestamps array length
    let container;
    let labels = [];
    if (name === 'time') {
        container = document.getElementById('trash');
        labels = ['Vibe', 'Imagery', 'Texture', 'Style', 'Color', 'Motion', 'Strength', 'Speed'];
    } else if (name === 'transition') {
        container = document.getElementById('transitionsContainer');
        container.style.border = '2px solid black'; // Corrected styling syntax
        const button = document.getElementById('add-transition');
        if (button) button.style.display = 'none'; // Hide button if it exists
        labels = ['Motion', 'Strength', 'Speed'];
    }

    container.innerHTML = ''; // Clear previous content
    container.style.setProperty('--sections-count', sectionsCount);

    // const labels = ['Vibe', 'Imagery', 'Texture', 'Style', 'Color', 'Motion', 'Strength', 'Speed'];
    const vibes = ['calm', 'epic', 'aggressive', 'chill', 'dark', 'energetic', 'epic', 'ethereal', 'happy', 'romantic', 'sad', 'scary', 'sexy', 'uplifting'];
    const textures = ['painting', 'calligraphy brush ink stroke', 'pastel watercolor on canvas', 'charcoal drawing', 'pencil drawing'];
    const styles = ['abstract', 'impressionist', 'futuristic', 'contemporary', 'renaissance', 'surrealist', 'minimalist', 'digital'];
    const imageries = ['blossoming flower', 'chaotic intertwining lines', 'flowing waves', 'starry night', 'curvilinear intertwined circles'];
    const colorOptions = ['black/white', 'pale blue', 'full color'];
    const motions = ['zoom_in', 'zoom_out', 'pan_right', 'pan_left', 'pan_up', 'pan_down', 'spin_cw', 'spin_ccw', 'rotate_up', 'rotate_down', 'rotate_right', 'rotate_left', 'rotate_cw', 'rotate_ccw', 'none'];
    const strengths = ['weak', 'normal', 'strong', 'vstrong'];
    const speeds = ['vslow', 'slow', 'normal', 'fast', 'vfast'];

    // Create labels container
    const labelsContainer = document.createElement('div');
    labelsContainer.className = 'label-container';
    labels.forEach(label => {
        const labelElement = document.createElement('div');
        labelElement.className = 'label';
        labelElement.innerText = label;
        labelsContainer.appendChild(labelElement);
    });
    container.appendChild(labelsContainer);

    // Create sections with time range and input boxes
    for (let i = 0; i < sectionsCount + 1; i++) { // Adjust loop to include all sections
        const section = document.createElement('div');
        section.className = 'section';

        // Add time range or transition label
        const timeRange = document.createElement('div');
        timeRange.className = 'time-range';
        if (name === 'time') {
            timeRange.innerText = `${timestamps[i]}-${timestamps[i + 1]}`;
        } else if (name === 'transition') {
            if (i === sectionsCount) {
                const start = (parseFloat(timestamps[i + 1])- 0.5).toFixed(2);
                timeRange.innerText = `Transition ${i + 1}: ${start} - ${audioDuration.toFixed(2)}`;
            } else {
                const start = (parseFloat(timestamps[i + 1])-0.5).toFixed(2);
                const end = (parseFloat(timestamps[i + 1])+ 0.5).toFixed(2);
                timeRange.innerText = `Transition ${i + 1}: ${start} - ${end}`;
            }
            // timeRange.innerText = `Transition ${i + 1}`;
        }
        section.appendChild(timeRange);

        // Add input boxes with unique ids and datalists for dropdowns
        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';
        labels.forEach((label, index) => {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'dropdown-input'; // Add class for consistent width

            if (name === 'time') {
                input.id = `${label.toLowerCase()}_form_${i + 1}`;
            } else if (name === 'transition') {
                input.id = `${label.toLowerCase()}_trans_${i + 1}`;
            }

            // Create datalist for dropdown options
            const datalist = document.createElement('datalist');
            datalist.id = `${label.toLowerCase()}_options_${i + 1}`;

            let options;
            switch (label.toLowerCase()) {
                case 'vibe':
                    options = vibes;
                    break;
                case 'texture':
                    options = textures;
                    break;
                case 'style':
                    options = styles;
                    break;
                case 'imagery':
                    options = imageries;
                    break;
                case 'color':
                    options = colorOptions;
                    break;
                case 'motion':
                    options = motions;
                    break;
                case 'strength':
                    options = strengths;
                    break;
                case 'speed':
                    options = speeds;
                    break;
            }

            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                datalist.appendChild(optionElement);
            });

            input.setAttribute('list', datalist.id);
            inputContainer.appendChild(input);
            inputContainer.appendChild(datalist);
        });

        section.appendChild(inputContainer);
        container.appendChild(section);
    }
}


function fillDefaults() {
    const vibes = ['calm', 'epic', 'aggressive', 'chill', 'dark', 'energetic', 'epic', 'ethereal', 'happy', 'romantic', 'sad', 'scary', 'sexy', 'uplifting'];
    const textures = ['painting', 'calligraphy brush ink stroke', 'pastel watercolor on canvas', 'charcoal drawing', 'pencil drawing'];
    const styles = ['abstract', 'impressionist', 'futuristic', 'contemporary', 'renaissance', 'surrealist', 'minimalist', 'digital'];
    const imageries = ['blossoming flower', 'chaotic intertwining lines', 'flowing waves', 'starry night', 'curvilinear intertwined circles'];
    const colorOptions = ['black/white', 'pale blue', 'full color'];
    const motions = ['zoom_in', 'zoom_out', 'pan_right', 'pan_left', 'pan_up', 'pan_down', 'spin_cw', 'spin_ccw', 'rotate_up', 'rotate_down', 'rotate_right', 'rotate_left', 'rotate_cw', 'rotate_ccw', 'none'];
    const strengths = ['weak', 'normal', 'strong', 'vstrong'];
    const speeds = ['vslow', 'slow', 'normal', 'fast', 'vfast'];

    const sections = document.querySelectorAll('.section');

    // Choose one random texture and style for consistency
    const chosenTexture = textures[Math.floor(Math.random() * textures.length)];
    const chosenStyle = styles[Math.floor(Math.random() * styles.length)];

    sections.forEach((section, index) => {
        const inputs = section.querySelectorAll('input');

        inputs.forEach(input => {
            if (input.id.includes('vibe_form')) {
                if (!input.value) {
                    input.value = vibes[Math.floor(Math.random() * vibes.length)];
                }
            } else if (input.id.includes('texture_form')) {
                if (!input.value) {
                    input.value = chosenTexture;
                }
            } else if (input.id.includes('style_form')) {
                if (!input.value) {
                    input.value = chosenStyle;
                }
            } else if (input.id.includes('imagery_form')) {
                if (!input.value) {
                    input.value = imageries[Math.floor(Math.random() * imageries.length)];
                }
            } else if (input.id.includes('color_form')) {
                if (!input.value) {
                    const midIndex = Math.floor(sections.length / 2);
                    if (index < 2 || index >= sections.length - 2) {
                        input.value = 'black/white';
                    } else if (index < midIndex) {
                        input.value = 'pale blue';
                    } else {
                        input.value = 'full color';
                    }
                }
            } else if (input.id.includes('motion_form')) {
                if (!input.value) {
                    input.value = 'zoom_in';
                }
            } else if (input.id.includes('strength_form')) {
                if (!input.value) {
                    input.value = 'normal';
                }
            } else if (input.id.includes('speed_form')) {
                if (!input.value) {
                    input.value = 'normal';
                }
            }
        });
    });
}



function fillTransitionDefaults() {
    const transitionSections = document.querySelectorAll('#transitionsContainer .section');

    transitionSections.forEach((section, index) => {
        const inputs = section.querySelectorAll('input');

        inputs.forEach(input => {
            if (input.id.includes('motion_trans')) {
                if (!input.value) {
                    input.value = index === transitionSections.length - 1 ? 'rotate_ccw' : 'rotate_right';
                }
            } else if (input.id.includes('strength_trans')) {
                if (!input.value) {
                    input.value = index === transitionSections.length - 1 ? 'strong' : 'normal';
                }
            } else if (input.id.includes('speed_trans')) {
                if (!input.value) {
                    input.value = 'fast';
                }
            }
        });
    });
}

function gatherFormData() { // Example significant points; replace with your actual significantPoints array
    const roundedSignificantPoints = significantPoints.map(point => point.toFixed(2));

    // Prepare form data dictionary
    const formData = {};
    roundedSignificantPoints.forEach((timestamp, index) => {
        formData[timestamp] = {
            "vibe": document.getElementById(`vibe_form_${index + 1}`).value,
            "imagery": document.getElementById(`imagery_form_${index + 1}`).value,
            "texture": document.getElementById(`texture_form_${index + 1}`).value,
            "style": document.getElementById(`style_form_${index + 1}`).value,
            "color": document.getElementById(`color_form_${index + 1}`).value,
            "motion": document.getElementById(`motion_form_${index + 1}`).value,
            "strength": document.getElementById(`strength_form_${index + 1}`).value,
            "speed": document.getElementById(`speed_form_${index + 1}`).value
        };
    });

    return formData;
}

// Function to gather transition data
function gatherTransitionData(formData) {
    const roundedSignificantPoints = significantPoints.map(point => point.toFixed(2));
    const timestamps = [0, ...roundedSignificantPoints, audioDuration.toFixed(2)].map(Number);

    const transitionsData = {};
    for (let i = 0; i < timestamps.length - 1; i++) {
        const start = (parseFloat(timestamps[i + 1]) - 0.5).toFixed(2);
        const end = (parseFloat(timestamps[i + 1]) + 0.5).toFixed(2);
        const timeRange = `${start}-${end}`;
        // console.log(formData[timestamps[i]])
        
        // transitionsData[timeRange] = {
        //     "vibe": document.getElementById(`vibe_trans_${i + 1}`).value || document.getElementById(`vibe_form_${i + 1}`).value,
        //     "imagery": document.getElementById(`imagery_trans_${i + 1}`).value || document.getElementById(`imagery_form_${i + 1}`).value,
        //     "texture": document.getElementById(`texture_trans_${i + 1}`).value || document.getElementById(`texture_form_${i + 1}`).value,
        //     "style": document.getElementById(`style_trans_${i + 1}`).value || document.getElementById(`style_form_${i + 1}`).value,
        //     "color": document.getElementById(`color_trans_${i + 1}`).value || document.getElementById(`color_form_${i + 1}`).value,
        //     "motion": document.getElementById(`motion_trans_${i + 1}`).value || document.getElementById(`motion_form_${i + 1}`).value,
        //     "strength": document.getElementById(`strength_trans_${i + 1}`).value || document.getElementById(`strength_form_${i + 1}`).value,
        //     "speed": document.getElementById(`speed_trans_${i + 1}`).value || document.getElementById(`speed_form_${i + 1}`).value
        // };
        transitionsData[timeRange] = {
            "vibe": document.getElementById(`vibe_form_${i + 1}`).value,
            "imagery": document.getElementById(`imagery_form_${i + 1}`).value,
            "texture": document.getElementById(`texture_form_${i + 1}`).value,
            "style":  document.getElementById(`style_form_${i + 1}`).value,
            "color": document.getElementById(`color_form_${i + 1}`).value,
            "motion": document.getElementById(`motion_trans_${i + 1}`).value || document.getElementById(`motion_form_${i + 1}`).value,
            "strength": document.getElementById(`strength_trans_${i + 1}`).value || document.getElementById(`strength_form_${i + 1}`).value,
            "speed": document.getElementById(`speed_trans_${i + 1}`).value || document.getElementById(`speed_form_${i + 1}`).value
        };
        // console.log(transitionsData);
        
        // transitionsData[timeRange].transition = !!(
        //     document.getElementById(`vibe_trans_${i + 1}`).value ||
        //     document.getElementById(`imagery_trans_${i + 1}`).value ||
        //     document.getElementById(`texture_trans_${i + 1}`).value ||
        //     document.getElementById(`style_trans_${i + 1}`).value ||
        //     document.getElementById(`color_trans_${i + 1}`).value ||
        //     document.getElementById(`motion_trans_${i + 1}`).value ||
        //     document.getElementById(`strength_trans_${i + 1}`).value ||
        //     document.getElementById(`speed_trans_${i + 1}`).value
        // );
        if(document.getElementById(`motion_trans_${i + 1}`).value && document.getElementById(`strength_trans_${i + 1}`).value && document.getElementById(`speed_trans_${i + 1}`).value) {
            transitionsData[timeRange]["transition"] = true;
        }else {
            transitionsData[timeRange]["transition"] = false;
        }
        console.log(transitionsData);
    }

    return transitionsData;
}

function processTable(){
    const formData = gatherFormData();
    const transitionsData = gatherTransitionData(formData);
    const data = {
        timestamps_scenes: significantPoints.map(point => point.toFixed(2)),  // Replace with your actual timestamps_scenes
        form_data: formData,
        transitions_data: transitionsData,
        song_len: audioDuration,
        motion_mode: motion_mode
    };
    console.log(data);

    fetch('/process-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        console.log("returned back");
        for (const [key, value] of Object.entries(data)) {
            console.log(`${key}: ${value}`);
            if (key === 'output') {
                console.log(value);
                window.open(value, '_blank');
            }
        }
        let resultHTML = '';

        if (data.animation_prompts) {
            resultHTML += `<h3>Animation Prompts:</h3><p>${data.animation_prompts}</p>`;
        }

        if (data.motion_strings) {
            resultHTML += `<h3>Motion Strings:</h3><p>${data.motion_strings}</p>`;
        }

        if (data.prompts) {
            resultHTML += `<h3>Prompts:</h3><p>${data.prompts}</p>`;
        }

        if (data.output) {
            resultHTML += `<h3>Output:</h3><p><a href="${data.output}" target="_blank">Click here to view the output</a></p>`;
        }

        document.getElementById('processedDataContainer').innerHTML = resultHTML;
        document.getElementById('processedDataContainer').style = "border: 2px solid black;"
    })
    .catch(error => {
        console.error('Error:', error);
    });
}



function processAudio() {
    const fileInput = document.getElementById('audioFile');
    const thresholdInput = document.getElementById('threshold');
    const beatContainer = document.getElementById('beatContainer');
    const waveformCanvas = document.getElementById('waveformCanvas');
    const audioPlayer = document.getElementById('audioPlayer');
    const clearButton = document.getElementById('clearButton');

    clearButton.click();
    if (fileInput.files.length === 0) {
        alert("Please select an audio file first.");
        return;
    }

    const formData = new FormData();
    formData.append('audioFile', fileInput.files[0]);
    

    fetch('/upload_audio', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('outputContainer').textContent = JSON.stringify(data.output, null, 2);
            lowEnergyBeats = data.low_energy_timestamps; // Update the global variable
            audioDuration = data.duration;
            console.log("LOW ENERGY");
            console.log(lowEnergyBeats); // Log for debugging

            // Now process the audio after lowEnergyBeats are fetched
            processAudioFile(fileInput, thresholdInput, beatContainer, waveformCanvas, audioPlayer);
        } else {
            document.getElementById('outputContainer').textContent = 'Error: ' + data.error;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('outputContainer').textContent = 'Failed to fetch data.';
    });
}

function processAudioFile(fileInput, thresholdInput, beatContainer, waveformCanvas, audioPlayer) {
    const audioContext = new AudioContext();
    const reader = new FileReader();

    reader.onload = function (event) {
        audioContext.decodeAudioData(event.target.result, function (buffer) {
            const channelData = buffer.getChannelData(0); // Assume mono or just use the first channel
            const sampleRate = buffer.sampleRate;
            let beats_time = []

            displayBeats(channelData, beatContainer, audioPlayer, event.target.result, buffer, fileInput);
            const beats = detectBeats(channelData, sampleRate, thresholdInput.value);
            console.log("BEATS: ");
            beats.forEach(beat => {
                beats_time.push(beat.time);
            });
            console.log("BEAT TIME: " + beats_time);

            // Draw the fetched lowEnergyBeats
            let lowEnergyBeatTimes = [];
            lowEnergyBeats.forEach(beats => {
                lowEnergyBeatTimes.push(beats.time);
            });
            console.log("LOW BEAT TIMES: " + lowEnergyBeatTimes);
            drawBeats(lowEnergyBeatTimes, beatContainer, buffer.duration, 'blue');
            drawBeats(beats_time, beatContainer, buffer.duration, 'red');
            // console.log(beats);
            // console.log(lowEnergyBeats);
            significantPoints = findSignificantPoints(beats, lowEnergyBeats, audioDuration);
            console.log("SIG POINTS: " + significantPoints);
            drawBeats(significantPoints, beatContainer, buffer.duration, 'green', true);
        }, function (error) {
            console.error("Error decoding audio data: " + error);
        });
    };

    reader.readAsArrayBuffer(fileInput.files[0]);
}

function filterClosePoints(points, maxGap) {
    const sortedPoints = points.slice().sort((a, b) => a - b);
    const filtered = [sortedPoints[0]]; // Start with the first point

    for (let i = 1; i < sortedPoints.length; i++) {
        if (sortedPoints[i] - filtered[filtered.length - 1] > maxGap) {
            filtered.push(sortedPoints[i]);
        }
    }

    return filtered;
}

function findSignificantPoints(beats, lowEnergyBeats, songDuration) {
    // Step 1: Combine beats and lowEnergyBeats with metadata
    const combined = [];
    beats.forEach(point => combined.push({ time: point.time, source: 'beat', strength: point.strength }));
    lowEnergyBeats.forEach(point => combined.push({ time: point.time, source: 'lowEnergy', strength: point.strength }));

    // Step 2: Sort combined array by time
    combined.sort((a, b) => a.time - b.time);

    // Exclude points too close to the beginning or end
    const excludedPoints = combined.filter(point => 
        point.time > 3 && point.time < (songDuration - 4)
    );

    // Step 3: Clustering
    const clustered = [];
    let currentCluster = [];
    const minDistance = 1; // Minimum distance between points to be in the same cluster
    const maxLowEnergyDistance = 3; // Maximum distance for lowEnergyBeats to be clustered together

    for (let i = 0; i < excludedPoints.length; i++) {
        if (currentCluster.length === 0) {
            currentCluster.push(excludedPoints[i]);
        } else {
            const lastPoint = currentCluster[currentCluster.length - 1];
            const currentPoint = excludedPoints[i];

            if (currentPoint.source === 'lowEnergy' && (currentPoint.time - currentCluster[0].time) <= maxLowEnergyDistance) {
                currentCluster.push(currentPoint);
            } else if ((currentPoint.time - lastPoint.time) < minDistance) {
                currentCluster.push(currentPoint);
            } else {
                clustered.push(currentCluster);
                currentCluster = [currentPoint];
            }
        }
    }

    if (currentCluster.length > 0) {
        clustered.push(currentCluster);
    }

    // Step 4: Selecting points
    const finalPoints = [];
    clustered.forEach(cluster => {
        if (cluster.length > 0) {
            // Check for clusters with multiple lowEnergyBeats
            const lowEnergyPoints = cluster.filter(point => point.source === 'lowEnergy');
            if (lowEnergyPoints.length > 1) {
                // Average the locations of lowEnergyBeats
                const lowEnergySum = lowEnergyPoints.reduce((sum, point) => sum + point.time, 0);
                const averageLowEnergy = lowEnergySum / lowEnergyPoints.length;
                finalPoints.push(averageLowEnergy);
            } else {
                // Select the most significant point in each cluster
                const significantPoint = cluster.reduce((prev, curr) => {
                    // Prefer points with higher strength
                    if (curr.source === 'beat' && (prev.source !== 'beat' || curr.strength > prev.strength)) return curr;
                    return prev;
                }, cluster[0]);

                finalPoints.push(significantPoint.time);
            }
        }
    });

    // Ensure we have roughly 10 points
    const desiredCount = Math.floor(songDuration / 4);

    // Combine or average points within 2.5 seconds of each other
    const combinedFinalPoints = [];
    for (let i = 0; i < finalPoints.length; i++) {
        if (combinedFinalPoints.length === 0) {
            combinedFinalPoints.push(finalPoints[i]);
        } else {
            const lastPoint = combinedFinalPoints[combinedFinalPoints.length - 1];
            const currentPoint = finalPoints[i];
            if (currentPoint - lastPoint <= 2.5) {
                // Average the points
                combinedFinalPoints[combinedFinalPoints.length - 1] = (lastPoint + currentPoint) / 2;
            } else {
                combinedFinalPoints.push(currentPoint);
            }
        }
    }

    if (combinedFinalPoints.length > desiredCount) {
        return combinedFinalPoints.slice(0, desiredCount);
    } else {
        return insertAdditionalPoints(combinedFinalPoints, combined, beats, lowEnergyBeats, desiredCount, songDuration);
    }
}

function insertAdditionalPoints(finalPoints, allPoints, beats, lowEnergyBeats, desiredCount, songDuration) {
    const newPoints = [...finalPoints];
    newPoints.sort((a, b) => a - b);

    const minGap = 2.5;
    let loopCounter = 0;
    const maxLoops = 5;
    let lastNewPointLength = -1;

    while (newPoints.length < desiredCount) {
        const gaps = [];

        // Include the start of the song as a gap
        if (newPoints.length === 0 || newPoints[0] > 0) {
            gaps.push({ start: 0, end: newPoints[0] || songDuration, gap: newPoints[0] || songDuration });
        }

        for (let i = 0; i < newPoints.length - 1; i++) {
            const start = newPoints[i];
            const end = newPoints[i + 1];
            gaps.push({ start, end, gap: end - start });
        }

        // Include the end of the song as a gap
        if (newPoints.length === 0 || newPoints[newPoints.length - 1] < songDuration) {
            gaps.push({ start: newPoints[newPoints.length - 1] || 0, end: songDuration, gap: songDuration - (newPoints[newPoints.length - 1] || 0) });
        }

        const maxGapObj = gaps.reduce((max, gap) => gap.gap > max.gap ? gap : max, { gap: 0 });

        if (maxGapObj.gap >= minGap) {
            const midPoint = (maxGapObj.start + maxGapObj.end) / 2;
            const nearbyPoints = allPoints.filter(p => p.time >= maxGapObj.start && p.time <= maxGapObj.end);

            const lowEnergyCandidates = nearbyPoints.filter(p => p.source === 'lowEnergy' && Math.abs(p.time - midPoint) <= 2);
            if (lowEnergyCandidates.length > 0) {
                const centerPoint = lowEnergyCandidates.reduce((sum, point) => sum + point.time, 0) / lowEnergyCandidates.length;
                if (!newPoints.some(p => Math.abs(p - centerPoint) <= minGap) && centerPoint > 3 && centerPoint < (songDuration - 3)) {
                    newPoints.push(centerPoint);
                }
            } else {
                const beatCandidates = nearbyPoints.filter(p => p.source === 'beat' && Math.abs(p.time - midPoint) <= 2);
                if (beatCandidates.length > 0) {
                    const chosenPoint = beatCandidates[0].time;
                    if (!newPoints.some(p => Math.abs(p - chosenPoint) <= minGap) && chosenPoint > 3 && chosenPoint < (songDuration - 3)) {
                        newPoints.push(chosenPoint);
                    }
                } else {
                    if (!newPoints.some(p => Math.abs(p - midPoint) <= minGap) && midPoint > 3 && midPoint < (songDuration - 3)) {
                        newPoints.push(midPoint);
                    }
                }
            }
        } else {
            // Add directly from beats and lowEnergyBeats if necessary
            let addedPoints = false;

            for (let i = 0; i < lowEnergyBeats.length && newPoints.length < desiredCount; i++) {
                if (!newPoints.includes(lowEnergyBeats[i].time) && (newPoints.length === 0 || lowEnergyBeats[i].time - newPoints[newPoints.length - 1] >= minGap) && lowEnergyBeats[i].time > 3 && lowEnergyBeats[i].time < (songDuration - 3)) {
                    newPoints.push(lowEnergyBeats[i].time);
                    addedPoints = true;
                }
            }
            for (let i = 0; i < beats.length && newPoints.length < desiredCount; i++) {
                if (!newPoints.includes(beats[i].time) && (newPoints.length === 0 || beats[i].time - newPoints[newPoints.length - 1] >= minGap) && beats[i].time > 3 && beats[i].time < (songDuration - 3)) {
                    newPoints.push(beats[i].time);
                    addedPoints = true;
                }
            }

            if (!addedPoints) {
                loopCounter++;
                if (loopCounter > maxLoops) {
                    break; // Exit if too many iterations
                }
            }
        }

        // Sort again to find new gaps
        newPoints.sort((a, b) => a - b);

        // Check if the length of newPoints is within 2 of the desiredCount
        if (desiredCount - newPoints.length <= 2) {
            break; // Exit if close to desired count
        }

        // Break if no new points are added to prevent infinite loops
        if (newPoints.length === lastNewPointLength) {
            break;
        } else {
            lastNewPointLength = newPoints.length;
        }
    }

    // Ensure no duplicates and the exact desired count
    return [...new Set(newPoints)].slice(0, desiredCount);
}


function drawBeats(beats, beatContainer, duration, color, hidden = false) {
    beats.forEach((beat, index) => {
        const beatLine = document.createElement('div');
        beatLine.className = 'beat';
        beatLine.style.left = `${(beat / duration) * beatContainer.offsetWidth}px`;
        beatLine.style.height = '100%';
        beatLine.style.width = '2px';
        beatLine.style.position = 'absolute';
        beatLine.style.backgroundColor = color;
        if (hidden) {
            beatLine.style.display = 'none';
            beatLine.classList.add('hidden-beat');
        }
        beatContainer.appendChild(beatLine);
    });
}



function detectBeats(data, sampleRate, threshold) {
    const beats = [];
    let minSamplesBetweenBeats = sampleRate / 2; // Minimum half-second between beats
    let lastBeatIndex = -minSamplesBetweenBeats;

    threshold = threshold / 100; // Convert threshold to match amplitude range of audio data

    for (let i = 0; i < data.length; i++) {
        if (Math.abs(data[i]) > threshold) {
            if (i - lastBeatIndex > minSamplesBetweenBeats) {
                // Store beat time and strength (absolute value of sample)
                beats.push({ time: i / sampleRate, strength: Math.abs(data[i]) });
                lastBeatIndex = i;
            }
        }
    }
    return beats;
}


function getMimeType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
        case 'mp3':
            return 'audio/mp3';
        case 'wav':
            return 'audio/wav';
        default:
            return 'audio/mpeg'; // Default to mp3
    }
}

function displayBeats(data, beatContainer, audioPlayer, audioData, buffer, fileInput) {
    const canvas = document.getElementById('waveformCanvas');
    const durationInSeconds = buffer.duration;
    canvas.width = durationInSeconds * 20; // 20 pixels per second
    drawWaveform(data, canvas, durationInSeconds);

    const blob = new Blob([audioData], { type: getMimeType(fileInput.files[0].name) });
    audioPlayer.src = URL.createObjectURL(blob);
    audioPlayer.hidden = false;
}

function drawWaveform(data, canvas, duration) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height); // Clear previous drawings
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    const step = Math.ceil(data.length / width);
    for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        const yLow = ((min + 1) / 2) * height;
        const yHigh = ((max + 1) / 2) * height;
        ctx.lineTo(i, yLow);
        ctx.lineTo(i, yHigh);
    }
    ctx.stroke();
}

function clearBeats() {
    const beatContainer = document.getElementById('beatContainer');
    const beats = document.querySelectorAll('.beat');
    beats.forEach(beat => beatContainer.removeChild(beat));
}

function showSignificantPoints() {
    document.querySelectorAll('.hidden-beat').forEach(beat => {
        beat.style.display = 'block';
    });
    document.querySelectorAll('.beat').forEach(beat => {
        if (!beat.classList.contains('hidden-beat')) {
            beat.style.display = 'none';
        }
    });
}

function hideAllBeats() {
    document.querySelectorAll('.beat').forEach(beat => beat.style.display = 'none');
}

// document.getElementById('findIdealIntervals').addEventListener('click', showSignificantPoints);
document.getElementById('hideBeats').addEventListener('click', hideAllBeats);


function getLyrics() {
    const fileInput = document.getElementById('audioFile');
    if (fileInput.files.length === 0) {
        alert("Please select an audio file first.");
        return;
    }

    const formData = new FormData();
    formData.append('audioFile', fileInput.files[0]);

    fetch('/upload_audio', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('outputContainer').textContent = JSON.stringify(data.output, null, 2);
            lowEnergyBeats = data.low_energy_timestamps; // Update the global variable
            console.log("LOW ENERGY: " + lowEnergyBeats); // Log for debugging
            // Optionally call a function to update UI or handle lowEnergyBeats here
            updateUIWithLowEnergyBeats(); // Example function call
        } else {
            document.getElementById('outputContainer').textContent = 'Error: ' + data.error;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('outputContainer').textContent = 'Failed to fetch data.';
    });
}

function toggleMotion() {
    const button = document.getElementById("toggleMotionButton");
    if (button.textContent === "3D Motion") {
        button.textContent = "2D Motion";
        motion_mode = "2D";
        // Add code here to handle the change to 3D motion
        console.log("Switched to 2D Motion");
    } else {
        button.textContent = "3D Motion";
        motion_mode = "3D";
        // Add code here to handle the change to 2D motion
        console.log("Switched to 3D Motion");
    }
}

