// ==========================================
// CONFIG & STATE
// ==========================================
const CONFIG = {
    wallpaper: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop",
    memes: [
        "https://files.catbox.moe/lf4i26.jpg", // Meme 1
        "https://files.catbox.moe/mds278.jpg", // Meme 2
        "https://files.catbox.moe/27e41w.jpg"  // Meme 3
    ],
    // รายการแอพพลิเคชันทั้งหมดตามที่คุณต้องการ
    apps: [
        // 1) การโทร / สื่อสาร
        { id: 'phone', label: 'Phone', icon: 'fa-phone', color: 'bg-phone', enabled: false },
        { id: 'contacts', label: 'Contacts', icon: 'fa-address-book', color: 'bg-con', enabled: true },
        { id: 'messages', label: 'Messages', icon: 'fa-comment', color: 'bg-phone', enabled: false },
        // 2) อินเทอร์เน็ต / การใช้งานออนไลน์
        { id: 'browser', label: 'Chrome', icon: 'fa-globe', color: 'bg-web', enabled: false },
        { id: 'calendar', label: 'Calendar', icon: 'fa-calendar', color: 'bg-cal', enabled: false },
        { id: 'weather', label: 'Weather', icon: 'fa-cloud-sun', color: 'bg-phone', enabled: false },
        { id: 'clock', label: 'Clock', icon: 'fa-clock', color: 'bg-tools', enabled: false },
        { id: 'maps', label: 'Maps', icon: 'fa-map-location-dot', color: 'bg-web', enabled: false },
        // 3) รูปภาพ / วิดีโอ
        { id: 'camera', label: 'Camera', icon: 'fa-camera', color: 'bg-tools', enabled: false },
        { id: 'gallery', label: 'Photos', icon: 'fa-images', color: 'bg-gal', enabled: true }, // Gallery is now "Photos"
        // 4) ไฟล์ / จัดการข้อมูล
        { id: 'files', label: 'Files', icon: 'fa-folder', color: 'bg-tools', enabled: false },
        // 5) เครื่องมือพื้นฐาน
        { id: 'calc', label: 'Calculator', icon: 'fa-calculator', color: 'bg-tools', enabled: false },
        { id: 'notes', label: 'Notes', icon: 'fa-note-sticky', color: 'bg-note', enabled: false },
        { id: 'voice', label: 'Voice Rec.', icon: 'fa-microphone', color: 'bg-tools', enabled: false },
        // 6) ระบบ / การตั้งค่า
        { id: 'settings', label: 'Settings', icon: 'fa-gear', color: 'bg-set', enabled: false },
        { id: 'store', label: 'Play Store', icon: 'fa-bag-shopping', color: 'bg-web', enabled: false },
        // 🎨 แอพโซเชียลที่มักมีกันเอง (เน้นตัวที่ใช้คุยได้)
        { id: 'chat_app', label: 'WhatsApp', icon: 'fa-whatsapp', color: 'bg-chat', enabled: true }, // This is the main chat app
        { id: 'line', label: 'LINE', icon: 'fa-line', color: 'bg-chat', enabled: false },
        { id: 'discord', label: 'Discord', icon: 'fa-discord', color: 'bg-set', enabled: false },
        { id: 'tiktok', label: 'TikTok', icon: 'fa-tiktok', color: 'bg-social', enabled: false },
        { id: 'x', label: 'X', icon: 'fa-x-twitter', color: 'bg-set', enabled: false },
        // 🎧 แอพความบันเทิง / Media
        { id: 'youtube', label: 'YouTube', icon: 'fa-youtube', color: 'bg-media', enabled: false },
        { id: 'spotify', label: 'Spotify', icon: 'fa-spotify', color: 'bg-media', enabled: false },
        // 💰 การเงิน / ธนาคาร (Dummy)
        { id: 'bank', label: 'Bank App', icon: 'fa-building-columns', color: 'bg-tools', enabled: false },
    ]
};

let activePhoneChar = null; 
let phoneChatHistory = [];
let currentApp = 'launcher';

