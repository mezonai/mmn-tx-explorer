const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const config = require('../config/config');

/**
 * Create and configure WebDriver instance
 */
async function createDriver() {
  const browserType = config.browser.toLowerCase();

  let builder = new Builder().forBrowser(browserType);

  if (browserType === 'chrome') {
    const chromeOptions = new chrome.Options();
    
    if (config.headless) {
      chromeOptions.addArguments('--headless=new');
    }
    
    chromeOptions.addArguments(
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080',
      '--disable-gpu',
      '--disable-extensions'
    );

    builder.setChromeOptions(chromeOptions);
  } else if (browserType === 'firefox') {
    const firefoxOptions = new firefox.Options();
    
    if (config.headless) {
      firefoxOptions.addArguments('-headless');
    }
    
    firefoxOptions.addArguments(
      '--width=1920',
      '--height=1080'
    );

    builder.setFirefoxOptions(firefoxOptions);
  }

  const driver = await builder.build();
  
  // Set implicit wait
  await driver.manage().setTimeouts({ implicit: config.implicitWait });
  
  // Maximize window
  await driver.manage().window().maximize();

  return driver;
}

module.exports = { createDriver };
