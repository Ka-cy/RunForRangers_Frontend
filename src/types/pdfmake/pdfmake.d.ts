declare module 'pdfmake/build/pdfmake' {
  import { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';
  interface PdfMake {
    vfs: TFontDictionary; // Define vfs as writable
    createPdf(documentDefinitions: TDocumentDefinitions): any;
  }
  const pdfMake: PdfMake;
  export = pdfMake;
}

declare module 'pdfmake/build/vfs_fonts';
