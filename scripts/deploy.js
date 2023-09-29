const hre = require("hardhat");

async function main() {
  // Deploy the contract. Wait for the contract to be deployed. Log the contract address.
  const paymentHandler = await hre.ethers.deployContract("PaymentHandler");
  await paymentHandler.waitForDeployment();
  console.log(`Deployed PaymentHandler.sol at address: ${paymentHandler.target}`)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
