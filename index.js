// ==========================================
// 1. CONFIGURATION
// ==========================================
const CONFIG = {
    wallpaper: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop",
    memes: [
        "https://files.catbox.moe/lf4i26.jpg",
        "https://files.catbox.moe/mds278.jpg",
        "https://files.catbox.moe/27e41w.jpg"
    ]
};

// เก็บประวัติการคุยในมือถือ (แยกจากแชทหลัก)
let phoneContext = [];

// ==========================================
// 2. MAIN LOGIC
// ==========================================
jQuery(async () => {
    // Clean up old elements
    $('#silly-phone-root, #phone-trigger-btn').remove();

    // สร้างปุ่มเปิด
    $('body').append(`<div id="phone-trigger-btn"><i class="fa-solid fa-mobile-screen-button"></i></div>`);

    // สร้างโครงสร้างมือถือ (เหมือน V4)
    const phoneHTML = `
    <div id="silly-phone-root">
        <div class="phone-case" id="phone-drag-zone">
            <div class="screen" style="background-image: url('${CONFIG.wallpaper}');">
                <div class="dynamic-island"></div>
                <div class="status-bar">
                    <span id="ph-clock">12:00</span>
                    <span><i class="fa-solid fa-signal"></i> 5G</span>
                </div>

                <div class="app-grid">
                    <div class="app-icon-wrapper" onclick="openApp('chat')">
                        <div class="app-icon" style="background: linear-gradient(135deg, #25D366, #128C7E);">
                            <i class="fa-brands fa-whatsapp"></i>
                        </div>
                        <div class="app-label">Chat</div>
                    </div>
                    <div class="app-icon-wrapper" onclick="openApp('gallery')">
                        <div class="app-icon" style="background: linear-gradient(135deg, #FF9966, #FF5E62);">
                            <i class="fa-solid fa-images"></i>
                        </div>
                        <div class="app-label">CatBox</div>
                    </div>
                </div>

                <div id="app-chat" class="app-window">
                    <div class="chat-header">
                        <img src="" id="chat-avatar" style="width:30px; height:30px; border-radius:50%;">
                        <span id="chat-name">Bot</span>
                    </div>
                    <div class="chat-body" id="chat-history-box">
                        <div style="text-align:center; font-size:12px; color:#999; margin-top:20px;">
                            ข้อความลับ: ไม่เกี่ยวกับแชทหลัก
                        </div>
                    </div>
                    
                    <div class="meme-popup" id="meme-popup-area"></div>

                    <div class="chat-footer">
                        <i class="fa-regular fa-face-smile" style="font-size:20px; color:#555; cursor:pointer;" id="btn-meme"></i>
                        <input type="text" class="chat-input" id="chat-input-text" placeholder="Message...">
                        <i class="fa-solid fa-paper-plane" style="font-size:20px; color:#007aff; cursor:pointer;" id="btn-send-msg"></i>
                    </div>
                </div>

                <div id="app-gallery" class="app-window" style="background:#111; color:white;">
                    <div class="chat-header" style="background:#222; color:white; border:none;">CatBox Gallery</div>
                    <div style="padding:10px; display:grid; grid-template-columns:repeat(2,1fr); gap:10px;" id="gallery-grid"></div>
                </div>

                <div class="home-bar" id="btn-home"></div>
            </div>
        </div>
    </div>`;

    $('body').append(phoneHTML);

    // ==========================================
    // 3. ระบบลาก (Draggable) - ใช้ JQuery UI Logic ง่ายๆ
    // ==========================================
    const phoneEl = document.getElementById('silly-phone-root');
    const dragZone = document.getElementById('phone-drag-zone');
    let isDown = false, offset = [0,0];

    dragZone.addEventListener('mousedown', function(e) {
        // ถ้ากดโดนหน้าจอ (Screen) ไม่ต้องลาก
        if(e.target.closest('.screen')) return;
        
        isDown = true;
        offset = [
            phoneEl.offsetLeft - e.clientX,
            phoneEl.offsetTop - e.clientY
        ];
        phoneEl.style.cursor = 'grabbing';
    }, true);

    document.addEventListener('mouseup', function() {
        isDown = false;
        if(phoneEl) phoneEl.style.cursor = 'default';
    }, true);

    document.addEventListener('mousemove', function(e) {
        if (isDown) {
            e.preventDefault();
            phoneEl.style.left = (e.clientX + offset[0]) + 'px';
            phoneEl.style.top  = (e.clientY + offset[1]) + 'px';
        }
    }, true);

    // ==========================================
    // 4. ฟังก์ชันการทำงาน (Chat Logic)
    // ==========================================
    
    // โหลดรูปมีมเข้า Popup และ Gallery
    const memeArea = $('#meme-popup-area');
    const galleryArea = $('#gallery-grid');
    CONFIG.memes.forEach(url => {
        // ใน Popup แชท
        let img = $(`<img src="${url}" class="meme-item">`);
        img.click(() => {
            sendGhostMessage(url, true); // ส่งรูปแบบรูปภาพ
            memeArea.fadeOut();
        });
        memeArea.append(img);

        // ใน Gallery App
        galleryArea.append(`<img src="${url}" style="width:100%; border-radius:10px;">`);
    });

    // Toggle Meme Popup
    $('#btn-meme').click(() => {
        if(memeArea.css('display') === 'none') memeArea.css('display', 'grid');
        else memeArea.fadeOut();
    });

    // Send Message
    $('#btn-send-msg').click(() => sendGhostMessage());
    $('#chat-input-text').on('keypress', (e) => { if(e.which === 13) sendGhostMessage(); });

    // Core: ส่งข้อความและคุยกับบอท (Ghost Mode)
    async function sendGhostMessage(content = null, isImage = false) {
        const input = $('#chat-input-text');
        const text = content || input.val().trim();
        if(!text) return;
        
        input.val('');

        // 1. แสดงข้อความ User
        const displayHtml = isImage ? `<img src="${text}" class="msg-img">` : text;
        addBubble('user', displayHtml);

        // 2. เตรียมข้อมูลคุยกับบอท
        const context = SillyTavern.getContext();
        const charId = context.characterId;
        const char = context.characters[charId];
        
        if (!char) {
            addBubble('bot', "Error: No character selected.");
            return;
        }

        // 3. สร้าง Prompt พิเศษ
        let prompt = `You are roleplaying as ${char.name} in a smartphone chat app. Reply briefly and casually.\n`;
        prompt += `Personality: ${char.description}\n\n`;
        prompt += `Chat History:\n`;
        
        // เอาประวัติ 5 ข้อความล่าสุด
        phoneContext.push({ role: 'User', content: isImage ? '[Sent an Image]' : text });
        phoneContext.slice(-6).forEach(log => {
            prompt += `${log.role}: ${log.content}\n`;
        });
        prompt += `${char.name}:`;

        // แสดง ... กำลังพิมพ์
        const loadingId = 'loading-' + Date.now();
        addBubble('bot', `<span id="${loadingId}">...</span>`);

        try {
            // ยิง API (Generate Text)
            const result = await fetch('/api/generate/text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    use_story: false, use_memory: false, use_authors_note: false,
                    single_line: true, max_length: 80, temperature: 0.7
                })
            });
            const data = await result.json();
            const reply = data.results[0].text.trim();

            // อัพเดตข้อความบอท
            $(`#${loadingId}`).parent().text(reply);
            phoneContext.push({ role: char.name, content: reply });

        } catch (err) {
            $(`#${loadingId}`).parent().text("Connection Error.");
        }
    }

    function addBubble(role, html) {
        const box = $('#chat-history-box');
        box.append(`<div class="msg-bubble msg-${role}">${html}</div>`);
        box.scrollTop(box[0].scrollHeight);
    }

    // ==========================================
    // 5. App Navigation
    // ==========================================
    window.openApp = (appName) => {
        // อัพเดตข้อมูลตัวละครก่อนเปิดแชท
        if(appName === 'chat') {
            const context = SillyTavern.getContext();
            if(context.characters && context.characters[context.characterId]) {
                const char = context.characters[context.characterId];
                $('#chat-name').text(char.name);
                $('#chat-avatar').attr('src', '/characters/' + char.avatar);
            }
        }
        $(`#app-${appName}`).addClass('active');
    };

    $('#btn-home').click(() => {
        $('.app-window').removeClass('active');
    });

    $('#phone-trigger-btn').click(() => {
        const phone = $('#silly-phone-root');
        if(phone.css('display') === 'none') phone.fadeIn();
        else phone.fadeOut();
    });

    // Clock
    setInterval(() => {
        const d = new Date();
        $('#ph-clock').text(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    }, 1000);
});
