/* 
🎭 ORCHESTRATOR.JS - Story Orchestration Dashboard

Separate JavaScript module for the orchestration dashboard.
This handles all dashboard-specific logic while interfacing with
the main story application via MQTT.

Key Features:
- Real-time story control via MQTT
- Media management (images, audio)
- Multi-device synchronization
- Advanced editing capabilities
*/

class StoryOrchestrator {
    constructor() {
        this.mqttClient = null;
        this.currentScene = 0;
        this.currentDialogue = 0;
        this.connectedDevices = new Map();
        this.storyData = null;
        this.mediaCache = new Map();
        this.autoSaveTimeout = null;
        this.isConnected = false;
        
        // Initialize on page load
        this.init();
    }

    async init() {
        try {
            // Load story data from main application
            await this.loadStoryData();
            
            // Setup UI
            this.setupUI();
            this.setupEventListeners();
            
            // Connect to MQTT
            await this.connectMQTT();
            
            // Start device monitoring
            this.startDeviceMonitoring();
            
            console.log('Story Orchestrator initialized successfully');
        } catch (error) {
            console.error('Failed to initialize orchestrator:', error);
            this.showNotification('Failed to initialize. Check console for details.', 'error');
        }
    }

async loadStoryData() {
        // Updated story data with one dialogue per scene for better orchestrator display
        this.storyData = {
            scenes: [
                {
                    title: "The Ordinary World: Target Practice Tradition",
                    background: "bg-office",
                    dialogue: [
                        { 
                            speaker: "Narrator", 
                            text: "Every Tuesday at dawn, the Veterans' Association transforms Briarwood Park into their personal battlefield. {playerName}, known for precision shooting and tactical thinking, has become a cornerstone of this sacred tradition.",
                            media: {}
                        }
                    ]
                },
                {
                    title: "Jenkins' Leadership",
                    background: "bg-office", 
                    dialogue: [
                        { 
                            speaker: "Jenkins", 
                            text: "Alright, veterans! Time for our weekly foam-dart warfare. {playerName}, you're team captain today—show these rookies how real soldiers handle a Nerf blaster!",
                            media: {}
                        }
                    ]
                },
                {
                    title: "Morales' Praise",
                    background: "bg-office",
                    dialogue: [
                        { 
                            speaker: "Morales", 
                            text: "Last week {playerName} hit every target from 50 yards. That's some serious marksmanship right there.",
                            media: {}
                        }
                    ]
                },
                {
                    title: "The Tradition Continues",
                    background: "bg-office",
                    dialogue: [
                        { 
                            speaker: "Narrator", 
                            text: "For these aging warriors, Tuesday target practice isn't just recreation—it's a lifeline to their military heritage. {playerName} understands this better than most.",
                            media: {}
                        }
                    ]
                },
                {
                    title: "Player's Commitment",
                    background: "bg-office",
                    dialogue: [
                        { 
                            speaker: "{playerName}", 
                            text: "This tradition keeps us sharp, keeps us connected. Every dart fired is a reminder of who we were... and who we still are.",
                            media: {}
                        }
                    ]
                },
                {
                    title: "Call to Adventure: Mysterious Sightings",
                    background: "bg-park",
                    dialogue: [
                        { 
                            speaker: "Morales", 
                            text: "Something's wrong, {playerName}. There's this... creature by the equipment shed. Massive rodent, just sitting there like it's running surveillance on our operation.",
                            media: {}
                        }
                    ]
                },
                {
                    title: "Jenkins' Dismissal",
                    background: "bg-park",
                    dialogue: [
                        { 
                            speaker: "Jenkins", 
                            text: "Probably just a stray. Nothing a few warning shots can't handle.",
                            media: {}
                        }
                    ]
                },
                {
                    title: "Ernie's Evidence",
                    background: "bg-park",
                    dialogue: [
                        { 
                            speaker: "Ernie", 
                            text: "No sir, this is different. Look at this photo—that's a capybara, and it's got backup. Emus. Lots of them.",
                            media: {}
                        }
                    ]
                },
                {
                    title: "The Pattern Emerges",
                    background: "bg-park",
                    dialogue: [
                        { 
                            speaker: "Narrator", 
                            text: "Within 48 hours, emu patrols materialized throughout Briarwood Park. {playerName} recognized the tactical significance immediately—flanking positions, elevated observation posts, coordinated movement patterns.",
                            media: {}
                        }
                    ]
                },
                {
                    title: "Player's Tactical Assessment",
                    background: "bg-park",
                    dialogue: [
                        { 
                            speaker: "{playerName}", 
                            text: "Jenkins, these aren't random animal encounters. Look at their formation—perimeter security, rotating watch schedules. Someone's commanding them.",
                            media: {}
                        }
                    ]
                },
                {
                    title: "Morales' Doubt",
                    background: "bg-park",
                    dialogue: [
                        { 
                            speaker: "Morales", 
                            text: "You're saying they're organized? {playerName}, that's impossible.",
                            media: {}
                        }
                    ]
                },
                {
                    title: "Captain Cheeks Reveals Himself",
                    background: "bg-park",
                    dialogue: [
                        { 
                            speaker: "Captain Cheeks", 
                            text: "*Steps out from behind an oak tree, wearing a tiny military beret* Impossible? Perhaps. But true nonetheless, Sergeant {playerName}.",
                            media: {}
                        }
                    ]
                }
            ]
        };
    }

