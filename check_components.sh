#!/bin/bash

# Primitives
primitives=("Badge" "Button" "ButtonSplit" "Checkbox" "ConfirmDialog" "ContextMenu" "ContextRing" "CopyButton" "Dropdown" "FlyoutMenu" "Modal" "Popover" "ProgressiveBlur" "RadioGroup" "ResizeHandle" "SiteIcon" "StatusIndicator")

# Composites
composites=("SettingsPage" "SkillInstaller" "InputChatMini" "SiteItem" "SiteToolbar" "SettingsSection" "ContentSelector" "ScreenLayout" "InputChat" "PanelToolbar" "ChatMessageList" "EmptyState" "ToolCallItem" "GlobalMenu" "SitePageThumb" "PaneGroup" "ChatMessage" "MarkdownText" "TaskRevisions" "TaskBrief")

# Features
features=("SiteNavigation" "SiteOverviewScreen" "SiteTimeline" "SiteMapScreen" "SharingScreen" "SiteSettingsScreen" "SyncScreen" "PersonaChooser" "SiteList" "SiteSkillsModal" "BlueprintPicker" "PullSitePicker" "SiteDetailsForm" "ImportDropZone" "AuthSimulation" "PermissionDialog" "DotGrid" "ProgressCard" "ShareLinkCard" "SharingEmptyState")

# Layouts
layouts=("BackdropPage" "BareLayout" "MainLayout")

# Pages
pages=("AddSitePage" "ArchitecturePage" "Components" "DesignOverviewsPage" "DesignSystem" "DevPage" "JtbdPage" "OnboardingPage" "CompositesPage" "FeaturesPage" "PrimitivesPage")

echo "=== PRIMITIVES ==="
for comp in "${primitives[@]}"; do
  # Check imports and template usage, excluding the component file itself
  count=$(grep -r "import.*$comp\|<$comp\|</$comp" src --include="*.vue" --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "src/components/primitives/$comp.vue" | wc -l)
  if [ $count -eq 0 ]; then
    echo "UNUSED: $comp"
  fi
done

echo -e "\n=== COMPOSITES ==="
for comp in "${composites[@]}"; do
  count=$(grep -r "import.*$comp\|<$comp\|</$comp" src --include="*.vue" --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "src/components/composites/$comp.vue" | wc -l)
  if [ $count -eq 0 ]; then
    echo "UNUSED: $comp"
  fi
done

echo -e "\n=== FEATURES ==="
for comp in "${features[@]}"; do
  count=$(grep -r "import.*$comp\|<$comp\|</$comp" src --include="*.vue" --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "src/components/features" | wc -l)
  if [ $count -eq 0 ]; then
    echo "UNUSED: $comp"
  fi
done

echo -e "\n=== LAYOUTS ==="
for comp in "${layouts[@]}"; do
  count=$(grep -r "import.*$comp\|<$comp\|</$comp" src --include="*.vue" --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "src/layouts/$comp.vue" | wc -l)
  if [ $count -eq 0 ]; then
    echo "UNUSED: $comp"
  fi
done

echo -e "\n=== PAGES ==="
for comp in "${pages[@]}"; do
  count=$(grep -r "import.*$comp\|<$comp\|</$comp" src --include="*.vue" --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "src/pages" | wc -l)
  if [ $count -eq 0 ]; then
    echo "UNUSED: $comp"
  fi
done
