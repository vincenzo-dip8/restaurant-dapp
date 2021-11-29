// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

contract RestaurantContract{
    address payable public _owner ="0x684F22798FEf8dDcaCB8278447703787293cEe07";   //to specify
    mapping(bytes32 => bytes32) hashTable;

    event Transfer(address sender, uint amount, address receiver);  //declare event
    event getHash(string indexed _txHash, string _orderHash);  //declare event

    function updateCollection(string hashOrder, string hashTransaction) {
        hashTable[hashOrder] = hashTransaction;
    }

    function WIW (uint _amount, ){
        //check the amount and the msg.value
        require(msg.value == _amount);
        //send the ether to the contract/owner
            //the data field should have: amount, receiver, hashOrder
        //if contract i need to declare
        //emit an event
        hashTable[_orderHash]= _hashTransaction ;
    }

    function deposit(uint256 amount) payable public {
        require(msg.value == amount);
        // nothing else to do!
        _owner.transfer(address(this).balance);
    }

    fallback() external payable {
        hashTable[_orderHash]= _hashTransaction ;
    }

    function transferEther(uint _amount) public{
        // if(msg.value != transactionAmount){
        //     revert();
        // }
        require(msg.value == _amount);
        address(this).transfer(msg.value);
        _owner.transfer(msg.value);
        emit Transfer(msg.sender, msg.value, Owner);
    }

    modifier onlyOwner(){
        require(msg.sender == Owner, "Not owner");
        _;
    }

    function putData(string memory _orderHash, string memory _hashTransaction) public{
        hashTable[_orderHash]= _hashTransaction ;
    }

    function getData(string memory _txHash, string _orderHash) view onlyOwner {
        return(hashTable[_orderHash]) ;
    }

}