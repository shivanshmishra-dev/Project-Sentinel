// ==================================================
// PROJECT SENTINEL
// PROJECT INTELLIGENCE PAGE
// ==================================================

const csvUrl =
    "Data/project_sentinel_final.csv?v=8";


// ==================================================
// GLOBAL STATE
// ==================================================

let currentProject = null;

let progressChartInstance = null;


// ==================================================
// HELPERS
// ==================================================

function number(value) {

    const parsed = Number(value);

    return Number.isFinite(parsed)
        ? parsed
        : 0;
}


function formatPercent(value, decimals = 1) {

    return `${number(value).toFixed(decimals)}%`;
}


function getRiskLevel(project) {

    const risk =
        number(project.overall_prediction_risk);

    if (risk >= 70) {
        return "HIGH";
    }

    if (risk >= 40) {
        return "MEDIUM";
    }

    return "LOW";
}


function getRiskColor(level) {

    if (level === "HIGH") {
        return "#b45309";
    }

    if (level === "MEDIUM") {
        return "#2563eb";
    }

    return "#15803d";
}


// ==================================================
// CSV PARSER
// ==================================================

function parseCSV(csvText) {

    const rows =
        csvText
            .trim()
            .split(/\r?\n/);

    if (!rows.length) {
        return [];
    }


    const headers =
        rows[0]
            .split(",")
            .map(header =>
                header.trim()
            );


    return rows
        .slice(1)
        .map(row => {

            const values =
                row.split(",");

            const object = {};


            headers.forEach(
                (header, index) => {

                    object[header] =
                        values[index]
                            ?.trim() || "";

                }
            );


            return object;

        });
}


// ==================================================
// LOAD PROJECT
// ==================================================

async function loadProject() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const projectId =
        params.get("id");


    if (!projectId) {

        document.getElementById(
            "projectName"
        ).textContent =
            "No project selected";

        return;

    }


    try {

        const response =
            await fetch(csvUrl);


        if (!response.ok) {

            throw new Error(
                "Project data could not be loaded."
            );

        }


        const csvText =
            await response.text();


        const data =
            parseCSV(csvText);


        const project =
            data.find(
                item =>
                    item.project_id === projectId
            );


        if (!project) {

            document.getElementById(
                "projectName"
            ).textContent =
                "Project not found";

            return;

        }


        currentProject =
            project;


        renderProject(project);


        setupDrillDown();


    }
    catch (error) {

        console.error(
            "Project loading error:",
            error
        );


        document.getElementById(
            "projectName"
        ).textContent =
            "Unable to load project";

    }

}


// ==================================================
// RENDER PROJECT
// ==================================================

