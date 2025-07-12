import { Injectable, Logger } from '@nestjs/common';
import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import * as process from 'node:process';
import { monadAbi } from '../../infra/config/contract/abi/abi';

@Injectable()
export class MonadService {
  private readonly logger = new Logger(MonadService.name);
  private readonly provider: JsonRpcProvider;
  private readonly signer: Wallet;
  private readonly contract: ethers.Contract;

  constructor() {
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);

    this.contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      monadAbi,
      this.signer,
    );
  }

  async createUser(userAddress: string) {
    let user = await this.contract.getUser(userAddress);
    if (user[5] === false) {
      const tx = await this.contract.createUser(userAddress);
      const receipt = await tx.wait();
      console.log(receipt);
      user = await this.contract.getUser(userAddress);
      console.log(user);
    }
    return {
      power: user[0].toString(),
      lv: user[1].toString(),
      enemyHp: user[2].toString(),
      enemyMaxHp: user[3].toString(),
      gold: user[4].toString(),
      exists: user[5].toString(),
    };
  }

  async getUser(userAddress: string) {
    const user = await this.contract.getUser(userAddress);
    return {
      power: user[0].toString(),
      lv: user[1].toString(),
      enemyHp: user[2].toString(),
      enemyMaxHp: user[3].toString(),
      gold: user[4].toString(),
      exists: user[5].toString(),
    };
  }

  async attackEnemy(userAddress: string) {
    const tx = await this.contract.attackEnemy(userAddress);
    const receipt = await tx.wait();
    console.log(receipt);
    const user = await this.contract.getUser(userAddress);
    return {
      power: user[0].toString(),
      lv: user[1].toString(),
      enemyHp: user[2].toString(),
      enemyMaxHp: user[3].toString(),
      gold: user[4].toString(),
      exists: user[5].toString(),
    };
  }
}
