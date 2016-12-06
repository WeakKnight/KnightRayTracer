//
//  Scene.swift
//  KnightRayTracer
//
//  Created by Knight on 2016/11/29.
//  Copyright © 2016年 Knight. All rights reserved.
//

import Foundation
import simd

class Scene:Hitable{
    var thingList = [Hitable]();
    
    func addThing(thing:Hitable){
        thingList.append(thing);
    }
    
    func hit(ray:Ray) -> HitResult {
        var distance = Float.infinity
        var result = HitResult(pisHit:false, pdistance: -1,pnormal: float3(),phitVector: float3(),pmaterial:Lambertian(palbedo:float3(x: 0, y: 0.7, z: 0.3)));
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
            if(scatterResult.isScatter && calDepth < 50){
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
