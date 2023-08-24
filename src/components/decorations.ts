import { window, Range, DecorationOptions, TextEditorDecorationType } from 'vscode'

export type Decoration = { 
    decorationType: TextEditorDecorationType; 
    rangesOrOptions: Range[] | DecorationOptions[] 
}
export type Decorations = Decoration[] | undefined

let opacity = '44'
export const DECORATION_TYPES = {
    none: window.createTextEditorDecorationType({}),
    severity_0: window.createTextEditorDecorationType({
        backgroundColor: "#40a45b" + opacity,
        overviewRulerColor: "#40a45b" + opacity,
        // overviewRulerColor: "#FF0000",
        // opacity: "0.2",
        // fontWeight: "bold",
        // borderWidth: "0px 0px 1px 0px",
        // borderColor: "#E2E2E2",
        // borderStyle: "dashed",
        // textDecoration: "purple underline wavy",

    }),
    severity_1: window.createTextEditorDecorationType({
        backgroundColor: "#fecc5c" + opacity,
        overviewRulerColor: "#fecc5c" + opacity
    }),
    severity_2: window.createTextEditorDecorationType({
        backgroundColor: "#fd8d3c" + opacity,
        overviewRulerColor: "#fd8d3c" + opacity,
        // fontWeight: "bolder",
    }),
    severity_3: window.createTextEditorDecorationType({
        backgroundColor: "#e31a1c" + opacity,
        overviewRulerColor: "#e31a1c" + opacity
    }),
}