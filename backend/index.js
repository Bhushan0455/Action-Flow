const express = require('express');
const cors = require('cors');
const xlsx = require('xlsx');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Load and parse Excel
console.log('Loading Excel data...');
const excelFilePath = path.join(__dirname, 'data.xlsx');
const workbook = xlsx.readFile(excelFilePath);

function sheetToJson(sheetName) {
  if (!workbook.Sheets[sheetName]) return [];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, dateNF: 'yyyy-mm-dd hh:mm:ss' });
}

const developers = sheetToJson('Dim_Developers');
const issues = sheetToJson('Fact_Jira_Issues');
const pullRequests = sheetToJson('Fact_Pull_Requests');
const deployments = sheetToJson('Fact_CI_Deployments');
const bugs = sheetToJson('Fact_Bug_Reports');

console.log('Data loaded successfully.');

// Helper to calculate difference in days
function getDiffInDays(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  return (end - start) / (1000 * 60 * 60 * 24);
}

function calculateMetricsForDev(devId) {
  const devIssues = issues.filter(i => i.developer_id === devId);
  const devPRs = pullRequests.filter(pr => pr.developer_id === devId && pr.status?.toLowerCase() === 'merged');
  const devDeployments = deployments.filter(d => d.developer_id === devId && d.status?.toLowerCase() === 'success');
  const devBugs = bugs.filter(b => b.developer_id === devId);

  // 1. Lead Time for Changes = Deployment Time - PR Open Time
  let totalLeadTime = 0;
  let leadTimeCount = 0;
  
  devDeployments.forEach(dep => {
    // try to find matching PR
    const pr = devPRs.find(p => p.pr_id === dep.pr_id);
    if (pr && pr.opened_at && dep.completed_at) {
      totalLeadTime += getDiffInDays(pr.opened_at, dep.completed_at);
      leadTimeCount++;
    } else if (dep.lead_time_days) { // Fallback if data provides it
      totalLeadTime += parseFloat(dep.lead_time_days) || 0;
      leadTimeCount++;
    }
  });
  const avgLeadTime = leadTimeCount > 0 ? (totalLeadTime / leadTimeCount) : 0;

  // 2. Cycle Time = Issue Done Time - Issue In Progress Time
  let totalCycleTime = 0;
  let cycleTimeCount = 0;
  devIssues.forEach(issue => {
    if (issue.status?.toLowerCase() === 'done') {
      if (issue.in_progress_at && issue.done_at) {
        totalCycleTime += getDiffInDays(issue.in_progress_at, issue.done_at);
        cycleTimeCount++;
      } else if (issue.cycle_time_days) {
        totalCycleTime += parseFloat(issue.cycle_time_days) || 0;
        cycleTimeCount++;
      }
    }
  });
  const avgCycleTime = cycleTimeCount > 0 ? (totalCycleTime / cycleTimeCount) : 0;

  // 3. Bug Rate = Number of Bugs / Number of Completed Issues
  const completedIssuesCount = devIssues.filter(i => i.status?.toLowerCase() === 'done').length;
  const bugRate = completedIssuesCount > 0 ? (devBugs.length / completedIssuesCount) * 100 : 0; // as percentage

  // 4. Deployment Frequency (per month)
  // Get unique months
  const depMonths = new Set();
  devDeployments.forEach(d => {
    if (d.month_deployed) depMonths.add(d.month_deployed);
    else if (d.completed_at) depMonths.add(d.completed_at.substring(0, 7)); // YYYY-MM
  });
  const numDepMonths = Math.max(1, depMonths.size);
  const deploymentFrequency = devDeployments.length / numDepMonths;

  // 5. PR Throughput (per month)
  const prMonths = new Set();
  devPRs.forEach(pr => {
    if (pr.month_merged) prMonths.add(pr.month_merged);
    else if (pr.merged_at) prMonths.add(pr.merged_at.substring(0, 7));
  });
  const numPrMonths = Math.max(1, prMonths.size);
  const prThroughput = devPRs.length / numPrMonths;

  return {
    leadTime: Number(avgLeadTime.toFixed(1)),
    cycleTime: Number(avgCycleTime.toFixed(1)),
    bugRate: Number(bugRate.toFixed(1)),
    deploymentFrequency: Number(deploymentFrequency.toFixed(1)),
    prThroughput: Number(prThroughput.toFixed(1)),
  };
}

// Get all developers for the dropdown
app.get('/developers', (req, res) => {
  const devs = developers.map(d => ({
    id: d.developer_id,
    name: d.developer_name,
    team: d.team_name
  }));
  res.json(devs);
});

