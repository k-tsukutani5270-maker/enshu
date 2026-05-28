// フォームと一覧の要素を取得
const cafeForm = document.getElementById('cafe-form');
const recordList = document.getElementById('record-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const locationFilterInput = document.getElementById('location-filter');
const sortSelect = document.getElementById('sort-select');

// 状態管理
let allRecords = [];
let currentFilter = 'All';

// Leafletマップの初期化
let map;
let markers = [];

function initMap() {
    map = L.map('sidebar-map').setView([35.681236, 139.767125], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadRecords();
    setupFilters();
});

// フィルター・ソートの設定
function setupFilters() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.textContent;
            applyFilter();
        });
    });

    locationFilterInput.addEventListener('input', applyFilter);
    sortSelect.addEventListener('change', applyFilter);
}

function applyFilter() {
    let filtered = [...allRecords];

    const locSearch = locationFilterInput.value.toLowerCase().trim();
    if (locSearch) {
        filtered = filtered.filter(r => r.loc.toLowerCase().includes(locSearch));
    }

    const sortVal = sortSelect.value;
    if (sortVal === 'latest') {
        filtered.sort((a, b) => b.id - a.id);
    } else if (sortVal === 'rating') {
        filtered.sort((a, b) => parseInt(b.rating) - parseInt(a.rating));
    }
    
    recordList.innerHTML = '';
    filtered.forEach(record => renderCard(record));

    updateMapMarkers(filtered);
}

function updateMapMarkers(filteredRecords) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    filteredRecords.forEach(record => {
        if (record.lat && record.lng) {
            const marker = L.marker([record.lat, record.lng])
                .addTo(map)
                .bindPopup(`<b>${record.name}</b><br>${record.loc}`);
            markers.push(marker);
        }
    });

    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

async function getLatLng(location) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
    } catch (err) {
        console.error('Geocoding error:', err);
    }
    return null;
}

cafeForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const shopName = document.getElementById('shop-name').value;
    const location = document.getElementById('location').value;
    const photoFiles = document.getElementById('photo').files;
    const visitDateValue = document.getElementById('visit-date').value;
    const food = document.getElementById('food').value;
    const ratingValue = document.querySelector('input[name="rating"]:checked').value;
    
    const paymentCheckboxes = document.querySelectorAll('input[name="payment"]:checked');
    const payments = Array.from(paymentCheckboxes).map(cb => cb.value);
    const paymentString = payments.length > 0 ? payments.join(', ') : 'None';

    const nextFood = document.getElementById('next-food').value;
    const memo = document.getElementById('memo').value;
    
    const formattedDate = visitDateValue ? visitDateValue.replace(/-/g, '/') : new Date().toLocaleDateString('ja-JP');

    const coords = await getLatLng(location);

    let photoUrls = [];
    if (photoFiles.length > 0) {
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
        photo: JSON.stringify(photoUrls),
        food: food,
        rating: ratingValue,
        pay: paymentString,
        next: nextFood,
        memo: memo,
        date: formattedDate,
        tapeClass: getRandomTapeClass(),
        lat: coords ? coords.lat : null,
        lng: coords ? coords.lng : null
    };

    const savedRecord = await saveRecordToServer(newRecord);
    if (savedRecord) {
        newRecord.id = savedRecord.id;
        allRecords.unshift(newRecord);
        applyFilter();
    }

    cafeForm.reset();
});

async function saveRecordToServer(record) {
    try {
        const response = await fetch('/api/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record),
        });
        if (!response.ok) throw new Error('Save failed');
        return await response.json();
    } catch (err) {
        console.error('Error saving record:', err);
        alert('保存に失敗しました。');
    }
}

async function loadRecords() {
    try {
        const response = await fetch('/api/records');
        if (!response.ok) throw new Error('Fetch failed');
        allRecords = await response.json();
        
        allRecords.forEach(record => {
            record.tapeClass = record.tape_class || record.tapeClass;
        });

        applyFilter();
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

function renderCard(record) {
    const card = document.createElement('div');
    card.className = 'card';

    const encodedLoc = encodeURIComponent(record.loc);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLoc}`;

    let photos = [];
    try {
        photos = JSON.parse(record.photo || '[]');
        if (!Array.isArray(photos)) {
            photos = record.photo ? [record.photo] : [];
        }
    } catch (e) {
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

    recordList.appendChild(card);
}

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
