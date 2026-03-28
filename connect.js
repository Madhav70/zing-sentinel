const API_URL = 'http://127.0.0.1:8000';
let token = localStorage.getItem('zing_token');
let userName = localStorage.getItem('zing_name');

// --- DEMO MODE SETTING ---
const DEMO_MODE = true; 
// -------------------------

document.addEventListener('DOMContentLoaded', () => {
    updateNavbarState();
});

function updateNavbarState() {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;
    
    if (localStorage.getItem('zing_token')) {
        authContainer.innerHTML = `
            <a href="dashboard.html" class="text-sm font-bold text-gray-300 hover:text-white transition px-4 py-2">Dashboard</a>
            <button onclick="logout()" class="btn-secondary text-sm shadow-xl !py-2 !px-4">Sign Out</button>
        `;
    }
}

function logout() {
    localStorage.removeItem('zing_token');
    localStorage.removeItem('zing_name');
    token = null;
    userName = null;
    window.location.href = 'index.html';
}

// ----------------------
// AUTHENTICATION LOGIC
// ----------------------
async function initiateLogin() {
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) errorDiv.classList.add('hidden');
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    
    btn.innerHTML = 'Decrypting Vault...';
    btn.disabled = true;

    try {
        if (DEMO_MODE) {
            await new Promise(r => setTimeout(r, 800)); // Simulate delay
            const storedUser = JSON.parse(localStorage.getItem('zing_demo_user') || '{}');
            if (storedUser.email === email && storedUser.password === password) {
                token = 'zing-web3-token';
                userName = storedUser.name;
            } else {
                throw new Error("Invalid credentials. Web3 vault locked.");
            }
        } else {
            // Real backend request...
        }

        localStorage.setItem('zing_token', token);
        localStorage.setItem('zing_name', userName);
        window.location.href = 'dashboard.html'; 
    } catch (e) {
        if (errorDiv) {
            errorDiv.innerText = e.message;
            errorDiv.classList.remove('hidden');
        } else {
            alert(e.message);
        }
    } finally {
        btn.innerHTML = 'Access Wallet';
        btn.disabled = false;
    }
}

async function initiateSignup() {
    const errorDiv = document.getElementById('signup-error');
    if (errorDiv) errorDiv.classList.add('hidden');
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const btn = document.getElementById('signup-btn');
    
    btn.innerHTML = 'Generating Keys...';
    btn.disabled = true;

    try {
        if (DEMO_MODE) {
            await new Promise(r => setTimeout(r, 800));
            localStorage.setItem('zing_demo_user', JSON.stringify({ email: email, password: password, name: name }));
            localStorage.setItem('zing_demo_history', '[]'); 
            
            // Seed Mock Portfolio
            if (!localStorage.getItem('zing_demo_balance')) {
                localStorage.setItem('zing_demo_balance', '12450.00'); // USDC
                localStorage.setItem('zing_demo_btc', '0.45');
                localStorage.setItem('zing_demo_eth', '4.20');
                localStorage.setItem('zing_demo_inr', '120000');
            }
        } else {
            // Real backend
        }
        
        btn.innerHTML = 'Provisioning Wallet...';
        await new Promise(r => setTimeout(r, 500));
        localStorage.setItem('zing_token', 'zing-web3-token');
        localStorage.setItem('zing_name', name);
        window.location.href = 'dashboard.html';
        
    } catch (e) {
        if(errorDiv) {
            errorDiv.innerText = e.message;
            errorDiv.classList.remove('hidden');
        }
        btn.innerHTML = 'Generate Identity';
        btn.disabled = false;
    } 
}

