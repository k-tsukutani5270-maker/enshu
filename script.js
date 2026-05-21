const cafeForm = document.getElementById('cafe-form');
const recordList = document.getElementById('record-list');

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

    if (photoFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            createCard(shopName, location, event.target.result, food, ratingValue, payment, nextFood, memo);
        };
        reader.readAsDataURL(photoFile);
    } else {
        createCard(shopName, location, "", food, ratingValue, payment, nextFood, memo);
    }

    cafeForm.reset();
});

function getStarString(rating) {
    const num = parseInt(rating);
    return "★".repeat(num) + "☆".repeat(5 - num);
}

// テープのスタイルをランダムに返す
function getRandomTapeClass() {
    const classes = ['tape-gingham', 'tape-blue', 'tape-yellow'];
    return classes[Math.floor(Math.random() * classes.length)];
}

function createCard(name, loc, photo, food, rating, pay, next, memo) {
    const card = document.createElement('div');
    card.className = 'card';

    const encodedLoc = encodeURIComponent(loc);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLoc}`;

    // 画像案に合わせた画像表示
    const imageHtml = photo 
        ? `<img src="${photo}" alt="${name}" class="card-image">`
        : `<div class="card-image" style="display:flex; align-items:center; justify-content:center; background:#f5f5f5; color:#ddd; font-size:3rem;">☕</div>`;

    // カードの構築
    card.innerHTML = `
        <div class="tape ${getRandomTapeClass()}"></div>
        <div class="bookmark"></div>
        ${imageHtml}
        <div class="card-content">
            <div class="card-date">${new Date().toLocaleDateString('ja-JP')}</div>
            <h3 class="card-title">${name}</h3>
            <div class="card-location">#${loc.replace(/\s+/g, '')}</div>
            <div class="card-rating">${getStarString(rating)}</div>
            
            <div class="card-detail-item">
                <span class="card-detail-label">Menu</span>${food || 'None'}
            </div>
            <div class="card-detail-item">
                <span class="card-detail-label">Next</span>${next || 'None'}
            </div>
            
            <div class="card-memo">
                ${memo ? memo.replace(/\n/g, '<br>') : 'No thoughts recorded yet.'}
            </div>

            <div class="card-footer">
                <div class="pay-tag">💳 ${pay}</div>
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="map-btn">
                    📍 Map
                </a>
            </div>
        </div>
    `;

    recordList.insertBefore(card, recordList.firstChild);
}
