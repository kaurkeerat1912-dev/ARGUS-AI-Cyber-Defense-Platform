/**
 * ARGUS Cyber Defense - WhatsApp Web Injection Script
 * Injects a floating overlay directly onto web.whatsapp.com
 * Allows drag-and-drop of files directly from WhatsApp chats/snaps, scores them in real-time,
 * and opens the ARGUS Native App (localhost:5173/details/<id>).
 */

(function () {
  console.log('[ARGUS] Initializing WhatsApp Web Interceptor...');

  const API_BASE = 'http://localhost:8000/api/v1';
  const NATIVE_APP_BASE = 'http://localhost:5173';

  // Prevent multiple injections
  if (document.getElementById('argus-wa-interceptor-root')) {
    return;
  }

  // Create Root Container
  const root = document.createElement('div');
  root.id = 'argus-wa-interceptor-root';
  document.body.appendChild(root);

  let isOpen = false;
  let isScanning = false;
  let lastResult = null;

  function render() {
    if (!isOpen) {
      root.innerHTML = `
        <div class="argus-trigger-pill" id="argus-open-pill">
          <span class="dot"></span>
          <span>🛡️ ARGUS File Interceptor</span>
        </div>
      `;
      document.getElementById('argus-open-pill')?.addEventListener('click', () => {
        isOpen = true;
        render();
      });
      return;
    }

    // Modal View
    root.innerHTML = `
      <div class="argus-popup-modal">
        <div class="argus-modal-header">
          <div class="argus-header-title">
            <span>🛡️ ARGUS Threat Interceptor</span>
            <span class="argus-header-tag">WhatsApp Web</span>
          </div>
          <button class="argus-close-btn" id="argus-close-btn" title="Close">✕</button>
        </div>

        <div class="argus-modal-body">
          <div class="argus-drop-zone" id="argus-drop-zone">
            <input type="file" id="argus-file-input" style="display: none;" />
            <div class="argus-drop-zone-icon">📥</div>
            <div class="argus-drop-title">Drop WhatsApp File or Snap Here</div>
            <div class="argus-drop-desc">Drag directly from chat window or click to select</div>
          </div>

          <div id="argus-status-container"></div>
        </div>
      </div>
    `;

    document.getElementById('argus-close-btn')?.addEventListener('click', () => {
      isOpen = false;
      render();
    });

    const dropZone = document.getElementById('argus-drop-zone');
    const fileInput = document.getElementById('argus-file-input');

    dropZone?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleProcessFile(file);
    });

    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-active');
    });

    dropZone?.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-active');
    });

    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-active');
      const file = e.dataTransfer?.files?.[0];
      if (file) handleProcessFile(file);
    });

    renderStatus();
  }

  function renderStatus() {
    const container = document.getElementById('argus-status-container');
    if (!container) return;

    if (isScanning) {
      container.innerHTML = `
        <div style="text-align: center; padding: 12px; font-size: 11px; color: #475569;">
          <div class="argus-loading-spinner" style="margin-bottom: 6px;"></div>
          <div style="font-weight: 700;">Running Forensic Analysis in RAM...</div>
        </div>
      `;
      return;
    }

    if (!lastResult) {
      container.innerHTML = `
        <div style="font-size: 10px; color: #94a3b8; text-align: center;">
          Ready to intercept binaries, scripts, PDFs, and snaps
        </div>
      `;
      return;
    }

    const score = lastResult.risk_score || 0;
    const isMalicious = score >= 60;
    const riskClass = score >= 70 ? 'critical' : score >= 40 ? 'suspicious' : 'safe';
    const barColor = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';

    container.innerHTML = `
      <div class="argus-score-card" id="argus-open-native-btn">
        <div class="argus-score-header">
          <div class="argus-filename">${lastResult.original_name || 'Uploaded File'}</div>
          <div class="argus-risk-pill ${riskClass}">Score: ${score.toFixed(1)}/100</div>
        </div>

        <div class="argus-meter-bar">
          <div class="argus-meter-fill" style="width: ${Math.min(score, 100)}%; background-color: ${barColor};"></div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin-bottom: 8px;">
          <span>Status: <strong>${lastResult.risk_level}</strong></span>
          <span>${((lastResult.file_size_bytes || 0) / 1024).toFixed(1)} KB</span>
        </div>

        <div class="argus-open-native-app">
          <span>🚀 Click to open native app details</span>
          <span>→</span>
        </div>
      </div>
    `;

    document.getElementById('argus-open-native-btn')?.addEventListener('click', () => {
      // Deep link to native ARGUS app
      window.open(`${NATIVE_APP_BASE}/?tab=details&id=${lastResult.id}`, '_blank');
    });
  }

  async function handleProcessFile(file) {
    try {
      isScanning = true;
      renderStatus();

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed on server.');
      }

      const data = await response.json();
      lastResult = data;
    } catch (err) {
      alert('ARGUS Error: ' + (err.message || 'Failed to scan file'));
    } finally {
      isScanning = false;
      renderStatus();
    }
  }

  render();
})();
