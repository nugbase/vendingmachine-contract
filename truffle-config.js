var NonceTrackerSubprovider = require("web3-provider-engine/subproviders/nonce-tracker");
var HDWalletProvider = require("truffle-hdwallet-provider");

var mnemonic = process.env.CONTRACTS_MNEMONIC_SEED
var node_url = process.env.ETH_NODE_URL

if (!mnemonic || !node_url) {
  console.log('WARN: mnemonic or eth_node env variables not set, see README.md');
}

module.exports = {
  compilers: {
    solc: {
      version: "^0.4.24",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  networks: {
    ganache: {
      host: "localhost",
      port: 7545,
      network_id: "5777",
      gas: 4000000,
      gasPrice: 1000000000
    },
    rinkeby: {
      provider: function() { 
        return new HDWalletProvider(mnemonic, node_url);
      },
      network_id: "4", // Rinkeby ID 4
      gas: 4000000,
      gasPrice: 1000000000
    },
    polygon: {
      provider: () => new HDWalletProvider(mnemonic, "https://rpc-mainnet.matic.network"),
      network_id: 137,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    mainnet: {
      provider: () => new HDWalletProvider(mnemonic, node_url),
      network_id: 1,
      confirmations: 2,
      gas: 660000, // 21,000 normal; 1,685,639 used by v1 Flower Contract
      gasPrice: 140000000000 // 140 gwei
    }
  }
};

/* vim: set ts=2 sw=2: */
