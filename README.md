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


## Scripts
- `deploy-coffee.js` does work to deploy to local hardhat instance
- `all-coffee-functions.js` does work within that instance as well to deploy and do all the functions.
- `withdraw.js` works successfully with sepolia.


## Important:
- Uses ethers 6.7.1 for the frontend with next.js, and 6.4.0 with hardhat-toolbox.
- Fixed index.jsx (using await for the signer, and some other v6 ethers syntax updates)

## Goals
2. Make it better with more features and customize. 
    - include tip?
    - counters/coffe cup images for number of customers/total tips.
    - Loading text or image after coffee is purchased. 'processing order'.
    - tip with any ERC-20 (or USDC/LINK).
    - Change Coffee Theme.
    - tailwind for css, way better styling.
    - date defaults to 1970 until browser refresh.
    - Buy Coffee method in etherscan --> Buy Product
    - Withdraw Tips method in etherscan --> Withdraw Funds

3. Make frontend code and files more simple with `create-react-app` or something similar. Trim all fat. (optional)
4. Deploy on vercel rather than just local host (optional)

## References:
- https://www.youtube.com/watch?v=cxxKdJk55Lk
- https://docs.alchemy.com/docs/how-to-build-buy-me-a-coffee-defi-dapp
- https://sepolia.etherscan.io/address/0x00885e2b1Bbc06555d65303a6cBe9509B4DA16C9
- https://docs.ethers.org/v6/

![ok](public/1.png)