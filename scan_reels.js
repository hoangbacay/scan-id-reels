const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Hàm chuẩn hóa URL
function normalizeUrl(inputUrl) {
  let url = inputUrl.trim();
  if (url.includes('facebook.com')) {
    let cleanUrl = url.split('?')[0];
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    
    if (url.includes('profile.php')) {
      if (!url.includes('sk=reels')) {
        url = url.includes('?') ? `${url}&sk=reels` : `${url}?sk=reels`;
      }
    } else {
      try {
        const parsed = new URL(cleanUrl);
        const paths = parsed.pathname.split('/').filter(Boolean);
        if (paths.length > 0 && !paths.includes('reels')) {
          url = `${parsed.origin}/${paths[0]}/reels/`;
        }
      } catch (e) {
        if (!url.endsWith('/reels') && !url.endsWith('/reels/')) {
          url = url.endsWith('/') ? `${url}reels/` : `${url}/reels/`;
        }
      }
    }
  }
  return url;
}

// Hàm lấy ngày đăng của Reel từ HTML thô (Bằng cách lấy UNIX creation_time)
async function getReelCreationTime(context, url) {
  const page = await context.newPage();
  try {
    // Chặn tải các tài nguyên nặng (hình ảnh, video, css, font) để tăng tốc độ load tối đa
    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Chờ 1.5 giây để trang nạp các script metadata của Facebook
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const html = await page.content();
    const matches = html.match(/"creation_time"\s*:\s*(\d{10})/);
    if (matches) {
      return parseInt(matches[1], 10);
    }
  } catch (e) {
    // Bỏ qua lỗi kết nối nhỏ
  } finally {
    await page.close();
  }
  return null;
}

