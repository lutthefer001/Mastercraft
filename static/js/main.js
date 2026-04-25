function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = type === 'error' ? 'alert-circle' : 'check-circle';
    let iconColor = type === 'error' ? '#ff3333' : 'var(--neon-green)';
    
    toast.innerHTML = `<i data-lucide="${icon}" style="color: ${iconColor};"></i> <div>${message}</div>`;
    
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function toggleModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}

function copyIP() {
    const ip = document.getElementById('server-ip').innerText;
    navigator.clipboard.writeText(ip);
    const icon = document.getElementById('copy-icon');
    icon.outerHTML = '<i data-lucide="check-circle" id="copy-icon" style="color: var(--neon-green); width:35px; height:35px;"></i>';
    lucide.createIcons();
    setTimeout(() => {
        document.getElementById('copy-icon').outerHTML = '<i data-lucide="copy" id="copy-icon" style="opacity: 0.4; width:35px; height:35px;"></i>';
        lucide.createIcons();
    }, 2000);
}

function openPayment(name, price) {
    fetch('/api/buy', { method: 'OPTIONS' }).catch(()=>{});
    
    if (price.includes('COIN') || price.includes('TOKEN')) {
        document.getElementById('bal-item-name').innerText = name;
        document.getElementById('bal-item-price').innerText = price;
        toggleModal('balance-payment-modal');
    } else {
        document.getElementById('pay-item-name').innerText = name;
        document.getElementById('pay-item-price').innerText = price;
        toggleModal('payment-modal');
    }
}

function handleBalancePayment() {
    const itemName = document.getElementById('bal-item-name').innerText;
    const price = document.getElementById('bal-item-price').innerText;

    fetch('/api/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: itemName, price: price, method: 'balance' })
    })
    .then(async res => {
        const data = await res.json().catch(() => ({}));
        if(data.error) {
            showToast(data.error, 'error');
            toggleModal('balance-payment-modal');
        } else {
            showToast("Xarid muvaffaqiyatli amalga oshirildi!", 'success');
            toggleModal('balance-payment-modal');
            setTimeout(() => window.location.reload(), 1500);
        }
    });
}

function formatCard(input) {
    let v = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = v.match(/\d{4,16}/g);
    let match = matches && matches[0] || '';
    let parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      input.value = parts.join(' ');
    } else {
      input.value = v;
    }
}

function formatExpiry(input) {
    let v = input.value.replace(/\D/g, '');
    if(v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2,4);
    input.value = v;
}

function handlePayment(e) {
    e.preventDefault();
    const cardNum = document.getElementById('card-num').value.replace(/\s+/g, '');
    const cardExp = document.getElementById('card-exp').value;

    if (!cardNum.startsWith('9860')) {
        showToast("Faqat 9860 bilan boshlangan kartalar qabul qilinadi!", 'error');
        return;
    }

    let maxConsecutive = 1;
    let currentConsecutive = 1;
    for (let i = 1; i < cardNum.length; i++) {
        if (cardNum[i] === cardNum[i-1]) {
            currentConsecutive++;
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        } else {
            currentConsecutive = 1;
        }
    }
    
    let counts = {};
    for (let char of cardNum) {
        counts[char] = (counts[char] || 0) + 1;
    }
    let maxFreq = Math.max(...Object.values(counts));

    if (maxConsecutive > 3 || maxFreq > 6) {
        showToast("Karta xato: bir xil raqamlar juda ko'p marotaba qatnashgan!", 'error');
        return;
    }

    if (!cardExp.includes('/')) {
        showToast("Amal qilish muddatini to'liq kiriting!", 'error');
        return;
    }

    const [mm, yy] = cardExp.split('/');
    const month = parseInt(mm, 10);
    const year = parseInt("20" + yy, 10);

    if (year < 2026 || (year === 2026 && month <= 4)) {
        showToast("Karta muddati xato! Faqat 04/26 dan kattaroq muddatlar qabul qilinadi.", 'error');
        return;
    }
    if (year > 2030 || (year === 2030 && month > 1)) {
        showToast("Karta muddati xato! Maksimal muddat 01/30 gacha bo'lishi mumkin.", 'error');
        return;
    }

    const btn = document.getElementById('pay-submit-btn');
    btn.innerText = "TO'LOV QILINMOQDA...";
    btn.disabled = true;
    
    setTimeout(() => {
        processBuy(document.getElementById('pay-item-name').innerText, document.getElementById('pay-item-price').innerText);
    }, 2000);
}

