//settings

const DELIVERY_CHARGE = 60;
const SHIPPING_RATE = 0.02;      // 2% of subtotal
const COUPON_CODE = 'SMART10';   // gives 10% off
const MAX_BALANCE = 25000;       // balance can not go above this

// keep up to 4 decimal places (336.5 stays 336.5, 336.123456 becomes 336.1235)
function fix4(n) {
  return Number(n.toFixed(4));
}

//data

let products = [];
let cart = [];
let couponApplied = false;
let balance = Number(localStorage.getItem('balance')) || 1000;

// ----- navbar: highlight the section you are on -----
window.addEventListener('scroll', function () {
  let current = 'home';
  document.querySelectorAll('section[id], footer[id]').forEach(function (sec) {
    if (window.scrollY >= sec.offsetTop - 100) current = sec.id;
  });
  document.querySelectorAll('.nav-link').forEach(function (link) {
    const active = link.getAttribute('href') === '#' + current;
    link.classList.toggle('text-blue-600', active);
    link.classList.toggle('font-bold', active);
  });
});

//banner_slider

const bannerImgs = document.querySelectorAll('.banner-img');
let bannerIndex = 0;

function showBanner(i) {
  bannerIndex = (i + bannerImgs.length) % bannerImgs.length;
  bannerImgs.forEach(function (img, n) {
    img.classList.toggle('hidden', n !== bannerIndex);
  });
}
document.getElementById('banner-prev').onclick = function () { showBanner(bannerIndex - 1); };
document.getElementById('banner-next').onclick = function () { showBanner(bannerIndex + 1); };
setInterval(function () { showBanner(bannerIndex + 1); }, 4000);

//(Fetch_Api)

fetch('https://fakestoreapi.com/products')
  .then(function (res) { return res.json(); })
  .then(function (data) {
    products = data;
    showProducts(products);
  })
  .catch(function () {
    document.getElementById('product-list').textContent = 'Could not load products.';
  });

function showProducts(list) {
  const box = document.getElementById('product-list');
  box.innerHTML = '';
  list.forEach(function (p) {
    box.innerHTML += `
      <div class="bg-white rounded shadow p-4 flex flex-col">
        <img src="${p.image}" alt="" class="h-40 object-contain mb-3">
        <h3 class="text-sm font-semibold flex-1">${p.title}</h3>
        <p class="text-yellow-500 text-sm">${'★'.repeat(Math.round(p.rating.rate))} ${p.rating.rate}</p>
        <p class="font-bold my-2">৳${p.price}</p>
        <button onclick="addToCart(${p.id})" class="bg-blue-600 text-white rounded py-1">Add to Cart</button>
      </div>`;
  });
}

//extra(search_by)

document.getElementById('search').addEventListener('input', function (e) {
  const text = e.target.value.toLowerCase();
  const result = products.filter(function (p) {
    return p.title.toLowerCase().includes(text) || p.category.toLowerCase().includes(text);
  });
  showProducts(result);
});

//cart

function getTotals() {
  let subtotal = 0;
  cart.forEach(function (item) { subtotal += item.price * item.qty; });

  const delivery = subtotal > 0 ? DELIVERY_CHARGE : 0;
  const shipping = subtotal * SHIPPING_RATE;
  const discount = couponApplied ? subtotal * 0.1 : 0;
  return { subtotal, delivery, shipping, discount, total: subtotal + delivery + shipping - discount };
}

function addToCart(id) {
  const product = products.find(function (p) { return p.id === id; });
  let item = cart.find(function (i) { return i.id === id; });

  if (item) {
    item.qty++;
  } else {
    item = { id: id, title: product.title, price: product.price, qty: 1 };
    cart.push(item);
  }

  //waring_not-allowed

  if (getTotals().total > balance) {
    item.qty--;
    if (item.qty === 0) cart.splice(cart.indexOf(item), 1);
    document.getElementById('warning').classList.remove('hidden');
  } else {
    document.getElementById('warning').classList.add('hidden');
  }
  showCart();
}