    setupUI() {
        this.populateSceneList();
        this.updateLivePreview();
        this.updateConnectionStatus(false);
    }

    populateSceneList() {
        const sceneList = document.getElementById('sceneList');
        if (!sceneList) return;

        sceneList.innerHTML = '';

        this.storyData.scenes.forEach((scene, sceneIndex) => {
            const sceneElement = this.createSceneElement(scene, sceneIndex);
            sceneList.appendChild(sceneElement);
        });

        this.updateActiveStates();
    }

    createSceneElement(scene, sceneIndex) {
        const sceneElement = document.createElement('div');
        sceneElement.className = 'scene-item';
        sceneElement.onclick = () => this.selectScene(sceneIndex);

        const sceneTitle = document.createElement('div');
        sceneTitle.className = 'scene-title';
        sceneTitle.textContent = `${sceneIndex + 1}. ${scene.title}`;

        const dialogueList = document.createElement('div');
        dialogueList.className = 'dialogue-list';

        scene.dialogue.forEach((dialogue, dialogueIndex) => {
            const dialogueElement = this.createDialogueElement(dialogue, sceneIndex, dialogueIndex);
            dialogueList.appendChild(dialogueElement);
        });

        sceneElement.appendChild(sceneTitle);
        sceneElement.appendChild(dialogueList);
        
        return sceneElement;
    }

    createDialogueElement(dialogue, sceneIndex, dialogueIndex) {
        const dialogueElement = document.createElement('div');
        dialogueElement.className = 'dialogue-item';
        dialogueElement.textContent = `${dialogue.speaker}: ${dialogue.text.substring(0, 50)}...`;
        
        // Add media indicators
        if (dialogue.media) {
            if (dialogue.media.image) {
                dialogueElement.innerHTML += ' 🖼️';
            }
            if (dialogue.media.audio) {
                dialogueElement.innerHTML += ' 🔊';
            }
        }
        
        dialogueElement.onclick = (e) => {
            e.stopPropagation();
            this.selectDialogue(sceneIndex, dialogueIndex);
        };
        
        return dialogueElement;
    }

    // Scene Management Methods
    addNewScene() {
        const newScene = {
            title: `New Scene ${this.storyData.scenes.length + 1}`,
            background: "bg-park",
            dialogue: [
                {
                    speaker: "Narrator",
                    text: "This is a new scene. Edit this dialogue to customize your story.",
                    media: {}
                }
            ]
        };

        // Add after current scene
        const insertIndex = this.currentScene + 1;
        this.storyData.scenes.splice(insertIndex, 0, newScene);

        // Move to new scene
        this.currentScene = insertIndex;
        this.currentDialogue = 0;

        // Update UI
        this.populateSceneList();
        this.updateActiveStates();
        this.updateLivePreview();
        this.loadDialogueIntoEditor();
        this.updateSceneInfo();

        // Broadcast changes
        this.broadcastStoryUpdate();
        this.showNotification(`New scene added: "${newScene.title}"`);
    }

