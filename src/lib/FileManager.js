import "standard-file-js/dist/regenerator.js";
import { StandardFile, SFAbstractCrypto, SFItemTransformer, SFHttpManager, SFItem } from 'standard-file-js';
import EncryptionWorker from './util/encryption.worker.js';

export default class FileManager {
  static FileItemContentTypeKey = "SN|FileSafe|File";
  static FileDescriptorContentTypeKey = "SN|FileSafe|FileMetadata";

  constructor(extensionBridge, relayManager, integrationManager, credentialManager) {
    this.extensionBridge = extensionBridge;
    this.relayManager = relayManager;
    this.integrationManager = integrationManager;
    this.credentialManager = credentialManager;
  }

  getAllFileDescriptors() {
    return this.extensionBridge.getFileDescriptors();
  }

  fileDescriptorsForNote(note) {
    if(!note) { return []; }
    return this.extensionBridge.getFileDescriptors().filter((fileDescriptor) => {
      return fileDescriptor.hasRelationshipWithItem(note);
    })
  }

  fileDescriptorsEncryptedWithCredential(credential) {
    var descriptors = this.extensionBridge.getFileDescriptors();
    return descriptors.filter((descriptor) => {
      return descriptor.content.references.find((ref) => uuid == credential.uuid);
    })
  }

  async deleteFileFromDescriptor(fileDescriptor) {
    return new Promise((resolve, reject) => {
      this.extensionBridge.deleteItems([fileDescriptor], (response) => {
        if(response.deleted) {
          let integration = this.integrationManager.integrationForFileDescriptor(fileDescriptor);
          if(integration) {
            this.relayManager.deleteFile(fileDescriptor, integration).then((relayResponse) => {
              resolve();
            })
          }
        } else {
          resolve(response);
        }
      });
    })
  }

  async uploadFile(itemParams, inputFileName, fileType, credential, note) {
    var integration = this.integrationManager.getDefaultUploadSource();
    var outputFileName = `${inputFileName}.sf.json`;

    return new Promise((resolve, reject) => {
      const worker = new EncryptionWorker();

      worker.addEventListener("message", (event) => {
        var data = event.data;
        if(data.error) {
          reject(data.error);
          return;
        }
        var fileDescriptor = new SFItem({
          content_type: ExtensionBridge.FileDescriptorContentTypeKey,
          content: {
            serverMetadata: event.data.metadata,
            fileName: inputFileName,
            fileType: fileType
          }
        });

        fileDescriptor.addItemAsRelationship(note);
        fileDescriptor.addItemAsRelationship(credential);
        this.extensionBridge.createItem(fileDescriptor);
        resolve();
      });

      var operation = "upload";
      var params = {
        outputFileName: outputFileName,
        itemParams: itemParams,
        integration: integration,
        operation: operation,
        credentials: this.credentialManager.getDefaultCredentials()
      };

      worker.postMessage(params);
    })
  }

  async downloadFileFromDescriptor(fileDescriptor) {
    // TODO: Use web worker for this as well?
    var integration = this.integrationManager.integrationForFileDescriptor(fileDescriptor);
    if(!integration) {
      var serverMetadata = fileDescriptor.content.serverMetadata;
      if(serverMetadata) {
        alert(`Unable to find integration named '${serverMetadata.source}'.`);
      } else {
        alert(`Unable to find integration for this file.`);
      }
      throw "Unable to find integration";
      return;
    }
    return this.relayManager.downloadFile(fileDescriptor, integration).then((data) => {
      var item = data.items[0];
      return item;
    })
  }

  async encryptFile(data, inputFileName, fileType, credential) {
    return new Promise((resolve, reject) => {
      const worker = new EncryptionWorker();

      worker.addEventListener("message", function (event) {
        resolve(event.data.itemParams);
      });

      worker.postMessage({
        operation: "encrypt",
        keys: credential.content.keys,
        authParams: credential.content.authParams,
        contentType: ExtensionBridge.FileItemContentTypeKey,
        fileData: data,
        fileName: inputFileName,
        fileType: fileType
      });
    })
  }

  async decryptFile({fileDescriptor, fileItem}) {
    let credential = this.credentialManager.credentialForFileDescriptor(fileDescriptor);
    return new Promise((resolve, reject) => {
      const worker = new EncryptionWorker();

      worker.addEventListener("message", function (event) {
        var data = event.data;
        if(data.error) {
          reject(data.error);
          return;
        }

        resolve(data);
      });

      worker.postMessage({
        operation: "decrypt",
        keys: credential.content.keys,
        item: fileItem
      });
    })
  }

}
