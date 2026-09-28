const csvUrl = "../data/project_sentinel_final.csv?v=6";


function getPredictionRiskLevel(project) {

    const risk =
        Number(project.overall_prediction_risk);


    if (risk >= 70) {
        return "High";
    }


    if (risk >= 40) {
        return "Medium";
    }


    return "Low";
}


let riskChart;
let healthChart;

let showAllProjects = false;

let dashboardData = [];


// =====================================================
// CSV DATA LOADER
// =====================================================

async function loadData() {

    const response =
        await fetch(csvUrl);


    if (!response.ok) {

        throw new Error(
            "Unable to load project data"
        );

    }


    const csvText =
        await response.text();


    const rows =
        csvText
            .trim()
            .split("\n");


    const headers =
        rows[0]
            .split(",")
            .map(
                header => header.trim()
            );


    const data =
        rows
            .slice(1)
            .map(row => {

                const values =
                    row.split(",");


                const project = {};


                headers.forEach(
                    (header, index) => {

                        project[header] =
                            values[index]?.trim() || "";

                    }
                );


                return project;

            });


    return data;
}



// =====================================================
// HEALTH DISTRIBUTION CALCULATOR
// =====================================================

function getHealthCounts(data) {

    const healthy =
        data.filter(
            project =>
                Number(project.health_score) >= 80
        ).length;


    const watch =
        data.filter(
            project =>
                Number(project.health_score) >= 60 &&
                Number(project.health_score) < 80
        ).length;


    const atRisk =
        data.filter(
            project =>
                Number(project.health_score) >= 40 &&
                Number(project.health_score) < 60
        ).length;


    const critical =
        data.filter(
            project =>
                Number(project.health_score) < 40
        ).length;


    return {
        healthy,
        watch,
        atRisk,
        critical
    };
}



// =====================================================
// UPDATE KPI CARDS
// =====================================================

function updateKPIs(data) {

    document.getElementById(
        "totalProjects"
    ).textContent = data.length;


    document.getElementById(
        "highRisk"
    ).textContent =

        data.filter(
            project =>
                getPredictionRiskLevel(project) === "High"
        ).length;


    document.getElementById(
        "mediumRisk"
    ).textContent =

        data.filter(
            project =>
                getPredictionRiskLevel(project) === "Medium"
        ).length;


    document.getElementById(
        "lowRisk"
    ).textContent =

        data.filter(
            project =>
                getPredictionRiskLevel(project) === "Low"
        ).length;
}



// =====================================================
// CREATE RISK CHART
// =====================================================

function createRiskChart(data) {

    const highRisk =
        data.filter(
            project =>
                getPredictionRiskLevel(project) === "High"
        ).length;


    const mediumRisk =
        data.filter(
            project =>
                getPredictionRiskLevel(project) === "Medium"
        ).length;


    const lowRisk =
        data.filter(
            project =>
                getPredictionRiskLevel(project) === "Low"
        ).length;


    riskChart =
        new Chart(
            document.getElementById("riskChart"),
            {

                type: "doughnut",


                data: {

                    labels: [
                        "High Risk",
                        "Medium Risk",
                        "Low Risk"
                    ],


                    datasets: [

                        {

                            data: [
                                highRisk,
                                mediumRisk,
                                lowRisk
                            ],


                            backgroundColor: [
                                "#dc2626",
                                "#f59e0b",
                                "#16a34a"
                            ],


                            borderWidth: 2,

                            borderColor: "#ffffff"

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: true,


                    plugins: {

                        legend: {
                            position: "bottom"
                        }

                    }

                }

            }
        );
}



// =====================================================
// CREATE HEALTH CHART
// =====================================================

function createHealthChart(data) {

    const counts =
        getHealthCounts(data);


    healthChart =
        new Chart(
            document.getElementById("healthChart"),
            {

                type: "bar",


                data: {

                    labels: [
                        "Healthy",
                        "Watch",
                        "At Risk",
                        "Critical"
                    ],


                    datasets: [

                        {

                            label: "Projects",


                            data: [
                                counts.healthy,
                                counts.watch,
                                counts.atRisk,
                                counts.critical
                            ],


                            backgroundColor: [
                                "#16a34a",
                                "#f59e0b",
                                "#f97316",
                                "#dc2626"
                            ],


                            borderRadius: 6

                        }

                    ]

                },


                options: {

                    responsive: true,

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {
                                precision: 0
                            }

                        }

                    }

                }

            }
        );
}



// =====================================================
// UPDATE CHARTS
// =====================================================