function renderProject(project) {


    // --------------------------------------------------
    // NUMERIC VALUES
    // --------------------------------------------------

    const healthScore =
        number(project.health_score);

    const overallRisk =
        number(
            project.overall_prediction_risk
        );

    const timeRisk =
        number(
            project.time_overrun_probability
        );

    const costRisk =
        number(
            project.cost_overrun_probability
        );

    const plannedProgress =
        number(
            project.planned_progress
        );

    const actualProgress =
        number(
            project.actual_progress
        );

    const totalMilestones =
        number(
            project.total_milestones
        );

    const completedMilestones =
        number(
            project.completed_milestones
        );

    const overdueMilestones =
        number(
            project.overdue_milestones
        );

    const sanctionedCost =
        number(
            project.sanctioned_cost
        );

    const revisedCost =
        number(
            project.revised_cost
        );

    const expenditure =
        number(
            project.expenditure
        );

    const scheduleDelay =
        number(
            project.schedule_delay_days
        );


    // --------------------------------------------------
    // DERIVED VALUES
    // --------------------------------------------------

    const progressGap =
        Math.max(
            plannedProgress -
            actualProgress,
            0
        );


    const milestoneCompletion =
        totalMilestones > 0
            ? (
                completedMilestones /
                totalMilestones
            ) * 100
            : 0;


    const costIncrease =
        revisedCost -
        sanctionedCost;


    const costIncreasePercentage =
        sanctionedCost > 0
            ? (
                costIncrease /
                sanctionedCost
            ) * 100
            : 0;


    // ==================================================
    // HEADER
    // ==================================================

    document.getElementById(
        "projectName"
    ).textContent =
        project.project_name;


    document.getElementById(
        "projectInfo"
    ).textContent =
        `${project.project_id} • ` +
        `${project.ministry} • ` +
        `${project.sector} • ` +
        `${project.state}`;


    // ==================================================
    // KPI CARDS
    // ==================================================

    document.getElementById(
        "healthScore"
    ).textContent =
        healthScore.toFixed(2);


    document.getElementById(
        "overallRisk"
    ).textContent =
        formatPercent(
            overallRisk,
            2
        );


    document.getElementById(
        "timeRisk"
    ).textContent =
        formatPercent(
            timeRisk,
            2
        );


    document.getElementById(
        "costRisk"
    ).textContent =
        formatPercent(
            costRisk,
            2
        );


    document.getElementById(
        "timeRiskSecondary"
    ).textContent =
        formatPercent(
            timeRisk,
            2
        );


    document.getElementById(
        "costRiskSecondary"
    ).textContent =
        formatPercent(
            costRisk,
            2
        );


    // ==================================================
    // RISK BARS
    // ==================================================

    document.getElementById(
        "timeRiskBar"
    ).style.width =
        `${Math.min(
            timeRisk,
            100
        )}%`;


    document.getElementById(
        "costRiskBar"
    ).style.width =
        `${Math.min(
            costRisk,
            100
        )}%`;


    // ==================================================
    // RISK LEVEL
    // ==================================================

    const riskLevel =
        getRiskLevel(project);


    const riskBadge =
        document.querySelector(
            ".project-status-badge"
        );


    if (riskBadge) {

        riskBadge.innerHTML =
            `<span>●</span> ${riskLevel} PREDICTIVE RISK`;

        riskBadge.style.color =
            getRiskColor(riskLevel);

    }


    // ==================================================
    // EXECUTIVE SUMMARY
    // ==================================================

    const summaryHeading =
        document.querySelector(
            ".risk-summary h3"
        );


    if (summaryHeading) {

        if (overallRisk >= 70) {

            summaryHeading.textContent =
                "High predictive risk detected";

        }
        else if (overallRisk >= 40) {

            summaryHeading.textContent =
                "Project requires monitoring attention";

        }
        else {

            summaryHeading.textContent =
                "Project currently shows lower predictive risk";

        }

    }


    // --------------------------------------------------
    // EXECUTIVE SUMMARY TEXT
    // --------------------------------------------------

    let summaryParts = [];


    if (timeRisk >= 70) {

        summaryParts.push(
            `ML model predicts high time-overrun risk ` +
            `(${timeRisk.toFixed(1)}%)`
        );

    }
    else if (timeRisk >= 40) {

        summaryParts.push(
            `ML model indicates moderate time-overrun risk ` +
            `(${timeRisk.toFixed(1)}%)`
        );

    }


    if (costRisk >= 70) {

        summaryParts.push(
            `ML model predicts high cost-overrun risk ` +
            `(${costRisk.toFixed(1)}%)`
        );

    }
    else if (costRisk >= 40) {

        summaryParts.push(
            `ML model indicates moderate cost-overrun risk ` +
            `(${costRisk.toFixed(1)}%)`
        );

    }


    if (overdueMilestones > 0) {

        summaryParts.push(
            `${overdueMilestones} milestone(s) are overdue`
        );

    }


    if (progressGap > 0) {

        summaryParts.push(
            `project is ${progressGap.toFixed(1)} ` +
            `percentage points behind planned progress`
        );

    }


    if (scheduleDelay > 0) {

        summaryParts.push(
            `${scheduleDelay} days of schedule delay`
        );

    }


    if (!summaryParts.length) {

        summaryParts.push(
            "Current indicators do not show major predictive warning signals"
        );

    }


    document.getElementById(
        "riskExplanation"
    ).textContent =
        summaryParts.join(" | ");


    // ==================================================
    // RECOMMENDED ACTION
    // ==================================================

    document.getElementById(
        "recommendedAction"
    ).textContent =
        project.recommended_action ||
        "No specific action generated for this project.";


    const actionTag =
        document.getElementById(
            "actionTag"
        );


    if (actionTag) {

        if (overallRisk >= 70) {

            actionTag.textContent =
                "PRIORITY REVIEW";

        }
        else if (overallRisk >= 40) {

            actionTag.textContent =
                "MONITOR CLOSELY";

        }
        else {

            actionTag.textContent =
                "ROUTINE MONITORING";

        }

    }


    // ==================================================
    // EXPLAINABILITY
    // ==================================================

    document.getElementById(
        "progressDriver"
    ).textContent =
        `Actual progress is ${actualProgress.toFixed(1)}% ` +
        `against ${plannedProgress.toFixed(1)}% planned, ` +
        `creating a ${progressGap.toFixed(1)} ` +
        `percentage-point gap.`;


    document.getElementById(
        "milestoneDriver"
    ).textContent =
        `${completedMilestones} of ` +
        `${totalMilestones} milestones completed ` +
        `(${milestoneCompletion.toFixed(1)}%), ` +
        `with ${overdueMilestones} milestone(s) currently overdue` +
        (
            scheduleDelay > 0
                ? ` and ${scheduleDelay} days of schedule delay.`
                : "."
        );


    document.getElementById(
        "financialDriver"
    ).textContent =
        `Sanctioned cost is ₹${sanctionedCost.toFixed(2)} ` +
        `while revised cost is ₹${revisedCost.toFixed(2)}, ` +
        `an increase of ₹${costIncrease.toFixed(2)} ` +
        `(${costIncreasePercentage.toFixed(1)}%). ` +
        `Current expenditure is ₹${expenditure.toFixed(2)}.`;


    // ==================================================
    // PERFORMANCE
    // ==================================================

    document.getElementById(
        "plannedProgressValue"
    ).textContent =
        formatPercent(
            plannedProgress
        );


    document.getElementById(
        "actualProgressValue"
    ).textContent =
        formatPercent(
            actualProgress
        );


    document.getElementById(
        "progressGapValue"
    ).textContent =
        `${progressGap.toFixed(1)} points`;


    document.getElementById(
        "milestoneValue"
    ).textContent =
        `${completedMilestones}/${totalMilestones}`;


    document.getElementById(
        "overdueValue"
    ).textContent =
        overdueMilestones;


    document.getElementById(
        "scheduleDelayValue"
    ).textContent =
        `${scheduleDelay} days`;


    // ==================================================
    // PERFORMANCE STATUS
    // ==================================================

    const performanceStatus =
        document.getElementById(
            "performanceStatus"
        );


    if (performanceStatus) {

        if (progressGap >= 20) {

            performanceStatus.textContent =
                "SIGNIFICANT GAP";

        }
        else if (progressGap >= 10) {

            performanceStatus.textContent =
                "WATCH";

        }
        else {

            performanceStatus.textContent =
                "ON TRACK";

        }

    }

}


