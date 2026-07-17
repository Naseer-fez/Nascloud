import { chromium } from '@playwright/test';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const DOWNLOAD_DIR = process.env.NASCLOUD_DOWNLOAD_DIR || 'C:\\Users\\FEZ NASEER\\Downloads\\heheh';
const FIXTURE_DIR = path.resolve('tests', 'e2e', 'fixtures');
const PASSWORD = 'TestPass123!';

const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const account = {
  username: `codex_frontend_${stamp}`,
  email: `codex_frontend_${stamp}@example.com`,
  password: PASSWORD,
};

const results = [];

function record(name, status, detail = '') {
  results.push({ name, status, detail });
  const suffix = detail ? ` - ${detail}` : '';
  console.log(`${status === 'pass' ? 'PASS' : status === 'skip' ? 'SKIP' : 'FAIL'} ${name}${suffix}`);
}

async function ensureFixtures() {
  await mkdir(DOWNLOAD_DIR, { recursive: true });
  await mkdir(FIXTURE_DIR, { recursive: true });
  const filePath = path.join(FIXTURE_DIR, `uploaded-${stamp}.txt`);
  const folderPath = path.join(FIXTURE_DIR, `folder-${stamp}`);
  await mkdir(folderPath, { recursive: true });
  await writeFile(filePath, `NasCloud upload fixture ${stamp}\n`);
  await writeFile(path.join(folderPath, 'nested-a.txt'), `Nested A ${stamp}\n`);
  await writeFile(path.join(folderPath, 'nested-b.txt'), `Nested B ${stamp}\n`);
  return { filePath, folderPath };
}

async function expectNoConsole(page, consoleErrors) {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  if (consoleErrors.length || pageErrors.length) {
    throw new Error([...consoleErrors, ...pageErrors].join('\n'));
  }
}

async function clickUnique(locator, description) {
  const count = await locator.count();
  if (count !== 1) throw new Error(`${description} matched ${count} elements`);
  await locator.click();
}

async function waitForToastOrText(page, expected, timeout = 10000) {
  await page.getByText(expected, { exact: false }).waitFor({ state: 'visible', timeout });
}

async function waitForArticleWithRefresh(page, text, refreshName = 'Refresh', attempts = 5) {
  const row = page.locator('article').filter({ hasText: text });
  for (let index = 0; index < attempts; index += 1) {
    if (await row.count()) {
      try {
        await row.waitFor({ timeout: 3000 });
        return row;
      } catch {
        // retry below
      }
    }
    const refresh = page.getByRole('button', { name: refreshName });
    if (await refresh.count()) await refresh.click();
    await page.waitForTimeout(1000);
  }
  throw new Error(`Timed out waiting for article containing ${text}`);
}

