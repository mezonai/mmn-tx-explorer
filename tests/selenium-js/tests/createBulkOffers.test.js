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

  // Set timeout for all tests - increased for 500 offers
  // ~10 seconds per offer = 5000 seconds = 83 minutes
  this.timeout(6000000); // 100 minutes

  before(async function() {
    // Increase timeout for before hook to allow manual login
    this.timeout(120000); // 2 minutes
    
    console.log(`\n🚀 Starting: Create ${numberOfOffers} Offers Automatically`);
    console.log(`📍 Testing against: ${config.baseUrl}`);
    
    driver = await createDriver();
    p2pPage = new P2PPage(driver);
    
    // Navigate to app and wait for MANUAL login
    console.log('\n⏸️  Please login manually in the browser window...');
    console.log('💡 You have 90 seconds to complete the login');
    console.log('📧 1. Enter your email: ' + (config.testEmail || 'your email'));
    console.log('📧 2. Get OTP from your email');
    console.log('🔑 3. Enter OTP and login');
    console.log('⏰ Waiting...\n');
    
    await p2pPage.navigate();
    
    // Wait 90 seconds for manual login
    await driver.sleep(90000);
    
    console.log(`\n✅ Login complete! Starting to create ${numberOfOffers} offers...\n`);
  });

  after(async function() {
    console.log('\n🏁 All offers created!');
    console.log('🌐 Browser will stay open - close it manually when done\n');
    
    // Don't close browser - let user close manually
  });

  beforeEach(async function() {
    if (!p2pPage) {
      p2pPage = new P2PPage(driver);
    }
  });

  afterEach(async function() {
    if (this.currentTest.state === 'failed' && config.screenshotOnFailure) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(
        config.screenshotPath,
        `${this.currentTest.title}_${timestamp}.png`
      );
      await p2pPage.takeScreenshot(screenshotPath);
      console.log(`\nScreenshot saved: ${screenshotPath}`);
    }
  });

  // Create offers automatically
  it(`should create ${numberOfOffers} offers automatically`, async function() {
    this.timeout(6000000); // 100 minutes for 500 offers
    
    const banks = ['MB', 'VCB', 'TCB', 'ACB', 'VPB', 'TPB', 'SCB'];
    const sides = ['SELL', 'BUY'];
    let successCount = 0;
    let failCount = 0;
    const failedOffers = []; // Track failed offers with details

    for (let i = 1; i <= numberOfOffers; i++) {
      try {
        console.log(`\n📝 Creating offer ${i}/${numberOfOffers}...`);
        
        // Navigate to P2P page
        await p2pPage.navigate();
        await driver.sleep(1000);
        
        // Simple offer data as specified
        const offerData = {
          side: 'SELL',
          amount: 1,
          price_rate: '0.1',
          limit: { min: 1, max: 1 },
          symbol: 'MZD',
          bank_info: {
            bank: 'MB',
            account_name: faker.name.findName(),
            account_number: faker.finance.account(10)
          }
        };

        console.log(`   Type: ${offerData.side}, Amount: ${offerData.amount}, Rate: ${offerData.price_rate}, Limits: ${offerData.limit.min}-${offerData.limit.max}`);
        console.log(`   Bank: ${offerData.bank_info.bank}, Account: ${offerData.bank_info.account_name}`);
        
        // Take screenshot before filling
        await p2pPage.takeScreenshot(`./screenshots/before_fill_${i}.png`);
        
        console.log('   🔄 Opening modal and filling form...');
        
        // Create the offer with retry logic
        let success = false;
        let retries = 0;
        const maxRetries = 2;
        
        while (!success && retries <= maxRetries) {
          try {
            if (retries > 0) {
              console.log(`   🔄 Retry attempt ${retries}/${maxRetries}...`);
              await driver.sleep(2000);
            }
            
            success = await p2pPage.createOffer(offerData);
            
            if (!success && retries < maxRetries) {
              console.log(`   ⚠️  Attempt failed, will retry...`);
              // Refresh page and try again
              await p2pPage.navigate();
              await driver.sleep(2000);
            }
            
            retries++;
          } catch (error) {
            console.error(`   ❌ Error in attempt ${retries}: ${error.message}`);
            retries++;
            if (retries <= maxRetries) {
              await p2pPage.navigate();
              await driver.sleep(2000);
            }
          }
        }
        
        // Take screenshot after attempt
        await p2pPage.takeScreenshot(`./screenshots/after_attempt_${i}.png`);
        
        if (success) {
          successCount++;
          console.log(`   ✅ Offer ${i}/${numberOfOffers} created! (Success: ${successCount}, Failed: ${failCount})`);
        } else {
          failCount++;
          
          // Capture browser console logs for failed offer
          const browserLogs = await driver.manage().logs().get('browser');
          const recentLogs = browserLogs.slice(-20); // Get last 20 logs
          
          failedOffers.push({
            offerNumber: i,
            data: offerData,
            timestamp: new Date().toISOString(),
            browserLogs: recentLogs.map(log => ({
              level: log.level.name,
              message: log.message,
              timestamp: new Date(log.timestamp).toISOString()
            })),
            screenshotPath: `./screenshots/after_attempt_${i}.png`
          });
          
          console.log(`   ❌ Offer ${i}/${numberOfOffers} failed! (Success: ${successCount}, Failed: ${failCount})`);
          console.log(`   📋 Failed offer details saved`);
        }
        
        // Wait between offers to let page stabilize
        await driver.sleep(3000);
        
      } catch (error) {
        failCount++;
        
        // Capture browser console logs for exception
        let browserLogs = [];
        try {
          const logs = await driver.manage().logs().get('browser');
          browserLogs = logs.slice(-20).map(log => ({
            level: log.level.name,
            message: log.message,
            timestamp: new Date(log.timestamp).toISOString()
          }));
        } catch (logError) {
          console.error('   ⚠️  Could not get browser logs:', logError.message);
        }
        
        failedOffers.push({
          offerNumber: i,
          data: offerData,
          timestamp: new Date().toISOString(),
          error: {
            message: error.message,
            stack: error.stack
          },
          browserLogs: browserLogs,
          screenshotPath: `offer_${i}_error_${new Date().toISOString().replace(/[:.]/g, '-')}.png`
        });
        
        console.error(`   ❌ Error creating offer ${i}/${numberOfOffers}:`, error.message);
        console.log(`   (Success: ${successCount}, Failed: ${failCount})`);
        console.log(`   📋 Exception details saved`);
        
        // Take screenshot on error
        if (config.screenshotOnFailure) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const screenshotPath = path.join(
            config.screenshotPath,
            `offer_${i}_error_${timestamp}.png`
          );
          await p2pPage.takeScreenshot(screenshotPath);
          console.log(`   📸 Screenshot: ${screenshotPath}`);
        }
        
        // Continue to next offer
        await driver.sleep(1000);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL RESULTS:');
    console.log(`   ✅ Successfully created: ${successCount}/${numberOfOffers} offers`);
    console.log(`   ❌ Failed: ${failCount}/${numberOfOffers} offers`);
    console.log(`   📈 Success rate: ${((successCount/numberOfOffers)*100).toFixed(1)}%`);
    console.log('='.repeat(60) + '\n');

    // Show detailed failed offers information
    if (failedOffers.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('❌ FAILED OFFERS DETAILS:');
      console.log('='.repeat(60));
      
      failedOffers.forEach((failed, index) => {
        console.log(`\n${index + 1}. Offer #${failed.offerNumber}`);
        console.log(`   ⏰ Timestamp: ${failed.timestamp}`);
        console.log(`   💰 Amount: ${failed.data.amount}`);
        console.log(`   💱 Rate: ${failed.data.price_rate}`);
        console.log(`   🏦 Bank: ${failed.data.bank_info.bank}`);
        console.log(`   👤 Account: ${failed.data.bank_info.account_name}`);
        console.log(`   📸 Screenshot: ${failed.screenshotPath}`);
        
        if (failed.error) {
          console.log(`   🔥 Exception: ${failed.error.message}`);
        }
        
        if (failed.browserLogs && failed.browserLogs.length > 0) {
          console.log(`   📋 Browser Logs (last ${failed.browserLogs.length}):`);
          failed.browserLogs.forEach((log, i) => {
            if (log.level === 'SEVERE' || log.message.includes('error') || log.message.includes('failed')) {
              console.log(`      ${i + 1}. [${log.level}] ${log.message.substring(0, 150)}...`);
            }
          });
        }
        
        console.log('   ' + '-'.repeat(55));
      });
      
      // Save detailed report to file
      const reportPath = path.join(config.screenshotPath, 'failed_offers_report.json');
      try {
        fs.writeFileSync(reportPath, JSON.stringify(failedOffers, null, 2));
        console.log(`\n💾 Detailed report saved to: ${reportPath}\n`);
      } catch (err) {
        console.error(`\n⚠️  Could not save report file: ${err.message}\n`);
      }
      
      console.log('='.repeat(60) + '\n');
    }

    // Test passes if at least 80% success
    const minSuccess = Math.floor(numberOfOffers * 0.8);
    expect(successCount).to.be.at.least(minSuccess, `At least ${minSuccess} out of ${numberOfOffers} offers should be created`);
  });
});
