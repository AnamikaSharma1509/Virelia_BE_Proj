# VireliaXR — Unity 3D Guided Exposure Environments

This directory contains the Unity project assets, environment scenes, and camera scripts used to build and render the 3D guided exposure scenario videos for the Virelia web platform.

---

## 1. Technical Specifications

- **Recommended Unity Version**: Unity 2022.3 LTS (or Unity 6000.x LTS)
- **Render Pipeline**: Universal Render Pipeline (URP)
- **Target Export Format**: H.264 MP4, 1080p (1920x1080), 30 fps
- **Audio Output**: AAC Stereo, 48 kHz
- **Color Space**: Linear
- **XR SDK Compatibility**: OpenXR plugin (for future live standalone headset execution)

---

## 2. Directory Layout

```
VireliaXR/
└── Assets/
    ├── Scenes/
    │   ├── 01_Interview_Room_Familiarization.unity
    │   ├── 02_Interview_Simulation.unity
    │   ├── 03_Stage_Seminar_Room.unity
    │   ├── 04_Stage_Auditorium.unity
    │   ├── 05_Heights_Balcony_Platform.unity
    │   ├── 06_Heights_Observation_Deck.unity
    │   ├── 07_Congested_Corridor.unity
    │   └── 08_Congested_Public_Hall.unity
    ├── Scripts/
    │   ├── ScenarioManager.cs
    │   ├── TelemetryLogger.cs
    │   ├── VideoRecorderController.cs
    │   └── SafetyExitController.cs
    ├── Materials/
    ├── Prefabs/
    ├── Lighting/
    ├── Audio/
    └── RenderedVideos/
```

---

## 3. The 4 Scenario Categories & 8 Video Levels

### Category 1: Interview Confidence
- **Level 1 (`interview_level_1.mp4`)**:
  - *Environment*: Professional interview room with neutral lighting, desk, two seated panel members.
  - *Camera*: Eye-level, fixed seated perspective, gentle breathing bob (0.02 amplitude).
  - *Goal*: Spatial familiarization and desensitization to formal meeting rooms.
- **Level 2 (`interview_level_2.mp4`)**:
  - *Environment*: Same interview setting with structured introductory questions asked at gentle pacing.
  - *Interaction*: Natural 5-second pauses for mental formulation and self-reflection.

### Category 2: Stage and Presentation Practice
- **Level 1 (`stage_level_1.mp4`)**:
  - *Environment*: Intimate seminar classroom, 6–8 seated listeners, projector display.
  - *Camera*: Standing speaker perspective behind a table/lectern.
- **Level 2 (`stage_level_2.mp4`)**:
  - *Environment*: Tiered auditorium with 40+ seated audience members and stage illumination.
  - *Camera*: Center podium perspective looking across the room.

### Category 3: Heights and Elevated Environments
- **Level 1 (`heights_level_1.mp4`)**:
  - *Environment*: Secure architectural balcony with high glass railings and solid stone deck.
  - *Camera*: Gradual approach to railing with stable horizon (no sudden drop visuals).
- **Level 2 (`heights_level_2.mp4`)**:
  - *Environment*: High-rise observation terrace overlooking a panoramic cityscape.
  - *Safety*: Clearly rendered safety barriers and stable motion.

### Category 4: Crowded and Congested Spaces
- **Level 1 (`congested_spaces_level_1.mp4`)**:
  - *Environment*: Wide university hallway with moderate foot traffic moving naturally in both directions.
- **Level 2 (`congested_spaces_level_2.mp4`)**:
  - *Environment*: Busy indoor transport hall or transit pavilion with higher density.
  - *Safety*: Open exit pathways visible at all times, no simulated claustrophobia or trapping.

---

## 4. Exporting MP4 Videos with Unity Recorder

1. Open Unity Hub and add `unity/VireliaXR`.
2. Open **Window → General → Package Manager**. Ensure `Unity Recorder` is installed.
3. Open any scene from `Assets/Scenes/`.
4. Open **Window → General → Recorder → Recorder Window**.
5. Set:
   - **Format**: MP4 (H.264)
   - **Resolution**: 1920 x 1080 (Full HD)
   - **Frame Rate**: Constant 30 FPS
   - **Quality**: High
   - **Output Path**: `../../media/scenarios/<category>/<filename>.mp4`
6. Press **START RECORDING**. Playback starts, captures the designated waypoint track, and saves the file directly.