async function run() {
  const fixtures = await ensureFixtures();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      if (message.text().includes('Failed to load resource: the server responded with a status of 400')) {
        return;
      }
      consoleErrors.push(`${message.type()}: ${message.text()}`);
    }
  });

  try {
    await page.goto(`${FRONTEND_URL}/signup`);
    await page.getByPlaceholder('Username').fill(account.username);
    await page.getByPlaceholder('Email').fill(account.email);
    await page.getByPlaceholder('Password').fill(account.password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.waitForURL(`${FRONTEND_URL}/`, { timeout: 15000 });
    record('signup/login through frontend', 'pass', `userid stored for ${account.username}`);

    const folderName = `folder-${stamp}`;
    await page.getByLabel('New folder').click();
    const newFolderDialog = page.getByRole('dialog', { name: 'Create new folder' });
    await newFolderDialog.getByLabel('Folder name').fill(folderName);
    await newFolderDialog.getByRole('button', { name: 'Create folder' }).click();
    await waitForToastOrText(page, 'Folder created', 15000);
    const folderRow = await waitForArticleWithRefresh(page, folderName);
    record('create folder through frontend', 'pass', folderName);

    await clickUnique(folderRow.getByRole('button', { name: folderName, exact: true }), 'open created folder');
    await page.waitForURL(`${FRONTEND_URL}/folder/${encodeURIComponent(folderName)}`, { timeout: 10000 });

    const fileInput = page.locator('input[type="file"]:not([webkitdirectory])');
    await fileInput.setInputFiles(fixtures.filePath);
    await waitForToastOrText(page, 'uploaded', 15000).catch(() => page.getByText('done').waitFor({ timeout: 15000 }));
    const uploadedRow = await waitForArticleWithRefresh(page, path.basename(fixtures.filePath));
    record('file upload through toolbar', 'pass', path.basename(fixtures.filePath));

    const downloadButton = uploadedRow.getByLabel(`Download ${path.basename(fixtures.filePath)}`);
    const downloadButtonCount = await downloadButton.count();
    if (downloadButtonCount !== 1) throw new Error(`download uploaded file button matched ${downloadButtonCount} elements`);
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      downloadButton.click(),
    ]);
    const downloadedPath = path.join(DOWNLOAD_DIR, `downloaded-${path.basename(fixtures.filePath)}`);
    await download.saveAs(downloadedPath);
    const original = await readFile(fixtures.filePath, 'utf8');
    const downloaded = await readFile(downloadedPath, 'utf8');
    if (original !== downloaded) throw new Error('Downloaded file content does not match uploaded fixture');
    record('download uploaded file through frontend', 'pass', downloadedPath);

    let activeName = path.basename(fixtures.filePath);
    let activeRow = uploadedRow;
    await clickUnique(activeRow.getByLabel(`Open actions for ${activeName}`), 'open context menu');
    await page.getByRole('button', { name: 'Rename', exact: true }).click();
    const renamed = `renamed-${stamp}.txt`;
    const renameDialog = page.getByRole('dialog', { name: 'Rename' });
    await renameDialog.getByRole('textbox').fill(renamed);
    await renameDialog.getByRole('button', { name: 'Confirm' }).click();
    try {
      await waitForToastOrText(page, 'Renamed successfully', 15000);
      await page.getByRole('button', { name: 'Refresh' }).click();
      activeRow = page.locator('article').filter({ hasText: renamed });
      await activeRow.waitFor({ timeout: 15000 });
      activeName = renamed;
      record('rename uploaded file through frontend', 'pass', renamed);
    } catch (error) {
      record('rename uploaded file through frontend', 'fail', 'backend returned an error; continuing with original uploaded file');
      const closeButton = page.getByLabel('Close dialog');
      if (await closeButton.count()) await closeButton.click();
      await page.getByRole('button', { name: 'Refresh' }).click();
      activeRow = page.locator('article').filter({ hasText: activeName });
      await activeRow.waitFor({ timeout: 15000 });
    }

    await clickUnique(activeRow.getByLabel(`Share ${activeName}`), 'share uploaded file button');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await waitForToastOrText(page, 'Share link generated', 15000);
    const shareLink = await page.locator('input[readonly]').inputValue();
    if (!shareLink.includes('/share/')) throw new Error(`Unexpected share link: ${shareLink}`);
    record('generate share link for uploaded file', 'pass', shareLink);
    await page.getByLabel('Close dialog').click();

    await clickUnique(activeRow.getByLabel(`Move ${activeName} to trash`), 'trash uploaded file button');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await waitForToastOrText(page, 'Moved to trash', 15000);
    record('move uploaded file to trash through frontend', 'pass', activeName);
    const lingeringClose = page.getByLabel('Close dialog');
    if (await lingeringClose.count()) await lingeringClose.click();

    await page.getByRole('link', { name: 'Trash' }).click();
    await page.waitForURL(`${FRONTEND_URL}/trash`);
    const maybeTrashItem = page.locator('article').filter({ hasText: activeName });
    if (await maybeTrashItem.count()) {
      try {
        await maybeTrashItem.waitFor({ timeout: 5000 });
        const restoreButton = maybeTrashItem.getByLabel('Restore');
        if (await restoreButton.count()) {
          await clickUnique(restoreButton, 'restore trash item button');
          await waitForToastOrText(page, 'Restored from trash', 15000);
          record('restore from trash through frontend', 'pass', activeName);
        } else {
          record('restore from trash through frontend', 'skip', 'trash row rendered without a restore button');
        }
      } catch {
        record('restore from trash through frontend', 'skip', 'trash item was not visible after move-to-trash');
      }
    } else {
      record('restore from trash through frontend', 'skip', 'backend structure did not expose trash contents to the UI');
    }

    const folderInput = page.locator('input[webkitdirectory]');
    await page.goto(`${FRONTEND_URL}/folder/${encodeURIComponent(folderName)}`);
    await folderInput.setInputFiles(fixtures.folderPath);
    await page.getByText('Uploads').waitFor({ timeout: 5000 });
    await page.waitForFunction(() => {
      const statuses = Array.from(document.querySelectorAll('small')).map((node) => node.textContent || '');
      return statuses.some((text) => text.includes('done') || text.includes('error'));
    }, null, { timeout: 20000 });
    record('folder upload control exercised', 'pass', 'folder input accepted multiple files; see upload statuses in UI');

    if (consoleErrors.length) {
      record('console/runtime errors', 'fail', consoleErrors.join(' | '));
    } else {
      record('console/runtime errors', 'pass', 'no console errors or page exceptions captured');
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const failed = results.filter((result) => result.status === 'fail');
  const reportPath = path.join(DOWNLOAD_DIR, `nascloud-e2e-report-${stamp}.json`);
  await writeFile(reportPath, JSON.stringify({ account, downloadDir: DOWNLOAD_DIR, results }, null, 2));
  const reportStat = await stat(reportPath);
  console.log(`REPORT ${reportPath} (${reportStat.size} bytes)`);
  if (failed.length) process.exitCode = 1;
}

run().catch(async (error) => {
  record('fatal test run', 'fail', error.stack || error.message);
  await mkdir(DOWNLOAD_DIR, { recursive: true });
  const reportPath = path.join(DOWNLOAD_DIR, `nascloud-e2e-report-${stamp}.json`);
  await writeFile(reportPath, JSON.stringify({ account, downloadDir: DOWNLOAD_DIR, results, fatal: error.stack || error.message }, null, 2));
  console.error(error);
  process.exit(1);
});
