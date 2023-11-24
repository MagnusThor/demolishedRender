"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DRUniforms = void 0;
const DOMUtils_1 = require("./DOMUtils");
class DRUniforms {
    constructor(parent, dr) {
        this.parent = parent;
        this.dr = dr;
    }
    render() {
        let html = `<div class="modal fade" id="mod-uniforms">        
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h1 class="modal-title fs-5" id="exampleModalLabel">Uniforms</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body" id="dump">
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary">Save changes</button>
              </div>
            </div>
          </div>        
      </div>
    </div>   
     `;
        let result = DOMUtils_1.DOMUtils.toDOM(html);
        this.parent.appendChild(result);
    }
    update() {
        const parent = DOMUtils_1.DOMUtils.get("#dump");
        parent.replaceChildren();
        const activeUniforms = this.dr.getUniforms();
        activeUniforms.forEach(uniform => {
            const row = DOMUtils_1.DOMUtils.create("div");
            row.classList.add("row", "mb-3");
            const lbl = DOMUtils_1.DOMUtils.create("label");
            lbl.classList.add("col-form-label", "col-sm-8");
            lbl.textContent = uniform.name;
            row.append(lbl);
            const col = DOMUtils_1.DOMUtils.create("div");
            col.classList.add("col-sm-4");
            const input = DOMUtils_1.DOMUtils.create("input");
            input.classList.add("form-control");
            input.dataset.name = uniform.name;
            input.dataset.type = uniform.type.toString();
            input.value = this.dr.getUniform(uniform.location).toString();
            col.append(input);
            row.append(col);
            parent.appendChild(row);
        });
    }
}
exports.DRUniforms = DRUniforms;
