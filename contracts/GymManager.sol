// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GymManager {
    struct Member {
        string fullName;
        uint256 expiresAt;
        bool active;
    }

    address public owner;
    uint256 public membershipPrice;
    uint256 public membershipDuration;

    mapping(address => Member) private members;

    event MembershipPurchased(address indexed member, uint256 expiresAt);
    event MembershipRenewed(address indexed member, uint256 expiresAt);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(uint256 _membershipPrice, uint256 _membershipDuration) {
        owner = msg.sender;
        membershipPrice = _membershipPrice;
        membershipDuration = _membershipDuration;
    }

    function buyMembership(string calldata fullName) external payable {
        require(msg.value == membershipPrice, "Invalid payment");
        require(bytes(fullName).length > 1, "Name too short");

        uint256 currentExpiry = members[msg.sender].expiresAt;
        uint256 baseTime = currentExpiry > block.timestamp ? currentExpiry : block.timestamp;
        uint256 newExpiry = baseTime + membershipDuration;

        members[msg.sender] = Member({
            fullName: fullName,
            expiresAt: newExpiry,
            active: true
        });

        emit MembershipPurchased(msg.sender, newExpiry);
    }

    function renewMembership() external payable {
        require(msg.value == membershipPrice, "Invalid payment");
        require(members[msg.sender].active, "No active membership");

        uint256 currentExpiry = members[msg.sender].expiresAt;
        uint256 baseTime = currentExpiry > block.timestamp ? currentExpiry : block.timestamp;
        uint256 newExpiry = baseTime + membershipDuration;

        members[msg.sender].expiresAt = newExpiry;

        emit MembershipRenewed(msg.sender, newExpiry);
    }

    function getMyMembership() external view returns (Member memory) {
        return members[msg.sender];
    }

    function withdraw() external onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
}
