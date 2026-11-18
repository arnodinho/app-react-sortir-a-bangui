require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'sab-calendar'
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = package['license']
  s.author       = package['author']
  s.homepage     = package['homepage']
  s.platforms    = { :ios => '15.1' }
  s.source       = { :path => '.' }
  s.source_files = 'ios/**/*.{h,m,mm}'
  s.frameworks   = 'EventKit', 'EventKitUI'
  install_modules_dependencies(s)
end
