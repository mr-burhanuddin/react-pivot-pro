const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', response => console.log(response.status(), response.url()));

  await page.goto('http://localhost:5173/');
  
  // Wait a bit to ensure it loads
  await page.waitForTimeout(2000);
  
  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
  console.log('ROOT HTML:', rootHtml);
  
  await browser.close();
})();
