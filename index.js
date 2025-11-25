// 1. ตั้งค่ามีม (เพิ่มลิ้งค์ Catbox ของคุณที่นี่)
const MEME_LIST = [
    "https://files.catbox.moe/lf4i26.jpg",
    "https://files.catbox.moe/mds278.jpg",
    "https://files.catbox.moe/27e41w.jpg"
];

// ประวัติแชทเฉพาะในมือถือ (จะถูกล้างเมื่อรีเฟรชหน้าเว็บ)
let phoneChatHistory = [];

jQuery(async () => {
    // ล้าง UI เก่า
    $('#silly-phone-root, #phone-trigger-btn').remove();

    // สร้างปุ่มเปิด
    $('body').append(`<div id="phone-trigger-btn"><i class="fa-solid fa-comment-dots"></i></div>`);

    // สร้าง UI โทรศัพท์
    const phoneHTML = `
    <div id="silly-phone-root">
        <div class="phone-case" id="drag-handle">
            <div class="screen">
                <div class="dynamic-island" id="drag-island"></div>
                
                <div class="chat-header">
                    <img src="" class="char-avatar" id="ph-avatar">
                    <span class="char-name" id="ph-name">Select Char</span>
                </div>

                <div class="chat-body" id="ph-chat-body">
                    <div style="text-align:center; color:#999; font-size:12px; margin-top:20px;">
                        ข้อความในนี้เป็นความลับ<br>จะไม่บันทึกลงแชทหลัก
                    </div>
                </div>

                <div class="meme-drawer" id="ph-meme-drawer">
                    <div class="meme-grid" id="ph-meme-grid"></div>
                </div>

                <div class="input-area">
                    <i class="fa-regular fa-face-smile icon-btn" id="btn-toggle-meme"></i>
                    <input type="text" class="chat-input" id="ph-input" placeholder="พิมพ์ข้อความ...">
                    <i class="fa-solid fa-paper-plane icon-btn send-btn" id="btn-send"></i>
                </div>
                
                <div style="height:5px; width:100px; background:#ddd; border-radius:5px; margin:5px auto; cursor:pointer;" id="btn-home"></div>
            </div>
        </div>
    </div>`;

    $('body').append(phoneHTML);

    // ==========================================
    // 1. ระบบลาก (Draggable) - เขียนใหม่ให้เสถียร
    // ==========================================
    const phone = document.getElementById('silly-phone-root');
    const handles = [document.getElementById('drag-handle'), document.getElementById('drag-island')];
    
    let isDragging = false, startX, startY, initialLeft, initialTop;

    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            if(e.target.closest('.screen') && e.target !== document.getElementById('drag-island')) return; // ห้ามลากถ้าโดนจอ
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = phone.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            phone.style.cursor = 'grabbing';
        });
    });

    document.addEventListener('mousemove', (e) => {
        if(!isDragging) return;
        e.preventDefault();
        phone.style.left = `${initialLeft + (e.clientX - startX)}px`;
        phone.style.top = `${initialTop + (e.clientY - startY)}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        phone.style.cursor = 'default';
    });

    // ==========================================
    // 2. ระบบ Meme Drawer
    // ==========================================
    const memeGrid = $('#ph-meme-grid');
    MEME_LIST.forEach(url => {
        const img = $(`<img src="${url}" class="meme-thumb">`);
        img.on('click', () => {
            // ส่งรูปในนาม User
            appendMessage('user', `<img src="${url}" class="msg-img">`);
            $('#ph-meme-drawer').removeClass('open');
            // ให้บอทตอบกลับรูปภาพ
            generateGhostReply(`[Sent an image: ${url}]`);
        });
        memeGrid.append(img);
    });

    $('#btn-toggle-meme').on('click', () => {
        $('#ph-meme-drawer').toggleClass('open');
    });

    // ==========================================
    // 3. ระบบแชทแยกโลก (Ghost Chat Logic)
    // ==========================================
    
    // ฟังก์ชันดึงข้อมูลตัวละครปัจจุบัน
    function getCurrentChar() {
        // ดึงตัวแปร Global ของ SillyTavern
        if (typeof SillyTavern === 'undefined') return { name: 'Bot', persona: 'You are a helpful assistant.' };
        
        const context = SillyTavern.getContext();
        const charId = context.characterId;
        const charData = context.characters[charId];
        
        return {
            name: charData.name,
            persona: charData.description + "\n" + charData.personality,
            avatar: charData.avatar
        };
    }

    // ฟังก์ชันส่งข้อความ
    async function handleSend() {
        const txt = $('#ph-input').val().trim();
        if(!txt) return;
        
        $('#ph-input').val('');
        appendMessage('user', txt);
        await generateGhostReply(txt);
    }

    // UI: เพิ่มข้อความลงหน้าจอ
    function appendMessage(role, htmlContent) {
        const div = $(`<div class="msg msg-${role}">${htmlContent}</div>`);
        $('#ph-chat-body').append(div);
        $('#ph-chat-body').scrollTop($('#ph-chat-body')[0].scrollHeight);
    }

    // CORE: คุยกับ AI ผ่าน API โดยตรง (ไม่ผ่าน UI หลัก)
    async function generateGhostReply(userText) {
        const char = getCurrentChar();
        
        // เพิ่มข้อความลงประวัติมือถือ
        phoneChatHistory.push({ role: 'User', content: userText });

        // สร้าง Prompt สำหรับส่ง API
        // "จำลองสถานการณ์คุยมือถือ"
        let prompt = `Write a short text message reply as ${char.name}.\n`;
        prompt += `Personality: ${char.persona}\n`;
        prompt += `Context: You are chatting on a smartphone instant messenger. Keep it short, casual, use emojis if fits.\n\n`;
        prompt += `Chat History:\n`;
        
        // เอา 5 ข้อความล่าสุดมาใส่ context
        const recentHistory = phoneChatHistory.slice(-5);
        recentHistory.forEach(h => {
            prompt += `${h.role}: ${h.content}\n`;
        });
        prompt += `${char.name}:`;

        // แสดงสถานะ "กำลังพิมพ์..."
        const loadingId = Date.now();
        appendMessage('bot', `<span id="${loadingId}">...</span>`);

        try {
            // ยิง API ภายในของ SillyTavern
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    use_story: false,
                    use_memory: false,
                    use_authors_note: false,
                    use_world_info: false,
                    single_line: true, // เอาแค่บรรทัดเดียว
                    max_length: 100    // ไม่เอาตอบยาว
                })
            });

            const data = await response.json();
            const reply = data.results[0].text.trim();

            // อัปเดต UI
            $(`#${loadingId}`).parent().text(reply);
            phoneChatHistory.push({ role: char.name, content: reply });

        } catch (e) {
            console.error(e);
            $(`#${loadingId}`).parent().text("Error: Could not connect to AI.");
        }
    }

    // ==========================================
    // 4. Event Listeners ทั่วไป
    // ==========================================
    $('#btn-send').on('click', handleSend);
    $('#ph-input').on('keypress', (e) => { if(e.which===13) handleSend(); });

    // ปุ่มเปิด/ปิด มือถือ
    $('#phone-trigger-btn').on('click', () => {
        const root = $('#silly-phone-root');
        if(root.is(':visible')) {
            root.fadeOut();
        } else {
            // อัปเดตรูป/ชื่อตัวละครทุกครั้งที่เปิด
            const char = getCurrentChar();
            $('#ph-name').text(char.name);
            $('#ph-avatar').attr('src', `/characters/${char.avatar}`);
            root.fadeIn();
        }
    });

    $('#btn-home').on('click', () => $('#silly-phone-root').fadeOut());
});
