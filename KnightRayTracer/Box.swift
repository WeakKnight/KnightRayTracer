//
//  Box.swift
//  KnightRayTracer
//
//  Created by Knight on 2016/11/29.
//  Copyright © 2016年 Knight. All rights reserved.
//

import Foundation
import simd

/**
 *                     maxVertex
 *       _______________
 *      /               /
 *     / |             /|
 *    /  |            / |
 *    ----------------  |
 *   |   |           |  |
 *   |   |           |  |
 *   |   |           |  |
 *   |   |           |  |
 *   |   ------------|--
 *   |  /            | /
 *   | /             |/
 *   |/______________/
 *  minVertex
 */
class Box:Hitable{
    var material:Material = Lambertian(palbedo:float3(x: 0, y: 0.7, z: 0.3));
    var bounds = [float3]();
    init(pminVertex:float3,pmaxVertex:float3,pmaterial:Material){
        assert(pmaxVertex.x>pminVertex.x && pmaxVertex.y>pminVertex.y && pmaxVertex.z>pminVertex.z);
        bounds.append(pminVertex);
        bounds.append(pmaxVertex);
        material = pmaterial;
    }
    func normalAt(point:float3)->float3{
        if(nearlyEqual(value: point.x, compare: bounds[0].x, tolerance: 0.0001)){
            return float3(-1,0,0);
        }
        if(nearlyEqual(value: point.x, compare: bounds[1].x, tolerance: 0.0001)){
            return float3(1,0,0);
        }
        if(nearlyEqual(value: point.y, compare: bounds[0].y, tolerance: 0.0001)){
            return float3(0,-1,0);
        }
        if(nearlyEqual(value: point.y, compare: bounds[1].y, tolerance: 0.0001)){
            return float3(0,1,0);
        }
        if(nearlyEqual(value: point.z, compare: bounds[0].z, tolerance: 0.0001)){
            return float3(0,0,-1);
        }
        if(nearlyEqual(value: point.z, compare: bounds[1].z, tolerance: 0.0001)){
            return float3(0,0,1);
        }
        return float3();
    }
    func hit(ray:Ray) -> HitResult{
        var sign = [Int]();
        let invdir:float3 = float3(1/ray.direction.x,1/ray.direction.y,1/ray.direction.z);
        sign.append(Int(NSNumber(value:(invdir.x)<0)));
        sign.append(Int(NSNumber(value:(invdir.y)<0)));
        sign.append(Int(NSNumber(value:(invdir.z)<0)));
        let result = HitResult(pisHit:false, pdistance: -1,pnormal: float3(),phitVector: float3(),pmaterial:material);
        var t:Float = 0;
        var tmin:Float = 0;
        var tmax:Float = 0;
        var tymin:Float = 0;
        var tymax:Float = 0;
        var tzmin:Float = 0;
        var tzmax:Float = 0;
        //
        tmin = (bounds[sign[0]].x - ray.origin.x) * invdir.x;
        tmax = (bounds[1-sign[0]].x - ray.origin.x) * invdir.x;
        tymin = (bounds[sign[1]].y - ray.origin.y) * invdir.y;
        tymax = (bounds[1-sign[1]].y - ray.origin.y) * invdir.y;
        
        if ((tmin > tymax) || (tymin > tmax)){
            return result;
        }
        
        if (tymin > tmin){
            tmin = tymin;
        }
        
        if (tymax < tmax){
            tmax = tymax;
        }
        
        
        tzmin = (bounds[sign[2]].z - ray.origin.z) * invdir.z;
        tzmax = (bounds[1-sign[2]].z - ray.origin.z) * invdir.z;
        
        if ((tmin > tzmax) || (tzmin > tmax)){
            return result;
        }
        
        if (tzmin > tmin){
            tmin = tzmin;
        }
        if (tzmax < tmax){
            tmax = tzmax;
        }
        
        t = tmin;
        
        if (t < 0) {
            t = tmax;
            if (t < 0){
                return result;
            }
        }
        //true
        return HitResult(pisHit:true, pdistance: t,pnormal: normalAt(point: ray.origin + ray.direction*t),phitVector: ray.origin + ray.direction*(t),pmaterial:material);
    }
}
