const fs = require('fs');
const path = require('path');

const base = 'C:\\Users\\ngadewar\\Desktop\\Hackathon';

// Ensure directories exist
const dirs = [
  path.join(base, 'backend', 'routes'),
  path.join(base, 'frontend', 'src', 'components')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created: ${dir}`);
  }
});

console.log('Setup complete!');