    deleteCurrentScene() {
        if (this.storyData.scenes.length <= 1) {
            this.showNotification('Cannot delete the only remaining scene', 'error');
            return;
        }

        const sceneToDelete = this.storyData.scenes[this.currentScene];
        const confirmed = confirm(`Are you sure you want to delete "${sceneToDelete.title}"?\n\nThis action cannot be undone.`);
        
        if (!confirmed) return;

        // Remove the scene
        this.storyData.scenes.splice(this.currentScene, 1);

        // Adjust current position
        if (this.currentScene >= this.storyData.scenes.length) {
            this.currentScene = this.storyData.scenes.length - 1;
        }
        this.currentDialogue = 0;

        // Update UI
        this.populateSceneList();
        this.updateActiveStates();
        this.updateLivePreview();
        this.loadDialogueIntoEditor();
        this.updateSceneInfo();

        // Broadcast changes
        this.broadcastStoryUpdate();
        this.showNotification(`Scene "${sceneToDelete.title}" deleted`);
    }

    updateSceneInfo() {
        const sceneNumberEl = document.getElementById('currentSceneNumber');
        const totalScenesEl = document.getElementById('totalScenes');
        const dialoguesInSceneEl = document.getElementById('dialoguesInScene');
        const deleteBtn = document.getElementById('deleteSceneBtn');

        if (sceneNumberEl) sceneNumberEl.textContent = this.currentScene + 1;
        if (totalScenesEl) totalScenesEl.textContent = this.storyData.scenes.length;
        
        if (dialoguesInSceneEl) {
            const currentScene = this.storyData.scenes[this.currentScene];
            dialoguesInSceneEl.textContent = currentScene ? currentScene.dialogue.length : 0;
        }

        // Disable delete button if only one scene remains
        if (deleteBtn) {
            deleteBtn.disabled = this.storyData.scenes.length <= 1;
            deleteBtn.style.opacity = this.storyData.scenes.length <= 1 ? '0.5' : '1';
        }
    }

