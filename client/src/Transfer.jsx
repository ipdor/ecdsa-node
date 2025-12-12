import { useState } from "react";
import server from "./server";
import * as secp from "ethereum-cryptography/secp256k1"; //导出方式是 named export，不是 default export。不能省略* as 和花括号
import { toHex, utf8ToBytes } from "ethereum-cryptography/utils"; 
import { sha256 } from "ethereum-cryptography/sha256";

const privateKey = {
  "0xec0f1fcc0f643b08030b": "25a334b77bc508cd5897f691e89bdf3f8b5e3f2a69f42ea6bdfb439834ba56bf",
  "0xb9b79aee6d0d6f0d51ad": "302f3e87e28f4c17ed8c440b0fb730780a1e848dff04a1dfd0930988c7908d0a",
  "0x2f70dd80bea73f15b571": "2003a4bf3b29458b7aa747221d05930e1cfe6c05d34f202aab18bba202dcd5ab"
}

async function sign(transaction){
  // 使用replacer_array确保序列化后Object内部键值对顺序一致
  const replacer_array = ["sender", "amount", "recipient", "timeStamp"];
  // either a hex string, or Uint8Array
  const msgHash = sha256(utf8ToBytes(JSON.stringify(transaction, replacer_array)));
  // 注意可恢复的签名返回两个值
  const [signature, recovery] = await secp.sign(msgHash, privateKey[transaction.sender], { recovered:true });
  return {
    signature: toHex(signature), 
    recovery
  };
}

function Transfer({ address, setBalance }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    try {
      const transaction = {
        sender: address,
        amount: parseInt(sendAmount),
        recipient,
        timeStamp: Date.now(),
      }
      const signature = await sign(transaction);
      const {
        data: { balance },
      } = await server.post(`send`, {
        transaction,
        signature,
      });
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
