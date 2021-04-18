const BigNumber = web3.utils.BN;
const VendingMachine = artifacts.require('VendingMachine.sol');
const { assertRevert } = require('../helpers/assertRevert');
const { measureWeiDelta } = require('../helpers/measureWeiDelta');

require('chai')
  .use(require('chai-bn')(BigNumber))
  .should();

contract('VendingMachine', function(accounts) {
  const ROOT_ACCOUNT = accounts[0];
  const RANDOM_ACCOUNT = accounts[1];

  const UINT32_MAX = Math.pow(2, 32) - 1;

  const ITEM1_ID = 1001;
  const ITEM1_ETHER_PRICE = 1000000000;

  const ITEM2_ID = 1002;
  const ITEM2_ETHER_PRICE = 0;

  const ITEMTYPE_FLOWER_PURCHASE = 0;
  const ITEMTYPE_BREED_PURCHASE = 1;
  const VARDATA_NONE = '0x';
  const VARDATA_BREED = '0x6d6168616d000000000000000000000000000000000000000000000000000000';

  let vendingMachine;

  const toHex = function(string) {
      const hexResult = web3.toHex(string);
      if (hexResult === '0x0') return '0x'; // thats how it do
      else return hexResult;
  }

  beforeEach(async function() {
    vendingMachine = await VendingMachine.new();
  });

  describe('etherPurchase', function() {
    beforeEach(async function() {
      await vendingMachine.upsertInventoryItem(ITEM1_ID, ITEM1_ETHER_PRICE, 1, ITEMTYPE_FLOWER_PURCHASE);
    });

    it('basic', async function() {
      const purchaseResult = await vendingMachine.etherPurchase(ITEM1_ID, VARDATA_NONE, { value: ITEM1_ETHER_PRICE });
      const event1 = purchaseResult.logs[0];
      event1.event.should.equal('EtherPurchase');
      event1.args.from.should.equal(ROOT_ACCOUNT);
      event1.args.itemId.should.bignumber.equal("" + ITEM1_ID);
      event1.args.value.should.bignumber.equal("" + ITEM1_ETHER_PRICE);
      event1.args.itemType.should.bignumber.equal("" + ITEMTYPE_FLOWER_PURCHASE);
      (await web3.eth.getBalance(vendingMachine.address)).should.be.bignumber.equal("" + ITEM1_ETHER_PRICE);
    });

    it('ethPrice is 0', async function() {
      await vendingMachine.upsertInventoryItem(ITEM2_ID, ITEM2_ETHER_PRICE, 2, ITEMTYPE_FLOWER_PURCHASE);
      await assertRevert(vendingMachine.etherPurchase(ITEM2_ID, VARDATA_NONE, { value: ITEM2_ETHER_PRICE }));
    });

    it('item type and var data set', async function() {
      await vendingMachine.upsertInventoryItem(ITEM1_ID, ITEM1_ETHER_PRICE, 1, ITEMTYPE_BREED_PURCHASE);
      const purchaseResult = await vendingMachine.etherPurchase(ITEM1_ID, VARDATA_BREED, { value: ITEM1_ETHER_PRICE });
      const event1 = purchaseResult.logs[0];
      event1.event.should.equal('EtherPurchase');
      event1.args.from.should.equal(ROOT_ACCOUNT);
      event1.args.itemId.should.bignumber.equal("" + ITEM1_ID);
      event1.args.value.should.bignumber.equal("" + ITEM1_ETHER_PRICE);
      event1.args.itemType.should.bignumber.equal("" + ITEMTYPE_BREED_PURCHASE);
      event1.args.varData.should.equal(VARDATA_BREED);
      (await web3.eth.getBalance(vendingMachine.address)).should.be.bignumber.equal("" + ITEM1_ETHER_PRICE);
    });
  });

  describe('upsertInventoryItem', function() {
    it('basic', async function() {
      await vendingMachine.upsertInventoryItem(ITEM1_ID, ITEM1_ETHER_PRICE, 1, ITEMTYPE_FLOWER_PURCHASE);
      await vendingMachine.upsertInventoryItem(ITEM2_ID, ITEM2_ETHER_PRICE, 2, ITEMTYPE_FLOWER_PURCHASE);
      (await vendingMachine.itemIds.call(0)).should.be.bignumber.equal("" + ITEM1_ID);
      (await vendingMachine.itemIds.call(1)).should.be.bignumber.equal("" + ITEM2_ID);
    });
  });

  describe('deleteInventoryItem', function() {
    it('basic', async function() {
      await vendingMachine.upsertInventoryItem(ITEM1_ID, ITEM1_ETHER_PRICE, 1, ITEMTYPE_FLOWER_PURCHASE);
      await vendingMachine.upsertInventoryItem(ITEM2_ID, ITEM2_ETHER_PRICE, 2, ITEMTYPE_FLOWER_PURCHASE);
      await vendingMachine.deleteInventoryItem(ITEM1_ID);
      (await vendingMachine.itemIds.call(0)).should.be.bignumber.equal("" + ITEM2_ID);
    });
  });

  describe('withdrawEther', function() {
    beforeEach(async function() {
      await vendingMachine.upsertInventoryItem(ITEM1_ID, ITEM1_ETHER_PRICE, 1, ITEMTYPE_FLOWER_PURCHASE);
      await vendingMachine.etherPurchase(ITEM1_ID, VARDATA_NONE, { value: ITEM1_ETHER_PRICE });
      (await web3.eth.getBalance(vendingMachine.address)).should.be.bignumber.equal("" + ITEM1_ETHER_PRICE);
    });

    it('basic', async function() {
      const weiDelta = await measureWeiDelta(ROOT_ACCOUNT, async function() {
        await vendingMachine.withdrawEther(ITEM1_ETHER_PRICE, { gasPrice: 0 });
      }, BigNumber);
      weiDelta.should.be.bignumber.equal("" + ITEM1_ETHER_PRICE);
    });

    it('no privileges', async function() {
      await assertRevert(vendingMachine.withdrawEther(ITEM1_ETHER_PRICE, { from: RANDOM_ACCOUNT }));
    });
  });
});