// ----------------------
// TRANSFER LOGIC (WEB3 SIMULATION)
// ----------------------
async function initiateTransfer() {
    const btn = document.getElementById('calculate-btn');
    const amount = parseFloat(document.getElementById('amount').value);
    const recipientName = document.getElementById('recipient_name').value;
    const output = document.getElementById('output');

    if (!document.getElementById('amount') || isNaN(amount)) return;

    btn.innerHTML = `<svg class="w-5 h-5 text-white animate-spin mr-2 inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Confirming on-chain...`;
    btn.disabled = true;

    try {
        let resultData = {};

        if (DEMO_MODE) {
            let currentBalance = parseFloat(localStorage.getItem('zing_demo_balance') || '0.00');
            if (amount > currentBalance) {
                throw new Error("Insufficient USDC funds. Please swap assets or add funds.");
            }
            
            await new Promise(r => setTimeout(r, 1500)); 
            
            const txHash = '0x' + Math.random().toString(16).substr(2, 40).padEnd(40, '0');
            
            resultData = {
                recipient_name: recipientName.startsWith('@') ? recipientName : '@' + recipientName.toLowerCase().replace(/\s+/g, ''),
                amount: amount.toFixed(2),
                currency: 'USDC',
                tx_hash: txHash,
                created_at: new Date().toISOString()
            };

            const history = JSON.parse(localStorage.getItem('zing_demo_history') || '[]');
            history.unshift(resultData);
            localStorage.setItem('zing_demo_history', JSON.stringify(history));

            currentBalance -= amount;
            localStorage.setItem('zing_demo_balance', currentBalance.toFixed(2));
            if (typeof refreshBalance === 'function') refreshBalance();
        }

        output.classList.remove('hidden');
        output.classList.add('animate-fade-in-up');
        output.innerHTML = `
            <div class="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6 text-left relative overflow-hidden mt-4">
                <div class="absolute right-[-20px] top-[-20px] opacity-10 text-[100px]">✓</div>
                <div class="flex items-center gap-3 mb-4 text-emerald-400">
                    <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold border border-emerald-500/50">✓</div>
                    <p class="font-bold text-lg font-outfit">Settled on-chain</p>
                </div>
                <p class="text-sm text-gray-300 font-inter mb-4">
                    Successfully transferred <strong class="text-white">\$${resultData.amount} USDC</strong> to <strong class="text-purple-400">${resultData.recipient_name}</strong> instantly.
                </p>
            </div>
        `;
        
        await loadHistory();
    } catch (e) {
        output.classList.remove('hidden');
        output.innerHTML = `<div class="bg-red-900/20 text-red-500 p-4 rounded-xl border border-red-500/30 text-sm font-bold mt-4">${e.message}</div>`;
    } finally {
        btn.innerHTML = `Confirm Send <span class="group-hover:translate-x-1 transition-transform ml-1">→</span>`;
        btn.disabled = false;
        document.getElementById('amount').value = '';
    }
}

async function loadHistory() {
    const container = document.getElementById('history-container');
    if (!container) return; 
    
    try {
        let historyData = [];

        if (DEMO_MODE) {
            historyData = JSON.parse(localStorage.getItem('zing_demo_history') || '[]');
        }

        container.innerHTML = '';
        
        // Add a mock recent fiat deposit for visual flavor if history is empty
        if (historyData.length < 2 && parseFloat(localStorage.getItem('zing_demo_balance')) > 1000) {
             container.innerHTML += `
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b border-white/5 items-center bg-white/5 opacity-80">
                    <div class="col-span-1 md:col-span-2 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-emerald-900/50 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/30 shrink-0">
                            📥
                        </div>
                        <div>
                            <h4 class="font-bold text-white tracking-tight">Bank Deposit</h4>
                            <p class="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">Wire Transfer</p>
                        </div>
                    </div>
                    <div class="text-right font-bold text-emerald-400 text-sm">
                        +$12,450.00 USDC
                    </div>
                    <div class="text-right flex flex-col items-end hidden sm:flex">
                        <span class="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-[10px] uppercase tracking-widest font-bold rounded border border-emerald-500/20 mb-1 flex items-center gap-1"><div class="w-1 h-1 rounded-full bg-emerald-400"></div> CLEARED</span>
                    </div>
                </div>
            `;
        }
        
        if (historyData.length === 0 && parseFloat(localStorage.getItem('zing_demo_balance')) <= 0) {
             container.innerHTML = `
                <div class="text-center text-gray-500 py-32 flex flex-col items-center">
                    <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-2xl mb-4 border border-white/10">⛓️</div>
                    <p class="font-bold text-white text-sm">No transactions yet.</p>
                    <p class="text-xs mt-1">Send a payment via @handle to view the ledger.</p>
                </div>`;
            return;
        }

        historyData.forEach((record, index) => {
            const date = new Date(record.created_at).toLocaleString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
            });

            const isDeposit = record.type === 'deposit';
            const displayName = record.recipient_name || '@unknown';
            const initial = displayName.length > 1 ? displayName.charAt(1).toUpperCase() : displayName.charAt(0).toUpperCase();
            const amountAbs = Math.abs(parseFloat(record.amount));

            const row = document.createElement('div');
            row.className = 'grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition animate-fade-in-up items-center';
            row.style.animationDelay = `${index * 0.05}s`;
            
            if (isDeposit) {
                row.innerHTML = `
                    <div class="col-span-1 md:col-span-2 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-emerald-900/50 text-emerald-400 font-bold flex items-center justify-center text-lg border border-emerald-500/30 shrink-0">↓</div>
                        <div>
                            <h4 class="font-bold text-white tracking-tight">Bank Deposit</h4>
                            <p class="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">${date}</p>
                        </div>
                    </div>
                    <div class="text-right font-bold text-emerald-400 text-sm">
                        +$${amountAbs.toLocaleString('en-US', {minimumFractionDigits:2})} USDC
                    </div>
                    <div class="text-right flex flex-col items-end hidden sm:flex">
                        <span class="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-[10px] uppercase tracking-widest font-bold rounded border border-emerald-500/20 flex items-center gap-1"><div class="w-1 h-1 rounded-full bg-emerald-400"></div> CLEARED</span>
                    </div>
                `;
            } else {
                row.innerHTML = `
                    <div class="col-span-1 md:col-span-2 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-zing text-white font-bold flex items-center justify-center text-sm shadow-inner shrink-0">
                            ${initial}
                        </div>
                        <div>
                            <h4 class="font-bold text-white tracking-tight">${displayName}</h4>
                            <p class="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">${date}</p>
                        </div>
                    </div>
                    <div class="text-right font-bold text-white text-sm">
                        -$${amountAbs.toLocaleString('en-US', {minimumFractionDigits:2})} USDC
                    </div>
                    <div class="text-right flex flex-col items-end hidden sm:flex">
                        <span class="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-[10px] uppercase tracking-widest font-bold rounded border border-emerald-500/20 mb-1 flex items-center gap-1"><div class="w-1 h-1 rounded-full bg-emerald-400"></div> CONFIRMED</span>
                        <span class="font-mono text-[9px] text-gray-500 w-24 truncate" title="${record.tx_hash}">${record.tx_hash}</span>
                    </div>
                `;
            }
            container.appendChild(row);
        });

    } catch(e) {
        console.error("History load error", e);
    }
}

