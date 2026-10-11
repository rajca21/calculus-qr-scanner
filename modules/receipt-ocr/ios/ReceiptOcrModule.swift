import ExpoModulesCore
import Foundation
import ImageIO
import Vision

public class ReceiptOcrModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ReceiptOcr")

    AsyncFunction("recognize") { (uri: String) -> [String: Any] in
      guard let url = URL(string: uri), url.isFileURL,
            let source = CGImageSourceCreateWithURL(url as CFURL, nil),
            let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [
              kCGImageSourceCreateThumbnailFromImageAlways: true,
              kCGImageSourceCreateThumbnailWithTransform: true,
              kCGImageSourceThumbnailMaxPixelSize: 4096
            ] as CFDictionary) else {
        throw NSError(domain: "ReceiptOcr", code: 1, userInfo: [NSLocalizedDescriptionKey: "Receipt image could not be opened"])
      }

      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      request.usesLanguageCorrection = false // Preserve identifiers and printed numbers.
      request.automaticallyDetectsLanguage = true
      let supported = try request.supportedRecognitionLanguages()
      let preferred = ["en-US", "sr-Latn", "ru-RU"].filter { supported.contains($0) }
      if !preferred.isEmpty { request.recognitionLanguages = preferred }
      try VNImageRequestHandler(cgImage: image, orientation: .up).perform([request])

      let lines: [[String: Any]] = (request.results ?? []).compactMap { observation in
        guard let candidate = observation.topCandidates(1).first else { return nil }
        let box = observation.boundingBox
        return [
          "text": candidate.string,
          "x": box.minX, "y": 1 - box.maxY,
          "width": box.width, "height": box.height
        ]
      }
      return ["lines": lines]
    }.runOnQueue(.global(qos: .userInitiated))
  }
}
