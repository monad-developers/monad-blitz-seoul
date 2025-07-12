"use strict";exports.getEmbeddedConnectedWallet=function(e){return e.find((e=>"privy"===e.walletClientType&&"embedded"===e.connectorType&&!e.imported))??null};