// Hàm chuyển đổi ngày từ định dạng người dùng (hỗ trợ DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
function parseUserDate(dateStr) {
  if (!dateStr) return null;
  
  // Regex kiểm tra dạng DD/MM/YYYY hoặc DD-MM-YYYY
  const regex = /^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/;
  const match = dateStr.trim().match(regex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Tháng trong JS bắt đầu từ 0
    const year = parseInt(match[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Thử parse bằng hàm Date mặc định (hỗ trợ YYYY-MM-DD)
  const fallbackDate = new Date(dateStr.trim());
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate;
  }
  
  return null;
}

async function run() {
  const rawUrl = process.argv[2];
  if (!rawUrl) {
    console.error("\n[LỖI] Vui lòng cung cấp URL trang Reels. Ví dụ:\nnode scan_reels.js https://www.facebook.com/n63.decor/reels/\n");
    process.exit(1);
  }

  const url = normalizeUrl(rawUrl);

  // Phân tích tham số ngày lọc --since và --until
  const sinceIndex = process.argv.indexOf('--since');
  const untilIndex = process.argv.indexOf('--until');
  
  let sinceDate = null;
  let untilDate = null;
  
  if (sinceIndex !== -1 && process.argv[sinceIndex + 1]) {
    sinceDate = parseUserDate(process.argv[sinceIndex + 1]);
    if (!sinceDate) {
      console.error("[LỖI] Định dạng ngày --since không hợp lệ. Vui lòng dùng định dạng ngày Việt Nam DD/MM/YYYY (Ví dụ: 09/06/2026)");
      process.exit(1);
    }
    sinceDate.setHours(0, 0, 0, 0); // Bắt đầu ngày
  }
  
  if (untilIndex !== -1 && process.argv[untilIndex + 1]) {
    untilDate = parseUserDate(process.argv[untilIndex + 1]);
    if (!untilDate) {
      console.error("[LỖI] Định dạng ngày --until không hợp lệ. Vui lòng dùng định dạng ngày Việt Nam DD/MM/YYYY (Ví dụ: 11/06/2026)");
      process.exit(1);
    }
    untilDate.setHours(23, 59, 59, 999); // Cuối ngày
  }

  console.log(`\n==================================================`);
  console.log(`[BẮT ĐẦU] Quét Reels từ URL: ${url}`);
  if (sinceDate || untilDate) {
    console.log(`[BỘ LỌC THỜI GIAN ĐÃ BẬT]:`);
    if (sinceDate) console.log(`  - Từ ngày (Since) : ${sinceDate.toLocaleDateString('vi-VN')} (Bao gồm)`);
    if (untilDate) console.log(`  - Đến ngày (Until) : ${untilDate.toLocaleDateString('vi-VN')} (Bao gồm)`);
  }
  console.log(`==================================================`);
  
  let browser;
  let isHeadless = process.argv.includes('--headless');

  try {
    console.log(`[1/4] Đang khởi chạy trình duyệt (${isHeadless ? 'Ẩn danh' : 'Hiển thị'})...`);
    browser = await chromium.launch({
      headless: isHeadless,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });
  } catch (error) {
    if (!isHeadless) {
      console.log("[LƯU Ý] Không khởi chạy được trình duyệt hiển thị giao diện. Đang tự động chuyển sang chế độ ẩn danh (headless)...");
      browser = await chromium.launch({
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      });
    } else {
      throw error;
    }
  }

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'vi-VN',
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();
  
  try {
    console.log("[2/4] Đang kết nối tới trang Reels...");
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log("[3/4] Chờ trang tải đầy đủ trong 5 giây...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Thực hiện ẩn các modal đăng nhập / chặn cuộn nếu có để có thể cuộn tự do
    console.log("[4/4] Áp dụng cấu hình bypass màn hình chặn đăng nhập & Bắt đầu quét...");
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.id = 'bypass-fb-login-overlay';
      style.innerHTML = `
        div[role="dialog"], 
        div[class*="login"], 
        div[id*="login"],
        div[style*="position: fixed"][style*="z-index:"] { 
          display: none !important; 
        }
        html, body { 
          overflow: auto !important; 
          overflow-y: auto !important;
          height: auto !important; 
          position: relative !important; 
        }
      `;
      document.head.appendChild(style);
    });
    
    let lastHeight = await page.evaluate('document.body.scrollHeight');
    let noChangeCount = 0;
    let scrollCount = 0;
    const allReelIds = new Set();
    const reelsMetadataMap = new Map(); // id -> { id, url, date }

    const MAX_SCROLLS = 80;
    let stopScanning = false;

    while (scrollCount < MAX_SCROLLS && !stopScanning) {
      scrollCount++;
      
      // Cuộn xuống cuối trang
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      
      // Chờ nội dung mới tải
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Quét DOM hiện tại để lấy các Reels link
      const pageReels = await page.evaluate(() => {
        const results = [];
        const anchors = document.querySelectorAll('a');
        
        anchors.forEach(a => {
          const href = a.href;
          if (!href) return;
          
          let id = null;
          let match = href.match(/\/reel\/(\d+)/);
          if (match) {
            id = match[1];
          } else {
            match = href.match(/\/reels\/videos\/(\d+)/);
            if (match) {
              id = match[1];
            } else {
              match = href.match(/\/watch\/\?v=(\d+)/);
              if (match) id = match[1];
            }
          }
          
          if (id) {
            results.push({ id, url: `https://www.facebook.com/reel/${id}` });
          }
        });
        return results;
      });

      // Lọc các Reels mới tìm được ở lượt cuộn này
      const newReelsInThisScroll = [];
      pageReels.forEach(reel => {
        if (!allReelIds.has(reel.id)) {
          allReelIds.add(reel.id);
          newReelsInThisScroll.push(reel);
        }
      });

      if (newReelsInThisScroll.length > 0) {
        console.log(`\nLượt cuộn ${scrollCount}: Phát hiện thêm +${newReelsInThisScroll.length} Reels mới. Đang kiểm tra ngày đăng...`);
        
        // Quét ngày đăng từng Reels mới
        for (const reel of newReelsInThisScroll) {
          const timestamp = await getReelCreationTime(context, reel.url);
          
          if (timestamp) {
            const date = new Date(timestamp * 1000);
            reel.date = date;
            reel.dateStr = date.toISOString().substring(0, 10);
            reelsMetadataMap.set(reel.id, reel);
            console.log(`  + Reel ${reel.id}: Đăng ngày ${date.toLocaleDateString('vi-VN')} (${reel.dateStr})`);

            // Nếu ngày đăng cũ hơn mốc 'sinceDate' (ngày bắt đầu quét ngược về trước)
            // Ví dụ: Lọc từ 9/6 đến 11/6. Gặp video ngày 8/6 => Video cũ quá rồi, dừng quét!
            if (sinceDate && date < sinceDate) {
              console.log(`[INFO] Phát hiện Reel đăng ngày ${reel.dateStr} nằm trước ngày giới hạn lọc (${process.argv[sinceIndex + 1]}). Dừng cuộn thêm.`);
              stopScanning = true;
              break;
            }
          } else {
            // Nếu không quét được timestamp, giữ lại thông tin cơ bản để tránh sót
            reelsMetadataMap.set(reel.id, reel);
            console.log(`  + Reel ${reel.id}: Không trích xuất được ngày đăng (tạm thời giữ lại).`);
          }
        }
      } else {
        console.log(`Lượt cuộn ${scrollCount}: Không phát hiện Reels mới.`);
      }

      if (stopScanning) break;

      // Kiểm tra chiều cao trang để dừng lại nếu đã cuộn hết trang
      const newHeight = await page.evaluate('document.body.scrollHeight');
      if (newHeight === lastHeight) {
        noChangeCount++;
        if (noChangeCount >= 4) {
          console.log(`[INFO] Trang đã hết nội dung.`);
          break;
        }
      } else {
        noChangeCount = 0;
      }
      lastHeight = newHeight;
      
      // Bypass login overlay lại nếu xuất hiện thêm
      await page.evaluate(() => {
        if (!document.getElementById('bypass-fb-login-overlay')) {
          const style = document.createElement('style');
          style.id = 'bypass-fb-login-overlay';
          style.innerHTML = `
            div[role="dialog"] { display: none !important; }
            html, body { overflow: auto !important; overflow-y: auto !important; height: auto !important; }
          `;
          document.head.appendChild(style);
        }
      });
    }

    // Tiến hành lọc danh sách cuối cùng theo khoảng thời gian
    const finalReels = [];
    for (const id of allReelIds) {
      const reel = reelsMetadataMap.get(id);
      if (!reel) continue;

      let keep = true;
      if (reel.date) {
        if (sinceDate && reel.date < sinceDate) keep = false;
        if (untilDate && reel.date > untilDate) keep = false;
      }
      
      if (keep) {
        finalReels.push(reel);
      }
    }

    // Ghi kết quả ra file
    if (finalReels.length === 0) {
      console.log("\n[CẢNH BÁO] Không tìm thấy video Reels nào trong khoảng thời gian yêu cầu.");
    } else {
      const outputDir = path.join(__dirname, 'output');
      const date = new Date();
      const pad = (num) => String(num).padStart(2, '0');
      
      const dateFolder = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
      const targetDir = path.join(outputDir, dateFolder);
      
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      let pageName = 'reels';
      try {
        const parsedUrl = new URL(url);
        const paths = parsedUrl.pathname.split('/').filter(Boolean);
        if (paths.length > 0) {
          pageName = paths[0] === 'reels' ? (paths[1] || 'reels') : paths[0];
        }
      } catch (e) {}

      const timestamp = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
      const txtAllPath = path.join(targetDir, `${pageName}_${timestamp}_ids_all.txt`);

      const allIds = finalReels.map(r => r.id);
      fs.writeFileSync(txtAllPath, allIds.join('\n'), 'utf-8');

      const CHUNK_SIZE = 50;
      const partFiles = [];
      
      if (allIds.length > CHUNK_SIZE) {
        for (let i = 0; i < allIds.length; i += CHUNK_SIZE) {
          const chunk = allIds.slice(i, i + CHUNK_SIZE);
          const partNum = Math.floor(i / CHUNK_SIZE) + 1;
          const partPath = path.join(targetDir, `${pageName}_${timestamp}_ids_part${partNum}.txt`);
          fs.writeFileSync(partPath, chunk.join('\n'), 'utf-8');
          partFiles.push({
            part: partNum,
            path: partPath,
            count: chunk.length
          });
        }
      }

      console.log(`\n==================================================`);
      console.log(`[HOÀN THÀNH] Quét thành công: ${finalReels.length} Reels phù hợp khoảng thời gian!`);
      console.log(`- File danh sách ID: ${txtAllPath}`);
      if (partFiles.length > 0) {
        console.log(`\nĐã chia nhỏ thành ${partFiles.length} file (mỗi file tối đa 50 ID):`);
        partFiles.forEach(file => {
          console.log(`  + [Phần ${file.part}] (${file.count} ID): ${file.path}`);
        });
      }
      console.log(`==================================================\n`);
    }

  } catch (error) {
    console.error("[LỖI] Đã xảy ra lỗi trong quá trình quét:", error);
  } finally {
    await browser.close();
  }
}

run();
