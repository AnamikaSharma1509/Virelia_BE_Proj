import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, PatientProfile, DoctorProfile, ConsentRecord
from app.models.scenario import Scenario, ScenarioVideo, ScenarioAssignment
from app.models.assessment import Assessment, AssessmentQuestion, AssessmentAssignment

def seed_all(db: Session = None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        print("[SEED] Starting database seed...")

        # 1. Provision Admin User
        admin_user = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin_user:
            admin_user = User(
                id=uuid.uuid4(),
                email=settings.ADMIN_EMAIL,
                password_hash=get_password_hash(settings.ADMIN_INITIAL_PASSWORD or "Admin@Virelia2026!"),
                full_name="Dr. Anamika Roy",
                role="admin",
                is_active=True,
                is_verified=True,
                mfa_enabled=True,
            )
            db.add(admin_user)
            db.flush()

            doctor_prof = DoctorProfile(
                id=uuid.uuid4(),
                user_id=admin_user.id,
                display_name="Dr. Anamika Roy",
                professional_title="Senior Wellness & Practice Lead"
            )
            db.add(doctor_prof)
            print(f"[SEED] Created Admin: {settings.ADMIN_EMAIL}")
        else:
            print(f"[SEED] Admin already exists: {settings.ADMIN_EMAIL}")

        # 2. Provision Demo Patient for development testing
        demo_patient = db.query(User).filter(User.email == "demo.patient@virelia.com").first()
        if not demo_patient:
            demo_patient = User(
                id=uuid.uuid4(),
                email="demo.patient@virelia.com",
                password_hash=get_password_hash("Patient@Virelia2026!"),
                full_name="Alex Chen",
                role="patient",
                is_active=True,
                is_verified=True,
                mfa_enabled=False,
            )
            db.add(demo_patient)
            db.flush()

            pat_prof = PatientProfile(
                id=uuid.uuid4(),
                user_id=demo_patient.id,
                date_of_birth="2002-05-14",
                profile_preferences={"practice_goals": ["Interview Confidence", "Public Speaking"]}
            )
            db.add(pat_prof)

            consent = ConsentRecord(
                id=uuid.uuid4(),
                user_id=demo_patient.id,
                consent_type="onboarding_disclaimer",
                consent_version="1.0",
                accepted_status=True
            )
            db.add(consent)
            print("[SEED] Created Demo Patient: demo.patient@virelia.com (Password: Patient@Virelia2026!)")

        # 3. Seed Scenarios & 8 Video Slots
        scenarios_data = [
            {
                "title": "Interview Confidence",
                "slug": "interview-confidence",
                "category": "Interview Confidence",
                "description": "Gradual simulation for job interviews and professional communication, starting with room familiarization and moving to direct conversational prompts.",
                "instructions": "Sit comfortably in an upright position. Keep your shoulders relaxed. Take slow breaths as the interview room scene opens.",
                "safety_notice": "You may pause or stop this session at any time. This practice is self-paced and strictly non-diagnostic.",
                "videos": [
                    {
                        "title": "Level 1: Interview Room Familiarization",
                        "description": "A calm, neutral view of a professional interview setting. Become comfortable with the desk, panel seating, and room acoustics.",
                        "level": 1,
                        "file_path": "scenarios/interview/interview_level_1.mp4",
                        "duration_seconds": 180
                    },
                    {
                        "title": "Level 2: Structured Interview Simulation",
                        "description": "Engage with interviewers asking realistic introductory questions with natural pauses for mental reflection and pacing.",
                        "level": 2,
                        "file_path": "scenarios/interview/interview_level_2.mp4",
                        "duration_seconds": 300
                    }
                ]
            },
            {
                "title": "Stage and Presentation Practice",
                "slug": "stage-presentation-practice",
                "category": "Stage & Presentation",
                "description": "Stage exposure starting with an intimate seminar room setting before advancing to an auditorium presentation perspective.",
                "instructions": "Focus on the back row of the audience and remember to breathe steadily before speaking your prepared opening thoughts.",
                "safety_notice": "Pause or stop whenever you feel necessary. This is guided confidence-building.",
                "videos": [
                    {
                        "title": "Level 1: Small Seminar Room",
                        "description": "A small classroom environment with 6-8 seated listeners and a presentation slide display.",
                        "level": 1,
                        "file_path": "scenarios/stage/stage_level_1.mp4",
                        "duration_seconds": 210
                    },
                    {
                        "title": "Level 2: Auditorium Podium",
                        "description": "Step up to an auditorium podium overlooking a larger audience with stage lighting.",
                        "level": 2,
                        "file_path": "scenarios/stage/stage_level_2.mp4",
                        "duration_seconds": 360
                    }
                ]
            },
            {
                "title": "Heights and Elevated Environments",
                "slug": "heights-elevated-environments",
                "category": "Heights & Balconies",
                "description": "Controlled exploration of elevated vantage points with clear safety glass and sturdy barriers to build comfort with height perspective.",
                "instructions": "Notice the sturdy physical railing and keep your feet firmly grounded on the floor.",
                "safety_notice": "There are no sudden movements or surprises. You are always in full control of the playback.",
                "videos": [
                    {
                        "title": "Level 1: Controlled Observation Balcony",
                        "description": "Step onto an elevated third-floor terrace with visible protective railings and a calm courtyard view.",
                        "level": 1,
                        "file_path": "scenarios/heights/heights_level_1.mp4",
                        "duration_seconds": 150
                    },
                    {
                        "title": "Level 2: High-Rise Skyline Viewing Deck",
                        "description": "An expansive viewing deck overlooking an urban skyline with floor-to-ceiling glass barriers.",
                        "level": 2,
                        "file_path": "scenarios/heights/heights_level_2.mp4",
                        "duration_seconds": 240
                    }
                ]
            },
            {
                "title": "Crowded and Congested Spaces",
                "slug": "crowded-congested-spaces",
                "category": "Crowded Spaces",
                "description": "Exposure to bustling indoor public spaces, pedestrian concourses, and crowded foyers to develop calm spatial orientation.",
                "instructions": "Observe the regular flow of people. Notice that personal space remains respected as people walk past.",
                "safety_notice": "No simulated entrapment or aggressive motion. Pause or exit whenever you desire.",
                "videos": [
                    {
                        "title": "Level 1: Moderate Campus Concourse",
                        "description": "A moderately active university corridor during a passing period with gentle ambient foot traffic.",
                        "level": 1,
                        "file_path": "scenarios/congested_spaces/congested_spaces_level_1.mp4",
                        "duration_seconds": 180
                    },
                    {
                        "title": "Level 2: Busy Public Transit Station Foyer",
                        "description": "A high-ceiling indoor atrium with varied crowds moving through transit gates and ticket kiosks.",
                        "level": 2,
                        "file_path": "scenarios/congested_spaces/congested_spaces_level_2.mp4",
                        "duration_seconds": 300
                    }
                ]
            }
        ]

        for sc_item in scenarios_data:
            scenario = db.query(Scenario).filter(Scenario.slug == sc_item["slug"]).first()
            if not scenario:
                scenario = Scenario(
                    id=uuid.uuid4(),
                    title=sc_item["title"],
                    slug=sc_item["slug"],
                    description=sc_item["description"],
                    category=sc_item["category"],
                    instructions=sc_item["instructions"],
                    safety_notice=sc_item["safety_notice"],
                    is_active=True
                )
                db.add(scenario)
                db.flush()
                print(f"[SEED] Created Scenario: {scenario.title}")

            # Videos
            for vid_item in sc_item["videos"]:
                video = db.query(ScenarioVideo).filter(
                    ScenarioVideo.scenario_id == scenario.id,
                    ScenarioVideo.level == vid_item["level"]
                ).first()
                if not video:
                    video = ScenarioVideo(
                        id=uuid.uuid4(),
                        scenario_id=scenario.id,
                        title=vid_item["title"],
                        description=vid_item["description"],
                        level=vid_item["level"],
                        file_path=vid_item["file_path"],
                        mime_type="video/mp4",
                        file_size=0,
                        duration_seconds=vid_item["duration_seconds"],
                        is_active=True
                    )
                    db.add(video)
                    print(f"  [SEED] Added Video Slot: {video.title}")

        # 4. Seed Sample Assessments (MCQs + Written Questions)
        sample_assessments = [
            {
                "title": "Interview Readiness Assessment",
                "category": "Interview Confidence",
                "description": "A structured practice self-assessment covering interview preparation habits, verbal pacing, and recovery from unexpected questions.",
                "instructions": "Answer the multiple-choice questions honestly based on your current preparation, then provide short written reflections.",
                "estimated_duration": 12,
                "questions": [
                    {
                        "question_text": "When asked an unexpected behavioral question, what is your first immediate response?",
                        "question_type": "mcq",
                        "options": [
                            "I rush to speak immediately without taking time to structure thoughts",
                            "I take a slow pause to outline a 2-sentence key message before speaking",
                            "I get completely flustered and apologize repeatedly",
                            "I change the subject to something unrelated"
                        ],
                        "correct_option": "I take a slow pause to outline a 2-sentence key message before speaking",
                        "points": 5.0,
                        "order_index": 0
                    },
                    {
                        "question_text": "Which framework is recommended for structuring concise interview stories?",
                        "question_type": "mcq",
                        "options": [
                            "STAR Method (Situation, Task, Action, Result)",
                            "Random Chronological Monologue",
                            "Defense-First Justification",
                            "Keyword Repetition Drill"
                        ],
                        "correct_option": "STAR Method (Situation, Task, Action, Result)",
                        "points": 5.0,
                        "order_index": 1
                    },
                    {
                        "question_text": "Describe a specific situation where you experienced hesitation during an interview or formal discussion. What thoughts came up, and what preparation helps you feel more grounded?",
                        "question_type": "written",
                        "options": None,
                        "correct_option": None,
                        "points": 10.0,
                        "order_index": 2
                    }
                ]
            },
            {
                "title": "Stage & Presentation Confidence Assessment",
                "category": "Stage & Presentation",
                "description": "Evaluate vocal projection, eye contact distribution, and handling audience attention before presenting.",
                "instructions": "Reflect on your communication habits in front of small seminar rooms and larger audiences.",
                "estimated_duration": 15,
                "questions": [
                    {
                        "question_text": "What is the primary purpose of eye contact during an opening presentation remark?",
                        "question_type": "mcq",
                        "options": [
                            "To inspect the reaction of every individual listener simultaneously",
                            "To establish rapport with 2-3 focal points and ground your presence",
                            "To look exclusively at your presentation slides",
                            "To avoid looking at anyone by staring at the floor"
                        ],
                        "correct_option": "To establish rapport with 2-3 focal points and ground your presence",
                        "points": 5.0,
                        "order_index": 0
                    },
                    {
                        "question_text": "When you experience a momentary pause or memory lapse on stage, what is the best strategy?",
                        "question_type": "mcq",
                        "options": [
                            "Take a calm breath, check your notes or outline, and continue smoothly",
                            "Immediately apologize and exit the stage",
                            "Speak as rapidly as possible to compensate",
                            "Pretend the audio system failed"
                        ],
                        "correct_option": "Take a calm breath, check your notes or outline, and continue smoothly",
                        "points": 5.0,
                        "order_index": 1
                    },
                    {
                        "question_text": "Describe your current routine when stepping up to speak in front of a group. What physical sensations or thoughts do you notice most, and how do you center yourself?",
                        "question_type": "written",
                        "options": None,
                        "correct_option": None,
                        "points": 10.0,
                        "order_index": 2
                    }
                ]
            },
            {
                "title": "Elevated Views & Heights Comfort Assessment",
                "category": "Heights",
                "description": "Assess subjective comfort and grounding techniques when navigating elevated views, balconies, and observation decks.",
                "instructions": "Answer questions regarding your awareness of physical safety barriers and self-pacing at elevated perspectives.",
                "estimated_duration": 10,
                "questions": [
                    {
                        "question_text": "When approaching a high observation platform or balcony railing, what thought pattern is most stabilizing?",
                        "question_type": "mcq",
                        "options": [
                            "Focusing on the solid barrier, floor beneath you, and steady breathing",
                            "Leaning forward aggressively to test fear tolerance",
                            "Assuming structural failure will occur",
                            "Holding your breath and tensing your body"
                        ],
                        "correct_option": "Focusing on the solid barrier, floor beneath you, and steady breathing",
                        "points": 5.0,
                        "order_index": 0
                    },
                    {
                        "question_text": "What visual focus helps maintain balance when looking out from an elevated viewpoint?",
                        "question_type": "mcq",
                        "options": [
                            "Fixing your gaze on the distant horizon rather than straight down",
                            "Rapidly shifting eyes back and forth",
                            "Closing your eyes and spinning",
                            "Staring directly at the vertical drop"
                        ],
                        "correct_option": "Fixing your gaze on the distant horizon rather than straight down",
                        "points": 5.0,
                        "order_index": 1
                    },
                    {
                        "question_text": "What situations involving heights (e.g., balconies, glass elevators, rooftops) feel most challenging for you, and what comforting thoughts or visual anchors help you feel secure?",
                        "question_type": "written",
                        "options": None,
                        "correct_option": None,
                        "points": 10.0,
                        "order_index": 2
                    }
                ]
            },
            {
                "title": "Crowded Spaces & Congested Areas Navigation Assessment",
                "category": "Congested Spaces",
                "description": "Evaluate navigation patterns, sensory regulation, and self-advocacy in busy public spaces and crowded corridors.",
                "instructions": "Rate how you handle high-density environments like transport hubs, campus hallways, and events.",
                "estimated_duration": 12,
                "questions": [
                    {
                        "question_text": "In a busy, crowded indoor space, what proactive habit promotes calm navigation?",
                        "question_type": "mcq",
                        "options": [
                            "Noticing visible exits and moving at your own steady, comfortable pace",
                            "Pushing through people as fast as possible",
                            "Stopping abruptly in the middle of a doorway",
                            "Holding your breath until you reach the destination"
                        ],
                        "correct_option": "Noticing visible exits and moving at your own steady, comfortable pace",
                        "points": 5.0,
                        "order_index": 0
                    },
                    {
                        "question_text": "If a crowded corridor starts to feel overwhelming, what is the healthiest action?",
                        "question_type": "mcq",
                        "options": [
                            "Step aside to an open wall or less congested zone to reset breathing",
                            "Force yourself to stay in the thickest part of the crowd",
                            "Panic and drop your belongings",
                            "Criticize yourself for feeling sensitive"
                        ],
                        "correct_option": "Step aside to an open wall or less congested zone to reset breathing",
                        "points": 5.0,
                        "order_index": 1
                    },
                    {
                        "question_text": "Describe your experience when navigating congested environments like transit stations or campus halls. What pacing or sensory grounding helps you remain grounded?",
                        "question_type": "written",
                        "options": None,
                        "correct_option": None,
                        "points": 10.0,
                        "order_index": 2
                    }
                ]
            }
        ]

        for ass_item in sample_assessments:
            assessment = db.query(Assessment).filter(Assessment.title == ass_item["title"]).first()
            if not assessment:
                assessment = Assessment(
                    id=uuid.uuid4(),
                    title=ass_item["title"],
                    description=ass_item["description"],
                    instructions=ass_item["instructions"],
                    category=ass_item["category"],
                    estimated_duration=ass_item["estimated_duration"],
                    is_published=True,
                    created_by=admin_user.id
                )
                db.add(assessment)
                db.flush()
                print(f"[SEED] Created Assessment: {assessment.title}")

                for q_item in ass_item["questions"]:
                    q = AssessmentQuestion(
                        id=uuid.uuid4(),
                        assessment_id=assessment.id,
                        question_text=q_item["question_text"],
                        question_type=q_item["question_type"],
                        options=q_item["options"],
                        correct_option=q_item["correct_option"],
                        points=q_item["points"],
                        is_required=True,
                        order_index=q_item["order_index"]
                    )
                    db.add(q)
                    print(f"  [SEED] Added Question: {q.question_text[:40]}...")

        # 5. Automatically assign all 4 Scenarios to Demo Patient
        all_scenarios = db.query(Scenario).all()
        for sc in all_scenarios:
            existing_sa = db.query(ScenarioAssignment).filter(
                ScenarioAssignment.scenario_id == sc.id,
                ScenarioAssignment.patient_id == demo_patient.id
            ).first()
            if not existing_sa:
                sa = ScenarioAssignment(
                    id=uuid.uuid4(),
                    scenario_id=sc.id,
                    patient_id=demo_patient.id,
                    assigned_by=admin_user.id,
                    status="assigned"
                )
                db.add(sa)
                print(f"[SEED] Auto-assigned Scenario '{sc.title}' to Demo Patient")

        # 6. Automatically assign Interview Readiness Assessment to Demo Patient
        first_assessment = db.query(Assessment).filter(Assessment.title == "Interview Readiness Assessment").first()
        if first_assessment:
            existing_aa = db.query(AssessmentAssignment).filter(
                AssessmentAssignment.assessment_id == first_assessment.id,
                AssessmentAssignment.patient_id == demo_patient.id
            ).first()
            if not existing_aa:
                aa = AssessmentAssignment(
                    id=uuid.uuid4(),
                    assessment_id=first_assessment.id,
                    patient_id=demo_patient.id,
                    assigned_by=admin_user.id,
                    status="assigned",
                    instructions="Complete this assessment to establish your baseline interview preparation readiness."
                )
                db.add(aa)
                print(f"[SEED] Auto-assigned Assessment '{first_assessment.title}' to Demo Patient")

        db.commit()
        print("[SEED] Seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] Seeding failed: {e}")
        raise e
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    seed_all()
