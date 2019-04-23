import ExtensionBridge from "./lib/ExtensionBridge"
import RelayManager from "./lib/RelayManager"
import IntegrationManager from "./lib/IntegrationManager"
import CredentialManager from "./lib/CredentialManager"
import FileManager from "./lib/FileManager"
import Utils from "./lib/util/Utils"

export default class Filesafe {
  constructor({componentManager, onFilesChange}) {
    this.extensionBridge = new ExtensionBridge(componentManager);
    this.extensionBridge.addEventHandler((eventName) => {
      onFilesChange && onFilesChange();
    });

    this.relayManager = new RelayManager();
    this.integrationManager = new IntegrationManager(this.extensionBridge);

    this.credentialManager = new CredentialManager({
      extensionBridge: this.extensionBridge,
      onCredentialLoad: () => {
        this.relayManager.setCredentials(this.credentialManager.getDefaultCredentials());
      }
    });

    this.fileManager = new FileManager(
      this.extensionBridge,
      this.relayManager,
      this.integrationManager,
      this.credentialManager
    );

    this.extensionBridge.beginStreamingFiles();
  }

  /* Files */

  fileDescriptorsForNote(note) {
    return this.fileManager.fileDescriptorsForNote(note);
  }

  fileDescriptorsEncryptedWithCredential(credential) {
    return this.fileManager.fileDescriptorsEncryptedWithCredential(credential);
  }

  async deleteFileFromDescriptor(fileDescriptor) {
    return this.fileManager.deleteFileFromDescriptor(fileDescriptor);
  }

  async uploadFile(itemParams, inputFileName, fileType, credential, note) {
    return this.fileManager.uploadFile(itemParams, inputFileName, fileType, credential, note);
  }

  async downloadFileFromDescriptor(fileDescriptor) {
    return this.fileManager.downloadFileFromDescriptor(fileDescriptor);
  }

  async encryptFile(data, inputFileName, fileType, credential) {
    return this.fileManager.encryptFile(data, inputFileName, fileType, credential);
  }

  async decryptFile({fileDescriptor, fileItem}) {
    return this.fileManager.decryptFile({fileDescriptor, fileItem});
  }

  createTemporaryFileUrl({base64Data, dataType}) {
    return Utils.tempUrlForData(Utils.base64toBinary(base64Data), dataType);
  }

  /* Credentials */

  async createNewCredentials()  {
    return this.credentialManager.createNewCredentials();
  }

  numberOffileDescriptorsEncryptedWithCredential(credential)  {
    return this.fileManager.fileDescriptorsEncryptedWithCredential(credential).length;
  }

  credentialForFileDescriptor(fileDescriptor) {
    return this.credentialManager.credentialForFileDescriptor(fileDescriptor);
  }

  getAllCredentials()  {
    return this.credentialManager.getAllCredentials();
  }

  getDefaultCredentials()  {
    return this.credentialManager.getDefaultCredentials();
  }

  setCredentialAsDefault(credential) {
    return this.credentialManager.setCredentialAsDefault(credential)
  }

  deleteCredential(credential) {
    return this.credentialManager.deleteCredential(credential);
  }

  saveCredential(credential) {
    return this.credentialManager.saveCredential(credential);
  }


  /* Integrations */

  getAllIntegrations() {
    return this.integrationManager.integrations;
  }

  integrationForFileDescriptor(fileDescriptor) {
    return this.integrationManager.integrationForFileDescriptor(fileDescriptor);
  }

  saveIntegrationFromCode(code) {
    return this.integrationManager.saveIntegrationFromCode(code);
  }

  getDefaultIntegration()  {
    return this.integrationManager.getDefaultIntegration();
  }

  setIntegrationAsDefault(integration) {
    return this.integrationManager.setIntegrationAsDefault(integration);
  }

  deleteIntegration(integration) {
    return this.integrationManager.deleteIntegration(integration);
  }
}
