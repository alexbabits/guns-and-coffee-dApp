import abi from "../artifacts/contracts/BuyMeACoffee.sol/BuyMeACoffee.json";
import { ethers } from 'ethers';
import Head from 'next/head';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
	// Contract Address & ABI
	const contractAddress = '0x3AD8B84366A563dB8B6D46e01c0bda2e4e89563f';
	const contractABI = abi.abi;

	// Component state. (Allows for storing of values that may change and cause re-rendering)
	// `useState` hook is used to store and update state variables in a functional component.
	// It returns an array with two elements: the current state value and a function to update it.
	const [currentAccount, setCurrentAccount] = useState('');
	const [name, setName] = useState('');
	const [message, setMessage] = useState('');
	const [memos, setMemos] = useState([]);
	const [customAmount, setCustomAmount] = useState("0.001");
	const [tip, setTip] = useState("0.001");
	const [purchaseCounter, setPurchaseCounter] = useState(0); 


	// event handler functions for 'onChange' events. Updates the name/message/customAmount variables state.
	// Ensures that the displayed value and state value are always in sync.
	const onNameChange = event => {setName(event.target.value)};
	const onMessageChange = event => {setMessage(event.target.value)};
	const onCustomAmountChange = event => {setCustomAmount(event.target.value)};
	const onTipChange = event => {setTip(event.target.value)};

	// `ethereum` is a global API injected into the browser by MetaMask (or other Ethereum wallets/extensions).
	// This API serves as the bridge, allowing the dApp to interact with the Ethereum blockchain and the user's wallet.
	// `window` is a global object in the browser environment, representing the browser window. 
	// It contains methods, properties, and event handlers related to the current browser tab and its content.
	const isWalletConnected = async () => {
		try {
			// Grabs ethereum API from the window and allows you to use it within the function
			const { ethereum } = window;
			// .request sends JSON-RPC requests to blockchain, in our case looking for the users accounts.
			const accounts = await ethereum.request({ method: 'eth_accounts' });
			console.log('accounts: ', accounts);

			if (accounts.length > 0) {
				const account = accounts[0];
				console.log('wallet is connected! ' + account);
			} else {
				console.log('make sure MetaMask is connected');
			}
		} catch (error) {
			console.log('error: ', error);
		}
	};

	// Connects metamask wallet to dApp
	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				console.log('please install MetaMask');
			}
			// Prompts user to connect their account to dApp, if they do it returns array of their accounts.
			const accounts = await ethereum.request({method: 'eth_requestAccounts'});
			// Setter function updating the state of the current user account to their first.
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error);
		}
	};

	// Sets Current Account to null. (forgest users address)
	const disconnectWallet = () => {
		try {
			// Wallet is not technically disconnected, the address is just no longer stored in the dApp
			setCurrentAccount(null);
			console.log('Forgetting address:', currentAccount);
		} catch (error) {
			console.log(error);
		}
	};
	

	// Function calls `buyCoffee` from our smart contract.
	const buyCoffee = async (price, tip) => {
		try {
			
			// Calculating total amount owed
			const priceInWei = BigInt(ethers.parseEther(price));
			const tipInWei = BigInt(ethers.parseEther(tip));
			const totalPriceInWei = priceInWei + tipInWei;

			const { ethereum } = window;

			if (ethereum) {
				// instantiate contract. Notice provider is now metamask wallet!
				const provider = new ethers.BrowserProvider(ethereum, 'any')
				const signer = await provider.getSigner();
				const buyMeACoffee = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);

				// Calls `buyCoffee` function from smart contract
				// Passes in name, message, total price
				// value is the actual override indicating amount of eth to be sent with transaction.
				console.log('Processing item purchase, please wait...');
				const coffeeTxn = await buyMeACoffee.buyCoffee(
					name ? name : 'Anonymous',
					message ? message : 'None.',
					totalPriceInWei,
					{ value: totalPriceInWei.toString() }
				);

				// wait for tx to be mined, update counter and log hash.
				await coffeeTxn.wait();
				getTotalPurchases();
				console.log('Item successfully purchased! On chain tx hash receipt: ', coffeeTxn.hash);

				// Clear the form fields.
				setName('');
				setMessage('');
			}
		} catch (error) {
			console.log(error);
		}
	};

	// Function calls `getMemos` from our smart contract.
	const getMemos = async () => {
		try {
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.BrowserProvider(ethereum);
				const signer = await provider.getSigner();
				const buyMeACoffee = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);
				console.log(`Fetching memos...`)
				// getMemos function works fine in solidity code, understanding the structs.
				// But calling getMemos externally through react, it doesn't see the data as an array of structs
				// Instead it sees it as an array of arrays, since each struct has multiple 'indexes'.
				// Therefore we need to parse each 'index' (specific struct type) from each array.
				const rawMemos = await buyMeACoffee.getMemos();
				const parsedMemos = rawMemos.map(memo => ({
					address: memo[0],
					timestamp: new Date(Number(memo[1]) * 1000), // Convert from UNIX timestamp
					name: memo[2],
					message: memo[3],
					totalPrice: ethers.formatEther(memo[4])
				}));
				console.log(`Memos successfully fetched!`)
				setMemos(parsedMemos);
			} else {
				console.log('Metamask is not connected');
			}
		} catch (error) {
			console.log(error);
		}
	};

	// Fetches current counter for number of purchases made total
	const getTotalPurchases = async () => {
		// Notice signer not needed to instantiate contract, simply fetching data from on chain.
		const provider = new ethers.BrowserProvider(ethereum, 'any');
		const buyMeACoffee = new ethers.Contract(contractAddress, contractABI, provider);
		// Solidity auto-generates getter functions, which are same as the variable name
		// For public state variables, so you can simply call them and fetch the data!
		const totalPurchases = await buyMeACoffee.totalPurchases();
		setPurchaseCounter(totalPurchases.toString());
	};	  

	// performs side effects (data fetching, DOM manips, set up event listeners, other task)
	// Takes in two arguments, the code to run and optional dependency array.
	// provides a designated place to setup tasks without interfering with the rendering process.
	useEffect(() => {

		// Call functions to check and grab current status.
		let buyMeACoffee;
		isWalletConnected();
		getMemos();
		getTotalPurchases();

		// Create an event handler function for when someone sends us a new memo.
		const onNewMemo = (from, timestamp, name, message, totalPriceInWei) => {
			console.log('Memo received: ', from, timestamp, name, message, totalPriceInWei);
			// Updates memo state
			setMemos(prevState => [
				...prevState,
				{
					address: from,
					timestamp: new Date(Number(timestamp) * 1000),
					message,
					name,
					totalPrice: ethers.formatEther(totalPriceInWei)
				}
			]);
		};

		const { ethereum } = window;
		// Immediataly invoked async function
		(async () => {
			if (ethereum) {
				const provider = new ethers.BrowserProvider(ethereum, 'any');
				const signer = await provider.getSigner();
				buyMeACoffee = new ethers.Contract(contractAddress, contractABI, signer);
				// attach event listener to contract, if `NewMemo` is emitted, `onNewMemo` will be called.
				buyMeACoffee.on('NewMemo', onNewMemo);
			}
		})();
		// cleanup and remove event listener
		return () => {
			if (buyMeACoffee) {
				buyMeACoffee.off('NewMemo', onNewMemo);
			}
		};
	}, []);

	return (

		<div className={styles.container}>
			<Head>
				<title>Buy Alex a Coffee!</title>
				<meta name="description" content="Tipping site" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className={styles.main}>
				<h1 className={styles.title}>Buy Alex a Coffee!</h1>

				{currentAccount ? (
					<div>
						<form>
							<div>
								<label>Name</label>
								<br />

								<input
									id="name"
									type="text"
									placeholder="Anonymous"
									onChange={onNameChange}
								/>
							</div>
							<br />
							<div>
								<label>Send Alex a message</label>
								<br />

								<textarea
									rows={3}
									placeholder="None."
									id="message"
									onChange={onMessageChange}
									required
								/>
							</div>
							<div>
								<button type="button" onClick={() => buyCoffee('0.001', tip)}>Buy 1 Coffee for 0.001 ETH</button>
							</div>
							<div>
								<button type="button" onClick={() => buyCoffee('0.003', tip)}>Buy 1 Large Coffee for 0.003 ETH</button>
							</div>
							<div>
								<label>Buy with Custom Amount (ETH)</label>
								<br />
								<input 
									type="number"
									step="0.001"
									min="0.001"
									value={customAmount}
									onChange= {onCustomAmountChange}
								/>
								<div><button type="button" onClick={() => buyCoffee(customAmount, tip)}>Buy with Custom Amount</button></div>
							</div>
							<div>
								<label>Include tip? (ETH)</label>
								<br />
								<input 
									type="number"
									step="0.001"
									min="0.0"
									value={tip}
									onChange= {onTipChange}
								/>
							</div>
							<div><button onClick={disconnectWallet}> Logout </button></div>
							<div>Total Purchases: {purchaseCounter}</div>
						</form>
					</div>
				) : (
					<div><button onClick={connectWallet}> Connect your wallet </button></div>
				)}
			</main>

			{currentAccount && <h1>Messages from Customers</h1>}
			{currentAccount &&
				memos.map((memo, i) => {
					return (
						<div 
						key={i}
						style={{border: '2px solid', borderRadius: '5px', padding: '5px', margin: '5px'}}
						>
							<p style={{ fontWeight: 'bold' }}>{memo.name} purchased an item on {memo.timestamp.toString()}</p>
							<p>Value: {memo.totalPrice} ETH</p>
							<p>Special Message: {memo.message}</p>
						</div>
					);
				})}

			<footer className={styles.footer}>
			<p>Created by<a href="https://github.com/alexbabits" target="_blank" rel="noopener noreferrer">xyz</a></p>
			<p>Inspired by<a href="https://docs.alchemy.com/docs/how-to-build-buy-me-a-coffee-defi-dapp" target="_blank" rel="noopener noreferrer">abc</a></p>
			</footer>
		</div>
	);
}
