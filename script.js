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
let sceneImageEl; 


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

// DRAG FUNCTIONALITY: For dialogue box dragging
let isDragging = false;      // Is the dialogue box being dragged?
let dragStartX = 0;          // Mouse X position when drag started
let dragStartY = 0;          // Mouse Y position when drag started
let dialogueBoxStartX = 0;   // Dialogue box X position when drag started
let dialogueBoxStartY = 0;   // Dialogue box Y position when drag started
let dialogueBoxEl = null;    // Reference to dialogue box element

// DOM ELEMENTS: Get references to HTML elements we'll need to control
let dialogueTextEl, speakerNameEl, sceneCounterEl, progressFillEl, backgroundEl, sceneTitle;

/* ==========================================================================
   AUDIO MAPPING SYSTEM - Comprehensive audio design for immersive storytelling
   ========================================================================== */

// Audio state management
let currentBackgroundAudio = null;
let soundEffectsQueue = [];
let isProcessingAudio = false;

// COMPREHENSIVE AUDIO MAPPING: Scene.Dialogue -> Audio File
const audioMapping = {
    // Scene 1: The Ordinary World
    "1.1": "amb--wood-pidgeon--my-birding-year.ogg",
    "1.6p": "stinger--boom.mp3",
    
    // Scene 2: The Call to Adventure  
    "2.1": "mus--00-capybara.wav",
    "2.4": "stinger--hells-kitchen-violin.mp3",
    "2.7": "stinger--jumpscare.mp3",
    
    // Scene 3: The Refusal
    "3.1": "mus--01-emu.wav", 
    "3.4": "stinger--hells-kitchen-violin.mp3",
    
    // Scene 4: Meeting the Mentor
    "4.1": "mus--02-briefing.wav",
    "4.4": "stinger--tuba-jimmy-fallon.mp3",
    
    // Scene 5: Crossing the Threshold
    "5.1": "mus--03-orders.wav",
    "5.5": "stinger--hells-kitchen-violin.mp3",
    "5.6": "stinger--tuba-jimmy-fallon.mp3",
    
    // Scene 6: Tests, Allies, Enemies
    "6.1": "mus--01-emu.wav",
    "6.6": "stinger--jumpscare.mp3",
    
    // Scene 7: Approach to the Inmost Cave
    "7.1": "mus--03-orders.wav",
    "7.9": "silence.wav",
    
    // Scene 8: The Ordeal
    "8.1": "mus--02-briefing.wav",
    "8.6": "mus--01-emu.wav", 
    "8.7": "stinger--hells-kitchen-violin.mp3",
    
    // Scene 9: The Reward
    "9.1": "mus--00-capybara.wav",
    "9.7p": "silence.wav",
    "9.8": "stinger--tuba-jimmy-fallon.mp3",
    
    // Scene 10: The Road Back
    "10.1": "mus--02-briefing.wav",
    
    // Scene 11: The Resurrection  
    "11.1": "mus--01-emu.wav",
    "11.4": "stinger--hells-kitchen-violin.mp3",
    
    // Scene 12: Return with the Elixir
    "12.1": "amb--wood-pidgeon--my-birding-year.ogg",
    "12.7": "mus--04-ending.wav"
};

/**
 * Create audio key for current position
 */
function createAudioKey(sceneIndex, dialogueIndex, isPost = false) {
    const sceneNum = sceneIndex + 1;
    const dialogueNum = dialogueIndex + 1;
    return `${sceneNum}.${dialogueNum}${isPost ? 'p' : ''}`;
}

/**
 * Play background music or ambient audio
 */
function playBackgroundAudio(filename) {
    if (!audioEnabled) return;
    
    const backgroundAudio = document.getElementById('backgroundAudio');
    if (!backgroundAudio) return;
    
    const audioPath = `assets/audio/${filename}`;
    
    // Only change if it's a different file
    if (currentBackgroundAudio !== audioPath) {
        console.log(`🎵 Playing background audio: ${filename}`);
        currentBackgroundAudio = audioPath;
        
        // Handle silence specially
        if (filename === 'silence.wav') {
            backgroundAudio.pause();
            backgroundAudio.currentTime = 0;
            return;
        }
        
        // Set new audio source
        backgroundAudio.src = audioPath;
        backgroundAudio.load(); // Ensure audio loads
        
        // Play the audio
        backgroundAudio.play().catch(e => {
            console.log("Background audio play failed:", e);
        });
    }
}

/**
 * Play sound effect (non-looping, overlay audio)
 */
function playSoundEffect(filename) {
    if (!audioEnabled) return;
    
    console.log(`🔊 Playing sound effect: ${filename}`);
    
    // Create a temporary audio element for sound effects
    const soundEffect = new Audio(`assets/audio/${filename}`);
    soundEffect.volume = 0.8; // Slightly louder than background
    
    // Play the sound effect
    soundEffect.play().catch(e => {
        console.log("Sound effect play failed:", e);
    });
    
    // Clean up when finished
    soundEffect.addEventListener('ended', () => {
        soundEffect.remove();
    });
}

