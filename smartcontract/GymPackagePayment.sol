// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GymPackagePayment {
    address public owner;
    mapping(string => uint256) private packagePrices;

    event PackagePriceUpdated(string indexed packageSlug, uint256 newPriceWei);
    event PackagePaid(address indexed payer, string packageSlug, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, 'Only owner');
        _;
    }

    constructor() {
        owner = msg.sender;

        // Gia mac dinh demo
        packagePrices['basic'] = 0.001 ether;
        packagePrices['pro'] = 0.002 ether;
        packagePrices['vip'] = 0.003 ether;
    }

    function setPackagePrice(string calldata packageSlug, uint256 priceWei) external onlyOwner {
        require(bytes(packageSlug).length > 0, 'Invalid slug');
        packagePrices[packageSlug] = priceWei;
        emit PackagePriceUpdated(packageSlug, priceWei);
    }

    function getPackagePrice(string calldata packageSlug) external view returns (uint256) {
        return packagePrices[packageSlug];
    }

    function payForPackage(string calldata packageSlug) external payable {
        uint256 requiredAmount = packagePrices[packageSlug];
        require(requiredAmount > 0, 'Package not configured');
        require(msg.value >= requiredAmount, 'Insufficient ETH');

        emit PackagePaid(msg.sender, packageSlug, msg.value, block.timestamp);
    }

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), 'Invalid address');
        require(amount <= address(this).balance, 'Amount exceeds balance');

        (bool success, ) = to.call{value: amount}('');
        require(success, 'Withdraw failed');

        emit Withdrawal(to, amount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), 'Invalid new owner');
        owner = newOwner;
    }
}
