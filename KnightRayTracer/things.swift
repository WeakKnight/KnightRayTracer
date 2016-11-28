import Foundation
import simd

public struct Pixel {
    var r: UInt8
    var g: UInt8
    var b: UInt8
    var a: UInt8
    init(red: UInt8, green: UInt8, blue: UInt8) {
        r = red
        g = green
        b = blue
        a = 255
    }
}

struct Ray {
    var origin: float3
    var direction: float3
}

struct Light {
    var color:float3
    var origin:float3
}

class HitResult{
    var isHit:Bool = false;
    var distance:Float = 0.0;
    var normal:float3 = float3();
    var hitVector:float3 = float3();
    var material:Material = Lambertian(palbedo:float3(x: 0, y: 0.0, z: 0.0));
    init(pisHit:Bool,pdistance:Float,pnormal:float3,phitVector:float3) {
        isHit = pisHit;
        distance = pdistance;
        normal = pnormal;
        hitVector = phitVector;
    }
}

protocol Hitable {
    func hit(ray:Ray)->HitResult
}

class Sphere:Hitable{
    
    var center:float3 = float3(0.0,0.0,0.0)
    var radius:Float = 0.0;
    var material:Material = Lambertian(palbedo:float3(x: 0, y: 0.7, z: 0.3));
    
    init(pcenter:float3, pradius:Float,pmaterial:Material) {
        center = pcenter;
        radius = pradius;
        material = pmaterial;
    }
    
//    func hit(ray:Ray) -> HitResult {
//        let result = HitResult(pisHit:false, pdistance: -1,pnormal: float3(),phitVector: float3());
//        let oc = center - ray.origin;
//        let or = ray.origin + normalize(ray.direction);
//        if(dot(oc,or) < 0){
//            return result;
//        }
//        let od = dot(oc,or)*or;
//        let cd = od - oc;
//        if(length(cd) > radius){
//            return result;
//        }
//        else{
//            let pdLength = sqrt(radius*radius-length_squared(cd));
//            let opLength = length(od) - pdLength;
//            let op = opLength * or;
//            result.isHit = true;
//            result.distance = opLength;
//            result.normal = normalize(op - oc);
//            result.hitVector = op;
//            result.material = material;
//            return result;
//        }
//    }
    func hit(ray:Ray) -> HitResult {
        let result = HitResult(pisHit:false, pdistance: -1,pnormal: float3(),phitVector: float3());
        let oc = ray.origin - center
        let a = dot(ray.direction, ray.direction)
        let b = dot(oc, ray.direction)
        let c = dot(oc, oc) - radius*radius
        let discriminant = b*b - a*c
        if discriminant > 0 {
            var t = (-b - sqrt(discriminant) ) / a
            if t < 0.001 {
                t = (-b + sqrt(discriminant) ) / a
            }
            if 0.001 < t && t < Float.infinity {
                result.distance = t;
                result.hitVector = ray.origin + ray.direction*result.distance; // r.point_at_parameter(rec.t)
                result.normal = (result.hitVector - center) / float3(radius)
                result.material = material;
                result.isHit = true;
                return result;
            }
        }
        result.isHit = false;
        return result;
    }
}

class Box{
    
}

class Mesh{
    
}

struct Camera {
    let bottomLeft, horizontal, vertical, origin, u, v, w: float3
    init(lookFrom: float3, lookAt: float3, vup: float3, vfov: Float, aspect: Float) {
        let theta = vfov * Float(M_PI) / 180
        let half_height = tan(theta / 2)
        let half_width = aspect * half_height
        origin = lookFrom
        w = normalize(lookFrom - lookAt)
        u = normalize(cross(vup, w))
        v = cross(w, u)
        bottomLeft = origin - half_width * u - half_height * v - w
        horizontal = 2 * half_width * u
        vertical = 2 * half_height * v
    }
    func getRay(s: Float, t: Float) -> Ray {
        return Ray(origin: origin, direction: bottomLeft + s * horizontal + t * vertical - origin)
    }
}

class Scene:Hitable{
    var thingList = [Hitable]()
    
    func addThing(thing:Hitable){
        thingList.append(thing);
    }
    
    func hit(ray:Ray) -> HitResult {
        var distance = Float.infinity
        var result = HitResult(pisHit:false, pdistance: -1,pnormal: float3(),phitVector: float3());
        for thing in thingList{
            let thingResult = thing.hit(ray: ray)
            if(thingResult.isHit){
                if(thingResult.distance < distance){
                    distance = thingResult.distance;
                    result = thingResult;
                }
            }
        }
        return result;
    }
    
    func color(ray:Ray,calDepth:Int = 0)->float3{
        let nextDepth = calDepth + 1;
        let hitResult = hit(ray: ray);
        if(hitResult.isHit){
            let scatterResult = hitResult.material.scatter(ray: ray, hitRes: hitResult);
            if(scatterResult.isScatter && calDepth < 70){
                return scatterResult.attenuation * color(ray: scatterResult.scatterRay,calDepth: nextDepth);
            }
            else{
                return float3(0,0,0);
            }
        }
        else{
            let unit_direction = normalize(ray.direction)
            let t = 0.5 * (unit_direction.y + 1)
            return (1.0 - t) * float3(x: 1, y: 1, z: 1) + t * float3(x: 0.5, y: 0.7, z: 1.0)
        }
    }
}
