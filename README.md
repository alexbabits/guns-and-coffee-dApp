## Setup
- Clone repo, requires `npm install solc` if don't have yet.
- `npm init -y` and `npm install` to install local dependencies. (NOTE: This uses hardhat-toolbox package which is all we need now, rather than all the separate packages from hardhat shown in the original Alchemy tutorial.)
- Have a metamask dev wallet, alchemy account.
- Fill .env with valid information based on .env.example


## Summary
1. Wrote and Deployed a custom smart contract to Sepolia which allows for users to send ETH tips to the deployed contract address.
2. Owner can withdraw funds from the contract.
3. Wrote scripts to make sure all the functionality worked.
4. Integrated smart contract into front end. Also allows for metamask integration
NOTE: When you deploy your contract, it will have it's own address. Populate your address in the `withdraw.js` file, as well as the index.jsx.

## Commands
- `npx hardhat run scripts/deploy-coffee.js` if you only want to deploy the contract to local hardhat instance and nothing else.
- `npx hardhat run scripts/buy-coffee.js` can be used to deploy and then test all the functionality on the local hardhat instance. 
- `npx hardhat run scripts/deploy-coffee.js --network sepolia` used to deploy onto Sepolia.
- `npx hardhat run scripts/withdraw.js` can be used once contract is deployed and it some ether from tips someone or yourself send it, you can execute this script to withdraw funds to owner (you). 
- `npm run dev` to run server and see on `http://localhost:3000`

## Important
- This uninstalled ethers 5.6.5 and installed ethers 6.4.0. Uses ethers 6.4.0 for the frontend with next.js, and 6.4.0 with hardhat-toolbox.
- deploy-coffee.js does work to deploy to local hardhat instance
- all-coffee-functions.js does work within that instance as well to deploy and do all the functions.
- withdraw.js works on sepolia as well.
- Fixed index.jsx (using await for the signer, and some other v6 ethers syntax updates)
- Even though it technically throws an error for `npx hardhat run scripts/deploy-coffee.js --network sepolia` when I updated to v6 ethers, it still deploys the contract and outputs the tx hash in the terminal you can lookup, everything works fine. They say it's patched in v6.6.4 but didn't want to investigate further by switching versions again: https://github.com/ethers-io/ethers.js/releases/tag/v6.6.4
https://github.com/ethers-io/ethers.js/issues/3835

## References:
- https://www.youtube.com/watch?v=cxxKdJk55Lk
- https://docs.alchemy.com/docs/how-to-build-buy-me-a-coffee-defi-dapp
- https://sepolia.etherscan.io/address/0xceed1b64f19ad514eb9e1dfb53409cd063c87f85
- https://docs.ethers.org/v6/




"Note: Nethermind returns both v and yParity, both hex encoded, for all transaction types (I believe they are just trying to be super defensive). I think it is important to note that a v of 0x0 or 0x1 is not a valid v! Nethermind gets this wrong, but it is inaccurate to compare v against yParity. They are not the same thing and should not match. I didn't spend enough time on this to figure out why ethers is looking for a v in a type 1 or type 2 transaction, any v value included in those should be ignored as any other excess property is ignored. Only yParity is valid for those transaction types."

"There are two bugs currently.

1. yParity should be encoded as a hex string, not a number, in the JSON-RPC response. Some clients may encode it as a number (despite this being wrong) so it seems reasonable to accept either number or 0x${string} in ethers.

2. If a transaction is type 1 or 2, it should only have a yParity. If it has both a v and a yParity, the v should be ignored like any other extraneous unsupported parameter. If it has only a v and no yParity I would consider this an error, but if some existing clients do this you could try to interpret the v somehow. It strikes me as incorrect to simply call it yParity (expecting a value of 0 or 1), but such a client is already incorrect so it wouldn't surprise me if it was doubly incorrect. I think if you wanted to be as absolutely defensive as possible you would convert 0 or 1 directly to yParity, and you would treat any other values as a legacy/155 transaction v and figure out what the y parity bit is and derive yParity from that.

If there are no clients that fail to include yParity in type 1/2 TransactionResponses then my recommendation is to not write and maintain all of the code to convert v to yParity as it would just be code that isn't actually used and encourages future clients to misbehave."