function updateCharts(data) {

    // -------------------------------------------------
    // RISK CHART
    // -------------------------------------------------

    const highRisk =
        data.filter(
            project =>
                getPredictionRiskLevel(project) === "High"
        ).length;


    const mediumRisk =
        data.filter(
            project =>
                getPredictionRiskLevel(project) === "Medium"
        ).length;


    const lowRisk =
        data.filter(
            project =>
                getPredictionRiskLevel(project) === "Low"
        ).length;


    riskChart.data.datasets[0].data = [

        highRisk,
        mediumRisk,
        lowRisk

    ];


    riskChart.data.labels = [

        `High Risk (${highRisk})`,
        `Medium Risk (${mediumRisk})`,
        `Low Risk (${lowRisk})`

    ];


    riskChart.update();


    // -------------------------------------------------
    // RISK CHART STATUS
    // -------------------------------------------------

    updateRiskChartStatus();


    // -------------------------------------------------
    // HEALTH CHART
    // -------------------------------------------------

    const counts =
        getHealthCounts(data);


    healthChart.data.datasets[0].data = [

        counts.healthy,
        counts.watch,
        counts.atRisk,
        counts.critical

    ];


    healthChart.update();
}



// =====================================================
// UPDATE RISK CHART STATUS
// =====================================================

function updateRiskChartStatus() {

    const risk =
        document.getElementById(
            "riskFilter"
        ).value;


    const status =
        document.getElementById(
            "riskChartStatus"
        );


    if (!status) {
        return;
    }


    if (risk === "All") {

        status.textContent =
            "All Projects";

        return;
    }


    status.textContent =
        `${risk} Risk Filtered`;
}



// =====================================================
// SEARCH MATCH
// =====================================================

function matchesSearch(project, searchTerm) {

    if (!searchTerm) {
        return true;
    }


    const searchableText = [

        project.project_id,

        project.project_name,

        project.ministry,

        project.sector,

        project.state

    ]
        .join(" ")
        .toLowerCase();


    return searchableText.includes(
        searchTerm.toLowerCase()
    );
}



// =====================================================
// RENDER PROJECT TABLE
// =====================================================

function renderProjectTable(data) {

    const table =
        document.getElementById(
            "projectTable"
        );


    table.innerHTML = "";


    // -------------------------------------------------
    // SORT BY PREDICTIVE RISK
    // -------------------------------------------------

    const sortedProjects =
        [...data].sort(
            (a, b) =>
                Number(
                    b.overall_prediction_risk
                ) -
                Number(
                    a.overall_prediction_risk
                )
        );


    // -------------------------------------------------
    // TOP 10 OR ALL
    // -------------------------------------------------

    const projectsToShow =
        showAllProjects
            ? sortedProjects
            : sortedProjects.slice(0, 10);


    // -------------------------------------------------
    // NO RESULTS
    // -------------------------------------------------

    if (
        projectsToShow.length === 0
    ) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td
                colspan="5"
                style="text-align:center; padding:25px;"
            >

                No projects found for the selected
                search or filters.

            </td>

        `;


        table.appendChild(row);


        updateViewButton();

        return;
    }


    // -------------------------------------------------
    // PROJECT ROWS
    // -------------------------------------------------

    projectsToShow.forEach(
        project => {

            let badgeClass = "low";


            const riskLevel =
                getPredictionRiskLevel(
                    project
                );


            if (
                riskLevel === "High"
            ) {

                badgeClass = "high";

            }
            else if (
                riskLevel === "Medium"
            ) {

                badgeClass = "medium";

            }


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${project.project_name}
                    <br>

                    <small
                        style="
                            color:#94a3b8;
                            font-size:11px;
                        "
                    >
                        ${project.project_id}
                    </small>
                </td>


                <td>
                    ${Number(
                        project.health_score
                    ).toFixed(2)}
                </td>


                <td>
                    ${Number(
                        project.overall_prediction_risk
                    ).toFixed(2)}%
                </td>


                <td>

                    <span
                        class="badge ${badgeClass}"
                    >
                        ${riskLevel}
                    </span>

                </td>


                <td>

                    <a
                        class="review-link"
                        href="project.html?id=${project.project_id}"
                    >
                        Review
                    </a>

                </td>

            `;


            table.appendChild(row);

        }
    );


    updateViewButton();
}



// =====================================================
// UPDATE VIEW ALL BUTTON
// =====================================================

function updateViewButton() {

    const button =
        document.getElementById(
            "viewAllBtn"
        );


    if (!button) {
        return;
    }


    button.textContent =
        showAllProjects
            ? "View Top 10"
            : "View All";
}



// =====================================================
// APPLY FILTERS + SEARCH
// =====================================================

