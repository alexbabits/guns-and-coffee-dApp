const hre = require("hardhat");
const abi = require("../artifacts/contracts/PaymentHandler.sol/PaymentHandler.json");

async function getSpecificBalance(provider, address) {
    const balanceBigInt = await provider.getBalance(address);
    return ethers.formatEther(balanceBigInt);
  }

async function main() {
  // Get the contract that has been deployed to Sepolia. Double check address.
  const contractAddress="0x9a5c4290C3c768a41afac7306D05Fe4B32E7D93a";
  const contractABI = abi.abi;

  // Get the node connection and wallet connection.
  const provider = new ethers.AlchemyProvider("sepolia", process.env.SEPOLIA_API_KEY);

  // Ensure that signer is the SAME address as the original contract deployer,
  // or else this script will fail with an error.
  const signer = new hre.ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Instantiate contract.
  const paymentHandler = new hre.ethers.Contract(contractAddress, contractABI, signer);

  // Check starting balances.
  console.log("current balance of owner: ", await getSpecificBalance(provider, signer.address), "ETH");
  const contractBalance = await getSpecificBalance(provider, paymentHandler.target);
  console.log("current balance of contract: ", await getSpecificBalance(provider, paymentHandler.target), "ETH");

  // Withdraw funds if there are funds to withdraw.
  if (contractBalance !== "0.0") {
    console.log("withdrawing funds..")
    const withdrawTxn = await paymentHandler.withdrawFunds();
    await withdrawTxn.wait();
  } else {
    console.log("no funds to withdraw!");
  }

  // Check ending balance.
  console.log("current balance of owner: ", await getSpecificBalance(provider, signer.address), "ETH");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });