using UnityEngine;
using UnityEngine.UI;

namespace Virelia.XR
{
    /// <summary>
    /// Implements visual safety indicators and smooth camera fadeout
    /// whenever the patient elects to stop or pause the practice session.
    /// </summary>
    public class SafetyExitController : MonoBehaviour
    {
        [Header("UI & Safety Elements")]
        public Canvas safetyNoticeCanvas;
        public Image fadeScreenOverlay;
        public float fadeDuration = 0.5f;

        private void Start()
        {
            if (fadeScreenOverlay != null)
            {
                fadeScreenOverlay.color = new Color(0, 0, 0, 0);
            }
        }

        public void TriggerSafeFadeOut(System.Action onComplete)
        {
            StartCoroutine(FadeRoutine(0f, 1f, fadeDuration, onComplete));
        }

        public void TriggerSafeFadeIn(System.Action onComplete)
        {
            StartCoroutine(FadeRoutine(1f, 0f, fadeDuration, onComplete));
        }

        private System.Collections.IEnumerator FadeRoutine(float fromAlpha, float toAlpha, float duration, System.Action onComplete)
        {
            if (fadeScreenOverlay == null)
            {
                onComplete?.Invoke();
                yield break;
            }

            float timer = 0f;
            Color c = fadeScreenOverlay.color;
            while (timer < duration)
            {
                timer += Time.unscaledDeltaTime;
                c.a = Mathf.Lerp(fromAlpha, toAlpha, timer / duration);
                fadeScreenOverlay.color = c;
                yield return null;
            }
            c.a = toAlpha;
            fadeScreenOverlay.color = c;
            onComplete?.Invoke();
        }
    }
}
