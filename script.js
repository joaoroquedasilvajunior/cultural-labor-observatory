const data = window.CLO_DATA;
const cases = data.cases || [];
const selectedIds = new Set(data.selected_case_ids || []);

const formatNumber = (value) => new Intl.NumberFormat("en").format(value || 0);
const labelize = (value) => String(value || "unknown").replaceAll("_", " ");
const truncate = (value, length = 240) => {
  const text = String(value || "");
  return text.length > length ? `${text.slice(0, length).trim()}...` : text;
};
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const state = {
  search: "",
  region: "all",
  target: "all",
  evidence: "all",
  selectedCaseId: selectedIds.values().next().value || cases[0]?.case_id,
};

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function uniqueValues(key) {
  return Array.from(new Set(cases.map((item) => item[key] || "unknown"))).sort();
}

function populateSelect(id, values, firstLabel) {
  const select = document.getElementById(id);
  select.innerHTML = `<option value="all">${firstLabel}</option>`;
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = labelize(value);
    select.appendChild(option);
  });
}

function renderBars(id, values) {
  const wrap = document.getElementById(id);
  const entries = Object.entries(values || {}).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, count]) => count), 1);
  wrap.innerHTML = "";
  entries.forEach(([label, count]) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span>${escapeHtml(labelize(label))}</span>
      <span class="bar-track"><span class="bar-fill" style="--w: ${(count / max) * 100}%"></span></span>
      <strong>${formatNumber(count)}</strong>
    `;
    wrap.appendChild(row);
  });
}

function searchableText(item) {
  return [
    item.case_id,
    item.title,
    item.description,
    item.region_world,
    item.country,
    item.language,
    item.target_class,
    item.evidence_strength,
    ...(item.likely_event_types || []),
    ...(item.likely_actors || []),
    ...(item.likely_targets || []),
    ...(item.likely_issues || []),
  ]
    .join(" ")
    .toLowerCase();
}

function filteredCases() {
  const needle = state.search.toLowerCase();
  return cases.filter((item) => {
    if (state.region !== "all" && item.region_world !== state.region) return false;
    if (state.target !== "all" && item.target_class !== state.target) return false;
    if (state.evidence !== "all" && item.evidence_strength !== state.evidence) return false;
    if (needle && !searchableText(item).includes(needle)) return false;
    return true;
  });
}

function renderSelectedCases() {
  const wrap = document.getElementById("selected-cases");
  wrap.innerHTML = "";
  cases
    .filter((item) => item.selected_exemplar)
    .forEach((item) => {
      const card = document.createElement("article");
      card.className = "selected-card";
      card.innerHTML = `
        <p class="eyebrow">${escapeHtml(labelize(item.region_world))}</p>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(truncate(item.description, 420))}</p>
        <div class="tag-row">
          <span class="tag">${escapeHtml(item.country)}</span>
          <span class="tag">${escapeHtml(labelize(item.target_class))}</span>
          <span class="tag">${escapeHtml(labelize(item.evidence_strength))}</span>
          <span class="tag">${formatNumber((item.known_urls || []).length)} sources</span>
        </div>
      `;
      wrap.appendChild(card);
    });
}

function renderCaseList() {
  const list = document.getElementById("case-list");
  const resultCount = document.getElementById("result-count");
  const visible = filteredCases().sort((a, b) => {
    const selectedDelta = Number(b.selected_exemplar) - Number(a.selected_exemplar);
    if (selectedDelta) return selectedDelta;
    return a.title.localeCompare(b.title);
  });

  resultCount.textContent = `${formatNumber(visible.length)} ${visible.length === 1 ? "case" : "cases"}`;
  list.innerHTML = "";

  if (!visible.some((item) => item.case_id === state.selectedCaseId)) {
    state.selectedCaseId = visible[0]?.case_id || cases[0]?.case_id;
  }

  visible.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "case-card";
    button.setAttribute("aria-selected", String(item.case_id === state.selectedCaseId));
    button.innerHTML = `
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(truncate(item.description, 210))}</p>
      <div class="case-meta">
        <span>${escapeHtml(labelize(item.region_world))}</span>
        <span>${escapeHtml(item.country)}</span>
        <span>${escapeHtml(labelize(item.target_class))}</span>
        <span>${escapeHtml(labelize(item.evidence_strength))}</span>
      </div>
    `;
    button.addEventListener("click", () => {
      state.selectedCaseId = item.case_id;
      renderCaseList();
      renderCaseDetail();
    });
    list.appendChild(button);
  });

  renderCaseDetail();
}

function renderArray(title, values, limit = 8) {
  const items = (values || []).slice(0, limit);
  if (!items.length) return "";
  return `
    <div>
      <strong>${escapeHtml(title)}</strong>
      <ul>${items.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>
    </div>
  `;
}

function sourceLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function renderCaseDetail() {
  const detail = document.getElementById("case-detail");
  const item = cases.find((candidate) => candidate.case_id === state.selectedCaseId);
  if (!item) {
    detail.innerHTML = `
      <p class="eyebrow">Case details</p>
      <h3>No case selected</h3>
      <p>Adjust the filters to choose a candidate case.</p>
    `;
    return;
  }

  const sources = (item.known_urls || []).slice(0, 6);
  detail.innerHTML = `
    <p class="eyebrow">${item.selected_exemplar ? "Selected exemplar" : "Candidate case"}</p>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.description)}</p>
    <div class="tag-row">
      <span class="tag">${escapeHtml(labelize(item.region_world))}</span>
      <span class="tag">${escapeHtml(item.country)}</span>
      <span class="tag">${escapeHtml(item.language)}</span>
      <span class="tag">${escapeHtml(labelize(item.evidence_strength))}</span>
    </div>
    <div class="detail-list">
      ${renderArray("Actors", item.likely_actors)}
      ${renderArray("Targets", item.likely_targets)}
      ${renderArray("Issues", item.likely_issues)}
      ${renderArray("Verification needs", item.verification_needs, 5)}
      <div>
        <strong>Public sources</strong>
        ${
          sources.length
            ? `<ul class="source-list">${sources
                .map((url) => `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceLabel(url))}</a></li>`)
                .join("")}</ul>`
            : "<p>No public source link stored in this snapshot.</p>"
        }
      </div>
    </div>
  `;
}

function renderMethodology() {
  const wrap = document.getElementById("methodology-text");
  wrap.innerHTML = "";
  (data.methodology || []).forEach((paragraph) => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    wrap.appendChild(p);
  });
}

function attachFilters() {
  document.getElementById("case-search").addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    renderCaseList();
  });
  document.getElementById("region-filter").addEventListener("change", (event) => {
    state.region = event.target.value;
    renderCaseList();
  });
  document.getElementById("target-filter").addEventListener("change", (event) => {
    state.target = event.target.value;
    renderCaseList();
  });
  document.getElementById("evidence-filter").addEventListener("change", (event) => {
    state.evidence = event.target.value;
    renderCaseList();
  });
}

function init() {
  const regionCount = Object.keys(data.summary.regions || {}).length;
  const streamingCount = data.summary.target_classes?.streaming_platforms || 0;
  setText("case-count", formatNumber(data.summary.case_seed_count));
  setText("region-count", formatNumber(regionCount));
  setText("streaming-count", formatNumber(streamingCount));
  setText("query-count", formatNumber(data.summary.query_count));
  setText("generated-at", `Generated ${new Date(data.generated_at).toLocaleString()}`);

  populateSelect("region-filter", uniqueValues("region_world"), "All regions");
  populateSelect("target-filter", uniqueValues("target_class"), "All targets");
  populateSelect("evidence-filter", uniqueValues("evidence_strength"), "All evidence");

  renderBars("region-bars", data.summary.regions);
  renderBars("target-bars", data.summary.target_classes);
  renderBars("evidence-bars", data.summary.evidence_strength);
  renderSelectedCases();
  renderMethodology();
  attachFilters();
  renderCaseList();
}

init();