/**
 * Handle audio cues for current story position
 */
function handleAudioCues() {
    if (isProcessingAudio) return;
    isProcessingAudio = true;
    
    try {
        const audioKey = createAudioKey(currentScene, currentDialogue);
        const audioFile = audioMapping[audioKey];
        
        if (audioFile) {
            // Determine audio type by filename prefix
            if (audioFile.startsWith('mus--') || audioFile.startsWith('amb--') || audioFile === 'silence.wav') {
                // Background music or ambient sound
                playBackgroundAudio(audioFile);
            } else if (audioFile.startsWith('stinger--')) {
                // Sound effect
                playSoundEffect(audioFile);
            }
        }
        
        // Check for post-dialogue cues (p suffix)
        const postAudioKey = createAudioKey(currentScene, currentDialogue, true);
        const postAudioFile = audioMapping[postAudioKey];
        
        if (postAudioFile) {
            // Delay post-dialogue audio slightly for dramatic timing
            setTimeout(() => {
                if (postAudioFile.startsWith('mus--') || postAudioFile.startsWith('amb--') || postAudioFile === 'silence.wav') {
                    playBackgroundAudio(postAudioFile);
                } else if (postAudioFile.startsWith('stinger--')) {
                    playSoundEffect(postAudioFile);
                }
            }, 1500); // 1.5 second delay for post-dialogue effects
        }
        
    } finally {
        // Reset processing flag after a short delay
        setTimeout(() => {
            isProcessingAudio = false;
        }, 100);
    }
}

/**
 * Initialize audio system
 */
function initializeAudioSystem() {
    console.log('🎵 Audio mapping system initialized with', Object.keys(audioMapping).length, 'cues');
    
    // Set initial audio for scene 1, dialogue 1
    if (audioEnabled) {
        setTimeout(() => {
            handleAudioCues();
        }, 1000); // Small delay to ensure page is ready
    }
}

/* ==========================================================================
   STORY DATA - All the content organized in a easy-to-edit structure
   ========================================================================== */

