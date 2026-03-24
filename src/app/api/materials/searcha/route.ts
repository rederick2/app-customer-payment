import { NextRequest, NextResponse } from 'next/server';
import { chromium } from "playwright-core";

const TOKEN = process.env.BROWSERLESS_API_KEY; // Tu token de Browserless

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'drywall';

    let browser;

    try {
        browser = await chromium.connectOverCDP(
            `wss://production-sfo.browserless.io/stealth?token=${TOKEN}&solveCaptchas=true`
        );

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 }
        });

        const page = await context.newPage();
        const cdp = await page.context().newCDPSession(page);

        console.log("Generando confianza con Google...");
        await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => { });

        const aceSearchUrl = `https://www.acehardware.com/search?query=${encodeURIComponent(query)}`;
        console.log(`Navegando a Ace Hardware haciéndonos pasar por tráfico de Google...`);

        await page.goto(aceSearchUrl, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
            referer: 'https://www.google.com/'
        });

        // --- LA SOLUCIÓN AL ERROR DE CONTEXTO ---
        // 1. Pausa estratégica: Dejamos que el Firewall haga sus recargas invisibles de seguridad.
        console.log("Esperando a que la página se estabilice (anti-redirecciones)...");
        await new Promise(resolve => setTimeout(resolve, 4000));

        // 2. Protegemos la búsqueda del Captcha con un try-catch
        try {
            const captcha = await page.$(".h-captcha, iframe[src*='hcaptcha'], #px-captcha");
            if (captcha) {
                console.log("Resolviendo reto de seguridad en Ace...");

                // Creamos la promesa del timeout para la resolución del captcha
                const waitForCaptchaResolved = (cdp: any, timeout: number = 180000): Promise<any> => {
                    return new Promise((resolve) => {
                        const timer = setTimeout(() => resolve(null), timeout);

                        // Le decimos a TypeScript que acepte este string como un evento válido (as any)
                        cdp.on("Browserless.captchaAutoSolved" as any, (params: any) => {
                            clearTimeout(timer);
                            resolve(params);
                        });

                        // Si también usas el evento captchaFound, haz lo mismo:
                        cdp.on("Browserless.captchaFound" as any, (params: any) => {
                            console.log("Captcha detectado por Browserless:", params.type, params.status);
                        });
                    });
                };

                await waitForCaptchaResolved;
                await new Promise(resolve => setTimeout(resolve, 3000)); // Pausa post-captcha
            }
        } catch (e) {
            // Si el contexto se destruye aquí, no importa. Significa que el firewall 
            // nos dejó pasar y recargó la página para mostrarnos los productos.
            console.log("El DOM cambió rápidamente. Ignorando búsqueda de captcha.");
        }

        // 5. Esperamos las tarjetas de producto
        console.log("Esperando productos...");
        await page.waitForSelector(".product-card", { timeout: 30000 });

        // LA CLAVE: Esperar 3 segundos extra para que el JavaScript de Ace Hardware 
        // termine de consultar el inventario de la tienda e inyecte los precios en el HTML.
        console.log("Esperando a que los precios locales carguen...");
        await new Promise(resolve => setTimeout(resolve, 5500));

        // 6. Extracción de datos (Ace Hardware - Extracción Quirúrgica)
        const products = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll(".product-card"));

            return cards.map(card => {
                // 1. Título
                const nameEl = card.querySelector(".product-card-title, .product-name");
                const name = nameEl ? nameEl.textContent?.trim() : "Sin nombre";

                // 2. Enlace (Método Infalible: Usamos el ID de la tarjeta)
                let link = "";
                const productCode = card.getAttribute("data-productcode");
                if (productCode) {
                    link = `https://www.acehardware.com/p/${productCode}`;
                } else {
                    const linkEl = card.querySelector("a[href*='/p/']");
                    link = linkEl ? (linkEl.getAttribute("href") || "") : "";
                }

                // 3. Imagen (Anti-corazones y Anti-SVG)
                let img = "";
                const images = Array.from(card.querySelectorAll("img"));
                const realImg = images.find(i => {
                    const src = i.getAttribute("src") || i.getAttribute("data-src") || "";
                    return !src.includes("heart") && !src.includes(".svg") && src.length > 10;
                });

                if (realImg) {
                    img = realImg.getAttribute("data-src") || realImg.getAttribute("src") || "";
                }

                // 4. Precio (Apuntamos al span oculto que tiene el número limpio)
                let priceValue = 0;
                let debugText = "";

                // Buscamos en el orden de lo más limpio a lo más sucio
                const hiddenPrice = card.querySelector('.price-section .hidden');
                const customPrice = card.querySelector('.custom-price');

                if (hiddenPrice && hiddenPrice.textContent) {
                    debugText = hiddenPrice.textContent;
                    priceValue = parseFloat(debugText.replace(/[^0-9.]/g, ""));
                } else if (customPrice && customPrice.textContent) {
                    debugText = customPrice.textContent;
                    priceValue = parseFloat(debugText.replace(/[^0-9.]/g, ""));
                } else {
                    // Fuerza bruta si no encuentra las clases
                    debugText = card.textContent || "";
                    const match = debugText.match(/[\d,]+\.\d{2}/);
                    if (match) priceValue = parseFloat(match[0].replace(/,/g, ""));
                }

                if (isNaN(priceValue)) priceValue = 0;

                return {
                    name: name || "Sin nombre",
                    unit_price: priceValue,
                    photo_url: img || "",
                    product_url: link || "",
                    description: "Ace Hardware USA",
                    raw_price_debug: debugText.trim().substring(0, 30) // Solo los primeros 30 caracteres
                };
            });
        });

        console.log("Muestra cruda del primer producto:", products[0]);

        // 7. Normalización dinámica de URLs y Filtro
        const validProducts = products.map(m => {
            let finalPhoto = m.photo_url;

            // Arreglar URLs de CDN (agregar https:)
            if (finalPhoto && finalPhoto.startsWith('//')) {
                finalPhoto = 'https:' + finalPhoto;
            }

            return { ...m, photo_url: finalPhoto };

        }).filter(p => p.unit_price > 0).slice(0, 15);

        console.log(`Extracción exitosa: ${validProducts.length} productos obtenidos.`);

        return NextResponse.json({ materials: validProducts });

    } catch (error: any) {
        console.error("Error en la ruta API:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (browser) await browser.close();
    }
}