// Global Balance Calculator for Dashboard
function refreshBalance() {
    const totalEl = document.getElementById('total-balance-display');
    const usdcEl = document.getElementById('usdc-balance');
    const btcEl = document.getElementById('btc-balance');
    const ethEl = document.getElementById('eth-balance');
    const inrEl = document.getElementById('inr-balance');
    const btcValEl = document.getElementById('btc-fiat');
    const ethValEl = document.getElementById('eth-fiat');
    
    // Hardcoded Prices for demo
    const BTC_PRICE = 64000;
    const ETH_PRICE = 3400;
    const USD_TO_INR = 83;
    
    let usdc = parseFloat(localStorage.getItem('zing_demo_balance') || '0');
    let btc = parseFloat(localStorage.getItem('zing_demo_btc') || '0');
    let eth = parseFloat(localStorage.getItem('zing_demo_eth') || '0');
    let inr = parseFloat(localStorage.getItem('zing_demo_inr') || '0');
    
    let btcFiat = btc * BTC_PRICE;
    let ethFiat = eth * ETH_PRICE;
    let inrFiat = inr / USD_TO_INR; // convert INR value to USD for total
    
    let totalUsd = usdc + btcFiat + ethFiat + inrFiat;
    
    if (usdcEl) usdcEl.innerText = '$' + usdc.toLocaleString('en-US', {minimumFractionDigits:2});
    if (btcEl) btcEl.innerText = btc.toFixed(4) + ' BTC';
    if (ethEl) ethEl.innerText = eth.toFixed(4) + ' ETH';
    if (inrEl) inrEl.innerText = '₹' + inr.toLocaleString('en-IN');
    
    if (btcValEl) btcValEl.innerText = '$' + btcFiat.toLocaleString('en-US', {minimumFractionDigits:2});
    if (ethValEl) ethValEl.innerText = '$' + ethFiat.toLocaleString('en-US', {minimumFractionDigits:2});
    
    if (totalEl) {
        totalEl.innerText = '$' + totalUsd.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
    }
}

async function addFunds() {
    let deposit = prompt("Amount to deposit (USDC):");
    if (!deposit) return;
    deposit = parseFloat(deposit);
    if (isNaN(deposit) || deposit <= 0) {
        alert("Invalid amount. Please enter a positive number.");
        return;
    }

    // Simulate a brief processing delay
    await new Promise(r => setTimeout(r, 400));

    let currentBalance = parseFloat(localStorage.getItem('zing_demo_balance') || '0.00');
    currentBalance += deposit;
    localStorage.setItem('zing_demo_balance', currentBalance.toFixed(2));

    // Add to history as a deposit entry
    const history = JSON.parse(localStorage.getItem('zing_demo_history') || '[]');
    history.unshift({
        recipient_name: '@bank_deposit',
        amount: (-deposit).toFixed(2), // negative = incoming
        currency: 'USDC',
        type: 'deposit',
        tx_hash: '0x' + Math.random().toString(16).substr(2, 40).padEnd(40, '0'),
        created_at: new Date().toISOString()
    });
    localStorage.setItem('zing_demo_history', JSON.stringify(history));

    refreshBalance();
    loadHistory();

    // Update modal balance if visible
    const modalBal = document.getElementById('modal-balance');
    if (modalBal) modalBal.innerText = '$' + currentBalance.toLocaleString('en-US', {minimumFractionDigits:2});
}

window.initiateTransfer = initiateTransfer;
window.initiateLogin = initiateLogin;
window.initiateSignup = initiateSignup;
window.logout = logout;
window.loadHistory = loadHistory;
window.refreshBalance = refreshBalance;
window.addFunds = addFunds;