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

// Get the current story scene and dialogue
function getCurrentDialogue() {
    if (currentScene >= storyData.scenes.length) return null;
    const scene = storyData.scenes[currentScene];
    if (currentDialogue >= scene.dialogue.length) return null;
    return scene.dialogue[currentDialogue];
}

// Get total dialogue count across all scenes
function getTotalDialogueCount() {
    return storyData.scenes.reduce((total, scene) => total + scene.dialogue.length, 0);
}

// Get current position in the overall story
function getCurrentPosition() {
    let position = 0;
    for (let i = 0; i < currentScene; i++) {
        position += storyData.scenes[i].dialogue.length;
    }
    return position + currentDialogue;
}

// Replace placeholders in text with player name
function personalizeText(text) {
    return text.replace(/\{playerName\}/g, playerName);
}

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
            title: "The Ordinary World",
            background: "bg-park",
            dialogue: [
                { speaker: "Narrator", text: "Every Tuesday morning, just as the sun peeked over Briarwood Park, the Veterans' Association gathered like clockwork. Among them stood {playerName}, a respected member whose sharp eye and steady hand had earned recognition in their weekly competitions." },
                { speaker: "Jenkins", text: "Alright folks, stretch those hips. Winner today gets first dibs on donuts." },
                { speaker: "Morales", text: "Only if {playerName} doesn't sweep us all again! That was some impressive shooting last week." },
                { speaker: "Narrator", text: "The veterans weren't just passing time—they were preserving tradition. Amidst Nerf fire and laughter, {playerName} had become known for both skill and sportsmanship, helping to maintain the group's camaraderie." },
                { speaker: "Jenkins", text: "{playerName}, you're with me on the advanced targets today. Show these rookies how it's done." }
            ]
        },
        {
            title: "The Call to Adventure",
            background: "bg-forest",
            dialogue: [
                { speaker: "Morales", text: "I saw something near the trash bins. Big. Round. Looked like it was judging me." },
                { speaker: "Jenkins", text: "What, a raccoon holding court?" },
                { speaker: "Ernie", text: "No joke. Look at this photo—tell me that ain't a capybara." },
                { speaker: "Narrator", text: "Not long after, emus began appearing too. Watching. Lingering. {playerName} noticed the unusual behavior before most others—the way these creatures seemed to observe their training sessions with an almost intelligent intent." },
                { speaker: "{playerName}", text: "There's definitely something different about these animals. They're not acting like typical park wildlife." },
                { speaker: "Morales", text: "Feels like we're being scoped out. Like... surveilled. {playerName}, you've got the best eyes here—what do you think?" }
            ]
        },
        {
            title: "The Refusal",
            background: "bg-park",
            dialogue: [
                { speaker: "Jenkins", text: "Rodents and birds don't scare me. This park's been ours since before they were hatched." },
                { speaker: "{playerName}", text: "Maybe we should take this seriously, Jenkins. Something feels off about the whole situation." },
                { speaker: "Jenkins", text: "Paranoia's setting in, {playerName}. Let's stay focused. Target practice at 0600, no excuses." },
                { speaker: "Narrator", text: "Despite {playerName}'s concerns, Jenkins couldn't ignore the unease building in his gut—or the missing ammo. {playerName} had noticed the shortages too, but chose to support the team leader's decision to continue as normal." },
                { speaker: "{playerName}", text: "I'll keep an extra watch during practice. If something's happening, we'll figure it out together." }
            ]
        },
        {
            title: "Meeting the Mentor",
            background: "bg-forest",
            dialogue: [
                { speaker: "Narrator", text: "One morning, Calhoun Morrison was already waiting at the elm tree, his weathered Nerf Longshot across his lap. He'd specifically asked {playerName} to join this early meeting." },
                { speaker: "Morrison", text: "This ain't the first time, {playerName}. In '87, there was an accident. Marshmallow launcher. Capybara took the hit." },
                { speaker: "{playerName}", text: "You're serious about this, aren't you? What really happened back then?" },
                { speaker: "Morrison", text: "We broke a truce we forgot we made. But they didn't. {playerName}, you've got the respect of both the team and keen instincts. I need you to help Jenkins understand." },
                { speaker: "Narrator", text: "He handed {playerName} a tattered patch—an old symbol of a peace long lost. 'Show this to Jenkins when the time is right,' Morrison whispered." }
            ]
        },
        {
            title: "Crossing the Threshold",
            background: "bg-forest",
            dialogue: [
                { speaker: "Narrator", text: "At sunrise, {playerName} and Jenkins crossed into the park's eastern trails—'emu territory,' as they called it. {playerName} volunteered to accompany Jenkins, sensing this mission needed backup." },
                { speaker: "Narrator", text: "They passed makeshift barricades and finally faced an emu standing still, like a sentinel." },
                { speaker: "Jenkins", text: "Not here to start trouble. Just need answers." },
                { speaker: "{playerName}", text: "Easy, Jenkins. Let's approach this carefully. Something tells me these creatures are more intelligent than we thought." },
                { speaker: "Narrator", text: "The emu didn't flinch as {playerName} and Jenkins took careful steps closer, their training evident in every measured movement." }
            ]
        },
        {
            title: "Tests, Allies, and Enemies",
            background: "bg-urban",
            dialogue: [
                { speaker: "Teen", text: "You two must be from the Veterans' group. Which one of you is {playerName}? We've heard about your reputation." },
                { speaker: "{playerName}", text: "That's me. And you are...?" },
                { speaker: "Teen", text: "We're Team Emu. These creatures deserve the park too. Some of us think you veterans might actually understand that." },
                { speaker: "Narrator", text: "{playerName} and Jenkins were tested—ambushes, cryptic symbols, and even Cassidy, a veteran who had changed sides." },
                { speaker: "Cassidy", text: "They don't want war, {playerName}. Just recognition. You always were one of the more thoughtful ones in our group." },
                { speaker: "{playerName}", text: "What exactly are they asking for, Cassidy? Help me understand what we're missing here." }
            ]
        },
        {
            title: "Approach to the Inmost Cave",
            background: "bg-forest",
            dialogue: [
                { speaker: "Narrator", text: "{playerName} followed Jenkins to an old willow grove, where they found a burrow reinforced with soda cans and toy parts." },
                { speaker: "Narrator", text: "Inside were relics: photos of old alliances and a document titled Operation: Peace Dart. {playerName} was the first to spot the significance." },
                { speaker: "{playerName}", text: "Jenkins, look at this! These photos... that's our group from decades ago. And that capybara—it was part of our team!" },
                { speaker: "Jenkins", text: "They wanted to play with us... not against us." },
                { speaker: "{playerName}", text: "This changes everything. We weren't being invaded—we were being reminded of a promise we forgot." }
            ]
        },
        {
            title: "The Ordeal",
            background: "bg-urban",
            dialogue: [
                { speaker: "Narrator", text: "As {playerName} and Jenkins exited the burrow, they were surrounded—emus in front, teens with blasters behind." },
                { speaker: "Teen", text: "Time to see what the veterans are made of. {playerName}, you ready to prove yourselves?" },
                { speaker: "Narrator", text: "{playerName} ducked, rolled, and returned fire with precision alongside Jenkins. The emus didn't move—they watched. Judged." },
                { speaker: "{playerName}", text: "Wait! Everyone stop!" },
                { speaker: "Narrator", text: "{playerName} held the treaty patch high, understanding flooding through the group as Morrison's gift revealed its purpose." },
                { speaker: "{playerName}", text: "Back in '87, we made a pact with these creatures. This proves it. We're not enemies—we're allies who lost our way." }
            ]
        },
        {
            title: "The Reward",
            background: "bg-park",
            dialogue: [
                { speaker: "Ernie", text: "They were waiting for us... to remember. {playerName}, you figured it out." },
                { speaker: "Narrator", text: "The room fell quiet as the veterans read the truth they had forgotten. {playerName}'s discovery had bridged a gap decades in the making." },
                { speaker: "{playerName}", text: "We need to honor this alliance. These creatures have been trying to reconnect with us all along." },
                { speaker: "Jenkins", text: "{playerName}, you've shown us something important today. Will you help me make this right?" },
                { speaker: "Narrator", text: "The group looked to {playerName} for guidance, recognizing the wisdom that had emerged from careful observation and respect." }
            ]
        },
        {
            title: "The Road Back",
            background: "bg-park",
            dialogue: [
                { speaker: "Narrator", text: "{playerName} and Jenkins returned to the park with offerings—bird seed, clean targets, and open hands." },
                { speaker: "Narrator", text: "Emus nodded approval as {playerName} approached with respect and understanding." },
                { speaker: "Narrator", text: "Captain Cheeks, the capybara, approached and rested beside {playerName}, recognizing a kindred spirit." },
                { speaker: "{playerName}", text: "Welcome back, Captain. We've missed having you as part of our team." },
                { speaker: "Jenkins", text: "{playerName} helped me understand—tradition isn't about doing things the same way. It's about doing them right." }
            ]
        },
        {
            title: "The Resurrection",
            background: "bg-park",
            dialogue: [
                { speaker: "Narrator", text: "At the next VA meeting, {playerName} stood alongside Jenkins to address the group." },
                { speaker: "{playerName}", text: "We've learned that our traditions are stronger when they include rather than exclude. These animals aren't intruders—they're partners." },
                { speaker: "Jenkins", text: "The motion before us, proposed by {playerName}, is to reestablish Operation Peace Dart with our animal allies." },
                { speaker: "Narrator", text: "The VA voted unanimously to support {playerName}'s proposal. Operation Peace Dart 2.0 was born from understanding and respect." },
                { speaker: "Morales", text: "{playerName}, you've given us something we didn't know we'd lost. Thank you." }
            ]
        },
        {
            title: "Return with the Elixir",
            background: "bg-park",
            dialogue: [
                { speaker: "Narrator", text: "That spring, {playerName} helped organize the first 'Annual Co-Op Target Games.' Veterans, kids, and emus alike participated." },
                { speaker: "Narrator", text: "Foam darts flew through rings, ricocheted off rubber shields, and whistled past emu decoys. No one kept score. Everyone laughed." },
                { speaker: "Narrator", text: "Captain Cheeks sat in a folding chair beside {playerName}, watching it all with contentment." },
                { speaker: "{playerName}", text: "You know, Jenkins, sometimes the best victories come from knowing when not to fight." },
                { speaker: "Jenkins", text: "You taught us all that, {playerName}. Sometimes peace truly is the sharpest shot of all." },
                { speaker: "Narrator", text: "The park was alive with joy and unity, a testament to {playerName}'s wisdom in recognizing that even the oddest alliances could build something beautiful." }
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
    if (isSceneTransition) return;
    
    const scene = storyData.scenes[currentScene];
    if (!scene) return;
    
    // Move to next dialogue in current scene
    if (currentDialogue < scene.dialogue.length - 1) {
        currentDialogue++;
    } 
    // Move to next scene
    else if (currentScene < storyData.scenes.length - 1) {
        currentScene++;
        currentDialogue = 0;
        showSceneTitle(storyData.scenes[currentScene].title);
    }
    
    updateDisplay();
    publishSceneChange(getCurrentPosition());
}

// PREVIOUS SCENE FUNCTION: What happens when user clicks "Previous" button
function previousScene() {
    if (isSceneTransition) return;
    
    // Move to previous dialogue in current scene
    if (currentDialogue > 0) {
        currentDialogue--;
    }
    // Move to previous scene
    else if (currentScene > 0) {
        currentScene--;
        currentDialogue = storyData.scenes[currentScene].dialogue.length - 1;
        showSceneTitle(storyData.scenes[currentScene].title);
    }
    
    updateDisplay();
    publishSceneChange(getCurrentPosition());
}

// UPDATE DISPLAY: Refresh everything shown on screen
function updateDisplay() {
    const dialogue = getCurrentDialogue();
    if (!dialogue) return;
    
    // Update the speaker name
    if (speakerNameEl) {
        const speaker = personalizeText(dialogue.speaker);
        speakerNameEl.textContent = speaker;
    }
    
    // Update the dialogue text
    if (dialogueTextEl) {
        const text = personalizeText(dialogue.text);
        dialogueTextEl.textContent = text;
    }
    
    // Update the scene counter
    if (sceneCounterEl) {
        const position = getCurrentPosition() + 1;
        const total = getTotalDialogueCount();
        sceneCounterEl.textContent = `Line ${position} of ${total} - ${storyData.scenes[currentScene].title}`;
    }
    
    // Update the progress bar
    updateProgressBar();
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Update background if scene has changed
    const scene = storyData.scenes[currentScene];
    if (scene && scene.background) {
        updateBackground(scene.background);
    }
}

// UPDATE PROGRESS BAR: Show how far through the story we are
function updateProgressBar() {
    if (!progressFillEl) return;
    const position = getCurrentPosition() + 1;
    const total = getTotalDialogueCount();
    const progress = (position / total) * 100;
    progressFillEl.style.width = `${progress}%`;
}

// UPDATE NAVIGATION BUTTONS: Enable/disable based on story position
function updateNavigationButtons() {
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    
    const isAtStart = (currentScene === 0 && currentDialogue === 0);
    const isAtEnd = (currentScene === storyData.scenes.length - 1 && 
                    currentDialogue === storyData.scenes[currentScene].dialogue.length - 1);
    
    if (prevButton) prevButton.disabled = isAtStart;
    if (nextButton) nextButton.disabled = isAtEnd;
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
            // Convert position back to scene and dialogue
            const position = Math.max(0, Math.min(data.position - 1, getTotalDialogueCount() - 1));
            
            // Find which scene this position corresponds to
            let pos = 0;
            for (let i = 0; i < storyData.scenes.length; i++) {
                if (pos + storyData.scenes[i].dialogue.length > position) {
                    currentScene = i;
                    currentDialogue = position - pos;
                    break;
                }
                pos += storyData.scenes[i].dialogue.length;
            }
            
            updateDisplay();
            showSceneTitle(storyData.scenes[currentScene].title);
        }
    } catch (error) {
        console.log("Error processing MQTT message:", error);
    }
}

