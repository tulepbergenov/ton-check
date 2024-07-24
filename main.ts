import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, WalletContractV4 } from "ton";
import { mnemonicToWalletKey } from "ton-crypto";
import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(__dirname, ".env.local") });

const mnemonic = process.env.MNEMONIC_PHRASE;

const main = async () => {
  try {
    if (!mnemonic) {
      throw new Error(
        "MNEMONIC_PHRASE is not defined in the environment variables"
      );
    }

    const key = await mnemonicToWalletKey(mnemonic.split(" "));

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
      console.log("Wallet is not deployed");
    } else {
      console.log("Wallet is deployed");
    }
  } catch (error) {
    console.error(error);
  }
};

main();
