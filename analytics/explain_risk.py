import pandas as pd
import os

# --------------------------------------------------
# FILE PATHS
# --------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATA_DIR = os.path.join(BASE_DIR, "Data")

RISK_FILE = os.path.join(
    DATA_DIR,
    "project_risk.csv"
)

PREDICTION_FILE = os.path.join(
    DATA_DIR,
    "project_predictions.csv"
)

OUTPUT_FILE = os.path.join(
    DATA_DIR,
    "project_risk_explained.csv"
)

# --------------------------------------------------
# LOAD DATA
# --------------------------------------------------

projects = pd.read_csv(RISK_FILE)

predictions = pd.read_csv(
    PREDICTION_FILE
)

# --------------------------------------------------
# MERGE ML PREDICTIONS
# --------------------------------------------------

projects = projects.merge(
    predictions[
        [
            "project_id",
            "time_overrun_probability",
            "cost_overrun_probability",
            "overall_prediction_risk"
        ]
    ],
    on="project_id",
    how="left"
)


# --------------------------------------------------
# EXPLAIN RISK
# --------------------------------------------------

def explain_risk(row):

    reasons = []

    # ----------------------------------------------
    # ML PREDICTION SIGNALS
    # ----------------------------------------------

    time_risk = row["time_overrun_probability"]

    cost_risk_prediction = row[
        "cost_overrun_probability"
    ]

    if time_risk >= 70:

        reasons.append(
            f"ML model predicts high time-overrun risk "
            f"({time_risk:.1f}%)"
        )

    elif time_risk >= 40:

        reasons.append(
            f"ML model predicts moderate time-overrun risk "
            f"({time_risk:.1f}%)"
        )

    if cost_risk_prediction >= 70:

        reasons.append(
            f"ML model predicts high cost-overrun risk "
            f"({cost_risk_prediction:.1f}%)"
        )

    elif cost_risk_prediction >= 40:

        reasons.append(
            f"ML model predicts moderate cost-overrun risk "
            f"({cost_risk_prediction:.1f}%)"
        )

    # ----------------------------------------------
    # PROGRESS GAP
    # ----------------------------------------------

    progress_gap = (
        row["planned_progress"]
        - row["actual_progress"]
    )

    if progress_gap >= 15:

        reasons.append(
            f"Progress is {progress_gap:.1f}% behind plan"
        )

    elif progress_gap >= 8:

        reasons.append(
            f"Progress is {progress_gap:.1f}% behind plan"
        )

    # ----------------------------------------------
    # OVERDUE MILESTONES
    # ----------------------------------------------

    if row["overdue_milestones"] >= 3:

        reasons.append(
            f"{int(row['overdue_milestones'])} "
            "milestones are overdue"
        )

    elif row["overdue_milestones"] > 0:

        reasons.append(
            f"{int(row['overdue_milestones'])} "
            "milestone(s) are overdue"
        )

    # ----------------------------------------------
    # SCHEDULE
    # ----------------------------------------------

    if row["schedule_health"] < 40:

        reasons.append(
            "Significant schedule delay detected"
        )

    elif row["schedule_health"] < 70:

        reasons.append(
            "Schedule performance needs attention"
        )

    # ----------------------------------------------
    # EXISTING COST SIGNAL
    # ----------------------------------------------

    if row["cost_risk"] >= 70:

        reasons.append(
            "High cost overrun risk detected"
        )

    elif row["cost_risk"] >= 40:

        reasons.append(
            "Cost performance needs attention"
        )

    # ----------------------------------------------
    # TREND
    # ----------------------------------------------

    if row["trend_health"] < 40:

        reasons.append(
            "Recent progress trend is weak"
        )

    # ----------------------------------------------
    # FALLBACK
    # ----------------------------------------------

    if not reasons:

        reasons.append(
            "No major risk driver detected"
        )

    return " | ".join(reasons)


# --------------------------------------------------
# GENERATE EXPLANATIONS
# --------------------------------------------------

projects["risk_explanation"] = projects.apply(
    explain_risk,
    axis=1
)


# --------------------------------------------------
# SAVE
# --------------------------------------------------

projects.to_csv(
    OUTPUT_FILE,
    index=False
)

print("Risk explanation generated!")

print()

print(
    projects[
        [
            "project_id",
            "risk_level",
            "time_overrun_probability",
            "cost_overrun_probability",
            "overall_prediction_risk",
            "risk_explanation"
        ]
    ]
    .head(10)
    .to_string(index=False)
)

print()

print(
    f"Explanation file saved: {OUTPUT_FILE}"
)