// ==================================================
// DRILL-DOWN SETUP
// ==================================================

function setupDrillDown() {

    if (!currentProject) {
        return;
    }


    const project =
        currentProject;


    // ==================================================
    // KPI CARDS
    // ==================================================

    const kpiCards =
        document.querySelectorAll(
            ".intelligence-card"
        );


    kpiCards.forEach(
        card => {

            card.classList.add(
                "clickable-card"
            );

        }
    );


    if (kpiCards[0]) {

        kpiCards[0].onclick =
            () => {

                openDetailModal(
                    "Project Health",
                    getHealthDetails(project)
                );

            };

    }


    if (kpiCards[1]) {

        kpiCards[1].onclick =
            () => {

                openDetailModal(
                    "Overall Prediction Risk",
                    getPredictionDetails(project)
                );

            };

    }


    if (kpiCards[2]) {

        kpiCards[2].onclick =
            () => {

                openDetailModal(
                    "Time-Overrun Risk",
                    getTimeRiskDetails(project)
                );

            };

    }


    if (kpiCards[3]) {

        kpiCards[3].onclick =
            () => {

                openDetailModal(
                    "Cost-Overrun Risk",
                    getCostRiskDetails(project)
                );

            };

    }


    // ==================================================
    // EXPLAINABILITY PANEL
    // ==================================================

    const explainabilityPanel =
        document.getElementById(
            "explainabilityPanel"
        );


    if (explainabilityPanel) {

        explainabilityPanel.classList.add(
            "clickable-detail-panel"
        );


        explainabilityPanel.onclick =
            event => {

                event.stopPropagation();

                openDetailModal(
                    "Risk Explainability",
                    getExplainDetails(project)
                );

            };

    }


    // ==================================================
    // EARLY WARNING PANEL
    // ==================================================

    const earlyWarningPanel =
        document.getElementById(
            "earlyWarningPanel"
        );


    if (earlyWarningPanel) {

        earlyWarningPanel.classList.add(
            "clickable-detail-panel"
        );


        earlyWarningPanel.onclick =
            event => {

                event.stopPropagation();

                openDetailModal(
                    "Predictive Early Warning",
                    getPredictionDetails(project)
                );

            };

    }


    // ==================================================
    // FRAMEWORK BOXES
    // ==================================================

    const frameworkBoxes =
        document.querySelectorAll(
            ".framework-list > div"
        );


    frameworkBoxes.forEach(
        box => {

            box.classList.add(
                "clickable-framework"
            );

        }
    );


    if (frameworkBoxes[0]) {

        frameworkBoxes[0].onclick =
            () => {

                openDetailModal(
                    "Monitor",
                    getMonitorDetails(project)
                );

            };

    }


    if (frameworkBoxes[1]) {

        frameworkBoxes[1].onclick =
            () => {

                openDetailModal(
                    "Predict",
                    getPredictionDetails(project)
                );

            };

    }


    if (frameworkBoxes[2]) {

        frameworkBoxes[2].onclick =
            () => {

                openDetailModal(
                    "Explain",
                    getExplainDetails(project)
                );

            };

    }


    if (frameworkBoxes[3]) {

        frameworkBoxes[3].onclick =
            () => {

                openDetailModal(
                    "Recommend",
                    getRecommendDetails(project)
                );

            };

    }

}