app.get('/metrics/:developerId', (req, res) => {
  const metrics = calculateMetricsForDev(req.params.developerId);
  res.json(metrics);
});

app.get('/insights/:developerId', (req, res) => {
  const devId = req.params.developerId;
  const metrics = calculateMetricsForDev(devId);
  const dev = developers.find(d => d.developer_id === devId);
  const devName = dev ? dev.developer_name?.split(' ')[0] : 'This developer';
  
  let insightText = "";
  let rawActions = [];
  let stepNum = 1;

  // 1. Cycle Time Rules
  if (metrics.cycleTime > 4) {
    insightText += `Cycle time is ${metrics.cycleTime} days — tasks are taking longer than expected to move from in-progress to done. `;
    rawActions.push({
      step: stepNum++,
      text: `Break large tickets into smaller, independently shippable units — aim for tasks completable within 2-3 days to reduce the current ${metrics.cycleTime}-day average.`,
      metric: "Cycle Time"
    });
    rawActions.push({
      step: stepNum++,
      text: "Identify blockers in the workflow (waiting for review, unclear requirements, context switching) and address the top recurring one this sprint.",
      metric: "Cycle Time"
    });
  } else if (metrics.cycleTime >= 2 && metrics.cycleTime <= 4) {
    insightText += `Cycle time is ${metrics.cycleTime} days — within a healthy range but there's room to tighten. `;
    rawActions.push({
      step: stepNum++,
      text: `Cycle time of ${metrics.cycleTime} days is acceptable. Review if any outlier tasks are skewing the average and consider setting a 3-day soft limit per ticket.`,
      metric: "Cycle Time"
    });
  } else if (metrics.cycleTime > 0) {
    insightText += `Cycle time is ${metrics.cycleTime} days — excellent task throughput. `;
  }

  // 2. Lead Time Rules
  if (metrics.leadTime > 4) {
    insightText += `Lead time is ${metrics.leadTime} days, meaning changes take too long from PR open to production. `;
    rawActions.push({
      step: stepNum++,
      text: `Reduce PR size or ticket scope so feedback arrives faster — the current ${metrics.leadTime}-day lead time suggests PRs may be too large or reviews are delayed.`,
      metric: "Lead Time"
    });
    rawActions.push({
      step: stepNum++,
      text: "Separate review delay from deployment delay. If reviews are fast but deployment is slow, focus on CI/CD pipeline improvements instead.",
      metric: "Lead Time"
    });
  } else if (metrics.leadTime >= 2 && metrics.leadTime <= 4) {
    insightText += `Lead time is ${metrics.leadTime} days — moderate, with potential for improvement. `;
  } else if (metrics.leadTime > 0) {
    insightText += `Lead time is ${metrics.leadTime} days — changes are reaching production efficiently. `;
  }

  // 3. Bug Rate Rules
  if (metrics.bugRate > 30) {
    insightText += `Bug rate is ${metrics.bugRate}% — critical quality concern. `;
    rawActions.push({
      step: stepNum++,
      text: `Add one quality safeguard immediately: require at least one unit test per PR, since the ${metrics.bugRate}% bug rate suggests insufficient test coverage.`,
      metric: "Bug Rate"
    });
    rawActions.push({
      step: stepNum++,
      text: "Conduct a focused retrospective on the last 3 bugs — identify if they share a root cause (missing tests, unclear specs, or rushed reviews).",
      metric: "Bug Rate"
    });
  } else if (metrics.bugRate > 10) {
    insightText += `Bug rate is ${metrics.bugRate}% — above the healthy threshold, indicating potential quality gaps. `;
    rawActions.push({
      step: stepNum++,
      text: `Increase code review depth and consider adding automated linting or test coverage gates to reduce the ${metrics.bugRate}% bug rate.`,
      metric: "Bug Rate"
    });
  } else if (metrics.bugRate === 0) {
    insightText += "No bugs reported — strong code quality practices in place. ";
  } else {
    insightText += `Bug rate is ${metrics.bugRate}% — within acceptable range. `;
  }

  // 4. PR Throughput Rules
  if (metrics.prThroughput < 3) {
    insightText += `PR throughput is ${metrics.prThroughput}/month — development velocity needs attention. `;
    rawActions.push({
      step: stepNum++,
      text: `Improve PR review turnaround time — with only ${metrics.prThroughput} merged PRs per month, consider setting a 24-hour review SLA within the team.`,
      metric: "PR Throughput"
    });
  } else if (metrics.prThroughput > 6) {
    insightText += `PR throughput is ${metrics.prThroughput}/month — strong development velocity. `;
  } else {
    insightText += `PR throughput is ${metrics.prThroughput}/month — steady contribution pace. `;
  }

  // 5. Deployment Frequency Rules
  if (metrics.deploymentFrequency < 2) {
    insightText += `Deployment frequency is ${metrics.deploymentFrequency}/month — releases are infrequent, suggesting large batch deployments. `;
    rawActions.push({
      step: stepNum++,
      text: `Deploy smaller increments more frequently — at ${metrics.deploymentFrequency} deployments/month, batch sizes are likely too large, increasing risk per release.`,
      metric: "Deploy Freq"
    });
  } else if (metrics.deploymentFrequency > 5) {
    insightText += `Deployment frequency is ${metrics.deploymentFrequency}/month — healthy CI/CD cadence. `;
  } else {
    insightText += `Deployment frequency is ${metrics.deploymentFrequency}/month — reasonable release cadence. `;
  }

  // 6. Combined / Pattern Rules
  if (metrics.cycleTime > 4 && metrics.prThroughput < 3) {
    rawActions.push({
      step: stepNum++,
      text: "High cycle time combined with low PR throughput signals a bottleneck — investigate whether the constraint is in development speed, review wait times, or task complexity.",
      metric: "Bottleneck"
    });
  }
  if (metrics.bugRate > 10 && metrics.deploymentFrequency > 5) {
    rawActions.push({
      step: stepNum++,
      text: "Frequent releases with elevated bug rate may indicate rushed deployments — add a pre-deploy checklist or staging validation step before pushing to production.",
      metric: "Quality Gate"
    });
  }
  if (metrics.leadTime > 4 && metrics.bugRate > 10) {
    rawActions.push({
      step: stepNum++,
      text: "Both lead time and bug rate are elevated — prioritize code review quality over speed. A thorough review now will save debugging time later.",
      metric: "Trade-off"
    });
  }

  // Fallback if no issues detected
  if (rawActions.length === 0) {
    insightText += `${devName}'s metrics indicate a steady and balanced development workflow.`;
    rawActions.push({
      step: 1,
      text: "All metrics are within healthy ranges. Continue maintaining current practices and consider mentoring teammates who may benefit from your workflow.",
      metric: "General"
    });
  }

  // Deduplicate actions based on text
  const seenActions = new Set();
  const actions = [];
  let renumbered = 1;
  rawActions.forEach(action => {
    if (!seenActions.has(action.text)) {
      seenActions.add(action.text);
      actions.push({ ...action, step: renumbered++ });
    }
  });

  res.json({
    insight: insightText.trim(),
    actions
  });
});

