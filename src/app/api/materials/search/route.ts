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
    const searchUrl = `https://www.sodimac.com.pe/sodimac-pe/buscar?Ntt=${searchTerms}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Sodimac: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const materials: any[] = [];

    // --- ESTRATEGIA 1: Extracción desde __NEXT_DATA__ (Más confiable) ---
    const nextDataScript = $('script#__NEXT_DATA__').html();

    if (nextDataScript) {
      try {
        const jsonData = JSON.parse(nextDataScript);
        // La ruta según el archivo es props -> pageProps -> initialData -> resultList
        const results = jsonData.props?.pageProps?.initialData?.resultList;

        console.log(results)

        if (results && Array.isArray(results)) {
          results.forEach((item: any) => {
            if (materials.length >= 15) return;

            // Extraemos el precio principal (internetPrice)
            const priceObj = item.prices?.find((p: any) => p.type === 'internetPrice') || item.prices?.[0];
            const price = priceObj ? parseFloat(priceObj.price[0]) : 0;

            if (item.displayName && price > 0) {
              materials.push({
                name: item.displayName,
                description: item.brand || 'Sodimac Perú',
                quantity: 1,
                unit_price: price,
                photo_url: item.mediaUrls?.[0] || '',
                product_url: item.url.startsWith('http') ? item.url : `https://www.sodimac.com.pe${item.url}`
              });
            }
          });
        }
      } catch (e) {
        console.error("Error parsing __NEXT_DATA__:", e);
      }
    }

    // --- ESTRATEGIA 2: Fallback Manual (Si el JSON falla) ---
    if (materials.length === 0) {
      $('[pod-layout="4_GRID"]').each((i, el) => {
        if (materials.length >= 15) return;

        const $el = $(el);
        const title = $el.find('.pod-subTitle').text().trim();
        const priceText = $el.find('.prices-0 span').first().text().trim();
        const img = $el.find('img').attr('src');
        const link = `https://www.sodimac.com.pe/sodimac-pe/buscar?Ntt=${title.replace(' ', '+')}`;

        console.log($el.find('a').attr('href') + '1')

        const priceMatch = priceText.match(/[\d,.]+/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

        if (title && price > 0) {
          materials.push({
            name: title,
            description: 'Sodimac Perú',
            quantity: 1,
            unit_price: price,
            photo_url: img || '',
            product_url: link?.startsWith('http') ? link : `https://www.sodimac.com.pe${link}`
          });
        }
      });
    }

    return NextResponse.json({ materials });
  } catch (error: any) {
    console.error('Sodimac Search Error:', error);
    return NextResponse.json({ error: error.message || 'Error executing search' }, { status: 500 });
  }
}