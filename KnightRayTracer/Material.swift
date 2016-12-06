import Foundation
import simd

protocol Material {
    func scatter(ray:Ray,hitRes:HitResult)->(isScatter:Bool,scatterRay:Ray,attenuation:float3);
}

class Lambertian: Material {
    var albedo:float3;
    init(palbedo:float3){
        albedo = palbedo;
    }
    
    func scatter(ray:Ray,hitRes:HitResult)->(isScatter:Bool,scatterRay:Ray,attenuation:float3){
        var scattered = Ray(origin:hitRes.hitVector, direction: normalize(hitRes.normal + randomVectorInUnitSphere()));
        scattered.origin = scattered.origin + scattered.direction * FLT_EPSILON;
        return (isScatter:true,scatterRay:scattered,attenuation:albedo);
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

class Transparent: Material{
    var refractiveIndex:Float;
    init(prefractiveIndex:Float) {
        refractiveIndex = prefractiveIndex;
    }
    
    func scatter(ray: Ray, hitRes: HitResult) -> (isScatter:Bool,scatterRay:Ray,attenuation:float3) {
        var reflect_prob: Float = 1
        var cosine: Float = 1
        var ni_over_nt: Float = 1
        var outward_normal = float3()
        let reflected = reflect(ray.direction, n: hitRes.normal)
        let attenuation = float3(1, 1, 1);
        var scattered = Ray(origin:float3(),direction:float3());
        if dot(ray.direction, hitRes.normal) > 0 {
            outward_normal = -hitRes.normal
            ni_over_nt = refractiveIndex
            cosine = refractiveIndex * dot(ray.direction, hitRes.normal) / length(ray.direction)
        } else {
            outward_normal = hitRes.normal
            ni_over_nt = 1 / refractiveIndex
            cosine = -dot(ray.direction, hitRes.normal) / length(ray.direction)
        }
        let refracted = refract(v: ray.direction, n: outward_normal, ni_over_nt: ni_over_nt)
        if refracted != nil {
            reflect_prob = schlick(cosine, refractiveIndex)
        } else {
            scattered = Ray(origin: hitRes.hitVector, direction: reflected)
            reflect_prob = 1.0
        }
        if Float(drand48()) < reflect_prob {
            scattered = Ray(origin: hitRes.hitVector + reflected*FLT_EPSILON, direction: reflected);
        } else {
            scattered = Ray(origin: hitRes.hitVector + refracted!*FLT_EPSILON, direction: refracted!);
        }
        return (isScatter:true,scatterRay:scattered,attenuation:attenuation);
    }
}