// ==================================================
// HEALTH DETAILS
// ==================================================

function getHealthDetails(project) {

    return `

        <div class="detail-intro">
            Composite monitoring assessment based on
            schedule, progress, milestones, cost and trend.
        </div>

        <div class="detail-grid">

            <div class="detail-metric">
                <span>Health Score</span>
                <strong>
                    ${number(project.health_score).toFixed(2)}
                </strong>
            </div>

            <div class="detail-metric">
                <span>Health Category</span>
                <strong>
                    ${project.health_category || "-"}
                </strong>
            </div>

            <div class="detail-metric">
                <span>Progress Health</span>
                <strong>
                    ${number(project.progress_health).toFixed(2)}
                </strong>
            </div>

            <div class="detail-metric">
                <span>Milestone Health</span>
                <strong>
                    ${number(project.milestone_health).toFixed(2)}
                </strong>
            </div>

            <div class="detail-metric">
                <span>Cost Health</span>
                <strong>
                    ${number(project.cost_health).toFixed(2)}
                </strong>
            </div>

            <div class="detail-metric">
                <span>Schedule Health</span>
                <strong>
                    ${number(project.schedule_health).toFixed(2)}
                </strong>
            </div>

            <div class="detail-metric">
                <span>Trend Health</span>
                <strong>
                    ${number(project.trend_health).toFixed(2)}
                </strong>
            </div>

            <div class="detail-metric">
                <span>Schedule Delay</span>
                <strong>
                    ${number(project.schedule_delay_days).toFixed(0)}
                    days
                </strong>
            </div>

        </div>

        <div class="detail-note">

            <strong>
                Assessment logic
            </strong>

            <p>
                Health Score combines schedule, progress,
                milestone, cost and trend health indicators.
            </p>

        </div>

    `;

}


