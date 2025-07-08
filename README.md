# The Great Nerf War: A Capybara's Revenge

An interactive mockumentary for CS 3660 - StoryTelling Project with real-time orchestration capabilities

## 📖 Project Overview

Experience the most epic foam dart conflict in recorded history! This interactive mockumentary follows Captain Jenkins through a Hero's Journey as they navigate a complex conflict between nerf war veterans, emus, and a surprisingly vengeful capybara.

### 🎯 Key Features

- **Interactive Storytelling**: 12 scenes following the Hero's Journey structure
- **Real-time Orchestration**: Control multiple devices simultaneously via dashboard
- **MQTT Synchronization**: Live sync across all connected devices via `mqtt.uvucs.org`
- **Player Integration**: Enter your name to become part of the story
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Media Management**: Upload and sync images/audio across all clients
- **Touch Support**: Swipe gestures for mobile navigation

## 🚀 Quick Start

### For Story Viewers (Basic Usage)

1. **Open**: Launch `index.html` in a modern web browser
2. **Enter Name**: Provide your veteran name when prompted
3. **Navigate**: Use arrow keys, spacebar, or on-screen buttons

### For Orchestrators (Advanced Control)

#### Local Development

1. **Open**: Launch the orchestrator dashboard at `orchestrator.html`
2. **Connect**: Wait for MQTT connection to establish
3. **Control**: Use the dashboard to control all connected story viewers

#### Production Deployment (Vercel)

1. **Deploy**: Upload to Vercel (see deployment section below)
2. **Access**: Visit `https://your-project.vercel.app/orchestrator`
3. **Share**: Give story URL `https://your-project.vercel.app/` to participants

## 🛠️ Technical Requirements

- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: ES6+ support required
- **Internet Connection**: Required for MQTT synchronization
- **MQTT Broker**: `mqtt.uvucs.org:8080` (WebSocket with SSL)

## 🏗️ Project Structure

```
StoryTelling/
├── index.html              # Main story application
├── styles.css              # Story application styling
├── script.js               # Story interactive functionality
├── orchestrator.html       # 🎭 Orchestration dashboard
├── orchestrator.css        # 🎭 Dashboard styling
├── orchestrator.js         # 🎭 Dashboard functionality
├── README.md               # Project overview (this file)
├── CODE_EXPLANATION.md     # Technical code guide
├── GETTING_STARTED.md      # Usage and modification guide
├── package.json            # Project metadata
└── assets/                 # Media assets
    ├── images/             # Story visuals
    ├── audio/              # Sound effects and music
    └── video/              # AV1 encoded video content
```

## 🎭 Orchestrator Setup & Usage

### Initial Setup

#### Option 1: Local File Access

1. Download all project files to your computer
2. Open `orchestrator.html` directly in your browser
3. Ensure internet connection for MQTT functionality

#### Option 2: Local Web Server (Recommended)

```bash
# Using Python (recommended for local development)
python3 -m http.server 8000

# Then visit:
# http://localhost:8000/orchestrator.html
```

#### Option 3: Live Server Extension (VS Code)

1. Install "Live Server" extension in VS Code
2. Right-click `orchestrator.html`
3. Select "Open with Live Server"

### Dashboard Interface Overview

The orchestrator dashboard consists of four main sections:

#### 1. **Story Navigator** (Left Panel)

- **Scene List**: Click any scene to jump directly to it
- **Dialogue Items**: Click individual dialogue lines for precise control
- **Media Indicators**: 🖼️ for images, 🔊 for audio
- **Current Position**: Highlighted dialogue shows current position

#### 2. **Live Preview** (Center Top)

- **Real-time Preview**: See exactly what viewers see
- **Progress Bar**: Visual story completion indicator
- **Speaker/Dialogue**: Current content display

#### 3. **Content Editor** (Center Bottom)

- **Dialogue Editor**: Modify speaker names and text in real-time
- **Image Manager**: Upload and sync images across all clients
- **Audio Manager**: Upload audio with autoplay controls
- **Auto-save**: Changes save automatically after 2 seconds

#### 4. **Control Panel** (Right Panel)

- **Connection Status**: MQTT broker connection indicator
- **Story Control**: Navigation and synchronization commands
- **Connected Devices**: Live list of story viewers
- **Quick Actions**: Utility functions and export tools

### Core Orchestration Workflows

#### Starting a Session

