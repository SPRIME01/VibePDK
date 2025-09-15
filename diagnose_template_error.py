#!/usr/bin/env python3
"""
Diagnostic script to identify TemplateSyntaxError sources in cookiecutter templates.
This script will help pinpoint which file contains the malformed Jinja2 syntax.
"""

import os
import re
from pathlib import Path

def find_potential_template_issues(root_dir):
    """Search for files that might contain malformed Jinja2 template syntax"""
    issues = []

    # Patterns that could cause TemplateSyntaxError with pipes
    patterns = [
        r'\{\{.*\|\s*\}\}',  # Pipe followed immediately by closing brace
        r'\{\{.*\|\s*[^a-zA-Z0-9_]',  # Pipe followed by non-alphanumeric
        r'\{\{.*\|\s*$',  # Pipe at end of line within braces
    ]

    for pattern in patterns:
        print(f"Searching for pattern: {pattern}")
        for file_path in Path(root_dir).rglob('*'):
            if file_path.is_file() and should_check_file(file_path):
                try:
                    content = file_path.read_text(encoding='utf-8')
                    if re.search(pattern, content, re.MULTILINE):
                        issues.append({
                            'file': str(file_path),
                            'pattern': pattern,
                            'context': extract_context(content, pattern)
                        })
                except UnicodeDecodeError:
                    continue  # Skip binary files

    return issues

def should_check_file(file_path):
    """Determine if a file should be checked for template issues"""
    excluded_dirs = {'node_modules', '.git', '.venv', '__pycache__'}
    excluded_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot'}

    # Check if file is in excluded directory
    for part in file_path.parts:
        if part in excluded_dirs:
            return False

    # Check if file has excluded extension
    if file_path.suffix.lower() in excluded_extensions:
        return False

    return True

def extract_context(content, pattern, context_lines=3):
    """Extract context around matches for better debugging"""
    matches = []
    for match in re.finditer(pattern, content, re.MULTILINE):
        start_line = max(0, content[:match.start()].count('\n') - context_lines)
        end_line = content[:match.end()].count('\n') + context_lines + 1
        lines = content.split('\n')[start_line:end_line]
        matches.append({
            'match': match.group(),
            'context': '\n'.join(lines),
            'line_number': content[:match.start()].count('\n') + 1
        })
    return matches

def main():
    print("🔍 Diagnosing TemplateSyntaxError sources...")
    print("Root directory: .")

    issues = find_potential_template_issues('.')

    if issues:
        print("\n🚨 POTENTIAL ISSUES FOUND:")
        for issue in issues:
            print(f"\nFile: {issue['file']}")
            print(f"Pattern: {issue['pattern']}")
            for match in issue['context']:
                print(f"Line {match['line_number']}: {match['match']}")
                print(f"Context:\n{match['context']}")
                print("-" * 50)
    else:
        print("\n✅ No obvious template syntax issues found.")
        print("The error might be in a less obvious location or require deeper analysis.")

if __name__ == "__main__":
    main()
