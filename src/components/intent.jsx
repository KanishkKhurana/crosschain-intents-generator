
import { useState } from 'react';
import { ethers } from 'ethers';
import { FaRegCopy } from "react-icons/fa";
import { AcrossClient } from "@across-protocol/app-sdk";
import { arbitrum, base } from "viem/chains";
import { parseUnits } from 'viem'


const client = AcrossClient.create({
  integratorId: "0xdead", // 2-byte hex string
  chains: [base, arbitrum],
});


export default function IntentGenerator() {
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState(0);
  const [result, setResult] = useState(null);  
  const [error, setError] = useState({ address: '', amount: '' });


  const copyToClipboard = async (text) => {
      await navigator.clipboard.writeText(text);

  };

  const getFees = async () => {
    try {
      const res = await fetch(`https://app.across.to/api/suggested-fees?inputToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&outputToken=0xaf88d065e77c8cC2239327C5EDb3A432268e5831&originChainId=8453&destinationChainId=42161&amount=${amount*(10**6)}`);
      
      const data = await res.json();
      // console.log(data);
      const output = (amount*(10**6)) - data.totalRelayFee.total;
      // console.log(output);
      return output;
    } catch (error) {
      console.error("Error fetching fees:", error);
      throw error;
    }
  }




  // Helper function to pad addresses
  const padAddress = (address) => {
    return '0x000000000000000000000000' + address.slice(2);
  };

  // Validate Ethereum address
  const validateAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const generateIntent = async () => {
    if(amount === 0){
      return
    }

    const outputAmount = await getFees()
    console.log("outputAmount", outputAmount)
    // Reset states
    setError({ address: '', amount: '' });
    setResult(null);

    // Validate inputs
    let hasError = false;
    if (!validateAddress(walletAddress)) {
      setError(prev => ({ ...prev, address: 'Invalid Ethereum address' }));
      hasError = true;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError(prev => ({ ...prev, amount: 'Please enter a valid amount' }));
      hasError = true;
    }
    if (hasError) return;

    try {
      const paddedDepositor = padAddress(walletAddress);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const fillDeadline = currentTimestamp + (30 * 60);
      const orderDataType = "0x9df4b782e7bbc178b3b93bfe8aafb909e84e39484d7f3c59f400f1b4691f85e2";

      // Define the ABI
      const abiFragment = [
        "tuple(address inputToken, uint256 inputAmount, address outputToken, uint256 outputAmount, uint256 destinationChainId, bytes32 recipient, address exclusiveRelayer, uint256 depositNonce, uint32 exclusivityPeriod, bytes message)"
      ];

      // Create order data parameters
      const abiCoder = new ethers.utils.AbiCoder();
      const orderData = abiCoder.encode([abiFragment[0]], [[
        "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        amount*(10**6),        
        "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        outputAmount,
        42161,
        paddedDepositor,
        "0x0000000000000000000000000000000000000000",
        0,
        0,
        "0x"
      ]]);

      setResult({
        fillDeadline,
        orderDataType,
        orderData
      });
    } catch (error) {
      setError(prev => ({ ...prev, general: error.message }));
    }
  };

  return (
    <div className="w-full max-w-2xl text-white mx-auto p-6">
      <div className="bg-[#34353a] rounded-lg shadow-md p-6">
        <h1 className="text-2xl text-white mb-6 text-center">
          Cross-Chain Intent Generator

        <div className=' '>
          <a href="http://across.to" target="_blank" rel="noopener noreferrer"> <div className='flex hover:scale-105 justify-center gap-1 text-[0.75rem] items-center'> Built by <img src="/across.svg" alt="Across is Unifying Ethereum" className='w-12' />  </div></a>
        </div>
        </h1>
        

        <div className="space-y-4">
          <div>
            <label className="block text-sm font text-white mb-1">
              Wallet Address
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 border bg-[#2d2e33] border-[#2d2e33] rounded-md focus:ring-[#6de1c7] focus:border-[#6de1c7]"
            />
            {error.address && (
              <p className="mt-1 text-sm text-red-500">{error.address}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Amount (USDC)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-2 border bg-[#2d2e33] border-[#2d2e33] rounded-md focus:ring-[#6de1c7] focus:border-[#6de1c7]"
            />
            {error.amount && (
              <p className="mt-1 text-sm text-red-500">{error.amount}</p>
            )}
          </div>

          <button
            onClick={generateIntent}
            className="w-full border border-[#6de1c7] text-[#6de1c7] hover:bg-[#6de1c7] hover:text-[#2d2e33] font-bold py-2 px-4 rounded-md uppercase"
          >
            Generate Intent
          </button>

          {error.general && (
            <p className="mt-4 text-sm text-red-500 p-4 bg-red-50 rounded-md">
              {error.general}
            </p>
          )}

          {result && (
            <div className="mt-6 flex flex-col gap-8 p-4 bg-[#2d2e33] rounded-md">
              <div>
              <label className="block text-sm font text-white mb-1">
              fillDeadline
            </label>
            <div              
              className="w-full flex items-start justify-between gap-3 break-all px-4 py-2 border bg-[#34353a] border-[#34353a] rounded-md focus:ring-[#6de1c7] focus:border-[#6de1c7]"
              >
                <div>
              {JSON.stringify(result.fillDeadline, null, 2)}
                </div>
                <div className='hover:cursor-pointer rounded-full mt-1 hover:text-[#6de1c7] ease-in-out duration-200 hover:scale-105' onClick={()=>copyToClipboard(JSON.stringify(result.fillDeadline, null, 2))}>
                  <FaRegCopy/>
                </div>
            </div>
              </div>
              <div>
              <label className="block text-sm font text-white mb-1">
              orderDataType
            </label>
            <div              
              className="w-full flex items-start justify-between gap-3 break-all min-h-fit whitespace-normal px-4 py-2 border bg-[#34353a] border-[#34353a] rounded-md focus:ring-[#6de1c7] focus:border-[#6de1c7]"
              >
              <div>
              {JSON.stringify(result.orderDataType, null, 2).slice(1, -1)}
              </div>
              <div className='hover:cursor-pointer rounded-full mt-1 hover:text-[#6de1c7] ease-in-out duration-200 hover:scale-105' onClick={()=>copyToClipboard(JSON.stringify(result.orderDataType, null, 2).slice(1, -1))}>
                  <FaRegCopy/>
                </div>
            </div>
              </div>
              <div>
              <label className="block text-sm font text-white mb-1">
              orderData
            </label>
            <div              
              className="w-full flex items-start justify-between gap-3 break-all px-4 py-2 border bg-[#34353a] border-[#34353a] rounded-md focus:ring-[#6de1c7] focus:border-[#6de1c7]"
              >
              <div>
              {JSON.stringify(result.orderData, null, 2).slice(1, -1)}
              </div>
              <div className='hover:cursor-pointer rounded-full mt-1 hover:text-[#6de1c7] ease-in-out duration-200 hover:scale-105' onClick={()=>copyToClipboard(JSON.stringify(result.orderData, null, 2).slice(1, -1))}>
                  <FaRegCopy/>
                </div>
            </div>
              </div>
              {/* <pre className="whitespace-pre-wrap break-all text-sm">
                {JSON.stringify(result, null, 2)}
              </pre> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}