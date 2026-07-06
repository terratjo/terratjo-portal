const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch();
  
  // 1. Landscape Demo
  console.log('Recording Landscape Demo...');
  const landscapeContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: '/Users/aldo/.gemini/antigravity-ide/brain/003f573e-1194-482e-8175-3d555c5d06e1/artifacts/', size: { width: 1280, height: 720 } }
  });
  const page = await landscapeContext.newPage();
  
  await page.goto('http://localhost:3000');
  
  // Login
  await page.fill('#login-user', 'terratjo');
  await page.fill('#login-pass', 'admin123');
  await page.click('#btn-login-submit');
  
  // wait for login to disappear
  await page.waitForSelector('#login-overlay.active', { state: 'hidden', timeout: 10000 });
  
  // Show Calendar
  await page.waitForTimeout(2000);
  
  // Show Bookings
  await page.click('.nav-item[data-page="all-bookings"]');
  await page.waitForTimeout(3000);
  
  // Show Invoices
  await page.click('.nav-item[data-page="invoices"]');
  await page.waitForTimeout(3000);

  // Close context to save video
  await landscapeContext.close();
  console.log('Landscape Demo finished.');

  // 2. Mobile Demo
  console.log('Recording Mobile Demo...');
  const mobileContext = await browser.newContext({
    ...devices['iPhone 13'],
    recordVideo: { dir: '/Users/aldo/.gemini/antigravity-ide/brain/003f573e-1194-482e-8175-3d555c5d06e1/artifacts/' }
  });
  const mPage = await mobileContext.newPage();
  await mPage.goto('http://localhost:3000');
  
  // Login
  await mPage.fill('#login-user', 'terratjo');
  await mPage.fill('#login-pass', 'admin123');
  await mPage.click('#btn-login-submit');
  
  // wait for login to disappear
  await mPage.waitForSelector('#login-overlay.active', { state: 'hidden', timeout: 10000 });
  await mPage.waitForTimeout(2000);
  
  // Open Sidebar (hamburger menu)
  await mPage.click('.btn-hamburger');
  await mPage.waitForTimeout(1000);
  await mPage.click('.nav-item[data-page="all-bookings"]');
  await mPage.waitForTimeout(3000);

  await mPage.click('.btn-hamburger');
  await mPage.waitForTimeout(1000);
  await mPage.click('.nav-item[data-page="invoices"]');
  await mPage.waitForTimeout(3000);

  await mobileContext.close();
  console.log('Mobile Demo finished.');

  await browser.close();
  
  // Rename videos
  const dir = '/Users/aldo/.gemini/antigravity-ide/brain/003f573e-1194-482e-8175-3d555c5d06e1/artifacts/';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.webm'));
  files.sort((a,b) => fs.statSync(path.join(dir,a)).mtime.getTime() - fs.statSync(path.join(dir,b)).mtime.getTime());
  if(files.length >= 2) {
    if(fs.existsSync(path.join(dir, 'landscape_demo.webm'))) fs.unlinkSync(path.join(dir, 'landscape_demo.webm'));
    if(fs.existsSync(path.join(dir, 'mobile_demo.webm'))) fs.unlinkSync(path.join(dir, 'mobile_demo.webm'));
    
    fs.renameSync(path.join(dir, files[files.length-2]), path.join(dir, 'landscape_demo.webm'));
    fs.renameSync(path.join(dir, files[files.length-1]), path.join(dir, 'mobile_demo.webm'));
  }
})();
