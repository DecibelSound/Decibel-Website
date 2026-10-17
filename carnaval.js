(() => {
  const catalog = window.CARNAVAL_CATALOG;
  if (!catalog) return;

  const money = new Intl.NumberFormat('nl-NL', {style: 'currency', currency: 'EUR'});
  const categoryLabels = {geluid: 'Geluid', dj: 'DJ-gear', licht: 'Licht', sfx: 'Special FX', truss: 'Truss', overig: 'Extra’s/overig', consumables: 'Consumables'};
  const categoryOrder = ['geluid', 'dj', 'licht', 'sfx', 'truss', 'overig', 'consumables'];
  const storageKey = 'decibel-carnaval-selectie-v8';
  const customStorageKey = 'decibel-carnaval-custom-sets-v1';
  const initialParams = new URLSearchParams(window.location.search);
  const transferredSelection = initialParams.get('selectie');
  if (transferredSelection === 'leeg') {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(customStorageKey);
  } else if (transferredSelection) {
    try {
      const parsed = JSON.parse(transferredSelection);
      if (parsed && typeof parsed.cart === 'object' && Array.isArray(parsed.customProducts)) {
        localStorage.setItem(storageKey, JSON.stringify(parsed.cart));
        localStorage.setItem(customStorageKey, JSON.stringify(parsed.customProducts));
      }
    } catch (error) { /* Ongeldige overdracht wordt genegeerd. */ }
  }
  let customProducts = loadCustomProducts();
  const byId = new Map([...catalog.products, ...customProducts].map(product => [product.id, product]));
  const catalogToolbar = document.querySelector('.catalog-toolbar');
  const grid = document.querySelector('[data-product-grid]');
  const resultCount = document.querySelector('[data-result-count]');
  const emptyState = document.querySelector('[data-empty]');
  const searchInput = document.querySelector('[data-catalog-search]');
  const sortSelect = document.querySelector('[data-catalog-sort]');
  const productDialog = document.querySelector('[data-product-dialog]');
  const productDialogContent = document.querySelector('[data-product-dialog-content]');
  const builderDialog = document.querySelector('[data-builder-dialog]');
  const builderContent = document.querySelector('[data-builder-content]');
  const requestDialog = document.querySelector('[data-request-dialog]');
  const requestForm = document.querySelector('[data-request-form]');
  const requestFeedback = document.querySelector('[data-request-feedback]');
  const requestSuccess = document.querySelector('[data-request-success]');
  const requestSubmit = document.querySelector('[data-request-submit]');
  const deliveryUnknown = document.querySelector('[data-delivery-unknown]');
  const deliveryAddress = document.querySelector('[data-delivery-address]');
  const brandFilterRow = document.querySelector('[data-brand-filter-row]');
  const subsFilter = document.querySelector('[data-subs-filter]');
  const topsFilter = document.querySelector('[data-tops-filter]');
  const budgetFilter = document.querySelector('[data-budget-filter]');
  const priceMinInput = document.querySelector('[data-price-min]');
  const priceMaxInput = document.querySelector('[data-price-max]');
  const priceMinField = document.querySelector('[data-price-min-field]');
  const priceMaxField = document.querySelector('[data-price-max-field]');
  const budgetOutput = document.querySelector('[data-budget-output]');
  const promoElement = document.querySelector('[data-catalog-promo]');
  const promoImage = promoElement.querySelector('[data-promo-image]');
  const promoEyebrow = promoElement.querySelector('[data-promo-eyebrow]');
  const promoTitle = promoElement.querySelector('[data-promo-title]');
  const promoText = promoElement.querySelector('[data-promo-text]');
  const promoAction = promoElement.querySelector('[data-promo-action]');
  const backToTop = document.querySelector('[data-back-to-top]');
  const cartPanel = document.querySelector('#aanvraag');
  const mobileCartDialog = document.querySelector('[data-mobile-cart-dialog]');
  const mobileCartHost = document.querySelector('[data-mobile-cart-host]');
  const cartPositionMarker = document.createComment('positie reserveringsoverzicht');
  cartPanel.before(cartPositionMarker);
  const knownBrands = ['L-Acoustics', 'd&b audiotechnik', 'AED Audio', 'QSC', 'Verity Audio'];
  const subwooferModels = ['SB18', 'KS21', 'SB28', 'KS28', 'CS1', 'SOLID28', 'KW181', 'MULTISUB', 'SL-SUB', 'SUB218ND'];
  const topModels = ['X12/12XT', 'A15 WIDE', 'A15 FOCUS', 'KARA II', 'K3', 'K2', 'K1', 'ARCS II', 'K12.2', 'KLA12', 'MULTI12', 'FLEX6', 'KSL8', 'VT152'];
  const maximumBudget = Math.ceil(Math.max(...catalog.products.map(product => product.price)) / 500) * 500;
  const wholeEuros = new Intl.NumberFormat('nl-NL', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0});
  const builderBrands = [
    {
      id: 'l-acoustics',
      name: 'L-Acoustics',
      models: [
        {id: 'sb18', name: 'SB18', fullName: 'L-Acoustics SB18', type: 'sub', step: 1, weight: 1, image: 'assets/carnaval/producten/sb18.png'},
        {id: 'ks21', name: 'KS21', fullName: 'L-Acoustics KS21', type: 'sub', step: 1, weight: 1.15, image: 'assets/carnaval/producten/ks21.png'},
        {id: 'ks28', name: 'KS28', fullName: 'L-Acoustics KS28', type: 'sub', step: 1, weight: 2.15, image: 'assets/carnaval/producten/ks28.png'},
        {id: 'cs1', name: 'CS1', fullName: 'L-Acoustics CS1', type: 'sub', step: 2, weight: 4.2, image: 'assets/carnaval/producten/cs1.jpg'},
        {id: 'x12', name: 'X12 / 12XT', fullName: 'L-Acoustics X12 / 12XT', aliases: ['X12', '12XT'], type: 'top', step: 2, weight: .85, image: 'assets/carnaval/producten/x12.png'},
        {id: 'a15-wide', name: 'A15 Wide', fullName: 'L-Acoustics A15 Wide', type: 'top', step: 2, weight: 1.25, image: 'assets/carnaval/producten/a15.png'},
        {id: 'a15-focus', name: 'A15 Focus', fullName: 'L-Acoustics A15 Focus', type: 'top', step: 2, weight: 1.3, image: 'assets/carnaval/producten/a15.png'},
        {id: 'kara-ii', name: 'Kara II', fullName: 'L-Acoustics Kara II', type: 'top', step: 3, weight: 1.25, image: 'assets/carnaval/producten/kara-ii.webp'},
        {id: 'arcs-ii', name: 'ARCS II', fullName: 'L-Acoustics ARCS II', type: 'top', step: 1, weight: 1.6, image: 'assets/carnaval/producten/arcs-ii.jpg'},
        {id: 'k3', name: 'K3', fullName: 'L-Acoustics K3', type: 'top', step: 4, weight: 2.1, image: 'assets/carnaval/producten/k3.jpg'},
        {id: 'k2', name: 'K2', fullName: 'L-Acoustics K2', type: 'top', step: 4, weight: 2.7, image: 'assets/carnaval/producten/k2.png'},
        {id: 'k1', name: 'K1', fullName: 'L-Acoustics K1', type: 'top', step: 4, weight: 3.3, image: 'assets/carnaval/producten/k1.jpg'}
      ]
    },
    {
      id: 'd-b',
      name: 'd&b audiotechnik',
      models: [
        {id: 'sl-sub', name: 'SL-SUB', fullName: 'd&b audiotechnik SL-SUB', type: 'sub', step: 1, weight: 3.4, image: 'assets/carnaval/producten/slsub.webp'},
        {id: 'ksl8', name: 'KSL8', fullName: 'd&b audiotechnik KSL8', type: 'top', step: 4, weight: 2.2, image: 'assets/carnaval/producten/ksl8.png'}
      ]
    },
    {
      id: 'aed-audio',
      name: 'AED Audio',
      models: [
        {id: 'multisub', name: 'MULTISUB', fullName: 'AED Audio MULTISUB', type: 'sub', step: 1, weight: 1.2, image: 'assets/carnaval/producten/multisub.webp'},
        {id: 'solid28', name: 'SOLID28', fullName: 'AED Audio SOLID28', type: 'sub', step: 1, weight: 2.2, image: 'assets/carnaval/producten/solid28.png'},
        {id: 'multi12', name: 'MULTI12', fullName: 'AED Audio MULTI12', type: 'top', step: 1, weight: .8, image: 'assets/carnaval/producten/multi12.webp'},
        {id: 'flex6', name: 'FLEX6', fullName: 'AED Audio FLEX6', type: 'top', step: 2, weight: .65, image: 'assets/carnaval/producten/flex6.webp'}
      ]
    },
    {
      id: 'qsc',
      name: 'QSC',
      models: [
        {id: 'kw181', name: 'KW181', fullName: 'QSC KW181', type: 'sub', step: 1, weight: 1.1, image: 'assets/carnaval/producten/kw181.webp'},
        {id: 'k12-2', name: 'K12.2', fullName: 'QSC K12.2', type: 'top', step: 2, weight: .85, image: 'assets/carnaval/producten/k12-2.webp'},
        {id: 'kla12', name: 'KLA12', fullName: 'QSC KLA12', type: 'top', step: 1, weight: 1, image: 'assets/carnaval/producten/kla12.webp'}
      ]
    }
  ];
  const promotions = [
    {
      id: 'cs1',
      image: 'assets/carnaval/promos/cs1.jpg',
      imageAlt: 'L-Acoustics CS1 subwoofer',
      eyebrow: 'Nieuw bij Decibel',
      title: 'L-Acoustics CS1',
      text: 'Het gloednieuwe, megagrote subwoofermodel van L-Acoustics: vier 21-inch woofers, laag tot 25 Hz en maximaal 150 dB SPL. Dankzij de cardioïde afstraling kan het laag beter gestuurd worden.',
      action: 'Bekijk de CS1-sets',
      category: 'geluid',
      brand: 'L-Acoustics',
      query: 'CS1'
    },
    {
      id: 'k1',
      image: 'assets/carnaval/promos/k1.png',
      imageAlt: 'L-Acoustics K1 luidsprekers',
      eyebrow: 'Groots uitpakken',
      title: 'K1 op jullie carnavalswagen?',
      text: 'De grote touringtop van L-Acoustics levert maximaal 149 dB SPL en draagt uitzonderlijk ver. Voor groepen die echt groots willen uitpakken.',
      action: 'Bekijk de K1-sets',
      category: 'geluid',
      brand: 'L-Acoustics',
      query: 'K1'
    },
    {
      id: 'db',
      image: 'assets/carnaval/promos/db.jpg',
      imageAlt: 'd&b audiotechnik geluidssysteem',
      eyebrow: 'Nieuw in de verhuur',
      title: 'd&b audiotechnik',
      text: 'Vanaf dit jaar verhuren we complete d&b-sets met KSL8, SL-SUB en D40/D90-versterkers. Veel vermogen, strak geluid en goede controle rondom de wagen.',
      action: 'Bekijk de d&b-sets',
      category: 'geluid',
      brand: 'd&b audiotechnik',
      query: ''
    },
    {
      id: 'confetti',
      image: 'assets/carnaval/promos/confetti.webp',
      imageAlt: 'Doos MagicFX confettibuizen',
      eyebrow: 'Doosvoordeel',
      title: '20 confettibuizen voor € 160',
      text: 'Een volle doos MagicFX Electric Confetti Refills van 80 cm: <s>€ 180</s> nu € 160 inclusief btw. Dat is € 20 voordeel. Andere kleuren, streamers en metallic zijn op aanvraag mogelijk.',
      action: 'Bekijk de confettideal',
      category: 'consumables',
      brand: 'all',
      query: 'doos van 20'
    }
  ];
  let activeCategory = 'all';
  let activeBrand = 'all';
  let activeSubs = 'all';
  let activeTops = 'all';
  let activePriceMin = 0;
  let activePriceMax = maximumBudget;
  let activeProductId = null;
  let builderBrandId = null;
  let builderSelection = {};
  let cart = loadCart();
  let activePromotion = null;
  let lastPromotionId = null;
  let lastPromotionShownAt = 0;
  let promoRotationTimer = null;
  let promoTransitionTimer = null;
  const promoVisibleDuration = 9000;
  const promoMinimumPause = 180000;
  const promoMaximumPause = 420000;

  priceMinInput.max = String(maximumBudget);
  priceMaxInput.max = String(maximumBudget);
  priceMaxInput.value = String(maximumBudget);
  priceMinField.max = String(maximumBudget);
  priceMaxField.max = String(maximumBudget);
  priceMaxField.value = String(maximumBudget);

function syncStickyLayout() {
  if (!catalogToolbar) return;
  const toolbarHeight = catalogToolbar.offsetHeight;
  const toolbarTop = Number.parseFloat(window.getComputedStyle(catalogToolbar).top) || 0;
  const stickyRoot = document.querySelector('.carnaval-page') || document.documentElement;
  stickyRoot.style.setProperty('--catalog-toolbar-height', `${toolbarHeight}px`);
  stickyRoot.style.setProperty('--cart-sticky-top', `${Math.ceil(toolbarTop + toolbarHeight + 18)}px`);
}

  if (catalogToolbar) {
    syncStickyLayout();
    if ('ResizeObserver' in window) new ResizeObserver(syncStickyLayout).observe(catalogToolbar);
    if ('MutationObserver' in window) new MutationObserver(syncStickyLayout).observe(document.body, {attributes: true, attributeFilter: ['class']});
    window.addEventListener('resize', syncStickyLayout, {passive: true});
  }

  function loadCustomProducts() {
    try {
      const saved = JSON.parse(localStorage.getItem(customStorageKey) || '[]');
      if (!Array.isArray(saved)) return [];
      return saved.filter(product => product && typeof product.id === 'string' && product.id.startsWith('custom-geluid-') && Array.isArray(product.components));
    } catch (error) {
      return [];
    }
  }

  function saveCustomProducts() {
    try { localStorage.setItem(customStorageKey, JSON.stringify(customProducts)); } catch (error) { /* localStorage kan geblokkeerd zijn */ }
  }

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return Object.fromEntries(Object.entries(saved).filter(([id, quantity]) => byId.has(id) && Number.isInteger(quantity) && quantity > 0));
    } catch (error) {
      return {};
    }
  }

  function saveCart() {
    try { localStorage.setItem(storageKey, JSON.stringify(cart)); } catch (error) { /* localStorage kan geblokkeerd zijn */ }
  }

  function replayAnimation(element, className, duration = 750) {
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), duration);
  }

  function createClickBurst(event, control) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = control.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;
    const burst = document.createElement('span');
    const colors = ['#e96500', '#f47b00', '#ff8a00', '#ffa012', '#ffb938', '#ffd080'];
    const amount = control.matches('[data-add],[data-dialog-add],[data-open-request]') ? 15 : 9;
    burst.className = 'click-burst';
    burst.style.transform = `translate(${x}px,${y}px)`;
    for (let index = 0; index < amount; index += 1) {
      const particle = document.createElement('i');
      const angle = Math.PI * 2 * index / amount + (Math.random() - .5) * .35;
      const distance = 32 + Math.random() * 48;
      particle.style.setProperty('--burst-x', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--burst-y', `${Math.sin(angle) * distance}px`);
      particle.style.setProperty('--burst-r', `${180 + Math.random() * 420}deg`);
      particle.style.setProperty('--burst-color', colors[index % colors.length]);
      burst.appendChild(particle);
    }
    document.body.appendChild(burst);
    window.setTimeout(() => burst.remove(), 850);
  }

  function celebrateCart() {
    replayAnimation(document.querySelector('.cart'), 'cart-celebrate');
    document.querySelectorAll('.cart-count,.mobile-cart-button').forEach(element => replayAnimation(element, 'is-bumping'));
  }

  function priceExVat(priceIncl) {
    return priceIncl / (1 + catalog.vatRate);
  }

  function priceHtml(price, unit = '', compareAtPrice = null, periodPrice = true) {
    const comparison = compareAtPrice && compareAtPrice > price
      ? `<div class="price-compare"><s>${money.format(compareAtPrice)}</s><span>Je bespaart ${money.format(compareAtPrice - price)}</span></div>`
      : '';
    return `${comparison}<div class="price-main"><strong>${money.format(price)}</strong>${unit ? `<span>${unit}</span>` : ''}</div><div class="price-vat">incl. 21% btw · ${money.format(priceExVat(price))} excl. btw</div>${periodPrice ? '<div class="price-period">Prijs voor 4 dagen carnaval</div>' : ''}`;
  }

  function normalize(value) {
    return value.toLocaleLowerCase('nl-NL').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function productCategories(product) {
    return Array.isArray(product.categories) && product.categories.length ? product.categories : [product.category];
  }

  function productSearchText(product) {
    return normalize([product.name, product.subgroup, ...productCategories(product).map(category => categoryLabels[category]), ...productBrands(product), ...product.components].join(' '));
  }

  function productBrands(product) {
    if (product.category !== 'geluid') return [];
    if (Array.isArray(product.brands) && product.brands.length) return product.brands;
    const haystack = normalize([product.name, ...product.components].join(' '));
    const matches = knownBrands.filter(brand => haystack.includes(normalize(brand)));
    return matches.length ? matches : ['Overig'];
  }

  function productBrandLabel(product) {
    return productBrands(product).join(' + ');
  }

  function speakerCount(product, models) {
    if (product.category !== 'geluid') return 0;
    return product.components.reduce((total, component) => {
      const quantityMatch = component.trim().match(/^(\d+)\s*[x×]\s*/i);
      if (!quantityMatch) return total;
      const componentUpper = component.toUpperCase();
      return models.some(model => componentUpper.includes(model)) ? total + Number(quantityMatch[1]) : total;
    }, 0);
  }

  function syncBudgetFilter(changedInput = null) {
    const minimumChangedByField = changedInput === priceMinField;
    const maximumChangedByField = changedInput === priceMaxField;
    if ((minimumChangedByField || maximumChangedByField) && changedInput.value.trim() === '') return false;
    let minimum = Number(minimumChangedByField ? priceMinField.value : priceMinInput.value);
    let maximum = Number(maximumChangedByField ? priceMaxField.value : priceMaxInput.value);
    minimum = Math.max(0, Math.min(maximumBudget, Math.round(minimum)));
    maximum = Math.max(0, Math.min(maximumBudget, Math.round(maximum)));
    if (minimum > maximum) {
      if (changedInput === priceMinInput || changedInput === priceMinField) {
        maximum = minimum;
      } else {
        minimum = maximum;
      }
    }
    priceMinInput.value = String(minimum);
    priceMaxInput.value = String(maximum);
    priceMinField.value = String(minimum);
    priceMaxField.value = String(maximum);
    activePriceMin = minimum;
    activePriceMax = maximum;
    const start = maximumBudget ? minimum / maximumBudget * 100 : 0;
    const end = maximumBudget ? maximum / maximumBudget * 100 : 100;
    budgetFilter.style.setProperty('--budget-start', `${start}%`);
    budgetFilter.style.setProperty('--budget-end', `${end}%`);
    budgetOutput.textContent = minimum === 0 && maximum === maximumBudget
      ? 'Alle prijzen'
      : `${wholeEuros.format(minimum)} – ${wholeEuros.format(maximum)}`;
    return true;
  }

  function resetBudgetFilter() {
    priceMinInput.value = '0';
    priceMaxInput.value = String(maximumBudget);
    syncBudgetFilter();
  }

  function availableBrands() {
    const products = catalog.products.filter(product => product.category === 'geluid');
    const presentBrands = [...new Set(products.flatMap(productBrands))];
    return [
      ...knownBrands.filter(brand => presentBrands.includes(brand)),
      ...presentBrands.filter(brand => !knownBrands.includes(brand))
    ];
  }

  function scrollToCatalogStart(behavior = 'smooth') {
    requestAnimationFrame(() => {
      const stickyOffset = window.innerWidth > 900 ? catalogToolbar.offsetHeight + 125 : 18;
      const top = grid.getBoundingClientRect().top + window.scrollY - stickyOffset;
      window.scrollTo({ top: Math.max(0, top), behavior });
    });
  }

  function renderProductsAtCatalogStart(behavior = 'auto') {
    renderProducts();
    scrollToCatalogStart(behavior);
  }

  function hidePromotion() {
    promoElement.classList.remove('is-visible');
    clearTimeout(promoTransitionTimer);
    promoTransitionTimer = window.setTimeout(() => {
      if (!promoElement.classList.contains('is-visible')) promoElement.hidden = true;
    }, 320);
  }

  function closePromotion() {
    hidePromotion();
    scheduleNextPromotion();
  }

  function randomPromotionPause() {
    return promoMinimumPause + Math.random() * (promoMaximumPause - promoMinimumPause);
  }

  function scheduleNextPromotion(delay = randomPromotionPause()) {
    clearTimeout(promoRotationTimer);
    promoRotationTimer = window.setTimeout(showRandomPromotion, delay);
  }

  function showRandomPromotion() {
    const choices = promotions.filter(promotion => promotion.id !== lastPromotionId);
    const promotion = choices[Math.floor(Math.random() * choices.length)] || promotions[0];
    activePromotion = promotion;
    lastPromotionId = promotion.id;
    lastPromotionShownAt = Date.now();
    promoImage.src = promotion.image;
    promoImage.alt = promotion.imageAlt;
    promoEyebrow.textContent = promotion.eyebrow;
    promoTitle.textContent = promotion.title;
    promoText.innerHTML = promotion.text;
    promoAction.textContent = promotion.action;
    clearTimeout(promoTransitionTimer);
    promoElement.hidden = false;
    requestAnimationFrame(() => promoElement.classList.add('is-visible'));
    clearTimeout(promoRotationTimer);
    promoRotationTimer = window.setTimeout(() => {
      hidePromotion();
      scheduleNextPromotion();
    }, promoVisibleDuration);
  }

  function openPromotionSelection() {
    if (!activePromotion) return;
    activeCategory = activePromotion.category;
    activeBrand = activePromotion.brand;
    activeSubs = 'all';
    activeTops = 'all';
    subsFilter.value = 'all';
    topsFilter.value = 'all';
    resetBudgetFilter();
    searchInput.value = activePromotion.query;
    document.querySelectorAll('[data-category]').forEach(item => item.classList.toggle('is-active', item.dataset.category === activeCategory));
    renderBrandFilters();
    renderProducts();
    closePromotion();
    scrollToCatalogStart();
  }

  function renderBrandFilters() {
    const brands = availableBrands();
    if (activeBrand !== 'all' && !brands.includes(activeBrand)) activeBrand = 'all';
    const allBrands = `<button class="filter-chip${activeBrand === 'all' ? ' is-active' : ''}" type="button" data-brand="all">Alle merken</button>`;
    brandFilterRow.innerHTML = allBrands + brands.map(brand => `<button class="filter-chip${activeBrand === brand ? ' is-active' : ''}" type="button" data-brand="${brand}">${brand}</button>`).join('');
  }

  function filteredProducts() {
    const query = normalize(searchInput.value.trim());
    const suggestionLimit = activePriceMax < maximumBudget ? activePriceMax * 1.1 : activePriceMax;
    const filtered = catalog.products.filter(product => {
      const categoryMatch = activeCategory === 'all' || productCategories(product).includes(activeCategory);
      const brandMatch = activeBrand === 'all' || productBrands(product).includes(activeBrand);
      const subsMatch = activeSubs === 'all' || speakerCount(product, subwooferModels) === Number(activeSubs);
      const topsMatch = activeTops === 'all' || speakerCount(product, topModels) === Number(activeTops);
      const priceMatch = product.price >= activePriceMin && product.price <= suggestionLimit;
      return categoryMatch && brandMatch && subsMatch && topsMatch && priceMatch && (!query || productSearchText(product).includes(query));
    });
    if (sortSelect.value === 'price-low') filtered.sort((a, b) => a.price - b.price);
    if (sortSelect.value === 'price-high') filtered.sort((a, b) => b.price - a.price);
    return filtered;
  }

  function productCard(product) {
    const isOverBudget = activePriceMax < maximumBudget && product.price > activePriceMax;
    const overBudgetAmount = product.price - activePriceMax;
    const image = product.image ? `<button class="product-card__image" type="button" data-detail="${product.id}" aria-label="Bekijk ${product.name}"><img src="${product.image}" alt="${product.name}" loading="lazy"></button>` : '';
    const badge = product.badge ? `<span class="product-badge">${product.badge}</span>` : '';
    const componentPreview = product.components.slice(0, 3).map(item => `<li>${item}</li>`).join('');
    const budgetNote = isOverBudget ? `<p class="product-card__budget-note"><span aria-hidden="true">+</span> ${wholeEuros.format(overBudgetAmount)} boven budget</p>` : '';
    return `<article class="product-card category-${product.category}${product.image ? ' has-image' : ' no-image'}${product.badge ? ' has-badge' : ''}${isOverBudget ? ' is-over-budget' : ''}" data-card-detail="${product.id}" tabindex="0" aria-label="Bekijk ${product.name}${isOverBudget ? `, ${wholeEuros.format(overBudgetAmount)} boven het ingestelde budget` : ''}">
      ${image}
      <div class="product-card__body">
        <div class="product-card__meta"><span>${categoryLabels[product.category]}</span></div>
        <div class="product-card__title-row"><h3>${product.name}</h3>${badge}</div>
        <ul class="product-card__components">${componentPreview}${product.components.length > 3 ? `<li class="more">+ ${product.components.length - 3} onderdelen</li>` : ''}</ul>
        <div class="product-card__price">${budgetNote}${priceHtml(product.price, product.unit, product.compareAtPrice, false)}</div>
        <div class="product-card__actions"><button class="btn-detail" type="button" data-detail="${product.id}">Bekijk set</button><button class="btn-add" type="button" data-add="${product.id}"><span aria-hidden="true">+</span> Toevoegen</button></div>
      </div>
    </article>`;
  }

  function renderProducts() {
    const products = filteredProducts();
    const overBudgetCount = products.filter(product => activePriceMax < maximumBudget && product.price > activePriceMax).length;
    const withinBudgetCount = products.length - overBudgetCount;
    const countText = overBudgetCount
      ? `${withinBudgetCount} ${withinBudgetCount === 1 ? 'resultaat' : 'resultaten'} binnen budget · ${overBudgetCount} ${overBudgetCount === 1 ? 'optie' : 'opties'} iets erboven`
      : `${products.length} ${products.length === 1 ? 'resultaat' : 'resultaten'}`;
    if (activeCategory !== 'all' && activeCategory !== 'geluid') {
      grid.innerHTML = products.map(productCard).join('');
      resultCount.textContent = countText;
      emptyState.hidden = products.length !== 0;
      return;
    }
    const groups = new Map();
    products.forEach(product => {
      const heading = product.category === 'geluid' ? productBrandLabel(product) : categoryLabels[product.category];
      const groupKey = product.category === 'geluid' ? `brand:${heading}` : `category:${product.category}`;
      if (!groups.has(groupKey)) groups.set(groupKey, {heading, category: product.category, products: []});
      groups.get(groupKey).products.push(product);
    });
    const orderedGroups = [...groups.values()].sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));
    grid.innerHTML = orderedGroups.map(group => `<h3 class="brand-heading">${group.heading}</h3>${group.products.map(productCard).join('')}`).join('');
    resultCount.textContent = countText;
    emptyState.hidden = products.length !== 0;
  }

  function activeBuilderBrand() {
    return builderBrands.find(brand => brand.id === builderBrandId) || null;
  }

  function builderSpeakerCount() {
    return Object.values(builderSelection).reduce((sum, quantity) => sum + quantity, 0);
  }

  function selectedBuilderModels() {
    const brand = activeBuilderBrand();
    if (!brand) return [];
    return brand.models.map(model => ({...model, quantity: builderSelection[model.id] || 0})).filter(model => model.quantity > 0);
  }

  function lAcousticsAmplification(selection) {
    const quantity = id => selection.find(model => model.id === id)?.quantity || 0;
    let la12x = Math.ceil(quantity('cs1') / 2)
      + Math.ceil(quantity('k1') / 2)
      + Math.ceil(quantity('k2') / 2)
      + Math.ceil(quantity('k3') / 4);

    const la4xChannels = quantity('sb18')
      + quantity('ks21')
      + Math.ceil(quantity('x12') / 2) * 2
      + quantity('a15-wide')
      + quantity('a15-focus')
      + Math.ceil(quantity('kara-ii') / 2) * 2
      + quantity('arcs-ii') * 2;
    const canUseSingleLa4x = quantity('ks28') === 0 && la4xChannels > 0 && la4xChannels <= 4;
    let la4x = canUseSingleLa4x ? 1 : 0;

    if (!canUseSingleLa4x) {
      const la12xChannels = Math.ceil(quantity('sb18') / 3)
        + Math.ceil(quantity('ks21') / 2)
        + quantity('ks28')
        + Math.ceil(quantity('x12') / 3) * 2
        + Math.ceil(quantity('a15-wide') / 3)
        + Math.ceil(quantity('a15-focus') / 3)
        + Math.ceil(quantity('kara-ii') / 3) * 2
        + Math.ceil(quantity('arcs-ii') / 3) * 2;
      la12x += Math.ceil(la12xChannels / 4);
    }

    return [
      ...(la12x ? [{name: 'L-Acoustics LA12X', quantity: la12x, image: 'assets/carnaval/producten/la12x.webp'}] : []),
      ...(la4x ? [{name: 'L-Acoustics LA4X', quantity: la4x, image: 'assets/carnaval/producten/la4x.webp'}] : [])
    ];
  }

  function builderAmplification(selection = selectedBuilderModels()) {
    const brand = activeBuilderBrand();
    if (!brand || !selection.length || brand.id === 'aed-audio' || brand.id === 'qsc') return [];
    if (brand.id === 'l-acoustics') return lAcousticsAmplification(selection);
    const quantity = id => selection.find(model => model.id === id)?.quantity || 0;
    return [
      ...(quantity('sl-sub') ? [{name: 'd&b audiotechnik D90', quantity: Math.ceil(quantity('sl-sub') / 2), image: 'assets/carnaval/producten/d90.webp'}] : []),
      ...(quantity('ksl8') ? [{name: 'd&b audiotechnik D40', quantity: Math.ceil(quantity('ksl8') / 4), image: 'assets/carnaval/producten/d40.webp'}] : [])
    ];
  }

  function modelMatchesComponent(model, component) {
    const value = component.toUpperCase();
    const terms = model.aliases || [model.name];
    return terms.some(term => value.includes(term.toUpperCase()));
  }

  function referenceVector(product, brand) {
    const vector = {};
    product.components.forEach(component => {
      const quantityMatch = component.trim().match(/^(\d+)\s*[x×]\s*/i);
      if (!quantityMatch) return;
      const model = brand.models.find(candidate => modelMatchesComponent(candidate, component));
      if (model) vector[model.id] = (vector[model.id] || 0) + Number(quantityMatch[1]);
    });
    return vector;
  }

  function vectorScore(vector, brand) {
    return brand.models.reduce((sum, model) => sum + (vector[model.id] || 0) * model.weight, 0);
  }

  function estimateBuilderRange() {
    const brand = activeBuilderBrand();
    if (!brand || builderSpeakerCount() < 2) return null;
    const target = {...builderSelection};
    const targetScore = vectorScore(target, brand);
    const references = catalog.products
      .filter(product => product.category === 'geluid'
        && productBrands(product).length === 1
        && productBrands(product)[0] === brand.name
        && !product.components.some(component => /SB28/i.test(component)))
      .map(product => {
        const vector = referenceVector(product, brand);
        const score = vectorScore(vector, brand);
        if (!score) return null;
        const difference = brand.models.reduce((sum, model) => sum + Math.abs((target[model.id] || 0) - (vector[model.id] || 0)) * model.weight, 0);
        const distance = difference / Math.max(targetScore, score);
        const adjustedPrice = product.price * Math.pow(targetScore / score, .85);
        return {distance, adjustedPrice};
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
    if (!references.length) return null;
    const weighted = references.reduce((result, reference) => {
      const weight = 1 / Math.max(.12, reference.distance);
      result.total += reference.adjustedPrice * weight;
      result.weight += weight;
      return result;
    }, {total: 0, weight: 0});
    const midpoint = weighted.total / weighted.weight;
    const margin = Math.max(250, midpoint * .15);
    return {
      minimum: Math.max(250, Math.floor((midpoint - margin) / 250) * 250),
      maximum: Math.ceil((midpoint + margin) / 250) * 250
    };
  }

  function builderProductCard(model) {
    const quantity = builderSelection[model.id] || 0;
    return `<article class="builder-product${quantity ? ' is-selected' : ''}">
      <div class="builder-product__image">${quantity ? `<span>${quantity}×</span>` : ''}<img src="${model.image}" alt="${model.fullName}" loading="lazy"></div>
      <div class="builder-product__body"><div><small>${model.type === 'sub' ? 'Subwoofer' : 'Topkast'}</small><strong>${model.name}</strong><em>Per ${model.step} ${model.step === 1 ? 'stuk' : 'stuks'}</em></div>
      <div class="builder-quantity" aria-label="Aantal ${model.fullName}"><button type="button" data-builder-change="-${model.step}" data-builder-model="${model.id}" aria-label="${model.step} verwijderen" ${quantity ? '' : 'disabled'}>−</button><b>${quantity}</b><button type="button" data-builder-change="${model.step}" data-builder-model="${model.id}" aria-label="${model.step} toevoegen">+</button></div></div>
    </article>`;
  }

  function renderBuilder() {
    const brand = activeBuilderBrand();
    const brandButtons = builderBrands.map(item => `<button type="button" class="builder-brand${item.id === builderBrandId ? ' is-active' : ''}" data-builder-brand="${item.id}">${item.name}</button>`).join('');
    if (!brand) {
      builderContent.innerHTML = `<header class="builder-header"><p class="kicker">Geluidsset samenstellen</p><h2 id="builder-dialog-title">Kies een fabrikant</h2><p>Alle luidsprekers binnen één set zijn van dezelfde fabrikant. Versterking voegen we waar nodig automatisch toe.</p></header><div class="builder-body"><div class="builder-brands">${brandButtons}</div><p class="builder-help">Verity Audio en de beperkt beschikbare L-Acoustics SB28 zijn niet opgenomen in de samensteller.</p></div>`;
      return;
    }

    const selected = selectedBuilderModels();
    const amplification = builderAmplification(selected);
    const range = estimateBuilderRange();
    const speakerCards = ['sub', 'top'].map(type => {
      const models = brand.models.filter(model => model.type === type);
      if (!models.length) return '';
      return `<section class="builder-model-group"><div><p class="kicker">${type === 'sub' ? 'Subwoofers' : 'Topkasten & line-array'}</p><h3>${type === 'sub' ? 'Kies het laag' : 'Kies de tops'}</h3></div><div class="builder-products">${models.map(builderProductCard).join('')}</div></section>`;
    }).join('');
    const preview = selected.length ? `<div class="builder-preview-grid">${selected.map(model => `<article><span>${model.quantity}×</span><img src="${model.image}" alt="${model.fullName}"><strong>${model.name}</strong></article>`).join('')}</div>` : '<p class="builder-empty">Voeg minimaal twee luidsprekerkasten toe.</p>';
    const ampSummary = brand.id === 'aed-audio' || brand.id === 'qsc'
      ? '<p class="builder-active-note">Deze luidsprekers zijn actief; losse versterkers zijn niet nodig.</p>'
      : amplification.length
        ? `<div class="builder-amps"><p class="kicker">Automatisch ingepland</p>${amplification.map(amp => `<div><img src="${amp.image}" alt=""><strong>${amp.quantity}× ${amp.name}</strong></div>`).join('')}</div>`
        : '';
    const estimate = range
      ? `<div class="builder-estimate"><span>Geschatte prijsrange</span><strong>${wholeEuros.format(range.minimum)} – ${wholeEuros.format(range.maximum)}</strong><p>Dit is een globale indicatie op basis van vergelijkbare sets. De definitieve prijs is op aanvraag en hangt onder andere af van beschikbaarheid en de uiteindelijke uitvoering.</p></div>`
      : '<div class="builder-estimate is-empty"><strong>Nog geen prijsindicatie</strong><p>Kies minimaal twee luidsprekerkasten.</p></div>';

    builderContent.innerHTML = `<header class="builder-header"><p class="kicker">Geluidsset samenstellen</p><h2 id="builder-dialog-title">Jullie ${brand.name}-set</h2><p>Kies de gewenste luidsprekers. De aantallen lopen automatisch in de juiste stappen.</p></header>
      <div class="builder-body"><div class="builder-brands">${brandButtons}</div>${speakerCards}
      <section class="builder-summary"><div><p class="kicker">Jullie samenstelling</p><h3>Overzicht</h3>${preview}${ampSummary}</div><div>${estimate}<button class="btn builder-submit" type="button" data-builder-submit ${builderSpeakerCount() < 2 ? 'disabled' : ''}>Prijs opvragen en toevoegen</button><small>De set wordt als ‘prijs op aanvraag’ aan jullie reservering toegevoegd.</small></div></section></div>`;
  }

  function openBuilder() {
    builderBrandId = null;
    builderSelection = {};
    renderBuilder();
    builderDialog.showModal();
  }

  function addCustomBuilderSet() {
    const brand = activeBuilderBrand();
    const selection = selectedBuilderModels();
    if (!brand || builderSpeakerCount() < 2) return;
    const amplification = builderAmplification(selection);
    const range = estimateBuilderRange();
    const product = {
      id: `custom-geluid-${Date.now()}`,
      category: 'geluid',
      subgroup: brand.name,
      name: `Zelf samengestelde ${brand.name}-geluidsset`,
      price: null,
      priceOnRequest: true,
      estimatedRange: range,
      components: [
        ...selection.map(model => `${model.quantity}× ${model.fullName}`),
        ...amplification.map(amp => `${amp.quantity}× ${amp.name}`),
        'Mixer',
        'Alle benodigde bekabeling',
        'Plaatsing, aansluiten en afstellen',
        'Gratis 24-uurs storingsdienst'
      ]
    };
    customProducts.push(product);
    byId.set(product.id, product);
    saveCustomProducts();
    cart[product.id] = 1;
    saveCart();
    renderCart();
    celebrateCart();
    builderDialog.close();
  }

  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    celebrateCart();
    const button = document.querySelector(`[data-add="${id}"]`);
    if (button) {
      const oldHtml = button.innerHTML;
      button.textContent = 'Toegevoegd ✓';
      button.classList.add('is-added');
      window.setTimeout(() => { button.innerHTML = oldHtml; button.classList.remove('is-added'); }, 1100);
    }
  }

  function updateQuantity(id, change) {
    const next = (cart[id] || 0) + change;
    if (next <= 0) {
      delete cart[id];
      if (id.startsWith('custom-geluid-')) {
        customProducts = customProducts.filter(product => product.id !== id);
        byId.delete(id);
        saveCustomProducts();
      }
    } else cart[id] = next;
    saveCart();
    renderCart();
    celebrateCart();
  }

  function cartEntries() {
    return Object.entries(cart).map(([id, quantity]) => ({product: byId.get(id), quantity})).filter(entry => entry.product);
  }

  function totals() {
    const entries = cartEntries();
    const hasPriceOnRequest = entries.some(({product}) => product.priceOnRequest);
    const incl = entries.reduce((sum, {product, quantity}) => sum + (Number(product.price) || 0) * quantity, 0);
    return {incl, excl: priceExVat(incl), hasPriceOnRequest};
  }

  function renderCart() {
    const entries = cartEntries();
    const itemCount = entries.reduce((sum, entry) => sum + entry.quantity, 0);
    document.querySelectorAll('[data-cart-count]').forEach(element => { element.textContent = itemCount; });
    document.querySelectorAll('[data-mobile-cart-count]').forEach(element => { element.textContent = itemCount; });
    document.querySelector('[data-cart-empty]').hidden = entries.length > 0;
    const lines = document.querySelector('[data-cart-lines]');
    lines.innerHTML = entries.map(({product, quantity}) => `<div class="cart-line${product.priceOnRequest ? ' is-custom' : ''}" data-cart-detail="${product.id}" tabindex="0" role="button" aria-label="Bekijk ${product.name}">
      <div><strong>${product.name}</strong><span>${product.priceOnRequest ? 'Prijs op aanvraag' : `${money.format(product.price)} incl. btw${product.unit ? ` ${product.unit}` : ''}`}</span></div>
      <div class="quantity" aria-label="Aantal voor ${product.name}"><button type="button" data-quantity="-1" data-id="${product.id}" aria-label="Eén verwijderen">−</button><span>${quantity}</span><button type="button" data-quantity="1" data-id="${product.id}" aria-label="Eén toevoegen">+</button></div>
      <strong class="cart-line__total">${product.priceOnRequest ? 'Op aanvraag' : money.format(product.price * quantity)}</strong>
    </div>`).join('');
    const cartTotals = document.querySelector('[data-cart-totals]');
    cartTotals.hidden = entries.length === 0;
    const total = totals();
    document.querySelector('[data-total-incl]').textContent = total.hasPriceOnRequest ? 'Prijs op aanvraag' : money.format(total.incl);
    document.querySelector('[data-total-excl]').textContent = total.hasPriceOnRequest ? 'Na controle berekend' : money.format(total.excl);
    document.querySelector('[data-open-request]').disabled = entries.length === 0;
    document.querySelector('[data-scroll-cart]').classList.toggle('has-items', itemCount > 0);
  }

  function relatedProductImages(product) {
    if (product.category === 'truss') return [];
    const matches = [];
    for (const component of product.components) {
      const componentUpper = component.toUpperCase();
      const found = catalog.productImages.find(item => componentUpper.includes(item.match.toUpperCase()));
      if (!found) continue;
      const quantityMatch = component.trim().match(/^(\d+)\s*[x×]\s*/i);
      const quantity = quantityMatch ? Number(quantityMatch[1]) : 1;
      const existing = matches.find(item => item.match === found.match);
      if (existing) existing.quantity += quantity;
      else matches.push({...found, quantity});
    }
    return matches;
  }

  function openProduct(id) {
    const product = byId.get(id);
    if (!product) return;
    activeProductId = id;
    const productImages = relatedProductImages(product);
    const mainImage = product.image ? `<figure class="dialog-main-image"><img src="${product.image}" alt="${product.name}"><figcaption>Setfoto</figcaption></figure>` : '';
    const componentGallery = productImages.length ? `<section class="component-gallery"><h3>Producten in deze set</h3><div class="component-gallery__grid">${productImages.map(item => `<article class="${item.image ? '' : 'no-image'}">${item.image ? `<span class="component-quantity" aria-hidden="true">${item.quantity}×</span><img src="${item.image}" alt="${item.name}" loading="lazy">` : ''}<div><strong>${item.name}</strong>${item.spec ? `<span>${item.spec}</span>` : ''}${item.description ? `<p>${item.description}</p>` : ''}</div></article>`).join('')}</div></section>` : '';
    const serviceItems = `${product.category === 'geluid' ? '<li class="service-item">Plaatsing, aansluiten en afstellen</li>' : ''}${product.category !== 'truss' && product.category !== 'consumables' ? '<li class="service-item">Gratis 24-uurs storingsdienst</li>' : ''}`;
    const compositionHeading = product.category === 'truss' ? 'Specificaties' : 'Deze set bestaat uit';
    const noteLabel = product.id.startsWith('consumable-confetti-') ? 'Meer opties:' : 'Let op:';
    productDialogContent.innerHTML = `<div class="product-dialog__header category-${product.category}"><p>${categoryLabels[product.category]} · ${product.subgroup}</p><h2 id="product-dialog-title">${product.name}</h2>${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}<div class="dialog-price">${priceHtml(product.price, product.unit, product.compareAtPrice, product.category !== 'consumables')}</div></div>
      ${mainImage}
      <div class="dialog-composition"><h3>${compositionHeading}</h3><ul>${product.components.map(item => `<li>${item}</li>`).join('')}${serviceItems}</ul>${product.note ? `<p class="dialog-note"><strong>${noteLabel}</strong> ${product.note}</p>` : ''}</div>
      ${componentGallery}
      <div class="dialog-footer"><p>Beschikbaarheid wordt na je aanvraag gecontroleerd.</p><button class="btn" type="button" data-dialog-add="${product.id}">Voeg toe aan selectie</button></div>`;
    productDialog.showModal();
  }

  function requestSummaryHtml() {
    const total = totals();
    return `<strong>Geselecteerd</strong><p class="request-summary__period">Verhuurperiode: zaterdag 6 t/m dinsdag 9 februari 2027</p><ul>${cartEntries().map(({product, quantity}) => `<li><span>${quantity}× ${product.name}</span><span>${product.priceOnRequest ? 'Prijs op aanvraag' : money.format(product.price * quantity)}</span></li>`).join('')}</ul><div><span>Totaal gehele periode</span><strong>${total.hasPriceOnRequest ? 'Prijs op aanvraag' : money.format(total.incl)}</strong></div><small>${total.hasPriceOnRequest ? 'We bepalen de definitieve prijs van de custom set na controle van de samenstelling en beschikbaarheid.' : `${money.format(total.excl)} excl. btw`}</small>`;
  }

  function syncDeliveryAddressState() {
    const isUnknown = deliveryUnknown.checked;
    deliveryAddress.classList.toggle('is-disabled', isUnknown);
    deliveryAddress.querySelectorAll('[data-delivery-required]').forEach(input => {
      input.disabled = isUnknown;
      input.required = !isUnknown;
    });
    const help = deliveryAddress.querySelector('[data-delivery-help]');
    const lookup = deliveryAddress.querySelector('[data-address-lookup]');
    help.textContent = isUnknown
      ? 'Geen probleem. We vragen het afleveradres later bij jullie op.'
      : 'Vul het adres in waar de carnavalswagen tijdens levering staat.';
    lookup.hidden = isUnknown;
  }

  const addressLookupTimers = new WeakMap();
  const addressLookupControllers = new WeakMap();

  function compactPostcode(value) {
    return value.toUpperCase().replace(/\s+/g, '');
  }

  function formatPostcode(value) {
    const postcode = compactPostcode(value);
    return postcode.length === 6 ? `${postcode.slice(0, 4)} ${postcode.slice(4)}` : value;
  }

  async function lookupPdokAddress(block) {
    const prefix = block.dataset.addressPrefix;
    const postcodeInput = block.querySelector(`[name="${prefix}_postcode"]`);
    const numberInput = block.querySelector(`[name="${prefix}_huisnummer"]`);
    const additionInput = block.querySelector(`[name="${prefix}_toevoeging"]`);
    const streetInput = block.querySelector(`[name="${prefix}_straat"]`);
    const cityInput = block.querySelector(`[name="${prefix}_plaats"]`);
    const countryInput = block.querySelector(`[name="${prefix}_land"]`);
    const status = block.querySelector('[data-address-lookup]');
    const postcode = compactPostcode(postcodeInput.value);
    const houseNumber = Number.parseInt(numberInput.value, 10);
    if (!/^\d{4}[A-Z]{2}$/.test(postcode) || !Number.isInteger(houseNumber)) {
      status.className = 'address-lookup';
      status.textContent = 'Gratis adresaanvulling via PDOK: vul een geldige postcode en huisnummer in.';
      return;
    }
    const country = countryInput.value.trim().toLowerCase();
    if (country && country !== 'nederland' && country !== 'netherlands' && country !== 'nl') {
      status.className = 'address-lookup';
      status.textContent = 'Automatisch aanvullen is alleen beschikbaar voor Nederlandse adressen.';
      return;
    }
    addressLookupControllers.get(block)?.abort();
    const controller = new AbortController();
    addressLookupControllers.set(block, controller);
    status.className = 'address-lookup is-loading';
    status.textContent = 'Adres opzoeken via PDOK…';
    try {
      const query = encodeURIComponent(`${postcode} AND ${houseNumber}`);
      const response = await fetch(`https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${query}&rows=10&fq=type%3Aadres`, {signal: controller.signal});
      if (!response.ok) throw new Error('PDOK gaf geen geldig antwoord');
      const result = await response.json();
      const exactMatches = (result.response?.docs || []).filter(item => compactPostcode(item.postcode || '') === postcode && Number(item.huisnummer) === houseNumber);
      if (!exactMatches.length) {
        status.className = 'address-lookup is-error';
        status.textContent = 'Adres niet gevonden. Controleer de postcode en het huisnummer of vul het adres handmatig in.';
        return;
      }
      const enteredAddition = additionInput.value.trim().toLowerCase().replace(/^-$/, '');
      const selected = exactMatches.find(item => `${item.huisletter || ''}${item.huisnummertoevoeging || ''}`.toLowerCase() === enteredAddition) || exactMatches[0];
      streetInput.value = selected.straatnaam || streetInput.value;
      postcodeInput.value = formatPostcode(selected.postcode || postcode);
      cityInput.value = selected.woonplaatsnaam || cityInput.value;
      countryInput.value = 'Nederland';
      const additions = [...new Set(exactMatches.map(item => `${item.huisletter || ''}${item.huisnummertoevoeging || ''}`.trim()).filter(Boolean))];
      if (!additionInput.value.trim() && additions.length === 1) additionInput.value = additions[0];
      if (!additionInput.value.trim() && additions.length === 0) additionInput.value = '-';
      status.className = 'address-lookup is-success';
      status.textContent = additions.length > 1 && !enteredAddition
        ? 'Straat en plaats gevonden. Controleer welke toevoeging bij het adres hoort.'
        : 'Adres gevonden en aangevuld via PDOK.';
    } catch (error) {
      if (error.name === 'AbortError') return;
      status.className = 'address-lookup is-error';
      status.textContent = 'Automatisch aanvullen is tijdelijk niet beschikbaar. Je kunt het adres handmatig invullen.';
    }
  }

  function scheduleAddressLookup(block) {
    window.clearTimeout(addressLookupTimers.get(block));
    addressLookupTimers.set(block, window.setTimeout(() => lookupPdokAddress(block), 450));
  }

  function openRequest() {
    if (!cartEntries().length) return;
    const selection = encodeURIComponent(JSON.stringify({cart, customProducts}));
    window.location.assign(`/reservering-overzicht#selectie=${selection}`);
  }

  function appendRequestDetails(formData) {
    const total = totals();
    const selection = cartEntries().map(({product, quantity}) => {
      const price = product.priceOnRequest ? 'prijs op aanvraag' : `${money.format(product.price * quantity)} incl. btw${product.unit ? ` (${product.unit})` : ''}`;
      const details = product.priceOnRequest ? `\n  ${product.components.join('\n  ')}` : '';
      const indication = product.priceOnRequest && product.estimatedRange ? `\n  Getoonde indicatie: ${wholeEuros.format(product.estimatedRange.minimum)} – ${wholeEuros.format(product.estimatedRange.maximum)}` : '';
      return `${quantity}× ${product.name} — ${price}${details}${indication}`;
    }).join('\n\n');
    formData.set('_subject', `Carnavalsaanvraag 2027 — ${formData.get('carnavalsgroep')}`);
    formData.set('selectie', selection);
    formData.set('totaal_inclusief_21_procent_btw', total.hasPriceOnRequest ? 'Prijs op aanvraag' : money.format(total.incl));
    formData.set('totaal_exclusief_btw', total.hasPriceOnRequest ? 'Wordt na controle berekend' : money.format(total.excl));
    formData.set('huurperiode', 'Zaterdag 6 t/m dinsdag 9 februari 2027; alle verhuurprijzen gelden voor deze volledige vierdaagse periode.');
    formData.set('transport', 'Wordt na de aanvraag berekend; binnen 35 km van Meerssen gratis.');
    return formData;
  }

  async function formspreeErrorMessage(response) {
    if (response.status === 429) return 'Er zijn kort na elkaar te veel aanvragen verstuurd. Wacht even en probeer het opnieuw.';
    try {
      const result = await response.json();
      if (Array.isArray(result.errors) && result.errors.length) return result.errors.map(error => error.message).join(' ');
    } catch (error) { /* Formspree gaf geen leesbare JSON terug */ }
    return 'De aanvraag kon niet worden verstuurd. Probeer het opnieuw of mail ons rechtstreeks.';
  }

  document.querySelector('[data-filter-row]').addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    activeBrand = 'all';
    activeSubs = 'all';
    activeTops = 'all';
    subsFilter.value = 'all';
    topsFilter.value = 'all';
    document.querySelectorAll('[data-category]').forEach(item => item.classList.toggle('is-active', item === button));
    renderBrandFilters();
    renderProductsAtCatalogStart('smooth');
  });
  brandFilterRow.addEventListener('click', event => {
    const button = event.target.closest('[data-brand]');
    if (!button) return;
    activeBrand = button.dataset.brand;
    if (activeBrand !== 'all') {
      activeCategory = 'geluid';
      document.querySelectorAll('[data-category]').forEach(item => item.classList.toggle('is-active', item.dataset.category === 'geluid'));
    }
    brandFilterRow.querySelectorAll('[data-brand]').forEach(item => item.classList.toggle('is-active', item === button));
    renderProductsAtCatalogStart('smooth');
  });
  searchInput.addEventListener('input', () => renderProductsAtCatalogStart());
  sortSelect.addEventListener('change', () => renderProductsAtCatalogStart('smooth'));
  [subsFilter, topsFilter].forEach(filter => filter.addEventListener('change', () => {
    activeSubs = subsFilter.value;
    activeTops = topsFilter.value;
    if (activeSubs !== 'all' || activeTops !== 'all') {
      activeCategory = 'geluid';
      document.querySelectorAll('[data-category]').forEach(item => item.classList.toggle('is-active', item.dataset.category === 'geluid'));
    }
    renderProductsAtCatalogStart('smooth');
  }));
  [priceMinInput, priceMaxInput].forEach(input => input.addEventListener('input', () => {
    if (!syncBudgetFilter(input)) return;
    renderProductsAtCatalogStart();
  }));
  [priceMinField, priceMaxField].forEach(input => input.addEventListener('input', () => {
    if (!syncBudgetFilter(input)) return;
    renderProductsAtCatalogStart();
  }));
  document.addEventListener('click', event => {
    const control = event.target.closest('button,a.btn,a.catalog-link');
    if (!control || control.disabled || control.closest('.catalog-toolbar,.catalog-promo')) return;
    replayAnimation(control, 'is-goofy-click', 620);
    createClickBurst(event, control);
  });
  grid.addEventListener('click', event => {
    const add = event.target.closest('[data-add]');
    if (add) { addToCart(add.dataset.add); return; }
    const detail = event.target.closest('[data-detail]');
    if (detail) { openProduct(detail.dataset.detail); return; }
    const card = event.target.closest('[data-card-detail]');
    if (card) openProduct(card.dataset.cardDetail);
  });
  grid.addEventListener('keydown', event => {
    if ((event.key !== 'Enter' && event.key !== ' ') || event.target !== event.target.closest('[data-card-detail]')) return;
    event.preventDefault();
    openProduct(event.target.dataset.cardDetail);
  });
  document.querySelector('[data-cart-lines]').addEventListener('click', event => {
    const button = event.target.closest('[data-quantity]');
    if (button) { updateQuantity(button.dataset.id, Number(button.dataset.quantity)); return; }
    const line = event.target.closest('[data-cart-detail]');
    if (line) openProduct(line.dataset.cartDetail);
  });
  document.querySelector('[data-cart-lines]').addEventListener('keydown', event => {
    if ((event.key !== 'Enter' && event.key !== ' ') || event.target.closest('[data-quantity]')) return;
    const line = event.target.closest('[data-cart-detail]');
    if (!line) return;
    event.preventDefault();
    openProduct(line.dataset.cartDetail);
  });
  document.querySelector('[data-open-request]').addEventListener('click', openRequest);
  deliveryUnknown.addEventListener('change', syncDeliveryAddressState);
  requestForm.querySelectorAll('[data-address-block]').forEach(block => {
    const prefix = block.dataset.addressPrefix;
    [`${prefix}_postcode`, `${prefix}_huisnummer`, `${prefix}_toevoeging`].forEach(name => {
      block.querySelector(`[name="${name}"]`).addEventListener('input', () => scheduleAddressLookup(block));
    });
  });
  document.querySelector('[data-open-builder]').addEventListener('click', openBuilder);
  document.querySelector('[data-close-product]').addEventListener('click', () => productDialog.close());
  document.querySelector('[data-close-builder]').addEventListener('click', () => builderDialog.close());
  document.querySelector('[data-close-request]').addEventListener('click', () => requestDialog.close());
  document.querySelector('[data-close-success]').addEventListener('click', () => requestDialog.close());
  document.querySelector('[data-close-promo]').addEventListener('click', closePromotion);
  promoAction.addEventListener('click', openPromotionSelection);
  function syncCartPlacement() {
    const mobile = window.innerWidth <= 900;
    if (mobile && cartPanel.parentElement !== mobileCartHost) mobileCartHost.append(cartPanel);
    if (!mobile && cartPanel.parentElement === mobileCartHost) {
      cartPositionMarker.parentNode.insertBefore(cartPanel, cartPositionMarker.nextSibling);
      if (mobileCartDialog.open) mobileCartDialog.close();
    }
  }
  syncCartPlacement();
  window.addEventListener('resize', syncCartPlacement);
  document.querySelector('[data-scroll-cart]').addEventListener('click', () => {
    syncCartPlacement();
    if (!mobileCartDialog.open) mobileCartDialog.showModal();
  });
  document.querySelector('[data-close-mobile-cart]').addEventListener('click', () => mobileCartDialog.close());
  mobileCartDialog.addEventListener('click', event => { if (event.target === mobileCartDialog) mobileCartDialog.close(); });
  backToTop.addEventListener('click', () => {
    const navigation = document.querySelector('.nav');
    const offset = (navigation?.offsetHeight || 0) + 12;
    const top = catalogToolbar.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({top: Math.max(0, top), behavior: 'smooth'});
  });
  let backToTopTicking = false;
  let backToTopHideTimer = null;
  let previousScrollY = window.scrollY;
  function syncBackToTop() {
    const currentScrollY = window.scrollY;
    const isScrollingUp = currentScrollY < previousScrollY - 4;
    const isScrollingDown = currentScrollY > previousScrollY + 4;
    const isFarEnoughDown = currentScrollY > Math.max(700, window.innerHeight * .8);
    if (isFarEnoughDown && isScrollingUp) {
      backToTop.classList.add('is-visible');
      window.clearTimeout(backToTopHideTimer);
      backToTopHideTimer = window.setTimeout(() => backToTop.classList.remove('is-visible'), 6000);
    } else if (!isFarEnoughDown || isScrollingDown) {
      window.clearTimeout(backToTopHideTimer);
      backToTop.classList.remove('is-visible');
    }
    previousScrollY = currentScrollY;
    backToTopTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (backToTopTicking) return;
    backToTopTicking = true;
    window.requestAnimationFrame(syncBackToTop);
  }, {passive: true});
  window.addEventListener('resize', syncBackToTop, {passive: true});
  productDialog.addEventListener('click', event => { if (event.target === productDialog) productDialog.close(); });
  builderDialog.addEventListener('click', event => { if (event.target === builderDialog) builderDialog.close(); });
  requestDialog.addEventListener('click', event => { if (event.target === requestDialog) requestDialog.close(); });
  builderDialog.addEventListener('click', event => {
    const brandButton = event.target.closest('[data-builder-brand]');
    if (brandButton) {
      if (brandButton.dataset.builderBrand !== builderBrandId && builderSpeakerCount() > 0 && !window.confirm('Bij een ander merk wordt de huidige samenstelling gewist. Doorgaan?')) return;
      builderBrandId = brandButton.dataset.builderBrand;
      builderSelection = {};
      renderBuilder();
      return;
    }
    const quantityButton = event.target.closest('[data-builder-change]');
    if (quantityButton) {
      const modelId = quantityButton.dataset.builderModel;
      const next = Math.max(0, (builderSelection[modelId] || 0) + Number(quantityButton.dataset.builderChange));
      if (next) builderSelection[modelId] = next; else delete builderSelection[modelId];
      renderBuilder();
      return;
    }
    if (event.target.closest('[data-builder-submit]')) addCustomBuilderSet();
  });
  productDialog.addEventListener('click', event => {
    const button = event.target.closest('[data-dialog-add]');
    if (button) { addToCart(button.dataset.dialogAdd); productDialog.close(); }
  });
  productDialog.addEventListener('close', () => {
    activeProductId = null;
    const longEnoughAgo = Date.now() - lastPromotionShownAt > 90000;
    if (longEnoughAgo && Math.random() < .25) {
      clearTimeout(promoRotationTimer);
      promoRotationTimer = window.setTimeout(showRandomPromotion, 900 + Math.random() * 1200);
    }
  });
  requestForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!requestForm.reportValidity()) return;
    requestFeedback.hidden = true;
    requestFeedback.textContent = '';
    requestSubmit.disabled = true;
    requestSubmit.textContent = 'Aanvraag versturen…';
    try {
      const response = await fetch(requestForm.action, {
        method: 'POST',
        body: appendRequestDetails(new FormData(requestForm)),
        headers: {Accept: 'application/json'}
      });
      if (!response.ok) throw new Error(await formspreeErrorMessage(response));
      cart = {};
      customProducts = [];
      [...byId.keys()].filter(id => id.startsWith('custom-geluid-')).forEach(id => byId.delete(id));
      saveCart();
      saveCustomProducts();
      renderCart();
      requestForm.reset();
      syncDeliveryAddressState();
      requestForm.hidden = true;
      requestSuccess.hidden = false;
    } catch (error) {
      requestFeedback.textContent = error instanceof Error && error.message !== 'Failed to fetch'
        ? error.message
        : 'De aanvraag kon niet worden verstuurd. Controleer je internetverbinding of mail ons rechtstreeks.';
      requestFeedback.hidden = false;
    } finally {
      requestSubmit.disabled = false;
      requestSubmit.textContent = 'Aanvraag versturen';
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && activeProductId) activeProductId = null;
  });

  function showSubmittedConfirmation() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('aanvraag') !== 'verzonden') return;
    const message = document.createElement('aside');
    message.className = 'submission-confirmation';
    message.setAttribute('role', 'status');
    message.innerHTML = '<span aria-hidden="true">✓</span><div><strong>Aanvraag verzonden</strong><p>Bedankt! We controleren de beschikbaarheid en nemen contact met jullie op.</p></div>';
    document.body.appendChild(message);
    window.history.replaceState({}, '', `${window.location.pathname}#catalogus`);
    window.setTimeout(() => message.classList.add('is-visible'), 50);
    window.setTimeout(() => { message.classList.remove('is-visible'); window.setTimeout(() => message.remove(), 320); }, 7000);
  }

  renderBrandFilters();
  syncDeliveryAddressState();
  syncBudgetFilter();
  renderProducts();
  renderCart();
  syncBackToTop();
  showSubmittedConfirmation();
  scheduleNextPromotion(12000 + Math.random() * 18000);
})();
