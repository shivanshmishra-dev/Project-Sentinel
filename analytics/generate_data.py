import pandas as pd
import random
import os
from datetime import datetime, timedelta

random.seed(42)

# --------------------------------------------------
# DATA DIRECTORY
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "Data")

projects = []

ministries = [
    "Ministry of Road Transport",
    "Ministry of Railways",
    "Ministry of Housing",
    "Ministry of Power",
    "Ministry of Jal Shakti"
]

sectors = [
    "Roads",
    "Railways",
    "Housing",
    "Power",
    "Water"
]

states = [
    "Uttar Pradesh",
    "Maharashtra",
    "Rajasthan",
    "Madhya Pradesh",
    "Bihar",
    "Gujarat",
    "Karnataka",
    "Tamil Nadu"
]

# --------------------------------------------------
# GENERATE PROJECT DATA
# --------------------------------------------------

for i in range(1, 101):

    start_date = datetime(2023, 1, 1) + timedelta(
        days=random.randint(0, 500)
    )

    duration_days = random.randint(500, 1200)

    original_completion = start_date + timedelta(
        days=duration_days
    )

    sanctioned_cost = random.randint(100, 2000)

    planned_progress = random.randint(40, 95)

    actual_progress = max(
        5,
        planned_progress - random.randint(-10, 35)
    )

    # --------------------------------------------------
    # SYNTHETIC RISK SIGNAL
    # Used only to create realistic prototype outcomes
    # --------------------------------------------------

    progress_gap = max(
        0,
        planned_progress - actual_progress
    ) / 35

    expenditure_ratio = random.uniform(0.25, 0.95)

    # --------------------------------------------------
    # MILESTONES
    # --------------------------------------------------

    total_milestones = random.randint(8, 25)

    completed_milestones = random.randint(
        max(0, total_milestones - 10),
        total_milestones
    )

    overdue_milestones = random.randint(
        0,
        max(0, total_milestones - completed_milestones)
    )

    overdue_ratio = (
        overdue_milestones / total_milestones
        if total_milestones > 0 else 0
    )

    # --------------------------------------------------
    # FUTURE TIME OVERRUN PROBABILITY
    # --------------------------------------------------

    time_overrun_probability = min(
        0.90,
        max(
            0.05,
            0.25
            + 0.45 * progress_gap
            + 0.25 * overdue_ratio
            + 0.05 * expenditure_ratio
        )
    )

    # --------------------------------------------------
    # FUTURE COST OVERRUN PROBABILITY
    # --------------------------------------------------

    cost_overrun_probability = min(
        0.90,
        max(
            0.05,
            0.15
            + 0.45 * expenditure_ratio
            + 0.25 * progress_gap
            + 0.15 * overdue_ratio
        )
    )

    # --------------------------------------------------
    # GENERATE FUTURE OUTCOMES
    # --------------------------------------------------

    time_overrun = (
        random.random() < time_overrun_probability
    )

    cost_overrun = (
        random.random() < cost_overrun_probability
    )

    # --------------------------------------------------
    # REVISED COMPLETION DATE
    # --------------------------------------------------

    if time_overrun:

        revised_completion = (
            original_completion
            + timedelta(days=random.randint(30, 300))
        )

    else:

        revised_completion = (
            original_completion
            - timedelta(days=random.randint(0, 30))
        )

    # --------------------------------------------------
    # REVISED COST
    # --------------------------------------------------

    if cost_overrun:

        revised_cost = (
            sanctioned_cost
            + random.randint(50, 500)
        )

    else:

        revised_cost = (
            sanctioned_cost
            - random.randint(
                0,
                max(1, int(sanctioned_cost * 0.05))
            )
        )

    # --------------------------------------------------
    # EXPENDITURE
    # --------------------------------------------------

    expenditure = round(
        sanctioned_cost * expenditure_ratio,
        2
    )

    # --------------------------------------------------
    # STORE PROJECT
    # --------------------------------------------------

    projects.append({
        "project_id": f"PRJ{i:03}",
        "project_name": f"Infrastructure Project {i:03}",
        "ministry": random.choice(ministries),
        "sector": random.choice(sectors),
        "state": random.choice(states),
        "sanctioned_cost": sanctioned_cost,
        "revised_cost": revised_cost,
        "expenditure": expenditure,
        "start_date": start_date.strftime("%Y-%m-%d"),
        "original_completion_date": original_completion.strftime(
            "%Y-%m-%d"
        ),
        "revised_completion_date": revised_completion.strftime(
            "%Y-%m-%d"
        ),
        "planned_progress": planned_progress,
        "actual_progress": actual_progress,
        "total_milestones": total_milestones,
        "completed_milestones": completed_milestones,
        "overdue_milestones": overdue_milestones
    })


# --------------------------------------------------
# SAVE PROJECT DATA
# --------------------------------------------------

df = pd.DataFrame(projects)

df.to_csv(
    os.path.join(DATA_DIR, "projects.csv"),
    index=False
)

print("Dataset generated successfully!")
print(f"Total projects: {len(df)}")
print(df.head())


# --------------------------------------------------
# GENERATE PROGRESS HISTORY
# --------------------------------------------------

progress_data = []

for project_id in df["project_id"]:

    current_progress = random.randint(5, 20)

    for month in range(1, 7):

        planned = min(
            95,
            current_progress + random.randint(8, 15)
        )

        actual = min(
            100,
            current_progress + random.randint(5, 15)
        )

        progress_data.append({
            "project_id": project_id,
            "reporting_month": f"2026-{month:02}",
            "planned_progress": planned,
            "actual_progress": actual
        })

        current_progress = actual


progress_df = pd.DataFrame(progress_data)

progress_df.to_csv(
    os.path.join(DATA_DIR, "progress_history.csv"),
    index=False
)

print("Progress history generated!")
print(f"Total progress records: {len(progress_df)}")


# --------------------------------------------------
# GENERATE MILESTONE DATA
# --------------------------------------------------

milestone_data = []

for project_id in df["project_id"]:

    total_milestones = int(
        df.loc[
            df["project_id"] == project_id,
            "total_milestones"
        ].iloc[0]
    )

    completed_milestones = int(
        df.loc[
            df["project_id"] == project_id,
            "completed_milestones"
        ].iloc[0]
    )

    start_date = pd.to_datetime(
        df.loc[
            df["project_id"] == project_id,
            "start_date"
        ].iloc[0]
    )

    for m in range(1, total_milestones + 1):

        planned_date = (
            start_date
            + pd.Timedelta(days=m * 60)
        )

        if m <= completed_milestones:

            actual_date = (
                planned_date
                + pd.Timedelta(
                    days=random.randint(-10, 15)
                )
            )

            status = "Completed"

        else:

            actual_date = ""

            status = "Pending"

        milestone_data.append({
            "milestone_id": f"{project_id}-M{m:02}",
            "project_id": project_id,
            "milestone_name": f"Milestone {m}",
            "planned_date": planned_date.strftime(
                "%Y-%m-%d"
            ),
            "actual_date": (
                actual_date.strftime("%Y-%m-%d")
                if actual_date != ""
                else ""
            ),
            "status": status
        })


milestones_df = pd.DataFrame(milestone_data)

milestones_df.to_csv(
    os.path.join(DATA_DIR, "milestones.csv"),
    index=False
)

print("Milestones generated!")
print(
    f"Total milestone records: {len(milestones_df)}"
)