    // Story Import/Export Methods
    exportStory() {
        const storyJson = JSON.stringify(this.storyData, null, 2);
        const blob = new Blob([storyJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `nerf-war-story-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Story exported successfully');
    }

    importStoryFile() {
        const fileInput = document.getElementById('storyImport');
        if (fileInput) {
            fileInput.click();
        }
    }

    handleStoryImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedStory = JSON.parse(e.target.result);
                
                // Validate story structure
                if (!importedStory.scenes || !Array.isArray(importedStory.scenes)) {
                    throw new Error('Invalid story format: missing scenes array');
                }

                // Validate each scene
                importedStory.scenes.forEach((scene, index) => {
                    if (!scene.title || !scene.dialogue || !Array.isArray(scene.dialogue)) {
                        throw new Error(`Invalid scene format at index ${index}`);
                    }
                });

                const confirmed = confirm(
                    `Import story with ${importedStory.scenes.length} scenes?\n\n` +
                    'This will replace the current story. Make sure to export your current story first if you want to keep it.'
                );

                if (confirmed) {
                    this.storyData = importedStory;
                    this.currentScene = 0;
                    this.currentDialogue = 0;

                    // Update UI
                    this.populateSceneList();
                    this.updateActiveStates();
                    this.updateLivePreview();
                    this.loadDialogueIntoEditor();
                    this.updateSceneInfo();

                    // Broadcast changes
                    this.broadcastStoryUpdate();
                    this.showNotification('Story imported successfully');
                }
            } catch (error) {
                console.error('Story import error:', error);
                this.showNotification(`Import failed: ${error.message}`, 'error');
            }
        };

        reader.onerror = () => {
            this.showNotification('Error reading file', 'error');
        };

        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    // Debug Methods (simplified)
    logOrchestratorState() {
        const state = {
            currentScene: this.currentScene,
            currentDialogue: this.currentDialogue,
            totalScenes: this.storyData.scenes.length,
            totalDialogues: this.getTotalDialogueCount(),
            connectedDevices: this.connectedDevices.size,
            mqttConnected: this.isConnected,
            storyTitle: this.storyData.scenes[this.currentScene]?.title || 'Unknown'
        };
        
        console.log('📊 Orchestrator State:', state);
        this.showNotification('State logged to console');
        return state;
    }

    exportDebugInfo() {
        const debugInfo = {
            timestamp: new Date().toISOString(),
            orchestratorState: this.logOrchestratorState(),
            storyData: this.storyData,
            connectedDevices: Array.from(this.connectedDevices.entries()),
            browserInfo: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                viewport: `${window.innerWidth}x${window.innerHeight}`
            }
        };

        const debugJson = JSON.stringify(debugInfo, null, 2);
        const blob = new Blob([debugJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `nerf-war-debug-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Debug info exported');
    }

    selectScene(sceneIndex) {
        this.currentScene = sceneIndex;
        this.currentDialogue = 0;
        this.updateActiveStates();
        this.updateLivePreview();
        this.loadDialogueIntoEditor();
        this.updateSceneInfo(); // Add this line
    }


    selectDialogue(sceneIndex, dialogueIndex) {
        this.currentScene = sceneIndex;
        this.currentDialogue = dialogueIndex;
        this.updateActiveStates();
        this.updateLivePreview();
        this.loadDialogueIntoEditor();
        this.updateSceneInfo(); // Add this line
    }

    updateActiveStates() {
        // Update scene active states
        document.querySelectorAll('.scene-item').forEach((item, index) => {
            item.classList.toggle('active', index === this.currentScene);
        });

        // Update dialogue active states
        const allDialogueItems = document.querySelectorAll('.dialogue-item');
        let currentGlobalIndex = 0;
        
        for (let s = 0; s < this.currentScene; s++) {
            currentGlobalIndex += this.storyData.scenes[s].dialogue.length;
        }
        currentGlobalIndex += this.currentDialogue;

        allDialogueItems.forEach((item, index) => {
            item.classList.toggle('current', index === currentGlobalIndex);
        });
    }

    updateLivePreview() {
        const scene = this.storyData.scenes[this.currentScene];
        if (!scene || !scene.dialogue[this.currentDialogue]) return;

        const dialogue = scene.dialogue[this.currentDialogue];
        
        // Update preview content
        const speakerEl = document.getElementById('previewSpeaker');
        const textEl = document.getElementById('previewText');
        const progressEl = document.getElementById('previewProgress');

        if (speakerEl) speakerEl.textContent = dialogue.speaker;
        if (textEl) textEl.textContent = dialogue.text;

        // Update progress bar
        if (progressEl) {
            const totalDialogues = this.getTotalDialogueCount();
            const currentPosition = this.getCurrentPosition();
            const progress = ((currentPosition + 1) / totalDialogues) * 100;
            progressEl.style.width = `${progress}%`;
        }

        // Update media preview
        this.updateMediaPreview(dialogue.media);
    }

    updateMediaPreview(media) {
        const imagePreview = document.getElementById('imagePreview');
        const imageDropZone = document.getElementById('imageDropZone');
        const audioPlayer = document.getElementById('audioPlayer');
        const autoplaySelect = document.getElementById('autoplaySelect');

        // Handle image preview
        if (media && media.image) {
            if (imagePreview) {
                imagePreview.src = media.image.data;
                imagePreview.style.display = 'block';
            }
            if (imageDropZone) {
                imageDropZone.style.display = 'none';
            }
        } else {
            if (imagePreview) imagePreview.style.display = 'none';
            if (imageDropZone) imageDropZone.style.display = 'block';
        }

        // Handle audio preview
        if (media && media.audio) {
            if (audioPlayer) {
                audioPlayer.src = media.audio.data;
                audioPlayer.style.display = 'block';
            }
            if (autoplaySelect) {
                autoplaySelect.value = media.audio.autoplay ? 'true' : 'false';
            }
        } else {
            if (audioPlayer) {
                audioPlayer.src = '';
                audioPlayer.style.display = 'none';
            }
            if (autoplaySelect) {
                autoplaySelect.value = 'false';
            }
        }
    }

    loadDialogueIntoEditor() {
        const scene = this.storyData.scenes[this.currentScene];
        if (!scene || !scene.dialogue[this.currentDialogue]) return;

        const dialogue = scene.dialogue[this.currentDialogue];
        
        const speakerInput = document.getElementById('speakerInput');
        const dialogueInput = document.getElementById('dialogueInput');

        if (speakerInput) speakerInput.value = dialogue.speaker;
        if (dialogueInput) dialogueInput.value = dialogue.text;
    }

    // MQTT Connection and Messaging
    async connectMQTT() {
    return new Promise((resolve, reject) => {
        try {
            const clientId = "orchestrator_" + Math.random().toString(36).substr(2, 9);
            
            // Detect if running in production (Vercel)
            const isProduction = window.location.hostname.includes('vercel.app') || 
                               window.location.hostname !== 'localhost';
            
            this.mqttClient = new Paho.MQTT.Client("mqtt.uvucs.org", 8080, clientId);

            this.mqttClient.onConnectionLost = (responseObject) => {
                this.isConnected = false;
                this.updateConnectionStatus(false);
                console.log("MQTT Connection lost:", responseObject.errorMessage);
                
                // Auto-reconnect with longer delay in production
                const delay = isProduction ? 10000 : 5000;
                setTimeout(() => this.connectMQTT(), delay);
            };

            this.mqttClient.onMessageArrived = (message) => {
                this.handleMQTTMessage(message);
            };

            const connectOptions = {
                onSuccess: () => {
                    this.isConnected = true;
                    this.updateConnectionStatus(true);
                    this.subscribeToTopics();
                    this.announcePresence();
                    
                    // Log production mode
                    if (isProduction) {
                        console.log(`🌐 Orchestrator connected in production mode on ${window.location.hostname}`);
                    }
                    
                    resolve();
                },
                onFailure: (error) => {
                    this.isConnected = false;
                    this.updateConnectionStatus(false);
                    console.log("MQTT Connection failed:", error);
                    reject(error);
                },
                useSSL: true,  // Always use SSL for production and development
                timeout: isProduction ? 15 : 10,
                keepAliveInterval: 30,
                cleanSession: true
            };

            this.mqttClient.connect(connectOptions);

        } catch (error) {
            this.isConnected = false;
            this.updateConnectionStatus(false);
            reject(error);
        }
    });
}

    subscribeToTopics() {
        if (!this.mqttClient || !this.isConnected) return;

        const topics = [
            "nerfwar/story/state",
            "nerfwar/orchestrator/commands",
            "nerfwar/clients/heartbeat",
            "nerfwar/orchestrator/response"
        ];

        topics.forEach(topic => {
            this.mqttClient.subscribe(topic);
            console.log(`Subscribed to ${topic}`);
        });
    }

    announcePresence() {
        this.publishMessage("nerfwar/orchestrator/announce", {
            type: "orchestrator_online",
            orchestratorId: this.mqttClient.clientId,
            timestamp: Date.now(),
            capabilities: ["story_control", "media_management", "device_management"]
        });
    }

    publishMessage(topic, payload) {
        if (!this.mqttClient || !this.isConnected) {
            console.log("MQTT not connected - message not sent");
            return false;
        }

        try {
            const message = new Paho.MQTT.Message(JSON.stringify(payload));
            message.destinationName = topic;
            message.retained = true;
            this.mqttClient.send(message);
            console.log(`Published to ${topic}:`, payload);
            return true;
        } catch (error) {
            console.log("Error publishing message:", error);
            return false;
        }
    }

    handleMQTTMessage(message) {
        try {
            const data = JSON.parse(message.payloadString);
            const topic = message.destinationName;

            switch (topic) {
                case "nerfwar/clients/heartbeat":
                    this.handleClientHeartbeat(data);
                    break;
                case "nerfwar/story/state":
                    this.handleStoryStateUpdate(data);
                    break;
                case "nerfwar/orchestrator/response":
                    this.handleOrchestratorResponse(data);
                    break;
                default:
                    console.log(`Unhandled topic: ${topic}`, data);
            }
        } catch (error) {
            console.log("Error processing MQTT message:", error);
        }
    }

    handleClientHeartbeat(data) {
        if (data.clientId && data.clientId !== this.mqttClient.clientId) {
            this.connectedDevices.set(data.clientId, {
                ...data,
                lastSeen: Date.now()
            });
            this.updateDeviceList();
        }
    }

    handleStoryStateUpdate(data) {
        // Update local state if controlled by another orchestrator
        if (data.orchestratorId && data.orchestratorId !== this.mqttClient.clientId) {
            this.currentScene = data.sceneId || 0;
            this.currentDialogue = data.dialogueIndex || 0;
            this.updateActiveStates();
            this.updateLivePreview();
            this.showNotification(`Story updated by another orchestrator: Scene ${this.currentScene + 1}`);
        }
    }

    handleOrchestratorResponse(data) {
        if (data.success) {
            this.showNotification(data.message || 'Command executed successfully');
        } else {
            this.showNotification(data.message || 'Command failed', 'error');
        }
    }

    // Story Control Methods
    broadcastCurrentPage() {
        const scene = this.storyData.scenes[this.currentScene];
        const dialogue = scene.dialogue[this.currentDialogue];
        
        const payload = {
            sceneId: this.currentScene,
            dialogueIndex: this.currentDialogue,
            background: scene.background,
            dialogue: dialogue,
            media: dialogue.media || {},
            timestamp: Date.now(),
            action: "orchestrator-sync",
            orchestratorId: this.mqttClient.clientId
        };

        if (this.publishMessage("nerfwar/story/state", payload)) {
            this.showNotification('Current page synced to all clients');
        }
    }

    broadcastNext() {
        const scene = this.storyData.scenes[this.currentScene];
        let nextScene = this.currentScene;
        let nextDialogue = this.currentDialogue;

        // Calculate next position
        if (this.currentDialogue < scene.dialogue.length - 1) {
            nextDialogue++;
        } else if (this.currentScene < this.storyData.scenes.length - 1) {
            nextScene++;
            nextDialogue = 0;
        } else {
            this.showNotification('Already at the end of the story');
            return;
        }

        // Update local state
        this.currentScene = nextScene;
        this.currentDialogue = nextDialogue;
        this.updateActiveStates();
        this.updateLivePreview();
        this.loadDialogueIntoEditor();
        this.updateSceneInfo(); // Add this line

        // Broadcast to clients
        this.broadcastCurrentPage();
        this.showNotification('Advanced to next page');
    }


    broadcastPrevious() {
        let prevScene = this.currentScene;
        let prevDialogue = this.currentDialogue;

        // Calculate previous position
        if (this.currentDialogue > 0) {
            prevDialogue--;
        } else if (this.currentScene > 0) {
            prevScene--;
            prevDialogue = this.storyData.scenes[prevScene].dialogue.length - 1;
        } else {
            this.showNotification('Already at the beginning of the story');
            return;
        }

        // Update local state
        this.currentScene = prevScene;
        this.currentDialogue = prevDialogue;
        this.updateActiveStates();
        this.updateLivePreview();
        this.loadDialogueIntoEditor();
        this.updateSceneInfo(); // Add this line

        // Broadcast to clients
        this.broadcastCurrentPage();
        this.showNotification('Moved to previous page');
    }
    // Content Editing Methods
    saveDialogue() {
        const speakerInput = document.getElementById('speakerInput');
        const dialogueInput = document.getElementById('dialogueInput');

        if (!speakerInput || !dialogueInput) return;

        const speaker = speakerInput.value.trim();
        const text = dialogueInput.value.trim();

        if (!speaker || !text) {
            this.showNotification('Please fill in both speaker and dialogue text', 'error');
            return;
        }

        // Update story data
        const scene = this.storyData.scenes[this.currentScene];
        scene.dialogue[this.currentDialogue] = {
            ...scene.dialogue[this.currentDialogue],
            speaker: speaker,
            text: text
        };

        // Update UI
        this.populateSceneList();
        this.updateLivePreview();
        this.updateActiveStates();

        // Broadcast changes
        this.broadcastStoryUpdate();
        this.showNotification('Dialogue saved successfully');
    }

    broadcastStoryUpdate() {
        this.publishMessage("nerfwar/orchestrator/commands", {
            command: "story-update",
            storyData: this.storyData,
            timestamp: Date.now(),
            orchestratorId: this.mqttClient.clientId
        });
    }

    // Media Management
    handleImageUpload(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showNotification('Please select a valid image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.saveImageToDialogue(e.target.result, file.name);
        };
        reader.onerror = () => {
            this.showNotification('Error reading image file', 'error');
        };
        reader.readAsDataURL(file);
    }

    handleAudioUpload(file) {
        if (!file || !file.type.startsWith('audio/')) {
            this.showNotification('Please select a valid audio file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.saveAudioToDialogue(e.target.result, file.name);
        };
        reader.onerror = () => {
            this.showNotification('Error reading audio file', 'error');
        };
        reader.readAsDataURL(file);
    }

    saveImageToDialogue(imageData, fileName) {
        const scene = this.storyData.scenes[this.currentScene];
        const dialogue = scene.dialogue[this.currentDialogue];

        if (!dialogue.media) {
            dialogue.media = {};
        }

        dialogue.media.image = {
            data: imageData,
            fileName: fileName,
            timestamp: Date.now()
        };

        this.updateMediaPreview(dialogue.media);
        this.broadcastMediaUpdate();
        this.showNotification('Image saved to current dialogue');
    }

    saveAudioToDialogue(audioData, fileName) {
        const scene = this.storyData.scenes[this.currentScene];
        const dialogue = scene.dialogue[this.currentDialogue];
        const autoplaySelect = document.getElementById('autoplaySelect');

        if (!dialogue.media) {
            dialogue.media = {};
        }

        dialogue.media.audio = {
            data: audioData,
            fileName: fileName,
            autoplay: autoplaySelect ? autoplaySelect.value === 'true' : false,
            timestamp: Date.now()
        };

        this.updateMediaPreview(dialogue.media);
        this.broadcastMediaUpdate();
        this.showNotification('Audio saved to current dialogue');
    }

    broadcastMediaUpdate() {
        const scene = this.storyData.scenes[this.currentScene];
        const dialogue = scene.dialogue[this.currentDialogue];

        this.publishMessage("nerfwar/orchestrator/media", {
            sceneId: this.currentScene,
            dialogueIndex: this.currentDialogue,
            media: dialogue.media || {},
            timestamp: Date.now(),
            action: "media-update",
            orchestratorId: this.mqttClient.clientId
        });
    }

    // Device Management
    updateDeviceList() {
        const listEl = document.getElementById('participantList');
        if (!listEl) return;

        listEl.innerHTML = '';

        if (this.connectedDevices.size === 0) {
            listEl.innerHTML = '<div class="participant-item"><span>No devices connected</span></div>';
            return;
        }

        this.connectedDevices.forEach((device, deviceId) => {
            const item = document.createElement('div');
            item.className = 'participant-item';
            
            const deviceInfo = device.playerName ? `${deviceId} (${device.playerName})` : deviceId;
            const lastSeen = Math.floor((Date.now() - device.lastSeen) / 1000);
            
            item.innerHTML = `
                <div>
                    <div>${deviceInfo}</div>
                    <div style="font-size: 0.7rem; color: #999;">Last seen: ${lastSeen}s ago</div>
                </div>
                <button class="btn btn-small" onclick="orchestrator.disconnectDevice('${deviceId}')">Disconnect</button>
            `;
            listEl.appendChild(item);
        });
    }

    disconnectDevice(deviceId) {
        this.publishMessage("nerfwar/orchestrator/commands", {
            command: "disconnect",
            targetDevice: deviceId,
            timestamp: Date.now(),
            orchestratorId: this.mqttClient.clientId
        });

        this.connectedDevices.delete(deviceId);
        this.updateDeviceList();
        this.showNotification(`Disconnected device: ${deviceId}`);
    }

    startDeviceMonitoring() {
        // Clean up old devices every 30 seconds
        setInterval(() => {
            const now = Date.now();
            const timeout = 60000; // 60 seconds timeout

            this.connectedDevices.forEach((device, deviceId) => {
                if (now - device.lastSeen > timeout) {
                    this.connectedDevices.delete(deviceId);
                }
            });

            this.updateDeviceList();
        }, 30000);
    }

    // Utility Methods
    getCurrentPosition() {
        let position = 0;
        for (let i = 0; i < this.currentScene; i++) {
            position += this.storyData.scenes[i].dialogue.length;
        }
        return position + this.currentDialogue;
    }

    getTotalDialogueCount() {
        return this.storyData.scenes.reduce((total, scene) => total + scene.dialogue.length, 0);
    }

    updateConnectionStatus(connected) {
        const statusEl = document.getElementById('mqttStatus');
        const indicatorEl = document.getElementById('connectionIndicator');
        const textEl = document.getElementById('connectionText');

        if (connected) {
            if (statusEl) {
                statusEl.textContent = 'MQTT: Connected';
                statusEl.className = 'mqtt-status mqtt-connected';
            }
            if (indicatorEl) indicatorEl.classList.add('connected');
            if (textEl) textEl.textContent = 'Connected to MQTT Broker';
        } else {
            if (statusEl) {
                statusEl.textContent = 'MQTT: Disconnected';
                statusEl.className = 'mqtt-status mqtt-disconnected';
            }
            if (indicatorEl) indicatorEl.classList.remove('connected');
            if (textEl) textEl.textContent = 'Disconnected from MQTT Broker';
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        const bgColor = type === 'error' ? '#dc3545' : '#8B4513';
        
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: bold;
            border: 1px solid ${type === 'error' ? '#dc3545' : '#DAA520'};
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;
        notification.textContent = message;

        // Add animation styles if not already present
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Event Listener Setup
    setupEventListeners() {
        // Auto-save for text inputs
        const speakerInput = document.getElementById('speakerInput');
        const dialogueInput = document.getElementById('dialogueInput');

        if (speakerInput) {
            speakerInput.addEventListener('input', () => {
                clearTimeout(this.autoSaveTimeout);
                this.autoSaveTimeout = setTimeout(() => this.saveDialogue(), 2000);
            });
        }

        if (dialogueInput) {
            dialogueInput.addEventListener('input', () => {
                clearTimeout(this.autoSaveTimeout);
                this.autoSaveTimeout = setTimeout(() => this.saveDialogue(), 2000);
            });
        }

        // File upload handlers
        const imageUpload = document.getElementById('imageUpload');
        const audioUpload = document.getElementById('audioUpload');

        if (imageUpload) {
            imageUpload.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    this.handleImageUpload(e.target.files[0]);
                }
            });
        }

        if (audioUpload) {
            audioUpload.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    this.handleAudioUpload(e.target.files[0]);
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch(e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    this.broadcastNext();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.broadcastPrevious();
                    break;
                case ' ':
                    e.preventDefault();
                    this.broadcastCurrentPage();
                    break;
                case 's':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.saveDialogue();
                    }
                    break;
            }
        });

        // Drag and drop for images
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const imageDropZone = document.getElementById('imageDropZone');
        if (!imageDropZone) return;

        imageDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            imageDropZone.style.borderColor = '#DAA520';
            imageDropZone.style.background = 'rgba(218, 165, 32, 0.1)';
        });

        imageDropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            imageDropZone.style.borderColor = '#8B4513';
            imageDropZone.style.background = '';
        });

        imageDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            imageDropZone.style.borderColor = '#8B4513';
            imageDropZone.style.background = '';

            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleImageUpload(files[0]);
            }
        });
    }

    // Global method bindings for HTML onclick handlers
    bindGlobalMethods() {
        window.orchestrator = this;
    }
}

