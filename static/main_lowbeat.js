const player = document.getElementById('audioPlayer');

const textContainer = document.querySelector('.textContainer');



var playheadInterval;

let audioDuration;

let lowEnergyBeats = {};

let significantPoints = [];

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

function finalizeTimestamps() {
    const timestampsContainer = document.getElementById('timestampsContainer');
    timestampsContainer.innerHTML = 'hello'; // Clear previous timestamps

    console.log(significantPoints);
    significantPoints.forEach(time => {
        console.log(time);
        const timestampElement = document.createElement('div');
        timestampElement.textContent = `Time: ${time.toFixed(2)} seconds`;
        timestampsContainer.appendChild(timestampElement);
    });

    const timestamps = significantPoints;
    // const sectionsCount = timestamps.length + 1;
    // const container = document.getElementById('trash');

    // container.innerHTML = ''; // Clear previous content
    // container.style.setProperty('--sections-count', sectionsCount);

    // const labels = ['Vibe', 'Imagery', 'Texture', 'Color', 'Motion', 'Strength', 'Speed'];

    // // Create labels container
    // const labelsContainer = document.createElement('div');
    // labelsContainer.className = 'label-container';
    // labels.forEach(label => {
    //     const labelElement = document.createElement('div');
    //     labelElement.className = 'label';
    //     labelElement.innerText = label;
    //     labelsContainer.appendChild(labelElement);
    // });
    // container.appendChild(labelsContainer);

    // // Create sections with time range and input boxes
    // for (let i = 0; i < sectionsCount; i++) {
    //     const section = document.createElement('div');
    //     section.className = 'section';

    //     // Add time range
    //     const timeRange = document.createElement('div');
    //     timeRange.className = 'time-range';
    //     timeRange.innerText = `Time ${i + 1}`;
    //     section.appendChild(timeRange);

    //     // Add input boxes
    //     const inputContainer = document.createElement('div');
    //     inputContainer.className = 'input-container';
    //     labels.forEach(() => {
    //         const input = document.createElement('input');
    //         input.type = 'text';
    //         inputContainer.appendChild(input);
    //     });

    //     section.appendChild(inputContainer);
    //     container.appendChild(section);
    // }

    // // Add vertical dividers
    // const containerElement = document.querySelector('.container');
    // for (let i = 1; i < sectionsCount; i++) {
    //     const divider = document.createElement('div');
    //     divider.className = 'divider';
    //     divider.style.left = `calc(${(i / sectionsCount) * 100}% - 1px)`;
    //     containerElement.appendChild(divider);
    // }
    const sectionsCount = timestamps.length + 1;
    const container = document.getElementById('trash');

    container.innerHTML = ''; // Clear previous content
    container.style.setProperty('--sections-count', sectionsCount);

    const labels = ['Vibe', 'Imagery', 'Texture', 'Color', 'Motion', 'Strength', 'Speed'];

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
    for (let i = 0; i < sectionsCount; i++) {
        const section = document.createElement('div');
        section.className = 'section';

        // Add time range
        const timeRange = document.createElement('div');
        timeRange.className = 'time-range';
        timeRange.innerText = `Time ${i + 1}`;
        section.appendChild(timeRange);

        // Add input boxes
        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';
        labels.forEach(() => {
            const input = document.createElement('input');
            input.type = 'text';
            inputContainer.appendChild(input);
        });

        section.appendChild(inputContainer);
        container.appendChild(section);
    }
    
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
//OG

// function findSignificantPoints(beats, lowEnergyBeats, songDuration) {
//     // Step 1: Combine beats and lowEnergyBeats with metadata
//     const combined = [];
//     beats.forEach(time => combined.push({ time, source: 'beat' }));
//     lowEnergyBeats.forEach(time => combined.push({ time, source: 'lowEnergy' }));

//     // Step 2: Sort combined array by time
//     combined.sort((a, b) => a.time - b.time);

//     // Exclude points too close to the beginning or end
//     const excludedPoints = combined.filter(point => 
//         point.time > 2 && point.time < (songDuration - 2)
//     );

//     // Step 3: Clustering
//     const clustered = [];
//     let currentCluster = [];
//     const minDistance = 1; // Minimum distance between points to be in the same cluster

//     for (let i = 0; i < excludedPoints.length; i++) {
//         if (currentCluster.length === 0 || (excludedPoints[i].time - currentCluster[currentCluster.length - 1].time) < minDistance) {
//             currentCluster.push(excludedPoints[i]);
//         } else {
//             clustered.push(currentCluster);
//             currentCluster = [excludedPoints[i]];
//         }
//     }
//     if (currentCluster.length > 0) {
//         clustered.push(currentCluster);
//     }

//     // Step 4: Selecting points
//     const finalPoints = [];
//     clustered.forEach(cluster => {
//         if (cluster.length > 0) {
//             // Select the most significant point in each cluster
//             const significantPoint = cluster.reduce((prev, curr) => {
//                 // Prefer points that are 'beat' type
//                 if (curr.source === 'beat') return curr;
//                 return prev;
//             }, cluster[0]);

//             finalPoints.push(significantPoint.time);
//         }
//     });

//     // Ensure we have roughly 10 points
//     const desiredCount = audioDuration / 4;
//     console.log(finalPoints.length);
//     if (finalPoints.length > desiredCount) {
//         // If too many points, remove points within 2.5 seconds of each other
//         const filteredPoints = filterClosePoints(finalPoints, 2.5);
//         return filteredPoints;
//     } else if (finalPoints.length < desiredCount) {
//         while (finalPoints.length < desiredCount) {
//             console.log("insert");
//             // Insert additional points if needed
//             const newPoints = insertAdditionalPoints(finalPoints, excludedPoints, beats, lowEnergyBeats, desiredCount, songDuration);
//             return [...new Set([...finalPoints, ...newPoints])];
//         }
//     } else {
//         return finalPoints;
//     }
// }


// function insertAdditionalPoints(finalPoints, allPoints, beats, lowEnergyBeats, desiredCount, songDuration) {
//     const newPoints = [];
    
//     // Sort finalPoints to find gaps
//     finalPoints.sort((a, b) => a - b);
    
//     // Calculate minimum distance to fill in gaps
//     const minGap = songDuration / (desiredCount - 1);

//     for (let i = 0; i < finalPoints.length - 1; i++) {
//         const start = finalPoints[i];
//         const end = finalPoints[i + 1];
//         const midPoint = (start + end) / 2;

//         // Only add new points if the gap is significant
//         if ((end - start) > minGap) {
//             // Check if there is a beat or low-energy point near the midpoint
//             const nearbyPoints = allPoints.filter(p => p.time >= start && p.time <= end);
//             if (nearbyPoints.length > 0) {
//                 newPoints.push(midPoint);
//             }
//         }
//     }

//     // Ensure no duplicates and limit to the required number
//     return newPoints.filter(point => !finalPoints.includes(point)).slice(0, desiredCount - finalPoints.length);
// }

//NEW

// function findSignificantPoints(beats, lowEnergyBeats, songDuration) {
//     // Step 1: Combine beats and lowEnergyBeats with metadata
//     const combined = [];
//     beats.forEach(point => combined.push({ time: point.time, source: 'beat', strength: point.strength }));
//     lowEnergyBeats.forEach(point => combined.push({ time: point.time, source: 'lowEnergy', strength: point.strength }));

//     // Step 2: Sort combined array by time
//     combined.sort((a, b) => a.time - b.time);

//     // Exclude points too close to the beginning or end
//     const excludedPoints = combined.filter(point => 
//         point.time > 3 && point.time < (songDuration - 4)
//     );

//     // Step 3: Clustering
//     const clustered = [];
//     let currentCluster = [];
//     const minDistance = 1; // Minimum distance between points to be in the same cluster
//     const maxLowEnergyDistance = 3; // Maximum distance for lowEnergyBeats to be clustered together

//     for (let i = 0; i < excludedPoints.length; i++) {
//         if (currentCluster.length === 0) {
//             currentCluster.push(excludedPoints[i]);
//         } else {
//             const lastPoint = currentCluster[currentCluster.length - 1];
//             const currentPoint = excludedPoints[i];

//             if (currentPoint.source === 'lowEnergy' && (currentPoint.time - currentCluster[0].time) <= maxLowEnergyDistance) {
//                 currentCluster.push(currentPoint);
//             } else if ((currentPoint.time - lastPoint.time) < minDistance) {
//                 currentCluster.push(currentPoint);
//             } else {
//                 clustered.push(currentCluster);
//                 currentCluster = [currentPoint];
//             }
//         }
//     }

//     if (currentCluster.length > 0) {
//         clustered.push(currentCluster);
//     }

//     // Step 4: Selecting points
//     const finalPoints = [];
//     clustered.forEach(cluster => {
//         if (cluster.length > 0) {
//             // Check for clusters with multiple lowEnergyBeats
//             const lowEnergyCount = cluster.filter(point => point.source === 'lowEnergy').length;
//             if (lowEnergyCount > 1) {
//                 // Average the locations of lowEnergyBeats
//                 const lowEnergySum = cluster
//                     .filter(point => point.source === 'lowEnergy')
//                     .reduce((sum, point) => sum + point.time, 0);
//                 const averageLowEnergy = lowEnergySum / lowEnergyCount;
//                 finalPoints.push(averageLowEnergy);
//             } else {
//                 // Select the most significant point in each cluster
//                 const significantPoint = cluster.reduce((prev, curr) => {
//                     // Prefer points with higher strength
//                     if (curr.source === 'beat' && (prev.source !== 'beat' || curr.strength > prev.strength)) return curr;
//                     return prev;
//                 }, cluster[0]);

//                 finalPoints.push(significantPoint.time);
//             }
//         }
//     });

//     // Ensure we have roughly 10 points
//     const desiredCount = Math.floor(songDuration / 4);

//     // Combine or average points within 2.5 seconds of each other
//     const combinedFinalPoints = [];
//     for (let i = 0; i < finalPoints.length; i++) {
//         if (combinedFinalPoints.length === 0) {
//             combinedFinalPoints.push(finalPoints[i]);
//         } else {
//             const lastPoint = combinedFinalPoints[combinedFinalPoints.length - 1];
//             const currentPoint = finalPoints[i];
//             if (currentPoint - lastPoint <= 2.5) {
//                 // Average the points
//                 combinedFinalPoints[combinedFinalPoints.length - 1] = (lastPoint + currentPoint) / 2;
//             } else {
//                 combinedFinalPoints.push(currentPoint);
//             }
//         }
//     }

//     if (combinedFinalPoints.length > desiredCount) {
//         return combinedFinalPoints.slice(0, desiredCount);
//     } else {
//         return insertAdditionalPoints(combinedFinalPoints, combined, beats, lowEnergyBeats, desiredCount, songDuration);
//     }
// }

// function insertAdditionalPoints(finalPoints, allPoints, beats, lowEnergyBeats, desiredCount, songDuration) {
//     console.log("insert: " + finalPoints);
//     const newPoints = [...finalPoints];

//     newPoints.sort((a, b) => a - b);

//     let maxGap = 10;
//     let loopCounter = 0;

//     while (newPoints.length < desiredCount) {
//         console.log("loop");
//         const gaps = [];

//         // Include the start of the song as a gap
//         if (newPoints.length === 0 || newPoints[0] > 0) {
//             gaps.push({ start: 0, end: newPoints[0] || songDuration, gap: newPoints[0] || songDuration });
//         }

//         for (let i = 0; i < newPoints.length - 1; i++) {
//             const start = newPoints[i];
//             const end = newPoints[i + 1];
//             gaps.push({ start, end, gap: end - start });
//         }

//         // Include the end of the song as a gap
//         if (newPoints.length === 0 || newPoints[newPoints.length - 1] < songDuration) {
//             gaps.push({ start: newPoints[newPoints.length - 1] || 0, end: songDuration, gap: songDuration - (newPoints[newPoints.length - 1] || 0) });
//         }

//         const maxGapObj = gaps.reduce((max, gap) => gap.gap > max.gap ? gap : max, { gap: 0 });

//         if (maxGapObj.gap >= maxGap) { // Ensure at least 2 seconds between new points
//             const midPoint = (maxGapObj.start + maxGapObj.end) / 2;
//             const nearbyPoints = allPoints.filter(p => p.time >= maxGapObj.start && p.time <= maxGapObj.end);

//             // Prefer lowEnergy points (onsets) first, then beats
//             const lowEnergyCandidates = nearbyPoints.filter(p => p.source === 'lowEnergy' && Math.abs(p.time - midPoint) <= 2);
//             if (lowEnergyCandidates.length > 0) {
//                 const centerPoint = lowEnergyCandidates.reduce((sum, point) => sum + point.time, 0) / lowEnergyCandidates.length;
//                 if (!newPoints.some(p => Math.abs(p - centerPoint) <= 2.5) && centerPoint > 3 && centerPoint < (songDuration - 3)) {
//                     newPoints.push(centerPoint);
//                 }
//             } else {
//                 const beatCandidates = nearbyPoints.filter(p => p.source === 'beat' && Math.abs(p.time - midPoint) <= 2);
//                 if (beatCandidates.length > 0) {
//                     const chosenPoint = beatCandidates[0].time;
//                     if (!newPoints.some(p => Math.abs(p - chosenPoint) <= 2.5) && chosenPoint > 3 && chosenPoint < (songDuration - 3)) {
//                         newPoints.push(chosenPoint);
//                     }
//                 } else {
//                     if (!newPoints.some(p => Math.abs(p - midPoint) <= 2.5) && midPoint > 3 && midPoint < (songDuration - 3)) {
//                         newPoints.push(midPoint);
//                     }
//                 }
//             }
//         } else {
//             // Start adding points from beats and lowEnergyBeats directly, ensuring at least 2.5 seconds between points
//             let addedPoints = false;

//             for (let i = 0; i < lowEnergyBeats.length && newPoints.length < desiredCount; i++) {
//                 if (!newPoints.includes(lowEnergyBeats[i].time) && (newPoints.length === 0 || lowEnergyBeats[i].time - newPoints[newPoints.length - 1] >= 2.5) && lowEnergyBeats[i].time > 3 && lowEnergyBeats[i].time < (songDuration - 3)) {
//                     newPoints.push(lowEnergyBeats[i].time);
//                     addedPoints = true;
//                 }
//             }
//             for (let i = 0; i < beats.length && newPoints.length < desiredCount; i++) {
//                 if (!newPoints.includes(beats[i].time) && (newPoints.length === 0 || beats[i].time - newPoints[newPoints.length - 1] >= 2.5) && beats[i].time > 3 && beats[i].time < (songDuration - 3)) {
//                     newPoints.push(beats[i].time);
//                     addedPoints = true;
//                 }
//             }

//             if (!addedPoints) {
//                 loopCounter++;
//                 if (loopCounter > 2) {
//                     maxGap = Math.max(maxGap - 1, 3);
//                     loopCounter = 0;
//                 }
//             }
//         }

//         // Sort again to find new gaps
//         newPoints.sort((a, b) => a - b);

//         // Check if the length of newPoints is within 2 of the desiredCount
//         if (desiredCount - newPoints.length <= 2) {
//             break;
//         }
//     }

//     // Ensure no duplicates and the exact desired count
//     return [...new Set(newPoints)].slice(0, desiredCount);
// }

// NEW NEW
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





// function drawBeats(beats, beatContainer, duration, color) {
//     beats.forEach(beat => {
//         const beatLine = document.createElement('div');
//         beatLine.className = 'beat';
//         beatLine.style.left = `${(beat / duration) * beatContainer.offsetWidth}px`; // Position in pixels
//         beatLine.style.height = '100%'; // Ensure height is set
//         beatLine.style.width = '2px'; // Ensure width is set
//         beatLine.style.position = 'absolute'; // Ensure position is absolute
//         beatLine.style.backgroundColor = color; // Make sure the color is visible
//         beatContainer.appendChild(beatLine);
//     });
// }

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


// function detectBeats(data, sampleRate, threshold) {
//     const beats = [];
//     let minSamplesBetweenBeats = sampleRate / 2; // Minimum half-second between beats
//     let lastBeatIndex = -minSamplesBetweenBeats;

//     threshold = threshold / 100; // Convert threshold to match amplitude range of audio data

//     for (let i = 0; i < data.length; i++) {
//         if (Math.abs(data[i]) > threshold) {
//             if (i - lastBeatIndex > minSamplesBetweenBeats) {
//                 beats.push(i / sampleRate); // Store beat time in seconds
//                 lastBeatIndex = i;
//             }
//         }
//     }
//     return beats;
// }

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



// function drawBeats(beats, beatContainer, duration) {
//     beats.forEach(beat => {
//         const beatLine = document.createElement('div');
//         beatLine.className = 'beat';
//         beatLine.style.left = `${(beat / duration) * beatContainer.offsetWidth}px`; // Position in pixels
//         beatContainer.appendChild(beatLine);
//     });
// }

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

