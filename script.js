/* 
🧠 SCRIPT.JS - The Great Nerf War: A Capybara's Revenge

This file contains all the interactive functionality for our story.
JavaScript makes our story come alive by handling:
- Moving between scenes when users click buttons
- Updating what text and images are shown
- Communicating with other devices through MQTT
- Playing audio and handling user interactions

Think of JavaScript as the "director" of our story - it tells all the 
other parts (HTML and CSS) what to do and when to do it.
*/

/* ==========================================================================
   GLOBAL VARIABLES - Keep track of the current state of our story
   ========================================================================== */

// STORY STATE: Track where we are in the story
let currentScene = 0;        // Which scene are we on? (0-11 for our 12 scenes)
let currentDialogue = 0;     // Which dialogue within the current scene?
let playerName = "Brave Veteran";  // The user's chosen name
let audioEnabled = false;    // Is background music playing?

// COMMUNICATION: For real-time sync between devices
let mqttClient = null;       // Connection for real-time sync between devices
let isSceneTransition = false; // Prevent rapid clicking during transitions

// TOUCH GESTURES: For mobile swipe navigation
let touchStartX = 0;         // Where did the touch start?
let touchEndX = 0;           // Where did the touch end?

// DOM ELEMENTS: Get references to HTML elements we'll need to control
let dialogueTextEl, speakerNameEl, sceneCounterEl, progressFillEl, backgroundEl, sceneTitle;

/* ==========================================================================
   STORY DATA - All the content organized in a easy-to-edit structure
   ========================================================================== */

