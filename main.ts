import { getHttpEndpoint } from "@orbs-network/ton-access";
import { fromNano, internal, TonClient, WalletContractV4 } from "ton";
import { mnemonicToWalletKey } from "ton-crypto";
import { resolve } from "path";
import dotenv from "dotenv";
import chalk from "chalk";
import { sleep } from "./lib";

dotenv.config({ path: resolve(__dirname, ".env.local") });

const MNEMONIC_PHRASE = process.env.MNEMONIC_PHRASE;
const TEST_SENDING_ADDRESS = process.env.TEST_SENDING_ADDRESS;

const main = async () => {
  try {
    if (!MNEMONIC_PHRASE || !TEST_SENDING_ADDRESS) {
      throw new Error(
        "MNEMONIC_PHRASE or TEST_SENDING_ADDRESS is not defined in the environment variables"
      );
    }

    const key = await mnemonicToWalletKey(MNEMONIC_PHRASE.split(" "));

    const wallet = WalletContractV4.create({
      publicKey: key.publicKey,
      workchain: 0,
    });

    const endpoint = await getHttpEndpoint({
      network: "testnet",
    });

    const client = new TonClient({
      endpoint,
    });

    if (!(await client.isContractDeployed(wallet.address))) {
      console.log(chalk.red("Wallet is not deployed"));
      return;
    }

    console.log(chalk.green("Wallet is deployed"), wallet.address);

    const balance = await client.getBalance(wallet.address);

    console.log(chalk.blue("Wallet"), fromNano(balance));

    const walletContract = client.open(wallet);
    const seqno = await walletContract.getSeqno();

    await walletContract.sendTransfer({
      secretKey: key.secretKey,
      seqno,
      messages: [
        internal({
          to: TEST_SENDING_ADDRESS,
          value: "0.05",
          body: "Hello",
          bounce: false,
        }),
      ],
    });

    let currentSegno = seqno;

    while (currentSegno === seqno) {
      console.log(
        chalk.yellow("Waiting for the transaction to be processed...")
      );

      await sleep(1500);

      currentSegno = await walletContract.getSeqno();
    }

    console.log(chalk.green("Transaction is processed"));
  } catch (error) {
    console.error(chalk.red(error));
  }
};

main();