function processBuy(name, price, noModalAlert=false) {
    fetch('/api/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: name, price: price })
    })
    .then(res => res.json())
    .then(data => {
        const btn = document.getElementById('pay-submit-btn');
        if(btn) {
            btn.innerText = "TO'LASH VA OLISH";
            btn.disabled = false;
        }

        if(data.error) {
            showToast(data.error, 'error');
        } else {
            document.getElementById('payment-modal').style.display = 'none';
            showToast("To'lov muvaffaqiyatli! Admin panelni tekshiring.", 'success');
            setTimeout(() => window.location.reload(), 1500);
        }
    });
}

function postComment() {
    const content = document.getElementById('comment-text').value;
    if(!content) return;
    
    fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    })
    .then(res => res.json())
    .then(data => {
        if(data.error) showToast(data.error, 'error');
        else window.location.reload();
    });
}

function adminAction(e, action) {
    e.preventDefault();
    let name = document.getElementById('item-name').value;
    
    let price;
    const priceValObj = document.getElementById('item-price-val');
    if (priceValObj) {
        const currency = document.getElementById('item-currency').value;
        price = `${priceValObj.value} ${currency}`;
    } else {
        price = document.getElementById('item-price') ? document.getElementById('item-price').value : '0';
    }

    const desc = document.getElementById('item-desc').value;
    const iconVal = document.getElementById('item-icon').value;
    const color = document.getElementById('item-color-hex').value || document.getElementById('item-color').value;
    const icon = color + "|" + iconVal;
    
    const typeObj = document.getElementById('item-type');
    
    if (typeObj && typeObj.value === 'KIT') {
        name = 'KIT::' + name;
    }
    
    fetch(`/api/admin/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, description: desc, icon })
    })
    .then(async res => {
        const data = await res.json().catch(() => ({}));
        if(data.error) showToast(data.error, 'error');
        else {
            showToast("Muvaffaqiyatli bajarildi!", 'success');
            setTimeout(() => window.location.reload(), 1000);
        }
    });
}

function handleAdminEdit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value;
    const price = document.getElementById('edit-price').value;
    const desc = document.getElementById('edit-desc').value;
    const iconVal = document.getElementById('edit-icon').value;
    const color = document.getElementById('edit-color-hex').value || document.getElementById('edit-color').value;
    const icon = color + "|" + iconVal;

    fetch(`/api/admin/edit_item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, price, description: desc, icon })
    })
    .then(async res => {
        const data = await res.json().catch(() => ({}));
        if(data.error) showToast(data.error, 'error');
        else {
            showToast("Muvaffaqiyatli tahrirlandi!", 'success');
            toggleModal('admin-edit-modal');
            setTimeout(() => window.location.reload(), 1000);
        }
    });
}

function openEditModal(id, name, price, desc, icon, color) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-name').value = name;
    document.getElementById('edit-price').value = price;
    document.getElementById('edit-desc').value = desc;
    document.getElementById('edit-icon').value = icon;
    document.getElementById('edit-color').value = color;
    document.getElementById('edit-color-hex').value = color;
    toggleModal('admin-edit-modal');
}

