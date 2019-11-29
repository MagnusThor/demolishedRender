
class DemolisedBuffers {
        gl: WebGLRenderingContext;
        mainProgram: WebGLProgram;
        targets: Map<string, any>
        programs: Map<string, WebGLProgram>;
        surfaceBuffer: WebGLBuffer;
        buffer: WebGLBuffer;
        vertexPosition: number;
        screenVertexPosition: number;
        header: string = `#version 300 es
        #ifdef GL_ES
                precision highp float;
                precision highp int;
                precision mediump sampler3D;
        #endif
        `;
        textureCache: Map<string, any>;

        createShader(program: WebGLProgram, type: number, source: string): void {
                let shader = this.gl.createShader(type) as WebGLShader;
                this.gl.shaderSource(shader, source);
                this.gl.compileShader(shader);
                this.gl.attachShader(program, shader);
                if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                        this.gl.getShaderInfoLog(shader).trim().split("\n").forEach((l: string) =>
                                console.error("[shader] " + l))
                        throw new Error("Error while compiling vertex/fragment" + source)
                };
        }
        addProgram(name: string): WebGLProgram {
                let p = this.gl.createProgram();
                this.programs.set(name, p);
                return p;
        }
        
        ct(image:any){
                let gl = this.gl;
                let texture = gl.createTexture()
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.bindTexture(gl.TEXTURE_2D, null);
                return texture;
        }

        addAssets(textures: any,cb:()=>void): void {
                let c = Object.keys(textures).length;
                Object.keys(textures).forEach((key: string) => {
                        const m = new Image();
                        m.onload = (e) => {
                                this.textureCache.set(key, this.ct(m));
                                if(this.textureCache.size === c) cb();
                        }
                        m.src = textures[key].src;
                });

                ;
        }
        addBuffer(name: string, vertex: string, fragment: string, textures?: Array<string>): this {
                let gl = this.gl;
                let target = this.createTarget(this.canvas.width, this.canvas.height, textures ? textures : []);
                this.targets.set(name, target);

                let program = this.addProgram(name);
                this.createShader(program, gl.VERTEX_SHADER, this.header + vertex);
                this.createShader(program, gl.FRAGMENT_SHADER, this.header + fragment);

                gl.linkProgram(program);
                gl.validateProgram(program);


                if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                        var info = gl.getProgramInfoLog(program);
                        throw 'Could not compile WebGL program. \n\n' + info;
                }

                gl.useProgram(program);


                if (textures) {
                        textures.forEach((tk: string) => {
                                let m = this.textureCache.get(tk);
                                gl.bindTexture(3553, m);
                                
                        });                      
                }
                this.vertexPosition = gl.getAttribLocation(program, "pos");
                gl.enableVertexAttribArray(this.vertexPosition);
                return this;
        }

        render(time: number) {

                let gl = this.gl;
                let main = this.mainProgram;
                let i = 0;
                this.programs.forEach((current: WebGLProgram, key: string) => {

                        gl.useProgram(current);

                        let target = this.targets.get(key);

                        gl.uniform2f(gl.getUniformLocation(current, "resolution"), this.canvas.width, this.canvas.height);
                        gl.uniform1f(gl.getUniformLocation(current, "time"), time);

                        target.textures.forEach((tk: string) => {
                                let loc = gl.getUniformLocation(current, tk);
                                gl.activeTexture(gl.TEXTURE0 + i);	                
                                gl.uniform1i(loc, i);
                                i++;
                        });


                        gl.bindBuffer(gl.ARRAY_BUFFER, this.surfaceBuffer);
                        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

                        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
                        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
                    
                        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);

                        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                        gl.drawArrays(gl.TRIANGLES, 0, 6);


                });
                // Render front buffer to screen
                gl.useProgram(main);
                gl.uniform2f(gl.getUniformLocation(main, "resolution"), this.canvas.width, this.canvas.height);
                gl.uniform1f(gl.getUniformLocation(main, "time"), time);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
                gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

                this.targets.forEach((target: any, key: string) => {
                        gl.uniform1i(gl.getUniformLocation(main, key), i);
                        gl.activeTexture(gl.TEXTURE0 + i);
                        gl.bindTexture(gl.TEXTURE_2D, target.texture);
                        i++;
                });
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        createTarget(width: number, height: number, textures: Array<string>): any {
                let gl = this.gl;
                var t = {
                        "framebuffer": gl.createFramebuffer(),
                        "renderbuffer": gl.createRenderbuffer(),
                        "texture": gl.createTexture(),
                        "textures": textures
                };
                gl.bindTexture(gl.TEXTURE_2D, t.texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

                gl.bindFramebuffer(gl.FRAMEBUFFER, t.framebuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.texture, 0);
                gl.bindRenderbuffer(gl.RENDERBUFFER, t.renderbuffer);

                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, t.renderbuffer);
             
                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                return t;

        }

        constructor(public canvas: HTMLCanvasElement, v: string, f: string) {

                this.targets = new Map<string, any>();
                this.programs = new Map<string, WebGLProgram>();
                this.textureCache = new Map<string, any>();

                this.gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true }) as WebGLRenderingContext;

                this.gl.viewport(0, 0, canvas.width, canvas.height);

                let gl = this.gl;

                this.buffer = gl.createBuffer();
                this.surfaceBuffer = gl.createBuffer();

                this.mainProgram = gl.createProgram();

                this.createShader(this.mainProgram, this.gl.VERTEX_SHADER, this.header + v);
                this.createShader(this.mainProgram, this.gl.FRAGMENT_SHADER, this.header + f);

                this.gl.linkProgram(this.mainProgram);
                this.gl.validateProgram(this.mainProgram);

                if (!gl.getProgramParameter(this.mainProgram, gl.LINK_STATUS)) {
                        var info = gl.getProgramInfoLog(this.mainProgram);
                        throw 'Could not compile WebGL program. \n\n' + info;
                }
                this.gl.useProgram(this.mainProgram);
                this.screenVertexPosition = gl.getAttribLocation(this.mainProgram, "pos");
                gl.enableVertexAttribArray(this.screenVertexPosition);
        
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([- 1.0, - 1.0, 1.0, - 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0]), gl.STATIC_DRAW);
        }
}







