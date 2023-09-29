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

// Logs the memos stored on-chain from product purchases.
async function printMemos(memos) {
  for (const memo of memos) {
    const timestamp = memo.timestamp;
    const customer = memo.name;
    const customerAddress = memo.from;
    const message = memo.message;
    const totalPrice = memo.totalPriceInWei
    const productName = memo.productName
    console.log(`At ${timestamp}, ${customer} (${customerAddress}) said:`);
    console.log(`"${message}." Price was ${totalPrice}. Product name was ${productName}`)
  }
}

async function main() {

  // Deploy the contract. Wait for the contract to be deployed. Log the contract address.
  const paymentHandler = await hre.ethers.deployContract("PaymentHandler");
  await paymentHandler.waitForDeployment();
  console.log(`Deployed PaymentHandler.sol at address: ${paymentHandler.target}`)

  // Get the example accounts and their addresses we'll be working with.
  const [owner, customer, customer2, customer3] = await hre.ethers.getSigners();
  const addresses = [owner.address, customer.address, customer2.address, customer3.address, paymentHandler.target];

  // Check balances before the product purchase.
  console.log("printing starting balances...");
  await printBalances(addresses);

  // customers connect to contract and buy a product.
  // totalPriceInWeiValue is the override actual value that gets passed as an optional parameter.
  // totalPriceInWei is the simulated frontend price that the user will choose.
  const totalPriceInWei = hre.ethers.parseEther("1");
  const productName = 'Coffee'
  const totalPriceInWeiValue = {value: hre.ethers.parseEther("1")};
  await paymentHandler.connect(customer).buyProduct("Kyle", "black no cream no sugar.", totalPriceInWei, productName, totalPriceInWeiValue);
  await paymentHandler.connect(customer2).buyProduct("Vitto", "Thanks!", totalPriceInWei, productName, totalPriceInWeiValue);
  await paymentHandler.connect(customer3).buyProduct("Chloe", "Extra sugar please!", totalPriceInWei, productName, totalPriceInWeiValue);

  // Check balances after the product purchases.
  console.log(`== bought ${productName} ==`);
  await printBalances(addresses);

  // Withdraw funds to the owner (address 0).
  await paymentHandler.connect(owner).withdrawFunds();

  // Check balances after owner withdraws.
  console.log("== Owner Withdrew Funds ==");
  await printBalances(addresses);

  // Look at the memos.
  console.log("== memos ==");
  const memos = await paymentHandler.getMemos();
  printMemos(memos);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});