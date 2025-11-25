import { CONFIG } from './config.js';

// Helper: ส่งข้อความไป SillyTavern
function sendToST(text) {
    const textarea = document.querySelector('#send_textarea');
    if (!textarea) return;
    const oldText = textarea.value;
    textarea.value = oldText + (oldText ? "\n" : "") + text;
    
    // Trigger events เพื่อให้ระบบรู้ว่ามีข้อความ
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    
    // กดปุ่มส่ง
    setTimeout(() => {
        const sendBtn = document.querySelector('#send_but');
        if(sendBtn) sendBtn.click();
    }, 100);
}

// แอพ 1: Meme Gallery
export function renderGallery() {
    const container = document.createElement('div');
    container.className = 'meme-gallery';

    CONFIG.memes.forEach(meme => {
        const item = document.createElement('div');
        item.className = 'meme-item';
        // ใช้ <img> เพื่อพรีวิว
        item.innerHTML = `<img src="${meme.url}" loading="lazy">`;
        
        item.onclick = () => {
            // Animation กด
            item.style.transform = "scale(0.9)";
            setTimeout(() => item.style.transform = "scale(1)", 150);
            
            sendToST(`![](${meme.url})`); // ส่ง Markdown
        };
        container.appendChild(item);
    });
    return container;
}

// แอพ 2: Mini Chat
export function renderChatApp() {
    const container = document.createElement('div');
    container.style.height = "100%";
    container.style.display = "flex";
    container.style.flexDirection = "column";

    // พื้นที่แชทปลอมๆ (Gimmick)
    const chatHistory = document.createElement('div');
    chatHistory.style.flex = "1";
    chatHistory.style.padding = "10px";
    chatHistory.innerHTML = `<div style="background:#e5e5ea; color:black; padding:8px 12px; border-radius:15px; display:inline-block; margin-bottom:5px;">สวัสดีครับ! วันนี้มีมีมอะไรใหม่ไหม?</div>`;
    
    // กล่องพิมพ์
    const inputArea = document.createElement('div');
    inputArea.className = 'mini-chat-box';
    
    const input = document.createElement('input');
    input.className = 'mini-input';
    input.placeholder = "iMessage...";
    
    const btn = document.createElement('div');
    btn.className = 'send-mini-btn';
    btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    
    const sendAction = () => {
        if(input.value.trim()) {
            sendToST(input.value);
            // เพิ่มข้อความลงในแชทปลอมด้วยเพื่อให้สมจริง
            const bubble = document.createElement('div');
            bubble.style.cssText = "background:#007bff; color:white; padding:8px 12px; border-radius:15px; margin:5px 0 5px auto; max-width:80%; text-align:right;";
            bubble.textContent = input.value;
            chatHistory.appendChild(bubble);
            input.value = "";
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    };

    btn.onclick = sendAction;
    input.onkeypress = (e) => { if(e.key === 'Enter') sendAction(); };

    inputArea.appendChild(input);
    inputArea.appendChild(btn);
    
    container.appendChild(chatHistory);
    container.appendChild(inputArea);
    
    return container;
}
