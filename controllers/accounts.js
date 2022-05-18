import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { web3 } from "@project-serum/anchor";
import { Wallet } from "../controllers/walletController.js";


const masterwallet = new Wallet();
const connection = masterwallet.connection;

const tokenMintAddress = "";

export const PostTransaction =  async (req, res) => {
  try{
      console.log(req);

      // res.status(200).json(postMessages);
  }catch (error){
      // res.status(400).send('Error at GetPosts');
  }
}

async function transfer(to, amount) {
  const mintPublicKey = new web3.PublicKey(tokenMintAddress);    
  const mintToken = new Token(
    connection,
    mintPublicKey,
    TOKEN_PROGRAM_ID,
    masterwallet.payer // the wallet owner will pay to transfer and to create recipients associated token account if it does not yet exist.
  );
        
  const fromTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(
    masterwallet.publicKey
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
        masterwallet.publicKey
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
      masterwallet.publicKey,
      [],
      amount
    )
  );

  const transaction = new web3.Transaction().add(...instructions);
  transaction.feePayer = masterwallet.publicKey;
  transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  
  const transactionSignature = await connection.sendRawTransaction(
    transaction.serialize(),
    { skipPreflight: true }
  );

  await connection.confirmTransaction(transactionSignature);
}