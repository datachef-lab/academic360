#!/bin/bash

# Script to build Android app with correct Java version
# This script ensures Java 17 is used for Gradle builds

set -e

echo "🔍 Checking Java installation..."

# Function to find Java 17
find_java17() {
  # Check common Homebrew locations
  if [ -d "/usr/local/opt/openjdk@17" ]; then
    echo "/usr/local/opt/openjdk@17"
    return 0
  fi
  
  if [ -d "/opt/homebrew/opt/openjdk@17" ]; then
    echo "/opt/homebrew/opt/openjdk@17"
    return 0
  fi
  
  # Check if java_home can find it
  if command -v /usr/libexec/java_home &> /dev/null; then
    JAVA17_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null || echo "")
    if [ -n "$JAVA17_HOME" ]; then
      echo "$JAVA17_HOME"
      return 0
    fi
  fi
  
  return 1
}

# Try to find Java 17
JAVA17_PATH=$(find_java17)

if [ -z "$JAVA17_PATH" ]; then
  echo "❌ Java 17 not found!"
  echo ""
  echo "📦 To install Java 17, run:"
  echo "   brew install openjdk@17"
  echo ""
  echo "Then link it:"
  echo "   sudo ln -sfn /usr/local/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk"
  echo ""
  echo "Or if using Homebrew on Apple Silicon:"
  echo "   sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk"
  echo ""
  exit 1
fi

# Set JAVA_HOME
export JAVA_HOME="$JAVA17_PATH"
export PATH="$JAVA_HOME/bin:$PATH"

echo "✅ Using Java 17 from: $JAVA_HOME"
java -version

echo ""
echo "🚀 Starting EAS build..."
echo ""

# Get the profile from command line argument or default to development
PROFILE="${1:-development}"

# Run the EAS build
cd "$(dirname "$0")/.."
eas build --platform android --profile "$PROFILE" --local
