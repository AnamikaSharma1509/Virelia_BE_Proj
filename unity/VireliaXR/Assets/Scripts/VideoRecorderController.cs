using System.Collections;
using UnityEngine;

namespace Virelia.XR
{
    /// <summary>
    /// Utility script to automate camera tracks and offline rendering
    /// of 1080p MP4 videos for the 4 scenario environments.
    /// </summary>
    public class VideoRecorderController : MonoBehaviour
    {
        [Header("Render Parameters")]
        public string scenarioTargetSlug = "interview-confidence";
        public int targetLevel = 1;
        public int targetFPS = 30;
        public Vector2Int resolution = new Vector2Int(1920, 1080);
        public string exportFilename = "interview_level_1.mp4";

        [Header("Cinematic Camera Paths")]
        public Transform[] cameraWaypoints;
        public float trackSpeed = 0.5f;

        private int currentWaypointIndex = 0;

        private void Start()
        {
            Debug.Log($"[Virelia Render Controller] Prepared to export '{exportFilename}' ({resolution.x}x{resolution.y} @ {targetFPS}fps)");
        }

        private void Update()
        {
            if (cameraWaypoints == null || cameraWaypoints.Length == 0) return;

            Transform target = cameraWaypoints[currentWaypointIndex];
            transform.position = Vector3.MoveTowards(transform.position, target.position, trackSpeed * Time.deltaTime);
            transform.rotation = Quaternion.Slerp(transform.rotation, target.rotation, trackSpeed * Time.deltaTime);

            if (Vector3.Distance(transform.position, target.position) < 0.05f)
            {
                currentWaypointIndex = (currentWaypointIndex + 1) % cameraWaypoints.Length;
            }
        }
    }
}
