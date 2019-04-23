import "standard-file-js/dist/regenerator.js";
import { StandardFile, SFAbstractCrypto, SFItemTransformer, SFHttpManager } from 'standard-file-js';

export default class RelayManager {

  constructor() {
    this.httpManger = new SFHttpManager();
    this.httpManger.setJWTRequestHandler(() => {});
  }

  setCredentials(credentials) {
    this.credentials = credentials;
  }

  async uploadFile(name, item, integration) {
    let url = `${integration.content.relayUrl}/integrations/save-item`;
    let params = {
      file: {
        name: name,
        item: item // base64 string of file
      },
      source: integration.content.source,
      authorization: integration.content.authorization
    }

    return new Promise((resolve, reject) => {
      this.httpManger.postAbsolute(url, params, (response) => {
        resolve(response.metadata);
      }, (errorResponse) => {
        var error = errorResponse.error;
        if(!error) {
          error = {message: "File upload failed."};
        }
        console.log("Upload error response", error);
        reject(error);
      })
    });
  }

  async downloadFile(fileDescriptor, integration) {
    let url = `${integration.content.relayUrl}/integrations/download-item`;
    let params = {
      metadata: fileDescriptor.content.serverMetadata,
      authorization: integration.content.authorization
    }

    return new Promise((resolve, reject) => {
      this.httpManger.postAbsolute(url, params, (response) => {
        resolve(response);
      }, (errorResponse) => {
        var error = errorResponse.error;
        console.log("Download error response", errorResponse);
        reject(error);
      })
    });
  }

  async deleteFile(fileDescriptor, integration) {
    let url = `${integration.content.relayUrl}/integrations/delete-item`;
    let params = {
      metadata: fileDescriptor.content.serverMetadata,
      authorization: integration.content.authorization
    }

    return new Promise((resolve, reject) => {
      this.httpManger.postAbsolute(url, params, (response) => {
        resolve(response);
      }, (errorResponse) => {
        var error = errorResponse.error;
        console.log("Download error response", errorResponse);
        reject(error);
      })
    });
  }

}
