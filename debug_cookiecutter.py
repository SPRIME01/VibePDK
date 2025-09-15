#!/usr/bin/env python3
"""
Debug script to replicate cookiecutter template processing and identify the TemplateSyntaxError.
"""

import os
import sys
from pathlib import Path
from cookiecutter.generate import generate_files
from cookiecutter.config import get_user_config
import tempfile
import shutil

def debug_cookiecutter_processing():
    """Try to replicate the cookiecutter processing that's failing"""
    # Create a temporary directory for output
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"🔍 Testing cookiecutter processing with output to: {temp_dir}")

        # Set up context similar to what the test uses
        context = {
            'cookiecutter': {
                'project_slug': 'my-hexagon-app',
                'author_name': 'Test Author',
                'python_version': '3.12',
                'description': 'A test project'
            }
        }

        try:
            # Try to generate files like cookiecutter does
            generate_files(
                repo_dir='.',
                context=context,
                output_dir=temp_dir
            )
            print("✅ Cookiecutter processing completed successfully!")
            return True
        except Exception as e:
            print(f"❌ Cookiecutter processing failed with error: {e}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            print("Full traceback:")
            traceback.print_exc()
            return False

def main():
    print("🔍 Debugging cookiecutter template processing...")

    success = debug_cookiecutter_processing()

    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
