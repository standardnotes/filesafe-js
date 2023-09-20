import "standard-file-js/dist/regenerator.js"
import { SFHttpManager } from "standard-file-js"

export default class RelayManager {
  constructor() {
    this.httpManger = new SFHttpManager()
    this.httpManger.setJWTRequestHandler(() => {})
  }

  setCredentials(credentials) {
    this.credentials = credentials
  }

  getIntegrationRelayUrl(integration) {
    const url = integration.content.relayUrl
    return url.replace(
      "filesafe.standardnotes.org",
      "filesafe.standardnotes.com"
    )
  }

  async uploadFile(name, item, integration) {
    const url = `${this.getIntegrationRelayUrl(
      integration
    )}/integrations/save-item`
    const params = {
      file: {
        name: name,
        item: item, // base64 string of file
      },
      source: integration.content.source,
      authorization: integration.content.authorization,
    }

    return new Promise((resolve, reject) => {
      this.httpManger.postAbsolute(
        url,
        params,
        (response) => {
          resolve(response.metadata)
        },
        (errorResponse) => {
          let error = errorResponse.error
          if (!error) {
            error = {
              message: "File upload failed.",
            }
          }
          console.log("Upload error response", error)
          reject(error)
        }
      )
    })
  }

  async downloadFile(fileDescriptor, integration) {
    const url = `${this.getIntegrationRelayUrl(
      integration
    )}/integrations/download-item`
    const params = {
      metadata: fileDescriptor.content.serverMetadata,
      authorization: integration.content.authorization,
    }

    return new Promise((resolve, reject) => {
      this.httpManger.postAbsolute(
        url,
        params,
        (response) => {
          resolve(response)
        },
        (errorResponse) => {
          const error = errorResponse.error
          console.log("Download error response", errorResponse)
          reject(error)
        }
      )
    })
  }

  async deleteFile(fileDescriptor, integration) {
    const url = `${this.getIntegrationRelayUrl(
      integration
    )}/integrations/delete-item`
    const params = {
      metadata: fileDescriptor.content.serverMetadata,
      authorization: integration.content.authorization,
    }

    return new Promise((resolve, reject) => {
      this.httpManger.postAbsolute(
        url,
        params,
        (response) => {
          resolve(response)
        },
        (errorResponse) => {
          const error = errorResponse.error
          console.log("Download error response", errorResponse)
          reject(error)
        }
      )
    })
  }
}
