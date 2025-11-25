// ==========================================
// CONFIG: ตั้งค่ารูปและพื้นหลัง
// ==========================================
const CONFIG = {
    wallpaper: "https://images.unsplash.com/photo-1536566482680-fca31930a09d?q=80&w=1000&auto=format&fit=crop",
    memes: [
        { url: "https://files.catbox.moe/lf4i26.jpg", title: "Angry" },
        { url: "https://files.catbox.moe/mds278.jpg", title: "Love" },
        { url: "https://files.catbox.moe/27e41w.jpg", title: "Confused" },
    ]
};

const ROOT_ID = 'silly-phone-root';

// ==========================================
// MAIN LOGIC
// ==========================================
jQuery(async () => {
    // ล้างของเก่า
    $(`#${ROOT_ID}`).remove();
    $('#phone-trigger-btn').remove();

    // 1. สร้างปุ่มลอย
    const triggerBtn = $(`<div id="phone-trigger-btn"><i class="fa-solid fa-mobile-screen"></i></div>`);
    $('body').append(triggerBtn);

    // 2. สร้างโครงสร้างมือถือ
    const phoneHTML = `
    <div id="${ROOT_ID}">
        <div class="phone-case" id="phone-draggable-area">
            <div class="screen" style="background-image: url('${CONFIG.wallpaper}');">
                <div class="dynamic-island"></div>
                <div class="status-bar">
                    <span id="ph-clock">12:00</span>
                    <span><i class="fa-solid fa-wifi"></i> 100%</span>
                </div>

                <div class="app-grid">
                    <div class="app-icon-wrapper" onclick="window.openPhoneApp('contacts')">
                        <div class="app-icon bg-contacts"><i class="fa-solid fa-address-book"></i></div>
                        <div class="app-label">Contacts</div>
                    </div>
                    <div class="app-icon-wrapper" onclick="window.openPhoneApp('chat')">
                        <div class="app-icon bg-chat"><i class="fa-brands fa-whatsapp"></i></div>
                        <div class="app-label">Chat</div>
                    </div>
                    <div class="app-icon-wrapper" onclick="window.openPhoneApp('photos')">
                        <div class="app-icon bg-catbox"><i class="fa-solid fa-photo-film"></i></div>
                        <div class="app-label">CatBox</div>
                    </div>
                </div>

                <div id="app-contacts" class="app-window">
                    <div class="app-header">Contacts</div>
                    <div class="contact-list" id="ph-contact-list"></div>
                </div>

                <div id="app-chat" class="app-window">
                    <div class="app-header">
                        <span class="back-btn" onclick="window.closePhoneApps()">❮ Home</span>
                        <span id="chat-header-name">Chat</span>
                        <div style="width:20px;"></div>
                    </div>
                    <div class="chat-area">
                        <div class="chat-messages" id="ph-chat-msgs"></div>
                        <div class="chat-input-bar">
                            <input type="text" class="chat-input" id="ph-chat-input" placeholder="Message...">
                            <i class="fa-solid fa-paper-plane send-icon" id="ph-chat-send"></i>
                        </div>
                    </div>
                </div>

                <div id="app-photos" class="app-window">
                    <div class="app-header">
                        <span class="back-btn" onclick="window.closePhoneApps()">❮ Home</span>
                        <span>Photos</span>
                        <div style="width:20px;"></div>
                    </div>
                    <div class="gallery-grid" id="ph-gallery"></div>
                </div>

                <div class="home-indicator" id="ph-home-btn" title="Go Home"></div>
            </div>
        </div>
    </div>`;

    $('body').append(phoneHTML);

    // ==========================================
    // FEATURES IMPLEMENTATION
    // ==========================================

    // --- A. ระบบลากย้าย (Draggable) ---
    const phoneRoot = document.getElementById(ROOT_ID);
    const dragHandle = document.getElementById('phone-draggable-area');
    
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    dragHandle.addEventListener('mousedown', (e) => {
        // ป้องกันการลากเมื่อกดที่หน้าจอ (Screen)
        if(e.target.closest('.screen')) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = phoneRoot.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        
        dragHandle.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        phoneRoot.style.left = `${initialLeft + dx}px`;
        phoneRoot.style.top = `${initialTop + dy}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        dragHandle.style.cursor = 'grab';
    });


    // --- B. ระบบ Chat & Contacts ---
    
    // ฟังก์ชันโหลดรายชื่อตัวละครจาก SillyTavern
    function loadContacts() {
        const list = $('#ph-contact-list');
        list.empty();

        // ดึงจาก DOM ของ SillyTavern (วิธีที่ง่ายที่สุด)
        // หมายเหตุ: ต้องมีตัวละครโหลดอยู่แล้วในหน้าเว็บ
        const characters = $('.character_select'); 
        
        if(characters.length === 0) {
            list.append('<div style="padding:20px; text-align:center;">No characters found.<br>Please select a character in main UI first.</div>');
            return;
        }

        characters.each(function() {
            const id = $(this).attr('chid');
            const name = $(this).find('.character_name').text() || $(this).attr('title') || "Unknown";
            const avatar = $(this).find('img').attr('src');

            const item = $(`
                <div class="contact-item">
                    <img src="${avatar}" class="contact-avatar">
                    <div class="contact-info">
                        <b>${name}</b>
                        <span>Click to chat</span>
                    </div>
                </div>
            `);

            item.on('click', () => {
                // จำลองการคลิกเลือกตัวละครใน SillyTavern จริงๆ
                $(this).click();
                
                // เปิดหน้าแชท
                $('#chat-header-name').text(name);
                $('#ph-chat-msgs').empty(); // เคลียร์แชทเก่า (หรือจะเก็บไว้ก็ได้ถ้าทำระบบเมม)
                window.openPhoneApp('chat');
            });

            list.append(item);
        });
    }

    // ฟังก์ชันส่งข้อความ
    function sendPhoneMessage() {
        const input = $('#ph-chat-input');
        const text = input.val().trim();
        if(!text) return;

        // 1. แสดงฝั่ง User ในมือถือ
        $('#ph-chat-msgs').append(`<div class="msg-bubble msg-user">${text}</div>`);
        scrollToBottom();

        // 2. ส่งเข้า SillyTavern (เหมือนพิมพ์ในช่องปกติ)
        const stInput = $('#send_textarea');
        stInput.val(text);
        // Trigger Input Event
        stInput[0].dispatchEvent(new Event('input', { bubbles: true }));
        // Click Send
        $('#send_but').click();

        input.val('');
    }

    // ฟังชั่นจับข้อความใหม่จากบอท (Observer)
    // เพื่อเอามาแสดงในมือถือ
    const chatObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                $(mutation.addedNodes).each(function() {
                    // เช็คว่าเป็นข้อความจากบอทหรือไม่ (mes class)
                    if ($(this).hasClass('mes') && !$(this).attr('is_user')) {
                        const botText = $(this).find('.mes_text').text();
                        // แสดงในมือถือ
                        $('#ph-chat-msgs').append(`<div class="msg-bubble msg-bot">${botText}</div>`);
                        scrollToBottom();
                    }
                });
            }
        });
    });

    // เริ่มจับตาดู Chat Log หลักของ SillyTavern
    const chatLog = document.getElementById('chat');
    if(chatLog) {
        chatObserver.observe(chatLog, { childList: true });
    }

    function scrollToBottom() {
        const d = $('#ph-chat-msgs');
        d.scrollTop(d[0].scrollHeight);
    }

    // Bind Events
    $('#ph-chat-send').on('click', sendPhoneMessage);
    $('#ph-chat-input').on('keypress', (e) => { if(e.which===13) sendPhoneMessage(); });


    // --- C. ระบบ Gallery (Catbox) ---
    const gallery = $('#ph-gallery');
    CONFIG.memes.forEach(url => {
        const img = $(`<img src="${url}" class="gallery-img">`);
        img.on('click', () => {
            // ส่งรูปแบบ Markdown
            const stInput = $('#send_textarea');
            stInput.val(`![](${url})`);
            stInput[0].dispatchEvent(new Event('input', { bubbles: true }));
            $('#send_but').click();
            
            // กลับไปหน้าแชท (Optional)
            window.openPhoneApp('chat');
        });
        gallery.append(img);
    });


    // --- D. Global UI Controls ---
    window.openPhoneApp = (appName) => {
        if(appName === 'contacts') loadContacts();
        $(`#app-${appName}`).addClass('active');
    };

    window.closePhoneApps = () => {
        $('.app-window').removeClass('active');
    };

    // ปุ่มโฮม (Home Bar)
    $('#ph-home-btn').on('click', window.closePhoneApps);

    // ปุ่มเปิดมือถือหลัก
    triggerBtn.on('click', () => {
        const phone = $(`#${ROOT_ID}`);
        if(phone.css('display') === 'none') {
            phone.fadeIn(200);
        } else {
            phone.fadeOut(200);
        }
    });

    // นาฬิกา
    setInterval(() => {
        const d = new Date();
        $('#ph-clock').text(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    }, 1000);
});
