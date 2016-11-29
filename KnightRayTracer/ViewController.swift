//
//  ViewController.swift
//  KnightRayTracer
//
//  Created by Knight on 2016/11/28.
//  Copyright © 2016年 Knight. All rights reserved.
//

import Cocoa

class ViewController: NSViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        
        DispatchQueue.global(qos: .userInteractive).async {
            print("This is run on the background queue");
            let rayTrecer = RayTracer();
            let cgImage = rayTrecer.makeTracingResult(width: 800, height: 400, samplerCount: 10,textField: self.percentLabel);
            let size:NSSize = NSSize.init(width: 800, height: 400);
            let nsImage:NSImage = NSImage.init(cgImage:cgImage , size: size);
            DispatchQueue.main.async {
                print("This is run on the main queue, after the previous code in outer block");
                self.imageView.image = nsImage;
            }
        }
    }
    
    override func viewDidAppear(){
        super.viewDidAppear();
    }
    
    override var representedObject: Any? {
        didSet {
        }
    }

    @IBOutlet var percentLabel: NSTextField!
    @IBOutlet var imageView: NSImageView!
}

