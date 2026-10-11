Pod::Spec.new do |s|
  s.name = 'ReceiptOcr'
  s.version = '1.0.0'
  s.summary = 'On-device receipt text recognition'
  s.description = 'Local Expo module using Apple Vision to recognize receipt text.'
  s.license = { :type => 'Proprietary' }
  s.author = 'Calculus'
  s.homepage = 'https://calculus.rs'
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.source = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Vision', 'ImageIO'
  s.source_files = '**/*.swift'
end
