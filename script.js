/* 
🧠 SCRIPT.JS - The Great Nerf War: A Capybara's Revenge

This file contains all the interactive functionality for our story.
JavaScript makes our story come alive by handling:
- Moving between scenes when users click buttons
- Updating what text and images are shown
- Communicating with other devices through MQTT
- Playing audio and handling user interactions

Think of JavaScript as the "director" of our story - it tells all the parts (HTML and CSS) what to do and when to do it.
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
    const finalPosition = position + currentDialogue;
    console.log('Calculating position:', {
        previousScenesLength: position,
        currentDialogue: currentDialogue,
        finalPosition: finalPosition
    });
    return finalPosition;
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
            title: "The Ordinary World: Target Practice Tradition",
            background: "bg-park",
            dialogue: [
                { speaker: "Narrator", text: "Every Tuesday at dawn, the Veterans' Association transforms Briarwood Park into their personal battlefield. {playerName}, known for precision shooting and tactical thinking, has become a cornerstone of this sacred tradition." },
                { speaker: "Jenkins", text: "Alright, veterans! Time for our weekly foam-dart warfare. {playerName}, you're team captain today—show these rookies how real soldiers handle a Nerf blaster!" },
                { speaker: "Morales", text: "Last week {playerName} hit every target from 50 yards. That's some serious marksmanship right there." },
                { speaker: "Narrator", text: "For these aging warriors, Tuesday target practice isn't just recreation—it's a lifeline to their military heritage. {playerName} understands this better than most." },
                { speaker: "{playerName}", text: "This tradition keeps us sharp, keeps us connected. Every dart fired is a reminder of who we were... and who we still are." },
                { speaker: "Jenkins", text: "Exactly! Now let's see some precision fire! {playerName}, take point on the obstacle course!" }
            ]
        },
        {
            title: "The Call to Adventure: Mysterious Capybara & Emu Patrols",
            background: "bg-forest",
            dialogue: [
                { speaker: "Morales", text: "Something's wrong, {playerName}. There's this... creature by the equipment shed. Massive rodent, just sitting there like it's running surveillance on our operation." },
                { speaker: "Jenkins", text: "Probably just a stray. Nothing a few warning shots can't handle." },
                { speaker: "Ernie", text: "No sir, this is different. Look at this photo—that's a capybara, and it's got backup. Emus. Lots of them." },
                { speaker: "Narrator", text: "Within 48 hours, emu patrols materialized throughout Briarwood Park. {playerName} recognized the tactical significance immediately—flanking positions, elevated observation posts, coordinated movement patterns." },
                { speaker: "{playerName}", text: "Jenkins, these aren't random animal encounters. Look at their formation—perimeter security, rotating watch schedules. Someone's commanding them." },
                { speaker: "Morales", text: "You're saying they're organized? {playerName}, that's impossible." },
                { speaker: "Captain Cheeks", text: "*Steps out from behind an oak tree, wearing a tiny military beret* Impossible? Perhaps. But true nonetheless, Sergeant {playerName}." },
                { speaker: "{playerName}", text: "Did... did that capybara just call me by rank?" },
                { speaker: "Captain Cheeks", text: "Captain Cheeks, 3rd Regiment Woodland Forces. And yes, I know exactly who you are, {playerName}. Your reputation precedes you." }
            ]
        },
        {
            title: "The Refusal: Jenkins Denies the Threat",
            background: "bg-park",
            dialogue: [
                { speaker: "Jenkins", text: "A talking rodent with military knowledge? {playerName}, I expected better from you. This is clearly some elaborate hoax." },
                { speaker: "{playerName}", text: "Jenkins, that capybara knew my service record. It addressed me by rank. This isn't a kid with a walkie-talkie." },
                { speaker: "Jenkins", text: "There's a logical explanation for everything. Probably some nature documentary crew filming nearby." },
                { speaker: "Captain Cheeks", text: "*Approaching the group boldly* Documentary crew? Sir, I'm insulted. My intelligence network is far more sophisticated than human entertainment media." },
                { speaker: "Jenkins", text: "*Stumbling backward* What the... {playerName}, are you seeing this too?" },
                { speaker: "Captain Cheeks", text: "Sergeant Jenkins, your denial won't change reality. The Woodland Alliance has been monitoring your activities for months. We know your patterns, your weaknesses." },
                { speaker: "{playerName}", text: "Captain... Cheeks, was it? What do you want from us?" },
                { speaker: "Captain Cheeks", text: "Justice, {playerName}. Your veterans have disturbed the sacred harmony of our domain. But you... you show promise. You listen. You observe. You might be the key to resolving this conflict without unnecessary bloodshed." },
                { speaker: "Jenkins", text: "I'm not negotiating with vermin! {playerName}, we're leaving. Now!" }
            ]
        },
        {
            title: "Meeting the Mentor: Morrison's Secret History",
            background: "bg-forest",
            dialogue: [
                { speaker: "Narrator", text: "Morrison, the grizzled 30-year veteran, pulled {playerName} aside beneath the memorial oak. His weathered Nerf Longshot—a relic from the group's founding—lay across his knees like a sacred artifact." },
                { speaker: "Morrison", text: "What you witnessed today, {playerName}... it's happened before. 1987. Operation Woodland Peace. We had first contact with Captain Cheeks' predecessor." },
                { speaker: "{playerName}", text: "First contact? Morrison, you're talking like this is some classified military operation." },
                { speaker: "Morrison", text: "It was. Dr. Miranda Whiskers ran an experimental program—teaching tactical communication to rescued wildlife. Capybaras, emus, even some corvids. We were supposed to be their training partners." },
                { speaker: "Narrator", text: "Morrison produced a yellowed photograph: soldiers in dress uniforms standing beside capybaras wearing tiny military decorations, a formal treaty ceremony captured in fading color." },
                { speaker: "Morrison", text: "We broke faith, {playerName}. Got spooked, opened fire during a joint exercise. Scattered their forces, destroyed their trust. Captain Cheeks' father... he didn't make it." },
                { speaker: "Captain Cheeks", text: "*Emerging from the shadows* But his son did. And his son remembers both the betrayal... and the original promise of cooperation." },
                { speaker: "{playerName}", text: "Captain, I... we didn't know. Is there any way to make this right?" },
                { speaker: "Captain Cheeks", text: "There is, {playerName}. But it requires courage Jenkins doesn't possess. You must enter our domain—emu territory—and prove your commitment to peace." }
            ]
        },
        {
            title: "Crossing the Threshold: Entering Emu Territory",
            background: "bg-forest",
            dialogue: [
                { speaker: "Narrator", text: "At dawn, {playerName} made the fateful decision to cross into the eastern sector—emu territory. Jenkins followed reluctantly, his skepticism warring with military discipline." },
                { speaker: "Jenkins", text: "This is madness, {playerName}. We're treating a park like a combat zone because of some overgrown guinea pig." },
                { speaker: "{playerName}", text: "Military protocol, Jenkins. Reconnaissance before engagement. We need to understand what we're dealing with." },
                { speaker: "Narrator", text: "The threshold was unmistakable—a line of park benches arranged in defensive formation, with an emu sentry standing perfectly still, like a feathered checkpoint guard." },
                { speaker: "Jenkins", text: "Okay, that bird is definitely not acting normal. {playerName}, it's watching us like it's taking notes." },
                { speaker: "Captain Cheeks", text: "*Stepping through morning mist* Excellent observation, Sergeant Jenkins. Lieutenant Feathers does maintain detailed reconnaissance reports." },
                { speaker: "{playerName}", text: "Lieutenant... you have a military command structure?" },
                { speaker: "Captain Cheeks", text: "Indeed. Welcome to Forward Operating Base Willow, {playerName}. You're now in Woodland Alliance territory. Your weapons, please—a show of good faith." },
                { speaker: "Jenkins", text: "We're not surrendering our Nerf blasters to a talking hamster!" },
                { speaker: "Captain Cheeks", text: "*Chuckling* Capybara, Sergeant. And this isn't surrender—it's diplomacy. {playerName} understands the difference, don't you?" }
            ]
        },
        {
            title: "Tests, Allies, Enemies: The Foam Dart Trials",
            background: "bg-urban",
            dialogue: [
                { speaker: "Captain Cheeks", text: "Before we can trust you completely, {playerName}, you must prove your worthiness through the traditional trials of marksmanship and strategy." },
                { speaker: "Teen Leader", text: "Wait up! I'm Alex, leader of the Emu Liberation Front. {playerName}, we've been monitoring your group—some of us think you veterans actually understand honor." },
                { speaker: "{playerName}", text: "Liberation Front? Alex, what exactly do you think is happening here?" },
                { speaker: "Alex", text: "These animals have intelligence, military training, and legitimate grievances against your group. Captain Cheeks has been trying to reestablish diplomatic contact for months." },
                { speaker: "Captain Cheeks", text: "Alex speaks truth. But words alone are insufficient, {playerName}. You must demonstrate your commitment through action." },
                { speaker: "Cassidy", text: "*Former VA member stepping forward* They don't want war, {playerName}. I've been working with Captain Cheeks to develop peaceful conflict resolution protocols." },
                { speaker: "{playerName}", text: "Cassidy? You left the veterans to work with... them? What convinced you?" },
                { speaker: "Captain Cheeks", text: "We offered her what humans often forget, {playerName}—the chance to be part of something larger than tribal loyalty. True interspecies cooperation." },
                { speaker: "Jenkins", text: "This is completely insane! {playerName}, we're negotiating foreign policy with a rodent!" },
                { speaker: "Captain Cheeks", text: "*Drawing a tiny foam dart blaster* Sergeant Jenkins, your skepticism is noted. However, if {playerName} can hit three targets from fifty meters, we proceed to negotiations. If not... well, perhaps this alliance isn't meant to be." }
            ]
        },
        {
            title: "Approach to the Inmost Cave: The Capybara Command Bunker",
            background: "bg-forest",
            dialogue: [
                { speaker: "Captain Cheeks", text: "Follow me, {playerName}. It's time you saw the true heart of our operation—the command center your predecessors helped design in 1987." },
                { speaker: "Narrator", text: "Following a trail of tactical markers that only {playerName}'s trained eye could detect, the team discovered a sophisticated bunker beneath the ancient willow grove." },
                { speaker: "{playerName}", text: "Jenkins, look at this construction. Military-grade camouflage, multiple exit routes, strategic supply caches. This isn't some animal nest—it's a professional command center." },
                { speaker: "Captain Cheeks", text: "Welcome to Base Willow, {playerName}. Built with human engineering expertise and capybara patience. Your mentor Morrison helped design the ventilation system." },
                { speaker: "Narrator", text: "Inside, the walls displayed decades of documentation: photos of joint training exercises, tactical manuals in multiple languages, and detailed maps of the entire park ecosystem." },
                { speaker: "Jenkins", text: "My God, {playerName}... this is a full military intelligence operation. How long have they been planning this?" },
                { speaker: "Captain Cheeks", text: "Not planning, Sergeant Jenkins. Hoping. We've been hoping for thirty-five years that your veterans would remember the original alliance." },
                { speaker: "{playerName}", text: "Captain, the evidence here... it suggests humans and animals were meant to work together. Why did we abandon this?" },
                { speaker: "Captain Cheeks", text: "Fear, {playerName}. Fear of the unknown, fear of losing human superiority. But you... you have the wisdom to see beyond such limitations." }
            ]
        },
        {
            title: "The Ordeal: The Great Foam-Dart Battle",
            background: "bg-urban",
            dialogue: [
                { speaker: "Captain Cheeks", text: "{playerName}, you've seen our history. But some of my troops remain skeptical. They demand proof of your commitment through trial by combat." },
                { speaker: "Narrator", text: "As they emerged from the bunker, {playerName} and Jenkins found themselves surrounded by the elite Emu Defense Corps—six-foot-tall birds with tactical positions and foam-dart launchers." },
                { speaker: "Emu Commander", text: "*Through a voice modulator* Humans Jenkins and {playerName}, you have violated sacred territory. Submit to our judgment or face the consequences." },
                { speaker: "{playerName}", text: "Negative! We're here for diplomatic talks! Captain Cheeks, call off your troops!" },
                { speaker: "Captain Cheeks", text: "*Sighing heavily* I'm afraid diplomacy requires demonstration, {playerName}. My officers demand you prove your worthiness in honorable combat." },
                { speaker: "Narrator", text: "Foam darts erupted from all directions. {playerName} and Jenkins found themselves in the most surreal firefight of their military careers—dodging emu volleys while teenage sympathizers provided covering fire." },
                { speaker: "Jenkins", text: "{playerName}, I can't believe I'm saying this, but these birds have better tactical coordination than most human squads I've commanded!" },
                { speaker: "Captain Cheeks", text: "*Whistling a complex cease-fire signal* Enough! These humans have proven their courage under fire. Lower your weapons, my friends!" },
                { speaker: "{playerName}", text: "Thank you, Captain. Now can we please talk like civilized beings?" },
                { speaker: "Captain Cheeks", text: "Indeed we can, {playerName}. You've earned the right to see our most sacred artifact—the original Peace Dart Accords of 1987." }
            ]
        },
        {
            title: "The Reward: Discovering the Peace Treaty",
            background: "bg-park",
            dialogue: [
                { speaker: "Captain Cheeks", text: "Behold, {playerName}—the original Peace Dart Accords of 1987. Your military understands the sacred importance of written agreements." },
                { speaker: "Narrator", text: "The ancient document outlined revolutionary concepts: shared training facilities, mutual respect protocols, joint defensive strategies, and interspecies communication standards." },
                { speaker: "{playerName}", text: "This is incredible! Captain, this document describes true interspecies military cooperation. Shared intelligence, collaborative defense strategies... this could change everything." },
                { speaker: "Jenkins", text: "{playerName}, you're talking about treating animals as equals in military operations. The implications are staggering." },
                { speaker: "Captain Cheeks", text: "Revolution was never our goal, Sergeant Jenkins. Evolution was. The evolution of understanding between all species capable of strategic thinking." },
                { speaker: "{playerName}", text: "Captain, with your permission, I'd like to bring this back to the Veterans' Association. They need to understand what we lost... and what we could regain." },
                { speaker: "Captain Cheeks", text: "That is precisely what I hoped you would say, {playerName}. But first, you must convince your commander Jenkins to sign the renewal treaty." },
                { speaker: "Jenkins", text: "Sign a treaty? With animals? {playerName}, this is either the craziest thing I've ever done... or the most brilliant." },
                { speaker: "Captain Cheeks", text: "Courage and wisdom often appear as madness to those who possess neither, Sergeant. But {playerName} has both in abundance." }
            ]
        },
        {
            title: "The Road Back: Newfound Respect",
            background: "bg-park",
            dialogue: [
                { speaker: "Narrator", text: "{playerName} and Jenkins returned to Briarwood Park not as conquerors, but as diplomats carrying offerings: premium bird seed, precision-crafted targets, and most importantly, open minds." },
                { speaker: "Captain Cheeks", text: "Your approach honors the spirit of the original accords, {playerName}. The Emu Corps has voted to accept your peaceful overtures." },
                { speaker: "{playerName}", text: "Captain Cheeks, on behalf of the Veterans' Association, I formally request to reestablish the Peace Dart Alliance." },
                { speaker: "Narrator", text: "Emus lowered their heads in respectful acknowledgment as {playerName} demonstrated the tactical hand signals learned from the old documents." },
                { speaker: "Jenkins", text: "{playerName}, I owe you an apology. Your tactical instincts were right from the beginning. This alliance could benefit everyone." },
                { speaker: "Captain Cheeks", text: "Apology accepted, Jenkins. But the real test comes next—can your association adapt their traditions to include non-human participants?" }
            ]
        },
        {
            title: "The Resurrection: Jenkins' Reform Push",
            background: "bg-park",
            dialogue: [
                { speaker: "Narrator", text: "At the emergency VA assembly, Jenkins stood beside {playerName} to address the most controversial proposal in the organization's history." },
                { speaker: "Jenkins", text: "Fellow veterans, {playerName} has brought us evidence of a partnership that predates our current traditions. I move to ratify the revised Peace Dart Accords." },
                { speaker: "{playerName}", text: "This isn't about abandoning our military heritage—it's about expanding it. These animals have tactical skills that could enhance our training protocols." },
                { speaker: "Morales", text: "You're asking us to train alongside talking capybaras and strategically-minded emus? {playerName}, that's asking a lot." },
                { speaker: "Captain Cheeks", text: "*Addressing the assembly via video link* Veterans, we seek not to replace your traditions, but to enrich them with interspecies cooperation." },
                { speaker: "Narrator", text: "The vote was unanimous: 15-0 in favor of {playerName}'s proposal. Operation Peace Dart 2.0 was officially sanctioned." },
                { speaker: "Jenkins", text: "{playerName}, you've done something I thought impossible—you've made this old soldier excited about change." }
            ]
        },
        {
            title: "Return with the Elixir: The New Tradition",
            background: "bg-park",
            dialogue: [
                { speaker: "Narrator", text: "Six months later, {playerName} stood before the first Annual Interspecies Tactical Training Exercise, watching humans and animals compete side by side." },
                { speaker: "{playerName}", text: "Ladies, gentlemen, emus, and distinguished capybara officers—welcome to the future of cooperative defense training!" },
                { speaker: "Narrator", text: "Foam darts flew in complex patterns designed by both human and animal strategists. Emu observers provided aerial reconnaissance while capybara officers coordinated ground movements." },
                { speaker: "Captain Cheeks", text: "*Sitting in the command chair beside {playerName}* You have given both our species something precious—proof that intelligence and respect can overcome any barrier." },
                { speaker: "Jenkins", text: "You know, {playerName}, when I first saw that capybara, I thought we were under attack. Turns out we were being offered the greatest tactical alliance in military history." },
                { speaker: "{playerName}", text: "Sometimes the best victories come not from defeating your enemy, but from discovering they were never your enemy at all." },
                { speaker: "Narrator", text: "As the sun set over Briarwood Park, {playerName} watched humans and animals working together, realizing that some wars are won not through conflict, but through the courage to extend a hand... or paw... in friendship." }
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
    
    // Make dialogue box draggable
    makeDraggable();
    
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
    
    // Initialize background element
    backgroundEl = document.getElementById('background');
    updateBackground();  // Set initial background
    
    // Show the first scene
    updateDisplay();
});

// INITIALIZE DOM ELEMENTS: Get references to all the HTML elements we need
function initializeElements() {
    dialogueTextEl = document.getElementById('dialogueText');
    speakerNameEl = document.getElementById('speakerName');
    sceneCounterEl = document.querySelector('.scene-counter');
    progressFillEl = document.getElementById('progressFill');
    backgroundEl = document.getElementById('background');
    sceneTitle = document.getElementById('sceneTitle');
    
    console.log('Initialized elements:', {
        dialogueTextEl: !!dialogueTextEl,
        speakerNameEl: !!speakerNameEl,
        sceneCounterEl: !!sceneCounterEl,
        progressFillEl: !!progressFillEl,
        backgroundEl: !!backgroundEl,
        sceneTitle: !!sceneTitle
    });
}

// Update background image based on current dialogue number
function updateBackground() {
    if (!backgroundEl) {
        console.error('Background element not found');
        return;
    }
    
    // Get the current position (1-based for file naming)
    const position = getCurrentPosition() + 1;
    
    // Clamp position between 1 and 101 (total number of images)
    const clampedPosition = Math.max(1, Math.min(101, position));
    const imageUrl = `assets/images/${clampedPosition}.svg`;
    
    console.log('Updating background:', {
        currentScene,
        currentDialogue,
        position,
        clampedPosition,
        imageUrl
    });

    // Create a new image to preload
    const img = new Image();
    img.onload = () => {
        // Once image is loaded, update the background
        requestAnimationFrame(() => {
            backgroundEl.style.backgroundImage = `url('${imageUrl}')`;
            console.log('Background image updated successfully');
        });
    };
    img.onerror = (err) => {
        console.error('Failed to load background image:', imageUrl, err);
    };
    img.src = imageUrl;
}

// UPDATE DISPLAY: Refresh everything shown on screen
function updateDisplay() {
    const dialogue = getCurrentDialogue();
    if (!dialogue) return;
    
    // Update the speaker name with color coding
    if (speakerNameEl) {
        const speaker = personalizeText(dialogue.speaker);
        speakerNameEl.textContent = speaker;
        
        // Apply different colors for different speakers
        if (speaker === 'Captain Cheeks') {
            speakerNameEl.style.color = '#FFB74D'; // Orange for Captain Cheeks
        } else if (speaker === 'Narrator') {
            speakerNameEl.style.color = '#90CAF9'; // Light blue for narrator
        } else if (speaker === playerName) {
            speakerNameEl.style.color = '#81C784'; // Green for player
        } else if (speaker === 'Jenkins') {
            speakerNameEl.style.color = '#F48FB1'; // Pink for Jenkins
        } else {
            speakerNameEl.style.color = '#FFFFFF'; // White for any other speakers
        }
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
    
    // Update background immediately
    updateBackground();
    
    console.log('Display updated:', {
        scene: currentScene,
        dialogue: currentDialogue,
        text: dialogue.text,
        position: getCurrentPosition()
    });
}

// NEXT SCENE FUNCTION: What happens when user clicks "Next" button
function nextScene() {
    if (isSceneTransition) return;
    
    const nextPosition = getCurrentPosition() + 1;
    if (nextPosition < getTotalDialogueCount()) {
        console.log('Moving to next scene:', {
            fromScene: currentScene,
            fromDialogue: currentDialogue
        });
        
        currentDialogue++;
        if (currentDialogue >= storyData.scenes[currentScene].dialogue.length) {
            currentScene++;
            currentDialogue = 0;
        }
        
        console.log('New position:', {
            toScene: currentScene,
            toDialogue: currentDialogue
        });
        
        updateDisplay();
        playBellSound();
    }
}

// PREVIOUS SCENE FUNCTION: What happens when user clicks "Previous" button
function previousScene() {
    if (isSceneTransition) return;
    
    if (currentScene > 0 || currentDialogue > 0) {
        currentDialogue--;
        if (currentDialogue < 0) {
            currentScene--;
            currentDialogue = storyData.scenes[currentScene].dialogue.length - 1;
        }
        updateDisplay();
        playBellSound();
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

// Play a bell sound when navigating between scenes
function playBellSound() {
    const bellSound = document.getElementById('bellSound');
    if (bellSound && audioEnabled) {
        bellSound.currentTime = 0;
        bellSound.play().catch(e => {
            console.log("Bell sound play failed:", e);
        });
    }
}

// Show the complete story in a scrollable view
function showFullStory() {
    const dialogueBox = document.querySelector('.dialogue-box');
    
    // Store the original position and size
    dialogueBox.dataset.originalTransform = dialogueBox.style.transform || '';
    dialogueBox.style.transform = 'none';
    
    // Hide navigation and audio controls while showing the full story
    const navButtonsRow = document.querySelector('.nav-buttons-row');
    const audioControlsRow = document.querySelector('.audio-controls-row');
    if (navButtonsRow) navButtonsRow.style.display = 'none';
    if (audioControlsRow) audioControlsRow.style.display = 'none';
    if (sceneCounterEl) sceneCounterEl.style.display = 'none';
    if (speakerNameEl) speakerNameEl.style.display = 'none';

    // Make the dialogue box scrollable and expand it
    if (dialogueTextEl) {
        dialogueTextEl.style.maxHeight = '70vh';
        dialogueTextEl.style.overflowY = 'auto';
        dialogueTextEl.style.lineHeight = '1.6';
        dialogueTextEl.style.fontSize = '16px';
    }

    // Temporarily disable dragging
    dialogueBox.style.cursor = 'default';
    
    let fullStoryHtml = '<div class="full-story-content">';
    
    // Add header
    fullStoryHtml += `
        <div class="story-header">
            <h1 style="color: #DAA520; font-size: 24px; margin-bottom: 10px;">
                The Great Nerf War: A Capybara's Revenge
            </h1>
            <p style="color: #aaa; font-style: italic;">
                The Complete Interactive Story featuring ${playerName}
            </p>
        </div>
    `;

    // Add each scene
    storyData.scenes.forEach((scene, sceneIndex) => {
        fullStoryHtml += `
            <div style="margin-bottom: 30px; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 10px;">
                <h2 style="color: #DAA520; margin-bottom: 20px; font-size: 20px;">
                    ${scene.title}
                </h2>
                ${scene.dialogue.map(dialogue => `
                    <div style="margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
                        <div style="color: #FFB74D; font-weight: bold; margin-bottom: 5px;">
                            ${personalizeText(dialogue.speaker)}:
                        </div>
                        <div style="color: #e0e0e0; padding-left: 10px;">
                            ${personalizeText(dialogue.text)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    });

    fullStoryHtml += `</div>`;  // Close the full-story-content div
    
    // Add fixed position back button outside the scrollable content
    fullStoryHtml += `
        <div class="story-back-button">
            <button class="nav-button" onclick="hideFullStory()">
                Back to Interactive Story
            </button>
        </div>
    `;

    // Update the dialogue text element with the full story
    if (dialogueTextEl) {
        dialogueTextEl.innerHTML = fullStoryHtml;
    }
}

// Hide the full story view and restore the interactive mode
function hideFullStory() {
    const dialogueBox = document.querySelector('.dialogue-box');
    
    // Restore navigation and audio controls
    const navButtonsRow = document.querySelector('.nav-buttons-row');
    const audioControlsRow = document.querySelector('.audio-controls-row');
    if (navButtonsRow) navButtonsRow.style.display = 'flex';
    if (audioControlsRow) audioControlsRow.style.display = 'flex';
    if (sceneCounterEl) sceneCounterEl.style.display = '';
    if (speakerNameEl) speakerNameEl.style.display = '';
    
    // Restore original dialogue box styling
    if (dialogueTextEl) {
        dialogueTextEl.style.maxHeight = '';
        dialogueTextEl.style.overflowY = '';
        dialogueTextEl.style.lineHeight = '';
        dialogueTextEl.style.fontSize = '';
    }
    
    // Re-enable dragging
    dialogueBox.style.cursor = 'move';
    
    // Restore original position
    if (dialogueBox.dataset.originalTransform) {
        dialogueBox.style.transform = dialogueBox.dataset.originalTransform;
    }
    
    // Restore the normal story view with current scene
    updateDisplay();
}

/* ==========================================================================
   DRAGGABLE FUNCTIONALITY
   ========================================================================== */