function applyFilters() {

    const risk =
        document.getElementById(
            "riskFilter"
        ).value;


    const state =
        document.getElementById(
            "stateFilter"
        ).value;


    const sector =
        document.getElementById(
            "sectorFilter"
        ).value;


    const searchInput =
        document.getElementById(
            "projectSearch"
        );


    const searchTerm =
        searchInput
            ? searchInput.value.trim()
            : "";


    const filteredData =
        dashboardData.filter(
            project => {

                const riskMatch =
                    risk === "All" ||
                    getPredictionRiskLevel(
                        project
                    ) === risk;


                const stateMatch =
                    state === "All" ||
                    project.state === state;


                const sectorMatch =
                    sector === "All" ||
                    project.sector === sector;


                const searchMatch =
                    matchesSearch(
                        project,
                        searchTerm
                    );


                return (

                    riskMatch &&
                    stateMatch &&
                    sectorMatch &&
                    searchMatch

                );

            }
        );


    // -------------------------------------------------
    // UPDATE KPIs
    // -------------------------------------------------

    updateKPIs(
        filteredData
    );


    // -------------------------------------------------
    // UPDATE CHARTS
    // -------------------------------------------------

    updateCharts(
        filteredData
    );


    // -------------------------------------------------
    // UPDATE TABLE
    // -------------------------------------------------

    renderProjectTable(
        filteredData
    );


    // -------------------------------------------------
    // DESCRIPTION
    // -------------------------------------------------

    const description =
        document.getElementById(
            "tableDescription"
        );


    if (description) {

        if (
            searchTerm ||
            risk !== "All" ||
            state !== "All" ||
            sector !== "All"
        ) {

            description.textContent =
                `${filteredData.length} matching project(s)`;

        }
        else {

            description.textContent =
                "Projects with elevated monitoring risk";

        }

    }

}



// =====================================================
// POPULATE STATE FILTER
// =====================================================

function populateStateFilter() {

    const stateFilter =
        document.getElementById(
            "stateFilter"
        );


    const states = [

        ...new Set(

            dashboardData.map(
                project =>
                    project.state
            )

        )

    ].sort();


    states.forEach(
        state => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                state;


            option.textContent =
                state;


            stateFilter.appendChild(
                option
            );

        }
    );
}



// =====================================================
// POPULATE SECTOR FILTER
// =====================================================

function populateSectorFilter() {

    const sectorFilter =
        document.getElementById(
            "sectorFilter"
        );


    const sectors = [

        ...new Set(

            dashboardData.map(
                project =>
                    project.sector
            )

        )

    ].sort();


    sectors.forEach(
        sector => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                sector;


            option.textContent =
                sector;


            sectorFilter.appendChild(
                option
            );

        }
    );
}



// =====================================================
// FILTER + SEARCH EVENT LISTENERS
// =====================================================

function setupFilterEvents() {

    const riskFilter =
        document.getElementById(
            "riskFilter"
        );


    const stateFilter =
        document.getElementById(
            "stateFilter"
        );


    const sectorFilter =
        document.getElementById(
            "sectorFilter"
        );


    const projectSearch =
        document.getElementById(
            "projectSearch"
        );


    // -------------------------------------------------
    // RISK
    // -------------------------------------------------

    riskFilter.addEventListener(
        "change",
        () => {

            showAllProjects = false;

            applyFilters();

        }
    );


    // -------------------------------------------------
    // STATE
    // -------------------------------------------------

    stateFilter.addEventListener(
        "change",
        () => {

            showAllProjects = false;

            applyFilters();

        }
    );


    // -------------------------------------------------
    // SECTOR
    // -------------------------------------------------

    sectorFilter.addEventListener(
        "change",
        () => {

            showAllProjects = false;

            applyFilters();

        }
    );


    // -------------------------------------------------
    // SEARCH
    // -------------------------------------------------

    projectSearch.addEventListener(
        "input",
        () => {

            showAllProjects = false;

            applyFilters();

        }
    );
}



// =====================================================
// VIEW ALL / VIEW TOP 10
// =====================================================

function setupViewAllButton() {

    const button =
        document.getElementById(
            "viewAllBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            showAllProjects =
                !showAllProjects;


            applyFilters();

        }
    );
}



// =====================================================
// START DASHBOARD
// =====================================================

async function startDashboard() {

    try {

        // -------------------------------------------------
        // LOAD DATA
        // -------------------------------------------------

        dashboardData =
            await loadData();


        // -------------------------------------------------
        // INITIAL KPIs
        // -------------------------------------------------

        updateKPIs(
            dashboardData
        );


        // -------------------------------------------------
        // CREATE CHARTS
        // -------------------------------------------------

        createRiskChart(
            dashboardData
        );


        createHealthChart(
            dashboardData
        );


        // -------------------------------------------------
        // POPULATE FILTERS
        // -------------------------------------------------

        populateStateFilter();

        populateSectorFilter();


        // -------------------------------------------------
        // INITIAL TABLE
        // -------------------------------------------------

        renderProjectTable(
            dashboardData
        );


        // -------------------------------------------------
        // EVENTS
        // -------------------------------------------------

        setupFilterEvents();

        setupViewAllButton();


        // -------------------------------------------------
        // INITIAL CHART STATUS
        // -------------------------------------------------

        updateRiskChartStatus();


        console.log(
            "Project Sentinel dashboard loaded successfully."
        );

    }
    catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }
}



// =====================================================
// RUN
// =====================================================

startDashboard();