import re
from typing import List, Dict, Any
from app.ai.provider import AIProvider

class LocalFallbackProvider(AIProvider):
    """
    Deterministic, reliable local fallback summarizer that analyzes text without external API calls.
    Adheres strictly to safety guidelines: zero clinical diagnoses, focus on self-reported communication themes.
    """

    def analyze_written_assessment(self, answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        combined_text = " ".join([a.get("written_answer", "") for a in answers if a.get("written_answer")]).strip()
        
        if not combined_text:
            return {
                "summary": "No written responses provided in this assessment for subjective analysis.",
                "observed_themes": ["Objective MCQ completion without optional written commentary"],
                "strengths": ["Completed the objective portion of the evaluation"],
                "practice_suggestions": ["Include written reflections in subsequent practice sessions to track communication thoughts."],
                "limitations": ["Absence of written text prevents personalized qualitative thematic analysis."],
                "requires_human_review": True
            }

        word_count = len(combined_text.split())
        themes = []
        strengths = []
        suggestions = []

        lower = combined_text.lower()
        
        # Communication & Presentation themes
        if any(w in lower for w in ["nervous", "anxious", "worry", "fear", "hesitant", "scared"]):
            themes.append("Identified situational hesitation prior to challenging public or professional communication")
            suggestions.append("Engage in gradual exposure using the introductory Scenario video levels before advancing")
        
        if any(w in lower for w in ["prepare", "practice", "rehearse", "outline", "notes"]):
            themes.append("Strong focus on structured preparation and rehearsal")
            strengths.append("Recognizes the importance of methodical advance preparation")
            suggestions.append("Structure practice rounds using 2-minute timed responses to simulate live interaction")
        
        if any(w in lower for w in ["interview", "questions", "hiring", "job", "career"]):
            themes.append("Targeted career preparation and interview readiness")
            suggestions.append("Review typical scenario prompts and rehearse behavioral answers with pauses")
            
        if any(w in lower for w in ["crowd", "people", "stage", "audience", "height", "elevator", "space"]):
            themes.append("Environmental sensitivity related to specific physical or audience settings")
            suggestions.append("Utilize the built-in pause and stop controls to practice controlled pacing")

        if not themes:
            themes.append("General reflection on personal communication readiness")
            
        if not strengths:
            strengths.append("Willingness to reflect candidly on personal growth areas")
            if word_count > 30:
                strengths.append("Provided detailed thoughtful narrative answers")

        if not suggestions:
            suggestions.append("Schedule regular guided exposure sessions and review self-reported comfort scores")

        summary = (
            f"The participant provided {len(answers)} written response(s) totaling approximately {word_count} words. "
            f"Primary themes centered on {', '.join([t.lower() for t in themes[:2]])}. "
            "Participant demonstrated self-awareness regarding situational comfort and expressed commitment to skill development."
        )

        return {
            "summary": summary,
            "observed_themes": themes,
            "strengths": strengths,
            "practice_suggestions": suggestions,
            "limitations": [
                "Self-reported reflection only; does not constitute a clinical, medical, or diagnostic assessment.",
                "Qualitative feedback is generated as an assistant draft and must be reviewed and approved by a professional administrator."
            ],
            "requires_human_review": True
        }

    def summarize_exposure_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        scenario_title = session_data.get("scenario_title", "Guided Scenario")
        video_title = session_data.get("video_title", "Practice Video")
        pre_rating = session_data.get("pre_comfort_rating")
        post_rating = session_data.get("post_comfort_rating")
        duration = session_data.get("duration_seconds", 0)
        status = session_data.get("status", "completed")
        reflection = session_data.get("reflection", "")

        mins = duration // 60
        secs = duration % 60
        time_str = f"{mins}m {secs}s" if mins > 0 else f"{secs}s"

        rating_summary = ""
        if pre_rating is not None and post_rating is not None:
            rating_summary = f"Pre-session comfort rating was recorded at {pre_rating}/10 and post-session comfort at {post_rating}/10."
        elif pre_rating is not None:
            rating_summary = f"Pre-session comfort rating was recorded at {pre_rating}/10."

        status_text = "completed normally" if status == "completed" else f"concluded early with status '{status}'"

        summary = (
            f"The participant participated in '{scenario_title}' ({video_title}) for a duration of {time_str}. "
            f"The session {status_text}. {rating_summary}"
        )

        if reflection:
            summary += f" Participant added the following personal reflection: \"{reflection.strip()}\"."

        return {
            "summary": summary,
            "factual_data": {
                "scenario": scenario_title,
                "video": video_title,
                "duration_seconds": duration,
                "status": status,
                "pre_rating": pre_rating,
                "post_rating": post_rating
            },
            "disclaimer": "This session summary records self-reported subjective comfort levels and video engagement telemetry. It does not measure anxiety disorders or clinical efficacy.",
            "requires_human_review": True
        }
