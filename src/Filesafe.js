import ExtensionBridge from "./lib/ExtensionBridge"
import RelayManager from "./lib/RelayManager"
import IntegrationManager from "./lib/IntegrationManager"
import CredentialManager from "./lib/CredentialManager"
import FileManager from "./lib/FileManager"
import Utils from "./lib/util/Utils"
import { SFItem } from 'standard-file-js';

export default class Filesafe {
  // Allow consumers to construct these objects without including entire standard-file-js lib
  static getSFItemClass() {
    return SFItem;
  }

  constructor({componentManager}) {
    this.dataChangeObservers = [];
    this.newFileDescriptorHandlers = [];

    this.extensionBridge = new ExtensionBridge(componentManager);
    this.extensionBridge.addEventHandler((eventName) => {
      this.notifyObservers();
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

  /*
    Observe changes
  */

  addNewFileDescriptorHandler(handler) {
    this.newFileDescriptorHandlers.push(handler);
  }

  notifyObservers() {
    for(let observer of this.dataChangeObservers) {
      observer();
    }
  }

  addDataChangeObserver(observer) {
    this.dataChangeObservers.push(observer);
    return observer;
  }

  removeDataChangeObserver(observer) {
    this.dataChangeObservers = this.dataChangeObservers.filter((candidate) => candidate != observer);
  }

  /* Set current note. Used by filesafe-embed to show files for current note. */

  setCurrentNote(note) {
    this.currentNote = note;
  }


  /* Files */

  getAllFileDescriptors() {
    return this.fileManager.getAllFileDescriptors();
  }

  findFileDescriptor(uuid) {
    return this.fileManager.findFileDescriptor(uuid);
  }

  fileDescriptorsForCurrentNote() {
    return this.fileManager.fileDescriptorsForNote(this.currentNote);
  }

  fileDescriptorsForNote(note) {
    return this.fileManager.fileDescriptorsForNote(note);
  }

  fileDescriptorsEncryptedWithCredential(credential) {
    return this.fileManager.fileDescriptorsEncryptedWithCredential(credential);
  }

  async deleteFileFromDescriptor(fileDescriptor) {
    return this.fileManager.deleteFileFromDescriptor(fileDescriptor);
  }

  async uploadFile({fileItem, inputFileName, fileType, credential, note}) {
    let descriptor = await this.fileManager.uploadFile({fileItem, inputFileName, fileType, credential, note});
    if(descriptor) {
      for(let observer of this.newFileDescriptorHandlers) { observer(descriptor);}
    }
    return descriptor;
  }

  async encryptAndUploadJavaScriptFileObject(jsFile) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = async (e) => {
        var data = e.target.result;
        var arrayBuffer = data;
        var base64Data = await SFJS.crypto.arrayBufferToBase64(arrayBuffer);
        let result = await this.encryptAndUploadData({base64Data: base64Data, inputFileName: jsFile.name, fileType: jsFile.type});
        resolve(result);
      }
      reader.readAsArrayBuffer(jsFile);
    })
  }

  async encryptAndUploadData({base64Data, inputFileName, fileType}) {
    const credential = this.getDefaultCredentials();
    return this.encryptFile({data: base64Data, inputFileName, fileType, credential}).then(async (fileItem) => {
      return this.uploadFile({fileItem, inputFileName, fileType, credential}).catch((uploadError) => {
        console.error("filesafe-js | error uploading file:", uploadError);
      })
    })
  }

  async downloadFileFromDescriptor(fileDescriptor) {
    return this.fileManager.downloadFileFromDescriptor(fileDescriptor);
  }

  async encryptFile({data, inputFileName, fileType, credential}) {
    return this.fileManager.encryptFile({data, inputFileName, fileType, credential});
  }

  /*
    if fileDescriptor is available, we'll use that to determine credentials
    otherwise, passed in credential will be used
   */
  async decryptFile({fileDescriptor, fileItem, credential}) {
    return this.fileManager.decryptFile({fileDescriptor, fileItem, credential});
  }

  downloadBase64Data({base64Data, fileName, fileType}) {
    Utils.downloadData(Utils.base64toBinary(base64Data), fileName, fileType);
  }

  createTemporaryFileUrl({base64Data, dataType}) {
    return Utils.tempUrlForData(Utils.base64toBinary(base64Data), dataType);
  }

  /* Credentials */

  async createNewCredentials()  {
    return this.credentialManager.createNewCredentials();
  }

  numberOfFilesEncryptedWithCredential(credential)  {
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

  /*
    Misc
  */

  getPlatform() {
    return this.extensionBridge.getPlatform();
  }

  copyTextToClipboard(text)  {
    return Utils.copyTextToClipboard(text);
  }
}
