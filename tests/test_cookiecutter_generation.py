from __future__ import annotations

import logging
import subprocess
from pathlib import Path
from typing import Dict, Optional, Protocol

import pytest


class BakeResult(Protocol):
    """
    Protocol describing the minimal shape of the cookies.bake() result
    used in these tests.
    """

    exit_code: int
    exception: Optional[BaseException]
    project_path: Path


class CookiesFixture(Protocol):
    """Protocol describing the cookies fixture used by pytest-cookies."""

    def bake(self, extra_context: Optional[Dict[str, str]] = ...) -> BakeResult: ...


def test_bake_project_with_defaults(cookies: CookiesFixture) -> None:
    """
    Test that the project can be baked with default values.
    """
    result: BakeResult = cookies.bake()

    assert result.exit_code == 0
    assert result.exception is None
    assert result.project_path.name == "my-hexagon-app"
    assert result.project_path.is_dir()

    # Check for some key files
    assert (result.project_path / "package.json").is_file()
    assert (result.project_path / "docs/README.md").is_file()
    assert (result.project_path / "techstack.yaml").is_file()


def test_bake_project_with_custom_context(cookies: CookiesFixture) -> None:
    """
    Test that the project can be baked with custom context.
    """
    context: Dict[str, str] = {
        "project_slug": "my-awesome-project",
        "author_name": "Test Author",
        "python_version": "3.12",
        "description": "A truly awesome project.",
    }
    result: BakeResult = cookies.bake(extra_context=context)

    assert result.exit_code == 0
    assert result.exception is None
    assert result.project_path.name == "my-awesome-project"
    assert result.project_path.is_dir()

    # The description is not used in any generated file, so we don't check for it.


@pytest.mark.parametrize(
    "slug,is_valid",
    [
        ("invalid slug", False),
        ("Invalid-Slug", False),
        ("good-slug", True),
    ],
)
def test_pre_generation_hook_validation(
    cookies: CookiesFixture, slug: str, is_valid: bool
) -> None:
    """
    Test the pre-generation hook validation logic.
    """
    if is_valid:
        result: BakeResult = cookies.bake(extra_context={"project_slug": slug})
        assert result.exit_code == 0
    else:
        result: BakeResult = cookies.bake(extra_context={"project_slug": slug})
        assert result.exit_code != 0
        # runtime-safe check: ensure an exception was raised and it is the hook failure type
        assert result.exception is not None
        assert result.exception.__class__.__name__ == "FailedHookException"


def test_generated_project_installs_and_tests_pass(cookies: CookiesFixture) -> None:
    """
    Generate the project and run its own test suite.
    This is a critical integration test.
    """
    result: BakeResult = cookies.bake()
    assert result.exit_code == 0
    project_path: Path = result.project_path

    # The generated project uses pnpm, so we need to install dependencies.
    # We also need to enable corepack first.
    # Logger is module-level for use in except blocks
    logger: logging.Logger = logging.getLogger(__name__)

    try:
        # Enable corepack to use pnpm
        subprocess.run(
            ["corepack", "enable"],
            check=True,
            capture_output=True,
            text=True,
        )
        # Install dependencies
        subprocess.run(
            ["pnpm", "install"],
            cwd=project_path,
            check=True,
            capture_output=True,
            text=True,
        )
        # Run the node tests
        test_result: subprocess.CompletedProcess[str] = subprocess.run(
            ["pnpm", "test:node"],
            cwd=project_path,
            check=True,
            capture_output=True,
            text=True,
        )
        # Ensure a logger is available for test output
        logger = logging.getLogger(__name__)
        logger.info("pnpm test:node stdout:")
        logger.info(test_result.stdout)
        logger.info("pnpm test:node stderr:")
        logger.info(test_result.stderr)

    except FileNotFoundError as fnf_error:
        # Command missing (e.g., corepack or pnpm not installed / not on PATH)
        pytest.fail(
            f"Command not found: {fnf_error}. Is pnpm installed and in the PATH?"
        )
    except subprocess.CalledProcessError as cpe:
        # Subprocess failed (non-zero exit) — log outputs and fail the test
        logger.error("STDOUT: %s", cpe.stdout)
        logger.error("STDERR: %s", cpe.stderr)
        pytest.fail(
            f"Command '{' '.join(cpe.cmd)}' failed with exit code {cpe.returncode}"
        )


def test_templates_exist(cookies: CookiesFixture) -> None:
    """
    Test that all required spec/plan/tasks template files exist in the generated project.
    This test verifies Cycle 4 requirements for the speckit-feature-adoption-plan.
    """
    result: BakeResult = cookies.bake()
    assert result.exit_code == 0
    assert result.exception is None

    project_path: Path = result.project_path
    prompts_dir: Path = project_path / ".github" / "prompts"

    # List of required template files for Cycle 4
    required_files = [
        "spec.feature.template.md",
        "spec.plan.adr.prompt.md",
        "spec.plan.prd.prompt.md",
        "spec.plan.sds.prompt.md",
        "spec.plan.ts.prompt.md",
        "spec.plan.task.prompt.md",
        "spec.tasks.template.md"
    ]

    missing_files = []
    for filename in required_files:
        file_path = prompts_dir / filename
        if not file_path.is_file():
            missing_files.append(filename)

    if missing_files:
        pytest.fail(
            f"Missing required template files in {prompts_dir}: {', '.join(missing_files)}. "
            f"These files are required for Cycle 4 of the speckit-feature-adoption-plan."
        )
