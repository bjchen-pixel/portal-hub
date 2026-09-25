/**
 * CET-6 Mastery Studio - Main Application Controller
 * Handles Data Loading, Search, Filters, Flashcards, Speech, and Storage
 */

class CET6StudioApp {
  constructor() {
    this.data = {
      phrases: [],
      translations: [],
      collocations: [],
      writing: null
    };

    this.state = {
      currentTab: 'phrases',
      currentLetter: 'ALL',
      phraseTag: 'ALL',
      searchQuery: '',
      translationIndex: 0,
      translationTag: 'ALL',
      collocTag: 'ALL',
      onlyStarred: false,
      isFlipped: false
    };

    this.starredPhrases = new Set(JSON.parse(localStorage.getItem('cet6_starred_phrases') || '[]'));
    this.init();
  }

  async init() {
    this.bindEvents();
    this.initTheme();
    await this.loadAllData();
    this.renderCurrentTab();
  }

  // --- Theme Management ---
  initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.className = `theme-${savedTheme}`;
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
      icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  toggleTheme() {
    const isDark = document.body.classList.contains('theme-dark');
    const newTheme = isDark ? 'light' : 'dark';
    document.body.className = `theme-${newTheme}`;
    localStorage.setItem('theme', newTheme);
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
      icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  // --- Data Loading ---
  async loadAllData() {
    try {
      const [phrasesRes, transRes, collocRes, writeRes] = await Promise.all([
        fetch('data/cet6_phrases.json'),
        fetch('data/cet6_translations.json'),
        fetch('data/cet6_collocations.json'),
        fetch('data/cet6_writing.json')
      ]);

      this.data.phrases = await phrasesRes.json();
      this.data.translations = await transRes.json();
      this.data.collocations = await collocRes.json();
      this.data.writing = await writeRes.json();

      this.updateStarCount();
    } catch (err) {
      console.error('Failed to load CET-6 datasets:', err);
    }
  }

  // --- Event Bindings ---
  bindEvents() {
    // Tabs switching
    document.querySelectorAll('.nav-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Search Input
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value.trim().toLowerCase();
        if (clearSearchBtn) {
          clearSearchBtn.style.display = this.state.searchQuery ? 'block' : 'none';
        }
        this.renderCurrentTab();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          this.state.searchQuery = '';
          clearSearchBtn.style.display = 'none';
          this.renderCurrentTab();
        }
      });
    }

    // Star filter button in header
    const favFilterBtn = document.getElementById('favFilterBtn');
    if (favFilterBtn) {
      favFilterBtn.addEventListener('click', () => {
        this.state.onlyStarred = !this.state.onlyStarred;
        favFilterBtn.classList.toggle('active', this.state.onlyStarred);
        if (this.state.currentTab !== 'phrases') {
          this.switchTab('phrases');
        } else {
          this.renderPhrases();
        }
      });
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (this.state.currentTab === 'translations') {
        if (e.code === 'Space') {
          e.preventDefault();
          this.toggleFlip();
        } else if (e.code === 'ArrowLeft') {
          this.prevTranslation();
        } else if (e.code === 'ArrowRight') {
          this.nextTranslation();
        }
      }
    });
  }

  switchTab(tab) {
    this.state.currentTab = tab;
    this.state.isFlipped = false;
    document.querySelectorAll('.nav-pill').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });

    // Toggle sub-bars visibility
    const phraseControls = document.getElementById('phraseControls');
    const transControls = document.getElementById('transControls');
    if (phraseControls) phraseControls.style.display = tab === 'phrases' ? 'flex' : 'none';
    if (transControls) transControls.style.display = tab === 'translations' ? 'flex' : 'none';

    // Show/hide view containers
    document.getElementById('phrasesView').style.display = tab === 'phrases' ? 'block' : 'none';
    document.getElementById('translationsView').style.display = tab === 'translations' ? 'block' : 'none';
    document.getElementById('writingView').style.display = tab === 'writing' ? 'block' : 'none';
    document.getElementById('collocationsView').style.display = tab === 'collocations' ? 'block' : 'none';

    this.renderCurrentTab();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderCurrentTab() {
    switch (this.state.currentTab) {
      case 'phrases':
        this.renderPhrases();
        break;
      case 'translations':
        this.renderTranslations();
        break;
      case 'writing':
        this.renderWriting();
        break;
      case 'collocations':
        this.renderCollocations();
        break;
    }
  }

  // ==========================================================================
  // TAB 1: 663 Phrases
  // ==========================================================================
  renderPhrases() {
    const container = document.getElementById('phrasesContainer');
    if (!container) return;

    let filtered = this.data.phrases.filter(p => {
      // Letter filter
      if (this.state.currentLetter !== 'ALL' && p.first_letter !== this.state.currentLetter) {
        return false;
      }
      // Tag filter
      if (this.state.phraseTag !== 'ALL' && p.tag !== this.state.phraseTag) {
        return false;
      }
      // Star filter
      if (this.state.onlyStarred && !this.starredPhrases.has(p.id)) {
        return false;
      }
      // Search
      if (this.state.searchQuery) {
        const q = this.state.searchQuery;
        const matchesEng = p.phrase.toLowerCase().includes(q);
        const matchesCn = p.meaning.includes(q);
        const matchesSyn = p.synonyms.toLowerCase().includes(q);
        return matchesEng || matchesCn || matchesSyn;
      }
      return true;
    });

    // Update count in controls
    const counterEl = document.getElementById('phraseMatchCount');
    if (counterEl) {
      counterEl.textContent = `顯示 ${filtered.length} / ${this.data.phrases.length} 組片語`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
          <p style="font-size: 1.1rem; color: var(--text-secondary);">沒有找到符合條件的詞組</p>
          <p style="font-size: 0.88rem; margin-top: 6px;">請嘗試更換搜尋關鍵字或字母篩選條件</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(p => {
      const isStarred = this.starredPhrases.has(p.id);
      return `
        <article class="phrase-card" data-id="${p.id}">
          <div>
            <div class="phrase-header">
              <div>
                <span class="phrase-id-badge">#${String(p.id).padStart(3, '0')}</span>
                <h3 class="phrase-title">${this.escapeHTML(p.phrase)}</h3>
              </div>
              <div class="phrase-actions">
                <button class="card-btn audio-btn" onclick="app.speakText('${this.escapeQuotes(p.phrase)}')" title="聆聽發音">
                  <i class="fas fa-volume-high"></i>
                </button>
                <button class="card-btn star-btn ${isStarred ? 'starred' : ''}" onclick="app.toggleStar(${p.id}, this)" title="收藏片語">
                  <i class="fa-${isStarred ? 'solid' : 'regular'} fa-star"></i>
                </button>
              </div>
            </div>

            ${p.synonyms ? `
              <div class="synonym-box">
                <span class="syn-label">同義替換</span>
                <span>= ${this.escapeHTML(p.synonyms)}</span>
              </div>
            ` : ''}

            <p class="phrase-meaning">${this.escapeHTML(p.meaning)}</p>
          </div>

          <div class="phrase-footer">
            <span class="tag-badge">${p.tag}</span>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${p.first_letter} 類</span>
          </div>
        </article>
      `;
    }).join('');
  }

  setLetterFilter(letter, btn) {
    this.state.currentLetter = letter;
    document.querySelectorAll('.alphabet-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.renderPhrases();
  }

  setPhraseTagFilter(tag, btn) {
    this.state.phraseTag = tag;
    document.querySelectorAll('#phraseTags .filter-tag').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.renderPhrases();
  }

  toggleStar(id, btn) {
    if (this.starredPhrases.has(id)) {
      this.starredPhrases.delete(id);
      if (btn) {
        btn.classList.remove('starred');
        btn.querySelector('i').className = 'fa-regular fa-star';
      }
    } else {
      this.starredPhrases.add(id);
      if (btn) {
        btn.classList.add('starred');
        btn.querySelector('i').className = 'fa-solid fa-star';
      }
    }
    localStorage.setItem('cet6_starred_phrases', JSON.stringify([...this.starredPhrases]));
    this.updateStarCount();

    if (this.state.onlyStarred) {
      this.renderPhrases();
    }
  }

  updateStarCount() {
    const starCountEl = document.getElementById('starCount');
    if (starCountEl) {
      starCountEl.textContent = this.starredPhrases.size;
    }
  }

  // ==========================================================================
  // TAB 2: 49 Translation Sentences
  // ==========================================================================
  renderTranslations() {
    const container = document.getElementById('translationCardContainer');
    if (!container) return;

    let filtered = this.data.translations.filter(t => {
      if (this.state.translationTag !== 'ALL' && t.grammar_tag !== this.state.translationTag) {
        return false;
      }
      if (this.state.searchQuery) {
        const q = this.state.searchQuery;
        return t.english.toLowerCase().includes(q) || t.chinese_prompt.includes(q) || t.grammar_desc.includes(q);
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <p>沒有找到符合語法標籤的長難句</p>
        </div>
      `;
      return;
    }

    if (this.state.translationIndex >= filtered.length) {
      this.state.translationIndex = 0;
    }

    const cur = filtered[this.state.translationIndex];
    const total = filtered.length;

    container.innerHTML = `
      <div class="flashcard-wrapper">
        <div class="flashcard ${this.state.isFlipped ? 'flipped' : ''}" id="mainFlashcard" onclick="app.toggleFlip()">
          
          <!-- Card Front -->
          <div class="card-face card-front">
            <div>
              <div class="flashcard-header">
                <span class="grammar-badge"><i class="fas fa-bookmark"></i> ${cur.grammar_tag}</span>
                <span style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">第 ${this.state.translationIndex + 1} / ${total} 句</span>
              </div>
              <div class="prompt-title">六級翻譯題面考點</div>
              <div class="prompt-text">${this.highlightPrompt(cur.chinese_prompt)}</div>
            </div>
            
            <div class="flashcard-hint">
              <i class="fas fa-arrow-rotate-right"></i> 點擊卡片翻轉查看六級高分譯文與句法拆解（支援空白鍵）
            </div>
          </div>

          <!-- Card Back -->
          <div class="card-face card-back">
            <div>
              <div class="flashcard-header">
                <span class="grammar-badge"><i class="fas fa-check-circle"></i> 六級標準譯文</span>
                <button class="card-btn" onclick="event.stopPropagation(); app.speakText('${this.escapeQuotes(cur.english)}')" title="朗讀英文">
                  <i class="fas fa-volume-high"></i>
                </button>
              </div>
              
              <div class="answer-english">${this.escapeHTML(cur.english)}</div>
              
              <div class="answer-rule">
                <strong><i class="fas fa-lightbulb" style="color: var(--accent-gold);"></i> 句法精析：</strong>
                ${this.escapeHTML(cur.grammar_desc)}
              </div>
            </div>

            <div class="flashcard-hint">
              <i class="fas fa-arrow-rotate-left"></i> 點擊卡片翻回正面
            </div>
          </div>

        </div>
      </div>

      <!-- Controls -->
      <div class="flashcard-nav">
        <button class="btn-ctrl" onclick="app.prevTranslation()"><i class="fas fa-chevron-left"></i> 上一句</button>
        <button class="btn-ctrl btn-flip" onclick="app.toggleFlip()"><i class="fas fa-arrows-rotate"></i> 翻轉卡片</button>
        <button class="btn-ctrl" onclick="app.nextTranslation()">下一句 <i class="fas fa-chevron-right"></i></button>
      </div>
    `;
  }

  highlightPrompt(text) {
    if (!text) return '請點擊翻牌查看完整句型結構';
    return text.replace(/[（(]([^）)]+)[）)]/g, '<mark>$1</mark>');
  }

  toggleFlip() {
    this.state.isFlipped = !this.state.isFlipped;
    const card = document.getElementById('mainFlashcard');
    if (card) {
      card.classList.toggle('flipped', this.state.isFlipped);
    }
  }

  prevTranslation() {
    this.state.isFlipped = false;
    this.state.translationIndex = (this.state.translationIndex - 1 + this.data.translations.length) % this.data.translations.length;
    this.renderTranslations();
  }

  nextTranslation() {
    this.state.isFlipped = false;
    this.state.translationIndex = (this.state.translationIndex + 1) % this.data.translations.length;
    this.renderTranslations();
  }

  setTransTagFilter(tag, btn) {
    this.state.translationTag = tag;
    this.state.translationIndex = 0;
    this.state.isFlipped = false;
    document.querySelectorAll('#transTags .filter-tag').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.renderTranslations();
  }

  // ==========================================================================
  // TAB 3: Writing Arsenal
  // ==========================================================================
  renderWriting() {
    const container = document.getElementById('writingContainer');
    if (!container || !this.data.writing) return;

    const w = this.data.writing;

    container.innerHTML = `
      <div class="writing-grid-2">
        <!-- 10 Universal Reasons -->
        <div class="writing-card">
          <div class="section-head">
            <h2 class="section-title"><i class="fas fa-cubes" style="color: #6366f1;"></i> 十大萬能論據理由庫 (Omnipotence)</h2>
            <span style="font-size: 0.8rem; color: var(--text-muted);">任何話題皆可套用</span>
          </div>
          
          <div>
            ${w.universal_reasons.map(r => `
              <div class="reason-item">
                <div class="reason-header">
                  <span class="reason-title">${r.id}. ${r.topic}</span>
                  <span class="reason-en">${r.en_topic}</span>
                </div>
                <div class="keywords-row">
                  ${r.keywords.map(kw => `<span class="kw-chip">${kw}</span>`).join('')}
                </div>
                ${r.sentences.map(s => `
                  <div class="sentence-snippet">
                    <span>${this.escapeHTML(s)}</span>
                    <button class="copy-mini-btn" onclick="app.copyText('${this.escapeQuotes(s)}', '金句')" title="複製此句">
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Logic Connectors & Power Sentences -->
        <div>
          <!-- Logic Connectors -->
          <div class="writing-card" style="margin-bottom: 24px;">
            <div class="section-head">
              <h2 class="section-title"><i class="fas fa-link" style="color: #38bdf8;"></i> 銜接邏輯詞速查盤</h2>
              <span style="font-size: 0.8rem; color: var(--text-muted);">告別單一 but/because</span>
            </div>
            
            ${w.logic_connectors.map(cat => `
              <div style="margin-bottom: 16px;">
                <h4 style="font-size: 0.92rem; color: var(--secondary); margin-bottom: 8px;">${cat.category}</h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${cat.items.map(item => `
                    <div style="padding: 8px 12px; background: rgba(255, 255, 255, 0.03); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 0.86rem;">
                      <strong style="color: #f1f5f9; font-family: var(--font-mono);">${item.word}：</strong>
                      <span style="color: var(--text-secondary);">${item.usage}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Openings & Closings -->
          <div class="writing-card">
            <div class="section-head">
              <h2 class="section-title"><i class="fas fa-bolt" style="color: #f59e0b;"></i> 開頭與結尾破題萬能句</h2>
            </div>
            
            <div style="margin-bottom: 16px;">
              <h4 style="font-size: 0.9rem; color: #f59e0b; margin-bottom: 8px;">★ 引人入勝的開頭句 (Opening Sentences)</h4>
              ${w.power_sentences.openings.map(s => `
                <div class="sentence-snippet" style="border-left-color: #f59e0b; margin-bottom: 8px;">
                  <span>${s}</span>
                  <button class="copy-mini-btn" onclick="app.copyText('${this.escapeQuotes(s)}', '開頭句')" title="複製句型">
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
              `).join('')}
            </div>

            <div>
              <h4 style="font-size: 0.9rem; color: #10b981; margin-bottom: 8px;">★ 畫龍點睛的結尾句 (Closing Sentences)</h4>
              ${w.power_sentences.closings.map(s => `
                <div class="sentence-snippet" style="border-left-color: #10b981; margin-bottom: 8px;">
                  <span>${s}</span>
                  <button class="copy-mini-btn" onclick="app.copyText('${this.escapeQuotes(s)}', '結尾句')" title="複製句型">
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Quote Essay Models -->
      <div class="writing-card">
        <div class="section-head">
          <h2 class="section-title"><i class="fas fa-quote-left" style="color: #c084fc;"></i> 六級新題型：名言警句評論型滿分範例 (Quote Essays)</h2>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;">
          ${w.quote_templates.map(qt => `
            <div class="quote-box">
              <div class="quote-header">
                <span class="quote-theme">${qt.theme}</span>
                <span class="quote-author">${qt.author}</span>
              </div>
              <div class="quote-banner">“${qt.quote}”</div>
              <div class="essay-body">${this.escapeHTML(qt.model_essay)}</div>
              
              <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">${qt.translation.slice(0, 45)}...</span>
                <button class="btn-ctrl" style="padding: 6px 14px; font-size: 0.8rem;" onclick="app.copyText('${this.escapeQuotes(qt.model_essay)}', '整篇範文')">
                  <i class="fas fa-copy"></i> 複製範文
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // TAB 4: 116 Collocations
  // ==========================================================================
  renderCollocations() {
    const container = document.getElementById('collocationsContainer');
    if (!container) return;

    let filtered = this.data.collocations.filter(c => {
      if (this.state.collocTag !== 'ALL' && c.tag !== this.state.collocTag) {
        return false;
      }
      if (this.state.searchQuery) {
        const q = this.state.searchQuery;
        return c.phrase.toLowerCase().includes(q) || c.meaning.includes(q);
      }
      return true;
    });

    const countEl = document.getElementById('collocCount');
    if (countEl) {
      countEl.textContent = `顯示 ${filtered.length} / ${this.data.collocations.length} 組搭配`;
    }

    container.innerHTML = filtered.map(c => `
      <div class="colloc-item">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">#${c.id}</span>
            <span class="tag-badge" style="font-size: 0.68rem;">${c.tag}</span>
          </div>
          <div class="colloc-phrase">${this.escapeHTML(c.phrase)}</div>
          <div class="colloc-meaning">${this.escapeHTML(c.meaning || '核心考點搭配')}</div>
        </div>
        <button class="card-btn" onclick="app.speakText('${this.escapeQuotes(c.phrase)}')" title="發音試聽">
          <i class="fas fa-volume-high"></i>
        </button>
      </div>
    `).join('');
  }

  setCollocTagFilter(tag, btn) {
    this.state.collocTag = tag;
    document.querySelectorAll('#collocTags .filter-tag').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.renderCollocations();
  }

  // --- Utility Functions ---
  speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\[\.\.\.\]/g, '').replace(/[\(\)]/g, '').trim();
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = 'en-US';
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  }

  copyText(text, label = '內容') {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(`已複製${label}到剪貼簿！`);
    }).catch(() => {
      this.showToast('複製失敗，請手動選取');
    });
  }

  showToast(msg) {
    let toast = document.getElementById('studioToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'studioToast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 12px 20px;
        background: rgba(15, 23, 42, 0.95);
        color: #fff;
        border: 1px solid var(--primary);
        border-radius: var(--radius-full);
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        font-size: 0.88rem;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
      `;
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fas fa-check" style="color: var(--accent-emerald);"></i> ${msg}`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
    }, 2200);
  }

  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  escapeQuotes(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
  }
}

// Global instance
const app = new CET6StudioApp();
