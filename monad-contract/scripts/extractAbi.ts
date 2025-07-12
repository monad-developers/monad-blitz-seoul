// scripts/extractAbi.ts
import fs from 'fs';
import path from 'path';


const artifactPath = path.join(__dirname, '../artifacts/contracts/MonadClickerGame.sol/MonadClickerGame.json');
const outputPath = path.join(__dirname, './abi/MonadClickerGame.json');

const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(artifact.abi, null, 2));

console.log('✅ ABI extracted to:', outputPath);