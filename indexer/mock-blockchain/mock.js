import Web3 from "web3";

const web3 = new Web3("http://host.docker.internal:8545");

const SPAMMER_INDEX = 1;
const REFILL_BALANCE_ETH = "1000";
const SPAM_INTERVAL_MS = 5000;
const REFILL_INTERVAL_MS = 5000;

(async () => {
  const accounts = await web3.eth.getAccounts();
  const SPAMMER_ADDRESS = accounts[SPAMMER_INDEX];
  console.log("Spammer address:", SPAMMER_ADDRESS);

  setInterval(async () => {
    try {
      const balanceWei = web3.utils.toWei(REFILL_BALANCE_ETH, "ether");
  
      await web3.currentProvider.request({
        method: "evm_setAccountBalance",
        params: [SPAMMER_ADDRESS, web3.utils.toHex(balanceWei)],
      });
  
      console.log(`Refilled ${REFILL_BALANCE_ETH} ETH for spammer`);
    } catch (err) {
      console.error("Refill error:", err);
    }
  }, REFILL_INTERVAL_MS);

  setInterval(async () => {
    try {
      const randomEth = (Math.random() * (0.005 - 0.0001) + 0.0001).toFixed(6);
      const valueWei = web3.utils.toWei(randomEth.toString(), "ether");

      const randomGasPriceGwei = Math.random();
      const gasPriceWei = web3.utils.toWei(
        randomGasPriceGwei.toString(),
        "gwei"
      );

      const tx = await web3.eth.sendTransaction({
        from: SPAMMER_ADDRESS,
        to: accounts[0],
        value: valueWei,
        gasPrice: gasPriceWei,
      });

      console.log(
        `Sent ${randomEth} ETH, gasPrice: ${randomGasPriceGwei.toFixed(
          6
        )} gwei, Tx hash: ${tx.transactionHash}`
      );
    } catch (err) {
      console.error("Tx error:", err.message);
    }
  }, SPAM_INTERVAL_MS);
})();
