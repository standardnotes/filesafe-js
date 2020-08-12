export default class Utils {

  static base64toBinary(dataURI) {
    const binary = atob(dataURI);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Uint8Array(array);
  }

  static downloadData(data, fileName, fileType, useNavigation = false) {
    const link = document.createElement('a');
    link.setAttribute('download', fileName);
    const tempUrl = this.tempUrlForData(data, fileType);
    link.href = tempUrl;
    link.setAttribute("target", "_blank");
    if (useNavigation) {
      window.location.href = link.href;
    } else {
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    setTimeout(() => {
      this.revokeTempUrl(tempUrl);
    }, 500);
  }

  static tempUrlForData(data, fileType) {
    return window.URL.createObjectURL(new Blob([data], {
      type: fileType ? fileType : 'text/json'
    }));
  }

  static revokeTempUrl(url) {
    window.URL.revokeObjectURL(url);
  }

  static copyTextToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
      // IE specific code path to prevent textarea being shown while dialog is
      // visible.
      return clipboardData.setData("Text", text);
    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
      let textarea;
      let result;
      try {
        textarea = document.createElement('textarea');
        textarea.setAttribute('readonly', true);
        textarea.setAttribute('contenteditable', true);
        textarea.style.position = 'fixed'; // prevent scroll from jumping to the bottom when focus is set.
        textarea.value = text;

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        const range = document.createRange();
        range.selectNodeContents(textarea);

        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        textarea.setSelectionRange(0, textarea.value.length);
        result = document.execCommand('copy');
      } catch (err) {
        console.error(err);
        result = null;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }
}
