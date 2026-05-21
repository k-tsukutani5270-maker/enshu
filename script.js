// フォームと一覧の要素を取得
const cafeForm = document.getElementById('cafe-form');
const recordList = document.getElementById('record-list');

// ページ読み込み時に保存されたデータを表示
document.addEventListener('DOMContentLoaded', loadRecords);

// フォーム送信時の処理
cafeForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // 値の取得
    const shopName = document.getElementById('shop-name').value;
    const location = document.getElementById('location').value;
    const photoFile = document.getElementById('photo').files[0];
    const food = document.getElementById('food').value;
    
    // ラジオボタンの評価値取得
    const ratingValue = document.querySelector('input[name="rating"]:checked').value;
    // ラジオボタンの支払い方法取得
    const payment = document.querySelector('input[name="payment"]:checked').value;
    
    const nextFood = document.getElementById('next-food').value;
    const memo = document.getElementById('memo').value;

    const recordDate = new Date().toLocaleDateString('ja-JP');

    if (photoFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const photoUrl = event.target.result;
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
            saveRecord(newRecord);
            renderCard(newRecord);
        };
        reader.readAsDataURL(photoFile);
    } else {
        const newRecord = {
            name: shopName,
            loc: location,
            photo: "",
            food: food,
            rating: ratingValue,
            pay: payment,
            next: nextFood,
            memo: memo,
            date: recordDate,
            tapeClass: getRandomTapeClass()
        };
        saveRecord(newRecord);
        renderCard(newRecord);
    }

    cafeForm.reset();
});

/**
 * localStorageにレコードを保存
 */
function saveRecord(record) {
    const records = JSON.parse(localStorage.getItem('cafeRecords') || '[]');
    records.push(record);
    localStorage.setItem('cafeRecords', JSON.stringify(records));
}

/**
 * localStorageからレコードを読み込み
 */
function loadRecords() {
    const records = JSON.parse(localStorage.getItem('cafeRecords') || '[]');
    // 新しい順に表示するためにリバース
    records.reverse().forEach(record => {
        renderCard(record);
    });
}

function getStarString(rating) {
    const num = parseInt(rating);
    return "★".repeat(num) + "☆".repeat(5 - num);
}

// テープのスタイルをランダムに返す
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

    // 読み込み時は最後に追加、新規作成時は先頭に追加されるよう調整が必要
    // loadRecords内でreverseしているので、常にinsertBeforeでOK
    recordList.insertBefore(card, recordList.firstChild);
}
