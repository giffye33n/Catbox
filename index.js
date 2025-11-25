// ==========================================
// CONFIG & STATE
// ==========================================

// Global object to cache generated stats for persistence
let characterStatsCache = {};

// Utility function to create a persistent seed hash from a string
function stringToSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Simple seeded random number generator for persistent stats
function seededRandom(seed) {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
}

// Function to get a randomized, but persistent, integer value
function getPersistentRandomInt(name, min, max, statKey) {
    const seed = stringToSeed(name + statKey);
    const rand = seededRandom(seed);
    return Math.floor(rand * (max - min + 1)) + min;
}

// ==========================================
// STAT GENERATION LOGIC
// ==========================================

function generateCharacterStats(charName) {
    if (characterStatsCache[charName]) {
        return characterStatsCache[charName];
    }

    // A large seed based on the character's name ensures persistence
    const baseSeed = stringToSeed(charName);
    
    // Helper to get consistent random number for stats
    const rand = (min, max, key) => getPersistentRandomInt(charName, min, max, key);

    const baseStats = {
        STR: rand(10, 50, 'str') + rand(0, 5, 'str_bonus'),
        DEX: rand(10, 50, 'dex') + rand(0, 5, 'dex_bonus'),
        AGI: rand(10, 50, 'agi') + rand(0, 5, 'agi_bonus'),
        INT: rand(10, 50, 'int') + rand(0, 5, 'int_bonus'),
        WIS: rand(10, 50, 'wis') + rand(0, 5, 'wis_bonus'),
        CON: rand(10, 50, 'con') + rand(0, 5, 'con_bonus'),
        LUK: rand(10, 50, 'luk') + rand(0, 5, 'luk_bonus'),
    };
    
    // Combat Stat Calculation (based on Base Stats)
    const ATK_Base = baseStats.STR * 3 + baseStats.DEX;
    const MATK_Base = baseStats.INT * 4;
    const DEF_Base = baseStats.CON * 2 + baseStats.STR;
    const MDEF_Base = baseStats.WIS * 3 + baseStats.CON;

    // Resource Calculation
    const MAX_HP = baseStats.CON * 20 + 1000 + rand(0, 500, 'hp_bonus');
    const MAX_MP = baseStats.INT * 15 + 100 + rand(0, 200, 'mp_bonus');
    
    const CURRENT_HP = Math.floor(MAX_HP * (0.8 + seededRandom(baseSeed + 1) * 0.2)); // 80-100%
    const CURRENT_MP = Math.floor(MAX_MP * (0.7 + seededRandom(baseSeed + 2) * 0.3)); // 70-100%
    
    const stats = {
        // Class/Role Simulation (Randomly assigned for display)
        class: (['Warrior', 'Mage', 'Rogue', 'Cleric', 'Hunter', 'Berserker', 'Bard'])[rand(0, 6, 'class')],

        // 5) Health / Resources
        HP: { current: CURRENT_HP, max: MAX_HP },
        MP: { current: CURRENT_MP, max: MAX_MP },
        Stamina: { current: rand(70, 100, 'stamina'), max: 100 },
        HP_Regen: rand(5, 20, 'hp_regen'),
        MP_Regen: rand(2, 10, 'mp_regen'),

        // 1) Base Attributes
        Base: baseStats,
        
        // 2) Combat Stats
        Combat: {
            ATK: ATK_Base + rand(0, 100, 'atk_mod'),
            MATK: MATK_Base + rand(0, 100, 'matk_mod'),
            DEF: DEF_Base + rand(0, 50, 'def_mod'),
            MDEF: MDEF_Base + rand(0, 50, 'mdef_mod'),
            ACC: baseStats.DEX * 2 + rand(0, 10, 'acc'),
            EVA: baseStats.AGI * 2 + rand(0, 10, 'eva'),
            CRIT_RATE: baseStats.LUK * 0.1 + rand(0, 5, 'crit_rate'), // %
            CRIT_DMG: 150 + rand(0, 50, 'crit_dmg'), // %
        },

        // 3) Elementals
        Elementals: {
            Fire_ATK: rand(0, 50, 'fire_atk'),
            Ice_RES: rand(0, 50, 'ice_res'),
            Poison_RES: baseStats.WIS + rand(0, 20, 'poi_res'),
            Light_DMG: rand(0, 50, 'light_dmg'),
        },

        // 4) Advanced Defense
        Defense: {
            BLOCK: rand(0, 30, 'block'), // %
            PARRY: rand(0, 30, 'parry'), // %
            Damage_Reduction: rand(0, 15, 'dr'), // %
        }
    };

    // Cache the results
    characterStatsCache[charName] = stats;
    return stats;
}

