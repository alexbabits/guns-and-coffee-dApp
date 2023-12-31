// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "hardhat/console.sol";
contract PaymentHandler {
    
    // Struct defining the shape of a memo.
    struct Memo {
        address from;
        uint256 timestamp;
        string name;
        string message;
        uint256 totalPriceInWei;
        string productName;
    }

    // Array to store all the memos received from product purchases.
    Memo[] memos;
    // Counter for all purchases
    uint256 public totalPurchases;
    // Address of contract deployer. Payable allows for withdraws to this address later.
    address payable owner;

    // Event to emit when a Memo is created.
    event NewMemo(
        address indexed from,
        uint256 timestamp,
        string name,
        string message,
        uint256 totalPriceInWei,
        string productName
    );

    constructor() {
        // Store the address of the deployer as a payable address.
        owner = payable(msg.sender);
    }

    // Returns memos array containing all current memos, costing no gas.
    function getMemos() public view returns (Memo[] memory) {
        return memos;
    }

    // Allows anyone to buy a product, specifying name, message, price, and product name.
    function buyProduct(string memory _name, string memory _message, uint256 _totalPriceInWei, string memory _productName) public payable {

        // Must accept more than 0 ETH for a product, value on frontend must match.
        require(msg.value > 0, "can't buy products for free!");
        require(msg.value == _totalPriceInWei, "totalPriceInWei does not match transaction value!");

        // Add the memo to memos array.
        memos.push(Memo(
            msg.sender,
            block.timestamp,
            _name,
            _message,
            _totalPriceInWei,
            _productName
        ));

        // Emit a NewMemo event with details about the memo.
        emit NewMemo(
            msg.sender,
            block.timestamp,
            _name,
            _message,
            _totalPriceInWei,
            _productName
        );

        // Update counter
        totalPurchases++;
    }

    // Allows owner to withdraw tips by calling withdraw.js script.
    function withdrawFunds() public {
        require(msg.sender == owner);
        owner.transfer(address(this).balance);
    }
}