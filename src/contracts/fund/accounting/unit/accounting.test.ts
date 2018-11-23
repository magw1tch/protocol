import { Contracts } from '~/Contracts';

import { initTestEnvironment } from '~/utils/environment';
import { deployMockSystem } from '~/utils';
import { deploy, getContract } from '~/utils/solidity';
import { emptyAddress } from '~/utils/constants';
import { randomAddress } from '~/utils/helpers';
import { share } from 'rxjs/operators';
import {
  subtract,
  add,
  greaterThan,
  isEqual,
  BigInteger,
} from '@melonproject/token-math/bigInteger';

let shared: any = {};

beforeAll(async () => {
  shared.env = await initTestEnvironment();
  shared = Object.assign(shared, await deployMockSystem());
  shared.user = shared.env.wallet.address;
  shared.mockDefaultAssets = [shared.weth.options.address];
  shared.mockQuoteAsset = shared.weth.options.address;
  shared.accounting = getContract(
    Contracts.Accounting,
    await deploy(Contracts.Accounting, [
      shared.hub.options.address,
      shared.mockQuoteAsset,
      shared.mockDefaultAssets,
    ]),
  );
  await shared.accounting.methods
    .initialize([
      shared.accounting.options.address,
      shared.feeManager.options.address,
      emptyAddress,
      emptyAddress,
      shared.shares.options.address,
      shared.trading.options.address,
      shared.vault.options.address,
      shared.priceSource.options.address,
      emptyAddress,
      emptyAddress,
      emptyAddress,
      emptyAddress,
    ])
    .send({ from: shared.user, gas: 8000000 });
});

test('Accounting is properly initialized', async () => {
  for (const i of Array.from(Array(shared.mockDefaultAssets.length).keys())) {
    const defaultAsset = await shared.accounting.methods.ownedAssets(i).call();
    expect(defaultAsset).toBe(shared.mockDefaultAssets[i]);
    await expect(
      shared.accounting.methods
        .isInAssetList(shared.mockDefaultAssets[i])
        .call(),
    ).resolves.toBeTruthy();
  }

  await expect(shared.accounting.methods.QUOTE_ASSET().call()).resolves.toBe(
    shared.mockQuoteAsset,
  );
  await expect(shared.accounting.methods.calcSharePrice().call()).resolves.toBe(
    `${new BigInteger(10 ** 18)}`,
  );
  await expect(shared.accounting.methods.calcGav().call()).resolves.toBe('0');

  const initialCalculations = await shared.accounting.methods
    .performCalculations()
    .call();

  expect(initialCalculations.gav).toBe('0');
  expect(initialCalculations.unclaimedFees).toBe('0');
  expect(initialCalculations.feesShareQuantity).toBe('0');
  expect(initialCalculations.nav).toBe('0');
  expect(initialCalculations.sharePrice).toBe(`${new BigInteger(10 ** 18)}`);
});