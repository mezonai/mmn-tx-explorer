const { By, until } = require("selenium-webdriver");
const BasePage = require("./BasePage");
const config = require("../config/config");

class P2PPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.baseUrl = `${config.baseUrl}/p2p`;
    this.locators = {
      newOfferBtn: By.xpath("//button[contains(., 'New Offer') or contains(., 'Create')]"),
      modal: By.xpath("//h2[contains(., 'Create New Offer')]"),
      submitOfferBtn: By.xpath("//button[contains(., 'Create Offer')]"),
      confirmBtn: By.xpath("//button[contains(., 'Confirm') or contains(., 'Transfer')]"),
      successToast: By.xpath("//*[contains(@class, 'success')]"),
    };
  }

  async navigate() {
    await this.navigateTo(this.baseUrl);
    await this.findElement(this.locators.newOfferBtn); 
  }

  async fillInputByLabel(label, value) {
    // Context-aware XPath to find inputs based on label text
    const xpath = `//label[contains(., "${label}")]/following::input[1] | //label[contains(., "${label}")]//input`;
    const element = await this.findElement(By.xpath(xpath));
    await this.setValueReact(element, value);
    // Short sleep to allow React state to settle if there are listeners attached
    await this.sleep(100); 
  }

  async createOffer(offerData) {
    try {
      await this.navigate();
      await this.click(this.locators.newOfferBtn);

      const modalHeader = await this.findElement(this.locators.modal);
      await this.driver.wait(until.elementIsVisible(modalHeader), this.timeout);

      const fields = [
        { label: "Rate", value: offerData.rate || "0.1" },
        { label: "Amount", value: offerData.amount || "1" },
        { label: "Min", value: offerData.min || "1" },
        { label: "Max", value: offerData.max || "1" },
        { label: "Account Number", value: offerData.bank_info.account_number },
        { label: "Account Name", value: offerData.bank_info.account_name }
      ];

      for (const field of fields) {
        await this.fillInputByLabel(field.label, field.value);
      }

      console.log("  ⏳ Submitting Offer...");
      await this.click(this.locators.submitOfferBtn);

      console.log("  ⏳ Confirming Transfer...");
      await this.click(this.locators.confirmBtn);

      console.log("  ⏳ Waiting for success indicator...");
      const success = await this.driver.wait(async () => {
        const isToastVisible = await this.isElementVisible(this.locators.successToast, 1000);
        if (isToastVisible) return true;

        const modalElements = await this.driver.findElements(this.locators.modal);
        return modalElements.length === 0;
      }, 15000).catch(() => false);

      if (!success) throw new Error("Offer submission timed out or success indicator not found.");
      return true;

    } catch (error) {
      console.error(`  ❌ P2PPage Error: ${error.message}`);
      await this.takeScreenshot(`./screenshots/p2p-error-${Date.now()}.png`);
      // Re-throw so the test runner marks the test as failed
      throw error; 
    }
  }
}

module.exports = P2PPage;