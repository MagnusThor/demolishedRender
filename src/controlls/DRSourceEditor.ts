import { DOMUtils } from "./DOMUtils";

import * as CodeMirror from 'codemirror'

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
import 'codemirror/addon/display/autorefresh'
import 'codemirror/keymap/sublime';


export class DRSourceEditor {
  fragmentEditor: any;  
  update(Scene0: string) {
    this.fragmentEditor.getDoc().setValue(Scene0);           
    this.fragmentEditor.refresh(); 
  }

  constructor(public parent: HTMLElement) {
  }

  render(): void {

    let html = `<div class="modal fade" id="mod-source" data-backdrop="false" >
      <div class="modal-dialog modal-fullscreen">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Fragment source(glsl)</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="editor-fragment">
                  <textarea id="fragment" col="10" rows="10">
                  </textarea>
              </form>
            </div>
            <div class="modal-footer">
              <div>
              Errors <span class="badge text-bg-secondary mx-4">0</span>
              </div>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary">Apply shanges</button>
            </div>
          </div>
        </div>
  </div>`;

    let result = DOMUtils.toDOM(html) as HTMLElement;

    this.parent.appendChild(result);

    this.fragmentEditor = CodeMirror.fromTextArea(DOMUtils.get("#fragment"),
      {
        gutters: ["note-gutter", "CodeMirror-linenumbers"],
        viewportMargin: Infinity,
        lineNumbers: true,
        matchBrackets: true,
        mode: 'x-shader/x-fragment',
        keyMap: 'sublime',
        autoCloseBrackets: true,
        showCursorWhenSelecting: true,
        theme: "monokai",
        indentUnit: 4,
        lineWrapping: true,
        autofocus: false,
        autorefresh: true,

        extraKeys: {
          "Ctrl-S": function (instance) { alert(instance.getValue()); }
        }
      }
    );

    this.fragmentEditor.on("change", (cm: CodeMirror) => {
      let source = cm.getValue();
      console.log(source);
    });




  }

}