var player: DemolisedBuffers;

//document.addEventListener("DOMContentLoaded", (e) => {

const vertex = `layout(location = 0) in vec2 pos; 
        out vec4 fragColor;
        void main() { 
            gl_Position = vec4(pos.xy,0.0,1.0);
        }`;


//var _kali = "uniform float time;uniform vec2 mouse,resolution;vec3 v=vec3(0.);float i;void f(vec2 v){i=fract(sin(dot(v,vec2(113.421,17.329)))*3134.12);}float f(){return fract(sin(i++)*3143.45);}float n(vec3 f){const vec3 i=vec3(.63248,.78632,.875);float r=1.;for(int m=0;m<5;m++){f=2.*clamp(f,-i,i)-f;float n=max(.70968/dot(f,f),1.);f*=n;r*=n;}if(v.r>=0.)v+=abs(f);float m=length(f.rg);return max(m-.92784,abs(m*f.b)/length(f))/r;}float s(vec3 v){return n(v);}vec3 t(in vec3 v){vec2 f=vec2(1.,-1.)*.5773*.0005;return normalize(f.rgg*s(v+f.rgg)+f.ggr*s(v+f.ggr)+f.grg*s(v+f.grg)+f.rrr*s(v+f.rrr));}vec3 p(in vec3 v){return t(v);}mat2 x(float v){return mat2(cos(v),sin(v),-sin(v),cos(v));}mat3 f(in vec3 v,in vec3 f,in float i){vec3 m=normalize(f-v),s=normalize(cross(m,vec3(sin(i),cos(i),0.))),d=normalize(cross(s,m));return mat3(s,d,m);}void n(out vec3 v,out vec3 f,in float m){float i=.3*m+10.;v=vec3(2.772*sin(i),.424,.82*cos(i));f=vec3(1.,0.,-.03);}float f(in vec3 v,in vec3 f){const float m=20.,i=.001;float r=i*2.,n=0.,d=-1.;for(int b=0;b<128;b++){if(r<i||n>m)break;r=s(v+f*n);n+=r;}if(n<m)d=n;return d;}vec3 m(float v){return vec3(cos(v),sin(v),-.65+abs(sin(v*.7))*.25)*(2.+sin(v*1.7)*.5)+vec3(0.,0.,1.);}vec3 e(vec3 v){return v;}vec4 e(vec3 i,vec3 r,float n,float b,float g){f(gl_FragCoord.rg+b);vec3 d=m(b+1.),c;d.b+=n;i.b-=n;float a=s(i)*.8,o=a*f(),u=a,p=1.,x=0.;vec4 l=vec4(0.,0.,0.,1.),z,h=vec4(-1.);for(int C=0;C<99;C++){if(u>o+x)c=i+r*(o+x),c+=(d-c)*-c.b/(d.b-c.b);else c=i+r*o;a=s(c);if(u>o+x){float k=.05*length(i+r*(o+x)-d);l.rgb+=l.a*vec3(1.,1.,.7)*exp(-k*40.)*smoothstep(0.,.01,a);if(o+x+k>u){x=0.;o=u;if(o>20.)break;}else x+=k;}else{if(a<p&&h.a<0.){float k=clamp(a/(g*o),0.,1.);if(k<.95)z=vec4(k,z.rgb),h=vec4(o,h.rgb),l.a*=k;}p=a;u=o+a*(.6+.2*f());}}vec3 k=vec3(0.);for(int C=0;C<4;C++){if(h.r<0.)continue;v=vec3(0.);c=i+r*h.r;vec3 F=t(c),D=d-c,w;v=sin(v)*.3+vec3(.8,.6,.4);float Z=exp(-dot(D,D)*.2);c+=D*-c.b/D.b;D=normalize(D);w=Z*v*max(0.,dot(F,D));float Y=max(0.,dot(F,-r));w+=exp(-o)*v*Y;a=smoothstep(0.,.005,s(c));w+=Z*vec3(2.,2.,1.7)*max(0.,dot(F,D))*a;if(r.b<0.&&a>0.)w+=Z*vec3(4.,3.,1.4)*pow(max(0.,dot(reflect(r,F),D)),5.)*(1.-.25*Y)*a;k=mix(w,k,z.r);z=z.gbar;h=h.gbar;}l.rgb=clamp(l.rgb+k,0.,1.);return vec4(e(l.rgb),o);}out vec4 fragColor;void main(){float v,i,d,c=i=.3;vec2 m=gl_FragCoord.rg/resolution.rg+mouse/4.;vec3 s,r;n(s,r,time*.1);v=mod(time,18.85);mat3 a=f(s,r,0.);vec3 k=normalize(a*vec3(m.rg,3.5));vec4 b=e(s,k,.3,v*.12,3./resolution.g);fragColor=b;}";

