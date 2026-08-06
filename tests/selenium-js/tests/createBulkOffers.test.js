const { expect } = require('chai');
const faker = require('faker');
const path = require('path');
const fs = require('fs');
const { createDriver } = require('../utils/driverFactory');
const P2PPage = require('../pages/P2PPage');
const config = require('../config/config');

describe('Create Bulk Offers', function() {
  let driver;
  let p2pPage;
  const numberOfOffers = config.numberOfOffers || 500;

  // Tăng timeout lên 100 phút cho 500 offers
  this.timeout(6000000);

  before(async function() {
    this.timeout(120000); // 2 phút để login thủ công
    
    console.log(`\n🚀 Starting: Create ${numberOfOffers} Offers Automatically`);
    console.log(`📍 Testing against: ${config.baseUrl}`);
    
    driver = await createDriver();
    p2pPage = new P2PPage(driver);
    
    await p2pPage.navigate();
    
    console.log('\n⏸️  VUI LÒNG ĐĂNG NHẬP THỦ CÔNG...');
    console.log('💡 Bạn có 90 giây để hoàn tất đăng nhập trước khi script bắt đầu.');
    
    // Chờ cho đến khi URL thay đổi hoặc hết 90s (Login thành công)
    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/p2p') || url.includes('/dashboard');
    }, 90000, 'Hết thời gian chờ đăng nhập!');
    
    console.log('✅ Đã nhận diện đăng nhập. Bắt đầu tiến trình tạo offer...');
  });

  // HÀM afterEach SỬA LỖI takeScreenshot
  afterEach(async function() {
    if (this.currentTest.state === 'failed') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(config.screenshotPath || './screenshots', `error_${timestamp}.png`);
      
      try {
        // Sử dụng driver trực tiếp để tránh lỗi p2pPage.takeScreenshot is not a function
        const image = await driver.takeScreenshot();
        const dir = path.dirname(screenshotPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(screenshotPath, image, 'base64');
        console.log(`  📸 Screenshot lỗi đã lưu: ${screenshotPath}`);
      } catch (err) {
        console.error('  ❌ Không thể chụp ảnh màn hình:', err.message);
      }
    }
  });

  after(async function() {
    if (driver) {
      console.log('\n🏁 Tất cả đã hoàn tất. Đóng trình duyệt sau 5 giây...');
      await new Promise(res => setTimeout(res, 5000));
      await driver.quit();
    }
  });

  it('should create 500 offers automatically', async function() {
    let results = { success: 0, failed: 0 };
    let failedOffers = [];

    for (let i = 0; i < numberOfOffers; i++) {
      // --- KHAI BÁO DỮ LIỆU OFFER TẠI ĐÂY (Sửa lỗi ReferenceError) ---
      const offerData = {
        side: 'SELL',
        price_rate: (0.1).toString(), // Giá tăng dần nhẹ để dễ phân biệt
        amount: '1',
        limit: { 
          min: '1', 
          max: '1' 
        },
        bank_info: {
          account_number: '123456789',
          account_name: `AUTO TEST ${i + 1}`
        }
      };

      console.log(`\n--------------------------------------------`);
      console.log(`🚀 [${i + 1}/${numberOfOffers}] Đang tạo: ${offerData.bank_info.account_name}`);

      try {
        // Gọi hàm tạo offer
        const isSuccess = await p2pPage.createOffer(offerData);

        if (isSuccess) {
          console.log(`✅ THÀNH CÔNG #${i + 1}`);
          results.success++;
        } else {
          console.log(`❌ THẤT BẠI #${i + 1}`);
          results.failed++;
          failedOffers.push({ index: i + 1, data: offerData, reason: 'Hệ thống báo lỗi hoặc không thấy toast thành công' });
        }
      } catch (error) {
        console.error(`🔥 LỖI NGHIÊM TRỌNG tại #${i + 1}:`, error.message);
        results.failed++;
        failedOffers.push({ index: i + 1, data: offerData, reason: error.message });
      }

      // Nghỉ ngắn để tránh treo trình duyệt (GPU error) và bị rate limit
      await driver.sleep(1000);
      
      // Log báo cáo nhanh mỗi 10 offer
      if ((i + 1) % 10 === 0) {
        console.log(`\n📊 TỔNG KẾT TẠM THỜI: Thành công ${results.success} | Thất bại ${results.failed}`);
      }
    }

    // --- BÁO CÁO CUỐI CÙNG ---
    console.log('\n' + '='.repeat(40));
    console.log('🏆 KẾT QUẢ CHẠY BULK OFFERS');
    console.log(`✔️ Tổng số thành công: ${results.success}`);
    console.log(`✖️ Tổng số thất bại: ${results.failed}`);
    console.log('='.repeat(40));

    if (failedOffers.length > 0) {
      const reportPath = path.join(config.screenshotPath || './screenshots', 'failed_report.json');
      fs.writeFileSync(reportPath, JSON.stringify(failedOffers, null, 2));
      console.log(`📝 Danh sách lỗi đã lưu tại: ${reportPath}`);
    }

    expect(results.success).to.be.at.least(1, 'Phải tạo được ít nhất 1 offer thành công');
  });
});