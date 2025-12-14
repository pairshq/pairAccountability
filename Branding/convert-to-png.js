const fs = require('fs');
const { execSync } = require('child_process');

// Check if sharp is installed, if not, install it
try {
  require('sharp');
} catch (e) {
  console.log('Installing sharp...');
  execSync('npm install sharp --save-dev', { stdio: 'inherit' });
}

const sharp = require('sharp');

async function convertSvgToPng(svgPath, pngPath, size = 1000, backgroundColor = { r: 255, g: 255, b: 255, alpha: 1 }) {
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    await sharp(svgBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: backgroundColor
      })
      .png()
      .toFile(pngPath);
    console.log(`✓ Created ${pngPath}`);
  } catch (error) {
    console.error(`Error converting ${svgPath}:`, error.message);
  }
}

async function main() {
  // Convert white background logo
  await convertSvgToPng('logo-white-bg.svg', 'logo-white-bg.png', 1000, { r: 255, g: 255, b: 255, alpha: 1 });
  
  // Convert black background logo (using #1e293b which is rgb(30, 41, 59))
  await convertSvgToPng('logo-black-bg.svg', 'logo-black-bg.png', 1000, { r: 30, g: 41, b: 59, alpha: 1 });
  
  console.log('\n✓ All conversions complete!');
}

main();

