const state = {
  edition: null,
  activeFilter: "ALL",
};

const fallbackEdition = {
  date: new Date().toISOString().slice(0, 10),
  updatedAt: null,
  summary: "\u307e\u3060\u8abf\u67fb\u7d50\u679c\u304c\u3042\u308a\u307e\u305b\u3093\u3002Codex\u306b\u672c\u65e5\u306e\u8abf\u67fb\u3068\u30c7\u30fc\u30bf\u751f\u6210\u3092\u4f9d\u983c\u3059\u308b\u3068\u3001\u3053\u3053\u306b\u65e5\u6b21\u30d6\u30ea\u30fc\u30d5\u30a3\u30f3\u30b0\u304c\u8868\u793a\u3055\u308c\u307e\u3059\u3002",
  highlights: [
    "\u91cd\u8981URL\u3068\u30bf\u30b0\u3092\u8a2d\u5b9a\u3059\u308b\u3068\u3001\u8abf\u67fb\u7d50\u679c\u306e\u8981\u70b9\u304c\u3053\u3053\u306b\u8868\u793a\u3055\u308c\u307e\u3059\u3002",
  ],
  metrics: { scanned: 0, captured: 0, critical: 0 },
  tags: [],
  sources: [],
  articles: [],
};

const $ = (selector) => document.querySelector(selector);

async function loadEdition() {
  try {
    const indexResponse = await fetch("data/index.json");
    if (!indexResponse.ok) throw new Error("index.json not found");
    const index = await indexResponse.json();
    const editionResponse = await fetch(index.latest);
    if (!editionResponse.ok) throw new Error("edition not found");
    state.edition = await editionResponse.json();
  } catch (error) {
    console.warn("Using the empty edition:", error);
    state.edition = fallbackEdition;
  }
  render();
}

function render() {
  const edition = state.edition;
  $("#edition-date").textContent = formatDate(edition.date);
  $("#edition-summary").textContent = edition.summary;
  renderOverviewStructure(edition);
  renderOverviewHighlights(edition.highlights || [], Array.isArray(edition.overview) && edition.overview.length > 0);
  $("#metric-scanned").textContent = padMetric(edition.metrics.scanned);
  $("#metric-captured").textContent = padMetric(edition.metrics.captured);
  $("#metric-critical").textContent = padMetric(edition.metrics.critical);
  $("#metric-updated").textContent = edition.updatedAt
    ? new Date(edition.updatedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })
    : "--:--";

  renderFilters(edition.articles);
  renderArticles(edition.articles);
  renderTags(edition.tags);
  renderSources(edition.sources);
}

function renderOverviewStructure(edition) {
  const container = $("#overview-structure");
  const sections = normalizeOverview(edition);
  container.innerHTML = "";

  if (!sections.length) return;

  sections.forEach((section, sectionIndex) => {
    const block = document.createElement("section");
    block.className = "overview-block";

    const major = document.createElement("h3");
    major.className = "overview-major";
    major.textContent = `${String(sectionIndex + 1).padStart(2, "0")} / ${section.title}`;
    block.appendChild(major);

    const mids = document.createElement("div");
    mids.className = "overview-mids";

    (section.items || []).forEach((item, itemIndex) => {
      const mid = document.createElement("article");
      mid.className = "overview-mid";

      const title = document.createElement("h4");
      title.className = "overview-mid-title";
      title.textContent = `${sectionIndex + 1}.${itemIndex + 1} ${item.title}`;
      mid.appendChild(title);

      const pointList = document.createElement("ul");
      pointList.className = "overview-minor-list";

      (item.points || []).forEach((point) => {
        const li = document.createElement("li");
        li.textContent = point;
        pointList.appendChild(li);
      });

      if (pointList.childElementCount) {
        mid.appendChild(pointList);
      }

      mids.appendChild(mid);
    });

    block.appendChild(mids);
    container.appendChild(block);
  });
}

function renderFilters(articles) {
  const tags = [...new Set(articles.flatMap((article) => article.tags))];
  const filters = ["ALL", ...tags.slice(0, 5)];
  $("#filter-row").innerHTML = filters
    .map((filter) => `<button class="filter-button ${filter === state.activeFilter ? "is-active" : ""}" data-filter="${escapeHtml(filter)}">${escapeHtml(filter)}</button>`)
    .join("");

  document.querySelectorAll(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFilter = button.dataset.filter;
      renderFilters(articles);
      renderArticles(articles);
    });
  });
}

