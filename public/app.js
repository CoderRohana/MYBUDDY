// ===== MY BUDDY - Frontend App =====

let authToken = null;
let currentUser = null;
let chatHistory = [];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('mb_token');
  if (saved) {
    verifyAndLogin(saved);
  }
});

async function verifyAndLogin(token) {
  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json();
    if (data.valid) {
      authToken = token;
      currentUser = { username: data.user.username };
      showChatScreen();
    } else {
      localStorage.removeItem('mb_token');
    }
  } catch {
    localStorage.removeItem('mb_token');
  }
}

// ===== AUTH TABS =====
function switchTab(tab) {
  document.getElementById('loginTab').classList.toggle('active', tab === 'login');
  document.getElementById('registerTab').classList.toggle('active', tab === 'register');
  document.getElementById('loginForm').classList.toggle('active', tab === 'login');
  document.getElementById('registerForm').classList.toggle('active', tab === 'register');
  document.getElementById('loginError').textContent = '';
  document.getElementById('registerError').textContent = '';
}

// ===== LOGIN =====
async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const btn = document.querySelector('#loginForm .btn-primary');

  errEl.textContent = '';
  if (!email || !password) { errEl.textContent = 'Please fill in all fields.'; return; }

  setLoading(btn, true);
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Login failed.'; return; }
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('mb_token', data.token);
    showChatScreen();
  } catch {
    errEl.textContent = 'Network error. Please try again.';
  } finally {
    setLoading(btn, false);
  }
}

// ===== REGISTER =====
async function handleRegister() {
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errEl = document.getElementById('registerError');
  const btn = document.querySelector('#registerForm .btn-primary');

  errEl.textContent = '';
  if (!username || !email || !password) { errEl.textContent = 'Please fill in all fields.'; return; }

  setLoading(btn, true);
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Registration failed.'; return; }
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('mb_token', data.token);
    showChatScreen();
  } catch {
    errEl.textContent = 'Network error. Please try again.';
  } finally {
    setLoading(btn, false);
  }
}

// Enter key for forms
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('authScreen').classList.contains('active')) {
    const isLogin = document.getElementById('loginForm').classList.contains('active');
    if (isLogin) handleLogin();
    else handleRegister();
  }
});

// ===== SHOW CHAT =====
function showChatScreen() {
  document.getElementById('authScreen').classList.remove('active');
  document.getElementById('chatScreen').classList.add('active');
  const name = currentUser?.username || 'User';
  document.getElementById('sidebarUsername').textContent = name;
  document.getElementById('sidebarAvatar').textContent = name[0].toUpperCase();
  document.getElementById('headerGreeting').textContent = `Hi, ${name}! 👋`;
  document.getElementById('messageInput').focus();
}

// ===== LOGOUT =====
function handleLogout() {
  authToken = null;
  currentUser = null;
  chatHistory = [];
  localStorage.removeItem('mb_token');
  document.getElementById('chatScreen').classList.remove('active');
  document.getElementById('authScreen').classList.add('active');
  document.getElementById('messagesList').innerHTML = '';
  document.getElementById('welcomeArea').style.display = 'flex';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
}

// ===== SIDEBAR =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ===== NEW CHAT =====
function startNewChat() {
  chatHistory = [];
  document.getElementById('messagesList').innerHTML = '';
  document.getElementById('welcomeArea').style.display = 'flex';
  document.getElementById('messageInput').focus();
  if (window.innerWidth <= 700) toggleSidebar();
}

// ===== SUGGESTION CHIPS =====
function useSuggestion(el) {
  const text = el.textContent.replace(/^[^\s]+\s/, '');
  document.getElementById('messageInput').value = text;
  document.getElementById('messageInput').focus();
  document.getElementById('welcomeArea').style.display = 'none';
}

// ===== SEND MESSAGE =====
async function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text) return;

  // Hide welcome
  document.getElementById('welcomeArea').style.display = 'none';

  // Add user message
  input.value = '';
  autoResize(input);
  addMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  // Disable send btn
  const sendBtn = document.getElementById('sendBtn');
  sendBtn.disabled = true;

  // Show typing
  const typingId = showTyping();

  try {
    const res = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ message: text, history: chatHistory.slice(0, -1) })
    });

    const data = await res.json();
    removeTyping(typingId);

    if (!res.ok) {
      addMessage('buddy', `⚠️ ${data.error || 'Something went wrong. Please try again.'}`);
      return;
    }

    addMessage('buddy', data.response);
    chatHistory.push({ role: 'assistant', content: data.response });

    // Keep history manageable
    if (chatHistory.length > 40) chatHistory = chatHistory.slice(-40);

  } catch (err) {
    removeTyping(typingId);
    addMessage('buddy', '⚠️ Network error. Please check your connection and try again.');
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

// ===== ADD MESSAGE TO DOM =====
function addMessage(role, text) {
  const list = document.getElementById('messagesList');
  const isUser = role === 'user';
  const name = isUser ? (currentUser?.username || 'You') : 'MY BUDDY';
  const initial = isUser ? (currentUser?.username?.[0]?.toUpperCase() || 'U') : 'B';

  const div = document.createElement('div');
  div.className = `message ${isUser ? 'user' : 'buddy'}`;
  div.innerHTML = `
    <div class="msg-avatar">${initial}</div>
    <div class="msg-content">
      <span class="msg-sender">${name}</span>
      <div class="msg-bubble">${isUser ? escapeHtml(text) : formatMarkdown(text)}</div>
    </div>
  `;

  list.appendChild(div);
  scrollToBottom();
}

// ===== TYPING INDICATOR =====
function showTyping() {
  const id = 'typing_' + Date.now();
  const list = document.getElementById('messagesList');
  const div = document.createElement('div');
  div.className = 'message buddy';
  div.id = id;
  div.innerHTML = `
    <div class="msg-avatar">B</div>
    <div class="msg-content">
      <span class="msg-sender">MY BUDDY</span>
      <div class="msg-bubble typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  list.appendChild(div);
  scrollToBottom();
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ===== FORMAT MARKDOWN (basic) =====
function formatMarkdown(text) {
  // Escape HTML first for safety
  let t = escapeHtml(text);

  // Code blocks (triple backtick)
  t = t.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`;
  });

  // Inline code
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold **text**
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic *text*
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Headers
  t = t.replace(/^### (.+)$/gm, '<h4 style="margin:8px 0 4px;color:var(--accent2)">$1</h4>');
  t = t.replace(/^## (.+)$/gm, '<h3 style="margin:10px 0 4px;color:var(--accent2)">$1</h3>');
  t = t.replace(/^# (.+)$/gm, '<h2 style="margin:10px 0 6px;color:var(--accent2)">$1</h2>');

  // Bullet lists
  t = t.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
  t = t.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Numbered lists
  t = t.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Horizontal rule
  t = t.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:10px 0">');

  // Newlines to <br> (only outside block elements)
  t = t.replace(/\n(?!<\/?(pre|ul|ol|li|h[1-6]|hr))/g, '<br>');

  return t;
}

// ===== UTILS =====
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function scrollToBottom() {
  const container = document.getElementById('messagesContainer');
  setTimeout(() => {
    container.scrollTop = container.scrollHeight;
  }, 50);
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 150) + 'px';
}

function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector('.btn-text').style.display = loading ? 'none' : '';
  btn.querySelector('.btn-loader').style.display = loading ? 'inline' : 'none';
}
