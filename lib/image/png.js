"use strict";

const PDF = require("../object");

module.exports = class PNGImage {
  constructor(src) {
    this.src = src;
    this.xobjCount = 1;

    const view = new DataView(src);
    // Check for PNG file signature.
    if (
      view.getUint32(0) !== 0x89504e47 ||
      view.getUint32(4) !== 0x0d0a1a0a
    ) {
      throw new Error("Invalid PNG image.");
    }

    let i = 12; // Offset to IHDR chunk

    // Find IHDR chunk
    while (i < view.byteLength) {
      const chunkLength = view.getUint32(i);
      const chunkType = view.getUint32(i + 4);

      if (chunkType === 0x49484452) {
        // IHDR chunk
        this.width = view.getUint32(i + 8);
        this.height = view.getUint32(i + 12);
        const colorType = view.getUint8(i + 16);

        switch (colorType) {
          case 0:
            this.colorSpace = "DeviceGray";
            break;
          case 2:
            this.colorSpace = "DeviceRGB";
            break;
          case 4:
            this.colorSpace = "DeviceCMYK";
            break;
          default:
            throw new Error("Unsupported color type in PNG image.");
        }

        break;
      }

      i += chunkLength + 12;
    }

    if (!this.width || !this.height || !this.colorSpace) {
      throw new Error("Could not read PNG image properties");
    }
  }

  async write(doc, xobjs) {
    const xobj = xobjs[0];

    xobj.prop("Subtype", "Image");
    xobj.prop("Width", this.width);
    xobj.prop("Height", this.height);
    xobj.prop("ColorSpace", this.colorSpace);
    xobj.prop("BitsPerComponent", 8);

    const hex = asHex(this.src);
    xobj.prop("Filter", new PDF.Array(["/ASCIIHexDecode", "/FlateDecode"]));
    xobj.prop("Length", hex.length + 1);
    xobj.prop("Length1", this.src.byteLength);

    const content = new PDF.Stream(xobj);
    content.content = hex + ">\n";

    await doc._writeObject(xobj);
  }
};

function asHex(ab) {
  const view = new Uint8Array(ab);
  let hex = "";
  for (let i = 0, len = ab.byteLength; i < len; ++i) {
    hex += toHex(view[i]);
  }
  return hex;
}

function toHex(n) {
  if (n < 16) return "0" + n.toString(16);
  return n.toString(16);
}