// A simple route to check if the server is alive
app.get('/', (req, res) => {
   res.send('Action Flow API is running successfully!');
});

app.get('/trend/:developerId', (req, res) => {
  const devId = req.params.developerId;
  const devPRs = pullRequests.filter(pr => pr.developer_id === devId && pr.status?.toLowerCase() === 'merged');
  const devDeployments = deployments.filter(d => d.developer_id === devId && d.status?.toLowerCase() === 'success');
  
  // Aggregate by date (YYYY-MM-DD)
  const dataMap = {};
  
  devPRs.forEach(pr => {
    if (!pr.merged_at) return;
    const dateStr = pr.merged_at.split(' ')[0]; // Extract YYYY-MM-DD
    if (!dataMap[dateStr]) dataMap[dateStr] = { date: dateStr, prCounts: 0, deployments: 0 };
    dataMap[dateStr].prCounts++;
  });
  
  devDeployments.forEach(dep => {
    if (!dep.completed_at) return;
    const dateStr = dep.completed_at.split(' ')[0];
    if (!dataMap[dateStr]) dataMap[dateStr] = { date: dateStr, prCounts: 0, deployments: 0 };
    dataMap[dateStr].deployments++;
  });
  
  // Sort and take last 7 active days
  let sortedDates = Object.keys(dataMap).sort((a, b) => new Date(a) - new Date(b));
  // If too many dates, limit to recent ones (e.g., last 14)
  if (sortedDates.length > 14) {
    sortedDates = sortedDates.slice(-14);
  }
  
  const dates = [];
  const prCounts = [];
  const deploymentCounts = [];
  
  sortedDates.forEach(d => {
    // Format date as "Mar 25"
    const dateObj = new Date(d);
    const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dates.push(formatted);
    prCounts.push(dataMap[d].prCounts);
    deploymentCounts.push(dataMap[d].deployments);
  });
  
  res.json({
    dates,
    prCounts,
    deployments: deploymentCounts
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
