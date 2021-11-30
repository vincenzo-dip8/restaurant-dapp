// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

contract RestaurantContract{
    address payable _owner; //"0x684F22798FEf8dDcaCB8278447703787293cEe07"
    mapping(bytes32 => bytes32) hashTable;

    constructor() {
        _owner = msg.sender;
    }

    modifier onlyOwner(){
        require(msg.sender == _owner, "Not owner");
        _;
    }

    function forwardPayment(string memory _orderHash) public payable {
        require(msg.value > 0);
        _owner.transfer(msg.value);
    }

    // function deposit(uint256 amount) payable public {
    //     require(msg.value == amount);
    //     address(this).transfer(msg.value);
    // }

    // function withdraw() payable public onlyOwner {
    //     // require(msg.sender == _owner);
    //     msg.sender.transfer(address(this).balance);
    // }

    function putData(bytes32 _orderHash, bytes32 _hashTransaction) public{
        hashTable[_orderHash]= _hashTransaction ;
    }

    function getData(bytes32 _orderHash) view public onlyOwner returns(bytes32) {
        // require(msg.sender == _owner);
        return hashTable[_orderHash];
    }
    
}
