# 🚀 Getting Started Guide
*Simple steps to use and customize The Great Nerf War*

---

## 🎮 **Using the Application**

### **Quick Start**
1. **Open** `index.html` in any modern web browser
2. **Enter your name** when prompted
3. **Navigate** using:
   - **Next/Previous buttons** 
   - **Arrow keys** or **Spacebar**
   - **Swipe gestures** (mobile)

### **Controls**
- **🔊 Audio** - Toggle background music
- **Volume slider** - Adjust audio level  
- **🔄 Restart** - Return to beginning
- **Progress bar** - Shows story progress

---

## 🔧 **Basic Customization**

### **Change Story Content**
Find the story data in `script.js` (around line 430):

```javascript
const storyData = {
    scenes: [
        {
            title: "The Ordinary World",
            dialogue: [
                { speaker: "Narrator", text: "Your new text here..." },
                { speaker: "Captain Jenkins", text: "Add your dialogue..." }
            ]
        }
    ]
};
```

**To modify:**
1. Change the `text` field to update dialogue
2. Change `speaker` names for different characters
3. Add new dialogue objects to extend scenes

### **Update Visual Style**
In `styles.css`, find these key colors:

```css
/* Main colors */
:root {
    --primary-gold: #DAA520;    /* Change to your preferred accent color */
    --background-dark: #1a1a1a; /* Main background color */
}

/* Button colors */
.nav-button {
    background: linear-gradient(135deg, #DAA520, #B8860B);
}
```

**To customize:**
1. Replace color codes with your preferences
2. Use online color pickers for hex codes
3. Test changes by refreshing the browser

### **Add New Scenes**
1. **Copy an existing scene** in the `storyData.scenes` array
2. **Update the content:**
   - Change `id` to next number
   - Update `title` 
   - Write new `dialogue` array
3. **Save and test**

### **Modify Backgrounds**
Background styles are in `styles.css`:

```css
.bg-park { background: linear-gradient(135deg, #4CAF50, #8BC34A); }
.bg-office { background: linear-gradient(135deg, #795548, #8D6E63); }
.bg-battlefield { background: linear-gradient(135deg, #B71C1C, #E53935); }
.bg-peace { background: linear-gradient(135deg, #1976D2, #42A5F5); }
```

**To add new backgrounds:**
1. Create new CSS class (e.g., `.bg-space`)
2. Add gradient colors
3. Reference in scene data: `background: "bg-space"`

---

## 🎨 **Easy Modifications**

### **Text and Labels**
```html
<!-- In index.html, find and edit these -->
<div class="title">Your New Title Here</div>
<div class="subtitle">Your Subtitle</div>
<button onclick="nextScene()">Your Button Text →</button>
```

### **Audio**
```html
<!-- Replace the audio source in index.html -->
<audio id="backgroundAudio" loop preload="auto">
    <source src="your-audio-file.wav" type="audio/wav">
</audio>
```

### **Character Names**
Simply update the `speaker` field in dialogue objects:
```javascript
{ speaker: "Your Character", text: "Character dialogue..." }
```

---

## 🐛 **Troubleshooting**

### **Changes Not Showing**
- **Hard refresh**: `Ctrl+F5` (PC) or `Cmd+Shift+R` (Mac)
- **Check syntax**: Look for missing quotes or brackets
- **Browser console**: Press `F12` to check for errors

### **MQTT Not Connecting**
- **This is normal** without internet connection
- **Story works fine** without MQTT synchronization
- **No action needed** for basic usage

### **Audio Issues**
- **Click audio button** to enable sound
- **Browser policy**: Some browsers require user interaction first
- **Check volume** on both app and system

### **Mobile Display Issues**  
- **Use portrait orientation** for best experience
- **Zoom out** if text appears too large
- **Try different browser** if problems persist

---

## 💡 **Best Practices**

### **Making Changes**
1. **Work on one thing at a time**
2. **Save frequently** and test after each change
3. **Keep backups** of working versions
4. **Use simple text editor** (VS Code, Notepad++, etc.)

### **Testing Changes**
1. **Save the file** you modified
2. **Refresh the browser** (F5 or Ctrl+R)
3. **Check browser console** (F12) for errors
4. **Test on mobile** if you have touch device

### **Common Mistakes**
- **Missing quotes** around text: `"text here"`
- **Missing commas** between array items
- **Broken brackets** - every `{` needs a `}`
- **Case sensitivity** - `background` vs `Background`

---

## 📚 **Next Steps**

### **Beginner Level**
- Change text content and character names
- Modify colors and button labels
- Add simple dialogue to existing scenes

### **Intermediate Level**  
- Create new scenes with dialogue
- Add custom background styles
- Modify audio and visual effects

### **Advanced Level**
- Implement save/load functionality
- Add branching story paths
- Create custom animations

---

## 🤝 **Getting Help**

- **Read comments** in the code files
- **Check browser console** (F12) for error messages
- **Make small changes** and test frequently
- **Refer to** `CODE_EXPLANATION.md` for technical details

**Remember**: Coding is about experimenting! Don't worry about breaking things - you can always undo changes. 🎯
