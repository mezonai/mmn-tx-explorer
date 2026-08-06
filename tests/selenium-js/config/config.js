require('dotenv').config();

module.exports = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:8080',
  browser: process.env.BROWSER || 'chrome',
  headless: process.env.HEADLESS === 'true',
  implicitWait: parseInt(process.env.IMPLICIT_WAIT || '10000', 10),
  explicitWait: parseInt(process.env.EXPLICIT_WAIT || '20000', 10),
  screenshotOnFailure: process.env.SCREENSHOT_ON_FAILURE !== 'false',
  screenshotPath: process.env.SCREENSHOT_PATH || './screenshots',
  testEmail: process.env.TEST_EMAIL || '',
  testOtp: process.env.TEST_OTP || '',
  numberOfOffers: parseInt(process.env.NUMBER_OF_OFFERS) || 500,
};
