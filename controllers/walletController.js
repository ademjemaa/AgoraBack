const { Keypair, Connection, clusterApiUrl } = require("@solana/web3.js");
const { initGemBank } = require('../common/gem-bank');
const bs58 = require('bs58');
const { NodeWallet } = require('@metaplex/js');

class Wallet {
	constructor() {
		this.connection = new Connection('https://shy-winter-lake.solana-mainnet.quiknode.pro/e9240b3d6d62ddc50f5faaa87ffacdfe055435e1/', 'confirmed');
		
		const secretKey = bs58.decode('5y3zwAFwLUk2agrQZ9CrLKo1Ehn4x8RjzwJbzePAjHAySRXJHFiNHz4xvWbCwRuLxZ664RWB74tVYyjxuPcDNGaq');
		this.kp = Keypair.fromSecretKey(secretKey);

		this.wallet = new NodeWallet(this.kp);
		this.publicKey = this.wallet.payer.publicKey;
	}
}

module.exports = Wallet;