import "standard-file-js/dist/regenerator.js"
import "standard-file-js/dist/lodash.min.js"
import { SFItem, SFItemParams } from "standard-file-js"
import RelayManager from "../RelayManager"

export default class EncryptionWorker {
  handleOperation(data, callback) {
    if (data.operation == "encrypt") {
      const fileItem = new SFItem({
        content_type: data.contentType,
        content: {
          rawData: data.fileData,
          fileName: data.fileName,
          fileType: data.fileType,
        },
      })

      const fileItemObject = new SFItemParams(
        fileItem,
        data.keys,
        data.authParams
      )
      fileItemObject.paramsForSync().then((params) => {
        // Encryption complete
        callback({
          fileItem: params,
        })
      })
    } else if (data.operation == "decrypt") {
      SFJS.itemTransformer
        .decryptItem(data.item, data.keys)
        .then(() => {
          const decryptedItem = new SFItem(data.item)
          const decryptedData = decryptedItem.content.rawData
          if (decryptedItem.errorDecrypting) {
            callback({
              error: {
                message: "Error decrypting.",
              },
            })
          } else {
            callback({
              decryptedData: decryptedData,
              decryptedItem: decryptedItem,
            })
          }
        })
        .catch((error) => {
          console.log("Decryption error:", error)
          callback({
            error: error,
          })
        })
    } else if (data.operation == "upload") {
      const relayManager = new RelayManager()
      relayManager.setCredentials(data.credentials)
      relayManager
        .uploadFile(data.outputFileName, data.fileItem, data.integration)
        .then((metadata) => {
          callback({
            metadata,
          })
        })
        .catch((error) => {
          callback({
            error: error,
          })
          console.log("Upload exception", error)
        })
    }
  }
}
