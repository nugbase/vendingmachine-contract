var VendingMachine = artifacts.require("VendingMachine.sol");

module.exports = function(deployer) {
    return deployer.deploy(VendingMachine);
};