// Initialize the orchestrator when the page loads
let orchestrator;
window.addEventListener('load', () => {
    orchestrator = new StoryOrchestrator();
    orchestrator.bindGlobalMethods();
});

// Expose methods for HTML onclick handlers
window.broadcastCurrentPage = () => orchestrator?.broadcastCurrentPage();
window.broadcastNext = () => orchestrator?.broadcastNext();
window.broadcastPrevious = () => orchestrator?.broadcastPrevious();
window.saveDialogue = () => orchestrator?.saveDialogue();
window.reconnectMQTT = () => orchestrator?.connectMQTT();

// Additional utility functions for HTML integration
window.playAudio = () => {
    const audioPlayer = document.getElementById('audioPlayer');
    if (audioPlayer && audioPlayer.src) {
        audioPlayer.play();
        document.getElementById('playBtn').textContent = '⏸️ Pause';
    }
};

window.pauseAudio = () => {
    const audioPlayer = document.getElementById('audioPlayer');
    if (audioPlayer) {
        audioPlayer.pause();
        document.getElementById('playBtn').textContent = '▶️ Play';
    }
};

window.stopAudio = () => {
    const audioPlayer = document.getElementById('audioPlayer');
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        document.getElementById('playBtn').textContent = '▶️ Play';
    }
};

window.setVolume = (value) => {
    const audioPlayer = document.getElementById('audioPlayer');
    if (audioPlayer) {
        audioPlayer.volume = parseFloat(value);
    }
};

window.handleImageUpload = (event) => {
    if (orchestrator && event.target.files[0]) {
        orchestrator.handleImageUpload(event.target.files[0]);
    }
};

window.handleAudioUpload = (event) => {
    if (orchestrator && event.target.files[0]) {
        orchestrator.handleAudioUpload(event.target.files[0]);
    }
};

// Scene Management
window.addNewScene = () => orchestrator?.addNewScene();
window.deleteCurrentScene = () => orchestrator?.deleteCurrentScene();

// Story Import/Export  
window.exportStory = () => orchestrator?.exportStory();
window.importStoryFile = () => orchestrator?.importStoryFile();
window.handleStoryImport = (event) => orchestrator?.handleStoryImport(event);

// Debug Functions
window.logOrchestratorState = () => orchestrator?.logOrchestratorState();
window.exportDebugInfo = () => orchestrator?.exportDebugInfo();