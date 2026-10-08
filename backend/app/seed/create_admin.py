import uuid
from app.db.session import SessionLocal
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, DoctorProfile

def create_admin():
    db = SessionLocal()
    try:
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
            db.commit()
            print(f"[OK] Admin account provisioned: {settings.ADMIN_EMAIL}")
        else:
            print(f"[INFO] Admin account already exists: {settings.ADMIN_EMAIL}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