1. **Open Orchestrator**: Navigate to `orchestrator.html`
2. **Verify Connection**: Wait for "MQTT: Connected" status
3. **Prepare Content**: Review story scenes in navigator
4. **Invite Participants**: Share `index.html` link with viewers

#### Controlling the Story

```javascript
// Keyboard Shortcuts (when dashboard is focused)
Arrow Right     → Advance to next dialogue
Arrow Left      → Go to previous dialogue
Spacebar       → Sync current page to all clients
Ctrl+S         → Save current dialogue edits
```

#### Managing Multiple Viewers

- **Sync Current Page**: Force all devices to show the same content
- **Send Next/Previous**: Navigate all devices simultaneously
- **Pause/Resume**: Control media playback across all devices
- **Device List**: Monitor connected viewers and their status

#### Real-time Content Editing

1. **Select Dialogue**: Click any dialogue item in the navigator
2. **Edit Content**: Modify speaker name or dialogue text
3. **Auto-save**: Changes save automatically and sync to viewers
4. **Add Media**: Upload images or audio for current dialogue
5. **Broadcast**: Use "Sync Current Page" to update all viewers

### Advanced Features

#### Media Management

```html
<!-- Supported Image Formats -->
SVG, PNG, JPG, GIF • Max 10MB per file

<!-- Supported Audio Formats -->
MP3, WAV, OGG • Autoplay configuration available
```

#### MQTT Topic Structure

```
nerfwar/story/state          → Story position and content updates
nerfwar/orchestrator/commands → Control commands to clients
nerfwar/orchestrator/media   → Media updates and synchronization
nerfwar/clients/heartbeat    → Device connectivity monitoring
```

#### Debug Mode

Access advanced debugging tools by adding `?debug=true` to the orchestrator URL:

```
http://localhost:8000/orchestrator.html?debug=true
```

**Debug Features:**

- Performance monitoring console commands
- MQTT message logging
- Emergency reset functions
- State export for troubleshooting

### Troubleshooting

#### MQTT Connection Issues

1. **Check Internet**: Ensure stable internet connection
2. **Firewall Settings**: Allow WebSocket connections on port 8080
3. **Browser Compatibility**: Use Chrome/Firefox for best results
4. **Reconnect**: Use "🔄 Reconnect MQTT" button in control panel

#### Synchronization Problems

1. **Manual Sync**: Use "📡 Sync Current Page" to force update
2. **Device Status**: Check "Connected Devices" list for client connectivity
3. **Reset Clients**: Use "🔄 Reset All Clients" if needed

#### Performance Optimization

- **Media Size**: Keep images under 5MB for optimal performance
- **Connection Limit**: Recommend max 20 simultaneous viewers
- **Browser Resources**: Close unnecessary browser tabs

### Console Commands

Open browser console (F12) for advanced control:

```javascript
// Get current orchestrator state
getOrchestratorState()

// Log detailed debugging information
logOrchestratorState()

// Export debug data for troubleshooting
exportDebugInfo()

// Emergency reset if needed
emergencyReset()

// Monitor performance metrics
monitorPerformance()
```

## 🎮 Story Application Features

### For Story Viewers

#### Navigation Controls

- **Next/Previous Buttons**: Standard navigation
- **Arrow Keys**: Left/Right or Spacebar for navigation
- **Touch Gestures**: Swipe left/right on mobile devices
- **Audio Controls**: Volume slider and mute/unmute toggle

#### Responsive Experience

- **Mobile Optimized**: Touch-friendly interface with swipe gestures
- **Adaptive Layout**: Automatically adjusts to screen size
- **Accessibility**: ARIA labels and keyboard navigation support

#### Real-time Features

- **Live Sync**: Automatically receives updates from orchestrator
- **Name Personalization**: Your name appears throughout the story
- **Progress Tracking**: Visual progress bar shows story completion
- **MQTT Status**: Connection indicator shows sync status

## 🎨 Media Support

The system supports rich media integration:

### Images

- **Formats**: SVG, PNG, JPG, GIF
- **Integration**: Scene-specific images sync across all devices
- **Upload**: Drag-and-drop or click to upload via orchestrator
- **Display**: Automatic fade transitions between images

### Audio

- **Formats**: MP3, WAV, OGG
- **Controls**: Volume control, mute/unmute, autoplay settings
- **Sync**: Background music syncs across all connected devices
- **Management**: Upload and configure via orchestrator dashboard

### Future Content Ready

- **Video**: AV1-encoded content support prepared
- **Animations**: SVG-based character and scene animations
- **Interactive Elements**: Prepared for team member contributions

