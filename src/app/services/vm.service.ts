import { Injectable } from '@angular/core'
import { AppService } from './app.service'
import { BehaviorSubject } from 'rxjs'
import { filter } from 'rxjs/operators'
import Web3 from 'web3'
import BN from 'bn.js'
import { WalletService } from './wallet.service'


export interface VMTransactionConfig {
  to: string
  //value: string
  value: BN
  chainId?: number
  data?: string
  nonce?: number
  gas: number
  gasPrice: number
}

@Injectable({
  providedIn: 'root'
})
export class VmService {

  network: string

  ready$ = new BehaviorSubject<boolean>(false)

  web3: Web3
  Tx = require('ethereumjs-tx').Transaction

  constructor(
    public appService: AppService,
    private wallet: WalletService,
  ) {
      this.web3 = new Web3()

    this.appService.network$
    .pipe(filter(n => !!n))
    .subscribe(network => {
      console.log('setup metaverse service for network', network)
      this.network = network === 'testnet' ? 'https://vm.mvs.org/testnet_rpc/' : 'https://vm.mvs.org/mainnet_rpc/'
      this.network = 'https://vm.mvs.org/testnet_rpc/'
      this.web3.setProvider(this.network)
      this.ready$.next(true)
    })
  }

  async sendParams(to: string, value: string, gas: number = 21000, gasPrice: number = 10) {
    const quantity = parseFloat(value) * Math.pow(10, 18) + ''
    const params = {
      to,
      //value: new BN(quantity),
      value: quantity,
      chainId: 43,
      gas,
      gasPrice,
    }
    return params
  }

  getHeight() {
    return this.web3.eth.getBlockNumber()
  }

  getTransaction(hash: string) {
    return this.web3.eth.getTransaction(hash)
  }

  showBlockNumber(block: { number: Buffer }) {
    const number = new BN(block.number.toString('hex'), 16).toNumber()
    return number
  }

  async sign(params: VMTransactionConfig, passphrase: string) {
    const privateKey = await this.wallet.exportPrivateKey(passphrase, "m/44'/60'/0'/0/0")
    const account = this.web3.eth.accounts.wallet.add(privateKey)
    const signedTx = await account.signTransaction(params)
    this.web3.eth.accounts.wallet.clear()
    return signedTx
  }

  async send(signedTx) {
    const tx = this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    .once('transactionHash', (hash) => {
      console.log({hash})
    })
    return tx
  }

  async balanceOf(address: string) {
    return this.web3.eth.getBalance(address)
  }

}