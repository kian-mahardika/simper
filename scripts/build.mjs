import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
const files=['index.html','styles.css','src.js','catalog-data.js','config.js','favicon.svg','app-icon.svg','logo.svg','icon-48.png','icon-192.png','icon-512.png','manifest.webmanifest'];
await fs.rm(output,{recursive:true,force:true});
await fs.mkdir(output,{recursive:true});
for(const file of files){await fs.copyFile(path.join(root,file),path.join(output,file))}
await fs.cp(path.join(root,'covers'),path.join(output,'covers'),{recursive:true});
console.log(`Build selesai: ${files.length} berkas utama dan sampul di dist/`);
