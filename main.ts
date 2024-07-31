import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { tokenToString } from "typescript";
import { Presets, Client } from "userop";

dotenv.config();
const signingKey = process.env.SIGNING_KEY || "";
const rpcUrl = process.env.RPC_URL || "";
// const paymasterUrl = process.env.PAYMASTER_URL || "";

async function approveAndSendToken(
    to: string,
    token: string,
    value: string
): Promise<any[]> {
    const ERC20_ABI = require("erc-20-abi"); // ("./erc20Abi.json");
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const erc20 = new ethers.Contract(token, ERC20_ABI, provider);
    // const decimals = await Promise.all([erc20.decimals()]);
    const decimals = 18;
    const amount = ethers.utils.parseUnits(value, decimals);
    const approve = {
        to: token,
        value: ethers.constants.Zero,
        data: erc20.interface.encodeFunctionData("approve", [to, amount]),
    };
    const send = {
        to: token,
        value: ethers.constants.Zero,
        data: erc20.interface.encodeFunctionData("transfer", [to, amount]),
    };
    return [approve, send];
}

async function main(){
    // Create a userop builder
    const signer = new ethers.Wallet(signingKey);
    // const paymasterMiddleware = Presets.Middleware.verifyingPaymaster(paymasterUrl, {
    //     type: "erc20token",
    //     token: "0x3870419Ba2BBf0127060bCB37f69A1b1C090992B"
    // });
    const builder = await Presets.Builder.Kernel.init(signer, rpcUrl);//, {
    //     paymasterMiddleware: paymasterMiddleware
    // });
    const address = builder.getSender();
    console.log(`Account address: ${address}`);

    // Create the calls
    const to = address;
    const token = "0xFAbB3b9521dB18A75dfa2C475e23e862Ba8768c2";
    const value = "0.001";
    const calls = await approveAndSendToken(address, token, value);
    // console.log(calls);
    builder.executeBatch(calls);
    console.log(builder.getOp());

    // Send the user operation
    const client = await Client.init(rpcUrl);
    const res = await client.sendUserOperation(builder, {
        onBuild: (op) => console.log("Signed UserOperation:", op),
    });
    console.log(`UserOpHash: ${res.userOpHash}`);
    console.log("Waiting for transaction...");
    const ev = await res.wait();
    console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
}

export default main()