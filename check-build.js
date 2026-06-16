import fs from 'fs';

if (!fs.existsSync('./dist/index.html')) {
    console.error('Error: Project has not been built yet.');
    console.error('Run: npm run build');
    process.exit(1);
}
