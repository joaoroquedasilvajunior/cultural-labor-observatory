const data = window.CLO_DATA;
const cases = data.cases;

const formatNumber = (value) => new Intl.NumberFormat("en").format(value || 0);

document.getElementById("case-count").textContent = formatNumber(data.summary.case_seed_count);
document.getElementById("session-count").textContent = formatNumber(data.summary.session_count);
document.getElementById("query-count").textContent = formatNumber(data.summary.query_count);
document.getElementById("negative-count").textContent = formatNumber(data.summary.negative_result_count);
document.getElementById("generated-at").textContent = `Generated ${new Date(data.generated_at).toLocaleString()}`;

const selectedWrap = document.getElementById("selected-cases");
cases
  .filter((item) => item.selected_exemplar)
  .forEach((item) => {
    const card = document.createElement("section");
    card.className = "selected-item";
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <div class="tag-row">
        <span class="tag">${item.region_world}</span>
        <span class="tag">${item.country}</span>
        <span class="tag">${item.target_class}</span>
        <span class="tag">${item.evidence_strength}</span>
      </div>
    `;
    selectedWrap.appendChild(card);
  });

const regionBars = document.getElementById("region-bars");
const regionEntries = Object.entries(data.summary.regions).sort((a, b) => b[1] - a[1]);
const maxRegion = Math.max(...regionEntries.map(([, count]) => count), 1);
regionEntries.forEach(([region, count]) => {
  const row = document.createElement("div");
  row.className = "bar-row";
  row.innerHTML = `
    <span>${region.replaceAll("_", " ")}</span>
    <span class="bar-track"><span class="bar-fill" style="--w: ${(count / maxRegion) * 100}%"></span></span>
    <strong>${count}</strong>
  `;
  regionBars.appendChild(row);
});

const tableBody = document.getElementById("case-table");
const search = document.getElementById("case-search");

function matchesSearch(item, value) {
  if (!value) return true;
  const haystack = [
    item.case_id,
    item.title,
    item.description,
    item.region_world,
    item.country,
    item.language,
    item.target_class,
    item.evidence_strength,
    ...(item.likely_actors || []),
    ...(item.likely_targets || []),
    ...(item.likely_issues || []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(value.toLowerCase());
}

function renderTable() {
  const value = search.value.trim();
  const filtered = cases.filter((item) => matchesSearch(item, value));
  tableBody.innerHTML = "";
  filtered.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <strong>${item.title}</strong>
        <small>${item.case_id}</small>
      </td>
      <td>${item.region_world}<br><small>${item.country}</small></td>
      <td>${item.target_class}<br><small>${(item.likely_targets || []).slice(0, 3).join(", ")}</small></td>
      <td>${item.evidence_strength}<br><small>${item.status}</small></td>
    `;
    tableBody.appendChild(tr);
  });
}

search.addEventListener("input", renderTable);
renderTable();

const methodology = document.getElementById("methodology-text");
data.methodology.forEach((paragraph) => {
  const p = document.createElement("p");
  p.textContent = paragraph;
  methodology.appendChild(p);
});
