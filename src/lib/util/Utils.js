export default class Utils {

  static base64toBinary(dataURI) {
    var binary = atob(dataURI);
    var array = [];
    for(var i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Uint8Array(array);
  }

  static downloadData(data, fileName, fileType) {
    var link = document.createElement('a');
    link.setAttribute('download', fileName);
    link.href = this.tempUrlForData(data, fileType);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  static tempUrlForData(data, fileType) {
    return window.URL.createObjectURL(new Blob([data], {type: fileType ? fileType : 'text/json'}));
  }

  static copyTextToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
      // IE specific code path to prevent textarea being shown while dialog is visible.
      return clipboardData.setData("Text", text);
    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
      var textarea = document.createElement("textarea");
      textarea.textContent = text;
      textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
      document.body.appendChild(textarea);
      textarea.select();
      try {
          return document.execCommand("copy");  // Security exception may be thrown by some browsers.
      } catch (ex) {
          console.warn("Copy to clipboard failed.", ex);
          return false;
      } finally {
          document.body.removeChild(textarea);
      }
    }
  }
}
