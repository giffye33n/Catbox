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
    apps: [
        { id: 'phone', label: 'Phone', icon: 'fa-phone', color: 'bg-phone', enabled: true }, // ACTIVE
        { id: 'contacts', label: 'Contacts', icon: 'fa-address-book', color: 'bg-con', enabled: true }, 
        { id: 'chat_app', label: 'WhatsApp', icon: 'fa-whatsapp', color: 'bg-chat', enabled: true }, 
        { id: 'settings', label: 'Settings', icon: 'fa-gear', color: 'bg-set', enabled: true }, // ACTIVE
        { id: 'notes', label: 'Notes', icon: 'fa-note-sticky', color: 'bg-note', enabled: true }, // ACTIVE
        { id: 'gallery', label: 'Photos', icon: 'fa-images', color: 'bg-gal', enabled: true }, 
        // DUMMY APPS
        { id: 'browser', label: 'Chrome', icon: 'fa-globe', color: 'bg-web', enabled: false },
        { id: 'calendar', label: 'Calendar', icon: 'fa-calendar', color: 'bg-cal', enabled: false },
        { id: 'weather', label: 'Weather', icon: 'fa-cloud-sun', color: 'bg-phone', enabled: false },
        { id: 'tiktok', label: 'TikTok', icon: 'fa-tiktok', color: 'bg-social', enabled: false },
        { id: 'youtube', label: 'YouTube', icon: 'fa-youtube', color: 'bg-media', enabled: false },
        { id: 'bank', label: 'Bank App', icon: 'fa-building-columns', color: 'bg-tools', enabled: false },
    ],
    device: {
        model: 'SillyPhone 15 Pro Max',
        os: 'SillyOS 1.0',
        storage: '256GB'
    }
};

let activePhoneChar = null; 
let phoneChatHistory = [];
let localNotes = "Write your private notes here..."; // For Notes app

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
    
    loadAppIcons();
    loadMemes();

    setupDragAndDrop();
    setupNavigation();
    setupChatEvents();
    updateClock();
});

// ==========================================
// 3. UI CONSTRUCTION
// ==========================================
function buildAppWindow(id, title) {
    // สร้างโครงสร้าง App Window ที่ว่างเปล่าสำหรับ Dummy App
    return `
        <div id="app-${id}" class="app-window" data-parent="launcher">
            <div class="app-header">
                <span class="back-btn" onclick="openApp('launcher')">❮ Back</span>
                <span class="app-title">${title}</span>
                <span></span>
            </div>
            <div class="app-content app-content-center">
                <p style="margin-top: 100px; font-size: 16px;">--- ${title} ---</p>
                <p>This is a dummy app. Functionality not implemented yet.</p>
            </div>
        </div>
    `;
}

