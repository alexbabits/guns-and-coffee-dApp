const hre = require("hardhat");

async function main() {
  // Deploy the contract. Wait for the contract to be deployed. Log the contract address.
  const buyMeACoffee = await hre.ethers.deployContract("BuyMeACoffee");
  await buyMeACoffee.waitForDeployment();
  console.log(`Deployed BuyMeACoffee.sol at address: ${buyMeACoffee.target}`)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
