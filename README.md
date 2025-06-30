# The Great Nerf War: A Capybara's Revenge

An interactive mockumentary for CS 3660 - StoryTelling Project

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![MQTT](https://img.shields.io/badge/MQTT-3C5280?logo=eclipsemosquitto&logoColor=white)

## 📖 Project Overview

Experience the most epic foam dart conflict in recorded history! This interactive mockumentary follows Captain Jenkins through a Hero's Journey as they navigate a complex conflict between nerf war veterans, emus, and a surprisingly vengeful capybara.

### 🎯 Features

- **Interactive Storytelling**: 12 scenes following the Hero's Journey structure
- **MQTT Orchestration**: Real-time synchronization via `mqtt.uvucs.org`
- **Player Integration**: Enter your name to become part of the story
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Audio Controls**: Background music with volume control
- **Touch Support**: Swipe gestures for mobile navigation

## 🚀 Quick Start

1. **Open**: Launch `index.html` in a modern web browser
2. **Enter Name**: Provide your veteran name when prompted
3. **Navigate**: Use arrow keys, spacebar, or on-screen buttons

### Local Development Server (Optional)

```bash
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## 🛠️ Technical Requirements

- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: ES6+ support required
- **Internet**: Required for MQTT synchronization
- **MQTT Broker**: `mqtt.uvucs.org:8080` (WebSocket)

## 🏗️ Project Structure

```
StoryTelling/
├── index.html          # Main application
├── styles.css          # Visual styling
├── script.js           # Interactive functionality
├── README.md           # Project overview (this file)
├── CODE_EXPLANATION.md # Technical code guide
├── GETTING_STARTED.md  # Usage and modification guide
└── assets/            # Media assets
    ├── images/        # Story visuals
    ├── audio/         # Sound effects and music
    └── video/         # AV1 encoded video content
```

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

## 🎨 Media Support

Ready for team member contributions:

- **Images**: "Historical" photos, veteran portraits, scene backgrounds
- **Audio**: Testimonials, emu sounds, ambient effects
- **Video**: AV1-encoded reenactment footage
- **Animations**: SVG battle maps, character sequences

## 🎯 CS 3660 Requirements Compliance

✅ **Browser-Based**: Runs entirely in web browsers
✅ **Interactive Story**: Player name integration and navigation
✅ **MQTT Orchestration**: Real-time sync via `mqtt.uvucs.org`
✅ **UI Management**: Complete interface for story navigation
✅ **Content Player**: Integrated media playback system
✅ **Team Content**: Ready for multiple contributions
✅ **Family-Friendly**: No violence or inappropriate content

---

*"The greatest victory comes not from defeating enemies, but from understanding them."* - Captain Jenkins
