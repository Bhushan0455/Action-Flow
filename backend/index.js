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
const excelFilePath = path.join(__dirname, '..', 'intern_assignment_support_pack_dev_only_v3.xlsx');
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
  const metrics = calculateMetricsForDev(req.params.developerId);
  
  let insightText = "";
  let rawActions = [];

  // 1. Cycle Time Rules
  if (metrics.cycleTime > 4) {
    insightText += "Cycle time is high, indicating slower task completion. ";
    rawActions.push({ text: "Break tasks into smaller issues", metric: "Cycle Time" });
  } else if (metrics.cycleTime >= 2 && metrics.cycleTime <= 4) {
    insightText += "Cycle time is moderate. ";
  }

  // 2. PR Throughput Rules
  if (metrics.prThroughput < 3) {
    insightText += "PR throughput is low, suggesting delays in merging code. ";
    rawActions.push({ text: "Improve PR review turnaround time", metric: "PR Throughput" });
  } else if (metrics.prThroughput > 6) {
    insightText += "PR throughput is high, indicating good development velocity. ";
  }

  // 3. Lead Time Rules
  if (metrics.leadTime > 4) {
    insightText += "Lead time is high, meaning changes take longer to reach production. ";
    rawActions.push({ text: "Reduce PR size and batch smaller changes", metric: "Lead Time" });
  } else if (metrics.leadTime < 2) {
    insightText += "Lead time is efficient. ";
  }

  // 4. Bug Rate Rules (Note: metrics.bugRate is a percentage 0-100)
  if (metrics.bugRate > 10) { // 10% is 0.1
    insightText += "High bug rate detected, indicating potential quality issues. ";
    rawActions.push({ text: "Increase testing and code reviews", metric: "Bug Rate" });
  } else if (metrics.bugRate === 0) {
    insightText += "No bugs reported, indicating strong code quality. ";
  }

  // 5. Deployment Frequency Rules
  if (metrics.deploymentFrequency < 2) {
    insightText += "Low deployment frequency suggests large or infrequent releases. ";
    rawActions.push({ text: "Deploy smaller changes more frequently", metric: "Deploy Freq" });
  } else if (metrics.deploymentFrequency > 5) {
    insightText += "Frequent deployments indicate a healthy CI/CD pipeline. ";
  }

  // 6. Combined Rules
  if (metrics.cycleTime > 4 && metrics.prThroughput < 3) {
    insightText += "This combination suggests development or review bottlenecks. ";
  }
  if (metrics.bugRate > 10 && metrics.deploymentFrequency > 5) {
    insightText += "Frequent releases with high bugs may indicate rushed deployments. ";
  }

  // Fallback if no rules matched
  if (!insightText) {
    insightText = "Your metrics indicate a steady and balanced development workflow.";
    rawActions.push({ text: "Continue maintaining current practices", metric: "General" });
  }

  // Deduplicate actions based on text
  const seenActions = new Set();
  const actions = [];
  rawActions.forEach(action => {
    if (!seenActions.has(action.text)) {
      seenActions.add(action.text);
      actions.push(action);
    }
  });

  res.json({
    insight: insightText.trim(),
    actions
  });
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
