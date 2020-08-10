import "standard-file-js/dist/regenerator.js";
import {
  StandardFile,
  SFAbstractCrypto,
  SFItemTransformer,
  SFHttpManager,
  SFItem
} from 'standard-file-js';
import ExtensionBridge from "./ExtensionBridge";

export default class CredentialManager {
  constructor({
    extensionBridge,
    onCredentialLoad
  }) {
    this.extensionBridge = extensionBridge;
    this.onCredentialLoad = onCredentialLoad;
    this.credentials = [];

    this.extensionBridge.addEventHandler((event) => {
      if (event == ExtensionBridge.BridgeEventReceivedItems) {
        this.reloadCredentials();
      }
    });
  }

  reloadCredentials() {
    // clear current credentials, search results should contain all items and
    // not just new incoming stuff.
    this.credentials = [];

    const searchResults = this.extensionBridge.filterItems(ExtensionBridge.FileSafeCredentialsContentType);
    if (searchResults.length == 0) {
      return;
    }

    for (const incomingCredentials of searchResults) {
      if (!this.credentials.find((candidate) => {
        candidate.uuid == incomingCredentials.uuid
      })) {
        this.credentials.push(incomingCredentials);
      }
    }

    this.onCredentialLoad();

    if (this.credentials.length > 0) {
      this.didLoadCredentials();
    }
  }

  async createNewCredentials() {
    const bits = 256;
    const identifer = await SFJS.crypto.generateRandomKey(bits);
    const password = await SFJS.crypto.generateRandomKey(bits);

    const credentialParams = await SFJS.crypto.generateInitialKeysAndAuthParamsForUser(identifer, password);
    credentialParams.isDefault = this.credentials.length == 0;

    const credentials = new SFItem({
      content_type: ExtensionBridge.FileSafeCredentialsContentType,
      content: credentialParams
    });

    this.extensionBridge.saveItem(credentials);
    this.didLoadCredentials();
    return credentials;
  }

  didLoadCredentials() {
    this.extensionBridge.notifyObserversOfEvent(ExtensionBridge.BridgeEventLoadedCredentials);
  }

  credentialForFileDescriptor(fileDescriptor) {
    return this.credentials.find((candidate) => {
      return fileDescriptor.content.references.find((ref) => ref.uuid == candidate.uuid);
    })
  }

  getAllCredentials() {
    return this.credentials;
  }

  getDefaultCredentials = () => {
    let defaultCredentials = this.credentials.find((candidate) => {
      return candidate.content.isDefault;
    })

    if (!defaultCredentials && this.credentials.length > 0) {
      defaultCredentials = this.credentials[0];
    }

    return defaultCredentials;
  }

  setCredentialAsDefault = (credential) => {
    const currentDefault = this.getDefaultCredentials();
    if (currentDefault) {
      currentDefault.content.isDefault = false;
    }
    credential.content.isDefault = true;

    this.extensionBridge.saveItems([currentDefault, credential]);
  }

  deleteCredential = (credential) => {
    this.extensionBridge.deleteItem(credential);
  }

  saveCredential(credentials) {
    this.extensionBridge.saveItem(credentials);
  }

}
