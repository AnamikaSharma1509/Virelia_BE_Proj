from abc import ABC, abstractmethod
from typing import List, Dict, Any

class AIProvider(ABC):
    @abstractmethod
    def analyze_written_assessment(self, answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze written assessment answers.
        Returns a structured dictionary matching the required analysis schema.
        """
        pass

    @abstractmethod
    def summarize_exposure_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a factual summary of an exposure session.
        """
        pass
