"""Idempotent seed for the Barangay Health Center system.

Run: cd /app/backend && python seed.py
"""
import asyncio
import random
from datetime import date, datetime, timedelta, timezone

from lib.auth import calc_age, hash_password
from lib.db import db
from models.schemas import (Child, HealthRecord, Immunization, Patient,
                            Pregnancy, PrenatalVisit, User)

TODAY = datetime.now(timezone.utc).date()

USERS = [
    ("Dr. Maria Elena Santos", "admin", "administrator", "admin123", "active"),
    ("Rosalinda Dela Cruz, BHW", "healthworker", "health_worker", "worker123", "active"),
    ("Josefina Reyes, RM", "jreyes", "health_worker", "worker123", "active"),
    ("Ernesto Villanueva", "evillanueva", "health_worker", "worker123", "inactive"),
]

PATIENTS = [
    # name, birth_date, sex, civil, contact, purok, blood, occupation, philhealth, type
    ("Juan Miguel Dela Cruz", "1978-04-12", "Male", "Married", "0917-555-0142", "Purok 1, Brgy. San Isidro", "O+", "Tricycle Driver", "12-345678901-2", "general"),
    ("Corazon Santos-Reyes", "1996-09-03", "Female", "Married", "0918-555-0233", "Purok 3, Brgy. San Isidro", "A+", "Housewife", "12-345678902-3", "maternal"),
    ("Alfredo Bautista", "1955-01-27", "Male", "Widowed", "0920-555-0311", "Purok 2, Brgy. San Isidro", "B+", "Retired Farmer", "12-345678903-4", "senior"),
    ("Baby Angela Garcia", "2023-06-18", "Female", "Single", "0917-555-0455", "Purok 5, Brgy. San Isidro", "O+", "N/A", "", "pediatric"),
    ("Marissa Aquino", "1993-11-22", "Female", "Married", "0921-555-0566", "Purok 4, Brgy. San Isidro", "AB+", "Sari-sari Store Owner", "12-345678905-6", "maternal"),
    ("Ricardo Mendoza", "1988-02-14", "Male", "Married", "0916-555-0677", "Purok 6, Brgy. San Isidro", "A-", "Carpenter", "12-345678906-7", "general"),
    ("Lourdes Pascual", "1948-08-30", "Female", "Widowed", "0919-555-0788", "Purok 1, Brgy. San Isidro", "O-", "Retired Teacher", "12-345678907-8", "senior"),
    ("Kyle Matthew Ramos", "2019-03-09", "Male", "Single", "0917-555-0899", "Purok 7, Brgy. San Isidro", "B+", "N/A", "", "pediatric"),
    ("Divina Gracia Torres", "2001-12-05", "Female", "Single", "0922-555-0910", "Purok 3, Brgy. San Isidro", "A+", "Student", "12-345678909-0", "general"),
    ("Benigno Castillo", "1970-07-19", "Male", "Married", "0915-555-1021", "Purok 2, Brgy. San Isidro", "O+", "Fisherman", "12-345678910-1", "general"),
    ("Anna Liza Fernandez", "1999-05-16", "Female", "Married", "0923-555-1132", "Purok 5, Brgy. San Isidro", "B-", "Seamstress", "12-345678911-2", "maternal"),
    ("Baby Nathan Villareal", "2024-02-28", "Male", "Single", "0917-555-1243", "Purok 4, Brgy. San Isidro", "A+", "N/A", "", "pediatric"),
]

COMPLAINTS = [
    ("General Consultation", "Fever and body aches for 2 days", "Acute viral infection", "Paracetamol 500mg q6h, increased fluids"),
    ("General Consultation", "Elevated blood pressure, headache", "Hypertension Stage 1", "Amlodipine 5mg OD, low-salt diet"),
    ("Prenatal Check-up", "Routine prenatal monitoring", "Normal pregnancy, AOG appropriate", "Ferrous sulfate + folic acid daily"),
    ("Follow-up Check-up", "Follow-up for hypertension control", "Hypertension, controlled", "Continue maintenance medication"),
    ("Immunization", "Scheduled EPI vaccination", "Well child, for immunization", "Pentavalent dose administered"),
    ("General Consultation", "Persistent dry cough", "Acute bronchitis", "Salbutamol nebulization, rest"),
    ("Prenatal Check-up", "Third trimester check-up", "Normal pregnancy, cephalic", "Birth plan counselling given"),
    ("Follow-up Check-up", "Wound dressing follow-up", "Healing laceration, no infection", "Dressing changed, antibiotics continued"),
]

VACCINES = ["BCG", "Hepatitis B", "Pentavalent 1", "Pentavalent 2", "PCV 1", "OPV 1", "OPV 2", "MMR"]