// PUBLISH SCENE CHANGE: Tell other devices about scene changes
function publishSceneChange(position) {
    if (!mqttClient || !mqttClient.isConnected()) return;
    
    try {
        const message = new Paho.MQTT.Message(JSON.stringify({
            position: position + 1,
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
function jumpToScene(sceneIndex, dialogueIndex = 0) {
    if (sceneIndex >= 0 && sceneIndex < storyData.scenes.length) {
        currentScene = sceneIndex;
        const scene = storyData.scenes[sceneIndex];
        currentDialogue = Math.max(0, Math.min(dialogueIndex, scene.dialogue.length - 1));
        updateDisplay();
        showSceneTitle(scene.title);
    }
}

// Get current story state (for debugging)
function getStoryState() {
    return {
        currentScene: currentScene,
        currentDialogue: currentDialogue,
        currentPosition: getCurrentPosition(),
        playerName: playerName,
        audioEnabled: audioEnabled,
        totalScenes: storyData.scenes.length,
        totalDialogues: getTotalDialogueCount()
    };
}

// Log story state to console (for debugging)
function logStoryState() {
    console.log('Current Story State:', getStoryState());
}

// Add this function at the end of the file or after other UI functions
function showFullStory() {
    // Hide navigation and audio controls while showing the full story
    document.querySelector('.controls').style.display = 'none';
    document.querySelector('.audio-controls').style.display = 'none';
    if (sceneCounterEl) sceneCounterEl.style.display = 'none';

    // Make the dialogue box scrollable and expand it
    if (dialogueTextEl) {
        dialogueTextEl.style.maxHeight = '70vh';
        dialogueTextEl.style.overflowY = 'auto';
        dialogueTextEl.style.padding = '20px';
        dialogueTextEl.style.lineHeight = '1.6';
    }

    // Fetch the markdown file
    fetch('assets/docs/storyline.md')
        .then(response => response.text())
        .then(md => {
            // Split into lines and filter out headers (lines starting with # or ##)
            const paragraphs = md.split(/\n+/)
                .filter(line => line.trim() && !line.trim().startsWith('#'));
            // Join paragraphs with double line breaks for readability
            const storyHtml = paragraphs.map(p => `<p style="margin-bottom: 15px;">${p}</p>`).join('');
            // Display in the dialogue area with better styling
            if (dialogueTextEl) {
                dialogueTextEl.innerHTML = `
                    <div style="font-size: 16px; line-height: 1.6;">
                        ${storyHtml}
                        <div style="text-align:center; margin-top:30px; padding-top:20px; border-top: 1px solid #666;">
                            <button class="nav-button" onclick="hideFullStory()">Back to Interactive Story</button>
                        </div>
                    </div>
                `;
                // Scroll to top of the content
                dialogueTextEl.scrollTop = 0;
            }
        })
        .catch(err => {
            if (dialogueTextEl) {
                dialogueTextEl.innerHTML = '<p>Failed to load story. Please check that the storyline.md file exists in the assets/docs/ folder.</p><div style="text-align:center; margin-top:20px;"><button class="nav-button" onclick="hideFullStory()">Back to Interactive Story</button></div>';
            }
        });
}

function hideFullStory() {
    // Restore navigation and audio controls
    document.querySelector('.controls').style.display = '';
    document.querySelector('.audio-controls').style.display = '';
    if (sceneCounterEl) sceneCounterEl.style.display = '';
    
    // Restore original dialogue box styling
    if (dialogueTextEl) {
        dialogueTextEl.style.maxHeight = '';
        dialogueTextEl.style.overflowY = '';
        dialogueTextEl.style.padding = '';
        dialogueTextEl.style.lineHeight = '';
    }
    
    // Restore the normal story view
    updateDisplay();
}
