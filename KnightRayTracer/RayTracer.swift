import CoreImage
import simd
import Cocoa

class RayTracer{
    public func makeTracingResult(width: Int, height: Int, samplerCount:Int = 10, _ progressBar:NSProgressIndicator) -> CGImage {
        //---------------make pixels----------------------//
        var pixel = Pixel(red: 0, green: 0, blue: 0);
        var pixels = [Pixel](repeating: pixel,count: width * height);
        //-------------make scene-------------------------//
        let scene = Scene();
        let ground = Sphere(pcenter: float3(x: 0, y: -1000.2, z: -1), pradius: 1000,pmaterial:Lambertian(palbedo:float3(x: 0.9, y: 0.9, z: 0.9)));
        scene.addThing(thing: ground);
        let sphere1 = Sphere(pcenter: float3(0.3,0.0,-1),pradius: 0.2,pmaterial:Lambertian(palbedo:float3(x: 0, y: 0.7, z: 0.3)));
        scene.addThing(thing: sphere1);
        let sphere2 = Sphere(pcenter: float3(-0.1,0.0,-1),pradius: 0.2,pmaterial:Metal(palbedo:float3(x: 0.8, y: 0.3, z: 0.4),pfuzz:0.1));
        scene.addThing(thing: sphere2);
        //let box1 = Box(pminVertex:float3(-0.4,-0.2,-1),pmaxVertex:float3(-0.3,0,-0.8),pmaterial:Metal(palbedo:float3(x: 0.9, y: 0.4, z: 0.4),pfuzz:0.1));
        let box1 = Box(pminVertex:float3(-0.4,-0.2,-1),pmaxVertex:float3(-0.3,0,-0.8),pmaterial:Metal(palbedo:float3(x: 0.3, y: 0.3, z: 0.6),pfuzz:0.1));
        scene.addThing(thing: box1);
        let sphere3 = Sphere(pcenter: float3(-0.25,-0.1,-0.65),pradius: 0.05,pmaterial:Transparent(prefractiveIndex:1.1));
        scene.addThing(thing: sphere3);
        let sphere4 = Sphere(pcenter: float3(0.1,0.0,-0.65),pradius: 0.08,pmaterial:Transparent(prefractiveIndex:0.97));
        scene.addThing(thing: sphere4);
        //p1: float3(-0.5,0,-1), p2: float3(-0.3,0.2,-0.8), p3: float3(-0.4,0.3,-0.9)
//        let triangle1 = Triangle(p1: float3(-0.4,-0.2,-1), p2: float3(-0.3,0,-0.8), p3: float3(-0.4,0.3,-0.9), pmaterial: Metal(palbedo:float3(x: 0.4, y: 0.3, z: 0.8),pfuzz:0.1));
//        scene.addThing(thing: triangle1);
        //
        //i:x
        //j:y
        //let cam = camera()
        let lookFrom = float3(0, 0, 0);
        let lookAt = float3(0,0,-1);
        let vup = float3(0, -1, 0);
        let cam = Camera(lookFrom: lookFrom, lookAt: lookAt, vup: vup, vfov: 50, aspect: Float(width) / Float(height));
        //
        var pointNum:Int = 0;
        //let total:Int = (width*height);
        for i in 0..<width {
            for j in 0..<height {
                var col = float3()
                for _ in 0..<samplerCount {
                    let u = (Float(i) + Float(drand48()))/Float(width);
                    let v = (Float(j) + Float(drand48()))/Float(height);
                    let r = cam.getRay(s: u, t: v);
                    col += scene.color(ray: r);
                }
                col /= float3(Float(samplerCount));
                pixel = Pixel(red: UInt8(col.x * 255), green: UInt8(col.y * 255), blue: UInt8(col.z * 255));
                pixels[i + j * width] = pixel;
                pointNum += 1;
                DispatchQueue.main.async {
                    //textField.stringValue = String(pointNum)+"/"+String(total);
                    progressBar.increment(by: 1/3200);
                }
            }
        }
        //---------------make image-----------------------//
        let bitsPerComponent = 8;
        let bitsPerPixel = 32;
        let rgbColorSpace = CGColorSpaceCreateDeviceRGB();
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue);
        
        let providerRef = CGDataProvider(data: NSData(bytes: pixels, length: pixels.count * MemoryLayout<Pixel>.size))
        let image = CGImage(width: width, height: height, bitsPerComponent: bitsPerComponent, bitsPerPixel: bitsPerPixel, bytesPerRow: width * MemoryLayout<Pixel>.size, space: rgbColorSpace, bitmapInfo: bitmapInfo, provider: providerRef!, decode: nil, shouldInterpolate: true, intent: CGColorRenderingIntent.defaultIntent);
        return image!;
    }
}
