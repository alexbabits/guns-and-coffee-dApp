import abi from "../artifacts/contracts/BuyMeACoffee.sol/BuyMeACoffee.json";
import { ethers } from 'ethers';
import Head from 'next/head';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
	// Contract Address & ABI
	const contractAddress = '0x705C4600329D125E146ce1c1f69c98bE83462a2B';
	const contractABI = abi.abi;

	// Component state. (Allows for storing of values that may change and cause re-rendering)
	// `useState` hook is used to store and update state variables in a functional component.
	// It returns an array with two elements: the current state value and a function to update it.
	const [currentAccount, setCurrentAccount] = useState('');
	const [name, setName] = useState('');
	const [message, setMessage] = useState('');
	const [memos, setMemos] = useState([]);

	// event handler functions for 'onChange' events. Updates the name and message variables state.
	// Ensures that the displayed value and state value are always in sync.
	const onNameChange = event => {
		setName(event.target.value);
	};

	const onMessageChange = event => {
		setMessage(event.target.value);
	};

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

	// Function calls `buyCoffee` from our smart contract.
	const buyCoffee = async () => {
		try {
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
				// Passes in name, message, and the tip amount
				console.log('buying coffee..');
				const coffeeTxn = await buyMeACoffee.buyCoffee(
					name ? name : 'anon',
					message ? message : 'Enjoy your coffee!',
					{ value: ethers.parseEther('0.001') }
				);

				await coffeeTxn.wait();

				console.log('mined ', coffeeTxn.hash);
				console.log('coffee purchased!');

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

				console.log('fetching memos from the blockchain..');
				const memos = await buyMeACoffee.getMemos();
				console.log('fetched!');
				setMemos(memos);
			} else {
				console.log('Metamask is not connected');
			}
		} catch (error) {
			console.log(error);
		}
	};

	// performs side effects (data fetching, DOM manips, set up event listeners, other task)
	// Takes in two arguments, the code to run and optional dependency array.
	// provides a designated place to setup tasks without interfering with the rendering process.
	useEffect(() => {

		// Instantiate contract and call functions to check connection and get current memos.
		let buyMeACoffee;
		isWalletConnected();
		getMemos();

		// Create an event handler function for when someone sends us a new memo.
		const onNewMemo = (from, timestamp, name, message) => {
			console.log('Memo received: ', from, timestamp, name, message);
			// Updates memo state
			setMemos(prevState => [
				...prevState,
				{
					address: from,
					timestamp: new Date(Number(timestamp)),
					message,
					name
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
									placeholder="anon"
									onChange={onNameChange}
								/>
							</div>
							<br />
							<div>
								<label>Send Alex a message</label>
								<br />

								<textarea
									rows={3}
									placeholder="Enjoy your coffee!"
									id="message"
									onChange={onMessageChange}
									required
								/>
							</div>
							<div>
								<button type="button" onClick={buyCoffee}>
									Send 1 Coffee for 0.001ETH
								</button>
							</div>
						</form>
					</div>
				) : (
					<button onClick={connectWallet}> Connect your wallet </button>
				)}
			</main>

			{currentAccount && <h1>Messages from Customers</h1>}

			{currentAccount &&
				memos.map((memo, idx) => {
					return (
						<div
							key={idx}
							style={{
								border: '2px solid',
								borderRadius: '5px',
								padding: '5px',
								margin: '5px'
							}}
						>
							<p style={{ fontWeight: 'bold' }}>"{memo.message}"</p>
							<p>
								From: {memo.name} at {memo.timestamp.toString()}
							</p>
						</div>
					);
				})}

			<footer className={styles.footer}>
				<a
					href="https://alchemy.com/?a=roadtoweb3weektwo"
					target="_blank"
					rel="noopener noreferrer"
				>
					Created by @thatguyintech for Alchemy's Road to Web3 lesson two!
				</a>
			</footer>
		</div>
	);
}
