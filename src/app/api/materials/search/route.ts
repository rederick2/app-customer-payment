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
    // URL según tu requerimiento
    const searchUrl = `https://www.homedepot.com/s/${searchTerms}?NCNI-5`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      // Si sigue dando 403, Home Depot ha bloqueado la IP del servidor.
      throw new Error(`Failed to fetch Home Depot: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const materials: any[] = [];

    // --- ESTRATEGIA 1: Extracción desde el JSON __NEXT_DATA__ ---
    const nextDataScript = $('script#__NEXT_DATA__').html();

    if (nextDataScript) {
      try {
        const jsonData = JSON.parse(nextDataScript);

        // Basado en el archivo enviado, los productos están en esta ruta:
        const products = jsonData.props?.pageProps?.initialData?.searchReport?.products || [];

        if (products && Array.isArray(products)) {
          products.forEach((item: any) => {
            if (materials.length >= 15) return;

            const info = item.identifiers;
            // Home Depot separa el precio en partes o lo da en 'specialPrice'
            const price = info?.pricing?.specialPrice || info?.pricing?.originalPrice || 0;

            let productUrl = info?.canonicalUrl || '';
            if (productUrl && !productUrl.startsWith('http')) {
              productUrl = `https://www.homedepot.com${productUrl}`;
            }

            const imgUrl = item.media?.primaryImage?.url || '';

            if (info?.productLabel && price > 0) {
              materials.push({
                name: info.productLabel,
                description: info.brandName || 'Home Depot',
                quantity: 1,
                unit_price: price,
                photo_url: imgUrl,
                product_url: productUrl
              });
            }
          });
        }
      } catch (e) {
        console.error("Error parsing Home Depot JSON:", e);
      }
    }

    // --- ESTRATEGIA 2: Fallback Manual (Selectores CSS del archivo) ---
    if (materials.length === 0) {
      $('.pod-inner').each((i, el) => {
        if (materials.length >= 15) return;

        const $el = $(el);
        const title = $el.find('.product-pod--title, [data-testid="product-header"]').text().trim();
        const priceMain = $el.find('.price-format__main-price').first().text().trim();

        // Limpieza de precio
        const priceMatch = priceMain.match(/[\d,.]+/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

        const img = $el.find('img').attr('src');
        const link = $el.find('a').attr('href');

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