// STORY DATABASE: Contains all 12 scenes following the Hero's Journey
const storyData = {
    scenes: [
        {
            id: 1,
            title: "The Ordinary World",
            background: "bg-office",
            dialogue: [
                { 
                    speaker: "Narrator", 
                    text: "Welcome to the archives of the Great Nerf War Veterans Association, where {PLAYER_NAME} will discover a tale of foam, fury, and unexpected friendship." 
                },
                { 
                    speaker: "Captain Jenkins", 
                    text: "People think we're just playing around, but that capybara... it changed everything. What started as innocent target practice became something much bigger." 
                }
            ]
        },
        {
            id: 2,
            title: "The Call to Adventure",
            background: "bg-park",
            dialogue: [
                { 
                    speaker: "Narrator", 
                    text: "Six months ago, {PLAYER_NAME}, strange reports began surfacing. Emu sightings increased near the local park where the Veterans Association held their weekly meetings." 
                },
                { 
                    speaker: "Jenkins", 
                    text: "At first, we thought it was coincidence. But then the capybara appeared... sitting there, watching us with those knowing eyes." 
                }
            ]
        },
        {
            id: 3,
            title: "Refusal of the Call",
            background: "bg-office",
            dialogue: [
                { 
                    speaker: "Jenkins", 
                    text: "{PLAYER_NAME}, I'll be honest - I didn't want to believe it. A conspiracy involving emus and a capybara? It sounded ridiculous." 
                },
                { 
                    speaker: "Narrator", 
                    text: "Jenkins dismissed the reports, focusing instead on the Association's annual foam dart tournament. But fate had other plans." 
                }
            ]
        },
        {
            id: 4,
            title: "Meeting the Mentor",
            background: "bg-office",
            dialogue: [
                { 
                    speaker: "Elder Morrison", 
                    text: "Jenkins, {PLAYER_NAME}, there's something you need to know about the origins of our Association. We weren't always just recreational warriors." 
                },
                { 
                    speaker: "Morrison", 
                    text: "Years ago, during a team-building exercise, we accidentally disrupted a peaceful capybara habitat. That wise old capybara... it never forgot." 
                }
            ]
        },
        {
            id: 5,
            title: "Crossing the Threshold",
            background: "bg-park",
            dialogue: [
                { 
                    speaker: "Narrator", 
                    text: "Armed with this knowledge, {PLAYER_NAME}, Jenkins ventured into what members now call 'emu territory' - the eastern section of Memorial Park." 
                },
                { 
                    speaker: "Jenkins", 
                    text: "The moment I stepped into that clearing, I knew I was being watched. Dozens of emus emerged from the trees, forming a protective circle." 
                }
            ]
        },
        {
            id: 6,
            title: "Tests, Allies, and Enemies",
            background: "bg-park",
            dialogue: [
                { 
                    speaker: "Narrator", 
                    text: "What followed was a series of encounters that would test Jenkins' resolve and reveal unexpected allies, {PLAYER_NAME}." 
                },
                { 
                    speaker: "Jenkins", 
                    text: "One emu stepped forward - Edgar, as I later learned. He had been observing our group for months, torn between loyalty to the capybara and understanding our intentions." 
                }
            ]
        },
        {
            id: 7,
            title: "Approach to the Inmost Cave",
            background: "bg-park",
            dialogue: [
                { 
                    speaker: "Edgar the Emu", 
                    text: "*Thoughtful emu sounds* The Great Capybara waits by the old oak tree, {PLAYER_NAME}. But approach with respect - many have tried to make peace, all have failed." 
                },
                { 
                    speaker: "Jenkins", 
                    text: "Edgar led me deeper into the park than I'd ever been. There, in a natural amphitheater of trees, sat the most majestic capybara I'd ever seen." 
                }
            ]
        },
        {
            id: 8,
            title: "The Ordeal",
            background: "bg-battlefield",
            dialogue: [
                { 
                    speaker: "Narrator", 
                    text: "What ensued, {PLAYER_NAME}, was the most epic foam dart battle in recorded history - a clash between human veterans and emu defenders." 
                },
                { 
                    speaker: "Jenkins", 
                    text: "The capybara's eyes flashed with ancient wisdom and justified anger. The emu squadron took formation, and for a moment, I thought this was the end." 
                }
            ]
        },
        {
            id: 9,
            title: "The Reward",
            background: "bg-peace",
            dialogue: [
                { 
                    speaker: "Great Capybara", 
                    text: "*Wise capybara chittering* Young human, {PLAYER_NAME} has shown you our history. We seek not vengeance, but understanding. Respect for all peaceful creatures." 
                },
                { 
                    speaker: "Jenkins", 
                    text: "In that moment, I understood. The capybara wasn't our enemy - it was our teacher, showing us the impact of our actions on others." 
                }
            ]
        },
        {
            id: 10,
            title: "The Road Back",
            background: "bg-office",
            dialogue: [
                { 
                    speaker: "Narrator", 
                    text: "Returning to the Veterans Association, {PLAYER_NAME}, Jenkins faced his greatest challenge yet - convincing his fellow veterans to change their ways." 
                },
                { 
                    speaker: "Jenkins", 
                    text: "Many thought I'd lost my mind. 'Talking to a capybara? Alliance with emus?' But I had Edgar's support and the truth on my side." 
                }
            ]
        },
        {
            id: 11,
            title: "Resurrection",
            background: "bg-peace",
            dialogue: [
                { 
                    speaker: "Narrator", 
                    text: "Through patience and demonstration, {PLAYER_NAME}, Jenkins transformed from a paranoid veteran into a bridge-builder between species." 
                },
                { 
                    speaker: "Jenkins", 
                    text: "The first joint training exercise was awkward, I'll admit. But seeing humans and emus working together... it was beautiful." 
                }
            ]
        },
        {
            id: 12,
            title: "Return with the Elixir",
            background: "bg-peace",
            dialogue: [
                { 
                    speaker: "Narrator", 
                    text: "And so, {PLAYER_NAME}, the Great Nerf War ended not with victory or defeat, but with wisdom. The Veterans Association now includes honorary emu members." 
                },
                { 
                    speaker: "Great Capybara", 
                    text: "*Contented capybara sounds* Peace between all creatures who respect the harmony of foam and friendship. The greatest victory of all." 
                },
                { 
                    speaker: "Narrator", 
                    text: "Thank you for experiencing this tale, {PLAYER_NAME}. Remember: sometimes the greatest battles are won not with weapons, but with understanding." 
                }
            ]
        }
    ]
};

/* ==========================================================================
   INITIALIZATION FUNCTIONS - Set up the application when page loads
   ========================================================================== */

// PAGE LOAD EVENT: This runs when the browser finishes loading the page
window.addEventListener('load', function() {
    // Initialize all the DOM element references
    initializeElements();
    
    // Set up MQTT communication
    initMQTT();
    
    // Set up touch gestures for mobile
    setupTouchControls();
    
    // Set up keyboard navigation
    setupKeyboardControls();
    
    // Focus on the name input so user can start typing immediately
    const playerNameInput = document.getElementById('playerNameInput');
    if (playerNameInput) {
        playerNameInput.focus();
    }
    
    // Set initial audio volume
    const backgroundAudio = document.getElementById('backgroundAudio');
    if (backgroundAudio) {
        backgroundAudio.volume = 0.7;
    }
    
    // Show the first scene
    updateDisplay();
});

