import { CONFIG } from './config.js';
import { renderGallery, renderChatApp } from './apps.js';

const ROOT_ID = 'silly-phone-root';

// สร้าง HTML โครงสร้างมือถือ
const phoneHTML = `
<div id="${ROOT_ID}">
    <div class="phone-case">
        <div class="screen" style="background-image: url('${CONFIG.wallpaper}');">
            <div class="notch"></div>
            <div class="status-bar">
                <span id="phone-clock">12:00</span>
                <span><i class="fa-solid fa-wifi"></i> &nbsp; <i class="fa-solid fa-battery-three-quarters"></i></span>
            </div>
            
            <div class="app-grid" id="home-screen">
                <div class="app-group" data-app="memes">
                    <div class="app-icon bg-meme"><i class="fa-solid fa-images"></i></div>
                    <div class="app-label">CatBox</div>
                </div>
                <div class="app-group" data-app="chat">
                    <div class="app-icon bg-chat"><i class="fa-solid fa-comment-dots"></i></div>
                    <div class="app-label">Chat</div>
                </div>
                <div class="app-group">
                    <div class="app-icon bg-set"><i class="fa-solid fa-gear"></i></div>
                    <div class="app-label">Settings</div>
                </div>
            </div>

            <div id="app-memes" class="app-window">
                <div class="app-header">CatBox Memes</div>
                <div class="app-content" id="meme-content"></div>
            </div>

            <div id="app-chat" class="app-window">
                <div class="app-header">Messenger</div>
                <div class="app-content" id="chat-content" style="overflow:hidden; display:flex; flex-direction:column;"></div>
            </div>

            <div class="home-bar" id="home-btn"></div>
        </div>
    </div>
</div>
`;

jQuery(async () => {
    // 1. Inject HTML
    $('body').append(phoneHTML);
    const root = $(`#${ROOT_ID}`);

    // 2. Inject App Content
    document.getElementById('meme-content').appendChild(renderGallery());
    document.getElementById('chat-content').appendChild(renderChatApp());

    // 3. Logic: นาฬิกา
    setInterval(() => {
        const now = new Date();
        $('#phone-clock').text(now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0'));
    }, 1000);

    // 4. Logic: เปิดแอพ
    $('.app-group').on('click', function() {
        const appName = $(this).data('app');
        if(appName) {
            $(`#app-${appName}`).addClass('open');
        }
    });

    // 5. Logic: ปุ่ม Home (ปิดแอพ)
    $('#home-btn').on('click', function() {
        $('.app-window').removeClass('open');
    });

    // 6. Logic: ปุ่มเปิดมือถือ (สร้างที่ Top Bar)
    const toggleBtn = $(`
        <div class="drawer-content phone-toggle-icon" title="Open Phone">
            <i class="fa-solid fa-mobile-screen"></i>
        </div>
    `);
    
    // หาที่วางปุ่ม (วางไว้แถวๆปุ่ม Extensions)
    // หมายเหตุ: SillyTavern แต่ละเวอร์ชั่น ID อาจต่างกันเล็กน้อย แต่ปกติจะใช้ .extensionsMenu
    $('#extensionsMenu').parent().prepend(toggleBtn); 

    toggleBtn.on('click', () => {
        if(root.css('display') === 'none') {
            root.css('display', 'block');
        } else {
            root.fadeOut(200);
        }
    });
});
