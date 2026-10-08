using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Virelia.XR
{
    [System.Serializable]
    public class TelemetrySnapshot
    {
        public float timestamp;
        public Vector3 headPosition;
        public Vector3 headRotation;
        public float gazeStabilityScore;
    }

    public class TelemetryLogger : MonoBehaviour
    {
        [Header("Telemetry Configuration")]
        public Transform patientCameraTransform;
        public float sampleIntervalSeconds = 0.5f;
        public bool isLoggingActive = false;

        private float nextSampleTime = 0f;
        private List<TelemetrySnapshot> sampleBuffer = new List<TelemetrySnapshot>();

        private void Start()
        {
            if (patientCameraTransform == null && Camera.main != null)
            {
                patientCameraTransform = Camera.main.transform;
            }

            if (ScenarioManager.Instance != null)
            {
                ScenarioManager.Instance.OnStateChanged += HandleScenarioStateChanged;
            }
        }

        private void OnDestroy()
        {
            if (ScenarioManager.Instance != null)
            {
                ScenarioManager.Instance.OnStateChanged -= HandleScenarioStateChanged;
            }
        }

        private void HandleScenarioStateChanged(SessionState newState)
        {
            if (newState == SessionState.ActiveExposure)
            {
                isLoggingActive = true;
                sampleBuffer.Clear();
                nextSampleTime = Time.time + sampleIntervalSeconds;
            }
            else
            {
                isLoggingActive = false;
            }
        }

        private void Update()
        {
            if (!isLoggingActive || patientCameraTransform == null) return;

            if (Time.time >= nextSampleTime)
            {
                RecordSnapshot();
                nextSampleTime = Time.time + sampleIntervalSeconds;
            }
        }

        private void RecordSnapshot()
        {
            TelemetrySnapshot snap = new TelemetrySnapshot
            {
                timestamp = ScenarioManager.Instance != null ? ScenarioManager.Instance.elapsedTime : Time.time,
                headPosition = patientCameraTransform.position,
                headRotation = patientCameraTransform.eulerAngles,
                gazeStabilityScore = 1.0f // Baseline telemetry for orientation
            };

            sampleBuffer.Add(snap);

            // Cap memory buffer to prevent memory leakage
            if (sampleBuffer.Count > 600)
            {
                sampleBuffer.RemoveAt(0);
            }
        }

        public string ExportTelemetryJson()
        {
            return JsonUtility.ToJson(new TelemetryContainer { samples = sampleBuffer });
        }

        [System.Serializable]
        private class TelemetryContainer
        {
            public List<TelemetrySnapshot> samples;
        }
    }
}
