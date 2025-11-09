// @todo: напишите здесь код парсера

function parsePage() {
    // ---------------------- //
    // 1️⃣ МЕТА-ИНФОРМАЦИЯ
    // ---------------------- //
    const html = document.documentElement;
    const lang = html.getAttribute('lang') || '';

    let title = document.title || '';
    if (title.includes('—')) title = title.split('—')[0].trim();
    else if (title.includes('-')) title = title.split('-')[0].trim();

    const keywords = (document.querySelector('meta[name="keywords"]')?.content || '')
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

    const description = document.querySelector('meta[name="description"]')?.content || '';

    const ogTags = document.querySelectorAll('meta[property^="og:"]');
    const opengraph = {};
    ogTags.forEach(tag => {
        const key = tag.getAttribute('property').replace(/^og:/, '');
        opengraph[key] = tag.getAttribute('content');
    });

    // ---------------------- //
    // 2️⃣ КАРТОЧКА ТОВАРА
    // ---------------------- //
    const firstSection = document.querySelector('section[data-product-id]');
    const productId = firstSection ? firstSection.dataset.productId : null;

    // 💡 Фото товара
    const galleryMain = document.querySelector('.product-gallery__main img');
    const mainImage = galleryMain
        ? {
            full: galleryMain.src,
            thumb: galleryMain.src,
            alt: galleryMain.alt || ''
        }
        : null;

    const thumbs = Array.from(document.querySelectorAll('.product-gallery__thumbs img'))
        .map(img => ({
            full: img.dataset.full || img.src,
            thumb: img.src,
            alt: img.alt || ''
        }));

    // Убираем дублирование главного изображения
    const photos = mainImage
        ? [mainImage, ...thumbs.filter(t => t.full !== mainImage.full)]
        : thumbs;

    // 💡 Лайк активен?
    const liked = document.querySelector('.like-button.active') !== null;

    // 💡 Название
    const name = document.querySelector('h1')?.textContent.trim() || '';

    // 💡 Теги
    const tags = Array.from(document.querySelectorAll('.product-tags .tag'));
    const categories = [];
    const labels = [];
    const discounts = [];
    tags.forEach(tag => {
        const color = getComputedStyle(tag).backgroundColor;
        const text = tag.textContent.trim();
        if (color.includes('0, 128, 0') || tag.classList.contains('tag--green')) categories.push(text); // зелёные
        else if (color.includes('0, 0, 255') || tag.classList.contains('tag--blue')) labels.push(text); // синие
        else if (color.includes('255, 0, 0') || tag.classList.contains('tag--red')) discounts.push(text); // красные
    });

    // 💡 Цены
    const priceEl = document.querySelector('.price-current');
    const oldPriceEl = document.querySelector('.price-old');

    const currentPrice = priceEl ? parseFloat(priceEl.textContent.replace(/[^\d.,]/g, '').replace(',', '.')) : 0;
    const oldPrice = oldPriceEl ? parseFloat(oldPriceEl.textContent.replace(/[^\d.,]/g, '').replace(',', '.')) : currentPrice;

    const discountPercent = oldPrice > currentPrice
        ? Math.round((1 - currentPrice / oldPrice) * 100)
        : 0;

    const currencySymbol = (priceEl?.textContent.match(/[$€₽]/) || [])[0] || '';
    const currencyMap = { '$': 'USD', '€': 'EUR', '₽': 'RUB' };
    const currency = currencyMap[currencySymbol] || '';

    // 💡 Свойства товара
    const props = {};
    document.querySelectorAll('.product-specs__row').forEach(row => {
        const key = row.querySelector('.specs__name')?.textContent.trim();
        const val = row.querySelector('.specs__value')?.textContent.trim();
        if (key && val) props[key] = val;
    });

    // 💡 Полное описание (очищаем атрибуты, сохраняем формат)
    const shortDesc = document.querySelector('.product-description__short');
    const fullDesc = document.querySelector('.product-description__full');
    const descContainer = document.createElement('div');
    if (shortDesc) descContainer.appendChild(shortDesc.cloneNode(true));
    if (fullDesc) descContainer.appendChild(fullDesc.cloneNode(true));
    // Удаляем все атрибуты, но сохраняем HTML структуру
    descContainer.querySelectorAll('*').forEach(el => {
        for (let attr of Array.from(el.attributes)) el.removeAttribute(attr.name);
    });
    const descriptionHTML = descContainer.innerHTML.trim();

    // ---------------------- //
    // 3️⃣ ДОПОЛНИТЕЛЬНЫЕ ТОВАРЫ
    // ---------------------- //
    const suggested = Array.from(document.querySelectorAll('.suggested-products .product-card')).map(card => {
        const img = card.querySelector('img');
        const price = card.querySelector('.price')?.textContent || '';
        const symbol = (price.match(/[$€₽]/) || [])[0] || '';
        return {
            image: img?.src || '',
            name: card.querySelector('.product-card__title')?.textContent.trim() || '',
            price: parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
            currency: currencyMap[symbol] || '',
            description: card.querySelector('.product-card__desc')?.textContent.trim() || ''
        };
    });

    // ---------------------- //
    // 4️⃣ ОТЗЫВЫ
    // ---------------------- //
    const reviews = Array.from(document.querySelectorAll('.review-card')).map(r => {
        const rating = r.querySelectorAll('.star.filled').length;
        const title = r.querySelector('.review-card__title')?.textContent.trim() || '';
        const text = r.querySelector('.review-card__text')?.textContent.trim() || '';
        const avatar = r.querySelector('.review-author img')?.src || '';
        const author = r.querySelector('.review-author__name')?.textContent.trim() || '';
        const rawDate = r.querySelector('.review-date')?.textContent.trim() || '';
        const dateObj = new Date(rawDate);
        const date = isNaN(dateObj)
            ? rawDate
            : dateObj.toLocaleDateString('ru-RU').replace(/\//g, '.');
        return {
            rating,
            title,
            text,
            author: { name: author, avatar },
            date
        };
    });

    // ---------------------- //
    // ✅ РЕЗУЛЬТАТ
    // ---------------------- //
    return {
        meta: { lang, title, keywords, description, opengraph },
        product: {
            id: productId,
            photos,
            liked,
            name,
            categories,
            labels,
            discounts,
            currentPrice,
            oldPrice,
            discountPercent,
            currency,
            properties: props,
            descriptionHTML
        },
        suggested,
        reviews
    };
}


window.parsePage = parsePage;