function buildPhoneUI() {
    let appWindows = '';
    
    // 1. Build Dummy App Windows
    CONFIG.apps.filter(app => !app.enabled).forEach(app => {
        appWindows += buildAppWindow(app.id, app.label);
    });

    // 2. Build Active App Windows (ใช้ฟังก์ชัน render แยกไป)
    appWindows += renderAppContacts();
    appWindows += renderAppChat();
    appWindows += renderAppGallery();
    appWindows += renderAppPhone(); // New active app
    appWindows += renderAppSettings(); // New active app
    appWindows += renderAppNotes(); // New active app
    
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
    launcher.empty();
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
    memeGrid.empty(); galGrid.empty();
    
    CONFIG.memes.forEach(url => {
        // Meme Drawer
        const img = $(`<img src="${url}" class="meme-thumb">`);
        img.click(() => {
            $('#meme-drawer').removeClass('show');
            sendGhostMsg(url, true);
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
        $('.app-window').removeClass('active');
        const appElement = $(`#app-${appName}`);
        appElement.addClass('active');

        if (appName === 'contacts') loadContacts();
        if (appName === 'chat_app' && !activePhoneChar) openApp('contacts');
        if (appName === 'notes') $('#notes-area').val(localNotes);
        
        // Hide meme drawer when switching apps
        $('#meme-drawer').removeClass('show');
    };

    $('#btn-home').click(() => {
        openApp('launcher');
    });
    
    openApp('launcher'); // Start on home screen

    $('#phone-trigger-btn').click(() => {
        $('#silly-phone-root').fadeToggle(300);
    });
}

// ==========================================
// 5. DRAG & DROP LOGIC
// ==========================================
function setupDragAndDrop() {
    // (Existing Drag & Drop logic remains here)
    const el = document.getElementById('silly-phone-root');
    const handle = document.getElementById('phone-drag-zone');
    let isDragging=false, startX, startY, initLeft, initTop;

    handle.addEventListener('mousedown', (e) => {
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
// 6. CONTACTS & CHAT LOGIC
// ==========================================
function renderAppContacts() {
    return `
        <div id="app-contacts" class="app-window" data-parent="launcher">
            <div class="app-header">
                <span></span>
                <span class="app-title">Contacts</span>
                <span></span>
            </div>
            <div class="contact-list" id="contact-list-container"></div>
        </div>
    `;
}

function loadContacts() { /* Existing logic to load characters from ST */
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

function renderAppChat() {
    // Chat app is now 'chat_app' (WhatsApp)
    return `
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
    `;
}

function startChatWithActiveChar() {
    if(!activePhoneChar) return;

    $('#chat-nm').text(activePhoneChar.name);
    $('#chat-av').attr('src', activePhoneChar.avatar).show();
    
    $('#chat-msgs').html(`<div style="text-align:center; color:#999; margin-top:10px; font-size:12px;">Private Chat with ${activePhoneChar.name}</div>`);
    phoneChatHistory = [];

    openApp('chat_app');
}

function setupChatEvents() {
    $('#btn-send').off('click').on('click', () => sendGhostMsg());
    $('#chat-inp').off('keypress').on('keypress', (e) => { if(e.which===13) sendGhostMsg(); });
    $('#btn-meme').off('click').on('click', () => $('#meme-drawer').toggleClass('show'));
    $('.meme-drawer').off('click').on('click', (e) => {
        if(e.target.className.includes('meme-drawer')) $('#meme-drawer').removeClass('show'); 
    });
}

// ** BUG FIX: The core function for bot reply **
async function sendGhostMsg(content = null, isImg = false) {
    if (!activePhoneChar) {
        alert("Please select a contact first in the Contacts App!");
        console.error("sendGhostMsg aborted: No activePhoneChar selected.");
        return;
    }

    const input = $('#chat-inp');
    const text = content || input.val().trim();
    if(!text) return;
    input.val('');

    // 1. Show User Msg
    const userMessage = isImg ? '[The user sent a funny meme image]' : text;
    const html = isImg ? `<img src="${content}" class="msg-img">` : text;
    addBubble('user', html);
    phoneChatHistory.push({ role: 'User', content: userMessage });
    
    // 2. Prepare Prompt (Strict Text-Only + Bot Meme Instruction)
    let prompt = `You are roleplaying as ${activePhoneChar.name}. You are texting on an instant messenger. Your reply MUST be ONLY the text message content, OR ONLY the URL of one of the provided memes (Example: ${CONFIG.memes[0]}), if appropriate. DO NOT include any narration, actions, or feelings in your text reply. DO NOT use asterisks (*) or parentheses (). Keep replies short and realistic for texting.\n\n`;
    prompt += `Persona: ${activePhoneChar.persona}\n\n`;
    prompt += `Meme Options: ${CONFIG.memes.join(' | ')}\n\n`;
    prompt += `Chat History:\n`;
    
    phoneChatHistory.slice(-6).forEach(h => prompt += `${h.role}: ${h.content}\n`);
    prompt += `${activePhoneChar.name}:`;

    const loadingId = 'load-' + Date.now();
    addBubble('bot', `<span id="${loadingId}">...</span>`);
    
    console.log("Sending prompt to API:", prompt); // DEBUG LOG

    try {
        const res = await fetch('/api/generate/text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                use_story: false, use_memory: false,
                single_line: true, max_length: 120, 
                temperature: 0.8
            })
        });

        if (!res.ok) {
            throw new Error(`API returned status ${res.status}`);
        }
        
        const data = await res.json();
        const rawReply = data.results[0].text.trim();

        // 3. Process Bot Reply
        let finalReply = rawReply;
        let botSentImage = false;
        
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
        console.error("AI Generation Failed:", e);
        $(`#${loadingId}`).parent().text("Connection Error. Check console for details.");
    }
}

function addBubble(role, html) {
    const d = $('#chat-msgs');
    d.append(`<div class="msg-bubble msg-${role}">${html}</div>`);
    d.scrollTop(d[0].scrollHeight);
}

// ==========================================
// 7. NEW DETAILED APP MOCKUPS
// ==========================================

function renderAppGallery() {
    return `
        <div id="app-gallery" class="app-window" data-parent="launcher" style="background:#000;">
            <div class="app-header" style="background:#111; color:white; border:none;">
                <span class="back-btn" onclick="openApp('launcher')" style="color:#eee;">❮ Back</span>
                <span class="app-title" style="color:white;">Photos</span>
                <span></span>
            </div>
            <div class="meme-grid" id="gal-grid" style="overflow-y:auto; padding:10px;"></div>
        </div>
    `;
}

function renderAppPhone() {
    return `
        <div id="app-phone" class="app-window" data-parent="launcher">
            <div class="app-header">
                <span class="back-btn" onclick="openApp('launcher')">❮ Back</span>
                <span class="app-title">Phone</span>
                <span></span>
            </div>
            <div class="app-content" style="padding: 10px 0;">
                <div style="height: 120px; display: flex; justify-content: center; align-items: center; font-size: 32px; font-weight: 300; border-bottom: 1px solid #eee;" id="dialer-number"></div>
                <div class="keypad">
                    <div class="key">1</div><div class="key">2</div><div class="key">3</div>
                    <div class="key">4</div><div class="key">5</div><div class="key">6</div>
                    <div class="key">7</div><div class="key">8</div><div class="key">9</div>
                    <div class="key">*</div><div class="key">0</div><div class="key">#</div>
                </div>
                <div style="display:flex; justify-content:center; padding: 20px;">
                    <div class="key call-btn" id="btn-call"><i class="fa-solid fa-phone"></i></div>
                </div>
                <div style="text-align:center; color:red; font-size:12px; padding:10px;" id="call-status"></div>
            </div>
        </div>
    `;
}

function renderAppSettings() {
    return `
        <div id="app-settings" class="app-window" data-parent="launcher">
            <div class="app-header">
                <span class="back-btn" onclick="openApp('launcher')">❮ Back</span>
                <span class="app-title">Settings</span>
                <span><i class="fa-solid fa-magnifying-glass"></i></span>
            </div>
            <div class="app-content" style="padding: 0;">
                <h3 style="padding:10px;">General</h3>
                <div class="setting-item"><span>Wi-Fi</span><span>On <i class="fa-solid fa-angle-right"></i></span></div>
                <div class="setting-item"><span>Bluetooth</span><span>Connected <i class="fa-solid fa-angle-right"></i></span></div>
                <h3 style="padding:10px;">Device Info</h3>
                <div class="setting-item"><span>Model</span><span>${CONFIG.device.model}</span></div>
                <div class="setting-item"><span>OS Version</span><span>${CONFIG.device.os}</span></div>
                <div class="setting-item"><span>Storage</span><span>${CONFIG.device.storage} used</span></div>
                <h3 style="padding:10px;">Character Link</h3>
                <div class="setting-item" onclick="openApp('contacts')"><span>Active Contact</span><span><span id="settings-active-char">N/A</span> <i class="fa-solid fa-angle-right"></i></span></div>
            </div>
        </div>
    `;
}

function renderAppNotes() {
    return `
        <div id="app-notes" class="app-window" data-parent="launcher">
            <div class="app-header">
                <span class="back-btn" onclick="openApp('launcher')">❮ Back</span>
                <span class="app-title">Notes</span>
                <span class="back-btn" id="btn-save-notes">Save</span>
            </div>
            <div class="app-content" style="padding: 0;">
                <textarea id="notes-area">${localNotes}</textarea>
            </div>
        </div>
    `;
}


// ==========================================
// 8. UTILITIES (Post-Render Setup)
// ==========================================

// Setup for Phone App
$(document).ready(() => {
    let currentNumber = '';
    const numberDisplay = $('#dialer-number');
    const callStatus = $('#call-status');

    // Keypad Click Event
    $('#app-phone .key').click(function() {
        const key = $(this).text().trim();
        if (key.length === 1) { // Numbers and symbols
            currentNumber += key;
            numberDisplay.text(currentNumber);
        }
    });

    // Call Button Event
    $('#btn-call').click(function() {
        if (!activePhoneChar) {
            callStatus.text("Select a contact before calling!");
            return;
        }
        if (currentNumber.length < 5) {
            callStatus.text("Invalid number.");
            return;
        }

        callStatus.text(`Calling ${activePhoneChar.name} at ${currentNumber}...`);
        
        // Simulation of a call reply (using chat logic, but quicker)
        setTimeout(() => {
            callStatus.text(`${activePhoneChar.name} answered: "Hello?"`);
            setTimeout(() => {
                callStatus.text(`Call ended: ${activePhoneChar.name} hung up.`);
                // Reset after simulation
                setTimeout(() => callStatus.text(""), 3000); 
            }, 3000);
        }, 2000);
    });

    // Setup for Notes App
    $('#btn-save-notes').click(() => {
        localNotes = $('#notes-area').val();
        alert('Note saved!');
        openApp('launcher');
    });

    // Clock
    setInterval(updateClock, 10000);
});

function updateClock() {
    const d = new Date();
    const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    $('#ph-clock').text(time);

    // Update settings active character display
    if (activePhoneChar) {
        $('#settings-active-char').text(activePhoneChar.name);
    }
}

// ** FIX: The core function for bot reply, now using window.API.generate **
async function sendGhostMsg(content = null, isImg = false) {
    if (!activePhoneChar) {
        alert("Please select a contact first in the Contacts App!");
        console.error("sendGhostMsg aborted: No activePhoneChar selected.");
        return;
    }

    const input = $('#chat-inp');
    const text = content || input.val().trim();
    if(!text) return;
    input.val('');

    // 1. Show User Msg
    const userMessage = isImg ? '[The user sent a funny meme image]' : text;
    const html = isImg ? `<img src="${content}" class="msg-img">` : text;
    addBubble('user', html);
    phoneChatHistory.push({ role: 'User', content: userMessage });
    
    // 2. Prepare Prompt (Strict Text-Only + Bot Meme Instruction)
    let prompt = `You are roleplaying as ${activePhoneChar.name}. You are texting on an instant messenger. Your reply MUST be ONLY the text message content, OR ONLY the URL of one of the provided memes (Example: ${CONFIG.memes[0]}), if appropriate. DO NOT include any narration, actions, or feelings in your text reply. DO NOT use asterisks (*) or parentheses (). Keep replies short and realistic for texting.\n\n`;
    prompt += `Persona: ${activePhoneChar.persona}\n\n`;
    prompt += `Meme Options: ${CONFIG.memes.join(' | ')}\n\n`;
    prompt += `Chat History:\n`;
    
    phoneChatHistory.slice(-6).forEach(h => prompt += `${h.role}: ${h.content}\n`);
    prompt += `${activePhoneChar.name}:`;

    const loadingId = 'load-' + Date.now();
    addBubble('bot', `<span id="${loadingId}">...</span>`);
    
    console.log("Sending prompt via API.generate:", prompt); // DEBUG LOG

    try {
        // *** CHANGE HERE: Use window.API.generate for secure communication ***
        const replyText = await window.API.generate({
            prompt: prompt,
            use_story: false, 
            use_memory: false,
            single_line: true, 
            max_length: 120, 
            temperature: 0.8
        });

        const rawReply = replyText.trim();

        // 3. Process Bot Reply
        let finalReply = rawReply;
        let botSentImage = false;
        
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
        console.error("AI Generation Failed (using window.API.generate):", e);
        $(`#${loadingId}`).parent().text("AI Error. Try selecting the character again.");
    }
}