// STORY DATABASE: Contains all 12 scenes following the Hero's Journey
const storyData = {
    scenes: [
        {
            title: "The Ordinary World: Target Practice Tradition",
            background: "bg-office",
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
            background: "bg-park",
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
            background: "bg-office",
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
            background: "bg-office",
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
            background: "bg-park",
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
            background: "bg-park",
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
            background: "bg-park",
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
            background: "bg-battlefield",
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
            background: "bg-peace",
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
window.addEventListener('load', function () {
    // Initialize all the DOM element references
    initializeElements();

    // Set up MQTT communication
    initMQTT();

    // Set up touch gestures for mobile
    setupTouchControls();

    // Set up keyboard navigation
    setupKeyboardControls();
    
    // Set up dialogue box dragging
    setupDialogueBoxDrag();

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
    sceneImageEl = document.getElementById("sceneImage");
    dialogueBoxEl = document.querySelector('.dialogue-box');
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
    const wasUserInitiated = !orchestratorConnected;
    updateDisplay();
    if (wasUserInitiated) {
    publishDialogueStep();
}

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
    const wasUserInitiated = !orchestratorConnected;
    updateDisplay();
    if (wasUserInitiated) {
    publishDialogueStep();
}
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
            speakerNameEl.style.color = '#FFB74D';
        } else if (speaker === 'Narrator') {
            speakerNameEl.style.color = '#90CAF9';
        } else if (speaker === playerName) {
            speakerNameEl.style.color = '#81C784';
        } else if (speaker === 'Jenkins') {
            speakerNameEl.style.color = '#F48FB1';
        } else if (speaker === 'Morales') {
            speakerNameEl.style.color = '#CE93D8';
        } else if (speaker === 'Morrison') {
            speakerNameEl.style.color = '#FFCC02';
        } else if (speaker === 'Alex' || speaker === 'Teen Leader') {
            speakerNameEl.style.color = '#80CBC4';
        } else if (speaker === 'Cassidy') {
            speakerNameEl.style.color = '#FFAB91';
        } else if (speaker === 'Emu Commander') {
            speakerNameEl.style.color = '#A5D6A7';
        } else if (speaker === 'Ernie') {
            speakerNameEl.style.color = '#B39DDB';
        } else {
            speakerNameEl.style.color = '#FFFFFF';
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

    // Update background if scene has changed
    const scene = storyData.scenes[currentScene];
    if (scene && scene.background) {
        updateBackground(scene.background);
    }

    // ✅ Update the scene image based on dialogue index
    if (sceneImageEl) {
        const imageIndex = getCurrentPosition() + 1;
        const imagePath = `assets/images/${imageIndex}.svg`;

        // Optional: Fade image smoothly
        sceneImageEl.style.opacity = 0; // Start fade out
        setTimeout(() => {
            sceneImageEl.src = imagePath;
            sceneImageEl.alt = `Scene image ${imageIndex}`;
            sceneImageEl.onload = () => {
                sceneImageEl.style.opacity = 1; // Fade in after load
            };
        }, 150);
    }
    
    // 🎵 Handle audio cues for current position
    handleAudioCues();
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
        sceneTitle.style.transition = '';
    }, 2300);
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
    
    // Initialize the comprehensive audio system
    initializeAudioSystem();

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
        // Initialize audio system and trigger current position cues
        initializeAudioSystem();
        handleAudioCues();
        if (audioToggle) audioToggle.textContent = '🔊 Audio';
    } else {
        // Pause all audio when disabled
        backgroundAudio.pause();
        currentBackgroundAudio = null;
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
    document.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
    });

    // Listen for touch end (when finger lifts off screen)
    document.addEventListener('touchend', function (e) {
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
   DIALOGUE BOX DRAG FUNCTIONALITY - Allow users to drag the dialogue box around
   ========================================================================== */

// SETUP DIALOGUE BOX DRAG: Initialize drag event listeners
function setupDialogueBoxDrag() {
    if (!dialogueBoxEl) return;
    
    // Mouse events for desktop
    dialogueBoxEl.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    
    // Touch events for mobile (separate from swipe navigation)
    dialogueBoxEl.addEventListener('touchstart', startTouchDrag, { passive: false });
    document.addEventListener('touchmove', onTouchDrag, { passive: false });
    document.addEventListener('touchend', endTouchDrag);
    
    console.log('🖱️ Dialogue box drag functionality enabled');
}

// START DRAG: Begin dragging when mouse/touch down on dialogue box
function startDrag(e) {
    // Don't start drag if clicking on buttons or inputs
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SPAN') {
        return;
    }
    
    e.preventDefault();
    isDragging = true;
    
    // Record starting positions
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    // Get current dialogue box position
    const rect = dialogueBoxEl.getBoundingClientRect();
    dialogueBoxStartX = rect.left;
    dialogueBoxStartY = rect.top;
    
    // Add visual feedback
    dialogueBoxEl.style.transition = 'none'; // Disable transition during drag
    dialogueBoxEl.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none'; // Prevent text selection
}

// START TOUCH DRAG: Begin dragging for touch devices
function startTouchDrag(e) {
    // Don't start drag if touching buttons or inputs
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SPAN') {
        return;
    }
    
    // Check if this is a single finger touch (not a swipe gesture)
    if (e.touches.length !== 1) return;
    
    e.preventDefault();
    isDragging = true;
    
    const touch = e.touches[0];
    dragStartX = touch.clientX;
    dragStartY = touch.clientY;
    
    // Get current dialogue box position
    const rect = dialogueBoxEl.getBoundingClientRect();
    dialogueBoxStartX = rect.left;
    dialogueBoxStartY = rect.top;
    
    // Add visual feedback
    dialogueBoxEl.style.transition = 'none';
    dialogueBoxEl.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
}

// ON DRAG: Handle dragging movement
function onDrag(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    
    // Calculate new position
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    
    const newX = dialogueBoxStartX + deltaX;
    const newY = dialogueBoxStartY + deltaY;
    
    // Apply minimal constraints (keep at least 100px of the box visible)
    const minVisible = 100;
    const maxX = window.innerWidth - minVisible;
    const maxY = window.innerHeight - minVisible;
    const minX = -(dialogueBoxEl.offsetWidth - minVisible);
    const minY = -50; // Allow moving above viewport slightly
    
    const constrainedX = Math.max(minX, Math.min(maxX, newX));
    const constrainedY = Math.max(minY, Math.min(maxY, newY));
    
    // Update position
    dialogueBoxEl.style.left = `${constrainedX}px`;
    dialogueBoxEl.style.top = `${constrainedY}px`;
    dialogueBoxEl.style.transform = 'none'; // Remove centering transform
    dialogueBoxEl.style.bottom = 'auto'; // Remove bottom positioning
}

// ON TOUCH DRAG: Handle touch dragging movement
function onTouchDrag(e) {
    if (!isDragging || e.touches.length !== 1) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartX;
    const deltaY = touch.clientY - dragStartY;
    
    const newX = dialogueBoxStartX + deltaX;
    const newY = dialogueBoxStartY + deltaY;
    
    // Apply minimal constraints
    const minVisible = 100;
    const maxX = window.innerWidth - minVisible;
    const maxY = window.innerHeight - minVisible;
    const minX = -(dialogueBoxEl.offsetWidth - minVisible);
    const minY = -50;
    
    const constrainedX = Math.max(minX, Math.min(maxX, newX));
    const constrainedY = Math.max(minY, Math.min(maxY, newY));
    
    // Update position
    dialogueBoxEl.style.left = `${constrainedX}px`;
    dialogueBoxEl.style.top = `${constrainedY}px`;
    dialogueBoxEl.style.transform = 'none';
    dialogueBoxEl.style.bottom = 'auto';
}

// END DRAG: Finish dragging
function endDrag(e) {
    if (!isDragging) return;
    
    isDragging = false;
    
    // Restore visual feedback
    dialogueBoxEl.style.transition = 'transform 0.1s ease-out';
    dialogueBoxEl.style.cursor = 'move';
    document.body.style.userSelect = '';
}

// END TOUCH DRAG: Finish touch dragging
function endTouchDrag(e) {
    if (!isDragging) return;
    
    isDragging = false;
    
    // Restore visual feedback
    dialogueBoxEl.style.transition = 'transform 0.1s ease-out';
    dialogueBoxEl.style.cursor = 'move';
    document.body.style.userSelect = '';
}

// RESET DIALOGUE BOX POSITION: Return to default position
function resetDialogueBoxPosition() {
    if (!dialogueBoxEl) return;
    
    dialogueBoxEl.style.left = '50%';
    dialogueBoxEl.style.top = 'auto';
    dialogueBoxEl.style.bottom = '20px';
    dialogueBoxEl.style.transform = 'translateX(-50%)';
    dialogueBoxEl.style.transition = 'all 0.3s ease';
    
    console.log('📍 Dialogue box position reset to default');
}

/* ==========================================================================
   KEYBOARD CONTROLS - Handle keyboard navigation
   ========================================================================== */

// SETUP KEYBOARD CONTROLS: Enable arrow key navigation
function setupKeyboardControls() {
    document.addEventListener('keydown', function (e) {
        // Don't interfere when user is typing in input fields
        if (e.target.tagName === 'INPUT') return;

        switch (e.key) {
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
            case 'c':
            case 'C':
                if (e.ctrlKey) {
                    e.preventDefault();
                    resetDialogueBoxPosition();
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

    // Existing subscription
    mqttClient.subscribe("nerfwar/story/state");
    
    // NEW: Add orchestrator subscriptions
    mqttClient.subscribe("nerfwar/orchestrator/commands");
    mqttClient.subscribe("nerfwar/orchestrator/media");
    mqttClient.subscribe("nerfwar/orchestrator/announce");
    
    // Start sending heartbeat for device tracking
    startHeartbeat();
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
        const topic = message.destinationName;

        // Ignore messages from self (except orchestrator commands)
        if (data.player === playerName && !topic.includes('orchestrator')) return;

        // Handle different message types
        if (data.action === "dialogue-step") {
            const sceneIndex = Math.max(0, Math.min(data.sceneId, storyData.scenes.length - 1));
            const dialogueIndex = Math.max(0, Math.min(data.dialogueIndex || 0, storyData.scenes[sceneIndex].dialogue.length - 1));

            currentScene = sceneIndex;
            currentDialogue = dialogueIndex;

            updateBackground(data.background);
            updateDisplay();
            showSceneTitle(storyData.scenes[currentScene].title);
        }
        // NEW: Handle orchestrator messages
        else if (topic === "nerfwar/orchestrator/commands") {
            handleOrchestratorCommand(data);
        } else if (topic === "nerfwar/orchestrator/media") {
            handleMediaUpdate(data);
        } else if (topic === "nerfwar/orchestrator/announce") {
            handleOrchestratorAnnouncement(data);
        }
        // Handle orchestrator-controlled story updates
        else if (data.action === "orchestrator-sync" || data.action === "orchestrator-next" || data.action === "orchestrator-previous") {
            handleOrchestratorStoryUpdate(data);
        }

    } catch (error) {
        console.log("Error processing MQTT message:", error);
    }
}


// PUBLISH DIALOGUE AND GRAPHIC CHANGE: Notify other devices about dialogue steps.
function publishDialogueStep() {

    if (!mqttClient || !mqttClient.isConnected()) {
        console.log("MQTT client not connected — message not sent.");
    }

    try {
        const scene = storyData.scenes[currentScene];
        const messagePayload = {
            sceneId: currentScene,
            dialogueIndex: currentDialogue,
            background: scene.background,
            player: playerName,
            timestamp: Date.now(),
            action: "dialogue-step"
        };

        console.log("Publishing MQTT message:", messagePayload);

        const message = new Paho.MQTT.Message(JSON.stringify(messagePayload));
        message.destinationName = "nerfwar/story/state";
        message.retained = true;
        mqttClient.send(message);

        console.log("MQTT message sent to nerfwar/story/state");
    } catch (error) {
        console.log("Error publishing dialogue step:", error);
    }
}


// UPDATE MQTT STATUS: Show connection status to user
function updateMQTTStatus(connected) {
    const mqttStatus = document.getElementById('mqttStatus');
    if (!mqttStatus) return;

    if (connected) {
        mqttStatus.textContent = 'MQTT';
        mqttStatus.className = 'mqtt-status mqtt-connected';
    } else {
        mqttStatus.textContent = 'MQTT';
        mqttStatus.className = 'mqtt-status mqtt-disconnected';
    }
}


function handleOrchestratorCommand(data) {
    // Ignore commands from self
    if (data.orchestratorId === mqttClient?.clientId) return;
    
    console.log("Received orchestrator command:", data.command);
    
    switch(data.command) {
        case "pause":
            pauseAllMedia();
            showOrchestratorNotification("⏸️ Paused by orchestrator");
            break;
            
        case "resume":
            resumeAllMedia();
            showOrchestratorNotification("▶️ Resumed by orchestrator");
            break;
            
        case "reset":
            resetStory();
            showOrchestratorNotification("🔄 Reset by orchestrator");
            break;
            
        case "story-update":
            if (data.storyData) {
                updateStoryData(data.storyData);
                showOrchestratorNotification("📚 Story updated by orchestrator");
            }
            break;
            
        case "disconnect":
            if (data.targetDevice === mqttClient?.clientId) {
                handleForcedDisconnect();
            }
            break;
            
        default:
            console.log("Unknown orchestrator command:", data.command);
    }
}

/**
 * Handle media updates from orchestrator
 */
function handleMediaUpdate(data) {
    // Only apply media updates for current scene/dialogue
    if (data.sceneId === currentScene && data.dialogueIndex === currentDialogue) {
        console.log("Applying media update:", data.media);
        
        // Update scene image
        if (data.media.image) {
            updateSceneImage(data.media.image);
        }
        
        // Update background audio
        if (data.media.audio) {
            updateBackgroundAudio(data.media.audio);
        }
        
        showOrchestratorNotification("🎨 Media updated by orchestrator");
    }
}

/**
 * Handle orchestrator announcements
 */
function handleOrchestratorAnnouncement(data) {
    if (data.type === "orchestrator_online") {
        console.log("Orchestrator came online:", data.orchestratorId);
        showOrchestratorNotification("🎭 Orchestrator connected");
        updateOrchestratorStatus(true);
        
        // Send current state to new orchestrator
        sendCurrentStateToOrchestrator();
    }
}

/**
 * Handle story updates from orchestrator
 */
function handleOrchestratorStoryUpdate(data) {
    // Ignore updates from self
    if (data.orchestratorId === mqttClient?.clientId) return;
    
    console.log("Received orchestrator story update:", data);
    
    // Update current position
    currentScene = Math.max(0, Math.min(data.sceneId || 0, storyData.scenes.length - 1));
    currentDialogue = Math.max(0, Math.min(data.dialogueIndex || 0, storyData.scenes[currentScene].dialogue.length - 1));
    
    // Update display
    updateBackground(data.background);
    updateDisplay();
    
    // Apply any media updates
    if (data.media) {
        if (data.media.image) updateSceneImage(data.media.image);
        if (data.media.audio) updateBackgroundAudio(data.media.audio);
    }
    
    // Show scene title for major transitions
    if (data.action === "orchestrator-next" || data.action === "orchestrator-previous") {
        showSceneTitle(storyData.scenes[currentScene].title);
    }
    
    showOrchestratorNotification(`📖 ${data.action.replace('orchestrator-', '').toUpperCase()} by orchestrator`);
}

/**
 * Pause all media elements
 */
function pauseAllMedia() {
    // Pause background audio
    const backgroundAudio = document.getElementById('backgroundAudio');
    if (backgroundAudio && !backgroundAudio.paused) {
        backgroundAudio.pause();
        backgroundAudio.dataset.orchestratorPaused = 'true';
    }
    
    // Pause any other media elements
    document.querySelectorAll('audio, video').forEach(media => {
        if (!media.paused) {
            media.pause();
            media.dataset.orchestratorPaused = 'true';
        }
    });
}

/**
 * Resume all media elements
 */
function resumeAllMedia() {
    // Resume background audio if it was playing and user has audio enabled
    const backgroundAudio = document.getElementById('backgroundAudio');
    if (backgroundAudio && backgroundAudio.dataset.orchestratorPaused === 'true' && audioEnabled) {
        backgroundAudio.play().catch(e => console.log("Audio resume failed:", e));
        delete backgroundAudio.dataset.orchestratorPaused;
    }
    
    // Resume other media
    document.querySelectorAll('audio, video').forEach(media => {
        if (media.dataset.orchestratorPaused === 'true') {
            media.play().catch(e => console.log("Media resume failed:", e));
            delete media.dataset.orchestratorPaused;
        }
    });
}

/**
 * Update scene image from orchestrator
 */
function updateSceneImage(imageData) {
    const sceneImageEl = document.getElementById('sceneImage');
    if (sceneImageEl && imageData.data) {
        // Fade out current image
        sceneImageEl.style.opacity = '0';
        
        setTimeout(() => {
            sceneImageEl.src = imageData.data;
            sceneImageEl.alt = `Scene image: ${imageData.fileName || 'Orchestrator upload'}`;
            
            // Fade in new image
            sceneImageEl.onload = () => {
                sceneImageEl.style.opacity = '1';
            };
        }, 200);
    }
}

/**
 * Update background audio from orchestrator
 */
function updateBackgroundAudio(audioData) {
    const backgroundAudio = document.getElementById('backgroundAudio');
    if (backgroundAudio && audioData.data) {
        // Store current state
        const wasPlaying = !backgroundAudio.paused;
        
        // Update source
        backgroundAudio.src = audioData.data;
        
        // Auto-play if specified and audio is enabled
        if (audioData.autoplay && audioEnabled) {
            backgroundAudio.play().catch(e => console.log("Auto-play failed:", e));
        } else if (wasPlaying && audioEnabled) {
            // Resume if it was playing before
            backgroundAudio.play().catch(e => console.log("Audio resume failed:", e));
        }
    }
}

/**
 * Update story data from orchestrator
 */
function updateStoryData(newStoryData) {
    // Backup current state
    const currentSceneBackup = currentScene;
    const currentDialogueBackup = currentDialogue;
    
    try {
        // Validate new story data
        if (!newStoryData.scenes || !Array.isArray(newStoryData.scenes)) {
            throw new Error("Invalid story data format");
        }
        
        // Update story data
        Object.assign(storyData, newStoryData);
        
        // Ensure current position is still valid
        if (currentScene >= storyData.scenes.length) {
            currentScene = storyData.scenes.length - 1;
            currentDialogue = 0;
        }
        
        const scene = storyData.scenes[currentScene];
        if (currentDialogue >= scene.dialogue.length) {
            currentDialogue = scene.dialogue.length - 1;
        }
        
        // Refresh display
        updateDisplay();
        
    } catch (error) {
        console.error("Failed to update story data:", error);
        // Restore backup state
        currentScene = currentSceneBackup;
        currentDialogue = currentDialogueBackup;
        showOrchestratorNotification("❌ Story update failed", 'error');
    }
}

/**
 * Handle forced disconnect from orchestrator
 */
function handleForcedDisconnect() {
    showOrchestratorNotification("🚫 Disconnected by orchestrator", 'error');
    
    // Show reconnection option
    setTimeout(() => {
        if (confirm("You were disconnected by the orchestrator. Would you like to reconnect?")) {
            initMQTT();
        }
    }, 2000);
}

// ==========================================================================
// DEVICE TRACKING & HEARTBEAT SYSTEM
// ==========================================================================

/**
 * Enhanced publish message function with orchestrator support
 */
function publishMessage(topic, payload) {
    if (!mqttClient || !mqttClient.isConnected()) {
        console.log("MQTT client not connected — message not sent.");
        return false;
    }

    try {
        const message = new Paho.MQTT.Message(JSON.stringify(payload));
        message.destinationName = topic;
        // Retain state and media messages for new clients
        message.retained = (topic.includes('state') || topic.includes('media')); 
        mqttClient.send(message);
        
        console.log(`Published to ${topic}:`, payload);
        return true;
    } catch (error) {
        console.log("Error publishing message:", error);
        return false;
    }
}

/**
 * Start sending heartbeat messages for device tracking
 */
function startHeartbeat() {
    // Send heartbeat every 15 seconds
    setInterval(() => {
        if (mqttClient && mqttClient.isConnected()) {
            const heartbeatData = {
                clientId: mqttClient.clientId,
                playerName: playerName,
                currentScene: currentScene,
                currentDialogue: currentDialogue,
                audioEnabled: audioEnabled,
                timestamp: Date.now(),
                userAgent: navigator.userAgent.substring(0, 100), // Truncated for privacy
                type: "client_heartbeat"
            };
            
            publishMessage("nerfwar/clients/heartbeat", heartbeatData);
        }
    }, 15000);
}

/**
 * Send current state to orchestrator
 */
function sendCurrentStateToOrchestrator() {
    // Send current state when orchestrator comes online
    const stateData = {
        clientId: mqttClient.clientId,
        playerName: playerName,
        currentScene: currentScene,
        currentDialogue: currentDialogue,
        audioEnabled: audioEnabled,
        timestamp: Date.now(),
        type: "client_state_report"
    };
    
    publishMessage("nerfwar/orchestrator/response", stateData);
}

/**
 * Update orchestrator status indicator
 */
let orchestratorConnected = false;

function updateOrchestratorStatus(connected) {
    orchestratorConnected = connected;
    
    // Add visual indicator if orchestrator is connected
    const existingIndicator = document.getElementById('orchestrator-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    if (connected) {
        const indicator = document.createElement('div');
        indicator.id = 'orchestrator-indicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(139, 69, 19, 0.9);
            color: #DAA520;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            border: 1px solid #DAA520;
            backdrop-filter: blur(10px);
            z-index: 100;
        `;
        indicator.textContent = '🎭 Orchestrator Active';
        document.body.appendChild(indicator);
    }
}

// ==========================================================================
// ORCHESTRATOR NOTIFICATION SYSTEM
// ==========================================================================

/**
 * Show orchestrator-specific notifications
 */
function showOrchestratorNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    
    let backgroundColor, borderColor;
    switch(type) {
        case 'error':
            backgroundColor = '#dc3545';
            borderColor = '#dc3545';
            break;
        case 'warning':
            backgroundColor = '#ffc107';
            borderColor = '#ffc107';
            break;
        default:
            backgroundColor = 'rgba(139, 69, 19, 0.9)';
            borderColor = '#DAA520';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${backgroundColor};
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        font-weight: bold;
        border: 2px solid ${borderColor};
        animation: orchestratorNotificationSlide 0.4s ease-out;
        font-size: 0.9rem;
        max-width: 80%;
        text-align: center;
        backdrop-filter: blur(10px);
    `;
    notification.textContent = message;

    // Add animation styles if not already present
    if (!document.getElementById('orchestrator-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'orchestrator-notification-styles';
        style.textContent = `
            @keyframes orchestratorNotificationSlide {
                from { 
                    transform: translateX(-50%) translateY(-20px); 
                    opacity: 0; 
                    scale: 0.8;
                }
                to { 
                    transform: translateX(-50%) translateY(0); 
                    opacity: 1; 
                    scale: 1;
                }
            }
            @keyframes orchestratorNotificationExit {
                from { 
                    transform: translateX(-50%) translateY(0); 
                    opacity: 1; 
                    scale: 1;
                }
                to { 
                    transform: translateX(-50%) translateY(-20px); 
                    opacity: 0; 
                    scale: 0.8;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'orchestratorNotificationExit 0.4s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    }, 3000);
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

// Enhanced Show Full Story function to display the complete interactive narrative
function showFullStory() {
    // Hide navigation and audio controls while showing the full story
    document.querySelector('.controls').style.display = 'none';
    document.querySelector('.audio-controls').style.display = 'none';
    if (sceneCounterEl) sceneCounterEl.style.display = 'none';
    if (speakerNameEl) speakerNameEl.style.display = 'none';

    // Make the dialogue box scrollable and expand it
    if (dialogueTextEl) {
        dialogueTextEl.style.maxHeight = '70vh';
        dialogueTextEl.style.overflowY = 'auto';
        dialogueTextEl.style.padding = '20px';
        dialogueTextEl.style.lineHeight = '1.6';
        dialogueTextEl.style.fontSize = '16px';
    }

    // Generate the complete story from storyData
    // Create sticky header content
    const stickyHeaderHtml = `
        <div style="background: rgba(0, 0, 0, 0.95); padding: 15px 20px; border-bottom: 2px solid #4CAF50; backdrop-filter: blur(10px);">
            <h1 style="text-align: center; color: #4CAF50; margin: 0; font-size: 24px;">
                The Great Nerf War: A Capybara's Revenge
            </h1>
            <p style="text-align: center; font-style: italic; margin: 10px 0 0 0; color: #aaa;">
                The Complete Interactive Story featuring ${playerName}
            </p>
        </div>
    `;

    // Scene colors for variety
    const sceneColors = [
        '#4CAF50', // Green
        '#2196F3', // Blue
        '#FF9800', // Orange
        '#9C27B0', // Purple
        '#F44336', // Red
        '#00BCD4', // Cyan
        '#795548', // Brown
        '#607D8B', // Blue Grey
        '#8BC34A', // Light Green
        '#3F51B5', // Indigo
        '#E91E63', // Pink
        '#FFC107'  // Amber
    ];

    let fullStoryHtml = `
        <div style="font-size: 16px; line-height: 1.8; color: #e0e0e0; padding-top: 20px;">
    `;

    // Add each scene with proper formatting
    storyData.scenes.forEach((scene, sceneIndex) => {
        const sceneColor = sceneColors[sceneIndex % sceneColors.length];
        fullStoryHtml += `
            <div style="margin-bottom: 40px; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 10px; border-left: 4px solid ${sceneColor};">
                <h2 style="color: ${sceneColor}; margin-bottom: 20px; font-size: 20px;">
                    ${sceneIndex + 1}. ${scene.title}
                </h2>
        `;

        scene.dialogue.forEach((dialogue, dialogueIndex) => {
            const personalizedText = personalizeText(dialogue.text);
            const personalizedSpeaker = personalizeText(dialogue.speaker);

            // Style speakers differently
            let speakerStyle = 'color: #fff; font-weight: bold;';
            if (personalizedSpeaker === 'Captain Cheeks') {
                speakerStyle = 'color: #FFB74D; font-weight: bold;'; // Orange for Captain Cheeks
            } else if (personalizedSpeaker === 'Narrator') {
                speakerStyle = 'color: #90CAF9; font-style: italic;'; // Light blue for narrator
            } else if (personalizedSpeaker === playerName) {
                speakerStyle = 'color: #81C784; font-weight: bold;'; // Green for player
            }

            fullStoryHtml += `
                <div style="margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
                    <div style="${speakerStyle} margin-bottom: 5px;">
                        ${personalizedSpeaker}:
                    </div>
                    <div style="color: #e0e0e0; padding-left: 10px;">
                        ${personalizedText}
                    </div>
                </div>
            `;
        });

        fullStoryHtml += '</div>';
    });

    fullStoryHtml += `
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #4CAF50;">
                <p style="font-style: italic; color: #aaa; margin-bottom: 20px;">
                    The End - A tale of friendship, understanding, and foam dart diplomacy.
                </p>
            </div>
        </div>
    `;

    // Display the complete story
    if (dialogueTextEl) {
        // Set up the dialogue container with relative positioning
        dialogueTextEl.style.position = 'relative';
        dialogueTextEl.style.display = 'flex';
        dialogueTextEl.style.flexDirection = 'column';
        dialogueTextEl.style.height = '70vh';

        // Create sticky header section
        const stickyHeader = document.createElement('div');
        stickyHeader.id = 'stickyHeader';
        stickyHeader.style.cssText = `
            position: sticky;
            top: 0;
            z-index: 100;
            flex-shrink: 0;
        `;
        stickyHeader.innerHTML = stickyHeaderHtml;

        // Create scrollable content area
        const scrollableContent = document.createElement('div');
        scrollableContent.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 0 20px 20px 20px;
        `;
        scrollableContent.innerHTML = fullStoryHtml;

        // Create fixed button section at bottom
        const buttonSection = document.createElement('div');
        buttonSection.id = 'stickyBackButtonSection';
        buttonSection.style.cssText = `
            flex-shrink: 0;
            background: rgba(0, 0, 0, 0.9);
            border-top: 1px solid #444;
            padding: 25px 15px 15px 15px;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Create the back button
        const stickyButton = document.createElement('button');
        stickyButton.id = 'stickyBackButton';
        stickyButton.textContent = 'Back to Interactive Story';
        stickyButton.onclick = hideFullStory;
        stickyButton.className = 'nav-button';
        stickyButton.style.cssText = `
            background: linear-gradient(135deg, #8B4513, #A0522D);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 25px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            min-width: 200px;
            max-width: 300px;
        `;

        // Add hover effect
        stickyButton.addEventListener('mouseenter', function () {
            this.style.background = 'linear-gradient(135deg, #A0522D, #CD853F)';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 5px 15px rgba(139, 69, 19, 0.4)';
        });

        stickyButton.addEventListener('mouseleave', function () {
            this.style.background = 'linear-gradient(135deg, #8B4513, #A0522D)';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        });

        // Append button to button section
        buttonSection.appendChild(stickyButton);

        // Clear the dialogue container and add all sections
        dialogueTextEl.innerHTML = '';
        dialogueTextEl.appendChild(stickyHeader);
        dialogueTextEl.appendChild(scrollableContent);
        dialogueTextEl.appendChild(buttonSection);

        // Scroll to top of content
        scrollableContent.scrollTop = 0;
    }
}

function hideFullStory() {
    // Remove sticky header if it exists
    const stickyHeader = document.getElementById('stickyHeader');
    if (stickyHeader) {
        stickyHeader.remove();
    }

    // Remove button section if it exists
    const buttonSection = document.getElementById('stickyBackButtonSection');
    if (buttonSection) {
        buttonSection.remove();
    }

    // Restore navigation and audio controls
    document.querySelector('.controls').style.display = '';
    document.querySelector('.audio-controls').style.display = '';
    if (sceneCounterEl) sceneCounterEl.style.display = '';
    if (speakerNameEl) speakerNameEl.style.display = '';

    // Restore original dialogue box styling
    if (dialogueTextEl) {
        dialogueTextEl.style.maxHeight = '';
        dialogueTextEl.style.overflowY = '';
        dialogueTextEl.style.padding = '';
        dialogueTextEl.style.paddingBottom = '';
        dialogueTextEl.style.lineHeight = '';
        dialogueTextEl.style.fontSize = '';
        dialogueTextEl.style.position = '';
        dialogueTextEl.style.display = '';
        dialogueTextEl.style.flexDirection = '';
        dialogueTextEl.style.height = '';
    }

    // Restore the normal story view with current scene
    updateDisplay();
}


// ==========================================================================
// GLOBAL EXPORTS FOR ORCHESTRATOR INTEGRATION
// ==========================================================================

/**
 * Export functions for orchestrator dashboard to access
 */
window.getStoryState = function() {
    return {
        currentScene: currentScene,
        currentDialogue: currentDialogue,
        playerName: playerName,
        audioEnabled: audioEnabled,
        storyData: storyData,
        totalScenes: storyData.scenes.length,
        totalDialogues: getTotalDialogueCount(),
        isConnected: mqttClient ? mqttClient.isConnected() : false
    };
};

window.setStoryPosition = function(sceneId, dialogueIndex) {
    currentScene = Math.max(0, Math.min(sceneId, storyData.scenes.length - 1));
    currentDialogue = Math.max(0, Math.min(dialogueIndex, storyData.scenes[currentScene].dialogue.length - 1));
    updateDisplay();
    return true;
};

window.resetDialogueBoxPosition = resetDialogueBoxPosition;

// Add initialization message
console.log('🎭 Orchestrator support enabled in main story application');

// Check for orchestrator query parameter
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('orchestrated') === 'true') {
    showOrchestratorNotification('🎭 Connected to orchestrator');
}