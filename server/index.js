const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require("ethereum-cryptography/secp256k1");
const { toHex,utf8ToBytes } = require("ethereum-cryptography/utils");
const { sha256 } = require("ethereum-cryptography/sha256");

const TIMEOUT = 300000 //5分钟超时时间

function generateKey(){
  for(let i = 0; i < n; i++){
    const privateKey = secp.utils.randomPrivateKey();
    const publicKey = secp.getPublicKey(privateKey);

    console.log("Private Key:", toHex(privateKey));
    console.log("Public Key:", toHex(publicKey));
    console.log("id:", "0x" + toHex(publicKey).slice(-20));
  }
}

app.use(cors());
app.use(express.json());


const balances = {
  "0xec0f1fcc0f643b08030b": 100,
  "0xb9b79aee6d0d6f0d51ad": 50,
  "0x2f70dd80bea73f15b571": 75,
};

app.get("/balance/:address", (req, res) => {
  //console.log(req.url);
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", async (req, res) => {
  try {
    const { transaction, signature } = req.body;
    const { sender, amount, recipient, timeStamp } = transaction;
    
    const recoverPK = async (transaction, sig) => {
      const replacer_array = ["sender", "amount", "recipient", "timeStamp"];
      const msgHash = toHex(sha256(utf8ToBytes(JSON.stringify(transaction, replacer_array))));
      const pk = await secp.recoverPublicKey(msgHash, sig.signature, sig.recovery);
      return toHex(pk);
    }
    
    const pk = await recoverPK(transaction, signature);

    if(pk.slice(-20) != sender.slice(2))
      res.status(400).send({ message: "Invalid sender: signature mismatch!"});

    if((Date.now() - timeStamp) > TIMEOUT)
      res.status(400).send({ message: "Transaction expired!"});
    
    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  } catch (error) {
    console.log(error.message);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