// ==================================================
// PREDICTION DETAILS
// ==================================================

function getPredictionDetails(project) {

    return `

        <div class="detail-intro">
            Model-estimated early-warning probabilities
            for potential project time and cost overruns.
        </div>

        <div class="detail-grid">

            <div class="detail-metric">
                <span>
                    Overall Prediction Risk
                </span>

                <strong>
                    ${number(
                        project.overall_prediction_risk
                    ).toFixed(2)}%
                </strong>
            </div>

            <div class="detail-metric">
                <span>
                    Risk Level
                </span>

                <strong>
                    ${getRiskLevel(project)}
                </strong>
            </div>

            <div class="detail-metric">
                <span>
                    Time-Overrun Risk
                </span>

                <strong>
                    ${number(
                        project.time_overrun_probability
                    ).toFixed(2)}%
                </strong>
            </div>

            <div class="detail-metric">
                <span>
                    Cost-Overrun Risk
                </span>

                <strong>
                    ${number(
                        project.cost_overrun_probability
                    ).toFixed(2)}%
                </strong>
            </div>

        </div>

        <div class="detail-note">

            <strong>
                Prediction interpretation
            </strong>

            <p>
                These values represent model-estimated
                risk probabilities used for early-warning
                assessment.
            </p>

        </div>

    `;

}


// ==================================================
// TIME RISK DETAILS
// ==================================================

function getTimeRiskDetails(project) {

    const gap =
        Math.max(
            number(project.planned_progress) -
            number(project.actual_progress),
            0
        );


    return `

        <div class="detail-intro">
            Schedule-focused early-warning assessment.
        </div>

        <div class="detail-grid">

            <div class="detail-metric">
                <span>
                    Time-Overrun Probability
                </span>

                <strong>
                    ${number(
                        project.time_overrun_probability
                    ).toFixed(2)}%
                </strong>
            </div>

            <div class="detail-metric">
                <span>
                    Schedule Delay
                </span>

                <strong>
                    ${number(
                        project.schedule_delay_days
                    ).toFixed(0)}
                    days
                </strong>
            </div>

            <div class="detail-metric">
                <span>
                    Planned Progress
                </span>

                <strong>
                    ${number(
                        project.planned_progress
                    ).toFixed(1)}%
                </strong>
            </div>

            <div class="detail-metric">
                <span>
                    Actual Progress
                </span>

                <strong>
                    ${number(
                        project.actual_progress
                    ).toFixed(1)}%
                </strong>
            </div>

            <div class="detail-metric">
                <span>
                    Progress Gap
                </span>

                <strong>
                    ${gap.toFixed(1)} points
                </strong>
            </div>

            <div class="detail-metric">
                <span>
                    Overdue Milestones
                </span>

                <strong>
                    ${number(
                        project.overdue_milestones
                    )}
                </strong>
            </div>

        </div>

    `;

}


// ==================================================
// COST RISK DETAILS
// ==================================================