// INITIALIZE DOM ELEMENTS: Get references to all the HTML elements we need
function initializeElements() {
    dialogueTextEl = document.getElementById('dialogueText');
    speakerNameEl = document.getElementById('speakerName');
    sceneCounterEl = document.getElementById('sceneCounter');
    progressFillEl = document.getElementById('progressFill');
    backgroundEl = document.getElementById('background');
    sceneTitle = document.getElementById('sceneTitle');
}

/* ==========================================================================
   STORY NAVIGATION FUNCTIONS - Handle moving through the story
   ========================================================================== */

// NEXT SCENE FUNCTION: What happens when user clicks "Next" button
function nextScene() {
    // Don't allow navigation during scene transitions (prevents glitches)
    if (isSceneTransition) return;
    
    // Get information about the current scene
    const scene = storyData.scenes[currentScene];
    
    // Are there more dialogue lines in this scene?
    if (currentDialogue < scene.dialogue.length - 1) {
        currentDialogue++; // Move to next dialogue in same scene
    } 
    // Or should we move to the next scene entirely?
    else if (currentScene < storyData.scenes.length - 1) {
        currentScene++;      // Move to next scene
        currentDialogue = 0; // Start at first dialogue of new scene
        
        // Prevent rapid clicking during transitions
        isSceneTransition = true;
        setTimeout(() => isSceneTransition = false, 2000);
        
        // Show the new scene title with animation
        showSceneTitle(storyData.scenes[currentScene].title);
        
        // Tell other connected devices about the scene change
        publishSceneChange(currentScene);
    }
    
    // Update what's displayed on screen
    updateDisplay();
}

// PREVIOUS SCENE FUNCTION: What happens when user clicks "Previous" button
function previousScene() {
    // Don't allow navigation during transitions
    if (isSceneTransition) return;
    
    // Are we at the first dialogue of the current scene?
    if (currentDialogue > 0) {
        currentDialogue--; // Go back one dialogue in same scene
    } 
    // Or should we go to the previous scene?
    else if (currentScene > 0) {
        currentScene--;    // Go to previous scene
        // Go to the last dialogue of the previous scene
        currentDialogue = storyData.scenes[currentScene].dialogue.length - 1;
        
        // Prevent rapid clicking
        isSceneTransition = true;
        setTimeout(() => isSceneTransition = false, 2000);
        
        // Show scene title
        showSceneTitle(storyData.scenes[currentScene].title);
        
        // Tell other devices about the change
        publishSceneChange(currentScene);
    }
    
    // Update the display
    updateDisplay();
}

// UPDATE DISPLAY: Refresh everything shown on screen
function updateDisplay() {
    // Get current scene and dialogue data
    const scene = storyData.scenes[currentScene];
    const dialogue = scene.dialogue[currentDialogue];
    
    // Update the speaker name
    if (speakerNameEl && dialogue.speaker) {
        speakerNameEl.textContent = dialogue.speaker;
    }
    
    // Update the dialogue text (replace {PLAYER_NAME} with actual name)
    if (dialogueTextEl && dialogue.text) {
        dialogueTextEl.textContent = dialogue.text.replace('{PLAYER_NAME}', playerName);
    }
    
    // Update the scene counter (e.g., "Scene 3 of 12")
    if (sceneCounterEl) {
        sceneCounterEl.textContent = `Scene ${currentScene + 1} of ${storyData.scenes.length}`;
    }
    
    // Update the progress bar
    updateProgressBar();
    
    // Update the background
    updateBackground(scene.background);
    
    // Update navigation buttons (enable/disable based on position)
    updateNavigationButtons();
}

// UPDATE PROGRESS BAR: Show how far through the story we are
function updateProgressBar() {
    if (!progressFillEl) return;
    
    // Calculate progress as a percentage
    const progress = ((currentScene + (currentDialogue / storyData.scenes[currentScene].dialogue.length)) 
                     / storyData.scenes.length) * 100;
    
    // Update the visual width of the progress bar
    progressFillEl.style.width = `${progress}%`;
}

// UPDATE BACKGROUND: Change the visual theme based on current scene
function updateBackground(backgroundClass) {
    if (!backgroundEl) return;
    
    // Remove all existing background classes
    backgroundEl.className = 'background';
    
    // Add the new background class
    if (backgroundClass) {
        backgroundEl.classList.add(backgroundClass);
    }
}

