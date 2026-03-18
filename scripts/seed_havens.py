#!/usr/bin/env python3
"""Seed database with sample safe haven data for demo purposes."""
import sys
import uuid
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "api"))

from app.db.crisis_models import SafeHaven
from app.db.session import SessionLocal


DEMO_HAVENS = [
    {
        "name": "Central Emergency Shelter",
        "type": "shelter",
        "lat": 35.1234,
        "lon": 36.5678,
        "address": "123 Main Street, City Center",
        "services": ["food", "water", "medical", "translation", "family_tracing"],
        "hours": "24/7",
        "intake_rules": "Open to all families. Priority for children and elderly.",
        "capacity_status": "available",
        "verification_tier": "official",
        "contact_info": "+123-456-7890",
        "notes": "Verified by UN Refugee Agency. Food distributed 3x daily.",
    },
    {
        "name": "City General Hospital",
        "type": "hospital",
        "lat": 35.1567,
        "lon": 36.5234,
        "address": "456 Hospital Road",
        "services": ["emergency_medical", "surgery", "pharmacy", "maternity"],
        "hours": "24/7",
        "intake_rules": "Emergency cases prioritized. Bring ID if possible.",
        "capacity_status": "limited",
        "verification_tier": "official",
        "contact_info": "+123-456-7891",
        "notes": "ER open 24/7. Non-emergency patients may wait.",
    },
    {
        "name": "US Embassy Consular Section",
        "type": "embassy",
        "lat": 35.1890,
        "lon": 36.5890,
        "address": "789 Embassy Avenue",
        "services": ["documentation", "legal_aid", "consular_services", "translation"],
        "hours": "Mon-Fri 8am-5pm",
        "intake_rules": "US citizens and eligible family members only. Appointment preferred.",
        "capacity_status": "available",
        "verification_tier": "official",
        "contact_info": "+123-456-7892",
        "notes": "For US citizens needing evacuation assistance or documents.",
    },
    {
        "name": "Red Crescent Aid Distribution Center",
        "type": "aid_station",
        "lat": 35.1111,
        "lon": 36.6111,
        "address": "321 Relief Street",
        "services": ["food", "water", "clothing", "hygiene_kits", "blankets"],
        "hours": "Daily 9am-6pm",
        "intake_rules": "No restrictions. Bring family members.",
        "capacity_status": "available",
        "verification_tier": "official",
        "contact_info": "+123-456-7893",
        "notes": "Weekly food packages available. Hygiene kits for families.",
    },
    {
        "name": "Community Water Point - North District",
        "type": "water_point",
        "lat": 35.2234,
        "lon": 36.5234,
        "address": "North District Square",
        "services": ["water", "sanitation"],
        "hours": "24/7",
        "intake_rules": "Free for all. Bring containers.",
        "capacity_status": "available",
        "verification_tier": "verified",
        "contact_info": "",
        "notes": "Clean drinking water. Tested daily. Max 20L per family.",
    },
    {
        "name": "St. Mary's Clinic",
        "type": "hospital",
        "lat": 35.0999,
        "lon": 36.5999,
        "address": "555 Church Lane",
        "services": ["medical", "pharmacy", "vaccination", "prenatal_care"],
        "hours": "Mon-Sat 8am-4pm",
        "intake_rules": "Walk-ins welcome. Free for families in need.",
        "capacity_status": "available",
        "verification_tier": "verified",
        "contact_info": "+123-456-7894",
        "notes": "Volunteer doctors. Limited medication supply.",
    },
    {
        "name": "International School Shelter",
        "type": "shelter",
        "lat": 35.1750,
        "lon": 36.6250,
        "address": "777 School Road",
        "services": ["shelter", "education", "childcare", "food"],
        "hours": "24/7",
        "intake_rules": "Families with school-age children prioritized.",
        "capacity_status": "limited",
        "verification_tier": "verified",
        "contact_info": "+123-456-7895",
        "notes": "Temporary classrooms for children. 150 bed capacity - near full.",
    },
    {
        "name": "Community Center Safe Space",
        "type": "shelter",
        "lat": 35.1450,
        "lon": 36.5450,
        "address": "999 Community Way",
        "services": ["shelter", "food", "water", "charging_station"],
        "hours": "Daily 6am-10pm",
        "intake_rules": "Daytime shelter only. No overnight stays.",
        "capacity_status": "available",
        "verification_tier": "community",
        "contact_info": "",
        "notes": "Community-managed. 3 reports confirm services available.",
    },
    {
        "name": "Green Park Aid Station",
        "type": "aid_station",
        "lat": 35.2100,
        "lon": 36.6100,
        "address": "Green Park, East Entrance",
        "services": ["food", "water", "first_aid", "phone_charging"],
        "hours": "Daily 10am-6pm",
        "intake_rules": "Free for all.",
        "capacity_status": "available",
        "verification_tier": "community",
        "contact_info": "",
        "notes": "Volunteer-run. Hot meals at noon. Power bank sharing.",
    },
    {
        "name": "Downtown Mosque Shelter",
        "type": "shelter",
        "lat": 35.1300,
        "lon": 36.5700,
        "address": "Downtown Mosque Complex",
        "services": ["shelter", "food", "water", "prayer_space"],
        "hours": "24/7",
        "intake_rules": "Open to all faiths. Respectful behavior required.",
        "capacity_status": "full",
        "verification_tier": "verified",
        "contact_info": "+123-456-7896",
        "notes": "Capacity reached. Overflow directed to Central Shelter.",
    },
]


def seed_havens():
    """Seed the database with demo safe haven data."""
    db = SessionLocal()
    
    try:
        # Check if havens already exist
        existing_count = db.query(SafeHaven).count()
        if existing_count > 0:
            print(f"⚠️  Database already contains {existing_count} havens.")
            response = input("Delete existing and re-seed? (yes/no): ")
            if response.lower() != "yes":
                print("Cancelled.")
                return
            
            # Delete existing
            db.query(SafeHaven).delete()
            db.commit()
            print("🗑️  Deleted existing havens.")
        
        # Insert demo havens
        for haven_data in DEMO_HAVENS:
            haven = SafeHaven(
                id=str(uuid.uuid4()),
                **haven_data
            )
            db.add(haven)
        
        db.commit()
        print(f"✅ Successfully seeded {len(DEMO_HAVENS)} safe havens!")
        
        # Print summary
        print("\n📊 Haven Summary:")
        for haven_type in ["shelter", "hospital", "embassy", "aid_station", "water_point"]:
            count = sum(1 for h in DEMO_HAVENS if h["type"] == haven_type)
            print(f"  {haven_type}: {count}")
        
        print("\n🏅 Verification Tiers:")
        for tier in ["official", "verified", "community"]:
            count = sum(1 for h in DEMO_HAVENS if h["verification_tier"] == tier)
            print(f"  {tier}: {count}")
        
        print("\n💡 Next steps:")
        print("  1. Start the app: docker compose up")
        print("  2. Visit: http://localhost:3000/crisis")
        print("  3. Allow location or use default (35.15, 36.57)")
        print("  4. See havens on map!")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 LifeBridge Crisis Corridor - Haven Seeder")
    print("=" * 50)
    seed_havens()
