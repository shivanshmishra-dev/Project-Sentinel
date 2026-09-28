import pandas as pd
from datetime import datetime

# Load datasets
projects = pd.read_csv("data/projects.csv")
progress = pd.read_csv("data/progress_history.csv")

today = pd.Timestamp.today()


# -----------------------------
# 1. PROGRESS HEALTH
# -----------------------------

projects["progress_health"] = (
    projects["actual_progress"] /
    projects["planned_progress"] * 100
).clip(0, 100)


# -----------------------------
# 2. MILESTONE HEALTH
# -----------------------------

completion_rate = (
    projects["completed_milestones"] /
    projects["total_milestones"] * 100
)

projects["milestone_health"] = (
    completion_rate -
    projects["overdue_milestones"] * 5
).clip(0, 100)


# -----------------------------
# 3. COST HEALTH
# -----------------------------

cost_utilization = (
    projects["expenditure"] /
    projects["sanctioned_cost"] * 100
)

cost_divergence = (
    cost_utilization -
    projects["actual_progress"]
)

projects["cost_health"] = (
    100 - cost_divergence
).clip(0, 100)


# -----------------------------
# 4. SCHEDULE HEALTH
# -----------------------------

projects["revised_completion_date"] = pd.to_datetime(
    projects["revised_completion_date"]
)

projects["schedule_delay_days"] = (
    today - projects["revised_completion_date"]
).dt.days.clip(lower=0)

projects["schedule_health"] = (
    100 -
    projects["schedule_delay_days"] / 180 * 100
).clip(0, 100)


# -----------------------------
# 5. TREND HEALTH
# -----------------------------

trend_scores = []

for project_id in projects["project_id"]:

    history = progress[
        progress["project_id"] == project_id
    ].sort_values("reporting_month")

    if len(history) >= 2:

        first_progress = history["actual_progress"].iloc[0]
        last_progress = history["actual_progress"].iloc[-1]

        trend = (
            last_progress - first_progress
        ) / (len(history) - 1)

        trend_health = min(
            100,
            max(0, trend / 15 * 100)
        )

    else:
        trend_health = 50

    trend_scores.append(trend_health)


projects["trend_health"] = trend_scores


# -----------------------------
# FINAL HEALTH SCORE
# -----------------------------

projects["health_score"] = (
    projects["schedule_health"] * 0.25 +
    projects["progress_health"] * 0.25 +
    projects["milestone_health"] * 0.20 +
    projects["cost_health"] * 0.15 +
    projects["trend_health"] * 0.15
).round(2)


# -----------------------------
# HEALTH CATEGORY
# -----------------------------

def get_category(score):

    if score >= 80:
        return "Healthy"

    elif score >= 60:
        return "Watch"

    elif score >= 40:
        return "At Risk"

    else:
        return "Critical"


projects["health_category"] = (
    projects["health_score"].apply(get_category)
)


# Save result

projects.to_csv(
    "data/project_scores.csv",
    index=False
)


print("Health scores generated successfully!")
print()
print(
    projects[
        [
            "project_id",
            "health_score",
            "health_category"
        ]
    ].head(10)
)

print()
print("Category distribution:")
print(projects["health_category"].value_counts())