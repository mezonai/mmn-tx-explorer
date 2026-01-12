const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const config = require('../config/config');

class P2PPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.baseUrl = `${config.baseUrl}/p2p`;
    
    this.locators = {
      newOfferButton: By.xpath("//button[contains(., 'New Offer') or contains(., 'Create')]"),
      modalTitle: By.xpath("//h2[contains(text(), 'Create New Offer')] | //*[contains(text(), 'Create New Offer')]"),
      sellRadio: By.xpath("//input[@value='SELL'] | //button[contains(., 'Sell')]"),
      buyRadio: By.xpath("//input[@value='BUY'] | //button[contains(., 'Buy')]"),
      cancelButton: By.xpath("//button[contains(text(), 'Cancel')]"),
      createOfferButton: By.xpath("//button[contains(text(), 'Create Offer')]"),
      successToast: By.xpath("//div[contains(@class, 'toast') and contains(., 'success')] | //*[contains(text(), 'success')]"),
      errorToast: By.xpath("//div[contains(@class, 'toast') and contains(., 'error')] | //*[contains(text(), 'error')]"),
      validationError: By.xpath("//p[contains(@class, 'error') or contains(@class, 'text-red')]"),
    };
  }

  async navigate() {
    await this.navigateTo(this.baseUrl);
    await this.waitForPageLoad();
  }

  async clickNewOfferButton() {
    console.log('  ?? Looking for New Offer button...');
    try {
      await this.click(this.locators.newOfferButton);
      await this.sleep(1000);
      console.log('  ? Clicked New Offer button');
    } catch (error) {
      console.error(`  ? Failed to click New Offer button: ${error.message}`);
      throw error;
    }
  }

  async isCreateOfferModalOpen() {
    const isOpen = await this.isElementVisible(this.locators.modalTitle, 5000);
    console.log(`  Modal open: ${isOpen}`);
    return isOpen;
  }

  async closeModalIfOpen() {
    try {
      const isOpen = await this.isElementVisible(this.locators.modalTitle, 2000);
      if (isOpen) {
        console.log('  ?? Closing existing modal...');
        await this.click(this.locators.cancelButton, 2000);
        await this.sleep(500);
        await this.driver.actions().sendKeys('\\uE00C').perform();
        await this.sleep(500);
      }
    } catch (error) {
      // Modal not open, that's fine
    }
  }

  async selectTradeType(tradeType) {
    console.log(`  ? Selecting trade type: ${tradeType}`);
    
    const clicked = await this.executeScript(`
      const buttons = document.querySelectorAll('button, input, [role="button"], [role="radio"]');
      for (let btn of buttons) {
        const text = (btn.textContent || btn.value || '').toLowerCase();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        if (text.includes('${tradeType.toLowerCase()}') || ariaLabel.includes('${tradeType.toLowerCase()}')) {
          btn.click();
          console.log('Clicked trade type:', btn.textContent || btn.value);
          return true;
        }
      }
      
      const inputs = document.querySelectorAll('input[type="radio"]');
      for (let input of inputs) {
        if (input.value.toUpperCase() === '${tradeType.toUpperCase()}') {
          input.click();
          return true;
        }
      }
      
      return false;
    `);
    
    if (clicked) {
      console.log(`  ? Selected ${tradeType}`);
    } else {
      console.log(`  ??  Could not find ${tradeType} button - might already be selected`);
    }
    
    await this.sleep(500);
  }

  async fillFormWithJS(offerData) {
    console.log('  ?? Filling form with JavaScript...');
    
    const accountName = offerData.bank_info?.account_name || 'Test User';
    const accountNumber = offerData.bank_info?.account_number || '1234567890';
    
    await this.sleep(1000);
    
    const inputsInfo = await this.executeScript(`
      const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
      return inputs.map((input, i) => ({
        index: i,
        placeholder: input.placeholder,
        value: input.value
      }));
    `);
    
    console.log('  ?? Found text inputs:', JSON.stringify(inputsInfo, null, 2));
    
    console.log('  ? Filling rate...');
    await this.executeScript(`
      const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
      const rateInput = inputs.find(inp => inp.placeholder === '0.8');
      if (rateInput) {
        rateInput.click();
        rateInput.focus();
        
        // Clear the field
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(rateInput, '');
        rateInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Set new value
        nativeInputValueSetter.call(rateInput, '${offerData.price_rate}');
        rateInput.dispatchEvent(new Event('input', { bubbles: true }));
        rateInput.dispatchEvent(new Event('change', { bubbles: true }));
        rateInput.dispatchEvent(new Event('blur', { bubbles: true }));
        
        console.log('? Filled rate:', rateInput.value);
      } else {
        console.log('? Rate input not found');
      }
    `);
    await this.sleep(500);
    
    console.log('  ? Filling min limit...');
    await this.executeScript(`
      const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
      const minInput = inputs.find(inp => inp.placeholder === '100');
      if (minInput) {
        minInput.click();
        minInput.focus();
        
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(minInput, '');
        minInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        nativeInputValueSetter.call(minInput, '${offerData.limit.min}');
        minInput.dispatchEvent(new Event('input', { bubbles: true }));
        minInput.dispatchEvent(new Event('change', { bubbles: true }));
        minInput.dispatchEvent(new Event('blur', { bubbles: true }));
        
        console.log('? Filled min:', minInput.value);
      } else {
        console.log('? Min input not found');
      }
    `);
    await this.sleep(300);
    
    console.log('  ? Filling max limit...');
    await this.executeScript(`
      const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
      const maxInput = inputs.find(inp => 
        inp.placeholder === '5,000' || 
        (inp.placeholder.includes(',') && inp.placeholder !== '100')
      );
      if (maxInput) {
        maxInput.click();
        maxInput.focus();
        
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(maxInput, '');
        maxInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        nativeInputValueSetter.call(maxInput, '${offerData.limit.max}');
        maxInput.dispatchEvent(new Event('input', { bubbles: true }));
        maxInput.dispatchEvent(new Event('change', { bubbles: true }));
        maxInput.dispatchEvent(new Event('blur', { bubbles: true }));
        
        console.log('? Filled max:', maxInput.value);
      } else {
        console.log('? Max input not found');
      }
    `);
    await this.sleep(500);
    
    console.log('  ? Filling amount...');
    await this.executeScript(`
      // Find amount input by label text "Amount to Sell"
      let amountInput = null;
      
      // Method 1: Find by label
      const labels = Array.from(document.querySelectorAll('label'));
      const amountLabel = labels.find(label => 
        label.textContent.includes('Amount to Sell') || 
        label.textContent.includes('Amount to Buy')
      );
      if (amountLabel) {
        const forAttr = amountLabel.getAttribute('for');
        if (forAttr) {
          amountInput = document.getElementById(forAttr);
        } else {
          amountInput = amountLabel.querySelector('input');
        }
      }
      
      // Method 2: Find by placeholder if label method failed
      if (!amountInput) {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        amountInput = inputs.find(inp => 
          (inp.placeholder || '').includes('5,000,000') ||
          (inp.placeholder || '').includes('Ex:')
        );
      }
      
      if (amountInput) {
        amountInput.click();
        amountInput.focus();
        
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        
        // Clear the field first
        nativeInputValueSetter.call(amountInput, '');
        amountInput.dispatchEvent(new Event('input', { bubbles: true }));
        amountInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Wait a bit to ensure field is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Set the exact value: 1 (not formatted)
        nativeInputValueSetter.call(amountInput, '${offerData.amount}');
        amountInput.dispatchEvent(new Event('input', { bubbles: true }));
        amountInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Wait before blur to let React process the value
        await new Promise(resolve => setTimeout(resolve, 100));
        
        amountInput.dispatchEvent(new Event('blur', { bubbles: true }));
        
        // Wait for formatting to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('✅ Amount field after fill:', amountInput.value, '(expected: 1)');
        if (amountInput.value !== '1' && amountInput.value !== '${offerData.amount}') {
          console.warn('⚠️  Amount field has unexpected value:', amountInput.value);
        }
      } else {
        console.log('❌ Amount input not found');
      }
    `);
    await this.sleep(500);
    
    console.log('  ? Filling account number...');
    await this.executeScript(`
      const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
      const accNumInput = inputs.find(inp => 
        (inp.placeholder || '').toLowerCase().includes('account number')
      );
      if (accNumInput) {
        accNumInput.click();
        accNumInput.focus();
        
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(accNumInput, '');
        accNumInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        nativeInputValueSetter.call(accNumInput, '${accountNumber}');
        accNumInput.dispatchEvent(new Event('input', { bubbles: true }));
        accNumInput.dispatchEvent(new Event('change', { bubbles: true }));
        accNumInput.dispatchEvent(new Event('blur', { bubbles: true }));
        
        console.log('? Filled account number:', accNumInput.value);
      } else {
        console.log('? Account number input not found');
      }
    `);
    await this.sleep(300);
    
    console.log('  ? Filling account name...');
    await this.executeScript(`
      const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
      const accNameInput = inputs.find(inp => 
        (inp.placeholder || '').toLowerCase().includes('account owner') ||
        (inp.placeholder || '').toLowerCase().includes('owner name')
      );
      if (accNameInput) {
        accNameInput.click();
        accNameInput.focus();
        
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(accNameInput, '');
        accNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        nativeInputValueSetter.call(accNameInput, '${accountName}');
        accNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        accNameInput.dispatchEvent(new Event('change', { bubbles: true }));
        accNameInput.dispatchEvent(new Event('blur', { bubbles: true }));
        
        console.log('? Filled account name:', accNameInput.value);
      } else {
        console.log('? Account name input not found');
      }
    `);
    
    await this.sleep(1000);
    console.log('  ? Form filling complete');
    
    // Verify all fields are filled and check Total Received
    const verification = await this.executeScript(`
      const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
      
      // Find the Total Received display
      const totalReceivedLabel = Array.from(document.querySelectorAll('label'))
        .find(label => label.textContent.includes('Total Received'));
      let totalReceivedValue = 'NOT FOUND';
      if (totalReceivedLabel) {
        const totalContainer = totalReceivedLabel.closest('div')?.querySelector('.text-utility-success-600');
        totalReceivedValue = totalContainer?.textContent || 'CONTAINER NOT FOUND';
      }
      
      return {
        rate: inputs.find(inp => inp.placeholder === '0.8')?.value || 'NOT FOUND',
        min: inputs.find(inp => inp.placeholder === '100')?.value || 'NOT FOUND',
        max: inputs.find(inp => inp.placeholder.includes('5,000') && !inp.placeholder.includes('5,000,000'))?.value || 'NOT FOUND',
        amount: inputs.find(inp => (inp.placeholder || '').includes('5,000,000') || (inp.placeholder || '').includes('Ex:'))?.value || 'NOT FOUND',
        accountNumber: inputs.find(inp => (inp.placeholder || '').toLowerCase().includes('account number'))?.value || 'NOT FOUND',
        accountName: inputs.find(inp => (inp.placeholder || '').toLowerCase().includes('account owner') || (inp.placeholder || '').toLowerCase().includes('owner name'))?.value || 'NOT FOUND',
        totalReceivedVND: totalReceivedValue,
        calculatedTotal: '${offerData.amount} × ${offerData.price_rate} = ${parseFloat(offerData.amount) * parseFloat(offerData.price_rate)}'
      };
    `);
    console.log('  ?? Field verification:', JSON.stringify(verification, null, 2));
    
    if (verification.totalReceivedVND === 'NOT FOUND' || verification.totalReceivedVND === 'CONTAINER NOT FOUND' || verification.totalReceivedVND === '0' || verification.totalReceivedVND === '') {
      console.log('  ⚠️  WARNING: Total Received (VND) is not showing or is zero!');
      console.log('  ⚠️  Amount field value:', verification.amount);
      console.log('  ⚠️  Rate field value:', verification.rate);
    } else {
      console.log('  ✅ Total Received (VND):', verification.totalReceivedVND);
    }
  }

  async clickCreateOffer() {
    console.log('  ?? Clicking Create Offer button...');
    try {
      await this.click(this.locators.createOfferButton);
      console.log('  ? Clicked Create Offer button');
      await this.sleep(2000);
      
      // Check if confirmation dialog appeared
      const confirmButton = await this.executeScript(`
        const buttons = Array.from(document.querySelectorAll('button'));
        const confirmBtn = buttons.find(btn => 
          btn.textContent.includes('Confirm & Transfer') || 
          btn.textContent.includes('Confirm')
        );
        return confirmBtn ? true : false;
      `);
      
      if (confirmButton) {
        console.log('  ?? Confirmation dialog appeared, clicking Confirm & Transfer...');
        await this.executeScript(`
          const buttons = Array.from(document.querySelectorAll('button'));
          const confirmBtn = buttons.find(btn => 
            btn.textContent.includes('Confirm & Transfer') || 
            btn.textContent.includes('Confirm')
          );
          if (confirmBtn) {
            confirmBtn.click();
            console.log('? Clicked Confirm & Transfer button');
          }
        `);
        await this.sleep(2000);
      }
      
    } catch (error) {
      console.error(`  ? Failed to click: ${error.message}`);
      throw error;
    }
  }

  async clickCancel() {
    await this.click(this.locators.cancelButton);
    await this.sleep(500);
  }

  async isSuccessToastVisible() {
    return await this.isElementVisible(this.locators.successToast, 10000);
  }

  async isErrorToastVisible() {
    return await this.isElementVisible(this.locators.errorToast, 5000);
  }

  async createOffer(offerData) {
    console.log('\n  ?? Starting createOffer...');
    
    try {
      await this.closeModalIfOpen();
      await this.clickNewOfferButton();
      
      const modalOpen = await this.isCreateOfferModalOpen();
      if (!modalOpen) {
        console.log('  ? Modal did not open!');
        await this.takeScreenshot('./screenshots/modal_not_open.png');
        return false;
      }
      
      console.log('  ? Modal is open');
      
      if (offerData.side) {
        await this.selectTradeType(offerData.side);
      }
      
      await this.fillFormWithJS(offerData);
      
      console.log('  ?? Submitting offer...');
      await this.clickCreateOffer();
      
      console.log('  ⏳ Waiting for blockchain transaction and API response...');
      await this.sleep(2000);

      // Check for success using multiple methods
      console.log('  🔍 Checking for success indicators...');
      
      // Method 1: Check for success toast
      const hasSuccessToast = await this.executeScript(`
        const toasts = Array.from(document.querySelectorAll('[role="status"], [data-sonner-toast], .sonner-toast, [class*="toast"]'));
        const successToast = toasts.find(toast => 
          toast.textContent.toLowerCase().includes('success') || 
          toast.textContent.toLowerCase().includes('create offer success')
        );
        if (successToast) {
          console.log('✅ Found success toast:', successToast.textContent);
          return true;
        }
        return false;
      `);
      
      // Method 2: Check if modal is closed
      const modalStillOpen = await this.isCreateOfferModalOpen();
      
      console.log('  📊 Success indicators:');
      console.log(`     - Success toast: ${hasSuccessToast}`);
      console.log(`     - Modal closed: ${!modalStillOpen}`);
      
      // Success if toast found OR modal closed
      const isSuccess = hasSuccessToast || !modalStillOpen;
      
      if (isSuccess) {
        console.log('  ✅ Offer created successfully!');
        return true;
      }
      
      const hasError = await this.isErrorToastVisible();
      
      if (hasError) {
        console.log('  ❌ Error detected!');
        await this.takeScreenshot('./screenshots/error_toast.png');
        return false;
      }
      
      console.log('  ⚠️  No clear result - taking screenshot');
      await this.takeScreenshot('./screenshots/unclear.png');
      return false;
    } catch (error) {
      console.error(`  ? Error in createOffer: ${error.message}`);
      await this.takeScreenshot('./screenshots/create_offer_error.png');
      await this.closeModalIfOpen();
      return false;
    }
  }
}

module.exports = P2PPage;