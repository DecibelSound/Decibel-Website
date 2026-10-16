(() => {
  const catalog = window.CARNAVAL_CATALOG;
  const page = document.body.dataset.reservationPage;
  if (!catalog || !page) return;

  const storageKey = 'decibel-carnaval-selectie-v8';
  const customStorageKey = 'decibel-carnaval-custom-sets-v1';
  const money = new Intl.NumberFormat('nl-NL', {style: 'currency', currency: 'EUR'});
  const categoryLabels = {geluid: 'Geluid', dj: 'DJ-gear', licht: 'Licht', sfx: 'Special FX', truss: 'Truss', overig: 'Extra’s/overig', consumables: 'Consumables'};

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (error) { return fallback; }
  }

  let transferred = null;
  const transferredRaw = new URLSearchParams(window.location.hash.slice(1)).get('selectie');
  if (transferredRaw) {
    try { transferred = JSON.parse(transferredRaw); } catch (error) { transferred = null; }
  }
  let customProducts = transferred && Array.isArray(transferred.customProducts) ? transferred.customProducts : readJson(customStorageKey, []);
  let cart = transferred && transferred.cart && typeof transferred.cart === 'object' ? transferred.cart : readJson(storageKey, {});
  const byId = new Map([...catalog.products, ...customProducts].map(product => [product.id, product]));

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[character]));
  }

  function entries() {
    return Object.entries(cart)
      .map(([id, quantity]) => ({product: byId.get(id), quantity: Number(quantity)}))
      .filter(entry => entry.product && Number.isInteger(entry.quantity) && entry.quantity > 0);
  }

  function totals() {
    const selected = entries();
    const hasPriceOnRequest = selected.some(({product}) => product.priceOnRequest);
    const incl = selected.reduce((sum, {product, quantity}) => sum + (Number(product.price) || 0) * quantity, 0);
    return {incl, excl: incl / (1 + catalog.vatRate), hasPriceOnRequest};
  }

  function persist() {
    localStorage.setItem(storageKey, JSON.stringify(cart));
    localStorage.setItem(customStorageKey, JSON.stringify(customProducts));
  }

  function selectionPayload() {
    return encodeURIComponent(JSON.stringify({cart, customProducts}));
  }

  function syncNavigationLinks() {
    document.querySelectorAll('[data-return-catalog]').forEach(link => { link.href = `carnaval.html?selectie=${selectionPayload()}#catalogus`; });
    document.querySelectorAll('[data-return-overview]').forEach(link => { link.href = `reservering-overzicht.html#selectie=${selectionPayload()}`; });
  }

  function changeQuantity(id, change) {
    const next = (Number(cart[id]) || 0) + change;
    if (next <= 0) {
      delete cart[id];
      if (id.startsWith('custom-geluid-')) {
        customProducts = customProducts.filter(product => product.id !== id);
        byId.delete(id);
      }
    } else cart[id] = next;
    persist();
  }

  function relatedProductImages(product) {
    const matches = [];
    for (const component of product.components || []) {
      const componentUpper = component.toUpperCase();
      const found = catalog.productImages.find(item => componentUpper.includes(item.match.toUpperCase()));
      if (!found || !found.image) continue;
      const quantityMatch = component.trim().match(/^(\d+)\s*[x×]\s*/i);
      const quantity = quantityMatch ? Number(quantityMatch[1]) : 1;
      const existing = matches.find(item => item.match === found.match);
      if (existing) existing.quantity += quantity;
      else matches.push({...found, quantity});
    }
    return matches;
  }

  function componentThumbnails(product) {
    const images = relatedProductImages(product);
    if (!images.length) return '';
    return `<div class="reservation-item__thumbs" aria-label="Producten in ${escapeHtml(product.name)}">${images.map(item => `<span title="${escapeHtml(item.name)}"><img src="${escapeHtml(item.image)}" alt=""><b>${item.quantity}×</b></span>`).join('')}</div>`;
  }

  function overviewItem({product, quantity}) {
    const components = product.components.slice(0, 5).map(item => `<li>${escapeHtml(item)}</li>`).join('');
    const image = product.image
      ? `<img class="reservation-item__image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">`
      : '<div class="reservation-item__image" aria-hidden="true"></div>';
    const unitPrice = product.priceOnRequest ? 'Prijs op aanvraag' : money.format(product.price);
    const linePrice = product.priceOnRequest ? 'Op aanvraag' : money.format(product.price * quantity);
    return `<article class="reservation-item" data-reservation-item="${escapeHtml(product.id)}" tabindex="0" role="button" aria-label="Bekijk details van ${escapeHtml(product.name)}">
      ${image}
      <div class="reservation-item__body"><span class="reservation-item__meta">${escapeHtml(categoryLabels[product.category] || product.category)}</span><h2>${escapeHtml(product.name)}</h2><ul class="reservation-item__components">${components}</ul>${componentThumbnails(product)}${product.note ? `<p class="reservation-item__note">${escapeHtml(product.note)}</p>` : ''}</div>
      <div class="reservation-item__side"><div class="reservation-item__price">${linePrice}<small>${unitPrice}${product.unit ? ` ${escapeHtml(product.unit)}` : ''}</small></div><div class="reservation-item__controls"><div class="reservation-quantity" aria-label="Aantal voor ${escapeHtml(product.name)}"><button type="button" data-reservation-change="-1" data-id="${escapeHtml(product.id)}" aria-label="Eén minder">−</button><strong>${quantity}</strong><button type="button" data-reservation-change="1" data-id="${escapeHtml(product.id)}" aria-label="Eén meer">+</button></div><button class="reservation-remove" type="button" data-reservation-change="-${quantity}" data-id="${escapeHtml(product.id)}">Verwijderen</button></div></div>
    </article>`;
  }

  function renderCategorySummary(selected) {
    const summary = document.querySelector('[data-reservation-category-summary]');
    if (!summary) return;
    const counts = new Map();
    selected.forEach(({product, quantity}) => counts.set(product.category, (counts.get(product.category) || 0) + quantity));
    summary.innerHTML = counts.size
      ? [...counts].map(([category, quantity]) => `<div><span>${escapeHtml(categoryLabels[category] || category)}</span><strong>${quantity}×</strong></div>`).join('')
      : '<p>Nog geen producten geselecteerd.</p>';
  }

  function openOverviewProduct(product) {
    const dialog = document.querySelector('[data-reservation-product-dialog]');
    const content = document.querySelector('[data-reservation-product-content]');
    if (!dialog || !content || !product) return;
    const images = relatedProductImages(product);
    const mainImage = product.image ? `<figure class="dialog-main-image"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"></figure>` : '';
    const gallery = images.length ? `<section class="component-gallery"><h3>Producten in deze set</h3><div class="component-gallery__grid">${images.map(item => `<article><span class="component-quantity" aria-hidden="true">${item.quantity}×</span><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}"><div><strong>${escapeHtml(item.name)}</strong>${item.spec ? `<span>${escapeHtml(item.spec)}</span>` : ''}${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}</div></article>`).join('')}</div></section>` : '';
    const linePrice = product.priceOnRequest ? 'Prijs op aanvraag' : money.format(product.price);
    const oldPrice = product.compareAtPrice ? `<div class="price-compare"><s>${money.format(product.compareAtPrice)}</s><span>Aanbieding</span></div>` : '';
    const noteLabel = product.id.startsWith('consumable-confetti-') ? 'Meer opties:' : 'Let op:';
    const serviceItems = `${product.category === 'geluid' ? '<li class="service-item">Plaatsing, aansluiten en afstellen</li>' : ''}${product.category !== 'truss' && product.category !== 'consumables' ? '<li class="service-item">Gratis 24-uurs storingsdienst</li>' : ''}`;
    content.innerHTML = `<div class="product-dialog__header category-${escapeHtml(product.category)}"><p>${escapeHtml(categoryLabels[product.category] || product.category)} · ${escapeHtml(product.subgroup)}</p><h2 id="reservation-product-dialog-title">${escapeHtml(product.name)}</h2>${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ''}<div class="dialog-price">${oldPrice}<div class="price-main"><strong>${linePrice}</strong>${product.unit ? `<span>${escapeHtml(product.unit)}</span>` : ''}</div>${product.priceOnRequest ? '' : `<div class="price-vat">${money.format(product.price / (1 + catalog.vatRate))} excl. btw</div>`}${product.category !== 'consumables' ? '<div class="price-period">Prijs voor 4 dagen carnaval</div>' : ''}</div></div>${mainImage}<div class="dialog-composition"><h3>${product.category === 'truss' ? 'Specificaties' : 'Deze set bestaat uit'}</h3><ul>${product.components.map(item => `<li>${escapeHtml(item)}</li>`).join('')}${serviceItems}</ul>${product.note ? `<p class="dialog-note"><strong>${noteLabel}</strong> ${escapeHtml(product.note)}</p>` : ''}</div>${gallery}<div class="dialog-footer"><p>Dit product staat al in jullie winkelwagen.</p><button class="btn" type="button" data-reservation-product-close>Terug naar winkelwagen</button></div>`;
    dialog.showModal();
  }

  function renderOverview() {
    const selected = entries();
    const container = document.querySelector('[data-reservation-items]');
    const total = totals();
    container.innerHTML = selected.length
      ? selected.map(overviewItem).join('')
      : '<div class="reservation-empty"><h2>Jullie selectie is leeg</h2><p>Ga terug naar de catalogus om materiaal toe te voegen.</p><a class="btn" href="carnaval.html#catalogus">Bekijk de catalogus</a></div>';
    renderCategorySummary(selected);
    document.querySelector('[data-reservation-total]').textContent = total.hasPriceOnRequest ? 'Prijs op aanvraag' : money.format(total.incl);
    document.querySelector('[data-reservation-total-ex]').textContent = total.hasPriceOnRequest ? 'Na controle berekend' : money.format(total.excl);
    document.querySelector('[data-continue-reservation]').disabled = selected.length === 0;
    syncNavigationLinks();
  }

  function formSummaryHtml() {
    const selected = entries();
    const total = totals();
    return `<div class="reservation-total"><h2>Jullie selectie</h2><ul class="form-selection-list">${selected.map(({product, quantity}) => `<li><span>${quantity}× ${escapeHtml(product.name)}</span><span>${product.priceOnRequest ? 'Op aanvraag' : money.format(product.price * quantity)}</span></li>`).join('')}</ul><div class="reservation-total__line reservation-total__main"><span>Totaal incl. btw</span><strong>${total.hasPriceOnRequest ? 'Prijs op aanvraag' : money.format(total.incl)}</strong></div><div class="reservation-total__line"><span>Excl. btw</span><span>${total.hasPriceOnRequest ? 'Na controle' : money.format(total.excl)}</span></div><a class="reservation-back" href="reservering-overzicht.html" data-return-overview>Selectie en aantallen aanpassen</a></div>`;
  }

  function appendRequestDetails(formData) {
    const total = totals();
    const selection = entries().map(({product, quantity}) => {
      const price = product.priceOnRequest ? 'prijs op aanvraag' : `${money.format(product.price * quantity)} incl. btw${product.unit ? ` (${product.unit})` : ''}`;
      const details = product.priceOnRequest ? `\n  ${product.components.join('\n  ')}` : '';
      const indication = product.priceOnRequest && product.estimatedRange ? `\n  Getoonde indicatie: ${money.format(product.estimatedRange.minimum)} – ${money.format(product.estimatedRange.maximum)}` : '';
      return `${quantity}× ${product.name} — ${price}${details}${indication}`;
    }).join('\n\n');
    formData.set('_subject', `Carnavalsaanvraag 2027 — ${formData.get('carnavalsgroep')}`);
    formData.set('selectie', selection);
    formData.set('totaal_inclusief_21_procent_btw', total.hasPriceOnRequest ? 'Prijs op aanvraag' : money.format(total.incl));
    formData.set('totaal_exclusief_btw', total.hasPriceOnRequest ? 'Wordt na controle berekend' : money.format(total.excl));
    formData.set('huurperiode', 'Zaterdag 6 t/m dinsdag 9 februari 2027; totaalprijs voor de volledige periode.');
    formData.set('transport', 'Wordt na de aanvraag berekend; binnen 35 km van Meerssen gratis.');
    return formData;
  }

  const addressLookupTimers = new WeakMap();
  const addressLookupControllers = new WeakMap();
  const compactPostcode = value => value.toUpperCase().replace(/\s+/g, '');
  const formatPostcode = value => { const postcode = compactPostcode(value); return postcode.length === 6 ? `${postcode.slice(0, 4)} ${postcode.slice(4)}` : value; };

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
    if (!/^\d{4}[A-Z]{2}$/.test(postcode) || !Number.isInteger(houseNumber)) { status.className = 'address-lookup'; status.textContent = 'Gratis adresaanvulling via PDOK: vul een geldige postcode en huisnummer in.'; return; }
    const country = countryInput.value.trim().toLowerCase();
    if (country && !['nederland', 'netherlands', 'nl'].includes(country)) { status.className = 'address-lookup'; status.textContent = 'Automatisch aanvullen is alleen beschikbaar voor Nederlandse adressen.'; return; }
    addressLookupControllers.get(block)?.abort();
    const controller = new AbortController();
    addressLookupControllers.set(block, controller);
    status.className = 'address-lookup is-loading'; status.textContent = 'Adres opzoeken via PDOK…';
    try {
      const query = encodeURIComponent(`${postcode} AND ${houseNumber}`);
      const response = await fetch(`https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${query}&rows=10&fq=type%3Aadres`, {signal: controller.signal});
      if (!response.ok) throw new Error('PDOK gaf geen geldig antwoord');
      const result = await response.json();
      const exactMatches = (result.response?.docs || []).filter(item => compactPostcode(item.postcode || '') === postcode && Number(item.huisnummer) === houseNumber);
      if (!exactMatches.length) { status.className = 'address-lookup is-error'; status.textContent = 'Adres niet gevonden. Controleer de invoer of vul het adres handmatig in.'; return; }
      const enteredAddition = additionInput.value.trim().toLowerCase().replace(/^-$/, '');
      const selected = exactMatches.find(item => `${item.huisletter || ''}${item.huisnummertoevoeging || ''}`.toLowerCase() === enteredAddition) || exactMatches[0];
      streetInput.value = selected.straatnaam || streetInput.value;
      postcodeInput.value = formatPostcode(selected.postcode || postcode);
      cityInput.value = selected.woonplaatsnaam || cityInput.value;
      countryInput.value = 'Nederland';
      const additions = [...new Set(exactMatches.map(item => `${item.huisletter || ''}${item.huisnummertoevoeging || ''}`.trim()).filter(Boolean))];
      if (!additionInput.value.trim() && additions.length === 1) additionInput.value = additions[0];
      if (!additionInput.value.trim() && additions.length === 0) additionInput.value = '-';
      status.className = 'address-lookup is-success'; status.textContent = additions.length > 1 && !enteredAddition ? 'Straat en plaats gevonden. Controleer de toevoeging.' : 'Adres gevonden en aangevuld via PDOK.';
    } catch (error) {
      if (error.name === 'AbortError') return;
      status.className = 'address-lookup is-error'; status.textContent = 'Automatisch aanvullen is tijdelijk niet beschikbaar. Vul het adres handmatig in.';
    }
  }

  function initForm() {
    const form = document.querySelector('[data-reservation-form]');
    const feedback = document.querySelector('[data-reservation-feedback]');
    const submit = document.querySelector('[data-reservation-submit]');
    if (!entries().length) { window.location.replace('reservering-overzicht.html'); return; }
    document.querySelector('[data-form-summary]').innerHTML = formSummaryHtml();
    syncNavigationLinks();
    const deliveryUnknown = form.querySelector('[data-delivery-unknown]');
    const deliveryAddress = form.querySelector('[data-delivery-address]');
    const syncDelivery = () => {
      const unknown = deliveryUnknown.checked;
      deliveryAddress.classList.toggle('is-disabled', unknown);
      deliveryAddress.querySelectorAll('[data-delivery-required]').forEach(input => { input.disabled = unknown; input.required = !unknown; });
      deliveryAddress.querySelector('[data-delivery-help]').textContent = unknown ? 'Geen probleem. We vragen het afleveradres later bij jullie op.' : 'Vul het adres in waar de carnavalswagen tijdens levering staat.';
      deliveryAddress.querySelector('[data-address-lookup]').hidden = unknown;
    };
    deliveryUnknown.addEventListener('change', syncDelivery); syncDelivery();
    form.querySelectorAll('[data-address-block]').forEach(block => {
      const prefix = block.dataset.addressPrefix;
      [`${prefix}_postcode`, `${prefix}_huisnummer`, `${prefix}_toevoeging`].forEach(name => block.querySelector(`[name="${name}"]`).addEventListener('input', () => {
        clearTimeout(addressLookupTimers.get(block));
        addressLookupTimers.set(block, setTimeout(() => lookupPdokAddress(block), 450));
      }));
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      feedback.hidden = true; submit.disabled = true; submit.textContent = 'Aanvraag versturen…';
      try {
        const response = await fetch(form.action, {method: 'POST', body: appendRequestDetails(new FormData(form)), headers: {Accept: 'application/json'}});
        if (!response.ok) {
          let message = 'De aanvraag kon niet worden verstuurd. Probeer het opnieuw of mail ons rechtstreeks.';
          try { const result = await response.json(); if (Array.isArray(result.errors) && result.errors.length) message = result.errors.map(error => error.message).join(' '); } catch (error) { /* geen leesbare fout */ }
          throw new Error(message);
        }
        localStorage.removeItem(storageKey); localStorage.removeItem(customStorageKey);
        window.location.replace('carnaval.html?aanvraag=verzonden&selectie=leeg#catalogus');
      } catch (error) {
        feedback.textContent = error instanceof Error && error.message !== 'Failed to fetch' ? error.message : 'De aanvraag kon niet worden verstuurd. Controleer je internetverbinding of mail ons rechtstreeks.';
        feedback.hidden = false; submit.disabled = false; submit.textContent = 'Aanvraag versturen';
      }
    });
  }

  if (page === 'overview') {
    renderOverview();
    const itemsPanel = document.querySelector('[data-reservation-items]');
    const productDialog = document.querySelector('[data-reservation-product-dialog]');
    itemsPanel.addEventListener('click', event => {
      const button = event.target.closest('[data-reservation-change]');
      if (button) {
        changeQuantity(button.dataset.id, Number(button.dataset.reservationChange));
        renderOverview();
        return;
      }
      const item = event.target.closest('[data-reservation-item]');
      if (item) openOverviewProduct(byId.get(item.dataset.reservationItem));
    });
    itemsPanel.addEventListener('keydown', event => {
      if (event.target.closest('button') || (event.key !== 'Enter' && event.key !== ' ')) return;
      const item = event.target.closest('[data-reservation-item]');
      if (!item) return;
      event.preventDefault();
      openOverviewProduct(byId.get(item.dataset.reservationItem));
    });
    productDialog.addEventListener('click', event => {
      if (event.target.closest('[data-reservation-product-close]')) productDialog.close();
      else if (event.target === productDialog) productDialog.close();
    });
    document.querySelector('[data-continue-reservation]').addEventListener('click', () => { if (entries().length) window.location.assign(`reservering-formulier.html#selectie=${selectionPayload()}`); });
  } else if (page === 'form') initForm();
})();