var fractal = "uniform sampler2D iChannel0; uniform float time;uniform vec2 mouse,resolution;vec3 v=normalize(vec3(-1.,1,-.5));const float m=2e-05;float f=0.;float s(vec3 v){vec3 f=v;v=abs(1.-mod(v,2.));float r=0.,g=8.,c=1.;vec3 i=v;for(int m=0;m<7;m++){f=-1.+2.*fract(.5*f+.5);float t=dot(f,f);r=length(i);if(r>1.616)break;float n=acos(i.b/r),a=atan(i.g,i.r);c=pow(r,g-1.)*g*c+1.;float e=pow(r,g);n=n*g;a=a*g;i=e*vec3(sin(n)*cos(a),sin(a)*sin(n),cos(n));i+=v;}return.5*log(r)*r/c;}float t(vec3 v){float r=1.,i=0.;vec3 m=v,c=m;for(int f=0;f<6;f++)m=max(m=abs(mod(c*r+1.,2.)-1.),m.gbr),i=max(i,(.3-length(m*.95)*.3)/r),r*=2.;return i;}float n(vec3 v){return min(t(v),s(v));}vec3 x(in vec3 v){vec2 i=vec2(1.,-1.)*.5773*.0005;return normalize(i.rgg*n(v+i.rgg)+i.ggr*n(v+i.ggr)+i.grg*n(v+i.grg)+i.rrr*n(v+i.rrr));}float n(in vec3 v,in vec3 r){float i=0.,c=.05,m;for(int f=0;f<4;f++)m=n(v+r*c),i=min(6.*m/c,i),c+=m;return max(i,0.);}float s(const vec3 v,const vec3 r){float i=m*80.,f=0.,c=10.;for(int g=0;g<5;g++){float t=i+i*float(g*g);vec3 a=r*t+v;float s=n(a);f+=-(s-t)*c;c*=.75;}return clamp(1.-5.*f,0.,1.);}float e(vec3 v){v=abs(.5-fract(v*80.));float f,i=f=0.;for(int m=0;m<13;m++){float r=i;i=length(v);v=abs(v)/dot(v,v)-.5;f+=exp(-1./abs(i-r));}return f;}vec3 e(in vec3 i,in vec3 r){vec3 f=x(i);float m=min(5.,n(i,v)),c=s(i,f),g=max(0.,dot(v,-f))*m*1.3,a=max(.2,dot(r,-f))*.4;vec3 t=reflect(v,f);float w=pow(max(0.,dot(r,-t))*m,10.)*(.5+c*.5),d=e(i)*.18;vec3 p=mix(vec3(d*1.1,d*d*1.3,d*d*d),vec3(d),.45)*2.;p=p*c*(a*vec3(.9,.85,1.)+g*vec3(1.,.9,.9))+w*vec3(1,.9,.5)*.7;return p;}vec3 t(in vec3 v,in vec3 r){vec3 i,c;float g=0.,d=0.,a=0.;for(int t=0;t<128;t++){c=v+g*r;float p=.001*g;a=n(v+r*g);f=m*(1.+g*55.);if(a<.0002)break;g+=a;}vec3 t=vec3(.5);i=e(c-f*r*1.5,r);i*=vec3(1.,.85,.8)*.9;i=mix(i,t,1.-exp(-1.3*pow(g,1.3)));return i;}vec3 r(float v){vec2 i=600.*vec2(cos(1.4+.37*v),cos(3.2+.31*v));return vec3(i.r,0.,i.g);}float w(vec2 v){return fract(sin(dot(v,vec2(12.9898,78.233)))*33758.5)-.5;}vec3 r(vec3 v,vec2 r){return v=pow(v,vec3(.57)),v=mix(vec3(.5),mix(vec3(dot(vec3(.2125,.7154,.0721),v*1.2)),v*1.2,1.3),1.4),v;}out vec4 fragColor;float c[16];void main(){vec2 v=gl_FragCoord.rg/resolution.rg-.5;float i=time*.5;vec2 f=v*vec2(1.75,1.);vec3 m=r(i*.001),c=r(i+2.);float a=.4*cos(.4*i);vec3 g=normalize(c-m),d=vec3(sin(a),cos(a),0.),n=normalize(cross(g,d)),s=normalize(cross(n,g)),p=normalize(f.r*n+f.g*s+.6*g),e=t(m,p);e=r(e,f);vec4 oo = texture(iChannel0,vec2(0));fragColor=vec4(e,1.);}";



