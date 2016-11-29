import Foundation
import simd

protocol Material {
    func scatter(ray:Ray,hitRes:HitResult)->(isScatter:Bool,scatterRay:Ray,attenuation:float3);
}

class Lambertian: Material {
    var albedo:float3
    init(palbedo:float3){
        albedo = palbedo;
    }
    
    func scatter(ray:Ray,hitRes:HitResult)->(isScatter:Bool,scatterRay:Ray,attenuation:float3){
        var scattered = Ray(origin:hitRes.hitVector, direction: normalize(hitRes.normal + randomVectorInUnitSphere()));
        scattered.origin = scattered.origin + scattered.direction * FLT_EPSILON;
//        NSLog(scattered.origin.debugDescription);
//        NSLog(scattered.direction.debugDescription);
//        NSLog(hitRes.normal.debugDescription);
//        NSLog(hitRes.hitVector.debugDescription);
        return (isScatter:true,scatterRay:scattered,attenuation:albedo);
    }
}

class Metal: Material{
    var albedo:float3
    var fuzz: Float
    init(palbedo:float3,pfuzz:Float){
        albedo = palbedo;
        if pfuzz < 1 {
            fuzz = pfuzz
        } else {
            fuzz = 1
        }
    }
    
    func scatter(ray:Ray,hitRes:HitResult)->(isScatter:Bool,scatterRay:Ray,attenuation:float3){
        let reflectRay = reflect(normalize(ray.direction), n: hitRes.normal);
        var scattered = Ray(origin: hitRes.hitVector, direction: reflectRay + fuzz * randomVectorInUnitSphere());
        scattered.origin = scattered.origin + scattered.direction * FLT_EPSILON;
        if(dot(scattered.direction, hitRes.normal)>0){
            return (isScatter:true,scatterRay:scattered,attenuation:albedo);
        }
        else{
            return (isScatter:false,scatterRay:scattered,attenuation:albedo);
        }
    }
}
