const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/Aldenor-Neto/Accessible-Bible-for-the-blind/main/addon/globalPlugins/bible/dados/versions/catolica%20-%20Ave%20Maria.json';

const abbrevs = [
  "Gn", "Ex", "Lv", "Nm", "Dt", "Jos", "Jz", "Rt", "1Sm", "2Sm", 
  "1Rs", "2Rs", "1Cr", "2Cr", "Esd", "Ne", "Tb", "Jdt", "Est", "Jó", 
  "Sl", "1Mc", "2Mc", "Pr", "Ec", "Ct", "Sb", "Eclo", "Is", "Jr", 
  "Lm", "Br", "Ez", "Dn", "Os", "Jl", "Am", "Ob", "Jon", "Mi", 
  "Na", "Hab", "Sof", "Ag", "Zc", "Ml", "Mt", "Mc", "Lc", "Jo", 
  "At", "Rm", "1Cor", "2Cor", "Gl", "Ef", "Fl", "Cl", "1Tes", "2Tes", 
  "1Tim", "2Tim", "Tit", "Flm", "Heb", "Tg", "1Ped", "2Ped", "1Jo", "2Jo", 
  "3Jo", "Jud", "Ap"
];

async function main() {
  console.log('Downloading Catholic Bible (Ave Maria translation)...');
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const bibleData = await res.json();
    
    console.log(`Downloaded successfully! Found ${bibleData.length} books.`);
    
    const outputDir = path.join(__dirname, '..', 'data', 'bible');
    const booksDir = path.join(outputDir, 'books');
    
    fs.mkdirSync(booksDir, { recursive: true });
    
    const index = [];
    
    bibleData.forEach((book, idx) => {
      const id = idx + 1;
      const abbrev = abbrevs[idx] || "";
      // 1-46 Old Testament, 47-73 New Testament
      const testament = id <= 46 ? "AT" : "NT";
      
      // Add to index
      index.push({
        id,
        name: book.name,
        abbrev,
        chapters: book.chapters.length,
        testament
      });
      
      // Save individual book data
      const bookFile = path.join(booksDir, `${id}.json`);
      fs.writeFileSync(bookFile, JSON.stringify({
        id,
        name: book.name,
        abbrev,
        chapters: book.chapters
      }, null, 2), 'utf-8');
      
      console.log(`Saved book ${id}: ${book.name} (${book.chapters.length} chapters)`);
    });
    
    // Save index file
    fs.writeFileSync(path.join(outputDir, 'index.json'), JSON.stringify(index, null, 2), 'utf-8');
    console.log('Saved index.json successfully!');
    console.log('Bible split process completed successfully.');
    
  } catch (error) {
    console.error('Error spliting bible data:', error);
    process.exit(1);
  }
}

main();