## 🎭 Story Structure

The narrative follows the Hero's Journey through 12 scenes:

1. **The Ordinary World** - Veterans Association introduction
2. **Call to Adventure** - Mysterious capybara activity
3. **Refusal of the Call** - Jenkins dismisses the threat
4. **Meeting the Mentor** - Elder veteran reveals truth
5. **Crossing the Threshold** - Entering "emu territory"
6. **Tests, Allies, Enemies** - Encounters and revelations
7. **Approach to Inmost Cave** - Finding the capybara sanctuary
8. **The Ordeal** - Epic foam dart battle
9. **The Reward** - Understanding and peace
10. **The Road Back** - Convincing the association
11. **Resurrection** - Jenkins becomes a peacemaker
12. **Return with Elixir** - New traditions and harmony

## 🎯 CS 3660 Requirements Compliance

✅ **Browser-Based**: Runs entirely in web browsers  
✅ **Interactive Story**: Player name integration and navigation  
✅ **MQTT Orchestration**: Real-time sync via `mqtt.uvucs.org`  
✅ **UI Management**: Complete interface for story navigation  
✅ **Content Player**: Integrated media playback system  
✅ **Team Content**: Ready for multiple contributions  
✅ **Family-Friendly**: No violence or inappropriate content

## 🔧 Development & Customization

### For Developers

#### Modular Architecture

- **HTML**: Semantic structure with accessibility features
- **CSS**: Responsive design with animations and themes
- **JavaScript**: ES6+ with async/await patterns
- **MQTT**: Real-time communication layer

#### Getting Started with Development

1. **Read Documentation**: Start with `CODE_EXPLANATION.md`
2. **Basic Customization**: See `GETTING_STARTED.md`
3. **Advanced Features**: Explore orchestrator source code
4. **Testing**: Use debug mode for development

#### API Integration

The orchestrator exposes several methods for external integration:

```javascript
// Access story state
window.getStoryState()

// Control story position
window.setStoryPosition(sceneId, dialogueIndex)

// Monitor orchestrator status
window.monitorPerformance()
```

## 🌐 Vercel Deployment

### Setup for Production Hosting

#### 1. File Structure Preparation

Move all files to project root:

```
your-project/ (root)
├── index.html              # Main story application
├── orchestrator.html       # Dashboard (renamed from orchestrator/index.html)
├── styles.css              # Story styling
├── script.js               # Story functionality
├── orchestrator.css        # Dashboard styling
├── orchestrator.js         # Dashboard functionality
├── vercel.json             # Configuration (create this)
└── assets/                 # Media folder
```

#### 2. Create vercel.json Configuration

```json
{
  "version": 2,
  "public": true,
  "routes": [
    {
      "src": "/orchestrator",
      "dest": "/orchestrator.html"
    },
    {
      "src": "/dashboard",
      "dest": "/orchestrator.html"
    }
  ],
  "headers": [
    {
      "source": "/orchestrator.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

#### 3. Deploy to Vercel

**Option A: Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project directory
vercel

# For production deployment
vercel --prod
```

**Option B: GitHub Integration**

1. Push your code to GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Import Project" and select your GitHub repository
4. Vercel will automatically deploy on every push to main branch

#### 4. Production URLs

After deployment, access your application at:

```
https://your-project-name.vercel.app/           # Story application for participants
https://your-project-name.vercel.app/orchestrator     # Orchestrator dashboard
https://your-project-name.vercel.app/orchestrator.html # Direct orchestrator access
```

#### 5. Code Updates for Production

Update the `connectMQTT` method in `orchestrator.js` (around line 150):

