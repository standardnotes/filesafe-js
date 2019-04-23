import "standard-file-js/dist/regenerator.js";
import { StandardFile, SFAbstractCrypto, SFItemTransformer, SFHttpManager, SFItem } from 'standard-file-js';
import ExtensionBridge from "./ExtensionBridge";

export default class IntegrationManager {

  constructor(extensionBridge) {
    this.extensionBridge = extensionBridge;
  }

  get integrations() {
    return this.extensionBridge.filterItems(ExtensionBridge.FileSafeIntegrationContentTypeKey);
  }

  integrationForFileDescriptor(descriptor) {
    return this.integrations.find((integration) => {
      return descriptor.content.serverMetadata && integration.content.source == descriptor.content.serverMetadata.source;
    });
  }

  parseIntegrationCode(code) {
    var jsonString = atob(code);
    var integration = JSON.parse(jsonString);
    integration.rawCode = code;
    return integration;
  }

  async saveIntegrationFromCode(code) {
    var content = this.parseIntegrationCode(code);

    if(this.integrations.length == 0) {
      content.isDefaultUploadSource = true;
    }

    let integration = this.createAndSaveIntegrationObject(content);
    return integration;
  }

  createAndSaveIntegrationObject(content) {
    let integration = new SFItem({
      content_type: ExtensionBridge.FileSafeIntegrationContentTypeKey,
      content: content
    });

    this.extensionBridge.createItems([integration]);
    return integration;
  }

  getDefaultUploadSource() {
    return this.integrations.find((integration) => {
      return integration.content.isDefaultUploadSource;
    });
  }

  setIntegrationAsDefault(integration) {
    var currentDefault = this.getDefaultUploadSource();
    if(currentDefault) {
      currentDefault.content.isDefaultUploadSource = false;
    }

    integration.content.isDefaultUploadSource = true;
    this.extensionBridge.saveItem(integration);
  }

  deleteIntegration(integrationObject) {
    var isDefault = integrationObject.content.isDefaultUploadSource;
    this.extensionBridge.deleteItem(integrationObject, (response) => {
      if(response.deleted && isDefault) {
        if(this.integrations.length > 0) {
          for(var currentIntegration of this.integrations) {
            if(currentIntegration != integrationObject) {
              this.setIntegrationAsDefault(currentIntegration);
              break;
            }
          }
        }
      }
    });
  }
}
