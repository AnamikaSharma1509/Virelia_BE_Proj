# Virelia — Unity XR Integration & Roadmap

This document outlines the asset pipeline connecting Unity 3D environments to the Virelia web platform, as well as the technical roadmap for real-time standalone VR/XR integration via OpenXR and WebSockets.

---

## 1. MVP Architecture: Rendered MP4 Video Delivery

For the current MVP, Unity acts as an offline authoring and rendering studio:

```
┌────────────────────────────────┐
│   Unity Editor (URP Project)   │
│   • 3D Environment Scenes      │
│   • Cinematic Camera Paths     │
│   • Unity Recorder             │
└───────────────┬────────────────┘
                │ Renders 1080p H.264
                ▼
┌────────────────────────────────┐
│      Protected Media Root      │
│  /media/scenarios/...mp4       │
└───────────────┬────────────────┘
                │ HTTP Range 206 Streaming
                ▼
┌────────────────────────────────┐
│   React HTML5 Video Player     │
│   • Non-punitive Stop Control  │
│   • Comfort Rating (1-10)      │
│   • Event Telemetry Logger     │
└────────────────────────────────┘
```

### 1.1 Non-Punitive Exposure Philosophy
In compliance with ethical digital wellness principles:
- **Instant Pause & Exit**: Patients always have visible controls (`Pause`, `Emergency Stop`) that instantly stop video exposure without penalty.
- **Accurate Event Categorization**: Stopped sessions are persisted in the database as `interrupted` rather than `completed`.
- **Subjective Comfort Scale**: Pre- and post-session ratings use a 1–10 self-reported comfort scale, explicitly disclaiming diagnostic measurement.

---

## 2. Phase 2 Roadmap: Real-Time OpenXR & WebSocket Integration

The architecture is prepared for direct live VR deployment on Meta Quest, Apple Vision Pro, and PCVR headsets:

### 2.1 Authenticated Session Handshake
1. The standalone Unity application initiates a session handshake with the Virelia API:
   ```http
   POST /api/v1/sessions/start
   Authorization: Bearer <patient_token>
   {
     "scenario_id": "...",
     "pre_comfort_rating": 4,
     "device_type": "meta_quest_3"
   }
   ```
2. The backend responds with a short-lived `session_ws_token`.

### 2.2 Bi-directional WebSocket Telemetry
- **Endpoint**: `/ws/sessions/{session_id}?token={session_ws_token}`
- **Client → Server Events**:
  - `gaze_direction`: Head orientation quaternion `(x, y, z, w)`
  - `user_movement`: Position vector `(x, y, z)`
  - `comfort_heartbeat`: Real-time subjective comfort triggers via controller trigger
- **Server → Client Commands**:
  - `scenario_pause`: Clinical supervisor remote pause
  - `scenario_advance`: Advance to next visual intensity level
  - `emergency_exit`: Graceful fade to black and return to neutral lobby
