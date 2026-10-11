package expo.modules.receiptocr

import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ReceiptOcrModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ReceiptOcr")

    AsyncFunction("recognize") { uriString: String, promise: Promise ->
      val context = appContext.reactContext
      val uri = Uri.parse(uriString)
      if (context == null || (uri.scheme != "file" && uri.scheme != "content")) {
        promise.reject("ERR_OCR_IMAGE", "A local receipt image is required", null)
        return@AsyncFunction
      }
      try {
        // ML Kit reads the image's EXIF orientation for camera/gallery captures.
        val image = InputImage.fromFilePath(context, uri)
        val rotated = image.rotationDegrees == 90 || image.rotationDegrees == 270
        val width = (if (rotated) image.height else image.width).toDouble().coerceAtLeast(1.0)
        val height = (if (rotated) image.width else image.height).toDouble().coerceAtLeast(1.0)
        val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
        recognizer.process(image)
          .addOnSuccessListener { text ->
            val lines = text.textBlocks.flatMap { it.lines }.map { line ->
              val box = line.boundingBox
              mapOf(
                "text" to line.text,
                "x" to ((box?.left ?: 0) / width),
                "y" to ((box?.top ?: 0) / height),
                "width" to ((box?.width() ?: 0) / width),
                "height" to ((box?.height() ?: 0) / height)
              )
            }
            promise.resolve(mapOf("lines" to lines))
          }
          .addOnFailureListener { promise.reject("ERR_OCR_RECOGNITION", "Receipt text could not be recognized", it) }
          .addOnCompleteListener { recognizer.close() }
      } catch (error: Exception) {
        promise.reject("ERR_OCR_IMAGE", "Receipt image could not be opened", error)
      }
    }
  }
}
