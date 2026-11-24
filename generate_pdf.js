const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  const htmlPath = path.join(__dirname, 'Project_Description.html');
  const pdfPath  = path.join(__dirname, 'Government_AI_OS_Project_Description.pdf');

  if (!fs.existsSync(htmlPath)) {
    console.error('❌ Project_Description.html not found!');
    process.exit(1);
  }

  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();

    // Load local HTML file
    const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
    console.log(`📄 Loading: ${fileUrl}`);
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait a bit for fonts/styles to fully load
    await new Promise(r => setTimeout(r, 2000));

    // Hide print button before PDF generation
    await page.addStyleTag({ content: '.print-btn { display: none !important; }' });

    console.log('🖨️  Generating PDF...');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      displayHeaderFooter: false,
    });

    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('✅ PDF successfully generated!');
    console.log(`📁 Saved to:`);
    console.log(`   ${pdfPath}`);
    console.log('════════════════════════════════════════════════════════');
    console.log('');
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

generatePDF().catch(err => {
  console.error('❌ PDF generation failed:', err.message);
  process.exit(1);
});
