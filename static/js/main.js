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
    fetch('/api/buy', { method: 'OPTIONS' }).then(() => {
        // Just checking if we can, wait, actually we shouldn't fail purely on checking login via options
    });
    
    // We will just open modal and if they are not logged in, server will reject on submit
    document.getElementById('pay-item-name').innerText = name;
    document.getElementById('pay-item-price').innerText = price;
    toggleModal('payment-modal');
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
            alert(data.error);
        } else {
            document.getElementById('payment-modal').style.display = 'none';
            alert("To'lov muvaffaqiyatli! Admin panelni tekshiring.");
            window.location.reload();
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
        if(data.error) alert(data.error);
        else window.location.reload();
    });
}

function adminAction(e, action) {
    e.preventDefault();
    let name = document.getElementById('item-name').value;
    const price = document.getElementById('item-price').value;
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
        if(data.error) alert(data.error);
        else window.location.reload();
    });
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
        if(data.error) alert(data.error);
        else window.location.reload();
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
    slots[10] = { icon: 'swords', color: color, name: `${rankName} Qilichi` };
    slots[11] = { icon: 'shield', color: color, name: `${rankName} Sovuti` };
    slots[12] = { icon: 'package', color: color, name: 'Maxsus Buyumlar' };
    slots[14] = { icon: 'gem', color: '#39ff14', name: 'Zabarjad (16x)' };
    slots[15] = { icon: 'award', color: '#ffaa00', name: 'Totem' };
    slots[16] = { icon: 'zap', color: '#00ffff', name: 'Tezlik Ikiri' };

    const slotsContainer = document.getElementById('inv-slots');
    slotsContainer.innerHTML = '';
    
    slots.forEach((slot, idx) => {
        const div = document.createElement('div');
        div.className = 'inv-slot';
        if(slot) {
            div.classList.add('filled');
            div.title = slot.name;
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
        if(data.error) alert(data.error);
        else window.location.reload();
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
        if(data.error) alert(data.error);
        else window.location.reload();
    });
}
