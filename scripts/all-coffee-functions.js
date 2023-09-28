const hre = require("hardhat");

// Returns the Ether balance of a given address in a formatted string.
async function getSpecificBalance(address) {
  const balanceBigInt = await ethers.provider.getBalance(address);
  return ethers.formatEther(balanceBigInt);
}

// Logs the Ether balances for a list of addresses.
async function printBalances(addresses) {
  let i = 0;
  for (const address of addresses) {
    console.log(`Address ${i} (${address}) balance: ${await getSpecificBalance(address)} ETH`);
    i++;
  }
}

// Logs the memos stored on-chain from coffee purchases.
async function printMemos(memos) {
  for (const memo of memos) {
    const timestamp = memo.timestamp;
    const tipper = memo.name;
    const tipperAddress = memo.from;
    const message = memo.message;
    console.log(`At ${timestamp}, ${tipper} (${tipperAddress}) said: "${message}"`);
  }
}

async function main() {

  // Deploy the contract. Wait for the contract to be deployed. Log the contract address.
  const buyMeACoffee = await hre.ethers.deployContract("BuyMeACoffee");
  await buyMeACoffee.waitForDeployment();
  console.log(`Deployed BuyMeACoffee.sol at address: ${buyMeACoffee.target}`)

  // Get the example accounts and their addresses we'll be working with.
  const [owner, tipper, tipper2, tipper3] = await hre.ethers.getSigners();
  const addresses = [owner.address, tipper.address, tipper2.address, tipper3.address, buyMeACoffee.target];

  // Check balances before the coffee purchase.
  console.log("printing starting balances...");
  await printBalances(addresses);

  // tippers connect to contract and buy coffee.
  const tip = {value: hre.ethers.parseEther("1")};
  await buyMeACoffee.connect(tipper).buyCoffee("Carolina", "You're the best!", tip);
  await buyMeACoffee.connect(tipper2).buyCoffee("Vitto", "Amazing teacher", tip);
  await buyMeACoffee.connect(tipper3).buyCoffee("Kay", "I love my Proof of Knowledge", tip);

  // Check balances after the coffee purchases.
  console.log("== bought coffee ==");
  await printBalances(addresses);

  // Withdraw funds to the owner (address 0).
  await buyMeACoffee.connect(owner).withdrawTips();

  // Check balances after owner withdraws.
  console.log("== Owner Withdrew Tips ==");
  await printBalances(addresses);

  // Look at the memos.
  console.log("== memos ==");
  const memos = await buyMeACoffee.getMemos();
  printMemos(memos);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});