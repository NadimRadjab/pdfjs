const util = require("../util");
const PDFImage = require("./pdf");
const JPEGImage = require("./jpeg");
const PNGImage = require("./png");


module.exports = class Image {
  constructor(b) {
    const src = util.toArrayBuffer(b);

    switch (determineType(src)) {
      case "pdf":
        return new PDFImage(src);
      case "jpeg":
        return new JPEGImage(src);
      case "png":
          return new PNGImage(src);
      default:
        throw new TypeError("Unsupported image type");
    }
  }
};

function determineType(buffer) {
  const pdf = String.fromCharCode.apply(null, new Uint8Array(buffer, 0, 5));
  if (pdf === "%PDF-") {
    return "pdf";
  }

  const view = new DataView(buffer);
  if (view.getUint8(0) === 0xff && view.getUint8(1) === 0xd8) {
    return "jpeg";
  } else if (
    view.getUint32(0) === 0x89504e47 &&
    view.getUint32(4) === 0x0d0a1a0a
  ) {
    return "png";
  }

  return null;
}
