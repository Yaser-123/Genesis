import { MeshWallet, BlockfrostProvider, Transaction } from '@meshsdk/core';
import fs from 'fs';
import path from 'path';

const WALLETS_FILE_PATH = path.join(__dirname, '../../data/wallets.json');

export class WalletService {
  /**
   * Generates a Cardano PREPROD wallet.
   * Returns address and mnemonic.
   * Appends the wallet to data/wallets.json.
   */
  static async createAgentWallet(): Promise<{ address: string; mnemonic: string[] }> {
    const mnemonic = MeshWallet.brew();
    
    // Convert mnemonic to an array if it isn't one (depends on MeshSDK version)
    const words = typeof mnemonic === 'string' ? (mnemonic as string).split(' ') : mnemonic;

    const wallet = new MeshWallet({
      networkId: 0, // 0 for Preprod/Testnet
      fetcher: new BlockfrostProvider(process.env.BLOCKFROST_API_KEY || ''),
      submitter: new BlockfrostProvider(process.env.BLOCKFROST_API_KEY || ''),
      key: {
        type: 'mnemonic',
        words: words,
      },
    });

    const address = wallet.getUnusedAddresses()[0] || wallet.getUsedAddresses()[0];
    const walletData = { address, mnemonic: words };

    // Append to data/wallets.json
    let wallets: any[] = [];
    if (fs.existsSync(WALLETS_FILE_PATH)) {
      const fileData = fs.readFileSync(WALLETS_FILE_PATH, 'utf-8');
      try {
        wallets = JSON.parse(fileData);
      } catch (e) {
        wallets = [];
      }
    }
    wallets.push(walletData);
    fs.writeFileSync(WALLETS_FILE_PATH, JSON.stringify(wallets, null, 2), 'utf-8');

    return walletData;
  }

  /**
   * Return ADA balance from Blockfrost.
   */
  static async getBalance(address: string): Promise<number> {
    const provider = new BlockfrostProvider(process.env.BLOCKFROST_API_KEY || '');
    // Fetch utxos or use fetchAssetBalance? BlockfrostProvider has fetchAddressUTxOs
    // Or we can just initialize a wallet in read-only mode, or use fetchAssetBalance
    // But MeshSDK BlockfrostProvider has `fetchAddressUTxOs(address, asset)`... wait, no, `provider.fetchAddressUTxOs(address)` returns utxos.
    // Let's use MeshWallet read-only mode to simplify.
    
    const wallet = new MeshWallet({
      networkId: 0,
      fetcher: provider,
      submitter: provider,
      key: {
        type: 'address',
        address: address
      }
    });

    const balance = await wallet.getBalance();
    // getBalance() returns Array<{ unit: string, quantity: string }> e.g. [{ unit: 'lovelace', quantity: '...' }]
    const lovelace = balance.find((asset: any) => asset.unit === 'lovelace');
    
    if (!lovelace) return 0;
    
    return Number(lovelace.quantity) / 1000000;
  }

  /**
   * Build, sign, and submit transaction
   */
  static async sendADA(
    fromMnemonic: string[],
    toAddress: string,
    amount: number,
    metadata?: any
  ): Promise<string> {
    const provider = new BlockfrostProvider(process.env.BLOCKFROST_API_KEY || '');
    const wallet = new MeshWallet({
      networkId: 0,
      fetcher: provider,
      submitter: provider,
      key: {
        type: 'mnemonic',
        words: fromMnemonic,
      },
    });

    const tx = new Transaction({ initiator: wallet });
    tx.sendLovelace(toAddress, (amount * 1000000).toString());

    if (metadata) {
      tx.setMetadata(0, metadata);
    }

    const unsignedTx = await tx.build();
    const signedTx = await wallet.signTx(unsignedTx);
    const txHash = await wallet.submitTx(signedTx);
    
    return txHash;
  }
}