function adminActionDelete(e, action, id) {
    e.preventDefault();
    fetch(`/api/admin/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    })
    .then(async res => {
        const data = await res.json().catch(() => ({}));
        if(data.error) showToast(data.error, 'error');
        else window.location.reload();
    });
}

function adminActionAdmin(e) {
    e.preventDefault();
    const login = document.getElementById('admin-login').value;
    const password = document.getElementById('admin-password').value;
    fetch(`/api/admin/add_admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
    })
    .then(async res => {
        const data = await res.json().catch(() => ({}));
        if(data.error) showToast(data.error, 'error');
        else {
            showToast("Admin muvaffaqiyatli qo'shildi!", 'success');
            setTimeout(() => window.location.reload(), 1000);
        }
    });
}

function adminActionPromo(e) {
    e.preventDefault();
    const code = document.getElementById('promo-code').value;
    const discount = document.getElementById('promo-discount').value;
    fetch(`/api/admin/add_promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, discount })
    })
    .then(async res => {
        const data = await res.json().catch(() => ({}));
        if(data.error) showToast(data.error, 'error');
        else {
            showToast("Promokod muvaffaqiyatli yaratildi!", 'success');
            setTimeout(() => window.location.reload(), 1000);
        }
    });
}

function openInventory(rankName, color, iconName) {
    document.getElementById('inv-content-box').style.borderColor = color;
    const iconBox = document.getElementById('inv-icon-box');
    iconBox.style.background = color + '22';
    iconBox.style.color = color;
    iconBox.innerHTML = `<i data-lucide="${iconName}" style="width:30px; height:30px;"></i>`;
    
    const title = document.getElementById('inv-title');
    title.style.color = color;
    title.innerText = rankName + " KITI";

    const slots = new Array(27).fill(null);
    const upperName = rankName.toUpperCase();

    if (upperName.includes('MINER')) {
        slots[0] = { icon: 'shield', color: '#aaaaaa', name: `Temir Shlem` };
        slots[1] = { icon: 'shirt', color: '#aaaaaa', name: `Temir Ko'krak` };
        slots[2] = { icon: 'triangle-right', color: '#aaaaaa', name: `Temir Ishton` };
        slots[3] = { icon: 'footprints', color: '#aaaaaa', name: `Temir Etik` };
        slots[4] = { icon: 'pickaxe', color: '#00ffff', name: `Olmos Kirka (Eff: V)` };
        slots[5] = { icon: 'pickaxe', color: '#aaaaaa', name: `Temir Kirka (Ipak yo'li)` };
        slots[6] = { icon: 'shovel', color: color, name: `Belkurak` };
        slots[7] = { icon: 'hammer', color: color, name: `Bolg'a` };
        slots[9] = { icon: 'gem', color: '#55ffff', name: 'Olmos (64x)' };
        slots[10] = { icon: 'box', color: '#888888', name: 'Tosh (256x)' };
        slots[11] = { icon: 'box', color: '#555555', name: 'Ko\'mir (128x)' };
        slots[12] = { icon: 'drumstick', color: '#ff8800', name: 'Non (64x)' };
        slots[13] = { icon: 'flame', color: '#ffaa00', name: 'Mash\'ala (128x)' };
    } else if (upperName.includes('ARCHER')) {
        slots[0] = { icon: 'shield', color: '#8B4513', name: `Teri Shlem` };
        slots[1] = { icon: 'shirt', color: '#8B4513', name: `Teri Ko'krak` };
        slots[2] = { icon: 'triangle-right', color: '#8B4513', name: `Teri Ishton` };
        slots[3] = { icon: 'footprints', color: '#8B4513', name: `Teri Etik` };
        slots[4] = { icon: 'crosshair', color: color, name: `Snayper Kamon (Power V)` };
        slots[5] = { icon: 'swords', color: '#aaaaaa', name: `Yog'och Qilich` };
        slots[9] = { icon: 'target', color: '#cccccc', name: 'Oddiy O\'qlar (128x)' };
        slots[10] = { icon: 'target', color: '#ff3333', name: 'Zaharli O\'qlar (32x)' };
        slots[11] = { icon: 'target', color: '#00ffff', name: 'Tezlik O\'qlari (32x)' };
        slots[12] = { icon: 'apple', color: '#ff3333', name: 'Olma (32x)' };
        slots[13] = { icon: 'feather', color: '#ffffff', name: 'Pat (64x)' };
    } else if (upperName.includes('WARRIOR') || upperName.includes('BRUTE')) {
        slots[0] = { icon: 'shield', color: color, name: `Jangchi Shlemi` };
        slots[1] = { icon: 'shirt', color: color, name: `Jangchi Ko'kragi` };
        slots[2] = { icon: 'triangle-right', color: color, name: `Jangchi Ishtoni` };
        slots[3] = { icon: 'footprints', color: color, name: `Jangchi Etigi` };
        slots[4] = { icon: 'swords', color: color, name: `O'tkir Qilich (Sharpness V)` };
        slots[5] = { icon: 'axe', color: color, name: `Og'ir Bolta` };
        slots[9] = { icon: 'apple', color: '#ffaa00', name: 'Oltin Olma (32x)' };
        slots[10] = { icon: 'droplet', color: '#ff5555', name: 'Sog\'liq Ikiri (5x)' };
        slots[11] = { icon: 'droplet', color: '#ff5555', name: 'Kuch Ikiri (3x)' };
        slots[12] = { icon: 'shield-alert', color: color, name: 'Zarba Qalqoni' };
        slots[13] = { icon: 'drumstick', color: '#ff8800', name: 'Go\'sht (64x)' };
    } else if (upperName.includes('BUILDER')) {
        slots[0] = { icon: 'shield', color: '#ffff00', name: `Quruvchi Kaskasi` };
        slots[4] = { icon: 'axe', color: '#aaaaaa', name: `Tezkor Bolta (Eff V)` };
        slots[5] = { icon: 'shovel', color: '#aaaaaa', name: `Tezkor Belkurak (Eff V)` };
        slots[9] = { icon: 'box', color: '#ffffff', name: 'Kvarts Bloki (256x)' };
        slots[10] = { icon: 'box', color: '#8B4513', name: 'Yog\'och Bloklar (512x)' };
        slots[11] = { icon: 'box', color: '#888888', name: 'Tosh va G\'isht (256x)' };
        slots[12] = { icon: 'box', color: '#ffaaaa', name: 'Oyna (128x)' };
        slots[13] = { icon: 'hammer', color: '#ffffff', name: 'Qurilish Asbobi' };
        slots[14] = { icon: 'brush', color: '#00ffff', name: 'Rangli Bo\'yoqlar' };
    } else {
        const hash = rankName.split('').reduce((a,b)=>a+b.charCodeAt(0), 0);
        let appleCount = (hash % 32) + 32;
        let pCount = (hash % 16) + 16;
        let bCount = (hash % 128) + 128;
        
        slots[0] = { icon: 'shield', color: color, name: `${rankName} Shlemi` };
        slots[1] = { icon: 'shirt', color: color, name: `${rankName} Ko'kragi` };
        slots[2] = { icon: 'triangle-right', color: color, name: `${rankName} ishtoni` };
        slots[3] = { icon: 'footprints', color: color, name: `${rankName} Etigi` };
        slots[4] = { icon: 'swords', color: color, name: `${rankName} Qilichi` };
        slots[5] = { icon: 'pickaxe', color: color, name: `${rankName} Kirkasi` };
        slots[6] = { icon: 'axe', color: color, name: `${rankName} Boltasi` };
        slots[7] = { icon: 'shovel', color: color, name: `${rankName} Belkuragi` };
        slots[8] = { icon: 'crosshair', color: color, name: `${rankName} Kamoni` };
        slots[9] = { icon: 'apple', color: '#ff3333', name: `Oltin Olma (${appleCount}x)` };
        slots[10] = { icon: 'apple', color: '#ffaa00', name: `Zaharli Oltin Olma (${pCount}x)` };
        slots[11] = { icon: 'aperture', color: '#aa00aa', name: `Ender Pearl (${pCount}x)` };
        slots[12] = { icon: 'target', color: '#cccccc', name: 'O\'qlar (64x)' };
        slots[13] = { icon: 'droplet', color: '#ff5555', name: 'Sog\'liq Ikiri (2x)' };
        slots[14] = { icon: 'zap', color: '#00ffff', name: 'Tezlik Ikiri (2x)' };
        slots[15] = { icon: 'flame', color: '#ffaa00', name: 'Olovga Chidamlilik (1x)' };
        slots[16] = { icon: 'gem', color: '#39ff14', name: 'Zabarjad (64x)' };
        slots[17] = { icon: 'gem', color: '#55ffff', name: 'Olmos (32x)' };
        slots[18] = { icon: 'package', color: color, name: 'Maxsus Buyumlar (Kit sandig\'i)' };
        slots[19] = { icon: 'award', color: '#ffaa00', name: 'Totem (O\'lmaslik)' };
        slots[20] = { icon: 'compass', color: '#ffffff', name: 'Kompas' };
        slots[21] = { icon: 'key', color: '#ffdd00', name: 'Kassa Kaliti (3x)' };
        slots[22] = { icon: 'box', color: '#888888', name: `Qurilish Bloklari (${bCount}x)` };
        slots[23] = { icon: 'drumstick', color: '#ff8800', name: `Pishgan Go\'sht (64x)` };
        slots[24] = { icon: 'anvil', color: '#555555', name: 'Sandan' };
        slots[25] = { icon: 'book', color: '#aa00aa', name: 'Sehrli Kitob' };
        slots[26] = { icon: 'star', color: '#ffff55', name: 'Nether Star' };
    }

    const slotsContainer = document.getElementById('inv-slots');
    slotsContainer.innerHTML = '';
    
    slots.forEach((slot, idx) => {
        const div = document.createElement('div');
        div.className = 'inv-slot';
        if(slot) {
            div.classList.add('filled');
            div.setAttribute('data-tooltip', slot.name);
            div.innerHTML = `<div style="color: ${slot.color};"><i data-lucide="${slot.icon}"></i></div>`;
        }
        slotsContainer.appendChild(div);
    });

    lucide.createIcons();
    toggleModal('inventory-modal');
}

