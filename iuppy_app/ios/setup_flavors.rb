require 'xcodeproj'
require 'fileutils'

# Helper methods to setup flavors in Xcode
# Usage: ruby setup_flavors.rb <client_slug> <dev_bundle_id> <prod_bundle_id> <dev_display_name> <prod_display_name> <dev_scheme> <prod_scheme>

project_path = 'Runner.xcodeproj'
project = Xcodeproj::Project.open(project_path)

if ARGV.length < 7
  puts "Usage: ruby setup_flavors.rb <slug> <dev_id> <prod_id> <dev_name> <prod_name> <dev_scheme> <prod_scheme>"
  exit 1
end

SLUG = ARGV[0]
DEV_ID = ARGV[1]
PROD_ID = ARGV[2]
DEV_NAME = ARGV[3]
PROD_NAME = ARGV[4]
DEV_SCHEME_URL = ARGV[5]
PROD_SCHEME_URL = ARGV[6]

puts "🚀 Setting up iOS flavors for client: #{SLUG}"

# 1. Ensure xcconfig files are linked in the project
group = project.main_group.find_subpath(File.join('Flutter'), true)
group.set_source_tree('<group>')

file_refs = {}
['Debug', 'Release'].each do |mode|
  ['Dev', 'Prod'].each do |env|
    filename = "#{SLUG}#{env}.xcconfig"
    # Add file reference if not exists
    file_ref = group.find_file_by_path(filename) || group.new_reference("Flutter/#{filename}")
    file_refs["#{mode}-#{env}"] = file_ref
  end
end

# 2. Create Build Configurations (Manual Clone)
def create_or_update_config(project, base_config_name, new_config_name, file_ref, bundle_id, display_name, url_scheme, suffix)
  existing = project.build_configurations.find { |c| c.name == new_config_name }
  if existing
    config = existing
  else
    base = project.build_configurations.find { |c| c.name == base_config_name }
    if base.nil? 
        puts "❌ Error: Base config #{base_config_name} not found!"
        return
    end
    config = project.new(Xcodeproj::Project::Object::XCBuildConfiguration)
    config.name = new_config_name
    config.build_settings = base.build_settings.dup
    project.build_configurations << config
  end

  config.base_configuration_reference = file_ref
  settings = config.build_settings
  settings['PRODUCT_BUNDLE_IDENTIFIER'] = bundle_id
  settings['BUNDLE_DISPLAY_NAME'] = display_name
  settings['DEEP_LINK_SCHEME'] = url_scheme
  settings['BUNDLE_SUFFIX'] = suffix
  settings['SWIFT_VERSION'] = '5.0'
  settings['INFOPLIST_FILE'] = 'Runner/Info.plist'
  settings['SWIFT_OBJC_BRIDGING_HEADER'] = '$(PROJECT_DIR)/Runner/Runner-Bridging-Header.h'
  settings['HEADER_SEARCH_PATHS'] = ['$(inherited)']
  settings['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks']
  settings['ASSETCATALOG_COMPILER_APPICON_NAME'] = "AppIcon-#{SLUG}"
  settings['ASSETCATALOG_COMPILER_APPICON_NAME'] = "AppIcon-#{SLUG}"
end

# 2.5 Add "Copy Google Service" Script Phase if not exists
target = project.targets.find { |t| t.name == 'Runner' }
phase_name = 'Copy Google Service'
unless target.shell_script_build_phases.any? { |p| p.name == phase_name }
  puts "📝 Adding '#{phase_name}' build phase..."
  phase = target.new_shell_script_build_phase(phase_name)
  phase.shell_script = '"${PROJECT_DIR}/copy_google_service.sh"'
  # Move phase to be early, e.g., before "Check Pods Manifest" or just ensure it runs.
  # By default it's added at end. It's safer to run it early to ensure resource makes it to bundle.
  # Actually, since it copies to BUILT_PRODUCTS_DIR, it can run anytime.
end

create_or_update_config(project, 'Debug', "Debug-#{SLUG}Dev", file_refs['Debug-Dev'], DEV_ID, DEV_NAME, DEV_SCHEME_URL, ".dev")
create_or_update_config(project, 'Release', "Release-#{SLUG}Dev", file_refs['Release-Dev'], DEV_ID, DEV_NAME, DEV_SCHEME_URL, ".dev")
create_or_update_config(project, 'Debug', "Debug-#{SLUG}Prod", file_refs['Debug-Prod'], PROD_ID, PROD_NAME, PROD_SCHEME_URL, "")
create_or_update_config(project, 'Release', "Release-#{SLUG}Prod", file_refs['Release-Prod'], PROD_ID, PROD_NAME, PROD_SCHEME_URL, "")

puts "✅ Build Configurations updated."
project.save # Save configs before handling schemes in case of references

# 3. Create Schemes (Clone 'Runner')
runner_scheme_path = File.join(project_path, 'xcshareddata/xcschemes/Runner.xcscheme')

if !File.exist?(runner_scheme_path)
    puts "⚠️ Runner scheme not found at #{runner_scheme_path}. Checking userdata..."
    # Fallback to userdata if needed, but usually shared.
    puts "❌ Cannot clone Runner scheme (not found)."
    exit 1
end

def clone_scheme(source_path, new_scheme_name, config_debug, config_release, project_path)
  # Load source scheme
  scheme = Xcodeproj::XCScheme.new(source_path)
  
  # Update configurations
  scheme.launch_action.build_configuration = config_debug
  scheme.test_action.build_configuration = config_debug
  scheme.profile_action.build_configuration = config_release
  scheme.analyze_action.build_configuration = config_debug
  scheme.archive_action.build_configuration = config_release
  
  # Save as new scheme
  scheme.save_as(project_path, new_scheme_name, true)
end

clone_scheme(runner_scheme_path, "#{SLUG}Dev", "Debug-#{SLUG}Dev", "Release-#{SLUG}Dev", project_path)
clone_scheme(runner_scheme_path, "#{SLUG}Prod", "Debug-#{SLUG}Prod", "Release-#{SLUG}Prod", project_path)

puts "✅ Schemes created (cloned from Runner): #{SLUG}Dev, #{SLUG}Prod"
puts "🎉 Project saved!"
