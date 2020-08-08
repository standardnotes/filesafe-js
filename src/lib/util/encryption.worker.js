import "standard-file-js/dist/regenerator.js";
import "standard-file-js/dist/lodash.min.js";
import {
  StandardFile,
  SFAbstractCrypto,
  SFCryptoWeb,
  SFItemTransformer,
  SFHttpManager,
  SFItem,
  SFItemParams
} from 'standard-file-js';
import RelayManager from "../RelayManager";

self.addEventListener('message', async function (e) {
  var data = e.data;

  if (data.operation == "encrypt") {
    var fileItem = new SFItem({
      content_type: data.contentType,
      content: {
        rawData: data.fileData,
        fileName: data.fileName,
        fileType: data.fileType
      }
    });

    var fileItemObject = new SFItemParams(fileItem, data.keys, data.authParams);
    fileItemObject.paramsForSync().then((params) => {
      // Encryption complete
      self.postMessage({
        fileItem: params
      });
    })
  } else if (data.operation == "decrypt") {
    SFJS.itemTransformer.decryptItem(data.item, data.keys).then(() => {
      var decryptedItem = new SFItem(data.item);
      var decryptedData = decryptedItem.content.rawData;
      if (decryptedItem.errorDecrypting) {
        self.postMessage({
          error: {
            message: "Error decrypting."
          }
        });
      } else {
        self.postMessage({
          decryptedData: decryptedData,
          decryptedItem: decryptedItem
        });
      }
    }).catch((error) => {
      console.log("Decryption error:", error);
      self.postMessage({
        error: error
      });
    })
  } else if (data.operation == "upload") {
    let relayManager = new RelayManager();
    relayManager.setCredentials(data.credentials);
    relayManager.uploadFile(data.outputFileName, data.fileItem, data.integration)
    .then((metadata) => {
      self.postMessage({
        metadata
      });
    }).catch((error) => {
      self.postMessage({
        error: error
      });
      console.log("Upload exception", error);
    });
  }

}, false);