// ==========================================
// UI RENDERING LOGIC
// ==========================================

function renderStatsUI() {
    return `
    <div id="silly-stats-root">
        <div id="stats-header">
            <img src="/img/question_mark.png" id="stats-avatar">
            <div>
                <div id="stats-name">NO CHARACTER SELECTED</div>
                <div id="stats-class">N/A</div>
            </div>
        </div>
        <div id="stats-content">
            <div class="stats-section">
                <h3><i class="fa-solid fa-heart"></i> Resources</h3>
                <div class="stat-item">
                    <span class="stat-label">HP</span>
                    <span class="stat-value" id="stat-hp-val">0 / 0</span>
                </div>
                <div class="resource-bar"><div class="resource-fill hp-fill" id="stat-hp-bar" style="width:0%"></div></div>
                
                <div class="stat-item">
                    <span class="stat-label">MP / SP</span>
                    <span class="stat-value" id="stat-mp-val">0 / 0</span>
                </div>
                <div class="resource-bar"><div class="resource-fill mp-fill" id="stat-mp-bar" style="width:0%"></div></div>

                <div class="stat-item">
                    <span class="stat-label">Stamina</span>
                    <span class="stat-value" id="stat-stamina-val">0 / 100</span>
                </div>
                <div class="resource-bar"><div class="resource-fill stamina-fill" id="stat-stamina-bar" style="width:0%"></div></div>
                
                <div class="stat-item">
                    <span class="stat-label">HP Regen</span>
                    <span class="stat-value" id="stat-hp-regen">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">MP Regen</span>
                    <span class="stat-value" id="stat-mp-regen">0</span>
                </div>
            </div>

            <div class="stats-section">
                <h3><i class="fa-solid fa-gem"></i> Base Attributes</h3>
                <div class="stat-item"><span class="stat-label">STR (Strength)</span><span class="stat-value" id="stat-str">0</span></div>
                <div class="stat-item"><span class="stat-label">DEX (Dexterity)</span><span class="stat-value" id="stat-dex">0</span></div>
                <div class="stat-item"><span class="stat-label">AGI (Agility)</span><span class="stat-value" id="stat-agi">0</span></div>
                <div class="stat-item"><span class="stat-label">INT (Intelligence)</span><span class="stat-value" id="stat-int">0</span></div>
                <div class="stat-item"><span class="stat-label">WIS (Wisdom)</span><span class="stat-value" id="stat-wis">0</span></div>
                <div class="stat-item"><span class="stat-label">CON (Constitution)</span><span class="stat-value" id="stat-con">0</span></div>
                <div class="stat-item"><span class="stat-label">LUK (Luck)</span><span class="stat-value" id="stat-luk">0</span></div>
            </div>

            <div class="stats-section">
                <h3><i class="fa-solid fa-crosshairs"></i> Combat Stats</h3>
                <div class="stat-item"><span class="stat-label">ATK (Physical Attack)</span><span class="stat-value" id="stat-atk">0</span></div>
                <div class="stat-item"><span class="stat-label">MATK (Magic Attack)</span><span class="stat-value" id="stat-matk">0</span></div>
                <div class="stat-item"><span class="stat-label">DEF (Physical Defense)</span><span class="stat-value" id="stat-def">0</span></div>
                <div class="stat-item"><span class="stat-label">MDEF (Magic Defense)</span><span class="stat-value" id="stat-mdef">0</span></div>
                <div class="stat-item"><span class="stat-label">ACC (Accuracy)</span><span class="stat-value" id="stat-acc">0</span></div>
                <div class="stat-item"><span class="stat-label">EVA (Evasion)</span><span class="stat-value" id="stat-eva">0</span></div>
                <div class="stat-item"><span class="stat-label">CRIT RATE</span><span class="stat-value" id="stat-crit-rate">0%</span></div>
                <div class="stat-item"><span class="stat-label">CRIT DMG</span><span class="stat-value" id="stat-crit-dmg">0%</span></div>
            </div>
            
            <div class="stats-section">
                <h3><i class="fa-solid fa-shield"></i> Defense & Resistances</h3>
                <div class="stat-item"><span class="stat-label">BLOCK</span><span class="stat-value" id="stat-block">0%</span></div>
                <div class="stat-item"><span class="stat-label">PARRY</span><span class="stat-value" id="stat-parry">0%</span></div>
                <div class="stat-item"><span class="stat-label">Damage Reduction</span><span class="stat-value" id="stat-dr">0%</span></div>
                <div class="stat-item"><span class="stat-label">Ice Resistance</span><span class="stat-value" id="stat-ice-res">0</span></div>
                <div class="stat-item"><span class="stat-label">Poison Resistance</span><span class="stat-value" id="stat-poi-res">0</span></div>
            </div>

            <div class="stats-section">
                <h3><i class="fa-solid fa-fire"></i> Elemental Attributes</h3>
                <div class="stat-item"><span class="stat-label">Fire ATK</span><span class="stat-value" id="stat-fire-atk">0</span></div>
                <div class="stat-item"><span class="stat-label">Light DMG</span><span class="stat-value" id="stat-light-dmg">0</span></div>
            </div>
            
        </div>
    </div>
    `;
}