function renderArticles(articles) {
  const container = $("#article-grid");
  const visibleArticles = state.activeFilter === "ALL"
    ? articles
    : articles.filter((article) => article.tags.includes(state.activeFilter));

  if (!visibleArticles.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div>
          <strong>NO SIGNALS CAPTURED</strong>
          <span><code>config/research.json</code> \u3092\u8a2d\u5b9a\u3057\u3001Codex\u3078\u672c\u65e5\u306e\u8abf\u67fb\u3092\u4f9d\u983c\u3057\u3066\u304f\u3060\u3055\u3044\u3002</span>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = "";
  visibleArticles.forEach((article) => {
    const fragment = $("#article-template").content.cloneNode(true);
    const badge = fragment.querySelector(".priority-badge");
    badge.textContent = article.priority === "critical" ? "\u25b2 CRITICAL" : "\u25c6 SIGNAL";
    badge.dataset.priority = article.priority;
    fragment.querySelector("time").textContent = article.publishedAt || "DATE N/A";
    fragment.querySelector(".card-tags").innerHTML = article.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("");
    fragment.querySelector("h3").textContent = article.title;
    const points = normalizeArticlePoints(article);
    const pointList = fragment.querySelector(".card-points");
    points.forEach((point) => {
      const item = document.createElement("li");
      item.textContent = point;
      pointList.appendChild(item);
    });
    fragment.querySelector(".source-name").textContent = article.source;
    fragment.querySelector(".card-footer a").href = article.url;
    container.appendChild(fragment);
  });
}

function renderOverviewHighlights(highlights, hasStructuredOverview = false) {
  const container = $("#overview-highlights");
  container.innerHTML = "";
  if (hasStructuredOverview) return;
  highlights.slice(0, 3).forEach((highlight) => {
    const item = document.createElement("li");
    item.textContent = highlight;
    container.appendChild(item);
  });
}

function normalizeOverview(edition) {
  if (Array.isArray(edition.overview) && edition.overview.length) {
    return edition.overview
      .map((section) => ({
        title: section?.title ? String(section.title) : "",
        items: Array.isArray(section?.items)
          ? section.items.map((item) => ({
              title: item?.title ? String(item.title) : "",
              points: Array.isArray(item?.points)
                ? item.points.map((point) => String(point)).filter(Boolean)
                : [],
            })).filter((item) => item.title || item.points.length)
          : [],
      }))
      .filter((section) => section.title || section.items.length);
  }

  const fallbackPoints = Array.isArray(edition.highlights)
    ? edition.highlights.map((point) => String(point)).filter(Boolean)
    : [];

  if (!fallbackPoints.length) return [];

  return [{
    title: "Overview",
    items: [{
      title: "Highlights",
      points: fallbackPoints.slice(0, 3),
    }],
  }];
}

function normalizeArticlePoints(article) {
  if (Array.isArray(article.points) && article.points.length) {
    return article.points.slice(0, 4);
  }

  const sentences = String(article.summary || "")
    .match(/[^\u3002\uff01\uff1f]+[\u3002\uff01\uff1f]?/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences?.length ? sentences.slice(0, 4) : ["\u8981\u7d04\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002"];
}

function renderTags(tags) {
  $("#tag-cloud").innerHTML = tags.length
    ? tags.map((tag) => `<span class="tracking-tag" data-weight="${tag.weight}">#${escapeHtml(tag.name)}<small>W${tag.weight}</small></span>`).join("")
    : '<span class="tracking-tag">NO TAGS</span>';
}

function renderSources(sources) {
  $("#source-list").innerHTML = sources.length
    ? sources.map((source) => `
        <div class="source-item">
          <i></i>
          <span>${escapeHtml(source.name)}</span>
          <small>${escapeHtml(source.priority.toUpperCase())}</small>
        </div>`).join("")
    : '<div class="source-item"><i></i><span>NO SOURCES CONFIGURED</span><small>IDLE</small></div>';
}

function formatDate(value) {
  if (!value) return "DATE UNKNOWN";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${value}T00:00:00+09:00`)).replaceAll("-", ".");
}

function padMetric(value) {
  return String(value ?? 0).padStart(2, "0");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadEdition();
