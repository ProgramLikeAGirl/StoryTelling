# Video Directory

This directory contains video assets for **The Great Nerf War: A Capybara's Revenge**.

## File Organization

### Reenactment Footage
- `original_incident.av1` - The infamous capybara disruption
- `first_encounter.av1` - Early emu sightings
- `epic_battle.av1` - The great foam dart conflict
- `peace_treaty.av1` - Resolution ceremony

### Documentary Style
- `jenkins_interview.av1` - Captain Jenkins testimonial
- `morrison_flashback.av1` - Elder veteran memories
- `association_meeting.av1` - Veterans Association footage
- `park_surveillance.av1` - "Security camera" footage

### Animated Sequences
- `battle_tactics.av1` - Strategic battle animations
- `emu_formation.av1` - Emu defensive patterns
- `capybara_planning.av1` - Capybara revenge plotting
- `timeline_animation.av1` - Historical timeline

### Scene Transitions
- `scene_wipes/` - Cinematic scene transitions
- `title_cards/` - Scene title animations
- `credits_roll.av1` - End credits sequence

## Technical Specifications

- **Format**: AV1 (required), fallback MP4/WebM
- **Resolution**: 1920x1080 minimum, 4K preferred for key scenes
- **Framerate**: 24fps or 30fps
- **Bitrate**: Optimize for web streaming
- **Duration**: Individual clips 30 seconds to 2 minutes max

## Encoding Guidelines

```bash
# AV1 encoding example (using ffmpeg with libaom)
ffmpeg -i input.mp4 -c:v libaom-av1 -crf 30 -b:v 0 \
       -c:a libopus -b:a 128k output.av1.webm

# Fallback MP4 for compatibility
ffmpeg -i input.mp4 -c:v libx264 -crf 23 \
       -c:a aac -b:a 128k output.mp4
```

## Implementation Notes

- Videos trigger based on story progression
- Supports full-screen viewing mode
- Includes fallback formats for compatibility
- Optimized for web streaming

## Production Workflow

1. **Planning**: Storyboard key scenes
2. **Filming**: Record raw footage
3. **Editing**: Cut and arrange sequences  
4. **Encoding**: Convert to AV1 format
5. **Testing**: Verify web compatibility
6. **Integration**: Add to story application

## Adding New Videos

1. Add encoded videos to appropriate subdirectory
2. Update this README with file descriptions
3. Reference in `index.html` if needed for story scenes
4. Test loading performance and streaming

## Current Status

🔲 Reenactment footage needed
🔲 Documentary interviews needed
🔲 Animated sequences needed
🔲 Scene transitions needed

*Team members: Add your video content contributions here!*

## Creative Guidelines

- **Style**: Mockumentary/documentary feel
- **Tone**: Humorous but respectful
- **Content**: Family-friendly, no actual violence
- **Quality**: Professional appearance with intentional "amateur" touches
- **Characters**: Consistent with story narrative

## Equipment Recommendations

- **Camera**: DSLR or quality smartphone
- **Audio**: External microphone for interviews
- **Lighting**: Natural lighting preferred for documentary feel
- **Editing**: DaVinci Resolve (free) or similar 