var kalispears = `uniform float time;uniform vec2 mouse,resolution;uniform sampler2D iChannel0,iChannel1,iChannel2,iChannel3,iChannel4,fft;out vec4 fragColor;
#define RAY_STEPS 100
#define SHADOW_STEPS 50
#define LIGHT_COLOR vec3(1.,.97,.93)
#define AMBIENT_COLOR vec3(.75,.65,.6)
#define SPECULAR 0.65
#define DIFFUSE 1.0
#define AMBIENT 0.35
#define BRIGHTNESS 1.5
#define GAMMA 1.35
#define SATURATION.8
#define detail.00004
#define t time*.2
vec3 lightdir=normalize(vec3(.1,-.15,-1.));const vec3 origin=vec3(-1.,.2,0.);float det=0.;vec3 pth1;mat2 rot(float v){return mat2(cos(v),sin(v),-sin(v),cos(v));}vec4 formula(vec4 v){return v.rb=abs(v.rb+1.)-abs(v.rb-1.)-v.rb,v=v*2./clamp(dot(v.rgb,v.rgb),.15,1.)-vec4(.5,.5,.8,0.),v.rg*=rot(.5),v;}float screen(vec3 v){float m=length(v.gb-vec2(.25,0.))-.5,i=length(v.gb-vec2(.25,2.))-.5;return min(max(m,abs(v.r-.3)-.01),max(i,abs(v.r+2.3)-.01));}vec2 de(vec3 v){float r=0.;vec3 m=v;m.b=abs(2.-mod(m.b,4.));vec4 i=vec4(m,1.5);float c=max(0.,.35-abs(v.g-3.35))/.35;
#ifdef LESSDETAIL
for(int f=0;f<6;f++)i=formula(i);float f=max(-m.r-4.,(length(max(vec2(0.),i.gb-2.))-.5)/i.a);
#else
for(int b=0;b<8;b++)i=formula(i);float d=max(-m.r-4.,length(max(vec2(0.),i.gb-3.))/i.a);
#endif
float b=screen(m),l=min(b,d);if(abs(l-b)<.001)r=1.;return vec2(l,r);}vec2 colorize(vec3 v){v.b=abs(2.-mod(v.b,4.));float m,i=m=0.,r=1000.;for(int f=0;f<15;f++){v=formula(vec4(v,0.)).rgb;float b=i;i=length(v);m+=exp(-10./abs(i-b));r=min(r,abs(i-3.));}return vec2(m,r);}vec3 path(float v){vec3 r=vec3(sin(v)*2.,(1.-sin(v*.5))*.5,-cos(v*.25)*30.)*.5;return r;}vec3 normal(vec3 v){vec3 m=vec3(0.,det,0.);return normalize(vec3(de(v+m.grr).r-de(v-m.grr).r,de(v+m.rgr).r-de(v-m.rgr).r,de(v+m.rrg).r-de(v-m.rrg).r));}float shadow(vec3 v,vec3 r){float m=1.,i=2.*det,f=10.;for(int b=0;b<SHADOW_STEPS;b++){if(i<1.&&f>detail){vec3 l=v-i*r;f=de(l).r;m=min(m,max(50.*f/i,0.));i+=max(.01,f);}}return clamp(m,.1,1.);}float calcAO(const vec3 v,const vec3 m){float r=detail*40.,f=0.,i=13.;for(int b=0;b<5;b++){float d=r*float(b*b);vec3 l=m*d+v;float c=de(l).r;f+=-(c-d)*i;i*=.7;}return clamp(1.-5.*f,0.,1.);}vec3 light(in vec3 v,in vec3 m,in vec3 r,in float i){float b=shadow(v,lightdir),f=calcAO(v,r),d=max(0.,dot(lightdir,-r))*b*DIFFUSE;vec3 l=max(.5,dot(m,-r))*AMBIENT*AMBIENT_COLOR,a=reflect(lightdir,r);float c=pow(max(0.,dot(m,-a))*b,15.)*SPECULAR;vec3 p;vec2 s=colorize(v);if(i>.5)p=vec3(1.),c=c*c;else{float g=pow(s.r*.11,2.);p=mix(vec3(g,g*g,g*g),vec3(g),.5)+.1;p+=pow(max(0.,1.-s.g),5.)*.3;}p=p*f*(l+d*LIGHT_COLOR)+c*LIGHT_COLOR;if(i>.5){vec3 n=v;n.b=abs(1.-mod(n.b,2.));vec3 g=texture(iChannel0,mod(1.-v.bg-vec2(.4,.2),vec2(1.))).rgb*2.;p+=g*abs(.01-mod(v.g-time*.1,.02))/.01*f;p*=max(0.,1.-pow(length(n.gb-vec2(.25,1.)),2.)*3.5);}else{vec3 g=texture(iChannel0,mod(v.br*2.+vec2(.5),vec2(1.))).rgb;g*=abs(.01-mod(v.r-time*.1*sign(v.r+1.),.02))/.01;p+=pow(s.r,10.)*3e-10*g;p+=pow(max(0.,1.-s.g),4.)*pow(max(0.,1.-abs(1.-mod(v.b+time*2.,4.))),2.)*vec3(1.,.8,.4)*4.*max(0.,.05-abs(v.r+1.))/.05;}return p;}vec3 raymarch(in vec3 v,in vec3 m){float r,i,b=r=0.;vec2 f=vec2(1.,0.);vec3 l,c=vec3(0.);for(int p=0;p<RAY_STEPS;p++){if(f.r>det&&b<30.){l=v+b*m;f=de(l);det=detail*(1.+b*50.);b+=f.r;if(f.r<.015)r+=max(0.,.015-f.r)*exp(-b);}}float g=max(0.,dot(normalize(-m),normalize(lightdir)));vec3 d=vec3(max(0.,-m.g+.6))*AMBIENT_COLOR*.5*max(.4,g);if(f.r<det||b<30.){l=l-abs(f.r-det)*m;vec3 p=normal(l);c=light(l,m,p,f.g);c=mix(c,d,1.-exp(-.15*pow(b,1.5)));}else{c=d;vec3 p=(m*3.+vec3(1.3,2.5,1.25))*.3;for(int n=0;n<13;n++)p=abs(p)/dot(p,p)-.9;c+=min(1.,pow(min(5.,length(p)),3.)*.0025);}vec3 p=LIGHT_COLOR*pow(g,25.)*.5;c+=r*(.5+g*.5)*LIGHT_COLOR*.7;c+=p*exp(min(30.,b)*.02);return c;}vec3 move(inout vec3 v){vec3 m=path(t),i=path(t+.7);float r=de(i).r;vec3 f=normalize(i-m);float b=i.r-m.r;b*=min(1.,abs(i.b-m.b))*sign(i.b-m.b)*.7;v.rg*=mat2(cos(b),sin(b),-sin(b),cos(b));b=f.g*1.7;v.gb*=mat2(cos(b),sin(b),-sin(b),cos(b));b=atan(f.r,f.b);v.rb*=mat2(cos(b),sin(b),-sin(b),cos(b));return m;}void main(){pth1=path(t+.3)+origin;vec2 v=gl_FragCoord.rg/resolution.rg*2.-1.;v.g*=resolution.g/resolution.r;vec3 b=normalize(vec3(v*.8,1.)),i=origin+move(b),m=raymarch(i,b);m=clamp(m,vec3(0.),vec3(1.));m=pow(m,vec3(GAMMA))*BRIGHTNESS;m=mix(vec3(length(m)),m,SATURATION);fragColor=vec4(m,1.);}
`;
// const fragmentA = `uniform float time;
// uniform vec2 resolution;
// out vec4 fragColor;
// void main(){
//         vec2 position = ( gl_FragCoord.xy / resolution.xy )  / 4.0;
//         vec3 col = vec3(.0,0.,1.0);
//         fragColor = vec4(col,1.0);                                        

