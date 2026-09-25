/**
 * BJ Chen Web Portal - Interactive Dashboard Controller
 */

(function () {
  'use strict';

  // Elements
  const themeToggle = document.getElementById('themeToggle');
  const searchInput = document.getElementById('portalSearch');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  const projectCount = document.getElementById('projectCount');
  const liveClock = document.getElementById('liveClock');

  // Theme Management
  function initTheme() {
    const savedTheme = localStorage.getItem('bj_portal_theme') || 'dark';
    applyTheme(savedTheme);

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bj_portal_theme', theme);
    if (themeToggle) {
      themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
  }

  // Live Clock
  function updateClock() {
    if (!liveClock) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    liveClock.textContent = timeStr;
  }

  // Filter & Search Logic
  let currentFilter = 'all';
  let searchQuery = '';

  function filterProjects() {
    let visibleCount = 0;

    projectCards.forEach(card => {
      const category = card.dataset.category || '';
      const title = (card.querySelector('.card-title')?.textContent || '').toLowerCase();
      const desc = (card.querySelector('.card-desc')?.textContent || '').toLowerCase();
      const tags = (card.querySelector('.card-tags')?.textContent || '').toLowerCase();

      const matchCategory = currentFilter === 'all' || category === currentFilter;
      const matchSearch = !searchQuery || title.includes(searchQuery) || desc.includes(searchQuery) || tags.includes(searchQuery);

      if (matchCategory && matchSearch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (projectCount) {
      projectCount.textContent = `${visibleCount} 個專案`;
    }
  }

  function initFilterAndSearch() {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentFilter = e.currentTarget.dataset.filter;
        filterProjects();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        filterProjects();
      });
    }
  }

  // Toast notifications
  window.showToast = function (message) {
    let toast = document.getElementById('portalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'portalToast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.background = 'rgba(15, 23, 42, 0.92)';
      toast.style.color = '#38bdf8';
      toast.style.padding = '12px 20px';
      toast.style.borderRadius = '10px';
      toast.style.border = '1px solid rgba(56, 189, 248, 0.3)';
      toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
      toast.style.zIndex = '9999';
      toast.style.fontSize = '0.9rem';
      toast.style.fontWeight = '600';
      toast.style.transition = 'all 0.3s ease';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.gap = '8px';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 2500);
  };

  // Copy to clipboard helper
  window.copyText = function (text, label) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`已複製 ${label || '內容'} 到剪貼簿！`);
      });
    }
  };

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initFilterAndSearch();
    updateClock();
    setInterval(updateClock, 1000);
  });
})();
