"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommitment = getCommitment;
/**
 * TODO: docs
 */
function getCommitment(commitment) {
    switch (commitment) {
        case 'processed':
        case 'confirmed':
        case 'finalized':
        case undefined:
            return commitment;
        case 'recent':
            return 'processed';
        case 'single':
        case 'singleGossip':
            return 'confirmed';
        case 'max':
        case 'root':
            return 'finalized';
        default:
            return undefined;
    }
}
//# sourceMappingURL=commitment.js.map