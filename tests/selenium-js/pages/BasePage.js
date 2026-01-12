const { By, until } = require('selenium-webdriver');
const config = require('../config/config');

/**
 * Base Page Object class with common methods
 */
class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.timeout = config.explicitWait;
  }

  /**
   * Navigate to URL
   */
  async navigateTo(url) {
    await this.driver.get(url);
  }

  /**
   * Find element with explicit wait
   */
  async findElement(locator, timeout = this.timeout) {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  /**
   * Find multiple elements
   */
  async findElements(locator) {
    return await this.driver.findElements(locator);
  }

  /**
   * Click element with explicit wait
   */
  async click(locator, timeout = this.timeout) {
    const element = await this.driver.wait(until.elementLocated(locator), timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    await this.driver.wait(until.elementIsEnabled(element), timeout);
    await element.click();
  }

  /**
   * Send keys to element
   */
  async sendKeys(locator, text, timeout = this.timeout) {
    const element = await this.findElement(locator, timeout);
    await element.clear();
    await element.sendKeys(text);
  }

  /**
   * Clear and send keys to element (more reliable)
   */
  async clearAndSendKeys(locator, text, timeout = this.timeout) {
    try {
      const element = await this.findElement(locator, timeout);
      await this.driver.wait(until.elementIsVisible(element), timeout);
      
      // Scroll to element first
      await this.driver.executeScript('arguments[0].scrollIntoView({block: "center"});', element);
      await this.sleep(300);
      
      // Clear existing value multiple times
      await element.clear();
      await this.sleep(100);
      await element.clear();
      await this.sleep(100);
      
      // Send new keys
      await element.sendKeys(text);
      await this.sleep(300);
      
      // Verify value was entered
      const value = await element.getAttribute('value');
      console.log(`    ✓ Value entered: "${value}"`);
      
    } catch (error) {
      console.error(`    ❌ Error entering text: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get text from element
   */
  async getText(locator, timeout = this.timeout) {
    const element = await this.findElement(locator, timeout);
    return await element.getText();
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(locator, timeout = 5000) {
    try {
      const element = await this.driver.wait(until.elementLocated(locator), timeout);
      return await element.isDisplayed();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if element is present
   */
  async isElementPresent(locator, timeout = 5000) {
    try {
      await this.driver.wait(until.elementLocated(locator), timeout);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for element to disappear
   */
  async waitForElementToDisappear(locator, timeout = this.timeout) {
    await this.driver.wait(until.stalenessOf(await this.findElement(locator)), timeout);
  }

  /**
   * Scroll to element
   */
  async scrollToElement(locator) {
    const element = await this.findElement(locator);
    await this.driver.executeScript('arguments[0].scrollIntoView(true);', element);
    await this.sleep(500);
  }

  /**
   * Get attribute value
   */
  async getAttribute(locator, attribute, timeout = this.timeout) {
    const element = await this.findElement(locator, timeout);
    return await element.getAttribute(attribute);
  }

  /**
   * Wait for page load
   */
  async waitForPageLoad(timeout = 30000) {
    await this.driver.wait(async () => {
      const readyState = await this.driver.executeScript('return document.readyState');
      return readyState === 'complete';
    }, timeout);
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(filename) {
    const image = await this.driver.takeScreenshot();
    const fs = require('fs');
    const path = require('path');
    
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filename, image, 'base64');
  }

  /**
   * Get current URL
   */
  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  /**
   * Refresh page
   */
  async refresh() {
    await this.driver.navigate().refresh();
  }

  /**
   * Sleep/wait
   */
  async sleep(ms) {
    await this.driver.sleep(ms);
  }

  /**
   * Execute JavaScript
   */
  async executeScript(script, ...args) {
    return await this.driver.executeScript(script, ...args);
  }
}

module.exports = BasePage;
