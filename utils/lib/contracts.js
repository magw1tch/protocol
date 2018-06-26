import * as path from 'path';
import * as fs from 'fs';
import web3 from './web3';

const outpath = path.join(__dirname, '..', '..', 'out');

/**
 * Deploy a contract, and get back an instance.
 * @param {string} contractPath - Relative path to the contract, without its extension
 * @param {Object} optsIn - Deployment options for the contract
 * @param {[*]} constructorArgs - Arguments to be passed to the contract constructor
 * @param {...*} rest - Catch extra parameters to the parity.js deploy function TODO: remove?
 * @returns {Object} - Instance of the deployed contract
 */
async function deployContract(contractPath, optsIn = {}, constructorArgs = [], ...rest) {
  console.log(optsIn)
  const options = Object.assign({}, optsIn); // clone object value instead of reference
  const options2 = Object.assign({}, optsIn); // clone object value instead of reference
  const filepath = path.resolve(outpath, contractPath);
  const abi = JSON.parse(fs.readFileSync(`${filepath}.abi`, 'utf8'));
  const bytecode = `0x${fs.readFileSync(`${filepath}.bin`, 'utf8')}`;
  const contract = new web3.eth.Contract(abi, options);
  // console.log(options2)
  options.from = '0xebb0b2051ca98734ed06f29ad2adda03bb82692f';
  const deployTx = await contract.deploy({data: bytecode, arguments: constructorArgs});
  // console.log(deployTx)
  // console.log(await deployTx.estimateGas())
  const deployedContract = await deployTx.send(options2,
    async (e,r) => {
      console.log(r);
      console.log(await web3.eth.getTransactionReceipt(r));
      console.log(Object.keys(deployTx))
    });
  if(process.env.CHAIN_ENV !== 'development')
    console.log(`Deployed ${contractPath}\nat ${deployedContract.address}\n`);
  return deployedContract;
}

/**
 * Get a contract instance with its name and address.
 * @param {string} contractPath - Relative path to the contract, without its extension
 * @param {string} address - Address of the deployed contract
 * @returns {Object} - Instance of the deployed contract
 */
async function retrieveContract(contractPath, address) {
  if(address === undefined || parseInt(address, 16) === 0) {
    throw new Error('Address is undefined or 0x0');
  }
  const filepath = path.resolve(outpath, contractPath);
  const abi = JSON.parse(fs.readFileSync(`${filepath}.abi`, 'utf8'));
  return new web3.eth.Contract(abi, address);
}

export { deployContract, retrieveContract }
