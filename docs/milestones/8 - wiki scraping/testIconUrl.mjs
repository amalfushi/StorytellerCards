// Approach: scrape a character page to find its icon filename
const API_BASE = 'https://wiki.bloodontheclocktower.com/api.php';

async function findIconFromPage(pageName) {
  // Use the MediaWiki API to get page content and find image references
  const url = `${API_BASE}?action=query&titles=${encodeURIComponent(pageName)}&prop=images&format=json`;
  const resp = await fetch(url);
  const data = await resp.json();
  const pages = data.query?.pages || {};
  
  for (const [id, page] of Object.entries(pages)) {
    if (page.images) {
      const iconImages = page.images.filter(img => 
        img.title.toLowerCase().includes('icon')
      );
      return iconImages.map(i => i.title);
    }
  }
  return [];
}

async function main() {
  // Test a few character pages
  const chars = [
    'Washerwoman', 'Fortune_Teller', 'Imp', 'Baron', 
    'Scarlet_Woman', 'No_Dashii', "Lil'_Monsta", 'Fang_Gu',
    'Tea_Lady', 'Bounty_Hunter'
  ];

  for (const c of chars) {
    const icons = await findIconFromPage(c);
    console.log(`${c}: ${icons.length > 0 ? icons.join(', ') : 'NO ICONS FOUND'}`);
  }

  // Now batch-resolve the found icon file names
  console.log('\n=== Resolving found icon URLs ===');
  // Try with the exact titles from the first character
  const allIcons = [];
  for (const c of chars) {
    const icons = await findIconFromPage(c);
    allIcons.push(...icons);
  }

  if (allIcons.length > 0) {
    const titles = allIcons.join('|');
    const url = `${API_BASE}?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&format=json`;
    const resp = await fetch(url);
    const data = await resp.json();
    const pages = data.query?.pages || {};
    for (const [id, page] of Object.entries(pages)) {
      const imgUrl = page.imageinfo?.[0]?.url;
      if (imgUrl) {
        console.log(`✓ ${page.title} -> ${imgUrl}`);
      } else {
        console.log(`✗ ${page.title} -> MISSING`);
      }
    }
  }
}

main().catch(e => console.error(e));
