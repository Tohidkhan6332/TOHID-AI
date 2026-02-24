const fs = require('fs');
const path = require('path');

const customTemp = path.join(process.cwd(), 'temp');

if (!fs.existsSync(customTemp)) {
    console.log('Temp folder does not exist. Creating it...');
    fs.mkdirSync(customTemp, { recursive: true });
}

const files = fs.readdirSync(customTemp);
let deletedCount = 0;

files.forEach(file => {
    const filePath = path.join(customTemp, file);
    try {
        const stats = fs.statSync(filePath);
        const ageInMs = Date.now() - stats.mtimeMs;
        const threeHours = 1 * 60 * 60 * 1000;

        if (ageInMs > threeHours) {
            fs.unlinkSync(filePath);
            deletedCount++;
        }
    } catch (err) {
        console.error(`❌ Could not process ${file}: ${err.message}`);
    }
});

console.log(`✅ Cleanup finished. Deleted ${deletedCount} files.`);
process.exit(0);