function displayCharacterStats(char) {
    if (!char) {
        $('#silly-stats-root').hide();
        return;
    }

    const stats = generateCharacterStats(char.name);

    // Update Header
    $('#stats-avatar').attr('src', `/characters/${char.avatar}`).attr('onerror', "this.src='/img/question_mark.png';");
    $('#stats-name').text(char.name);
    $('#stats-class').text(`Class: ${stats.class}`);

    // Update Resources
    const hp_percent = (stats.HP.current / stats.HP.max) * 100;
    const mp_percent = (stats.MP.current / stats.MP.max) * 100;
    const stamina_percent = stats.Stamina.current;
    
    $('#stat-hp-val').text(`${stats.HP.current.toLocaleString()} / ${stats.HP.max.toLocaleString()}`);
    $('#stat-hp-bar').css('width', `${hp_percent}%`);
    
    $('#stat-mp-val').text(`${stats.MP.current} / ${stats.MP.max}`);
    $('#stat-mp-bar').css('width', `${mp_percent}%`);
    
    $('#stat-stamina-val').text(`${stats.Stamina.current} / 100`);
    $('#stat-stamina-bar').css('width', `${stamina_percent}%`);

    $('#stat-hp-regen').text(stats.HP_Regen);
    $('#stat-mp-regen').text(stats.MP_Regen);

    // Update Base Attributes
    $('#stat-str').text(stats.Base.STR);
    $('#stat-dex').text(stats.Base.DEX);
    $('#stat-agi').text(stats.Base.AGI);
    $('#stat-int').text(stats.Base.INT);
    $('#stat-wis').text(stats.Base.WIS);
    $('#stat-con').text(stats.Base.CON);
    $('#stat-luk').text(stats.Base.LUK);

    // Update Combat Stats
    $('#stat-atk').text(stats.Combat.ATK.toLocaleString());
    $('#stat-matk').text(stats.Combat.MATK.toLocaleString());
    $('#stat-def').text(stats.Combat.DEF.toLocaleString());
    $('#stat-mdef').text(stats.Combat.MDEF.toLocaleString());
    $('#stat-acc').text(stats.Combat.ACC);
    $('#stat-eva').text(stats.Combat.EVA);
    $('#stat-crit-rate').text(`${stats.Combat.CRIT_RATE.toFixed(1)}%`);
    $('#stat-crit-dmg').text(`${stats.Combat.CRIT_DMG}%`);

    // Update Defense & Resistances
    $('#stat-block').text(`${stats.Defense.BLOCK}%`);
    $('#stat-parry').text(`${stats.Defense.PARRY}%`);
    $('#stat-dr').text(`${stats.Defense.Damage_Reduction}%`);
    $('#stat-ice-res').text(stats.Elementals.Ice_RES);
    $('#stat-poi-res').text(stats.Elementals.Poison_RES);

    // Update Elemental Attributes
    $('#stat-fire-atk').text(stats.Elementals.Fire_ATK);
    $('#stat-light-dmg').text(stats.Elementals.Light_DMG);
    
    $('#silly-stats-root').show();
}

// ==========================================
// INITIALIZATION AND EVENT HOOKS
// ==========================================

jQuery(async () => {
    // 1. Clean up old elements (if any)
    $('#silly-stats-root').remove();
    
    // 2. Add Font Awesome (If not already loaded by ST)
    if ($('link[href*="font-awesome"]').length === 0) {
        $('head').append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">');
    }
    
    // 3. Build and Append the UI
    $('body').append(renderStatsUI());

    // 4. Hook into SillyTavern's Character Change Event
    // We poll the global context to check the current character
    
    let lastCharName = null;
    
    // This function runs every 500ms to check if the character has changed
    setInterval(() => {
        if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) {
            console.error("SillyTavern context is not available.");
            return;
        }

        const context = SillyTavern.getContext();
        const currentChar = context.current_char;
        
        if (currentChar) {
            const charName = currentChar.name;
            if (charName !== lastCharName) {
                // Character changed, update stats UI
                displayCharacterStats(currentChar);
                lastCharName = charName;
            }
        } else {
            // No character selected
            displayCharacterStats(null);
            lastCharName = null;
        }
    }, 500); // Check every half second
});
