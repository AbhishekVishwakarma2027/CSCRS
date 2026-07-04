from database.connection import SessionLocal
from database.models.department import Department

db = SessionLocal()

departments = [
    {
        "name": "Sanitation",
        "description": "Garbage collection and waste management",
    },
    {
        "name": "Roads",
        "description": "Road repair and maintenance",
    },
    {
        "name": "Drainage",
        "description": "Drainage and flood management",
    },
    {
        "name": "Electricity",
        "description": "Electric pole maintenance",
    },
    {
        "name": "Street Lighting",
        "description": "Street light maintenance",
    },
]

for item in departments:

    exists = (
        db.query(Department)
        .filter(Department.name == item["name"])
        .first()
    )

    if not exists:
        db.add(Department(**item))

db.commit()

print("Departments seeded successfully.")