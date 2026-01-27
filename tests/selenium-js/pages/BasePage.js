const { By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.timeout = config.explicitWait || 10000;
  }

  async navigateTo(url) {
    await this.driver.get(url);
  }

  /**
   * Enhanced findElement that ensures the element is present in the DOM.
   */
  async findElement(locator, timeout = this.timeout) {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  /**
   * Consolidated click method that ensures the element is visible and enabled
   * before attempting interaction.
   */
  async click(locator, timeout = this.timeout) {
    const element = await this.findElement(locator, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    await this.driver.wait(until.elementIsEnabled(element), timeout);
    await element.click();
  }

  /**
   * Modern React state trigger. Essential for frameworks that don't 
   * react to standard Selenium .sendKeys().
   */
  async setValueReact(element, value) {
    if (!element) return;
    await this.driver.executeScript(`
      const input = arguments[0];
      const value = arguments[1];
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
    `, element, value);
  }

  async takeScreenshot(filename) {
    try {
      const image = await this.driver.takeScreenshot();
      const dir = path.dirname(filename);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filename, image, 'base64');
      console.log(`  📸 Screenshot saved: ${filename}`);
    } catch (e) {
      console.error(`  ❌ Cannot take screenshot: ${e.message}`);
    }
  }

  async isElementVisible(locator, timeout = 3000) {
    try {
      const el = await this.driver.wait(until.elementLocated(locator), timeout);
      return await el.isDisplayed();
    } catch (e) { return false; }
  }

  async sleep(ms) {
    await this.driver.sleep(ms);
  }
}

module.exports = BasePage;