"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMessageSignature = verifyMessageSignature;
exports.verifySignMessage = verifySignMessage;
const ed25519_1 = require("@noble/curves/ed25519");
const util_js_1 = require("./util.js");
/**
 * TODO: docs
 */
function verifyMessageSignature({ message, signedMessage, signature, publicKey, }) {
    // TODO: implement https://github.com/solana-labs/solana/blob/master/docs/src/proposals/off-chain-message-signing.md
    return (0, util_js_1.bytesEqual)(message, signedMessage) && ed25519_1.ed25519.verify(signature, signedMessage, publicKey);
}
/**
 * TODO: docs
 */
function verifySignMessage(input, output) {
    const { message, account: { publicKey }, } = input;
    const { signedMessage, signature } = output;
    return verifyMessageSignature({ message, signedMessage, signature, publicKey: publicKey });
}
//# sourceMappingURL=signMessage.js.map