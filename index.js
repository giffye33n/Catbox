// ==========================================
// CONFIG & STATE
// ==========================================
const CONFIG = {
    wallpaper: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop",
    memes: [
        "https://files.catbox.moe/lf4i26.jpg",
        "https://files.catbox.moe/mds278.jpg",
        "https://files.catbox.moe/27e41w.jpg"
    ]
};

// เก็บข้อมูลตัวละครที่คุยด้วยในมือถือ
let activePhoneChar = null; 
let phoneChatHistory = [];

jQuery(async () => {
    // Clean up
    $('#silly-phone-root, #phone-trigger-btn').remove();

    // Trigger Button
    $('body').append(`<div id="phone-trigger-btn"><i class="fa-solid fa-mobile-screen"></i></div>`);

    // Phone HTML Structure
    const phoneHTML = `
    <div id="silly-phone-root">
        <div class="phone-case" id="phone-drag-zone">
            <div class="screen" style="background-image: url('${CONFIG.wallpaper}');">
                <div class="dynamic-island"></div>
                <div class="status-bar">
                    <span id="ph-clock">12:00</span>
                    <span><i class="fa-solid fa-wifi"></i> 5G</span>
                </div>

                <div class="app-grid">
                    <div class="app-icon-wrap" onclick="openApp('contacts')">
                        <div class="app-icon bg-con"><i class="fa-solid fa-address-book"></i></div>
                        <div class="app-lbl">Contacts</div>
                    </div>
                    <div class="app-icon-wrap" onclick="openApp('chat')">
                        <div class="app-icon bg-chat"><i class="fa-solid fa-comment-dots"></i></div>
                        <div class="app-lbl">Chat</div>
                    </div>
                    <div class="app-icon-wrap" onclick="openApp('gallery')">
                        <div class="app-icon bg-gal"><i class="fa-solid fa-images"></i></div>
                        <div class="app-lbl">Gallery</div>
                    </div>
                </div>

                <div id="app-contacts" class="app-window">
                    <div class="chat-head" style="background:white;">
                        <span style="font-size:20px;">Contacts</span>
                    </div>
                    <div class="contact-list" id="contact-list-container">
                        </div>
                </div>

                <div id="app-chat" class="app-window">
                    <div class="chat-head">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div class="back-btn" onclick="openApp('contacts')">❮ Lists</div>
                            <img src="" id="chat-av" style="width:30px; height:30px; border-radius:50%; display:none;">
                            <span id="chat-nm">No Contact</span>
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
                        <div style="padding:10px; text-align:center; border-bottom:1px solid #eee; color:#ccc;">Swipe down to close</div>
                        <div class="meme-grid" id="meme-grid"></div>
                    </div>
                </div>

                <div id="app-gallery" class="app-window" style="background:#000;">
                    <div class="chat-head" style="background:#111; color:white; border:none;">Photos</div>
                    <div class="meme-grid" id="gal-grid"></div>
                </div>

                <div class="home-bar" id="btn-home"></div>
            </div>
        </div>
    </div>`;

    $('body').append(phoneHTML);

    // ==========================================
    // LOGIC: CONTACTS (หัวใจสำคัญ)
    // ==========================================
    window.loadContacts = () => {
        const listContainer = $('#contact-list-container');
        listContainer.empty();

        // ดึงข้อมูลตัวละครทั้งหมดจาก SillyTavern
        const context = SillyTavern.getContext();
        
        if (!context || !context.characters || context.characters.length === 0) {
            listContainer.html('<div style="padding:20px; text-align:center;">No characters found.</div>');
            return;
        }

        // วนลูปสร้างรายการ
        context.characters.forEach((char, index) => {
            if (!char || !char.avatar) return; // ข้ามตัวที่ข้อมูลไม่ครบ

            const item = $(`
                <div class="contact-item">
                    <img src="/characters/${char.avatar}" class="c-avatar">
                    <div class="c-info">
                        <span class="c-name">${char.name}</span>
                        <span class="c-status">Click to chat</span>
                    </div>
                </div>
            `);

            item.click(() => {
                // ตั้งค่าตัวละครที่จะคุยด้วยในมือถือ
                activePhoneChar = {
                    name: char.name,
                    avatar: `/characters/${char.avatar}`,
                    persona: char.description + " " + char.personality
                };
                
                // เปลี่ยนหน้าไปห้องแชท
                startChatWithActiveChar();
            });

            listContainer.append(item);
        });
    };

    function startChatWithActiveChar() {
        if(!activePhoneChar) return;

        // อัปเดตหัวข้อแชท
        $('#chat-nm').text(activePhoneChar.name);
        $('#chat-av').attr('src', activePhoneChar.avatar).show();
        
        // เคลียร์แชทเก่า (หรือจะทำระบบเก็บแยกแต่ละคนก็ได้ แต่นี่เอาแบบง่ายก่อน)
        $('#chat-msgs').html(`<div style="text-align:center; color:#999; margin-top:10px; font-size:12px;">Private Chat with ${activePhoneChar.name}</div>`);
        phoneChatHistory = []; // รีเซ็ตประวัติคุย

        openApp('chat');
    }

    // ==========================================
    // LOGIC: CHAT & MEMES
    // ==========================================
    
    // โหลดรูปมีม
    const memeGrid = $('#meme-grid');
    const galGrid = $('#gal-grid');
    CONFIG.memes.forEach(url => {
        const img = $(`<img src="${url}" class="meme-thumb">`);
        img.click(() => {
            $('#meme-drawer').removeClass('show');
            sendGhostMsg(url, true);
        });
        memeGrid.append(img);
        galGrid.append(`<img src="${url}" class="meme-thumb">`);
    });

    $('#btn-meme').click(() => $('#meme-drawer').toggleClass('show'));
    $('.meme-drawer').click((e) => {
        if(e.target.className.includes('meme-drawer')) $('#meme-drawer').removeClass('show'); 
    });

    // ส่งข้อความ
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

        // 2. Prepare Prompt
        phoneChatHistory.push({ role: 'User', content: isImg ? '[Sent an image]' : text });
        
        let prompt = `Write a text message reply as ${activePhoneChar.name}.\n`;
        prompt += `Persona: ${activePhoneChar.persona}\n`;
        prompt += `Context: Smartphone chat app. Short, casual reply.\n\nChat History:\n`;
        
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
                    single_line: true, max_length: 100
                })
            });
            const data = await res.json();
            const reply = data.results[0].text.trim();

            $(`#${loadingId}`).parent().text(reply);
            phoneChatHistory.push({ role: activePhoneChar.name, content: reply });
        } catch(e) {
            $(`#${loadingId}`).parent().text("Error connecting to AI");
        }
    }

    function addBubble(role, html) {
        const d = $('#chat-msgs');
        d.append(`<div class="msg-bubble msg-${role}">${html}</div>`);
        d.scrollTop(d[0].scrollHeight);
    }

    $('#btn-send').click(() => sendGhostMsg());
    $('#chat-inp').on('keypress', (e) => { if(e.which===13) sendGhostMsg(); });

    // ==========================================
    // LOGIC: NAVIGATION & DRAG
    // ==========================================
    window.openApp = (appName) => {
        if (appName === 'contacts') loadContacts();
        $(`#app-${appName}`).addClass('active');
    };

    $('#btn-home').click(() => {
        $('.app-window').removeClass('active');
        $('#meme-drawer').removeClass('show');
    });

    $('#phone-trigger-btn').click(() => {
        $('#silly-phone-root').fadeToggle();
    });

    // Draggable Logic
    const el = document.getElementById('silly-phone-root');
    const handle = document.getElementById('phone-drag-zone');
    let isDragging=false, startX, startY, initLeft, initTop;

    handle.addEventListener('mousedown', (e) => {
        if(e.target.closest('.screen')) return; 
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

    // Clock
    setInterval(() => {
        const d = new Date();
        $('#ph-clock').text(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    }, 1000);
});

// ส่งข้อความและคุยกับบอท (Ghost Mode)
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

    // 2. Prepare Prompt (ส่วนสำคัญที่ถูกแก้ไข)
    phoneChatHistory.push({ role: 'User', content: isImg ? '[Sent an image]' : text });
    
    // **คำสั่งที่กำหนดให้บอทตอบเป็นข้อความคุยเท่านั้น:**
    let prompt = `You are roleplaying as ${activePhoneChar.name}. You are texting on an instant messenger. Your reply MUST be ONLY the text message content, without any narration, descriptions of actions, feelings, or atmosphere. DO NOT use asterisks (*) or parentheses () for actions/emotions. Keep replies short and realistic for texting.\n`;
    prompt += `Persona: ${activePhoneChar.persona}\n\n`;
    prompt += `Chat History:\n`;
    
    // ใส่ประวัติการคุย
    phoneChatHistory.slice(-6).forEach(h => prompt += `${h.role}: ${h.content}\n`);
    prompt += `${activePhoneChar.name}:`;

    const loadingId = 'load-' + Date.now();
    addBubble('bot', `<span id="${loadingId}">...</span>`);

    try {
        // ยิง API ไปหา LLM
        const res = await fetch('/api/generate/text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                use_story: false, use_memory: false,
                single_line: true, max_length: 100 // จำกัดให้ตอบสั้น
            })
        });
        const data = await res.json();
        const reply = data.results[0].text.trim();

        $(`#${loadingId}`).parent().text(reply);
        phoneChatHistory.push({ role: activePhoneChar.name, content: reply });
    } catch(e) {
        $(`#${loadingId}`).parent().text("Error connecting to AI");
    }
}
