import { DR } from "../DR"

import { bufferBFragment } from "./bufferB";
import { bufferCFragment } from "./bufferC";
import { bufferDFragment } from "./bufferD";

import { mainFragment } from "./mainFragment";

import { mainVertex } from "./mainVertex";


import { Synth  } from "./synth/synth";


const sequence = [
    [8.82, 0x0000 | 0x4000, 0], // loop 1
    [8.82, 0x0000 | 0x4000, 1], // loop 2
    [4.41, 0x0020 | 0x6000, 2], // loop 3
    [255, 0x0000 | 0x0000, 0]  // end
];

let scene = 0;






// seg = (duration_ms/441*2*10)
// sceneDuration = scene_duration_ms/s

export const runner = () => {


    const dr = new DR(document.querySelector("canvas"), mainVertex, mainFragment, {



        "outTexture": (location, gl, program, time) => {
            gl.uniform1f(location, scene);

        }
    },{data:sequence,duration:150000});


    dr.aB("iChannel0", mainVertex, bufferBFragment); // bufferA 0
    dr.aB("iChannel1", mainVertex, bufferCFragment) // bufferB 1
    dr.aB("iChannel2", mainVertex, bufferDFragment) // bufferC 2
    
    //   dr.sP("iChannel1",false); // toggle render state = iChannel1 will be skipped.
    document.addEventListener("keyup", () => {

        scene++;


    


        if (scene > 2 ) scene =0;


        console.log(scene,demo.SQ.si);
//        scene = (scene ? 0 : 1);
    });
    return dr;
}

const demo = runner();



document.addEventListener("click", () => {
    const synth: Synth = new 
        Synth("9n31s0k0l00e0jt22a7g0nj07r1i0o432T0v1ue2f0q8y10m723d08w5h3E1b8T1v1u01f0qwx10p711d03A5F9B9Q0001PfaedE4b762663777T1v0ufbf0q00d02A0F0B0Q9000Pf000E250617T4v1u04f0q0x10p71z6666ji8k8k3jSBKSJJAArriiiiii07JCABrzrrrrrrr00YrkqHrsrrrrjr005zrAqzrjzrrqr1jRjrqGGrrzsrsA099ijrABJJJIAzrrtirqrqjqixzsrAjrqjiqaqqysttAJqjikikrizrHtBJJAzArzrIsRCITKSS099ijrAJS____Qg99habbCAYrDzh00E1bib000hd3ghd3g000004h4h4h4h4h4h4g004h8h4h8h4h8h4g000000000000000000p22pFE-547hlhjgnQAs2ptdMvoVJdHYkSnM8V8zwOeMzSyeEzF8X2caqfVjjjjjjjbh3jjcsgQQwaqfUhQ4t17ghQ4t17ghQ4uwhQ4t17ghIOYmCnyyz9bsyyz9bIyyz9X8EE0FEO17ghQ4t17ghQ4t17ghw0");
    synth.play()        
    demo.run(0, 60);
});

// });




