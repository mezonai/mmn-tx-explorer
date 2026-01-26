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
      const rateLabel = Array.from(document.querySelectorAll('label')).find(label => label.textContent.includes('Rate'));
      let rateInput = null;
      if (rateLabel) {
        const forAttr = rateLabel.getAttribute('for');
        if (forAttr) {
          rateInput = document.getElementById(forAttr);
        }
        if (!rateInput) {
          rateInput = rateLabel.querySelector('input[type="text"]') || rateLabel.querySelector('input');
        }
        if (!rateInput) {
          const parent = rateLabel.closest('div');
          if (parent) {
            rateInput = parent.querySelector('input[type="text"]') || parent.querySelector('input');
          }
        }
      }

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
      const minLabel = Array.from(document.querySelectorAll('label')).find(label => label.textContent.includes('Min'));
      let minInput = null;
      if (minLabel) {
        const forAttr = minLabel.getAttribute('for');
        if (forAttr) {
          minInput = document.getElementById(forAttr);
        }
        if (!minInput) {
          minInput = minLabel.querySelector('input[type="text"]') || minLabel.querySelector('input');
        }
        if (!minInput) {
          const parent = minLabel.closest('div');
          if (parent) {
            minInput = parent.querySelector('input[type="text"]') || parent.querySelector('input');
          }
        }
      }

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
      const maxLabel = Array.from(document.querySelectorAll('label')).find(label => label.textContent.includes('Max'));
      let maxInput = null;
      if (maxLabel) {
        const forAttr = maxLabel.getAttribute('for');
        if (forAttr) {
          maxInput = document.getElementById(forAttr);
        }
        if (!maxInput) {
          maxInput = maxLabel.querySelector('input[type="text"]') || maxLabel.querySelector('input');
        }
        if (!maxInput) {
          const parent = maxLabel.closest('div');
          if (parent) {
            maxInput = parent.querySelector('input[type="text"]') || parent.querySelector('input');
          }
        }
      }

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
      // Find amount input by label text or nearby container
      let amountInput = null;
      const labels = Array.from(document.querySelectorAll('label'));
      const amountLabel = labels.find(label => /amount to (sell|buy)/i.test(label.textContent));

      if (amountLabel) {
        const forAttr = amountLabel.getAttribute('for');
        if (forAttr) {
          amountInput = document.getElementById(forAttr);
        }
        if (!amountInput) {
          amountInput = amountLabel.querySelector('input[type="text"]') || amountLabel.querySelector('input');
        }
        if (!amountInput) {
          const parent = amountLabel.closest('div');
          if (parent) {
            amountInput = parent.querySelector('input[type="text"]') || parent.querySelector('input');
          }
        }
        if (!amountInput) {
          let el = amountLabel.nextElementSibling;
          while (el && !amountInput) {
            if (el.querySelector) {
              amountInput = el.querySelector('input[type="text"]') || el.querySelector('input');
            }
            el = el.nextElementSibling;
          }
        }
      }

      // Fallback: find input with placeholder '0' or aria-label contains 'amount'
      if (!amountInput) {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        amountInput = inputs.find(inp => (inp.placeholder || '').trim() === '0' || (inp.getAttribute('aria-label') || '').toLowerCase().includes('amount'));
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
        if (amountInput.value !== '1' && amountInput.value !== '${offerData.amount}' && amountInput.value !== '1.00') {
          console.warn('⚠️  Amount field has unexpected value:', amountInput.value);
        }
      } else {
        console.log('❌ Amount input not found');
      }
    `);
    await this.sleep(500);
    
    console.log('  ? Filling account number...');
    await this.executeScript(`
      const accNumLabel = Array.from(document.querySelectorAll('label')).find(label => label.textContent.includes('Account Number'));
      let accNumInput = null;
      if (accNumLabel) {
        const forAttr = accNumLabel.getAttribute('for');
        if (forAttr) {
          accNumInput = document.getElementById(forAttr);
        }
        if (!accNumInput) {
          accNumInput = accNumLabel.querySelector('input[type="text"]') || accNumLabel.querySelector('input');
        }
        if (!accNumInput) {
          const parent = accNumLabel.closest('div');
          if (parent) {
            accNumInput = parent.querySelector('input[type="text"]') || parent.querySelector('input');
          }
        }
      }

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
      const accNameLabel = Array.from(document.querySelectorAll('label')).find(label => label.textContent.includes('Account Name'));
      let accNameInput = null;
      if (accNameLabel) {
        const forAttr = accNameLabel.getAttribute('for');
        if (forAttr) {
          accNameInput = document.getElementById(forAttr);
        }
        if (!accNameInput) {
          accNameInput = accNameLabel.querySelector('input[type="text"]') || accNameLabel.querySelector('input');
        }
        if (!accNameInput) {
          const parent = accNameLabel.closest('div');
          if (parent) {
            accNameInput = parent.querySelector('input[type="text"]') || parent.querySelector('input');
          }
        }
      }

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
      
      return (function() {
        const findInputByPlaceholder = (ph) => inputs.find(inp => inp.placeholder === ph)?.value || 'NOT FOUND';
        const findInputByLabel = (labelText) => {
          const label = Array.from(document.querySelectorAll('label')).find(lbl => lbl.textContent.includes(labelText));
          if (label) {
            const forAttr = label.getAttribute('for');
            if (forAttr) {
              return document.getElementById(forAttr)?.value || 'NOT FOUND';
            } else {
              const parent = label.closest('div');
              if (parent) {
                return parent.querySelector('input[type="text"]')?.value || parent.querySelector('input')?.value || 'NOT FOUND';
              }
            }
          }
          return 'NOT FOUND';
        };

        // Determine amount input robustly
        let amountVal = 'NOT FOUND';
        const labels = Array.from(document.querySelectorAll('label'));
        const amountLabel = labels.find(label => /amount to (sell|buy)/i.test(label.textContent));
        let amountInput = null;
        if (amountLabel) {
          const forAttr = amountLabel.getAttribute('for');
          if (forAttr) amountInput = document.getElementById(forAttr);
          if (!amountInput) amountInput = amountLabel.querySelector('input[type="text"]') || amountLabel.querySelector('input');
          if (!amountInput) {
            const parent = amountLabel.closest('div');
            if (parent) amountInput = parent.querySelector('input[type="text"]') || parent.querySelector('input');
          }
          if (!amountInput) {
            let el = amountLabel.nextElementSibling;
            while (el && !amountInput) {
              if (el.querySelector) amountInput = el.querySelector('input[type="text"]') || el.querySelector('input');
              el = el.nextElementSibling;
            }
          }
        }
        if (!amountInput) {
          amountInput = inputs.find(inp => (inp.placeholder || '').trim() === '0' || (inp.getAttribute('aria-label') || '').toLowerCase().includes('amount'));
        }
        if (amountInput) amountVal = amountInput.value || 'NOT FOUND';

        return {
          rate: findInputByLabel('Rate'),
          min: findInputByLabel('Min'),
          max: findInputByLabel('Max'),
          amount: amountVal,
          accountNumber: findInputByLabel('Account Number')?.value || 'NOT FOUND',
          accountName: findInputByLabel('Account Name')?.value || 'NOT FOUND',
          totalReceivedVND: totalReceivedValue,
          calculatedTotal: '${offerData.amount} × ${offerData.price_rate} = ${parseFloat(offerData.amount) * parseFloat(offerData.price_rate)}'
        };
      })();
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
      // Try normal click first
      try {
        await this.click(this.locators.createOfferButton);
        console.log('  ? Clicked Create Offer button (via locator)');
      } catch (err) {
        console.warn('  ! Locator click failed, falling back to JS click');
        // Fallback: find and click button by text via JS
        const clicked = await this.executeScript(`
          const texts = ['Create Offer', 'Create offer', 'Create'];
          const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"]'));
          for (const btn of buttons) {
            const txt = (btn.textContent || btn.value || '').trim();
            if (texts.some(t => txt.includes(t))) {
              btn.scrollIntoView({ block: 'center' });
              btn.click();
              return true;
            }
          }
          return false;
        `);
        if (clicked) {
          console.log('  ? Clicked Create Offer button (via JS)');
        } else {
          console.error('  ? Could not find Create Offer button to click');
          await this.takeScreenshot('./screenshots/create_offer_not_found.png');
          throw new Error('Create Offer button not found');
        }
      }

      await this.sleep(2000);

      // Check if confirmation dialog appeared
      const confirmButton = await this.executeScript(`
        const buttons = Array.from(document.querySelectorAll('button'));
        const confirmBtn = buttons.find(btn => 
          (btn.textContent || '').includes('Confirm & Transfer') || 
          (btn.textContent || '').includes('Confirm')
        );
        return confirmBtn ? true : false;
      `);

      if (confirmButton) {
        console.log('  ?? Confirmation dialog appeared, clicking Confirm & Transfer...');
        await this.executeScript(`
          const buttons = Array.from(document.querySelectorAll('button'));
          const confirmBtn = buttons.find(btn => 
            (btn.textContent || '').includes('Confirm & Transfer') || 
            (btn.textContent || '').includes('Confirm')
          );
          if (confirmBtn) {
            confirmBtn.click();
            console.log('? Clicked Confirm & Transfer button');
            return true;
          }
          return false;
        `);
        await this.sleep(2000);
      } else {
        console.log('  ? No confirmation dialog detected');
      }

    } catch (error) {
      console.error(`  ? Failed to click: ${error.message}`);
      await this.takeScreenshot('./screenshots/create_offer_click_error.png');
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
      const hasError = await this.isErrorToastVisible();
      
      const isSuccess = hasSuccessToast || (!modalStillOpen && !hasError);
      
      if (isSuccess) {
        console.log('  ✅ Offer created successfully!');
        return true;
      }
      
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