// ==========================================
// 2. INITIALIZATION AND SETUP
// ==========================================
jQuery(async () => {
    // Clean up old elements
    $('#silly-phone-root, #phone-trigger-btn').remove();

    // Trigger Button
    $('body').append(`<div id="phone-trigger-btn" style="z-index: 20001; position: fixed; bottom: 30px; left: 30px; width: 60px; height: 60px; background: #0072ff; border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; color: white; font-size: 28px; cursor: pointer;"><i class="fa-solid fa-mobile-screen"></i></div>`);

    // Build Phone UI
    const phoneHTML = buildPhoneUI();
    $('body').append(phoneHTML);
    
    // Load App Icons onto Launcher
    loadAppIcons();
    // Load Memes into Drawer/Gallery
    loadMemes();

    // Setup Event Listeners
    setupDragAndDrop();
    setupNavigation();
    setupChatEvents();
    updateClock();
});

// ==========================================
// 3. UI CONSTRUCTION
// ==========================================
function buildAppWindow(id, title) {
    // สร้างโครงสร้าง App Window สำหรับแอพที่ไม่ได้ระบุไว้ในโค้ด
    return `
        <div id="app-${id}" class="app-window" data-parent="launcher">
            <div class="app-header">
                <span class="back-btn" onclick="openApp('launcher')">❮ Back</span>
                <span class="app-title">${title}</span>
                <span></span>
            </div>
            <div class="app-content">
                <p>--- ${title} ---</p>
                <p>This is a dummy app. Functionality not implemented yet.</p>
                <p>System UI (Status Bar, Home Bar) is active.</p>
            </div>
        </div>
    `;
}

function buildPhoneUI() {
    let appWindows = '';
    
    // 1. Build Dummy App Windows
    CONFIG.apps.forEach(app => {
        if (!app.enabled && app.id !== 'chat_app') {
            appWindows += buildAppWindow(app.id, app.label);
        }
    });

    // 2. Build Active App Windows (Contacts, Chat, Gallery) - Copying V7/V8 structure
    appWindows += `
        <div id="app-contacts" class="app-window" data-parent="launcher">
            <div class="app-header">
                <span></span>
                <span class="app-title">Contacts</span>
                <span></span>
            </div>
            <div class="contact-list" id="contact-list-container"></div>
        </div>

        <div id="app-chat_app" class="app-window" data-parent="contacts">
            <div class="app-header">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="back-btn" onclick="openApp('contacts')">❮ Lists</div>
                    <img src="" id="chat-av" style="width:30px; height:30px; border-radius:50%; display:none;">
                    <span id="chat-nm">Select Contact</span>
                </div>
            </div>
            <div class="chat-body" id="chat-msgs">
                <div style="text-align:center; color:#999; margin-top:20px; font-size:12px;">
                    Select a contact to start chatting privately.
                </div>
            </div>
            <div class="chat-foot">
                <i class="fa-regular fa-face-smile" style="font-size:20px; color:#555; cursor:pointer;" id="btn-meme"></i>
                <input type="text" class="chat-input" id="chat-inp" placeholder="Message...">
                <i class="fa-solid fa-paper-plane" style="font-size:20px; color:#007aff; cursor:pointer;" id="btn-send"></i>
            </div>
            
            <div class="meme-drawer" id="meme-drawer">
                <div style="padding:10px; text-align:center; border-bottom:1px solid #eee; color:#ccc;">Select Meme (Swipe down to close)</div>
                <div class="meme-grid" id="meme-grid"></div>
            </div>
        </div>
        
        <div id="app-gallery" class="app-window" data-parent="launcher" style="background:#000;">
            <div class="app-header" style="background:#111; color:white; border:none;">
                <span class="back-btn" onclick="openApp('launcher')" style="color:#eee;">❮ Back</span>
                <span class="app-title" style="color:white;">Photos</span>
                <span></span>
            </div>
            <div class="meme-grid" id="gal-grid"></div>
        </div>
    `;

    return `
    <div id="silly-phone-root">
        <div class="phone-case" id="phone-drag-zone">
            <div class="screen" style="background-image: url('${CONFIG.wallpaper}');">
                <div class="dynamic-island"></div>
                <div class="status-bar">
                    <span id="ph-clock">9:00 PM</span>
                    <span><i class="fa-solid fa-signal"></i> 5G <i class="fa-solid fa-battery-half"></i></span>
                </div>

                <div id="app-launcher"></div>

                <div id="app-windows-container">
                    ${appWindows}
                </div>

                <div class="home-bar" id="btn-home"></div>
            </div>
        </div>
    </div>`;
}

