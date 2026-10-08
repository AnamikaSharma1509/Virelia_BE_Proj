using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Virelia.XR
{
    public enum SessionState
    {
        Idle,
        PreComfortRating,
        ActiveExposure,
        Paused,
        Interrupted,
        Completed,
        PostReflection
    }

    [System.Serializable]
    public class ScenarioMetadata
    {
        public string scenarioId;
        public string scenarioTitle;
        public int level;
        public float durationSeconds;
        public string safetyNotice;
    }

    public class ScenarioManager : MonoBehaviour
    {
        public static ScenarioManager Instance { get; private set; }

        [Header("Configuration")]
        public ScenarioMetadata currentScenario;
        public SessionState currentState = SessionState.Idle;

        [Header("Runtime Timers")]
        public float elapsedTime = 0f;
        public bool isTimerRunning = false;

        [Header("Safety Controls")]
        public KeyCode emergencyExitKey = KeyCode.Escape;
        public KeyCode pauseKey = KeyCode.Space;

        public event Action<SessionState> OnStateChanged;
        public event Action<string, string> OnSessionEvent;

        private void Awake()
        {
            if (Instance != null && Instance != null)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            SetState(SessionState.Idle);
        }

        private void Update()
        {
            if (isTimerRunning)
            {
                elapsedTime += Time.deltaTime;
                if (elapsedTime >= currentScenario.durationSeconds && currentState == SessionState.ActiveExposure)
                {
                    CompleteSession();
                }
            }

            // Always allow immediate exit or pause
            if (Input.GetKeyDown(emergencyExitKey))
            {
                StopSessionSafetyEmergency();
            }
            else if (Input.GetKeyDown(pauseKey))
            {
                TogglePause();
            }
        }

        public void StartSession(ScenarioMetadata metadata, int preRating)
        {
            currentScenario = metadata;
            elapsedTime = 0f;
            SetState(SessionState.ActiveExposure);
            isTimerRunning = true;
            OnSessionEvent?.Invoke("session_started", $"PreComfortRating: {preRating}");
        }

        public void TogglePause()
        {
            if (currentState == SessionState.ActiveExposure)
            {
                SetState(SessionState.Paused);
                isTimerRunning = false;
                Time.timeScale = 0f;
                OnSessionEvent?.Invoke("video_paused", $"Elapsed: {elapsedTime:F1}s");
            }
            else if (currentState == SessionState.Paused)
            {
                SetState(SessionState.ActiveExposure);
                isTimerRunning = true;
                Time.timeScale = 1f;
                OnSessionEvent?.Invoke("video_resumed", $"Elapsed: {elapsedTime:F1}s");
            }
        }

        public void StopSessionSafetyEmergency()
        {
            Time.timeScale = 1f;
            isTimerRunning = false;
            SetState(SessionState.Interrupted);
            OnSessionEvent?.Invoke("session_stopped", $"Patient interrupted at {elapsedTime:F1}s. Comfort protected.");
            Debug.Log("[Virelia] Exposure interrupted safely at patient request. Non-punitive stop triggered.");
        }

        public void CompleteSession()
        {
            Time.timeScale = 1f;
            isTimerRunning = false;
            SetState(SessionState.Completed);
            OnSessionEvent?.Invoke("session_completed", $"Completed duration: {elapsedTime:F1}s");
        }

        private void SetState(SessionState newState)
        {
            currentState = newState;
            OnStateChanged?.Invoke(newState);
            Debug.Log($"[Virelia Scenario State] -> {newState}");
        }
    }
}
