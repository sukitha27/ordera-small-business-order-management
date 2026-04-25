declare module "react-barcode" {
  import { Component } from "react";
  interface BarcodeProps {
    value: string;
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
    background?: string;
    lineColor?: string;
    textAlign?: string;
    textPosition?: string;
    textMargin?: number;
    font?: string;
    fontOptions?: string;
  }
  export default class Barcode extends Component<BarcodeProps> {}
}