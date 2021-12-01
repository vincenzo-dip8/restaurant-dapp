// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

contract RestaurantContract{
    address payable _owner; 
    mapping(string => string) hashTable;
    string clap = "3";

    constructor() {
        _owner = payable(msg.sender);
    }

    receive () external payable{}

    modifier onlyOwner(){
        require(msg.sender == _owner, "Not owner");
        _;
    }

    function forwardPayment(uint256 amount, string memory _orderHash) public payable {
        require(msg.value == amount);
        (bool sent, ) = _owner.call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        hashTable[_orderHash]= _orderHash;
    }

    function getData(string memory _orderHash) view public onlyOwner returns(string memory) {
        // require(msg.sender == _owner);
        return hashTable[_orderHash];
    }

    function getClap() view public returns(string memory _clap){
        return clap;
    }
    
}
