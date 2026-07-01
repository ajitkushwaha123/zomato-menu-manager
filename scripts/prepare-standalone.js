const fs = require('fs');
const path = require('path');

function copyAssets() {
  console.log('Copying static assets for Next.js standalone mode...');
  
  const publicSrc = path.join(__dirname, '..', 'public');
  const publicDest = path.join(__dirname, '..', '.next', 'standalone', 'public');
  
  const staticSrc = path.join(__dirname, '..', '.next', 'static');
  const staticDest = path.join(__dirname, '..', '.next', 'standalone', '.next', 'static');

  try {
    if (fs.existsSync(publicSrc)) {
      fs.cpSync(publicSrc, publicDest, { recursive: true });
      console.log('Copied public/ -> .next/standalone/public/');
    }
    
    if (fs.existsSync(staticSrc)) {
      fs.cpSync(staticSrc, staticDest, { recursive: true });
      console.log('Copied .next/static/ -> .next/standalone/.next/static/');
    }
    
    console.log('Static assets copied successfully.');
  } catch (err) {
    console.error('Error copying static assets:', err);
    process.exit(1);
  }
}

copyAssets();