// UPDATE NAVIGATION BUTTONS: Enable/disable based on story position
function updateNavigationButtons() {
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    
    if (prevButton) {
        // Disable "Previous" if we're at the very beginning
        prevButton.disabled = (currentScene === 0 && currentDialogue === 0);
    }
    
    if (nextButton) {
        const scene = storyData.scenes[currentScene];
        // Disable "Next" if we're at the very end
        nextButton.disabled = (currentScene === storyData.scenes.length - 1 && 
                              currentDialogue === scene.dialogue.length - 1);
    }
}

// SHOW SCENE TITLE: Display animated scene title
function showSceneTitle(title) {
    if (!sceneTitle) return;
    
    sceneTitle.textContent = title;
    sceneTitle.style.display = 'block';
    
    // Hide it again after animation completes
    setTimeout(() => {
        sceneTitle.style.display = 'none';
    }, 2000);
}

/* ==========================================================================
   USER INTERACTION FUNCTIONS - Handle user input and controls
   ========================================================================== */

// START STORY: Called when user enters their name and clicks "Begin"
function startStory() {
    const playerNameInput = document.getElementById('playerNameInput');
    const nameModal = document.getElementById('nameModal');
    
    // Get the player's name (or use default if empty)
    if (playerNameInput) {
        playerName = playerNameInput.value.trim() || "Brave Veteran";
    }
    
    // Hide the name input modal
    if (nameModal) {
        nameModal.style.display = 'none';
    }
    
    // Update the display with the new name
    updateDisplay();
    
    // Try to start background audio (may be blocked by browser)
    if (audioEnabled) {
        const backgroundAudio = document.getElementById('backgroundAudio');
        if (backgroundAudio) {
            backgroundAudio.play().catch(e => {
                console.log("Audio autoplay blocked"); // This is normal
            });
        }
    }
}

// TOGGLE AUDIO: Turn background music on/off
function toggleAudio() {
    const backgroundAudio = document.getElementById('backgroundAudio');
    const audioToggle = document.getElementById('audioToggle');
    
    if (!backgroundAudio) return;
    
    audioEnabled = !audioEnabled;
    
    if (audioEnabled) {
        backgroundAudio.play().catch(e => {
            console.log("Audio play failed:", e);
            audioEnabled = false;
        });
        if (audioToggle) audioToggle.textContent = '🔊 Audio';
    } else {
        backgroundAudio.pause();
        if (audioToggle) audioToggle.textContent = '🔇 Audio';
    }
}

// SET VOLUME: Adjust audio volume
function setVolume(value) {
    const backgroundAudio = document.getElementById('backgroundAudio');
    if (backgroundAudio) {
        backgroundAudio.volume = parseFloat(value);
    }
}

// RESTART STORY: Reset everything back to the beginning
function resetStory() {
    currentScene = 0;
    currentDialogue = 0;
    updateDisplay();
    
    // Show the name modal again
    const nameModal = document.getElementById('nameModal');
    const playerNameInput = document.getElementById('playerNameInput');
    
    if (nameModal) nameModal.style.display = 'flex';
    if (playerNameInput) {
        playerNameInput.value = '';
        playerNameInput.focus();
    }
}

/* ==========================================================================
   MOBILE TOUCH CONTROLS - Handle swipe gestures
   ========================================================================== */

// SETUP TOUCH CONTROLS: Enable swipe gestures on mobile devices
function setupTouchControls() {
    // Listen for touch start (when finger touches screen)
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    // Listen for touch end (when finger lifts off screen)
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
}

// HANDLE SWIPE: Determine if user swiped left or right
function handleSwipe() {
    const diff = touchStartX - touchEndX;
    
    // Only register as swipe if movement is significant
    if (Math.abs(diff) > 50) {
        if (diff > 0) {
            // Swiped left = next scene
            nextScene();
        } else {
            // Swiped right = previous scene
            previousScene();
        }
    }
}

/* ==========================================================================
   KEYBOARD CONTROLS - Handle keyboard navigation
   ========================================================================== */

// SETUP KEYBOARD CONTROLS: Enable arrow key navigation
function setupKeyboardControls() {
    document.addEventListener('keydown', function(e) {
        // Don't interfere when user is typing in input fields
        if (e.target.tagName === 'INPUT') return;
        
        switch(e.key) {
            case 'ArrowRight':
            case ' ': // Spacebar
                e.preventDefault();
                nextScene();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                previousScene();
                break;
            case 'r':
            case 'R':
                if (e.ctrlKey) {
                    e.preventDefault();
                    resetStory();
                }
                break;
        }
    });
}