// }`;

const f = `uniform float time;
uniform vec2 resolution;
uniform sampler2D iChannel0;
out vec4 fragColor;
void main(){
        vec2 uv = gl_FragCoord.xy / resolution.xy*2.-1.;    
        fragColor = texture(iChannel0,uv);                                             
}`;


// const fragmentB = `uniform float time;
// uniform vec2 resolution;
// out vec4 fragColor;
// void main(){
//         vec2 position = ( gl_FragCoord.xy / resolution.xy )  / 4.0;
//         vec3 col = vec3(cos(time)*1.0,sin(time)*1.,0.0);

//         fragColor = vec4(col,1.0);                                        

// }`;


// main
let mainVertex = `layout(location = 0) in vec2 pos; 
        out vec4 fragColor;                
        void main() { 
            gl_Position = vec4(pos.xy,0.0,1.0);
        }`;


let mainFragment = `uniform float time;
        uniform vec2 resolution;
        uniform sampler2D bufferA;
        //uniform sampler2D bufferB;
        out vec4 fragColor;
        vec3 mod289(vec3 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
              }
              
              vec2 mod289(vec2 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
              }
              
              vec3 permute(vec3 x) {
                return mod289(((x*34.0)+1.0)*x);
              }
              
              float snoise(vec2 v)
                {
                const vec4 C = vec4(0.211324865405187, 
                                    0.366025403784439, 
                                   -0.577350269189626,  
                                    0.024390243902439);
                        vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);
              
                vec2 i1;
                i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
              
                i = mod289(i);
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                              + i.x + vec3(0.0, i1.x, 1.0 ));
              
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m ;
                m = m*m ;
              
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
              
                m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
              
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
              }
              
              float rand(vec2 co)
              {
                 return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453);
              }
    
               
        void main(){                

                /*
                edge detect
                float AMP = 4.0;

                vec3 color = texture(bufferA, gl_FragCoord.xy / resolution.xy).rgb;
	
                vec3 Lx = dFdx(color*AMP);
                vec3 Ly = dFdy(color*AMP);
                vec3 G = sqrt(Lx*Lx+Ly*Ly);
                
                fragColor = vec4(G, 1.0);

                return;
                */

          vec2 uv = gl_FragCoord.xy / resolution.xy;
          float noise = max(0.0, snoise(vec2(time, uv.y * 0.3)) - 0.3) * (1.0 / 0.7);
          noise = noise + (snoise(vec2(time*10.0, uv.y * 2.4)) - 0.5) * 0.15;          
          float xpos = uv.x - noise * noise * 0.25;
              fragColor = texture(bufferA, vec2(xpos, uv.y));          
          fragColor.rgb = mix(fragColor.rgb, vec3(rand(vec2(uv.y * time))), noise * 0.3).rgb;          
          if (floor(mod(gl_FragCoord.y * 0.25, 2.0)) == 0.0)
          {
              fragColor.rgb *= 1.0 - (0.15 * noise);
          }                                      
        }`;





player = new DemolisedBuffers(document.querySelector("#main"), mainVertex, mainFragment);
// add textures to textureCache, create buffers -> passed as textures to main (mainVertex,mainFragment)
player.addAssets({
        iChannel0: {
                src: "assets/iChannel0.png"
        }
},() => {
        player.addBuffer("bufferA", vertex, kalispears, ["iChannel0"]);
        //.addBuffer("bufferB", vertex, fragmentB);
        let st = 0;   
        const loop = (t: number) => {
                player.render(t / 1000);
                st = (t - st) /
                        requestAnimationFrame(loop);
        };      
        setTimeout ( () => {
                loop(0);
                console.log("started");
        },2000);
});

// Compress into binary. using
// node compress.js -> outputs file output.png.html

