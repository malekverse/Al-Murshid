Pod::Spec.new do |s|
  s.name           = 'FajrRise'
  s.version        = '1.0.0'
  s.summary        = 'Fajr Rise: the alarm for Fajr (SPEC 5.10)'
  s.description    = 'Bridges the app to its AlarmKit alarms, which live in the app target.'
  s.author         = 'Al-Murshid'
  s.homepage       = 'https://github.com/malekverse/al-murshid'
  s.license        = 'MIT'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '**/*.{h,m,swift}'
end
