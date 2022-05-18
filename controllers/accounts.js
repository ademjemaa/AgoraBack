import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import * as bs58 from 'bs58';
import { NodeWallet } from '@metaplex/js';

const DEMO_WALLET_SECRET_KEY = new Uint8Array([14,14,71,205,10,210,83,32,255,219,101,238,101,69,252,218,81,155,130,97,51,249,10,71,10,210,92,197,25,53,179,126,52,33,87,2,113,159,112,151,17,150,131,33,222,52,126,56,30,103,67,194,28,220,15,41,244,131,2,85,77,74,235,80]);


const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
var fromWallet = web3.Keypair.fromSecretKey(DEMO_WALLET_SECRET_KEY);
//const secretKey = bs58.decode('5y3zwAFwLUk2agrQZ9CrLKo1Ehn4x8RjzwJbzePAjHAySRXJHFiNHz4xvWbCwRuLxZ664RWB74tVYyjxuPcDNGaq');
// const kp = Keypair.fromSecretKey(secretKey);
const wallet = web3.Keypair.generate();

const tokenMintAddress = "";

export const getTrans =  async (req, res) => {
  try{
      console.log(req);
      res.status(200).json(req);
  }catch (error){
      res.status(400).send('Error at getUsers');
  }
}

async function transfer(to, amount) {
  const mintPublicKey = new web3.PublicKey(tokenMintAddress);    
  const mintToken = new Token(
    connection,
    mintPublicKey,
    TOKEN_PROGRAM_ID,
    wallet.payer // the wallet owner will pay to transfer and to create recipients associated token account if it does not yet exist.
  );
        
  const fromTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(
    wallet.publicKey
  );

  const destPublicKey = new web3.PublicKey(to);

  // Get the derived address of the destination wallet which will hold the custom token
  const associatedDestinationTokenAddr = await Token.getAssociatedTokenAddress(
    mintToken.associatedProgramId,
    mintToken.programId,
    mintPublicKey,
    destPublicKey
  );

  const receiverAccount = await connection.getAccountInfo(associatedDestinationTokenAddr);

  if (receiverAccount.isFrozen == true)
  {

  }
        
  const instructions = [];  

  if (receiverAccount === null) {

    instructions.push(
      Token.createAssociatedTokenAccountInstruction(
        mintToken.associatedProgramId,
        mintToken.programId,
        mintPublicKey,
        associatedDestinationTokenAddr,
        destPublicKey,
        wallet.publicKey
      )
    )

    // if (receiverAccount.isFrozen == true)
    // {
    //   instructions.push(Token.createThawAccountInstruction(
    //     mintToken.associatedProgramId,
    //     receiverAccount.PublicKey,
    //     mintPublicKey,
    //     wallet.publicKey,
    //     []
    //   )

    //   )
    // }

  }
  
  instructions.push(
    Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      fromTokenAccount.address,
      associatedDestinationTokenAddr,
      wallet.publicKey,
      [],
      amount
    )
  );

  const transaction = new web3.Transaction().add(...instructions);
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  
  const transactionSignature = await connection.sendRawTransaction(
    transaction.serialize(),
    { skipPreflight: true }
  );

  await connection.confirmTransaction(transactionSignature);
}