function makeDraggable() {
    const dialogueBox = document.querySelector('.dialogue-box');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // Reset position on window resize to prevent box from getting stuck offscreen
    window.addEventListener('resize', () => {
        xOffset = 0;
        yOffset = 0;
        dialogueBox.style.transform = 'translate(0px, 0px)';
    });

    function dragStart(e) {
        if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        // Only start dragging if we're clicking the dialogue box directly (not its children)
        if (e.target === dialogueBox) {
            isDragging = true;
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            // Get box boundaries
            const box = dialogueBox.getBoundingClientRect();
            const parentBox = dialogueBox.parentElement.getBoundingClientRect();

            // Prevent dragging outside the window
            if (box.left < 0) currentX -= box.left;
            if (box.right > window.innerWidth) currentX -= (box.right - window.innerWidth);
            if (box.top < 0) currentY -= box.top;
            if (box.bottom > window.innerHeight) currentY -= (box.bottom - window.innerHeight);

            setTranslate(currentX, currentY, dialogueBox);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }

    // Desktop Events
    dialogueBox.addEventListener('mousedown', dragStart, false);
    document.addEventListener('mousemove', drag, false);
    document.addEventListener('mouseup', dragEnd, false);

    // Mobile Events
    dialogueBox.addEventListener('touchstart', dragStart, false);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', dragEnd, false);

    // Add double-click to reset position
    dialogueBox.addEventListener('dblclick', (e) => {
        if (e.target === dialogueBox) {
            xOffset = 0;
            yOffset = 0;
            setTranslate(0, 0, dialogueBox);
        }
    });

    // Prevent text selection during drag
    dialogueBox.addEventListener('selectstart', (e) => {
        if (isDragging) {
            e.preventDefault();
        }
    });
}

// Call makeDraggable to enable dragging on the dialogue box
makeDraggable();
