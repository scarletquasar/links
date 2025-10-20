// Minimal markdown renderer (supports headings, paragraphs, code blocks, lists, links)
// Designed to be small and dependency-free for static hosting.

function mdToHtml(md) {
  // Use marked.js for full GFM markdown parsing
  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: false,
    highlight: function(code, lang) {
      if (window.Prism && Prism.languages[lang]) {
        return Prism.highlight(code, Prism.languages[lang], lang);
      }
      return code;
    }
  });
  return marked.parse(md);
}

function showArticleFromText(md, meta, tags) {
  const articleArea = document.getElementById('article-area');
  const articleContent = document.getElementById('article-content');
  const articleMeta = document.getElementById('article-meta');

  let metaText = meta || '';
  if (tags && tags.length) {
    metaText += ' | Tags: ' + tags.map(t => `<span class="tag-badge" onclick="window.location.href='?tag=${encodeURIComponent(t)}'">${t}</span>`).join(' ');
  }
  articleMeta.innerHTML = metaText;
  articleContent.innerHTML = mdToHtml(md);
  articleArea.style.display = 'block';

  // VS Code style code block headers
  setTimeout(() => {
    document.querySelectorAll('.markdown pre code').forEach(codeEl => {
      const pre = codeEl.parentElement;
      if (!pre) return;
      // Only add header if not already present
      if (pre.querySelector('.vsc-header')) return;
      let lang = '';
      const classes = codeEl.className.split(' ');
      for (const c of classes) {
        if (c.startsWith('language-')) lang = c.replace('language-', '');
      }
      // Capitalize language name
      if (lang) lang = lang.charAt(0).toUpperCase() + lang.slice(1);
      const header = document.createElement('div');
      header.className = 'vsc-header';
      header.textContent = lang || 'Code';
      pre.insertBefore(header, codeEl);
    });
    // Highlight code blocks after rendering
    if (window.Prism) {
      Prism.highlightAll();
    }
  }, 0);
}

function loadArticleFromUrl(url) {
  fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.text();
  }).then(md => {
    // For now, assume no tags from external; could parse frontmatter later
    showArticleFromText(md, url);
  }).catch(err => {
    showArticleFromText('# Erro\nNão foi possível carregar o artigo.');
    console.error(err);
  });
}

// Articles data (expand this list as needed)
const articles = [
  { title: 'Bem-vinda ao Growlinks', src: 'articles/sample-article.md', tags: ['growlinks', 'saas', 'tutorial'], excerpt: 'Este é um artigo de exemplo...', date: '2025-10-19' }
];

function renderArticlesList(filteredArticles) {
  const listEl = document.getElementById('articles-list');
  listEl.innerHTML = '';
  filteredArticles.forEach(article => {
    const a = document.createElement('a');
    a.href = '?src=' + encodeURIComponent(article.src);
    a.className = 'article-link';
    const tagsHtml = article.tags.map(t => `<a href="?tag=${encodeURIComponent(t)}" class="tag-badge">${t}</a>`).join('');
    a.innerHTML = `
      <strong>${article.title}</strong><br>
      <small>${article.excerpt}</small><br>
      <small>Data: ${article.date}</small><br>
      <div>${tagsHtml}</div>
    `;
    listEl.appendChild(a);
  });
}

function getAllTags() {
  const tagSet = new Set();
  articles.forEach(a => a.tags.forEach(t => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

function renderTagFilters() {
  const tagsEl = document.getElementById('tags-filter');
  const allTags = getAllTags();
  const lang = document.documentElement.lang;
  const trans = translations[lang] || translations['pt-BR'];
  tagsEl.innerHTML = '<strong>' + trans.filter_by_tag + '</strong> <a href="?" class="tag-badge">' + trans.all_tags + '</a> ';
  allTags.forEach(tag => {
    const a = document.createElement('a');
    a.href = '?tag=' + encodeURIComponent(tag);
    a.className = 'tag-badge';
    a.textContent = tag;
    tagsEl.appendChild(a);
  });
  // Add "View all tags" badge
  const viewAll = document.createElement('a');
  viewAll.className = 'tag-badge';
  viewAll.textContent = trans.view_all_tags;
  viewAll.onclick = (e) => { e.preventDefault(); showAllTagsModal(); };
  tagsEl.appendChild(viewAll);
}

function showAllTagsModal() {
  const modal = document.getElementById('tags-modal');
  const modalTags = document.getElementById('modal-tags');
  const allTags = getAllTags();
  modalTags.innerHTML = allTags.map(t => `<span class="tag-badge">${t}</span>`).join('');
  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('tags-modal').style.display = 'none';
}

function sortArticles(articles, sortBy) {
  return [...articles].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });
}

function filterByDate(articles, from, to) {
  if (!from && !to) return articles;
  return articles.filter(a => {
    const d = new Date(a.date);
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to)) return false;
    return true;
  });
}

function filterArticles(query, tagFilter) {
  return articles.filter(article => {
    const matchesQuery = !query || article.title.toLowerCase().includes(query.toLowerCase()) || article.excerpt.toLowerCase().includes(query.toLowerCase());
    const matchesTag = !tagFilter || article.tags.includes(tagFilter);
    return matchesQuery && matchesTag;
  });
}

function initArticlesPage() {
  renderTagFilters();

  const params = new URLSearchParams(window.location.search);
  const src = params.get('src');
  const tag = params.get('tag');
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'date-desc';
  const from = params.get('from') || '';
  const to = params.get('to') || '';

  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const dateFrom = document.getElementById('date-from');
  const dateTo = document.getElementById('date-to');

  searchInput.value = q;
  sortSelect.value = sort;
  dateFrom.value = from;
  dateTo.value = to;

  function updateList() {
    let filtered = filterArticles(searchInput.value, tag);
    filtered = filterByDate(filtered, dateFrom.value, dateTo.value);
    filtered = sortArticles(filtered, sortSelect.value);
    renderArticlesList(filtered);
  }

  updateList();

  // Event listeners
  searchInput.addEventListener('input', updateList);
  sortSelect.addEventListener('change', updateList);
  dateFrom.addEventListener('change', updateList);
  dateTo.addEventListener('change', updateList);

  if (src) {
    const article = articles.find(a => a.src === src);
    if (article) {
      fetch(article.src).then(res => res.text()).then(md => {
        showArticleFromText(md, article.title + ' - ' + article.date, article.tags);
      });
    } else {
      loadArticleFromUrl(src);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initArticlesPage);
} else {
  initArticlesPage();
}
