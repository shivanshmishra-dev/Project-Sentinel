import pandas as pd
import os

# --------------------------------------------------
# FILE PATHS
# --------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATA_DIR = os.path.join(BASE_DIR, "Data")

INPUT_FILE = os.path.join(
    DATA_DIR,
    "project_risk_explained.csv"
)

OUTPUT_FILE = os.path.join(
    DATA_DIR,
    "project_sentinel_final.csv"
)

# --------------------------------------------------
# LOAD DATA
# --------------------------------------------------

projects = pd.read_csv(INPUT_FILE)


# --------------------------------------------------
# RECOMMEND ACTION
# --------------------------------------------------

def recommend_action(row):

    actions = []

    # ----------------------------------------------
    # PREDICTED TIME-OVERRUN RISK
    # ----------------------------------------------

    time_risk = row["time_overrun_probability"]

    if time_risk >= 70:

        actions.append(
            "Initiate schedule review"
        )

    elif time_risk >= 40:

        actions.append(
            "Review upcoming milestones"
        )

    # ----------------------------------------------
    # PREDICTED COST-OVERRUN RISK
    # ----------------------------------------------

    cost_risk = row["cost_overrun_probability"]

    if cost_risk >= 70:

        actions.append(
            "Initiate cost review"
        )

    elif cost_risk >= 40:

        actions.append(
            "Review expenditure trend"
        )

    # ----------------------------------------------
    # PROGRESS GAP
    # ----------------------------------------------

    progress_gap = (
        row["planned_progress"]
        - row["actual_progress"]
    )

    if progress_gap >= 15:

        actions.append(
            "Conduct progress recovery review"
        )

    # ----------------------------------------------
    # OVERDUE MILESTONES
    # ----------------------------------------------

    if row["overdue_milestones"] >= 3:

        actions.append(
            "Escalate overdue milestones"
        )

    # ----------------------------------------------
    # OVERALL PREDICTED RISK
    # ----------------------------------------------

    overall_prediction_risk = row[
        "overall_prediction_risk"
    ]

    if overall_prediction_risk >= 70:

        actions.append(
            "Flag project for priority monitoring"
        )

    # ----------------------------------------------
    # HEALTHY / LOW-RISK PROJECT
    # ----------------------------------------------

    if not actions:

        actions.append(
            "Continue routine monitoring"
        )

    return " | ".join(actions)


# --------------------------------------------------
# GENERATE ACTIONS
# --------------------------------------------------

projects["recommended_action"] = projects.apply(
    recommend_action,
    axis=1
)


# --------------------------------------------------
# SAVE FINAL DATASET
# --------------------------------------------------

projects.to_csv(
    OUTPUT_FILE,
    index=False
)


# --------------------------------------------------
# OUTPUT
# --------------------------------------------------

print("Recommended actions generated!")

print()

print(
    projects[
        [
            "project_id",
            "time_overrun_probability",
            "cost_overrun_probability",
            "overall_prediction_risk",
            "recommended_action"
        ]
    ]
    .head(10)
    .to_string(index=False)
)

print()

print(
    f"Final file saved: {OUTPUT_FILE}"
)