async def main() -> None:
    if await db.patients.count_documents({}) > 0:
        print("Seed already applied — skipping.")
        return

    await db.users.delete_many({})
    workers = []
    for full_name, username, role, pwd, status in USERS:
        u = User(full_name=full_name, username=username, role=role, status=status)
        doc = u.model_dump()
        doc["password"] = hash_password(pwd)
        await db.users.insert_one(doc)
        workers.append(full_name)

    year = TODAY.year
    patients: list[Patient] = []
    for i, (name, bd, sex, civil, contact, addr, blood, occ, ph, ptype) in enumerate(PATIENTS, start=1):
        p = Patient(
            full_name=name, birth_date=bd, sex=sex, civil_status=civil, contact_number=contact,
            address=addr, blood_type=blood, occupation=occ, philhealth_number=ph, patient_type=ptype,
            patient_id=f"BHC-{year}-{i:04d}", age=calc_age(bd), registered_by=workers[0],
        )
        await db.patients.insert_one(p.model_dump())
        patients.append(p)

    # pregnancies + prenatal visits
    for idx, p in enumerate([x for x in patients if x.patient_type == "maternal"]):
        lmp = TODAY - timedelta(days=140 + idx * 30)
        preg = Pregnancy(
            patient_id=p.id, gravida=idx + 1, para=idx,
            expected_due_date=(lmp + timedelta(days=280)).isoformat(),
            last_menstrual_period=lmp.isoformat(),
            risk_type="High Risk" if idx == 1 else "Normal",
            notes="Advised iron and folic acid supplementation. Tetanus toxoid up to date."
            if idx != 1 else "Advanced maternal history of hypertension — monitor BP every visit.",
        )
        await db.pregnancies.insert_one(
            preg.model_dump(exclude={"patient_name", "patient_code", "patient_age", "blood_type"})
        )
        for w in range(3):
            vd = lmp + timedelta(days=90 + w * 30)
            if vd > TODAY:
                break
            v = PrenatalVisit(
                pregnancy_id=preg.id, visit_date=vd.isoformat(),
                pregnancy_week=(vd - lmp).days // 7,
                notes=["Initial prenatal work-up, baseline vitals normal.",
                       "Fundal height appropriate for age of gestation.",
                       "Fetal heart tones strong at 142 bpm."][w],
                health_worker=workers[2],
            )
            await db.prenatal_visits.insert_one(v.model_dump())

    # children + immunizations
    for p in [x for x in patients if x.patient_type == "pediatric"]:
        bd = date.fromisoformat(p.birth_date)
        child = Child(
            patient_id=p.id, mother_name=random.choice(["Corazon Santos-Reyes", "Marissa Aquino", "Anna Liza Fernandez"]),
            birth_weight=round(random.uniform(2.6, 3.6), 2),
            current_weight=round(random.uniform(6.5, 14.0), 2),
        )
        await db.children.insert_one(child.model_dump(
            exclude={"patient_name", "patient_code", "birth_date", "patient_age", "sex", "blood_type"}))
        for k, vac in enumerate(VACCINES[:5]):
            dg = bd + timedelta(days=k * 42)
            if dg > TODAY:
                break
            await db.immunizations.insert_one(
                Immunization(child_id=child.id, vaccine_name=vac, date_given=dg.isoformat(),
                             administered_by=workers[1]).model_dump()
            )

    # health records spread over this month + last month
    n = 0
    for offset in range(0, 46):
        d = TODAY - timedelta(days=offset)
        for _ in range(random.randint(0, 2)):
            n += 1
            p = random.choice(patients)
            ctype, complaint, dx, tx = random.choice(COMPLAINTS)
            rec = HealthRecord(
                patient_id=p.id, consultation_date=d.isoformat(), consultation_type=ctype,
                chief_complaint=complaint, diagnosis=dx, treatment=tx,
                notes="Patient advised to return if symptoms persist beyond 3 days.",
                record_id=f"REC-{year}-{n:04d}", health_worker=random.choice(workers[:3]),
                patient_name=p.full_name, patient_code=p.patient_id,
            )
            await db.health_records.insert_one(rec.model_dump())

    # guarantee a few consultations today
    for p in patients[:3]:
        n += 1
        ctype, complaint, dx, tx = random.choice(COMPLAINTS)
        await db.health_records.insert_one(HealthRecord(
            patient_id=p.id, consultation_date=TODAY.isoformat(), consultation_type=ctype,
            chief_complaint=complaint, diagnosis=dx, treatment=tx, notes="Walk-in consultation.",
            record_id=f"REC-{year}-{n:04d}", health_worker=workers[1],
            patient_name=p.full_name, patient_code=p.patient_id,
        ).model_dump())

    print(f"Seeded {len(patients)} patients, {n} health records, {len(USERS)} users.")


if __name__ == "__main__":
    asyncio.run(main())
