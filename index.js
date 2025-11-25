// ==========================================
// 1. ตั้งค่ารูปภาพและพื้นหลัง (CONFIG)
// ==========================================
const CONFIG = {
    // ลิงก์ภาพพื้นหลังหน้าจอมือถือ
    wallpaper: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
    
    // รายการมีม Catbox (ใส่เพิ่มได้ตามใจชอบ)
    memes: [
        { url: "https://files.catbox.moe/lf4i26.jpg", title: "Angry" },
        { url: "https://files.catbox.moe/mds278.jpg", title: "Love" },
        { url: "https://files.catbox.moe/27e41w.jpg", title: "Confused" },
    ]
};

// ==========================================
// 2. โค้ดสร้างหน้าจอ (ไม่ต้องแก้ก็ได้)
// ==========================================
jQuery(async () => {
    // ลบของเก่าออกก่อนกันซ้ำ
    $('#phone-trigger-btn').remove();
    $('#silly-phone-root').remove();

    // สร้างปุ่มลอย (Floating Button)
    const triggerBtn = $(`
        <div id="phone-trigger-btn" title="เปิดมือถือ">
            <i class="fa-solid fa-mobile-screen"></i>
        </div>
    `);

    // สร้างโครงสร้างมือถือ
    const phoneUI = $(`
        <div id="silly-phone-root">
            <div class="phone-case">
                <div class="screen" style="background-image: url('${CONFIG.wallpaper}');">
                    <div class="dynamic-island"></div>
                    <div class="status-bar">
                        <span id="os-clock">12:00</span>
                        <span><i class="fa-solid fa-signal"></i> 5G <i class="fa-solid fa-battery-full"></i></span>
                    </div>

                    <div class="app-grid">
                        <div class="app-icon-wrapper" onclick="openApp('memes')">
                            <div class="app-icon bg-catbox"><i class="fa-regular fa-image"></i></div>
                            <div class="app-label">CatBox</div>
                        </div>
                        <div class="app-icon-wrapper" onclick="openApp('chat')">
                            <div class="app-icon bg-chat"><i class="fa-solid fa-comment"></i></div>
                            <div class="app-label">Chat</div>
                        </div>
                        <div class="app-icon-wrapper">
                            <div class="app-icon bg-settings"><i class="fa-solid fa-sliders"></i></div>
                            <div class="app-label">Settings</div>
                        </div>
                    </div>

                    <div id="app-memes" class="app-window">
                        <div class="app-header">Photos</div>
                        <div class="meme-scroll" id="meme-container"></div>
                    </div>

                    <div id="app-chat" class="app-window">
                        <div class="app-header">Messages</div>
                        <div class="chat-body" id="chat-history">
                            <div style="text-align:center; color:#999; margin-top:20px; font-size:12px;">Today</div>
                        </div>
                        <div class="chat-input-area">
                            <input type="text" class="chat-input" id="mini-chat-input" placeholder="iMessage">
                            <i class="fa-solid fa-paper-plane" style="color:#007aff; font-size:20px; margin-top:5px; cursor:pointer;" id="mini-send-btn"></i>
                        </div>
                    </div>

                    <div class="home-indicator" id="home-btn"></div>
                </div>
            </div>
        </div>
    `);

    // ใส่ลงใน Body โดยตรง
    $('body').append(triggerBtn);
    $('body').append(phoneUI);

    // ------------------------------------------
    // Logic การทำงาน
    // ------------------------------------------

    // 1. โหลดรูปมีม
    const memeContainer = $('#meme-container');
    CONFIG.memes.forEach(url => {
        const img = $(`<img src="${url}" class="meme-img" loading="lazy">`);
        img.on('click', () => {
            sendToSillyTavern(`![](${url})`);
            // เอฟเฟกต์เด้งกลับหน้าโฮมหลังเลือกเสร็จ (ถ้าต้องการ)
            // $('#home-btn').click(); 
        });
        memeContainer.append(img);
    });

    // 2. ระบบแชทในมือถือ
    const sendChat = () => {
        const input = $('#mini-chat-input');
        const txt = input.val().trim();
        if (txt) {
            sendToSillyTavern(txt);
            // แสดงในจอมือถือด้วย
            $('#chat-history').append(`<div class="chat-bubble">${txt}</div>`);
            // เลื่อนลงล่างสุด
            $('#chat-history').scrollTop($('#chat-history')[0].scrollHeight);
            input.val('');
        }
    };
    $('#mini-send-btn').on('click', sendChat);
    $('#mini-chat-input').on('keypress', (e) => { if(e.which === 13) sendChat(); });

    // 3. ฟังก์ชันเปิด/ปิดแอพ
    window.openApp = (appName) => {
        $(`#app-${appName}`).addClass('active');
        // ลูกเล่นขยาย Dynamic Island
        $('.dynamic-island').css('width', '150px');
        setTimeout(() => $('.dynamic-island').css('width', '100px'), 300);
    };

    // 4. ปุ่ม Home (ปิดแอพ)
    $('#home-btn').on('click', () => {
        $('.app-window').removeClass('active');
    });

    // 5. ปุ่มเปิด/ปิด มือถือหลัก
    triggerBtn.on('click', () => {
        const phone = $('#silly-phone-root');
        if (phone.css('display') === 'none') {
            phone.css('display', 'block');
        } else {
            phone.fadeOut(200);
        }
    });

    // 6. นาฬิกาเดิน
    setInterval(() => {
        const d = new Date();
        $('#os-clock').text(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    }, 1000);

    // Helper Function ส่งข้อความ
    function sendToSillyTavern(text) {
        const txtArea = $('#send_textarea');
        if (txtArea.length) {
            const current = txtArea.val();
            txtArea.val(current + (current ? "\n" : "") + text);
            // Trigger event ให้ SillyTavern รู้ว่าค่าเปลี่ยน
            txtArea[0].dispatchEvent(new Event('input', { bubbles: true }));
            // กดส่ง
            setTimeout(() => $('#send_but').click(), 100);
        }
    }
});
