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
    const photoFile = document.getElementById('photo').files[0];
    const food = document.getElementById('food').value;
    const ratingValue = document.querySelector('input[name="rating"]:checked').value;
    const payment = document.querySelector('input[name="payment"]:checked').value;
    const nextFood = document.getElementById('next-food').value;
    const memo = document.getElementById('memo').value;
    const recordDate = new Date().toLocaleDateString('ja-JP');

    let photoUrl = "";
    if (photoFile) {
        photoUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(photoFile);
        });
    }

    const newRecord = {
        name: shopName,
        loc: location,
        photo: photoUrl,
        food: food,
        rating: ratingValue,
        pay: payment,
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
        alert('保存に失敗しました。');
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

    const imageHtml = record.photo 
        ? `<img src="${record.photo}" alt="${record.name}" class="card-image">`
        : `<div class="card-image" style="display:flex; align-items:center; justify-content:center; background:#f5f5f5; color:#ddd; font-size:3rem;">☕</div>`;

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
