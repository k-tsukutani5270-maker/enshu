// フォームと一覧の要素を取得
const cafeForm = document.getElementById('cafe-form');
const recordList = document.getElementById('record-list');

// ページ読み込み時に保存されたデータを表示
document.addEventListener('DOMContentLoaded', loadRecords);

// フォーム送信時の処理
cafeForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    // 値の取得
    const shopName = document.getElementById('shop-name').value;
    const location = document.getElementById('location').value;
    const photoFiles = document.getElementById('photo').files;
    const food = document.getElementById('food').value;
    const ratingValue = document.querySelector('input[name="rating"]:checked').value;
    
    // 支払い方法（複数選択）の取得
    const paymentCheckboxes = document.querySelectorAll('input[name="payment"]:checked');
    const payments = Array.from(paymentCheckboxes).map(cb => cb.value);
    const paymentString = payments.length > 0 ? payments.join(', ') : 'None';

    const nextFood = document.getElementById('next-food').value;
    const memo = document.getElementById('memo').value;
    const recordDate = new Date().toLocaleDateString('ja-JP');

    let photoUrls = [];
    if (photoFiles.length > 0) {
        // 全てのファイルをBase64に変換
        for (let i = 0; i < photoFiles.length; i++) {
            const url = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(photoFiles[i]);
            });
            photoUrls.push(url);
        }
    }

    const newRecord = {
        name: shopName,
        loc: location,
        // 配列を文字列として保存（DB側の互換性のため）
        photo: JSON.stringify(photoUrls),
        food: food,
        rating: ratingValue,
        pay: paymentString, // カンマ区切りの文字列として保存
        next: nextFood,
        memo: memo,
        date: recordDate,
        tapeClass: getRandomTapeClass()
    };

    // サーバーに保存
    await saveRecordToServer(newRecord);
    
    // 画面に描画
    renderCard(newRecord);

    // フォームをリセット
    cafeForm.reset();
});

/**
 * サーバーにレコードを保存
 */
async function saveRecordToServer(record) {
    try {
        const response = await fetch('/api/records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(record),
        });
        if (!response.ok) throw new Error('Save failed');
        return await response.json();
    } catch (err) {
        console.error('Error saving record:', err);
        alert('保存に失敗しました。データサイズが大きすぎる可能性があります（写真は1投稿につき数枚までを推奨します）。');
    }
}

/**
 * サーバーからレコードを読み込み
 */
async function loadRecords() {
    try {
        const response = await fetch('/api/records');
        if (!response.ok) throw new Error('Fetch failed');
        const records = await response.json();
        
        // 既存のリストをクリア
        recordList.innerHTML = '';
        
        // サーバーから返ってくるデータは降順なので、そのまま表示
        records.forEach(record => {
            // サーバー側はスネークケース(tape_class)なので変換を考慮
            const formattedRecord = {
                ...record,
                tapeClass: record.tape_class || record.tapeClass
            };
            renderCard(formattedRecord);
        });
    } catch (err) {
        console.error('Error loading records:', err);
    }
}

function getStarString(rating) {
    const num = parseInt(rating);
    return "★".repeat(num) + "☆".repeat(5 - num);
}

function getRandomTapeClass() {
    const classes = ['tape-gingham', 'tape-blue', 'tape-yellow'];
    return classes[Math.floor(Math.random() * classes.length)];
}

/**
 * カードを画面に描画する
 */
function renderCard(record) {
    const card = document.createElement('div');
    card.className = 'card';

    const encodedLoc = encodeURIComponent(record.loc);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLoc}`;

    // 写真データのパース
    let photos = [];
    try {
        // 文字列として保存されている配列を復元
        photos = JSON.parse(record.photo || '[]');
        if (!Array.isArray(photos)) {
            // 古いデータ（単一のURL文字列）の場合
            photos = record.photo ? [record.photo] : [];
        }
    } catch (e) {
        // パースに失敗した場合は単一のURLとして扱う
        photos = record.photo ? [record.photo] : [];
    }

    let imageHtml = "";
    if (photos.length > 0) {
        imageHtml = `<div class="card-image-gallery">`;
        photos.forEach((src, index) => {
            imageHtml += `<img src="${src}" alt="${record.name} - ${index + 1}" class="card-image ${index === 0 ? 'active' : ''}">`;
        });
        if (photos.length > 1) {
            imageHtml += `<div class="gallery-counter">1/${photos.length}</div>`;
            imageHtml += `<button class="gallery-prev" onclick="changeImage(this, -1)">❮</button>`;
            imageHtml += `<button class="gallery-next" onclick="changeImage(this, 1)">❯</button>`;
        }
        imageHtml += `</div>`;
    } else {
        imageHtml = `<div class="card-image" style="display:flex; align-items:center; justify-content:center; background:#f5f5f5; color:#ddd; font-size:3rem;">☕</div>`;
    }

    card.innerHTML = `
        <div class="tape ${record.tapeClass || getRandomTapeClass()}"></div>
        <div class="bookmark"></div>
        ${imageHtml}
        <div class="card-content">
            <div class="card-date">${record.date}</div>
            <h3 class="card-title">${record.name}</h3>
            <div class="card-location">#${record.loc.replace(/\s+/g, '')}</div>
            <div class="card-rating">${getStarString(record.rating)}</div>
            
            <div class="card-detail-item">
                <span class="card-detail-label">Menu</span>${record.food || 'None'}
            </div>
            <div class="card-detail-item">
                <span class="card-detail-label">Next</span>${record.next || 'None'}
            </div>
            
            <div class="card-memo">
                ${record.memo ? record.memo.replace(/\n/g, '<br>') : 'No thoughts recorded yet.'}
            </div>

            <div class="card-footer">
                <div class="pay-tag">💳 ${record.pay}</div>
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="map-btn">
                    📍 Map
                </a>
            </div>
        </div>
    `;

    // 読み込み済みのデータの末尾に追加
    recordList.appendChild(card);
}

/**
 * ギャラリーの画像を切り替える（グローバル関数として定義）
 */
window.changeImage = function(btn, direction) {
    const gallery = btn.closest('.card-image-gallery');
    const images = gallery.querySelectorAll('.card-image');
    const counter = gallery.querySelector('.gallery-counter');
    
    let activeIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
    images[activeIndex].classList.remove('active');
    
    activeIndex = (activeIndex + direction + images.length) % images.length;
    images[activeIndex].classList.add('active');
    
    if (counter) {
        counter.textContent = `${activeIndex + 1}/${images.length}`;
    }
};