function getCostRiskDetails(project) {

    const sanctioned =
        number(project.sanctioned_cost);

    const revised =
        number(project.revised_cost);

    const increase =
        revised -
        sanctioned;

    const increasePercentage =
        sanctioned > 0
            ? (
                increase /
                sanctioned
            ) * 100
            : 0;


    return `

        <div class="detail-intro">
            Financial early-warning assessment based on
            sanctioned cost, revised cost and expenditure.
        </div>

        <div class="detail-grid">

            <div class="detail-metric">
                <span>
                    Cost-Overrun Probability
                </span>

                <strong>
                    ${number(
                        project.cost_overrun_probability
                    ).toFixed(2)}%
                </strong>
            </div>

            <div class="detail-metric">
                <span>
                    Sanctioned Cost
                </span>

                <strong>
                    ₹${sanctioned.toFixed(2)}
                </strong>
            </div>

            <div class="detail-metric">
                <span>
                    Revised Cost
                </span>

                <strong>
                    ₹${revised.toFixed(2)}
                </strong>
            </div>

            <div class="detail-metric">
                <span>
                    Cost Increase
                </span>

                <strong>
                    ₹${increase.toFixed(2)}
                </strong>
            </div>

            <div class="detail-metric">
                <span>
                    Increase %
                </span>

                <strong>
                    ${increasePercentage.toFixed(1)}%
                </strong>
            </div>

            <div class="detail-metric">
                <span>
                    Current Expenditure
                </span>

                <strong>
                    ₹${number(
                        project.expenditure
                    ).toFixed(2)}
                </strong>
            </div>

        </div>

    `;

}


// ==================================================
// MONITOR DETAILS
// ==================================================

function getMonitorDetails(project) {

    const planned =
        number(project.planned_progress);

    const actual =
        number(project.actual_progress);

    const gap =
        Math.max(
            planned - actual,
            0
        );


    return `

        <div class="detail-intro">
            Current project monitoring indicators used
            to establish the project's present condition.
        </div>

        <div class="detail-grid">

            <div class="detail-metric">
                <span>Planned Progress</span>
                <strong>
                    ${planned.toFixed(1)}%
                </strong>
            </div>

            <div class="detail-metric">
                <span>Actual Progress</span>
                <strong>
                    ${actual.toFixed(1)}%
                </strong>
            </div>

            <div class="detail-metric">
                <span>Progress Gap</span>
                <strong>
                    ${gap.toFixed(1)} points
                </strong>
            </div>

            <div class="detail-metric">
                <span>Milestones</span>
                <strong>
                    ${project.completed_milestones}/
                    ${project.total_milestones}
                </strong>
            </div>

            <div class="detail-metric">
                <span>Overdue Milestones</span>
                <strong>
                    ${project.overdue_milestones}
                </strong>
            </div>

            <div class="detail-metric">
                <span>Schedule Delay</span>
                <strong>
                    ${project.schedule_delay_days}
                    days
                </strong>
            </div>

            <div class="detail-metric">
                <span>Expenditure</span>
                <strong>
                    ₹${number(
                        project.expenditure
                    ).toFixed(2)}
                </strong>
            </div>

        </div>

    `;

}


// ==================================================
// EXPLAIN DETAILS
// ==================================================

function getExplainDetails(project) {

    const progressGap =
        Math.max(
            number(project.planned_progress) -
            number(project.actual_progress),
            0
        );


    return `

        <div class="detail-intro">
            Project-specific explanation generated from
            the current risk indicators.
        </div>

        <div class="explanation-box">

            ${
                project.risk_explanation ||
                "No major risk driver detected."
            }

        </div>

        <div class="detail-note">

            <strong>
                Key evidence
            </strong>

            <p>
                Progress gap:
                ${progressGap.toFixed(1)}
                percentage points
            </p>

            <p>
                Overdue milestones:
                ${project.overdue_milestones}
            </p>

            <p>
                Time-overrun risk:
                ${number(
                    project.time_overrun_probability
                ).toFixed(2)}%
            </p>

            <p>
                Cost-overrun risk:
                ${number(
                    project.cost_overrun_probability
                ).toFixed(2)}%
            </p>

        </div>

    `;

}


// ==================================================
// RECOMMEND DETAILS
// ==================================================

function getRecommendDetails(project) {

    return `

        <div class="detail-intro">
            Decision-support action generated from
            the project's current risk indicators.
        </div>

        <div class="recommendation-detail">

            <div class="recommendation-arrow">
                →
            </div>

            <div>

                <strong>
                    Recommended Intervention
                </strong>

                <p>
                    ${
                        project.recommended_action ||
                        "No specific action generated."
                    }
                </p>

            </div>

        </div>

        <div class="detail-note">

            <strong>
                Decision context
            </strong>

            <p>
                The recommendation considers predictive
                risk, progress performance and overdue
                milestones.
            </p>

        </div>

    `;

}


