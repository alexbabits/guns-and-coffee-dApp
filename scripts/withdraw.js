const hre = require("hardhat");
const abi = require("../artifacts/contracts/BuyMeACoffee.sol/BuyMeACoffee.json");

async function getSpecificBalance(provider, address) {
    const balanceBigInt = await provider.getBalance(address);
    return ethers.formatEther(balanceBigInt);
  }

async function main() {
  // Get the contract that has been deployed to Sepolia. Double check address.
  const contractAddress="0xE155a0A255Bcbf5f1Dd0939513de289679d2955c";
  const contractABI = abi.abi;

  // Get the node connection and wallet connection.
  const provider = new ethers.AlchemyProvider("sepolia", process.env.SEPOLIA_API_KEY);

  // Ensure that signer is the SAME address as the original contract deployer,
  // or else this script will fail with an error.
  const signer = new hre.ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Instantiate connected contract.
  const buyMeACoffee = new hre.ethers.Contract(contractAddress, contractABI, signer);

  // Check starting balances.
  console.log("current balance of owner: ", await getSpecificBalance(provider, signer.address), "ETH");
  const contractBalance = await getSpecificBalance(provider, buyMeACoffee.target);
  console.log("current balance of contract: ", await getSpecificBalance(provider, buyMeACoffee.target), "ETH");

  // Withdraw funds if there are funds to withdraw.
  if (contractBalance !== "0.0") {
    console.log("withdrawing funds..")
    const withdrawTxn = await buyMeACoffee.withdrawTips();
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