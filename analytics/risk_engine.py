import pandas as pd

# Load scored projects
projects = pd.read_csv("data/project_scores.csv")


# --------------------------------
# TIME OVERRUN RISK
# --------------------------------

projects["time_risk"] = (
    100
    - projects["schedule_health"]
    + (100 - projects["progress_health"]) * 0.5
    + projects["overdue_milestones"] * 3
).clip(0, 100).round(2)


# --------------------------------
# COST OVERRUN RISK
# --------------------------------

cost_overrun_ratio = (
    (projects["revised_cost"] - projects["sanctioned_cost"])
    / projects["sanctioned_cost"]
    * 100
)

projects["cost_risk"] = (
    cost_overrun_ratio * 2
    + (100 - projects["cost_health"]) * 0.7
).clip(0, 100).round(2)


# --------------------------------
# OVERALL RISK
# --------------------------------

projects["overall_risk"] = (
    projects["time_risk"] * 0.55
    + projects["cost_risk"] * 0.45
).round(2)


# --------------------------------
# RISK LEVEL
# --------------------------------

def risk_level(score):

    if score >= 70:
        return "High"

    elif score >= 40:
        return "Medium"

    else:
        return "Low"


projects["risk_level"] = (
    projects["overall_risk"].apply(risk_level)
)


# --------------------------------
# SAVE RESULT
# --------------------------------

projects.to_csv(
    "data/project_risk.csv",
    index=False
)


print("Risk engine completed!")
print()

print(
    projects[
        [
            "project_id",
            "health_score",
            "time_risk",
            "cost_risk",
            "overall_risk",
            "risk_level"
        ]
    ].head(10)
)

print()
print("Risk distribution:")
print(projects["risk_level"].value_counts())