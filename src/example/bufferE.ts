export const bufferEFragment = /*wgsl*/ `

uniform vec2 resolution;
uniform float time;
uniform sampler2D iLogo;


out vec4 fragColor;

#define iTime time
#define iResolution resolution

float bounce;

// signed box
float sdBox(vec3 p,vec3 b)
{
  vec3 d=abs(p)-b;
  return min(max(d.x,max(d.y,d.z)),0.)+length(max(d,0.));
}

// rotation
void pR(inout vec2 p,float a) 
{
	p=cos(a)*p+sin(a)*vec2(p.y,-p.x);
}

// 3D noise function (IQ)
float noise(vec3 p)
{
	vec3 ip=floor(p);
    p-=ip; 
    vec3 s=vec3(7,157,113);
    vec4 h=vec4(0.,s.yz,s.y+s.z)+dot(ip,s);
    p=p*p*(3.-2.*p); 
    h=mix(fract(sin(h)*43758.5),fract(sin(h+s.x)*43758.5),p.x);
    h.xy=mix(h.xz,h.yw,p.y);
    return mix(h.x,h.y,p.z); 
}

float map(vec3 p)
{	

	p.z+=(3.-sin(0.314*iTime+1.1));
	pR(p.xz,bounce*.03);
    pR(p.yx,bounce*.4);
    float a = sdBox(p,vec3(.2,.5,1.))-0.02*bounce-(clamp(-100.*sin(.31415*iTime),0.,1.))*0.002*noise(20.*p+bounce); 
    float b = max(a,-sdBox(p-vec3(0,0.65,0),vec3(0.5,0.5,.1)));
    return max(b,-sdBox(p+vec3(0,0.65,0),vec3(0.5,0.5,.1)));
}

//	normal calculation
vec3 calcNormal(vec3 pos)
{
    float eps=0.0001;
	float d=map(pos);
	return normalize(vec3(map(pos+vec3(eps,0,0))-d,map(pos+vec3(0,eps,0))-d,map(pos+vec3(0,0,eps))-d));
}

// 	standard sphere tracing inside and outside
float castRayx(vec3 ro,vec3 rd) 
{
    float function_sign=(map(ro)<0.)?-1.:1.;
    float precis=.0001;
    float h=precis*2.;
    float t=0.;
	for(int i=0;i<120;i++) 
	{
        if(abs(h)<precis||t>12.)break;
		h=function_sign*map(ro+rd*t);
        t+=h;
	}
    return t;
}

// 	refraction
float refr(vec3 pos,vec3 lig,vec3 dir,vec3 nor,float angle,out float t2, out vec3 nor2)
{
    float h=0.;
    t2=2.;
	vec3 dir2=refract(dir,nor,angle);  
 	for(int i=0;i<50;i++) 
	{
		if(abs(h)>3.) break;
		h=map(pos+dir2*t2);
		t2-=h;
	}
    nor2=calcNormal(pos+dir2*t2);
    return(.5*clamp(dot(-lig,nor2),0.,1.)+pow(max(dot(reflect(dir2,nor2),lig),0.),8.));
}

//	softshadow 
float softshadow(vec3 ro,vec3 rd) 
{
    float sh=1.;
    float t=.02;
    float h=.0;
    for(int i=0;i<22;i++)  
	{
        if(t>20.)continue;
        h=map(ro+rd*t);
        sh=min(sh,4.*h/t);
        t+=h;
    }
    return sh;
}

//	main function
void mainImage(out vec4 fragColor,in vec2 fragCoord)
{    

	bounce=abs(fract(0.05*iTime)-.5)*20.; // triangle function
    
	vec2 uv=gl_FragCoord.xy/iResolution.xy; 
    vec2 p=uv*2.-1.;
   
// 	bouncy cam every 10 seconds
    float wobble=(fract(.1*(iTime-1.))>=0.9)?fract(-iTime)*0.1*sin(30.*iTime):0.;
    
//  camera    
    vec3 dir = normalize(vec3(2.*gl_FragCoord.xy -iResolution.xy, iResolution.y));
    vec3 org = vec3(0,2.*wobble,-3.);  
    

// 	standard sphere tracing:
    vec3 color = vec3(0.);
    vec3 color2= vec3(0.);
    float t=castRayx(org,dir);
	vec3 pos=org+dir*t;
	vec3 nor=calcNormal(pos);

// 	lighting:
    vec3 lig=normalize(-pos);
	lig*=-1.;
//	scene depth    
    float depth=clamp((1.-0.09*t),0.,1.);
    
    vec3 pos2=vec3(0.);
    vec3 nor2=vec3(0.);
    if(t<12.0)
    {
    	color2 = vec3(max(dot(lig,nor),0.)  +  pow(max(dot(reflect(dir,nor),lig),0.),16.));
    	color2 *=clamp(softshadow(pos,lig),0.,1.);  // shadow            	
       	float t2;
		color2.r +=refr(pos,lig,dir,nor,0.91, t2, nor2)*depth;
   		color2.g +=refr(pos,lig,dir,nor,0.90, t2, nor2)*depth;
   		color2.b +=refr(pos,lig,dir,nor,0.89, t2, nor2)*depth;
		color2-=clamp(.1*t2,0.,1.);				// inner intensity loss

	}      
  

    float tmp=0.;
    float T=1.;

//	animation of glow intensity    
    float intensity = 0.1*-sin(.209*iTime+1.)+0.05; 
	for(int i=0; i<128; i++)
	{
        float density = 0.; float nebula = noise(org+bounce);
        density=intensity-map(org+.5*nor2)*nebula;
		if(density>0.)
		{
			tmp = density / 128.;
            T *= 1. -tmp * 100.;
			if( T <= 0.) break;
		}
		org += dir*0.078;
    }    
	vec3 basecol=vec3(1.,.25,1./16.);
    T=clamp(T,0.,1.5); 
    color += basecol* exp(4.*(0.5-T) - 0.8);
    color2*=depth;
    color2+= (1.-depth)*noise(6.*dir+.3*iTime)*.1;	 
    depth=0.45*t;
    vec4 sr = vec4(vec3(1.*color+0.8*color2)*1.3,abs(0.47-depth)*2.+4.*wobble);
    fragColor = mix(sr,texture(iLogo,vec2(uv.x,1. - uv.y)),0.7);
}


void main(){

    mainImage(fragColor,gl_FragCoord.xy);

}




`