import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const xlsx = require('xlsx');

// Activamos el modo "Invisible" avanzado para Google
puppeteer.use(StealthPlugin());

// 📁 Nombre de tu archivo Excel
const EXCEL_FILE = 'frases.xlsx';

async function checkAllInTitle() {
  // 1. LEER EL EXCEL
  if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`❌ ERROR: No se ha encontrado el archivo "${EXCEL_FILE}".`);
    console.error(`Por favor, crea un archivo Excel llamado "${EXCEL_FILE}" en esta misma carpeta y pon las frases en la primera columna (columna A).`);
    return;
  }

  console.log(`📖 Leyendo el archivo ${EXCEL_FILE}...`);
  const workbook = xlsx.readFile(EXCEL_FILE);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Extraer los datos a JSON (asumimos que la lista está en la primera columna)
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // Aplanar el array y quitar celdas vacías
  const frases = data.flat().filter(cell => cell && typeof cell === 'string' && cell.trim() !== '');

  if (frases.length === 0) {
    console.error('❌ El Excel está vacío o no se pudieron leer las frases.');
    return;
  }

  console.log(`✅ Se han encontrado ${frases.length} frases para analizar.\n`);
  console.log('🤖 Iniciando el robot SEO con Modo Stealth...');
  
  // Abrimos un navegador VISIBLE para evitar bloqueos de Google
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Evitar la molesta pantalla de "Aceptar Cookies" de Google que nos bloquea leer los resultados
  await page.setCookie({
    name: 'CONSENT',
    value: 'YES+cb.20230101-01-p0.es+FX+999',
    domain: '.google.es'
  });
  
  console.log('\n📊 RESULTADOS "ALLINTITLE":\n---------------------------');

  const resultadosExport = [];

  for (let frase of frases) {
    // Quitar comillas dobles o simples si las pusiste en el Excel sin querer
    frase = frase.replace(/^["']|["']$/g, '').trim();

    try {
      const query = encodeURIComponent(`allintitle:"${frase}"`);
      const url = `https://www.google.es/search?q=${query}&hl=es`;
      
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      
      const randomWait = Math.floor(Math.random() * 2000) + 1000;
      await new Promise(r => setTimeout(r, randomWait));

      // Buscamos si hay resultados directamente
      let resultText = await page.evaluate(() => {
        const stats = document.querySelector('#result-stats');
        return stats ? stats.innerText : null;
      });

      // Si Google no muestra #result-stats y vemos un reCAPTCHA u otra cosa, esperamos a que el usuario lo resuelva
      if (!resultText) {
        const urlRedirected = await page.url();
        if (urlRedirected.includes('sorry') || urlRedirected.includes('captcha')) {
          console.log(`- "${frase}": 🤖 Google detectó el robot. Tienes 30 SEGUNDOS para resolver el CAPTCHA en Chrome...`);
          try {
            // Esperamos a que aparezca el div stats, lo que indicaría que el captcha ha sido resuelto y ha redirigido
            await page.waitForSelector('#result-stats', { timeout: 30000 });
            resultText = await page.evaluate(() => document.querySelector('#result-stats').innerText);
            console.log(`- CAPTCHA superado para "${frase}"! ✨`);
          } catch (e) {
            console.log(`- "${frase}": Se agotó el tiempo o no hay resultados reales.`);
            resultText = '0 resultados';
          }
        } else {
          // Si no está en una página "sorry" y tampoco hay stats, asume que es océano azul puro
          resultText = '0 resultados';
        }
      }

      const numero = resultText.replace(/[^0-9]/g, '');
      const numResultados = numero ? parseInt(numero) : 0;
      const textoFinal = numero ? numero : '0 (Océano Azul puro 🌊)';

      console.log(`- "${frase}": ${textoFinal} resultados`);

      // Guardamos para el Excel final
      resultadosExport.push({
        'Palabra Clave': frase,
        'Volumen de Competencia (Allintitle)': numResultados,
        'Dificultad': numResultados === 0 ? '🟢 Océano Azul' : (numResultados < 50 ? '🟢 Fácil' : (numResultados < 200 ? '🟡 Media' : '🔴 Difícil'))
      });

    } catch (error) {
      console.log(`- "${frase}": Error al buscar (${error.message})`);
    }
  }

  await browser.close();
  
  // 2. GUARDAR RESULTADOS EN NUEVO EXCEL
  console.log('\n---------------------------');
  console.log('💾 Guardando resultados en "resultados_seo.xlsx"...');
  
  const newWorkbook = xlsx.utils.book_new();
  const newSheet = xlsx.utils.json_to_sheet(resultadosExport);
  xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Resultados');
  xlsx.writeFile(newWorkbook, 'resultados_seo.xlsx');

  console.log('✅ Análisis completado! Tienes los resultados en el archivo resultados_seo.xlsx');
}

checkAllInTitle();