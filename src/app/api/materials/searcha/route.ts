import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { getCached, setCached } from '@/lib/searchCache';

const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'drywall';

    // --- Supabase cache check ---
    const cached = await getCached('acehardware', query);
    if (cached) {
        return NextResponse.json({ materials: cached, fromCache: true });
    }
    console.log(`[Cache MISS] Ace Hardware: "${query}" — iniciando scraping`);

    const targetUrl = `https://www.acehardware.com/search?query=${encodeURIComponent(query)}`;

    console.log(`Enviando a ScrapingBee a buscar: ${targetUrl}`);

    // Construimos la orden para ScrapingBee
    // render_js=true -> Ejecuta el JavaScript de la página para que carguen los precios
    // wait_for=.product-card -> Le dice a ScrapingBee que no nos devuelva el HTML hasta que vea los productos
    //const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(targetUrl)}&render_js=true&wait_for=${encodeURIComponent('.product-card')}`;
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(targetUrl)}&render_js=true&wait_for=${encodeURIComponent('.product-card')}&stealth_proxy=true`;
    try {
        const response = await fetch(scrapingBeeUrl);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ScrapingBee bloqueado o falló: ${response.status} - ${errorText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html); // Cargamos el HTML en Cheerio

        const products: any[] = [];

        // Usamos exactamente los mismos selectores quirúrgicos que descubrimos antes
        $('.product-card').each((_, element) => {
            const card = $(element);

            // 1. Título
            const name = card.find('.product-card-title, .product-name').text().trim();
            if (!name) return; // Si no hay nombre válido, lo ignoramos

            // 2. Enlace (Usando el ID seguro)
            const productCode = card.attr('data-productcode');
            let link = productCode ? `https://www.acehardware.com/p/${productCode}` : card.find("a[href*='/p/']").attr('href') || "";
            if (link.startsWith('/')) link = `https://www.acehardware.com${link}`;

            // 3. Imagen (Anti-corazones de favoritos)
            let img = "";
            card.find('img').each((_, imgEl) => {
                const src = $(imgEl).attr('src') || $(imgEl).attr('data-src') || "";
                if (!src.includes('heart') && !src.includes('.svg') && src.length > 10) {
                    img = $(imgEl).attr('data-src') || $(imgEl).attr('src') || "";
                    return false; // Esto rompe el bucle de jQuery/Cheerio al encontrar la primera imagen real
                }
            });
            if (img.startsWith('//')) img = `https:${img}`;

            // 4. Precio (Directo al número oculto)
            let priceValue = 0;
            const hiddenPrice = card.find('.price-section .hidden').text();
            const customPrice = card.find('.custom-price').text();

            if (hiddenPrice) {
                priceValue = parseFloat(hiddenPrice.replace(/[^0-9.]/g, ""));
            } else if (customPrice) {
                priceValue = parseFloat(customPrice.replace(/[^0-9.]/g, ""));
            } else {
                const text = card.text();
                const match = text.match(/[\d,]+\.\d{2}/);
                if (match) priceValue = parseFloat(match[0].replace(/,/g, ""));
            }

            // 5. Filtro en vivo
            if (!isNaN(priceValue) && priceValue > 0) {
                products.push({
                    name,
                    unit_price: priceValue,
                    photo_url: img,
                    product_url: link,
                    description: "Ace Hardware USA"
                });
            }
        });

        const validProducts = products.slice(0, 15);
        console.log(`¡Éxito total! Extraídos ${validProducts.length} productos sin bloqueos.`);

        // --- Persist to Supabase cache ---
        await setCached('acehardware', query, validProducts);

        return NextResponse.json({ materials: validProducts, fromCache: false });

    } catch (error: any) {
        console.error("Error en extracción:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}