// ==================================================
// OPEN MODAL
// ==================================================

function openDetailModal(
    title,
    content
) {

    closeDetailModal();


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "projectDetailModal";


    modal.className =
        "detail-modal-overlay";


    modal.innerHTML = `

        <div
            class="detail-modal"
            role="dialog"
            aria-modal="true"
        >

            <div class="detail-modal-header">

                <div>

                    <span class="eyebrow">
                        PROJECT INTELLIGENCE
                    </span>

                    <h2>
                        ${title}
                    </h2>

                </div>


                <button
                    class="detail-modal-close"
                    id="detailModalClose"
                    type="button"
                    aria-label="Close"
                >
                    ×
                </button>

            </div>


            <div class="detail-modal-body">

                ${content}

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "detailModalClose"
        )
        .addEventListener(
            "click",
            closeDetailModal
        );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeDetailModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        handleModalEscape
    );

}


// ==================================================
// CLOSE MODAL
// ==================================================

function closeDetailModal() {

    const modal =
        document.getElementById(
            "projectDetailModal"
        );


    if (modal) {

        modal.remove();

    }


    document.removeEventListener(
        "keydown",
        handleModalEscape
    );

}


// ==================================================
// ESCAPE
// ==================================================

function handleModalEscape(
    event
) {

    if (
        event.key === "Escape"
    ) {

        closeDetailModal();

    }

}


// ==================================================
// PROGRESS HISTORY CHART
// ==================================================

async function loadProgressChart(
    projectId
) {

    try {

        const response =
            await fetch(
                "Data/progress_history.csv?v=4"
            );


        if (!response.ok) {

            throw new Error(
                "Progress history could not be loaded."
            );

        }


        const csvText =
            await response.text();


        const data =
            parseCSV(csvText);


        const projectHistory =
            data.filter(
                row =>
                    row.project_id ===
                    projectId
            );


        const canvas =
            document.getElementById(
                "progressChart"
            );


        if (
            !canvas ||
            projectHistory.length === 0
        ) {

            return;

        }


        if (
            progressChartInstance
        ) {

            progressChartInstance.destroy();

        }


        progressChartInstance =
            new Chart(
                canvas,
                {

                    type: "line",

                    data: {

                        labels:
                            projectHistory.map(
                                row =>
                                    row.reporting_month
                            ),

                        datasets: [

                            {

                                label:
                                    "Planned Progress",

                                data:
                                    projectHistory.map(
                                        row =>
                                            number(
                                                row.planned_progress
                                            )
                                    ),

                                tension: 0.3,

                                borderWidth: 2,

                                pointRadius: 3

                            },


                            {

                                label:
                                    "Actual Progress",

                                data:
                                    projectHistory.map(
                                        row =>
                                            number(
                                                row.actual_progress
                                            )
                                    ),

                                tension: 0.3,

                                borderWidth: 2,

                                pointRadius: 3

                            }

                        ]

                    },


                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        interaction: {

                            mode: "index",

                            intersect: false

                        },


                        plugins: {

                            legend: {

                                display: true,

                                position:
                                    "top"

                            }

                        },


                        scales: {

                            y: {

                                beginAtZero:
                                    true,

                                max:
                                    100,

                                title: {

                                    display:
                                        true,

                                    text:
                                        "Progress (%)"

                                }

                            },


                            x: {

                                title: {

                                    display:
                                        true,

                                    text:
                                        "Reporting Period"

                                }

                            }

                        }

                    }

                }
            );

    }
    catch (error) {

        console.error(
            "Progress chart error:",
            error
        );

    }

}


// ==================================================
// INITIALIZE
// ==================================================

loadProject()
    .then(
        () => {

            const params =
                new URLSearchParams(
                    window.location.search
                );


            const projectId =
                params.get("id");


            if (projectId) {

                loadProgressChart(
                    projectId
                );

            }

        }
    );