import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Load project data
df = pd.read_csv("Data/projects.csv")

# Convert dates
df["original_completion_date"] = pd.to_datetime(
    df["original_completion_date"]
)

df["revised_completion_date"] = pd.to_datetime(
    df["revised_completion_date"]
)

# --------------------------------------------------
# CREATE TARGET VARIABLES
# --------------------------------------------------

# Time overrun:
# 1 = revised completion is later than original completion
# 0 = no time overrun

df["time_overrun"] = (
    df["revised_completion_date"] >
    df["original_completion_date"]
).astype(int)

# Cost overrun:
# 1 = revised cost is higher than sanctioned cost
# 0 = no cost overrun

df["cost_overrun"] = (
    df["revised_cost"] >
    df["sanctioned_cost"]
).astype(int)

# --------------------------------------------------
# FEATURES
# --------------------------------------------------

features = [
    "sanctioned_cost",
    "expenditure",
    "planned_progress",
    "actual_progress",
    "total_milestones",
    "completed_milestones",
    "overdue_milestones"
]

X = df[features]

# --------------------------------------------------
# TIME OVERRUN MODEL
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    df["time_overrun"],
    test_size=0.2,
    random_state=42,
    stratify=df["time_overrun"]
)

time_model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)

time_model.fit(X_train, y_train)

time_predictions = time_model.predict(X_test)

print("\nTIME OVERRUN MODEL")
print("------------------")
print("Accuracy:",
      round(accuracy_score(y_test, time_predictions) * 100, 2),
      "%")

print(classification_report(y_test, time_predictions))


# --------------------------------------------------
# COST OVERRUN MODEL
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    df["cost_overrun"],
    test_size=0.2,
    random_state=42,
    stratify=df["cost_overrun"]
)

cost_model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)

cost_model.fit(X_train, y_train)

cost_predictions = cost_model.predict(X_test)

print("\nCOST OVERRUN MODEL")
print("------------------")
print("Accuracy:",
      round(accuracy_score(y_test, cost_predictions) * 100, 2),
      "%")

print(classification_report(y_test, cost_predictions))
# --------------------------------------------------
# GENERATE PROJECT-WISE RISK PROBABILITIES
# --------------------------------------------------

time_risk_probability = time_model.predict_proba(X)[:, 1]

cost_risk_probability = cost_model.predict_proba(X)[:, 1]

prediction_results = df[
    [
        "project_id",
        "project_name",
        "ministry",
        "sector",
        "state"
    ]
].copy()

prediction_results["time_overrun_probability"] = (
    time_risk_probability * 100
).round(2)

prediction_results["cost_overrun_probability"] = (
    cost_risk_probability * 100
).round(2)

# Overall predictive risk
prediction_results["overall_prediction_risk"] = (
    prediction_results["time_overrun_probability"] * 0.5
    + prediction_results["cost_overrun_probability"] * 0.5
).round(2)

prediction_results.to_csv(
    "Data/project_predictions.csv",
    index=False
)

print("\nPROJECT PREDICTIONS GENERATED")
print("-----------------------------")
print(
    prediction_results[
        [
            "project_id",
            "time_overrun_probability",
            "cost_overrun_probability",
            "overall_prediction_risk"
        ]
    ].head(10)
)

print("\nPrediction file saved:")
print("Data/project_predictions.csv")