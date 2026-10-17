const { chromium, devices } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const URL = process.env.GAME_URL || 'http://127.0.0.1:3000/';
const ROOT = path.resolve(__dirname, '..');
const failures = [];
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; console.log('PASS', message); }

(async () => {
 const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
 try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.on('pageerror', e => failures.push(e.message));
  await page.goto(URL + '?test=1');
  await page.evaluate(() => document.fonts.ready);
  check(await page.title() === 'Pillow Panic — Yanivo vs. Elish', 'Game loads with the correct title');
  check(await page.locator('#lobby .face').count() === 2, 'Both real-photo characters are present');
  check(await page.locator('img').evaluateAll(imgs => imgs.every(i => i.complete && i.naturalWidth > 0)), 'Embedded face images decode');
  check(await page.locator('#chooseYanivo').getAttribute('aria-pressed') === 'true', 'Yanivo is initially selected');
  await page.screenshot({ path: path.join(__dirname, 'desktop-lobby.png'), fullPage: true });
  await page.click('#chooseElish');
  check(await page.locator('#chooseElish .role-chip').innerText() === 'YOU', 'Elish can be selected');
  check(await page.locator('#chooseYanivo .role-chip').innerText() === 'COMPUTER', 'Unselected character becomes the computer');
  await page.click('#startButton');
  check(await page.locator('#bonkButton').isDisabled(), 'Attacks are disabled during the countdown');
  await page.evaluate(() => { Math.random = () => .99; window.__pillowTest.step(3.5); window.__pillowTest.state.nextAi = 1000; });
  check(await page.locator('#bonkButton').isEnabled(), 'Controls unlock after the countdown');
  check(await page.locator('#playerName').innerText() === 'Elish' && await page.locator('#enemyName').innerText() === 'Yanivo', 'Chosen character is YOU in the arena');
  await page.screenshot({ path: path.join(__dirname, 'desktop-game.png'), fullPage: true });
  await page.click('#bonkButton');
  await page.evaluate(() => window.__pillowTest.step(.31));
  check(await page.locator('#playerScore').innerText() === '1', 'Clicking BONK lands a point');
  const cooldown = await page.evaluate(() => window.__pillowTest.state.actors.player.attackReady);
  await page.click('#bonkButton', {force:true});
  check(await page.evaluate(() => window.__pillowTest.state.actors.player.attackReady) === cooldown, 'Attack cooldown prevents button mashing');
  await page.evaluate(() => window.__pillowTest.step(.8));
  await page.keyboard.press('Space');
  await page.evaluate(() => window.__pillowTest.step(.31));
  check(await page.locator('#playerScore').innerText() === '2', 'Keyboard Space also bonks');
  await page.evaluate(() => window.__pillowTest.step(.55));
  await page.click('#duckButton');
  await page.evaluate(() => window.__pillowTest.point('enemy'));
  check(await page.locator('#enemyScore').innerText() === '0', 'A duck blocks the computer’s hit');
  check(await page.evaluate(() => window.__pillowTest.state.dodges) === 1, 'Successful dodges are counted');
  await page.evaluate(() => { const t = window.__pillowTest; t.step(.9); t.point('enemy'); });
  check(await page.locator('#enemyScore').innerText() === '1', 'Unprotected hits score for the computer');
  await page.evaluate(() => { const t = window.__pillowTest; t.state.actors.player.duckReady = 0; t.state.nextAi = t.state.t + .01; t.step(.02); });
  check(await page.locator('#enemyFighter').getAttribute('class').then(x => x.includes('telegraph')), 'AI visibly warns before swinging');
  await page.click('#duckButton');
  await page.evaluate(() => window.__pillowTest.step(.8));
  check(await page.locator('#enemyScore').innerText() === '1', 'Ducking on the warning blocks the AI’s actual swing');
  await page.click('#pauseButton');
  const pausedTime = await page.evaluate(() => window.__pillowTest.state.remaining);
  await page.waitForTimeout(250);
  check(await page.evaluate(() => window.__pillowTest.state.remaining) === pausedTime, 'Pause freezes the clock');
  await page.keyboard.press('Escape');
  check(!(await page.evaluate(() => window.__pillowTest.state.paused)), 'Escape resumes the game');
  await page.click('#howButton');
  check(await page.locator('#howOverlay').isVisible() && await page.evaluate(() => window.__pillowTest.state.paused), 'Opening instructions pauses an active round');
  await page.click('#gotItButton');
  check(await page.locator('#howOverlay').isHidden() && !(await page.evaluate(() => window.__pillowTest.state.paused)), 'Closing instructions resumes the round');
  await page.evaluate(() => { const t = window.__pillowTest; t.state.score = {player: 9, enemy: 4}; t.state.t = 32.99; t.step(.03); });
  check(await page.locator('#resultTitle').innerText() === 'Elish wins!', 'Round ends and the correct winner is announced');
  check(await page.locator('#resultPlayerScore').innerText() === '9', 'Result screen has the correct score');
  check(await page.locator('#resultBadgeText').innerText() === 'NEW PERSONAL BEST', 'Personal best is saved');
  await page.screenshot({ path: path.join(__dirname, 'desktop-result.png'), fullPage: true });
  await page.click('#replayButton');
  check(await page.locator('#playerScore').innerText() === '0' && await page.locator('#timeLeft').innerText() === '30', 'Replay resets timer and scores');
  check(await page.locator('#playerName').innerText() === 'Elish', 'Replay preserves the chosen fighter');
  await page.evaluate(() => { const t = window.__pillowTest; t.state.score = {player: 1, enemy: 5}; t.finishMatch(); });
  check(await page.locator('#resultTitle').innerText() === 'Yanivo wins!', 'Computer wins are named correctly');
  await page.click('#replayButton');
  await page.evaluate(() => { const t = window.__pillowTest; t.state.score = {player: 2, enemy: 2}; t.finishMatch(); });
  check(await page.locator('#resultTitle').innerText() === 'A fluffy draw!', 'Ties are handled');
  await page.click('#switchButton');
  check(await page.locator('#lobby').isVisible(), 'Switch sides returns to character selection');
  await page.click('#soundButton');
  check(await page.locator('#soundButton').getAttribute('aria-label') === 'Unmute sound', 'Sound can be muted');
  await page.reload();
  check(await page.locator('#soundButton').getAttribute('aria-label') === 'Unmute sound' && await page.locator('#chooseElish').getAttribute('aria-pressed') === 'true', 'Sound and character selection persist');
  await page.close();

  // Touch controls and responsive layouts, including small phones and tablet widths.
  for (const [width,height] of [[320,568],[360,640],[390,664],[390,844],[430,932],[768,1024],[844,390]]) {
   const mobile = await browser.newPage({ viewport: {width,height}, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
   mobile.on('pageerror', e => failures.push(e.message));
   await mobile.goto(URL + '?test=1');
   check(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}×${height}`);
   if (width===390 && height===844) await mobile.screenshot({path:path.join(__dirname,'mobile-lobby.png'),fullPage:true});
   await mobile.tap('#chooseElish'); await mobile.tap('#startButton');
   await mobile.evaluate(() => { const t=window.__pillowTest; Math.random=()=>.99; t.step(3.5); t.state.nextAi=1000; });
   const metrics=await mobile.evaluate(()=>({view:innerHeight,top:document.getElementById('bonkButton').getBoundingClientRect().top,bottom:document.getElementById('bonkButton').getBoundingClientRect().bottom,width:document.documentElement.scrollWidth}));
   check(metrics.bottom <= height+1 && metrics.top>0, `Both touch buttons are on-screen at ${width}×${height}`);
   await mobile.tap('#bonkButton');await mobile.evaluate(()=>window.__pillowTest.step(.31));
   check(await mobile.locator('#playerScore').innerText()==='1', `Real touch input scores at ${width}×${height}`);
   if (width===390 && height===844) {
    await mobile.screenshot({path:path.join(__dirname,'mobile-game.png'),fullPage:true});
    await mobile.evaluate(()=>{const t=window.__pillowTest;t.state.score={player:12,enemy:6};t.finishMatch();});
    await mobile.waitForTimeout(350); await mobile.screenshot({path:path.join(__dirname,'mobile-result.png'),fullPage:true});
   } else {
    await mobile.evaluate(()=>{const t=window.__pillowTest;t.state.score={player:3,enemy:1};t.finishMatch();});
   }
   const replayBox=await mobile.locator('#replayButton').boundingBox();
   check(replayBox.y>=0 && replayBox.y+replayBox.height<=height,`Replay is visible at ${width}×${height}`);
   await mobile.close();
  }

  // Local standalone file, with the network explicitly unavailable.
  const offline = await browser.newContext({offline:true,viewport:{width:1200,height:900}});
  const filePage=await offline.newPage();filePage.on('pageerror',e=>failures.push(e.message));
  await filePage.goto('file://'+path.join(ROOT,'Pillow-Panic.html')+'?test=1');
  await filePage.evaluate(()=>document.fonts.ready);
  check(await filePage.locator('.face').evaluateAll(xs=>xs.every(i=>i.complete&&i.naturalWidth>0)),'Downloaded standalone file renders its photos offline');
  await filePage.click('#startButton');await filePage.evaluate(()=>window.__pillowTest.step(3.5));
  check(await filePage.locator('#bonkButton').isEnabled(),'Standalone file runs offline');
  await offline.close();

  // Arena’s document viewer uses an opaque-origin iframe with scripts only.
  const sandbox=await browser.newPage({viewport:{width:420,height:750}});sandbox.on('pageerror',e=>failures.push(e.message));
  await sandbox.setContent('<iframe id="game" sandbox="allow-scripts" style="border:0;width:390px;height:700px"></iframe>');
  await sandbox.evaluate(html=>document.getElementById('game').srcdoc=html,fs.readFileSync(path.join(ROOT,'index.html'),'utf8'));
  const frame=sandbox.frameLocator('#game');await frame.locator('#chooseElish').click();await frame.locator('#startButton').click();
  await frame.locator('#bonkButton').waitFor({state:'visible'});await sandbox.waitForTimeout(3500);
  check(await frame.locator('#bonkButton').isEnabled(),'Game works in a scripts-only, opaque-origin preview');
  await frame.locator('#pauseButton').click();
  check(await frame.locator('#pauseOverlay').isVisible(),'Pause works inside the sandboxed file preview');
  await sandbox.close();

  // A full, unaccelerated round to verify the actual timer and autonomous AI.
  const real=await browser.newPage({viewport:{width:1100,height:900}});real.on('pageerror',e=>failures.push(e.message));
  await real.goto(URL+'?test=1');await real.click('#startButton');const began=Date.now();
  await real.waitForFunction(()=>window.__pillowTest.state.phase==='finished',null,{timeout:40000});
  const elapsed=(Date.now()-began)/1000;
  check(elapsed>=32.5&&elapsed<39,'A complete countdown + 30-second round ends on time');
  check(await real.evaluate(()=>window.__pillowTest.state.score.enemy)>0,'Autonomous AI lands hits without user input');
  await real.close();
  check(failures.length===0,'No uncaught JavaScript errors in desktop, mobile, offline, or sandboxed play');
  fs.writeFileSync(path.join(__dirname,'test-report.json'),JSON.stringify({checks,failures,status:'passed',testedAt:new Date().toISOString()},null,2));
  console.log(`\n${checks} checks passed.`);
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
