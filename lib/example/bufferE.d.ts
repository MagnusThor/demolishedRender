export declare const bufferEFragment = "\n\nuniform vec2 resolution;\nuniform float time;\n\nout vec4 fragColor;\n\n#define iTime time\n#define iResolution resolution\n\nfloat bounce;\n\n// signed box\nfloat sdBox(vec3 p,vec3 b)\n{\n  vec3 d=abs(p)-b;\n  return min(max(d.x,max(d.y,d.z)),0.)+length(max(d,0.));\n}\n\n// rotation\nvoid pR(inout vec2 p,float a) \n{\n\tp=cos(a)*p+sin(a)*vec2(p.y,-p.x);\n}\n\n// 3D noise function (IQ)\nfloat noise(vec3 p)\n{\n\tvec3 ip=floor(p);\n    p-=ip; \n    vec3 s=vec3(7,157,113);\n    vec4 h=vec4(0.,s.yz,s.y+s.z)+dot(ip,s);\n    p=p*p*(3.-2.*p); \n    h=mix(fract(sin(h)*43758.5),fract(sin(h+s.x)*43758.5),p.x);\n    h.xy=mix(h.xz,h.yw,p.y);\n    return mix(h.x,h.y,p.z); \n}\n\nfloat map(vec3 p)\n{\t\n\n\tp.z+=(3.-sin(0.314*iTime+1.1));\n\tpR(p.xz,bounce*.03);\n    pR(p.yx,bounce*.4);\n    float a = sdBox(p,vec3(.2,.5,1.))-0.02*bounce-(clamp(-100.*sin(.31415*iTime),0.,1.))*0.002*noise(20.*p+bounce); \n    float b = max(a,-sdBox(p-vec3(0,0.65,0),vec3(0.5,0.5,.1)));\n    return max(b,-sdBox(p+vec3(0,0.65,0),vec3(0.5,0.5,.1)));\n}\n\n//\tnormal calculation\nvec3 calcNormal(vec3 pos)\n{\n    float eps=0.0001;\n\tfloat d=map(pos);\n\treturn normalize(vec3(map(pos+vec3(eps,0,0))-d,map(pos+vec3(0,eps,0))-d,map(pos+vec3(0,0,eps))-d));\n}\n\n// \tstandard sphere tracing inside and outside\nfloat castRayx(vec3 ro,vec3 rd) \n{\n    float function_sign=(map(ro)<0.)?-1.:1.;\n    float precis=.0001;\n    float h=precis*2.;\n    float t=0.;\n\tfor(int i=0;i<120;i++) \n\t{\n        if(abs(h)<precis||t>12.)break;\n\t\th=function_sign*map(ro+rd*t);\n        t+=h;\n\t}\n    return t;\n}\n\n// \trefraction\nfloat refr(vec3 pos,vec3 lig,vec3 dir,vec3 nor,float angle,out float t2, out vec3 nor2)\n{\n    float h=0.;\n    t2=2.;\n\tvec3 dir2=refract(dir,nor,angle);  \n \tfor(int i=0;i<50;i++) \n\t{\n\t\tif(abs(h)>3.) break;\n\t\th=map(pos+dir2*t2);\n\t\tt2-=h;\n\t}\n    nor2=calcNormal(pos+dir2*t2);\n    return(.5*clamp(dot(-lig,nor2),0.,1.)+pow(max(dot(reflect(dir2,nor2),lig),0.),8.));\n}\n\n//\tsoftshadow \nfloat softshadow(vec3 ro,vec3 rd) \n{\n    float sh=1.;\n    float t=.02;\n    float h=.0;\n    for(int i=0;i<22;i++)  \n\t{\n        if(t>20.)continue;\n        h=map(ro+rd*t);\n        sh=min(sh,4.*h/t);\n        t+=h;\n    }\n    return sh;\n}\n\n//\tmain function\nvoid mainImage(out vec4 fragColor,in vec2 fragCoord)\n{    \n\n\tbounce=abs(fract(0.05*iTime)-.5)*20.; // triangle function\n    \n\tvec2 uv=gl_FragCoord.xy/iResolution.xy; \n    vec2 p=uv*2.-1.;\n   \n// \tbouncy cam every 10 seconds\n    float wobble=(fract(.1*(iTime-1.))>=0.9)?fract(-iTime)*0.1*sin(30.*iTime):0.;\n    \n//  camera    \n    vec3 dir = normalize(vec3(2.*gl_FragCoord.xy -iResolution.xy, iResolution.y));\n    vec3 org = vec3(0,2.*wobble,-3.);  \n    \n\n// \tstandard sphere tracing:\n    vec3 color = vec3(0.);\n    vec3 color2= vec3(0.);\n    float t=castRayx(org,dir);\n\tvec3 pos=org+dir*t;\n\tvec3 nor=calcNormal(pos);\n\n// \tlighting:\n    vec3 lig=normalize(-pos);\n\tlig*=-1.;\n//\tscene depth    \n    float depth=clamp((1.-0.09*t),0.,1.);\n    \n    vec3 pos2=vec3(0.);\n    vec3 nor2=vec3(0.);\n    if(t<12.0)\n    {\n    \tcolor2 = vec3(max(dot(lig,nor),0.)  +  pow(max(dot(reflect(dir,nor),lig),0.),16.));\n    \tcolor2 *=clamp(softshadow(pos,lig),0.,1.);  // shadow            \t\n       \tfloat t2;\n\t\tcolor2.r +=refr(pos,lig,dir,nor,0.91, t2, nor2)*depth;\n   \t\tcolor2.g +=refr(pos,lig,dir,nor,0.90, t2, nor2)*depth;\n   \t\tcolor2.b +=refr(pos,lig,dir,nor,0.89, t2, nor2)*depth;\n\t\tcolor2-=clamp(.1*t2,0.,1.);\t\t\t\t// inner intensity loss\n\n\t}      \n  \n\n    float tmp=0.;\n    float T=1.;\n\n//\tanimation of glow intensity    \n    float intensity = 0.1*-sin(.209*iTime+1.)+0.05; \n\tfor(int i=0; i<128; i++)\n\t{\n        float density = 0.; float nebula = noise(org+bounce);\n        density=intensity-map(org+.5*nor2)*nebula;\n\t\tif(density>0.)\n\t\t{\n\t\t\ttmp = density / 128.;\n            T *= 1. -tmp * 100.;\n\t\t\tif( T <= 0.) break;\n\t\t}\n\t\torg += dir*0.078;\n    }    \n\tvec3 basecol=vec3(1.,.25,1./16.);\n    T=clamp(T,0.,1.5); \n    color += basecol* exp(4.*(0.5-T) - 0.8);\n    color2*=depth;\n    color2+= (1.-depth)*noise(6.*dir+.3*iTime)*.1;\t// subtle mist\n\n    \n//\tscene depth included in alpha channel\n    depth=0.45*t;\n    fragColor = vec4(vec3(1.*color+0.8*color2)*1.3,abs(0.47-depth)*2.+4.*wobble);\n}\n\n\nvoid main(){\n\n    mainImage(fragColor,gl_FragCoord.xy);\n\n}\n\n\n\n\n";
//# sourceMappingURL=bufferE.d.ts.map