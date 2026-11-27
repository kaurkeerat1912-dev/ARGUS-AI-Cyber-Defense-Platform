(function(){
  const css = '/* ARGUS Cyber Defense Floating WhatsApp Web Widget Styles */\n\n#argus-wa-interceptor-root {\n  position: fixed;\n  bottom: 24px;\n  right: 24px;\n  z-index: 99999999;\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;\n  color: #1e293b;\n}\n\n.argus-trigger-pill {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  background: linear-gradient(135deg, #059669, #0d9488);\n  color: #ffffff;\n  padding: 12px 18px;\n  border-radius: 9999px;\n  box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.4), 0 8px 10px -6px rgba(5, 150, 105, 0.3);\n  cursor: pointer;\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  font-size: 13px;\n  font-weight: 700;\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  user-select: none;\n}\n\n.argus-trigger-pill:hover {\n  transform: translateY(-2px) scale(1.02);\n  box-shadow: 0 14px 28px -5px rgba(5, 150, 105, 0.5);\n}\n\n.argus-trigger-pill .dot {\n  width: 8px;\n  height: 8px;\n  background-color: #a7f3d0;\n  border-radius: 50%;\n  animation: argusPulse 1.5s infinite;\n}\n\n@keyframes argusPulse {\n  0%, 100% { opacity: 1; transform: scale(1); }\n  50% { opacity: 0.4; transform: scale(1.3); }\n}\n\n.argus-popup-modal {\n  width: 380px;\n  background: #ffffff;\n  border-radius: 24px;\n  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n  animation: argusSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n@keyframes argusSlideIn {\n  from { opacity: 0; transform: translateY(20px) scale(0.95); }\n  to { opacity: 1; transform: translateY(0) scale(1); }\n}\n\n.argus-modal-header {\n  background: linear-gradient(135deg, #047857, #065f46);\n  color: #ffffff;\n  padding: 16px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.argus-header-title {\n  font-size: 13px;\n  font-weight: 800;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n\n.argus-header-tag {\n  background: rgba(255, 255, 255, 0.2);\n  font-size: 9px;\n  padding: 2px 6px;\n  border-radius: 9999px;\n  font-weight: 600;\n}\n\n.argus-close-btn {\n  background: rgba(255, 255, 255, 0.15);\n  border: none;\n  color: #ffffff;\n  width: 26px;\n  height: 26px;\n  border-radius: 8px;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 14px;\n  font-weight: bold;\n}\n\n.argus-close-btn:hover {\n  background: rgba(255, 255, 255, 0.3);\n}\n\n.argus-modal-body {\n  padding: 16px;\n  display: flex;\n  flex-direction: column;\n  gap: 14px;\n}\n\n.argus-drop-zone {\n  border: 2px dashed #cbd5e1;\n  background: #f8fafc;\n  border-radius: 16px;\n  padding: 24px 16px;\n  text-align: center;\n  cursor: pointer;\n  transition: all 0.2s ease;\n}\n\n.argus-drop-zone.drag-active {\n  border-color: #059669;\n  background: #ecfdf5;\n  transform: scale(1.02);\n}\n\n.argus-drop-zone-icon {\n  width: 44px;\n  height: 44px;\n  margin: 0 auto 8px auto;\n  border-radius: 12px;\n  background: #d1fae5;\n  color: #059669;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 20px;\n}\n\n.argus-drop-title {\n  font-size: 12px;\n  font-weight: 700;\n  color: #0f172a;\n  margin-bottom: 4px;\n}\n\n.argus-drop-desc {\n  font-size: 10px;\n  color: #64748b;\n  line-height: 1.4;\n}\n\n.argus-score-card {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 16px;\n  padding: 14px;\n  cursor: pointer;\n  transition: all 0.2s ease;\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);\n}\n\n.argus-score-card:hover {\n  border-color: #4f46e5;\n  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.15);\n  transform: translateY(-1px);\n}\n\n.argus-score-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 10px;\n}\n\n.argus-filename {\n  font-size: 12px;\n  font-weight: 800;\n  color: #0f172a;\n  max-width: 180px;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.argus-risk-pill {\n  font-size: 10px;\n  font-weight: 800;\n  padding: 3px 8px;\n  border-radius: 6px;\n}\n\n.argus-risk-pill.critical { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }\n.argus-risk-pill.suspicious { background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }\n.argus-risk-pill.safe { background: #d1fae5; color: #047857; border: 1px solid #6ee7b7; }\n\n.argus-meter-bar {\n  width: 100%;\n  height: 6px;\n  background: #f1f5f9;\n  border-radius: 9999px;\n  overflow: hidden;\n  margin-bottom: 10px;\n}\n\n.argus-meter-fill {\n  height: 100%;\n  border-radius: 9999px;\n  transition: width 0.4s ease;\n}\n\n.argus-open-native-app {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding-top: 10px;\n  border-top: 1px solid #f1f5f9;\n  font-size: 11px;\n  font-weight: 700;\n  color: #4f46e5;\n}\n\n.argus-loading-spinner {\n  display: inline-block;\n  width: 20px;\n  height: 20px;\n  border: 2px solid #cbd5e1;\n  border-top-color: #059669;\n  border-radius: 50%;\n  animation: argusSpin 0.6s linear infinite;\n}\n\n@keyframes argusSpin {\n  to { transform: rotate(360deg); }\n}\n';
  const style = document.createElement('style');
  style.id = 'argus-wa-styles';
  style.textContent = css;
  if (!document.getElementById('argus-wa-styles')) document.head.appendChild(style);

  
(function () {
  console.log('[ARGUS] Initializing WhatsApp Web Interceptor...');

  const API_BASE = 'http://localhost:8000/api/v1';
  const NATIVE_APP_BASE = 'http://localhost:5173';

  if (document.getElementById('argus-wa-interceptor-root')) {
    return;
  }

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

})();