```javascript
// Replace the existing connectMQTT method with production-aware version
async connectMQTT() {
    return new Promise((resolve, reject) => {
        try {
            const clientId = "orchestrator_" + Math.random().toString(36).substr(2, 9);

            // Detect production environment
            const isProduction = window.location.hostname.includes('vercel.app') ||
                               window.location.hostname !== 'localhost';

            this.mqttClient = new Paho.MQTT.Client("mqtt.uvucs.org", 8080, clientId);

            this.mqttClient.onConnectionLost = (responseObject) => {
                this.isConnected = false;
                this.updateConnectionStatus(false);
                console.log("MQTT Connection lost:", responseObject.errorMessage);

                // Longer reconnect delay in production
                const delay = isProduction ? 10000 : 5000;
                setTimeout(() => this.connectMQTT(), delay);
            };

            this.mqttClient.onMessageArrived = (message) => {
                this.handleMQTTMessage(message);
            };

            this.mqttClient.connect({
                onSuccess: () => {
                    this.isConnected = true;
                    this.updateConnectionStatus(true);
                    this.subscribeToTopics();
                    this.announcePresence();

                    if (isProduction) {
                        console.log(`🌐 Production orchestrator online: ${window.location.hostname}`);
                    }

                    resolve();
                },
                onFailure: (error) => {
                    this.isConnected = false;
                    this.updateConnectionStatus(false);
                    console.log("MQTT Connection failed:", error);
                    reject(error);
                },
                useSSL: true,
                timeout: isProduction ? 15 : 10,
                keepAliveInterval: 30,
                cleanSession: true
            });

        } catch (error) {
            this.isConnected = false;
            this.updateConnectionStatus(false);
            reject(error);
        }
    });
}
```

#### 6. Sharing Your Deployed Application

**For Instructors/Orchestrators:**

```
🎭 ORCHESTRATOR DASHBOARD
URL: https://your-project.vercel.app/orchestrator
```

**For Students/Participants:**

```
📱 STORY EXPERIENCE
URL: https://your-project.vercel.app/
```

**QR Code Sharing:**
Generate QR codes for easy mobile access by adding this to your orchestrator:

```javascript
// Add to orchestrator control panel for easy sharing
function generateShareQR() {
  const storyUrl = window.location.origin
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    storyUrl
  )}`
  window.open(qrUrl, '_blank')
}
```

#### 7. Production Deployment Checklist

✅ **Pre-Deployment:**

- [ ] Move orchestrator files to project root
- [ ] Rename orchestrator `index.html` → `orchestrator.html`
- [ ] Create `vercel.json` configuration file
- [ ] Update `connectMQTT` method in `orchestrator.js`
- [ ] Test locally: `vercel dev`

✅ **Post-Deployment:**

- [ ] Verify orchestrator loads at `/orchestrator` URL
- [ ] Test MQTT connection in production environment
- [ ] Confirm story synchronization across multiple devices
- [ ] Share URLs with instructors and participants

#### 8. Troubleshooting Vercel Deployment

**Common Issues:**

- **404 on orchestrator**: Ensure `vercel.json` routes are configured correctly
- **MQTT connection fails**: Check browser console for SSL/WebSocket errors
- **Files not updating**: Clear Vercel cache with `vercel --prod --force`
- **Mobile access issues**: Test with HTTPS URLs only (Vercel provides automatic SSL)

**Production Monitoring:**

```javascript
// Check deployment status in browser console
console.log(
  'Environment:',
  window.location.hostname.includes('vercel.app') ? 'Production' : 'Development'
)
console.log(
  'MQTT Status:',
  orchestrator?.isConnected ? 'Connected' : 'Disconnected'
)
```

### Customization Examples

#### Adding New Scenes

```javascript
// In script.js, extend storyData.scenes array
const newScene = {
  title: 'Your Custom Scene',
  background: 'bg-custom',
  dialogue: [
    {
      speaker: 'New Character',
      text: 'Your custom dialogue here...',
      media: {},
    },
  ],
}
```

#### Custom Styling

```css
/* In styles.css, add new background themes */
.bg-custom {
  background: linear-gradient(135deg, #your-colors);
}
```

## 🤝 Getting Help & Support

### Documentation Resources

- **`CODE_EXPLANATION.md`**: Detailed technical breakdown
- **`GETTING_STARTED.md`**: Basic usage and simple modifications
- **Browser Console**: Press F12 for debugging information
- **Debug Mode**: Add `?debug=true` for advanced diagnostics

### Common Issues

- **MQTT Not Connecting**: Check internet connection and browser compatibility
- **Changes Not Showing**: Use hard refresh (Ctrl+F5) or clear browser cache
- **Audio Issues**: Click audio button to enable, check browser autoplay policies
- **Mobile Display**: Use portrait orientation, try different browsers

### Best Practices

- **Make Small Changes**: Test frequently during development
- **Keep Backups**: Save working versions before major modifications
- **Test on Multiple Devices**: Verify mobile and desktop compatibility
- **Monitor Performance**: Use browser dev tools to check resource usage

---

_"The greatest victory comes not from defeating enemies, but from understanding them."_ - Captain Jenkins

**🎖️ Ready to orchestrate your own epic foam dart diplomacy? Open `orchestrator.html` and begin commanding your story empire!**
