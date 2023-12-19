import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/wrap/hardwrap';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/indent-fold';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/javascript-hint';
import 'codemirror/addon/display/rulers';
import 'codemirror/addon/display/panel';
import 'codemirror/mode/clike/clike.js';
import 'codemirror/addon/display/autorefresh';
import 'codemirror/keymap/sublime';
import { IBuf } from "../IBuf";
export declare class ShaderError {
    line: number;
    error: string;
    constructor(line: number, error: string);
}
export declare class DRSourceEditor {
    parent: HTMLElement;
    private listOfShaders;
    fragmentEditor: any;
    onBuild: (s: string) => void;
    onSave: (s: string) => void;
    onSelectShader: (e: Event) => void;
    nameOfShader: string;
    update(buffer: IBuf): void;
    markErrors(shaderErrors: Array<ShaderError>): void;
    constructor(parent: HTMLElement, listOfShaders: Array<string>);
    private toOptions;
    render(): void;
}
//# sourceMappingURL=DRSourceEditor.d.ts.map