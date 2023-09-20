import "standard-file-js/dist/regenerator.js"
import { SFItem } from "standard-file-js"
import EncryptionWorker from "./util/Worker.js"
import ExtensionBridge from "./ExtensionBridge"

export default class FileManager {
  static FileItemContentTypeKey = "SN|FileSafe|File"
  static FileDescriptorContentTypeKey = "SN|FileSafe|FileMetadata"

  constructor(
    extensionBridge,
    relayManager,
    integrationManager,
    credentialManager
  ) {
    this.extensionBridge = extensionBridge
    this.relayManager = relayManager
    this.integrationManager = integrationManager
    this.credentialManager = credentialManager
  }

  getAllFileDescriptors() {
    return this.extensionBridge.getFileDescriptors()
  }

  fileDescriptorsForNote(note) {
    if (!note) {
      return []
    }
    return this.extensionBridge
      .getFileDescriptors()
      .filter((fileDescriptor) => {
        return fileDescriptor.hasRelationshipWithItem(note)
      })
  }

  findFileDescriptor(uuid) {
    return this.extensionBridge.getFileDescriptors().find((fileDescriptor) => {
      return fileDescriptor.uuid == uuid
    })
  }

  fileDescriptorsEncryptedWithCredential(credential) {
    const descriptors = this.extensionBridge.getFileDescriptors()
    return descriptors.filter((descriptor) => {
      return descriptor.content.references.find(
        (ref) => ref.uuid == credential.uuid
      )
    })
  }

  async deleteFileFromDescriptor(fileDescriptor) {
    return new Promise((resolve, reject) => {
      this.extensionBridge.deleteItems([fileDescriptor], (response) => {
        if (response.deleted) {
          const integration =
            this.integrationManager.integrationForFileDescriptor(fileDescriptor)
          if (integration) {
            this.relayManager
              .deleteFile(fileDescriptor, integration)
              .then((relayResponse) => {
                resolve()
              })
          }
        } else {
          resolve(response)
        }
      })
    })
  }

  async uploadFile({ fileItem, inputFileName, fileType, credential, note }) {
    const integration = this.integrationManager.getDefaultIntegration()
    const outputFileName = `${fileItem.uuid}.sf.json`

    return new Promise((resolve, reject) => {
      const worker = new EncryptionWorker()

      const callback = (data) => {
        if (data.error) {
          console.log("Error uploading file", data.error)
          reject(data.error)
          return
        }

        const fileDescriptor = new SFItem({
          content_type: ExtensionBridge.FileDescriptorContentTypeKey,
          content: {
            serverMetadata: data.metadata,
            fileName: inputFileName,
            fileType: fileType,
          },
        })

        if (note) {
          fileDescriptor.addItemAsRelationship(note)
        }

        fileDescriptor.addItemAsRelationship(credential)

        this.extensionBridge.createItem(fileDescriptor, (createdItems) => {
          resolve(createdItems[0])
        })
      }

      const operation = "upload"
      const params = {
        outputFileName: outputFileName,
        fileItem: fileItem,
        integration: integration,
        operation: operation,
        credentials: this.credentialManager.getDefaultCredentials(),
      }

      worker.handleOperation(params, callback)
    })
  }

  async downloadFileFromDescriptor(fileDescriptor) {
    const integration =
      this.integrationManager.integrationForFileDescriptor(fileDescriptor)
    if (!integration) {
      const serverMetadata = fileDescriptor.content.serverMetadata
      if (serverMetadata) {
        alert(`Unable to find integration named '${serverMetadata.source}'.`)
      } else {
        alert(`Unable to find integration for this file.`)
      }
      throw "Unable to find integration"
      return
    }
    return this.relayManager
      .downloadFile(fileDescriptor, integration)
      .then((data) => {
        const item = data.items[0]
        return item
      })
  }

  async encryptFile({ data, inputFileName, fileType, credential }) {
    return new Promise((resolve, reject) => {
      const worker = new EncryptionWorker()

      const callback = (data) => {
        resolve(data.fileItem)
      }

      worker.handleOperation(
        {
          operation: "encrypt",
          keys: credential.content.keys,
          authParams: credential.content.authParams,
          contentType: ExtensionBridge.FileItemContentTypeKey,
          fileData: data,
          fileName: inputFileName,
          fileType: fileType,
        },
        callback
      )
    })
  }

  async decryptFile({ fileDescriptor, fileItem, credential }) {
    if (!credential) {
      credential =
        this.credentialManager.credentialForFileDescriptor(fileDescriptor)
    }
    return new Promise((resolve, reject) => {
      const worker = new EncryptionWorker()

      const callback = (data) => {
        if (data.error) {
          reject(data.error)
          return
        }

        resolve(data)
      }

      worker.handleOperation(
        {
          operation: "decrypt",
          keys: credential.content.keys,
          item: fileItem,
        },
        callback
      )
    })
  }
}
