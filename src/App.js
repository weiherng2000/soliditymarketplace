import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './App.css';




function App() {
    const CONTRACT_ADDRESS = "0x788ff72228dafb0eca5c8c6d8e2d3de1d7324c43"; 
  //ABI acts as a bridge between user-facing applications and the blockchain's smart contract code by defining how data and functions are structured.
    const ABI = [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_owner",
            "type": "address"
          }
        ],
        "name": "getItemsByOwner",
        "outputs": [
          {
            "internalType": "uint256[]",
            "name": "",
            "type": "uint256[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "itemCount",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "items",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "internalType": "address payable",
            "name": "seller",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "isSold",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "_name",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "_price",
            "type": "uint256"
          }
        ],
        "name": "listItem",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "ownedItems",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_id",
            "type": "uint256"
          }
        ],
        "name": "purchaseItem",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "_to",
            "type": "address"
          }
        ],
        "name": "transferItem",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState("");
    const [items, setItems] = useState([]);
    const [ownedItems, setOwnedItems] = useState([]);
    
    // Initialize the application and load data
    useEffect(() =>{
      const init = async ()=>{
        // Initialize the provider with MetaMask's injected Ethereum provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

         // Listen for account changes in MetaMask
         window.ethereum.on("accountsChanged", async (accounts) => {
         setAccount(accounts[0]);
         const signer = provider.getSigner(); //Since the account has changed, you need a new signer to represent the updated account.
         setSigner(signer);
         const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);//Here, you're creating a new instance of the smart contract, using the updated signer (associated with the new account).
         setContract(contract);

         loadItems(contract); //or example, if you're building a marketplace or NFT DApp, this could be fetching a list of items available for sale.
         loadOwnedItems(contract, accounts[0]); //loadOwnedItems is another custom function that likely loads items specifically owned by the new account (accounts[0]).
      });

      const accounts = await provider.send("eth_requestAccounts", []); //This sends a request to the user's Ethereum provider (e.g., MetaMask) to get permission to access the user's accounts
      setAccount(accounts[0]);

      const signer = provider.getSigner();
      setSigner(signer);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setContract(contract);

      loadItems(contract);
      loadOwnedItems(contract, accounts[0]);

      };
      //executes the init function here
      init();
    },[]);

    const loadItems = async (contract) => {
      const itemCount = await contract.itemCount();
      let items = [];
      for (let i = 1; i <= itemCount; i++) {
          const item = await contract.items(i);
          items.push(item);
      }
      setItems(items);
    };

    const loadOwnedItems = async (contract, owner) => {
      const ownedItemIds = await contract.getItemsByOwner(owner);
      let ownedItems = [];
      for (let i = 0; i < ownedItemIds.length; i++) {
          const item = await contract.items(ownedItemIds[i]);
          ownedItems.push(item);
      }
      setOwnedItems(ownedItems);
    };

    const listItem = async (name, price) => {
      const tx = await contract.listItem(name, ethers.utils.parseEther(price));//This utility function converts the price (in Ether) from a string/number format to Wei (the smallest unit of Ether). Ethereum uses Wei to represent values internally, so parseEther ensures the price is correctly formatted.
      await tx.wait(); //This waits for the transaction (tx) to be mined and included in a block on the Ethereum blockchain
      loadItems(contract); //Since the new item has just been listed, calling loadItems ensures that the frontend reflects the updated state of the marketplace
    };

    const purchaseItem = async (id, price) => {
      const tx = await contract.purchaseItem(id, { value: ethers.utils.parseEther(price) });
      await tx.wait();
      loadItems(contract);
      loadOwnedItems(contract, account);
    };

  const transferItem = async (id, toAddress) => {
      const tx = await contract.transferItem(id, toAddress);
      await tx.wait();
      loadItems(contract);
      loadOwnedItems(contract, account);
  };

    return (
      <div className="App">
        <h1>Marketplace</h1>
        <div className="list-item">
              <h2>List Item</h2>
              <input id="itemName" placeholder="Item Name" className="input-field" />
              <input id="itemPrice" placeholder="Item Price (in ETH)" className="input-field" />
              <button className="button" onClick={() => listItem(
                  document.getElementById("itemName").value,
                  document.getElementById("itemPrice").value
              )}>
                  List Item
              </button>
        </div>
        <div className="items">
                  <h2>Items for Sale</h2>
                  {items.map((item) => (
                      <div key={item.id} className="item-card">
                          <p><strong>Name:</strong> {item.name}</p>
                          <p><strong>Price:</strong> {ethers.utils.formatEther(item.price)} ETH</p>
                          <p><strong>Owner:</strong> {item.owner}</p>
                          {!item.isSold && item.owner.toLowerCase() !== account.toLowerCase() && (
                              <button className="button" onClick={() => purchaseItem(item.id, ethers.utils.formatEther(item.price))}>
                                  Purchase
                              </button>
                          )}
                      </div>
                  ))}
        </div>
        <div className="owned-items">
                  <h2>Your Items</h2>
                  {ownedItems.map((item) => (
                      <div key={item.id} className="item-card">
                          <p><strong>Name:</strong> {item.name}</p>
                          <p><strong>Price:</strong> {ethers.utils.formatEther(item.price)} ETH</p>
                          <p><strong>Owner:</strong> {item.owner}</p>
                          <input id={`transferAddress${item.id}`} placeholder="Transfer to Address" className="input-field" />
                          <button className="button" onClick={() => transferItem(item.id, document.getElementById(`transferAddress${item.id}`).value)}>
                              Transfer
                          </button>
                      </div>
                  ))}
              </div>

        



      </div>
       
    );
}

export default App;
