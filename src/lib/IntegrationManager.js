import "standard-file-js/dist/regenerator.js";
import {
  StandardFile,
  SFAbstractCrypto,
  SFItemTransformer,
  SFHttpManager,
  SFItem
} from 'standard-file-js';
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
    const jsonString = atob(code);
    const integration = JSON.parse(jsonString);
    integration.rawCode = code;
    return integration;
  }

  async saveIntegrationFromCode(code) {
    const content = this.parseIntegrationCode(code);

    if (this.integrations.length == 0) {
      content.isDefaultUploadSource = true;
    }

    const integration = this.createAndSaveIntegrationObject(content);
    return integration;
  }

  createAndSaveIntegrationObject(content) {
    const integration = new SFItem({
      content_type: ExtensionBridge.FileSafeIntegrationContentTypeKey,
      content: content
    });

    this.extensionBridge.createItems([integration]);
    return integration;
  }

  getDefaultIntegration() {
    return this.integrations.find((integration) => {
      return integration.content.isDefaultUploadSource;
    });
  }

  setIntegrationAsDefault(integration) {
    const saveItems = [integration];
    const currentDefault = this.getDefaultIntegration();
    if (currentDefault) {
      currentDefault.content.isDefaultUploadSource = false;
      saveItems.push(currentDefault);
    }


    integration.content.isDefaultUploadSource = true;
    this.extensionBridge.saveItems(saveItems);
  }

  displayStringForIntegration(integration) {
    const capitalizeFirstLetter = (string) => {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    const comps = integration.content.source.split("_");
    let result = "";
    let index = 0;
    for (const comp of comps) {
      result += capitalizeFirstLetter(comp);
      if (index < comps.length - 1) {
        result += " ";
      }
      index++;
    }
    return result;
  }

  deleteIntegration(integrationObject) {
    const isDefault = integrationObject.content.isDefaultUploadSource;
    this.extensionBridge.deleteItem(integrationObject, (response) => {
      if (response.deleted && isDefault) {
        if (this.integrations.length > 0) {
          for (const currentIntegration of this.integrations) {
            if (currentIntegration != integrationObject) {
              this.setIntegrationAsDefault(currentIntegration);
              break;
            }
          }
        }
      }
    });
  }
}
