// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Marketplace {
    struct Item
    {
        uint id; // uint represents unsigned integer
        string name;
        uint price;
        address payable seller; //who is selling
        address owner; // who is owner of the item
        bool isSold; // check if item is the sold
    }
   
    uint public itemCount = 0;
    //A mapping in Solidity is similar to a hash table or dictionary in other languages. It maps a key to a value
    mapping (uint => Item) public items; // the uint is the key type and Item is the value type referig to the struct Item
    mapping(address => uint[]) public ownedItems;

    //adds the item to the marketplace
    //msg.sender** is a global variable that is automatically available in every function call. 
    //It refers to the address of the account (or contract) that initiated the current function call.
    //memory indicates that the string is stored temporarily and is erased after the function execution, which is more gas-efficient for function parameters.
    function listItem(string memory _name, uint _price) public
    {
         //This is a built-in function in Solidity that checks if a condition is true. 
         //If the condition is false, the transaction is reverted (undone), and an error message is thrown.
         // if condition is true we proceed with the rest of the function
         require(_price > 0, "Price must be greater than zero");

         itemCount++;
         items[itemCount] = Item(itemCount, _name, _price, payable(msg.sender), msg.sender, false);
         ownedItems[msg.sender].push(itemCount);

    }
    function purchaseItem(uint _id) public payable {
        Item storage item = items[_id];
        require(_id > 0 && _id <= itemCount, "Item does not exist");
        require(msg.value == item.price, "Incorrect price"); //When a user or another contract sends Ether to a smart contract, the amount they send is stored in msg.value
        require(!item.isSold, "Item already sold");
        require(msg.sender != item.seller, "Seller cannot buy their own item");

        item.isSold = true;
        item.seller.transfer(msg.value); // it effectively transfers the Ether sent with the transaction (msg.value) from the smart contract to the seller's address.

        // Transfer ownership
        _transferOwnership(_id, item.seller, msg.sender);
        

    }

    function _transferOwnership(uint _id, address _from, address _to) internal
    {
         //This is the permanent storage on the blockchain. Variables stored here persist between function calls and transactions
         Item storage item = items[_id];
         item.owner = _to;

         // Remove item from the previous owner's list
         uint[] storage fromItems = ownedItems[_from]; //get all Item id related to owned items
         for (uint i = 0; i < fromItems.length; i++) {
            if (fromItems[i] == _id) {
                fromItems[i] = fromItems[fromItems.length - 1]; //Replaces it with the last item in the array (to maintain a continuous array without gaps).
                fromItems.pop(); //Removes the last item (which is now a duplicate).
                break;
            }
         }

         // Add item to the new owner's list
         ownedItems[_to].push(_id);

    }
    //transfer the item without any eth so no need for buyer to buy 

    function transferItem(uint _id, address _to) public{
         Item storage item = items[_id];
         require(_id > 0 && _id <= itemCount, "Item does not exist");
         require(msg.sender == item.owner, "You do not own this item"); //the one who calls this function must be the owner of the prouct

         _transferOwnership(_id, msg.sender, _to);


     }
    //The view keyword specifies that the function does not modify the state of the contract
    //he returns keyword indicates what type of data the function will return. In this case, returns (uint[] memory) 
    //specifies that the function will return an array of unsigned integers (uint), which is stored in memory.
    function getItemsByOwner(address _owner) public view returns (uint[] memory) {
        return ownedItems[_owner];
    }
    
}
