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
}