/* ==========================================================================
   MQTT COMMUNICATION - Real-time sync between devices
   ========================================================================== */

// INITIALIZE MQTT: Set up connection to message broker
function initMQTT() {
    try {
        // Create unique client ID
        const clientId = "nerfwar_" + Math.random().toString(36).substr(2, 9);
        
        // Connect to MQTT broker
        mqttClient = new Paho.MQTT.Client("mqtt.uvucs.org", 8080, clientId);
        
        // Set up event handlers
        mqttClient.onConnectionLost = onConnectionLost;
        mqttClient.onMessageArrived = onMessageArrived;
        
        // Try to connect
        mqttClient.connect({
            onSuccess: onConnect,
            onFailure: onConnectFailure,
            useSSL: true
        });
        
    } catch (error) {
        console.log("MQTT initialization failed:", error);
        updateMQTTStatus(false);
    }
}

// MQTT CONNECTION SUCCESS: Called when successfully connected
function onConnect() {
    console.log("MQTT Connected");
    updateMQTTStatus(true);
    
    // Subscribe to scene change messages
    mqttClient.subscribe("nerfwar/scene/advanced");
}

// MQTT CONNECTION FAILED: Called when connection fails
function onConnectFailure(error) {
    console.log("MQTT Connection failed:", error);
    updateMQTTStatus(false);
}

// MQTT CONNECTION LOST: Called when connection is lost
function onConnectionLost(responseObject) {
    updateMQTTStatus(false);
    console.log("MQTT Connection lost");
    
    // Try to reconnect after 5 seconds
    setTimeout(() => initMQTT(), 5000);
}

// MQTT MESSAGE RECEIVED: Called when message arrives from another device
function onMessageArrived(message) {
    try {
        const data = JSON.parse(message.payloadString);
        
        // Only sync if message is from a different device
        if (data.player !== playerName) {
            // Update to the scene specified in the message
            currentScene = Math.max(0, Math.min(data.sceneId - 1, storyData.scenes.length - 1));
            currentDialogue = 0;
            updateDisplay();
            showSceneTitle(storyData.scenes[currentScene].title);
        }
    } catch (error) {
        console.log("Error processing MQTT message:", error);
    }
}

// PUBLISH SCENE CHANGE: Tell other devices about scene changes
function publishSceneChange(sceneId) {
    if (!mqttClient || !mqttClient.isConnected()) return;
    
    try {
        const message = new Paho.MQTT.Message(JSON.stringify({
            sceneId: sceneId + 1,
            player: playerName,
            timestamp: Date.now()
        }));
        message.destinationName = "nerfwar/scene/advanced";
        mqttClient.send(message);
    } catch (error) {
        console.log("Error publishing scene change:", error);
    }
}

// UPDATE MQTT STATUS: Show connection status to user
function updateMQTTStatus(connected) {
    const mqttStatus = document.getElementById('mqttStatus');
    if (!mqttStatus) return;
    
    if (connected) {
        mqttStatus.textContent = 'MQTT: Connected';
        mqttStatus.className = 'mqtt-status mqtt-connected';
    } else {
        mqttStatus.textContent = 'MQTT: Disconnected';
        mqttStatus.className = 'mqtt-status mqtt-disconnected';
    }
}

/* ==========================================================================
   UTILITY FUNCTIONS - Helper functions for various tasks
   ========================================================================== */

// ESCAPE HTML: Prevent HTML injection in user input
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// DEBOUNCE: Prevent rapid repeated function calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/* ==========================================================================
   DEVELOPER TOOLS - Functions for debugging and testing
   ========================================================================== */

// Jump to specific scene (for development/testing)
function jumpToScene(sceneIndex) {
    if (sceneIndex >= 0 && sceneIndex < storyData.scenes.length) {
        currentScene = sceneIndex;
        currentDialogue = 0;
        updateDisplay();
        showSceneTitle(storyData.scenes[currentScene].title);
    }
}

// Get current story state (for debugging)
function getStoryState() {
    return {
        currentScene: currentScene,
        currentDialogue: currentDialogue,
        playerName: playerName,
        audioEnabled: audioEnabled,
        totalScenes: storyData.scenes.length
    };
}

// Log story state to console (for debugging)
function logStoryState() {
    console.log('Current Story State:', getStoryState());
}
