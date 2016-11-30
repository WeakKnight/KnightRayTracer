import Foundation
import simd

protocol Material {
    func scatter(ray:Ray,hitRes:HitResult)->(isScatter:Bool,scatterRay:Ray,attenuation:float3,isRefracted:Bool,refractRay:Ray,RSchlick:Float);
}

class Lambertian: Material {
    var albedo:float3;
    init(palbedo:float3){
        albedo = palbedo;
    }
    
    func scatter(ray:Ray,hitRes:HitResult)->(isScatter:Bool,scatterRay:Ray,attenuation:float3,isRefracted:Bool,refractRay:Ray,RSchlick:Float){
        var scattered = Ray(origin:hitRes.hitVector, direction: normalize(hitRes.normal + randomVectorInUnitSphere()),currentRefractIndex:ray.currentRefractIndex);
        scattered.origin = scattered.origin + scattered.direction * FLT_EPSILON;
        return (isScatter:true,scatterRay:scattered,attenuation:albedo,isRefracted:false,refractRay:Ray(origin:float3(),direction:float3(),currentRefractIndex:1),RSchlick:0);
    }
}

class Metal: Material{
    var albedo:float3;
    var fuzz: Float;
    init(palbedo:float3,pfuzz:Float){
        albedo = palbedo;
        if pfuzz < 1 {
            fuzz = pfuzz;
        } else {
            fuzz = 1;
        }
    }
    
    func scatter(ray:Ray,hitRes:HitResult)->(isScatter:Bool,scatterRay:Ray,attenuation:float3,isRefracted:Bool,refractRay:Ray,RSchlick:Float){
        let reflectRay = reflect(normalize(ray.direction), n: hitRes.normal);
        var scattered = Ray(origin: hitRes.hitVector, direction: reflectRay + fuzz * randomVectorInUnitSphere(),currentRefractIndex:ray.currentRefractIndex);
        scattered.origin = scattered.origin + scattered.direction * FLT_EPSILON;
        if(dot(scattered.direction, hitRes.normal)>0){
            return (isScatter:true,scatterRay:scattered,attenuation:albedo,isRefracted:false,refractRay:Ray(origin:float3(),direction:float3(),currentRefractIndex:1),RSchlick:0);
        }
        else{
            return (isScatter:false,scatterRay:scattered,attenuation:albedo,isRefracted:false,refractRay:Ray(origin:float3(),direction:float3(),currentRefractIndex:1),RSchlick:0);
        }
    }
}

class Transparent: Material{
    var albedo:float3;
    var refractiveIndex:Float;
    init(palbedo:float3,prefractiveIndex:Float) {
        albedo = palbedo;
        refractiveIndex = prefractiveIndex;
    }
    
    func scatter(ray: Ray, hitRes: HitResult) -> (isScatter:Bool,scatterRay:Ray,attenuation:float3,isRefracted:Bool,refractRay:Ray,RSchlick:Float) {
        let reflectRay = reflect(normalize(ray.direction), n: hitRes.normal);
        var tempEta:Float = refractiveIndex/ray.currentRefractIndex;
        var toAir = false;
        //when light go out from Transparent material
        if(ray.currentRefractIndex == refractiveIndex){
            tempEta = 1/refractiveIndex;
            toAir = true;
        }
        let refractRay = refract(normalize(ray.direction), n: hitRes.normal, eta: tempEta);
        //just reflect
        if(nearlyEqual(value: length(refractRay), compare: 0, tolerance: FLT_EPSILON)){
            var scattered = Ray(origin: hitRes.hitVector, direction: reflectRay, currentRefractIndex:ray.currentRefractIndex);
            scattered.origin = scattered.origin + scattered.direction * FLT_EPSILON;
            if(dot(scattered.direction, hitRes.normal)>0){
                return (isScatter:true,scatterRay:scattered,attenuation:albedo,isRefracted:false,refractRay:Ray(origin:float3(),direction:float3(),currentRefractIndex:1),RSchlick:0);
            }
            else{
                return (isScatter:false,scatterRay:scattered,attenuation:albedo,isRefracted:false,refractRay:Ray(origin:float3(),direction:float3(),currentRefractIndex:1),RSchlick:0);
            }

        }
        //refract case
        else{
            //get RSchlick firstly
            //actually η1,not n
            let n1:Float = ray.currentRefractIndex;
            var n2:Float = refractiveIndex;
            if(toAir){
                n2 = 1;
            }
            let R0:Float = ((n1 - n2)/(n1+n2))*((n1 - n2)/(n1+n2));
            let cosi:Float = -dot(ray.direction, hitRes.normal);
            let cost:Float = -dot(refractRay,hitRes.normal);
            var RSchlick:Float = 0;
            if(n1 <= n2){
                RSchlick = R0 + (1 - R0)*powf((1 - cosi), 5);
            }
            else{
                RSchlick = R0 + (1 - R0)*powf((1 - cost), 5);
            }
            var scattered = Ray(origin: hitRes.hitVector, direction: reflectRay, currentRefractIndex:n1);
            scattered.origin = scattered.origin + scattered.direction * FLT_EPSILON;
            var refracted = Ray(origin: hitRes.hitVector, direction: refractRay, currentRefractIndex:n2);
            refracted.origin = refracted.origin + refracted.direction * FLT_EPSILON;
            return (isScatter:true,scatterRay:scattered,attenuation:albedo,isRefracted:false,refractRay:refracted,RSchlick:RSchlick);
        }
    }
}
