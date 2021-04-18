async function measureWeiDelta(account, f, BigNumber) {
  const balanceBefore = new BigNumber("" + await web3.eth.getBalance(account));
  await f()
  const balanceAfter = new BigNumber("" + await web3.eth.getBalance(account));
  return balanceAfter.sub(balanceBefore);
}

module.exports = {
  measureWeiDelta,
};
