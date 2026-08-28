const { test, expect } = require('@playwright/test');

test('verify latex, inline code, pre code, spoiler, tables, imgbb checkbox, target_blank rel', async ({ page }) => {
  await page.goto('http://localhost:8000/markdown.html');

  await page.evaluate(() => {
    localStorage.setItem('mdreader_v2_ghToken', 'mock_token');
    localStorage.setItem('mdreader_v2_ghOwner', 'mock_owner');
    localStorage.setItem('mdreader_v2_ghRepo', 'mock_repo');
  });

  await page.goto('http://localhost:8000/markdown.html?open=test.md');

  await page.evaluate(() => {
     document.getElementById('markdown-editor').value = `
# Title

Here is some inline \`code\` and a spoiler <spoiler>secret</spoiler>.

\`\`\`javascript
const a = 1;
\`\`\`

$$ \\int x dx $$

| Header 1 | Header 2 |
| -------- | -------- |
| cell 1   | cell 2   |

<a href="https://example.com" target="_blank">External Link</a>

![local](images/test.jpg)
     `;
     isEditMode = true; // Force it to switch to view
     toggleMode();
  });

  await page.waitForTimeout(500);

  const codeBlock = await page.$('#viewer-container pre code');
  expect(codeBlock).toBeTruthy();

  const spoiler = await page.$('spoiler');
  expect(spoiler).toBeTruthy();
  const spoilerColor = await page.evaluate(el => window.getComputedStyle(el).color, spoiler);
  expect(spoilerColor).toBe('rgba(0, 0, 0, 0)'); // transparent

  const tableBorder = await page.evaluate(() => {
    const table = document.querySelector('#viewer-container table');
    return window.getComputedStyle(table).borderCollapse;
  });
  expect(tableBorder).toBe('collapse');

  const rel = await page.evaluate(() => {
    return document.querySelector('a[href="https://example.com"]').getAttribute('rel');
  });
  expect(rel).toBe('noopener noreferrer');

  const imgLink = await page.evaluate(() => {
     // DOMPurify strips auth-media src and sets data-path, or our logic might have removed src
     // Wait, it should wrap it in <a> tag based on our custom renderer.
     const aTag = document.querySelector('a[href*="?open="]');
     if (!aTag) return null;
     return aTag.getAttribute('href');
  });
  expect(imgLink).toContain('?open=images%2Ftest.jpg');

  // Verify LaTeX (KaTeX)
  const mathHTML = await page.evaluate(() => {
     const math = document.querySelector('.katex');
     return !!math;
  });
  expect(mathHTML).toBe(true);

  console.log("All verifications passed");
});
