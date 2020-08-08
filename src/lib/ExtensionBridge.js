import "standard-file-js/dist/regenerator.js";
import "standard-file-js/dist/lodash.min.js";
import {
  StandardFile,
  SFAbstractCrypto,
  SFItemTransformer,
  SFHttpManager,
  SFItem
} from 'standard-file-js';

export default class ExtensionBridge {
  static FileItemContentTypeKey = "SN|FileSafe|File";
  static FileSafeCredentialsContentType = "SN|FileSafe|Credentials";
  static FileDescriptorContentTypeKey = "SN|FileSafe|FileMetadata";
  static FileSafeIntegrationContentTypeKey = "SN|FileSafe|Integration";

  static BridgeEventLoadedCredentials = "BridgeEventLoadedCredentials";
  static BridgeEventReceivedItems = "BridgeEventReceivedItems";
  static BridgeEventSavedItem = "BridgeEventSavedItem";

  constructor(componentManager) {
    this.componentManager = componentManager;
    this.updateObservers = [];
    this.items = [];
  }

  getPlatform() {
    return this.componentManager.platform;
  }

  getEnvironment() {
    return this.componentManager.environment;
  }

  isMobile() {
    return this.getEnvironment() == "mobile";
  }

  addEventHandler(callback) {
    let observer = {
      id: Math.random,
      callback: callback
    };
    this.updateObservers.push(observer);
    return observer;
  }

  removeUpdateObserver(observer) {
    this.updateObservers.splice(this.updateObservers.indexOf(observer), 1);
  }

  notifyObserversOfEvent(event) {
    for (var observer of this.updateObservers) {
      observer.callback(event);
    }
  }

  filterItems(contentType) {
    return this.items.filter((item) => {
      return item.content_type == contentType;
    })
  }

  getFileDescriptors() {
    return this.filterItems(ExtensionBridge.FileDescriptorContentTypeKey);
  }

  beginStreamingFiles() {
    const contentTypes = [
      ExtensionBridge.FileDescriptorContentTypeKey,
      ExtensionBridge.FileSafeCredentialsContentType,
      ExtensionBridge.FileSafeIntegrationContentTypeKey
    ];

    this.componentManager.streamItems(contentTypes, (items) => {
      this.handleStreamItemsMessage(items);
    });
  }

  async handleStreamItemsMessage(items) {
    for (let item of items) {
      item = new SFItem(item);

      if (item.deleted) {
        this.removeItemFromItems(item);
        continue;
      }

      if (item.isMetadataUpdate) {
        continue;
      }

      let index = this.indexOfItem(item);
      if (index >= 0) {
        this.items[index] = item;
      } else {
        this.items.push(item);
      }
    }

    this.notifyObserversOfEvent(ExtensionBridge.BridgeEventReceivedItems);
  }

  indexOfItem(item) {
    for (var index in this.items) {
      if (this.items[index].uuid == item.uuid) {
        return index;
      }
    }
    return -1;
  }

  removeItemFromItems(item) {
    this.items = this.items.filter((candidate) => {
      return candidate.uuid !== item.uuid
    });
  }

  createItem(item, callback) {
    this.createItems([item], callback);
  }

  createItems(items, callback) {
    // Not sure why we're nulling UUIDs here. If this was neccessary,
    // componentManager should be the one to do it.
    // for(var item of items) { item.uuid = null; }
    this.componentManager.createItems(items, (createdItems) => {
      callback && callback(createdItems.map((item) => new SFItem(item)));
    })
  }

  async saveItem(item) {
    return this.saveItems([item]);
  }

  async saveItems(items) {
    return new Promise((resolve, reject) => {
      this.componentManager.saveItems(items, (response) => {
        resolve(response);
        this.notifyObserversOfEvent(ExtensionBridge.BridgeEventSavedItem);
      })
    })
  }

  indexOfItem(item) {
    for (var index in this.items) {
      if (this.items[index].uuid == item.uuid) {
        return index;
      }
    }
    return -1;
  }

  deleteItem(item, callback) {
    this.deleteItems([item], callback);
  }

  deleteItems(items, callback) {
    this.componentManager.deleteItems(items, callback);
  }

  removeItemFromItems(item) {
    this.items = this.items.filter((candidate) => {
      return candidate.uuid !== item.uuid
    });
  }
}