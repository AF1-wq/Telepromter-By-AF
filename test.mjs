import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    
    await page.goto('http://localhost:5173');
    await page.waitForSelector('aside'); // wait for sidebar
    
    console.log('Page loaded. Clicking theme toggle...');
    
    // Evaluate in page to find and click the theme toggle button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const themeBtn = buttons.find(b => b.innerText.includes('Modo oscuro') || b.innerText.includes('Modo claro'));
      if (themeBtn) {
        themeBtn.click();
      } else {
        console.log('Toggle button not found!');
      }
    });
    
    await new Promise(r => setTimeout(r, 2000));
    console.log('Done waiting.');
    await browser.close();
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  }
})();
