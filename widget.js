(function() {
  // ====== CONFIG ======
  // IMPORTANT: Change this to your real n8n webhook URL once n8n is set up
  const API_ENDPOINT = 'https://jaxsonl.app.n8n.cloud/webhook/chat';
  const scriptTag = document.currentScript;
  const SHOP_ID = scriptTag.getAttribute('data-shop-id') || 'default';
  const SESSION_ID = 'sess_' + Math.random().toString(36).slice(2) + Date.now();

  // ====== STYLES ======
  const styles = `
    .rbot-launcher {
      position: fixed; bottom: 20px; right: 20px; z-index: 999999;
      width: 60px; height: 60px; border-radius: 50%;
      background: #2563eb; color: white; border: none; cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; transition: transform 0.2s;
    }
    .rbot-launcher:hover { transform: scale(1.05); }
    .rbot-window {
      position: fixed; bottom: 90px; right: 20px; z-index: 999999;
      width: 360px; height: 520px; max-height: 80vh;
      background: white; border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      display: none; flex-direction: column; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .rbot-window.rbot-open { display: flex; }
    .rbot-header {
      background: #2563eb; color: white; padding: 16px;
      font-weight: 600; display: flex; justify-content: space-between; align-items: center;
    }
    .rbot-header-sub { font-size: 12px; font-weight: 400; opacity: 0.85; margin-top: 2px; }
    .rbot-close { background: none; border: none; color: white; cursor: pointer; font-size: 20px; padding: 0; }
    .rbot-messages { flex: 1; overflow-y: auto; padding: 16px; background: #f8fafc; }
    .rbot-msg { margin-bottom: 12px; display: flex; }
    .rbot-msg.rbot-user { justify-content: flex-end; }
    .rbot-bubble {
      max-width: 75%; padding: 10px 14px; border-radius: 16px;
      font-size: 14px; line-height: 1.4; word-wrap: break-word;
    }
    .rbot-bot .rbot-bubble { background: white; color: #1e293b; border: 1px solid #e2e8f0; }
    .rbot-user .rbot-bubble { background: #2563eb; color: white; }
    .rbot-input-row { display: flex; padding: 12px; background: white; border-top: 1px solid #e2e8f0; gap: 8px; }
    .rbot-input {
      flex: 1; padding: 10px 12px; border: 1px solid #e2e8f0;
      border-radius: 20px; font-size: 14px; outline: none;
    }
    .rbot-input:focus { border-color: #2563eb; }
    .rbot-send {
      background: #2563eb; color: white; border: none; border-radius: 20px;
      padding: 0 16px; cursor: pointer; font-weight: 600;
    }
    .rbot-send:disabled { opacity: 0.5; cursor: not-allowed; }
    .rbot-typing { font-style: italic; color: #64748b; font-size: 13px; padding: 0 16px 8px; }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // ====== HTML ======
  const launcher = document.createElement('button');
  launcher.className = 'rbot-launcher';
  launcher.innerHTML = '💬';
  launcher.setAttribute('aria-label', 'Open chat');
  document.body.appendChild(launcher);

  const win = document.createElement('div');
  win.className = 'rbot-window';
  win.innerHTML = `
    <div class="rbot-header">
      <div>
        <div>Repair Help</div>
        <div class="rbot-header-sub">Usually replies in under a minute</div>
      </div>
      <button class="rbot-close" aria-label="Close">×</button>
    </div>
    <div class="rbot-messages" id="rbot-messages"></div>
    <div class="rbot-typing" id="rbot-typing" style="display:none;">Typing…</div>
    <div class="rbot-input-row">
      <input class="rbot-input" id="rbot-input" placeholder="Describe your broken device..." />
      <button class="rbot-send" id="rbot-send">Send</button>
    </div>
  `;
  document.body.appendChild(win);

  // ====== ELEMENTS ======
  const messagesEl = win.querySelector('#rbot-messages');
  const inputEl = win.querySelector('#rbot-input');
  const sendBtn = win.querySelector('#rbot-send');
  const typingEl = win.querySelector('#rbot-typing');
  const closeBtn = win.querySelector('.rbot-close');

  // ====== OPEN/CLOSE ======
  let hasOpened = false;
  launcher.addEventListener('click', () => {
    win.classList.add('rbot-open');
    if (!hasOpened) {
      hasOpened = true;
      addMessage('bot', "Hey! What's going on with your device? Tell me the make, model, and what's wrong and I'll get you a quote.");
    }
  });
  closeBtn.addEventListener('click', () => win.classList.remove('rbot-open'));

  // ====== MESSAGE FUNCTIONS ======
  function addMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = 'rbot-msg rbot-' + role;
    msg.innerHTML = `<div class="rbot-bubble"></div>`;
    msg.querySelector('.rbot-bubble').textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    addMessage('user', text);
    inputEl.value = '';
    sendBtn.disabled = true;
    typingEl.style.display = 'block';

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: SHOP_ID,
          session_id: SESSION_ID,
          message: text,
          page_url: window.location.href
        })
      });
      const data = await response.json();
      addMessage('bot', data.reply || "Sorry, I had trouble — can you try again?");
    } catch (e) {
      addMessage('bot', "Connection issue on my end. Try again in a sec, or call the shop directly.");
    } finally {
      typingEl.style.display = 'none';
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
})();
