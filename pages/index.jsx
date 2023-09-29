import abi from "../artifacts/contracts/PaymentHandler.sol/PaymentHandler.json";
import { ethers } from 'ethers';
import Head from 'next/head';
import Image from 'next/image';
import React, { useEffect, useState} from 'react';
import styles from '../styles/Home.module.css';
import { RingLoader } from "react-spinners";

export default function Home() {
	// Contract Address & ABI
	const contractAddress = '0x9a5c4290C3c768a41afac7306D05Fe4B32E7D93a';
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
	const [isLoading, setIsLoading] = useState(false);


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
	

	// Function calls `buyProduct` from our smart contract.
	const buyProduct = async (price, tip, productName) => {
		try {
			
			// Calculating total amount customer owes.
			const priceInWei = BigInt(ethers.parseEther(price));
			const tipInWei = BigInt(ethers.parseEther(tip));
			const totalPriceInWei = priceInWei + tipInWei;

			const { ethereum } = window;

			if (ethereum) {
				// instantiate contract. Notice provider is now metamask wallet!
				const provider = new ethers.BrowserProvider(ethereum, 'any')
				const signer = await provider.getSigner();
				const paymentHandler = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);

				// Calls `buyProduct` function from smart contract
				// Passes in name, message, total price, product name and override value.
				// `value` is the actual override indicating amount of eth to be sent with transaction.
				setIsLoading(true);
				console.log('Processing item purchase, please wait...');

				const Txn = await paymentHandler.buyProduct(
					name ? name : 'Anonymous',
					message ? message : 'None.',
					totalPriceInWei,
					productName,
					{ value: totalPriceInWei.toString() }
				);
				
				// wait for tx to be mined, get and update counter, log hash, set loading to false for spinner display.
				await Txn.wait();
				setIsLoading(false);
				getTotalPurchases();
				console.log('Item successfully purchased! On chain tx hash receipt: ', Txn.hash);

				// Clear the form fields.
				setName('');
				setMessage('');
			}
		} catch (error) {
			setIsLoading(false);
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
				const paymentHandler = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);
				console.log(`Fetching memos...`)
				// getMemos function works fine in solidity code, understanding the structs.
				// But calling getMemos externally through react, it doesn't see the data as an array of structs
				// Instead it sees it as an array of arrays, since each struct has multiple 'indexes'.
				// Therefore we need to parse each 'index' (specific struct type) from each array.
				const rawMemos = await paymentHandler.getMemos();
				const parsedMemos = rawMemos.map(memo => ({
					address: memo[0],
					timestamp: new Date(Number(memo[1]) * 1000), // Convert from UNIX timestamp
					name: memo[2],
					message: memo[3],
					totalPrice: ethers.formatEther(memo[4]),
					productName: memo[5]
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
		const paymentHandler = new ethers.Contract(contractAddress, contractABI, provider);
		// Solidity auto-generates getter functions, which are same as the variable name
		// For public state variables, so you can simply call them and fetch the data!
		const totalPurchases = await paymentHandler.totalPurchases();
		setPurchaseCounter(totalPurchases.toString());
	};	  

	// performs side effects (data fetching, DOM manips, set up event listeners, other task)
	// Takes in two arguments, the code to run and optional dependency array.
	// provides a designated place to setup tasks without interfering with the rendering process.
	useEffect(() => {

		// Call functions to check and grab current status.
		let paymentHandler;
		isWalletConnected();
		getMemos();
		getTotalPurchases();

		// Create an event handler function for when someone sends us a new memo.
		const onNewMemo = (from, timestamp, name, message, totalPriceInWei, productName) => {
			console.log('Memo received: ', from, timestamp, name, message, totalPriceInWei, productName);
			// Updates memo state
			setMemos(prevState => [
				...prevState,
				{
					address: from,
					timestamp: new Date(Number(timestamp) * 1000),
					message,
					name,
					totalPrice: ethers.formatEther(totalPriceInWei),
					productName
				}
			]);
		};

		const { ethereum } = window;
		// Immediataly invoked async function
		(async () => {
			if (ethereum) {
				const provider = new ethers.BrowserProvider(ethereum, 'any');
				const signer = await provider.getSigner();
				paymentHandler = new ethers.Contract(contractAddress, contractABI, signer);
				// attach event listener to contract, if `NewMemo` is emitted, `onNewMemo` will be called.
				paymentHandler.on('NewMemo', onNewMemo);
			}
		})();
		// cleanup and remove event listener
		return () => {
			if (paymentHandler) {
				paymentHandler.off('NewMemo', onNewMemo);
			}
		};
	}, []);

	return (
		<>
		<div className={styles.underlay}></div>
		<div className={styles.container}>
			<Head>
				<title>Products for Sale!</title>
				<meta name="description" content="E-commerce Site" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className={styles.main}>
				<h1 className={styles.title}>We Sell Products!</h1>

				{currentAccount ? (
					<div>
						<form>
							<div>
								<br />
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
								<label>Send us a message!</label>
								<br />

								<textarea
									rows={3}
									placeholder=""
									id="message"
									onChange={onMessageChange}
									required
								/>
							</div>
							<br />
							<div>
								<button type="button" onClick={() => buyProduct('0.001', tip, 'Small Coffee')}>Buy 1 Small Coffee for 0.001 ETH</button>
							</div>
							<Image src="/smallcoffee.png" alt="Small Coffee Image" width={50} height={50} />
							<br />
							<div>
								<button type="button" onClick={() => buyProduct('0.003', tip, 'Large Coffee')}>Buy 1 Large Coffee for 0.003 ETH</button>
							</div>
							<Image src="/largecoffee.png" alt="Large Coffee Image" width={50} height={75} />
							<br />
							<div>
								<label>Buy Donut for any amount of ETH</label>
								<br />
								<input 
									type="number"
									step="0.001"
									min="0.001"
									value={customAmount}
									onChange= {onCustomAmountChange}
								/>
								<div><button type="button" onClick={() => buyProduct(customAmount, tip, 'Donut')}>Buy Donut</button></div>
								<Image src="/donut.png" alt="Coffee Image" width={50} height={50} />
							</div>
							<br />
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
							<Image src="/tipjar.png" alt="Large Coffee Image" width={50} height={75} />
							<br /><br />
							<div><button onClick={disconnectWallet}> Logout </button></div>
							<br /><br />
							<div>Total Purchases: {purchaseCounter}</div>
							<br /><br />
						</form>
						{isLoading && <div>Waiting for purchase to be validated on chain...</div>}
						<br />
						{isLoading && <RingLoader color="green" size={100} speedMultiplier={0.5} />}
					</div>
				) : (
					<div><button onClick={connectWallet}> Connect your wallet </button></div>
				)}
			</main>

			{currentAccount && <h1>Customer Receipts</h1>}
			{currentAccount &&
				memos.map((memo, i) => {
					return (
						<div 
						key={i}
						style={{border: '2px solid', borderRadius: '5px', padding: '5px', margin: '5px'}}
						>
							<p style={{ fontWeight: 'bold' }}>{memo.name} purchased {memo.productName} for {memo.totalPrice} ETH</p>
							<p>Customer's Message: "{memo.message}"</p>
							<p>{memo.timestamp.toString()}</p>
						</div>
					);
				})}

			<footer className={styles.footer}>
				<p><a href="https://github.com/alexbabits" color="#edc841" target="_blank" rel="noopener noreferrer">Created by Alex Babits</a></p>
				<p><a href="https://docs.alchemy.com/docs/how-to-build-buy-me-a-coffee-defi-dapp" color="#edc841" target="_blank" rel="noopener noreferrer">Inspired by @thatguyintech</a></p>
			</footer>
		</div>
		</>
	);
}
