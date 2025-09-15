#!/usr/bin/env python3
"""
Debug script to identify which template file is causing the TemplateSyntaxError.
This script will try to parse each template file with Jinja2 to identify the problematic file.
"""

import os
import sys
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, TemplateSyntaxError

def test_template_parsing(template_dir):
    """Try to parse each template file with Jinja2 to identify syntax errors"""
    env = Environment(loader=FileSystemLoader(template_dir))

    print(f"🔍 Testing template parsing for directory: {template_dir}")

    # Get all files in the template directory
    template_files = []
    for file_path in Path(template_dir).rglob('*'):
        if file_path.is_file():
            template_files.append(file_path.relative_to(template_dir))

    print(f"Found {len(template_files)} files to test")

    errors = []
    for template_file in template_files:
        try:
            # Try to parse the template
            template_path = str(template_file)
            print(f"Testing: {template_path}")
            env.get_template(template_path)
            print(f"✅ OK: {template_path}")
        except TemplateSyntaxError as e:
            print(f"❌ ERROR in {template_file}: {e}")
            errors.append({
                'file': str(template_file),
                'error': str(e),
                'lineno': e.lineno
            })
        except Exception as e:
            print(f"⚠️  OTHER ERROR in {template_file}: {e}")
            errors.append({
                'file': str(template_file),
                'error': str(e),
                'lineno': None
            })

    return errors

def main():
    # Test the cookiecutter template directory
    template_dir = "{{cookiecutter.project_slug}}/.github/prompts"

    if not Path(template_dir).exists():
        print(f"Template directory does not exist: {template_dir}")
        sys.exit(1)

    errors = test_template_parsing(template_dir)

    if errors:
        print("\n🚨 TEMPLATE PARSING ERRORS FOUND:")
        for error in errors:
            print(f"\nFile: {error['file']}")
            print(f"Error: {error['error']}")
            if error['lineno']:
                print(f"Line: {error['lineno']}")
        sys.exit(1)
    else:
        print("\n✅ All templates parsed successfully!")
        sys.exit(0)

if __name__ == "__main__":
    main()
