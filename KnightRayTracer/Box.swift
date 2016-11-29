//
//  Box.swift
//  KnightRayTracer
//
//  Created by Knight on 2016/11/29.
//  Copyright © 2016年 Knight. All rights reserved.
//

import Foundation
import simd

class AABBox:Hitable{
    var minPoint:float3;
    var maxPoint:float3;
    var material:Material = Lambertian(palbedo:float3(x: 0, y: 0.7, z: 0.3));
    init(pminVertex:float3,pmaxVertex:float3,pmaterial:Material) {
        minPoint = pminVertex;
        maxPoint = pmaxVertex;
        material = pmaterial;
    }
    
    func hit(ray: Ray) -> HitResult {
        var deltaX:Float = 0;
        var deltaY:Float = 0;
        var deltaZ:Float = 0;
        var targetPoint:float3 = float3();
        let origin = ray.origin;
        let direction = ray.direction;
        var distance = Float.infinity;
        var result = HitResult(pisHit:false, pdistance: -1,pnormal: float3(),phitVector: float3(),pmaterial:material);
        
        //check to minx
        deltaX = minPoint.x - origin.x;
        deltaY = deltaX * (direction.y/direction.x);
        deltaZ = deltaX * (direction.z/direction.x);
        targetPoint = origin + float3(deltaX,deltaY,deltaZ);
        if(targetPoint.y<maxPoint.y && targetPoint.y > minPoint.y && targetPoint.z < maxPoint.z && targetPoint.z > minPoint.z){
            if(length(float3(deltaX,deltaY,deltaZ)) < distance){
                distance = length(float3(deltaX,deltaY,deltaZ));
                result = HitResult(pisHit:true, pdistance: distance, pnormal: float3(1,0,0), phitVector: targetPoint,pmaterial:material);
            }
        }
        //check to maxx
        deltaX = maxPoint.x - origin.x;
        deltaY = deltaX * (direction.y/direction.x);
        deltaZ = deltaX * (direction.z/direction.x);
        targetPoint = origin + float3(deltaX,deltaY,deltaZ);
        if(targetPoint.y<maxPoint.y && targetPoint.y > minPoint.y && targetPoint.z < maxPoint.z && targetPoint.z > minPoint.z){
            if(length(float3(deltaX,deltaY,deltaZ)) < distance){
                distance = length(float3(deltaX,deltaY,deltaZ));
                result = HitResult(pisHit:true, pdistance: distance, pnormal: float3(-1,0,0), phitVector: targetPoint,pmaterial:material);
            }
        }
        //check to miny
        deltaY = minPoint.y - origin.y;
        deltaX = deltaY * (direction.x/direction.y);
        deltaZ = deltaY * (direction.z/direction.y);
        targetPoint = origin + float3(deltaX,deltaY,deltaZ);
        if(targetPoint.x<maxPoint.x && targetPoint.x > minPoint.x && targetPoint.z < maxPoint.z && targetPoint.z > minPoint.z){
            if(length(float3(deltaX,deltaY,deltaZ)) < distance){
                distance = length(float3(deltaX,deltaY,deltaZ));
                result = HitResult(pisHit:true, pdistance: distance, pnormal: float3(0,1,0), phitVector: targetPoint,pmaterial:material);
            }
        }
        //check to maxy
        deltaY = maxPoint.y - origin.y;
        deltaX = deltaY * (direction.x/direction.y);
        deltaZ = deltaY * (direction.z/direction.y);
        targetPoint = origin + float3(deltaX,deltaY,deltaZ);
        if(targetPoint.x<maxPoint.x && targetPoint.x > minPoint.x && targetPoint.z < maxPoint.z && targetPoint.z > minPoint.z){
            if(length(float3(deltaX,deltaY,deltaZ)) < distance){
                distance = length(float3(deltaX,deltaY,deltaZ));
                result = HitResult(pisHit:true, pdistance: distance, pnormal: float3(0,-1,0), phitVector: targetPoint,pmaterial:material);
            }
        }
        //check to minz
        deltaZ = minPoint.z - origin.z;
        deltaX = deltaZ * (direction.x/direction.z);
        deltaY = deltaZ * (direction.y/direction.z);
        targetPoint = origin + float3(deltaX,deltaY,deltaZ);
        if(targetPoint.x<maxPoint.x && targetPoint.x > minPoint.x && targetPoint.y < maxPoint.y && targetPoint.y > minPoint.y){
            if(length(float3(deltaX,deltaY,deltaZ)) < distance){
                distance = length(float3(deltaX,deltaY,deltaZ));
                result = HitResult(pisHit:true, pdistance: distance, pnormal: float3(0,0,-1), phitVector: targetPoint,pmaterial:material);
            }
        }
        //check to maxz
        deltaZ = maxPoint.z - origin.z;
        deltaX = deltaZ * (direction.x/direction.z);
        deltaY = deltaZ * (direction.y/direction.z);
        targetPoint = origin + float3(deltaX,deltaY,deltaZ);
        if(targetPoint.x<maxPoint.x && targetPoint.x > minPoint.x && targetPoint.y < maxPoint.y && targetPoint.y > minPoint.y){
            if(length(float3(deltaX,deltaY,deltaZ)) < distance){
                distance = length(float3(deltaX,deltaY,deltaZ));
                result = HitResult(pisHit:true, pdistance: distance, pnormal: float3(0,0,1), phitVector: targetPoint,pmaterial:material);
            }
        }
        return result;
    }
}
