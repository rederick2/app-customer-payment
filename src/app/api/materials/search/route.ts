import { NextRequest, NextResponse } from 'next/server';
import { chromium } from "playwright-core";
import { getCached, setCached } from '@/lib/searchCache';

const TOKEN = process.env.BROWSERLESS_API_KEY; // Tu token de Browserless

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'drywall';

  // --- Supabase cache check ---
  const cached = await getCached('homedepot', query);
  if (cached) {
    return NextResponse.json({ materials: cached, fromCache: true });
  }
  console.log(`[Cache MISS] Home Depot: "${query}" — iniciando scraping`);

  let browser;

  try {
    // 1. Conectamos con Stealth (resolvemos captchas automáticamente)
    browser = await chromium.connectOverCDP(
      `wss://production-sfo.browserless.io/stealth?token=${TOKEN}&solveCaptchas=true`
    );

    // IMPORTANTE: Quitamos el userAgent manual para no romper el camuflaje de Stealth
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York'
    });

    const page = await context.newPage();

    // 2. PUENTE ORGÁNICO
    console.log("Generando confianza con Google...");
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => { });

    // 3. Navegación a Home Depot
    const hdSearchUrl = `https://www.homedepot.com/s/${encodeURIComponent(query)}`;
    console.log(`Navegando a Home Depot: ${hdSearchUrl}`);

    await page.goto(hdSearchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
      referer: 'https://www.google.com/'
    });

    console.log("Esperando estabilización del firewall y posibles redirecciones...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. FAIL-FAST PROTEGIDO: Comprobamos el título con cuidado
    try {
      const pageTitle = await page.title();
      console.log("Título de la página actual:", pageTitle);

      if (pageTitle.toLowerCase().includes("access denied") || pageTitle.toLowerCase().includes("security")) {
        throw new Error("Bloqueo de PerimeterX (Access Denied) detectado de inmediato.");
      }
    } catch (e: any) {
      // Si el contexto se destruye, es porque Home Depot nos redirigió de /s/drywall a su categoría oficial. ¡Es un éxito!
      if (e.message.includes('Execution context was destroyed')) {
        console.log("Redirección detectada (Context Destroyed). El firewall nos dejó pasar.");
      } else {
        throw e; // Si es otro error, lo lanzamos
      }
    }

    // 5. Esperamos los productos (Múltiples selectores por si hacen test A/B)
    console.log("Esperando productos...");
    const podSelector = '[data-testid="product-pod"], .product-pod, .browse-search__pod';

    try {
      await page.waitForSelector(podSelector, { timeout: 25000 });
    } catch (error) {
      // Si no encuentra los productos después de 25 segundos, leemos el HTML para saber por qué
      const currentUrl = page.url();
      const title = await page.title().catch(() => 'Desconocido');
      throw new Error(`Timeout esperando productos. URL final: ${currentUrl} | Título: ${title}`);
    }

    // Pausa extra para inyección de precios asíncronos en tiendas locales
    console.log("Esperando a que los precios locales asíncronos carguen...");
    await new Promise(resolve => setTimeout(resolve, 3500));

    // 6. Extracción de datos (Modo Agresivo + Anti Lazy-Loading)
    const products = await page.evaluate((selector) => {
      const cards = Array.from(document.querySelectorAll(selector));

      return cards.map(card => {
        // Título
        const nameEl = card.querySelector('[data-testid="product-header"], h3, [class*="title"]');
        const name = nameEl ? nameEl.textContent?.trim() : "Sin nombre";

        // Enlace
        const linkEl = card.querySelector('a');
        const link = linkEl ? linkEl.getAttribute('href') : "";

        // Imagen: Táctica anti Lazy-Loading
        let img = "";
        const images = Array.from(card.querySelectorAll('img'));
        for (const imgEl of images) {
          const src = imgEl.getAttribute('src') || '';
          const srcset = imgEl.getAttribute('srcset') || '';
          const dataSrc = imgEl.getAttribute('data-src') || imgEl.getAttribute('data-original') || '';

          // Priorizamos atributos de datos reales, luego srcset, luego src (ignorando base64)
          if (dataSrc) {
            img = dataSrc;
            break;
          } else if (srcset) {
            img = srcset.split(' ')[0]; // Toma la primera URL del srcset
            break;
          } else if (src && !src.includes('data:image') && src.length > 10) {
            img = src;
            break;
          }
        }

        // Precio
        let priceValue = 0;
        let debugText = "";
        const priceContainer = card.querySelector('[data-testid="price"], div[class*="price"]');

        if (priceContainer) {
          debugText = priceContainer.textContent || "";
          const dollars = priceContainer.querySelector('.price__dollars, span:nth-child(2)');
          const cents = priceContainer.querySelector('.price__cents, span:nth-child(4)');

          if (dollars && cents) {
            const d = dollars.textContent?.replace(/[^0-9]/g, "") || "0";
            const c = cents.textContent?.replace(/[^0-9]/g, "") || "00";
            priceValue = parseFloat(`${d}.${c}`);
          } else {
            const match = debugText.match(/\$?([\d,]+)\.(\d{2})/);
            if (match) {
              priceValue = parseFloat(match[1].replace(/,/g, "") + "." + match[2]);
            } else {
              const matchInt = debugText.match(/\$?([\d,]+)/);
              if (matchInt) priceValue = parseFloat(matchInt[1].replace(/,/g, ""));
            }
          }
        }

        if (priceValue === 0) {
          debugText = card.textContent || "";
          const match = debugText.match(/\$\s*([\d,]+\.\d{2})/);
          if (match) {
            priceValue = parseFloat(match[1].replace(/,/g, ""));
          }
        }

        return {
          name: name || "Sin nombre",
          unit_price: priceValue,
          photo_url: img || "",
          product_url: link || "",
          description: "Home Depot USA"
        };
      });
    }, podSelector);

    // 7. Normalización y Filtro
    const validProducts = products.map(m => {
      let finalPhoto = m.photo_url;
      let finalLink = m.product_url;

      if (finalLink && finalLink.startsWith('/')) finalLink = 'https://www.homedepot.com' + finalLink;
      if (finalPhoto && finalPhoto.startsWith('//')) finalPhoto = 'https:' + finalPhoto;

      return { ...m, photo_url: finalPhoto, product_url: finalLink };

    }).filter(p => p.unit_price > 0 && p.name !== "Sin nombre").slice(0, 15);

    console.log(`Extracción exitosa: ${validProducts.length} productos obtenidos.`);

    // --- Persist to Supabase cache ---
    await setCached('homedepot', query, validProducts);

    return NextResponse.json({ materials: validProducts, fromCache: false });

  } catch (error: any) {
    console.error("Error en HD Scraping:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}