function searchPlayerToggle(e) {
    e.preventDefault();
    const btn = document.getElementById('search-btn');
    const input = document.getElementById('search-input');
    const name = input.value.trim();
    if(!name) return;

    btn.innerHTML = 'QIDIRILMOQDA...';
    
    fetch(`/api/search_player?name=${encodeURIComponent(name)}`)
        .then(res => res.json())
        .then(data => {
            btn.innerHTML = '<i data-lucide="search"></i> QIDIRISH';
            lucide.createIcons();
            if(data.error) return;

            document.getElementById('search-bodyUrl').src = data.bodyUrl;
            document.getElementById('search-name').innerText = data.name;
            document.getElementById('search-rank').innerText = data.p_rank;
            document.getElementById('search-rank2').innerText = data.p_rank;
            document.getElementById('search-kit').innerText = data.active_kit;
            
            toggleModal('search-modal');
        });
}

function adminActionGive(e) {
    e.preventDefault();
    const player = document.getElementById('give-player').value;
    const item = document.getElementById('give-item').value;
    
    fetch(`/api/admin/give_item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player, item })
    })
    .then(async res => {
        const data = await res.json().catch(() => ({}));
        if(data.error) showToast(data.error, 'error');
        else {
            showToast("Muvaffaqiyatli yuborildi!", 'success');
            setTimeout(() => window.location.reload(), 1000);
        }
    });
}

function deleteComment(id) {
    fetch(`/api/admin/delete_comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    })
    .then(async res => {
        const data = await res.json().catch(() => ({}));
        if(data.error) showToast(data.error, 'error');
        else window.location.reload();
    });
}
