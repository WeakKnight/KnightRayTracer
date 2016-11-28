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
        let scattered = Ray(origin: ray.origin + hitRes.hitVector, direction: hitRes.normal + random_in_unit_sphere());
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
        let scattered = Ray(origin: ray.origin + hitRes.hitVector, direction: reflectRay + fuzz * random_in_unit_sphere());
        if(dot(scattered.direction, hitRes.normal)>0){
            return (isScatter:true,scatterRay:scattered,attenuation:albedo);
        }
        else{
            return (isScatter:false,scatterRay:scattered,attenuation:albedo);
        }
//        let reflected = reflect(normalize(ray_in.direction), n: rec.normal)
//        scattered = ray(origin: rec.p, direction: reflected + fuzz * random_in_unit_sphere())
    }
}
