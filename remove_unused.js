import fs from 'fs';
const content = fs.readFileSync('src/components/AlmoxarifeDashboard.tsx', 'utf8');

let newContent = content.replace(/interface Material {[\s\S]*?}\n\n/g, '');
newContent = newContent.replace(/const mockInventory: Material\[\] = \[[\s\S]*?\];\n\n/g, '');
newContent = newContent.replace(/const getStockStatus = \(item: Material\) => {[\s\S]*?};\n\n/g, '');
newContent = newContent.replace(/  const \[selectedItem, setSelectedItem\] = useState<Material \| null>\(null\);\n/g, '');

fs.writeFileSync('src/components/AlmoxarifeDashboard.tsx', newContent);
console.log('Unused code removed.');
