const themeToggle = document.querySelector('.theme-toggle');
const languageToggle = document.querySelector('.language-toggle');
const body = document.body;
const html = document.documentElement;

const applyTheme = (theme) => {
  if (theme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.textContent = '🌙';
  } else {
    body.classList.remove('dark-mode');
    themeToggle.textContent = '☀️';
  }
};

themeToggle.addEventListener('click', () => {
  const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('theme', newTheme);
});

const setLanguage = (lang) => {
  html.lang = lang;
  const langData = translations[lang];
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    if (langData[key]) {
      el.innerHTML = langData[key];
    }
  });
  if (lang === 'pt-BR') {
    languageToggle.textContent = '🇧🇷';
  } else {
    languageToggle.textContent = '🇺🇸';
  }
  languageToggle.title = langData.lang_toggle_title;
};

languageToggle.addEventListener('click', () => {
  const newLang = html.lang === 'pt-BR' ? 'en-US' : 'pt-BR';
  setLanguage(newLang);
  localStorage.setItem('language', newLang);
});


function initialize() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlTheme = urlParams.get('theme');
  const urlLangParam = urlParams.get('lang');

  let langFromUrl = null;
  if (urlLangParam === 'ptBR') {
    langFromUrl = 'pt-BR';
  } else if (urlLangParam === 'enUS') {
    langFromUrl = 'en-US';
  }

  const themeToApply = urlTheme || localStorage.getItem('theme') || 'dark';
  applyTheme(themeToApply);

  const langToApply = langFromUrl || localStorage.getItem('language') || 'pt-BR';
  setLanguage(langToApply);
}

initialize();