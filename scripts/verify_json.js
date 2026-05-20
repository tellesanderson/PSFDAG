const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data', 'bible');
const indexFile = path.join(dataDir, 'index.json');
const booksDir = path.join(dataDir, 'books');

function verify() {
  console.log('Verifying generated JSON database...');
  
  // Verify index
  if (!fs.existsSync(indexFile)) {
    console.error('index.json does not exist!');
    process.exit(1);
  }
  
  let indexData;
  try {
    indexData = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
    console.log(`index.json is valid! Contains ${indexData.length} books.`);
  } catch (e) {
    console.error('Failed to parse index.json:', e);
    process.exit(1);
  }
  
  if (indexData.length !== 73) {
    console.error(`Expected 73 books in index, found ${indexData.length}`);
    process.exit(1);
  }
  
  // Verify each book file
  for (let i = 1; i <= 73; i++) {
    const bookFile = path.join(booksDir, `${i}.json`);
    if (!fs.existsSync(bookFile)) {
      console.error(`Book file ${i}.json does not exist!`);
      process.exit(1);
    }
    
    try {
      const bookData = JSON.parse(fs.readFileSync(bookFile, 'utf-8'));
      const indexEntry = indexData.find(b => b.id === i);
      
      if (!indexEntry) {
        console.error(`Book ID ${i} not found in index.json`);
        process.exit(1);
      }
      
      if (bookData.name !== indexEntry.name) {
        console.error(`Book ${i} name mismatch: Index says "${indexEntry.name}", Book file says "${bookData.name}"`);
        process.exit(1);
      }
      
      if (bookData.chapters.length !== indexEntry.chapters) {
        console.error(`Book ${i} chapter count mismatch: Index says ${indexEntry.chapters}, Book file has ${bookData.chapters.length}`);
        process.exit(1);
      }
      
      // Check each chapter has verses
      bookData.chapters.forEach((chapter, chIdx) => {
        if (!Array.isArray(chapter)) {
          console.error(`Book ${i} chapter ${chIdx + 1} is not an array!`);
          process.exit(1);
        }
        if (chapter.length === 0) {
          console.warn(`Warning: Book ${i} chapter ${chIdx + 1} is empty!`);
        }
      });
      
    } catch (e) {
      console.error(`Failed to parse book file ${i}.json:`, e);
      process.exit(1);
    }
  }
  
  console.log('All 73 Catholic Bible books verified successfully! Valid JSON structure and metadata matches.');
}

verify();