function loadAppIcons() {
    const launcher = $('#app-launcher');
    CONFIG.apps.forEach(app => {
        const iconHtml = $(`
            <div class="app-icon-wrap" onclick="openApp('${app.id}')">
                <div class="app-icon ${app.color}">
                    <i class="fa-solid ${app.icon}"></i>
                </div>
                <div class="app-lbl">${app.label}</div>
            </div>
        `);
        launcher.append(iconHtml);
    });
}

function loadMemes() {
    const memeGrid = $('#meme-grid');
    const galGrid = $('#gal-grid');
    CONFIG.memes.forEach(url => {
        // Meme Drawer
        const img = $(`<img src="${url}" class="meme-thumb">`);
        img.click(() => {
            $('#meme-drawer').removeClass('show');
            sendGhostMsg(url, true); // User sends meme
        });
        memeGrid.append(img);

        // Gallery App
        galGrid.append(`<img src="${url}" class="meme-thumb">`);
    });
}

// ==========================================
// 4. SYSTEM NAVIGATION
// ==========================================
function setupNavigation() {
    window.openApp = (appName) => {
        // Hide all app windows first
        $('.app-window').removeClass('active');
        
        // Show the requested app
        const appElement = $(`#app-${appName}`);
        appElement.addClass('active');

        // Special logic for active apps
        if (appName === 'contacts') loadContacts();
        if (appName === 'chat_app' && !activePhoneChar) openApp('contacts'); // Go to contacts if chat is opened without selection
        
        currentApp = appName;
    };

    $('#btn-home').click(() => {
        // Return to launcher/home screen
        openApp('launcher');
    });
    
    // Initial State
    openApp('launcher');

    // Toggle Phone visibility
    $('#phone-trigger-btn').click(() => {
        $('#silly-phone-root').fadeToggle(300);
    });
}

// ==========================================
// 5. DRAG & DROP LOGIC
// ==========================================
function setupDragAndDrop() {
    const el = document.getElementById('silly-phone-root');
    const handle = document.getElementById('phone-drag-zone');
    let isDragging=false, startX, startY, initLeft, initTop;

    handle.addEventListener('mousedown', (e) => {
        // Do not drag if mouse down is on the screen/content area
        if(e.target.closest('.screen') && !e.target.closest('.home-bar')) return; 
        isDragging=true;
        startX=e.clientX; startY=e.clientY;
        const rect=el.getBoundingClientRect();
        initLeft=rect.left; initTop=rect.top;
        el.style.cursor='grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if(!isDragging) return;
        el.style.left = (initLeft + e.clientX - startX) + 'px';
        el.style.top = (initTop + e.clientY - startY) + 'px';
    });
    
    document.addEventListener('mouseup', () => { isDragging=false; el.style.cursor='default'; });
}

// ==========================================
// 6. CONTACTS LOGIC
// ==========================================
function loadContacts() {
    const listContainer = $('#contact-list-container');
    listContainer.empty();
    
    if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) {
        listContainer.html('<div style="padding:20px; text-align:center; color:#555;">SillyTavern context not found. Cannot load characters.</div>');
        return;
    }

    const context = SillyTavern.getContext();
    const characters = context.characters || [];
    
    if (characters.length === 0) {
        listContainer.html('<div style="padding:20px; text-align:center;">No characters found.</div>');
        return;
    }

    characters.forEach((char) => {
        if (!char || !char.avatar) return;

        const item = $(`
            <div class="contact-item">
                <img src="/characters/${char.avatar}" class="c-avatar" onerror="this.src='/img/question_mark.png';">
                <div class="c-info">
                    <span class="c-name">${char.name}</span>
                    <span class="c-status">Chat on WhatsApp...</span>
                </div>
            </div>
        `);

        item.click(() => {
            activePhoneChar = {
                name: char.name,
                avatar: `/characters/${char.avatar}`,
                persona: (char.description || '') + " " + (char.personality || '')
            };
            startChatWithActiveChar();
        });

        listContainer.append(item);
    });
}

