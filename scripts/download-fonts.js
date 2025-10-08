const https = require('https');
const fs = require('fs');
const path = require('path');

// Font URLs from Google Fonts or other CDNs
const fonts = [
    {
        name: 'Arial.ttf',
        url: 'https://db.onlinewebfonts.com/t/02f502e5eefeb353e5f83fc5045348dc.ttf'
    },
    {
        name: 'Inter.ttf',
        url: 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.ttf'
    }
];

const fontsDir = path.join(__dirname, '..', 'public', 'fonts');

// Ensure fonts directory exists
if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
}

// Download each font
fonts.forEach(font => {
    const filePath = path.join(fontsDir, font.name);
    
    // Skip if already exists
    if (fs.existsSync(filePath)) {
        console.log(`✓ ${font.name} already exists`);
        return;
    }
    
    console.log(`Downloading ${font.name}...`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(font.url, (response) => {
        response.pipe(file);
        
        file.on('finish', () => {
            file.close();
            console.log(`✓ Downloaded ${font.name}`);
        });
    }).on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file on error
        console.error(`✗ Error downloading ${font.name}:`, err.message);
    });
});

console.log('\nNote: You may need to manually download additional fonts or use Google Fonts API.');