function removeFromCart(id) {
  cart = cart.filter(function (i) { return i.id !== id; });
  document.getElementById('warning').classList.add('hidden');
  showCart();
}

function showCart() {
  const box = document.getElementById('cart-items');
  box.innerHTML = cart.length ? '' : '<p class="text-gray-500">Your cart is empty.</p>';

  let count = 0;
  cart.forEach(function (item) {
    count += item.qty;
    box.innerHTML += `
      <div class="flex justify-between items-center border-b py-2 text-sm">
        <span class="flex-1">${item.title}</span>
        <span class="mx-4">${item.qty} x ৳${item.price}</span>
        <button onclick="removeFromCart(${item.id})" class="text-red-600">Remove</button>
      </div>`;
  });

  const t = getTotals();
  document.getElementById('subtotal').textContent = '৳' + fix4(t.subtotal);
  document.getElementById('delivery').textContent = '৳' + fix4(t.delivery);
  document.getElementById('shipping').textContent = '৳' + fix4(t.shipping);
  document.getElementById('discount').textContent = '-৳' + fix4(t.discount);
  document.getElementById('total').textContent = '৳' + fix4(t.total);
  document.getElementById('cart-count').textContent = count;
}

document.getElementById('apply-coupon').onclick = function () {
  const code = document.getElementById('coupon').value.trim().toUpperCase();
  const msg = document.getElementById('coupon-msg');
  if (code === COUPON_CODE) {
    couponApplied = true;
    msg.textContent = '10% discount applied.';
    msg.className = 'text-sm self-center text-green-600';
  } else {
    couponApplied = false;
    msg.textContent = 'Invalid coupon.';
    msg.className = 'text-sm self-center text-red-600';
  }
  showCart();
};

//checkout

document.getElementById('checkout').onclick = function () {
  if (cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }
  const total = getTotals().total;
  balance = fix4(balance - total);
  cart = [];
  couponApplied = false;
  document.getElementById('coupon').value = '';
  document.getElementById('coupon-msg').textContent = '';
  showBalance();
  showCart();
  alert('Order placed! ৳' + fix4(total) + ' was taken from your balance.');
};

//balance

function showBalance() {
  document.getElementById('balance').textContent = '৳' + fix4(balance);
  localStorage.setItem('balance', balance);
}

document.getElementById('add-money').onclick = function () {
  if (balance + 1000 > MAX_BALANCE) {
    alert('Balance limit is ৳' + MAX_BALANCE + '. You can not add more money.');
    return;
  }
  balance = fix4(balance + 1000);
  document.getElementById('warning').classList.add('hidden');
  showBalance();
};

//reviews

let reviews = [];
let reviewIndex = 0;

fetch('reviews.json')
  .then(function (res) { return res.json(); })
  .then(function (data) {
    reviews = data;
    showReview(0);
    setInterval(function () { showReview(reviewIndex + 1); }, 4000);
  })
  .catch(function () {
    document.getElementById('review').textContent =
      'Could not load reviews.json. Open the site with Live Server (or python -m http.server), not by double-clicking the file.';
  });

function showReview(i) {
  if (reviews.length === 0) return;
  reviewIndex = (i + reviews.length) % reviews.length;
  const r = reviews[reviewIndex];
  document.getElementById('review').innerHTML = `
    <p class="font-bold">${r.name}</p>
    <p class="text-yellow-500">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</p>
    <p class="my-2">${r.comment}</p>
    <p class="text-xs text-gray-500">${r.date}</p>`;
}
document.getElementById('review-prev').onclick = function () { showReview(reviewIndex - 1); };
document.getElementById('review-next').onclick = function () { showReview(reviewIndex + 1); };

//back-to-top

document.getElementById('back-to-top').onclick = function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

//start

showBalance();
showCart();
