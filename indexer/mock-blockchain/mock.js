import Web3 from "web3";

const web3 = new Web3("http://host.docker.internal:8545");

(async () => {
  const accounts = await web3.eth.getAccounts();

  setInterval(async () => {
    try {
      const tx = await web3.eth.sendTransaction({
        from: accounts[0],
        to: accounts[1],
        value: web3.utils.toWei("0.001", "ether")
      });
      console.log("Tx sent:", tx.transactionHash);
    } catch (err) {
      console.error(err);
    }
  }, 2000);
})();
