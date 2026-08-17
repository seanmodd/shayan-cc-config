// verify-qr.swift — decode a QR code from a PNG using Apple's Vision framework.
// Usage: swift tools/verify-qr.swift <png>
// Prints the decoded payload string, or exits 1 with "NO QR FOUND".

import Foundation
import CoreImage
import Vision

guard CommandLine.arguments.count == 2 else {
    FileHandle.standardError.write(Data("usage: swift verify-qr.swift <png>\n".utf8))
    exit(2)
}

let url = URL(fileURLWithPath: CommandLine.arguments[1])
guard let image = CIImage(contentsOf: url) else {
    print("NO QR FOUND")
    exit(1)
}

let request = VNDetectBarcodesRequest()
request.symbologies = [.qr]

do {
    try VNImageRequestHandler(ciImage: image, options: [:]).perform([request])
} catch {
    print("NO QR FOUND")
    exit(1)
}

for observation in request.results ?? [] {
    if let payload = observation.payloadStringValue {
        print(payload)
        exit(0)
    }
}

print("NO QR FOUND")
exit(1)