function startChatWithActiveChar() {
    if(!activePhoneChar) return;

    $('#chat-nm').text(activePhoneChar.name);
    $('#chat-av').attr('src', activePhoneChar.avatar).show();
    
    $('#chat-msgs').html(`<div style="text-align:center; color:#999; margin-top:10px; font-size:12px;">Private Chat with ${activePhoneChar.name}</div>`);
    phoneChatHistory = []; // Reset history for the new contact

    openApp('chat_app');
}

// ==========================================
// 7. CHAT LOGIC (Strict Text & Bot Meme)
// ==========================================
function setupChatEvents() {
    $('#btn-send').click(() => sendGhostMsg());
    $('#chat-inp').on('keypress', (e) => { if(e.which===13) sendGhostMsg(); });
    $('#btn-meme').click(() => $('#meme-drawer').toggleClass('show'));
    $('.meme-drawer').click((e) => {
        if(e.target.className.includes('meme-drawer')) $('#meme-drawer').removeClass('show'); 
    });
}

async function sendGhostMsg(content = null, isImg = false) {
    if (!activePhoneChar) {
        alert("Please select a contact first!");
        openApp('contacts');
        return;
    }

    const input = $('#chat-inp');
    const text = content || input.val().trim();
    if(!text) return;
    input.val('');

    // 1. Show User Msg
    const html = isImg ? `<img src="${text}" class="msg-img">` : text;
    addBubble('user', html);

    // 2. Prepare Prompt (Strict Text-Only + Bot Meme Instruction)
    const userMessage = isImg ? '[The user sent a funny meme image]' : text;
    phoneChatHistory.push({ role: 'User', content: userMessage });
    
    // **คำสั่งที่กำหนดให้บอทตอบเป็นข้อความคุยล้วน หรือส่งมีม**
    let prompt = `You are roleplaying as ${activePhoneChar.name}. You are texting on an instant messenger. Your reply MUST be ONLY the text message content, OR ONLY the URL of one of the provided memes (Example: ${CONFIG.memes[0]}), if appropriate. DO NOT include any narration, actions, or feelings in your text reply. DO NOT use asterisks (*) or parentheses (). Keep replies short and realistic for texting.\n\n`;
    prompt += `Persona: ${activePhoneChar.persona}\n\n`;
    prompt += `Meme Options: ${CONFIG.memes.join(' | ')}\n\n`;
    prompt += `Chat History:\n`;
    
    phoneChatHistory.slice(-6).forEach(h => prompt += `${h.role}: ${h.content}\n`);
    prompt += `${activePhoneChar.name}:`;

    const loadingId = 'load-' + Date.now();
    addBubble('bot', `<span id="${loadingId}">...</span>`);

    try {
        const res = await fetch('/api/generate/text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                use_story: false, use_memory: false,
                single_line: true, max_length: 120, // max_length เพิ่มขึ้นเล็กน้อย
                temperature: 0.8
            })
        });
        const data = await res.json();
        const rawReply = data.results[0].text.trim();

        // 3. Process Bot Reply (Check if it's a Meme URL or Text)
        let finalReply = rawReply;
        let botSentImage = false;
        
        // Check if the reply is one of the meme URLs
        if (CONFIG.memes.some(memeUrl => rawReply.includes(memeUrl))) {
            const matchedUrl = CONFIG.memes.find(url => rawReply.includes(url));
            if (matchedUrl) {
                 finalReply = `<img src="${matchedUrl}" class="msg-img">`;
                 botSentImage = true;
            }
        }

        // Update display and history
        $(`#${loadingId}`).parent().html(finalReply);
        phoneChatHistory.push({ 
            role: activePhoneChar.name, 
            content: botSentImage ? '[Sent a Meme Image]' : rawReply 
        });

    } catch(e) {
        $(`#${loadingId}`).parent().text("Error connecting to AI");
    }
}

function addBubble(role, html) {
    const d = $('#chat-msgs');
    d.append(`<div class="msg-bubble msg-${role}">${html}</div>`);
    d.scrollTop(d[0].scrollHeight);
}

// ==========================================
// 8. UTILITIES
// ==========================================
function updateClock() {
    const d = new Date();
    const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    $('#ph-clock').text(time);
    setTimeout(updateClock, 10000); // Update every 10 seconds
}
