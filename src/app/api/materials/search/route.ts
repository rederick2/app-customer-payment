import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const searchTerms = encodeURIComponent(query).replace(/%20/g, '+');
    // URL de búsqueda adaptada según tu requerimiento
    const searchUrl = `https://www.homedepot.com/s/${searchTerms}?NCNI-5`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Home Depot: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const materials: any[] = [];

    // --- ESTRATEGIA: Extracción desde __NEXT_DATA__ ---
    const nextDataScript = $('script#__NEXT_DATA__').html();

    if (nextDataScript) {
      try {
        const jsonData = JSON.parse(nextDataScript);

        // En Home Depot, la ruta suele ser props -> pageProps -> initialData -> searchReport -> products
        // O directamente en dlv (Data Layer View) dependiendo de la versión de la página.
        const products = jsonData.props?.pageProps?.initialData?.searchReport?.products || [];

        if (products && Array.isArray(products)) {
          products.forEach((item: any) => {
            if (materials.length >= 15) return;

            // Extraer precio
            const price = item.identifiers?.pricing?.specialPrice || item.identifiers?.pricing?.originalPrice || 0;

            // Construir URL del producto
            let productUrl = item.identifiers?.canonicalUrl || '';
            if (productUrl && !productUrl.startsWith('http')) {
              productUrl = `https://www.homedepot.com${productUrl}`;
            }

            if (item.identifiers?.productLabel && price > 0) {
              materials.push({
                name: item.identifiers.productLabel,
                description: item.identifiers.brandName || 'Home Depot',
                quantity: 1,
                unit_price: price,
                photo_url: item.media?.primaryImage?.url || '',
                product_url: productUrl
              });
            }
          });
        }
      } catch (e) {
        console.error("Error parsing Home Depot JSON:", e);
      }
    }

    // --- FALLBACK: Scraper por selectores CSS (Si el JSON no está disponible) ---
    if (materials.length === 0) {
      $('.pod-inner').each((i, el) => {
        if (materials.length >= 15) return;

        const $el = $(el);
        const title = $el.find('.product-pod--title').text().trim();
        const priceText = $el.find('.price-format__main-price').first().text().trim();
        const img = $el.find('img').attr('src');
        const link = $el.find('a').attr('href');

        const priceMatch = priceText.match(/[\d,.]+/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

        if (title && price > 0) {
          materials.push({
            name: title,
            description: 'Home Depot',
            quantity: 1,
            unit_price: price,
            photo_url: img || '',
            product_url: link?.startsWith('http') ? link : `https://www.homedepot.com${link}`
          });
        }
      });
    }

    return NextResponse.json({ materials });
  } catch (error: any) {
    console.error('Home Depot Search Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}