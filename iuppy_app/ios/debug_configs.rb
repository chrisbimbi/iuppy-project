require 'xcodeproj'
project = Xcodeproj::Project.open('Runner.xcodeproj')
puts "Build Configurations:"
project.build_configurations.each { |c| puts " - #{c.name}" }
puts "Targets:"
project.targets.each { |t| puts " - #{t.name} (#{t.class})" }
